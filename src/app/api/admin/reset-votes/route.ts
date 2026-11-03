import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { getCurrentEvent } from "@/lib/event";

// Remet les compteurs de votes à 0 et supprime les transactions de test
// de l'édition EN COURS, sans toucher aux candidats ni aux éditions archivées
export async function POST() {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const event = await getCurrentEvent();
    if (!event) {
      return NextResponse.json({ error: "Aucun événement trouvé." }, { status: 404 });
    }

    await prisma.$transaction([
      // Supprimer les transactions (et leurs items, onDelete: Cascade)
      prisma.transaction.deleteMany({ where: { eventId: event.id } }),
      // Supprimer les voters qui n'ont plus aucune transaction
      prisma.voter.deleteMany({ where: { transactions: { none: {} } } }),
      // Remettre les votes à 0
      prisma.participant.updateMany({
        where: { eventId: event.id },
        data: { totalVotes: 0 },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/reset-votes]", error);
    return NextResponse.json({ error: "Erreur lors de la réinitialisation." }, { status: 500 });
  }
}
