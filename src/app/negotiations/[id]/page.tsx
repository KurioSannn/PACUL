import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockNegotiations } from "@/data/mock-pacul";
import { formatCurrency } from "@/lib/format";
import { negotiationStatusLabels } from "@/lib/constants";

type NegotiationDetailPageProps = { params: Promise<{ id: string }> };

export default async function NegotiationDetailPage({ params }: NegotiationDetailPageProps) {
  const { id } = await params;
  const negotiation = mockNegotiations.find((item) => item.id === id) ?? mockNegotiations[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 6"
      title={`Negosiasi ${negotiation.id}`}
      description="Detail negosiasi menyiapkan riwayat counter, approval, dan hubungan ke chat produksi."
      statusLabel="Data demo MVP"
      primaryActionLabel="Buka chat"
      secondaryActionLabel="Setujui counter"
      preview={<RoutePreview title="Negotiation detail" badge="Counter" description="Preview ringkas untuk satu negosiasi." list={[
        { label: "Buyer", value: negotiation.buyerName, helper: negotiation.orderId },
        { label: "Supplier", value: negotiation.supplierName, helper: formatCurrency(negotiation.offeredPricePerKg) },
        { label: "Counter", value: formatCurrency(negotiation.counterPricePerKg ?? 0), helper: negotiationStatusLabels[negotiation.status] },
      ]} />}
      previewTitle="Negotiation detail"
      previewDescription="View ini akan dipakai untuk mengikat histori negosiasi ke chat dan transaksi."
      states={[
        { variant: "empty", title: "Negosiasi tidak ditemukan", description: "Gunakan id demo untuk membuka detail negosiasi.", actionLabel: "Kembali" },
      ]}
      checklist={["Negotiation detail skeleton", "Counter offer placeholder", "Integration note"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Negosiasi detail masih mock. History, approval, dan audit trail produksi belum tersedia di block ini."
    />
  );
}