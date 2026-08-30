"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AgencyRegisterForm } from "@/components/auth/AgencyRegisterForm";

function SignUpFormInner() {
  const searchParams = useSearchParams();
  const fromSubscribe = searchParams.get("checkout") === "now" || searchParams.get("pay") === "1";

  const title = fromSubscribe ? "Crear cuenta del despacho" : "Nueva cuenta";

  const subtitle = fromSubscribe
    ? "Primero crea la cuenta. Entras al panel con 7 días de prueba; puedes suscribirte cuando quieras desde Plan."
    : "Agencia, correo y contraseña. Al crear accedes al panel con 7 días de prueba gratis.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 panel-surface py-10">
      <div className="w-full max-w-sm pathway-card p-8">
        <h1 className="text-xl font-semibold mb-1 m-0 text-center" style={{ color: "var(--pw-text)" }}>
          {title}
        </h1>
        <p className="text-xs mb-6 m-0 text-center leading-relaxed" style={{ color: "var(--pw-muted)" }}>
          {subtitle}
        </p>
        <AgencyRegisterForm submitLabel="Crear y entrar" />
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
