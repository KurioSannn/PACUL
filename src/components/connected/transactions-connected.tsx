"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusToneForTransaction } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { completeTransaction, listTransactions, simulateOrderTransaction } from "@/lib/api";
import { transactionStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/format";
import { routes } from "@/lib/routes";

function TransactionsListContent() {
  const { accessToken } = useAuth();
  const txQuery = useAsyncData(
    () => listTransactions(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Transaksi"
        title="Daftar transaksi"
        description="Simulasikan pembayaran, tandai selesai, lalu beri rating mitra."
      />
      {txQuery.isLoading ? <p className="text-sm">Memuat transaksi...</p> : null}
      <div className="grid gap-4">
        {(txQuery.data ?? []).map((tx) => (
          <Link key={tx.id} href={routes.transactionDetail(tx.id)} className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm transition hover:border-[var(--color-leaf-500)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Transaksi {tx.id.slice(0, 8)}</p>
                <p className="text-sm text-[var(--color-ink-600)]">{formatCurrency(tx.amount)}</p>
              </div>
              <StatusBadge label={transactionStatusLabels[tx.status] ?? tx.status} tone={statusToneForTransaction(tx.status)} />
            </div>
          </Link>
        ))}
        {!txQuery.isLoading && (txQuery.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-[var(--color-ink-500)]">
            Belum ada transaksi. Selesaikan negosiasi pesanan terlebih dahulu.
          </div>
        ) : null}
      </div>
    </main>
  );
}

function TransactionDetailContent() {
  const params = useParams<{ id: string }>();
  const txId = params.id;
  const { accessToken, profile } = useAuth();
  const { pushToast } = useToast();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const txQuery = useAsyncData(
    () => listTransactions(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const transaction = useMemo(
    () => (txQuery.data ?? []).find((item) => item.id === txId),
    [txQuery.data, txId],
  );

  const complete = async () => {
    if (!accessToken || !transaction) return;
    try {
      await completeTransaction(accessToken, transaction.id);
      setStatusMsg("Transaksi ditandai selesai.");
      pushToast("Transaksi selesai. Anda dapat memberi rating.", "success");
      await txQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal menyelesaikan transaksi.", "error");
    }
  };

  const simulate = async () => {
    if (!accessToken || !transaction) return;
    try {
      await simulateOrderTransaction(accessToken, transaction.order_id);
      setStatusMsg("Simulasi pembayaran berhasil.");
      pushToast("Pembayaran disimulasikan.", "success");
      await txQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Simulasi gagal.", "error");
    }
  };

  if (txQuery.isLoading) return <p className="page-shell py-8 text-sm">Memuat transaksi...</p>;
  if (!transaction) return <p className="page-shell py-8 text-sm">Transaksi tidak ditemukan.</p>;

  const rateeId = profile?.role === "industry" ? transaction.collector_id : transaction.industry_id;
  const reviewHref = `${routes.reviewsNew}?contextType=transaction&contextId=${transaction.id}&rateeId=${rateeId}`;

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Transaksi"
        title={`Transaksi ${transaction.id.slice(0, 8)}`}
        backHref={routes.transactions}
        backLabel="Daftar Transaksi"
      />

      <header className="rounded-2xl border bg-white p-6 shadow-sm">
        <StatusBadge label={transactionStatusLabels[transaction.status] ?? transaction.status} tone={statusToneForTransaction(transaction.status)} />
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Nilai transaksi</dt><dd className="font-semibold">{formatCurrency(transaction.amount)}</dd></div>
          <div className="flex justify-between"><dt>Metode pembayaran</dt><dd>{transaction.payment_method}</dd></div>
          <div className="flex justify-between"><dt>ID pesanan</dt><dd>{transaction.order_id.slice(0, 8)}</dd></div>
        </dl>
      </header>

      <div className="flex flex-wrap gap-3">
        {transaction.status === "simulated_pending" ? (
          <button type="button" onClick={() => void simulate()} className="rounded-full border px-4 py-2 text-sm font-semibold">Simulasi bayar</button>
        ) : null}
        {transaction.status !== "completed" ? (
          <button type="button" onClick={() => void complete()} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">Tandai selesai</button>
        ) : (
          <Link href={reviewHref} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">Beri rating</Link>
        )}
        <Link href={routes.negotiations} className="rounded-full border px-4 py-2 text-sm font-semibold">Lihat negosiasi</Link>
      </div>
      {statusMsg ? <p className="text-sm text-[var(--color-leaf-700)]">{statusMsg}</p> : null}

      {transaction.status === "completed" ? (
        <section className="rounded-2xl border border-[var(--color-mint-200)] bg-[var(--color-mint-100)] p-6">
          <h2 className="font-semibold text-[var(--color-forest-900)]">Transaksi selesai</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-600)]">
            Beri penilaian kepada mitra dan lihat jejak material untuk presentasi demo.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href={reviewHref} className="text-sm font-semibold text-[var(--color-leaf-700)]">Tulis ulasan</Link>
            <Link href={routes.impact} className="text-sm font-semibold text-[var(--color-leaf-700)]">Dashboard Dampak</Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export function TransactionsListConnected() {
  return (
    <RequireAuth roles={["industry", "collector"]}>
      <TransactionsListContent />
    </RequireAuth>
  );
}

export function TransactionDetailConnected() {
  return (
    <RequireAuth roles={["industry", "collector"]}>
      <TransactionDetailContent />
    </RequireAuth>
  );
}
