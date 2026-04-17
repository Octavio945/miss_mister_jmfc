import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

// Remet tous les compteurs de votes à 0 et supprime les transactions de test
// Sans toucher aux candidats ni à l'événement
export async function POST() {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    await prisma.$transaction([
      // Supprimer les items de transaction
      prisma.transactionItem.deleteMany(),
      // Supprimer les transactions
      prisma.transaction.deleteMany(),
      // Supprimer les voters
      prisma.voter.deleteMany(),
      // Remettre tous les votes à 0
      prisma.participant.updateMany({
        data: { totalVotes: 0 },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/reset-votes]", error);
    return NextResponse.json({ error: "Erreur lors de la réinitialisation." }, { status: 500 });
  }
}
