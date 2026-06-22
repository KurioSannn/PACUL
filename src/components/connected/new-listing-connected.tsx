"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { WasteCameraScanner } from "@/components/classification/waste-camera-scanner";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { persistClientClassification } from "@/lib/ai/classification-pipeline";
import type { WasteClassificationResult } from "@/lib/ai/waste-ai-taxonomy";
import { wasteClassLabel } from "@/lib/ai/waste-ai-taxonomy";
import {
  createWasteListing,
  listWasteCategories,
  publishWasteListing,
} from "@/lib/api";
import type { WasteCategory } from "@/lib/api/types";
import { routes } from "@/lib/routes";

function resolveCategoryId(categories: WasteCategory[], topClass: string) {
  return categories.find((cat) => cat.ai_model_class === topClass)?.id ?? "";
}

function NewListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const categoriesQuery = useAsyncData(() => listWasteCategories(), []);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [weight, setWeight] = useState("");
  const [address, setAddress] = useState("Jl. Rungkut Asri Tengah No. 12");
  const [district, setDistrict] = useState("Rungkut");
  const [city, setCity] = useState("Surabaya");
  const [notes, setNotes] = useState("");
  const [imagePath, setImagePath] = useState<string | undefined>();
  const [classificationId, setClassificationId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<WasteClassificationResult | null>(null);

  useEffect(() => {
    const presetCategoryId = searchParams.get("categoryId");
    const presetClass = searchParams.get("category");
    if (presetCategoryId) {
      setCategoryId(presetCategoryId);
    } else if (presetClass && categoriesQuery.data) {
      const mapped = resolveCategoryId(categoriesQuery.data, presetClass);
      if (mapped) setCategoryId(mapped);
    }
  }, [searchParams, categoriesQuery.data]);

  const handleAiResult = async (result: WasteClassificationResult, file?: File) => {
    setAiResult(result);
    const mapped = resolveCategoryId(categoriesQuery.data ?? [], result.top_class);
    if (mapped) setCategoryId(mapped);
    if (!title.trim()) {
      setTitle(`${wasteClassLabel(result.top_class)} — listing`);
    }

    if (!accessToken || !file) return;
    setIsUploading(true);
    setError(null);
    try {
      const persisted = await persistClientClassification(accessToken, file, result);
      setImagePath(persisted.imagePath);
      setClassificationId(persisted.classification.id);
      if (persisted.categoryId) setCategoryId(persisted.categoryId);
      pushToast(
        `Klasifikasi AI tersimpan (${Math.round(result.confidence * 100)}% · ${result.inference_time_ms} ms).`,
        "success",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload atau simpan klasifikasi gagal.");
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async (publish: boolean) => {
    if (!accessToken || !categoryId || !title || !weight) {
      setError("Lengkapi judul, kategori, dan berat estimasi.");
      return;
    }
    if (!imagePath) {
      setError("Mohon scan atau unggah foto sampah terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const listing = await createWasteListing(accessToken, {
        category_id: categoryId,
        classification_id: classificationId,
        title,
        estimated_weight_kg: Number(weight),
        address,
        latitude: -7.3312,
        longitude: 112.7511,
        district,
        city,
        province: "Jawa Timur",
        notes: notes || (aiResult ? `AI: ${aiResult.top_class} (${Math.round(aiResult.confidence * 100)}%)` : undefined),
        imagePaths: imagePath ? [imagePath] : undefined,
      });
      if (publish) {
        await publishWasteListing(accessToken, listing.id);
        pushToast("Listing berhasil dipublikasikan.", "success");
      } else {
        pushToast("Listing disimpan sebagai draft.", "success");
      }
      router.push(routes.listingDetail(listing.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan listing.";
      setError(msg);
      pushToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell grow space-y-6 py-8">
      <PageHeader
        eyebrow="Rumah Tangga"
        title="Jual Sampah Terpilah"
        description="Scan kamera live atau unggah foto. TensorFlow.js MobileNet menganalisis pixel gambar untuk menentukan jenis sampah."
        backHref={routes.myMaterials}
        backLabel="Listing Saya"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--color-forest-900)]">Detail listing</h2>
          <label className="grid gap-2 text-sm font-semibold">
            Judul listing
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border border-[var(--color-line)] px-4 py-3" required placeholder="Contoh: Kardus bekas 5 kg" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Kategori sampah
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-xl border border-[var(--color-line)] px-4 py-3" required>
              <option value="">Pilih kategori</option>
              {(categoriesQuery.data ?? []).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Berat estimasi (kg)
            <input type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="rounded-xl border border-[var(--color-line)] px-4 py-3" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Alamat pickup
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl border border-[var(--color-line)] px-4 py-3" rows={2} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Kecamatan" className="rounded-xl border border-[var(--color-line)] px-4 py-3" />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kota" className="rounded-xl border border-[var(--color-line)] px-4 py-3" />
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Catatan tambahan
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl border border-[var(--color-line)] px-4 py-3" rows={2} placeholder="Kondisi sampah, jam pickup, dll." />
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[var(--color-leaf-600)]" />
            <h2 className="font-semibold text-[var(--color-forest-900)]">Kamera & Klasifikasi AI (TensorFlow.js)</h2>
          </div>
          <WasteCameraScanner onResult={(result, file) => void handleAiResult(result, file)} />
          {isUploading ? <p className="text-sm text-[var(--color-ink-600)]">Mengunggah foto & menyimpan hasil AI...</p> : null}
          {aiResult && !isUploading ? (
            <p className="text-xs text-[var(--color-ink-500)]">
              Kategori otomatis: {wasteClassLabel(aiResult.top_class)} ({Math.round(aiResult.confidence * 100)}% ·{" "}
              {aiResult.inference_time_ms} ms · TensorFlow.js). Ubah manual jika perlu.
            </p>
          ) : null}
          {error ? <p className="rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">{error}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={isSubmitting} onClick={() => void submit(false)} className="min-h-11 flex-1 rounded-xl border border-[var(--color-line)] font-semibold disabled:opacity-60">
              Simpan draft
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => void submit(true)} className="min-h-11 flex-1 rounded-xl bg-[var(--color-forest-900)] font-semibold text-white disabled:opacity-60">
              {isSubmitting ? "Menyimpan..." : "Publikasikan listing"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function NewListingConnected() {
  return (
    <RequireAuth roles={["household"]}>
      <NewListingContent />
    </RequireAuth>
  );
}
