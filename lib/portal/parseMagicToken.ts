/** Extrae el token Magic Link (UUID) de una URL o de un texto pegado. */
export function parseMagicTokenFromInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const fromUrl = trimmed.match(/\/portal\/([a-f0-9-]{36})/i);
  if (fromUrl?.[1]) return fromUrl[1];

  const uuid =
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.exec(trimmed)?.[0];
  if (uuid) return uuid;

  return null;
}
