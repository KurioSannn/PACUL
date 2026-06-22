import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";

export default function NewOrderPage() {
  return (
    <RoutePage
      eyebrow="MVP Feature 6"
      title="Buat order baru"
      description="Request order skeleton mempersiapkan buyer flow, quantity, dan state menunggu approval."
      statusLabel="Frontend foundation"
      primaryActionLabel="Kirim order"
      secondaryActionLabel="Simpan draft"
      preview={<RoutePreview title="Order request" badge="Request" description="Preview ringkas sebelum order dikirim ke supplier." list={[
        { label: "Buyer", value: "PT Kertas Jaya", helper: "Role industri" },
        { label: "Material", value: "Biji plastik PET cacah", helper: "Stok mock" },
        { label: "Quantity", value: "40 kg", helper: "Mock quantity" },
        { label: "Status", value: "requested", helper: "Menunggu negosiasi" },
      ]} />}
      previewTitle="Order request"
      previewDescription="Buyer flow menunggu data final dari backend untuk request dan approval produksi."
      states={[
        { variant: "loading", title: "Mengirim order", description: "Order mock sedang diproses." },
        { variant: "error", title: "Order gagal", description: "Data buyer atau material belum lengkap." },
      ]}
      checklist={["Order request skeleton", "Non-production CTA", "Integration note"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Request order masih mock. Validasi buyer, pricing, dan approval production belum diaktifkan di block ini."
    />
  );
}