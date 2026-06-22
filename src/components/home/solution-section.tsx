import Link from "next/link";
import { ArrowRight, Camera, ListChecks, ScanSearch, ShieldCheck, Repeat, MapPin } from "lucide-react";

import { routes } from "@/lib/routes";

const solutions = [
  { icon: ListChecks, title: "Listing sampah terpilah", description: "Rumah tangga membuat listing dengan kategori, berat, lokasi, dan foto." },
  { icon: Camera, title: "Klasifikasi foto sampah", description: "AI membantu mengenali jenis sampah dari foto dan menyarankan kategori." },
  { icon: MapPin, title: "Pencocokan pengepul", description: "Pengepul dicocokkan berdasarkan jenis material yang ditangani dan jarak." },
  { icon: Repeat, title: "Pickup dan pemilahan", description: "Pengepul mengambil material, memilah berdasarkan grade dan kualitas." },
  { icon: ScanSearch, title: "Marketplace industri", description: "Industri pengolah menelusuri dan membeli material dari pengepul." },
  { icon: ShieldCheck, title: "Riwayat dan dampak", description: "Setiap transaksi tercatat dari sumber sampah hingga pembeli akhir." },
];

export function SolutionSection() {
  return (
    <section className="border-t border-border" id="solusi" aria-labelledby="solution-title">
      <div className="landing-shell py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-start">
          <div className="max-w-lg">
            <p className="eyebrow">Solusi PACUL</p>
            <h2
              id="solution-title"
              className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl"
            >
              Satu platform untuk menghubungkan tiga sisi rantai daur ulang.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-700)] sm:text-base">
              PACUL menyediakan alur digital dari rumah tangga yang memilah sampah, pengepul yang mengambil dan
              memproses, hingga industri yang membeli bahan baku daur ulang.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={routes.listingsNew}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-leaf-600)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)]"
              >
                Buat Listing
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href={routes.marketplaceWaste}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-4 py-2.5 text-sm font-semibold text-[var(--color-forest-900)] transition-colors hover:bg-[var(--color-sage-50)]"
              >
                Lihat Marketplace
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {solutions.map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-xl border border-[var(--color-line)] bg-white p-4"
              >
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-forest-900)]">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-700)]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
