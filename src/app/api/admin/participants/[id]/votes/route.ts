import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { amount, reference } = await request.json();

    if (!amount || typeof amount !== "number" || amount < 1) {
      return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Candidat introuvable." }, { status: 404 });
    }

    // On utilise Prisma transaction pour s'assurer que tout est écrit correctement
    await prisma.$transaction(async (tx) => {
      const voteCost = participant.event.votePrice * amount;
      
      // 1. Créer la transaction "CASH"
      const newTx = await tx.transaction.create({
        data: {
          eventId: participant.eventId,
          amount: voteCost, // Total en cash
          reference: reference || `CASH-${nanoid(8).toUpperCase()}`,
          status: "SUCCESS",
          paymentMethod: "CASH_OFFLINE",
          paidAt: new Date(),
        },
      });

      // 2. Lier l'item
      await tx.transactionItem.create({
        data: {
          transactionId: newTx.id,
          participantId: id,
          numberOfVotes: amount,
          amount: voteCost,
        },
      });

      // 3. Incrémenter les votes du candidat
      await tx.participant.update({
        where: { id },
        data: {
          totalVotes: { increment: amount },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/participants/[id]/votes]", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'ajout manuel des votes." }, { status: 500 });
  }
}
