"use client";

import Link from "next/link";
import { ArrowLeft, Leaf, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { demoAccounts, defaultDemoPassword } from "@/lib/labels";
import { getDashboardPath } from "@/lib/navigation";
import { routes } from "@/lib/routes";

const LOGIN_DESCRIPTION =
  "Masuk dengan akun Supabase untuk mengakses listing, pickup, marketplace material, negosiasi, dan dashboard PACUL.";

const SUPABASE_CONFIG_MESSAGE =
  "Supabase belum dikonfigurasi. Salin .env.local.example ke .env.local, isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY, lalu restart dev server.";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const {
    signIn,
    error: authError,
    clearError,
    isConfigured,
    profile,
    accessToken,
    isLoading: authLoading,
  } = useAuth();

  const [email, setEmail] = useState<string>(demoAccounts[0].email);
  const [password, setPassword] = useState(defaultDemoPassword);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading || !accessToken) return;
    if (profile) {
      router.replace(getDashboardPath(profile.role));
      return;
    }
    router.replace(routes.authRole);
  }, [mounted, authLoading, accessToken, profile, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login gagal. Periksa email dan password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError =
    localError ??
    authError ??
    (sessionExpired ? "Sesi login habis. Silakan masuk kembali dengan akun demo." : null);
  const showConfigWarning = mounted && !isConfigured;

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-[var(--color-forest-900)] p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83v58.34h-58.34l-.83-.83L54.627 0zM27.314 0l.83.83v29.17h-29.17l-.83-.83L27.314 0zM54.627 27.314l.83.83v29.17h-29.17l-.83-.83L54.627 27.314z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10">
          <Link
            href={routes.home}
            className="inline-flex items-center gap-2 rounded-xl p-1 font-semibold tracking-tight text-white transition-colors hover:bg-white/10"
          >
            <img
              src="/BISSMILAH MENANG fix.png"
              alt="PACUL Logo"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </Link>
          <div className="mt-20 max-w-md">
            <h1 className="text-4xl font-bold leading-tight">Hubungkan kembali rantai daur ulang.</h1>
            <p className="mt-6 text-lg leading-relaxed text-white/80">{LOGIN_DESCRIPTION}</p>
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

      <div className="flex w-full flex-col justify-center bg-white p-6 sm:p-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex lg:hidden">
            <Link
              href={routes.home}
              className="inline-flex items-center gap-2 rounded-xl p-1 font-semibold tracking-tight text-[var(--color-forest-900)]"
            >
              <img src="/BISSMILAH MENANG fix.png" alt="PACUL Logo" className="h-8 w-auto object-contain" />
            </Link>
          </div>

          <Link
            href={routes.home}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-500)] transition-colors hover:text-[var(--color-forest-900)]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Kembali ke Beranda
          </Link>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">
              Selamat Datang
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-600)]">{LOGIN_DESCRIPTION}</p>
          </div>

          {showConfigWarning ? (
            <p className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">
              {SUPABASE_CONFIG_MESSAGE}
            </p>
          ) : null}

          {displayError ? (
            <p className="mt-4 rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">
              {displayError}
            </p>
          ) : null}

          <form onSubmit={(e) => void handleLogin(e)} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                Email
              </label>
              <div className="relative mt-2">
                <Mail
                  className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4 text-[var(--color-ink-900)] outline-none transition-all focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                Password
              </label>
              <div className="relative mt-2">
                <Lock
                  className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4 text-[var(--color-ink-900)] outline-none transition-all focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-forest-900)] px-4 font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-forest-800)] disabled:opacity-70"
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--color-ink-600)]">
            Belum punya akun?{" "}
            <Link href={routes.authRole} className="font-semibold text-[var(--color-leaf-700)] hover:underline">
              Daftar sekarang
            </Link>
          </p>

          <div className="mt-8 rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-500)]">
              Akun demo (setelah seed)
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-700)]">
              {demoAccounts.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(defaultDemoPassword);
                    }}
                    className="text-left font-medium text-[var(--color-leaf-700)] hover:underline"
                  >
                    {account.label}
                  </button>
                  <span className="block text-xs text-[var(--color-ink-500)]">{account.email}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[var(--color-ink-500)]">Password demo: {defaultDemoPassword}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
