"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Navigation, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { wasteCategoryLabels, wasteListingStatusLabels } from "@/lib/constants";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { WasteListing, WasteListingStatus } from "@/types/pacul";

const statusFilterOptions: { value: "all" | WasteListingStatus; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "draft", label: "Draft" },
  { value: "listed", label: "Diterbitkan" },
  { value: "scheduled", label: "Terjadwal" },
  { value: "picked_up", label: "Sudah diambil" },
  { value: "sorted", label: "Sudah dipilah" },
  { value: "cancelled", label: "Dibatalkan" },
];

function statusColor(status: WasteListingStatus): string {
  switch (status) {
    case "listed": return "bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]";
    case "scheduled": return "bg-[var(--color-blue-100)] text-[var(--color-blue-700)]";
    case "picked_up": return "bg-[var(--color-amber-100)] text-[var(--color-amber-600)]";
    case "sorted": return "bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]";
    case "cancelled": return "bg-[var(--color-red-100)] text-[var(--color-red-700)]";
    default: return "bg-[#edf0ee] text-[var(--color-ink-700)]";
  }
}

export function MyMaterialsView({ listings }: { listings: WasteListing[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WasteListingStatus>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      const matchesQuery = !q || `${l.title} ${l.district} ${l.category}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [listings, query, statusFilter]);

  return (
    <div className="page-shell grow py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Material Saya</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">
            Daftar listing material milik Anda
          </h1>
        </div>
        <Link
          href={routes.listingsNew}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-leaf-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)] sm:w-auto"
        >
          Buat Listing Baru
        </Link>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Cari material</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul, lokasi, atau kategori"
              className="min-h-12 w-full rounded-xl border border-[var(--color-line)] bg-white py-3 pl-11 pr-4 text-sm text-[var(--color-ink-900)] outline-none placeholder:text-[var(--color-ink-500)] focus:border-[var(--color-leaf-500)] focus:ring-2 focus:ring-[var(--color-mint-200)]"
            />
          </label>
          <label className="grid min-w-40 gap-1.5 text-xs font-semibold text-[var(--color-ink-700)]">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | WasteListingStatus)}
              className="min-h-12 rounded-xl border border-[var(--color-line)] bg-white px-3 text-sm font-medium text-[var(--color-forest-900)] focus:border-[var(--color-leaf-500)] focus:ring-2 focus:ring-[var(--color-mint-200)]"
            >
              {statusFilterOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* Results */}
      <p className="text-sm text-[var(--color-ink-500)]">{filtered.length} listing ditemukan</p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-mint-200)] bg-white p-10 text-center">
          <Package className="mx-auto size-10 text-[var(--color-leaf-700)]" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--color-forest-900)]">Belum ada material</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-700)]">Buat listing pertama Anda untuk mulai menyetor material daur ulang.</p>
          <Link href={routes.listingsNew} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[var(--color-leaf-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)]">
            Buat Listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((listing) => (
            <article key={listing.id} className="flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-white p-5 transition-colors hover:border-[var(--color-mint-200)]">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[var(--color-mint-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-leaf-700)]">{wasteCategoryLabels[listing.category]}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(listing.status)}`}>{wasteListingStatusLabels[listing.status]}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--color-forest-900)]">{listing.title}</h3>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">{listing.district} · {formatWeight(listing.weightKg)}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">Dibuat: {new Date(listing.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>

              <div className="mt-auto grid gap-2 pt-5">
                <Link href={routes.listingDetail(listing.id)} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-[var(--color-line)] text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">
                  Lihat detail <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
                {(listing.status === "listed" || listing.status === "scheduled") && (
                  <div className="grid grid-cols-2 gap-2">
                    {listing.status === "listed" && (
                      <Link href={routes.pickupConfirm} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--color-leaf-600)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-leaf-700)]">
                        <Navigation className="size-3.5" aria-hidden="true" /> Konfirmasi
                      </Link>
                    )}
                    {listing.status === "scheduled" && (
                      <Link href={routes.pickupTracking} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--color-forest-900)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-forest-800)]">
                        <Navigation className="size-3.5" aria-hidden="true" /> Lacak
                      </Link>
                    )}
                    <Link href={routes.messages} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 text-xs font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">
                      <MessageCircle className="size-3.5" aria-hidden="true" /> Chat
                    </Link>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
