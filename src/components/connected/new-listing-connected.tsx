"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Sparkles } from "lucide-react";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import {
  classifyWaste,
  createWasteListing,
  listWasteCategories,
  publishWasteListing,
  uploadWasteImage,
} from "@/lib/api";
import { routes } from "@/lib/routes";

function NewListingContent() {
  const router = useRouter();
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
  const [classificationId, setClassificationId] = useState<string | undefined>();
  const [imagePath, setImagePath] = useState<string | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ label: string; confidence: number } | null>(null);

  const handlePhoto = async (file: File) => {
    if (!accessToken) return;
    setError(null);
    setIsClassifying(true);
    setImagePreview(URL.createObjectURL(file));
    try {
      const uploaded = await uploadWasteImage(accessToken, file);
      setImagePath(uploaded.path);
      const classified = await classifyWaste(accessToken, uploaded.path);
      setClassificationId(classified.id);
      if (classified.db_category_id) setCategoryId(classified.db_category_id);
      setAiResult({ label: classified.top_class, confidence: classified.confidence });
      pushToast("Klasifikasi AI selesai.", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload atau klasifikasi gagal.");
      pushToast("Klasifikasi gagal. Anda masih bisa pilih kategori manual.", "error");
    } finally {
      setIsClassifying(false);
    }
  };

  const submit = async (publish: boolean) => {
    if (!accessToken || !categoryId || !title || !weight) {
      setError("Lengkapi judul, kategori, dan berat estimasi.");
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
        notes,
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
        description="Upload foto sampah, gunakan klasifikasi AI, tentukan berat dan lokasi pickup, lalu publikasikan listing."
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
          <h2 className="font-semibold text-[var(--color-forest-900)]">Foto dan klasifikasi AI</h2>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-line)] bg-[var(--color-sage-50)] p-8 hover:bg-[var(--color-mint-100)]">
            <Camera className="size-8 text-[var(--color-leaf-700)]" />
            <span className="mt-2 text-sm font-semibold">Unggah foto sampah</span>
            <span className="text-xs text-[var(--color-ink-500)]">JPG, PNG maks. 5 MB</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handlePhoto(file);
            }} />
          </label>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Pratinjau foto sampah" className="max-h-48 w-full rounded-xl object-cover" />
          ) : null}
          {isClassifying ? (
            <p className="flex items-center gap-2 text-sm text-[var(--color-ink-600)]">
              <Sparkles className="size-4 animate-pulse text-[var(--color-leaf-700)]" />
              Menganalisis foto...
            </p>
          ) : null}
          {aiResult ? (
            <div className="rounded-xl bg-[var(--color-mint-100)] p-4">
              <p className="text-xs font-bold uppercase text-[var(--color-leaf-700)]">Hasil klasifikasi AI</p>
              <p className="mt-1 text-lg font-semibold">{aiResult.label}</p>
              <p className="text-sm text-[var(--color-ink-600)]">
                Tingkat keyakinan: {Math.round(aiResult.confidence * 100)}%
              </p>
              <p className="mt-2 text-xs text-[var(--color-ink-500)]">
                Anda dapat mengubah kategori secara manual jika hasil tidak sesuai.
              </p>
            </div>
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
