import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockRoutes } from "@/data/mock-pacul";
import { formatCurrency, formatWeight } from "@/lib/format";

type PickupDetailPageProps = { params: Promise<{ id: string }> };

export default async function PickupDetailPage({ params }: PickupDetailPageProps) {
  const { id } = await params;
  const route = mockRoutes.find((item) => item.id === id) ?? mockRoutes[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 3"
      title={`Detail pickup ${route.id}`}
      description="Detail pickup menyorot satu rute, stop list, dan estimasi biaya sebelum dijalankan."
      statusLabel="Data demo MVP"
      primaryActionLabel="Jalankan route"
      secondaryActionLabel="Optimasi route"
      preview={<RoutePreview title="Pickup detail" badge="Route detail" description="Ringkasan satu rute pickup untuk view operasional." list={[
        { label: "Driver", value: route.driverName, helper: route.title },
        { label: "Jarak", value: formatWeight(route.totalDistanceKm), helper: `Durasi ${route.estimatedDurationMinutes} menit` },
        { label: "Biaya", value: formatCurrency(route.estimatedCost), helper: `${route.stops.length} stop` },
      ]} />}
      previewTitle="Pickup detail"
      previewDescription="Halaman ini menyiapkan akses ke satu route pickup yang dipilih dari daftar."
      states={[
        { variant: "empty", title: "Route tidak ditemukan", description: "Pilih id demo untuk melihat detail pickup.", actionLabel: "Kembali" },
      ]}
      checklist={["Pickup detail page skeleton", "Route summary", "Distance estimate placeholder"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Pickup detail masih mock. Detail route, koordinat, dan status real-time belum diaktifkan pada block ini."
    />
  );
}