import { NextResponse } from "next/server";
import { generateAdminToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error("❌ ADMIN_PASSWORD non configuré dans les variables d'environnement.");
      return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Mot de passe incorrect." },
        { status: 401 }
      );
    }

    // Générer un token HMAC signé (pas une simple chaîne "authenticated")
    const token = generateAdminToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,                                      // inaccessible au JavaScript client
      secure: process.env.NODE_ENV === "production",       // HTTPS uniquement en prod
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,                           // 7 jours
    });

    return response;
  } catch (error) {
    console.error("[POST /api/admin/login]", error);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}
