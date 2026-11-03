import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { MAX_CAPTION } from "@/lib/edition-photos";

type Params = { params: Promise<{ id: string; photoId: string }> };

// Modifier la légende, ou placer la photo en couverture ({ cover: true })
export async function PATCH(request: Request, { params }: Params) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const { id, photoId } = await params;
    const { caption, cover } = await request.json();

    const data: { caption?: string | null; sortOrder?: number } = {};

    if (caption !== undefined) {
      if (typeof caption !== "string" || caption.length > MAX_CAPTION) {
        return NextResponse.json({ error: `La légende doit faire ${MAX_CAPTION} caractères maximum.` }, { status: 400 });
      }
      data.caption = caption.trim() || null;
    }

    if (cover === true) {
      // La couverture est la première photo : on passe devant toutes les autres
      const first = await prisma.editionPhoto.aggregate({ where: { eventId: id }, _min: { sortOrder: true } });
      data.sortOrder = (first._min.sortOrder ?? 0) - 1;
    }

    const result = await prisma.editionPhoto.updateMany({ where: { id: photoId, eventId: id }, data });
    if (result.count === 0) {
      return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/events/[id]/photos/[photoId]]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la modification." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const { id, photoId } = await params;
    const photo = await prisma.editionPhoto.findFirst({ where: { id: photoId, eventId: id } });
    if (!photo) {
      return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
    }

    await prisma.editionPhoto.delete({ where: { id: photo.id } });

    // Supprime aussi le fichier stocké ; un échec ici ne doit pas bloquer l'admin
    try {
      await del(photo.imageUrl);
    } catch (blobError) {
      console.warn("[DELETE photo] fichier Blob non supprimé :", blobError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/events/[id]/photos/[photoId]]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la suppression." }, { status: 500 });
  }
}
