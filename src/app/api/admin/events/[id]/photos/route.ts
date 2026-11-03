import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { isBlobImageUrl, MAX_CAPTION } from "@/lib/edition-photos";

// Ajoute une photo (déjà envoyée via /api/admin/upload) à la galerie d'une édition
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const { id } = await params;
    const { imageUrl, caption } = await request.json();

    if (!isBlobImageUrl(imageUrl)) {
      return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    }
    if (caption !== undefined && (typeof caption !== "string" || caption.length > MAX_CAPTION)) {
      return NextResponse.json({ error: `La légende doit faire ${MAX_CAPTION} caractères maximum.` }, { status: 400 });
    }

    const event = await prisma.votingEvent.findUnique({ where: { id }, select: { id: true } });
    if (!event) {
      return NextResponse.json({ error: "Édition introuvable." }, { status: 404 });
    }

    // Nouvelle photo en fin de galerie
    const last = await prisma.editionPhoto.aggregate({ where: { eventId: id }, _max: { sortOrder: true } });
    const photo = await prisma.editionPhoto.create({
      data: {
        eventId: id,
        imageUrl,
        caption: caption?.trim() || null,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ success: true, photo });
  } catch (error) {
    console.error("[POST /api/admin/events/[id]/photos]", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'ajout de la photo." }, { status: 500 });
  }
}
