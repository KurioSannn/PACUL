import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-[var(--color-forest-900)]">Halaman tidak ditemukan</h1>
      <p className="max-w-md text-sm text-[var(--color-ink-600)]">
        URL yang Anda buka tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--color-forest-700)] px-4 py-2 text-sm font-semibold text-white"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
