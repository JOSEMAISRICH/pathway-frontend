"use client";

import { FormEvent, useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { apiUrl } from "@/lib/api/apiUrl";
import { maybeSendRegistrationVerificationEmail } from "@/lib/email/maybeSendRegistrationVerificationEmail";
import { readApiErrorMessage } from "@/lib/api/readApiError";
import { withAuthApiSetupHint } from "@/lib/api/withAuthApiSetupHint";
import { tryApplySessionCookieFromAuthJson } from "@/lib/auth/applySessionFromAuthJson";
import { messageForSessionVerifyFailure, verifyNextSessionCookie } from "@/lib/auth/verifyNextSessionCookie";

const LAST_EMAIL_KEY = "pw_last_email";

type Props = {
  submitLabel?: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
};

export function AgencyRegisterForm({
  submitLabel = "Crear y entrar",
  className = "",
  disabled = false,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setErr("");
    setBusy(true);
    const body = {
      name: name.trim(),
      email: email.trim(),
      password,
    };

    let r: Response;
    try {
      r = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
    } catch {
      setBusy(false);
      const cors =
        process.env.NEXT_PUBLIC_FORCE_DIRECT_API === "true"
          ? " Si llamas al API en otro origen, revisa CORS en Express (origen del front y credenciales)."
          : "";
      setErr(
        "No hay conexión con el servidor. Comprueba que Express esté en marcha y que en `.env.local` exista `API_PROXY_TARGET` apuntando a ese puerto; reinicia Next tras cambiarlo." + cors
      );
      return;
    }
    if (!r.ok) {
      setBusy(false);
      setErr(withAuthApiSetupHint(await readApiErrorMessage(r), r.status));
      return;
    }

    await tryApplySessionCookieFromAuthJson(r);

    await maybeSendRegistrationVerificationEmail(body.email, body.name);

    let loginR: Response;
    try {
      loginR = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: body.email, password: body.password }),
      });
    } catch {
      setBusy(false);
      setErr(
        "Cuenta creada pero no se pudo conectar para iniciar sesión. Revisa Express y `API_PROXY_TARGET` en `.env.local`."
      );
      return;
    }

    const goDashboard = async () => {
      const v = await verifyNextSessionCookie();
      if (!v.ok) {
        setBusy(false);
        setErr(messageForSessionVerifyFailure(v.reason));
        return;
      }
      try {
        localStorage.setItem(LAST_EMAIL_KEY, body.email);
      } catch {
        /* ignore */
      }
      if (onSuccess) {
        setBusy(false);
        onSuccess();
      } else {
        window.location.assign("/dashboard");
      }
    };

    await tryApplySessionCookieFromAuthJson(loginR);

    if (loginR.ok) {
      await goDashboard();
      return;
    }

    const sessionProbe = await fetch(apiUrl("/api/cases"), { credentials: "include", method: "GET" });
    setBusy(false);
    if (sessionProbe.ok) {
      await goDashboard();
      return;
    }

    const loginErr = withAuthApiSetupHint(await readApiErrorMessage(loginR), loginR.status);
    setErr(
      `La cuenta se creó pero no hay sesión en el navegador. Login: ${loginErr}. Si el API ya autenticó, que devuelva JSON con \`token\` (mismo JWT que la cookie) o \`Set-Cookie: pw_session\`.`
    );
    try {
      localStorage.setItem(LAST_EMAIL_KEY, body.email);
    } catch {
      /* ignore */
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={`space-y-3 ${className}`}>
      <div>
        <label className="pathway-label">Nombre de la agencia</label>
        <input
          className="pathway-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={disabled || busy}
          autoComplete="organization"
        />
      </div>
      <div>
        <label className="pathway-label">Correo</label>
        <input
          type="email"
          className="pathway-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={disabled || busy}
          autoComplete="email"
        />
      </div>
      <PasswordInput
        label="Contraseña"
        value={password}
        onChange={setPassword}
        required
        minLength={6}
        disabled={disabled || busy}
        autoComplete="new-password"
      />
      {err && (
        <p className="text-sm m-0" style={{ color: "var(--pw-danger)" }}>
          {err}
        </p>
      )}
      <button type="submit" className="pathway-btn pathway-btn-primary w-full justify-center" disabled={disabled || busy}>
        {busy ? "Un momento…" : submitLabel}
      </button>
    </form>
  );
}
