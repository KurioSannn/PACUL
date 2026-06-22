import { WasteMarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { mockWasteListings } from "@/data/mock-pacul";

export default function WasteMarketplacePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <WasteMarketplaceBrowser listings={mockWasteListings} />
      <PublicFooter />
    </div>
  );
}
