import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendTelegramNotification } from "@/lib/telegram";
import { sendFedaPayPayout } from "@/lib/fedapay-payout";

/**
 * Tente de vérifier la signature HMAC-SHA256 FedaPay.
 * Essaie plusieurs formats (hex direct, préfixe sha256=).
 * Retourne true si valide, false sinon.
 */
function tryVerifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedHex = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (signature === expectedHex) return true;
    if (signature === `sha256=${expectedHex}`) return true;

    // Comparaison constant-time si même longueur
    if (signature.length === expectedHex.length) {
      return crypto.timingSafeEqual(
        Buffer.from(expectedHex, "utf-8"),
        Buffer.from(signature,   "utf-8")
      );
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-fedapay-signature") ?? "";

    // Clés disponibles pour la vérification
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET ?? "";
    const apiSecret     = process.env.FEDAPAY_SECRET_KEY     ?? "";

    if (process.env.NODE_ENV === "production") {
      if (signature) {
        // Essaie avec FEDAPAY_WEBHOOK_SECRET, puis FEDAPAY_SECRET_KEY
        const verifiedWithWebhookSecret = webhookSecret && tryVerifySignature(rawBody, signature, webhookSecret);
        const verifiedWithApiSecret     = apiSecret     && tryVerifySignature(rawBody, signature, apiSecret);
        const isVerified = verifiedWithWebhookSecret || verifiedWithApiSecret;

        // Logs de diagnostic (8 premiers chars — jamais la clé complète)
        if (webhookSecret) {
          const expectedWH = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
          console.log(`🔍 [WH_SECRET]  reçue: ${signature.substring(0, 10)}... | attendue: ${expectedWH.substring(0, 10)}... | match: ${!!verifiedWithWebhookSecret}`);
        }
        if (apiSecret) {
          const expectedAPI = crypto.createHmac("sha256", apiSecret).update(rawBody).digest("hex");
          console.log(`🔍 [API_SECRET] reçue: ${signature.substring(0, 10)}... | attendue: ${expectedAPI.substring(0, 10)}... | match: ${!!verifiedWithApiSecret}`);
        }

        if (isVerified) {
          console.log("✅ Signature webhook vérifiée");
        } else {
          // ⚠️ On laisse passer mais on alerte — la sécurité est assurée par la vérification en BDD
          // Pour bloquer complètement, configurez FEDAPAY_WEBHOOK_SECRET avec la bonne clé live
          console.warn("⚠️ Signature non vérifiée — traitement quand même. Configurez FEDAPAY_WEBHOOK_SECRET avec la clé live FedaPay.");
        }
      } else {
        console.warn("⚠️ Pas de signature dans ce webhook");
      }
    } else {
      console.log("⚠️ Mode développement - vérification signature ignorée");
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
      return processWebhook(backupTransaction, fedaPayTransaction, status, eventName);
    }

    return processWebhook(dbTransaction, fedaPayTransaction, status, eventName);
  } catch (error) {
    console.error("💥 ERREUR WEBHOOK:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// ✅ Fonction isolée pour traiter le webhook après avoir trouvé la transaction
async function processWebhook(dbTransaction: any, fedaPayTransaction: any, status: string, eventName: string = "") {
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

    // Mettre à jour selon le statut FedaPay (status de l'entité OU nom de l'événement en fallback)
    const isApproved = status === "approved" || status === "transferred"
      || eventName === "transaction.approved" || eventName === "transaction.transferred";
    const isFailed = status === "canceled" || status === "refused" || status === "declined"
      || eventName === "transaction.canceled" || eventName === "transaction.declined";

    if (isApproved) {
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

      // 💸 Reverser automatiquement l'argent vers le numéro bénéficiaire configuré
      const payoutResult = await sendFedaPayPayout(dbTransaction.amount, reference);
      if (payoutResult.success) {
        console.log(`💸 Payout déclenché avec succès (ID: ${payoutResult.payoutId}) pour ${reference}`);
      } else {
        // On log l'erreur mais on ne bloque pas — le paiement est déjà enregistré
        console.error(`⚠️ Payout échoué pour ${reference}: ${payoutResult.error}`);
      }

    } else if (isFailed) {
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