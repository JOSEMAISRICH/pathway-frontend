import { cn } from "@/lib/utils/cn";
import type { CaseSemaphore } from "@/lib/dashboard/caseStatus";
import { caseStatusLabel } from "@/lib/dashboard/caseStatus";

export function StatusBadge({ state, progress }: { state: CaseSemaphore; progress?: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        state === "green" && "bg-[var(--pw-success-dim)] text-[var(--pw-success)]",
        state === "amber" && "bg-[var(--pw-warning-dim)] text-[var(--pw-warning)]",
        state === "red" && "bg-[var(--pw-danger-dim)] text-[var(--pw-danger)]",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {caseStatusLabel(state, progress)}
    </span>
  );
}
