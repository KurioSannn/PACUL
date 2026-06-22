"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getRatingSummary, listTransactions, submitRating } from "@/lib/api";
import { routes } from "@/lib/routes";

function ReviewsListContent() {
  const { accessToken, profile } = useAuth();
  const txQuery = useAsyncData(
    () => listTransactions(accessToken!),
    [accessToken],
    Boolean(accessToken && (profile?.role === "industry" || profile?.role === "collector")),
  );

  const counterpartIds = Array.from(
    new Set(
      (txQuery.data ?? [])
        .filter((tx) => tx.status === "completed")
        .map((tx) => (profile?.role === "industry" ? tx.collector_id : tx.industry_id)),
    ),
  ).slice(0, 6);

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Rating"
        title="Ulasan dan reputasi mitra"
        description="Ringkasan penilaian dari transaksi yang telah selesai."
        actions={
          <Link href={routes.reviewsNew} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">
            Tulis ulasan
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {counterpartIds.map((actorId) => (
          <RatingSummaryCard key={actorId} actorId={actorId} accessToken={accessToken} />
        ))}
        {counterpartIds.length === 0 && !txQuery.isLoading ? (
          <p className="col-span-full text-sm text-[var(--color-ink-500)]">
            Belum ada transaksi selesai untuk ditampilkan. Selesaikan transaksi terlebih dahulu.
          </p>
        ) : null}
      </div>
    </main>
  );
}

function RatingSummaryCard({ actorId, accessToken }: { actorId: string; accessToken: string | null }) {
  const summaryQuery = useAsyncData(
    () => getRatingSummary(accessToken!, actorId),
    [accessToken, actorId],
    Boolean(accessToken),
  );

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-xs uppercase text-[var(--color-ink-500)]">Mitra</p>
      {summaryQuery.data ? (
        <>
          <p className="mt-2 text-3xl font-bold text-[var(--color-forest-900)]">
            {summaryQuery.data.average_rating.toFixed(1)} <span className="text-lg font-normal text-[var(--color-ink-500)]">/ 5</span>
          </p>
          <p className="text-sm text-[var(--color-ink-600)]">{summaryQuery.data.rating_count} ulasan</p>
        </>
      ) : (
        <p className="mt-2 text-sm">Memuat...</p>
      )}
    </article>
  );
}

function NewReviewContent() {
  const searchParams = useSearchParams();
  const { accessToken, profile } = useAuth();
  const { pushToast } = useToast();
  const [rateeId, setRateeId] = useState(searchParams.get("rateeId") ?? "");
  const [contextId, setContextId] = useState(searchParams.get("contextId") ?? "");
  const [contextType, setContextType] = useState<"pickup" | "transaction">(
    (searchParams.get("contextType") as "pickup" | "transaction") || "transaction",
  );
  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const txQuery = useAsyncData(
    () => listTransactions(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  useEffect(() => {
    const txId = searchParams.get("contextId");
    if (!txId || !txQuery.data) return;
    const tx = txQuery.data.find((item) => item.id === txId);
    if (tx) {
      setContextId(tx.id);
      setRateeId(profile?.role === "industry" ? tx.collector_id : tx.industry_id);
    }
  }, [searchParams, txQuery.data, profile?.role]);

  const submit = async () => {
    if (!accessToken || !rateeId || !contextId) {
      setError("Pilih transaksi atau lengkapi data ulasan.");
      return;
    }
    setError(null);
    try {
      await submitRating(accessToken, {
        rateeId,
        rating: Number(rating),
        reviewText: reviewText || undefined,
        contextType,
        contextId,
      });
      pushToast("Ulasan berhasil dikirim.", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulasan");
      pushToast("Gagal mengirim ulasan.", "error");
    }
  };

  return (
    <main className="page-shell grow max-w-xl space-y-6 py-8">
      <PageHeader
        eyebrow="Rating"
        title="Tulis ulasan"
        description="Beri penilaian setelah transaksi atau pickup selesai."
        backHref={routes.reviews}
      />

      <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold">
          Pilih transaksi selesai
          <select
            value={contextId}
            onChange={(e) => {
              const tx = (txQuery.data ?? []).find((item) => item.id === e.target.value);
              setContextId(e.target.value);
              if (tx) setRateeId(profile?.role === "industry" ? tx.collector_id : tx.industry_id);
            }}
            className="mt-2 w-full rounded-xl border px-4 py-2"
          >
            <option value="">Pilih transaksi</option>
            {(txQuery.data ?? []).filter((tx) => tx.status === "completed").map((tx) => (
              <option key={tx.id} value={tx.id}>
                Transaksi {tx.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Rating (1–5)
          <input value={rating} onChange={(e) => setRating(e.target.value)} type="number" min="1" max="5" className="mt-2 w-full rounded-xl border px-4 py-2" />
        </label>
        <label className="block text-sm font-semibold">
          Ulasan
          <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Ceritakan pengalaman kerja sama..." rows={4} className="mt-2 w-full rounded-xl border px-4 py-2" />
        </label>
        {error ? <p className="text-sm text-[var(--color-red-700)]">{error}</p> : null}
        <button type="button" onClick={() => void submit()} className="rounded-full bg-[var(--color-forest-900)] px-5 py-2.5 text-sm font-semibold text-white">
          Kirim ulasan
        </button>
      </section>
    </main>
  );
}

export function ReviewsListConnected() {
  return (
    <RequireAuth>
      <ReviewsListContent />
    </RequireAuth>
  );
}

export function NewReviewConnected() {
  return (
    <RequireAuth>
      <NewReviewContent />
    </RequireAuth>
  );
}
