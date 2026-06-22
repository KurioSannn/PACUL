import type { MaterialStock, WasteListing } from "@/types/pacul";

export const mockWasteListings: WasteListing[] = [
  {
    id: "waste-pet-rungkut",
    householdName: "Keluarga Ardi",
    title: "Botol plastik PET campur",
    category: "plastic",
    weightKg: 12,
    district: "Rungkut",
    status: "listed",
  },
  {
    id: "waste-kardus-wonokromo",
    householdName: "Keluarga Nia",
    title: "Kardus kering",
    category: "paper",
    weightKg: 8,
    district: "Wonokromo",
    status: "scheduled",
  },
];

export const mockMaterialStocks: MaterialStock[] = [
  {
    id: "material-pet-sidoarjo",
    collectorName: "Pengepul Sidoarjo",
    materialName: "Biji plastik PET cacah",
    category: "plastic",
    weightKg: 40,
    pricePerKg: 4200,
    location: "Sidoarjo",
    status: "available",
  },
];
