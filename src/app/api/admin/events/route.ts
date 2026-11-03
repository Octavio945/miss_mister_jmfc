import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { parseEventInput } from "@/lib/event";

// Crée une nouvelle édition du concours.
// Les éditions précédentes sont archivées (votes fermés) mais rien n'est supprimé :
// candidats, transactions et votants restent consultables dans /admin/editions.
export async function POST(request: Request) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const input = parseEventInput(await request.json());
    if (typeof input === "string") {
      return NextResponse.json({ error: input }, { status: 400 });
    }

    const [, event] = await prisma.$transaction([
      prisma.votingEvent.updateMany({ data: { isActive: false } }),
      prisma.votingEvent.create({ data: { ...input, isActive: true } }),
    ]);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("[POST /api/admin/events]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de l'édition." },
      { status: 500 }
    );
  }
}
