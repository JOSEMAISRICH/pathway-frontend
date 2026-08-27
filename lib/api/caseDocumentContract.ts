/** Re-export del contrato API. Preferir `@/lib/api/caseTypes`. */
export {
  DEFAULT_CASE_DOCUMENT_SLOTS,
  isCaseDocumentUploadEnabled,
  isPassportDocument,
  type CaseDocument,
  type CaseDocumentKey,
  type DocumentIngestionStatus,
  type ExtractedData,
} from "@/lib/api/caseTypes";
export { normalizeExtractedData, ingestionStatusLabel } from "@/lib/api/extractedData";
