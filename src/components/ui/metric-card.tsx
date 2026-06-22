import { Card } from "./card";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricCard({ hint, label, value }: MetricCardProps) {
  return (
    <Card className="metric-card">
      <p className="eyebrow">{label}</p>
      <h2>{value}</h2>
      {hint ? <p className="metric-copy">{hint}</p> : null}
    </Card>
  );
}