"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getMaterial } from "@/lib/api";
import { formatCurrency, formatWeight } from "@/lib/format";
import { materialBatchStatusLabels } from "@/lib/labels";
import { routes } from "@/lib/routes";

function MaterialDetailContent() {
  const params = useParams<{ id: string }>();
  const { accessToken, profile } = useAuth();
  const materialQuery = useAsyncData(
    () => getMaterial(accessToken!, params.id),
    [accessToken, params.id],
    Boolean(accessToken && params.id),
  );

  const material = materialQuery.data;

  if (materialQuery.isLoading) {
    return <p className="page-shell py-8">Memuat detail material...</p>;
  }

  if (materialQuery.error || !material) {
    return (
      <p className="page-shell py-8 text-sm text-[var(--color-red-700)]">
        {materialQuery.error ?? "Material tidak ditemukan."}
      </p>
    );
  }

  return (
    <main className="page-shell grow space-y-6 py-8">
      <Link href={routes.marketplaceMaterials} className="text-sm font-semibold text-[var(--color-leaf-700)]">
        ← Kembali ke marketplace
      </Link>
      <header className="rounded-2xl border bg-white p-6">
        <p className="text-xs font-bold uppercase text-[var(--color-leaf-700)]">{material.category.name}</p>
        <h1 className="mt-2 text-3xl font-semibold">{material.name}</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-600)]">{material.description ?? "Tidak ada deskripsi."}</p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-[var(--color-ink-500)]">Stok</dt><dd className="font-semibold">{formatWeight(material.total_weight_kg)}</dd></div>
          <div><dt className="text-[var(--color-ink-500)]">Harga</dt><dd className="font-semibold">{formatCurrency(material.price_per_kg)}/kg</dd></div>
          <div><dt className="text-[var(--color-ink-500)]">Min. order</dt><dd className="font-semibold">{formatWeight(material.min_order_kg)}</dd></div>
          <div><dt className="text-[var(--color-ink-500)]">Lokasi</dt><dd className="font-semibold">{material.city ?? "—"}, {material.province ?? "—"}</dd></div>
          <div><dt className="text-[var(--color-ink-500)]">Pengepul</dt><dd className="font-semibold">{material.collector.display_name}</dd></div>
          <div><dt className="text-[var(--color-ink-500)]">Status</dt><dd className="font-semibold">{materialBatchStatusLabels[material.status] ?? material.status}</dd></div>
        </dl>
      </header>
      <div className="flex flex-wrap gap-3">
        <Link href={routes.traceability(material.id)} className="rounded-full border px-5 py-2.5 text-sm font-semibold">
          Lihat traceability
        </Link>
        {profile?.role === "industry" ? (
          <Link
            href={`${routes.ordersNew}?batchId=${material.id}`}
            className="rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Buat pesanan
          </Link>
        ) : null}
      </div>
    </main>
  );
}

export function MaterialDetailConnected() {
  return (
    <RequireAuth roles={["industry", "collector"]}>
      <MaterialDetailContent />
    </RequireAuth>
  );
}
