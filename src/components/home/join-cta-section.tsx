import Link from "next/link";
import { ArrowRight, Recycle } from "lucide-react";

import { routes } from "@/lib/routes";

export function JoinCtaSection() {
  return (
    <section className="bg-white pb-5 sm:pb-8" aria-labelledby="join-title">
      <div className="landing-shell">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-14 text-center text-white sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div aria-hidden="true" className="animate-cta-wave absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,transparent_0,transparent_22%,#2e9e63_22.3%,transparent_22.7%,transparent_36%,#2e9e63_36.3%,transparent_36.7%,transparent_50%,#2e9e63_50.3%,transparent_50.7%)]" />
          <div className="relative mx-auto max-w-3xl">
            <span className="mx-auto inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[#a9dfbd]">
              <Recycle className="size-5" aria-hidden="true" />
            </span>
            <h2 id="join-title" className="mt-6 text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:text-5xl lg:leading-[1.08]">
              Bangun nilai dari material yang selama ini terabaikan.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
              Gabung ke PACUL untuk menjelajahi material, membuka peluang kolaborasi, dan memperluas ekosistem daur ulang yang lebih terhubung.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={routes.authRegister} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald px-6 text-sm font-semibold text-green-500 transition-colors hover:bg-[var(--color-mint-100)]">
                Gabung ke PACUL
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href={routes.marketplaceWaste} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Jelajahi Etalase
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
