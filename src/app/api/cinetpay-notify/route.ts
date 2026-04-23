import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function findTransactionWithRetry(reference: string, maxRetries = 5, baseDelayMs = 1000) {
  const include = {
    items: { include: { participant: true } },
    event: true,
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const tx = await prisma.transaction.findUnique({
      where: { reference },
      include,
    });

    if (tx) {
      console.log(`✅ Transaction trouvée à la tentative ${attempt}`);
      return tx;
    }

    if (attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`⏳ Transaction non trouvée (tentative ${attempt}/${maxRetries}), retry dans ${delay}ms...`);
      await sleep(delay);
    }
  }

  return null;
}

async function verifyWithCinetPay(transactionId: string): Promise<string | null> {
  try {
    const res = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY,
        site_id: process.env.CINETPAY_SITE_ID,
        transaction_id: transactionId,
      }),
    });

    const data = await res.json();
    console.log("🔍 Vérification CinetPay:", JSON.stringify(data));
    return data.data?.status ?? null;
  } catch (err) {
    console.error("❌ Erreur vérification CinetPay:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📨 Webhook CinetPay reçu:", JSON.stringify(body));

    // CinetPay envoie cpm_trans_id = notre transaction_id = notre référence
    const reference = body.cpm_trans_id ?? body.transaction_id ?? "";

    if (!reference) {
      console.error("❌ Webhook invalide - pas de cpm_trans_id");
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    // Vérifier le paiement directement auprès de CinetPay (ne pas faire confiance au webhook seul)
    const paymentStatus = await verifyWithCinetPay(reference);

    const dbTransaction = await findTransactionWithRetry(reference);

    if (!dbTransaction) {
      console.error(`❌ Transaction ref=${reference} introuvable après plusieurs tentatives.`);
      return NextResponse.json({ received: true, warning: "Transaction not found" });
    }

    const isApproved = paymentStatus === "ACCEPTED";
    const isFailed = paymentStatus === "REFUSED" || paymentStatus === "CANCELLED";

    if (isApproved) {
      const claimed = await prisma.transaction.updateMany({
        where: { id: dbTransaction.id, status: "PENDING" },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
          paymentMethod: "MOBILE_MONEY",
        },
      });

      if (claimed.count === 0) {
        console.log(`ℹ️ Transaction ${reference} déjà traitée, ignorée`);
        return NextResponse.json({ received: true });
      }

      console.log(`✅ Paiement approuvé pour ${reference}`);

      for (const item of dbTransaction.items) {
        await prisma.participant.update({
          where: { id: item.participantId },
          data: { totalVotes: { increment: item.numberOfVotes } },
        });
        console.log(`🎉 +${item.numberOfVotes} votes pour ${item.participant.name}`);
      }

      const participantsList = dbTransaction.items
        .map((i: any) => `👤 <b>Candidat :</b> ${i.participant.name} (+${i.numberOfVotes} votes)`)
        .join("\n");

      const message = `
<b>🚀 Nouveau Paiement Réussi !</b>
━━━━━━━━━━━━━━━━━━
${participantsList}
💰 <b>Montant :</b> ${dbTransaction.amount.toLocaleString()} FCFA
📑 <b>Réf :</b> <code>${reference}</code>
💳 <b>Via :</b> CinetPay
━━━━━━━━━━━━━━━━━━
<i>Les votes ont été automatiquement ajoutés.</i>
      `;
      await sendTelegramNotification(message.trim());

    } else if (isFailed) {
      console.log(`❌ Paiement ${paymentStatus} pour ${reference}`);
      await prisma.transaction.updateMany({
        where: { id: dbTransaction.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    } else {
      console.log(`⏳ Statut inconnu ou en attente: ${paymentStatus} pour ${reference}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("💥 ERREUR WEBHOOK CINETPAY:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
