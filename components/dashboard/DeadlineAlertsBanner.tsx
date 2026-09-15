"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { fetchAgencyAlerts, type AgencyAlert } from "@/lib/api/agency";

export function DeadlineAlertsBanner() {
  const [alerts, setAlerts] = useState<AgencyAlert[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchAgencyAlerts().then((list) => {
      if (!cancelled) setAlerts(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div
      className="pathway-card mb-6 border p-4"
      style={{ borderColor: "var(--pw-warn)", background: "var(--pw-warn-dim, var(--pw-surface-2))" }}
    >
      <p className="m-0 mb-2 flex items-center gap-2 text-sm font-medium text-[var(--pw-text)]">
        <Clock className="size-4 shrink-0" />
        Plazos
      </p>
      <ul className="m-0 list-none space-y-1 p-0 text-sm text-[var(--pw-muted)]">
        {alerts.slice(0, 5).map((a) => (
          <li key={a.id}>
            <Link href={`/dashboard/cases/${encodeURIComponent(a.caseId)}`} className="no-underline hover:underline">
              {a.message}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
