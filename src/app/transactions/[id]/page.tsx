import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockOrders, mockTransactions } from "@/data/mock-pacul";
import { formatCurrency } from "@/lib/format";

type TransactionDetailPageProps = { params: Promise<{ id: string }> };

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = await params;
  const transaction = mockTransactions.find((item) => item.id === id) ?? mockTransactions[0];
  const order = mockOrders.find((item) => item.id === transaction.orderId) ?? mockOrders[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 6"
      title={`Transaction ${transaction.id}`}
      description="Detail transaksi menyiapkan invoice view, status pembayaran, dan label integrasi payment pending."
      statusLabel="Frontend foundation"
      primaryActionLabel="Mark as paid"
      secondaryActionLabel="Unduh ringkasan"
      preview={<RoutePreview title="Transaction detail" badge="Transaction" description="Snapshot pembayaran dan order yang terkait." list={[
        { label: "Order", value: order.materialName, helper: order.buyerName },
        { label: "Status", value: transaction.status, helper: transaction.channel },
        { label: "Nilai", value: formatCurrency(order.totalPrice), helper: transaction.paidAt ?? "Belum dibayar" },
      ]} />}
      previewTitle="Transaction detail"
      previewDescription="Halaman ini mempersiapkan ringkasan pembayaran sebelum koneksi payment production dibuat."
      states={[
        { variant: "empty", title: "Transaksi belum ada", description: "Belum ada invoice demo untuk order ini.", actionLabel: "Kembali" },
      ]}
      checklist={["Transaction detail skeleton", "Payment status placeholder", "Integration note"]}
      integrationLabel="Payment integration pending"
      integrationNote="Transaksi belum terhubung ke payment production. Semua state di halaman ini masih mock untuk fondasi frontend."
    />
  );
}