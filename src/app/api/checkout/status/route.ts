import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { syncTransactionWithFedapay } from "@/lib/fedapay";

// Statut d'un paiement pour la page d'attente.
// Tant que la transaction n'est pas payée, on interroge FedaPay directement :
// les votes sont ajoutés même si la notification (webhook) n'arrive jamais.
export async function GET(request: Request) {
  try {
    const ref = new URL(request.url).searchParams.get("ref");
    if (!ref) {
      return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
    }

    const existing = await prisma.transaction.findUnique({ where: { reference: ref }, select: { status: true, fedapayId: true } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }

    // FAILED aussi : un votant peut réussir à payer après un premier refus
    if (existing.status !== "SUCCESS" && existing.fedapayId) {
      try {
        await syncTransactionWithFedapay({ reference: ref });
      } catch (error) {
        // FedaPay injoignable : on renvoie le statut connu, la page réessaiera
        console.warn("[GET /api/checkout/status] vérification FedaPay impossible:", error);
      }
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference: ref },
      select: {
        status: true,
        amount: true,
        items: { select: { numberOfVotes: true, participant: { select: { id: true, name: true } } } },
      },
    });
    if (!transaction) {
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }

    const item = transaction.items[0];
    return NextResponse.json({
      status: transaction.status,
      amount: transaction.amount,
      voteCount: transaction.items.reduce((sum, i) => sum + i.numberOfVotes, 0),
      participantId: item?.participant.id ?? null,
      participantName: item?.participant.name.trim() ?? null,
    });
  } catch (error) {
    console.error("[GET /api/checkout/status]", error);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}
