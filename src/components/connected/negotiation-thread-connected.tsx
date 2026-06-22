"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import {
  acceptNegotiationOffer,
  getNegotiation,
  getNegotiationMessages,
  sendNegotiationMessage,
  sendNegotiationOffer,
  simulateOrderTransaction,
} from "@/lib/api";
import { negotiationStatusLabels } from "@/lib/labels";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

function NegotiationThreadContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const threadId = params.id;
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const [message, setMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerWeight, setOfferWeight] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const threadQuery = useAsyncData(
    () => getNegotiation(accessToken!, threadId),
    [accessToken, threadId],
    Boolean(accessToken && threadId),
  );

  const messagesQuery = useAsyncData(
    () => getNegotiationMessages(accessToken!, threadId),
    [accessToken, threadId],
    Boolean(accessToken && threadId),
  );

  useEffect(() => {
    if (!accessToken || !threadId) return;
    const interval = window.setInterval(() => {
      void messagesQuery.reload();
      void threadQuery.reload();
    }, 3000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data?.length]);

  const sendText = async () => {
    if (!accessToken || !message.trim()) return;
    try {
      await sendNegotiationMessage(accessToken, threadId, message.trim());
      setMessage("");
      await messagesQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal mengirim pesan.", "error");
    }
  };

  const sendOffer = async () => {
    if (!accessToken || !offerPrice || !offerWeight) {
      pushToast("Lengkapi harga dan berat penawaran.", "error");
      return;
    }
    try {
      await sendNegotiationOffer(accessToken, threadId, {
        price_per_kg: Number(offerPrice),
        weight_kg: Number(offerWeight),
      });
      pushToast("Penawaran dikirim.", "success");
      await messagesQuery.reload();
      await threadQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal mengirim penawaran.", "error");
    }
  };

  const acceptOffer = async () => {
    if (!accessToken) return;
    try {
      await acceptNegotiationOffer(accessToken, threadId);
      pushToast("Penawaran disepakati. Lanjut simulasi pembayaran.", "success");
      await threadQuery.reload();
      await messagesQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal menerima penawaran.", "error");
    }
  };

  const simulatePayment = async () => {
    const orderId = threadQuery.data?.order_id;
    if (!accessToken || !orderId) return;
    setIsPaying(true);
    try {
      await simulateOrderTransaction(accessToken, orderId);
      pushToast("Pembayaran simulasi berhasil. Transaksi tercatat.", "success");
      router.push(routes.transactions);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Simulasi pembayaran gagal.", "error");
    } finally {
      setIsPaying(false);
    }
  };

  const thread = threadQuery.data;
  const isAccepted = thread?.status === "accepted";
  const agreedTotal =
    thread?.agreed_price_per_kg && thread?.agreed_weight_kg
      ? thread.agreed_price_per_kg * thread.agreed_weight_kg
      : null;

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Negosiasi · Chat Real-time"
        title={`Thread ${threadId.slice(0, 8)}`}
        backHref={routes.negotiations}
        backLabel="Daftar Negosiasi"
        description="Pesan & penawaran diperbarui otomatis setiap 3 detik. Tawar-menawar hingga deal, lalu simulasi bayar."
      />

      <div className="flex flex-wrap items-center gap-3">
        {thread ? (
          <StatusBadge label={negotiationStatusLabels[thread.status] ?? thread.status} tone="info" />
        ) : null}
        <span className="text-xs text-[var(--color-ink-500)]">Auto-refresh aktif</span>
      </div>

      {isAccepted && agreedTotal ? (
        <div className="rounded-2xl border border-[var(--color-leaf-200)] bg-[var(--color-mint-50)] p-5">
          <p className="font-semibold text-[var(--color-forest-900)]">Deal disepakati</p>
          <p className="mt-1 text-sm">
            {formatCurrency(thread!.agreed_price_per_kg!)} / kg × {formatWeight(thread!.agreed_weight_kg!)} ={" "}
            <strong>{formatCurrency(agreedTotal)}</strong>
          </p>
          <button
            type="button"
            disabled={isPaying}
            onClick={() => void simulatePayment()}
            className="mt-4 rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPaying ? "Memproses..." : "Simulasi Pembayaran"}
          </button>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold">Riwayat chat</h2>
          <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">
            {(messagesQuery.data ?? []).map((msg) => (
              <div key={msg.id} className="rounded-xl bg-[var(--color-sage-50)] px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase text-[var(--color-ink-500)]">
                  {msg.message_type === "offer" || msg.message_type === "counter_offer"
                    ? "Penawaran"
                    : msg.message_type === "text"
                      ? "Pesan"
                      : msg.message_type}
                </p>
                <p className="mt-1">
                  {msg.content ??
                    (msg.offer_price_per_kg
                      ? `${formatCurrency(msg.offer_price_per_kg)}/kg · ${msg.offer_weight_kg ? formatWeight(msg.offer_weight_kg) : ""}`
                      : "—")}
                </p>
              </div>
            ))}
            {(messagesQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-ink-500)]">Belum ada pesan. Mulai negosiasi dengan penawaran harga.</p>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Kirim pesan</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendText();
              }
            }}
            placeholder="Tulis pesan..."
            rows={3}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void sendText()}
            className="w-full rounded-full bg-[var(--color-forest-900)] px-4 py-2 text-sm font-semibold text-white"
          >
            Kirim pesan
          </button>

          {!isAccepted ? (
            <>
              <hr className="border-[var(--color-line)]" />
              <h2 className="font-semibold">Penawaran harga</h2>
              <input
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Harga per kg (IDR)"
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <input
                value={offerWeight}
                onChange={(e) => setOfferWeight(e.target.value)}
                placeholder="Berat (kg)"
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <button type="button" onClick={() => void sendOffer()} className="w-full rounded-full border px-4 py-2 text-sm font-semibold">
                 Kirim penawaran
              </button>
              <button type="button" onClick={() => void acceptOffer()} className="w-full rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">
                Terima penawaran
              </button>
            </>
          ) : null}

          <Link href={routes.transactions} className="block text-center text-sm font-semibold text-[var(--color-leaf-700)]">
            Lihat transaksi
          </Link>
        </aside>
      </section>
    </main>
  );
}

export function NegotiationThreadConnected() {
  return (
    <RequireAuth roles={["industry", "collector"]}>
      <NegotiationThreadContent />
    </RequireAuth>
  );
}
