import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  checkAdminPassword,
  generateAdminToken,
} from "@/lib/admin-auth";

// Limite anti brute-force : 5 essais ratés par IP sur 15 minutes.
// En mémoire : suffisant pour une instance, remis à zéro à chaque redémarrage.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; firstAt: number }>();

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

function isRateLimited(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const entry = failedAttempts.get(ip);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstAt: Date.now() });
  } else {
    entry.count++;
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    // Pas de secret par défaut : si la config manque, la connexion est refusée
    const token = generateAdminToken();
    if (!token) {
      return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
    }

    if (!checkAdminPassword(password)) {
      recordFailure(ip);
      return NextResponse.json(
        { error: "Mot de passe incorrect." },
        { status: 401 }
      );
    }

    failedAttempts.delete(ip);

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,                                      // inaccessible au JavaScript client
      secure: process.env.NODE_ENV === "production",       // HTTPS uniquement en prod
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,                       // même durée que l'expiration signée
    });

    return response;
  } catch (error) {
    console.error("[POST /api/admin/login]", error);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}
