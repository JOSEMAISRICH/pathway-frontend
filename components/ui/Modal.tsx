"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Ancho máximo del panel */
  size?: "md" | "lg";
};

export function Modal({ open, onClose, title, description, children, size = "md" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(6,8,12,0.72)" }}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pw-modal-title"
        className={`pathway-card w-full border shadow-2xl ${size === "lg" ? "max-w-lg" : "max-w-md"}`}
        style={{ borderColor: "var(--pw-border)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b px-6 py-4" style={{ borderColor: "var(--pw-border)" }}>
          <div>
            <h2 id="pw-modal-title" className="m-0 text-lg font-semibold">
              {title}
            </h2>
            {description ? (
              <p className="m-0 mt-1 text-xs leading-relaxed text-[var(--pw-muted)]">{description}</p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="pathway-btn pathway-btn-ghost shrink-0 p-2" aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
