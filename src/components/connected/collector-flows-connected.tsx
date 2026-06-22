"use client";

import Link from "next/link";
import { MapPin, Route } from "lucide-react";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusToneForWaste } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import {
  commitRoute,
  createMaterialBatch,
  getPickupMapData,
  listCollectorBatches,
  listPickupClaims,
  listWasteCategories,
  listWasteListings,
  markSortingComplete,
  previewRoute,
  publishMaterialBatch,
} from "@/lib/api";
import { materialBatchStatusLabels, wasteListingStatusLabels } from "@/lib/labels";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function parsePreview(preview: Record<string, unknown>) {
  const distance = Number(preview.total_distance_km ?? preview.totalDistanceKm ?? 0);
  const duration = Number(preview.estimated_duration_minutes ?? preview.estimatedDurationMinutes ?? 0);
  const cost = Number(preview.estimated_cost_idr ?? preview.estimated_cost ?? preview.estimatedCost ?? 0);
  const stops = (preview.stops ?? preview.ordered_stops ?? []) as Array<Record<string, unknown>>;
  return { distance, duration, cost, stops };
}

function CollectorSortingContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const batchesQuery = useAsyncData(
    () => listCollectorBatches(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const completeSorting = async (id: string) => {
    if (!accessToken) return;
    try {
      await markSortingComplete(accessToken, id);
      pushToast("Pemilahan ditandai selesai.", "success");
      await batchesQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal memperbarui batch.", "error");
    }
  };

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Pengepul"
        title="Pemilahan Sampah"
        description="Kelola batch bahan baku hasil pemilahan sebelum dipublikasikan ke marketplace."
        actions={
          <Link href={routes.collectorMaterialsNew} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">
            Buat Batch Baru
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {(batchesQuery.data ?? []).map((batch) => (
          <article key={batch.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="font-semibold">{batch.name}</p>
            <p className="text-sm text-[var(--color-ink-600)]">{formatWeight(batch.total_weight_kg)} · {formatCurrency(batch.price_per_kg)}/kg</p>
            <StatusBadge label={materialBatchStatusLabels[batch.status] ?? batch.status} tone="info" className="mt-2" />
            <div className="mt-3 flex gap-2">
              {batch.status === "draft" ? (
                <button type="button" onClick={() => void completeSorting(batch.id)} className="rounded-full border px-4 py-2 text-sm font-semibold">
                  Tandai selesai dipilah
                </button>
              ) : null}
              <Link href={routes.traceability(batch.id)} className="text-sm font-semibold text-[var(--color-leaf-700)]">Jejak Material</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function CollectorMaterialBatchContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesQuery = useAsyncData(() => listWasteCategories(), []);
  const claimsQuery = useAsyncData(
    () => listPickupClaims(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const toggleClaim = (listingId: string) => {
    setSelectedClaims((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId],
    );
  };

  const submit = async () => {
    if (!accessToken || !categoryId || !name || !price) {
      pushToast("Lengkapi nama, kategori, dan harga batch.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const batch = await createMaterialBatch(accessToken, {
        category_id: categoryId,
        name,
        price_per_kg: Number(price),
        sourceListingIds: selectedClaims.length ? selectedClaims : undefined,
        city: "Surabaya",
        province: "Jawa Timur",
      });
      await publishMaterialBatch(accessToken, batch.id);
      pushToast(`Batch "${batch.name}" dipublikasikan ke marketplace.`, "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal membuat batch.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Pengepul"
        title="Buat Bahan Baku Baru"
        description="Pilah sampah hasil pickup menjadi batch material dan publikasikan untuk industri."
      />
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama batch (contoh: Plastik PET bersih)" className="w-full rounded-xl border px-4 py-3" />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border px-4 py-3">
            <option value="">Pilih kategori</option>
            {(categoriesQuery.data ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Harga per kg (IDR)" type="number" className="w-full rounded-xl border px-4 py-3" />
          <button type="button" disabled={isSubmitting} onClick={() => void submit()} className="w-full rounded-full bg-[var(--color-leaf-600)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {isSubmitting ? "Menyimpan..." : "Simpan dan publikasikan"}
          </button>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Sumber dari pickup</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Hubungkan batch dengan listing yang sudah diambil.</p>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {(claimsQuery.data ?? []).map((claim) => (
              <li key={claim.id}>
                <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <input type="checkbox" checked={selectedClaims.includes(claim.listing_id)} onChange={() => toggleClaim(claim.listing_id)} />
                  Listing {claim.listing_id.slice(0, 8)} · {wasteListingStatusLabels[claim.status as keyof typeof wasteListingStatusLabels] ?? claim.status}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function PickupRoutesContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mapQuery = useAsyncData(
    () => getPickupMapData(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const toggleListing = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runPreview = async () => {
    if (!accessToken || selected.length === 0) {
      pushToast("Pilih minimal satu titik pickup.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const result = await previewRoute(accessToken, selected);
      setPreview(result);
      pushToast("Pratinjau rute siap.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal preview rute.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const commit = async () => {
    if (!accessToken || selected.length === 0) return;
    setIsLoading(true);
    try {
      const route = await commitRoute(accessToken, selected);
      setRouteId(route.id);
      pushToast("Rute pengambilan dibuat.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal membuat rute.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const parsed = preview ? parsePreview(preview) : null;

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Pengepul"
        title="Rute Pengambilan"
        description="Pilih titik pickup di peta, lihat pratinjau jarak dan biaya, lalu buat rute pengambilan."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <MapPin className="size-5 text-[var(--color-leaf-700)]" />
            Titik pickup ({selected.length} dipilih)
          </h2>
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {(mapQuery.data?.listings ?? []).map((listing) => (
              <li key={listing.id}>
                <label className="flex items-start gap-3 rounded-lg border p-3 text-sm hover:bg-[var(--color-sage-50)]">
                  <input type="checkbox" checked={selected.includes(listing.id)} onChange={() => toggleListing(listing.id)} className="mt-1" />
                  <span>
                    <span className="font-semibold">{listing.title}</span>
                    <br />
                    <span className="text-[var(--color-ink-500)]">
                      {listing.district ?? listing.city ?? "Lokasi"} · {formatWeight(listing.estimated_weight_kg)}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={isLoading} onClick={() => void runPreview()} className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60">
              Pratinjau rute
            </button>
            <button type="button" disabled={isLoading} onClick={() => void commit()} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              Buat rute
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <Route className="size-5 text-[var(--color-leaf-700)]" />
            Pratinjau rute
          </h2>
          {parsed ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-[var(--color-sage-50)] p-3">
                  <p className="text-xs uppercase text-[var(--color-ink-500)]">Jarak</p>
                  <p className="font-bold">{parsed.distance.toLocaleString("id-ID")} km</p>
                </div>
                <div className="rounded-xl bg-[var(--color-sage-50)] p-3">
                  <p className="text-xs uppercase text-[var(--color-ink-500)]">Waktu</p>
                  <p className="font-bold">{parsed.duration} mnt</p>
                </div>
                <div className="rounded-xl bg-[var(--color-sage-50)] p-3">
                  <p className="text-xs uppercase text-[var(--color-ink-500)]">Biaya</p>
                  <p className="font-bold">{parsed.cost ? formatCurrency(parsed.cost) : "—"}</p>
                </div>
              </div>
              <ol className="space-y-2">
                {parsed.stops.map((stop, i) => (
                  <li key={i} className="rounded-lg bg-[var(--color-sage-50)] px-3 py-2 text-sm">
                    {String(stop.title ?? stop.address ?? `Titik ${i + 1}`)}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-ink-500)]">Pilih listing lalu klik pratinjau rute.</p>
          )}
          {routeId ? (
            <Link href={routes.pickupDetail(routeId)} className="mt-4 inline-flex rounded-full bg-[var(--color-forest-900)] px-4 py-2 text-sm font-semibold text-white">
              Lihat detail rute
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function HouseholdPickupContent({ mode }: { mode: "confirm" | "tracking" }) {
  const { accessToken } = useAuth();
  const listingsQuery = useAsyncData(
    () => listWasteListings(accessToken!, { limit: 50 }),
    [accessToken],
    Boolean(accessToken),
  );

  const activeStatuses = mode === "confirm"
    ? ["claimed", "pickup_planned"]
    : ["pickup_planned", "picked_up", "sorting", "sorted"];

  const items = (listingsQuery.data?.items ?? []).filter((item) =>
    activeStatuses.includes(item.status),
  );

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Rumah Tangga"
        title={mode === "confirm" ? "Konfirmasi Pickup" : "Status Pickup"}
        description={mode === "confirm"
          ? "Listing yang sudah diklaim pengepul menunggu konfirmasi jadwal."
          : "Pantau progres pengambilan sampah oleh pengepul."}
      />
      <div className="grid gap-4">
        {items.map((listing) => (
          <article key={listing.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="font-semibold">{listing.title}</p>
            <p className="text-sm text-[var(--color-ink-600)]">{listing.address}</p>
            <StatusBadge label={wasteListingStatusLabels[listing.status]} tone={statusToneForWaste(listing.status)} className="mt-2" />
            <p className="mt-2 text-sm">{formatWeight(listing.estimated_weight_kg)}</p>
            <Link href={routes.listingDetail(listing.id)} className="mt-3 inline-block text-sm font-semibold text-[var(--color-leaf-700)]">
              Detail listing
            </Link>
          </article>
        ))}
        {!listingsQuery.isLoading && items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-[var(--color-ink-500)]">
            Tidak ada listing pada status ini saat ini.
          </div>
        ) : null}
      </div>
    </main>
  );
}

export function CollectorSortingConnected() {
  return (
    <RequireAuth roles={["collector"]}>
      <CollectorSortingContent />
    </RequireAuth>
  );
}

export function CollectorMaterialBatchConnected() {
  return (
    <RequireAuth roles={["collector"]}>
      <CollectorMaterialBatchContent />
    </RequireAuth>
  );
}

export function PickupRoutesConnected() {
  return (
    <RequireAuth roles={["collector"]}>
      <PickupRoutesContent />
    </RequireAuth>
  );
}

export function HouseholdPickupConfirmConnected() {
  return (
    <RequireAuth roles={["household"]}>
      <HouseholdPickupContent mode="confirm" />
    </RequireAuth>
  );
}

export function HouseholdPickupTrackingConnected() {
  return (
    <RequireAuth roles={["household"]}>
      <HouseholdPickupContent mode="tracking" />
    </RequireAuth>
  );
}
