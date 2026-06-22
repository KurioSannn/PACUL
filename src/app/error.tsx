"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleRetry = () => {
    if (typeof reset === "function") {
      reset();
      return;
    }

    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-[var(--color-forest-900)]">Terjadi kesalahan</h1>
      <p className="max-w-md text-sm text-[var(--color-ink-600)]">
        Halaman gagal dimuat. Coba muat ulang atau kembali ke beranda.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleRetry}
          className="rounded-lg bg-[var(--color-forest-700)] px-4 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
        <a
          href="/"
          className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-forest-900)]"
        >
          Beranda
        </a>
      </div>
    </div>
  );
}
