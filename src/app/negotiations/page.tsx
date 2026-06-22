import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockNegotiations } from "@/data/mock-pacul";
import { formatCurrency } from "@/lib/format";
import { negotiationStatusLabels } from "@/lib/constants";

export default function NegotiationsPage() {
  const negotiation = mockNegotiations[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 6"
      title="Negosiasi harga"
      description="Daftar negosiasi menyiapkan alur counter offer, approval, dan histori tanpa realtime production."
      statusLabel="Data demo MVP"
      primaryActionLabel="Buka chat"
      secondaryActionLabel="Tanggapi counter"
      preview={<RoutePreview title="Negotiation list" badge="Negotiation" description="Ringkasan counter offer dan status pembicaraan." list={[
        { label: "Buyer", value: negotiation.buyerName, helper: negotiation.supplierName },
        { label: "Offer", value: formatCurrency(negotiation.offeredPricePerKg), helper: `Counter ${formatCurrency(negotiation.counterPricePerKg ?? 0)}` },
        { label: "Status", value: negotiationStatusLabels[negotiation.status], helper: negotiation.orderId },
      ]} />}
      previewTitle="Negotiation list"
      previewDescription="Halaman ini menyiapkan percakapan harga dan detail negosiasi untuk buyer dan supplier."
      states={[
        { variant: "empty", title: "Belum ada negosiasi", description: "Tidak ada counter offer yang berjalan.", actionLabel: "Mulai negosiasi" },
      ]}
      checklist={["Negotiation list skeleton", "Negotiation detail skeleton", "Chat entry point"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Negosiasi masih mock. History, messaging realtime, dan state update produksi belum diaktifkan."
    />
  );
}