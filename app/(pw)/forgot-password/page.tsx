"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api/apiUrl";
import { readApiErrorMessage } from "@/lib/api/readApiError";
import { withAuthApiSetupHint } from "@/lib/api/withAuthApiSetupHint";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!r.ok) {
        setErr(withAuthApiSetupHint(await readApiErrorMessage(r), r.status));
        return;
      }
      setSent(true);
    } catch {
      setErr("No hay conexión con el servidor. Comprueba que Express esté en marcha.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 panel-surface">
      <div className="pathway-card w-full max-w-sm p-8">
        <h1 className="m-0 mb-2 text-center text-xl font-semibold" style={{ color: "var(--pw-text)" }}>
          Recuperar contraseña
        </h1>
        <p className="m-0 mb-6 text-center text-xs leading-relaxed" style={{ color: "var(--pw-muted)" }}>
          Te enviaremos un enlace para restablecer la contraseña de tu cuenta de despacho.
        </p>

        {sent ? (
          <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: "var(--pw-success-dim)", color: "var(--pw-text)" }}>
            Si existe una cuenta con ese correo, recibirás un email con instrucciones. Revisa también la carpeta de spam.
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div>
              <label className="pathway-label" htmlFor="forgot-email">
                Correo del despacho
              </label>
              <input
                id="forgot-email"
                type="email"
                className="pathway-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="tu@despacho.com"
              />
            </div>
            {err ? (
              <p className="m-0 text-sm" style={{ color: "var(--pw-danger)" }}>
                {err}
              </p>
            ) : null}
            <button type="submit" className="pathway-btn pathway-btn-primary w-full justify-center" disabled={busy}>
              {busy ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}

        <p className="m-0 mt-8 text-center text-xs" style={{ color: "var(--pw-muted)" }}>
          <Link href="/sign-in" className="no-underline" style={{ color: "var(--pw-accent)" }}>
            Volver a entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
