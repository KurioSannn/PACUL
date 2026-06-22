"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, Route } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getRoute, updateRouteStatus } from "@/lib/api";
import { routeStatusLabels } from "@/lib/labels";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

type RouteStop = {
  sequence?: number;
  title?: string;
  address?: string;
  listing_id?: string;
  estimated_weight_kg?: number;
};

function PickupRouteDetailContent() {
  const params = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const routeId = params.id;

  const routeQuery = useAsyncData(
    () => getRoute(accessToken!, routeId),
    [accessToken, routeId],
    Boolean(accessToken && routeId),
  );

  const advanceStatus = async (status: string) => {
    if (!accessToken) return;
    try {
      await updateRouteStatus(accessToken, routeId, status);
      pushToast("Status rute diperbarui.", "success");
      await routeQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal memperbarui status.", "error");
    }
  };

  const route = routeQuery.data;
  if (routeQuery.isLoading) return <p className="page-shell py-8 text-sm">Memuat rute...</p>;
  if (!route) return <p className="page-shell py-8 text-sm">Rute tidak ditemukan.</p>;

  const stops = (route as { stops?: RouteStop[] }).stops ?? [];

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Rute Pengambilan"
        title={route.title ?? `Rute ${route.id.slice(0, 8)}`}
        backHref={routes.pickupRoutes}
        backLabel="Daftar Rute"
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase text-[var(--color-ink-500)]">Status</p>
          <StatusBadge label={routeStatusLabels[route.status] ?? route.status} tone="info" className="mt-2" />
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase text-[var(--color-ink-500)]">Jarak total</p>
          <p className="mt-2 text-xl font-bold">{route.total_distance_km ?? "—"} km</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase text-[var(--color-ink-500)]">Estimasi biaya</p>
          <p className="mt-2 text-xl font-bold">{route.estimated_cost ? formatCurrency(route.estimated_cost) : "—"}</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void advanceStatus("ongoing")} className="rounded-full border px-4 py-2 text-sm font-semibold">Mulai rute</button>
        <button type="button" onClick={() => void advanceStatus("completed")} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">Tandai selesai</button>
        <Link href={routes.collectorSorting} className="rounded-full border px-4 py-2 text-sm font-semibold">Lanjut pemilahan</Link>
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold">
          <Route className="size-5 text-[var(--color-leaf-700)]" />
          Urutan titik pickup ({stops.length})
        </h2>
        <ol className="mt-4 space-y-3">
          {stops.map((stop, index) => (
            <li key={stop.listing_id ?? index} className="flex gap-4 rounded-xl bg-[var(--color-sage-50)] p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-leaf-600)] text-sm font-bold text-white">
                {stop.sequence ?? index + 1}
              </span>
              <div>
                <p className="font-semibold">{stop.title ?? `Titik ${index + 1}`}</p>
                {stop.address ? (
                  <p className="mt-1 flex items-center gap-1 text-sm text-[var(--color-ink-600)]">
                    <MapPin className="size-3.5" /> {stop.address}
                  </p>
                ) : null}
                {stop.estimated_weight_kg ? (
                  <p className="text-sm text-[var(--color-ink-500)]">{formatWeight(stop.estimated_weight_kg)}</p>
                ) : null}
              </div>
            </li>
          ))}
          {stops.length === 0 ? (
            <li className="text-sm text-[var(--color-ink-500)]">Detail titik pickup belum tersedia.</li>
          ) : null}
        </ol>
      </section>
    </main>
  );
}

export function PickupRouteDetailConnected() {
  return (
    <RequireAuth roles={["collector"]}>
      <PickupRouteDetailContent />
    </RequireAuth>
  );
}
