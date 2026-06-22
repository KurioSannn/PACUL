"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import { wasteCategoryLabels } from "@/lib/constants";
import type { WasteCategory } from "@/types/pacul";

type FilterBarProps = {
  query: string;
  category: "all" | WasteCategory;
  layer: "all" | "raw" | "processed" | "finished";
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: "all" | WasteCategory) => void;
  onLayerChange: (value: "all" | "raw" | "processed" | "finished") => void;
};

export function FilterBar({
  query,
  category,
  layer,
  onQueryChange,
  onCategoryChange,
  onLayerChange,
}: FilterBarProps) {
  return (
    <div className="sticky top-[68px] z-30 -mx-4 border-y border-[var(--color-line)] bg-white/80 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2 md:w-48">
          <SlidersHorizontal className="size-4 text-[var(--color-leaf-700)]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[var(--color-forest-900)]">Filter Etalase</h2>
        </div>

        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Cari material</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Cari jenis material atau area..."
              className="min-h-10 w-full rounded-xl border border-[var(--color-line)] bg-white py-2 pl-10 pr-4 text-sm text-[var(--color-ink-900)] outline-none placeholder:text-[var(--color-ink-500)] focus:border-[var(--color-leaf-500)] focus:ring-1 focus:ring-[var(--color-leaf-500)]"
            />
          </label>

          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as "all" | WasteCategory)}
            className="min-h-10 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-forest-900)] focus:border-[var(--color-leaf-500)] focus:ring-1 focus:ring-[var(--color-leaf-500)]"
          >
            <option value="all">Semua Jenis</option>
            {Object.entries(wasteCategoryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={layer}
            onChange={(e) => onLayerChange(e.target.value as "all" | "raw" | "processed" | "finished")}
            className="min-h-10 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-forest-900)] focus:border-[var(--color-leaf-500)] focus:ring-1 focus:ring-[var(--color-leaf-500)]"
          >
            <option value="all">Semua Lapis</option>
            <option value="raw">Sampah Terpilah (RT)</option>
            <option value="processed">Bahan Baku (Pengepul)</option>
            <option value="finished">Bahan Jadi (Industri)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
