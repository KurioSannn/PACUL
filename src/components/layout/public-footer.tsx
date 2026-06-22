import Link from "next/link";
import { Recycle } from "lucide-react";

import { routes } from "@/lib/routes";

const productLinks = [
  { href: "#alur", label: "Alur" },
  { href: routes.marketplaceWaste, label: "Marketplace" },
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.reports, label: "Laporan" },
];

const actorLinks = [
  { href: routes.home, label: "Rumah Tangga" },
  { href: routes.collectorPickups, label: "Pengepul" },
  { href: routes.dashboardIndustry, label: "Industri Pengolah" },
];

const demoLinks = [
  { href: routes.classificationDemo, label: "Klasifikasi Sampah" },
  { href: routes.pickupRoutes, label: "Rute Pickup" },
  { href: routes.negotiations, label: "Negosiasi" },
  { href: routes.traceability("demo-material"), label: "Traceability" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-[rgba(233,240,235,0.14)] bg-[var(--color-forest-950)] text-white">
      <div className="landing-shell py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.9fr]">
          <div className="max-w-md">
            <Link href={routes.home} className="inline-flex items-center gap-3 font-semibold tracking-tight">
              <span className="grid size-9 place-items-center rounded-[11px] bg-[var(--color-mint-100)] text-[var(--color-forest-900)]">
                <Recycle className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm tracking-[0.18em]">PACUL</span>
            </Link>
            <p className="mt-4 text-sm leading-7 text-[#c8dbd1]">
              Marketplace daur ulang untuk menghubungkan rumah tangga, pengepul, dan industri pengolah dalam alur material yang lebih jelas.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.12em] text-[#a9dfbd] uppercase">Produk</h2>
            <ul className="mt-4 grid gap-3 text-sm text-[#d8e9df]">
              {productLinks.map((item) => (
                <li key={item.label}>
                  <Link className="transition-colors hover:text-white" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.12em] text-[#a9dfbd] uppercase">Aktor</h2>
            <ul className="mt-4 grid gap-3 text-sm text-[#d8e9df]">
              {actorLinks.map((item) => (
                <li key={item.label}>
                  <Link className="transition-colors hover:text-white" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.12em] text-[#a9dfbd] uppercase">Demo MVP</h2>
            <ul className="mt-4 grid gap-3 text-sm text-[#d8e9df]">
              {demoLinks.map((item) => (
                <li key={item.label}>
                  <Link className="transition-colors hover:text-white" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[rgba(233,240,235,0.14)] pt-5 text-xs leading-6 text-[#a8bdaf]">
          <p>Data demo MVP. Fitur produksi backend, autentikasi, AI, dan transaksi masih dalam tahap integrasi.</p>
          <p className="mt-1">© 2026 PACUL.</p>
        </div>
      </div>
    </footer>
  );
}
