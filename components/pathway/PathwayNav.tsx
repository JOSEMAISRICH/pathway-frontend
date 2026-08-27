"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * Navegación genérica PathWay (si se usa en el futuro): enlaces al flujo API real,
 * sin sesión demo en localStorage.
 */
export function PathwayNav({ active }: { active?: "home" | "solicitante" | "agencia" }) {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b"
      style={{ borderColor: "var(--pw-border)", background: "rgba(15,20,25,0.85)" }}
    >
      <Link href="/pathway" className="flex items-center gap-2 no-underline">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--pw-accent-dim)", color: "var(--pw-accent)" }}
        >
          <Compass size={20} strokeWidth={2.5} />
        </span>
        <span className="font-bold text-lg tracking-tight" style={{ color: "var(--pw-text)" }}>
          Path<span style={{ color: "var(--pw-accent)" }}>Way</span>
        </span>
      </Link>

      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/sign-in"
          className="px-3 py-2 rounded-lg font-medium no-underline transition-colors"
          style={{
            color: active === "agencia" ? "var(--pw-accent)" : "var(--pw-muted)",
            background: active === "agencia" ? "var(--pw-accent-dim)" : "transparent",
          }}
        >
          Iniciar sesión (despacho)
        </Link>
        <Link href="/pathway" className="px-3 py-2 rounded-lg font-medium no-underline" style={{ color: "var(--pw-muted)" }}>
          Inicio
        </Link>
      </nav>
    </header>
  );
}
