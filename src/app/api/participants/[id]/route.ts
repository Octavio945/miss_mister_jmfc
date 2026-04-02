import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const participant = await prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("[GET /api/participants/[id]]", error);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}
