import { apiUrl } from "@/lib/api/apiUrl";
import { readApiErrorMessage } from "@/lib/api/readApiError";

export type CasePdfSource = {
  hasFinalPdf?: boolean;
  finalPdfPath?: string | null;
  finalPdfUrl?: string | null;
};

/** true si el API indica que ya existe un PDF generado. */
export function isCasePdfAvailable(caseData: CasePdfSource | null | undefined): boolean {
  if (!caseData) return false;
  if (caseData.hasFinalPdf === true) return true;
  if (typeof caseData.finalPdfPath === "string" && caseData.finalPdfPath.trim()) return true;
  if (typeof caseData.finalPdfUrl === "string" && caseData.finalPdfUrl.trim()) return true;
  return false;
}

export function casePdfDownloadUrl(caseId: string, caseData?: CasePdfSource | null): string {
  const direct = caseData?.finalPdfUrl?.trim();
  if (direct) return direct;
  return apiUrl(`/api/cases/${caseId}/final-pdf`);
}

/** Descarga el PDF con sesión; devuelve error legible si el backend aún no lo generó. */
export async function downloadCaseFinalPdf(
  caseId: string,
  caseData?: CasePdfSource | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = casePdfDownloadUrl(caseId, caseData);
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) {
    return { ok: false, error: await readApiErrorMessage(r) };
  }
  const ct = r.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: j.error ?? "El PDF no está disponible todavía." };
  }
  const blob = await r.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `expediente-${caseId.slice(0, 8)}.pdf`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
  return { ok: true };
}
