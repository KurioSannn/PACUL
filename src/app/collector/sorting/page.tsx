import { CollectorSortingView } from "@/components/collector/collector-sorting";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function CollectorSortingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <CollectorSortingView />
      <PublicFooter />
    </div>
  );
}