"use client";

import Link from "next/link";

import { RequireAuth } from "@/components/auth/require-auth";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getLocalImpact, getPlatformImpact } from "@/lib/api";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function ImpactContent() {
  const { accessToken } = useAuth();
  const impactQuery = useAsyncData(
    () => getPlatformImpact(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );
  const localQuery = useAsyncData(
    () => getLocalImpact(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const impact = impactQuery.data;

  return (
    <main className="page-shell grow space-y-8 py-8">
      <PageHeader
        eyebrow="Dashboard Dampak"
        title="Carbon Tracker PACUL"
        description="Pantau volume sampah terkumpul, bahan baku terjual, emisi dihemat, dan nilai ekonomi sirkular."
        actions={
          <Link href={routes.reports} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
            Export Laporan
          </Link>
        }
      />

      {impactQuery.isLoading ? <p className="text-sm">Memuat data dampak...</p> : null}
      {impactQuery.error ? <p className="text-sm text-[var(--color-red-700)]">{impactQuery.error}</p> : null}

      {impact ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Sampah terkumpul" value={formatWeight(impact.total_waste_collected_kg)} />
            <MetricCard label="Bahan baku terjual" value={formatWeight(impact.total_material_sold_kg)} />
            <MetricCard label="CO₂ diestimasi dihemat" value={formatWeight(impact.estimated_co2_saved_kg)} />
            <MetricCard label="Nilai ekonomi" value={formatCurrency(impact.estimated_economic_value_idr)} />
          </section>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total transaksi" value={impact.total_transactions} />
            <MetricCard label="Nilai transaksi" value={formatCurrency(impact.total_transaction_value_idr)} />
            <MetricCard label="Pickup selesai" value={impact.total_pickups_completed} />
            <MetricCard label="Jarak rute total" value={`${impact.total_route_distance_km.toLocaleString("id-ID")} km`} />
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Peta Dampak Lokal</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">Distribusi dampak per kota.</p>
        <ul className="mt-4 divide-y divide-[var(--color-line)]">
          {(localQuery.data?.locations ?? []).map((loc) => (
            <li key={`${loc.city}-${loc.province}`} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div>
                <span className="font-semibold">{loc.city}</span>
                <span className="text-[var(--color-ink-500)]">, {loc.province ?? "—"}</span>
                <p className="text-xs text-[var(--color-ink-500)]">{loc.pickup_count} pickup · {loc.listing_count} listing</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatWeight(loc.total_waste_collected_kg)}</p>
                <p className="text-xs text-[var(--color-ink-500)]">CO₂ {formatWeight(loc.estimated_co2_saved_kg)}</p>
              </div>
            </li>
          ))}
          {!localQuery.isLoading && (localQuery.data?.locations ?? []).length === 0 ? (
            <li className="py-6 text-center text-sm text-[var(--color-ink-500)]">Belum ada data dampak lokal.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}

export function ImpactConnected() {
  return (
    <RequireAuth>
      <ImpactContent />
    </RequireAuth>
  );
}
