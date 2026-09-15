"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import {
  formatBillingPrice,
  getBillingStatus,
  redirectToCheckout,
  syncBillingSession,
  type BillingInfo,
} from "@/lib/api/billing";
import { PATHWAY_PLANS, formatPlanPrice, planDisplayName, type PlanId } from "@/lib/api/plans";
import { useToast } from "@/components/ui/Toast";

type Variant = "banner" | "page";

type Props = {
  variant?: Variant;
  /** Ruta base para success/cancel al iniciar checkout (default: página actual). */
  returnPath?: string;
};

function statusLabel(billing: BillingInfo): string {
  if (billing.active && billing.status === "app_trial") return "Prueba gratuita";
  if (billing.active) return "Activo";
  const s = (billing.status || "").toLowerCase();
  if (s === "none" || !s) return "Sin suscripción";
  if (s === "past_due" || s === "unpaid") return "Pago pendiente";
  if (s === "canceled") return "Cancelado";
  if (s === "incomplete" || s === "incomplete_expired") return "Incompleto";
  return s;
}

function formatTrialRemaining(trialEndsAt: string | null | undefined): string | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime()) || end <= new Date()) return null;
  const days = Math.max(1, Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return days === 1 ? "1 día restante" : `${days} días restantes`;
}

export function BillingStatusPanel({ variant = "banner", returnPath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingEmail, setBillingEmail] = useState("");
  const syncHandled = useRef(false);
  const expiredToastShown = useRef(false);

  const clearBillingQuery = useCallback(() => {
    const path = returnPath ?? (typeof window !== "undefined" ? window.location.pathname : "/dashboard");
    router.replace(path, { scroll: false });
  }, [returnPath, router]);

  const load = useCallback(async () => {
    setError(null);
    const result = await getBillingStatus();
    if (!result.ok) {
      if (result.status === 401) {
        router.replace("/sign-in");
        return;
      }
      setError(result.error);
      setBilling(null);
      setLoading(false);
      return;
    }
    setBilling(result.billing);
    setStripeConfigured(result.stripeConfigured);
    if (result.billing.email) setBillingEmail(result.billing.email);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (expiredToastShown.current) return;
    if (searchParams.get("expired") !== "1") return;
    if (loading || !billing || billing.active) return;
    expiredToastShown.current = true;
    toast("Tu prueba gratuita ha terminado. Suscríbete para seguir usando PathWay.", "default");
  }, [searchParams, loading, billing, toast]);

  useEffect(() => {
    if (syncHandled.current) return;
    const flag = searchParams.get("billing");
    const sessionId = searchParams.get("session_id") ?? searchParams.get("sessionId");

    if (flag === "cancel") {
      syncHandled.current = true;
      toast("Pago cancelado. Puedes suscribirte cuando quieras.", "default");
      clearBillingQuery();
      return;
    }

    if (flag !== "success") return;
    syncHandled.current = true;

    void (async () => {
      if (sessionId) {
        const synced = await syncBillingSession(sessionId);
        if (!synced.ok) {
          if (synced.status === 401) {
            router.replace("/sign-in");
            return;
          }
          toast(synced.error || "No se pudo confirmar el pago", "error");
          clearBillingQuery();
          await load();
          return;
        }
        setBilling(synced.billing);
        setStripeConfigured(true);
        toast(
          synced.billing.active
            ? "Suscripción activada. Gracias."
            : "Pago recibido. La suscripción se está actualizando.",
          synced.billing.active ? "success" : "default",
        );
      } else {
        toast("Volviste de Stripe. Actualizando estado…", "default");
        await load();
      }
      clearBillingQuery();
    })();
  }, [searchParams, toast, clearBillingQuery, load, router]);

  async function onSubscribe(planId: PlanId = "basico") {
    if (checkoutBusy) return;
    const email = billingEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      setError("Indica un email de facturación válido.");
      toast("Indica un email de facturación válido.", "error");
      return;
    }
    setCheckoutBusy(true);
    setError(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const base = returnPath ?? (typeof window !== "undefined" ? window.location.pathname : "/dashboard");
    const err = await redirectToCheckout({
      trial: false,
      plan: planId,
      customerEmail: email,
      successUrl: `${origin}${base}?billing=success`,
      cancelUrl: `${origin}${base}?billing=cancel`,
    });
    if (err) {
      setCheckoutBusy(false);
      if (err.status === 401) {
        router.replace("/sign-in");
        return;
      }
      if (err.status === 503) {
        setError(err.error || "Pagos no configurados en el servidor.");
        setStripeConfigured(false);
        toast("Stripe no está configurado en el servidor.", "error");
        return;
      }
      setError(err.error);
      toast(err.error, "error");
    }
  }

  if (loading) {
    if (variant === "banner") {
      return (
        <div className="mb-6 h-14 animate-pulse rounded-xl bg-[var(--pw-surface-2)]" aria-hidden />
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--pw-muted)]">
        <Loader2 className="size-4 animate-spin" />
        Cargando plan…
      </div>
    );
  }

  const price = billing ? formatBillingPrice(billing) : "39 €";
  const planLabel = billing?.planName || planDisplayName(billing?.plan);
  const active = Boolean(billing?.active);
  const appTrial = active && billing?.status === "app_trial";
  const trialRemaining = formatTrialRemaining(billing?.trialEndsAt ?? billing?.currentPeriodEnd);
  const paidPlan = active && !appTrial;

  if (variant === "banner") {
    if (active && !appTrial) {
      return (
        <div
          className="pathway-card mb-6 flex flex-col gap-2 border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--pw-success)", background: "var(--pw-success-dim)" }}
        >
          <p className="m-0 text-[var(--pw-text)]">
            Plan <span className="font-medium">{planLabel}</span> activo
            {billing?.priceMonthly != null ? ` · ${price}/mes` : ""}
          </p>
          <Link href="/dashboard/planes" className="pathway-btn pathway-btn-ghost py-2 text-xs no-underline">
            Ver plan
          </Link>
        </div>
      );
    }

    if (appTrial) {
      return (
        <div
          className="pathway-card mb-6 flex flex-col gap-3 border p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: "var(--pw-success)",
            background: "var(--pw-success-dim)",
          }}
        >
          <div className="min-w-0">
            <p className="m-0 font-medium text-[var(--pw-text)]">Prueba gratuita activa</p>
            <p className="m-0 mt-1 text-[var(--pw-muted)]">
              {trialRemaining
                ? `${trialRemaining}. Después elige un plan (desde 39 €/mes).`
                : "Tienes todas las funciones durante la prueba. Después elige un plan."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/dashboard/planes" className="pathway-btn pathway-btn-ghost py-2 text-xs no-underline">
              Ver plan
            </Link>
            {stripeConfigured ? (
              <Link href="/dashboard/planes" className="pathway-btn pathway-btn-primary py-2 text-xs no-underline">
                Elegir plan
              </Link>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div
        className="pathway-card mb-6 flex flex-col gap-3 border p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: stripeConfigured ? "var(--pw-warn)" : "var(--pw-border)",
          background: stripeConfigured ? "var(--pw-accent-dim)" : "var(--pw-surface-2)",
        }}
      >
        <div className="min-w-0">
          <p className="m-0 font-medium text-[var(--pw-text)]">
            {stripeConfigured ? "Suscripción pendiente" : "Pagos no disponibles"}
          </p>
          <p className="m-0 mt-1 text-[var(--pw-muted)]">
            {error
              ? error
              : stripeConfigured
                ? "Tu prueba ha terminado. Elige un plan para seguir usando PathWay."
                : "Falta configurar Stripe en el servidor (STRIPE_SECRET_KEY)."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/dashboard/planes" className="pathway-btn pathway-btn-ghost py-2 text-xs no-underline">
            Detalles
          </Link>
          {stripeConfigured ? (
            <Link href="/dashboard/planes" className="pathway-btn pathway-btn-primary py-2 text-xs no-underline">
              Elegir plan
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  /* variant === "page" */
  return (
    <div className="space-y-6">
      <div className="pathway-card border p-6 sm:p-8" style={{ borderColor: "var(--pw-border)" }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="m-0 text-[10px] font-medium uppercase tracking-widest text-[var(--pw-muted)]">
              Plan del despacho
            </p>
            <h2
              className="m-0 mt-2 text-2xl font-semibold tracking-tight text-[var(--pw-text)]"
              style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}
            >
              PathWay · {planLabel}
            </h2>
            <p className="m-0 mt-2 text-sm text-[var(--pw-muted)]">
              Dos planes. El email de PathWay es de referencia; en Stripe lo escribes tú (campo editable).
            </p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--pw-muted)]">Precio</dt>
                <dd className="m-0 mt-0.5 font-medium text-[var(--pw-text)]">
                  {billing?.priceMonthly != null ? `${price}/mes` : price}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--pw-muted)]">Estado</dt>
                <dd className="m-0 mt-0.5 font-medium text-[var(--pw-text)]">
                  {billing ? statusLabel(billing) : "—"}
                </dd>
              </div>
              {billing?.currentPeriodEnd ? (
                <div>
                  <dt className="text-[var(--pw-muted)]">Periodo hasta</dt>
                  <dd className="m-0 mt-0.5 font-medium text-[var(--pw-text)]">
                    {new Date(billing.currentPeriodEnd).toLocaleDateString("es-ES")}
                    {billing.cancelAtPeriodEnd ? " · cancela al final" : ""}
                  </dd>
                </div>
              ) : null}
            </dl>
            {stripeConfigured ? (
              <div className="mt-5 max-w-md">
                <label className="pathway-label" htmlFor="pw-billing-email">
                  Email de facturación (despacho)
                </label>
                <input
                  id="pw-billing-email"
                  type="email"
                  name="pw-invoice-email"
                  className="pathway-input"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="facturacion@tu-despacho.com"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                  disabled={checkoutBusy}
                />
              </div>
            ) : null}
            {error ? <p className="m-0 mt-4 text-sm text-[var(--pw-danger)]">{error}</p> : null}
            {!stripeConfigured ? (
              <p className="m-0 mt-4 text-sm text-[var(--pw-muted)]">
                Pagos no configurados: el backend necesita <code className="text-xs">STRIPE_SECRET_KEY</code>.
              </p>
            ) : null}
            {appTrial && trialRemaining ? (
              <p className="m-0 mt-4 text-sm text-[var(--pw-muted)]">{trialRemaining} de prueba gratuita.</p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {paidPlan ? (
              <span
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium"
                style={{ background: "var(--pw-success-dim)", color: "var(--pw-success)" }}
              >
                Suscripción activa
              </span>
            ) : appTrial ? (
              <span
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium"
                style={{ background: "var(--pw-success-dim)", color: "var(--pw-success)" }}
              >
                Prueba gratuita
              </span>
            ) : null}
            <Link href="/dashboard" className="pathway-btn pathway-btn-ghost py-2 text-xs no-underline">
              Volver a expedientes
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2">
        {PATHWAY_PLANS.map((plan) => {
          const current = billing?.plan === plan.id && paidPlan;
          return (
            <div key={plan.id} className="pathway-card flex h-full flex-col border p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="m-0 text-base font-semibold">{plan.name}</h3>
                {plan.highlighted ? (
                  <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--pw-accent)]">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="m-0 mb-1 text-sm text-[var(--pw-muted)]">{plan.tagline}</p>
              <p className="m-0 mb-4 text-2xl font-semibold">
                {formatPlanPrice(plan.priceMonthly)}
                {plan.priceMonthly != null ? (
                  <span className="text-sm font-normal text-[var(--pw-muted)]"> / mes</span>
                ) : null}
              </p>
              <ul className="m-0 mb-5 list-none space-y-2 p-0 text-sm text-[var(--pw-muted)]">
                {plan.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-auto">
                {current ? (
                  <p className="m-0 text-sm font-medium" style={{ color: "var(--pw-success)" }}>
                    Tu plan actual
                  </p>
                ) : stripeConfigured ? (
                  <button
                    type="button"
                    className="pathway-btn pathway-btn-primary w-full"
                    disabled={checkoutBusy}
                    onClick={() => void onSubscribe(plan.id)}
                  >
                    {checkoutBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Abriendo…
                      </>
                    ) : (
                      <>
                        <CreditCard className="size-4" />
                        {paidPlan ? "Cambiar a este plan" : "Suscribirse"}
                      </>
                    )}
                  </button>
                ) : (
                  <p className="m-0 text-sm text-[var(--pw-muted)]">Pagos no disponibles ahora mismo.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
