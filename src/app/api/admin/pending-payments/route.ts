import { prisma } from "@/lib/prisma";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { getCurrentEvent } from "@/lib/event";

export async function GET() {
  if (!(await requireAdminAuth())) {
    return unauthorizedResponse();
  }

  try {
    // Uniquement l'édition en cours : les paiements des éditions archivées ne sont plus des notifications
    const event = await getCurrentEvent();
    if (!event) {
      return NextResponse.json({ pending: [] });
    }

    const pending = await prisma.transaction.findMany({
      where: { status: "PENDING", eventId: event.id },
      orderBy: { createdAt: "asc" },
      include: {
        voter: true,
        items: { include: { participant: true } },
      },
    });

    return NextResponse.json({ pending });
  } catch (error) {
    console.error("[GET /api/admin/pending-payments]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
