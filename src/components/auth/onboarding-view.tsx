"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Phone, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import type { UserRole } from "@/lib/api/types";
import { getDashboardPath } from "@/lib/navigation";
import { routes } from "@/lib/routes";

const DEFAULT_COORDS = {
  latitude: -7.2575,
  longitude: 112.7521,
  city: "Surabaya",
  province: "Jawa Timur",
  district: "Wonokromo",
};

function parseRole(value: string | null): UserRole {
  if (value === "collector" || value === "industry") return value;
  return "household";
}

export function OnboardingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const { accessToken, profile, completeOnboarding, isLoading: authLoading } = useAuth();

  const [role, setRole] = useState<UserRole>(parseRole(searchParams?.get("role")));
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState(DEFAULT_COORDS.district);
  const [city, setCity] = useState(DEFAULT_COORDS.city);
  const [province, setProvince] = useState(DEFAULT_COORDS.province);
  const [businessName, setBusinessName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      router.replace(routes.authLogin);
      return;
    }
    if (profile) {
      router.replace(getDashboardPath(profile.role));
    }
  }, [accessToken, authLoading, profile, router]);

  const roleLabel = useMemo(() => {
    if (role === "collector") return "Pengepul";
    if (role === "industry") return "Industri Pengolah";
    return "Rumah Tangga";
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await completeOnboarding(role, {
        displayName: displayName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        district: district.trim(),
        city: city.trim(),
        province: province.trim(),
        latitude: DEFAULT_COORDS.latitude,
        longitude: DEFAULT_COORDS.longitude,
        businessName: role === "collector" ? businessName.trim() : undefined,
        companyName: role === "industry" ? companyName.trim() : undefined,
        industryType: role === "industry" ? industryType.trim() : undefined,
        vehicleCapacityKg: role === "collector" ? 500 : undefined,
      });
      pushToast("Profil berhasil disimpan.", "success");
      router.replace(getDashboardPath(role));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan profil.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)]">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
        <Link
          href={routes.authLogin}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-500)] hover:text-[var(--color-forest-900)]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali
        </Link>

        <div className="rounded-3xl border border-[var(--color-line)] bg-white p-6 sm:p-10 shadow-xl shadow-[var(--color-forest-900)]/5">
          <h1 className="text-2xl font-bold text-[var(--color-forest-900)] sm:text-3xl">Lengkapi Profil</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-600)]">
            Selesaikan onboarding sebagai <strong>{roleLabel}</strong> agar dashboard dan marketplace aktif.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {(["household", "collector", "industry"] as UserRole[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={
                  role === item
                    ? "rounded-xl border border-[var(--color-leaf-500)] bg-[var(--color-mint-100)] px-3 py-2 text-sm font-semibold text-[var(--color-forest-900)]"
                    : "rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-600)]"
                }
              >
                {item === "household" ? "Rumah Tangga" : item === "collector" ? "Pengepul" : "Industri"}
              </button>
            ))}
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">
              {error}
            </p>
          ) : null}

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                Nama tampilan
              </label>
              <div className="relative mt-2">
                <User className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" />
                <input
                  id="displayName"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] py-3 pl-12 pr-4"
                  placeholder="Nama lengkap atau instansi"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                Nomor telepon
              </label>
              <div className="relative mt-2">
                <Phone className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" />
                <input
                  id="phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] py-3 pl-12 pr-4"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            {role === "collector" ? (
              <div>
                <label htmlFor="businessName" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                  Nama usaha pengepul
                </label>
                <input
                  id="businessName"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-[var(--color-line)] px-4 py-3"
                />
              </div>
            ) : null}

            {role === "industry" ? (
              <>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                    Nama perusahaan
                  </label>
                  <input
                    id="companyName"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-2 block w-full rounded-xl border border-[var(--color-line)] px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="industryType" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                    Jenis industri
                  </label>
                  <input
                    id="industryType"
                    required
                    value={industryType}
                    onChange={(e) => setIndustryType(e.target.value)}
                    className="mt-2 block w-full rounded-xl border border-[var(--color-line)] px-4 py-3"
                    placeholder="Contoh: Daur ulang plastik"
                  />
                </div>
              </>
            ) : null}

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                Alamat
              </label>
              <div className="relative mt-2">
                <MapPin className="absolute left-4 top-4 size-5 text-[var(--color-ink-400)]" />
                <textarea
                  id="address"
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] py-3 pl-12 pr-4"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <input
                aria-label="Kecamatan"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="rounded-xl border border-[var(--color-line)] px-4 py-3"
                placeholder="Kecamatan"
              />
              <input
                aria-label="Kota"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border border-[var(--color-line)] px-4 py-3"
                placeholder="Kota"
              />
              <input
                aria-label="Provinsi"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="rounded-xl border border-[var(--color-line)] px-4 py-3"
                placeholder="Provinsi"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-forest-900)] font-semibold text-white disabled:opacity-70"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan dan masuk dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
