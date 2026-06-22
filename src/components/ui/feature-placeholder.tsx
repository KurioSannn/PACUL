import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  state: "empty" | "loading" | "error" | "disabled" | "success";
  actionLabel?: string;
};

export function FeaturePlaceholder({ actionLabel, description, state, title }: FeaturePlaceholderProps) {
  const tone = state === "success" ? "green" : state === "disabled" ? "earth" : state === "error" ? "neutral" : "green";

  return (
    <Card className={`placeholder-card tone-${state}`}>
      <div className="status-row">
        <Badge tone={tone}>{state}</Badge>
        <span className="placeholder-symbol" aria-hidden="true">
          {state === "error" ? "!" : state === "loading" ? "…" : state === "success" ? "✓" : "+"}
        </span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel ? <Button variant="secondary" disabled={state === "disabled"}>{actionLabel}</Button> : null}
    </Card>
  );
}