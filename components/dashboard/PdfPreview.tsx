"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

type Props = {
  src: string;
  title: string;
};

/**
 * Vista previa de PDF vía blob URL.
 * Evita que el navegador descargue el archivo cuando el API envía Content-Disposition: attachment.
 */
export function PdfPreview({ src, title }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    setLoading(true);
    setErr(false);
    setBlobUrl(null);

    void (async () => {
      try {
        const r = await fetch(src, { credentials: "include" });
        if (!r.ok) throw new Error(String(r.status));
        const blob = await r.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        revoked = url;
        setBlobUrl(url);
      } catch {
        if (!cancelled) setErr(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [src]);

  if (loading) {
    return (
      <div className="flex h-[min(400px,55vh)] items-center justify-center text-sm text-[var(--pw-muted)]">
        Cargando PDF…
      </div>
    );
  }

  if (err || !blobUrl) {
    return (
      <div className="flex h-[min(400px,55vh)] flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="m-0 text-sm text-[var(--pw-muted)]">No se pudo mostrar el PDF en el panel.</p>
        <a href={src} target="_blank" rel="noreferrer" className="pathway-btn pathway-btn-primary inline-flex no-underline text-xs">
          <ExternalLink className="size-3.5" />
          Abrir PDF
        </a>
      </div>
    );
  }

  return (
    <>
      <iframe title={title} src={`${blobUrl}#toolbar=0`} className="h-[min(400px,55vh)] w-full border-0" />
      <div className="border-t px-3 py-2 text-right" style={{ borderColor: "var(--pw-border)" }}>
        <a
          href={blobUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[var(--pw-accent)] no-underline hover:underline"
        >
          <ExternalLink className="size-3" />
          Abrir en nueva pestaña
        </a>
      </div>
    </>
  );
}
