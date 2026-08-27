/** Campos habituales donde el API devuelve el JWT (además de `token`). */
const TOKEN_KEYS = ["token", "accessToken", "access_token", "jwt", "id_token"] as const;

function readShallow(obj: Record<string, unknown>): string | null {
  for (const k of TOKEN_KEYS) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 20) return v;
  }
  return null;
}

/** Extrae un JWT de la respuesta JSON del login/register (una capa de anidación `data`). */
export function extractSessionTokenFromJson(data: unknown, depth = 0): string | null {
  if (depth > 2 || !data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const direct = readShallow(obj);
  if (direct) return direct;
  const inner = obj.data;
  if (inner && typeof inner === "object") {
    return extractSessionTokenFromJson(inner, depth + 1);
  }
  return null;
}
