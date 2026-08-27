"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AgencyRegisterForm } from "@/components/auth/AgencyRegisterForm";
import { redirectToCheckout } from "@/lib/api/billing";
import { useToast } from "@/components/ui/Toast";

function SignUpFormInner() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [openingCheckout, setOpeningCheckout] = useState(false);

  const raw = searchParams.get("checkout") ?? (searchParams.get("pay") === "1" ? "now" : null);
  const checkoutMode = raw === "now" || raw === "trial" ? raw : null;

  const title =
    checkoutMode === "now"
      ? "Crear cuenta y pagar"
      : checkoutMode === "trial"
        ? "Crear cuenta y probar gratis"
        : "Nueva cuenta";

  const subtitle =
    checkoutMode === "now"
      ? "Crea el despacho y te abrimos Stripe Checkout para activar el plan (75 €/mes)."
      : checkoutMode === "trial"
        ? "Crea el despacho y te abrimos Stripe con 7 días de prueba."
        : "Agencia, correo y contraseña. Un solo paso: al crear accedes al panel.";

  const submitLabel =
    checkoutMode === "now"
      ? "Crear y pagar con Stripe"
      : checkoutMode === "trial"
        ? "Crear y abrir prueba Stripe"
        : "Crear y entrar";

  async function afterRegister() {
    if (!checkoutMode) {
      window.location.assign("/dashboard");
      return;
    }
    setOpeningCheckout(true);
    const origin = window.location.origin;
    const err = await redirectToCheckout({
      trial: checkoutMode === "trial",
      successUrl: `${origin}/dashboard?billing=success`,
      cancelUrl: `${origin}/dashboard/planes?billing=cancel`,
    });
    if (err) {
      setOpeningCheckout(false);
      toast(err.error || "Cuenta creada, pero no se pudo abrir Stripe. Ve a Plan.", "error");
      window.location.assign("/dashboard/planes");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 panel-surface py-10">
      <div className="w-full max-w-sm pathway-card p-8">
        <h1 className="text-xl font-semibold mb-1 m-0 text-center" style={{ color: "var(--pw-text)" }}>
          {title}
        </h1>
        <p className="text-xs mb-6 m-0 text-center leading-relaxed" style={{ color: "var(--pw-muted)" }}>
          {subtitle}
        </p>
        {openingCheckout ? (
          <p className="m-0 text-center text-sm" style={{ color: "var(--pw-muted)" }}>
            Abriendo Stripe Checkout…
          </p>
        ) : (
          <AgencyRegisterForm submitLabel={submitLabel} onSuccess={() => void afterRegister()} />
        )}
        <p className="text-sm mt-6 text-center m-0">
          <Link href="/sign-in" style={{ color: "var(--pw-accent)" }}>
            Ya tengo cuenta
          </Link>
          {" · "}
          <Link href="/pathway#precios" style={{ color: "var(--pw-muted)" }}>
            Precios
          </Link>
        </p>
      </div>
    </div>
  );
}

export function SignUpForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center panel-surface text-sm" style={{ color: "var(--pw-muted)" }}>
          Cargando…
        </div>
      }
    >
      <SignUpFormInner />
    </Suspense>
  );
}
