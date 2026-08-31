"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ClipboardCopy,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  Shield,
} from "lucide-react";
import { apiUrl } from "@/lib/api/apiUrl";
import { requestCaseMagicLinkEmail } from "@/lib/api/requestCaseMagicLinkEmail";
import {
  buildClientInviteMessage,
  buildPortalUrl,
  buildWhatsAppMagicLinkUrl,
  buildWhatsAppPickContactUrl,
  copyText,
  formatMagicExpiresAt,
  isMagicLinkExpired,
} from "@/lib/portal/magicLink";
import type { Case, MagicLinkResponse } from "@/lib/api/caseTypes";
import { resolveMagicToken, resolvePortalUrl } from "@/lib/api/caseTypes";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export type MagicLinkCaseSlice = Pick<
  Case,
  "id" | "clientName" | "magicToken" | "magicLinkToken" | "magicExpiresAt" | "clientPhone" | "magicLinkUrl"
> & {
  clientEmail: string;
};

type Props = {
  caseData: MagicLinkCaseSlice;
  clientPhoneInput: string;
  onClientPhoneChange: (v: string) => void;
  onCaseUpdated: (patch: Partial<MagicLinkCaseSlice>) => void;
  agencyName?: string;
};

export function MagicLinkAccessPanel({
  caseData,
  clientPhoneInput,
  onClientPhoneChange,
  onCaseUpdated,
  agencyName,
}: Props) {
  const { toast } = useToast();
  const [magicBusy, setMagicBusy] = useState(false);
  const [magicErr, setMagicErr] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const token = resolveMagicToken(caseData);
  const hasMagicLink = token.length > 0;
  const portalUrl = hasMagicLink ? resolvePortalUrl(origin, caseData) || buildPortalUrl(origin, token) : "";
  const expired = hasMagicLink && isMagicLinkExpired(caseData.magicExpiresAt);
  const expiryLabel = formatMagicExpiresAt(caseData.magicExpiresAt);
  const waHref =
    portalUrl && !expired
      ? buildWhatsAppMagicLinkUrl(clientPhoneInput || caseData.clientPhone || "", caseData.clientName, portalUrl, agencyName)
      : null;
  const waPickHref =
    portalUrl && !expired ? buildWhatsAppPickContactUrl(caseData.clientName, portalUrl, agencyName) : null;
  const hasEmail = Boolean(caseData.clientEmail?.trim());

  async function generateMagicLink(regenerate = false) {
    const phone = clientPhoneInput.trim();
    if (!phone) {
      setMagicErr("Introduce el teléfono del cliente (con prefijo internacional, ej. +34…).");
      return;
    }
    setMagicBusy(true);
    setMagicErr(null);
    try {
      const r = await fetch(apiUrl(`/api/cases/${caseData.id}/magic-link`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientPhone: phone, regenerate: regenerate ? true : false }),
      });
      const j = (await r.json().catch(() => ({}))) as MagicLinkResponse & { error?: string; emailSent?: boolean };
      if (!r.ok) {
        setMagicErr(j.error ?? "No se pudo generar el acceso.");
        return;
      }
      if (j.case) {
        onCaseUpdated({
          ...j.case,
          magicToken: resolveMagicToken(j.case) || j.magicToken,
          magicLinkUrl: j.magicLinkUrl ?? j.case.magicLinkUrl,
          magicExpiresAt: j.magicExpiresAt ?? j.case.magicExpiresAt,
        });
        if (j.case.clientPhone?.trim()) onClientPhoneChange(j.case.clientPhone.trim());
      } else if (j.magicToken) {
        onCaseUpdated({
          magicToken: j.magicToken,
          magicExpiresAt: j.magicExpiresAt ?? caseData.magicExpiresAt,
          magicLinkUrl: j.magicLinkUrl,
          clientPhone: phone,
        });
        onClientPhoneChange(phone);
      }
      setRegenerateOpen(false);
      toast(regenerate ? "Enlace renovado" : "Enlace de acceso generado", "success");

      if (hasEmail && j.emailSent !== true) {
        const mail = await requestCaseMagicLinkEmail(caseData.id);
        if (mail.ok) toast("Correo enviado al cliente", "success");
      } else if (j.emailSent) {
        toast("Correo enviado al cliente", "success");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMagicErr(msg ? `Error de red: ${msg}` : "No se pudo contactar con el servidor.");
    } finally {
      setMagicBusy(false);
    }
  }

  async function resendEmail() {
    if (!hasEmail) {
      toast("Añade el email del cliente en el expediente", "error");
      return;
    }
    setEmailBusy(true);
    const res = await requestCaseMagicLinkEmail(caseData.id);
    setEmailBusy(false);
    if (res.ok) toast("Correo reenviado al cliente", "success");
    else toast(res.error ?? "No se pudo enviar el correo", "error");
  }

  async function copyUrl() {
    if (!portalUrl) return;
    if (await copyText(portalUrl)) toast("Enlace copiado", "success");
    else toast("No se pudo copiar", "error");
  }

  async function copyInviteMessage() {
    if (!portalUrl) return;
    const text = buildClientInviteMessage(caseData.clientName, portalUrl, agencyName);
    if (await copyText(text)) toast("Mensaje completo copiado (listo para WhatsApp o email)", "success");
    else toast("No se pudo copiar", "error");
  }

  if (!hasMagicLink) {
    return (
      <section className="pathway-card space-y-4 p-5">
        <div>
          <h3 className="m-0 text-base font-semibold">Enlace para el cliente</h3>
          <p className="m-0 mt-2 text-sm leading-relaxed text-[var(--pw-muted)]">
            Genera un enlace único. El cliente abre la URL y sube documentos <strong className="text-[var(--pw-text)]">sin registrarse</strong>.
            {hasEmail ? (
              <>
                {" "}
                Si el servidor tiene correo configurado, se enviará a{" "}
                <strong className="text-[var(--pw-text)]">{caseData.clientEmail.trim()}</strong>.
              </>
            ) : (
              " Añade email en el expediente si quieres envío automático por correo."
            )}
          </p>
        </div>
        <ol className="m-0 list-decimal space-y-1 pl-5 text-xs text-[var(--pw-muted)]">
          <li>Guarda el teléfono del cliente (WhatsApp).</li>
          <li>Genera el enlace.</li>
          <li>Comparte por correo, WhatsApp o copia el mensaje.</li>
        </ol>
        <div>
          <label className="pathway-label" htmlFor="case-client-phone">
            Teléfono del cliente
          </label>
          <input
            id="case-client-phone"
            type="tel"
            inputMode="tel"
            placeholder="Ej. +34600123456"
            className="pathway-input"
            value={clientPhoneInput}
            onChange={(e) => {
              onClientPhoneChange(e.target.value);
              setMagicErr(null);
            }}
            disabled={magicBusy}
          />
        </div>
        {magicErr ? (
          <p className="m-0 text-sm text-[var(--pw-danger)]" role="alert">
            {magicErr}
          </p>
        ) : null}
        <button
          type="button"
          className="pathway-btn pathway-btn-primary inline-flex items-center gap-2"
          disabled={magicBusy}
          onClick={() => void generateMagicLink(false)}
        >
          {magicBusy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generando…
            </>
          ) : (
            <>
              <Link2 className="size-4" />
              Generar enlace de acceso
            </>
          )}
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="m-0 text-sm font-semibold sm:text-base">Enlace de acceso activo</h3>
            {expiryLabel ? (
              <p
                className="m-0 mt-0.5 text-xs"
                style={{ color: expired ? "var(--pw-danger)" : "var(--pw-muted)" }}
              >
                {expiryLabel}
              </p>
            ) : (
              <p className="m-0 mt-0.5 text-xs text-[var(--pw-muted)]">Sin fecha de caducidad configurada en el servidor.</p>
            )}
          </div>
          {expired ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: "var(--pw-danger-dim)", color: "var(--pw-danger)" }}
            >
              <AlertTriangle className="size-3.5" />
              Caducado
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: "var(--pw-success-dim)", color: "var(--pw-success)" }}
            >
              Activo
            </span>
          )}
        </div>

        {expired ? (
          <p className="m-0 rounded-lg p-2.5 text-sm" style={{ background: "var(--pw-danger-dim)", color: "var(--pw-danger)" }}>
            Este enlace ya no sirve para el cliente. Genera uno nuevo y vuelve a enviarlo.
          </p>
        ) : null}

        <div>
          <label className="pathway-label" htmlFor="portal-magic-url">
            URL para el cliente
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id="portal-magic-url" readOnly className="pathway-input flex-1 font-mono text-xs" value={portalUrl} />
            <button
              type="button"
              className="pathway-btn pathway-btn-ghost shrink-0 border"
              style={{ borderColor: "var(--pw-border)" }}
              onClick={() => void copyUrl()}
              disabled={expired}
            >
              <ClipboardCopy className="size-4" />
              Copiar enlace
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="m-0 text-[10px] font-medium uppercase tracking-wide text-[var(--pw-muted)]">Compartir</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="pathway-btn pathway-btn-ghost text-sm"
                onClick={() => void copyInviteMessage()}
                disabled={expired}
              >
                <ClipboardCopy className="size-4" />
                Copiar mensaje
              </button>
              {hasEmail ? (
                <button
                  type="button"
                  className="pathway-btn pathway-btn-ghost text-sm"
                  disabled={emailBusy || expired}
                  onClick={() => void resendEmail()}
                >
                  <Mail className="size-4" />
                  {emailBusy ? "Enviando…" : "Enviar por correo"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="pathway-label" htmlFor="case-client-phone-active">
              Teléfono (WhatsApp)
            </label>
            <input
              id="case-client-phone-active"
              type="tel"
              className="pathway-input"
              value={clientPhoneInput}
              onChange={(e) => onClientPhoneChange(e.target.value)}
              placeholder="+34 600 000 000"
              disabled={expired}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--pw-success)" }}
                disabled={!waHref || expired}
                onClick={() => waHref && window.open(waHref, "_blank", "noopener,noreferrer")}
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </button>
              {waPickHref ? (
                <button
                  type="button"
                  className="pathway-btn pathway-btn-ghost text-sm"
                  disabled={expired}
                  onClick={() => window.open(waPickHref, "_blank", "noopener,noreferrer")}
                >
                  Elegir contacto
                </button>
              ) : null}
              <button
                type="button"
                className="pathway-btn pathway-btn-ghost text-sm"
                disabled={magicBusy}
                onClick={() => setRegenerateOpen(true)}
              >
                <RefreshCw className="size-4" />
                Nuevo enlace
              </button>
            </div>
          </div>
        </div>

        <div
          className="flex gap-2 rounded-lg border p-2.5 text-xs leading-relaxed"
          style={{ borderColor: "var(--pw-border)", color: "var(--pw-muted)" }}
        >
          <Shield className="size-4 shrink-0 text-[var(--pw-accent)]" aria-hidden />
          <p className="m-0">
            Un enlace = un expediente. No lo publiques. Si se filtró, usa <strong className="text-[var(--pw-text)]">Nuevo enlace</strong>.
          </p>
        </div>
      </section>

      <Modal
        open={regenerateOpen}
        onClose={() => !magicBusy && setRegenerateOpen(false)}
        title="¿Generar un enlace nuevo?"
        description="El cliente necesitará el nuevo enlace. El anterior puede dejar de funcionar según la configuración del servidor."
      >
        <div className="flex justify-end gap-2">
          <button type="button" className="pathway-btn pathway-btn-ghost" disabled={magicBusy} onClick={() => setRegenerateOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="pathway-btn pathway-btn-primary" disabled={magicBusy} onClick={() => void generateMagicLink(true)}>
            {magicBusy ? "Generando…" : "Sí, generar nuevo"}
          </button>
        </div>
      </Modal>
    </>
  );
}
