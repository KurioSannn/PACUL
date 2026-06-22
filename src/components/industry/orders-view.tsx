"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Package, Plus } from "lucide-react";

import { mockOrders } from "@/data/mock-pacul";
import { orderStatusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { routes } from "@/lib/routes";

function statusColor(status: string): string {
  switch (status) {
    case "negotiating": return "bg-[var(--color-amber-100)] text-[var(--color-amber-700)]";
    case "approved": case "completed": return "bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]";
    case "paid": return "bg-[var(--color-blue-100)] text-[var(--color-blue-700)]";
    case "cancelled": return "bg-[var(--color-red-100)] text-[var(--color-red-700)]";
    default: return "bg-[#edf0ee] text-[var(--color-ink-700)]";
  }
}

export function OrdersView() {
  return (
    <div className="page-shell grow py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Panel Industri</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Pesanan Bahan Baku</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-600)]">Kelola pesanan material daur ulang dari marketplace pengepul.</p>
        </div>
        <Link href={routes.ordersNew} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-leaf-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)] sm:w-auto">
          <Plus className="size-4" aria-hidden="true" /> Buat Pesanan
        </Link>
      </div>

      {mockOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-mint-200)] bg-white p-10 text-center">
          <ClipboardList className="mx-auto size-10 text-[var(--color-mint-200)]" aria-hidden="true" />
          <p className="mt-4 font-medium text-[var(--color-forest-900)]">Belum ada pesanan</p>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Buka marketplace bahan baku untuk mulai memesan.</p>
          <Link href={routes.marketplaceMaterials} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[var(--color-leaf-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)]">
            Buka Marketplace
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-panel)] overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-sage-50)]">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-500)]">ID</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-500)]">Material</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-500)]">Supplier</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--color-ink-500)]">Qty</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--color-ink-500)]">Total</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--color-ink-500)]">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--color-ink-500)]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {mockOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--color-sage-50)] transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-[var(--color-ink-500)]">{order.id}</td>
                    <td className="px-5 py-4 font-semibold text-[var(--color-forest-900)]">{order.materialName}</td>
                    <td className="px-5 py-4 text-[var(--color-ink-700)]">{order.supplierName}</td>
                    <td className="px-5 py-4 text-right text-[var(--color-forest-900)]">{order.totalKg} kg</td>
                    <td className="px-5 py-4 text-right font-semibold text-[var(--color-forest-900)]">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-5 py-4 text-center"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}>{orderStatusLabels[order.status]}</span></td>
                    <td className="px-5 py-4 text-right">
                      <Link href={routes.negotiationDetail(order.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-leaf-700)] hover:underline">
                        Detail <ArrowRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-[var(--color-line)]">
            {mockOrders.map((order) => (
              <div key={order.id} className="p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--color-forest-900)]">{order.materialName}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}>{orderStatusLabels[order.status]}</span>
                </div>
                <p className="text-xs text-[var(--color-ink-500)]">{order.supplierName} · {order.totalKg} kg</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[var(--color-forest-900)]">{formatCurrency(order.totalPrice)}</p>
                  <Link href={routes.negotiationDetail(order.id)} className="text-xs font-semibold text-[var(--color-leaf-700)] hover:underline">Detail →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
