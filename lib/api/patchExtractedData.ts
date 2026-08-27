import { apiUrl } from "@/lib/api/apiUrl";

export type ManualExtractedFields = Partial<Record<
  | "nombre"
  | "apellidos"
  | "numero_pasaporte"
  | "nacionalidad"
  | "fecha_nacimiento"
  | "fecha_caducidad_pasaporte"
  | "sexo"
  | "numero_nie",
  string
>>;

export type PatchExtractedDataResponse = {
  ok: boolean;
  extractedData: unknown;
  case: unknown;
};

/** PATCH /api/cases/:caseId/documents/:docId/extracted-data */
export async function patchDocumentExtractedData(
  caseId: string,
  documentId: string,
  fields: ManualExtractedFields,
): Promise<PatchExtractedDataResponse> {
  const r = await fetch(apiUrl(`/api/cases/${caseId}/documents/${documentId}/extracted-data`), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  const j = (await r.json()) as PatchExtractedDataResponse & { error?: string };
  if (!r.ok) {
    throw new Error(j.error || `Error ${r.status}`);
  }
  return j;
}
