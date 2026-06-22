import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-500)]">
          {label}
        </p>
        {icon ? <span className="text-[var(--color-leaf-700)]">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--color-forest-900)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--color-ink-500)]">{hint}</p> : null}
    </div>
  );
}
