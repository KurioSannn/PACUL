"use client";

import Link from "next/link";
import { Package, Recycle, ShoppingCart, Truck } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { WorkflowGuide } from "@/components/layout/workflow-guide";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusToneForOrder, statusToneForWaste } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import {
  getDashboardSummary,
  getLocalImpact,
  getPlatformImpact,
} from "@/lib/api";
import type {
  CollectorSummary,
  DashboardSummary,
  HouseholdSummary,
  IndustrySummary,
} from "@/lib/api/types";
import { formatCurrency, formatWeight } from "@/lib/format";
import { orderStatusLabels, wasteListingStatusLabels } from "@/lib/labels";
import { routes } from "@/lib/routes";

function HouseholdDashboard({ summary }: { summary: HouseholdSummary }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Listing aktif" value={summary.counts.active_listings} icon={<Package className="size-5" />} />
        <MetricCard label="Menunggu pickup" value={summary.counts.waiting_pickup} icon={<Truck className="size-5" />} />
        <MetricCard label="Sudah diambil" value={summary.counts.picked_up} />
        <MetricCard label="Selesai" value={summary.counts.completed} />
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Estimasi berat" value={formatWeight(summary.weights.total_estimated_kg)} />
        <MetricCard label="Terkumpul" value={formatWeight(summary.weights.collected_kg)} />
        <MetricCard label="Biaya pickup" value={formatCurrency(summary.costs.total_pickup_fees_idr)} />
      </section>
      <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-forest-900)]">Listing terbaru</h2>
          <Link href={routes.myMaterials} className="text-sm font-semibold text-[var(--color-leaf-700)]">
            Lihat semua
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-[var(--color-line)]">
          {summary.recent_listings.map((listing) => (
            <li key={listing.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div>
                <Link href={routes.listingDetail(listing.id)} className="font-semibold hover:text-[var(--color-leaf-700)]">
                  {listing.title}
                </Link>
                <p className="text-[var(--color-ink-500)]">
                  {listing.city ?? "—"} · {formatWeight(listing.estimated_weight_kg)}
                </p>
                <StatusBadge
                  label={wasteListingStatusLabels[listing.status as keyof typeof wasteListingStatusLabels] ?? listing.status}
                  tone={statusToneForWaste(listing.status)}
                  className="mt-1"
                />
              </div>
            </li>
          ))}
          {summary.recent_listings.length === 0 ? (
            <li className="py-8 text-center text-sm text-[var(--color-ink-500)]">
              Belum ada listing.{" "}
              <Link href={routes.listingsNew} className="font-semibold text-[var(--color-leaf-700)]">
                Buat listing pertama
              </Link>
            </li>
          ) : null}
        </ul>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link href={routes.listingsNew} className="rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white">
          Jual Sampah
        </Link>
        <Link href={routes.pickupTracking} className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold">
          Status Pickup
        </Link>
        <Link href={routes.classificationDemo} className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold">
          Klasifikasi AI
        </Link>
      </div>
    </>
  );
}

function CollectorDashboard({ summary }: { summary: CollectorSummary }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Klaim aktif" value={summary.counts.active_claims} icon={<Truck className="size-5" />} />
        <MetricCard label="Rute direncanakan" value={summary.counts.planned_routes} />
        <MetricCard label="Batch tersedia" value={summary.counts.available_batches} icon={<Recycle className="size-5" />} />
        <MetricCard label="Pickup selesai" value={summary.counts.completed_pickups} />
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Kg terkumpul" value={formatWeight(summary.weights.total_kg_collected)} />
        <MetricCard label="Stok material" value={formatWeight(summary.weights.material_stock_kg)} />
        <MetricCard label="Jarak rute total" value={`${summary.distances.total_route_distance_km.toLocaleString("id-ID")} km`} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Rute terbaru</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {summary.recent_routes.map((route) => (
              <li key={route.id} className="flex justify-between gap-4 border-b border-[var(--color-line)] py-2">
                <Link href={routes.pickupDetail(route.id)} className="font-medium hover:text-[var(--color-leaf-700)]">
                  Rute {route.id.slice(0, 8)}
                </Link>
                <span className="text-[var(--color-ink-500)]">{formatWeight(route.total_weight_kg)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Batch bahan baku</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {summary.recent_material_batches.map((batch) => (
              <li key={batch.id} className="flex justify-between gap-4 border-b border-[var(--color-line)] py-2">
                <Link href={routes.traceability(batch.id)} className="font-medium hover:text-[var(--color-leaf-700)]">
                  {batch.name}
                </Link>
                <span className="text-[var(--color-ink-500)]">{formatWeight(batch.total_weight_kg)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link href={routes.collectorPickups} className="rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white">
          Lihat Ketersediaan
        </Link>
        <Link href={routes.pickupRoutes} className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold">
          Peta Pickup / Rute
        </Link>
        <Link href={routes.collectorSorting} className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold">
          Pemilahan
        </Link>
      </div>
    </>
  );
}

function IndustryDashboard({ summary }: { summary: IndustrySummary }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Pesanan aktif" value={summary.counts.active_orders} icon={<ShoppingCart className="size-5" />} />
        <MetricCard label="Negosiasi terbuka" value={summary.counts.open_negotiations} />
        <MetricCard label="Pesanan selesai" value={summary.counts.completed_orders} />
        <MetricCard label="Bahan baku tersedia" value={summary.counts.available_material_batches} icon={<Recycle className="size-5" />} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <MetricCard label="Kg dibeli" value={formatWeight(summary.weights.total_purchased_kg)} />
        <MetricCard label="Nilai transaksi" value={formatCurrency(summary.costs.total_transaction_value_idr)} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Pesanan terbaru</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {summary.recent_orders.map((order) => (
              <li key={order.id} className="flex justify-between gap-4 border-b border-[var(--color-line)] py-2">
                <div>
                  <Link href={routes.orders} className="font-medium hover:text-[var(--color-leaf-700)]">
                    {order.batch_name ?? `Pesanan ${order.id.slice(0, 8)}`}
                  </Link>
                  <StatusBadge
                    label={orderStatusLabels[order.status] ?? order.status}
                    tone={statusToneForOrder(order.status)}
                    className="mt-1"
                  />
                </div>
                <span>{formatWeight(order.requested_weight_kg)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Negosiasi aktif</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {summary.recent_negotiations.map((thread) => (
              <li key={thread.id} className="flex justify-between gap-4 border-b border-[var(--color-line)] py-2">
                <Link href={routes.negotiationDetail(thread.id)} className="font-medium hover:text-[var(--color-leaf-700)]">
                  Negosiasi {thread.id.slice(0, 8)}
                </Link>
                <span>
                  {thread.last_offer_price_per_kg
                    ? `${formatCurrency(thread.last_offer_price_per_kg)}/kg`
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link href={routes.marketplaceMaterials} className="rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white">
          Cari Bahan Baku
        </Link>
        <Link href={routes.ordersNew} className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold">
          Buat Pesanan
        </Link>
        <Link href={routes.negotiations} className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold">
          Negosiasi
        </Link>
      </div>
    </>
  );
}

function RoleDashboardBody({ summary }: { summary: DashboardSummary }) {
  if (summary.role === "household") return <HouseholdDashboard summary={summary} />;
  if (summary.role === "collector") return <CollectorDashboard summary={summary} />;
  return <IndustryDashboard summary={summary} />;
}

function DashboardRoleContent() {
  const { accessToken, profile } = useAuth();
  const summaryQuery = useAsyncData(
    () => getDashboardSummary(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );
  const impactQuery = useAsyncData(
    () => getPlatformImpact(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );
  const localImpactQuery = useAsyncData(
    () => getLocalImpact(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const roleLabel =
    profile?.role === "household"
      ? "Rumah Tangga"
      : profile?.role === "collector"
        ? "Pengepul"
        : "Industri Pengolah";

  return (
    <div className="page-shell grow space-y-8 py-8">
      <PageHeader
        eyebrow={`Dashboard ${roleLabel}`}
        title="Ringkasan operasional"
        description="Pantau listing, pickup, bahan baku, dan transaksi sesuai peran Anda dalam rantai pasok daur ulang PACUL."
      />

      {summaryQuery.isLoading ? <p className="text-sm text-[var(--color-ink-500)]">Memuat ringkasan...</p> : null}
      {summaryQuery.error ? (
        <p className="rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">
          {summaryQuery.error}
        </p>
      ) : null}
      {summaryQuery.data ? <RoleDashboardBody summary={summaryQuery.data} /> : null}

      {profile ? <WorkflowGuide role={profile.role} /> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Dashboard Dampak</h2>
            <Link href={routes.impact} className="text-sm font-semibold text-[var(--color-leaf-700)]">
              Detail
            </Link>
          </div>
          {impactQuery.data ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Sampah terkumpul</dt><dd className="font-semibold">{formatWeight(impactQuery.data.total_waste_collected_kg)}</dd></div>
              <div className="flex justify-between"><dt>Material terjual</dt><dd className="font-semibold">{formatWeight(impactQuery.data.total_material_sold_kg)}</dd></div>
              <div className="flex justify-between"><dt>CO₂ diestimasi dihemat</dt><dd className="font-semibold">{formatWeight(impactQuery.data.estimated_co2_saved_kg)}</dd></div>
              <div className="flex justify-between"><dt>Nilai ekonomi</dt><dd className="font-semibold">{formatCurrency(impactQuery.data.estimated_economic_value_idr)}</dd></div>
            </dl>
          ) : null}
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Peta Dampak Lokal</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(localImpactQuery.data?.locations ?? []).slice(0, 5).map((loc) => (
              <li key={`${loc.city}-${loc.province}`} className="flex justify-between gap-4 border-b border-[var(--color-line)] py-2">
                <span>{loc.city}, {loc.province ?? "—"}</span>
                <span className="font-semibold">{formatWeight(loc.total_waste_collected_kg)}</span>
              </li>
            ))}
            {!localImpactQuery.isLoading && (localImpactQuery.data?.locations ?? []).length === 0 ? (
              <li className="py-4 text-center text-[var(--color-ink-500)]">Belum ada data dampak lokal.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}

export function DashboardConnected() {
  return (
    <RequireAuth>
      <DashboardRoleContent />
    </RequireAuth>
  );
}
