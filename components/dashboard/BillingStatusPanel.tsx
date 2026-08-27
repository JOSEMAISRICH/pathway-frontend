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
import { useToast } from "@/components/ui/Toast";

type Variant = "banner" | "page";

type Props = {
  variant?: Variant;
  /** Ruta base para success/cancel al iniciar checkout (default: página actual). */
  returnPath?: string;
};

function statusLabel(billing: BillingInfo): string {
  if (billing.active) return "Activo";
  const s = (billing.status || "").toLowerCase();
  if (s === "none" || !s) return "Sin suscripción";
  if (s === "past_due" || s === "unpaid") return "Pago pendiente";
  if (s === "canceled") return "Cancelado";
  if (s === "incomplete" || s === "incomplete_expired") return "Incompleto";
  return s;
}

export function BillingStatusPanel({ variant = "banner", returnPath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState<"trial" | "now" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingEmail, setBillingEmail] = useState("");
  const syncHandled = useRef(false);

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

  async function onSubscribe(trial: boolean) {
    if (checkoutBusy) return;
    const email = billingEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      setError("Indica un email de facturación válido.");
      toast("Indica un email de facturación válido.", "error");
      return;
    }
    setCheckoutBusy(trial ? "trial" : "now");
    setError(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const base = returnPath ?? (typeof window !== "undefined" ? window.location.pathname : "/dashboard");
    const err = await redirectToCheckout({
      trial,
      customerEmail: email,
      successUrl: `${origin}${base}?billing=success`,
      cancelUrl: `${origin}${base}?billing=cancel`,
    });
    if (err) {
      setCheckoutBusy(null);
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

  const price = billing ? formatBillingPrice(billing) : "75 €";
  const active = Boolean(billing?.active);

  if (variant === "banner") {
    if (active) {
      return (
        <div
          className="pathway-card mb-6 flex flex-col gap-2 border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--pw-success)", background: "var(--pw-success-dim)" }}
        >
          <p className="m-0 text-[var(--pw-text)]">
            Plan <span className="font-medium">{billing?.plan ?? "standard"}</span> activo · {price}/mes
          </p>
          <Link href="/dashboard/planes" className="pathway-btn pathway-btn-ghost py-2 text-xs no-underline">
            Ver plan
          </Link>
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
                ? `Plan PathWay (${price}/mes): prueba 7 días o paga desde ya.`
                : "Falta configurar Stripe en el servidor (STRIPE_SECRET_KEY)."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/dashboard/planes" className="pathway-btn pathway-btn-ghost py-2 text-xs no-underline">
            Detalles
          </Link>
          {stripeConfigured ? (
            <>
              <button
                type="button"
                className="pathway-btn pathway-btn-primary py-2 text-xs"
                disabled={checkoutBusy != null}
                onClick={() => void onSubscribe(true)}
              >
                {checkoutBusy === "trial" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Redirigiendo…
                  </>
                ) : (
                  "7 días gratis"
                )}
              </button>
              <button
                type="button"
                className="pathway-btn pathway-btn-ghost py-2 text-xs"
                disabled={checkoutBusy != null}
                onClick={() => void onSubscribe(false)}
              >
                {checkoutBusy === "now" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    …
                  </>
                ) : (
                  <>
                    <CreditCard className="size-3.5" />
                    Pagar ya
                  </>
                )}
              </button>
            </>
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
              PathWay · {billing?.plan ?? "standard"}
            </h2>
            <p className="m-0 mt-2 text-sm text-[var(--pw-muted)]">
              Suscripción mensual del despacho. El email de facturación se edita aquí (en Stripe suele
              quedar fijo una vez existe el cliente).
            </p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--pw-muted)]">Precio</dt>
                <dd className="m-0 mt-0.5 font-medium text-[var(--pw-text)]">{price}/mes</dd>
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
            {!active && stripeConfigured ? (
              <div className="mt-5 max-w-md">
                <label className="pathway-label" htmlFor="pw-billing-email">
                  Email de facturación (despacho)
                </label>
                <input
                  id="pw-billing-email"
                  type="email"
                  className="pathway-input"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="facturacion@tu-despacho.com"
                  autoComplete="email"
                  disabled={checkoutBusy != null}
                />
              </div>
            ) : null}
            {error ? <p className="m-0 mt-4 text-sm text-[var(--pw-danger)]">{error}</p> : null}
            {!stripeConfigured ? (
              <p className="m-0 mt-4 text-sm text-[var(--pw-muted)]">
                Pagos no configurados: el backend necesita <code className="text-xs">STRIPE_SECRET_KEY</code>.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {active ? (
              <span
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium"
                style={{ background: "var(--pw-success-dim)", color: "var(--pw-success)" }}
              >
                Suscripción activa
              </span>
            ) : stripeConfigured ? (
              <div className="flex flex-col gap-2 sm:items-end">
                <button
                  type="button"
                  className="pathway-btn pathway-btn-primary px-6 py-3"
                  disabled={checkoutBusy != null}
                  onClick={() => void onSubscribe(true)}
                >
                  {checkoutBusy === "trial" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Redirigiendo a Stripe…
                    </>
                  ) : (
                    <>Probar 7 días gratis</>
                  )}
                </button>
                <button
                  type="button"
                  className="pathway-btn pathway-btn-ghost px-6 py-3"
                  disabled={checkoutBusy != null}
                  onClick={() => void onSubscribe(false)}
                >
                  {checkoutBusy === "now" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Abriendo Stripe…
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      Empezar a pagar ya · {price}/mes
                    </>
                  )}
                </button>
              </div>
            ) : null}
            <Link href="/dashboard" className="pathway-btn pathway-btn-ghost py-2 text-xs no-underline">
              Volver a expedientes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
