import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockDeployReadiness } from "@/data/mock-pacul";

export default function DeployReadinessPage() {
  return (
    <RoutePage
      eyebrow="MVP Feature 8"
      title="Public deploy readiness"
      description="Checklist ini membantu review demo dan memastikan tidak ada klaim production yang belum tersedia."
      statusLabel="Frontend foundation"
      primaryActionLabel="Review checklist"
      secondaryActionLabel="Buka README"
      preview={<RoutePreview title="Deploy checklist" badge="Demo only" description="Checklist status untuk demo readiness." table={{ headers: ["Item", "Status", "Catatan"], rows: mockDeployReadiness.map((item) => [item.label, item.status, item.note]) }} note="Do not claim deployment is complete unless it actually is." />}
      previewTitle="Deploy readiness"
      previewDescription="Halaman ini memuat checklist demo readiness tanpa menyatakan deployment sudah selesai."
      states={[
        { variant: "success", title: "Route siap dibuka", description: "Semua route skeleton sudah tersedia untuk demo.", actionLabel: "Lihat route map" },
      ]}
      checklist={["responsive routes", "mock data label", "backend integration pending", "env pending", "build status documented"]}
      integrationLabel="Deployment integration pending"
      integrationNote="Deploy readiness ini hanya checklist demo. Frontend belum melakukan deployment production pada block ini."
    />
  );
}