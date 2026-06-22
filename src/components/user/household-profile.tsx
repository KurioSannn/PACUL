"use client";

import Link from "next/link";
import { User, MapPin, Phone, Mail, Package, ListChecks, Truck, Star, Edit, Plus, ArrowRight } from "lucide-react";

import { mockHouseholdProfile } from "@/data/mock-household";
import { wasteCategoryLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { routes } from "@/lib/routes";

export function HouseholdProfileView() {
  const profile = mockHouseholdProfile;

  return (
    <div className="page-shell grow py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Profil Rumah Tangga</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Akun Saya</h1>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--color-line)] px-5 text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)] sm:w-auto"
        >
          <Edit className="size-4" aria-hidden="true" />
          Edit Profil
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Identity card */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
              <User className="size-7" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-forest-900)]">{profile.name}</h2>
              <span className="rounded-full bg-[var(--color-mint-100)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-leaf-700)]">Rumah Tangga</span>
            </div>
          </div>
          <dl className="mt-6 grid gap-4">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-[var(--color-ink-500)]" aria-hidden="true" />
              <div><dt className="text-xs text-[var(--color-ink-500)]">Telepon</dt><dd className="text-sm font-medium text-[var(--color-forest-900)]">{profile.phone}</dd></div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-[var(--color-ink-500)]" aria-hidden="true" />
              <div><dt className="text-xs text-[var(--color-ink-500)]">Email</dt><dd className="text-sm font-medium text-[var(--color-forest-900)]">{profile.email}</dd></div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--color-ink-500)]" aria-hidden="true" />
              <div>
                <dt className="text-xs text-[var(--color-ink-500)]">Alamat Pickup</dt>
                <dd className="text-sm font-medium text-[var(--color-forest-900)]">{profile.address}</dd>
                <dd className="text-xs text-[var(--color-ink-500)]">{profile.district}, {profile.city}</dd>
                {profile.addressNote && <dd className="mt-1 text-xs italic text-[var(--color-ink-500)]">{profile.addressNote}</dd>}
              </div>
            </div>
          </dl>
          <p className="mt-5 rounded-lg bg-[var(--color-sage-50)] px-3 py-2 text-xs text-[var(--color-ink-500)]">
            Akun demo — data tidak tersimpan ke server.
          </p>
        </section>

        {/* Stats card */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
          <h2 className="text-sm font-bold uppercase tracking-[0.09em] text-[var(--color-ink-500)]">Statistik</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
              <Package className="size-5 text-[var(--color-leaf-700)]" aria-hidden="true" />
              <p className="mt-2 text-2xl font-bold text-[var(--color-forest-900)]">{profile.stats.totalMaterialSubmitted}</p>
              <p className="text-xs text-[var(--color-ink-500)]">Material disetor</p>
            </div>
            <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
              <ListChecks className="size-5 text-[var(--color-leaf-700)]" aria-hidden="true" />
              <p className="mt-2 text-2xl font-bold text-[var(--color-forest-900)]">{profile.stats.totalListingsCreated}</p>
              <p className="text-xs text-[var(--color-ink-500)]">Listing dibuat</p>
            </div>
            <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
              <Truck className="size-5 text-[var(--color-leaf-700)]" aria-hidden="true" />
              <p className="mt-2 text-2xl font-bold text-[var(--color-forest-900)]">{profile.stats.pickupsCompleted}</p>
              <p className="text-xs text-[var(--color-ink-500)]">Pickup selesai</p>
            </div>
            <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
              <Star className="size-5 text-[var(--color-leaf-700)]" aria-hidden="true" />
              <p className="mt-2 text-2xl font-bold text-[var(--color-forest-900)]">{formatCurrency(profile.stats.estimatedIncomeTotal)}</p>
              <p className="text-xs text-[var(--color-ink-500)]">Estimasi pendapatan</p>
            </div>
          </div>
        </section>

        {/* Preferences card */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
          <h2 className="text-sm font-bold uppercase tracking-[0.09em] text-[var(--color-ink-500)]">Preferensi</h2>
          <div className="mt-5 grid gap-4">
            <div>
              <p className="text-xs text-[var(--color-ink-500)]">Kategori material</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.preferredCategories.map((cat) => (
                  <span key={cat} className="rounded-full bg-[var(--color-mint-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-leaf-700)]">
                    {wasteCategoryLabels[cat]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--color-ink-500)]">Jadwal pickup favorit</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-forest-900)]">{profile.preferredPickupDay}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-ink-500)]">Notifikasi</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-forest-900)]">{profile.notificationsEnabled ? "Aktif" : "Nonaktif"}</p>
            </div>
          </div>
        </section>

        {/* Quick actions card */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
          <h2 className="text-sm font-bold uppercase tracking-[0.09em] text-[var(--color-ink-500)]">Aksi Cepat</h2>
          <div className="mt-5 grid gap-3">
            <Link
              href={routes.myMaterials}
              className="flex items-center justify-between rounded-xl border border-[var(--color-line)] p-4 text-sm font-semibold text-[var(--color-forest-900)] transition-colors hover:bg-[var(--color-sage-50)]"
            >
              Lihat Material Saya
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href={routes.listingsNew}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-leaf-600)] p-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)]"
            >
              <Plus className="size-4" aria-hidden="true" />
              Buat Listing Baru
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
