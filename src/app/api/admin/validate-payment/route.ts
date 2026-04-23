import { prisma } from "@/lib/prisma";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!(await requireAdminAuth())) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "ID de transaction manquant." },
        { status: 400 }
      );
    }

    // 1. Trouver la transaction et ses items
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction introuvable." },
        { status: 404 }
      );
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        { error: "Seules les transactions en attente peuvent être validées." },
        { status: 400 }
      );
    }

    // 2. Transaction atomique : valider la transaction et mettre à jour les votes
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut de la transaction
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
        },
      });

      // Mettre à jour les votes pour chaque participant dans la transaction
      for (const item of transaction.items) {
        await tx.participant.update({
          where: { id: item.participantId },
          data: {
            totalVotes: {
              increment: item.numberOfVotes,
            },
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/validate-payment]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la validation." },
      { status: 500 }
    );
  }
}
