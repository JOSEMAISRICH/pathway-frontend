"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, CreditCard, FolderOpen, Loader2, LogOut, Plus } from "lucide-react";
import { apiUrl } from "@/lib/api/apiUrl";
import { getBillingStatus } from "@/lib/api/billing";
import { subscriptionRequiredPath } from "@/lib/api/subscriptionGate";
import { cn } from "@/lib/utils/cn";

type Props = {
  children: React.ReactNode;
  /** Slot para el botón principal del topbar (ej. abrir modal crear) */
  topbarAction?: React.ReactNode;
  /** Título personalizado del topbar */
  topbarTitle?: string;
  topbarSubtitle?: string;
};

function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const onDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/cases");
  const onPlanes = pathname === "/dashboard/planes" || pathname.startsWith("/dashboard/planes/");

  async function logout() {
    await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" });
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <>
      <Link href="/pathway" className="mb-8 flex items-center gap-2.5 no-underline">
        <span
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ background: "var(--pw-accent-dim)", color: "var(--pw-accent)" }}
        >
          <Compass className="size-5" strokeWidth={2} />
        </span>
        <span className="text-lg font-semibold tracking-tight text-[var(--pw-text)]" style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}>
          Path<span className="text-[var(--pw-accent)]">Way</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 text-sm" aria-label="Panel del despacho">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium no-underline transition-colors",
            onDashboard
              ? "bg-[var(--pw-accent-dim)] text-[var(--pw-accent)]"
              : "text-[var(--pw-muted)] hover:bg-[var(--pw-surface-2)] hover:text-[var(--pw-text)]",
          )}
        >
          <FolderOpen className="size-4 shrink-0" />
          Expedientes
        </Link>
        <Link
          href="/dashboard/planes"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium no-underline transition-colors",
            onPlanes
              ? "bg-[var(--pw-accent-dim)] text-[var(--pw-accent)]"
              : "text-[var(--pw-muted)] hover:bg-[var(--pw-surface-2)] hover:text-[var(--pw-text)]",
          )}
        >
          <CreditCard className="size-4 shrink-0" />
          Plan
        </Link>
      </nav>

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-auto flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--pw-muted)] transition-colors hover:bg-[var(--pw-surface-2)] hover:text-[var(--pw-text)]"
      >
        <LogOut className="size-4" />
        Cerrar sesión
      </button>
    </>
  );
}

function DefaultTopbarAction() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("pw:create-case"))}
      className="pathway-btn pathway-btn-primary no-underline py-2.5 px-5 text-sm shadow-lg shadow-[var(--pw-accent)]/20"
    >
      <Plus className="size-4" />
      <span className="hidden sm:inline">Nuevo expediente</span>
      <span className="sm:hidden">Nuevo</span>
    </button>
  );
}

function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onPlanes = pathname === "/dashboard/planes" || pathname.startsWith("/dashboard/planes/");
  const [ready, setReady] = useState(onPlanes);

  useEffect(() => {
    if (onPlanes) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await getBillingStatus();
      if (cancelled) return;
      if (result.ok && !result.billing.active) {
        router.replace(subscriptionRequiredPath());
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [onPlanes, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-[var(--pw-muted)]">
        <Loader2 className="size-4 animate-spin" />
        Comprobando acceso…
      </div>
    );
  }

  return children;
}

export function DashboardShell({ children, topbarAction, topbarTitle, topbarSubtitle }: Props) {
  const pathname = usePathname();
  const isCaseDetail = pathname.startsWith("/dashboard/cases/");

  const isPlanes = pathname === "/dashboard/planes" || pathname.startsWith("/dashboard/planes/");
  const title =
    topbarTitle ?? (isCaseDetail ? "Expediente" : isPlanes ? "Plan" : "Expedientes");
  const subtitle =
    topbarSubtitle ??
    (isCaseDetail
      ? "Revisión y documentación"
      : isPlanes
        ? "Suscripción del despacho"
        : "Gestión documental del despacho");

  return (
    <div className="panel-surface flex min-h-screen bg-[var(--pw-bg)]">
        <aside
          className="hidden w-60 shrink-0 flex-col border-r px-4 py-6 lg:flex"
          style={{ borderColor: "var(--pw-border)", background: "var(--pw-surface)" }}
        >
          <SidebarNav />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6"
            style={{ borderColor: "var(--pw-border)", background: "color-mix(in srgb, var(--pw-surface) 92%, transparent)" }}
          >
            <div className="min-w-0">
              <p className="m-0 text-[10px] font-medium uppercase tracking-widest text-[var(--pw-muted)]">Despacho</p>
              <h1
                className="m-0 truncate text-lg font-semibold tracking-tight text-[var(--pw-text)]"
                style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}
              >
                {title}
              </h1>
              <p className="m-0 hidden truncate text-xs text-[var(--pw-muted)] sm:block">{subtitle}</p>
            </div>
            <div className="shrink-0">{topbarAction ?? (!isCaseDetail && !isPlanes ? <DefaultTopbarAction /> : null)}</div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <SubscriptionGate>{children}</SubscriptionGate>
          </main>
        </div>
    </div>
  );
}
