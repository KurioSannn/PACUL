import { Users, List, Store, ScanLine, Truck, Receipt, BarChart3, Route } from "lucide-react";

import { mockFeatures } from "@/data/mock-landing";

const iconMap: Record<string, typeof Users> = {
  users: Users,
  list: List,
  store: Store,
  scan: ScanLine,
  truck: Truck,
  receipt: Receipt,
  "bar-chart": BarChart3,
  route: Route,
};

export function FeaturesSection() {
  return (
    <section className="border-t border-border bg-white" id="fitur" aria-labelledby="features-title">
      <div className="landing-shell py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Fitur MVP</p>
          <h2
            id="features-title"
            className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl"
          >
            Delapan fitur inti untuk demo alur daur ulang.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-700)]">
            Setiap fitur dirancang untuk mendukung satu bagian dari alur material, dari listing sampai traceability.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockFeatures.map((feature) => {
            const Icon = iconMap[feature.icon] ?? Users;
            return (
              <article
                key={feature.id}
                className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-5 transition-colors hover:border-[var(--color-mint-200)] hover:bg-[var(--color-mint-100)]"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[var(--color-mint-100)] text-[var(--color-leaf-700)] transition-colors group-hover:bg-white">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-[var(--color-forest-900)]">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-ink-700)]">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
