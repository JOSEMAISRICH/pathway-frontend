"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiUrl } from "@/lib/api/apiUrl";
import { apiConnectionErrorMessage, isLikelyApiDownStatus } from "@/lib/api/apiConnectionError";
import { requestCaseMagicLinkEmail } from "@/lib/api/requestCaseMagicLinkEmail";
import { buildPortalUrl } from "@/lib/portal/magicLink";
import type { Case, CreateCaseResponse } from "@/lib/api/caseTypes";
import { CASE_TYPE_OPTIONS, DEFAULT_CASE_TYPE, type CaseTypeId } from "@/lib/api/caseEngine";
import { resolveMagicToken, resolvePortalUrl } from "@/lib/api/caseTypes";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { prefetchCaseDetailPage } from "@/lib/dashboard/prefetchCaseDetail";

export type CreatedCaseResult = {
  id: string;
  clientName?: string;
  message: string;
  portalUrl?: string;
  emailSent?: boolean;
  attemptedEmail?: boolean;
  createdCase?: Case;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (result: CreatedCaseResult) => void;
  onReload: (opts?: { silent?: boolean }) => Promise<void>;
};

export function CreateCaseModal({ open, onClose, onCreated, onReload }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [inviteByEmail, setInviteByEmail] = useState(true);
  const [caseType, setCaseType] = useState<CaseTypeId>(DEFAULT_CASE_TYPE);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) prefetchCaseDetailPage();
  }, [open]);

  function resetForm() {
    setName("");
    setEmail("");
    setClientPhone("");
    setCreateErr(null);
    setInviteByEmail(true);
    setCaseType(DEFAULT_CASE_TYPE);
  }

  function handleClose() {
    if (busy) return;
    resetForm();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateErr(null);
    setBusy(true);
    try {
      const r = await fetch(apiUrl("/api/cases"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name,
          clientEmail: email,
          clientPhone: clientPhone.trim() || undefined,
          sendMagicLinkEmail: inviteByEmail && email.trim().length > 0,
          caseType,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as CreateCaseResponse & { error?: string; emailError?: string };
      if (!r.ok) {
        if (isLikelyApiDownStatus(r.status)) {
          setCreateErr(apiConnectionErrorMessage());
        } else {
          setCreateErr(j.error?.trim() || `No se pudo crear el expediente (${r.status}).`);
        }
        return;
      }

      const newId = j.case?.id ?? j.id;
      const tok = resolveMagicToken(j.case ?? null);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const portalUrl = j.case ? resolvePortalUrl(origin, j.case) : tok ? buildPortalUrl(origin, tok) : undefined;
      const wantsMail = inviteByEmail && email.trim().length > 0;
      const createdCase = j.case;

      resetForm();
      onClose();

      if (!newId) {
        toast("Expediente creado.", "success");
        return;
      }

      let emailSent = j.emailSent === true;
      const backendEmailError = j.emailError?.trim();
      if (portalUrl && wantsMail && !emailSent) {
        const mailRes = await requestCaseMagicLinkEmail(newId);
        emailSent = mailRes.ok;
        if (!mailRes.ok && mailRes.error) toast(mailRes.error, "error");
      } else if (wantsMail && !emailSent && backendEmailError) {
        toast(backendEmailError, "error");
      }

      const message = portalUrl
        ? wantsMail && emailSent
          ? "Expediente creado. Enlace enviado al cliente por correo."
          : wantsMail && !emailSent
            ? backendEmailError
              ? `Expediente creado. ${backendEmailError}`
              : "Expediente creado. No se pudo confirmar el envío del correo."
            : "Expediente creado. Comparte el enlace con el cliente."
        : "Expediente creado. Genera el enlace de acceso en la ficha.";

      toast(message, emailSent || !wantsMail ? "success" : "default");
      onCreated({
        id: newId,
        clientName: name.trim(),
        message,
        portalUrl,
        emailSent,
        attemptedEmail: wantsMail,
        createdCase,
      });
      void onReload({ silent: true });
    } catch {
      setCreateErr(apiConnectionErrorMessage());
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nuevo expediente" description="Datos del cliente y envío del enlace de subida." size="lg">
      <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="pathway-label" htmlFor="new-case-type">
            Tipo de trámite
          </label>
          <select
            id="new-case-type"
            className="pathway-input"
            value={caseType}
            onChange={(e) => setCaseType(e.target.value as CaseTypeId)}
            disabled={busy}
          >
            {CASE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label} ({opt.documentsCount} docs)
              </option>
            ))}
          </select>
          <p className="m-0 mt-1.5 text-xs text-[var(--pw-muted)]">
            {CASE_TYPE_OPTIONS.find((o) => o.id === caseType)?.description}
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="pathway-label" htmlFor="new-case-name">
            Nombre del cliente
          </label>
          <input
            id="new-case-name"
            className="pathway-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={busy}
            autoFocus
          />
        </div>
        <div>
          <label className="pathway-label" htmlFor="new-case-email">
            Email del cliente
          </label>
          <input
            id="new-case-email"
            type="email"
            className="pathway-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            placeholder="Para enviar el enlace"
          />
        </div>
        <div>
          <label className="pathway-label" htmlFor="new-case-phone">
            Teléfono (WhatsApp)
          </label>
          <input
            id="new-case-phone"
            type="tel"
            inputMode="tel"
            className="pathway-input"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            disabled={busy}
            placeholder="+34…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer select-none items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={inviteByEmail}
              onChange={(e) => setInviteByEmail(e.target.checked)}
              disabled={busy}
              className="mt-1 shrink-0"
            />
            <span className="text-[var(--pw-muted)]">Enviar enlace por correo al crear (requiere email y SMTP en el servidor).</span>
          </label>
        </div>
        {createErr ? (
          <p className="sm:col-span-2 m-0 text-sm text-[var(--pw-danger)]" role="alert">
            {createErr}
          </p>
        ) : null}
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <button type="button" className="pathway-btn pathway-btn-ghost" disabled={busy} onClick={handleClose}>
            Cancelar
          </button>
          <button type="submit" className="pathway-btn pathway-btn-primary" disabled={busy}>
            <Sparkles className="size-4" />
            {busy ? "Creando…" : "Crear expediente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
