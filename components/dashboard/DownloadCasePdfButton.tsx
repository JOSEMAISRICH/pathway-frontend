"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { casePdfDownloadUrl, downloadCaseFinalPdf, type CasePdfSource } from "@/lib/api/casePdf";
import { useToast } from "@/components/ui/Toast";

type Props = {
  caseId: string;
  caseData?: CasePdfSource | null;
  className?: string;
  label?: string;
};

export function DownloadCasePdfButton({ caseId, caseData, className, label = "Descargar PDF" }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const res = await downloadCaseFinalPdf(caseId, caseData);
    setBusy(false);
    if (!res.ok) {
      toast(res.error, "error");
      return;
    }
    toast("PDF descargado", "success");
  }

  return (
    <button
      type="button"
      className={className ?? "pathway-btn pathway-btn-primary inline-flex"}
      disabled={busy}
      onClick={() => void onClick()}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {label}
    </button>
  );
}
