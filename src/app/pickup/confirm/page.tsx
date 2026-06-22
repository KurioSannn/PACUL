import { HouseholdPickupConfirmConnected } from "@/components/connected/collector-flows-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function PickupConfirmPage() {
  return (
    <AppPageShell>
      <HouseholdPickupConfirmConnected />
    </AppPageShell>
  );
}
