import { apiUrl } from "@/lib/api/apiUrl";

/**
 * Pide al backend que envíe al cliente el correo con el Magic Link.
 * Express debe exponer: POST /api/cases/:caseId/send-magic-email
 */
export async function requestCaseMagicLinkEmail(caseId: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(apiUrl(`/api/cases/${caseId}/send-magic-email`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) return { ok: false, error: j.error ?? "No se pudo enviar el correo." };
  return { ok: true };
}
