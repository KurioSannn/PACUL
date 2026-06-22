import { routes } from "@/lib/routes";

export type NavigationItem = {
  href: string;
  label: string;
  description?: string;
};

export type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

export const publicNavigation: NavigationSection = {
  title: "Publik",
  items: [
    { href: routes.home, label: "Beranda", description: "Alur tiga lapis dan demo data" },
    { href: routes.marketplaceWaste, label: "Marketplace sampah", description: "Listing sampah terpilah" },
    { href: routes.marketplaceMaterials, label: "Marketplace bahan baku", description: "Stok hasil pilah" },
    { href: routes.deployReadiness, label: "Deploy readiness", description: "Checklist demo" },
  ],
};

export const authNavigation: NavigationSection = {
  title: "Autentikasi",
  items: [
    { href: routes.authLogin, label: "Masuk", description: "Mock login form" },
    { href: routes.authRegister, label: "Daftar", description: "Mock register form" },
    { href: routes.authRole, label: "Pilih peran", description: "Role selection cards" },
  ],
};

export const householdNavigation: NavigationSection = {
  title: "Rumah Tangga",
  items: [
    { href: routes.dashboardHousehold, label: "Dashboard" },
    { href: routes.marketplaceWaste, label: "Listing sampah" },
    { href: routes.listingsNew, label: "Tambah listing" },
    { href: routes.classificationDemo, label: "Klasifikasi foto" },
    { href: routes.pickupRoutes, label: "Status pickup" },
    { href: routes.orders, label: "Riwayat transaksi" },
    { href: routes.reviews, label: "Ulasan" },
  ],
};

export const collectorNavigation: NavigationSection = {
  title: "Pengepul",
  items: [
    { href: routes.dashboardCollector, label: "Dashboard" },
    { href: routes.collectorPickups, label: "Pickup tersedia" },
    { href: routes.pickupRoutes, label: "Rute pickup" },
    { href: routes.pickupOptimizer, label: "Optimasi rute" },
    { href: routes.collectorSorting, label: "Pilah sampah" },
    { href: routes.collectorMaterialsNew, label: "Stok bahan baku" },
    { href: routes.negotiations, label: "Negosiasi" },
    { href: routes.traceability("material-demo-01"), label: "Traceability" },
  ],
};

export const industryNavigation: NavigationSection = {
  title: "Industri Pengolah",
  items: [
    { href: routes.dashboardIndustry, label: "Dashboard" },
    { href: routes.marketplaceMaterials, label: "Marketplace bahan baku" },
    { href: routes.orders, label: "Pesanan" },
    { href: routes.negotiations, label: "Negosiasi" },
    { href: routes.negotiationChat("neg-01"), label: "Chat negosiasi" },
    { href: routes.traceability("material-demo-01"), label: "Traceability" },
    { href: routes.reports, label: "Laporan" },
  ],
};

export const globalNavigation: NavigationSection = {
  title: "Global",
  items: [
    { href: routes.impact, label: "Impact dashboard" },
    { href: routes.reports, label: "Reports" },
    { href: routes.deployReadiness, label: "Deploy readiness" },
  ],
};

export const masterNavigation: NavigationSection = {
  title: "Master data",
  items: [{ href: routes.wasteCategories, label: "Kategori sampah" }],
};

export const dashboardNavigation = [
  householdNavigation,
  collectorNavigation,
  industryNavigation,
  globalNavigation,
  masterNavigation,
];