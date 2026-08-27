"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function RejectDocModal({ open, title = "Motivo del rechazo", onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const labelId = useId();

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = reason.trim();
    if (t.length < 3) return;
    onConfirm(t);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="pathway-card w-full max-w-md p-5 shadow-xl"
        role="dialog"
        aria-labelledby={labelId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-2 mb-4">
          <h2 id={labelId} className="text-lg font-bold m-0">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="pathway-btn pathway-btn-ghost p-2 shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="pathway-label" htmlFor="reject-reason">
              Comentario para el cliente
            </label>
            <textarea
              id="reject-reason"
              className="pathway-input min-h-[100px] resize-y"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. El pasaporte sale cortado; sube foto completa de la doble página."
              required
              minLength={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="pathway-btn pathway-btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="pathway-btn pathway-btn-primary"
              style={{ background: "var(--pw-danger)", color: "white" }}
            >
              Rechazar documento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
