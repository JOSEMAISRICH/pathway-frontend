"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CreditCard, Loader2 } from "lucide-react";
import { redirectToCheckout } from "@/lib/api/billing";
import { useToast } from "@/components/ui/Toast";

const PLAN_INCLUDES = [
  "Expedientes ilimitados en el plan actual",
  "Portal cliente con magic link (sin registro)",
  "Case Engine EX-10 + checklist automático",
  "IA de extracción en pasaporte",
  "Revisión por documento y PDF EX-10",
  "Pago seguro con Stripe Checkout",
];

const PRICE_EUR = 75;

/**
 * Precios en landing: CTA de pago con Stripe.
 * La prueba gratuita es al registrarse (sin tarjeta).
 */
export function LandingPricingSection() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [billingEmail, setBillingEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  async function startPaidFlow() {
    if (busy) return;
    setBusy(true);
    const signUpPath = "/sign-up";

    try {
      const me = await fetch("/api/auth/me", { credentials: "include" });
      if (!me.ok) {
        router.push(signUpPath);
        return;
      }
      setLoggedIn(true);
      const j = (await me.json().catch(() => ({}))) as { agency?: { email?: string } };
      const fromAgency = (j.agency?.email || billingEmail || "").trim();
      const email = (billingEmail.trim() || fromAgency).toLowerCase();
      if (!email.includes("@")) {
        toast("Indica el email de facturación del despacho.", "error");
        if (j.agency?.email) setBillingEmail(j.agency.email);
        return;
      }
      if (!billingEmail.trim() && j.agency?.email) setBillingEmail(j.agency.email);

      const origin = window.location.origin;
      const err = await redirectToCheckout({
        trial: false,
        customerEmail: email,
        successUrl: `${origin}/dashboard?billing=success`,
        cancelUrl: `${origin}/pathway#precios`,
      });
      if (err) {
        if (err.status === 401) {
          router.push(signUpPath);
          return;
        }
        if (err.status === 503) {
          toast("Stripe no está configurado en el servidor.", "error");
          return;
        }
        toast(err.error || "No se pudo abrir el pago", "error");
      }
    } catch {
      toast("Sin conexión al servidor. Crea la cuenta cuando el API esté en marcha.", "error");
      router.push(signUpPath);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="precios" className="pathway-landing-section scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <p className="pathway-landing-eyebrow m-0 mb-3 text-center">Precios</p>
        <h2 className="pathway-landing-section-title m-0 mb-3 text-center">Un plan claro para el despacho</h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-sm leading-relaxed sm:text-base" style={{ color: "var(--pw-muted)" }}>
          {PRICE_EUR}&nbsp;€/mes, sin permanencia. Cancela cuando quieras.
        </p>

        <div className="pathway-landing-pricing-card mx-auto max-w-lg">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--pw-accent)" }}>
                Plan despacho
              </p>
              <h3 className="m-0 mt-2 text-xl font-semibold" style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}>
                PathWay Standard
              </h3>
            </div>
            <span className="pathway-landing-pricing-badge">Sin permanencia</span>
          </div>

          <p className="m-0 mb-1 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}>
              {PRICE_EUR}€
            </span>
            <span className="text-sm" style={{ color: "var(--pw-muted)" }}>
              / mes
            </span>
          </p>
          <p className="m-0 mb-6 text-xs" style={{ color: "var(--pw-muted)" }}>
            Pago con Stripe · email de facturación del despacho
          </p>

          <ul className="m-0 mb-6 list-none space-y-3 p-0">
            {PLAN_INCLUDES.map((item) => (
              <li key={item} className="flex gap-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--pw-accent)" }} strokeWidth={2.5} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mb-6">
            <label className="pathway-label" htmlFor="landing-billing-email">
              Email de facturación
            </label>
            <input
              id="landing-billing-email"
              type="email"
              className="pathway-input"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              onFocus={() => {
                if (loggedIn || billingEmail) return;
                void fetch("/api/auth/me", { credentials: "include" })
                  .then(async (r) => {
                    if (!r.ok) return;
                    setLoggedIn(true);
                    const j = (await r.json()) as { agency?: { email?: string } };
                    if (j.agency?.email && !billingEmail) setBillingEmail(j.agency.email);
                  })
                  .catch(() => undefined);
              }}
              placeholder="facturacion@tu-despacho.com"
              autoComplete="email"
              disabled={busy}
            />
            <p className="m-0 mt-2 text-[11px]" style={{ color: "var(--pw-muted)" }}>
              Cámbialo aquí antes de pagar. En Stripe el correo suele mostrarse fijo.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="pathway-landing-cta-primary w-full border-0"
              disabled={busy}
              onClick={() => void startPaidFlow()}
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Abriendo…
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  Suscribirse ahora
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
