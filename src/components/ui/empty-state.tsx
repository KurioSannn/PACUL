import Link from "next/link";

import { Button } from "./button";

type EmptyStateProps = {
  actionLabel?: string;
  actionHref?: string;
  description: string;
  title: string;
};

export function EmptyState({ actionHref, actionLabel, description, title }: EmptyStateProps) {
  return (
    <section className="state-card" aria-labelledby="empty-state-title">
      <p className="state-symbol" aria-hidden="true">
        —
      </p>
      <h2 id="empty-state-title">{title}</h2>
      <p>{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
    </section>
  );
}
