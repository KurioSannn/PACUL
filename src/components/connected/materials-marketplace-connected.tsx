"use client";

import Link from "next/link";
import { ArrowRight, PackageSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { listMaterials } from "@/lib/api";
import { materialBatchStatusLabels } from "@/lib/labels";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function MaterialsMarketplaceContent() {
  const { accessToken } = useAuth();
  const [query, setQuery] = useState("");

  const dataQuery = useAsyncData(
    () => listMaterials(accessToken!, { limit: 50 }),
    [accessToken],
    Boolean(accessToken),
  );

  const items = useMemo(() => {
    const raw = dataQuery.data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((item) =>
      `${item.name} ${item.category.name} ${item.city ?? ""} ${item.collector.display_name}`.toLowerCase().includes(q),
    );
  }, [dataQuery.data, query]);

  return (
    <main className="page-shell grow space-y-6 py-8">
      <header className="rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-10 text-white">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">
          Marketplace Bahan Baku
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Bahan baku dari pengepul</h1>
        <p className="mt-3 text-sm text-white/70">
          Batch material hasil pemilahan, siap dipesan dan dinegosiasikan oleh industri.
        </p>
      </header>

      <label className="relative block">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari material" className="min-h-11 w-full rounded-xl border border-[var(--color-line)] py-2 pl-11 pr-4" />
      </label>

      {dataQuery.isLoading ? <p>Memuat material...</p> : null}
      {dataQuery.error ? <p className="text-sm text-[var(--color-red-700)]">{dataQuery.error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {items.length === 0 && !dataQuery.isLoading ? (
          <div className="col-span-full rounded-2xl border border-dashed p-8 text-center">
            <PackageSearch className="mx-auto size-8" />
            <p className="mt-3 font-semibold">Belum ada material tersedia</p>
          </div>
        ) : null}
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <p className="text-xs font-semibold uppercase text-[var(--color-leaf-700)]">{item.category.name}</p>
            <h2 className="mt-1 text-lg font-semibold">{item.name}</h2>
            <p className="mt-2 text-sm text-[var(--color-ink-600)]">
              {formatWeight(item.total_weight_kg)} · {formatCurrency(item.price_per_kg)}/kg
            </p>
            <p className="text-sm">{item.collector.display_name} · {item.city ?? "Lokasi tidak tersedia"}</p>
            <span className="mt-2 inline-flex rounded-full bg-[var(--color-sage-50)] px-3 py-1 text-xs font-semibold">
              {materialBatchStatusLabels[item.status] ?? item.status}
            </span>
            <div className="mt-4 flex gap-3">
              <Link href={routes.materialDetail(item.id)} className="text-sm font-semibold text-[var(--color-leaf-700)]">
                Detail material
              </Link>
              <Link href={routes.traceability(item.id)} className="text-sm font-semibold text-[var(--color-leaf-700)]">
                Jejak Material
              </Link>
              <Link href={`${routes.ordersNew}?batchId=${item.id}`} className="inline-flex items-center gap-1 text-sm font-semibold">
                Buat order <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export function MaterialsMarketplaceConnected() {
  return (
    <RequireAuth roles={["industry", "collector"]}>
      <MaterialsMarketplaceContent />
    </RequireAuth>
  );
}
