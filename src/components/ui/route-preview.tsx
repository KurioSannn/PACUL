import { Badge } from "./badge";
import { Card } from "./card";

export type RoutePreviewListItem = {
  label: string;
  value: string;
  helper?: string;
};

export type RoutePreviewTable = {
  headers: string[];
  rows: string[][];
};

export type RoutePreviewTimelineItem = {
  title: string;
  detail: string;
  status?: string;
};

type RoutePreviewProps = {
  title: string;
  description?: string;
  badge?: string;
  list?: RoutePreviewListItem[];
  table?: RoutePreviewTable;
  timeline?: RoutePreviewTimelineItem[];
  note?: string;
};

export function RoutePreview({ badge, description, list, note, table, timeline, title }: RoutePreviewProps) {
  return (
    <Card className="preview-card">
      <div className="preview-topline">
        <div>
          <p className="eyebrow">Preview</p>
          <h3>{title}</h3>
          {description ? <p className="panel-copy">{description}</p> : null}
        </div>
        {badge ? <Badge tone="green">{badge}</Badge> : null}
      </div>

      {list ? (
        <dl className="list-grid">
          {list.map((item) => (
            <div key={item.label} className="panel">
              <dt className="eyebrow">{item.label}</dt>
              <dd>{item.value}</dd>
              {item.helper ? <p className="meta-copy">{item.helper}</p> : null}
            </div>
          ))}
        </dl>
      ) : null}

      {table ? (
        <div className="table-card">
          <div className="table-row eyebrow">
            {table.headers.map((header) => (
              <span key={header}>{header}</span>
            ))}
          </div>
          {table.rows.map((row, index) => (
            <div key={`${index}-${row.join("-")}`} className="table-row">
              {row.map((cell) => (
                <span key={cell} className="text-sm" style={{ color: "var(--color-ink-700)" }}>
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {timeline ? (
        <ol className="timeline-grid">
          {timeline.map((item, index) => (
            <li key={item.title} className="timeline-card">
              <div className="status-row">
                <span className="metric-symbol">{index + 1}</span>
                {item.status ? <Badge tone="neutral">{item.status}</Badge> : null}
              </div>
              <h3>{item.title}</h3>
              <p className="panel-copy">{item.detail}</p>
            </li>
          ))}
        </ol>
      ) : null}

      {note ? <p className="table-note">{note}</p> : null}
    </Card>
  );
}