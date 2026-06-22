import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";

export default function NewListingPage() {
  return (
    <RoutePage
      eyebrow="MVP Feature 2"
      title="Tambah listing sampah"
      description="Form add listing menyiapkan alur input data, preview foto, dan status draft sebelum diterbitkan."
      statusLabel="Frontend foundation"
      primaryActionLabel="Simpan draft"
      secondaryActionLabel="Publikasikan"
      preview={<RoutePreview title="Form create listing" badge="Draft" description="Preview field yang akan dipakai untuk membuat listing pertama." list={[
        { label: "Kategori", value: "Plastik", helper: "Master data kategori siap dipilih" },
        { label: "Berat", value: "12 kg", helper: "Validasi angka dan satuan" },
        { label: "Alamat", value: "Jl. Rungkut Industri IV", helper: "Lokasi pickup" },
        { label: "Foto", value: "Preview placeholder", helper: "Upload preview belum production" },
      ]} />}
      previewTitle="Create listing"
      previewDescription="Halaman ini dipakai untuk memulai listing baru dan menguji alur draft sebelum publish."
      states={[
        { variant: "loading", title: "Menyimpan draft", description: "Draft listing sedang diproses." },
        { variant: "error", title: "Validasi gagal", description: "Berat atau kategori belum lengkap." },
      ]}
      checklist={["Add listing page skeleton", "Draft and publish CTA", "Integration note"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Upload foto, submit listing, dan storage file masih mock. Final API akan disiapkan backend branch."
    />
  );
}