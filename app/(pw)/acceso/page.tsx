"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PortalNav } from "@/components/pathway/PortalNav";
import { parseMagicTokenFromInput } from "@/lib/portal/parseMagicToken";

/** Pantalla para clientes que deben pegar el enlace que les envió la agencia (fuera de /portal/* para no chocar con el token). */
export default function ClientAccessPage() {
  const router = useRouter();
  const [accessInput, setAccessInput] = useState("");
  const [err, setErr] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const token = parseMagicTokenFromInput(accessInput);
    if (!token) {
      setErr("Pega el enlace completo o el código que te envió tu agencia.");
      return;
    }
    router.push(`/portal/${encodeURIComponent(token)}`);
  }

  return (
    <div className="portal-magic-surface min-h-screen flex flex-col">
      <PortalNav />
      <main className="flex-1 px-6 py-12 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2 m-0">Acceso a mi expediente</h1>
        <p className="text-sm mb-8 leading-relaxed m-0" style={{ color: "var(--pw-muted)" }}>
          Pega el enlace que te envió tu despacho por correo o WhatsApp. No necesitas crear cuenta ni contraseña.
        </p>

        <form id="acceso-expediente" onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="pathway-label" htmlFor="access-link-input">
              Enlace de tu agencia
            </label>
            <textarea
              id="access-link-input"
              className="pathway-input min-h-[88px] resize-y font-mono text-sm"
              placeholder="https://…/portal/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={accessInput}
              onChange={(e) => setAccessInput(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          </div>
          {err ? (
            <p className="text-sm m-0" style={{ color: "var(--pw-danger)" }}>
              {err}
            </p>
          ) : null}
          <button type="submit" className="pathway-btn pathway-btn-primary w-full justify-center py-3 rounded-xl">
            Continuar
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-xs mt-8 leading-relaxed m-0" style={{ color: "var(--pw-muted)" }}>
          Si abriste el enlace directamente desde el mensaje de tu agencia, no hace falta que uses esta pantalla.
          Si no tienes enlace, pídeselo a quien gestiona tu trámite.
        </p>

        <p className="text-xs mt-6 m-0" style={{ color: "var(--pw-muted)" }}>
          <Link href="/pathway" className="no-underline font-medium" style={{ color: "var(--pw-accent)" }}>
            ← Volver al inicio
          </Link>
        </p>
      </main>
    </div>
  );
}
