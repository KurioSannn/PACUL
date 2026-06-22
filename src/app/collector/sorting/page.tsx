import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockMaterialStocks } from "@/data/mock-pacul";
import { formatWeight } from "@/lib/format";
import { wasteCategoryLabels } from "@/lib/constants";

export default function CollectorSortingPage() {
  const material = mockMaterialStocks[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 5"
      title="Sorting hasil pickup"
      description="Sorting result skeleton menyiapkan detail material, kelas hasil pilah, dan catatan asal listing."
      statusLabel="Frontend foundation"
      primaryActionLabel="Simpan sorting"
      secondaryActionLabel="Buat material stock"
      preview={<RoutePreview title="Sorting preview" badge="Sorting" description="Ringkasan hasil pilah untuk material demo." list={[
        { label: "Material", value: material.materialName, helper: wasteCategoryLabels[material.category] },
        { label: "Berat", value: formatWeight(material.weightKg), helper: `Asal ${material.sourceWasteListingId ?? "-"}` },
        { label: "Status", value: material.status, helper: material.location },
      ]} />}
      previewTitle="Sorting result"
      previewDescription="Halaman ini menyiapkan hasil sorting yang akan diteruskan menjadi stok bahan baku."
      states={[
        { variant: "loading", title: "Menyimpan hasil sorting", description: "Data demo sedang diproses." },
        { variant: "disabled", title: "Publish stock", description: "Status publish ke market belum production.", actionLabel: "Pending" },
      ]}
      checklist={["Sorting result skeleton", "Source listing trace skeleton", "Create material stock skeleton"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Sorting dan material stock masih mock. Persist hasil pilah dan relasi asal listing akan datang dari backend branch."
    />
  );
}