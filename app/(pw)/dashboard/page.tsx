"use client";

import { Suspense } from "react";
import DashboardPageInner from "./DashboardPageInner";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <TableSkeleton rows={6} />
        </div>
      }
    >
      <DashboardPageInner />
    </Suspense>
  );
}
