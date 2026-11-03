import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

const MAX_DESCRIPTION = 3000;

// Récit d'une édition (affiché dans l'historique public). Modifiable même une fois archivée.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const { id } = await params;
    const { description } = await request.json();

    if (typeof description !== "string" || description.length > MAX_DESCRIPTION) {
      return NextResponse.json(
        { error: `Le récit doit être un texte de ${MAX_DESCRIPTION} caractères maximum.` },
        { status: 400 }
      );
    }

    const event = await prisma.votingEvent.update({
      where: { id },
      data: { description: description.trim() || null },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("[PATCH /api/admin/events/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'enregistrement." }, { status: 500 });
  }
}
