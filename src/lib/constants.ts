import type {
  DeployReadinessItem,
  MaterialStatus,
  NegotiationStatus,
  OrderStatus,
  PickupStatus,
  ReviewStatus,
  UserRole,
  WasteCategory,
  WasteListingStatus,
} from "@/types/pacul";

export const wasteCategoryLabels: Record<WasteCategory, string> = {
  plastic: "Plastik",
  paper: "Kertas",
  metal: "Logam",
  glass: "Kaca",
  organic: "Organik",
  electronic: "Elektronik kecil",
};

export const userRoleLabels: Record<UserRole, string> = {
  household: "Rumah Tangga",
  collector: "Pengepul",
  industry: "Industri Pengolah",
};

export const userRoleDescriptions: Record<UserRole, string> = {
  household: "Membuat listing sampah dan memantau status pickup.",
  collector: "Mengelola pickup, sorting, dan stok bahan baku.",
  industry: "Mencari material, negosiasi, dan transaksi pembelian.",
};

export const wasteListingStatusLabels: Record<WasteListingStatus, string> = {
  draft: "Draft",
  listed: "Diterbitkan",
  scheduled: "Terjadwal",
  picked_up: "Sudah diambil",
  sorted: "Sudah dipilah",
  cancelled: "Dibatalkan",
};

export const pickupStatusLabels: Record<PickupStatus, string> = {
  available: "Tersedia",
  scheduled: "Terjadwal",
  in_progress: "Berjalan",
  completed: "Selesai",
  cancelled: "Batal",
};

export const materialStatusLabels: Record<MaterialStatus, string> = {
  available: "Tersedia",
  reserved: "Dipesan",
  sold: "Terjual",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  requested: "Diajukan",
  negotiating: "Negosiasi",
  approved: "Disetujui",
  paid: "Dibayar",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const negotiationStatusLabels: Record<NegotiationStatus, string> = {
  waiting_reply: "Menunggu balasan",
  countered: "Counter masuk",
  approved: "Disetujui",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  draft: "Draft",
  submitted: "Dikirim",
  published: "Terbit",
  archived: "Diarsipkan",
};

export const deployReadinessDefaults: DeployReadinessItem[] = [
  { id: "responsive", label: "Responsive routes", status: "pending", note: "Route skeleton tersedia untuk mobile, tablet, dan desktop." },
  { id: "mock-data", label: "Mock data label", status: "ready", note: "Seluruh halaman demo memakai penanda data sementara." },
  { id: "backend", label: "Backend integration pending", status: "pending", note: "Supabase, auth, storage, AI, realtime, dan export belum diaktifkan di block ini." },
  { id: "env", label: "Env pending", status: "ready", note: "Tidak ada env baru yang ditambahkan pada block ini." },
  { id: "build", label: "Build status documented", status: "pending", note: "Build akan diverifikasi setelah shell route selesai." },
];
