"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { prefetchCaseDetailPage } from "@/lib/dashboard/prefetchCaseDetail";
import { ChevronRight, Copy, Download, ExternalLink, Loader2, MessageSquare, MoreHorizontal } from "lucide-react";
import { downloadCaseFinalPdf } from "@/lib/api/casePdf";
import { buildClientInviteMessage, copyText } from "@/lib/portal/magicLink";
import { useToast } from "@/components/ui/Toast";
type Props = {
  caseId: string;
  clientName: string;
  hasLink: boolean;
  portalUrl: string;
  pdfApproved: boolean;
  onCopied?: () => void;
};

export function CaseRowActions({ caseId, clientName, hasLink, portalUrl, pdfApproved, onCopied }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    prefetchCaseDetailPage();
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function copyLink() {
    if (!portalUrl) return;
    if (await copyText(portalUrl)) {
      toast("Enlace copiado al portapapeles", "success");
      onCopied?.();
    } else toast("No se pudo copiar el enlace", "error");
    setOpen(false);
  }

  async function copyMessage() {
    if (!portalUrl) return;
    const text = buildClientInviteMessage(clientName, portalUrl);
    if (await copyText(text)) toast("Mensaje copiado (listo para WhatsApp o email)", "success");
    else toast("No se pudo copiar", "error");
    setOpen(false);
  }

  async function downloadPdf() {
    setPdfBusy(true);
    const res = await downloadCaseFinalPdf(caseId);
    setPdfBusy(false);
    setOpen(false);
    if (!res.ok) toast(res.error, "error");
    else toast("PDF descargado", "success");
  }

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => router.push(`/dashboard/cases/${caseId}#documentos`)}
        className="pathway-btn pathway-btn-primary py-2 px-3 text-xs no-underline"
        title={`Ver documentos de ${clientName}`}
      >
        Ver expediente
        <ChevronRight className="size-3.5" />
      </button>
      <div className="relative" ref={ref}>
        <button
          type="button"
          className="pathway-btn pathway-btn-ghost p-2"
          aria-label="Más acciones"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <MoreHorizontal className="size-4" />
        </button>
        {open ? (
          <div
            className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border py-1 shadow-xl"
            style={{ borderColor: "var(--pw-border)", background: "var(--pw-surface)" }}
            role="menu"
          >
            {hasLink ? (
              <>
                <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--pw-surface-2)]" onClick={() => void copyLink()}>
                  <Copy className="size-3.5" />
                  Copiar enlace
                </button>
                <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--pw-surface-2)]" onClick={() => void copyMessage()}>
                  <MessageSquare className="size-3.5" />
                  Copiar mensaje para cliente
                </button>
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs no-underline text-[var(--pw-text)] hover:bg-[var(--pw-surface-2)]"
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink className="size-3.5" />
                  Abrir portal cliente
                </a>
              </>
            ) : (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-xs text-[var(--pw-muted)] hover:bg-[var(--pw-surface-2)]"
                onClick={() => {
                  setOpen(false);
                  prefetchCaseDetailPage();
                  router.push(`/dashboard/cases/${encodeURIComponent(caseId)}#acceso`);
                }}
              >
                Generar enlace de acceso
              </button>
            )}
            {pdfApproved ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--pw-surface-2)]"
                disabled={pdfBusy}
                onClick={() => void downloadPdf()}
              >
                {pdfBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                Descargar PDF
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
