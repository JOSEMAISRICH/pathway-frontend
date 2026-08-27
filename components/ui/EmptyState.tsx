import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  steps?: string[];
};

export function EmptyState({ icon: Icon, title, description, action, steps }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--pw-border)] bg-[var(--pw-surface)] px-8 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[var(--pw-accent-dim)] text-[var(--pw-accent)]">
        <Icon className="size-8" strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="m-0 mb-2 text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-pathway), system-ui, sans-serif" }}>
        {title}
      </h2>
      <p className="m-0 mb-8 max-w-md text-sm leading-relaxed text-[var(--pw-muted)]">{description}</p>
      {action}
      {steps && steps.length > 0 ? (
        <ol className="mt-10 grid w-full max-w-2xl gap-3 text-left text-xs text-[var(--pw-muted)] sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step} className="rounded-lg bg-[var(--pw-surface-2)] p-3">
              <span className="font-medium text-[var(--pw-text)]">{i + 1}. </span>
              {step}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
