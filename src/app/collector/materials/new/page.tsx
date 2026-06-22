import { CollectorMaterialBatchConnected } from "@/components/connected/collector-flows-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function CollectorMaterialNewPage() {
  return (
    <AppPageShell>
      <CollectorMaterialBatchConnected />
    </AppPageShell>
  );
}
