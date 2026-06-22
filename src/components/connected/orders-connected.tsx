"use client";

import Link from "next/link";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { listCollectorBatches, listOrders } from "@/lib/api";
import { orderStatusLabels } from "@/lib/labels";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function OrdersContent() {
  const { accessToken, profile } = useAuth();
  const ordersQuery = useAsyncData(
    () => listOrders(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );
  const batchesQuery = useAsyncData(
    () => listCollectorBatches(accessToken!),
    [accessToken],
    Boolean(accessToken) && profile?.role === "collector",
  );

  return (
    <div className="page-shell grow space-y-8 py-8">
      <h1 className="text-2xl font-semibold">Orders & Material</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pesanan (`GET /orders`)</h2>
        {ordersQuery.isLoading ? <p>Memuat orders...</p> : null}
        <div className="grid gap-4">
          {(ordersQuery.data ?? []).map((order) => (
            <article key={order.id} className="rounded-2xl border bg-white p-5">
              <p className="text-xs uppercase text-[var(--color-leaf-700)]">{orderStatusLabels[order.status] ?? order.status}</p>
              <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
              <p className="text-sm">{formatWeight(order.requested_weight_kg)} · {formatCurrency(order.offered_price_per_kg)}/kg</p>
              {order.batch ? (
                <p className="text-xs text-[var(--color-ink-500)]">{order.batch.name} · {order.batch.city ?? "—"}</p>
              ) : null}
              <Link href={`${routes.negotiations}?orderId=${order.id}`} className="mt-3 inline-block text-sm font-semibold text-[var(--color-leaf-700)]">
                Buka negosiasi →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {profile?.role === "collector" ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Material batch saya</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {(batchesQuery.data ?? []).map((batch) => (
              <article key={batch.id} className="rounded-2xl border bg-white p-5">
                <h3 className="font-semibold">{batch.name}</h3>
                <p className="text-sm">{formatWeight(batch.total_weight_kg)} · {batch.status}</p>
                <Link href={routes.traceability(batch.id)} className="mt-2 inline-block text-sm font-semibold text-[var(--color-leaf-700)]">
                  Traceability
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function OrdersConnected() {
  return (
    <RequireAuth roles={["industry", "collector"]}>
      <OrdersContent />
    </RequireAuth>
  );
}
