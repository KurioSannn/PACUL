import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockRoutes } from "@/data/mock-pacul";
import { formatCurrency, formatWeight } from "@/lib/format";

export default function PickupOptimizerPage() {
  const route = mockRoutes[0];

  return (
    <RoutePage
      eyebrow="Bonus 1"
      title="Optimasi route pickup"
      description="Halaman bonus menyiapkan perbandingan rute normal dan rute teroptimasi tanpa algoritma produksi pada block ini."
      statusLabel="Frontend foundation"
      primaryActionLabel="Bandingkan route"
      secondaryActionLabel="Simpan preferensi"
      preview={<RoutePreview title="Optimized route preview" badge="Bonus demo" description="Perbandingan stop dan biaya untuk rute normal versus optimized." list={[
        { label: "Stop", value: `${route.stops.length} titik`, helper: route.title },
        { label: "Jarak normal", value: formatWeight(route.totalDistanceKm), helper: formatCurrency(route.estimatedCost) },
        { label: "Optimized", value: formatWeight(route.totalDistanceKm - 1.2), helper: `Estimasi hemat biaya ${formatCurrency(5000)}` },
      ]} note="Real route optimization integration pending." />}
      previewTitle="Route optimization"
      previewDescription="Data hanya placeholder; halaman ini memvisualkan perbandingan operasi agar bonus route mudah dikembangkan nanti."
      states={[
        { variant: "loading", title: "Menghitung route", description: "Optimasi demo sedang diproses." },
        { variant: "disabled", title: "Algoritma belum aktif", description: "Optimasi produksi belum dihubungkan.", actionLabel: "Pending" },
      ]}
      checklist={["Ordered pickup stops", "Distance estimate placeholder", "Cost estimate placeholder", "Normal vs optimized comparison"]}
      integrationLabel="Route optimization integration pending"
      integrationNote="Algoritma rute belum dibuat di block ini. Halaman hanya menandai titik integrasi dan placeholder perbandingan."
    />
  );
}