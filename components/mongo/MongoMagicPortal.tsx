"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Download, FileWarning, Loader2, Upload } from "lucide-react";
import { apiUrl } from "@/lib/api/apiUrl";
import {
  extractionErrorHint,
  ingestionStatusLabel,
  isCaseDocumentUploadEnabled,
  isPassportDocument,
  MAGIC_PORTAL_ERRORS,
  normalizeExtractedData,
  type CaseDocument,
  type MagicPortalResponse,
} from "@/lib/api/caseTypes";
import { validateUploadForPortal } from "@/lib/portal/validateUploadFile";
import { PortalMagicSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Doc = CaseDocument;

type Props = { token: string };

function isPassportSlot(d: Doc): boolean {
  return isPassportDocument(d);
}

function DocUploadZone({
  busy,
  busyHint,
  label,
  onFile,
}: {
  busy: boolean;
  /** Mensaje largo mientras el servidor procesa (IA + PDF). */
  busyHint?: string;
  label: string;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);

  const openPicker = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const handleFiles = (list: FileList | null) => {
    const f = list?.[0];
    if (f) onFile(f);
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        disabled={busy}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-label="Arrastra un archivo aquí o pulsa para elegir desde el dispositivo"
        aria-busy={busy}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          openPicker();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragOver(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragOver(false);
          if (busy) return;
          handleFiles(e.dataTransfer.files);
        }}
        className="rounded-xl border border-dashed px-4 py-8 text-center outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pw-bg)]"
        style={{
          borderColor: dragOver ? "var(--pw-accent)" : "var(--pw-border)",
          background: dragOver ? "var(--pw-accent-dim)" : "var(--pw-surface-2)",
          boxShadow: dragOver ? "0 0 0 1px var(--pw-accent)" : "none",
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.7 : 1,
        }}
      >
        <Upload className="mx-auto mb-2 opacity-80" size={28} style={{ color: "var(--pw-accent)" }} aria-hidden />
        {busy && busyHint ? (
          <>
            <Loader2 className="mx-auto mb-2 size-7 animate-spin" style={{ color: "var(--pw-accent)" }} aria-hidden />
            <p className="m-0 mb-1 text-sm font-medium" style={{ color: "var(--pw-text)" }}>
              Procesando documento…
            </p>
            <p className="m-0 mb-3 px-1 text-xs leading-relaxed" style={{ color: "var(--pw-accent)" }}>
              {busyHint}
            </p>
          </>
        ) : (
          <>
            <p className="m-0 mb-1 text-sm font-medium" style={{ color: "var(--pw-text)" }}>
              {busy ? "Subiendo archivo…" : "Arrastra y suelta el archivo"}
            </p>
            <p className="m-0 mb-3 text-xs" style={{ color: "var(--pw-muted)" }}>
              PDF o imagen · suelta sobre esta zona o elige con el botón
            </p>
          </>
        )}
        <button
          type="button"
          disabled={busy}
          className="pathway-btn pathway-btn-primary text-xs py-2 px-4"
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
        >
          {label}
        </button>
      </div>
    </div>
  );
}

export function MongoMagicPortal({ token }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<{
    clientName: string;
    progress: number;
    reviewStatus: string;
    feedbackMessage: string;
    hasFinalPdf: boolean;
    finalPdfUrl: string | null;
    documents: Doc[];
    agency: { name: string; logoUrl: string };
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [errStatus, setErrStatus] = useState<number | undefined>();
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(apiUrl(`/api/magic/${encodeURIComponent(token)}`));
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      setErrStatus(r.status);
      if (r.status === 410) {
        const msg = j.error ?? "";
        setErr(msg.includes("cerrado") ? MAGIC_PORTAL_ERRORS.closed : MAGIC_PORTAL_ERRORS.expired);
      } else if (r.status === 404) setErr(MAGIC_PORTAL_ERRORS.invalid);
      else setErr(j.error ?? "No se pudo cargar el expediente.");
      return;
    }
    const j = (await r.json()) as MagicPortalResponse;
    setData({
      clientName: j.case.clientName,
      progress: j.case.progress,
      reviewStatus: (j.case.reviewStatus ?? "pending").toLowerCase(),
      feedbackMessage: j.case.feedbackMessage ?? "",
      hasFinalPdf: Boolean(j.case.hasFinalPdf),
      finalPdfUrl: j.case.finalPdfUrl ?? null,
      documents: j.case.documents,
      agency: j.agency,
    });
    setErr(null);
    setErrStatus(undefined);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const IA_HINT = "Procesando con IA… Leyendo el pasaporte y generando el PDF. No cierres esta pestaña.";

  const uploadFile = async (docId: string, file: File) => {
    const doc = data?.documents.find((x) => x.id === docId);
    if (!doc || !isCaseDocumentUploadEnabled(doc.key)) return;

    const validation = await validateUploadForPortal(file);
    if (!validation.ok) {
      toast(validation.error, "error");
      return;
    }

    const passport = isPassportSlot(doc);

    setBusy(docId);
    const fd = new FormData();
    fd.set("file", file);
    if (!passport) {
      fd.set("docId", docId);
    }

    const url = passport
      ? apiUrl(`/api/magic/${encodeURIComponent(token)}/upload-passport`)
      : apiUrl(`/api/magic/${encodeURIComponent(token)}/upload`);

    try {
      const r = await fetch(url, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        toast(j.error ?? "Error al subir el archivo", "error");
        return;
      }
      toast("Documento subido correctamente", "success");
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (err) {
    const expired = errStatus === 410;
    return (
      <div className="portal-magic-surface flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="pathway-card w-full max-w-md border p-8" style={{ borderColor: "var(--pw-border)" }}>
          {expired ? (
            <Clock size={40} className="mx-auto mb-4" style={{ color: "var(--pw-warning)" }} />
          ) : (
            <FileWarning size={40} className="mx-auto mb-4 text-red-500" />
          )}
          <p className="m-0 mb-2 text-lg font-semibold" style={{ color: "var(--pw-text)" }}>
            {err}
          </p>
          <p className="m-0 mb-6 text-sm leading-relaxed" style={{ color: "var(--pw-muted)" }}>
            {expired
              ? err === MAGIC_PORTAL_ERRORS.closed
                ? "Este expediente ya está cerrado. Si necesitas enviar más documentación, contacta con tu despacho."
                : "Pide a tu gestor un enlace nuevo desde el panel del expediente."
              : "Comprueba que el enlace esté completo o pégalo de nuevo."}
          </p>
          <Link href="/acceso" className="pathway-btn pathway-btn-primary inline-flex no-underline">
            Pegar otro enlace
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return <PortalMagicSkeleton />;
  }

  const first = data.clientName.trim().split(/\s+/)[0];
  const caseRejected = data.reviewStatus === "rejected";
  const caseApproved = data.reviewStatus === "approved";
  const pdfHref = data.finalPdfUrl?.trim() || null;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto w-full px-4 py-8 pb-16 portal-magic-surface">
      <header className="mb-6 text-center">
        {data.agency.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.agency.logoUrl} alt={data.agency.name} className="h-12 mx-auto mb-4 object-contain" />
        ) : (
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4 text-lg font-bold"
            style={{ background: "var(--pw-accent-dim)", color: "var(--pw-accent)" }}
          >
            {data.agency.name.slice(0, 1)}
          </div>
        )}
        <p className="text-sm m-0" style={{ color: "var(--pw-muted)" }}>
          {data.agency.name}
        </p>
        <h1 className="text-2xl font-bold mt-1 m-0">Hola{first ? `, ${first}` : ""}</h1>
        <p className="text-xs mt-2 m-0" style={{ color: "var(--pw-muted)" }}>
          Progreso documental: {data.progress}%
        </p>
      </header>

      {caseRejected && data.feedbackMessage ? (
        <div
          className="mb-4 rounded-2xl border p-4 flex gap-3 items-start"
          style={{ borderColor: "var(--pw-danger)", background: "var(--pw-danger-dim)" }}
          role="alert"
        >
          <AlertCircle size={20} className="shrink-0 mt-0.5" style={{ color: "var(--pw-danger)" }} />
          <div>
            <p className="m-0 text-sm font-semibold" style={{ color: "var(--pw-text)" }}>
              Tu expediente necesita cambios
            </p>
            <p className="m-0 mt-1 text-sm leading-relaxed" style={{ color: "var(--pw-danger)" }}>
              {data.feedbackMessage}
            </p>
            <p className="m-0 mt-2 text-xs" style={{ color: "var(--pw-muted)" }}>
              Revisa los documentos marcados abajo y vuelve a subirlos.
            </p>
          </div>
        </div>
      ) : null}

      {caseApproved ? (
        <div
          className="mb-4 rounded-2xl border p-4"
          style={{ borderColor: "var(--pw-success)", background: "var(--pw-success-dim)" }}
        >
          <p className="m-0 text-sm font-semibold flex items-center gap-2" style={{ color: "var(--pw-success)" }}>
            <CheckCircle2 size={18} />
            Expediente aprobado
          </p>
          <p className="m-0 mt-1 text-xs leading-relaxed" style={{ color: "var(--pw-muted)" }}>
            Tu gestor ha revisado la documentación. {pdfHref ? "Puedes descargar el PDF oficial." : "Te contactará si hace falta algo más."}
          </p>
          {pdfHref ? (
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="pathway-btn pathway-btn-primary mt-3 inline-flex text-xs no-underline"
            >
              <Download className="size-4" />
              Descargar PDF
            </a>
          ) : null}
        </div>
      ) : null}

      <ul className="space-y-3 m-0 p-0 list-none mb-8">
        {data.documents.map((d) => {
          const locked = d.status === "approved";
          const rejected = d.status === "rejected";
          const review = d.status === "pending" && d.hasFile;
          const fileUrl =
            d.hasFile && d.filePath
              ? `${apiUrl(`/api/files/${d.filePath.split("/").map(encodeURIComponent).join("/")}`)}?token=${encodeURIComponent(token)}`
              : "";

          return (
            <li
              key={d.id}
              className="rounded-2xl border p-4"
              style={{
                borderColor: rejected ? "var(--pw-danger)" : "var(--pw-border)",
                background: rejected ? "rgba(220,38,38,0.06)" : "var(--pw-surface)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm m-0 flex items-center gap-2">
                  {d.label}
                  {locked && <CheckCircle2 size={16} className="text-green-600 shrink-0" />}
                </p>
              </div>
              {rejected && d.feedbackMessage ? (
                <div
                  className="mt-3 text-xs rounded-xl p-3 flex gap-2 items-start"
                  style={{ background: "rgba(220,38,38,0.1)", color: "var(--pw-danger)" }}
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="m-0 font-medium">Corrección solicitada</p>
                    <p className="m-0 mt-1">{d.feedbackMessage}</p>
                  </div>
                </div>
              ) : null}
              {review && (
                <p className="text-xs mt-2 m-0 flex items-center gap-1" style={{ color: "var(--pw-muted)" }}>
                  <Clock size={14} />
                  En revisión por la agencia…
                </p>
              )}
              {d.extractedData || d.ingestionStatus ? (
                <div className="mt-2 space-y-1">
                  <p className="text-xs m-0" style={{ color: "var(--pw-muted)" }}>
                    {d.ingestionStatus
                      ? `Extracción: ${ingestionStatusLabel(d.ingestionStatus)}`
                      : (() => {
                          const norm = normalizeExtractedData(d.extractedData, {
                            documentType: d.key,
                            documentId: d.id,
                            caseId: "",
                          });
                          return norm ? `Extracción: ${ingestionStatusLabel(norm.ingestionStatus)}` : null;
                        })()}
                  </p>
                  {extractionErrorHint(d.extractedData, d.ingestionStatus) ? (
                    <p className="text-xs m-0 leading-relaxed" style={{ color: "var(--pw-warn)" }}>
                      {extractionErrorHint(d.extractedData, d.ingestionStatus)}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {locked && d.hasFile && fileUrl && (
                <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs mt-2 inline-block" style={{ color: "var(--pw-accent)" }}>
                  Ver archivo enviado
                </a>
              )}
              {!locked && isCaseDocumentUploadEnabled(d.key) ? (
                <DocUploadZone
                  busy={busy === d.id}
                  busyHint={isPassportSlot(d) ? IA_HINT : undefined}
                  label={d.hasFile || rejected ? "Subir otro archivo" : "Elegir archivo"}
                  onFile={(file) => void uploadFile(d.id, file)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <footer className="mt-12 text-center text-[10px]" style={{ color: "var(--pw-muted)" }}>
        Enlace seguro. No lo compartas.
      </footer>
    </div>
  );
}
