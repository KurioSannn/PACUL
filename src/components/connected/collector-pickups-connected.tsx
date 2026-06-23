"use client";

import Link from "next/link";
import { MapPin, Trash2, Truck } from "lucide-react";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { DemoMarketplaceNotice } from "@/components/marketplace/demo-marketplace-notice";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { useDemoWorkflow } from "@/hooks/use-demo-workflow";
import { cancelPickupClaim, claimWasteListing, mergeCollectorWasteCatalog } from "@/lib/demo-workflow-actions";
import { getCollectorAvailableWaste } from "@/lib/api";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function CollectorPickupsContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { claimedListingIds, claimRecords, refresh: refreshWorkflow } = useDemoWorkflow();

  const listingsQuery = useAsyncData(async () => {
    if (!accessToken) return { items: [] };
    const result = await getCollectorAvailableWaste(accessToken, { limit: 30 }).catch(() => ({ items: [] }));
    return { items: mergeCollectorWasteCatalog(result.items) };
  }, [accessToken, claimedListingIds.length, claimRecords.length], Boolean(accessToken));

  const items = listingsQuery.data?.items ?? [];
  const activeClaims = claimRecords.filter((c) => c.status === "claimed" || c.status === "picked_up");

  const claim = async (listingId: string, listing: (typeof items)[number]) => {
    if (!accessToken) return;
    setClaimingId(listingId);
    try {
      const result = await claimWasteListing(accessToken, listingId, listing);
      refreshWorkflow();
      pushToast(
        `"${result.listingTitle ?? listing.title}" diklaim. Buka Langkah 2 — Peta & Rute.`,
        "success",
      );
      await listingsQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal mengklaim pickup.", "error");
    } finally {
      setClaimingId(null);
    }
  };

  const cancelClaim = async (listingId: string) => {
    if (!accessToken) return;
    setCancellingId(listingId);
    try {
      await cancelPickupClaim(accessToken, listingId);
      refreshWorkflow();
      pushToast("Klaim pickup dibatalkan.", "success");
      await listingsQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal membatalkan klaim.", "error");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Pengepul · Langkah 1"
        title="Klaim Sampah RT"
        description="Listing dari API, demo, dan data baru rumah tangga tersinkron otomatis. Klaim pickup lalu susun rute."
        actions={
          <Link
            href={routes.pickupRoutes}
            className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold"
          >
            Langkah 2 · Peta Rute {activeClaims.length > 0 ? `(${activeClaims.length})` : ""}
          </Link>
        }
      />

      <DemoMarketplaceNotice show />

      {activeClaims.length > 0 ? (
        <section className="rounded-2xl border border-[var(--color-leaf-600)] bg-[var(--color-mint-50)] p-5">
          <h2 className="font-semibold text-[var(--color-forest-900)]">Pickup sudah diklaim ({activeClaims.length})</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-600)]">
            Data ini otomatis muncul di Peta Rute, Pemilahan, dan Jual ke Industri.
          </p>
          <ul className="mt-4 space-y-2">
            {activeClaims.map((claim) => (
              <li key={claim.listingId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
                <span>
                  <span className="font-semibold">{claim.title}</span>
                  <span className="ml-2 text-[var(--color-ink-500)]">
                    {formatWeight(claim.estimated_weight_kg)} · {claim.status === "picked_up" ? "sudah diambil" : "menunggu rute"}
                  </span>
                </span>
                <div className="flex gap-2">
                  <Link href={routes.pickupRoutes} className="rounded-full border px-3 py-1.5 text-xs font-semibold">
                    Lihat di peta
                  </Link>
                  <button
                    type="button"
                    disabled={cancellingId === claim.listingId}
                    onClick={() => void cancelClaim(claim.listingId)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-red-200)] px-3 py-1.5 text-xs font-semibold text-[var(--color-red-700)] disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" />
                    {cancellingId === claim.listingId ? "Membatalkan..." : "Batalkan klaim"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {listingsQuery.isLoading ? <p className="text-sm">Memuat listing...</p> : null}
      {listingsQuery.error ? (
        <p className="rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">{listingsQuery.error}</p>
      ) : null}

      {items.length === 0 && !listingsQuery.isLoading ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <Truck className="mx-auto size-10 text-[var(--color-leaf-700)]" />
          <p className="mt-3 font-semibold">Tidak ada pickup tersedia</p>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            Semua listing sudah diklaim, atau belum ada listing baru dari rumah tangga.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href={routes.collectorHandledCategories} className="text-sm font-semibold text-[var(--color-leaf-700)]">
              Atur kategori ditangani
            </Link>
            {activeClaims.length > 0 ? (
              <Link href={routes.pickupRoutes} className="text-sm font-semibold text-[var(--color-leaf-700)]">
                Lanjut ke peta rute
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-[var(--color-leaf-700)]">{item.category.name}</p>
              <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 flex items-center gap-1 text-sm text-[var(--color-ink-600)]">
                <MapPin className="size-3.5" />
                {item.district}, {item.city}
              </p>
              <p className="text-sm">
                {formatWeight(item.estimated_weight_kg)} · {item.household_display_name}
              </p>
              <button
                type="button"
                disabled={claimingId === item.id}
                onClick={() => void claim(item.id, item)}
                className="mt-4 rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {claimingId === item.id ? "Mengklaim..." : "Klaim Pickup"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function CollectorPickupsConnected() {
  return (
    <RequireAuth roles={["collector"]}>
      <CollectorPickupsContent />
    </RequireAuth>
  );
}
