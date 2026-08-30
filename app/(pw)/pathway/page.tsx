import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileCheck,
  FolderOpen,
  Link2,
  MessageSquare,
  ScanLine,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { PathwayLandingNav } from "@/components/pathway/PathwayLandingNav";
import { LandingPricingSection } from "@/components/pathway/LandingPricingSection";

/** Solo capacidades reales del producto hoy (no marketing copiado de competencia). */
const FEATURES = [
  {
    icon: Link2,
    title: "Enlace mágico al cliente",
    text: "Portal privado sin registro. El cliente sube pasaporte, domicilio, foto y slots EX-10 en orden. Enlace con caducidad configurable.",
  },
  {
    icon: ScanLine,
    title: "IA en el pasaporte",
    text: "Extrae nombre, nacionalidad, nº pasaporte y fechas con visión IA. Si falta un campo, queda en revisión manual — el archivo no se pierde.",
  },
  {
    icon: Upload,
    title: "Control de calidad al subir",
    text: "Antes de enviar, el portal comprueba formato, tamaño y si la imagen está demasiado borrosa. Menos idas y venidas por fotos ilegibles.",
  },
  {
    icon: ClipboardList,
    title: "Checklist EX-10 automático",
    text: "Trámite EX-10 con 6 documentos (tasa 790, empadronamiento, antecedentes…). El panel marca qué falta subir o aprobar.",
  },
  {
    icon: MessageSquare,
    title: "Revisión documento a documento",
    text: "Aprueba o rechaza cada slot con mensaje al cliente. El portal muestra la corrección; no cierras el expediente hasta aprobar todo.",
  },
  {
    icon: Sparkles,
    title: "PDF EX-10 con datos del pasaporte",
    text: "Al aprobar el expediente, rellena el formulario con los datos extraídos. Un solo flujo de recogida a entrega.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: FolderOpen,
    title: "Creas el expediente",
    text: "Eliges el trámite (EX-10), datos del cliente y envías el enlace por email o copias el mensaje para WhatsApp.",
  },
  {
    n: "02",
    icon: Upload,
    title: "El cliente sube",
    text: "Slots guiados en el portal. Pasaporte con IA; domicilio, foto y resto de docs EX-10 con validación de archivo.",
  },
  {
    n: "03",
    icon: Users,
    title: "Revisas en el panel",
    text: "Checklist, extracción IA, vista previa de PDFs e imágenes. Apruebas o pides corrección por documento.",
  },
  {
    n: "04",
    icon: FileCheck,
    title: "Cierras con PDF",
    text: "Cuando todo está aprobado, generas el EX-10 con los datos validados. Trazabilidad en un solo sitio.",
  },
];

const COMPARE_OLD = [
  "WhatsApp y email con archivos desordenados",
  "Copiar datos del pasaporte a mano",
  "No saber qué documentos faltan del EX-10",
  "Cerrar expedientes con papeles sin revisar",
  "Perseguir al cliente sin registro de mensajes",
];

const COMPARE_PW = [
  "Portal único por expediente (magic link)",
  "IA lee el pasaporte → datos en el panel",
  "Checklist EX-10: 6 slots + progreso %",
  "Bloqueo: no apruebas el caso sin docs OK",
  "Rechazo con mensaje visible en el portal del cliente",
];

const FAQ = [
  {
    q: "¿Mis clientes necesitan registrarse?",
    a: "No. Solo abren el enlace que les envías. Suben documentos sin crear cuenta.",
  },
  {
    q: "¿PathWay valida todos los documentos con IA?",
    a: "Hoy la extracción IA es del pasaporte (identidad para el EX-10). Domicilio, tasa 790 y el resto se suben, revisan y aprueban en el panel del despacho.",
  },
  {
    q: "¿Qué trámites hay ahora?",
    a: "Recogida básica (3 docs) y EX-10 completo (6 docs + checklist automático). Más trámites usarán el mismo motor de casos.",
  },
  {
    q: "¿En qué se diferencia de otras herramientas?",
    a: "PathWay no es solo un portal de subida: incluye Case Engine EX-10, checklist en vivo, revisión por documento con feedback al cliente y generación de PDF con datos del pasaporte.",
  },
  {
    q: "¿Hay que pagar para registrarse?",
    a: "Regístrate gratis y prueba PathWay 7 días sin tarjeta. Si quieres pagar desde el primer día, usa «Suscribirse ahora» en la landing (75 €/mes con Stripe).",
  },
];

export default function PathwayLandingPage() {
  return (
    <div className="pathway-landing-saas min-h-screen scroll-smooth">
      <PathwayLandingNav />

      {/* Hero */}
      <section className="pathway-landing-hero relative overflow-hidden">
        <div className="pathway-landing-hero-glow" aria-hidden />
        <div className="pathway-landing-grid" aria-hidden />
        <div className="relative z-[1] mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-24 lg:py-28">
          <p className="pathway-landing-eyebrow m-0 mb-6 inline-flex items-center gap-2">
            <span className="pathway-landing-status" aria-hidden />
            Sistema inteligente para despachos de extranjería
          </p>
          <h1
            className="m-0 mb-6 max-w-3xl text-[2.1rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.25rem]"
            style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}
          >
            Automatice su despacho de extranjería con{" "}
            <span className="pathway-landing-headline-accent">claridad y control</span>
          </h1>
          <p className="m-0 mb-10 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--pw-muted)" }}>
            Magic link, extracción IA del pasaporte, checklist EX-10 con 6 documentos, revisión por slot y PDF — todo en un flujo pensado para despachos de extranjería en España.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#precios" className="pathway-landing-cta-primary no-underline">
              Suscribirse ahora
              <ArrowRight className="size-4" />
            </a>
          </div>
          <p className="m-0 mt-8 text-xs" style={{ color: "var(--pw-muted)" }}>
            75 €/mes · clientes finales usan el enlace del gestor (sin registro).
          </p>
        </div>
      </section>

      <LandingPricingSection />

      {/* Features */}
      <section id="ventajas" className="pathway-landing-section scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <p className="pathway-landing-eyebrow m-0 mb-3">Para profesionales</p>
          <h2 className="pathway-landing-section-title m-0 mb-4">Lo que PathWay hace hoy</h2>
          <p className="m-0 mb-12 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--pw-muted)" }}>
            Capacidades reales del producto: portal del cliente, Case Engine EX-10, revisión en panel e IA en pasaporte.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="pathway-landing-feature-card">
                <span className="pathway-landing-feature-icon" aria-hidden>
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="m-0 mb-2 text-base font-semibold">{title}</h3>
                <p className="m-0 text-sm leading-relaxed" style={{ color: "var(--pw-muted)" }}>
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="pathway-landing-section pathway-landing-section-alt scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <p className="pathway-landing-eyebrow m-0 mb-3">Cómo funciona</p>
          <h2 className="pathway-landing-section-title m-0 mb-12">El flujo automatizado en 4 pasos</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ n, icon: Icon, title, text }) => (
              <article key={n} className="pathway-landing-step-card">
                <div className="mb-4 flex items-center justify-between">
                  <span className="pathway-landing-step-num">{n}</span>
                  <span className="pathway-landing-feature-icon" aria-hidden>
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="m-0 mb-2 text-sm font-semibold">{title}</h3>
                <p className="m-0 text-xs leading-relaxed" style={{ color: "var(--pw-muted)" }}>
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparativa" className="pathway-landing-section scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <p className="pathway-landing-eyebrow m-0 mb-3">Comparativa</p>
          <h2 className="pathway-landing-section-title m-0 mb-12">La transformación de su despacho</h2>
          <div className="pathway-landing-compare-grid">
            <div className="pathway-landing-compare-col pathway-landing-compare-old">
              <h3 className="m-0 mb-6 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--pw-muted)" }}>
                Gestión manual
              </h3>
              <ul className="m-0 list-none space-y-4 p-0">
                {COMPARE_OLD.map((t) => (
                  <li key={t} className="flex gap-3 text-sm" style={{ color: "var(--pw-muted)" }}>
                    <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[var(--pw-danger)] opacity-70" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pathway-landing-compare-vs" aria-hidden>
              VS
            </div>
            <div className="pathway-landing-compare-col pathway-landing-compare-new">
              <h3 className="m-0 mb-6 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--pw-accent)" }}>
                Con PathWay
              </h3>
              <ul className="m-0 list-none space-y-4 p-0">
                {COMPARE_PW.map((t) => (
                  <li key={t} className="flex gap-3 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--pw-accent)" }} strokeWidth={2.5} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="pathway-landing-section pathway-landing-section-alt scroll-mt-24">
        <div className="mx-auto max-w-3xl px-6 sm:px-8">
          <p className="pathway-landing-eyebrow m-0 mb-3 text-center">FAQ</p>
          <h2 className="pathway-landing-section-title m-0 mb-10 text-center">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="pathway-landing-faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pathway-landing-section">
        <div className="pathway-landing-cta-band mx-auto max-w-6xl px-6 sm:px-8">
          <div className="relative z-[1] mx-auto max-w-2xl text-center">
            <h2 className="m-0 mb-4 text-2xl font-semibold sm:text-3xl" style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}>
              Lleve su despacho al siguiente nivel
            </h2>
            <p className="m-0 mb-8 text-sm leading-relaxed sm:text-base" style={{ color: "var(--pw-muted)" }}>
              Empiece con 7 días gratis sin tarjeta. Después 75 €/mes si quiere seguir.
            </p>
            <Link href="/sign-up" className="pathway-landing-cta-primary no-underline">
              Probar 7 días gratis
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="pathway-landing-footer border-t px-6 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="m-0 text-sm font-semibold">
            <span className="text-white">Path</span>
            <span style={{ color: "var(--pw-accent)" }}>Way</span>
          </p>
          <nav className="flex flex-wrap justify-center gap-6 text-xs" style={{ color: "var(--pw-muted)" }}>
            <a href="#precios" className="no-underline hover:text-[var(--pw-accent)]">
              Precios
            </a>
            <Link href="/sign-in" className="no-underline hover:text-[var(--pw-accent)]">
              Acceder
            </Link>
            <Link href="/sign-up" className="no-underline hover:text-[var(--pw-accent)]">
              Probar gratis 7 días
            </Link>
            <Link href="/acceso" className="no-underline hover:text-[var(--pw-accent)]">
              Portal cliente
            </Link>
          </nav>
          <p className="m-0 text-xs" style={{ color: "var(--pw-muted)" }}>
            © {new Date().getFullYear()} PathWay
          </p>
        </div>
      </footer>
    </div>
  );
}
