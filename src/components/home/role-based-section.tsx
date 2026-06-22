import { Home, Truck, Factory, CheckCircle2 } from "lucide-react";

import { mockRoleBenefits } from "@/data/mock-landing";

const iconMap: Record<string, typeof Home> = {
  home: Home,
  truck: Truck,
  factory: Factory,
};

export function RoleBasedSection() {
  return (
    <section className="border-t border-border bg-white" id="peran" aria-labelledby="roles-title">
      <div className="landing-shell py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Akses berdasarkan peran</p>
          <h2
            id="roles-title"
            className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl"
          >
            Manfaat spesifik untuk setiap pengguna PACUL.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {mockRoleBenefits.map((roleInfo) => {
            const Icon = iconMap[roleInfo.icon] ?? Home;
            return (
              <article
                key={roleInfo.id}
                className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--color-forest-900)]">{roleInfo.role}</h3>
                </div>
                <div className="mt-4 grow">
                  <p className="text-sm font-medium text-[var(--color-forest-900)]">{roleInfo.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-700)]">{roleInfo.description}</p>
                  <ul className="mt-5 grid gap-3">
                    {roleInfo.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm text-[var(--color-ink-700)]">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-leaf-600)]" aria-hidden="true" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
