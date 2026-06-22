import { MarketplaceHubConnected } from "@/components/connected/marketplace-hub-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function MarketplacePage() {
  return (
    <AppPageShell>
      <MarketplaceHubConnected />
    </AppPageShell>
  );
}
