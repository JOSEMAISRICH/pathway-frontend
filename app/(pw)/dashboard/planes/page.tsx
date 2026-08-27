"use client";

import { Suspense } from "react";
import { BillingStatusPanel } from "@/components/dashboard/BillingStatusPanel";
import { Loader2 } from "lucide-react";

function PlanesFallback() {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--pw-muted)]">
      <Loader2 className="size-4 animate-spin" />
      Cargando plan…
    </div>
  );
}

export default function DashboardPlanesPage() {
  return (
    <Suspense fallback={<PlanesFallback />}>
      <BillingStatusPanel variant="page" returnPath="/dashboard/planes" />
    </Suspense>
  );
}
