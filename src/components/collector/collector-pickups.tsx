"use client";

import Link from "next/link";
import { CheckCircle2, MapPin, Navigation, Package, Truck, Clock } from "lucide-react";
import { useState } from "react";

import { mockWasteListings, mockRoutes } from "@/data/mock-pacul";
import { wasteCategoryLabels, wasteListingStatusLabels } from "@/lib/constants";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

export function CollectorPickupsView() {
  const claimableListings = mockWasteListings.filter((l) => l.status === "listed" || l.status === "scheduled");
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  const handleClaim = (id: string) => {
    setClaimed((prev) => new Set(prev).add(id));
  };

  return (
    <div className="page-shell grow py-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Panel Pengepul</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Pickup Tersedia</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-600)]">Klaim listing sampah dari rumah tangga untuk dijadwalkan pickup.</p>
      </div>

      {/* Active Route */}
      {mockRoutes[0] && (
        <section className="rounded-2xl border border-[var(--color-leaf-500)] bg-[var(--color-mint-100)]/30 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-leaf-600)] text-white">
                <Truck className="size-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--color-forest-900)]">{mockRoutes[0].title}</h2>
                <p className="text-xs text-[var(--color-ink-500)]">{mockRoutes[0].stops.length} titik · {mockRoutes[0].totalDistanceKm} km · ~{mockRoutes[0].estimatedDurationMinutes} menit</p>
              </div>
            </div>
            <Link href={routes.pickupRoutes} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-forest-900)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-forest-800)]">
              <Navigation className="size-4" aria-hidden="true" /> Lihat Rute
            </Link>
          </div>
        </section>
      )}

      {/* Available listings */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-4">Listing Menunggu Klaim ({claimableListings.length})</h2>
        {claimableListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-mint-200)] bg-white p-10 text-center">
            <Package className="mx-auto size-10 text-[var(--color-mint-200)]" aria-hidden="true" />
            <p className="mt-4 font-medium text-[var(--color-forest-900)]">Tidak ada listing tersedia</p>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">Semua listing sudah diklaim atau diproses.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {claimableListings.map((listing) => {
              const isClaimed = claimed.has(listing.id);
              return (
                <article key={listing.id} className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-white p-5 transition-colors hover:border-[var(--color-mint-200)]">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="rounded-full bg-[var(--color-mint-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-leaf-700)]">{wasteCategoryLabels[listing.category]}</span>
                      <span className="text-xs text-[var(--color-ink-500)]">{wasteListingStatusLabels[listing.status]}</span>
                    </div>
                    <h3 className="font-semibold text-[var(--color-forest-900)]">{listing.title}</h3>
                    <p className="mt-1 text-xs text-[var(--color-ink-500)]">{listing.householdName}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-ink-500)]">
                      <span className="flex items-center gap-1"><MapPin className="size-3" /> {listing.district}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {formatWeight(listing.weightKg)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
                    {isClaimed ? (
                      <div className="flex items-center justify-center gap-2 min-h-10 rounded-full bg-[var(--color-mint-100)] text-sm font-semibold text-[var(--color-leaf-700)]">
                        <CheckCircle2 className="size-4" aria-hidden="true" /> Diklaim
                      </div>
                    ) : (
                      <button type="button" onClick={() => handleClaim(listing.id)} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-leaf-600)] text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)]">
                        Klaim Pickup
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
