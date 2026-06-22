import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockWasteListings } from "@/data/mock-pacul";
import { formatCurrency, formatWeight } from "@/lib/format";
import { wasteCategoryLabels } from "@/lib/constants";

export default function NewMaterialStockPage() {
  const source = mockWasteListings[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 5"
      title="Tambah stok bahan baku"
      description="Form create material stock menyiapkan trace asal listing, harga, dan state siap jual ke industri."
      statusLabel="Data demo MVP"
      primaryActionLabel="Simpan stok"
      secondaryActionLabel="Lihat traceability"
      preview={<RoutePreview title="Create material stock" badge="Material stock" description="Preview stok baru yang berasal dari hasil sorting." list={[
        { label: "Source listing", value: source.title, helper: source.address },
        { label: "Kategori", value: wasteCategoryLabels[source.category], helper: formatWeight(source.weightKg) },
        { label: "Harga/kg", value: formatCurrency(4200), helper: "Mock price per kg" },
      ]} />}
      previewTitle="Material stock create"
      previewDescription="Form ini mempersiapkan pembuatan stok bahan baku dari hasil sorting."
      states={[
        { variant: "loading", title: "Menyimpan stok", description: "Stok material sedang diproses." },
        { variant: "error", title: "Material belum valid", description: "Kategori atau harga belum lengkap." },
      ]}
      checklist={["Create material stock skeleton", "Source listing to material trace skeleton", "Integration note"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Stok bahan baku masih demo. Persist data, traceability relasi, dan validasi final akan diaktifkan backend branch."
    />
  );
}