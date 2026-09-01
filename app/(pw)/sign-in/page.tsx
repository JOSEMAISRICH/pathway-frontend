"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/api/apiUrl";
import { isCrossOriginApiConfigured } from "@/lib/api/crossOriginApiWarning";
import { apiConnectionErrorMessage, isLikelyApiDownStatus, isNextProxyFailureMessage } from "@/lib/api/apiConnectionError";
import { readApiErrorMessage } from "@/lib/api/readApiError";
import { withAuthApiSetupHint } from "@/lib/api/withAuthApiSetupHint";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { tryApplySessionCookieFromAuthJson } from "@/lib/auth/applySessionFromAuthJson";
import { messageForSessionVerifyFailure, verifyNextSessionCookie } from "@/lib/auth/verifyNextSessionCookie";

const LAST_EMAIL_KEY = "pw_last_email";

function SignInForm() {
  const searchParams = useSearchParams();
  /** Primitivo estable: no usar el objeto `searchParams` como dependencia (cambia cada render y resetea el formulario). */
  const emailParam = searchParams.get("email") ?? "";
  const resetOk = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const crossOriginApi = isCrossOriginApiConfigured();

  useEffect(() => {
    let fromUrl = emailParam;
    try {
      if (fromUrl) fromUrl = decodeURIComponent(fromUrl);
    } catch {
      /* usar raw */
    }
    const fromUrlT = fromUrl.trim();
    if (fromUrlT) {
      setEmail(fromUrlT);
      return;
    }
    const saved =
      typeof window !== "undefined" ? (window.localStorage.getItem(LAST_EMAIL_KEY) ?? "").trim() : "";
    if (saved) setEmail(saved);
  }, [emailParam]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email.trim()) {
      setErr("Falta el correo.");
      return;
    }
    setBusy(true);
    let r: Response;
    try {
      r = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      setBusy(false);
      const cors =
        process.env.NEXT_PUBLIC_FORCE_DIRECT_API === "true"
          ? " Si el API es otro origen, revisa CORS (origen del front y credenciales)."
          : "";
      setErr(
        "No hay conexión con el servidor. ¿Express en marcha y `API_PROXY_TARGET` en `.env.local` (reinicia Next tras editarlo)?" +
          cors
      );
      return;
    }
    setBusy(false);
    if (!r.ok) {
      const detail = withAuthApiSetupHint(await readApiErrorMessage(r), r.status);
      if (isLikelyApiDownStatus(r.status) && isNextProxyFailureMessage(detail)) {
        setErr(apiConnectionErrorMessage());
        return;
      }
      const hint =
        r.status >= 500
          ? " Comprueba que Express esté en marcha en el puerto 3000 (terminal PathWay-Backend)."
          : "";
      setErr(`${detail} (HTTP ${r.status})${hint}`);
      return;
    }
    await tryApplySessionCookieFromAuthJson(r);
    let sessionOk = await verifyNextSessionCookie();
    if (!sessionOk.ok) {
      const probe = await fetch(apiUrl("/api/cases"), { credentials: "include", method: "GET" });
      if (probe.ok) sessionOk = { ok: true };
      else if (probe.status === 402) {
        window.location.assign("/dashboard/planes?expired=1");
        return;
      }
    }
    if (!sessionOk.ok) {
      setErr(messageForSessionVerifyFailure(sessionOk.reason));
      return;
    }
    try {
      localStorage.setItem(LAST_EMAIL_KEY, email.trim());
    } catch {
      /* ignore */
    }
    window.location.assign("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 panel-surface py-10">
      <div className="w-full max-w-sm pathway-card p-8">
        <h1 className="text-xl font-semibold mb-2 m-0 text-center" style={{ color: "var(--pw-text)" }}>
          Entrar
        </h1>
        <p className="m-0 mb-6 text-center text-xs leading-relaxed" style={{ color: "var(--pw-muted)" }}>
          Acceso para tu despacho o agencia. Los clientes finales entran por el enlace que les envías, no aquí.
        </p>

        {resetOk ? (
          <p
            className="mb-5 rounded-xl p-3 text-xs leading-relaxed"
            style={{ background: "var(--pw-success-dim)", color: "var(--pw-text)" }}
            role="status"
          >
            Contraseña actualizada. Ya puedes entrar con la nueva.
          </p>
        ) : null}

        {crossOriginApi && (
          <div
            className="text-xs mb-5 p-3 rounded-xl border leading-relaxed"
            style={{ borderColor: "var(--pw-accent)", background: "var(--pw-accent-dim)", color: "var(--pw-text)" }}
            role="status"
          >
            Tienes <code className="text-[10px]">NEXT_PUBLIC_API_BASE_URL</code>: el login puede devolver 200 pero la
            cookie no se guarda en este origen. Para desarrollo usa solo{" "}
            <code className="text-[10px]">API_PROXY_TARGET</code> y rutas relativas <code className="text-[10px]">/api</code>.
          </div>
        )}

        <form onSubmit={(e) => void login(e)} className="space-y-4">
          <div>
            <label className="pathway-label" htmlFor="signin-email">
              Correo
            </label>
            <input
              id="signin-email"
              type="email"
              className="pathway-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              placeholder="tu@correo.com"
            />
          </div>
          <PasswordInput
            id="signin-password"
            label="Contraseña"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />
          <p className="m-0 text-right">
            <Link href="/forgot-password" className="text-xs no-underline" style={{ color: "var(--pw-accent)" }}>
              ¿Olvidaste la contraseña?
            </Link>
          </p>
          {err && (
            <p className="text-sm m-0" style={{ color: "var(--pw-danger)" }}>
              {err}
            </p>
          )}
          <button
            type="submit"
            className="pathway-btn pathway-btn-primary w-full"
            disabled={busy || !email.trim()}
            aria-label="Entrar al panel del despacho"
          >
            {busy ? "Entrando…" : "Entrar al panel"}
          </button>
        </form>

        <p className="m-0 mt-6 text-center text-sm" style={{ color: "var(--pw-muted)" }}>
          ¿Primera vez?{" "}
          <Link href="/sign-up" className="no-underline font-medium" style={{ color: "var(--pw-accent)" }}>
            Crear cuenta de despacho
          </Link>
        </p>

        <p className="text-xs mt-4 text-center m-0" style={{ color: "var(--pw-muted)" }}>
          <Link href="/pathway" className="no-underline" style={{ color: "var(--pw-muted)" }}>
            Volver
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center panel-surface text-sm" style={{ color: "var(--pw-muted)" }}>
          Cargando…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
