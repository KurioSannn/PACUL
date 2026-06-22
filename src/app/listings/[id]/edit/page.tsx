import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockWasteListings } from "@/data/mock-pacul";
import { wasteCategoryLabels } from "@/lib/constants";

type ListingEditPageProps = { params: Promise<{ id: string }> };

export default async function ListingEditPage({ params }: ListingEditPageProps) {
  const { id } = await params;
  const listing = mockWasteListings.find((item) => item.id === id) ?? mockWasteListings[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 2"
      title={`Edit listing ${listing.id}`}
      description="Halaman edit menyiapkan revisi kategori, berat, foto, dan status publish dengan state validasi yang jelas."
      statusLabel="Frontend foundation"
      primaryActionLabel="Simpan perubahan"
      secondaryActionLabel="Kembalikan draft"
      preview={<RoutePreview title="Edit preview" badge="Draft edit" description="Ringkasan field yang siap diperbarui." list={[
        { label: "Kategori saat ini", value: wasteCategoryLabels[listing.category], helper: listing.title },
        { label: "Alamat", value: listing.address, helper: listing.district },
        { label: "Status", value: listing.status, helper: "Revisi sebelum publish" },
      ]} />}
      previewTitle="Edit listing"
      previewDescription="Form edit tetap ringan dan tidak mengandalkan backend production pada block ini."
      states={[
        { variant: "loading", title: "Menyimpan revisi", description: "Perubahan listing sedang diproses." },
        { variant: "disabled", title: "Publish locked", description: "Publish final belum production.", actionLabel: "Nonaktif" },
      ]}
      checklist={["Edit listing page skeleton", "Validation state", "Integration note"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Perubahan listing masih mock. Update produksi dan storage foto akan dihubungkan di backend branch."
    />
  );
}