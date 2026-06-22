"use client";

import Link from "next/link";
import { ArrowRight, MapPin, PackageSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getCollectorAvailableWaste, listWasteListings } from "@/lib/api";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function WasteMarketplaceContent() {
  const { accessToken, profile } = useAuth();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  const dataQuery = useAsyncData(async () => {
    if (!accessToken || !profile) return { items: [] as Array<Record<string, unknown>>, total: 0 };
    if (profile.role === "collector") {
      return getCollectorAvailableWaste(accessToken, { city: city || undefined, limit: 50 });
    }
    if (profile.role === "household") {
      const result = await listWasteListings(accessToken, { limit: 50 });
      return { items: result.items, total: result.total };
    }
    return { items: [], total: 0 };
  }, [accessToken, profile, city], Boolean(accessToken && profile));

  const items = useMemo(() => {
    const raw = dataQuery.data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((item) => {
      const title = String("title" in item ? item.title : "");
      const district = String("district" in item ? item.district ?? "" : "");
      const category = "category" in item && item.category && typeof item.category === "object" && "name" in item.category
        ? String(item.category.name)
        : "";
      return `${title} ${district} ${category}`.toLowerCase().includes(q);
    });
  }, [dataQuery.data, query]);

  if (profile?.role === "industry") {
    return (
      <main className="page-shell grow py-8">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center">
          <p className="font-semibold text-[var(--color-forest-900)]">Marketplace sampah mentah hanya untuk pengepul</p>
          <Link href={routes.marketplaceMaterials} className="mt-4 inline-flex text-sm font-semibold text-[var(--color-leaf-700)]">
            Lihat marketplace material →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell grow space-y-6 py-8">
      <header className="rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-10 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">
          {profile?.role === "collector" ? "Pickup Tersedia" : "Listing Sampah Saya"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          {profile?.role === "collector" ? "Marketplace sampah rumah tangga" : "Sampah yang saya jual"}
        </h1>
        <p className="mt-3 text-sm text-white/70">
          {profile?.role === "collector"
            ? "Listing difilter sesuai jenis sampah yang Anda tangani dan wilayah layanan."
            : "Kelola listing terpilah Anda. Pengepul akan melihat status tersedia dan mengklaim pickup."}
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul atau lokasi" className="min-h-11 w-full rounded-xl border border-[var(--color-line)] py-2 pl-11 pr-4" />
        </label>
        {profile?.role === "collector" ? (
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Filter kota" className="min-h-11 rounded-xl border border-[var(--color-line)] px-4" />
        ) : null}
      </div>

      {dataQuery.isLoading ? <p>Memuat marketplace...</p> : null}
      {dataQuery.error ? <p className="text-sm text-[var(--color-red-700)]">{dataQuery.error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {items.length === 0 && !dataQuery.isLoading ? (
          <div className="col-span-full rounded-2xl border border-dashed p-8 text-center">
            <PackageSearch className="mx-auto size-8" />
            <p className="mt-3 font-semibold">Belum ada listing</p>
            <p className="mt-2 text-sm text-[var(--color-ink-600)]">
              {profile?.role === "household"
                ? "Buat listing pertama atau jalankan seed demo di backend."
                : "Tidak ada pickup tersedia untuk kategori yang Anda tangani."}
            </p>
            {profile?.role === "household" ? (
              <Link href={routes.listingsNew} className="mt-4 inline-flex text-sm font-semibold text-[var(--color-leaf-700)]">
                Buat listing →
              </Link>
            ) : null}
          </div>
        ) : null}
        {items.map((item) => {
          const id = String(item.id);
          const title = String(item.title);
          const weight = Number("estimated_weight_kg" in item ? item.estimated_weight_kg : 0);
          const district = String(item.district ?? "");
          const cityName = String(item.city ?? "");
          const categoryName =
            "category" in item && item.category && typeof item.category === "object" && "name" in item.category
              ? String(item.category.name)
              : "Kategori";
          const household =
            "household_display_name" in item ? String(item.household_display_name) : "Rumah tangga";

          return (
            <article key={id} className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
              <p className="text-xs font-semibold uppercase text-[var(--color-leaf-700)]">{categoryName}</p>
              <h2 className="mt-1 text-lg font-semibold">{title}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-ink-600)]">
                <MapPin className="size-4" /> {district}{cityName ? `, ${cityName}` : ""}
              </p>
              <p className="mt-1 text-sm">{formatWeight(weight)} · {household}</p>
              <Link href={routes.listingDetail(id)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-leaf-700)]">
                Lihat detail <ArrowRight className="size-4" />
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export function WasteMarketplaceConnected() {
  return (
    <RequireAuth roles={["household", "collector"]}>
      <WasteMarketplaceContent />
    </RequireAuth>
  );
}
