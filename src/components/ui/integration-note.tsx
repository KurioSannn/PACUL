import { Card } from "./card";

type IntegrationNoteProps = {
  label: string;
  note: string;
};

export function IntegrationNote({ label, note }: IntegrationNoteProps) {
  return (
    <Card className="integration-card">
      <div className="integration-row">
        <p className="eyebrow">{label}</p>
        <span className="status-pill status-pending">Pending</span>
      </div>
      <p className="integration-copy">{note}</p>
    </Card>
  );
}