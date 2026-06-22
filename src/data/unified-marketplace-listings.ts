import type { UnifiedListing } from "@/components/marketplace/ListingCard";
import type { WasteCategory } from "@/types/pacul";
import {
  DEMO_FINISHED_PRODUCTS,
  DEMO_MATERIALS_MARKETPLACE,
  DEMO_WASTE_MARKETPLACE,
} from "@/data/demo-marketplace";

function mapAiClassToCategory(code: string): WasteCategory {
  if (code.includes("plastic")) return "plastic";
  if (code.includes("paper") || code.includes("cardboard")) return "paper";
  if (code.includes("metal") || code.includes("aluminum") || code.includes("copper")) return "metal";
  if (code.includes("glass")) return "glass";
  if (code.includes("electronic")) return "electronic";
  if (code.includes("organic")) return "organic";
  return "plastic";
}

export const UNIFIED_MARKETPLACE_LISTINGS: UnifiedListing[] = [
  ...DEMO_WASTE_MARKETPLACE.map((item) => ({
    id: item.id,
    type: "raw" as const,
    title: item.title,
    category: mapAiClassToCategory(item.category.code),
    weightKg: item.estimated_weight_kg,
    location: `${item.district ?? ""}, ${item.city ?? "Surabaya"}`.replace(/^,\s*/, ""),
    actorName: item.household_display_name,
    isAiPredicted: true,
  })),
  ...DEMO_MATERIALS_MARKETPLACE.map((item) => ({
    id: item.id,
    type: "processed" as const,
    title: item.name,
    category: mapAiClassToCategory(item.category.code),
    weightKg: item.total_weight_kg,
    pricePerKg: item.price_per_kg,
    location: `${item.city ?? "Surabaya"}, ${item.province ?? "Jawa Timur"}`,
    actorName: item.collector.display_name,
  })),
  ...DEMO_FINISHED_PRODUCTS.map((item) => ({
    id: item.id,
    type: "finished" as const,
    title: item.name,
    category: mapAiClassToCategory(item.category.code),
    weightKg: item.total_weight_kg,
    pricePerKg: item.price_per_kg,
    location: `${item.city ?? "Surabaya"}, ${item.province ?? "Jawa Timur"}`,
    actorName: item.collector.display_name,
  })),
];
