"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderOpen, Plus, Search } from "lucide-react";
import { apiConnectionErrorMessage, isLikelyApiDownStatus, isNextProxyFailureMessage } from "@/lib/api/apiConnectionError";
import { readApiErrorMessage } from "@/lib/api/readApiError";
import { apiUrl } from "@/lib/api/apiUrl";
import { caseSemaphore } from "@/lib/dashboard/caseStatus";
import { formatUpdatedAt } from "@/lib/dashboard/formatUpdatedAt";
import { CreateCaseModal, type CreatedCaseResult } from "@/components/dashboard/CreateCaseModal";
import { CaseAccessModal } from "@/components/dashboard/CaseAccessModal";
import { CaseRowActions } from "@/components/dashboard/CaseRowActions";
import { BillingStatusPanel } from "@/components/dashboard/BillingStatusPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import type { Case, CaseListItem } from "@/lib/api/caseTypes";
import { caseToListItem, parseCaseDetailResponse, parseCasesListResponse, resolveMagicToken, resolvePortalUrl } from "@/lib/api/caseTypes";
import { prefetchCaseDetailPage } from "@/lib/dashboard/prefetchCaseDetail";
import { buildClientInviteMessage, copyText } from "@/lib/portal/magicLink";
import { subscriptionRequiredPath, isSubscriptionRequiredStatus } from "@/lib/api/subscriptionGate";
import { useToast } from "@/components/ui/Toast";

type Row = CaseListItem;

export default function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdBanner, setCreatedBanner] = useState<CreatedCaseResult | null>(null);
  const [accessCase, setAccessCase] = useState<Case | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setErr(null);
    try {
      const r = await fetch(apiUrl("/api/cases"), { credentials: "include" });
      if (r.status === 401) {
        setLoading(false);
        router.replace("/sign-in");
        return;
      }
      if (isSubscriptionRequiredStatus(r.status)) {
        setLoading(false);
        router.replace(subscriptionRequiredPath());
        return;
      }
      if (r.status === 503) {
        if (!silent) {
          setErr("El servidor no tiene los datos operativos ahora mismo.");
          setRows([]);
        }
        setLoading(false);
        return;
      }
      if (!r.ok) {
        if (!silent) {
          const detail = await readApiErrorMessage(r);
          setErr(
            isLikelyApiDownStatus(r.status) && isNextProxyFailureMessage(detail)
              ? apiConnectionErrorMessage()
              : detail || `Error al cargar expedientes (${r.status})`,
          );
          setLoading(false);
        }
        return;
      }
      const j = (await r.json()) as unknown;
      setRows(parseCasesListResponse(j));
      setErr(null);
      setLoading(false);
    } catch {
      if (!silent) {
        setErr(apiConnectionErrorMessage());
        setLoading(false);
      }
    }
  }, [router]);

  function resolveCaseForAccess(caseId: string): Case | null {
    if (createdBanner?.id === caseId && createdBanner.createdCase) {
      return createdBanner.createdCase;
    }
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(`pw:case:${caseId}`);
        if (raw) {
          const parsed = parseCaseDetailResponse(JSON.parse(raw));
          if (parsed) return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    const row = rows.find((r) => r.id === caseId);
    if (!row) return null;
    return {
      id: row.id,
      clientName: row.clientName,
      clientEmail: row.clientEmail,
      clientPhone: row.clientPhone,
      magicToken: row.magicToken,
      magicExpiresAt: row.magicExpiresAt,
      magicLinkUrl: row.magicLinkUrl,
    } as Case;
  }

  function openCaseAccess(caseId: string) {
    prefetchCaseDetailPage();
    const known = resolveCaseForAccess(caseId);
    if (known) {
      setAccessCase(known);
      return;
    }
    router.push(`/dashboard/cases/${encodeURIComponent(caseId)}#acceso`);
  }

  function handleCreated(result: CreatedCaseResult) {
    setCreatedBanner(result);
    prefetchCaseDetailPage();
    if (result.createdCase) {
      const item = caseToListItem(result.createdCase);
      setRows((prev) => (prev.some((row) => row.id === item.id) ? prev : [item, ...prev]));
      setErr(null);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`pw:case:${result.createdCase.id}`, JSON.stringify(result.createdCase));
        } catch {
          /* quota / private mode */
        }
      }
      setAccessCase(result.createdCase);
    }
  }

  useEffect(() => {
    prefetchCaseDetailPage();
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setCreateOpen(true);
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const openCreate = () => setCreateOpen(true);
    window.addEventListener("pw:create-case", openCreate);
    return () => window.removeEventListener("pw:create-case", openCreate);
  }, []);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      row.clientName.toLowerCase().includes(q) ||
      (row.clientEmail ?? "").toLowerCase().includes(q) ||
      (row.clientPhone ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <>
        <BillingStatusPanel variant="banner" returnPath="/dashboard" />
        <div className="space-y-6">
          <div className="flex justify-end">
            <div className="h-10 w-40 animate-pulse rounded-xl bg-[var(--pw-surface-2)]" />
          </div>
          <TableSkeleton rows={6} />
        </div>
      </>
    );
  }

  return (
    <>
      <BillingStatusPanel variant="banner" returnPath="/dashboard" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--pw-muted)]" aria-hidden />
          <input
            type="search"
            placeholder="Buscar por cliente, email o teléfono…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pathway-input pathway-input-with-icon"
            aria-label="Buscar expedientes"
          />
        </div>
      </div>

      {err && rows.length > 0 ? (
        <div
          className="pathway-card mb-6 flex flex-col gap-3 border p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--pw-warn)", background: "var(--pw-accent-dim)" }}
        >
          <p className="m-0 text-[var(--pw-muted)]">No se pudo refrescar la lista. Los datos pueden no estar al día.</p>
          <button type="button" className="pathway-btn pathway-btn-ghost py-2 text-xs" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {err && rows.length === 0 ? (
        <div className="pathway-card mb-6 border p-6 text-center text-sm" style={{ borderColor: "var(--pw-danger)", background: "var(--pw-danger-dim)" }}>
          <p className="m-0 text-[var(--pw-danger)]">{err}</p>
          <button type="button" className="pathway-btn pathway-btn-primary mt-4" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {createdBanner ? (
        <div
          className="pathway-card mb-6 flex flex-col gap-3 border p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--pw-success)", background: "var(--pw-success-dim)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="m-0">{createdBanner.message}</p>
            {createdBanner.portalUrl ? (
              <p className="m-0 mt-2 truncate font-mono text-[11px] text-[var(--pw-muted)]">{createdBanner.portalUrl}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {createdBanner.portalUrl ? (
              <>
                <button
                  type="button"
                  className="pathway-btn pathway-btn-ghost py-2 text-xs"
                  onClick={() => {
                    void copyText(createdBanner.portalUrl!).then((ok) =>
                      toast(ok ? "Enlace copiado" : "No se pudo copiar", ok ? "success" : "error"),
                    );
                  }}
                >
                  Copiar enlace
                </button>
                <button
                  type="button"
                  className="pathway-btn pathway-btn-ghost py-2 text-xs"
                  onClick={() => {
                    const text = buildClientInviteMessage(createdBanner.clientName ?? "", createdBanner.portalUrl!);
                    void copyText(text).then((ok) =>
                      toast(ok ? "Mensaje copiado" : "No se pudo copiar", ok ? "success" : "error"),
                    );
                  }}
                >
                  Copiar mensaje
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="pathway-btn pathway-btn-primary py-2 text-xs"
              onClick={() => openCaseAccess(createdBanner.id)}
            >
              {createdBanner.portalUrl ? "Gestionar acceso" : "Generar enlace"}
            </button>
            <button type="button" className="pathway-btn pathway-btn-ghost py-2 text-xs" onClick={() => setCreatedBanner(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {rows.length === 0 && !err ? (
        <EmptyState
          icon={FolderOpen}
          title="Tu despacho, organizado desde el primer expediente"
          description="Crea un expediente, envía el enlace al cliente y centraliza la documentación en un solo flujo."
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="pathway-btn pathway-btn-primary px-8 py-3 text-base no-underline shadow-lg shadow-[var(--pw-accent)]/25"
            >
              <Plus className="size-5" />
              Crear primer expediente
            </button>
          }
          steps={["Datos del cliente", "Enlace de subida", "Revisión y PDF"]}
        />
      ) : filtered.length === 0 && rows.length > 0 ? (
        <p className="text-center text-sm text-[var(--pw-muted)]">Ningún expediente coincide con la búsqueda.</p>
      ) : rows.length === 0 ? null : (
        <>
          <div className="grid gap-4 lg:hidden">
            {filtered.map((row) => {
              const sem = caseSemaphore(row);
              const tok = resolveMagicToken(row);
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              const portalUrl = tok ? resolvePortalUrl(origin, row) : "";
              const pdfApproved = (row.reviewStatus ?? "").toLowerCase() === "approved";
              return (
                <article
                  key={row.id}
                  className="pathway-card cursor-pointer p-5 transition-colors hover:border-[var(--pw-accent)]/40"
                  onClick={() => router.push(`/dashboard/cases/${row.id}#documentos`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/dashboard/cases/${row.id}#documentos`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="m-0 truncate text-base font-semibold">{row.clientName}</h3>
                      <p className="m-0 mt-1 truncate text-xs text-[var(--pw-muted)]">{row.clientEmail || "—"}</p>
                    </div>
                    <StatusBadge state={sem} progress={row.progress} />
                  </div>
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[var(--pw-surface-2)]">
                    <div className="h-full rounded-full bg-[var(--pw-accent)]" style={{ width: `${row.progress}%` }} />
                  </div>
                  <p className="m-0 text-[11px] text-[var(--pw-muted)]">
                    {row.progress}% · Actualizado {formatUpdatedAt(row.updatedAt)}
                  </p>
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <CaseRowActions
                      caseId={row.id}
                      clientName={row.clientName}
                      hasLink={tok.length > 0}
                      portalUrl={portalUrl}
                      pdfApproved={pdfApproved}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="pathway-card hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--pw-muted)]" style={{ borderColor: "var(--pw-border)", background: "var(--pw-surface-2)" }}>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Progreso</th>
                  <th className="p-4 font-medium">Actualizado</th>
                  <th className="p-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const sem = caseSemaphore(row);
                  const tok = resolveMagicToken(row);
                  const origin = typeof window !== "undefined" ? window.location.origin : "";
                  const portalUrl = tok ? resolvePortalUrl(origin, row) : "";
                  const pdfApproved = (row.reviewStatus ?? "").toLowerCase() === "approved";
                  return (
                    <tr
                      key={row.id}
                      className="group cursor-pointer border-t transition-colors hover:bg-[var(--pw-surface-2)]/50"
                      style={{ borderColor: "var(--pw-border)" }}
                      onClick={() => router.push(`/dashboard/cases/${row.id}#documentos`)}
                    >
                      <td className="p-4">
                        <StatusBadge state={sem} progress={row.progress} />
                      </td>
                      <td className="p-4">
                        <p className="m-0 font-medium text-[var(--pw-text)]">{row.clientName}</p>
                        <p className="m-0 mt-0.5 text-xs text-[var(--pw-muted)]">{row.clientEmail || "—"}</p>
                      </td>
                      <td className="p-4">
                        <div className="h-1.5 max-w-[120px] overflow-hidden rounded-full bg-[var(--pw-surface-2)]">
                          <div className="h-full rounded-full bg-[var(--pw-accent)]" style={{ width: `${row.progress}%` }} />
                        </div>
                        <span className="mt-1 inline-block text-xs text-[var(--pw-muted)]">{row.progress}%</span>
                      </td>
                      <td className="p-4 text-xs text-[var(--pw-muted)] whitespace-nowrap">{formatUpdatedAt(row.updatedAt)}</td>
                      <td className="p-4">
                        <CaseRowActions
                          caseId={row.id}
                          clientName={row.clientName}
                          hasLink={tok.length > 0}
                          portalUrl={portalUrl}
                          pdfApproved={pdfApproved}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CreateCaseModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} onReload={load} />
      <CaseAccessModal
        open={accessCase != null}
        caseData={accessCase}
        onClose={() => setAccessCase(null)}
        onCaseUpdated={(patch) => {
          if (!accessCase) return;
          const next = { ...accessCase, ...patch };
          setAccessCase(next);
          try {
            sessionStorage.setItem(`pw:case:${next.id}`, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          setRows((prev) =>
            prev.map((row) =>
              row.id === next.id
                ? {
                    ...row,
                    magicToken: resolveMagicToken(next) || row.magicToken,
                    magicExpiresAt: next.magicExpiresAt ?? row.magicExpiresAt,
                    magicLinkUrl: next.magicLinkUrl ?? row.magicLinkUrl,
                    clientPhone: next.clientPhone ?? row.clientPhone,
                  }
                : row,
            ),
          );
          if (createdBanner?.id === next.id) {
            setCreatedBanner((b) => (b ? { ...b, createdCase: next, portalUrl: resolvePortalUrl(window.location.origin, next) } : b));
          }
        }}
      />
    </>
  );
}
