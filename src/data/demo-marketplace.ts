import { DEMO_PICKUP_LISTINGS } from "@/data/demo-pickup-map";
import type {
  CollectorAvailableWasteListing,
  MaterialBatchMarketplaceItem,
  TraceabilityEvent,
  TransactionRecord,
  WasteCategory,
  WasteListingWithDetails,
} from "@/lib/api/types";

export const DEMO_MARKETPLACE_BADGE = "Etalase demo";

export function isDemoMarketplaceId(id: string) {
  return id.startsWith("demo-");
}

function demoCategory(code: string, name: string): WasteCategory {
  return {
    id: `demo-cat-${code}`,
    code,
    name,
    description: null,
    icon_key: null,
    unit: "kg",
    typical_price_per_kg: null,
    ai_model_class: code,
    sort_order: 0,
  };
}

const now = () => new Date().toISOString();

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/** Lapisan 1 — sampah rumah tangga (sama untuk semua peran). */
export const DEMO_WASTE_MARKETPLACE: CollectorAvailableWasteListing[] = [
  ...DEMO_PICKUP_LISTINGS,
  {
    id: "demo-listing-006",
    title: "Kabel tembaga bekas",
    description: "±6 kg kabel copper scrap",
    estimated_weight_kg: 6,
    status: "available",
    city: "Surabaya",
    district: "Mulyorejo",
    province: "Jawa Timur",
    latitude: -7.2812,
    longitude: 112.7812,
    available_from: null,
    available_until: null,
    pickup_fee: 0,
    created_at: now(),
    category: demoCategory("metal_copper", "Logam/Tembaga"),
    household_display_name: "Pak Bayu (RT)",
    images: [],
    distance_km: 6.1,
  },
  {
    id: "demo-listing-007",
    title: "E-waste kecil (charger & kabel)",
    description: "±4 kg elektronik kecil",
    estimated_weight_kg: 4,
    status: "available",
    city: "Surabaya",
    district: "Tenggilis Mejoyo",
    province: "Jawa Timur",
    latitude: -7.3178,
    longitude: 112.7555,
    available_from: null,
    available_until: null,
    pickup_fee: 0,
    created_at: now(),
    category: demoCategory("electronic", "Elektronik"),
    household_display_name: "Bu Ani (RT)",
    images: [],
    distance_km: 4.5,
  },
  {
    id: "demo-listing-008",
    title: "Plastik campuran kemasan",
    description: "±18 kg plastik PP/LDPE",
    estimated_weight_kg: 18,
    status: "available",
    city: "Surabaya",
    district: "Kenjeran",
    province: "Jawa Timur",
    latitude: -7.2455,
    longitude: 112.7899,
    available_from: null,
    available_until: null,
    pickup_fee: 0,
    created_at: now(),
    category: demoCategory("plastic_mixed", "Plastik Campuran"),
    household_display_name: "Keluarga Fajar (RT)",
    images: [],
    distance_km: 7.2,
  },
];

function materialItem(
  id: string,
  name: string,
  cat: WasteCategory,
  weight: number,
  price: number,
  city: string,
  collectorName = "Andi Pengepul",
  status: MaterialBatchMarketplaceItem["status"] = "available",
): MaterialBatchMarketplaceItem {
  const ts = now();
  return {
    id,
    collector_id: "demo-collector-andi",
    category_id: cat.id,
    name,
    description: `Batch demo hasil pemilahan — ${cat.name}`,
    total_weight_kg: weight,
    price_per_kg: price,
    min_order_kg: Math.min(10, weight),
    status,
    location_address: `${city}, Jawa Timur`,
    latitude: -7.29,
    longitude: 112.74,
    city,
    province: "Jawa Timur",
    available_from: null,
    available_until: null,
    notes: null,
    published_at: ts,
    sold_at: null,
    created_at: ts,
    updated_at: ts,
    category: { id: cat.id, code: cat.code, name: cat.name, unit: cat.unit },
    collector: { display_name: collectorName, rating_average: 4.7 },
  };
}

/** Lapisan 2 — bahan baku pengepul. */
export const DEMO_MATERIALS_MARKETPLACE: MaterialBatchMarketplaceItem[] = [
  materialItem(
    "demo-material-001",
    "Flake PET bening A-grade",
    demoCategory("plastic_pet", "Plastik PET"),
    420,
    8500,
    "Surabaya",
  ),
  materialItem(
    "demo-material-002",
    "Kardus press bal",
    demoCategory("paper_cardboard", "Kertas/Kardus"),
    680,
    3200,
    "Sidoarjo",
    "Mitra Material Sidoarjo",
  ),
  materialItem(
    "demo-material-003",
    "Aluminium ingot scrap",
    demoCategory("metal_aluminum", "Logam/Kaleng"),
    210,
    18500,
    "Surabaya",
  ),
  materialItem(
    "demo-material-004",
    "HDPE pellet natural",
    demoCategory("plastic_hdpe", "Plastik HDPE"),
    350,
    11200,
    "Gresik",
    "CV Recycle Gresik",
  ),
  materialItem(
    "demo-material-005",
    "Kaca cullet bening",
    demoCategory("glass", "Kaca"),
    280,
    950,
    "Surabaya",
  ),
  materialItem(
    "demo-material-006",
    "Tembaga cable scrap",
    demoCategory("metal_copper", "Logam/Tembaga"),
    95,
    72000,
    "Surabaya",
  ),
];

/** Lapisan 3 — bahan baku jadi industri (display sebagai produk olahan). */
export const DEMO_FINISHED_PRODUCTS: MaterialBatchMarketplaceItem[] = [
  materialItem(
    "demo-finished-001",
    "PET flake food-grade (olahan pabrik)",
    demoCategory("plastic_pet", "Plastik PET"),
    1200,
    14200,
    "Surabaya",
    "PT Daur Nusantara",
    "available",
  ),
  materialItem(
    "demo-finished-002",
    "Pulp kertas bleached HS",
    demoCategory("paper_cardboard", "Kertas/Kardus"),
    800,
    6800,
    "Pasuruan",
    "PT Kertas Nusantara",
  ),
  materialItem(
    "demo-finished-003",
    "Aluminium billet secondary",
    demoCategory("metal_aluminum", "Logam/Kaleng"),
    500,
    24500,
    "Surabaya",
    "PT Smelt Jatim",
  ),
  materialItem(
    "demo-finished-004",
    "HDPE resin injection grade",
    demoCategory("plastic_hdpe", "Plastik HDPE"),
    600,
    15800,
    "Gresik",
    "PT Polimer Hijau",
  ),
];

export const DEMO_MARKETPLACE_TRANSACTIONS: TransactionRecord[] = [
  {
    id: "demo-tx-001",
    order_id: "demo-order-001",
    industry_id: "demo-industry",
    collector_id: "demo-collector-andi",
    batch_id: "demo-material-001",
    amount: 3_570_000,
    status: "simulated_paid",
    payment_method: "simulated_transfer",
    payment_reference: "SIM-DEMO-20250622-001",
    notes: "Transaksi demo — flake PET 420 kg",
    simulated_at: now(),
    completed_at: now(),
    cancelled_at: null,
    created_at: now(),
  },
  {
    id: "demo-tx-002",
    order_id: "demo-order-002",
    industry_id: "demo-industry",
    collector_id: "demo-collector-andi",
    batch_id: "demo-material-002",
    amount: 2_176_000,
    status: "completed",
    payment_method: "simulated_transfer",
    payment_reference: "SIM-DEMO-20250621-002",
    notes: "Transaksi demo — kardus press",
    simulated_at: now(),
    completed_at: now(),
    cancelled_at: null,
    created_at: now(),
  },
  {
    id: "demo-tx-003",
    order_id: "demo-order-003",
    industry_id: "demo-industry",
    collector_id: "demo-collector-andi",
    batch_id: "demo-finished-001",
    amount: 17_040_000,
    status: "simulated_paid",
    payment_method: "simulated_transfer",
    payment_reference: "SIM-DEMO-20250620-003",
    notes: "Transaksi demo — PET food-grade",
    simulated_at: now(),
    completed_at: null,
    cancelled_at: null,
    created_at: now(),
  },
];

export function mergeCatalog<T extends { id: string }>(apiItems: T[] | undefined, demoItems: T[]): { items: T[]; usesDemo: boolean } {
  const api = apiItems ?? [];
  const apiIds = new Set(api.map((i) => i.id));
  const extras = demoItems.filter((d) => !apiIds.has(d.id));
  return {
    items: [...api, ...extras],
    usesDemo: extras.length > 0 || api.length === 0,
  };
}

export function getDemoMaterialById(id: string): MaterialBatchMarketplaceItem | null {
  return (
    [...DEMO_MATERIALS_MARKETPLACE, ...DEMO_FINISHED_PRODUCTS].find((m) => m.id === id) ?? null
  );
}

export function getDemoWasteById(id: string): CollectorAvailableWasteListing | null {
  return DEMO_WASTE_MARKETPLACE.find((w) => w.id === id) ?? null;
}

export function getDemoWasteListingDetail(id: string): WasteListingWithDetails | null {
  const waste = getDemoWasteById(id);
  if (!waste) return null;
  const ts = waste.created_at;
  return {
    id: waste.id,
    household_id: "demo-household",
    category_id: waste.category.id,
    classification_id: "demo-classification",
    title: waste.title,
    description: waste.description,
    estimated_weight_kg: waste.estimated_weight_kg,
    actual_weight_kg: null,
    status: "available",
    address: `${waste.district ?? "Surabaya"}, ${waste.city ?? "Jawa Timur"}`,
    latitude: waste.latitude,
    longitude: waste.longitude,
    district: waste.district,
    city: waste.city,
    province: waste.province,
    available_from: waste.available_from,
    available_until: waste.available_until,
    notes: null,
    pickup_fee: waste.pickup_fee ?? 0,
    claimed_by: null,
    claimed_at: null,
    picked_up_at: null,
    sorted_at: null,
    cancelled_at: null,
    cancel_reason: null,
    created_at: ts,
    updated_at: ts,
    category: waste.category,
    images: waste.images ?? [],
  };
}

export function getDemoWasteTraceability(listingId: string): TraceabilityEvent[] {
  const waste = getDemoWasteById(listingId);
  if (!waste) return [];
  return [
    {
      id: `${listingId}-evt-1`,
      event_type: "listing_created",
      entity_type: "waste_listing",
      entity_id: listingId,
      title: "Listing dibuat",
      detail: `${waste.household_display_name} mengunggah ${waste.title}`,
      occurred_at: daysAgo(4),
    },
    {
      id: `${listingId}-evt-2`,
      event_type: "ai_classified",
      entity_type: "waste_listing",
      entity_id: listingId,
      title: "Klasifikasi AI",
      detail: `Terdeteksi ${waste.category.name} — confidence 92% (demo)`,
      occurred_at: daysAgo(4),
    },
    {
      id: `${listingId}-evt-3`,
      event_type: "published",
      entity_type: "waste_listing",
      entity_id: listingId,
      title: "Dipublikasikan",
      detail: "Listing tersedia di marketplace lapisan 1",
      occurred_at: daysAgo(3),
    },
  ];
}

export function getDemoMaterialTraceability(batchId: string): TraceabilityEvent[] {
  const material = getDemoMaterialById(batchId);
  if (!material) return [];
  const isFinished = batchId.startsWith("demo-finished-");
  return [
    {
      id: `${batchId}-evt-1`,
      event_type: "pickup_completed",
      entity_type: "material_batch",
      entity_id: batchId,
      title: "Pickup selesai",
      detail: "Sampah rumah tangga diambil pengepul (demo Surabaya)",
      occurred_at: daysAgo(14),
    },
    {
      id: `${batchId}-evt-2`,
      event_type: "sorted",
      entity_type: "material_batch",
      entity_id: batchId,
      title: "Pemilahan & press",
      detail: `${material.name} — ${material.total_weight_kg} kg siap dijual`,
      occurred_at: daysAgo(10),
    },
    {
      id: `${batchId}-evt-3`,
      event_type: "published",
      entity_type: "material_batch",
      entity_id: batchId,
      title: isFinished ? "Olahan industri" : "Batch dipublikasikan",
      detail: isFinished
        ? "Produk olahan siap supply ke mitra industri"
        : "Batch bahan baku tersedia di marketplace lapisan 2",
      occurred_at: daysAgo(5),
    },
    {
      id: `${batchId}-evt-4`,
      event_type: "transaction_simulated",
      entity_type: "material_batch",
      entity_id: batchId,
      title: "Transaksi simulasi",
      detail: "Pembayaran demo — lihat halaman Transaksi",
      occurred_at: daysAgo(2),
    },
  ];
}

export function getDemoTransactionById(id: string): TransactionRecord | null {
  return DEMO_MARKETPLACE_TRANSACTIONS.find((tx) => tx.id === id) ?? null;
}
