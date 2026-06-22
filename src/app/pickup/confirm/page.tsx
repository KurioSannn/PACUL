import { PickupConfirmationView } from "@/components/pickup/pickup-confirmation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function PickupConfirmPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <PickupConfirmationView />
      <PublicFooter />
    </div>
  );
}
