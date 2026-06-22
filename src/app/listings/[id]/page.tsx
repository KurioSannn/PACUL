import Link from "next/link";
import { ArrowLeft, MapPin, Package, Star, Tag, Truck, Weight, Clock, Edit, Navigation, MessageCircle } from "lucide-react";

import { mockWasteListings, mockRoutes } from "@/data/mock-pacul";
import { wasteCategoryLabels, wasteListingStatusLabels } from "@/lib/constants";
import { formatWeight } from "@/lib/format";
import { routes } from "@/lib/routes";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

function statusColor(status: string): string {
  switch (status) {
    case "listed": return "bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]";
    case "scheduled": return "bg-[var(--color-blue-100)] text-[var(--color-blue-700)]";
    case "picked_up": return "bg-[var(--color-amber-100)] text-[var(--color-amber-600)]";
    case "sorted": return "bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]";
    case "cancelled": return "bg-[var(--color-red-100)] text-[var(--color-red-700)]";
    default: return "bg-[#edf0ee] text-[var(--color-ink-700)]";
  }
}

type ListingDetailPageProps = { params: Promise<{ id: string }> };

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const listing = mockWasteListings.find((item) => item.id === id) ?? mockWasteListings[0];
  const relatedRoute = mockRoutes[0];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <main className="page-shell grow py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href={routes.myMaterials} className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink-500)] hover:bg-[var(--color-sage-50)]">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="sr-only">Kembali</span>
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Detail Listing</p>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-2xl">{listing.title}</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Photo placeholder */}
            <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] flex items-center justify-center">
              <Package className="size-16 text-[var(--color-mint-200)]" aria-hidden="true" />
              <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[var(--color-ink-500)] backdrop-blur-sm shadow-sm">Foto belum tersedia (demo)</span>
            </div>

            {/* Material Details Card */}
            <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-5 border-b border-[var(--color-line)] pb-3">Informasi Material</h2>
              <dl className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Tag className="mt-0.5 size-4 shrink-0 text-[var(--color-leaf-600)]" aria-hidden="true" />
                  <div><dt className="text-xs text-[var(--color-ink-500)]">Kategori</dt><dd className="text-sm font-semibold text-[var(--color-forest-900)]">{wasteCategoryLabels[listing.category]}</dd></div>
                </div>
                <div className="flex items-start gap-3">
                  <Weight className="mt-0.5 size-4 shrink-0 text-[var(--color-leaf-600)]" aria-hidden="true" />
                  <div><dt className="text-xs text-[var(--color-ink-500)]">Berat Estimasi</dt><dd className="text-sm font-semibold text-[var(--color-forest-900)]">{formatWeight(listing.weightKg)}</dd></div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--color-leaf-600)]" aria-hidden="true" />
                  <div><dt className="text-xs text-[var(--color-ink-500)]">Lokasi</dt><dd className="text-sm font-semibold text-[var(--color-forest-900)]">{listing.address}</dd><dd className="text-xs text-[var(--color-ink-500)]">{listing.district}</dd></div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-[var(--color-leaf-600)]" aria-hidden="true" />
                  <div><dt className="text-xs text-[var(--color-ink-500)]">Dibuat</dt><dd className="text-sm font-semibold text-[var(--color-forest-900)]">{new Date(listing.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</dd></div>
                </div>
              </dl>
              {listing.aiConfidence !== null && listing.aiConfidence !== undefined && (
                <div className="mt-5 flex items-center gap-2 rounded-lg bg-[var(--color-sage-50)] p-3 border border-[var(--color-mint-200)]">
                  <Star className="size-4 text-[var(--color-leaf-600)]" aria-hidden="true" />
                  <p className="text-xs text-[var(--color-leaf-800)]"><strong>AI Confidence:</strong> {(listing.aiConfidence * 100).toFixed(0)}% — kategori terdeteksi: {wasteCategoryLabels[listing.aiPredictedCategory ?? listing.category]}</p>
                </div>
              )}
            </section>

            {/* Household Info */}
            <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-4">Pemilik Material</h2>
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
                  <Package className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-forest-900)]">{listing.householdName}</p>
                  <p className="text-xs text-[var(--color-ink-500)]">ID: {listing.householdId}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right column — Status & Actions */}
          <div>
            <div className="sticky top-[104px] space-y-6">
              {/* Status Card */}
              <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-4">Status</h2>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${statusColor(listing.status)}`}>{wasteListingStatusLabels[listing.status]}</span>
                </div>

                {relatedRoute && listing.status === "scheduled" && (
                  <div className="mt-5 rounded-xl bg-[var(--color-sage-50)] border border-[var(--color-line)] p-4">
                    <p className="text-xs font-semibold text-[var(--color-ink-500)] mb-2">Mitra Pengangkut</p>
                    <div className="flex items-center gap-3">
                      <Truck className="size-5 text-[var(--color-leaf-600)]" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-forest-900)]">{relatedRoute.driverName}</p>
                        <p className="text-xs text-[var(--color-ink-500)]">{relatedRoute.title}</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Actions */}
              <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)] space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-2">Aksi</h2>
                {listing.status === "listed" && (
                  <Link href={routes.pickupConfirm} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-leaf-600)] text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)]">
                    <Navigation className="size-4" aria-hidden="true" /> Konfirmasi Pickup
                  </Link>
                )}
                {listing.status === "scheduled" && (
                  <Link href={routes.pickupTracking} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-forest-900)] text-sm font-semibold text-white hover:bg-[var(--color-forest-800)]">
                    <Navigation className="size-4" aria-hidden="true" /> Lacak Pickup
                  </Link>
                )}
                <Link href={routes.listingEdit(listing.id)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">
                  <Edit className="size-4" aria-hidden="true" /> Edit Listing
                </Link>
                <Link href={routes.messages} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">
                  <MessageCircle className="size-4" aria-hidden="true" /> Chat Mitra
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}