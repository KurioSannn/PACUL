"use client";

import Link from "next/link";
import { PackageSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { DemoMarketplaceNotice } from "@/components/marketplace/demo-marketplace-notice";
import { MaterialProductCard } from "@/components/marketplace/product-card";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { useDemoWorkflow } from "@/hooks/use-demo-workflow";
import { claimWasteListing, mergeCollectorWasteCatalog, mergePublicWasteCatalog } from "@/lib/demo-workflow-actions";
import { getCollectorAvailableWaste } from "@/lib/api";
import { wasteListingStatusLabels } from "@/lib/labels";
import { routes } from "@/lib/routes";

function WasteMarketplaceContent() {
  const { accessToken, profile } = useAuth();
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const { claimedListingIds, refresh: refreshDemoWorkflow } = useDemoWorkflow();

  const dataQuery = useAsyncData(async () => {
    if (!accessToken) return { items: [] };

    const result = await getCollectorAvailableWaste(accessToken, { city: city || undefined, limit: 50 }).catch(() => ({
      items: [],
    }));
    const items =
      profile?.role === "collector"
        ? mergeCollectorWasteCatalog(result.items)
        : mergePublicWasteCatalog(result.items);
    return { items };
  }, [accessToken, city, profile?.role, claimedListingIds.length], Boolean(accessToken));

  const items = useMemo(() => {
    const raw = dataQuery.data?.items ?? [];
    const available = raw.filter(
      (item) => !(profile?.role === "collector" && claimedListingIds.includes(item.id)),
    );
    const q = query.trim().toLowerCase();
    return available.filter((item) =>
      `${item.title} ${item.district ?? ""} ${item.category.name}`.toLowerCase().includes(q),
    );
  }, [dataQuery.data, query, profile?.role, claimedListingIds]);

  const claimWaste = async (listingId: string, listing: (typeof items)[number]) => {
    if (!accessToken) return;
    setClaimingId(listingId);
    try {
      const result = await claimWasteListing(accessToken, listingId, listing);
      if (result.mode === "demo") {
        pushToast(
          `"${result.listingTitle ?? "Listing"}" diklaim. Buka Peta & Rute Pengambilan.`,
          "success",
        );
        refreshDemoWorkflow();
      } else {
        pushToast("Pickup diklaim. Tambahkan ke rute pengambilan.", "success");
        await dataQuery.reload();
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal klaim pickup.", "error");
    } finally {
      setClaimingId(null);
    }
  };

  const role = profile?.role;

  return (
    <main className="page-shell grow space-y-6 py-8">
      <header className="rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-10 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">
          Lapisan 1 · Sampah Rumah Tangga
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Marketplace sampah terpilah</h1>
        <p className="mt-3 text-sm text-white/70">
          Katalog demo Surabaya — sama untuk RT, pengepul, dan industri. Pengepul bisa klaim pickup; RT kelola listing
          sendiri.
        </p>
        {role === "household" ? (
          <Link href={routes.listingsNew} className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-forest-900)]">
            + Jual sampah (foto + AI)
          </Link>
        ) : null}
      </header>



      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul atau lokasi" className="min-h-11 w-full rounded-xl border border-[var(--color-line)] py-2 pl-11 pr-4" />
        </label>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Filter kota" className="min-h-11 rounded-xl border border-[var(--color-line)] px-4 sm:w-40" />
      </div>

      {dataQuery.isLoading ? <p>Memuat marketplace...</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && !dataQuery.isLoading ? (
          <div className="col-span-full rounded-2xl border border-dashed p-8 text-center">
            <PackageSearch className="mx-auto size-8" />
            <p className="mt-3 font-semibold">Tidak ada hasil filter</p>
          </div>
        ) : null}
        {items.map((item) => (
          <MaterialProductCard
            key={item.id}
            id={item.id}
            name={item.title}
            categoryName={item.category.name}
            sellerLabel={item.household_display_name}
            location={`${item.district ?? ""}${item.city ? `, ${item.city}` : ""}`}
            weightKg={item.estimated_weight_kg}
            pricePerKg={0}
            statusLabel={wasteListingStatusLabels[item.status as keyof typeof wasteListingStatusLabels] ?? item.status}
            secondaryAction={{ label: "Detail listing", href: routes.listingDetail(item.id) }}
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

      {role === "collector" ? (
        <div className="rounded-xl border bg-[var(--color-sage-50)] p-4 text-center text-sm">
          Setelah klaim, buka{" "}
          <Link href={routes.pickupRoutes} className="font-semibold text-[var(--color-leaf-700)]">
            Peta & Rute Optimal
          </Link>
        </div>
      ) : null}
    </main>
  );
}

export function WasteMarketplaceConnected() {
  return (
    <RequireAuth>
      <WasteMarketplaceContent />
    </RequireAuth>
  );
}
