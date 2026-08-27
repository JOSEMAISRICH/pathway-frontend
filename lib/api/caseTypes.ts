/**
 * Contrato API PathWay — alineado con PathWay-Backend (Express + MongoDB).
 * Referencia: documentación de integración magic link + documentos por defecto.
 */

import type { DocumentIngestionStatus, ExtractedData } from "@/lib/api/extractedData";

export type { DocumentIngestionStatus, ExtractedData, ExtractionField, ExtractionFieldStatus } from "@/lib/api/extractedData";
export {
  EXTRACTED_DATA_SCHEMA_VERSION,
  extractionErrorHint,
  flattenExtractedForLegacy,
  ingestionStatusLabel,
  isIdentityDocumentType,
  listExtractedFieldRows,
  needsManualReview,
  normalizeExtractedData,
  shouldShowExtractedDataPanel,
} from "@/lib/api/extractedData";

export type { CaseTypeId, ChecklistItem } from "@/lib/api/caseEngine";
export {
  CASE_TYPE_OPTIONS,
  DEFAULT_CASE_TYPE,
  caseTypeLabel,
  checklistProgress,
  isCaseDocumentUploadEnabled,
} from "@/lib/api/caseEngine";

export const DEFAULT_CASE_DOCUMENT_SLOTS = [
  { key: "passport", label: "Pasaporte (página de datos biográficos)" },
  { key: "proof_address", label: "Justificante de domicilio" },
  { key: "photo", label: "Fotografía tamaño carnet" },
] as const;

export type CaseDocumentKey = (typeof DEFAULT_CASE_DOCUMENT_SLOTS)[number]["key"];

export type CaseDocumentStatus = "pending" | "approved" | "rejected";

/** Slot documental en expediente (despacho + portal). */
export type CaseDocument = {
  id: string;
  key: string;
  label: string;
  status: CaseDocumentStatus | string;
  feedbackMessage: string;
  /** Portal: true si hay filePath o (passport) extractedData en expediente */
  hasFile: boolean;
  filePath: string;
  originalName: string;
  uploadedAt: string | null;
  /** Nivel 1 — extracción IA (v1.0 o legacy plano). */
  extractedData?: ExtractedData | Record<string, unknown> | null;
  ingestionStatus?: DocumentIngestionStatus | string;
};

export type CaseReviewStatus = "pending" | "approved" | "rejected";

export type CaseStatus = "pending" | "completed" | string;

/** Expediente completo (GET /api/cases/:id, POST create, magic-link response). */
export type Case = {
  id: string;
  agencyId?: string;
  fullName?: string;
  clientName: string;
  email?: string;
  clientEmail?: string;
  phone?: string | null;
  clientPhone?: string | null;
  magicToken?: string | null;
  magicLinkToken?: string | null;
  magicExpiresAt: string | null;
  magicLinkUrl?: string | null;
  status: CaseStatus;
  progress: number;
  reviewStatus?: CaseReviewStatus | string | null;
  feedbackMessage?: string;
  reviewedAt?: string | null;
  hasRejectedDocuments?: boolean;
  documents: CaseDocument[];
  extractedData?: Record<string, unknown> | null;
  finalPdfPath?: string;
  hasFinalPdf?: boolean;
  finalPdfUrl?: string | null;
  updatedAt?: string;
  createdAt?: string;
  /** Nivel 2 — tipo de trámite (Case Engine) */
  caseType?: string;
  caseTypeLabel?: string;
  checklist?: import("@/lib/api/caseEngine").ChecklistItem[];
};

/** Fila resumida en GET /api/cases */
export type CaseListItem = Pick<
  Case,
  "id" | "clientName" | "clientPhone" | "progress" | "magicToken" | "magicExpiresAt" | "magicLinkUrl" | "reviewStatus" | "caseType" | "caseTypeLabel"
> & {
  clientEmail?: string;
  updatedAt: string;
  documentsCount?: number;
  hasRejectedDocuments?: boolean;
};

/** GET /api/magic/:token — portal cliente */
export type MagicPortalCase = {
  id: string;
  clientName: string;
  fullName?: string;
  phone?: string | null;
  clientPhone?: string | null;
  progress: number;
  status: CaseStatus;
  magicExpiresAt?: string | null;
  documents: CaseDocument[];
  extractedData?: Record<string, unknown> | null;
  reviewStatus?: CaseReviewStatus | string | null;
  feedbackMessage?: string;
  hasRejectedDocuments?: boolean;
  hasFinalPdf?: boolean;
  finalPdfUrl?: string | null;
  finalPdfStorage?: string;
  passportOriginalUrl?: string | null;
  reviewedAt?: string | null;
};

export type MagicPortalAgency = {
  name: string;
  logoUrl: string;
};

export type MagicPortalResponse = {
  case: MagicPortalCase;
  agency: MagicPortalAgency;
};

/** POST /api/cases/:id/magic-link */
export type MagicLinkRequestBody = {
  clientPhone?: string;
  /** true = nuevo UUID + caducidad; false = mismo token, solo teléfono */
  regenerate?: boolean;
};

export type MagicLinkResponse = {
  success: boolean;
  message: string;
  magicLinkUrl: string;
  magicToken: string;
  magicExpiresAt: string | null;
  case: Case;
  emailSent?: boolean;
};

/** POST /api/cases */
export type CreateCaseRequestBody = {
  clientName?: string;
  fullName?: string;
  clientEmail?: string;
  email?: string;
  clientPhone?: string;
  sendMagicLinkEmail?: boolean;
  /** Nivel 2 — EX-10 por defecto */
  caseType?: string;
};

export type CreateCaseResponse = {
  case: Case;
  id?: string;
  emailSent?: boolean;
  emailError?: string;
};

/** Errores habituales GET /api/magic/:token */
export type MagicPortalErrorCode = 404 | 410 | 401 | 403;

export const MAGIC_PORTAL_ERRORS = {
  invalid: "Enlace no válido",
  expired: "Este enlace ha caducado",
  closed: "El expediente está cerrado",
} as const;

export function isPassportDocument(doc: Pick<CaseDocument, "key" | "label">): boolean {
  const k = (doc.key ?? "").toLowerCase();
  if (k === "passport" || k.includes("pasaport")) return true;
  const lab = (doc.label ?? "").toLowerCase();
  return lab.includes("pasaport") || lab.includes("passport");
}

/** Normaliza token desde respuesta API (alias magicLinkToken). */
export function resolveMagicToken(c: Pick<Case, "magicToken" | "magicLinkToken"> | null | undefined): string {
  if (!c) return "";
  return (c.magicToken ?? c.magicLinkToken ?? "").trim();
}

/** Convierte un expediente completo en fila de listado (tras crear o refrescar). */
export function caseToListItem(c: Case): CaseListItem {
  return {
    id: c.id,
    clientName: c.clientName ?? c.fullName ?? "",
    clientEmail: c.clientEmail ?? c.email,
    clientPhone: c.clientPhone ?? c.phone ?? null,
    progress: typeof c.progress === "number" ? c.progress : 0,
    magicToken: resolveMagicToken(c) || undefined,
    magicExpiresAt: c.magicExpiresAt ?? null,
    magicLinkUrl: c.magicLinkUrl ?? null,
    reviewStatus: c.reviewStatus ?? "pending",
    caseType: c.caseType,
    caseTypeLabel: c.caseTypeLabel,
    updatedAt: c.updatedAt ?? c.createdAt ?? new Date().toISOString(),
    documentsCount: c.documents?.length ?? 0,
    hasRejectedDocuments: c.hasRejectedDocuments,
  };
}

/** Normaliza GET /api/cases. */
export function parseCasesListResponse(body: unknown): CaseListItem[] {
  if (!body || typeof body !== "object") return [];
  const o = body as Record<string, unknown>;
  const raw = o.cases ?? o.data;
  if (!Array.isArray(raw)) return [];
  return raw.filter((row): row is CaseListItem => !!row && typeof row === "object" && typeof (row as CaseListItem).id === "string");
}

/** Normaliza GET /api/cases/:id y POST /api/cases. */
export function parseCaseDetailResponse(body: unknown): Case | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const candidate = (o.case ?? o) as Record<string, unknown>;
  if (typeof candidate.id !== "string") return null;
  return candidate as Case;
}

/** URL del portal: preferir magicLinkUrl del API si viene. */
export function resolvePortalUrl(origin: string, c: Pick<Case, "magicLinkUrl" | "magicToken" | "magicLinkToken">): string {
  const fromApi = c.magicLinkUrl?.trim();
  if (fromApi) return fromApi;
  const token = resolveMagicToken(c);
  if (!token) return "";
  const base = origin.replace(/\/$/, "");
  return `${base}/portal/${encodeURIComponent(token)}`;
}
