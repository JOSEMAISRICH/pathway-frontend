import { apiUrl } from "@/lib/api/apiUrl";
import { readApiErrorMessage } from "@/lib/api/readApiError";

import type { PlanFeatures, PublicPlan } from "@/lib/api/plans";

export type BillingInfo = {
  configured: boolean;
  plan: string;
  planName?: string;
  priceMonthly: number | null;
  currency: string;
  features?: PlanFeatures;
  limits?: { maxActiveCases: number | null };
  accessReason?: string;
  /** Email de la agencia / facturación (prefill). */
  email?: string;
  status: string;
  active: boolean;
  /** Fin de la prueba gratuita en app (ISO), si aplica. */
  trialEndsAt?: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
};

export type BillingStatusResponse = {
  billing: BillingInfo;
  stripeConfigured: boolean;
  plans?: PublicPlan[];
};

export type BillingApiError = {
  ok: false;
  status: number;
  error: string;
};

function formatPrice(billing: Pick<BillingInfo, "priceMonthly" | "currency">): string {
  const currency = (billing.currency || "EUR").toUpperCase();
  if (billing.priceMonthly == null || !Number.isFinite(billing.priceMonthly)) {
    return "A medida";
  }
  const amount = billing.priceMonthly;
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatBillingPrice(billing: Pick<BillingInfo, "priceMonthly" | "currency">): string {
  return formatPrice(billing);
}

export async function getBillingStatus(): Promise<
  ({ ok: true } & BillingStatusResponse) | BillingApiError
> {
  const r = await fetch(apiUrl("/api/billing/status"), { credentials: "include" });
  if (!r.ok) {
    return { ok: false, status: r.status, error: await readApiErrorMessage(r) };
  }
  const j = (await r.json()) as BillingStatusResponse;
  return {
    ok: true,
    billing: j.billing,
    stripeConfigured: Boolean(j.stripeConfigured),
    plans: Array.isArray(j.plans) ? j.plans : undefined,
  };
}

export async function startCheckout(opts?: {
  successUrl?: string;
  cancelUrl?: string;
  /** Reservado; Stripe Checkout cobra desde ya. La prueba es en app al registrarse. */
  trial?: boolean;
  /** Email de facturación (editable en PathWay antes de Stripe). */
  customerEmail?: string;
  plan?: string;
}): Promise<{ ok: true; url: string; sessionId?: string } | BillingApiError> {
  const trial = opts?.trial === true;
  const r = await fetch(apiUrl("/api/billing/checkout"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trial,
      ...(opts?.successUrl ? { successUrl: opts.successUrl } : {}),
      ...(opts?.cancelUrl ? { cancelUrl: opts.cancelUrl } : {}),
      ...(opts?.customerEmail ? { customerEmail: opts.customerEmail } : {}),
      ...(opts?.plan ? { plan: opts.plan } : {}),
    }),
  });
  if (!r.ok) {
    return { ok: false, status: r.status, error: await readApiErrorMessage(r) };
  }
  const j = (await r.json()) as { ok?: boolean; url?: string; sessionId?: string };
  if (!j.url) {
    return { ok: false, status: r.status, error: "El servidor no devolvió URL de pago." };
  }
  return { ok: true, url: j.url, sessionId: j.sessionId };
}

export async function syncBillingSession(
  sessionId: string,
): Promise<({ ok: true; billing: BillingInfo } | BillingApiError)> {
  const r = await fetch(apiUrl("/api/billing/sync"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!r.ok) {
    return { ok: false, status: r.status, error: await readApiErrorMessage(r) };
  }
  const j = (await r.json()) as { ok?: boolean; billing?: BillingInfo };
  if (!j.billing) {
    return { ok: false, status: r.status, error: "Respuesta de sync sin billing." };
  }
  return { ok: true, billing: j.billing };
}

/** Redirige a Stripe Checkout; lanza/devuelve error si falla. */
export async function redirectToCheckout(opts?: {
  successUrl?: string;
  cancelUrl?: string;
  trial?: boolean;
  customerEmail?: string;
  plan?: string;
}): Promise<BillingApiError | null> {
  const result = await startCheckout(opts);
  if (!result.ok) return result;
  window.location.href = result.url;
  return null;
}
