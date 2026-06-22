"use client";

import Link from "next/link";
import { Edit, Mail, MapPin, Package, Phone, Star, User } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getDashboardSummary, getMyPoints } from "@/lib/api";
import { routes } from "@/lib/routes";

function ProfileContent() {
  const { profile, accessToken } = useAuth();
  const summaryQuery = useAsyncData(
    () => getDashboardSummary(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );
  const pointsQuery = useAsyncData(
    () => getMyPoints(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  if (!profile) return null;

  const roleProfile = profile.profile as Record<string, unknown>;
  const roleLabel =
    profile.role === "household"
      ? "Rumah Tangga"
      : profile.role === "collector"
        ? "Pengepul"
        : "Industri";

  return (
    <div className="page-shell grow space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Profil PACUL</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-forest-900)] sm:text-3xl">{profile.display_name}</h1>
        </div>
        <span className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-line)] px-5 text-sm font-semibold text-[var(--color-forest-900)]">
          <Edit className="mr-2 size-4" /> {roleLabel}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
              <User className="size-7" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-forest-900)]">{profile.display_name}</h2>
              <p className="text-sm text-[var(--color-ink-500)]">{profile.email}</p>
            </div>
          </div>
          <dl className="mt-6 space-y-4">
            <div className="flex gap-3">
              <Phone className="size-4 text-[var(--color-ink-500)]" />
              <div>
                <dt className="text-xs text-[var(--color-ink-500)]">Telepon</dt>
                <dd className="text-sm font-medium">{profile.phone ?? "—"}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Mail className="size-4 text-[var(--color-ink-500)]" />
              <div>
                <dt className="text-xs text-[var(--color-ink-500)]">Email</dt>
                <dd className="text-sm font-medium">{profile.email}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="size-4 text-[var(--color-ink-500)]" />
              <div>
                <dt className="text-xs text-[var(--color-ink-500)]">Lokasi</dt>
                <dd className="text-sm font-medium">
                  {String(roleProfile.address ?? roleProfile.company_name ?? roleProfile.business_name ?? "—")}
                </dd>
                <dd className="text-xs text-[var(--color-ink-500)]">
                  {[roleProfile.district, roleProfile.city, roleProfile.province].filter(Boolean).join(", ") || "—"}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
          <h2 className="text-sm font-bold uppercase tracking-[0.09em] text-[var(--color-ink-500)]">Ringkasan Backend</h2>
          {summaryQuery.isLoading ? (
            <p className="mt-4 text-sm text-[var(--color-ink-500)]">Memuat metrik dashboard...</p>
          ) : summaryQuery.data?.role === "household" ? (
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
                <p className="text-2xl font-bold">{summaryQuery.data.counts.active_listings}</p>
                <p className="text-xs text-[var(--color-ink-500)]">Listing aktif</p>
              </div>
              <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
                <p className="text-2xl font-bold">{summaryQuery.data.counts.waiting_pickup}</p>
                <p className="text-xs text-[var(--color-ink-500)]">Menunggu pickup</p>
              </div>
            </div>
          ) : summaryQuery.data?.role === "collector" ? (
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
                <p className="text-2xl font-bold">{summaryQuery.data.counts.active_claims}</p>
                <p className="text-xs text-[var(--color-ink-500)]">Klaim aktif</p>
              </div>
              <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
                <p className="text-2xl font-bold">{summaryQuery.data.counts.available_batches}</p>
                <p className="text-xs text-[var(--color-ink-500)]">Batch tersedia</p>
              </div>
            </div>
          ) : summaryQuery.data?.role === "industry" ? (
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
                <p className="text-2xl font-bold">{summaryQuery.data.counts.active_orders}</p>
                <p className="text-xs text-[var(--color-ink-500)]">Order aktif</p>
              </div>
              <div className="rounded-xl bg-[var(--color-sage-50)] p-4">
                <p className="text-2xl font-bold">{summaryQuery.data.counts.open_negotiations}</p>
                <p className="text-xs text-[var(--color-ink-500)]">Negosiasi terbuka</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-ink-500)]">Ringkasan belum tersedia.</p>
          )}
          <div className="mt-6 rounded-xl bg-[var(--color-mint-50)] p-4">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-[var(--color-leaf-700)]" />
              <p className="text-sm font-semibold text-[var(--color-forest-900)]">EcoPoints</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-[var(--color-forest-900)]">
              {pointsQuery.data?.total_points ?? 0}
            </p>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={routes.myMaterials} className="rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white">
          Material Saya
        </Link>
        <Link href={routes.notifications} className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm font-semibold">
          Notifikasi
        </Link>
        <Link href={routes.reports} className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm font-semibold">
          Laporan
        </Link>
      </div>
    </div>
  );
}

export function ProfileConnectedView() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
