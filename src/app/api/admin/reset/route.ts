import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function POST() {
  // Vérification auth (double sécurité — le middleware vérifie déjà)
  if (!(await requireAdminAuth())) {
    return unauthorizedResponse();
  }

  try {
    await prisma.transaction.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.voter.deleteMany();

    return NextResponse.json({ success: true, message: "Base de données purgée avec succès." });
  } catch (error) {
    console.error("[POST /api/admin/reset]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la purge." }, { status: 500 });
  }
}
