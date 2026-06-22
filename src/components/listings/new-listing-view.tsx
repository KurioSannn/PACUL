"use client";

import Link from "next/link";
import { ArrowLeft, Camera, ImagePlus, MapPin, Save, Send, Weight, Tag } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { wasteCategoryLabels } from "@/lib/constants";
import { routes } from "@/lib/routes";
import type { WasteCategory } from "@/types/pacul";

const categories: { value: WasteCategory; label: string }[] = Object.entries(wasteCategoryLabels).map(([k, v]) => ({ value: k as WasteCategory, label: v }));

export function NewListingView() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<WasteCategory | "">("");
  const [weight, setWeight] = useState("");
  const [address, setAddress] = useState("Jl. Rungkut Asri Tengah No. 12");
  const [district, setDistrict] = useState("Rungkut");
  const [note, setNote] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (draft: boolean) => {
    setIsDraft(draft);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(routes.myMaterials);
    }, 1500);
  };

  return (
    <div className="page-shell grow py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={routes.myMaterials} className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink-500)] hover:bg-[var(--color-sage-50)]">
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="sr-only">Kembali</span>
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Listing Baru</p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-2xl">Buat Listing Material</h1>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main form */}
        <div className="space-y-6">
          {/* Foto Upload */}
          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-4">Foto Material</h2>
            {photoPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-[var(--color-line)]">
                <img src={photoPreview} alt="Preview material" className="w-full h-60 object-cover" />
                <button type="button" onClick={() => setPhotoPreview(null)} className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[var(--color-red-600)] shadow-sm backdrop-blur-sm hover:bg-white">Hapus</button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--color-mint-200)] bg-[var(--color-sage-50)] p-10 text-center transition-colors hover:border-[var(--color-leaf-500)] hover:bg-[var(--color-mint-100)]/30">
                <ImagePlus className="size-10 text-[var(--color-leaf-600)]" aria-hidden="true" />
                <p className="text-sm font-semibold text-[var(--color-forest-900)]">Unggah Foto Material</p>
                <p className="text-xs text-[var(--color-ink-500)]">JPG, PNG, atau WebP. Maks 5MB.</p>
                <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
              </label>
            )}
            <div className="mt-3 flex gap-2">
              <Link href={routes.classificationDemo} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-4 py-2 text-xs font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]">
                <Camera className="size-3.5" aria-hidden="true" /> Klasifikasi AI
              </Link>
            </div>
          </section>

          {/* Detail Material */}
          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-4">Detail Material</h2>
            <div className="grid gap-5">
              <div>
                <label htmlFor="listing-title" className="block text-sm font-semibold text-[var(--color-forest-900)]">Judul Listing</label>
                <div className="relative mt-2">
                  <Tag className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-400)]" aria-hidden="true" />
                  <input id="listing-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Botol plastik PET bersih" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="listing-category" className="block text-sm font-semibold text-[var(--color-forest-900)]">Kategori</label>
                  <select id="listing-category" required value={category} onChange={(e) => setCategory(e.target.value as WasteCategory)} className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]">
                    <option value="">Pilih kategori</option>
                    {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="listing-weight" className="block text-sm font-semibold text-[var(--color-forest-900)]">Estimasi Berat (kg)</label>
                  <div className="relative mt-2">
                    <Weight className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-400)]" aria-hidden="true" />
                    <input id="listing-weight" type="number" step="0.1" min="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="listing-note" className="block text-sm font-semibold text-[var(--color-forest-900)]">Catatan Tambahan</label>
                <textarea id="listing-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Kondisi material, cara dikemas, dsb..." className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" />
              </div>
            </div>
          </section>

          {/* Alamat Pickup */}
          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)] mb-4">Alamat Pickup</h2>
            <div className="grid gap-5">
              <div>
                <label htmlFor="listing-address" className="block text-sm font-semibold text-[var(--color-forest-900)]">Alamat</label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-4 top-4 size-4 text-[var(--color-ink-400)]" aria-hidden="true" />
                  <textarea id="listing-address" rows={2} required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" />
                </div>
              </div>
              <div>
                <label htmlFor="listing-district" className="block text-sm font-semibold text-[var(--color-forest-900)]">Kecamatan</label>
                <input id="listing-district" type="text" required value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white focus:ring-2 focus:ring-[var(--color-mint-200)]" />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div>
          <div className="sticky top-[104px] rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-panel)] space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-500)]">Ringkasan</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-[var(--color-ink-500)]">Judul</dt><dd className="font-medium text-[var(--color-forest-900)] text-right truncate max-w-[180px]">{title || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-ink-500)]">Kategori</dt><dd className="font-medium text-[var(--color-forest-900)]">{category ? wasteCategoryLabels[category] : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-ink-500)]">Berat</dt><dd className="font-medium text-[var(--color-forest-900)]">{weight ? `${weight} kg` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-ink-500)]">Lokasi</dt><dd className="font-medium text-[var(--color-forest-900)] text-right truncate max-w-[180px]">{district || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-ink-500)]">Foto</dt><dd className="font-medium text-[var(--color-forest-900)]">{photoPreview ? "1 foto" : "Belum ada"}</dd></div>
            </dl>

            <div className="space-y-3 pt-2">
              <button type="button" onClick={() => handleSubmit(false)} disabled={isSubmitting || !title || !category || !weight} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-leaf-600)] px-4 font-semibold text-white hover:bg-[var(--color-leaf-700)] disabled:opacity-50">
                {isSubmitting && !isDraft ? "Mempublikasikan..." : <><Send className="size-4" aria-hidden="true" /> Publikasikan Listing</>}
              </button>
              <button type="button" onClick={() => handleSubmit(true)} disabled={isSubmitting || !title} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] bg-transparent px-4 font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)] disabled:opacity-50">
                {isSubmitting && isDraft ? "Menyimpan..." : <><Save className="size-4" aria-hidden="true" /> Simpan Draft</>}
              </button>
            </div>
            <p className="text-center text-[10px] text-[var(--color-ink-500)]">Data listing disimpan sebagai mock. Belum terkoneksi ke server.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
