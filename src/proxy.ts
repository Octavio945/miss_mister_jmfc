// src/proxy.ts  (Next.js 16 — anciennement middleware.ts)
// Protège toutes les pages /admin/* et les API /api/admin/*
// Le proxy tourne sur le runtime Node.js : il réutilise la vérification de admin-auth.ts.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth";

// Routes accessibles SANS être connecté
const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/api/admin/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes de login
  if (PUBLIC_ADMIN_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Protéger les pages admin et les API admin
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";

    if (!verifyAdminToken(token)) {
      // Page admin → rediriger vers login
      if (pathname.startsWith("/admin")) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        // Nettoyer un éventuel cookie expiré ou invalide
        response.cookies.delete(ADMIN_COOKIE_NAME);
        return response;
      }

      // API admin → retourner 401
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
