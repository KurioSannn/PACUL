"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MaterialBatchMarketplaceItem } from "@/lib/api/types";

export type CartItem = {
  batchId: string;
  name: string;
  categoryName: string;
  collectorName: string;
  pricePerKg: number;
  maxWeightKg: number;
  minOrderKg: number;
  requestedWeightKg: number;
  offeredPricePerKg: number;
  city: string | null;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (material: MaterialBatchMarketplaceItem, weightKg?: number) => void;
  removeItem: (batchId: string) => void;
  updateItem: (batchId: string, patch: Partial<Pick<CartItem, "requestedWeightKg" | "offeredPricePerKg">>) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "pacul-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

function loadStored(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function materialToCartItem(material: MaterialBatchMarketplaceItem, weightKg?: number): CartItem {
  const weight = weightKg ?? Math.max(material.min_order_kg, Math.min(material.total_weight_kg, material.min_order_kg || 1));
  return {
    batchId: material.id,
    name: material.name,
    categoryName: material.category.name,
    collectorName: material.collector.display_name,
    pricePerKg: material.price_per_kg,
    maxWeightKg: material.total_weight_kg,
    minOrderKg: material.min_order_kg,
    requestedWeightKg: weight,
    offeredPricePerKg: material.price_per_kg,
    city: material.city,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((material: MaterialBatchMarketplaceItem, weightKg?: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.batchId === material.id);
      if (existing) {
        return prev.map((i) =>
          i.batchId === material.id
            ? { ...i, requestedWeightKg: Math.min(i.requestedWeightKg + (weightKg ?? i.minOrderKg), material.total_weight_kg) }
            : i,
        );
      }
      return [...prev, materialToCartItem(material, weightKg)];
    });
  }, []);

  const removeItem = useCallback((batchId: string) => {
    setItems((prev) => prev.filter((i) => i.batchId !== batchId));
  }, []);

  const updateItem = useCallback(
    (batchId: string, patch: Partial<Pick<CartItem, "requestedWeightKg" | "offeredPricePerKg">>) => {
      setItems((prev) =>
        prev.map((i) => (i.batchId === batchId ? { ...i, ...patch } : i)),
      );
    },
    [],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.requestedWeightKg * i.offeredPricePerKg, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.length,
      subtotal,
      addItem,
      removeItem,
      updateItem,
      clearCart,
    }),
    [items, subtotal, addItem, removeItem, updateItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      addItem: () => {},
      removeItem: () => {},
      updateItem: () => {},
      clearCart: () => {},
    };
  }
  return ctx;
}
