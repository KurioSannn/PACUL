export type UserRole = "household" | "collector" | "industry";

export type WasteCategory =
  | "plastic"
  | "paper"
  | "metal"
  | "glass"
  | "organic"
  | "electronic";

export type WasteListingStatus =
  | "draft"
  | "listed"
  | "scheduled"
  | "picked_up"
  | "sorted"
  | "cancelled";

export type WasteListing = {
  id: string;
  householdName: string;
  title: string;
  category: WasteCategory;
  weightKg: number;
  district: string;
  status: WasteListingStatus;
};

export type MaterialStock = {
  id: string;
  collectorName: string;
  materialName: string;
  category: WasteCategory;
  weightKg: number;
  pricePerKg: number;
  location: string;
  status: "available" | "reserved" | "sold";
};
