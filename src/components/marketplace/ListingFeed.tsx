"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";

import { ListingCard } from "./ListingCard";
import { UNIFIED_MARKETPLACE_LISTINGS } from "@/data/unified-marketplace-listings";
import { routes } from "@/lib/routes";
import type { WasteCategory } from "@/types/pacul";

type ListingFeedProps = {
  query: string;
  category: "all" | WasteCategory;
  layer: "all" | "raw" | "processed" | "finished";
  filteredCount: number;
};

function ListingSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
      <div className="h-40 w-full animate-pulse bg-neutral-200" />
      <div className="flex flex-1 flex-col p-5">
        <div className="h-5 w-24 animate-pulse rounded-full bg-neutral-200" />
        <div className="mt-4 h-6 w-3/4 animate-pulse rounded-md bg-neutral-200" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded-md bg-neutral-200" />
        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[var(--color-line)] py-4">
          <div>
            <div className="h-3 w-12 animate-pulse bg-neutral-200" />
            <div className="mt-1.5 h-4 w-16 animate-pulse bg-neutral-200" />
          </div>
          <div>
            <div className="h-3 w-16 animate-pulse bg-neutral-200" />
            <div className="mt-1.5 h-4 w-20 animate-pulse bg-neutral-200" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="size-4 animate-pulse rounded-full bg-neutral-200" />
          <div className="h-4 w-1/3 animate-pulse bg-neutral-200" />
        </div>
        <div className="mt-5 pt-2">
          <div className="h-[42px] w-full animate-pulse rounded-full bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

export function ListingFeed({ query, category, layer, filteredCount }: ListingFeedProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const listings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UNIFIED_MARKETPLACE_LISTINGS.filter((item) => {
      if (layer !== "all" && item.type !== layer) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return `${item.title} ${item.location} ${item.actorName}`.toLowerCase().includes(q);
    });
  }, [query, category, layer]);

  return (
    <section aria-labelledby="feed-title">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-leaf-700)]">
            Etalase Terbuka
          </p>
          <h2
            id="feed-title"
            className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)]"
          >
            {isLoading ? "Memuat listing..." : `${filteredCount} listing tersedia`}
          </h2>
        </div>
        <p className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-sage-50)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-500)]">
          Katalog demo Surabaya · {UNIFIED_MARKETPLACE_LISTINGS.length} item
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <ListingSkeleton key={i} />)
        ) : listings.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[var(--color-mint-200)] bg-white p-10 text-center">
            <PackageSearch className="mx-auto size-8 text-[var(--color-leaf-700)]" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-[var(--color-forest-900)]">
              Belum ada listing yang cocok
            </h3>
            <p className="mt-2 text-sm text-[var(--color-ink-700)]">
              Ubah kata kunci atau reset filter untuk melihat katalog demo lainnya.
            </p>
          </div>
        ) : (
          listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
        )}
      </div>

      {!isLoading && listings.length > 0 ? (
        <p className="mt-6 text-center text-sm text-[var(--color-ink-500)]">
          <a href={routes.authLogin} className="font-semibold text-[var(--color-leaf-700)] hover:underline">
            Masuk
          </a>{" "}
          untuk klaim pickup, beli bahan baku, atau checkout.
        </p>
      ) : null}
    </section>
  );
}
