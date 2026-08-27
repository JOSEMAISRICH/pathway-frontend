"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { apiUrl } from "@/lib/api/apiUrl";
import { readApiErrorMessage } from "@/lib/api/readApiError";
import { withAuthApiSetupHint } from "@/lib/api/withAuthApiSetupHint";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!token) {
      setErr("Falta el token del enlace. Abre el correo de recuperación de nuevo.");
      return;
    }
    if (password.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErr("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!r.ok) {
        setErr(withAuthApiSetupHint(await readApiErrorMessage(r), r.status));
        return;
      }
      router.replace("/sign-in?reset=1");
    } catch {
      setErr("No hay conexión con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="pathway-card w-full max-w-sm p-8 text-center">
        <p className="m-0 mb-4 text-sm" style={{ color: "var(--pw-danger)" }}>
          Enlace inválido o incompleto.
        </p>
        <Link href="/forgot-password" className="pathway-btn pathway-btn-primary inline-flex no-underline">
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="pathway-card w-full max-w-sm p-8">
      <h1 className="m-0 mb-6 text-center text-xl font-semibold" style={{ color: "var(--pw-text)" }}>
        Nueva contraseña
      </h1>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <PasswordInput
          id="reset-password"
          label="Nueva contraseña"
          value={password}
          onChange={setPassword}
          required
          minLength={8}
          autoComplete="new-password"
          autoFocus
        />
        <PasswordInput
          id="reset-password-confirm"
          label="Repetir contraseña"
          value={confirm}
          onChange={setConfirm}
          required
          minLength={8}
          autoComplete="new-password"
        />
        {err ? (
          <p className="m-0 text-sm" style={{ color: "var(--pw-danger)" }}>
            {err}
          </p>
        ) : null}
        <button type="submit" className="pathway-btn pathway-btn-primary w-full justify-center" disabled={busy}>
          {busy ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 panel-surface">
      <Suspense
        fallback={
          <div className="text-sm" style={{ color: "var(--pw-muted)" }}>
            Cargando…
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
      <p className="m-0 mt-6 text-center text-xs" style={{ color: "var(--pw-muted)" }}>
        <Link href="/sign-in" className="no-underline" style={{ color: "var(--pw-accent)" }}>
          Volver a entrar
        </Link>
      </p>
    </div>
  );
}
