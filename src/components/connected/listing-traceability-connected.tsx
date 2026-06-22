"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusToneForWaste } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import {
  cancelWasteListing,
  getMaterialTraceability,
  getWasteListing,
  getWasteTraceability,
  publishWasteListing,
} from "@/lib/api";
import { wasteListingStatusLabels } from "@/lib/labels";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function TraceabilityTimeline({ events, title }: { events: Array<{ id: string; title: string; detail: string | null; occurred_at: string }>; title: string }) {
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-[var(--color-forest-900)]">{title}</h2>
      <ol className="relative mt-6 space-y-0 border-l-2 border-[var(--color-mint-200)] pl-6">
        {events.map((event) => (
          <li key={event.id} className="relative pb-6 last:pb-0">
            <span className="absolute -left-[1.65rem] top-1 size-3 rounded-full bg-[var(--color-leaf-600)] ring-4 ring-white" />
            <p className="font-semibold text-[var(--color-forest-900)]">{event.title}</p>
            {event.detail ? <p className="mt-1 text-sm text-[var(--color-ink-600)]">{event.detail}</p> : null}
            <p className="mt-1 text-xs text-[var(--color-ink-500)]">
              {new Date(event.occurred_at).toLocaleString("id-ID")}
            </p>
          </li>
        ))}
        {events.length === 0 ? (
          <li className="text-sm text-[var(--color-ink-500)]">Belum ada jejak material.</li>
        ) : null}
      </ol>
    </section>
  );
}

function ListingDetailContent() {
  const params = useParams<{ id: string }>();
  const { accessToken, profile } = useAuth();
  const { pushToast } = useToast();
  const listingId = params.id;

  const listingQuery = useAsyncData(
    () => getWasteListing(accessToken!, listingId),
    [accessToken, listingId],
    Boolean(accessToken && listingId),
  );

  const traceQuery = useAsyncData(
    () => getWasteTraceability(accessToken!, listingId),
    [accessToken, listingId],
    Boolean(accessToken && listingId),
  );

  const publish = async () => {
    if (!accessToken) return;
    try {
      await publishWasteListing(accessToken, listingId);
      pushToast("Listing dipublikasikan.", "success");
      await listingQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal publish.", "error");
    }
  };

  const cancel = async () => {
    if (!accessToken) return;
    try {
      await cancelWasteListing(accessToken, listingId, "Dibatalkan pengguna");
      pushToast("Listing dibatalkan.", "success");
      await listingQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal membatalkan.", "error");
    }
  };

  const listing = listingQuery.data;
  if (listingQuery.isLoading) return <p className="page-shell py-8 text-sm">Memuat detail...</p>;
  if (!listing) return <p className="page-shell py-8 text-sm">Listing tidak ditemukan.</p>;

  return (
    <div className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow={listing.category.name}
        title={listing.title}
        backHref={routes.myMaterials}
        backLabel="Listing Saya"
      />

      <header className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
        <StatusBadge label={wasteListingStatusLabels[listing.status]} tone={statusToneForWaste(listing.status)} />
        <p className="mt-3 text-sm text-[var(--color-ink-600)]">{formatWeight(listing.estimated_weight_kg)}</p>
        <p className="text-sm">{listing.address}</p>
        <p className="text-sm text-[var(--color-ink-500)]">{listing.district}, {listing.city}</p>
        {profile?.role === "household" && listing.status === "draft" ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={routes.listingEdit(listing.id)} className="rounded-full border px-4 py-2 text-sm font-semibold">Edit</Link>
            <button type="button" onClick={() => void publish()} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">Publikasikan</button>
            <button type="button" onClick={() => void cancel()} className="rounded-full border px-4 py-2 text-sm font-semibold text-[var(--color-red-700)]">Batalkan</button>
          </div>
        ) : null}
      </header>

      <TraceabilityTimeline events={traceQuery.data ?? []} title="Jejak Material" />
    </div>
  );
}

function TraceabilityContent() {
  const params = useParams<{ materialId: string }>();
  const { accessToken } = useAuth();
  const batchId = params.materialId;

  const traceQuery = useAsyncData(
    () => getMaterialTraceability(accessToken!, batchId),
    [accessToken, batchId],
    Boolean(accessToken && batchId),
  );

  return (
    <div className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Jejak Material"
        title="Timeline rantai pasok"
        description="Alur lengkap dari upload sampah, pickup, pemilahan, pesanan, negosiasi, hingga transaksi."
      />
      <TraceabilityTimeline events={traceQuery.data ?? []} title="Perjalanan bahan baku" />
    </div>
  );
}

export function ListingDetailConnected() {
  return (
    <RequireAuth roles={["household", "collector"]}>
      <ListingDetailContent />
    </RequireAuth>
  );
}

export function TraceabilityConnected() {
  return (
    <RequireAuth>
      <TraceabilityContent />
    </RequireAuth>
  );
}
