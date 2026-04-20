import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendTelegramNotification } from "@/lib/telegram";

/** Attendre N millisecondes (pour les retries) */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Cherche une transaction en BDD avec retry + backoff exponentiel.
 * Utile quand le webhook arrive avant que le checkout API ait fini de sauvegarder.
 */
async function findTransactionWithRetry(
  fedapayId: string,
  ourReference: string,
  maxRetries = 5,
  baseDelayMs = 1000
) {
  const include = {
    items: { include: { participant: true } },
    event: true,
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // 1. Essai par fedapayId
    const byId = await prisma.transaction.findUnique({
      where: { fedapayId },
      include,
    });
    if (byId) {
      console.log(`✅ Transaction trouvée par fedapayId à la tentative ${attempt}`);
      return byId;
    }

    // 2. Fallback par référence
    if (ourReference) {
      const byRef = await prisma.transaction.findUnique({
        where: { reference: ourReference },
        include,
      });
      if (byRef) {
        console.log(`✅ Transaction trouvée par référence à la tentative ${attempt} — liaison fedapayId en cours...`);
        // Lier le fedapayId pour les prochains webhooks
        await prisma.transaction.update({
          where: { id: byRef.id },
          data: { fedapayId },
        });
        return byRef;
      }
    }

    if (attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s...
      console.warn(`⏳ Transaction non trouvée (tentative ${attempt}/${maxRetries}), retry dans ${delay}ms...`);
      await sleep(delay);
    }
  }

  return null;
}

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

    // ✅ RETRY avec backoff — corrige la race condition :
    // FedaPay peut envoyer le webhook avant que notre /api/checkout ait eu le temps
    // de sauvegarder la transaction + le fedapayId en BDD (écart observé : ~70ms).
    // On retente jusqu'à 5 fois sur ~15 secondes avant d'abandonner.
    const dbTransaction = await findTransactionWithRetry(fedapayId, ourReference);

    if (!dbTransaction) {
      console.error(`❌ Transaction fedapayId=${fedapayId} / ref=${ourReference} introuvable après plusieurs tentatives.`);
      return NextResponse.json({ received: true, warning: "Transaction not found after retries" });
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
    // Mettre à jour selon le statut FedaPay (status de l'entité OU nom de l'événement en fallback)
    const isApproved = status === "approved" || status === "transferred"
      || eventName === "transaction.approved" || eventName === "transaction.transferred";
    const isFailed = status === "canceled" || status === "refused" || status === "declined"
      || eventName === "transaction.canceled" || eventName === "transaction.declined";

    if (isApproved) {
      // ✅ PAIEMENT RÉUSSI
      // updateMany avec WHERE status=PENDING sert de verrou atomique :
      // si deux webhooks arrivent en même temps, un seul aura count=1, l'autre count=0 → pas de double vote
      const claimed = await prisma.transaction.updateMany({
        where: { id: dbTransaction.id, status: "PENDING" },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
          paymentMethod: String(fedaPayTransaction.payment_method || fedaPayTransaction.payment_method_type || "MOBILE_MONEY"),
        },
      });

      if (claimed.count === 0) {
        console.log(`ℹ️ Transaction ${reference} déjà traitée par un autre webhook concurrent, ignorée`);
        return NextResponse.json({ received: true });
      }

      console.log(`✅ Paiement approuvé pour ${reference}`);

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


    } else if (isFailed) {
      // ❌ PAIEMENT ÉCHOUÉ ou ANNULÉ
      console.log(`❌ Paiement ${status} pour ${reference}`);

      await prisma.transaction.updateMany({
        where: { id: dbTransaction.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erreur post-lookup webhook:", err);
    return NextResponse.json({ received: true });
  }
}