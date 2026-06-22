"use client";

import { useMemo, useState } from "react";

import { DashboardStats } from "@/components/marketplace/DashboardStats";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { ListingFeed } from "@/components/marketplace/ListingFeed";
import { MapPreview } from "@/components/marketplace/MapPreview";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { UNIFIED_MARKETPLACE_LISTINGS } from "@/data/unified-marketplace-listings";
import type { WasteCategory } from "@/types/pacul";

export function MarketplacePublicView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | WasteCategory>("all");
  const [layer, setLayer] = useState<"all" | "raw" | "processed" | "finished">("all");

  const filteredCount = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UNIFIED_MARKETPLACE_LISTINGS.filter((item) => {
      if (layer !== "all" && item.type !== layer) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return `${item.title} ${item.location} ${item.actorName}`.toLowerCase().includes(q);
    }).length;
  }, [query, category, layer]);

  return (
    <main className="page-shell grow space-y-10 py-8">
      <MarketplaceHero />

      <ScrollReveal>
        <DashboardStats />
      </ScrollReveal>

      <FilterBar
        query={query}
        category={category}
        layer={layer}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onLayerChange={setLayer}
      />

      <ScrollReveal>
        <ListingFeed query={query} category={category} layer={layer} filteredCount={filteredCount} />
      </ScrollReveal>

      <ScrollReveal>
        <MapPreview />
      </ScrollReveal>
    </main>
  );
}
