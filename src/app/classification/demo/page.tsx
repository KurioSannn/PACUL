import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockClassificationDemo } from "@/data/mock-pacul";
import { wasteCategoryLabels } from "@/lib/constants";

export default function ClassificationDemoPage() {
  return (
    <RoutePage
      eyebrow="MVP Feature 4"
      title="Demo klasifikasi foto sampah"
      description="Halaman ini menyiapkan upload preview, confidence score, dan override manual tanpa mengaktifkan model AI production."
      statusLabel="Data demo MVP"
      primaryActionLabel="Upload foto demo"
      secondaryActionLabel="Override kategori"
      preview={<RoutePreview title="AI prediction card" badge="AI model pending" description="Prediksi demo dan confidence score yang bisa dipakai untuk validasi UX." list={[
        { label: "Prediksi AI", value: wasteCategoryLabels[mockClassificationDemo.predictedCategory], helper: `${(mockClassificationDemo.confidence * 100).toFixed(0)}% confidence` },
        { label: "Override manual", value: mockClassificationDemo.manualOverride ?? "Belum dipilih", helper: "User tetap bisa koreksi hasil AI" },
        { label: "Status", value: mockClassificationDemo.status, helper: "Low confidence dan failed state tersedia" },
      ]} />}
      previewTitle="Classification demo"
      previewDescription="Upload preview hanya placeholder. Model produksi dan penilaian confidence final akan dihubungkan backend branch."
      states={[
        { variant: "loading", title: "Menganalisis foto", description: "Model demo sedang memproses gambar." },
        { variant: "error", title: "Gambar tidak valid", description: "File belum lolos validasi mock." },
        { variant: "empty", title: "Belum ada foto", description: "Unggah gambar sampah untuk melihat hasil demo.", actionLabel: "Upload foto" },
      ]}
      checklist={["Upload preview placeholder", "AI prediction card", "Confidence score placeholder", "Manual category override placeholder"]}
      integrationLabel="AI model integration pending"
      integrationNote="Klasifikasi masih demo. Model AI production, confidence real, dan fallback handling akan datang dari backend branch."
    />
  );
}