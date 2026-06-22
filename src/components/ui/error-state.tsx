import { Button } from "./button";

type ErrorStateProps = { description: string; title: string };

export function ErrorState({ description, title }: ErrorStateProps) {
  return (
    <section className="state-card state-error" role="alert">
      <p className="state-symbol" aria-hidden="true">!</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <Button variant="secondary">Coba lagi</Button>
    </section>
  );
}
