import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { UserRole } from "@/lib/api/types";
import { routes } from "@/lib/routes";

type Step = { title: string; description: string; href: string; cta: string };

const flows: Record<UserRole, Step[]> = {
  household: [
    {
      title: "1. Pilah & buat listing",
      description: "Upload foto sampah, gunakan klasifikasi AI, lalu publikasikan listing dengan berat dan lokasi.",
      href: routes.listingsNew,
      cta: "Buat listing",
    },
    {
      title: "2. Tunggu pengepul ambil",
      description: "Pengepul yang menangani jenis sampah Anda akan melihat listing dan mengklaim pickup.",
      href: routes.pickupTracking,
      cta: "Lacak pickup",
    },
    {
      title: "3. Lihat dampak & laporan",
      description: "Pantau berat terkumpul, estimasi CO₂, dan unduh laporan untuk presentasi.",
      href: routes.impact,
      cta: "Lihat dampak",
    },
  ],
  collector: [
    {
      title: "1. Cari listing tersedia",
      description: "Listing difilter otomatis sesuai jenis sampah yang Anda tangani dan wilayah layanan.",
      href: routes.collectorPickups,
      cta: "Pickup tersedia",
    },
    {
      title: "2. Rute & ambil sampah",
      description: "Susun rute pengambilan, konfirmasi pickup, lalu pilah menjadi bahan baku.",
      href: routes.pickupRoutes,
      cta: "Kelola rute",
    },
    {
      title: "3. Jual bahan baku",
      description: "Publikasi batch material ke marketplace agar industri bisa pesan dan negosiasi.",
      href: routes.collectorMaterialsNew,
      cta: "Input batch",
    },
  ],
  industry: [
    {
      title: "1. Cari bahan baku",
      description: "Jelajahi batch material dari pengepul, filter jenis, lokasi, dan harga per kg.",
      href: routes.marketplaceMaterials,
      cta: "Marketplace material",
    },
    {
      title: "2. Pesan & negosiasi",
      description: "Buat pesanan, ajukan penawaran harga, dan sepakati deal dengan pengepul.",
      href: routes.ordersNew,
      cta: "Buat pesanan",
    },
    {
      title: "3. Transaksi, jejak, dan laporan",
      description: "Simulasikan pembayaran, lacak Jejak Material, unduh laporan, dan beri rating mitra.",
      href: routes.transactions,
      cta: "Lihat transaksi",
    },
  ],
};

export function WorkflowGuide({ role }: { role: UserRole }) {
  const steps = flows[role];

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-6">
      <h2 className="text-lg font-semibold text-[var(--color-forest-900)]">Alur kerja Anda</h2>
      <p className="mt-1 text-sm text-[var(--color-ink-600)]">
        Marketplace tiga lapis PACUL: sampah rumah tangga → bahan baku pengepul → pembelian industri.
      </p>
      <ol className="mt-5 grid gap-4 lg:grid-cols-3">
        {steps.map((step) => (
          <li key={step.title} className="rounded-xl border border-[var(--color-line)] bg-white p-4">
            <h3 className="font-semibold text-[var(--color-forest-900)]">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-600)]">{step.description}</p>
            <Link
              href={step.href}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-leaf-700)]"
            >
              {step.cta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
