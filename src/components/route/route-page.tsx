import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";
import { IntegrationNote } from "@/components/ui/integration-note";
import { LoadingState } from "@/components/ui/loading-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";

type StateVariant = "empty" | "loading" | "error" | "disabled" | "success";

export type RouteMetric = {
  label: string;
  value: string;
  hint?: string;
};

export type RouteState = {
  actionLabel?: string;
  description: string;
  title: string;
  variant: StateVariant;
};

type RoutePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
  integrationLabel: string;
  integrationNote: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  metrics?: RouteMetric[];
  preview?: ReactNode;
  previewTitle?: string;
  previewDescription?: string;
  checklist?: string[];
  states?: RouteState[];
  callout?: string;
};

export function RoutePage({
  callout,
  checklist,
  description,
  eyebrow,
  integrationLabel,
  integrationNote,
  metrics,
  preview,
  previewDescription,
  previewTitle,
  primaryActionLabel,
  secondaryActionLabel,
  states,
  statusLabel,
  title,
}: RoutePageProps) {
  return (
    <main className="page-shell space-y-8">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      {statusLabel ? (
        <p className="inline-flex rounded-full bg-[var(--color-mint-100)] px-3 py-1 text-xs font-semibold text-[var(--color-leaf-700)]">
          {statusLabel}
        </p>
      ) : null}
      {primaryActionLabel || secondaryActionLabel ? (
        <div className="flex flex-wrap gap-2">
          {primaryActionLabel ? (
            <span className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">{primaryActionLabel}</span>
          ) : null}
          {secondaryActionLabel ? (
            <span className="rounded-full border px-4 py-2 text-sm font-semibold">{secondaryActionLabel}</span>
          ) : null}
        </div>
      ) : null}

      {callout ? (
        <Card className="panel border-dashed" style={{ backgroundColor: "rgb(232 246 238 / 70%)" }}>
          {callout}
        </Card>
      ) : null}

      {metrics && metrics.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan metrik">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
          ))}
        </section>
      ) : null}

      {preview ? (
        <section className="space-y-4">
          {previewTitle ? <h2 className="shell-title">{previewTitle}</h2> : null}
          {previewDescription ? <p className="shell-lead">{previewDescription}</p> : null}
          {preview}
        </section>
      ) : null}

      {checklist && checklist.length > 0 ? (
        <section className="space-y-4">
          <h2 className="shell-title">Checklist fitur</h2>
          <Card className="summary-card">
            <div className="stack-grid">
              {checklist.map((item) => (
                <div key={item} className="panel">
                  <p className="eyebrow">Demo</p>
                  <p className="panel-copy">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      {states && states.length > 0 ? (
        <section className="space-y-4">
          <h2 className="shell-title">State preview</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {states.map((state) => {
              if (state.variant === "loading") {
                return <LoadingState key={state.title} label={state.description} />;
              }

              if (state.variant === "error") {
                return <ErrorState key={state.title} title={state.title} description={state.description} />;
              }

              if (state.variant === "empty") {
                return <EmptyState key={state.title} title={state.title} description={state.description} actionLabel={state.actionLabel} />;
              }

              return <FeaturePlaceholder key={state.title} state={state.variant} title={state.title} description={state.description} actionLabel={state.actionLabel} />;
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="shell-title">{integrationLabel}</h2>
        <IntegrationNote label={integrationLabel} note={integrationNote} />
      </section>
    </main>
  );
}