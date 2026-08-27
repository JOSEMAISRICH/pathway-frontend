/**
 * True si el bundle va a llamar al API en otro origen (cookies de sesión no quedan en este dominio).
 * En desarrollo, con `NEXT_PUBLIC_API_BASE_URL` definida, `apiUrl()` sigue usando rutas relativas salvo
 * `NEXT_PUBLIC_FORCE_DIRECT_API=true`, así que aquí devolvemos false en ese caso.
 */
export function isCrossOriginApiConfigured(): boolean {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  const hasBase = typeof raw === "string" && raw.trim().length > 0;
  if (!hasBase) return false;
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_FORCE_DIRECT_API !== "true") {
    return false;
  }
  return true;
}
