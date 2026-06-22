import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockWasteListings, mockMaterialStocks, mockRoutes } from "@/data/mock-pacul";
import { formatWeight } from "@/lib/format";

export default function ImpactPage() {
  return (
    <RoutePage
      eyebrow="Bonus 5"
      title="Impact dashboard"
      description="Dashboard dampak menampilkan metrik operasional dengan label demo data, bukan chart dekoratif tanpa konteks."
      statusLabel="Data demo"
      primaryActionLabel="Lihat ringkasan"
      secondaryActionLabel="Buka reports"
      preview={<RoutePreview title="Impact metrics" badge="No decorative chart" description="Ringkasan metrik utama dari mock data PACUL." list={[
        { label: "Listing", value: `${mockWasteListings.length}`, helper: "Demo volume" },
        { label: "Material", value: formatWeight(mockMaterialStocks[0].weightKg), helper: "Recovered material" },
        { label: "Route", value: formatWeight(mockRoutes[0].totalDistanceKm), helper: "Pickup distance" },
      ]} />}
      previewTitle="Impact dashboard"
      previewDescription="Metrik dibuat untuk operasional dan review demo, bukan sekadar menghias layar."
      states={[
        { variant: "empty", title: "Belum ada metrik", description: "Data dampak belum terkumpul.", actionLabel: "Refresh" },
      ]}
      checklist={["Impact metrics", "Material recovery summary", "Data demo label"]}
      integrationLabel="Analytics integration pending"
      integrationNote="Dashboard dampak masih mock. Sumber analytics produksi belum dihubungkan pada block ini."
    />
  );
}