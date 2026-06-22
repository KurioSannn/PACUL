"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CartLineItem } from "@/components/marketplace/product-card";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/contexts/toast-context";
import { createOrder, simulateOrderTransaction, startOrderNegotiation } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { routes } from "@/lib/routes";

function CheckoutContent() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { items, subtotal, removeItem, updateItem, clearCart } = useCart();
  const { pushToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"cart" | "processing" | "done">("cart");
  const [resultLinks, setResultLinks] = useState<Array<{ orderId: string; negotiationId?: string }>>([]);

  const checkout = async (mode: "negotiate" | "pay") => {
    if (!accessToken || items.length === 0) return;
    setIsSubmitting(true);
    setStep("processing");
    const results: Array<{ orderId: string; negotiationId?: string }> = [];

    try {
      for (const item of items) {
        const order = await createOrder(accessToken, {
          batchId: item.batchId,
          requested_weight_kg: item.requestedWeightKg,
          offered_price_per_kg: item.offeredPricePerKg,
          notes: `Checkout keranjang · ${item.name}`,
        });

        let negotiationId: string | undefined;
        if (mode === "negotiate") {
          try {
            const thread = await startOrderNegotiation(accessToken, order.id);
            negotiationId = thread.id;
          } catch {
            // order created without thread
          }
        } else {
          try {
            await simulateOrderTransaction(accessToken, order.id);
          } catch {
            pushToast(`Order ${order.id.slice(0, 8)} dibuat; pembayaran simulasi butuh negosiasi disepakati dulu.`, "error");
          }
        }

        results.push({ orderId: order.id, negotiationId });
      }

      clearCart();
      setResultLinks(results);
      setStep("done");
      pushToast(mode === "negotiate" ? "Pesanan dibuat. Lanjut chat & negosiasi harga." : "Pesanan & simulasi pembayaran diproses.", "success");

      const firstNego = results.find((r) => r.negotiationId);
      if (mode === "negotiate" && firstNego?.negotiationId) {
        router.push(routes.negotiationDetail(firstNego.negotiationId));
      }
    } catch (err) {
      setStep("cart");
      pushToast(err instanceof Error ? err.message : "Checkout gagal.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <main className="page-shell grow space-y-6 py-8">
        <PageHeader title="Checkout selesai" description="Pesanan Anda sudah masuk sistem. Lanjut negosiasi atau pantau transaksi." />
        <ul className="space-y-2 text-sm">
          {resultLinks.map((r) => (
            <li key={r.orderId} className="flex flex-wrap gap-3 rounded-xl border p-4">
              <span>Order #{r.orderId.slice(0, 8)}</span>
              {r.negotiationId ? (
                <Link href={routes.negotiationDetail(r.negotiationId)} className="font-semibold text-[var(--color-leaf-700)]">
                  Buka chat negosiasi →
                </Link>
              ) : null}
              <Link href={routes.orders} className="font-semibold text-[var(--color-leaf-700)]">
                Lihat pesanan
              </Link>
            </li>
          ))}
        </ul>
        <Link href={routes.marketplaceMaterials} className="inline-flex rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white">
          Lanjut belanja
        </Link>
      </main>
    );
  }

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Industri · Checkout"
        title="Keranjang & Checkout"
        description="Review pesanan bahan baku, checkout, lalu negosiasi harga real-time dengan pengepul atau simulasikan pembayaran."
        backHref={routes.marketplaceMaterials}
        backLabel="Etalase bahan baku"
      />

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm">Keranjang kosong.</p>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <CartLineItem
                key={item.batchId}
                item={item}
                onRemove={() => removeItem(item.batchId)}
                onUpdateWeight={(v) => updateItem(item.batchId, { requestedWeightKg: v })}
                onUpdatePrice={(v) => updateItem(item.batchId, { offeredPricePerKg: v })}
              />
            ))}
          </div>

          <div className="rounded-2xl border bg-[var(--color-mint-50)] p-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total estimasi</span>
              <span className="text-xl font-bold">{formatCurrency(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-[var(--color-ink-500)]">
              Harga final disepakati via negosiasi (tawar-menawar) sebelum transaksi.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void checkout("negotiate")}
              className="min-h-11 flex-1 rounded-xl bg-[var(--color-forest-900)] font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Memproses..." : "Checkout → Chat & Negosiasi"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void checkout("pay")}
              className="min-h-11 flex-1 rounded-xl border font-semibold disabled:opacity-60"
            >
              Checkout + Simulasi Bayar
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export function CheckoutConnected() {
  return (
    <RequireAuth roles={["industry"]}>
      <CheckoutContent />
    </RequireAuth>
  );
}
