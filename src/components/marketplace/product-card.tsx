"use client";

import Link from "next/link";
import { MapPin, ShoppingCart, Trash2 } from "lucide-react";

import { useCart } from "@/contexts/cart-context";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

type MaterialProductCardProps = {
  id: string;
  name: string;
  categoryName: string;
  sellerLabel: string;
  location: string;
  weightKg: number;
  pricePerKg: number;
  statusLabel?: string;
  imageUrl?: string | null;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  secondaryAction?: { label: string; href: string };
  primaryAction?: { label: string; href?: string; onClick?: () => void };
};

export function MaterialProductCard({
  name,
  categoryName,
  sellerLabel,
  location,
  weightKg,
  pricePerKg,
  statusLabel,
  onAddToCart,
  onBuyNow,
  secondaryAction,
  primaryAction,
}: MaterialProductCardProps) {
  const lineTotal = weightKg * pricePerKg;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative bg-gradient-to-br from-[var(--color-mint-100)] to-[var(--color-sage-50)] px-5 py-8">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-leaf-700)]">{categoryName}</p>
        <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-[var(--color-forest-900)]">{name}</h3>
        {statusLabel ? (
          <span className="mt-3 inline-flex rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold">{statusLabel}</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-sm text-[var(--color-ink-600)]">
          <MapPin className="size-3.5 shrink-0" />
          {location}
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">Penjual: {sellerLabel}</p>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-bold text-[var(--color-forest-900)]">{formatCurrency(pricePerKg)}<span className="text-sm font-normal text-[var(--color-ink-500)]">/kg</span></p>
            <p className="text-xs text-[var(--color-ink-500)]">Stok {formatWeight(weightKg)}</p>
          </div>
          <p className="text-right text-sm font-semibold text-[var(--color-leaf-700)]">≈ {formatCurrency(lineTotal)}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {onAddToCart ? (
            <button
              type="button"
              onClick={onAddToCart}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-sage-50)]"
            >
              <ShoppingCart className="size-4" />
              Keranjang
            </button>
          ) : null}
          {onBuyNow ? (
            <button
              type="button"
              onClick={onBuyNow}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--color-leaf-600)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)]"
            >
              Beli sekarang
            </button>
          ) : null}
          {primaryAction ? (
            primaryAction.onClick ? (
              <button type="button" onClick={primaryAction.onClick} className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--color-leaf-600)] px-3 py-2 text-sm font-semibold text-white">
                {primaryAction.label}
              </button>
            ) : primaryAction.href ? (
              <Link href={primaryAction.href} className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--color-leaf-600)] px-3 py-2 text-sm font-semibold text-white">
                {primaryAction.label}
              </Link>
            ) : null
          ) : null}
          {secondaryAction ? (
            <Link href={secondaryAction.href} className="inline-flex w-full items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold">
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function CartSummaryBar() {
  const { itemCount, subtotal } = useCart();
  if (itemCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-40 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-lg">
      <div>
        <p className="text-sm font-semibold">{itemCount} item di keranjang</p>
        <p className="text-xs text-[var(--color-ink-500)]">Estimasi {formatCurrency(subtotal)}</p>
      </div>
      <Link href={routes.checkout} className="rounded-full bg-[var(--color-forest-900)] px-5 py-2.5 text-sm font-semibold text-white">
        Checkout
      </Link>
    </div>
  );
}

export function EmptyCartHint() {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center">
      <ShoppingCart className="mx-auto size-8 text-[var(--color-ink-400)]" />
      <p className="mt-3 font-semibold">Keranjang kosong</p>
      <p className="mt-1 text-sm text-[var(--color-ink-500)]">Jelajahi bahan baku pengepul lalu tambahkan ke keranjang.</p>
      <Link href={routes.marketplaceMaterials} className="mt-4 inline-flex text-sm font-semibold text-[var(--color-leaf-700)]">
        Lihat etalase →
      </Link>
    </div>
  );
}

export function CartLineItem({
  item,
  onRemove,
  onUpdateWeight,
  onUpdatePrice,
}: {
  item: import("@/contexts/cart-context").CartItem;
  onRemove: () => void;
  onUpdateWeight: (v: number) => void;
  onUpdatePrice: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--color-leaf-700)]">{item.categoryName}</p>
          <p className="font-semibold">{item.name}</p>
          <p className="text-sm text-[var(--color-ink-500)]">{item.collectorName} · {item.city ?? "—"}</p>
        </div>
        <button type="button" onClick={onRemove} className="rounded-lg p-2 text-[var(--color-ink-500)] hover:bg-[var(--color-red-50)] hover:text-[var(--color-red-700)]" aria-label="Hapus dari keranjang">
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold">
          Berat (kg, max {item.maxWeightKg})
          <input
            type="number"
            min={item.minOrderKg}
            max={item.maxWeightKg}
            step="0.1"
            value={item.requestedWeightKg}
            onChange={(e) => onUpdateWeight(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold">
          Tawaran harga/kg (IDR)
          <input
            type="number"
            min="0"
            value={item.offeredPricePerKg}
            onChange={(e) => onUpdatePrice(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="mt-2 text-right text-sm font-semibold">
        Subtotal: {formatCurrency(item.requestedWeightKg * item.offeredPricePerKg)}
      </p>
    </div>
  );
}
