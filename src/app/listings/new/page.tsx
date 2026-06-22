import { NewListingView } from "@/components/listings/new-listing-view";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function NewListingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <NewListingView />
      <PublicFooter />
    </div>
  );
}