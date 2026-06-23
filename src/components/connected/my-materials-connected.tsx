"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Package, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusToneForWaste } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { useDemoWorkflow } from "@/hooks/use-demo-workflow";
import { deleteUserWasteListing } from "@/lib/demo-workflow-actions";
import { listWasteListings } from "@/lib/api";
import type { WasteListingWithDetails } from "@/lib/api/types";
import { wasteListingStatusLabels } from "@/lib/labels";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function MyMaterialsContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const { userListings, refresh: refreshWorkflow } = useDemoWorkflow();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const listingsQuery = useAsyncData(
    () => listWasteListings(accessToken!, status === "all" ? undefined : { status }),
    [accessToken, status],
    Boolean(accessToken),
  );

  const mergedListings = useMemo(() => {
    const apiItems = listingsQuery.data?.items ?? [];
    const apiIds = new Set(apiItems.map((item) => item.id));
    const localAsDetails: WasteListingWithDetails[] = userListings
      .filter((item) => !apiIds.has(item.id))
      .map((item) => ({
        id: item.id,
        household_id: "local-household",
        category_id: item.category.id,
        classification_id: null,
        title: item.title,
        description: item.description,
        estimated_weight_kg: item.estimated_weight_kg,
        actual_weight_kg: null,
        status: "available" as const,
        address: `${item.district ?? ""}, ${item.city ?? "Surabaya"}`,
        latitude: item.latitude,
        longitude: item.longitude,
        district: item.district,
        city: item.city,
        province: item.province,
        available_from: item.available_from,
        available_until: item.available_until,
        notes: item.description,
        pickup_fee: item.pickup_fee,
        claimed_by: null,
        claimed_at: null,
        picked_up_at: null,
        sorted_at: null,
        cancelled_at: null,
        cancel_reason: null,
        created_at: item.created_at,
        updated_at: item.created_at,
        category: item.category,
        images: item.images ?? [],
      }));
    return [...apiItems, ...localAsDetails];
  }, [listingsQuery.data, userListings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mergedListings;
    return mergedListings.filter((item) =>
      `${item.title} ${item.district} ${item.category.name}`.toLowerCase().includes(q),
    );
  }, [mergedListings, query]);

  const removeListing = async (listingId: string) => {
    setDeletingId(listingId);
    try {
      await deleteUserWasteListing(accessToken, listingId);
      refreshWorkflow();
      await listingsQuery.reload();
      pushToast("Listing dihapus.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal menghapus listing.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Rumah Tangga"
        title="Listing Saya"
        description="Kelola sampah terpilah yang Anda jual. Listing baru otomatis tampil di marketplace pengepul."
        actions={
          <Link href={routes.listingsNew} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-leaf-600)] px-5 text-sm font-semibold text-white">
            Buat Listing Baru
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari listing..." className="min-h-11 w-full rounded-xl border border-[var(--color-line)] py-2 pl-11 pr-4" />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-11 rounded-xl border border-[var(--color-line)] px-4">
          <option value="all">Semua status</option>
          {Object.entries(wasteListingStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {listingsQuery.error ? (
        <p className="rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">{listingsQuery.error}</p>
      ) : null}

      {listingsQuery.isLoading ? (
        <p className="text-sm text-[var(--color-ink-500)]">Memuat listing...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-10 text-center">
          <Package className="mx-auto size-10 text-[var(--color-leaf-700)]" />
          <p className="mt-3 font-semibold">Belum ada listing</p>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Mulai dengan upload foto dan klasifikasi AI.</p>
          <Link href={routes.listingsNew} className="mt-4 inline-flex rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white">
            Buat listing pertama
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((listing) => (
            <article key={listing.id} className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--color-leaf-700)]">{listing.category.name}</p>
                  <h2 className="text-lg font-semibold text-[var(--color-forest-900)]">{listing.title}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-[var(--color-ink-600)]">
                    <MapPin className="size-3.5" />
                    {formatWeight(listing.estimated_weight_kg)} · {listing.district}, {listing.city}
                  </p>
                  <StatusBadge
                    label={wasteListingStatusLabels[listing.status]}
                    tone={statusToneForWaste(listing.status)}
                    className="mt-2"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  {listing.status === "draft" ? (
                    <Link href={routes.listingEdit(listing.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-ink-600)]">
                      <Pencil className="size-4" /> Edit
                    </Link>
                  ) : null}
                  <Link href={routes.listingDetail(listing.id)} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-leaf-700)]">
                    Detail <ArrowRight className="size-4" />
                  </Link>
                  {["draft", "available"].includes(listing.status) ? (
                    <button
                      type="button"
                      disabled={deletingId === listing.id}
                      onClick={() => void removeListing(listing.id)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-red-700)] disabled:opacity-60"
                    >
                      <Trash2 className="size-4" />
                      {deletingId === listing.id ? "Menghapus..." : "Hapus"}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function MyMaterialsConnected() {
  return (
    <RequireAuth roles={["household"]}>
      <MyMaterialsContent />
    </RequireAuth>
  );
}
