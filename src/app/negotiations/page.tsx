import { NegotiationsView } from "@/components/industry/negotiations-view";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function NegotiationsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <NegotiationsView />
      <PublicFooter />
    </div>
  );
}