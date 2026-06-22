"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getWasteListing, listWasteCategories, updateWasteListing } from "@/lib/api";
import { routes } from "@/lib/routes";

function ListingEditContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = params.id;
  const { accessToken } = useAuth();

  const listingQuery = useAsyncData(
    () => getWasteListing(accessToken!, listingId),
    [accessToken, listingId],
    Boolean(accessToken && listingId),
  );
  const categoriesQuery = useAsyncData(() => listWasteCategories(), []);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [weight, setWeight] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const listing = listingQuery.data;
    if (!listing) return;
    setTitle(listing.title);
    setCategoryId(listing.category_id);
    setWeight(String(listing.estimated_weight_kg));
    setAddress(listing.address);
    setNotes(listing.notes ?? "");
  }, [listingQuery.data]);

  const submit = async () => {
    if (!accessToken) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateWasteListing(accessToken, listingId, {
        title,
        category_id: categoryId,
        estimated_weight_kg: Number(weight),
        address,
        notes: notes || null,
      });
      router.push(routes.listingDetail(listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (listingQuery.isLoading) return <p className="page-shell py-8">Memuat listing...</p>;
  if (!listingQuery.data) return <p className="page-shell py-8">Listing tidak ditemukan</p>;

  return (
    <main className="page-shell grow space-y-6 py-8">
      <Link href={routes.listingDetail(listingId)} className="text-sm font-semibold text-[var(--color-leaf-700)]">← Kembali</Link>
      <header>
        <h1 className="text-2xl font-semibold">Edit listing</h1>
        <p className="text-sm text-[var(--color-ink-600)]">Perbarui via `PATCH /waste-listings/:id`</p>
      </header>
      <section className="max-w-xl space-y-4 rounded-2xl border bg-white p-6">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul" className="w-full rounded-xl border px-4 py-2" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border px-4 py-2">
          {(categoriesQuery.data ?? []).map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" placeholder="Berat (kg)" className="w-full rounded-xl border px-4 py-2" />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat" className="w-full rounded-xl border px-4 py-2" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan" rows={3} className="w-full rounded-xl border px-4 py-2" />
        {error ? <p className="text-sm text-[var(--color-red-700)]">{error}</p> : null}
        <button type="button" disabled={isSubmitting} onClick={() => void submit()} className="rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
        </button>
      </section>
    </main>
  );
}

export function ListingEditConnected() {
  return (
    <RequireAuth roles={["household"]}>
      <ListingEditContent />
    </RequireAuth>
  );
}
