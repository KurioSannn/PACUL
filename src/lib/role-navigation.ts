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
    return { href: routes.listingsNew, label: "Jual Sampah" };
  }
  if (role === "collector") {
    return { href: routes.pickupRoutes, label: "Optimasi Rute" };
  }
  return { href: routes.ordersNew, label: "Pesan Material" };
}

/** Public landing header only — not used in authenticated app shell. */
export function getHeaderNav(
  role: UserRole | undefined,
  isLoggedIn: boolean,
): NavLink[] {
  if (!isLoggedIn) {
    return [
      { href: `${routes.home}#alur`, label: "Alur" },
      { href: routes.marketplace, label: "Marketplace" },
      { href: routes.demo, label: "Demo" },
      { href: routes.authLogin, label: "Masuk" },
    ];
  }

  return [
    { href: routes.marketplace, label: "Marketplace" },
    { href: routes.demo, label: "Panduan Demo" },
  ];
}

export type NavGroup = { title?: string; items: NavLink[] };

/** Sidebar / mobile menu: core workflow per role only. */
export function getSidebarNav(role: UserRole | undefined): NavGroup[] {
  if (!role) return [];

  const dashboard =
    role === "household"
      ? routes.dashboardHousehold
      : role === "collector"
        ? routes.dashboardCollector
        : routes.dashboardIndustry;

  if (role === "household") {
    return [
      {
        title: "Utama",
        items: [
          { href: dashboard, label: "Beranda" },
        ],
      },
      {
        title: "Penjualan",
        items: [
          { href: routes.listingsNew, label: "Jual Sampah (AI)" },
          { href: routes.myMaterials, label: "Riwayat Jual" },
          { href: routes.pickupTracking, label: "Status Penjemputan" },
        ],
      },
    ];
  }

  if (role === "collector") {
    return [
      {
        title: "Utama",
        items: [
          { href: dashboard, label: "Beranda" },
          { href: routes.collectorHandledCategories, label: "Pengaturan Kategori" },
        ],
      },
      {
        title: "Alur Pengepul",
        items: [
          { href: routes.collectorPickups, label: "1. Klaim Sampah RT" },
          { href: routes.pickupRoutes, label: "2. Peta Rute Pengambilan" },
          { href: routes.collectorSorting, label: "3. Pilah jadi Bahan Baku" },
          { href: routes.collectorMaterialsNew, label: "4. Jual ke Industri" },
        ],
      },
      {
        title: "Transaksi",
        items: [
          { href: routes.negotiations, label: "Negosiasi Harga" },
          { href: routes.transactions, label: "Riwayat Transaksi" },
        ],
      },
    ];
  }

  return [
    {
      title: "Utama",
      items: [
        { href: dashboard, label: "Beranda" },
      ],
    },
    {
      title: "Pembelian",
      items: [
        { href: routes.marketplaceMaterials, label: "Beli Bahan Baku" },
        { href: routes.orders, label: "Pesanan Saya" },
      ],
    },
    {
      title: "Transaksi",
      items: [
        { href: routes.negotiations, label: "Negosiasi Harga" },
        { href: routes.transactions, label: "Riwayat Transaksi" },
      ],
    },
  ];
}

export function showMessagesLink(role: UserRole | undefined): boolean {
  return role === "industry" || role === "collector";
}
