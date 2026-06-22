import { Badge } from "./badge";
import { Button } from "./button";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
};

export function PageHeader({
  description,
  eyebrow,
  primaryActionLabel,
  secondaryActionLabel,
  statusLabel,
  title,
}: PageHeaderProps) {
  return (
    <header className="shell-topline">
      <div className="max-w-3xl space-y-3">
        <div className="toolbar-row">
          <p className="eyebrow">{eyebrow}</p>
          {statusLabel ? <Badge tone="green">{statusLabel}</Badge> : null}
        </div>
        <h1 className="page-title">{title}</h1>
        <p className="page-lead">{description}</p>
      </div>
      {primaryActionLabel || secondaryActionLabel ? (
        <div className="placeholder-actions">
          {primaryActionLabel ? <Button>{primaryActionLabel}</Button> : null}
          {secondaryActionLabel ? <Button variant="secondary">{secondaryActionLabel}</Button> : null}
        </div>
      ) : null}
    </header>
  );
}