import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";

export default function RolePage() {
  return (
    <RoutePage
      eyebrow="Auth and RBAC"
      title="Pilih peran utama"
      description="Role selection cards membantu user memilih jalur yang benar sebelum masuk dashboard masing-masing."
      statusLabel="Frontend foundation"
      preview={
        <RoutePreview
          title="Role cards"
          badge="RBAC UI"
          description="Setiap card menggambarkan prioritas data dan CTA utama untuk role yang berbeda."
          table={{
            headers: ["Role", "Fokus", "Route"],
            rows: [
              ["Rumah Tangga", "Listing sampah", "/dashboard/household"],
              ["Pengepul", "Pickup dan sorting", "/dashboard/collector"],
              ["Industri", "Material dan negosiasi", "/dashboard/industry"],
            ],
          }}
        />
      }
      previewTitle="Role selection"
      previewDescription="Guard state akan dihubungkan nanti; halaman ini hanya menyiapkan tampilan awal yang jelas untuk tiap role."
      states={[
        { variant: "success", title: "Role tersimpan", description: "Pilihan role bisa dilanjutkan ke dashboard yang sesuai.", actionLabel: "Lanjutkan" },
        { variant: "disabled", title: "Switch role", description: "Beralih role belum production dan hanya demo state.", actionLabel: "Nonaktif" },
      ]}
      checklist={["Role selection cards", "Role badge", "Guard state placeholder"]}
      integrationLabel="RBAC integration pending"
      integrationNote="Penentuan role produksi dan guard akses akan datang dari backend branch. Halaman ini hanya menyiapkan UX untuk selection dan fallback state."
    />
  );
}