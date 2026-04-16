import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    // Sécuriser le nom de fichier (pas de traversal path)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${nanoid()}-${safeName}`;

    const blob = await put(filename, file, { access: "public" });

    return NextResponse.json({ success: true, imageUrl: blob.url });
  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'upload." }, { status: 500 });
  }
}
