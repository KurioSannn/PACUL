import { Button } from "./button";

type ErrorStateProps = {
  description: string;
  onRetry?: () => void;
  title: string;
};

export function ErrorState({ description, onRetry, title }: ErrorStateProps) {
  return (
    <section className="state-card state-error" role="alert">
      <p className="state-symbol" aria-hidden="true">
        !
      </p>
      <h2>{title}</h2>
      <p>{description}</p>
      {onRetry ? (
        <Button variant="secondary" type="button" onClick={onRetry}>
          Coba lagi
        </Button>
      ) : null}
    </section>
  );
}
