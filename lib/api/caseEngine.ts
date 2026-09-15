/**
 * Nivel 2 — Case Engine (espejo front de PathWay-Backend/src/lib/caseEngine).
 */

export type CaseTypeId =
  | "MVP-3"
  | "EX-10"
  | "ARRAIGO-SOCIAL"
  | "ARRAIGO-FAMILIAR"
  | "EX-15"
  | "RENOVACION"
  | "NACIONALIDAD";

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
  {
    id: "ARRAIGO-SOCIAL",
    label: "Arraigo social",
    description: "Padrón, medios económicos, informe de inserción, antecedentes y tasa 790.",
    documentsCount: 8,
  },
  {
    id: "ARRAIGO-FAMILIAR",
    label: "Arraigo familiar",
    description: "Vínculo familiar, padrón, antecedentes y tasa 790.",
    documentsCount: 7,
  },
  {
    id: "EX-15",
    label: "EX-15 — Reagrupación familiar",
    description: "Familiar reagrupado, vínculo, vivienda, medios económicos y tasa 790.",
    documentsCount: 8,
  },
  {
    id: "RENOVACION",
    label: "Renovación de residencia",
    description: "TIE actual, medios, padrón, foto y tasa 790.",
    documentsCount: 7,
  },
  {
    id: "NACIONALIDAD",
    label: "Nacionalidad por residencia",
    description: "Nacimiento, padrón, domicilio, DELE A2, CCSE, antecedentes y tasa 790-026.",
    documentsCount: 9,
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
  "means_of_life",
  "integration_report",
  "family_link",
  "housing_report",
  "current_tie",
  "birth_certificate",
  "dele_a2",
  "ccse",
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
