import { prisma } from "@/lib/prisma";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { getCurrentEvent } from "@/lib/event";

// Derniers paiements confirmés par FedaPay (édition en cours), pour la cloche de l'admin.
// Aucune action n'est attendue : les votes sont ajoutés automatiquement.
const LIMIT = 100;

export async function GET() {
  if (!(await requireAdminAuth())) {
    return unauthorizedResponse();
  }

  try {
    const event = await getCurrentEvent();
    if (!event) {
      return NextResponse.json({ payments: [] });
    }

    const payments = await prisma.transaction.findMany({
      where: { status: "SUCCESS", eventId: event.id },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      take: LIMIT,
      select: {
        id: true,
        reference: true,
        amount: true,
        paymentMethod: true,
        paidAt: true,
        createdAt: true,
        voter: { select: { name: true, phone: true, isAnonymous: true, anonCode: true } },
        items: { select: { numberOfVotes: true, participant: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("[GET /api/admin/notifications]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
