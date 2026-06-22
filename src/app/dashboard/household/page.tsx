import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockWasteListings } from "@/data/mock-pacul";
import { householdNavigation } from "@/lib/navigation";
import { formatWeight } from "@/lib/format";
import { wasteCategoryLabels, wasteListingStatusLabels } from "@/lib/constants";

export default function HouseholdDashboardPage() {
  const listing = mockWasteListings[0];

  return (
    <DashboardShell activeHref="/dashboard/household" sections={[householdNavigation]} roleLabel="Rumah Tangga" title="Dashboard rumah tangga" subtitle="Ringkasan untuk listing sampah, status pickup, dan alur demo yang siap dihubungkan ke backend." >
      <section className="dashboard-grid">
        <MetricCard label="Listing demo" value={`${mockWasteListings.length}`} hint="Data mock untuk alur rumah tangga" />
        <MetricCard label="Status aktif" value={wasteListingStatusLabels[listing.status]} hint="State listing terpilah" />
        <MetricCard label="Berat listing" value={formatWeight(listing.weightKg)} hint="Berat terkonfirmasi" />
      </section>
      <RoutePreview title="Listing highlight" badge="Household" description="Cuplikan listing terbaru yang akan mengalir ke pickup dan marketplace." list={[
        { label: "Judul", value: listing.title, helper: listing.address },
        { label: "Kategori", value: wasteCategoryLabels[listing.category], helper: `AI: ${(listing.aiConfidence ?? 0) * 100}%` },
        { label: "Status", value: wasteListingStatusLabels[listing.status], helper: listing.district },
      ]} />
    </DashboardShell>
  );
}