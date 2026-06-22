import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { wasteCategoryLabels } from "@/lib/constants";

export default function WasteCategoriesPage() {
  const rows = Object.values(wasteCategoryLabels).map((label) => [label, "Master data ready", "Frontend only"]);

  return (
    <RoutePage
      eyebrow="MVP Feature 2"
      title="Master kategori sampah"
      description="Data master kategori menyiapkan pilihan terstruktur agar listing, klasifikasi, dan material konsisten di seluruh role."
      statusLabel="Frontend foundation"
      primaryActionLabel="Tambah kategori"
      secondaryActionLabel="Import master"
      preview={<RoutePreview title="Category master" badge="Master data" description="Kategori yang dipakai oleh listing, AI, dan material stock." table={{ headers: ["Kategori", "Status", "Catatan"], rows }} />}
      previewTitle="Waste categories"
      previewDescription="Halaman ini adalah pusat vocabulary sampah yang dipakai lintas route."
      states={[
        { variant: "empty", title: "Belum ada kategori baru", description: "Master data memakai daftar kategori dasar MVP." , actionLabel: "Tambah kategori" },
      ]}
      checklist={["Data master category page skeleton", "Category mapping", "Integration note"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Master kategori masih disimpan sebagai kontrak frontend. Sinkronisasi schema final belum dibuat pada block ini."
    />
  );
}