/** URL pública del portal del cliente para un token UUID. */
export function buildPortalUrl(origin: string, token: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/portal/${encodeURIComponent(token.trim())}`;
}

export function whatsAppDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** E.164 sin '+' — p. ej. 34600111222. Añade 34 si falta prefijo en móviles ES de 9 dígitos. */
export function normalizeWhatsAppPhone(raw: string): string {
  let digits = whatsAppDigits(raw);
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Móvil/fijo español sin prefijo: 612345678 → 34612345678
  if (digits.length === 9 && /^[6789]/.test(digits)) digits = `34${digits}`;
  return digits.length >= 8 ? digits : "";
}

export function buildWhatsAppMagicLinkUrl(
  phone: string,
  clientName: string,
  portalUrl: string,
  agencyName?: string,
): string | null {
  const digits = normalizeWhatsAppPhone(phone);
  if (digits.length < 8) return null;
  const name = clientName.trim() || "Cliente";
  const from = agencyName?.trim() ? ` desde ${agencyName.trim()}` : "";
  const mensaje = `Hola ${name},${from} aquí tienes tu enlace seguro para subir la documentación de tu expediente en PathWay:\n\n${portalUrl}\n\nEs un enlace personal; no lo reenvíes a otras personas.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;
}

/** Si no hay teléfono válido: abre WhatsApp para elegir contacto, con el mensaje ya escrito. */
export function buildWhatsAppPickContactUrl(clientName: string, portalUrl: string, agencyName?: string): string {
  const name = clientName.trim() || "Cliente";
  const from = agencyName?.trim() ? ` desde ${agencyName.trim()}` : "";
  const mensaje = `Hola ${name},${from} aquí tienes tu enlace seguro para subir la documentación de tu expediente en PathWay:\n\n${portalUrl}\n\nEs un enlace personal; no lo reenvíes a otras personas.`;
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

/** Texto listo para pegar en correo o chat (copiar junto al enlace). */
export function buildClientInviteMessage(clientName: string, portalUrl: string, agencyName?: string): string {
  const name = clientName.trim() || "Cliente";
  const from = agencyName?.trim() ? ` de ${agencyName.trim()}` : "";
  return `Hola ${name},

Te enviamos${from} el acceso para subir la documentación de tu expediente. Abre este enlace desde tu móvil o ordenador:

${portalUrl}

No necesitas crear cuenta ni contraseña. El enlace es personal: no lo compartas con terceros.

Gracias.`;
}

export function isMagicLinkExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  return !Number.isNaN(t) && t < Date.now();
}

export function formatMagicExpiresAt(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return null;
  if (isMagicLinkExpired(expiresAt)) {
    return `Caducó el ${d.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}`;
  }
  return `Válido hasta ${d.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
