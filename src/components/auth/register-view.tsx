"use client";

import Link from "next/link";
import { ArrowLeft, User, Mail, Lock, Phone, MapPin, Upload } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { routes } from "@/lib/routes";

export function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams?.get("role") || "household";
  
  const [isLoading, setIsLoading] = useState(false);

  const roleInfo = useMemo(() => {
    switch (roleId) {
      case "collector": return { title: "Daftar sebagai Pengepul", color: "text-[var(--color-blue-700)]", bg: "bg-[var(--color-blue-50)]" };
      case "industry": return { title: "Daftar sebagai Industri", color: "text-[var(--color-amber-700)]", bg: "bg-[var(--color-amber-50)]" };
      default: return { title: "Daftar sebagai Rumah Tangga", color: "text-[var(--color-leaf-700)]", bg: "bg-[var(--color-mint-50)]" };
    }
  }, [roleId]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API register
    setTimeout(() => {
      setIsLoading(false);
      // Hardcode redirection for demo
      router.push(routes.profile);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)]">
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <Link href={routes.authRole} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-500)] hover:text-[var(--color-forest-900)] transition-colors">
          <ArrowLeft className="size-4" aria-hidden="true" /> Kembali pilih peran
        </Link>

        <div className="rounded-3xl border border-[var(--color-line)] bg-white p-6 sm:p-10 shadow-xl shadow-[var(--color-forest-900)]/5">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Lengkapi Profil Anda</h1>
            <p className="mt-2 text-sm text-[var(--color-ink-600)]">
              Mendaftar sebagai <span className={`font-semibold px-2 py-0.5 rounded ${roleInfo.bg} ${roleInfo.color}`}>{roleInfo.title.replace("Daftar sebagai ", "")}</span>
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-8">
            {/* Section 1: Data Akun */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] border-b border-[var(--color-line)] pb-3 mb-4">Data Akun</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Nama Lengkap / Instansi</label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" aria-hidden="true" />
                    <input type="text" required className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4 text-[var(--color-ink-900)] outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" placeholder="Contoh: Budi Santoso" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Nomor HP (WhatsApp)</label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" aria-hidden="true" />
                    <input type="tel" required className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4 text-[var(--color-ink-900)] outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" placeholder="0812xxxx" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Email</label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" aria-hidden="true" />
                    <input type="email" required className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4 text-[var(--color-ink-900)] outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" placeholder="nama@email.com" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Password</label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" aria-hidden="true" />
                    <input type="password" required className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4 text-[var(--color-ink-900)] outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" placeholder="Minimal 8 karakter" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Alamat */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] border-b border-[var(--color-line)] pb-3 mb-4">Lokasi & Alamat Utama</h2>
              <div className="grid gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Alamat Lengkap</label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-4 top-4 size-5 text-[var(--color-ink-400)]" aria-hidden="true" />
                    <textarea required rows={3} className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4 text-[var(--color-ink-900)] outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" placeholder="Nama jalan, nomor rumah, RT/RW..." />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Kecamatan</label>
                    <input type="text" required className="mt-2 block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3 text-[var(--color-ink-900)] outline-none focus:border-[var(--color-leaf-500)] focus:bg-white" placeholder="Contoh: Rungkut" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-forest-900)]">Kota/Kabupaten</label>
                    <input type="text" required className="mt-2 block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3 text-[var(--color-ink-900)] outline-none focus:border-[var(--color-leaf-500)] focus:bg-white" placeholder="Contoh: Surabaya" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Verifikasi Tambahan (untuk Pengepul/Industri) */}
            {(roleId === "collector" || roleId === "industry") && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] border-b border-[var(--color-line)] pb-3 mb-4">Verifikasi Identitas Bisnis (KYC)</h2>
                <div className="rounded-xl border border-dashed border-[var(--color-mint-200)] bg-[var(--color-sage-50)] p-6 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--color-mint-100)] text-[var(--color-leaf-600)] mb-3">
                    <Upload className="size-6" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-forest-900)]">Unggah Dokumen Verifikasi</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-500)]">KTP penanggung jawab atau NIB/SIUP untuk verifikasi. (Demo: Boleh dikosongkan)</p>
                  <button type="button" className="mt-4 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-mint-50)]">
                    Pilih File...
                  </button>
                </div>
              </section>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-forest-900)] px-4 font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-forest-800)] disabled:opacity-70"
              >
                {isLoading ? "Memproses..." : "Buat Akun Sekarang"}
              </button>
              <p className="mt-4 text-center text-xs text-[var(--color-ink-500)]">
                Dengan mendaftar, Anda menyetujui Syarat & Ketentuan serta Kebijakan Privasi PACUL.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
