import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // In production, use process.env.ADMIN_PASSWORD
    // For this prototype, we'll accept "missmister2026" or env variable
    const adminPassword = process.env.ADMIN_PASSWORD || "missmister2026";

    if (password === adminPassword) {
      const response = NextResponse.json({ success: true });
      
      // Set an HTTP-only cookie to keep the admin logged in
      response.cookies.set({
        name: "admin_token",
        value: "authenticated",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      
      return response;
    }

    return NextResponse.json(
      { error: "Mot de passe incorrect" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[POST /api/admin/login]", error);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}
