import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { getCurrentEvent, parseEventInput } from "@/lib/event";

export async function GET() {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const event = await getCurrentEvent();
    if (!event) {
      return NextResponse.json({ error: "Aucun événement trouvé." }, { status: 404 });
    }

    // Affiché dans la confirmation « Nouvelle édition »
    const pendingCount = await prisma.transaction.count({
      where: { eventId: event.id, status: "PENDING" },
    });

    return NextResponse.json({ event, pendingCount });
  } catch (error) {
    console.error("[GET /api/admin/settings]", error);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const input = parseEventInput(body);
    if (typeof input === "string") {
      return NextResponse.json({ error: input }, { status: 400 });
    }

    // Seule l'édition en cours est modifiable : les archives restent figées
    const event = await getCurrentEvent();
    if (!event) {
      return NextResponse.json({ error: "Aucun événement trouvé." }, { status: 404 });
    }

    const updatedEvent = await prisma.votingEvent.update({
      where: { id: event.id },
      data: { ...input, isActive },
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error("[PUT /api/admin/settings]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la mise à jour." }, { status: 500 });
  }
}
