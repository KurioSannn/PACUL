import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { DashboardStats } from "@/components/marketplace/DashboardStats";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { ListingFeed } from "@/components/marketplace/ListingFeed";
import { MapPreview } from "@/components/marketplace/MapPreview";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const metadata = {
  title: "Marketplace — PACUL",
  description:
    "Jelajahi listing sampah terpilah, bahan baku pengepul, dan produk jadi industri dalam satu etalase terbuka.",
};

export default function MarketplacePage() {
  return (
    <div className="flex w-full flex-col">
      <PublicHeader />
      <main className="page-shell grow space-y-10 py-8">
        <MarketplaceHero />

        <ScrollReveal>
          <DashboardStats />
        </ScrollReveal>

        <FilterBar />

        <ScrollReveal>
          <ListingFeed />
        </ScrollReveal>

        <ScrollReveal>
          <MapPreview />
        </ScrollReveal>
      </main>
      <PublicFooter />
    </div>
  );
}
