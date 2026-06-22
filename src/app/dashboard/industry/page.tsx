import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockNegotiations, mockOrders, mockMaterialStocks } from "@/data/mock-pacul";
import { industryNavigation } from "@/lib/navigation";
import { formatCurrency, formatWeight } from "@/lib/format";
import { negotiationStatusLabels, orderStatusLabels, materialStatusLabels, wasteCategoryLabels } from "@/lib/constants";

export default function IndustryDashboardPage() {
  const order = mockOrders[0];
  const negotiation = mockNegotiations[0];
  const material = mockMaterialStocks[0];

  return (
    <DashboardShell activeHref="/dashboard/industry" sections={[industryNavigation]} roleLabel="Industri Pengolah" title="Dashboard industri" subtitle="Ringkasan marketplace bahan baku, negosiasi, dan transaksi mock untuk buyer.">
      <section className="dashboard-grid">
        <MetricCard label="Order aktif" value={orderStatusLabels[order.status]} hint="Pesanan masuk dan masih bergerak" />
        <MetricCard label="Negosiasi" value={negotiationStatusLabels[negotiation.status]} hint="Counter dan approval demo" />
        <MetricCard label="Stok tersedia" value={materialStatusLabels[material.status]} hint="Material siap dijual" />
      </section>
      <RoutePreview title="Buyer focus" badge="Industry" description="Ringkasan bahan baku yang akan dipesan oleh industri pengolah." list={[
        { label: "Material", value: material.materialName, helper: wasteCategoryLabels[material.category] },
        { label: "Harga", value: formatCurrency(material.pricePerKg), helper: `${formatWeight(material.weightKg)} stok` },
        { label: "Order", value: orderStatusLabels[order.status], helper: `${order.buyerName} · ${formatCurrency(order.totalPrice)}` },
      ]} />
    </DashboardShell>
  );
}