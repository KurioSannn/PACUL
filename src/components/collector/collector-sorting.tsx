"use client";

import { ArrowRight, CheckCircle2, Package, Scale } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { mockWasteListings } from "@/data/mock-pacul";
import { wasteCategoryLabels } from "@/lib/constants";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { WasteCategory } from "@/types/pacul";

type SortResult = { id: string; sourceTitle: string; outputName: string; outputCategory: WasteCategory; outputWeightKg: number };

export function CollectorSortingView() {
  const pickedUpListings = mockWasteListings.filter((l) => l.status === "picked_up");
  const [results, setResults] = useState<SortResult[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [outputName, setOutputName] = useState("");
  const [outputWeight, setOutputWeight] = useState("");
  const [outputCategory, setOutputCategory] = useState<WasteCategory | "">("");

  const handleSort = () => {
    if (!activeId || !outputName || !outputWeight || !outputCategory) return;
    const source = pickedUpListings.find((l) => l.id === activeId);
    setResults((prev) => [...prev, {
      id: `sort-${Date.now()}`,
      sourceTitle: source?.title ?? "",
      outputName,
      outputCategory,
      outputWeightKg: Number(outputWeight),
    }]);
    setOutputName("");
    setOutputWeight("");
    setOutputCategory("");
    setActiveId(null);
  };

  return (
    <div className="page-shell grow py-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Panel Pengepul</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Pemilahan Material</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-600)]">Pilah sampah yang sudah diambil menjadi bahan baku yang siap dijual ke industri.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Source materials */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-4">Material Masuk ({pickedUpListings.length})</h2>
          {pickedUpListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-mint-200)] bg-[var(--color-sage-50)] p-8 text-center">
              <Package className="mx-auto size-8 text-[var(--color-mint-200)]" />
              <p className="mt-3 text-sm font-medium text-[var(--color-forest-900)]">Belum ada material masuk</p>
              <p className="mt-1 text-xs text-[var(--color-ink-500)]">Lakukan pickup terlebih dahulu.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pickedUpListings.map((listing) => (
                <button key={listing.id} type="button" onClick={() => setActiveId(listing.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${activeId === listing.id ? 'border-[var(--color-leaf-500)] bg-[var(--color-mint-100)]/30' : 'border-[var(--color-line)] hover:bg-[var(--color-sage-50)]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm text-[var(--color-forest-900)]">{listing.title}</h3>
                    <span className="rounded-full bg-[var(--color-mint-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-leaf-700)]">{wasteCategoryLabels[listing.category]}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-ink-500)]">{listing.householdName} · {formatWeight(listing.weightKg)}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right: Sort form */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-4">Form Pemilahan</h2>
          {!activeId ? (
            <div className="rounded-xl border border-dashed border-[var(--color-mint-200)] bg-[var(--color-sage-50)] p-8 text-center">
              <Scale className="mx-auto size-8 text-[var(--color-mint-200)]" />
              <p className="mt-3 text-sm font-medium text-[var(--color-forest-900)]">Pilih material di panel kiri</p>
              <p className="mt-1 text-xs text-[var(--color-ink-500)]">Klik material yang ingin dipilah untuk memulai.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Nama Bahan Baku Hasil</label>
                <input type="text" value={outputName} onChange={(e) => setOutputName(e.target.value)} placeholder="Contoh: PET bersih cacah" className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Kategori Output</label>
                  <select value={outputCategory} onChange={(e) => setOutputCategory(e.target.value as WasteCategory)} className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white">
                    <option value="">Pilih</option>
                    {Object.entries(wasteCategoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Berat Hasil (kg)</label>
                  <input type="number" step="0.1" min="0.1" value={outputWeight} onChange={(e) => setOutputWeight(e.target.value)} placeholder="0.0" className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white" />
                </div>
              </div>
              <button type="button" onClick={handleSort} disabled={!outputName || !outputWeight || !outputCategory} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-leaf-600)] text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)] disabled:opacity-50">
                <CheckCircle2 className="size-4" /> Simpan Hasil Pilah
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Sort results */}
      {results.length > 0 && (
        <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)]">Hasil Pemilahan ({results.length})</h2>
            <Link href={routes.collectorMaterialsNew} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-leaf-700)] hover:underline">
              Tambah ke Stok <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((r) => (
              <div key={r.id} className="rounded-xl border border-[var(--color-line)] p-4 bg-[var(--color-sage-50)]">
                <p className="font-semibold text-sm text-[var(--color-forest-900)]">{r.outputName}</p>
                <p className="text-xs text-[var(--color-ink-500)] mt-1">{wasteCategoryLabels[r.outputCategory]} · {formatWeight(r.outputWeightKg)}</p>
                <p className="text-[10px] text-[var(--color-ink-400)] mt-2">Sumber: {r.sourceTitle}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
