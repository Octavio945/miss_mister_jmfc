import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const event = await prisma.votingEvent.findFirst({
      where: { isActive: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Aucun événement actif." }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[GET /api/participants/active-event]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
