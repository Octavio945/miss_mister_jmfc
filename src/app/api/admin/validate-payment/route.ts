import { prisma } from "@/lib/prisma";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  if (!(await requireAdminAuth())) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: "ID de transaction manquant." }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: { include: { participant: true } },
        voter: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        { error: "Seules les transactions en attente peuvent être validées." },
        { status: 400 }
      );
    }

    // Validation atomique : statut + votes
    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "SUCCESS", paidAt: new Date(), paymentMethod: "MOBILE_MONEY" },
      });

      for (const item of transaction.items) {
        await tx.participant.update({
          where: { id: item.participantId },
          data: { totalVotes: { increment: item.numberOfVotes } },
        });
      }
    });

    // Notification Telegram — confirmation de validation
    const firstItem = transaction.items[0];
    const candidatName = firstItem?.participant?.name ?? "Inconnu";
    const nbVotes = firstItem?.numberOfVotes ?? 0;

    const reseauLabel =
      transaction.network === "MTN" ? "🟡 MTN Bénin"
      : transaction.network === "CELTIS" ? "🔵 Celtis Bénin"
      : transaction.network ?? "Inconnu";

    let votantInfo = "Anonyme";
    if (transaction.voter && !transaction.voter.isAnonymous) {
      const parts = [transaction.voter.name, transaction.voter.phone, transaction.voter.email].filter(Boolean);
      if (parts.length > 0) votantInfo = parts.join(" / ");
    } else if (transaction.voter?.isAnonymous) {
      votantInfo = `Anonyme (${transaction.voter.anonCode ?? ""})`;
    }

    const message = [
      `✅ <b>Paiement validé avec succès !</b>`,
      ``,
      `🏆 <b>Candidat :</b> ${candidatName} (+${nbVotes} vote${nbVotes > 1 ? "s" : ""})`,
      `💰 <b>Montant :</b> ${transaction.amount.toLocaleString("fr-FR")} FCFA`,
      `📱 <b>Réseau :</b> ${reseauLabel}`,
      `👤 <b>Votant :</b> ${votantInfo}`,
      `📋 <b>Réf :</b> <code>${transaction.reference}</code>`,
      ``,
      `<i>Les votes ont été ajoutés automatiquement au classement.</i>`,
    ].join("\n");

    await sendTelegramNotification(message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/validate-payment]", error);
    return NextResponse.json({ error: "Une erreur est survenue lors de la validation." }, { status: 500 });
  }
}
