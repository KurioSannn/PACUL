"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, Factory, Home, Truck } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { OnboardingView } from "@/components/auth/onboarding-view";
import { useAuth } from "@/contexts/auth-context";
import { getDashboardPath } from "@/lib/navigation";
import { routes } from "@/lib/routes";

export function RoleSelectionView() {
  const router = useRouter();
  const { accessToken, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (accessToken && profile) {
      router.replace(getDashboardPath(profile.role));
    }
  }, [accessToken, isLoading, profile, router]);

  if (accessToken && !profile && !isLoading) {
    return <OnboardingView />;
  }

  const roles = [
    {
      id: "household",
      title: "Rumah Tangga",
      description: "Buat listing sampah terpilah, lacak pickup, dan lihat dampak kontribusi Anda.",
      icon: <Home className="size-6 text-[var(--color-leaf-600)]" aria-hidden="true" />,
      color: "bg-[var(--color-mint-100)]",
      borderColor: "hover:border-[var(--color-leaf-500)]",
    },
    {
      id: "collector",
      title: "Pengepul",
      description: "Klaim pickup, kelola rute, pilah sampah, dan jual bahan baku ke industri.",
      icon: <Truck className="size-6 text-[var(--color-blue-600)]" aria-hidden="true" />,
      color: "bg-[var(--color-blue-100)]",
      borderColor: "hover:border-[var(--color-blue-500)]",
    },
    {
      id: "industry",
      title: "Industri Pengolah",
      description: "Cari bahan baku, buat pesanan, negosiasi harga, dan lacak transaksi.",
      icon: <Factory className="size-6 text-[var(--color-amber-600)]" aria-hidden="true" />,
      color: "bg-[var(--color-amber-100)]",
      borderColor: "hover:border-[var(--color-amber-500)]",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)]">
      <div className="flex flex-1 items-center justify-center p-4 py-12 sm:p-8">
        <div className="w-full max-w-2xl">
          <Link
            href={routes.authLogin}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-500)] hover:text-[var(--color-forest-900)]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke Login
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-forest-900)] sm:text-4xl">
              Pilih Peran Anda
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-600)]">
              PACUL menghubungkan tiga lapisan marketplace daur ulang. Pilih peran yang sesuai aktivitas Anda.
            </p>
          </div>

          <div className="grid gap-4">
            {roles.map((role) => (
              <Link
                key={role.id}
                href={`${routes.authRegister}?role=${role.id}`}
                className={`group flex items-center gap-5 rounded-2xl border border-[var(--color-line)] bg-white p-5 transition-all hover:shadow-md ${role.borderColor}`}
              >
                <div className={`flex size-14 shrink-0 items-center justify-center rounded-xl ${role.color}`}>
                  {role.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[var(--color-forest-900)] group-hover:text-[var(--color-leaf-700)]">
                    {role.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-500)]">{role.description}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-[var(--color-ink-300)] group-hover:translate-x-1 group-hover:text-[var(--color-leaf-600)]" />
              </Link>
            ))}
          </div>

          <p className="mt-8 rounded-xl border border-[var(--color-line)] bg-white p-4 text-sm text-[var(--color-ink-600)]">
            Untuk demo cepat, gunakan akun demo di halaman login: household1, collector1, atau industry1
            @pacul-demo.com dengan password PaculDemo2025!
          </p>
        </div>
      </div>
    </div>
  );
}
