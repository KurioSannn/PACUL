import { BarChart3, MessageSquareText, Scale } from "lucide-react";

import { mockLandingStats } from "@/data/mock-landing";

const statIcons = [Scale, BarChart3, MessageSquareText];

export function ImpactSection() {
  return (
    <section className="border-t border-border bg-white" id="alur" aria-labelledby="impact-title">
      <div className="landing-shell py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Mengapa PACUL</p>
          <h2
            id="impact-title"
            className="text-balance text-3xl font-semibold tracking-[-0.035em] text-[var(--color-forest-900)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]"
          >
            Kelola sampah dan material daur ulang dalam satu alur yang lebih jelas.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--color-ink-700)]">
            PACUL membantu mempertemukan sumber sampah, pengolah material, dan kebutuhan pasar dalam satu ekosistem yang lebih tertata.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:mt-14">
          {mockLandingStats.map((metric, index) => {
            const Icon = statIcons[index];
            return (
            <article
              key={metric.id}
              className="group rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-sage-50)] p-6 transition-colors hover:border-[var(--color-mint-200)] sm:p-7"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl border border-[var(--color-mint-200)] bg-white text-[var(--color-leaf-700)]">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <h3 className="mt-7 text-sm font-semibold text-[var(--color-ink-700)]">{metric.label}</h3>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-forest-900)] sm:text-4xl">{metric.value}</p>
              <p className="mt-4 text-sm leading-6 text-[var(--color-ink-500)]">{metric.description}</p>
            </article>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-[var(--color-ink-500)]">
          Angka merupakan data simulasi MVP dan tidak mewakili data produksi.
        </p>
      </div>
    </section>
  );
}
