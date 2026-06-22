"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Navigation, Package, Star, Clock, CheckCircle2, CircleDashed, Truck } from "lucide-react";

import { mockPickupTracking } from "@/data/mock-household";
import { routes } from "@/lib/routes";

export function PickupTrackingView() {
  const data = mockPickupTracking;

  // Render map placeholder
  const renderMapPlaceholder = () => (
    <div className="relative w-full h-full min-h-[300px] bg-[#e6ece9] rounded-2xl border border-[var(--color-line)] overflow-hidden">
      {/* Decorative map elements */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(var(--color-forest-900) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }} />
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M 20 80 Q 40 20 80 40" fill="none" stroke="var(--color-leaf-600)" strokeWidth="1" strokeDasharray="2 2" className="animate-[dash_2s_linear_infinite]" />
      </svg>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: -4; }
        }
      `}} />
      
      {/* Map Markers */}
      <div className="absolute bottom-[20%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-forest-900)] text-white shadow-lg">
          <MapPin className="size-4" />
        </div>
        <span className="mt-1 rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[var(--color-forest-900)] shadow-sm backdrop-blur-sm">Rumah Anda</span>
      </div>

      <div className="absolute top-[40%] right-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-leaf-600)] text-white shadow-lg">
          <Truck className="size-4" />
        </div>
        <span className="mt-1 rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[var(--color-leaf-700)] shadow-sm backdrop-blur-sm">Mitra</span>
      </div>

      <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-md border border-[var(--color-line)]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-leaf-700)]">Demo Tracking</p>
        <p className="text-[10px] text-[var(--color-ink-500)]">Realtime UI Mockup</p>
      </div>
    </div>
  );

  return (
    <div className="page-shell grow py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={routes.myMaterials} className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink-500)] hover:bg-[var(--color-sage-50)] hover:text-[var(--color-forest-900)]">
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="sr-only">Kembali</span>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-2xl">Pelacakan Pickup</h1>
          <p className="text-xs text-[var(--color-ink-500)] mt-0.5">ID: {data.pickupId}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left Col: Map & Driver */}
        <div className="space-y-6 flex flex-col">
          {/* Map */}
          <div className="flex-1 min-h-[300px] lg:min-h-[400px]">
            {renderMapPlaceholder()}
          </div>

          {/* Carrier Info */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 sm:p-6 shadow-[var(--shadow-panel)]">
            <h2 className="text-sm font-semibold text-[var(--color-forest-900)] mb-4 border-b border-[var(--color-line)] pb-3">Informasi Mitra</h2>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
                  <Truck className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-forest-900)]">{data.carrierName}</h3>
                  <p className="text-xs text-[var(--color-ink-500)] mt-0.5">{data.carrierVehicle}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--color-earth-700)]">
                    <Star className="size-3 fill-current" /> {data.carrierRating}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={routes.messages} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-line)] px-4 text-xs font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">
                  Chat
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Status Timeline */}
        <div>
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 sm:p-6 shadow-[var(--shadow-panel)] sticky top-[104px]">
            
            {/* ETA Box */}
            <div className="mb-6 rounded-xl bg-[var(--color-forest-900)] p-4 text-white text-center">
              <p className="text-xs font-medium text-white/70">Estimasi Tiba</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <Clock className="size-5" />
                <span className="text-2xl font-bold">{data.etaMinutes} Menit</span>
              </div>
              <p className="mt-2 text-[10px] text-white/50">Diperbarui: {new Date(data.lastUpdated).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            {/* Material Context */}
            <div className="mb-6 flex items-start gap-3 border-b border-[var(--color-line)] pb-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-sage-50)] border border-[var(--color-mint-200)] text-[var(--color-leaf-600)]">
                <Package className="size-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-ink-500)]">Material dijemput</p>
                <p className="text-sm font-semibold text-[var(--color-forest-900)] line-clamp-1">{data.listingTitle}</p>
                <Link href={routes.listingDetail(data.listingId)} className="mt-1 text-xs text-[var(--color-leaf-700)] hover:underline inline-flex items-center gap-0.5">
                  Lihat detail listing <Navigation className="size-3" />
                </Link>
              </div>
            </div>

            {/* Timeline */}
            <h2 className="text-sm font-semibold text-[var(--color-forest-900)] mb-4">Status Pengambilan</h2>
            <div className="relative pl-3">
              {/* Vertical line connecting timeline dots */}
              <div className="absolute bottom-4 left-[17px] top-4 w-[2px] bg-[var(--color-line)]" />
              
              <ul className="space-y-6 relative">
                {data.timeline.map((item, index) => {
                  const isCompleted = item.occurredAt !== null;
                  const isCurrent = item.status === data.currentStatus;
                  const isPending = !isCompleted && !isCurrent;
                  
                  return (
                    <li key={item.status} className={`relative flex items-start gap-4 ${isPending ? 'opacity-40' : ''}`}>
                      <div className="relative z-10 flex size-6 shrink-0 bg-white items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle2 className="size-5 text-[var(--color-leaf-600)]" />
                        ) : isCurrent ? (
                          <div className="size-4 rounded-full border-[3px] border-[var(--color-forest-900)] bg-white ring-4 ring-[var(--color-mint-100)]" />
                        ) : (
                          <CircleDashed className="size-4 text-[var(--color-ink-300)]" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className={`text-sm font-semibold ${isCurrent ? 'text-[var(--color-forest-900)]' : 'text-[var(--color-ink-900)]'}`}>
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{item.detail}</p>
                        {isCompleted && item.occurredAt && (
                          <p className="mt-1 text-[10px] font-medium text-[var(--color-ink-400)]">
                            {new Date(item.occurredAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
