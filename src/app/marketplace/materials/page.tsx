import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockMaterialStocks } from "@/data/mock-pacul";
import { formatCurrency, formatWeight } from "@/lib/format";
import { materialStatusLabels, wasteCategoryLabels } from "@/lib/constants";

export default function MaterialsMarketplacePage() {
  const material = mockMaterialStocks[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 7"
      title="Marketplace bahan baku"
      description="Industri pengolah melihat material hasil pilah yang siap dijual, bukan katalog generik yang terlepas dari rantai nilai."
      statusLabel="Data demo MVP"
      primaryActionLabel="Buat order"
      secondaryActionLabel="Buka negosiasi"
      preview={<RoutePreview title="Material stock preview" badge="Marketplace" description="Cuplikan bahan baku yang terhubung ke sumber listing demo." list={[
        { label: "Material", value: material.materialName, helper: wasteCategoryLabels[material.category] },
        { label: "Harga/kg", value: formatCurrency(material.pricePerKg), helper: material.location },
        { label: "Stok", value: formatWeight(material.weightKg), helper: materialStatusLabels[material.status] },
      ]} />}
      previewTitle="Marketplace materials"
      previewDescription="Halaman ini menyiapkan feed bahan baku, filter sederhana, dan entry point ke order."
      states={[
        { variant: "empty", title: "Belum ada material", description: "Stok hasil pilah belum dipublish ke marketplace." , actionLabel: "Tambah material" },
        { variant: "loading", title: "Memuat stok", description: "Demo material sedang dimuat." },
      ]}
      checklist={["Marketplace bahan baku skeleton", "Order entry point", "Negosiasi entry point", "Traceability entry point"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Data bahan baku masih mock. Sinkronisasi stok, harga, dan order akan datang dari backend branch."
    />
  );
}