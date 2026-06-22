"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Navigation, Truck, Clock } from "lucide-react";

import { mockRoutes } from "@/data/mock-pacul";
import { pickupStatusLabels } from "@/lib/constants";
import { routes } from "@/lib/routes";

export function PickupRoutesView() {
  const routeData = mockRoutes;

  return (
    <div className="page-shell grow py-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Pengepul</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Rute Pickup</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-600)]">Lihat dan kelola rute pengambilan material dari rumah tangga.</p>
      </div>

      {routeData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-mint-200)] bg-white p-10 text-center">
          <Truck className="mx-auto size-10 text-[var(--color-mint-200)]" aria-hidden="true" />
          <p className="mt-4 font-medium text-[var(--color-forest-900)]">Belum ada rute</p>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Klaim listing terlebih dahulu untuk membuat rute.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {routeData.map((route) => (
            <section key={route.id} className="rounded-2xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-panel)] overflow-hidden">
              {/* Route header */}
              <div className="p-5 sm:p-6 border-b border-[var(--color-line)] bg-[var(--color-forest-900)] text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/10">
                      <Navigation className="size-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{route.title}</h2>
                      <p className="text-sm text-white/70">Driver: {route.driverName}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-right text-sm">
                    <div>
                      <p className="text-white/60 text-xs">Jarak</p>
                      <p className="font-bold">{route.totalDistanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Durasi</p>
                      <p className="font-bold">~{route.estimatedDurationMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Biaya</p>
                      <p className="font-bold">Rp {route.estimatedCost.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route stops */}
              <div className="p-5 sm:p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-4">Titik Pengambilan ({route.stops.length})</h3>
                <div className="space-y-3">
                  {route.stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-center gap-4 rounded-xl border border-[var(--color-line)] p-4 hover:bg-[var(--color-sage-50)] transition-colors">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-leaf-600)] text-xs font-bold text-white">{index + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[var(--color-forest-900)]">{stop.title}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-ink-500)]">
                          <span className="flex items-center gap-1"><MapPin className="size-3" /> {stop.district}</span>
                          <span>{stop.distanceKm} km</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-[var(--color-sage-50)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-700)] border border-[var(--color-line)]">{pickupStatusLabels[stop.status]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Route Map Placeholder */}
              <div className="mx-5 mb-5 sm:mx-6 sm:mb-6 rounded-xl bg-[#e6ece9] border border-[var(--color-line)] h-40 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--color-forest-900) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <p className="relative z-10 text-xs font-bold text-[var(--color-leaf-700)] bg-white/80 rounded-full px-4 py-1.5 backdrop-blur-sm">Peta Rute (demo placeholder)</p>
              </div>
            </section>
          ))}
          <Link href={routes.pickupOptimizer} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-5 text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">
            <Clock className="size-4" aria-hidden="true" /> Buka Optimasi Rute <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
