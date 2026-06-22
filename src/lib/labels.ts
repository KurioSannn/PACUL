import type { WasteListingStatus } from "@/lib/api/types";

export const wasteListingStatusLabels: Record<WasteListingStatus, string> = {
  draft: "Draft",
  available: "Tersedia",
  claimed: "Diklaim",
  pickup_planned: "Pickup direncanakan",
  picked_up: "Sudah diambil",
  sorting: "Sedang dipilah",
  sorted: "Sudah dipilah",
  converted_to_material: "Jadi material",
  cancelled: "Dibatalkan",
};

export const orderStatusLabels: Record<string, string> = {
  created: "Baru dibuat",
  negotiating: "Negosiasi",
  accepted: "Disetujui",
  rejected: "Ditolak",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const materialBatchStatusLabels: Record<string, string> = {
  draft: "Draft",
  available: "Tersedia",
  ordered: "Dipesan",
  negotiating: "Negosiasi",
  sold: "Terjual",
  unavailable: "Tidak tersedia",
  cancelled: "Dibatalkan",
};

export const pickupClaimStatusLabels: Record<string, string> = {
  requested: "Diminta",
  accepted: "Diterima",
  rejected: "Ditolak",
  picked_up: "Sudah diambil",
  cancelled: "Dibatalkan",
};

export const routeStatusLabels: Record<string, string> = {
  planned: "Direncanakan",
  ongoing: "Berlangsung",
  in_progress: "Berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const negotiationStatusLabels: Record<string, string> = {
  open: "Terbuka",
  countered: "Ditawar ulang",
  accepted: "Disepakati",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

export const transactionStatusLabels: Record<string, string> = {
  simulated_pending: "Menunggu pembayaran",
  simulated_paid: "Sudah dibayar",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const roleDashboardPath: Record<string, string> = {
  household: "/dashboard/household",
  collector: "/dashboard/collector",
  industry: "/dashboard/industry",
};

export const demoAccounts = [
  {
    role: "household",
    email: "household1@pacul-demo.com",
    label: "Siti Rahayu (Rumah Tangga)",
  },
  {
    role: "collector",
    email: "collector1@pacul-demo.com",
    label: "Andi Pengepul (Pengepul)",
  },
  {
    role: "industry",
    email: "industry1@pacul-demo.com",
    label: "PT Daur Nusantara (Industri)",
  },
] as const;

export const defaultDemoPassword = "PaculDemo2025!";
