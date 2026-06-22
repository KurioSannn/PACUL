import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockNegotiations } from "@/data/mock-pacul";
import { formatCurrency } from "@/lib/format";

type NegotiationChatPageProps = { params: Promise<{ id: string }> };

export default async function NegotiationChatPage({ params }: NegotiationChatPageProps) {
  const { id } = await params;
  const negotiation = mockNegotiations.find((item) => item.id === id) ?? mockNegotiations[0];

  return (
    <RoutePage
      eyebrow="Bonus 2"
      title={`Chat negosiasi ${negotiation.id}`}
      description="Layout chat realtime menyiapkan history pesan, offer bubble, typing state, dan reconnecting state pending."
      statusLabel="Realtime integration pending"
      primaryActionLabel="Kirim pesan"
      secondaryActionLabel="Kirim penawaran"
      preview={<RoutePreview title="Chat layout" badge="Realtime demo" description="Daftar pesan placeholder untuk negosiasi harga." timeline={[
        { title: negotiation.buyerName, detail: `Offer awal ${formatCurrency(negotiation.offeredPricePerKg)}` , status: "Offer message" },
        { title: negotiation.supplierName, detail: `Counter ${formatCurrency(negotiation.counterPricePerKg ?? 0)}`, status: "Counter message" },
        { title: "System", detail: "Typing dan reconnecting state disiapkan sebagai placeholder.", status: "Pending" },
      ]} note="Realtime integration pending." />}
      previewTitle="Realtime negotiation chat"
      previewDescription="Chat layout adalah shell visual untuk percakapan, belum connected ke websocket atau realtime backend."
      states={[
        { variant: "loading", title: "Menghubungkan chat", description: "Mencoba memuat history pesan." },
        { variant: "disabled", title: "Reconnecting", description: "Koneksi realtime masih pending.", actionLabel: "Reconnect" },
      ]}
      checklist={["Chat layout", "Message history placeholder", "Offer message placeholder", "Typing and reconnecting state"]}
      integrationLabel="Realtime integration pending"
      integrationNote="Chat masih mock. Event realtime, history sinkron, dan delivery status belum diimplementasikan pada block ini."
    />
  );
}