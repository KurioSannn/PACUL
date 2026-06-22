import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockWasteListings } from "@/data/mock-pacul";
import { formatWeight } from "@/lib/format";
import { wasteCategoryLabels, wasteListingStatusLabels } from "@/lib/constants";

export default function WasteMarketplacePage() {
  return (
    <RoutePage
      eyebrow="MVP Feature 2"
      title="Marketplace sampah terpilah"
      description="Halaman listing sampah menyiapkan CRUD, detail, dan edit alur rumah tangga tanpa backend production."
      statusLabel="Frontend foundation"
      primaryActionLabel="Tambah listing"
      secondaryActionLabel="Lihat master kategori"
      preview={<RoutePreview title="Listing preview" badge="Data demo MVP" description="Cuplikan listing yang akan dipakai oleh marketplace utama." table={{ headers: ["Judul", "Kategori", "Berat", "Status"], rows: mockWasteListings.map((item) => [item.title, wasteCategoryLabels[item.category], formatWeight(item.weightKg), wasteListingStatusLabels[item.status]]) }} />}
      previewTitle="Marketplace waste"
      previewDescription="Tampilan ini menyiapkan daftar listing, filtering sederhana, dan entry point ke detail listing."
      states={[
        { variant: "empty", title: "Belum ada listing", description: "Rumah tangga belum mengirim sampah terpilah ke marketplace.", actionLabel: "Tambah listing" },
        { variant: "loading", title: "Memuat listing", description: "Data demo sedang disiapkan." },
      ]}
      checklist={["Waste listing page skeleton", "Add listing page skeleton", "Detail listing page skeleton", "Edit listing page skeleton", "Data master category page skeleton"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Listing masih memakai mock data. CRUD produksi, storage foto, dan validasi backend akan dihubungkan nanti."
    />
  );
}