"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight, Home, Factory, Truck } from "lucide-react";

import { routes } from "@/lib/routes";

export function RoleSelectionView() {
  const roles = [
    {
      id: "household",
      title: "Rumah Tangga",
      description: "Buat listing sampah, jadwalkan pickup, dan dapatkan penghasilan dari daur ulang.",
      icon: <Home className="size-6 text-[var(--color-leaf-600)]" aria-hidden="true" />,
      color: "bg-[var(--color-mint-100)]",
      borderColor: "hover:border-[var(--color-leaf-500)]",
    },
    {
      id: "collector",
      title: "Pengepul / Mitra",
      description: "Ambil material dari rumah tangga, pilah, dan jual ke industri skala besar.",
      icon: <Truck className="size-6 text-[var(--color-blue-600)]" aria-hidden="true" />,
      color: "bg-[var(--color-blue-100)]",
      borderColor: "hover:border-[var(--color-blue-500)]",
    },
    {
      id: "industry",
      title: "Industri Pengolah",
      description: "Beli bahan baku daur ulang terpilah dalam jumlah besar secara konsisten.",
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
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-500)] hover:text-[var(--color-forest-900)] transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Kembali ke Login
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-forest-900)] sm:text-4xl">Pilih Peran Anda</h1>
            <p className="mt-3 text-base text-[var(--color-ink-600)] leading-relaxed">
              PACUL adalah ekosistem tiga lapis. Pilih peran yang paling sesuai dengan aktivitas Anda di rantai daur ulang ini.
            </p>
          </div>

          <div className="grid gap-4">
            {roles.map((role) => (
              <Link
                key={role.id}
                href={`${routes.authRegister}?role=${role.id}`}
                className={`group flex items-center gap-5 rounded-2xl border border-[var(--color-line)] bg-white p-5 transition-all duration-300 hover:shadow-md ${role.borderColor}`}
              >
                <div className={`flex size-14 shrink-0 items-center justify-center rounded-xl ${role.color}`}>
                  {role.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[var(--color-forest-900)] group-hover:text-[var(--color-leaf-700)] transition-colors">{role.title}</h2>
                  <p className="mt-1 text-sm text-[var(--color-ink-500)] leading-relaxed">{role.description}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-[var(--color-ink-300)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-leaf-600)]" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-[var(--color-mint-100)] p-4 flex items-start gap-3 border border-[var(--color-mint-200)]">
            <CheckCircle2 className="size-5 shrink-0 text-[var(--color-leaf-600)] mt-0.5" aria-hidden="true" />
            <p className="text-sm text-[var(--color-leaf-800)] leading-relaxed">
              <strong>Catatan Demo:</strong> Pada versi purwarupa ini, peran Rumah Tangga memiliki alur fitur paling lengkap. Anda dapat mencoba semua peran, namun disarankan mulai dari Rumah Tangga.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
