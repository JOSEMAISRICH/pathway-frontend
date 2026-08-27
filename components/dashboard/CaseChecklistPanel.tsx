"use client";

import { Check, Circle } from "lucide-react";
import type { ChecklistItem } from "@/lib/api/caseEngine";
import { checklistProgress } from "@/lib/api/caseEngine";
import { cn } from "@/lib/utils/cn";

type Props = {
  items: ChecklistItem[];
  caseTypeLabel?: string;
};

export function CaseChecklistPanel({ items, caseTypeLabel }: Props) {
  const { done, total, percent } = checklistProgress(items);

  if (items.length === 0) {
    return (
      <p className="m-0 text-sm text-[var(--pw-muted)]">No hay checklist definido para este trámite.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-semibold text-[var(--pw-text)]">Checklist del trámite</h3>
          {caseTypeLabel ? (
            <p className="m-0 mt-1 text-xs text-[var(--pw-muted)]">{caseTypeLabel}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="m-0 text-sm font-medium text-[var(--pw-text)]">
            {done}/{total} completados
          </p>
          <p className="m-0 text-xs text-[var(--pw-muted)]">{percent}%</p>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--pw-surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--pw-accent)] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="m-0 list-none space-y-2 p-0">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
              item.done
                ? "border-[var(--pw-accent)]/30 bg-[var(--pw-accent-dim)]/40"
                : "border-[var(--pw-border)] bg-[var(--pw-surface)]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                item.done ? "bg-[var(--pw-accent)] text-white" : "bg-[var(--pw-surface-2)] text-[var(--pw-muted)]",
              )}
            >
              {item.done ? <Check className="size-3" strokeWidth={3} /> : <Circle className="size-3" />}
            </span>
            <span className={cn("min-w-0", item.done ? "text-[var(--pw-text)]" : "text-[var(--pw-muted)]")}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
