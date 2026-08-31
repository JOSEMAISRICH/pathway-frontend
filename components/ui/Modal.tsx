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
  size?: "md" | "lg" | "xl";
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

  const maxW = size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-2xl" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(6,8,12,0.72)" }}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pw-modal-title"
        className={`pathway-card flex w-full ${maxW} max-h-[min(88vh,720px)] flex-col border shadow-2xl`}
        style={{ borderColor: "var(--pw-border)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: "var(--pw-border)" }}
        >
          <div className="min-w-0">
            <h2 id="pw-modal-title" className="m-0 truncate text-base font-semibold sm:text-lg">
              {title}
            </h2>
            {description ? (
              <p className="m-0 mt-0.5 text-xs leading-relaxed text-[var(--pw-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pathway-btn pathway-btn-ghost shrink-0 p-2"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
}
