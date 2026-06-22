"use client";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { MarketplaceHubConnected } from "@/components/connected/marketplace-hub-connected";
import { MarketplacePublicView } from "@/components/marketplace/marketplace-public-view";
import { useAuth } from "@/contexts/auth-context";

export function MarketplacePageClient() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--color-ink-500)]">
        Memuat marketplace...
      </div>
    );
  }

  if (profile) {
    return (
      <AppPageShell>
        <MarketplaceHubConnected />
      </AppPageShell>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <PublicHeader />
      <MarketplacePublicView />
      <PublicFooter />
    </div>
  );
}
