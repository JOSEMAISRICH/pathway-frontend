"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, ClipboardList, FileText, KeyRound, Scale, X } from "lucide-react";
import { apiUrl } from "@/lib/api/apiUrl";
import { caseSemaphore } from "@/lib/dashboard/caseStatus";
import { cn } from "@/lib/utils/cn";
import { MagicLinkAccessPanel } from "@/components/dashboard/MagicLinkAccessPanel";
import { CaseChecklistPanel } from "@/components/dashboard/CaseChecklistPanel";
import { RejectDocModal } from "@/components/agency/RejectDocModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

import type { Case, CaseDocument } from "@/lib/api/caseTypes";
import { flattenExtractedForLegacy, ingestionStatusLabel, normalizeExtractedData, parseCaseDetailResponse, shouldShowExtractedDataPanel } from "@/lib/api/caseTypes";
import { ExtractedDataPanel } from "@/components/dashboard/ExtractedDataPanel";
import { PdfPreview } from "@/components/dashboard/PdfPreview";
import { countUploadedDocuments, documentHasFile, reviewCaseDocument, allUploadedDocumentsApproved, countApprovedDocuments } from "@/lib/api/reviewCaseDocument";
import { isCasePdfAvailable } from "@/lib/api/casePdf";
import { DownloadCasePdfButton } from "@/components/dashboard/DownloadCasePdfButton";

type TabId = "documentos" | "checklist" | "acceso" | "revision";

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "checklist", label: "Checklist", icon: ClipboardList },
  { id: "acceso", label: "Acceso cliente", icon: KeyRound },
  { id: "revision", label: "Revisión y PDF", icon: Scale },
];

type CasePayload = Case & { clientEmail: string; documents: CaseDocument[] };

function caseCacheKey(id: string) {
  return `pw:case:${id}`;
}

function readCachedCase(id: string): Case | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(caseCacheKey(id));
    if (!raw) return null;
    return parseCaseDetailResponse(JSON.parse(raw));
  } catch {
    return null;
  }
}

function toCasePayload(c: Case): CasePayload {
  return {
    ...c,
    clientEmail: c.clientEmail ?? c.email ?? "",
    documents: Array.isArray(c.documents) ? c.documents : [],
  };
}

function pickExtractedPayload(data: CasePayload): Record<string, unknown> | null {
  const root = data.extractedData;
  if (root && typeof root === "object") {
    const norm = normalizeExtractedData(root, {
      documentType: "passport",
      documentId: "",
      caseId: data.id,
    });
    if (norm) return flattenExtractedForLegacy(norm);
    if (Object.keys(root as object).length > 0) return root as Record<string, unknown>;
  }
  const passportish = data.documents.find((d) => {
    const k = (d.key ?? "").toLowerCase();
    const lab = (d.label ?? "").toLowerCase();
    return k.includes("passport") || k.includes("pasaport") || lab.includes("pasaport") || lab.includes("passport");
  });
  if (passportish?.extractedData) {
    const norm = normalizeExtractedData(passportish.extractedData, {
      documentType: passportish.key,
      documentId: passportish.id,
      caseId: data.id,
    });
    if (norm) return flattenExtractedForLegacy(norm);
    return passportish.extractedData as Record<string, unknown>;
  }
  return null;
}

function pickPassportDocument(data: CasePayload): CaseDocument | undefined {
  return data.documents.find((d) => {
    const k = (d.key ?? "").toLowerCase();
    const lab = (d.label ?? "").toLowerCase();
    return k.includes("passport") || k.includes("pasaport") || lab.includes("pasaport") || lab.includes("passport");
  });
}

function formatExtractedLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseTabFromHash(): TabId {
  if (typeof window === "undefined") return "documentos";
  const h = window.location.hash.replace("#", "");
  if (h === "acceso" || h === "revision" || h === "documentos" || h === "checklist") return h;
  return "documentos";
}

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const caseId = typeof params.caseId === "string" ? params.caseId : "";

  const [data, setData] = useState<CasePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("documentos");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [reviewInlineErr, setReviewInlineErr] = useState<string | null>(null);
  const [clientPhoneInput, setClientPhoneInput] = useState("");
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectDocLabel, setRejectDocLabel] = useState("");
  const [docReviewBusy, setDocReviewBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caseId) return;
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch(apiUrl(`/api/cases/${caseId}`), { credentials: "include" });
      if (r.status === 401) {
        setLoading(false);
        router.replace("/sign-in");
        return;
      }
      if (r.status === 404) {
        const cached = readCachedCase(caseId);
        if (cached) {
          setData(toCasePayload(cached));
          setClientPhoneInput(cached.clientPhone?.trim() ?? "");
          setLoading(false);
          return;
        }
        setErr("Expediente no encontrado");
        setData(null);
        setLoading(false);
        return;
      }
      if (r.status === 503) {
        setErr("Los datos del despacho no están disponibles ahora.");
        setData(null);
        setLoading(false);
        return;
      }
      if (!r.ok) {
        const cached = readCachedCase(caseId);
        if (cached) {
          setData(toCasePayload(cached));
          setClientPhoneInput(cached.clientPhone?.trim() ?? "");
          setLoading(false);
          return;
        }
        setErr(`Error al cargar el expediente (${r.status})`);
        setData(null);
        setLoading(false);
        return;
      }
      const j = (await r.json()) as unknown;
      const picked = parseCaseDetailResponse(j);
      if (!picked) {
        const cached = readCachedCase(caseId);
        if (cached) {
          setData(toCasePayload(cached));
          setClientPhoneInput(cached.clientPhone?.trim() ?? "");
          setLoading(false);
          return;
        }
        setErr("Respuesta del servidor incompleta");
        setData(null);
        setLoading(false);
        return;
      }
      setData(toCasePayload(picked));
      setClientPhoneInput(picked.clientPhone?.trim() ?? "");
      setLoading(false);
    } catch {
      const cached = readCachedCase(caseId);
      if (cached) {
        setData(toCasePayload(cached));
        setClientPhoneInput(cached.clientPhone?.trim() ?? "");
        setLoading(false);
        return;
      }
      setErr("Error de conexión al cargar el expediente");
      setData(null);
      setLoading(false);
    }
  }, [caseId, router]);

  const handleExtractedUpdated = useCallback(
    (payload: { case: unknown }) => {
      const picked = parseCaseDetailResponse(payload.case);
      if (!picked) return;
      setData(toCasePayload(picked));
      try {
        sessionStorage.setItem(caseCacheKey(caseId), JSON.stringify(picked));
      } catch {
        /* quota */
      }
      toast("Datos del pasaporte actualizados");
    },
    [caseId, toast],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setTab(parseTabFromHash());
    const onHash = () => setTab(parseTabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function selectTab(id: TabId) {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
    if (id === "documentos") {
      requestAnimationFrame(() => document.getElementById("documentos")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function fileUrl(rel: string): string {
    const parts = rel.split("/").filter(Boolean);
    return apiUrl(`/api/files/${parts.map(encodeURIComponent).join("/")}`);
  }

  async function submitDocReview(docId: string, decision: "approved" | "reject", reason?: string) {
    if (!caseId) return;
    setDocReviewBusy(docId);
    const res = await reviewCaseDocument(caseId, docId, decision === "approved" ? "approved" : "rejected", reason);
    setDocReviewBusy(null);
    if (!res.ok) {
      toast(res.error ?? "Error al revisar documento", "error");
      return;
    }
    toast(decision === "approved" ? "Documento aprobado" : "Documento rechazado — el cliente verá tu mensaje", "success");
    await load();
  }

  async function submitReview(decision: "approve" | "reject") {
    if (!caseId) return;
    setReviewInlineErr(null);
    if (decision === "reject") {
      const msg = feedbackMessage.trim();
      if (msg.length < 3) {
        setReviewInlineErr("Escribe un mensaje claro para el cliente (mín. 3 caracteres).");
        return;
      }
    }
    setReviewBusy(true);
    try {
      const r = await fetch(apiUrl(`/api/cases/${caseId}/review`), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          decision === "approve"
            ? { reviewStatus: "approved" }
            : { reviewStatus: "rejected", feedbackMessage: feedbackMessage.trim() },
        ),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setReviewInlineErr(j.error ?? "No se pudo guardar la revisión.");
        return;
      }
      setRejectOpen(false);
      setFeedbackMessage("");
      toast(decision === "approve" ? "Expediente aprobado" : "Expediente rechazado", "success");
      await load();
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) {
    return <TableSkeleton rows={4} />;
  }

  if (err || !data) {
    return (
      <div>
        <p className="text-[var(--pw-danger)]">{err ?? "Sin datos"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="pathway-btn pathway-btn-primary" onClick={() => void load()}>
            Reintentar
          </button>
          <Link href="/dashboard" className="pathway-btn pathway-btn-ghost inline-flex no-underline">
            Volver a expedientes
          </Link>
        </div>
      </div>
    );
  }

  const extracted = pickExtractedPayload(data);
  const review = (data.reviewStatus ?? "pending").toLowerCase();
  const canReview = review === "pending";
  const caseApproved = review === "approved";
  const pdfAvailable = isCasePdfAvailable(data);
  const docsApproved = allUploadedDocumentsApproved(data.documents);
  const approvedCount = countApprovedDocuments(data.documents);
  const uploadedCount = countUploadedDocuments(data.documents);
  const sem = caseSemaphore({
    progress: data.progress,
    reviewStatus: data.reviewStatus,
    hasRejectedDocuments:
      data.documents.some((d) => (d.status ?? "").toLowerCase() === "rejected") || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--pw-muted)] no-underline hover:text-[var(--pw-accent)]"
          >
            <ArrowLeft className="size-3.5" />
            Expedientes
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2
              className="m-0 text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}
            >
              {data.clientName}
            </h2>
            <StatusBadge state={sem} progress={data.progress} />
          </div>
          <p className="m-0 mt-2 text-sm text-[var(--pw-muted)]">
            {data.caseTypeLabel || data.caseType || "Expediente"}
            {" · "}
            {data.clientEmail || "Sin email"} · Progreso {data.progress}%
            {data.documents.length > 0
              ? ` · ${countUploadedDocuments(data.documents)}/${data.documents.length} documentos subidos`
              : ""}
          </p>
        </div>
      </div>

      <nav className="-mb-2 flex gap-1 overflow-x-auto border-b" style={{ borderColor: "var(--pw-border)" }} aria-label="Secciones del expediente">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors -mb-px",
              tab === id
                ? "border-[var(--pw-accent)] text-[var(--pw-text)]"
                : "border-transparent text-[var(--pw-muted)] hover:text-[var(--pw-text)]",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {tab === "documentos" && (
        <div id="documentos" className="scroll-mt-4 space-y-4">
          {data.documents.length === 0 ? (
            <div className="pathway-card p-8 text-center text-sm text-[var(--pw-muted)]">
              Aún no hay documentos configurados para este expediente.
            </div>
          ) : (
            data.documents.map((d) => {
              const hasFile = documentHasFile(d);
              const preview = hasFile && d.filePath ? fileUrl(d.filePath) : "";
              const isImage = /\.(png|jpe?g|gif|webp)$/i.test(d.originalName || d.filePath);
              const isPdf = /\.pdf$/i.test(d.originalName || d.filePath);
              const docStatus = (d.status ?? "pending").toLowerCase();
              const canReviewDoc = hasFile && docStatus !== "approved" && (data.reviewStatus ?? "pending").toLowerCase() === "pending";

              return (
                <section key={d.id} className="pathway-card p-5">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="m-0 text-lg font-semibold">{d.label}</h3>
                      <p className="m-0 mt-1 text-xs text-[var(--pw-muted)]">
                        Estado: <strong className="text-[var(--pw-text)]">{d.status}</strong>
                        {d.ingestionStatus ? (
                          <>
                            {" "}
                            · Ingesta: <strong className="text-[var(--pw-text)]">{ingestionStatusLabel(d.ingestionStatus)}</strong>
                          </>
                        ) : null}
                        {d.originalName ? ` · ${d.originalName}` : ""}
                      </p>
                      {d.feedbackMessage ? (
                        <p
                          className="m-0 mt-2 rounded-lg p-2 text-sm"
                          style={{
                            background: docStatus === "rejected" ? "var(--pw-danger-dim)" : "var(--pw-warning-dim)",
                            color: docStatus === "rejected" ? "var(--pw-danger)" : "var(--pw-warning)",
                          }}
                        >
                          {d.feedbackMessage}
                        </p>
                      ) : null}
                    </div>
                    {canReviewDoc ? (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          className="pathway-btn pathway-btn-primary py-2 text-xs"
                          disabled={docReviewBusy === d.id}
                          onClick={() => void submitDocReview(d.id, "approved")}
                        >
                          <Check className="size-3.5" />
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className="pathway-btn pathway-btn-ghost py-2 text-xs"
                          disabled={docReviewBusy === d.id}
                          onClick={() => {
                            setRejectDocId(d.id);
                            setRejectDocLabel(d.label);
                          }}
                        >
                          <X className="size-3.5" />
                          Rechazar
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {hasFile ? (
                    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--pw-border)", maxHeight: 400 }}>
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={preview}
                          alt={d.label}
                          loading="lazy"
                          decoding="async"
                          className="max-h-[400px] w-full object-contain bg-black/5"
                        />
                      ) : isPdf ? (
                        <PdfPreview src={preview} title={d.label} />
                      ) : (
                        <a href={preview} target="_blank" rel="noreferrer" className="block p-4 text-sm text-[var(--pw-accent)]">
                          Abrir archivo
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="m-0 text-sm text-[var(--pw-muted)]">Pendiente de subida por el cliente.</p>
                  )}
                  {shouldShowExtractedDataPanel(d.extractedData, d.key, { documentId: d.id, caseId: data.id }) ? (
                    <div className="mt-4">
                      <ExtractedDataPanel
                        raw={d.extractedData}
                        documentType={d.key}
                        documentId={d.id}
                        caseId={data.id}
                        title={`Extracción — ${d.label}`}
                        onUpdated={handleExtractedUpdated}
                      />
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
        </div>
      )}

      {tab === "acceso" && (
        <div id="acceso" className="scroll-mt-4 space-y-4">
          <MagicLinkAccessPanel
            caseData={data}
            clientPhoneInput={clientPhoneInput}
            onClientPhoneChange={setClientPhoneInput}
            onCaseUpdated={(patch) => setData((prev) => (prev ? { ...prev, ...patch } : prev))}
          />
        </div>
      )}

      {tab === "checklist" && (
        <div id="checklist" className="scroll-mt-4">
          <div className="pathway-card border p-5" style={{ borderColor: "var(--pw-border)" }}>
            <CaseChecklistPanel items={data.checklist ?? []} caseTypeLabel={data.caseTypeLabel} />
          </div>
        </div>
      )}

      {tab === "revision" && (
        <div id="revision" className="scroll-mt-4 space-y-4">
          {(() => {
            const passportDoc = pickPassportDocument(data);
            const passportRaw = passportDoc?.extractedData ?? data.extractedData;
            if (!passportRaw) return null;
            return (
              <ExtractedDataPanel
                raw={passportRaw}
                documentType={passportDoc?.key ?? "passport"}
                documentId={passportDoc?.id ?? ""}
                caseId={data.id}
                onUpdated={handleExtractedUpdated}
              />
            );
          })()}
          {extracted ? (
            <section className="pathway-card border p-5 opacity-80" style={{ borderColor: "var(--pw-border)" }}>
              <h3 className="m-0 mb-3 text-sm font-semibold text-[var(--pw-muted)]">Vista resumida (legacy)</h3>
              <dl className="m-0 grid gap-2 text-sm sm:grid-cols-2">
                {Object.entries(extracted).map(([k, v]) => (
                  <div key={k} className="rounded-lg p-3" style={{ background: "var(--pw-surface-2)" }}>
                    <dt className="m-0 mb-1 text-[10px] uppercase tracking-wide text-[var(--pw-muted)]">{formatExtractedLabel(k)}</dt>
                    <dd className="m-0 break-words font-medium">
                      {v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {canReview && uploadedCount > 0 && !docsApproved ? (
            <div className="pathway-card p-4 text-sm" style={{ background: "var(--pw-warning-dim)", borderColor: "var(--pw-warning)" }}>
              <p className="m-0" style={{ color: "var(--pw-warning)" }}>
                Aprueba cada documento en la pestaña <strong>Documentos</strong> ({approvedCount}/{uploadedCount} aprobados) antes de cerrar el expediente.
              </p>
            </div>
          ) : null}

          {canReview && data.progress < 100 ? (
            <div className="pathway-card p-4 text-sm" style={{ background: "var(--pw-warning-dim)", borderColor: "var(--pw-warning)" }}>
              <p className="m-0" style={{ color: "var(--pw-warning)" }}>
                Documentación incompleta ({data.progress}%). Puedes revisar lo subido en Documentos; la aprobación final conviene cuando esté al 100%.
              </p>
            </div>
          ) : null}

          {canReview ? (
            <section className="pathway-card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="m-0 text-sm font-semibold">Revisión del expediente</p>
                <p className="m-0 mt-1 text-xs text-[var(--pw-muted)]">Aprueba o rechaza con un mensaje para el cliente.</p>
                {reviewInlineErr ? (
                  <p className="m-0 mt-2 text-sm text-[var(--pw-danger)]" role="alert">
                    {reviewInlineErr}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="pathway-btn pathway-btn-primary" disabled={reviewBusy} onClick={() => void submitReview("approve")}>
                  <Check className="size-4" />
                  Aprobar
                </button>
                <button type="button" className="pathway-btn pathway-btn-ghost" disabled={reviewBusy} onClick={() => setRejectOpen(true)}>
                  <X className="size-4" />
                  Rechazar
                </button>
              </div>
            </section>
          ) : (
            <div
              className="pathway-card p-4 text-sm"
              style={{
                borderColor: review === "approved" ? "var(--pw-success)" : "var(--pw-danger)",
                background: review === "approved" ? "var(--pw-success-dim)" : "var(--pw-danger-dim)",
              }}
            >
              <p className="m-0 font-medium">
                {review === "approved" ? "Expediente aprobado." : "Expediente rechazado. El cliente verá tu mensaje en el portal."}
              </p>
            </div>
          )}

          <section className="pathway-card p-5">
            <h3 className="m-0 mb-1 text-base font-semibold">PDF oficial</h3>
            <p className="m-0 mb-4 text-xs text-[var(--pw-muted)]">
              Se genera al <strong>aprobar el expediente</strong> (necesita datos del pasaporte o extracción manual en el backend).
            </p>
            {caseApproved && pdfAvailable ? (
              <DownloadCasePdfButton caseId={data.id} caseData={data} />
            ) : caseApproved && !pdfAvailable ? (
              <div className="space-y-3">
                <p className="m-0 text-sm" style={{ color: "var(--pw-warn)" }}>
                  Expediente aprobado, pero el PDF aún no está generado. Suele pasar si la extracción del pasaporte falló (p. ej. cuota OpenAI 429). Revisa el pasaporte en Documentos o vuelve a aprobar tras corregir datos.
                </p>
                <DownloadCasePdfButton caseId={data.id} caseData={data} label="Reintentar descarga" className="pathway-btn pathway-btn-ghost inline-flex text-xs" />
              </div>
            ) : (
              <button type="button" className="pathway-btn pathway-btn-ghost cursor-not-allowed opacity-60" disabled>
                Descargar PDF
              </button>
            )}
          </section>
        </div>
      )}

      {rejectOpen ? (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4"
          style={{ background: "rgba(6,8,12,0.72)" }}
          role="dialog"
          aria-modal="true"
          onClick={() => !reviewBusy && setRejectOpen(false)}
        >
          <div className="pathway-card max-w-md w-full border p-6 shadow-xl" style={{ borderColor: "var(--pw-border)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="m-0 mb-2 text-lg font-semibold">Motivo del rechazo</h3>
            <p className="m-0 mb-4 text-xs text-[var(--pw-muted)]">El cliente verá este mensaje en el portal.</p>
            <textarea
              className="pathway-input mb-4 min-h-[120px] resize-y"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Ej.: La foto del pasaporte no se lee bien."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="pathway-btn pathway-btn-ghost" disabled={reviewBusy} onClick={() => setRejectOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="pathway-btn pathway-btn-primary" disabled={reviewBusy} onClick={() => void submitReview("reject")}>
                Enviar rechazo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <RejectDocModal
        open={rejectDocId != null}
        title={rejectDocLabel ? `Rechazar: ${rejectDocLabel}` : "Motivo del rechazo"}
        onClose={() => setRejectDocId(null)}
        onConfirm={(reason) => {
          if (rejectDocId) void submitDocReview(rejectDocId, "reject", reason);
          setRejectDocId(null);
        }}
      />
    </div>
  );
}
