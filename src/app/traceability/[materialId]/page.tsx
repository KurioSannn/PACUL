import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockTraceabilityEvents } from "@/data/mock-pacul";

type TraceabilityPageProps = { params: Promise<{ materialId: string }> };

export default async function TraceabilityPage({ params }: TraceabilityPageProps) {
  const { materialId } = await params;
  const events = mockTraceabilityEvents.filter((event) => event.materialId === materialId);

  return (
    <RoutePage
      eyebrow="Bonus 3"
      title={`Traceability material ${materialId}`}
      description="Traceability menampilkan jejak material dari listing asal sampai transaksi tanpa dekorasi chart yang tidak membantu keputusan."
      statusLabel="Data demo MVP"
      primaryActionLabel="Lihat event berikutnya"
      secondaryActionLabel="Kembali ke material"
      preview={<RoutePreview title="Traceability timeline" badge="Traceability" description="Timeline event untuk material demo." timeline={events.map((event) => ({ title: event.title, detail: `${event.detail} · ${event.occurredAt}`, status: event.step }))} note="Material traceability integration pending." />}
      previewTitle="Traceability detail"
      previewDescription="Alur jejak material memberi konteks asal listing, pickup, sorting, stok, order, dan transaksi."
      states={[
        { variant: "empty", title: "Jejak material kosong", description: "Belum ada event traceability untuk material ini.", actionLabel: "Refresh" },
      ]}
      checklist={["Source listing", "Pickup event", "Sorting event", "Material stock event", "Order event", "Transaction event"]}
      integrationLabel="Traceability integration pending"
      integrationNote="Jejak material masih mock. Event produksi dan sinkronisasi lintas entitas belum diaktifkan pada block ini."
    />
  );
}