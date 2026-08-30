import Link from "next/link";
import { Compass } from "lucide-react";

const LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#ventajas", label: "Ventajas" },
  { href: "#comparativa", label: "Comparativa" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "FAQ" },
];

/** Cabecera landing: logo, anclas de sección y acceso despacho. */
export function PathwayLandingNav() {
  return (
    <header className="pathway-landing-nav sticky top-0 z-[100] border-b" style={{ borderColor: "var(--pw-border)" }}>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-8 sm:py-4">
        <Link href="/pathway" className="pathway-landing-nav-home group flex shrink-0 items-center gap-2.5 no-underline sm:gap-3">
          <span className="pathway-landing-nav-mark flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10" aria-hidden>
            <Compass size={18} strokeWidth={2} className="sm:hidden" />
            <Compass size={20} strokeWidth={2} className="hidden sm:block" />
          </span>
          <span className="pathway-landing-wordmark text-base font-semibold tracking-tight sm:text-lg">
            <span className="pathway-landing-wordmark-path">Path</span>
            <span className="pathway-landing-wordmark-way">Way</span>
          </span>
        </Link>

        <nav className="pathway-landing-nav-sections min-w-0 flex-1" aria-label="Secciones">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="pathway-landing-nav-link whitespace-nowrap text-xs no-underline sm:text-sm">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/sign-in" className="pathway-landing-nav-link px-1 py-2 text-xs no-underline sm:text-sm">
            Iniciar sesión
          </Link>
          <Link href="/sign-up" className="pathway-landing-cta-primary whitespace-nowrap no-underline text-xs sm:text-sm">
            Probar gratis 7 días
          </Link>
        </div>
      </div>
    </header>
  );
}
