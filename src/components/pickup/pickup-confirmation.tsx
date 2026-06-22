"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Package, Truck, Info, Navigation, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { mockPickupConfirmation } from "@/data/mock-household";
import { wasteCategoryLabels } from "@/lib/constants";
import { formatCurrency, formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";

export function PickupConfirmationView() {
  const data = mockPickupConfirmation;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsConfirmed(true);
    }, 1500);
  };

  if (isConfirmed) {
    return (
      <div className="page-shell grow py-12 sm:py-20 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-[var(--color-line)] bg-white p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[var(--color-mint-100)]">
            <CheckCircle2 className="size-10 text-[var(--color-leaf-600)]" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">
            Pickup Dikonfirmasi!
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-700)]">
            Mitra Pengangkut <strong>{data.carrierName}</strong> telah menerima permintaan Anda dan akan menuju lokasi sesuai jadwal yang ditentukan.
          </p>
          
          <div className="mt-8 grid gap-3">
            <Link
              href={routes.pickupTracking}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-leaf-600)] px-6 font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)]"
            >
              <Navigation className="size-4" aria-hidden="true" />
              Lacak Status Pickup
            </Link>
            <Link
              href={routes.myMaterials}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--color-line)] bg-transparent px-6 font-semibold text-[var(--color-forest-900)] transition-colors hover:bg-[var(--color-sage-50)]"
            >
              Kembali ke Material Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell grow py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href={routes.myMaterials} className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink-500)] hover:bg-[var(--color-sage-50)] hover:text-[var(--color-forest-900)]">
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="sr-only">Kembali</span>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-2xl">Konfirmasi Pickup</h1>
          <p className="text-xs text-[var(--color-ink-500)] mt-0.5">Langkah {step} dari 3</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Main Form Area */}
        <div className="space-y-6">
          {/* Step 1: Ringkasan Material */}
          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
            <div className="flex items-center gap-3 border-b border-[var(--color-line)] pb-4">
              <span className="flex size-8 items-center justify-center rounded-full bg-[var(--color-forest-900)] text-sm font-bold text-white">1</span>
              <h2 className="text-lg font-semibold text-[var(--color-forest-900)]">Ringkasan Material</h2>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-5">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-[var(--color-sage-50)] border border-[var(--color-mint-200)]">
                <Package className="size-8 text-[var(--color-leaf-600)]" aria-hidden="true" />
              </div>
              <div className="grow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--color-forest-900)]">{data.listingTitle}</h3>
                    <p className="text-sm font-medium text-[var(--color-ink-500)]">{wasteCategoryLabels[data.category]}</p>
                  </div>
                  <span className="rounded-lg bg-[var(--color-mint-100)] px-3 py-1.5 text-sm font-bold text-[var(--color-leaf-700)]">
                    {formatWeight(data.weightKg)}
                  </span>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-[var(--color-blue-50)] p-3 text-xs text-[var(--color-blue-700)]">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>Berat aktual akan ditimbang ulang oleh mitra saat pickup untuk menentukan nilai akhir.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Alamat & Jadwal */}
          <section className={`rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)] transition-opacity ${step < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 border-b border-[var(--color-line)] pb-4">
              <span className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${step >= 2 ? 'bg-[var(--color-forest-900)] text-white' : 'bg-[var(--color-line)] text-[var(--color-ink-500)]'}`}>2</span>
              <h2 className="text-lg font-semibold text-[var(--color-forest-900)]">Lokasi & Jadwal</h2>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-forest-900)]">
                  <MapPin className="size-4 text-[var(--color-leaf-600)]" aria-hidden="true" /> Lokasi Jemput
                </div>
                <div className="rounded-xl border border-[var(--color-line)] p-4 bg-[var(--color-sage-50)]">
                  <p className="font-medium text-[var(--color-forest-900)] text-sm">{data.address}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-500)]">{data.district}</p>
                  <p className="mt-3 text-xs italic text-[var(--color-ink-500)]">"{data.addressNote}"</p>
                  <p className="mt-3 text-xs font-medium text-[var(--color-forest-900)]">Telp: {data.contactPhone}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-forest-900)]">
                  <Calendar className="size-4 text-[var(--color-leaf-600)]" aria-hidden="true" /> Jadwal Pickup
                </div>
                <div className="rounded-xl border border-[var(--color-line)] p-4 bg-[var(--color-sage-50)]">
                  <p className="font-medium text-[var(--color-forest-900)] text-sm">
                    {new Date(data.scheduledDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--color-leaf-700)]">{data.scheduledTimeSlot}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Mitra */}
          <section className={`rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)] transition-opacity ${step < 3 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 border-b border-[var(--color-line)] pb-4">
              <span className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${step >= 3 ? 'bg-[var(--color-forest-900)] text-white' : 'bg-[var(--color-line)] text-[var(--color-ink-500)]'}`}>3</span>
              <h2 className="text-lg font-semibold text-[var(--color-forest-900)]">Mitra Pengangkut</h2>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row items-start justify-between gap-4 rounded-xl border border-[var(--color-line)] p-5 bg-[var(--color-sage-50)]">
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-mint-100)]">
                  <Truck className="size-6 text-[var(--color-leaf-700)]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-forest-900)]">{data.carrierName}</h3>
                  <p className="text-xs text-[var(--color-ink-500)] mt-1">Area: {data.carrierArea}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs font-medium">
                    <span className="flex items-center gap-1 text-[var(--color-earth-700)]">
                      <ShieldCheck className="size-3.5" aria-hidden="true" /> Terverifikasi
                    </span>
                    <span className="text-[var(--color-forest-900)]">★ {data.carrierRating} / 5.0</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--color-ink-500)]">Estimasi tiba</p>
                <p className="text-sm font-bold text-[var(--color-forest-900)]">{data.estimatedArrivalMinutes} menit</p>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">Jarak: {data.estimatedDistanceKm} km</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Summary Area */}
        <div>
          <div className="sticky top-[104px] rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
            <h2 className="text-lg font-semibold text-[var(--color-forest-900)] border-b border-[var(--color-line)] pb-4">Estimasi Nilai</h2>
            
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-500)]">Estimasi berat</dt>
                <dd className="font-medium text-[var(--color-forest-900)]">{formatWeight(data.weightKg)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-500)]">Harga patokan mitra</dt>
                <dd className="font-medium text-[var(--color-forest-900)]">{formatCurrency(data.pricePerKg)} / kg</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-500)]">Subtotal</dt>
                <dd className="font-medium text-[var(--color-forest-900)]">{formatCurrency(data.estimatedTotal)}</dd>
              </div>
              <div className="flex justify-between border-b border-[var(--color-line)] pb-4">
                <dt className="text-[var(--color-ink-500)]">Biaya layanan pickup</dt>
                <dd className="font-medium text-[var(--color-red-600)]">- {formatCurrency(data.pickupFee)}</dd>
              </div>
              <div className="flex justify-between pt-2">
                <dt className="font-semibold text-[var(--color-forest-900)]">Estimasi Pendapatan Bersih</dt>
                <dd className="text-lg font-bold text-[var(--color-leaf-700)]">{formatCurrency(data.estimatedNetIncome)}</dd>
              </div>
            </dl>

            <div className="mt-8 space-y-3">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => Math.min(3, s + 1))}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-forest-900)] px-6 font-semibold text-white transition-colors hover:bg-[var(--color-forest-800)]"
                >
                  Lanjut ke Langkah {step + 1}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-leaf-600)] px-6 font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)] disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>Memproses...</>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Konfirmasi Pickup
                    </>
                  )}
                </button>
              )}
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(s => Math.max(1, s - 1))}
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--color-line)] bg-transparent px-6 font-semibold text-[var(--color-forest-900)] transition-colors hover:bg-[var(--color-sage-50)] disabled:opacity-50"
                >
                  Kembali
                </button>
              )}
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed text-[var(--color-ink-500)]">
              Dengan mengonfirmasi, Anda menyetujui Syarat & Ketentuan layanan PACUL. <br/>Data ini hanya simulasi (demo).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
