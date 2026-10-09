import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

// Prisma P2002 : violation de la contrainte unique (eventId, category, number)
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function POST(request: Request) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

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
        imageUrl: imageUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}`,
        eventId,
      },
    });

    return NextResponse.json({ success: true, participant: newParticipant });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Ce numéro est déjà attribué à un autre candidat de cette catégorie." },
        { status: 409 }
      );
    }
    console.error("[POST /api/admin/participants]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du candidat." },
      { status: 500 }
    );
  }
}
