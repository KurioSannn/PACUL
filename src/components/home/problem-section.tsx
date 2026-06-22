import { Home, Truck, Factory, Search } from "lucide-react";

import { mockProblems } from "@/data/mock-landing";

const iconMap: Record<string, typeof Home> = {
  home: Home,
  truck: Truck,
  factory: Factory,
  search: Search,
};

export function ProblemSection() {
  return (
    <section className="border-t border-border bg-white" id="masalah" aria-labelledby="problem-title">
      <div className="landing-shell py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Masalah yang kami selesaikan</p>
          <h2
            id="problem-title"
            className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl"
          >
            Rantai daur ulang rumah tangga masih terputus di banyak titik.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockProblems.map((item) => {
            const Icon = iconMap[item.icon] ?? Search;
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-5"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-[var(--color-forest-900)]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-700)]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
