"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { createOrder, getMaterial, listMaterials, startOrderNegotiation } from "@/lib/api";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchIdParam = searchParams.get("batchId") ?? "";
  const { accessToken } = useAuth();

  const [batchId, setBatchId] = useState(batchIdParam);
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const materialsQuery = useAsyncData(
    () => listMaterials(accessToken!, { limit: 30 }),
    [accessToken],
    Boolean(accessToken),
  );

  const materialQuery = useAsyncData(
    () => getMaterial(accessToken!, batchId),
    [accessToken, batchId],
    Boolean(accessToken && batchId),
  );

  const submit = async () => {
    if (!accessToken || !batchId) {
      setError("Pilih material batch terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const order = await createOrder(accessToken, {
        batchId,
        requested_weight_kg: Number(weight),
        offered_price_per_kg: Number(price),
        notes: notes || undefined,
      });
      try {
        const thread = await startOrderNegotiation(accessToken, order.id);
        router.push(routes.negotiationDetail(thread.id));
      } catch {
        router.push(routes.orders);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell grow space-y-6 py-8">
      <header>
        <p className="text-xs font-bold uppercase text-[var(--color-leaf-700)]">Industri Pengolah</p>
        <h1 className="text-3xl font-semibold">Buat Pesanan Baru</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-600)]">
          Kirim permintaan pembelian bahan baku ke pengepul. Harga dapat dinegosiasikan setelah pesanan dibuat.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <label className="block text-sm font-semibold">
            Material batch
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="mt-2 w-full rounded-xl border px-4 py-2"
            >
              <option value="">Pilih batch</option>
              {(materialsQuery.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {formatWeight(item.total_weight_kg)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Berat diminta (kg)
            <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" min="0" className="mt-2 w-full rounded-xl border px-4 py-2" />
          </label>
          <label className="block text-sm font-semibold">
            Harga penawaran per kg (IDR)
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" className="mt-2 w-full rounded-xl border px-4 py-2" />
          </label>
          <label className="block text-sm font-semibold">
            Catatan
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-2" rows={3} />
          </label>
          {error ? <p className="text-sm text-[var(--color-red-700)]">{error}</p> : null}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit()}
            className="rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Mengirim..." : "Kirim order"}
          </button>
        </div>

        <aside className="rounded-2xl border bg-white p-6">
          <h2 className="font-semibold">Preview material</h2>
          {materialQuery.data ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt>Nama</dt><dd>{materialQuery.data.name}</dd></div>
              <div className="flex justify-between gap-4"><dt>Kategori</dt><dd>{materialQuery.data.category.name}</dd></div>
              <div className="flex justify-between gap-4"><dt>Stok</dt><dd>{formatWeight(materialQuery.data.total_weight_kg)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Harga listing</dt><dd>{formatCurrency(materialQuery.data.price_per_kg)}/kg</dd></div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-ink-500)]">Pilih batch untuk melihat detail.</p>
          )}
          <Link href={routes.marketplaceMaterials} className="mt-6 inline-block text-sm font-semibold text-[var(--color-leaf-700)]">
            Kembali ke marketplace
          </Link>
        </aside>
      </section>
    </main>
  );
}

export function OrdersNewConnected() {
  return (
    <RequireAuth roles={["industry"]}>
      <NewOrderContent />
    </RequireAuth>
  );
}
