"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { DemoMarketplaceNotice } from "@/components/marketplace/demo-marketplace-notice";
import { CartSummaryBar, MaterialProductCard } from "@/components/marketplace/product-card";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { useDemoWorkflow } from "@/hooks/use-demo-workflow";
import { deletePublishedBatch, mergeMaterialsWithDemo } from "@/lib/demo-workflow-actions";
import { isDemoBatchId } from "@/lib/demo-workflow-store";
import { listMaterials } from "@/lib/api";
import { materialBatchStatusLabels } from "@/lib/labels";
import { routes } from "@/lib/routes";

function MaterialsMarketplaceContent() {
  const router = useRouter();
  const { accessToken, profile } = useAuth();
  const { addItem, itemCount } = useCart();
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const { publishedBatches, refresh: refreshWorkflow } = useDemoWorkflow();

  const dataQuery = useAsyncData(async () => {
    if (!accessToken) return { items: [] };
    const res = await listMaterials(accessToken, { limit: 50, city: cityFilter || undefined }).catch(() => ({
      items: [],
    }));
    return { items: mergeMaterialsWithDemo(res.items) };
  }, [accessToken, cityFilter, publishedBatches.length], Boolean(accessToken));

  const items = useMemo(() => {
    const raw = dataQuery.data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((item) =>
      `${item.name} ${item.category.name} ${item.city ?? ""} ${item.collector.display_name}`.toLowerCase().includes(q),
    );
  }, [dataQuery.data, query]);

  const isIndustry = profile?.role === "industry";
  const isCollector = profile?.role === "collector";

  const removeOwnBatch = (batchId: string) => {
    deletePublishedBatch(batchId);
    refreshWorkflow();
    pushToast("Batch dihapus dari etalase.", "success");
  };

  return (
    <main className="page-shell grow space-y-6 py-8 pb-24">
      <header className="rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-10 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">Lapisan 2 · Toko Bahan Baku</p>
            <h1 className="mt-3 text-3xl font-semibold">Beli bahan baku pengepul</h1>
            <p className="mt-3 max-w-xl text-sm text-white/70">
              Menampilkan bahan baku (lapisan 2) yang telah dipilah oleh Pengepul dari sampah Rumah Tangga. Anda dapat langsung menambahkan bahan baku ini ke keranjang untuk dipesan.
            </p>
          </div>
          {isIndustry && itemCount > 0 ? (
            <Link href={routes.checkout} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-forest-900)]">
              Keranjang ({itemCount})
            </Link>
          ) : null}
        </div>
      </header>



      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, kategori, pengepul..." className="min-h-11 w-full rounded-xl border py-2 pl-11 pr-4" />
        </label>
        <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Filter kota" className="min-h-11 rounded-xl border px-4 sm:w-40" />
      </div>

      {dataQuery.isLoading ? <p>Memuat etalase...</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MaterialProductCard
            key={item.id}
            id={item.id}
            name={item.name}
            categoryName={item.category.name}
            sellerLabel={item.collector.display_name}
            location={`${item.city ?? "—"}, ${item.province ?? "Jawa Timur"}`}
            weightKg={item.total_weight_kg}
            pricePerKg={item.price_per_kg}
            statusLabel={materialBatchStatusLabels[item.status] ?? item.status}
            onAddToCart={
              isIndustry && item.status === "available"
                ? () => {
                    addItem(item);
                    pushToast("Ditambahkan ke keranjang.", "success");
                  }
                : undefined
            }
            onBuyNow={
              isIndustry && item.status === "available"
                ? () => router.push(`${routes.ordersNew}?batchId=${item.id}`)
                : undefined
            }
            secondaryAction={{ label: "Detail & jejak", href: routes.materialDetail(item.id) }}
            primaryAction={
              isCollector && isDemoBatchId(item.id)
                ? { label: "Hapus batch", onClick: () => removeOwnBatch(item.id) }
                : undefined
            }
          />
        ))}
      </div>

      <CartSummaryBar />
    </main>
  );
}

export function MaterialsMarketplaceConnected() {
  return (
    <RequireAuth>
      <MaterialsMarketplaceContent />
    </RequireAuth>
  );
}
