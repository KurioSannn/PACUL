import type {
  ClassificationDemo,
  DeployReadinessItem,
  MaterialStock,
  NegotiationRecord,
  OrderRecord,
  PickupRoute,
  ReviewRecord,
  TraceabilityEvent,
  WasteListing,
} from "@/types/pacul";

export const mockWasteListings: WasteListing[] = [
  {
    id: "waste-pet-rungkut",
    householdId: "household-ardi",
    householdName: "Keluarga Ardi",
    title: "Botol plastik PET campur",
    category: "plastic",
    weightKg: 12,
    district: "Rungkut",
    status: "listed",
    address: "Jl. Rungkut Industri IV",
    aiPredictedCategory: "plastic",
    aiConfidence: 0.92,
    createdAt: "2026-06-20T09:00:00.000Z",
  },
  {
    id: "waste-kardus-wonokromo",
    householdId: "household-nia",
    householdName: "Keluarga Nia",
    title: "Kardus kering",
    category: "paper",
    weightKg: 8,
    district: "Wonokromo",
    status: "scheduled",
    address: "Jl. Wonokromo Tengah",
    aiPredictedCategory: null,
    aiConfidence: null,
    createdAt: "2026-06-20T10:20:00.000Z",
  },
  {
    id: "waste-aluminium-sukolilo",
    householdId: "household-raka",
    householdName: "Keluarga Raka",
    title: "Kaleng aluminium bersih",
    category: "metal",
    weightKg: 4.5,
    district: "Sukolilo",
    status: "listed",
    address: "Jl. Keputih Tegal",
    aiPredictedCategory: "metal",
    aiConfidence: 0.88,
    createdAt: "2026-06-21T07:45:00.000Z",
  },
  {
    id: "waste-glass-gubeng",
    householdId: "household-sari",
    householdName: "Keluarga Sari",
    title: "Botol kaca warna campur",
    category: "glass",
    weightKg: 9,
    district: "Gubeng",
    status: "scheduled",
    address: "Jl. Gubeng Kertajaya",
    aiPredictedCategory: "glass",
    aiConfidence: 0.84,
    createdAt: "2026-06-21T13:10:00.000Z",
  },
  {
    id: "waste-paper-tandes",
    householdId: "household-dewi",
    householdName: "Keluarga Dewi",
    title: "Kertas kantor campur",
    category: "paper",
    weightKg: 15,
    district: "Tandes",
    status: "picked_up",
    address: "Jl. Tandes Lor",
    aiPredictedCategory: "paper",
    aiConfidence: 0.9,
    createdAt: "2026-06-19T15:30:00.000Z",
  },
  {
    id: "waste-electronic-mulyorejo",
    householdId: "household-bayu",
    householdName: "Keluarga Bayu",
    title: "Elektronik kecil rusak",
    category: "electronic",
    weightKg: 3.2,
    district: "Mulyorejo",
    status: "listed",
    address: "Jl. Kalijudan",
    aiPredictedCategory: null,
    aiConfidence: null,
    createdAt: "2026-06-22T08:20:00.000Z",
  },
];

export const mockMaterialStocks: MaterialStock[] = [
  {
    id: "material-pet-sidoarjo",
    collectorId: "collector-sidoarjo",
    collectorName: "Pengepul Sidoarjo",
    sourceWasteListingId: "waste-pet-rungkut",
    materialName: "Biji plastik PET cacah",
    category: "plastic",
    weightKg: 40,
    pricePerKg: 4200,
    location: "Sidoarjo",
    status: "available",
    createdAt: "2026-06-21T08:10:00.000Z",
  },
  {
    id: "material-cardboard-surabaya",
    collectorId: "collector-barat",
    collectorName: "Mitra Material Barat",
    sourceWasteListingId: "waste-kardus-wonokromo",
    materialName: "Kardus press",
    category: "paper",
    weightKg: 75,
    pricePerKg: 2100,
    location: "Surabaya Barat",
    status: "reserved",
    createdAt: "2026-06-21T09:30:00.000Z",
  },
  {
    id: "material-aluminium-gresik",
    collectorId: "collector-gresik",
    collectorName: "Mitra Material Gresik",
    sourceWasteListingId: "waste-aluminium-sukolilo",
    materialName: "Aluminium campur",
    category: "metal",
    weightKg: 20,
    pricePerKg: 11500,
    location: "Gresik",
    status: "available",
    createdAt: "2026-06-21T11:00:00.000Z",
  },
  {
    id: "material-glass-sidoarjo",
    collectorId: "collector-sidoarjo",
    collectorName: "Mitra Material Sidoarjo",
    sourceWasteListingId: "waste-glass-gubeng",
    materialName: "Pecahan kaca terpilah",
    category: "glass",
    weightKg: 52,
    pricePerKg: 1400,
    location: "Sidoarjo",
    status: "available",
    createdAt: "2026-06-22T07:40:00.000Z",
  },
  {
    id: "material-hdpe-mojokerto",
    collectorId: "collector-mojokerto",
    collectorName: "Mitra Material Mojokerto",
    sourceWasteListingId: null,
    materialName: "Biji plastik HDPE",
    category: "plastic",
    weightKg: 90,
    pricePerKg: 6800,
    location: "Mojokerto",
    status: "sold",
    createdAt: "2026-06-20T14:25:00.000Z",
  },
];

export const mockRoutes: PickupRoute[] = [
  {
    id: "route-utama-surabaya",
    title: "Rute Surabaya Timur",
    driverName: "Budi Santoso",
    totalDistanceKm: 14.6,
    estimatedDurationMinutes: 95,
    estimatedCost: 42000,
    stops: [
      { id: "stop-rungkut", title: "Keluarga Ardi", district: "Rungkut", distanceKm: 1.8, estimatedCost: 12000, status: "scheduled" },
      { id: "stop-wonokromo", title: "Keluarga Nia", district: "Wonokromo", distanceKm: 4.2, estimatedCost: 18000, status: "available" },
    ],
  },
];

export const mockOrders: OrderRecord[] = [
  { id: "order-001", buyerName: "PT Kertas Jaya", supplierName: "Pengepul Sidoarjo", materialName: "Biji plastik PET cacah", status: "negotiating", totalKg: 40, totalPrice: 168000, createdAt: "2026-06-21T09:00:00.000Z" },
];

export const mockNegotiations: NegotiationRecord[] = [
  { id: "nego-001", orderId: "order-001", buyerName: "PT Kertas Jaya", supplierName: "Pengepul Sidoarjo", offeredPricePerKg: 3900, counterPricePerKg: 4200, status: "countered", createdAt: "2026-06-21T09:15:00.000Z" },
];

export const mockTransactions = [
  { id: "txn-001", orderId: "order-001", status: "pending", paidAt: null, channel: "Transfer bank" },
];

export const mockTraceabilityEvents: TraceabilityEvent[] = [
  { id: "trace-1", materialId: "material-pet-sidoarjo", step: "source", title: "Listing sumber dibuat", detail: "Listing asal: Botol plastik PET campur.", occurredAt: "2026-06-20T09:00:00.000Z" },
  { id: "trace-2", materialId: "material-pet-sidoarjo", step: "pickup", title: "Pickup dilakukan", detail: "Status pickup masuk jadwal dan dijemput pengepul.", occurredAt: "2026-06-20T11:30:00.000Z" },
  { id: "trace-3", materialId: "material-pet-sidoarjo", step: "sorting", title: "Sorting selesai", detail: "Material dipilah menjadi fraksi PET campur.", occurredAt: "2026-06-20T15:20:00.000Z" },
  { id: "trace-4", materialId: "material-pet-sidoarjo", step: "stock", title: "Stok bahan baku dibuat", detail: "Material siap dipasarkan ke industri.", occurredAt: "2026-06-21T08:10:00.000Z" },
];

export const mockReviews: ReviewRecord[] = [
  { id: "review-001", reviewerRole: "household", subjectName: "Pengepul Sidoarjo", rating: 5, comment: "Pickup tepat waktu dan komunikasi jelas.", status: "published", createdAt: "2026-06-21T12:00:00.000Z" },
];

export const mockDeployReadiness: DeployReadinessItem[] = [
  { id: "responsive", label: "Responsive routes", status: "pending", note: "Route skeleton tersedia untuk mobile, tablet, dan desktop." },
  { id: "mock-data", label: "Mock data label", status: "ready", note: "Seluruh halaman demo memakai penanda data sementara." },
  { id: "backend", label: "Backend integration pending", status: "pending", note: "Supabase, auth, storage, AI, realtime, dan export belum diaktifkan di block ini." },
  { id: "env", label: "Env pending", status: "ready", note: "Tidak ada env baru yang ditambahkan pada block ini." },
  { id: "build", label: "Build status documented", status: "ready", note: "Block ini akan diverifikasi dengan build lokal." },
];

export const mockClassificationDemo: ClassificationDemo = {
  predictedCategory: "plastic",
  confidence: 0.83,
  manualOverride: null,
  status: "ready",
};
