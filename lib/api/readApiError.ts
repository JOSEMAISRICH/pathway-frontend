/** Extrae mensaje legible de respuestas de error del API (JSON o texto/HTML corto). */
export async function readApiErrorMessage(r: Response): Promise<string> {
  const status = r.status;
  const ct = r.headers.get("content-type") ?? "";

  try {
    if (ct.includes("application/json")) {
      const j = (await r.json()) as { error?: string; message?: string };
      if (typeof j.error === "string" && j.error.trim()) return j.error.trim();
      if (typeof j.message === "string" && j.message.trim()) return j.message.trim();
      return `Respuesta ${status} (sin mensaje en JSON)`;
    }
    const t = (await r.text()).trim();
    if (!t) return `Error ${status} (cuerpo vacío)`;
    const plain = t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return plain.length > 220 ? `${plain.slice(0, 220)}…` : plain;
  } catch {
    return `Error ${status}`;
  }
}
