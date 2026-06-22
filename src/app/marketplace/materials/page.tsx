import { MaterialMarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { mockMaterialStocks } from "@/data/mock-pacul";

export default function MaterialsMarketplacePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <MaterialMarketplaceBrowser materials={mockMaterialStocks} />
      <PublicFooter />
    </div>
  );
}
