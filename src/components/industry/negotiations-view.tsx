"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Package } from "lucide-react";

import { mockNegotiations } from "@/data/mock-pacul";
import { negotiationStatusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { routes } from "@/lib/routes";

function statusColor(status: string): string {
  switch (status) {
    case "waiting_reply": return "bg-[var(--color-amber-100)] text-[var(--color-amber-700)]";
    case "countered": return "bg-[var(--color-blue-100)] text-[var(--color-blue-700)]";
    case "approved": case "completed": return "bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]";
    case "cancelled": return "bg-[var(--color-red-100)] text-[var(--color-red-700)]";
    default: return "bg-[#edf0ee] text-[var(--color-ink-700)]";
  }
}

export function NegotiationsView() {
  return (
    <div className="page-shell grow py-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Negosiasi</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Riwayat Negosiasi</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-600)]">Pantau proses tawar-menawar harga dengan mitra bisnis Anda.</p>
      </div>

      {mockNegotiations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-mint-200)] bg-white p-10 text-center">
          <MessageCircle className="mx-auto size-10 text-[var(--color-mint-200)]" aria-hidden="true" />
          <p className="mt-4 font-medium text-[var(--color-forest-900)]">Belum ada negosiasi</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mockNegotiations.map((nego) => (
            <article key={nego.id} className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-white p-5 hover:border-[var(--color-mint-200)] transition-colors">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] text-[var(--color-ink-400)]">{nego.id}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(nego.status)}`}>{negotiationStatusLabels[nego.status]}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--color-forest-900)]">{nego.buyerName} ↔ {nego.supplierName}</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[var(--color-sage-50)] p-3">
                    <p className="text-[10px] text-[var(--color-ink-500)]">Penawaran</p>
                    <p className="text-sm font-bold text-[var(--color-forest-900)]">{formatCurrency(nego.offeredPricePerKg)}/kg</p>
                  </div>
                  <div className="rounded-lg bg-[var(--color-sage-50)] p-3">
                    <p className="text-[10px] text-[var(--color-ink-500)]">Counter</p>
                    <p className="text-sm font-bold text-[var(--color-forest-900)]">{nego.counterPricePerKg ? `${formatCurrency(nego.counterPricePerKg)}/kg` : "—"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--color-line)] flex gap-2">
                <Link href={routes.negotiationChat(nego.id)} className="flex flex-1 min-h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--color-forest-900)] text-xs font-semibold text-white hover:bg-[var(--color-forest-800)]">
                  <MessageCircle className="size-3.5" /> Chat
                </Link>
                <Link href={routes.negotiationDetail(nego.id)} className="flex flex-1 min-h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--color-line)] text-xs font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">
                  Detail <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
