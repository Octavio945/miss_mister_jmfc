// src/lib/admin-auth.ts
// Utilitaire centralisé pour l'authentification admin.
// Le cookie admin_token contient "<expiration>.<signature>" où la signature est
// un HMAC-SHA256 de l'expiration, signé avec une clé dérivée de JWT_SECRET et
// ADMIN_PASSWORD. Conséquences :
//   - un token expire tout seul (ADMIN_SESSION_MAX_AGE) ;
//   - changer ADMIN_PASSWORD ou JWT_SECRET invalide immédiatement toutes les sessions ;
//   - falsifier le cookie sans connaître ces secrets est impossible.
// Utilisé à la fois par les Route Handlers et par src/proxy.ts (runtime Node.js).

import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "admin_token";

/** Durée de vie d'une session admin, en secondes (8 heures). */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

/**
 * Clé de signature. Retourne null si la configuration est incomplète :
 * dans ce cas aucun token n'est généré ni accepté (pas de secret par défaut).
 */
function getSigningKey(): string | null {
  const secret = process.env.JWT_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!secret || secret.length < 32 || !password) {
    console.error(
      "❌ JWT_SECRET (32 caractères minimum) et ADMIN_PASSWORD doivent être définis — accès admin désactivé."
    );
    return null;
  }
  return `${secret}:${password}`;
}

function sign(payload: string, key: string): string {
  return crypto.createHmac("sha256", key).update(`admin-session:${payload}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/** Génère un nouveau token de session, ou null si la configuration est incomplète. */
export function generateAdminToken(): string | null {
  const key = getSigningKey();
  if (!key) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE;
  return `${expiresAt}.${sign(String(expiresAt), key)}`;
}

/** Vérifie la signature et l'expiration d'un token de cookie. */
export function verifyAdminToken(token: string): boolean {
  if (!token) return false;
  const key = getSigningKey();
  if (!key) return false;

  const [expiresAtRaw, signature] = token.split(".");
  if (!expiresAtRaw || !signature || !/^\d+$/.test(expiresAtRaw)) return false;
  if (Number(expiresAtRaw) <= Math.floor(Date.now() / 1000)) return false;

  return safeEqual(signature, sign(expiresAtRaw, key));
}

/** Compare le mot de passe saisi au mot de passe admin, en temps constant. */
export function checkAdminPassword(input: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== "string") return false;
  // Comparer des hash de taille fixe évite de révéler la longueur du mot de passe
  const hash = (v: string) => crypto.createHash("sha256").update(v).digest();
  return crypto.timingSafeEqual(hash(input), hash(expected));
}

/**
 * Vérifie l'authentification admin dans un Route Handler (App Router).
 * Lit le cookie admin_token depuis next/headers.
 * @returns true si l'admin est authentifié, false sinon.
 */
export async function requireAdminAuth(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? "";
  return verifyAdminToken(token);
}

/** Réponse standard 401 renvoyée quand l'auth échoue dans une API. */
export function unauthorizedResponse() {
  return Response.json(
    { error: "Non autorisé. Veuillez vous connecter." },
    { status: 401 }
  );
}
