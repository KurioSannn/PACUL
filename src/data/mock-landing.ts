import type { WasteCategory } from "@/types/pacul";
import { routes } from "@/lib/routes";

export type ProblemItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type WorkflowStep = {
  id: string;
  step: number;
  title: string;
  description: string;
  icon: string;
};

export type FeatureItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type MarketplaceListingPreview = {
  id: string;
  title: string;
  category: WasteCategory;
  categoryLabel: string;
  weightKg: number;
  district: string;
  estimatedPricePerKg: number;
  status: string;
};

export type ImpactMetric = {
  id: string;
  label: string;
  value: string;
  unit: string;
  description: string;
};

export type LandingStat = {
  id: string;
  label: string;
  value: string;
  description: string;
};

export type CircularShowcaseItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  examples: string[];
  tone: "mint" | "sand";
};

export type RoleBenefit = {
  id: string;
  role: string;
  title: string;
  description: string;
  benefits: string[];
  icon: string;
};

export const mockProblems: ProblemItem[] = [
  {
    id: "problem-household",
    icon: "home",
    title: "Sampah terpilah tidak punya tujuan",
    description: "Rumah tangga yang sudah memilah sampah kesulitan menemukan pengepul yang mau mengambil dengan harga wajar.",
  },
  {
    id: "problem-collector",
    icon: "truck",
    title: "Pengepul terbatas jenis dan rute",
    description: "Pengepul hanya menangani material tertentu dan biaya operasional rute pengambilan sering tidak efisien.",
  },
  {
    id: "problem-industry",
    icon: "factory",
    title: "Pasokan material tidak konsisten",
    description: "Industri pengolah membutuhkan pasokan bahan baku daur ulang yang stabil, tapi sumber materialnya tersebar dan sulit dilacak.",
  },
  {
    id: "problem-traceability",
    icon: "search",
    title: "Tidak ada jejak dari sumber ke pembeli",
    description: "Tidak ada sistem yang mencatat asal material dari rumah tangga hingga sampai ke industri pengolah.",
  },
];

export const mockWorkflowSteps: WorkflowStep[] = [
  {
    id: "step-listing",
    step: 1,
    title: "Upload dan buat listing",
    description: "Rumah tangga memfoto sampah terpilah, mengisi kategori dan berat, lalu menerbitkan listing.",
    icon: "camera",
  },
  {
    id: "step-classify",
    step: 2,
    title: "Klasifikasi otomatis",
    description: "Sistem membantu mengenali jenis sampah dari foto dan menyarankan kategori yang sesuai.",
    icon: "scan",
  },
  {
    id: "step-pickup",
    step: 3,
    title: "Pengepul mengambil",
    description: "Pengepul menerima permintaan pickup berdasarkan material yang ditangani dan jarak rute.",
    icon: "package",
  },
  {
    id: "step-industry",
    step: 4,
    title: "Industri membeli material",
    description: "Industri pengolah menelusuri asal material dan membeli dari pengepul dengan riwayat yang jelas.",
    icon: "handshake",
  },
];

export const mockFeatures: FeatureItem[] = [
  {
    id: "feature-rbac",
    title: "Akses berbasis peran",
    description: "Tiga peran utama: rumah tangga, pengepul, dan industri pengolah. Masing-masing punya dashboard sendiri.",
    icon: "users",
  },
  {
    id: "feature-listing",
    title: "Listing sampah terpilah",
    description: "Buat listing dengan kategori, berat, foto, dan lokasi. Status listing terlacak dari draft sampai diambil.",
    icon: "list",
  },
  {
    id: "feature-marketplace",
    title: "Marketplace material",
    description: "Industri dapat menelusuri stok material dari pengepul, lengkap dengan harga dan asal material.",
    icon: "store",
  },
  {
    id: "feature-classification",
    title: "Klasifikasi foto sampah",
    description: "Model AI membantu mengenali jenis sampah dari foto dan menyarankan kategori yang sesuai.",
    icon: "scan",
  },
  {
    id: "feature-pickup",
    title: "Permintaan pickup",
    description: "Pengepul menerima permintaan pickup dengan estimasi jarak, biaya, dan jadwal pengambilan.",
    icon: "truck",
  },
  {
    id: "feature-order",
    title: "Order dan transaksi",
    description: "Status transaksi terlacak dari negosiasi, persetujuan harga, pembayaran, hingga pengiriman.",
    icon: "receipt",
  },
  {
    id: "feature-impact",
    title: "Dashboard dampak",
    description: "Lihat estimasi material terkumpul, pendapatan rumah tangga, dan kontribusi pengurangan emisi.",
    icon: "bar-chart",
  },
  {
    id: "feature-traceability",
    title: "Riwayat dan traceability",
    description: "Lacak perjalanan material dari listing rumah tangga hingga pembelian oleh industri pengolah.",
    icon: "route",
  },
];

export const mockMarketplacePreview: MarketplaceListingPreview[] = [
  {
    id: "preview-pet",
    title: "Botol PET bening",
    category: "plastic",
    categoryLabel: "Plastik",
    weightKg: 8,
    district: "Rungkut",
    estimatedPricePerKg: 3200,
    status: "Tersedia",
  },
  {
    id: "preview-kardus",
    title: "Kardus kering",
    category: "paper",
    categoryLabel: "Kertas",
    weightKg: 12,
    district: "Wonokromo",
    estimatedPricePerKg: 2100,
    status: "Tersedia",
  },
  {
    id: "preview-kaleng",
    title: "Kaleng aluminium",
    category: "metal",
    categoryLabel: "Logam",
    weightKg: 3,
    district: "Gubeng",
    estimatedPricePerKg: 12500,
    status: "Tersedia",
  },
  {
    id: "preview-campuran",
    title: "Plastik campuran",
    category: "plastic",
    categoryLabel: "Plastik",
    weightKg: 6,
    district: "Sukolilo",
    estimatedPricePerKg: 1800,
    status: "Terjadwal",
  },
];

export const mockImpactMetrics: ImpactMetric[] = [
  {
    id: "impact-material",
    label: "Material terkumpul",
    value: "2.4",
    unit: "ton",
    description: "Total material daur ulang yang tercatat dalam sistem demo.",
  },
  {
    id: "impact-income",
    label: "Estimasi pendapatan RT",
    value: "Rp 3,2",
    unit: "juta",
    description: "Akumulasi pendapatan rumah tangga dari penjualan sampah terpilah.",
  },
  {
    id: "impact-co2",
    label: "CO₂e dihindari",
    value: "1.8",
    unit: "ton",
    description: "Estimasi emisi karbon yang dihindari dari proses daur ulang.",
  },
  {
    id: "impact-transactions",
    label: "Transaksi selesai",
    value: "48",
    unit: "transaksi",
    description: "Jumlah transaksi yang berhasil diselesaikan dalam sistem demo.",
  },
];

export const mockLandingStats: LandingStat[] = [
  {
    id: "marketplace-weight",
    label: "Sampah di Marketplace",
    value: "128 kg",
    description: "Total material dan sampah yang tercatat tersedia di platform demo.",
  },
  {
    id: "sold-transactions",
    label: "Transaksi Terjual",
    value: "42 transaksi",
    description: "Jumlah transaksi material yang berhasil diproses dalam simulasi PACUL.",
  },
  {
    id: "user-reviews",
    label: "Ulasan Pengguna",
    value: "96 ulasan",
    description: "Jumlah ulasan demo dari pengguna dan mitra yang berinteraksi di PACUL.",
  },
];

export const mockCircularShowcase: CircularShowcaseItem[] = [
  {
    id: "raw-materials",
    title: "Material Mentah",
    description:
      "Bahan awal yang sudah dipilah dan siap diambil atau diproses lebih lanjut oleh mitra pengelola material.",
    href: routes.marketplaceWaste,
    cta: "Lihat Material",
    examples: ["Plastik PET", "Kardus kering", "Logam", "Kaca"],
    tone: "mint",
  },
  {
    id: "recycled-products",
    title: "Produk Daur Ulang",
    description:
      "Hasil olahan dan bahan baku turunan yang memiliki nilai guna serta siap ditawarkan kembali ke pasar.",
    href: routes.marketplaceMaterials,
    cta: "Lihat Produk",
    examples: ["PET flakes", "Kardus press", "Biji plastik", "Produk turunan"],
    tone: "sand",
  },
];

export const ecosystemPartnerTypes = [
  "Bank Sampah",
  "Komunitas Lingkungan",
  "Pelaku Daur Ulang",
  "UMKM",
  "Industri",
  "Kampus",
  "Program CSR",
  "Mitra Distribusi",
];

export const mockRoleBenefits: RoleBenefit[] = [
  {
    id: "role-household",
    role: "Rumah Tangga",
    title: "Jual sampah terpilah dengan mudah",
    description: "Buat listing, foto sampah, dan tunggu pengepul datang mengambil.",
    benefits: [
      "Buat listing dalam hitungan menit",
      "Klasifikasi foto otomatis",
      "Pantau status pickup",
      "Lihat riwayat penjualan",
    ],
    icon: "home",
  },
  {
    id: "role-collector",
    role: "Pengepul",
    title: "Temukan pickup sesuai material dan rute",
    description: "Kelola pengambilan, pilah material, dan jual ke industri pengolah.",
    benefits: [
      "Filter listing berdasarkan material",
      "Optimasi rute pengambilan",
      "Sorting dan grading material",
      "Jual stok ke industri",
    ],
    icon: "truck",
  },
  {
    id: "role-industry",
    role: "Industri Pengolah",
    title: "Pasokan material lebih konsisten",
    description: "Telusuri marketplace material dan beli dari pengepul dengan riwayat jelas.",
    benefits: [
      "Marketplace material terlacak",
      "Negosiasi harga langsung",
      "Riwayat transaksi lengkap",
      "Traceability sumber material",
    ],
    icon: "factory",
  },
];

export const mockClassificationClasses = [
  { label: "Plastik", description: "PET, HDPE, PP, plastik campuran", confidence: "85-95%" },
  { label: "Kertas/Kardus", description: "Kardus kering, kertas HVS, koran", confidence: "88-96%" },
  { label: "Logam", description: "Kaleng aluminium, besi ringan", confidence: "90-97%" },
  { label: "Kaca", description: "Botol kaca bening, kaca berwarna", confidence: "82-93%" },
  { label: "Campuran", description: "Material yang belum bisa diklasifikasi secara pasti", confidence: "60-80%" },
];
