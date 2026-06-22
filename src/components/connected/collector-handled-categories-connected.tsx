"use client";

import { useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { getHandledCategories, listWasteCategories, setHandledCategories } from "@/lib/api";

function CollectorHandledCategoriesContent() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);

  const categoriesQuery = useAsyncData(() => listWasteCategories(), []);
  const handledQuery = useAsyncData(
    () => getHandledCategories(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  useEffect(() => {
    if (handledQuery.data) {
      setSelected(handledQuery.data.map((cat) => cat.id));
    }
  }, [handledQuery.data]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async () => {
    if (!accessToken) return;
    try {
      await setHandledCategories(accessToken, selected);
      pushToast("Kategori ditangani berhasil disimpan.", "success");
      await handledQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal menyimpan kategori", "error");
    }
  };

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Pengepul"
        title="Kategori sampah ditangani"
        description="Pilih jenis sampah yang Anda tangani. Listing di marketplace akan difilter sesuai pilihan ini."
      />

      {categoriesQuery.isLoading ? <p className="text-sm">Memuat kategori...</p> : null}

      <section className="rounded-2xl border bg-white p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {(categoriesQuery.data ?? []).map((cat) => (
            <label
              key={cat.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-line)] p-4 hover:bg-[var(--color-sage-50)]"
            >
              <input
                type="checkbox"
                checked={selected.includes(cat.id)}
                onChange={() => toggle(cat.id)}
                className="mt-1"
              />
              <span>
                <span className="font-semibold text-[var(--color-forest-900)]">{cat.name}</span>
                {cat.description ? (
                  <span className="mt-1 block text-sm text-[var(--color-ink-600)]">{cat.description}</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void save()}
          className="mt-6 rounded-full bg-[var(--color-leaf-600)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Simpan preferensi
        </button>
      </section>
    </main>
  );
}

export function CollectorHandledCategoriesConnected() {
  return (
    <RequireAuth roles={["collector"]}>
      <CollectorHandledCategoriesContent />
    </RequireAuth>
  );
}
