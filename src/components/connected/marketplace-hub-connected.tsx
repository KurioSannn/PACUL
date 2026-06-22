"use client";

import Link from "next/link";
import { ArrowRight, Box, Layers, PackageOpen, Recycle } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getCollectorAvailableWaste, listMaterials, listWasteListings } from "@/lib/api";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function MarketplaceHubContent() {
  const { accessToken, profile } = useAuth();

  const statsQuery = useAsyncData(async () => {
    if (!accessToken || !profile) {
      return { waste: 0, materials: 0 };
    }

    if (profile.role === "household") {
      const waste = await listWasteListings(accessToken, { limit: 1 });
      const materials = await listMaterials(accessToken, { limit: 1 });
      return { waste: waste.total, materials: materials.total };
    }

    if (profile.role === "collector") {
      const waste = await getCollectorAvailableWaste(accessToken, { limit: 1 });
      const materials = await listMaterials(accessToken, { limit: 1 });
      return { waste: waste.total, materials: materials.total };
    }

    const materials = await listMaterials(accessToken, { limit: 1 });
    return { waste: 0, materials: materials.total };
  }, [accessToken, profile], Boolean(accessToken && profile));

  const wasteCount = statsQuery.data?.waste ?? 0;
  const materialCount = statsQuery.data?.materials ?? 0;

  const layers = [
    {
      id: "waste",
      icon: PackageOpen,
      title: "Lapisan 1 · Sampah rumah tangga",
      description:
        profile?.role === "household"
          ? "Listing sampah terpilah yang Anda jual ke pengepul."
          : "Sampah terpilah dari rumah tangga, siap diambil pengepul.",
      count: `${wasteCount} listing`,
      href:
        profile?.role === "household"
          ? routes.myMaterials
          : profile?.role === "collector"
            ? routes.collectorPickups
            : routes.marketplaceWaste,
      cta:
        profile?.role === "household"
          ? "Kelola listing saya"
          : profile?.role === "collector"
            ? "Lihat pickup tersedia"
            : "Info lapisan sampah",
    },
    {
      id: "material",
      icon: Recycle,
      title: "Lapisan 2 · Bahan baku pengepul",
      description: "Material hasil pemilahan pengepul, siap dibeli industri pengolah.",
      count: `${materialCount} batch`,
      href: routes.marketplaceMaterials,
      cta: "Jelajahi bahan baku",
    },
    {
      id: "finished",
      icon: Box,
      title: "Lapisan 3 · Produk olahan industri",
      description: "Hasil pengolahan industri (opsional dijual kembali). Lacak via transaksi & traceability.",
      count: "Transaksi & jejak",
      href: profile?.role === "industry" ? routes.transactions : routes.impact,
      cta: profile?.role === "industry" ? "Lihat transaksi" : "Lihat dampak",
    },
  ];

  return (
    <main className="page-shell grow space-y-8 py-8">
      <header className="rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-10 text-white">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">
          <Layers className="size-4" aria-hidden="true" />
          Marketplace Tiga Lapis
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Etalase PACUL</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
          Sampah rumah tangga mengalir ke pengepul, dipilah menjadi bahan baku, lalu dibeli industri melalui
          pesanan, negosiasi, dan transaksi.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <article key={layer.id} className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-white p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-[var(--color-forest-900)]">{layer.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--color-ink-600)]">{layer.description}</p>
              <p className="mt-4 text-sm font-semibold text-[var(--color-leaf-700)]">{layer.count}</p>
              <Link
                href={layer.href}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-forest-900)]"
              >
                {layer.cta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>

      {profile?.role === "household" ? (
        <section className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-sage-50)] p-6 text-center">
          <p className="font-semibold text-[var(--color-forest-900)]">Belum punya listing?</p>
          <p className="mt-2 text-sm text-[var(--color-ink-600)]">
            Mulai dengan upload foto dan klasifikasi AI, lalu publikasikan sampah terpilah Anda.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href={routes.listingsNew}
              className="rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Buat listing baru
            </Link>
            <Link
              href={routes.classificationDemo}
              className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold"
            >
              Coba klasifikasi AI
            </Link>
          </div>
        </section>
      ) : null}

      {statsQuery.data && wasteCount === 0 && materialCount === 0 && !statsQuery.isLoading ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Data demo belum ada di database. Jalankan <code className="text-xs">npm run db:seed</code> di folder{" "}
          <code className="text-xs">backend</code>, lalu refresh halaman ini.
        </p>
      ) : null}
    </main>
  );
}

export function MarketplaceHubConnected() {
  return (
    <RequireAuth>
      <MarketplaceHubContent />
    </RequireAuth>
  );
}
