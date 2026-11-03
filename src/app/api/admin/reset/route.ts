import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { getCurrentEvent } from "@/lib/event";

// Purge l'édition EN COURS uniquement (candidats, transactions, votants sans autre transaction).
// Les éditions archivées ne sont jamais touchées.
export async function POST() {
  // Vérification auth (double sécurité — le middleware vérifie déjà)
  if (!(await requireAdminAuth())) {
    return unauthorizedResponse();
  }

  try {
    const event = await getCurrentEvent();
    if (!event) {
      return NextResponse.json({ error: "Aucun événement trouvé." }, { status: 404 });
    }

    // Tout ou rien : évite une base à moitié purgée si une étape échoue
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { eventId: event.id } }), // supprime aussi les TransactionItem (onDelete: Cascade)
      prisma.participant.deleteMany({ where: { eventId: event.id } }),
      prisma.voter.deleteMany({ where: { transactions: { none: {} } } }),
    ]);

    return NextResponse.json({ success: true, message: "Édition en cours purgée avec succès." });
  } catch (error) {
    console.error("[POST /api/admin/reset]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la purge." }, { status: 500 });
  }
}
