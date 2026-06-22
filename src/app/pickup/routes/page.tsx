import { PickupRoutesView } from "@/components/collector/pickup-routes-view";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function PickupRoutesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <PickupRoutesView />
      <PublicFooter />
    </div>
  );
}