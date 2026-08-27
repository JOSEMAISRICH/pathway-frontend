import { apiUrl } from "@/lib/api/apiUrl";

export type DocumentReviewDecision = "approved" | "rejected";

/**
 * Revisión de un slot documental concreto.
 * Express: PATCH /api/cases/:caseId/documents/:docId/review
 * Body: { status: "approved" | "rejected", feedbackMessage?: string }
 */
export async function reviewCaseDocument(
  caseId: string,
  docId: string,
  decision: DocumentReviewDecision,
  feedbackMessage?: string,
): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(apiUrl(`/api/cases/${caseId}/documents/${docId}/review`), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: decision,
      ...(decision === "rejected" && feedbackMessage?.trim()
        ? { feedbackMessage: feedbackMessage.trim() }
        : {}),
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) return { ok: false, error: j.error ?? "No se pudo guardar la revisión del documento." };
  return { ok: true };
}

/** true si el slot tiene archivo (API o filePath legacy). */
export function documentHasFile(doc: { hasFile?: boolean; filePath?: string }): boolean {
  return Boolean(doc.hasFile || doc.filePath?.trim());
}

export function countUploadedDocuments(documents: { hasFile?: boolean; filePath?: string }[]): number {
  return documents.filter(documentHasFile).length;
}

export function countApprovedDocuments(
  documents: { hasFile?: boolean; filePath?: string; status?: string }[],
): number {
  return documents.filter((d) => documentHasFile(d) && (d.status ?? "").toLowerCase() === "approved").length;
}

export function allUploadedDocumentsApproved(
  documents: { hasFile?: boolean; filePath?: string; status?: string }[],
): boolean {
  const uploaded = documents.filter(documentHasFile);
  if (uploaded.length === 0) return false;
  return uploaded.every((d) => (d.status ?? "").toLowerCase() === "approved");
}
