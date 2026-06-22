import { Button } from "./button";

type EmptyStateProps = { actionLabel?: string; description: string; title: string };

export function EmptyState({ actionLabel, description, title }: EmptyStateProps) {
  return (
    <section className="state-card" aria-labelledby="empty-state-title">
      <p className="state-symbol" aria-hidden="true">+</p>
      <h2 id="empty-state-title">{title}</h2>
      <p>{description}</p>
      {actionLabel ? <Button disabled>{actionLabel}</Button> : null}
    </section>
  );
}
