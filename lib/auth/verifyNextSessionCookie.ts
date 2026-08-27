export type SessionVerifyReason = "no_secret" | "no_cookie" | "invalid_jwt" | "unknown";

/** Comprueba que la cookie `pw_session` pase la misma verificación JWT que el middleware de `/dashboard`. */
export async function verifyNextSessionCookie(): Promise<
  { ok: true } | { ok: false; reason: SessionVerifyReason; status: number }
> {
  let r: Response;
  try {
    r = await fetch("/pw-session-verify", { credentials: "include", cache: "no-store" });
  } catch {
    return { ok: false, reason: "unknown", status: 0 };
  }

  let body: { ok?: boolean; reason?: string };
  try {
    body = (await r.json()) as { ok?: boolean; reason?: string };
  } catch {
    return { ok: false, reason: "unknown", status: r.status };
  }

  if (body.ok === true) return { ok: true };

  const reasonRaw = body.reason;
  const reason: SessionVerifyReason =
    reasonRaw === "no_cookie" || reasonRaw === "invalid_jwt" || reasonRaw === "no_secret"
      ? reasonRaw
      : "unknown";

  return { ok: false, reason, status: r.status };
}

export function messageForSessionVerifyFailure(reason: SessionVerifyReason): string {
  if (reason === "no_secret") {
    return "Next no tiene JWT_SECRET válido (mín. 16 caracteres) en .env.local.";
  }
  if (reason === "no_cookie") {
    return "No hay cookie de sesión en este origen. El login debe enviar Set-Cookie o JSON con el JWT (token / accessToken, etc.).";
  }
  if (reason === "invalid_jwt") {
    return "La cookie no es válida con el JWT_SECRET de Next: debe ser exactamente el mismo valor que JWT_SECRET en el .env de Express (no uses el texto de ejemplo «PON_AQUI…»).";
  }
  return "No se pudo comprobar la sesión con Next.";
}
