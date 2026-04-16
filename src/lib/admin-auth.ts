// src/lib/admin-auth.ts
// Utilitaire centralisé pour l'authentification admin.
// Le cookie admin_token stocke un HMAC-SHA256 signé avec JWT_SECRET.
// Falsifier le cookie sans connaître JWT_SECRET est impossible.

import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn("⚠️ JWT_SECRET non défini — utilisez une valeur dans .env en production !");
  }
  // Fallback uniquement en développement
  return secret ?? "dev-fallback-secret-change-in-production";
}

/** Génère le token attendu à partir du secret serveur. */
export function generateAdminToken(): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update("admin-authenticated")
    .digest("hex");
}

/**
 * Vérifie qu'un token de cookie est valide.
 * Utilise timingSafeEqual pour éviter les timing attacks.
 */
export function verifyAdminToken(token: string): boolean {
  if (!token || token.length === 0) return false;
  try {
    const expected = generateAdminToken();
    // Les deux buffers doivent avoir la même taille pour timingSafeEqual
    if (token.length !== expected.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(token, "utf-8"),
      Buffer.from(expected, "utf-8")
    );
  } catch {
    return false;
  }
}

/**
 * Vérifie l'authentification admin dans un Route Handler (App Router).
 * Lit le cookie admin_token depuis next/headers.
 * @returns true si l'admin est authentifié, false sinon.
 */
export async function requireAdminAuth(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value ?? "";
  return verifyAdminToken(token);
}

/** Réponse standard 401 renvoyée quand l'auth échoue dans une API. */
export function unauthorizedResponse() {
  return Response.json(
    { error: "Non autorisé. Veuillez vous connecter." },
    { status: 401 }
  );
}
