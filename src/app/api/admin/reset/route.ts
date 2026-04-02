import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Supprimer d'abord les transactions 
    await prisma.transaction.deleteMany();
    // Supprimer les participants
    await prisma.participant.deleteMany();
    // (Optionnel) Supprimer les votants
    await prisma.voter.deleteMany();

    return NextResponse.json({ success: true, message: "Base de données purgée avec succès." });
  } catch (error) {
    console.error("[POST /api/admin/reset]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la purge de la base de données." }, { status: 500 });
  }
}
