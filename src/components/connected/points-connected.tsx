"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getMyPoints } from "@/lib/api";

function PointsContent() {
  const { accessToken } = useAuth();
  const pointsQuery = useAsyncData(
    () => getMyPoints(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const data = pointsQuery.data;

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="EcoPoints"
        title="Poin dampak lingkungan"
        description="Poin diperoleh dari aktivitas daur ulang: listing, pickup, transaksi, dan ulasan positif."
      />

      {pointsQuery.isLoading ? <p className="text-sm text-[var(--color-ink-500)]">Memuat EcoPoints...</p> : null}
      {pointsQuery.error ? (
        <p className="rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">
          {pointsQuery.error}
        </p>
      ) : null}

      {data ? (
        <>
          <section className="rounded-2xl border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-mint-100)] to-white p-8">
            <p className="text-sm font-semibold text-[var(--color-leaf-700)]">Total EcoPoints</p>
            <p className="mt-2 text-5xl font-bold text-[var(--color-forest-900)]">{data.total_points}</p>
            <p className="mt-2 text-sm text-[var(--color-ink-600)]">{data.entry_count} aktivitas tercatat</p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.by_event_type).map(([type, count]) => (
              <div key={type} className="rounded-2xl border bg-white p-5">
                <p className="text-xs uppercase text-[var(--color-ink-500)]">{type.replace(/_/g, " ")}</p>
                <p className="mt-2 text-2xl font-bold">{count} poin</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="font-semibold">Riwayat aktivitas</h2>
            <ul className="mt-4 divide-y">
              {data.recent.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{entry.description ?? entry.event_type}</p>
                    <p className="text-[var(--color-ink-500)]">
                      {new Date(entry.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className="font-bold text-[var(--color-leaf-700)]">+{entry.points}</span>
                </li>
              ))}
              {data.recent.length === 0 ? (
                <li className="py-6 text-center text-sm text-[var(--color-ink-500)]">
                  Belum ada riwayat poin. Mulai dengan membuat listing atau transaksi.
                </li>
              ) : null}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}

export function PointsConnected() {
  return (
    <RequireAuth>
      <PointsContent />
    </RequireAuth>
  );
}
