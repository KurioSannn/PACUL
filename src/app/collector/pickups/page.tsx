import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockWasteListings } from "@/data/mock-pacul";
import { formatWeight } from "@/lib/format";
import { wasteListingStatusLabels } from "@/lib/constants";

export default function CollectorPickupsPage() {
  return (
    <RoutePage
      eyebrow="MVP Feature 5"
      title="Pickup tersedia"
      description="Pengepul melihat daftar pickup yang menunggu, lengkap dengan status, lokasi, dan ringkasan cepat."
      statusLabel="Data demo MVP"
      primaryActionLabel="Ambil pickup"
      secondaryActionLabel="Lihat sorting"
      preview={<RoutePreview title="Pickup management" badge="Collector" description="Preview daftar pickup yang akan dikelola oleh pengepul." table={{ headers: ["Listing", "Berat", "Status"], rows: mockWasteListings.map((item) => [item.title, formatWeight(item.weightKg), wasteListingStatusLabels[item.status]]) }} />}
      previewTitle="Pickup management"
      previewDescription="Halaman ini menyiapkan daftar pickup dan aksi cepat untuk alur operasional pengepul."
      states={[
        { variant: "empty", title: "Belum ada pickup", description: "Tidak ada pickup yang menunggu pada demo ini.", actionLabel: "Refresh" },
      ]}
      checklist={["Pickup management skeleton", "Source listing to material trace skeleton", "Integration note"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Pickup management masih mock. Relasi pickup, assignment driver, dan status update real-time belum dihubungkan."
    />
  );
}