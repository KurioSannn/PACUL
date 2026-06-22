import { TraceabilityConnected } from "@/components/connected/listing-traceability-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function TraceabilityPage() {
  return (
    <AppPageShell>
      <TraceabilityConnected />
    </AppPageShell>
  );
}
