import Link from "next/link";
import { Compass } from "lucide-react";

/** Cabecera del portal cliente: solo flujo real (magic link + acceso despacho). */
export function PortalNav() {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b"
      style={{ borderColor: "var(--pw-border)", background: "rgba(15,20,25,0.92)" }}
    >
      <Link href="/pathway" className="flex items-center gap-2 no-underline">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--pw-accent-dim)", color: "var(--pw-accent)" }}
        >
          <Compass size={20} strokeWidth={2.5} />
        </span>
        <span className="font-bold text-lg tracking-tight" style={{ color: "var(--pw-text)" }}>
          PathWay · <span style={{ color: "var(--pw-accent)" }}>Mis documentos</span>
        </span>
      </Link>

      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/pathway" className="px-3 py-2 rounded-lg no-underline" style={{ color: "var(--pw-muted)" }}>
          Inicio
        </Link>
        <Link href="/sign-in" className="px-3 py-2 rounded-lg no-underline text-xs" style={{ color: "var(--pw-muted)" }}>
          Acceso despacho
        </Link>
      </nav>
    </header>
  );
}
