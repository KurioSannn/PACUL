"use client";

import Link from "next/link";
import { MapPin, Truck } from "lucide-react";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { createPickupClaim, getCollectorAvailableWaste } from "@/lib/api";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function CollectorPickupsContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const listingsQuery = useAsyncData(
    () => getCollectorAvailableWaste(accessToken!, { limit: 30 }),
    [accessToken],
    Boolean(accessToken),
  );

  const claim = async (listingId: string) => {
    if (!accessToken) return;
    setClaimingId(listingId);
    try {
      await createPickupClaim(accessToken, listingId);
      pushToast("Pickup berhasil diklaim. Lanjut susun rute pengambilan.", "success");
      await listingsQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal mengklaim pickup.", "error");
    } finally {
      setClaimingId(null);
    }
  };

  const items = listingsQuery.data?.items ?? [];

  return (
    <div className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Pengepul"
        title="Pickup Tersedia"
        description="Listing difilter otomatis sesuai kategori sampah yang Anda tangani. Klaim pickup lalu susun rute."
        actions={
          <Link href={routes.pickupRoutes} className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold">
            Kelola Rute
          </Link>
        }
      />

      {listingsQuery.isLoading ? <p className="text-sm">Memuat listing...</p> : null}
      {listingsQuery.error ? (
        <p className="rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">{listingsQuery.error}</p>
      ) : null}

      {items.length === 0 && !listingsQuery.isLoading ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <Truck className="mx-auto size-10 text-[var(--color-leaf-700)]" />
          <p className="mt-3 font-semibold">Tidak ada pickup tersedia</p>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            Periksa kategori yang ditangani atau tunggu listing baru dari rumah tangga.
          </p>
          <Link href={routes.collectorHandledCategories} className="mt-4 inline-flex text-sm font-semibold text-[var(--color-leaf-700)]">
            Atur kategori ditangani
          </Link>
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
              <p className="text-sm">{formatWeight(item.estimated_weight_kg)} · {item.household_display_name}</p>
              <button
                type="button"
                disabled={claimingId === item.id}
                onClick={() => void claim(item.id)}
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
