"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { AppPageShell } from "@/components/layout/app-page-shell";
import { demoAccounts, defaultDemoPassword } from "@/lib/labels";
import { routes } from "@/lib/routes";

const demoSteps = [
  {
    role: "Rumah Tangga",
    account: demoAccounts[0],
    steps: [
      { label: "Masuk dan buka dashboard", href: routes.dashboardHousehold },
      { label: "Buat listing sampah + klasifikasi AI", href: routes.listingsNew },
      { label: "Publikasikan listing", href: routes.myMaterials },
      { label: "Lacak status pickup", href: routes.pickupTracking },
    ],
  },
  {
    role: "Pengepul",
    account: demoAccounts[1],
    steps: [
      { label: "Atur kategori yang ditangani", href: routes.collectorHandledCategories },
      { label: "Klaim pickup tersedia", href: routes.collectorPickups },
      { label: "Susun rute pengambilan", href: routes.pickupRoutes },
      { label: "Pilah dan buat batch bahan baku", href: routes.collectorMaterialsNew },
    ],
  },
  {
    role: "Industri Pengolah",
    account: demoAccounts[2],
    steps: [
      { label: "Cari bahan baku di marketplace", href: routes.marketplaceMaterials },
      { label: "Buat pesanan", href: routes.ordersNew },
      { label: "Negosiasi harga", href: routes.negotiations },
      { label: "Transaksi dan jejak material", href: routes.transactions },
    ],
  },
];

export default function DemoPage() {
  return (
    <AppPageShell>
      <main className="page-shell grow space-y-8 py-8">
        <header className="rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-10 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">Panduan Demo</p>
          <h1 className="mt-3 text-3xl font-semibold">Alur demo PACUL untuk juri</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Marketplace daur ulang tiga lapis: Rumah Tangga mengunggah sampah, Pengepul mengambil dan
            memilah, Industri Pengolah membeli bahan baku melalui pesanan dan negosiasi.
          </p>
          <p className="mt-4 text-sm text-white/80">
            Password demo semua akun: <strong>{defaultDemoPassword}</strong>
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {demoSteps.map((block) => (
            <section key={block.role} className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
              <p className="text-xs font-bold uppercase text-[var(--color-leaf-700)]">{block.role}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-forest-900)]">{block.account.label}</p>
              <p className="text-sm text-[var(--color-ink-500)]">{block.account.email}</p>
              <Link
                href={routes.authLogin}
                className="mt-4 inline-flex rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white"
              >
                Masuk sebagai {block.role}
              </Link>
              <ol className="mt-5 space-y-3">
                {block.steps.map((step, index) => (
                  <li key={step.label}>
                    <Link
                      href={step.href}
                      className="flex items-start gap-2 text-sm text-[var(--color-ink-700)] hover:text-[var(--color-leaf-700)]"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-leaf-600)]" />
                      <span>
                        <span className="font-semibold">{index + 1}. </span>
                        {step.label}
                        <ArrowRight className="ml-1 inline size-3.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-6">
          <h2 className="font-semibold text-[var(--color-forest-900)]">Langkah penutup demo</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-600)]">
            <li>
              <Link href={routes.impact} className="font-semibold text-[var(--color-leaf-700)]">
                Dashboard Dampak
              </Link>
              {" — "}lihat kg sampah, emisi dihemat, dan dampak lokal.
            </li>
            <li>
              <Link href={routes.reports} className="font-semibold text-[var(--color-leaf-700)]">
                Laporan
              </Link>
              {" — "}export PDF dan Excel.
            </li>
            <li>
              <Link href={routes.reviews} className="font-semibold text-[var(--color-leaf-700)]">
                Rating dan ulasan
              </Link>
              {" — "}beri penilaian setelah transaksi selesai.
            </li>
          </ul>
        </section>
      </main>
    </AppPageShell>
  );
}
