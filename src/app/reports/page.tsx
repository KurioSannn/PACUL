import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockDeployReadiness, mockTraceabilityEvents } from "@/data/mock-pacul";

export default function ReportsPage() {
  return (
    <RoutePage
      eyebrow="Bonus 6"
      title="Export report PDF dan Excel"
      description="Reports menyiapkan filter, preview table, dan tombol export mock dengan loading, success, serta error state."
      statusLabel="Frontend foundation"
      primaryActionLabel="Export PDF"
      secondaryActionLabel="Export Excel"
      preview={<RoutePreview title="Report preview" badge="Export pending" description="Table preview untuk ringkasan export demo." table={{ headers: ["Laporan", "Status", "Rows"], rows: mockDeployReadiness.map((item, index) => [item.label, item.status, `${index + mockTraceabilityEvents.length}`]) }} note="Real export integration pending." />}
      previewTitle="Reports"
      previewDescription="Halaman ini mempersiapkan output laporan dan status export tanpa melakukan ekspor produksi."
      states={[
        { variant: "loading", title: "Menyiapkan export", description: "File laporan sedang diproses." },
        { variant: "success", title: "Export selesai", description: "File siap diunduh dari demo state.", actionLabel: "Unduh" },
        { variant: "error", title: "Export gagal", description: "Masih pending karena integrasi export belum tersedia." },
      ]}
      checklist={["Report filter", "Report preview table", "Export PDF button mock", "Export Excel button mock", "Loading, success, and error export states"]}
      integrationLabel="Export integration pending"
      integrationNote="Export PDF/Excel belum dihubungkan ke backend. Tombol hanya menunjukkan placeholder dan state UX."
    />
  );
}