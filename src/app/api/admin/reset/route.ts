import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function POST() {
  // Vérification auth (double sécurité — le middleware vérifie déjà)
  if (!(await requireAdminAuth())) {
    return unauthorizedResponse();
  }

  try {
    // Tout ou rien : évite une base à moitié purgée si une étape échoue
    await prisma.$transaction([
      prisma.transaction.deleteMany(), // supprime aussi les TransactionItem (onDelete: Cascade)
      prisma.participant.deleteMany(),
      prisma.voter.deleteMany(),
    ]);

    return NextResponse.json({ success: true, message: "Base de données purgée avec succès." });
  } catch (error) {
    console.error("[POST /api/admin/reset]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la purge." }, { status: 500 });
  }
}
