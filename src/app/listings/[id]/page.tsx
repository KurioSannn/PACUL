import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockWasteListings } from "@/data/mock-pacul";
import { formatWeight } from "@/lib/format";
import { wasteCategoryLabels, wasteListingStatusLabels } from "@/lib/constants";

type ListingDetailPageProps = { params: Promise<{ id: string }> };

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const listing = mockWasteListings.find((item) => item.id === id) ?? mockWasteListings[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 2"
      title={`Detail listing ${listing.id}`}
      description="Detail listing menyiapkan view satu item beserta status perpindahan material dari rumah tangga ke pengepul."
      statusLabel="Data demo MVP"
      primaryActionLabel="Edit listing"
      secondaryActionLabel="Buat pickup"
      preview={<RoutePreview title="Listing detail" badge="Listing" description="Ringkasan metadata listing untuk proses review dan pickup." list={[
        { label: "Judul", value: listing.title, helper: listing.householdName },
        { label: "Kategori", value: wasteCategoryLabels[listing.category], helper: `AI confidence ${(listing.aiConfidence ?? 0) * 100}%` },
        { label: "Berat", value: formatWeight(listing.weightKg), helper: listing.address },
        { label: "Status", value: wasteListingStatusLabels[listing.status], helper: listing.district },
      ]} />}
      previewTitle="Listing detail"
      previewDescription="View ini akan dipakai untuk review data, pickup trigger, dan navigasi ke edit listing."
      states={[
        { variant: "empty", title: "Listing tidak ditemukan", description: "Gunakan id demo untuk melihat detail listing." , actionLabel: "Kembali" },
      ]}
      checklist={["Detail listing page skeleton", "Status badge", "Integration note"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Detail listing masih mock. Fetch data real, foto, dan log status akan datang dari backend branch."
    />
  );
}