// src/proxy.ts  (Next.js 16 — anciennement middleware.ts)
// Protège toutes les pages /admin/* et les API /api/admin/*
// Utilise l'API Web Crypto (compatible Edge Runtime, pas de Node.js crypto)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes accessibles SANS être connecté
const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/api/admin/login"];

/**
 * Vérifie le token HMAC-SHA256 avec l'API Web Crypto.
 * Génère le même hash que generateAdminToken() dans admin-auth.ts (Node.js).
 */
async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token || token.length !== 64) return false;

  try {
    const secret = process.env.JWT_SECRET ?? "dev-fallback-secret-change-in-production";
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode("admin-authenticated")
    );

    const expected = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Comparaison constant-time pour éviter les timing attacks
    if (token.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < token.length; i++) {
      diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes de login
  if (PUBLIC_ADMIN_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Protéger les pages admin et les API admin
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("admin_token")?.value ?? "";
    const isAuthenticated = await verifyAdminToken(token);

    if (!isAuthenticated) {
      // Page admin → rediriger vers login
      if (pathname.startsWith("/admin")) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
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
