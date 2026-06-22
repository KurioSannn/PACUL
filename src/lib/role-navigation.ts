import type { UserRole } from "@/lib/api/types";
import { routes } from "@/lib/routes";

export type NavLink = { href: string; label: string };

export function getPrimaryCta(
  role: UserRole | undefined,
  isLoggedIn: boolean,
): NavLink {
  if (!isLoggedIn) {
    return { href: routes.authRegister, label: "Daftar Gratis" };
  }
  if (role === "household") {
    return { href: routes.listingsNew, label: "Buat Listing" };
  }
  if (role === "collector") {
    return { href: routes.collectorPickups, label: "Pickup Tersedia" };
  }
  return { href: routes.marketplaceMaterials, label: "Cari Material" };
}

export function getHeaderNav(
  role: UserRole | undefined,
  isLoggedIn: boolean,
): NavLink[] {
  if (!isLoggedIn) {
    return [
      { href: routes.wasteCategories, label: "Kategori Sampah" },
      { href: routes.deployReadiness, label: "Status Sistem" },
      { href: routes.authLogin, label: "Masuk" },
    ];
  }

  const shared: NavLink[] = [
    { href: role ? (role === "household" ? routes.dashboardHousehold : role === "collector" ? routes.dashboardCollector : routes.dashboardIndustry) : routes.dashboard, label: "Dashboard" },
    { href: routes.impact, label: "Dampak" },
    { href: routes.reports, label: "Laporan" },
  ];

  if (role === "household") {
    return [
      ...shared,
      { href: routes.marketplace, label: "Marketplace" },
      { href: routes.myMaterials, label: "Listing Saya" },
      { href: routes.pickupTracking, label: "Status Pickup" },
    ];
  }

  if (role === "collector") {
    return [
      ...shared,
      { href: routes.marketplace, label: "Marketplace" },
      { href: routes.collectorPickups, label: "Pickup" },
      { href: routes.pickupRoutes, label: "Rute" },
    ];
  }

  return [
    ...shared,
    { href: routes.marketplace, label: "Marketplace" },
    { href: routes.orders, label: "Pesanan" },
    { href: routes.transactions, label: "Transaksi" },
  ];
}

export function getSidebarNav(
  role: UserRole | undefined,
): NavLink[] {
  if (!role) return [];

  const dashboard =
    role === "household"
      ? routes.dashboardHousehold
      : role === "collector"
        ? routes.dashboardCollector
        : routes.dashboardIndustry;

  const common: NavLink[] = [
    { href: dashboard, label: "Dashboard" },
    { href: routes.marketplace, label: "Marketplace" },
    { href: routes.profile, label: "Profil" },
    { href: routes.impact, label: "Dashboard Dampak" },
    { href: routes.reports, label: "Laporan" },
    { href: routes.notifications, label: "Notifikasi" },
  ];

  if (role === "household") {
    return [
      ...common.slice(0, 2),
      { href: routes.listingsNew, label: "Jual Sampah" },
      { href: routes.myMaterials, label: "Listing Saya" },
      { href: routes.classificationDemo, label: "Klasifikasi AI" },
      { href: routes.pickupTracking, label: "Status Pickup" },
      { href: routes.reviews, label: "Rating" },
      ...common.slice(2),
      { href: routes.points, label: "EcoPoints" },
    ];
  }

  if (role === "collector") {
    return [
      ...common.slice(0, 2),
      { href: routes.collectorHandledCategories, label: "Kategori Ditangani" },
      { href: routes.collectorPickups, label: "Pickup Tersedia" },
      { href: routes.pickupRoutes, label: "Rute Pengambilan" },
      { href: routes.collectorSorting, label: "Pemilahan" },
      { href: routes.collectorMaterialsNew, label: "Bahan Baku Baru" },
      { href: routes.negotiations, label: "Negosiasi" },
      { href: routes.transactions, label: "Transaksi" },
      ...common.slice(2),
      { href: routes.points, label: "EcoPoints" },
    ];
  }

  return [
    ...common.slice(0, 2),
    { href: routes.marketplaceMaterials, label: "Cari Bahan Baku" },
    { href: routes.orders, label: "Pesanan" },
    { href: routes.negotiations, label: "Negosiasi" },
    { href: routes.transactions, label: "Transaksi" },
    { href: routes.reviews, label: "Rating" },
    ...common.slice(2),
  ];
}

export function showMessagesLink(role: UserRole | undefined): boolean {
  return role === "industry" || role === "collector";
}
