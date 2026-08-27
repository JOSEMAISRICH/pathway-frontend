import { extractSessionTokenFromJson } from "@/lib/auth/extractSessionTokenFromJson";

/**
 * Si la respuesta JSON incluye un JWT (`token`, `accessToken`, etc.), lo guarda como cookie `pw_session`.
 * Sirve cuando `Set-Cookie` del API no llega bien vía proxy y el middleware de Next no ve sesión.
 *
 * En Express puedes devolver, además de Set-Cookie, algo como: `{ ok: true, token: "<mismo JWT>" }`.
 */
export async function tryApplySessionCookieFromAuthJson(r: Response): Promise<void> {
  if (!r.ok || typeof document === "undefined") return;
  const ct = r.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return;
  let text: string;
  try {
    text = await r.text();
  } catch {
    return;
  }
  if (!text.trim()) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return;
  }
  const token = extractSessionTokenFromJson(parsed);
  if (!token) return;

  const maxAge = 60 * 60 * 24 * 365;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `pw_session=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}
