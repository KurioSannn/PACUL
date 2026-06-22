"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import {
  acceptNegotiationOffer,
  getNegotiation,
  getNegotiationMessages,
  getOrderNegotiationHistory,
  listOrders,
  sendNegotiationMessage,
  sendNegotiationOffer,
  startOrderNegotiation,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { routes } from "@/lib/routes";

function NegotiationsContent() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerWeight, setOfferWeight] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const ordersQuery = useAsyncData(
    () => listOrders(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const threadQuery = useAsyncData(
    () => getNegotiation(accessToken!, activeThreadId!),
    [accessToken, activeThreadId],
    Boolean(accessToken && activeThreadId),
  );

  const messagesQuery = useAsyncData(
    () => getNegotiationMessages(accessToken!, activeThreadId!),
    [accessToken, activeThreadId],
    Boolean(accessToken && activeThreadId),
  );

  const openNegotiation = async (orderId: string) => {
    if (!accessToken) return;
    try {
      const existing = await getOrderNegotiationHistory(accessToken, orderId);
      setActiveThreadId(existing.id);
    } catch {
      const created = await startOrderNegotiation(accessToken, orderId);
      setActiveThreadId(created.id);
    }
  };

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId && accessToken) {
      void openNegotiation(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, accessToken]);

  const sendText = async () => {
    if (!accessToken || !activeThreadId || !message.trim()) return;
    await sendNegotiationMessage(accessToken, activeThreadId, message.trim());
    setMessage("");
    await messagesQuery.reload();
  };

  const sendOffer = async () => {
    if (!accessToken || !activeThreadId) return;
    await sendNegotiationOffer(accessToken, activeThreadId, {
      price_per_kg: Number(offerPrice),
      weight_kg: Number(offerWeight),
    });
    await messagesQuery.reload();
    await threadQuery.reload();
  };

  const acceptOffer = async () => {
    if (!accessToken || !activeThreadId) return;
    await acceptNegotiationOffer(accessToken, activeThreadId);
    setStatusMsg("Penawaran diterima.");
    await threadQuery.reload();
  };

  return (
    <div className="page-shell grow grid gap-6 py-8 lg:grid-cols-2">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Negosiasi Order</h1>
        <p className="text-sm text-[var(--color-ink-600)]">Pilih order untuk membuka thread negosiasi.</p>
        {(ordersQuery.data ?? []).map((order) => (
          <article key={order.id} className="rounded-2xl border bg-white p-4">
            <p className="font-semibold">Order {order.id.slice(0, 8)}</p>
            <p className="text-sm">{formatCurrency(order.offered_price_per_kg)}/kg · {order.batch?.name ?? "Batch"}</p>
            <button type="button" onClick={() => void openNegotiation(order.id)} className="mt-3 rounded-full border px-4 py-2 text-sm font-semibold">
              Mulai / buka negosiasi
            </button>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Thread aktif</h2>
        {!activeThreadId ? <p className="mt-3 text-sm text-[var(--color-ink-500)]">Pilih order untuk membuka chat negosiasi.</p> : null}
        {threadQuery.data ? (
          <p className="mt-2 text-sm">
            Status: {threadQuery.data.status}
            {threadQuery.data.last_offer_price_per_kg
              ? ` · Penawaran terakhir ${formatCurrency(threadQuery.data.last_offer_price_per_kg)}/kg`
              : ""}
          </p>
        ) : null}
        {activeThreadId ? (
          <Link href={routes.negotiationChat(activeThreadId)} className="mt-2 inline-block text-sm font-semibold text-[var(--color-leaf-700)]">
            Buka chat penuh →
          </Link>
        ) : null}
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {(messagesQuery.data ?? []).map((msg) => (
            <div key={msg.id} className="rounded-xl bg-[var(--color-sage-50)] px-3 py-2 text-sm">
              <p className="text-xs font-semibold uppercase text-[var(--color-ink-500)]">{msg.message_type}</p>
              <p>{msg.content ?? (msg.offer_price_per_kg ? `Penawaran ${formatCurrency(msg.offer_price_per_kg)}/kg · ${msg.offer_weight_kg} kg` : "—")}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Pesan teks" className="w-full rounded-xl border px-4 py-2" />
          <button type="button" onClick={() => void sendText()} className="rounded-full bg-[var(--color-forest-900)] px-4 py-2 text-sm font-semibold text-white">Kirim pesan</button>
          <div className="grid grid-cols-2 gap-2">
            <input value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="Harga/kg" className="rounded-xl border px-3 py-2" />
            <input value={offerWeight} onChange={(e) => setOfferWeight(e.target.value)} placeholder="Berat kg" className="rounded-xl border px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void sendOffer()} className="rounded-full border px-4 py-2 text-sm font-semibold">Kirim penawaran</button>
            <button type="button" onClick={() => void acceptOffer()} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white">Terima</button>
          </div>
          {statusMsg ? <p className="text-sm text-[var(--color-leaf-700)]">{statusMsg}</p> : null}
        </div>
      </section>
    </div>
  );
}

export function NegotiationsConnected() {
  return (
    <RequireAuth roles={["industry", "collector"]}>
      <NegotiationsContent />
    </RequireAuth>
  );
}