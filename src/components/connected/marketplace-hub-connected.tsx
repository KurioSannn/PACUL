"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Layers } from "lucide-react";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { CartSummaryBar, MaterialProductCard } from "@/components/marketplace/product-card";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/contexts/toast-context";

import { useAsyncData } from "@/hooks/use-async-data";
import { useDemoWorkflow } from "@/hooks/use-demo-workflow";
import { claimWasteListing, mergeCollectorWasteCatalog, mergeMaterialsWithDemo, mergePublicWasteCatalog } from "@/lib/demo-workflow-actions";
import { getCollectorAvailableWaste, listMaterials, listTransactions } from "@/lib/api";
import { wasteListingStatusLabels, materialBatchStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/format";
import { routes } from "@/lib/routes";

function FlowStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col items-center text-center">
      <span className="flex size-8 items-center justify-center rounded-full bg-[var(--color-leaf-600)] text-sm font-bold text-white">{n}</span>
      <p className="mt-2 text-sm font-semibold text-[var(--color-forest-900)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-500)]">{desc}</p>
    </div>
  );
}

function MarketplaceHubContent() {
  const router = useRouter();
  const { accessToken, profile } = useAuth();
  const { addItem } = useCart();
  const { pushToast } = useToast();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const { claimedListingIds, refresh: refreshDemoWorkflow } = useDemoWorkflow();

  const feedQuery = useAsyncData(async () => {
    if (!accessToken) return null;

    const [materialsRes, txRes, wasteRes] = await Promise.all([
      listMaterials(accessToken, { limit: 20, status: "available" }).catch(() => ({ items: [] })),
      listTransactions(accessToken).catch(() => [] as never[]),
      getCollectorAvailableWaste(accessToken, { limit: 20 }).catch(() => ({ items: [] })),
    ]);

    const wasteItems =
      profile?.role === "collector"
        ? mergeCollectorWasteCatalog(wasteRes.items)
        : mergePublicWasteCatalog(wasteRes.items);

    return {
      waste: wasteItems,
      materials: mergeMaterialsWithDemo(materialsRes.items),
      finished: [] as any[],
      transactions: txRes,
    };
  }, [accessToken, profile?.role, claimedListingIds.length], Boolean(accessToken));

  const claimWaste = async (listingId: string, listing: (typeof wasteItems)[number]) => {
    if (!accessToken) return;
    setClaimingId(listingId);
    try {
      const result = await claimWasteListing(accessToken, listingId, listing);
      if (result.mode === "demo") {
        pushToast(
          `"${result.listingTitle ?? "Listing"}" diklaim. Buka Peta & Rute Pengambilan untuk optimasi rute.`,
          "success",
        );
        refreshDemoWorkflow();
      } else {
        pushToast("Pickup diklaim. Lanjut ke rute pengambilan.", "success");
        await feedQuery.reload();
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal klaim.", "error");
    } finally {
      setClaimingId(null);
    }
  };

  const addToCart = (item: any) => {
    addItem(item);
    pushToast(`${item.name} masuk keranjang.`, "success");
  };

  const role = profile?.role;
  const wasteItems = (feedQuery.data?.waste ?? []).filter(
    (item) => !(role === "collector" && claimedListingIds.includes(item.id)),
  );
  const materialItems = feedQuery.data?.materials ?? [];
  const finishedItems = feedQuery.data?.finished ?? [];

  return (
    <main className="page-shell grow space-y-8 py-8 pb-24">
      <header className="rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-10 text-white">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">
          <Layers className="size-4" />
          Marketplace Berkesinambungan
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Etalase PACUL — E-commerce 3 Lapis</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
          Sampah difoto rumah tangga → pengepul klaim & pilah → industri beli via keranjang, checkout, negosiasi, dan
          simulasi bayar. Katalog demo ditampilkan sama untuk semua peran.
        </p>
      </header>



      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-ink-500)]">Alur rantai nilai</h2>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <FlowStep n={1} title="RT jual sampah" desc="Foto + AI → listing" />
          <ChevronRight className="hidden size-5 shrink-0 text-[var(--color-ink-400)] sm:block" />
          <FlowStep n={2} title="Pengepul ambil & pilah" desc="Klaim → rute → bahan baku" />
          <ChevronRight className="hidden size-5 shrink-0 text-[var(--color-ink-400)] sm:block" />
          <FlowStep n={3} title="Industri beli" desc="Keranjang → nego → bayar" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-forest-900)]">Lapisan 1 · Sampah rumah tangga</h2>
            <p className="text-sm text-[var(--color-ink-600)]">Stok mentah dari rumah tangga — siap diambil pengepul.</p>
          </div>
          <Link href={routes.marketplaceWaste} className="text-sm font-semibold text-[var(--color-leaf-700)]">
            Lihat semua →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wasteItems.slice(0, 6).map((item) => (
              <MaterialProductCard
                key={item.id}
                id={item.id}
                name={item.title}
                categoryName={item.category.name}
                sellerLabel={item.household_display_name}
                location={`${item.district ?? ""}${item.city ? `, ${item.city}` : ""}` || "Surabaya"}
                weightKg={item.estimated_weight_kg}
                pricePerKg={0}
                statusLabel={wasteListingStatusLabels[item.status as keyof typeof wasteListingStatusLabels] ?? item.status}
                secondaryAction={{ label: "Detail", href: routes.listingDetail(item.id) }}
                primaryAction={
                  role === "collector"
                    ? {
                        label: claimingId === item.id ? "Mengklaim..." : "Klaim pickup",
                        onClick: () => void claimWaste(item.id, item),
                      }
                    : role === "household"
                      ? { label: "Kelola", href: routes.listingDetail(item.id) }
                      : undefined
                }
              />
            ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-forest-900)]">Lapisan 2 · Bahan baku pengepul</h2>
            <p className="text-sm text-[var(--color-ink-600)]">Hasil pemilahan — beli via keranjang & checkout.</p>
          </div>
          <Link href={routes.marketplaceMaterials} className="text-sm font-semibold text-[var(--color-leaf-700)]">
            Etalase lengkap →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materialItems.slice(0, 6).map((item) => (
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
              onAddToCart={role === "industry" && item.status === "available" ? () => addToCart(item) : undefined}
              onBuyNow={
                role === "industry" && item.status === "available"
                  ? () => router.push(`${routes.ordersNew}?batchId=${item.id}`)
                  : undefined
              }
              secondaryAction={{ label: "Jejak material", href: routes.traceability(item.id) }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-forest-900)]">Lapisan 3 · Bahan baku jadi & transaksi</h2>
            <p className="text-sm text-[var(--color-ink-600)]">Produk olahan industri + jejak transaksi simulasi.</p>
          </div>
          <Link href={routes.transactions} className="text-sm font-semibold text-[var(--color-leaf-700)]">
            Semua transaksi →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {finishedItems.map((item) => (
            <MaterialProductCard
              key={item.id}
              id={item.id}
              name={item.name}
              categoryName={item.category.name}
              sellerLabel={item.collector.display_name}
              location={`${item.city ?? "—"}, ${item.province ?? "Jawa Timur"}`}
              weightKg={item.total_weight_kg}
              pricePerKg={item.price_per_kg}
              statusLabel="Bahan baku jadi"
              onAddToCart={role === "industry" ? () => addToCart(item) : undefined}
              secondaryAction={{ label: "Detail", href: routes.materialDetail(item.id) }}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(feedQuery.data?.transactions ?? []).slice(0, 3).map((tx) => (
            <Link
              key={tx.id}
              href={routes.transactionDetail(tx.id)}
              className="rounded-xl border bg-white p-4 hover:bg-[var(--color-sage-50)]"
            >
              <p className="text-xs font-semibold uppercase text-[var(--color-leaf-700)]">
                Transaksi #{tx.id.slice(0, 12)}
              </p>
              <p className="mt-1 font-semibold">{formatCurrency(tx.amount)}</p>
              <p className="text-sm text-[var(--color-ink-500)]">Status: {tx.status}</p>
            </Link>
          ))}
        </div>
      </section>

      {role === "household" ? (
        <section className="rounded-2xl border border-dashed bg-[var(--color-sage-50)] p-6 text-center">
          <p className="font-semibold">Mulai rantai dari sini</p>
          <p className="mt-2 text-sm text-[var(--color-ink-600)]">Foto sampah → AI klasifikasi → listing → pengepul ambil.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href={routes.listingsNew} className="rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white">
              Jual sampah + foto
            </Link>
            <Link href={routes.classificationDemo} className="rounded-full border bg-white px-5 py-2.5 text-sm font-semibold">
              Kamera AI live
            </Link>
          </div>
        </section>
      ) : null}

      <CartSummaryBar />
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
