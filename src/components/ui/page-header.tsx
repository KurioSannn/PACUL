import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Kembali",
  actions,
}: PageHeaderProps) {
  return (
    <header className="space-y-4">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex text-sm font-semibold text-[var(--color-leaf-700)] hover:text-[var(--color-forest-900)]"
        >
          ← {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-leaf-700)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-600)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
