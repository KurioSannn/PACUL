import Link from "next/link";
import { ArrowRight, Box, PackageOpen, Recycle } from "lucide-react";

import { routes } from "@/lib/routes";

const layers = [
  {
    id: "household",
    icon: PackageOpen,
    title: "Sampah rumah tangga",
    description: "Rumah tangga memilah, unggah foto, klasifikasi AI membantu, lalu jual sebagai listing.",
    examples: ["Botol PET", "Kardus", "Kaleng", "Kaca"],
    href: routes.authLogin,
    cta: "Masuk sebagai rumah tangga",
    tone: "mint" as const,
  },
  {
    id: "collector",
    icon: Recycle,
    title: "Bahan baku pengepul",
    description: "Pengepul mengambil, memilah, dan mempublikasikan batch material ke marketplace.",
    examples: ["Flake PET", "Kardus press", "Aluminium", "HDPE"],
    href: routes.authLogin,
    cta: "Masuk sebagai pengepul",
    tone: "sand" as const,
  },
  {
    id: "industry",
    icon: Box,
    title: "Pembelian industri",
    description: "Industri memesan, menawar harga, bertransaksi, dan melacak jejak material.",
    examples: ["Pesanan", "Negosiasi", "Transaksi", "Traceability"],
    href: routes.authLogin,
    cta: "Masuk sebagai industri",
    tone: "mint" as const,
  },
];

export function MarketplacePreviewSection() {
  return (
    <section className="border-t border-border bg-[var(--color-sage-50)]" id="marketplace" aria-labelledby="marketplace-title">
      <div className="landing-shell py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Marketplace Tiga Lapis</p>
          <h2
            id="marketplace-title"
            className="text-balance text-3xl font-semibold tracking-[-0.035em] text-[var(--color-forest-900)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]"
          >
            Dari sampah rumah tangga hingga bahan baku industri — dalam satu alur.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--color-ink-700)]">
            PACUL menghubungkan tiga aktor dengan status berjenjang: listing → pickup → batch material →
            pesanan → negosiasi → transaksi.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {layers.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.id} className="overflow-hidden rounded-[1.6rem] border border-[var(--color-line)] bg-white">
                <div className="p-6 sm:p-8">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-[var(--color-forest-900)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-ink-700)]">{item.description}</p>
                  <Link
                    href={item.href}
                    className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-line)] px-5 text-sm font-semibold text-[var(--color-forest-900)] transition-colors hover:bg-[var(--color-sage-50)]"
                  >
                    {item.cta}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
                <div
                  className={
                    item.tone === "mint"
                      ? "border-t border-[var(--color-line)] bg-[var(--color-mint-100)] p-5 sm:p-6"
                      : "border-t border-[var(--color-line)] bg-[#f7f3e9] p-5 sm:p-6"
                  }
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-ink-500)]">Contoh</p>
                  <ul className="mt-4 grid grid-cols-2 gap-2" aria-label={`Contoh ${item.title.toLowerCase()}`}>
                    {item.examples.map((example) => (
                      <li
                        key={example}
                        className="rounded-xl border border-white/80 bg-white/80 px-3 py-3 text-sm font-medium text-[var(--color-forest-800)]"
                      >
                        {example}
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
