import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockWasteListings, mockMaterialStocks, mockOrders, mockNegotiations, mockDeployReadiness } from "@/data/mock-pacul";
import { dashboardNavigation } from "@/lib/navigation";

export default function DashboardPage() {
  return (
    <DashboardShell
      activeHref="/dashboard"
      sections={dashboardNavigation}
      roleLabel="Global overview"
      title="Dashboard PACUL"
      subtitle="Dashboard ini menyiapkan ringkasan lintas role, status mock data, dan titik masuk ke route MVP serta bonus."
    >
      <section className="dashboard-grid">
        <MetricCard label="Listing aktif" value={`${mockWasteListings.length}`} hint="Data demo untuk alur listing sampah" />
        <MetricCard label="Material stock" value={`${mockMaterialStocks.length}`} hint="Bahan baku hasil pilah tersedia" />
        <MetricCard label="Order negosiasi" value={`${mockOrders.length}`} hint="Pesanan yang masih bergerak" />
        <MetricCard label="Negosiasi aktif" value={`${mockNegotiations.length}`} hint="Counter dan approval pending" />
      </section>

      <RoutePreview
        title="Route map snapshot"
        badge="Demo data"
        description="Cuplikan route yang sudah disiapkan agar dashboard tidak terasa kosong."
        list={mockDeployReadiness.slice(0, 3).map((item) => ({ label: item.label, value: item.status, helper: item.note }))}
      />
    </DashboardShell>
  );
}