import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockRoutes, mockMaterialStocks } from "@/data/mock-pacul";
import { collectorNavigation } from "@/lib/navigation";
import { formatCurrency, formatWeight } from "@/lib/format";
import { materialStatusLabels, pickupStatusLabels, wasteCategoryLabels } from "@/lib/constants";

export default function CollectorDashboardPage() {
  const route = mockRoutes[0];
  const material = mockMaterialStocks[0];

  return (
    <DashboardShell activeHref="/dashboard/collector" sections={[collectorNavigation]} roleLabel="Pengepul" title="Dashboard pengepul" subtitle="Ringkasan pickup, sorting, dan stok bahan baku untuk alur operasional.">
      <section className="dashboard-grid">
        <MetricCard label="Route terjadwal" value={pickupStatusLabels.scheduled} hint="Pickup demo siap diprioritaskan" />
        <MetricCard label="Stok bahan baku" value={materialStatusLabels[material.status]} hint="Bahan baku hasil pilah" />
        <MetricCard label="Harga acuan" value={formatCurrency(material.pricePerKg)} hint="Mock price per kg" />
      </section>
      <RoutePreview title="Route pickup" badge="Collector" description="Cuplikan rute demo yang memadukan jarak, biaya, dan titik berhenti." timeline={route.stops.map((stop) => ({ title: stop.title, detail: `${stop.district} · ${formatWeight(stop.distanceKm)} jarak`, status: pickupStatusLabels[stop.status] }))} note={`Total estimasi ${formatWeight(route.totalDistanceKm)} · biaya ${formatCurrency(route.estimatedCost)}`} />
      <RoutePreview title="Material stock" badge="Demo stock" description="Bahan baku awal untuk menguji alur jual beli dari hasil sorting." list={[
        { label: "Material", value: material.materialName, helper: wasteCategoryLabels[material.category] },
        { label: "Stok", value: formatWeight(material.weightKg), helper: material.location },
        { label: "Status", value: materialStatusLabels[material.status], helper: `Asal listing ${material.sourceWasteListingId ?? "-"}` },
      ]} />
    </DashboardShell>
  );
}