type LoadingStateProps = { label?: string };

export function LoadingState({ label = "Memuat data..." }: LoadingStateProps) {
  return (
    <section className="state-card" aria-live="polite">
      <span className="loading-mark" aria-hidden="true" />
      <p>{label}</p>
    </section>
  );
}
