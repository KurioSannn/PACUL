"use client";

import Link from "next/link";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { getDashboardPath } from "@/lib/navigation";
import { routes } from "@/lib/routes";

export function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams?.get("role") || "household";
  const { signUp, accessToken, profile, isConfigured, isLoading: authLoading } = useAuth();
  const { pushToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleInfo = useMemo(() => {
    switch (roleId) {
      case "collector":
        return { title: "Pengepul", color: "text-[var(--color-blue-700)]", bg: "bg-[var(--color-blue-50)]" };
      case "industry":
        return { title: "Industri Pengolah", color: "text-[var(--color-amber-700)]", bg: "bg-[var(--color-amber-50)]" };
      default:
        return { title: "Rumah Tangga", color: "text-[var(--color-leaf-700)]", bg: "bg-[var(--color-mint-50)]" };
    }
  }, [roleId]);

  useEffect(() => {
    if (authLoading) return;
    if (accessToken && profile) {
      router.replace(getDashboardPath(profile.role));
      return;
    }
    if (accessToken && !profile) {
      router.replace(`${routes.authRole}?role=${roleId}`);
    }
  }, [accessToken, authLoading, profile, roleId, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConfigured) {
      setError("Supabase belum dikonfigurasi. Periksa file .env.local.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email.trim(), password);
      pushToast("Akun berhasil dibuat. Lengkapi profil Anda.", "success");
      router.push(`${routes.authRole}?role=${roleId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pendaftaran gagal. Coba lagi.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)]">
      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:py-12">
        <Link
          href={routes.authRole}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-500)] hover:text-[var(--color-forest-900)]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali pilih peran
        </Link>

        <div className="rounded-3xl border border-[var(--color-line)] bg-white p-6 sm:p-10 shadow-xl shadow-[var(--color-forest-900)]/5">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">
              Buat Akun PACUL
            </h1>
            <p className="mt-2 text-sm text-[var(--color-ink-600)]">
              Mendaftar sebagai{" "}
              <span className={`rounded px-2 py-0.5 font-semibold ${roleInfo.bg} ${roleInfo.color}`}>
                {roleInfo.title}
              </span>
            </p>
          </div>

          {error ? (
            <p className="mb-4 rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">
              {error}
            </p>
          ) : null}

          <form onSubmit={(e) => void handleRegister(e)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                Email
              </label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                Password
              </label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4"
                  placeholder="Minimal 8 karakter"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[var(--color-forest-900)]">
                Konfirmasi password
              </label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-ink-400)]" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-12 pr-4"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-forest-900)] font-semibold text-white disabled:opacity-70"
            >
              {isSubmitting ? "Memproses..." : "Daftar dan lanjut profil"}
            </button>

            <p className="text-center text-sm text-[var(--color-ink-600)]">
              Sudah punya akun?{" "}
              <Link href={routes.authLogin} className="font-semibold text-[var(--color-leaf-700)]">
                Masuk
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
