import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";

export default function NewReviewPage() {
  return (
    <RoutePage
      eyebrow="Bonus 4"
      title="Tulis review baru"
      description="Form rating menyiapkan input sederhana untuk menilai pickup, material, atau transaksi dari tiga role utama."
      statusLabel="Frontend foundation"
      primaryActionLabel="Kirim review"
      secondaryActionLabel="Simpan draft"
      preview={<RoutePreview title="Rating form" badge="Review" description="Preview form penilaian dan komentar singkat." list={[
        { label: "Target", value: "Pengepul Sidoarjo", helper: "Role-based review card" },
        { label: "Rating", value: "4.8", helper: "Skala 1-5" },
        { label: "Komentar", value: "Pickup tepat waktu", helper: "Submitted state pending" },
      ]} />}
      previewTitle="Rating form"
      previewDescription="Form ini hanya menyiapkan struktur UX dan tidak mengirim data produksi."
      states={[
        { variant: "loading", title: "Menyimpan review", description: "Review demo sedang diproses." },
        { variant: "disabled", title: "Submitted locked", description: "Submit final belum aktif.", actionLabel: "Disabled" },
      ]}
      checklist={["Rating form placeholder", "Role-based review cards", "Submitted disabled state"]}
      integrationLabel="Review integration pending"
      integrationNote="Submit ulasan dan moderasi produksi belum dihubungkan di block ini."
    />
  );
}