import { PickupTrackingView } from "@/components/pickup/pickup-tracking";
import { PublicHeader } from "@/components/layout/public-header";

export default function PickupTrackingPage() {
  return (
    <div className="flex h-screen flex-col bg-[var(--color-sage-50)] pt-[72px] overflow-hidden">
      <PublicHeader />
      <div className="flex-1 overflow-y-auto">
        <PickupTrackingView />
      </div>
    </div>
  );
}
