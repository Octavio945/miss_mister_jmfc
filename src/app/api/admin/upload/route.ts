import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

// Vercel refuse les requêtes de plus de 4,5 Mo : on prévient avant avec un message clair
const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: Request) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Format non accepté. Utilisez une image JPG, PNG ou WebP." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image trop lourde (4 Mo maximum)." }, { status: 413 });
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
