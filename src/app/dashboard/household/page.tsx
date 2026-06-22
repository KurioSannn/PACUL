import { DashboardConnected } from "@/components/connected/dashboard-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function HouseholdDashboardPage() {
  return (
    <AppPageShell>
      <DashboardConnected />
    </AppPageShell>
  );
}
