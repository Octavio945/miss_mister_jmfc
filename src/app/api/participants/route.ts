import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const event = await prisma.votingEvent.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Aucun événement trouvé." },
        { status: 404 }
      );
    }

    const participants = await prisma.participant.findMany({
      where: { eventId: event.id },
      orderBy: { totalVotes: "desc" },
    });

    return NextResponse.json({ participants, event });
  } catch (error) {
    console.error("[GET /api/participants]", error);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}
