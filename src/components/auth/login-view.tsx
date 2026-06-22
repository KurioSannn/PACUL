"use client";

import Link from "next/link";
import { ArrowLeft, Leaf, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { routes } from "@/lib/routes";

export function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@pacul.local");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API login
    setTimeout(() => {
      setIsLoading(false);
      // Hardcode redirection for demo
      router.push(routes.profile); // Or dashboard based on user
    }, 1500);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left section: Visual/Branding (hidden on very small screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-[var(--color-forest-900)] p-12 text-white lg:flex">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83v58.34h-58.34l-.83-.83L54.627 0zM27.314 0l.83.83v29.17h-29.17l-.83-.83L27.314 0zM54.627 27.314l.83.83v29.17h-29.17l-.83-.83L54.627 27.314z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />
        
        <div className="relative z-10">
          <Link href={routes.home} className="inline-flex items-center gap-2 rounded-xl p-1 font-semibold tracking-tight text-white hover:bg-white/10 transition-colors">
            <img src="/BISSMILAH MENANG fix.png" alt="PACUL Logo" className="h-8 w-auto object-contain brightness-0 invert" />
          </Link>
          <div className="mt-20 max-w-md">
            <h1 className="text-4xl font-bold leading-tight">Hubungkan kembali rantai daur ulang.</h1>
            <p className="mt-6 text-lg text-white/80 leading-relaxed">
              Masuk untuk melanjutkan aktivitas Anda di PACUL. Lacak material, kelola rute pickup, atau cek negosiasi terbaru Anda.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <Leaf className="size-6 text-[var(--color-mint-200)]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Platform Sirkular</p>
              <p className="text-sm text-white/70">Rumah Tangga • Pengepul • Industri</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right section: Form */}
      <div className="flex w-full flex-col justify-center bg-white p-6 sm:p-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex lg:hidden">
            <Link href={routes.home} className="inline-flex items-center gap-2 rounded-xl p-1 font-semibold tracking-tight text-[var(--color-forest-900)]">
              <img src="/BISSMILAH MENANG fix.png" alt="PACUL Logo" className="h-8 w-auto object-contain" />
            </Link>
          </div>

          <Link href={routes.home} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-500)] hover:text-[var(--color-forest-900)] transition-colors">
            <ArrowLeft className="size-4" aria-hidden="true" /> Kembali ke Beranda
          </Link>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Selamat Datang</h2>
            <p className="mt-2 text-sm text-[var(--color-ink-600)]">Masukkan email dan password untuk masuk ke akun Anda.</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--color-forest-900)]">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4 text-[var(--color-ink-900)] outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)] transition-all"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-[var(--color-forest-900)]">Password</label>
                <a href="#" className="text-xs font-semibold text-[var(--color-leaf-600)] hover:underline">Lupa password?</a>
              </div>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4 text-[var(--color-ink-900)] outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-forest-900)] px-4 font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-forest-800)] disabled:opacity-70"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--color-ink-600)]">
            Belum punya akun?{" "}
            <Link href={routes.authRole} className="font-semibold text-[var(--color-leaf-700)] hover:underline">
              Daftar sekarang
            </Link>
          </p>
          
          <div className="mt-8 rounded-xl bg-[var(--color-sage-50)] p-4 text-center border border-[var(--color-line)]">
            <p className="text-xs text-[var(--color-ink-500)]">
              <strong>Demo Status:</strong> Login tidak memvalidasi ke server. Klik "Masuk" untuk melanjutkan ke halaman Profil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
