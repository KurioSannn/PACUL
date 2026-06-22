import { CollectorPickupsView } from "@/components/collector/collector-pickups";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function CollectorPickupsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <CollectorPickupsView />
      <PublicFooter />
    </div>
  );
}