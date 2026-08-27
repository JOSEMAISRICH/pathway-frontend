/**
 * Nivel 2 — Case Engine (espejo front de PathWay-Backend/src/lib/caseEngine).
 */

export type CaseTypeId = "MVP-3" | "EX-10";

export type CaseTypeOption = {
  id: CaseTypeId;
  label: string;
  description: string;
  documentsCount: number;
};

export type ChecklistItem = {
  id: string;
  label: string;
  kind: "auto" | "manual";
  done: boolean;
};

export const CASE_TYPE_OPTIONS: CaseTypeOption[] = [
  {
    id: "MVP-3",
    label: "Recogida básica (3 documentos)",
    description: "Pasaporte, domicilio y foto. Flujo MVP Nivel 1.",
    documentsCount: 3,
  },
  {
    id: "EX-10",
    label: "EX-10 — Autorización de residencia temporal",
    description: "Identidad, domicilio, tasa 790, empadronamiento y antecedentes penales.",
    documentsCount: 6,
  },
];

export const DEFAULT_CASE_TYPE: CaseTypeId = "EX-10";

/** Claves con subida en portal magic link (pasaporte usa upload-passport). */
export const CLIENT_UPLOADABLE_KEYS = new Set([
  "passport",
  "proof_address",
  "photo",
  "fee_790",
  "empadronamiento",
  "criminal_record",
]);

export function isCaseDocumentUploadEnabled(key: string): boolean {
  return CLIENT_UPLOADABLE_KEYS.has(key);
}

export function caseTypeLabel(caseType?: string | null): string {
  const found = CASE_TYPE_OPTIONS.find((o) => o.id === caseType);
  return found?.label ?? caseType ?? "Expediente";
}

export function checklistProgress(items: ChecklistItem[]): { done: number; total: number; percent: number } {
  const total = items.length;
  if (total === 0) return { done: 0, total: 0, percent: 0 };
  const done = items.filter((i) => i.done).length;
  return { done, total, percent: Math.round((done / total) * 100) };
}
