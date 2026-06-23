"use client";

import Link from "next/link";
import { MapPin, Route, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PickupLeafletMap } from "@/components/map/pickup-leaflet-map";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusToneForWaste } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { buildDemoRoutePreview, mergePickupMapData } from "@/data/demo-pickup-map";
import { useDemoWorkflow } from "@/hooks/use-demo-workflow";
import { useAsyncData } from "@/hooks/use-async-data";
import { createDemoBatchFromClaims, cancelPickupClaim, deletePublishedBatch, DEMO_WASTE_CATEGORIES, syncApiClaimsToStore } from "@/lib/demo-workflow-actions";
import { isDemoMarketplaceId } from "@/data/demo-marketplace";
import { getActiveStoredClaims, markClaimsPickedUp, resolveLocalWasteListing, toStoredPickupClaims } from "@/lib/demo-workflow-store";
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
  const polyline = (preview.polyline ?? []) as Array<[number, number]>;
  return { distance, duration, cost, stops, polyline };
}

function CollectorSortingContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const { publishedBatches, refresh: refreshWorkflow } = useDemoWorkflow();
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const apiBatches = batchesQuery.data ?? [];
  const hasAny = apiBatches.length > 0 || publishedBatches.length > 0;

  const removeBatch = (batchId: string) => {
    setDeletingId(batchId);
    deletePublishedBatch(batchId);
    refreshWorkflow();
    pushToast("Batch dihapus dari etalase industri.", "success");
    setDeletingId(null);
  };

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Pengepul · Langkah 3"
        title="Pilah jadi Bahan Baku"
        description="Kelola batch bahan baku hasil pemilahan sebelum dipublikasikan ke marketplace industri."
        actions={
          <Link href={routes.collectorMaterialsNew} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">
            Langkah 4 · Jual ke Industri
          </Link>
        }
      />

      {publishedBatches.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-leaf-700)]">Batch demo dipublikasikan</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {publishedBatches.map((batch) => (
              <article key={batch.id} className="rounded-2xl border border-[var(--color-leaf-600)] bg-[var(--color-mint-50)] p-5 shadow-sm">
                <p className="font-semibold">{batch.name}</p>
                <p className="text-sm text-[var(--color-ink-600)]">
                  {formatWeight(batch.total_weight_kg)} · {formatCurrency(batch.price_per_kg)}/kg
                </p>
                <StatusBadge label="Tersedia di etalase industri" tone="success" className="mt-2" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={routes.marketplaceMaterials} className="text-sm font-semibold text-[var(--color-leaf-700)]">
                    Lihat di marketplace industri
                  </Link>
                  <button
                    type="button"
                    disabled={deletingId === batch.id}
                    onClick={() => removeBatch(batch.id)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-red-700)]"
                  >
                    <Trash2 className="size-3.5" />
                    {deletingId === batch.id ? "Menghapus..." : "Hapus batch"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {apiBatches.map((batch) => (
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

      {!batchesQuery.isLoading && !hasAny ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <p className="font-semibold">Belum ada batch bahan baku</p>
          <p className="mt-2 text-sm text-[var(--color-ink-500)]">
            Selesaikan rute pengambilan (langkah 2), lalu buat batch dari pickup yang sudah diambil.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href={routes.pickupRoutes} className="text-sm font-semibold text-[var(--color-leaf-700)]">
              Kembali ke peta rute
            </Link>
            <Link href={routes.collectorMaterialsNew} className="text-sm font-semibold text-[var(--color-leaf-700)]">
              Buat batch baru
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function CollectorMaterialBatchContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const { claimRecords, refresh: refreshWorkflow } = useDemoWorkflow();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesQuery = useAsyncData(() => listWasteCategories(), []);
  const categories = (categoriesQuery.data ?? []).length > 0 ? categoriesQuery.data! : DEMO_WASTE_CATEGORIES;

  const claimsQuery = useAsyncData(
    async () => {
      const apiClaims = accessToken ? await listPickupClaims(accessToken).catch(() => []) : [];
      const stored = toStoredPickupClaims().filter((c) => c.status === "claimed" || c.status === "picked_up");
      const merged = new Map<string, (typeof stored)[number]>();
      for (const c of [...apiClaims, ...stored]) {
        merged.set(c.listing_id, c);
      }
      return Array.from(merged.values());
    },
    [accessToken, claimRecords],
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
      const storedIds = new Set(getActiveStoredClaims().map((c) => c.listingId));
      const allFromLocalStore =
        selectedClaims.length > 0 && selectedClaims.every((id) => storedIds.has(id));

      if (allFromLocalStore) {
        const cat = categories.find((c) => c.id === categoryId);
        const batch = createDemoBatchFromClaims({
          name,
          categoryId,
          categoryName: cat?.name ?? "Material",
          categoryCode: cat?.code ?? "mixed",
          pricePerKg: Number(price),
          sourceListingIds: selectedClaims,
        });
        refreshWorkflow();
        pushToast(`Batch "${batch.name}" dipublikasikan ke etalase industri.`, "success");
        return;
      }

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

  const availableClaims = claimsQuery.data ?? [];

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Pengepul · Langkah 4"
        title="Jual ke Industri"
        description="Pilah sampah hasil pickup menjadi batch material dan publikasikan untuk industri."
        actions={
          <Link href={routes.marketplaceMaterials} className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold">
            Lihat etalase industri
          </Link>
        }
      />
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama batch (contoh: Plastik PET bersih)" className="w-full rounded-xl border px-4 py-3" />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border px-4 py-3">
            <option value="">Pilih kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Harga per kg (IDR)" type="number" className="w-full rounded-xl border px-4 py-3" />
          <button type="button" disabled={isSubmitting || availableClaims.length === 0} onClick={() => void submit()} className="w-full rounded-full bg-[var(--color-leaf-600)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {isSubmitting ? "Menyimpan..." : "Simpan dan publikasikan"}
          </button>
          {availableClaims.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-500)]">
              Belum ada pickup siap dipilah.{" "}
              <Link href={routes.pickupRoutes} className="font-semibold text-[var(--color-leaf-700)]">
                Selesaikan rute pengambilan dulu
              </Link>
              .
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Sumber dari pickup</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Hubungkan batch dengan listing yang sudah diambil.</p>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {availableClaims.map((claim) => {
              const stored = claimRecords.find((r) => r.listingId === claim.listing_id);
              const waste = resolveLocalWasteListing(claim.listing_id);
              const label = stored?.title ?? waste?.title ?? `Listing ${claim.listing_id.slice(0, 8)}`;
              return (
              <li key={claim.id}>
                <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <input type="checkbox" checked={selectedClaims.includes(claim.listing_id)} onChange={() => toggleClaim(claim.listing_id)} />
                  {label} · {wasteListingStatusLabels[claim.status as keyof typeof wasteListingStatusLabels] ?? claim.status}
                </label>
              </li>
            );})}
          </ul>
        </div>
      </section>
    </main>
  );
}

function PickupRoutesContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const { storedClaimListings, claimedListingIds, claimRecords, refresh: refreshWorkflow } = useDemoWorkflow();
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usedDemoPreview, setUsedDemoPreview] = useState(false);
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setIsSyncing(true);
    void syncApiClaimsToStore(accessToken).finally(() => {
      if (!cancelled) {
        refreshWorkflow();
        setIsSyncing(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshWorkflow]);

  const mapQuery = useAsyncData(
    () => getPickupMapData(accessToken!),
    [accessToken, claimRecords.length],
    Boolean(accessToken),
  );

  const mapData = useMemo(
    () => mergePickupMapData(mapQuery.data ?? null, storedClaimListings),
    [mapQuery.data, storedClaimListings],
  );

  useEffect(() => {
    if (!didAutoSelect && mapData.listings.length > 0) {
      setSelected(mapData.listings.map((l) => l.id));
      setDidAutoSelect(true);
    }
    if (mapData.listings.length === 0) {
      setDidAutoSelect(false);
      setSelected([]);
    }
  }, [mapData.listings, didAutoSelect]);

  const cancelClaim = async (listingId: string) => {
    if (!accessToken) return;
    setCancellingId(listingId);
    try {
      await cancelPickupClaim(accessToken, listingId);
      setSelected((prev) => prev.filter((id) => id !== listingId));
      setPreview(null);
      refreshWorkflow();
      pushToast("Pickup dihapus dari rute.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal menghapus pickup.", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const mapPoints = useMemo(
    () =>
      mapData.listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        latitude: listing.latitude,
        longitude: listing.longitude,
        subtitle: `${listing.district ?? listing.city ?? "Surabaya"} · ${formatWeight(listing.estimated_weight_kg)}`,
        selected: selected.includes(listing.id),
      })),
    [mapData.listings, selected],
  );

  const parsed = preview ? parsePreview(preview) : null;

  const orderedMapPoints = useMemo(() => {
    if (!parsed?.stops.length) return mapPoints;
    return parsed.stops.map((stop, index) => {
      const lat = Number(stop.latitude ?? 0);
      const lng = Number(stop.longitude ?? 0);
      const title = String(stop.title ?? `Titik ${index + 1}`);
      const matched = mapData.listings.find(
        (l) => l.title === title || (Math.abs(l.latitude - lat) < 0.0001 && Math.abs(l.longitude - lng) < 0.0001),
      );
      return {
        id: matched?.id ?? `stop-${index}`,
        title,
        latitude: lat || matched?.latitude || mapData.collector_base.latitude,
        longitude: lng || matched?.longitude || mapData.collector_base.longitude,
        subtitle: String(stop.address ?? ""),
        order: index + 1,
      };
    });
  }, [parsed?.stops, mapPoints, mapData]);

  const toggleListing = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setPreview(null);
    setUsedDemoPreview(false);
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
      setUsedDemoPreview(false);
      pushToast("Pratinjau rute siap.", "success");
    } catch {
      const demo = buildDemoRoutePreview(selected, mapData.listings);
      setPreview(demo as unknown as Record<string, unknown>);
      setUsedDemoPreview(true);
      markClaimsPickedUp(selected);
      refreshWorkflow();
      pushToast("Pratinjau rute siap. Pickup ditandai diambil — lanjut ke Pemilahan.", "success");
    } finally {
      setIsLoading(false);
    }
  };

  const commit = async () => {
    if (!accessToken || selected.length === 0) return;
    const allLocal = selected.every((id) => getActiveStoredClaims().some((c) => c.listingId === id));
    if (allLocal) {
      markClaimsPickedUp(selected);
      refreshWorkflow();
      pushToast("Rute tersimpan. Lanjut ke Pemilahan → Jual ke Industri.", "success");
      return;
    }
    if (mapData.isDemoFallback || selected.some((id) => isDemoMarketplaceId(id))) {
      pushToast("Campur listing demo & nyata tidak bisa disimpan ke backend. Pilih hanya listing demo atau hanya listing API.", "error");
      return;
    }
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

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Pengepul · Langkah 2"
        title="Peta & Rute Pengambilan Optimal"
        description="Pilih titik pickup di peta OpenStreetMap, optimasi urutan nearest-neighbor, lihat estimasi jarak & biaya."
        actions={
          claimedListingIds.length > 0 ? (
            <Link href={routes.collectorSorting} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">
              Langkah 3 · Pemilahan
            </Link>
          ) : (
            <Link href={routes.collectorPickups} className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold">
              Langkah 1 · Klaim Pickup
            </Link>
          )
        }
      />

      {isSyncing ? (
        <p className="text-sm text-[var(--color-ink-500)]">Menyinkronkan pickup yang diklaim...</p>
      ) : null}

      {mapData.listings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-leaf-600)] bg-[var(--color-mint-50)] px-4 py-3 text-sm text-[var(--color-ink-600)]">
          Belum ada pickup diklaim.{" "}
          <Link href={routes.collectorPickups} className="font-semibold text-[var(--color-leaf-700)]">
            Klaim sampah RT di Langkah 1
          </Link>
          , lalu kembali ke halaman ini.
        </p>
      ) : mapData.isDemoFallback ? (
        <p className="rounded-xl border border-dashed border-[var(--color-leaf-600)] bg-[var(--color-mint-50)] px-4 py-3 text-sm text-[var(--color-ink-600)]">
          Menampilkan {mapData.listings.length} pickup yang sudah Anda klaim. Centang titik, optimasi rute, lalu lanjut pemilahan.
        </p>
      ) : null}

      <PickupLeafletMap
        base={mapData.collector_base}
        points={parsed ? orderedMapPoints : mapPoints}
        routePolyline={parsed?.polyline}
        height={400}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <MapPin className="size-5 text-[var(--color-leaf-700)]" />
            Titik pickup ({selected.length} dipilih)
          </h2>
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {mapData.listings.map((listing) => (
              <li key={listing.id}>
                <div className="flex items-start gap-2 rounded-lg border p-3 text-sm hover:bg-[var(--color-sage-50)]">
                  <label className="flex flex-1 items-start gap-3">
                    <input type="checkbox" checked={selected.includes(listing.id)} onChange={() => toggleListing(listing.id)} className="mt-1" />
                    <span>
                      <span className="font-semibold">{listing.title}</span>
                      <br />
                      <span className="text-[var(--color-ink-500)]">
                        {listing.district ?? listing.city ?? "Lokasi"} · {formatWeight(listing.estimated_weight_kg)}
                        {listing.distance_km != null ? ` · ${listing.distance_km.toFixed(1)} km` : ""}
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    disabled={cancellingId === listing.id}
                    onClick={() => void cancelClaim(listing.id)}
                    className="shrink-0 rounded-full border border-[var(--color-red-200)] p-2 text-[var(--color-red-700)] disabled:opacity-60"
                    aria-label={`Hapus klaim ${listing.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={isLoading} onClick={() => void runPreview()} className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60">
              {isLoading ? "Menghitung..." : "Optimasi & pratinjau rute"}
            </button>
            <button type="button" disabled={isLoading || usedDemoPreview} onClick={() => void commit()} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              Simpan rute
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <Route className="size-5 text-[var(--color-leaf-700)]" />
            Pratinjau rute tercepat
          </h2>
          {parsed ? (
            <div className="mt-4 space-y-4">
              {usedDemoPreview ? (
                <p className="rounded-lg bg-[var(--color-amber-100)] px-3 py-2 text-xs text-[var(--color-earth-700)]">
                  Estimasi nearest-neighbor + haversine. Pickup ditandai diambil — lanjut buat batch bahan baku.
                </p>
              ) : null}
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
                    <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-[var(--color-leaf-600)] text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    {String(stop.title ?? stop.address ?? `Titik ${i + 1}`)}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-ink-500)]">
              {mapData.listings.length === 0
                ? "Klaim pickup terlebih dahulu di Langkah 1."
                : "Titik sudah dipilih otomatis. Klik optimasi rute untuk melihat urutan tercepat."}
            </p>
          )}
          {usedDemoPreview ? (
            <Link href={routes.collectorMaterialsNew} className="mt-4 inline-flex rounded-full bg-[var(--color-forest-900)] px-4 py-2 text-sm font-semibold text-white">
              Langkah 4 · Buat batch bahan baku
            </Link>
          ) : null}
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
