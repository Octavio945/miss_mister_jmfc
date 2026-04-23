import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Référence manquante." },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: {
        voter: true,
        items: {
          include: { participant: true },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction introuvable." },
        { status: 404 }
      );
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette transaction n'est plus en attente." },
        { status: 400 }
      );
    }

    // Infos candidat
    const firstItem = transaction.items[0];
    const candidatName = firstItem?.participant?.name ?? "Inconnu";
    const nbVotes = firstItem?.numberOfVotes ?? 0;

    // Infos votant
    let votantInfo = "Anonyme";
    if (transaction.voter && !transaction.voter.isAnonymous) {
      const parts = [
        transaction.voter.name,
        transaction.voter.phone,
        transaction.voter.email,
      ].filter(Boolean);
      if (parts.length > 0) votantInfo = parts.join(" / ");
    } else if (transaction.voter?.isAnonymous) {
      votantInfo = `Anonyme (${transaction.voter.anonCode ?? ""})`;
    }

    // Réseau
    const reseauLabel =
      transaction.network === "MTN"
        ? "🟡 MTN Bénin"
        : transaction.network === "CELTIS"
        ? "🔵 Celtis Bénin"
        : transaction.network ?? "Inconnu";

    // Date formatée
    const now = new Date();
    const dateStr = now.toLocaleString("fr-FR", {
      timeZone: "Africa/Porto-Novo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    const message = [
      `🔔 <b>Nouveau paiement en attente !</b>`,
      ``,
      `📋 <b>Réf :</b> <code>${transaction.reference}</code>`,
      `💰 <b>Montant :</b> ${transaction.amount.toLocaleString("fr-FR")} FCFA`,
      `📱 <b>Réseau :</b> ${reseauLabel}`,
      `🏆 <b>Pour :</b> ${candidatName} (${nbVotes} vote${nbVotes > 1 ? "s" : ""})`,
      `👤 <b>Votant :</b> ${votantInfo}`,
      `📅 <b>Heure :</b> ${dateStr}`,
      ``,
      `👉 <a href="${appUrl}/admin/transactions">Valider dans le dashboard</a>`,
    ].join("\n");

    await sendTelegramNotification(message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/checkout/notify]", error);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}
