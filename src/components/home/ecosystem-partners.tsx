import { Building2, Factory, GraduationCap, Handshake, Leaf, Recycle, Store, Truck } from "lucide-react";

import { ecosystemPartnerTypes } from "@/data/mock-landing";
import { SupporterMarquee } from "@/components/home/supporter-marquee";

const partnerIcons = [Recycle, Leaf, Factory, Store, Building2, GraduationCap, Handshake, Truck];

export function EcosystemPartners() {
  return (
    <section className="border-t border-border bg-white" id="kolaborasi" aria-labelledby="ecosystem-title">
      <div className="landing-shell py-20 sm:py-24 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <p className="eyebrow">Kolaborasi Ekosistem</p>
            <h2 id="ecosystem-title" className="text-balance text-3xl font-semibold tracking-[-0.035em] text-[var(--color-forest-900)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              PACUL dirancang untuk terhubung dengan mitra yang relevan.
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--color-ink-700)]">
              Platform ini dapat dikembangkan bersama berbagai pihak agar alur sirkular berjalan lebih luas dan lebih terkoordinasi.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Jenis calon mitra ekosistem">
            {ecosystemPartnerTypes.map((partner, index) => {
              const Icon = partnerIcons[index];
              return (
                <li key={partner} className="flex min-h-32 flex-col justify-between rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-4 text-sm font-semibold text-[var(--color-forest-800)]">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-[var(--color-leaf-700)]">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="mt-5 leading-5">{partner}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <SupporterMarquee />
      </div>
    </section>
  );
}
