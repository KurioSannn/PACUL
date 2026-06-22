import { HouseholdPickupTrackingConnected } from "@/components/connected/collector-flows-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function PickupTrackingPage() {
  return (
    <AppPageShell>
      <HouseholdPickupTrackingConnected />
    </AppPageShell>
  );
}
