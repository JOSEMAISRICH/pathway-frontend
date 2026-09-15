"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CreditCard, Loader2 } from "lucide-react";
import { redirectToCheckout } from "@/lib/api/billing";
import { PATHWAY_PLANS, formatPlanPrice, type PlanId } from "@/lib/api/plans";
import { useToast } from "@/components/ui/Toast";

/**
 * Precios en landing: Básico y Profesional. CTA de pago con Stripe.
 * La prueba gratuita es al registrarse (sin tarjeta).
 */
export function LandingPricingSection() {
  const router = useRouter();
  const { toast } = useToast();
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [billingEmail, setBillingEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  async function startPaidFlow(planId: PlanId) {
    if (busyPlan) return;
    setBusyPlan(planId);
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
        plan: planId,
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
      setBusyPlan(null);
    }
  }

  return (
    <section id="precios" className="pathway-landing-section scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <p className="pathway-landing-eyebrow m-0 mb-3 text-center">Precios</p>
        <h2 className="pathway-landing-section-title m-0 mb-3 text-center">Planes para el despacho</h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-sm leading-relaxed sm:text-base" style={{ color: "var(--pw-muted)" }}>
          Desde 39&nbsp;€/mes, sin permanencia. Cancela cuando quieras. 7 días de prueba con todas las funciones.
        </p>

        <div className="mx-auto mb-10 max-w-lg">
          <label className="pathway-label" htmlFor="landing-billing-email">
            Email de facturación
          </label>
          <input
            id="landing-billing-email"
            type="email"
            name="pw-invoice-email"
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
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            data-1p-ignore="true"
            data-lpignore="true"
            disabled={Boolean(busyPlan)}
          />
          <p className="m-0 mt-2 text-[11px]" style={{ color: "var(--pw-muted)" }}>
            Solo se rellena con el correo de tu despacho si has iniciado sesión. No sale el de otra persona.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-2">
          {PATHWAY_PLANS.map((plan) => {
            const busy = busyPlan === plan.id;
            return (
              <div key={plan.id} className="pathway-landing-pricing-card flex h-full flex-col">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--pw-accent)" }}>
                      {plan.name}
                    </p>
                    <h3 className="m-0 mt-2 text-xl font-semibold" style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}>
                      PathWay {plan.name}
                    </h3>
                  </div>
                  <span className="pathway-landing-pricing-badge">
                    {plan.highlighted ? "Más popular" : "Sin permanencia"}
                  </span>
                </div>

                <p className="m-0 mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}>
                    {formatPlanPrice(plan.priceMonthly).replace(" €", "€")}
                  </span>
                  {plan.priceMonthly != null ? (
                    <span className="text-sm" style={{ color: "var(--pw-muted)" }}>
                      / mes
                    </span>
                  ) : null}
                </p>
                <p className="m-0 mb-6 text-xs" style={{ color: "var(--pw-muted)" }}>
                  {plan.tagline}
                </p>

                <ul className="m-0 mb-6 list-none space-y-3 p-0">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--pw-accent)" }} strokeWidth={2.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <button
                    type="button"
                    className="pathway-landing-cta-primary w-full border-0"
                    disabled={Boolean(busyPlan)}
                    onClick={() => void startPaidFlow(plan.id)}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
