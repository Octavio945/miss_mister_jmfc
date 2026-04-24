import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

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

    await prisma.$transaction(async (tx) => {
      const voteCost = participant.event.votePrice * amount;

      const newTx = await tx.transaction.create({
        data: {
          eventId: participant.eventId,
          amount: voteCost,
          reference: reference || `CASH-${nanoid(8).toUpperCase()}`,
          status: "SUCCESS",
          paymentMethod: "CASH_OFFLINE",
          paidAt: new Date(),
        },
      });

      await tx.transactionItem.create({
        data: {
          transactionId: newTx.id,
          participantId: id,
          numberOfVotes: amount,
          amount: voteCost,
        },
      });

      await tx.participant.update({
        where: { id },
        data: { totalVotes: { increment: amount } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/participants/[id]/votes]", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'ajout manuel des votes." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const { id } = await params;
    const { amount } = await request.json();

    if (!amount || typeof amount !== "number" || amount < 1) {
      return NextResponse.json({ error: "Nombre de votes invalide." }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({ where: { id } });
    if (!participant) {
      return NextResponse.json({ error: "Candidat introuvable." }, { status: 404 });
    }

    if (participant.totalVotes < amount) {
      return NextResponse.json(
        { error: `Impossible de retirer ${amount} votes : le candidat n'en a que ${participant.totalVotes}.` },
        { status: 400 }
      );
    }

    await prisma.participant.update({
      where: { id },
      data: { totalVotes: { decrement: amount } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/participants/[id]/votes]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la correction des votes." }, { status: 500 });
  }
}
