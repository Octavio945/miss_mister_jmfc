import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendTelegramNotification } from "@/lib/telegram";

// ✅ Vérification de signature HMAC-SHA256 FedaPay
function verifyFedaPaySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}


export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-fedapay-signature") ?? "";
    const secret = process.env.FEDAPAY_SECRET_KEY ?? "";

    // 🔐 Vérifier la signature (skip en développement si pas de signature)
    if (signature && process.env.NODE_ENV === "production") {
      const isValid = verifyFedaPaySignature(rawBody, signature, secret);
      if (!isValid) {
        console.error("❌ Signature webhook invalide - requête rejetée");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      console.log("✅ Signature webhook vérifiée");
    } else {
      console.log("⚠️ Mode développement - signature ignorée");
    }

    const body = JSON.parse(rawBody);
    console.log("📨 Webhook reçu de FedaPay:", JSON.stringify(body, null, 2));

    // ✅ FedaPay envoie le payload sous 'entity' (pas 'transaction')
    // Format: { name: "transaction.approved", object: "transaction", entity: { ... } }
    const fedaPayTransaction = body.entity || body.transaction || body.data?.transaction;

    if (!fedaPayTransaction) {
      console.error("❌ Webhook invalide - structure inconnue:", Object.keys(body));
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    // Le statut vient de l'événement name (ex: "transaction.approved")
    // OU du champ status de l'entité
    const eventName = body.name || ""; // ex: "transaction.approved", "transaction.canceled"
    const status = fedaPayTransaction.status; // "approved", "pending", "canceled"
    
    // ✅ UTILISER L'ID FEDAPAY POUR LA RECHERCHE (PLUS ROBUSTE)
    const fedapayId = String(fedaPayTransaction.id || "");
    const ourReference = fedaPayTransaction.reference ?? "";

    console.log(`🔍 Webhook event: ${eventName} | FedaID: ${fedapayId} | ref: ${ourReference} | status: ${status}`);

    if (!fedapayId) {
      console.error("❌ Webhook invalide - pas d'ID FedaPay");
      return NextResponse.json({ error: "Invalid webhook - no ID" }, { status: 400 });
    }

    // Chercher la transaction dans notre BDD par fedapayId
    const dbTransaction = await prisma.transaction.findUnique({
      where: { fedapayId: fedapayId },
      include: {
        items: {
          include: {
            participant: true,
          },
        },
        event: true,
      },
    });

    if (!dbTransaction) {
      console.error(`❌ Transaction avec fedapayId ${fedapayId} non trouvée en BDD. Tentative par référence...`);
      
      // Fallback par référence au cas où
      const backupTransaction = await prisma.transaction.findUnique({
        where: { reference: ourReference },
        include: {
          items: {
            include: {
              participant: true,
            },
          },
          event: true,
        },
      });

      if (!backupTransaction) {
        console.error(`❌ Transaction ${ourReference} non trouvée non plus.`);
        return NextResponse.json({ received: true, warning: "Transaction not found" });
      }

      // Utiliser la transaction trouvée par référence
      await prisma.transaction.update({
        where: { id: backupTransaction.id },
        data: { fedapayId: fedapayId }
      });
      
      console.log(`✅ Transaction retrouvée par référence et mise à jour avec fedapayId ${fedapayId}`);
      // On continue avec la transaction de backup
      // (On triche un peu pour simplifier le flux ci-dessous)
      return processWebhook(backupTransaction, fedaPayTransaction, status);
    }

    return processWebhook(dbTransaction, fedaPayTransaction, status);
  } catch (error) {
    console.error("💥 ERREUR WEBHOOK:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// ✅ Fonction isolée pour traiter le webhook après avoir trouvé la transaction
async function processWebhook(dbTransaction: any, fedaPayTransaction: any, status: string) {
  const reference = dbTransaction.reference;
  
  try {
    // Éviter les doubles traitements
    if (dbTransaction.status === "SUCCESS") {
      console.log(`ℹ️ Transaction ${reference} déjà traitée (SUCCESS), ignorée`);
      return NextResponse.json({ received: true });
    }

    if (dbTransaction.status === "FAILED") {
      console.log(`ℹ️ Transaction ${reference} déjà marquée FAILED, ignorée`);
      return NextResponse.json({ received: true });
    }

    // Mettre à jour selon le statut FedaPay
    if (status === "approved" || status === "transferred") {
      // ✅ PAIEMENT RÉUSSI
      console.log(`✅ Paiement approuvé pour ${reference}`);

      // Mettre à jour la transaction
      await prisma.transaction.update({
        where: { id: dbTransaction.id },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
          paymentMethod: String(fedaPayTransaction.payment_method || fedaPayTransaction.payment_method_type || "MOBILE_MONEY"),
        },
      });

      // Ajouter les votes à chaque participant concerné
      for (const item of dbTransaction.items) {
        await prisma.participant.update({
          where: { id: item.participantId },
          data: {
            totalVotes: {
              increment: item.numberOfVotes,
            },
          },
        });
        console.log(`🎉 +${item.numberOfVotes} votes pour participant ${item.participant.name}`);
      }

      // Préparer le message Telegram
      const participantsList = dbTransaction.items
        .map((i: any) => `👤 <b>Candidat :</b> ${i.participant.name} (+${i.numberOfVotes} votes)`)
        .join("\n");

      const message = `
<b>🚀 Nouveau Paiement Réussi !</b>
━━━━━━━━━━━━━━━━━━
${participantsList}
💰 <b>Montant :</b> ${dbTransaction.amount.toLocaleString()} FCFA
📑 <b>Réf :</b> <code>${reference}</code>
━━━━━━━━━━━━━━━━━━
<i>Les votes ont été automatiquement ajoutés.</i>
      `;
      await sendTelegramNotification(message.trim());
      
    } else if (status === "canceled" || status === "refused" || status === "declined") {
      // ❌ PAIEMENT ÉCHOUÉ ou ANNULÉ
      console.log(`❌ Paiement ${status} pour ${reference}`);

      await prisma.transaction.update({
        where: { id: dbTransaction.id },
        data: {
          status: "FAILED",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erreur post-lookup webhook:", err);
    return NextResponse.json({ received: true });
  }
}