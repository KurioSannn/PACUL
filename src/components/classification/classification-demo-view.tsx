"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { WasteCameraScanner } from "@/components/classification/waste-camera-scanner";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { persistClientClassification } from "@/lib/ai/classification-pipeline";
import { useAsyncData } from "@/hooks/use-async-data";
import type { WasteClassificationResult } from "@/lib/ai/waste-ai-taxonomy";
import { listWasteCategories } from "@/lib/api";
import { routes } from "@/lib/routes";

function ClassificationDemoContent() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const categoriesQuery = useAsyncData(() => listWasteCategories(), []);
  const [lastResult, setLastResult] = useState<WasteClassificationResult | null>(null);
  const [savedClassificationId, setSavedClassificationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categoryId = lastResult
    ? (categoriesQuery.data ?? []).find((c) => c.ai_model_class === lastResult.top_class)?.id
    : undefined;

  const handleResult = async (result: WasteClassificationResult, file?: File) => {
    setLastResult(result);
    setSavedClassificationId(null);
    if (!accessToken || !file) return;
    setIsSaving(true);
    try {
      const persisted = await persistClientClassification(accessToken, file, result);
      setSavedClassificationId(persisted.classification.id);
      pushToast("Hasil AI tersimpan ke server.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal menyimpan hasil AI.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Rumah Tangga · AI/ML"
        title="Klasifikasi Jenis Sampah — Kamera Live"
        description="Computer vision berjalan di browser (TensorFlow.js + MobileNet v2). Model membaca pixel foto/kamera secara real-time, bukan simulasi dummy."
        backHref={routes.listingsNew}
        backLabel="Form Jual Sampah"
      />

      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm text-[var(--color-ink-600)]">
          <p className="flex items-center gap-2 font-semibold text-[var(--color-forest-900)]">
            <Sparkles className="size-4 text-[var(--color-leaf-600)]" />
            Model: TensorFlow.js MobileNet v2 (transfer learning mapping → taksonomi sampah)
          </p>
          <p className="mt-2">
            Aktifkan <strong>Live Scan</strong> untuk deteksi otomatis setiap 2 detik, atau tekan <strong>Scan Sekarang</strong> sekali jepret.
            Hasil bersifat rekomendasi — koreksi manual tetap tersedia di form listing.
          </p>
        </div>

        <WasteCameraScanner onResult={(result, file) => void handleResult(result, file)} />

        {isSaving ? <p className="text-sm text-[var(--color-ink-600)]">Menyimpan hasil ke server...</p> : null}
        {savedClassificationId ? (
          <p className="text-xs text-[var(--color-leaf-700)]">
            Klasifikasi tersimpan (ID: {savedClassificationId.slice(0, 8)}…)
          </p>
        ) : null}

        {lastResult ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `${routes.listingsNew}?category=${encodeURIComponent(lastResult.top_class)}${categoryId ? `&categoryId=${categoryId}` : ""}`,
                )
              }
              className="rounded-full bg-[var(--color-forest-900)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Lanjut Buat Listing
            </button>
            <Link href={routes.listingsNew} className="rounded-full border px-5 py-2.5 text-sm font-semibold">
              Ke form listing
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export function ClassificationDemoView() {
  return (
    <RequireAuth roles={["household"]}>
      <ClassificationDemoContent />
    </RequireAuth>
  );
}
