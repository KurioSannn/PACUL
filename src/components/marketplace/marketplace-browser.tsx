"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Filter, Heart, LayoutGrid, MapPin, PackageSearch, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { materialStatusLabels, wasteCategoryLabels, wasteListingStatusLabels } from "@/lib/constants";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { MaterialStock, WasteCategory, WasteListing } from "@/types/pacul";

const categoryOptions = Object.entries(wasteCategoryLabels) as [WasteCategory, string][];
type MarketplaceView = "all" | "favorites" | "recent";

function MarketplaceIntro({ description, eyebrow, title }: { description: string; eyebrow: string; title: string }) {
  return (
    <header className="rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-10 text-white sm:px-9 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">{eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">{description}</p>
      <p className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
        Data demo MVP
      </p>
    </header>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">Cari marketplace</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cari material atau lokasi"
        className="min-h-12 w-full rounded-xl border border-[var(--color-line)] bg-white py-3 pl-11 pr-4 text-sm text-[var(--color-ink-900)] outline-none placeholder:text-[var(--color-ink-500)] focus:border-[var(--color-leaf-500)] focus:ring-2 focus:ring-[var(--color-mint-200)]"
      />
    </label>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="grid min-w-40 gap-1.5 text-xs font-semibold text-[var(--color-ink-700)]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 rounded-xl border border-[var(--color-line)] bg-white px-3 text-sm font-medium text-[var(--color-forest-900)] focus:border-[var(--color-leaf-500)] focus:ring-2 focus:ring-[var(--color-mint-200)]">
        {children}
      </select>
    </label>
  );
}

function ViewTabs({ activeView, favoriteCount, recentCount, totalCount, onChange }: { activeView: MarketplaceView; favoriteCount: number; recentCount: number; totalCount: number; onChange: (view: MarketplaceView) => void }) {
  const views = [
    { id: "all" as const, label: "Lihat Semua", count: totalCount, icon: LayoutGrid },
    { id: "favorites" as const, label: "Favorit", count: favoriteCount, icon: Heart },
    { id: "recent" as const, label: "Terbaru", count: recentCount, icon: Clock3 },
  ];

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Pilihan tampilan marketplace">
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => onChange(view.id)}
          aria-pressed={activeView === view.id}
          className={activeView === view.id ? "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--color-forest-900)] px-4 text-sm font-semibold text-white" : "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)]"}
        >
          <view.icon className="size-4" aria-hidden="true" />
          {view.label}
          <span className={activeView === view.id ? "rounded-full bg-white/15 px-2 py-0.5 text-xs" : "rounded-full bg-[var(--color-sage-50)] px-2 py-0.5 text-xs text-[var(--color-ink-500)]"}>{view.count}</span>
        </button>
      ))}
    </nav>
  );
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-[var(--color-mint-200)] bg-white p-8 text-center">
      <PackageSearch className="mx-auto size-8 text-[var(--color-leaf-700)]" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-[var(--color-forest-900)]">Belum ada hasil yang cocok</h2>
      <p className="mt-2 text-sm text-[var(--color-ink-700)]">Ubah kata kunci atau reset filter untuk melihat data demo lainnya.</p>
      <button type="button" onClick={onReset} className="mt-5 min-h-11 rounded-full border border-[var(--color-line)] px-5 text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">
        Reset filter
      </button>
    </div>
  );
}

export function WasteMarketplaceBrowser({ listings }: { listings: WasteListing[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [activeView, setActiveView] = useState<MarketplaceView>("all");
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(["waste-pet-rungkut", "waste-aluminium-sukolilo"]));

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesFilters = listings.filter((listing) => {
      const matchesQuery = !normalizedQuery || `${listing.title} ${listing.district} ${listing.householdName}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (category === "all" || listing.category === category) && (status === "all" || listing.status === status);
    });

    if (activeView === "favorites") return matchesFilters.filter((listing) => favoriteIds.has(listing.id));
    if (activeView === "recent") return [...matchesFilters].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
    return matchesFilters;
  }, [activeView, category, favoriteIds, listings, query, status]);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setQuery("");
    setCategory("all");
    setStatus("all");
    setActiveView("all");
  };

  return (
    <main className="page-shell grow space-y-8 py-8">
      <MarketplaceIntro eyebrow="Marketplace rumah tangga" title="Temukan sampah terpilah yang siap dikelola." description="Cari listing berdasarkan kategori, lokasi, dan status. Setiap detail mengarah ke alur pickup yang tersedia di demo PACUL." />

      <ViewTabs activeView={activeView} favoriteCount={favoriteIds.size} recentCount={Math.min(3, listings.length)} totalCount={listings.length} onChange={setActiveView} />

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-4 sm:p-5" aria-labelledby="waste-filter-title">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-[var(--color-leaf-700)]" aria-hidden="true" />
          <h2 id="waste-filter-title" className="text-sm font-semibold text-[var(--color-forest-900)]">Filter listing</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <SearchField value={query} onChange={setQuery} />
          <FilterSelect label="Kategori" value={category} onChange={setCategory}>
            <option value="all">Semua kategori</option>
            {categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
          <FilterSelect label="Status" value={status} onChange={setStatus}>
            <option value="all">Semua status</option>
            {Object.entries(wasteListingStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
        </div>
      </section>

      <section aria-labelledby="waste-results-title">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Hasil pencarian</p>
            <h2 id="waste-results-title" className="text-2xl font-semibold text-[var(--color-forest-900)]">{filteredListings.length} listing ditemukan</h2>
          </div>
          <Link href={routes.listingsNew} className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--color-leaf-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)] sm:w-auto">Tambah listing</Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredListings.length === 0 ? <EmptyResults onReset={reset} /> : filteredListings.map((listing) => (
            <article key={listing.id} className="flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-white p-5 transition-colors hover:border-[var(--color-mint-200)]">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[var(--color-mint-100)] px-3 py-1 text-xs font-semibold text-[var(--color-leaf-700)]">{wasteCategoryLabels[listing.category]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--color-ink-500)]">{wasteListingStatusLabels[listing.status]}</span>
                    <button type="button" onClick={() => toggleFavorite(listing.id)} aria-pressed={favoriteIds.has(listing.id)} aria-label={favoriteIds.has(listing.id) ? `Hapus ${listing.title} dari favorit` : `Simpan ${listing.title} ke favorit`} className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink-500)] hover:bg-[var(--color-mint-100)] hover:text-[var(--color-leaf-700)]">
                      <Heart className={favoriteIds.has(listing.id) ? "size-4 fill-[var(--color-leaf-600)] text-[var(--color-leaf-600)]" : "size-4"} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--color-forest-900)]">{listing.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-ink-500)]">{listing.householdName}</p>
                <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-[var(--color-line)] py-4">
                  <div><dt className="text-xs text-[var(--color-ink-500)]">Berat</dt><dd className="mt-1 text-sm font-semibold text-[var(--color-forest-900)]">{formatWeight(listing.weightKg)}</dd></div>
                  <div><dt className="text-xs text-[var(--color-ink-500)]">Lokasi</dt><dd className="mt-1 flex items-center gap-1 text-sm font-semibold text-[var(--color-forest-900)]"><MapPin className="size-3.5" aria-hidden="true" />{listing.district}</dd></div>
                </dl>
              </div>
              <div className="mt-auto pt-5">
                <Link href={routes.listingDetail(listing.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--color-line)] text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">Lihat detail <ArrowRight className="size-4" aria-hidden="true" /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function MaterialMarketplaceBrowser({ materials }: { materials: MaterialStock[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [activeView, setActiveView] = useState<MarketplaceView>("all");
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(["material-pet-sidoarjo", "material-aluminium-gresik"]));

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesFilters = materials.filter((material) => {
      const matchesQuery = !normalizedQuery || `${material.materialName} ${material.location} ${material.collectorName}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (category === "all" || material.category === category) && (availability === "all" || material.status === availability);
    });

    if (activeView === "favorites") return matchesFilters.filter((material) => favoriteIds.has(material.id));
    if (activeView === "recent") return [...matchesFilters].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
    return matchesFilters;
  }, [activeView, availability, category, favoriteIds, materials, query]);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setQuery("");
    setCategory("all");
    setAvailability("all");
    setActiveView("all");
  };

  return (
    <main className="page-shell grow space-y-8 py-8">
      <MarketplaceIntro eyebrow="Marketplace industri" title="Pilih bahan baku daur ulang sesuai kebutuhan produksi." description="Bandingkan kategori, stok, harga, dan lokasi material hasil pilah sebelum membuat pesanan atau membuka negosiasi." />

      <ViewTabs activeView={activeView} favoriteCount={favoriteIds.size} recentCount={Math.min(3, materials.length)} totalCount={materials.length} onChange={setActiveView} />

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-4 sm:p-5" aria-labelledby="material-filter-title">
        <div className="mb-4 flex items-center gap-2"><Filter className="size-4 text-[var(--color-leaf-700)]" aria-hidden="true" /><h2 id="material-filter-title" className="text-sm font-semibold text-[var(--color-forest-900)]">Filter bahan baku</h2></div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <SearchField value={query} onChange={setQuery} />
          <FilterSelect label="Kategori" value={category} onChange={setCategory}>
            <option value="all">Semua kategori</option>
            {categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
          <FilterSelect label="Ketersediaan" value={availability} onChange={setAvailability}>
            <option value="all">Semua status</option>
            {Object.entries(materialStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
        </div>
      </section>

      <section aria-labelledby="material-results-title">
        <p className="eyebrow">Stok material</p>
        <h2 id="material-results-title" className="text-2xl font-semibold text-[var(--color-forest-900)]">{filteredMaterials.length} material ditemukan</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMaterials.length === 0 ? <EmptyResults onReset={reset} /> : filteredMaterials.map((material) => (
            <article key={material.id} className="flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-white p-5 transition-colors hover:border-[var(--color-mint-200)]">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[var(--color-mint-100)] px-3 py-1 text-xs font-semibold text-[var(--color-leaf-700)]">{wasteCategoryLabels[material.category]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--color-ink-500)]">{materialStatusLabels[material.status]}</span>
                    <button type="button" onClick={() => toggleFavorite(material.id)} aria-pressed={favoriteIds.has(material.id)} aria-label={favoriteIds.has(material.id) ? `Hapus ${material.materialName} dari favorit` : `Simpan ${material.materialName} ke favorit`} className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink-500)] hover:bg-[var(--color-mint-100)] hover:text-[var(--color-leaf-700)]">
                      <Heart className={favoriteIds.has(material.id) ? "size-4 fill-[var(--color-leaf-600)] text-[var(--color-leaf-600)]" : "size-4"} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--color-forest-900)]">{material.materialName}</h3>
                <p className="mt-1 text-sm text-[var(--color-ink-500)]">{material.collectorName}</p>
                <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-[var(--color-line)] py-4">
                  <div><dt className="text-xs text-[var(--color-ink-500)]">Stok</dt><dd className="mt-1 text-sm font-semibold text-[var(--color-forest-900)]">{formatWeight(material.weightKg)}</dd></div>
                  <div><dt className="text-xs text-[var(--color-ink-500)]">Harga/kg</dt><dd className="mt-1 text-sm font-semibold text-[var(--color-earth-700)]">{formatCurrency(material.pricePerKg)}</dd></div>
                </dl>
                <p className="mt-4 flex items-center gap-1.5 text-sm text-[var(--color-ink-700)]"><MapPin className="size-4 text-[var(--color-leaf-700)]" aria-hidden="true" />{material.location}</p>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                <Link href={routes.traceability(material.id)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-line)] px-3 text-center text-xs font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">Lacak sumber</Link>
                <Link href={routes.ordersNew} aria-disabled={material.status !== "available"} className={material.status === "available" ? "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-leaf-600)] px-3 text-center text-xs font-semibold text-white hover:bg-[var(--color-leaf-700)]" : "pointer-events-none inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-line)] px-3 text-center text-xs font-semibold text-[var(--color-ink-500)]"}>Buat order</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
