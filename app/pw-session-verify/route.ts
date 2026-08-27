import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

/**
 * Comprueba si `pw_session` verifica con `JWT_SECRET` de Next (igual que `middleware.ts` en `/dashboard`).
 * Respuestas JSON siempre 200 salvo fallo de configuración (503), para no disparar "Failed to load resource" en consola
 * cuando simplemente no hay sesión (el cliente lee `ok` y `reason`).
 */
export async function GET() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.json({ ok: false, reason: "no_secret" }, { status: 503 });
  }

  const token = (await cookies()).get("pw_session")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, reason: "no_cookie" });
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_jwt" });
  }
}
