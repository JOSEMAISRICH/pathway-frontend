"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import {
  EDITABLE_IDENTITY_KEYS,
  EXTRACTED_FIELD_LABELS,
  ingestionStatusLabel,
  listExtractedFieldRows,
  needsManualReview,
  normalizeExtractedData,
  type ExtractedData,
} from "@/lib/api/extractedData";
import { patchDocumentExtractedData } from "@/lib/api/patchExtractedData";

type Props = {
  raw: unknown;
  documentType: string;
  documentId: string;
  caseId: string;
  title?: string;
  /** Tras guardar corrección manual (refrescar expediente). */
  onUpdated?: (payload: { extractedData: unknown; case: unknown }) => void;
};

function statusColor(status: string): string {
  if (status === "extracted") return "var(--pw-success)";
  if (status === "missing" || status === "low_confidence") return "var(--pw-warn)";
  return "var(--pw-muted)";
}

function draftFromData(data: ExtractedData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of EDITABLE_IDENTITY_KEYS) {
    const f = data.fields[key as keyof typeof data.fields];
    if (f && typeof f === "object" && "value" in f && f.value != null) {
      out[key] = String(f.value);
    } else {
      out[key] = "";
    }
  }
  return out;
}

export function ExtractedDataPanel({
  raw,
  documentType,
  documentId,
  caseId,
  title = "Datos extraídos (IA)",
  onUpdated,
}: Props) {
  const data = useMemo(
    () => normalizeExtractedData(raw, { documentType, documentId, caseId }),
    [raw, documentType, documentId, caseId],
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const startEdit = useCallback(() => {
    if (!data) return;
    setDraft(draftFromData(data));
    setSaveErr(null);
    setEditing(true);
  }, [data]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setSaveErr(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!documentId) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const fields: Record<string, string> = {};
      for (const key of EDITABLE_IDENTITY_KEYS) {
        const v = draft[key]?.trim();
        if (v) fields[key] = v;
        else fields[key] = "";
      }
      const res = await patchDocumentExtractedData(caseId, documentId, fields);
      setEditing(false);
      onUpdated?.({ extractedData: res.extractedData, case: res.case });
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }, [caseId, documentId, draft, onUpdated]);

  if (!data) return null;

  const rows = listExtractedFieldRows(data);
  const review = needsManualReview(data);
  const canEdit = Boolean(documentId && onUpdated);

  return (
    <section
      className="pathway-card border-2 p-5"
      style={{ borderColor: review ? "var(--pw-warn)" : "var(--pw-accent)" }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-lg font-semibold">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              background: review ? "var(--pw-warning-dim)" : "var(--pw-success-dim)",
              color: review ? "var(--pw-warn)" : "var(--pw-success)",
            }}
          >
            {ingestionStatusLabel(data.ingestionStatus)}
          </span>
          {canEdit && !editing ? (
            <button type="button" className="pathway-btn pathway-btn-ghost text-xs py-1 px-2" onClick={startEdit}>
              <Pencil className="size-3.5" />
              Corregir
            </button>
          ) : null}
        </div>
      </div>

      {review && !editing ? (
        <p className="m-0 mb-4 text-xs" style={{ color: "var(--pw-warn)" }}>
          Algunos campos requieren revisión manual. Pulsa <strong>Corregir</strong> para completarlos.
        </p>
      ) : !editing ? (
        <p className="m-0 mb-4 text-xs text-[var(--pw-muted)]">Revísalos antes de aprobar el expediente.</p>
      ) : null}

      {editing ? (
        <div className="space-y-3">
          <p className="m-0 text-xs text-[var(--pw-muted)]">Los cambios se marcan como revisión manual del despacho.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {EDITABLE_IDENTITY_KEYS.map((key) => (
              <label key={key} className="block text-sm">
                <span className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--pw-muted)]">
                  {EXTRACTED_FIELD_LABELS[key]}
                </span>
                <input
                  type="text"
                  className="pathway-input w-full"
                  value={draft[key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                  disabled={saving}
                />
              </label>
            ))}
          </div>
          {saveErr ? (
            <p className="m-0 text-sm text-[var(--pw-danger)]" role="alert">
              {saveErr}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="pathway-btn pathway-btn-primary" disabled={saving} onClick={() => void saveEdit()}>
              <Save className="size-4" />
              {saving ? "Guardando…" : "Guardar corrección"}
            </button>
            <button type="button" className="pathway-btn pathway-btn-ghost" disabled={saving} onClick={cancelEdit}>
              <X className="size-4" />
              Cancelar
            </button>
          </div>
        </div>
      ) : data.ingestionStatus === "error" && rows.length === 0 ? (
        <p className="m-0 text-sm" style={{ color: "var(--pw-warn)" }}>
          No se pudieron leer datos del documento. Corrígelos a mano o pide al cliente que vuelva a subir.
          {data.errors?.[0]?.message ? ` (${data.errors[0].message})` : null}
        </p>
      ) : rows.length === 0 ? (
        <p className="m-0 text-sm text-[var(--pw-muted)]">Sin campos estructurados todavía.</p>
      ) : (
        <dl className="m-0 grid gap-2 text-sm sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.key} className="rounded-lg p-3" style={{ background: "var(--pw-surface-2)" }}>
              <dt className="m-0 mb-1 text-[10px] uppercase tracking-wide text-[var(--pw-muted)]">{row.label}</dt>
              <dd className="m-0 break-words font-medium">{row.value}</dd>
              <dd className="m-0 mt-1 text-[10px] font-medium" style={{ color: statusColor(row.status) }}>
                {row.status === "extracted" ? "OK" : row.status === "missing" ? "Pendiente revisión" : row.status}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {data.raw?.aiNotes && !editing ? (
        <p className="m-0 mt-4 text-xs text-[var(--pw-muted)]">
          <strong>Notas IA:</strong> {data.raw.aiNotes}
        </p>
      ) : null}
    </section>
  );
}
