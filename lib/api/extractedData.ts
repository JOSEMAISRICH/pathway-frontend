/**
 * Nivel 1 — Contrato ExtractedData (ingesta + extracción).
 * Compartido con PathWay-Backend vía pathway-express-patches/lib/extractedDataContract.js
 */

export const EXTRACTED_DATA_SCHEMA_VERSION = "1.0" as const;

export type ExtractionFieldStatus = "extracted" | "missing" | "low_confidence" | "invalid_format";

export type ExtractionField<T = string> = {
  value: T | null;
  status: ExtractionFieldStatus;
  confidence?: number;
  source?: "ai" | "manual" | "ocr";
  notes?: string;
};

export type DocumentIngestionStatus =
  | "pending_upload"
  | "uploaded"
  | "processing"
  | "processed"
  | "requires_review"
  | "error";

export type IdentityExtractionFields = {
  nombre?: ExtractionField;
  apellidos?: ExtractionField;
  numero_pasaporte?: ExtractionField;
  nacionalidad?: ExtractionField;
  fecha_nacimiento?: ExtractionField<string>;
  fecha_caducidad_pasaporte?: ExtractionField<string>;
  sexo?: ExtractionField<string>;
  numero_nie?: ExtractionField;
};

export type ExtractedData = {
  schemaVersion: typeof EXTRACTED_DATA_SCHEMA_VERSION;
  documentType: string;
  documentId: string;
  caseId: string;
  ingestionStatus: DocumentIngestionStatus;
  extractedAt: string;
  model?: string;
  fields: IdentityExtractionFields & {
    imageQuality?: {
      blurScore?: number;
      readable: boolean;
      warnings: string[];
    };
  };
  raw?: {
    ocrText?: string;
    aiNotes?: string;
  };
  errors?: Array<{ code: string; message: string }>;
};

const LEGACY_IDENTITY_KEYS = [
  "nombre",
  "apellidos",
  "numero_pasaporte",
  "nacionalidad",
  "fecha_nacimiento",
  "fecha_caducidad_pasaporte",
  "sexo",
  "numero_nie",
] as const;

export const EXTRACTED_FIELD_LABELS: Record<(typeof LEGACY_IDENTITY_KEYS)[number], string> = {
  nombre: "Nombre",
  apellidos: "Apellidos",
  numero_pasaporte: "N.º pasaporte",
  nacionalidad: "Nacionalidad",
  fecha_nacimiento: "Fecha nacimiento",
  fecha_caducidad_pasaporte: "Caducidad pasaporte",
  sexo: "Sexo",
  numero_nie: "N.º NIE",
};

export const EDITABLE_IDENTITY_KEYS = LEGACY_IDENTITY_KEYS;

function fieldFromLegacy(value: unknown, notes?: string): ExtractionField {
  if (value == null || value === "") {
    return { value: null, status: "missing", source: "ai", notes };
  }
  return { value: String(value), status: "extracted", source: "ai" };
}

/** Adapta JSON plano legacy (pre-v1) o v1 al contrato actual. */
export function normalizeExtractedData(
  raw: unknown,
  ctx: { documentType: string; documentId: string; caseId: string },
): ExtractedData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  if (o.schemaVersion === EXTRACTED_DATA_SCHEMA_VERSION && typeof o.ingestionStatus === "string") {
    const fields =
      o.fields && typeof o.fields === "object" && !Array.isArray(o.fields)
        ? (o.fields as ExtractedData["fields"])
        : {};
    return {
      ...(o as ExtractedData),
      documentType: typeof o.documentType === "string" ? o.documentType : ctx.documentType,
      documentId: typeof o.documentId === "string" ? o.documentId : ctx.documentId,
      caseId: typeof o.caseId === "string" ? o.caseId : ctx.caseId,
      fields,
    };
  }

  const fields: IdentityExtractionFields = {};
  for (const key of LEGACY_IDENTITY_KEYS) {
    if (key in o) fields[key] = fieldFromLegacy(o[key], typeof o.notas === "string" ? o.notas : undefined);
  }

  const hasAny = Object.values(fields).some((f) => f?.value);
  const hasMissing = Object.values(fields).some((f) => f?.status === "missing");
  const aiNotes = typeof o.notas === "string" ? o.notas : undefined;

  return {
    schemaVersion: EXTRACTED_DATA_SCHEMA_VERSION,
    documentType: ctx.documentType,
    documentId: ctx.documentId,
    caseId: ctx.caseId,
    ingestionStatus: hasMissing || aiNotes ? "requires_review" : hasAny ? "processed" : "error",
    extractedAt: new Date().toISOString(),
    fields,
    raw: aiNotes ? { aiNotes } : undefined,
  };
}

export function ingestionStatusLabel(status: DocumentIngestionStatus | string | undefined): string {
  switch (status) {
    case "processed":
      return "Procesado";
    case "requires_review":
      return "Requiere revisión";
    case "processing":
      return "Procesando";
    case "error":
      return "Error de extracción";
    case "uploaded":
      return "Subido";
    case "pending_upload":
      return "Pendiente de subida";
    default:
      return "—";
  }
}

function extractionDebugText(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const o = raw as Record<string, unknown>;
  const errors = o.errors;
  if (Array.isArray(errors) && errors[0] && typeof errors[0] === "object") {
    const msg = (errors[0] as { message?: string }).message;
    if (typeof msg === "string") return msg;
  }
  const nested = o.raw;
  if (nested && typeof nested === "object" && typeof (nested as { aiNotes?: string }).aiNotes === "string") {
    return (nested as { aiNotes: string }).aiNotes;
  }
  if (typeof o.notas === "string") return o.notas;
  return "";
}

/** Mensaje legible en portal cuando ingestionStatus === error. */
export function extractionErrorHint(raw: unknown, ingestionStatus?: string | null): string | null {
  if (ingestionStatus !== "error") return null;
  const text = extractionDebugText(raw).toLowerCase();
  if (text.includes("429") || text.includes("quota") || text.includes("billing")) {
    return "La IA del servidor no tiene crédito (OpenAI). El archivo sí se subió; el despacho puede revisarlo a mano o recargar la API.";
  }
  if (text.includes("openai_api_key") || text.includes("no configurada")) {
    return "La extracción no está activa en el servidor (falta OPENAI_API_KEY en el backend).";
  }
  if (text.includes("no devolvió")) {
    return "La IA no devolvió datos. Prueba otra foto más nítida de la página de datos del pasaporte.";
  }
  return "No se leyeron datos del pasaporte. Usa una foto clara de la página de datos (no DNI ni imágenes de prueba de Google).";
}

export function needsManualReview(data: ExtractedData | null | undefined): boolean {
  if (!data) return false;
  if (data.ingestionStatus === "requires_review" || data.ingestionStatus === "error") return true;
  const fields = data.fields;
  if (!fields || typeof fields !== "object") return false;
  return Object.values(fields).some(
    (f) => f && typeof f === "object" && "status" in f && (f.status === "missing" || f.status === "low_confidence"),
  );
}

/** Filas para UI del panel de revisión. */
export function listExtractedFieldRows(
  data: ExtractedData | null,
): Array<{ key: string; label: string; value: string; status: ExtractionFieldStatus }> {
  if (!data?.fields) return [];
  const rows: Array<{ key: string; label: string; value: string; status: ExtractionFieldStatus }> = [];
  for (const [key, field] of Object.entries(data.fields)) {
    if (key === "imageQuality" || !field || typeof field !== "object" || !("status" in field)) continue;
    const f = field as ExtractionField;
    rows.push({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: f.value ?? "—",
      status: f.status,
    });
  }
  return rows;
}

/** Plano legacy para compatibilidad con pickExtractedPayload / PDF. */
export function flattenExtractedForLegacy(data: ExtractedData | null): Record<string, unknown> | null {
  if (!data) return null;
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(data.fields)) {
    if (key === "imageQuality" || !field || typeof field !== "object" || !("value" in field)) continue;
    out[key] = (field as ExtractionField).value;
  }
  if (data.raw?.aiNotes) out.notas = data.raw.aiNotes;
  return Object.keys(out).length > 0 ? out : null;
}

export function isIdentityDocumentType(documentType: string): boolean {
  const t = documentType.toLowerCase();
  return t === "passport" || t.includes("pasaport") || t === "nie";
}

/** Panel IA solo para pasaporte/NIE o cuando hay error/campos reales (no domicilio/foto vacíos). */
export function shouldShowExtractedDataPanel(
  raw: unknown,
  documentType: string,
  ctx: { documentId: string; caseId: string },
): boolean {
  if (!raw) return false;
  const data = normalizeExtractedData(raw, { ...ctx, documentType });
  if (!data) return false;
  if (isIdentityDocumentType(documentType)) return true;
  if (data.ingestionStatus === "error" || data.ingestionStatus === "requires_review") return true;
  return listExtractedFieldRows(data).length > 0;
}
