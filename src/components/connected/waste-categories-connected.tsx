"use client";

import { useAsyncData } from "@/hooks/use-async-data";
import { listWasteCategories } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";

export function WasteCategoriesConnected() {
  const categoriesQuery = useAsyncData(() => listWasteCategories(), []);

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Referensi"
        title="Kategori Sampah"
        description="Daftar jenis sampah terpilah yang didukung platform PACUL."
      />
      {categoriesQuery.isLoading ? <p className="text-sm">Memuat kategori...</p> : null}
      {categoriesQuery.error ? <p className="text-sm text-[var(--color-red-700)]">{categoriesQuery.error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-sage-50)] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Kode</th>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            {(categoriesQuery.data ?? []).map((cat) => (
              <tr key={cat.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3 font-mono text-xs">{cat.code}</td>
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-[var(--color-ink-600)]">{cat.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
