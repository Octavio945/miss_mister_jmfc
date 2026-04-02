import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const event = await prisma.votingEvent.findFirst();

    if (!event) {
      return NextResponse.json({ error: "Aucun événement trouvé." }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[GET /api/admin/settings]", error);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive, votePrice, startDate, endDate } = body;

    if (!id || typeof isActive !== "boolean" || typeof votePrice !== "number" || !startDate || !endDate) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const updatedEvent = await prisma.votingEvent.update({
      where: { id },
      data: { 
        isActive, 
        votePrice,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error("[PUT /api/admin/settings]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la mise à jour." }, { status: 500 });
  }
}
