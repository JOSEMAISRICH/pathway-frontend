"use client";

import Link from "next/link";
import { AlertCircle, Clock, Lock } from "lucide-react";
import { MAGIC_PORTAL_ERRORS } from "@/lib/api/caseTypes";

type Props = {
  status?: number;
  /** Mensaje del API (`error` en JSON), si está disponible */
  errorMessage?: string;
};

/** Cuando no hay API o el token no es válido: feedback honesto (sin modo demo local). */
export function MagicPortalUnavailable({ status, errorMessage }: Props) {
  const expired = status === 410;
  const closed = expired && (errorMessage?.includes("cerrado") ?? false);
  const notFound = status === 404;
  const forbidden = status === 401 || status === 403;

  const serviceDown = status === 500 || status === 502 || status === 503;
  const title = closed
    ? "Expediente cerrado"
    : expired
      ? "Este enlace ha caducado"
      : notFound
        ? "Enlace no encontrado"
        : forbidden
          ? "Enlace no válido"
          : serviceDown
            ? "El servidor no está disponible"
            : "No pudimos abrir tu enlace de envío";

  const detail = closed
    ? "Este expediente ya está cerrado. Si necesitas enviar más documentación, contacta con tu despacho."
    : expired
      ? "Por seguridad, los enlaces de acceso tienen fecha de caducidad (suelen durar 30 días). Pide a tu gestor un enlace nuevo."
      : notFound
        ? "Este enlace no existe o ya no está activo. Si lo copiaste desde un correo, comprueba que no falte ningún carácter."
        : forbidden
          ? "No tienes permiso para usar este enlace. Si crees que es un error, contacta con tu despacho."
          : serviceDown
            ? "El panel o la base de datos no están en marcha. Si eres el gestor, arranca Express (:3000) y Next (:5500) y vuelve a intentarlo."
            : errorMessage ?? "No pudimos conectar con el servicio de documentación en este momento. Revisa tu conexión o vuelve a intentarlo dentro de unos minutos.";

  const Icon = closed ? Lock : expired ? Clock : AlertCircle;
  const iconColor = closed || expired ? "var(--pw-warning)" : "var(--pw-danger)";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-14 portal-magic-surface">
      <div className="pathway-card w-full max-w-md border p-8 text-center" style={{ borderColor: "var(--pw-border)" }}>
        <div className="mb-4 flex justify-center" style={{ color: iconColor }}>
          <Icon size={40} strokeWidth={2} aria-hidden />
        </div>
        <h1 className="m-0 mb-2 text-lg font-semibold" style={{ color: "var(--pw-text)" }}>
          {title}
        </h1>
        <p className="m-0 mb-6 text-sm leading-relaxed" style={{ color: "var(--pw-muted)" }}>
          {detail}
        </p>
        <div className="flex flex-col gap-2">
          {!closed ? (
            <Link href="/acceso" className="pathway-btn pathway-btn-primary inline-flex justify-center no-underline">
              Pegar otro enlace
            </Link>
          ) : null}
          {expired && !closed ? (
            <p className="m-0 text-[11px] leading-relaxed" style={{ color: "var(--pw-muted)" }}>
              Tu gestor puede generar un enlace nuevo desde el panel del expediente.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
