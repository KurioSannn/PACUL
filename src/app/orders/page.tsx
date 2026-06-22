import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockOrders } from "@/data/mock-pacul";
import { formatCurrency, formatWeight } from "@/lib/format";
import { orderStatusLabels } from "@/lib/constants";

export default function OrdersPage() {
  const order = mockOrders[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 6"
      title="Order dan transaksi"
      description="Daftar order menyiapkan alur request, approval, dan status transaksi tanpa implementasi payment production."
      statusLabel="Data demo MVP"
      primaryActionLabel="Buat order"
      secondaryActionLabel="Lihat negosiasi"
      preview={<RoutePreview title="Order list" badge="Orders" description="Preview pesanan yang akan dipakai untuk buyer dan supplier." list={[
        { label: "Buyer", value: order.buyerName, helper: order.supplierName },
        { label: "Material", value: order.materialName, helper: formatWeight(order.totalKg) },
        { label: "Status", value: orderStatusLabels[order.status], helper: formatCurrency(order.totalPrice) },
      ]} />}
      previewTitle="Order list"
      previewDescription="Order list dipakai sebagai entry point untuk negosiasi dan transaksi material."
      states={[
        { variant: "empty", title: "Belum ada order", description: "Pesanan belum dibuat oleh industri.", actionLabel: "Buat order" },
      ]}
      checklist={["Order list skeleton", "Order request skeleton", "Negosiasi list skeleton", "Transaction detail skeleton"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Order production, payment, dan shipment handling masih ditandai pending pada block ini."
    />
  );
}