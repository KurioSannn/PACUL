import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockRoutes } from "@/data/mock-pacul";
import { formatCurrency, formatWeight } from "@/lib/format";

export default function PickupRoutesPage() {
  const route = mockRoutes[0];

  return (
    <RoutePage
      eyebrow="MVP Feature 3"
      title="Pickup map dan route"
      description="Halaman pickup route menyiapkan daftar pickup, ringkasan jarak, dan placeholder peta tanpa logika optimasi final."
      statusLabel="Data demo MVP"
      primaryActionLabel="Lihat route optimizer"
      secondaryActionLabel="Buka pickup detail"
      preview={<RoutePreview title="Route summary" badge="Map placeholder" description="Preview rute untuk menguji alur operasional pickup." timeline={route.stops.map((stop) => ({ title: stop.title, detail: stop.district, status: `${formatWeight(stop.distanceKm)} · ${formatCurrency(stop.estimatedCost)}` }))} note={`Total jarak ${formatWeight(route.totalDistanceKm)} · estimasi biaya ${formatCurrency(route.estimatedCost)}`} />}
      previewTitle="Pickup routes"
      previewDescription="Route summary menampilkan urutan pickup dan biaya agar tim operasional punya konteks awal."
      states={[
        { variant: "loading", title: "Memuat route", description: "Daftar pickup sedang disiapkan." },
        { variant: "empty", title: "Belum ada route", description: "Belum ada pickup yang dijadwalkan.", actionLabel: "Buat route" },
      ]}
      checklist={["Map placeholder", "Pickup list", "Route summary", "Distance estimate placeholder"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Route pickup masih demo. Data lokasi, relasi pickup, dan peta sebenarnya akan datang dari backend branch."
    />
  );
}