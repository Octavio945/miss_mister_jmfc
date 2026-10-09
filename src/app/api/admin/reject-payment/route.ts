import { prisma } from "@/lib/prisma";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";

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
        { error: "Seules les transactions en attente peuvent être rejetées." },
        { status: 400 }
      );
    }

    // WHERE status=PENDING : empêche de rejeter une transaction validée entre-temps
    const rejected = await prisma.transaction.updateMany({
      where: { id: transactionId, status: "PENDING" },
      data: { status: "FAILED" },
    });

    if (rejected.count === 0) {
      return NextResponse.json(
        { error: "Cette transaction a déjà été traitée." },
        { status: 409 }
      );
    }

    // Notification Telegram — rejet
    const firstItem = transaction.items[0];
    const candidatName = escapeHtml(firstItem?.participant?.name ?? "Inconnu");
    const nbVotes = firstItem?.numberOfVotes ?? 0;

    const reseauLabel =
      transaction.network === "MTN" ? "🟡 MTN Bénin"
      : transaction.network === "CELTIS" ? "🔵 Celtis Bénin"
      : transaction.network ?? "Inconnu";

    const message = [
      `❌ <b>Paiement rejeté</b>`,
      ``,
      `🏆 <b>Candidat :</b> ${candidatName} (${nbVotes} vote${nbVotes > 1 ? "s" : ""})`,
      `💰 <b>Montant :</b> ${transaction.amount.toLocaleString("fr-FR")} FCFA`,
      `📱 <b>Réseau :</b> ${reseauLabel}`,
      `📋 <b>Réf :</b> <code>${transaction.reference}</code>`,
      ``,
      `<i>Aucun vote n'a été ajouté.</i>`,
    ].join("\n");

    await sendTelegramNotification(message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/reject-payment]", error);
    return NextResponse.json({ error: "Une erreur est survenue lors du rejet." }, { status: 500 });
  }
}
