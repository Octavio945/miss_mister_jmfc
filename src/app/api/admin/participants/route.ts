import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, number, description, imageUrl, eventId } = body;

    if (!name || !category || typeof number !== "number" || !eventId) {
      return NextResponse.json(
        { error: "Paramètres manquants ou invalides." },
        { status: 400 }
      );
    }

    const newParticipant = await prisma.participant.create({
      data: {
        name,
        category,
        number,
        description: description || "",
        imageUrl: imageUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${name}`,
        eventId,
      },
    });

    return NextResponse.json({ success: true, participant: newParticipant });
  } catch (error) {
    console.error("[POST /api/admin/participants]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du candidat." },
      { status: 500 }
    );
  }
}
