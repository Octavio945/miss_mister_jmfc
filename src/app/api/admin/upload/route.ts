import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const filename = `${nanoid()}-${file.name.replace(/\\s/g, "_")}`;
    
    // Upload vers Vercel Blob
    const blob = await put(filename, file, { 
      access: 'public',
    });

    return NextResponse.json({ success: true, imageUrl: blob.url });
  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'upload." }, { status: 500 });
  }
}
