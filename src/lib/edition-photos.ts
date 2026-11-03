// Règles partagées par les routes de la galerie des éditions.

export const MAX_CAPTION = 200;

/**
 * Seules les images envoyées via /api/admin/upload (Vercel Blob) sont acceptées :
 * n'importe quelle URL externe casserait l'optimisation next/image (domaines autorisés).
 */
export function isBlobImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
