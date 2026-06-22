import { PaculHero } from "@/components/home/pacul-hero";
import { EcosystemPartners } from "@/components/home/ecosystem-partners";
import { MarketplacePreviewSection } from "@/components/home/marketplace-preview-section";
import { ImpactSection } from "@/components/home/impact-section";
import { JoinCtaSection } from "@/components/home/join-cta-section";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function HomePage() {
  return (
    <div className="flex w-full flex-col">
      <PublicHeader />
      <main className="grow">
        <PaculHero />
        <ImpactSection />
        <MarketplacePreviewSection />
        <EcosystemPartners />
        <JoinCtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}
