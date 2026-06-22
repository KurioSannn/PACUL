"use client";

import { Download, FileText, Filter, PackageCheck, Scale, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

import { mockMaterialStocks, mockOrders, mockWasteListings } from "@/data/mock-pacul";
import { materialStatusLabels, orderStatusLabels, wasteListingStatusLabels } from "@/lib/constants";
import { formatCurrency, formatWeight } from "@/lib/format";
import type { UserRole } from "@/types/pacul";

type ReportPeriod = "7" | "30" | "all";

type ReportRow = {
  id: string;
  role: UserRole;
  date: string;
  activity: string;
  item: string;
  status: string;
  weightKg: number;
  value: number | null;
};

const roleLabels: Record<UserRole, string> = {
  household: "Rumah Tangga",
  collector: "Pengelola Material",
  industry: "Industri Pengolah",
};

const reportRows: ReportRow[] = [
  ...mockWasteListings.map((listing) => ({
    id: `report-${listing.id}`,
    role: "household" as const,
    date: listing.createdAt,
    activity: "Listing sampah",
    item: listing.title,
    status: wasteListingStatusLabels[listing.status],
    weightKg: listing.weightKg,
    value: null,
  })),
  ...mockMaterialStocks.map((material) => ({
    id: `report-${material.id}`,
    role: "collector" as const,
    date: material.createdAt,
    activity: "Stok bahan baku",
    item: material.materialName,
    status: materialStatusLabels[material.status],
    weightKg: material.weightKg,
    value: material.pricePerKg * material.weightKg,
  })),
  ...mockOrders.map((order) => ({
    id: `report-${order.id}`,
    role: "industry" as const,
    date: order.createdAt,
    activity: "Pesanan material",
    item: order.materialName,
    status: orderStatusLabels[order.status],
    weightKg: order.totalKg,
    value: order.totalPrice,
  })),
];

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function UserReportDashboard() {
  const [role, setRole] = useState<UserRole>("household");
  const [period, setPeriod] = useState<ReportPeriod>("30");
  const [downloadStatus, setDownloadStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const filteredRows = useMemo(() => {
    const roleRows = reportRows.filter((row) => row.role === role);
    if (period === "all") return roleRows;

    const newestTimestamp = Math.max(...reportRows.map((row) => new Date(row.date).getTime()));
    const periodStart = newestTimestamp - Number(period) * 24 * 60 * 60 * 1000;
    return roleRows.filter((row) => new Date(row.date).getTime() >= periodStart);
  }, [period, role]);

  const totalWeight = filteredRows.reduce((total, row) => total + row.weightKg, 0);
  const totalValue = filteredRows.reduce((total, row) => total + (row.value ?? 0), 0);
  const completedCount = filteredRows.filter((row) => ["Terjual", "Selesai", "Dibayar", "Sudah diambil"].includes(row.status)).length;

  const downloadCsv = () => {
    try {
      const header = ["Tanggal", "Peran", "Aktivitas", "Item", "Status", "Berat (kg)", "Nilai (Rp)"];
      const rows = filteredRows.map((row) => [
        new Date(row.date).toLocaleDateString("id-ID"),
        roleLabels[row.role],
        row.activity,
        row.item,
        row.status,
        row.weightKg,
        row.value ?? "",
      ]);
      const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
      const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `laporan-pacul-${role}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setDownloadStatus({ tone: "success", message: `Laporan ${roleLabels[role]} berhasil disiapkan dalam format CSV.` });
    } catch {
      setDownloadStatus({ tone: "error", message: "Laporan belum bisa diunduh. Muat ulang halaman lalu coba kembali." });
    }
  };

  return (
    <main className="page-shell space-y-8">
      <header className="rounded-[1.75rem] border border-[var(--color-line)] bg-white p-6 sm:p-9">
        <p className="eyebrow">Laporan pengguna</p>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-[var(--color-forest-900)] sm:text-4xl">Ringkasan aktivitas sesuai peran Anda.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-ink-700)] sm:text-base">Pilih peran dan periode untuk melihat volume material, aktivitas tercatat, serta nilai transaksi dari data demo PACUL.</p>
          </div>
          <button type="button" onClick={downloadCsv} disabled={filteredRows.length === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-leaf-600)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)] disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="size-4" aria-hidden="true" />
            Unduh CSV
          </button>
        </div>
        <p className="mt-5 text-xs leading-5 text-[var(--color-ink-500)]">Laporan ini menggunakan data simulasi MVP. Ekspor CSV berjalan di browser dan belum mengambil data backend.</p>
        {downloadStatus ? (
          <p aria-live="polite" className={downloadStatus.tone === "success" ? "mt-4 rounded-xl bg-[var(--color-mint-100)] px-4 py-3 text-sm font-medium text-[var(--color-leaf-700)]" : "mt-4 rounded-xl bg-[var(--color-red-100)] px-4 py-3 text-sm font-medium text-[var(--color-red-700)]"}>
            {downloadStatus.message}
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-sage-50)] p-4 sm:p-5" aria-labelledby="report-filter-title">
        <div className="mb-4 flex items-center gap-2"><Filter className="size-4 text-[var(--color-leaf-700)]" aria-hidden="true" /><h2 id="report-filter-title" className="text-sm font-semibold text-[var(--color-forest-900)]">Filter laporan</h2></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--color-ink-700)]">
            Peran pengguna
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="min-h-12 rounded-xl border border-[var(--color-line)] bg-white px-3 text-sm font-medium text-[var(--color-forest-900)] focus:border-[var(--color-leaf-500)] focus:ring-2 focus:ring-[var(--color-mint-200)]">
              {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--color-ink-700)]">
            Periode
            <select value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)} className="min-h-12 rounded-xl border border-[var(--color-line)] bg-white px-3 text-sm font-medium text-[var(--color-forest-900)] focus:border-[var(--color-leaf-500)] focus:ring-2 focus:ring-[var(--color-mint-200)]">
              <option value="7">7 hari terakhir</option>
              <option value="30">30 hari terakhir</option>
              <option value="all">Semua data demo</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan laporan">
        {[
          { label: "Aktivitas tercatat", value: String(filteredRows.length), hint: roleLabels[role], icon: FileText },
          { label: "Volume material", value: formatWeight(totalWeight), hint: "Akumulasi periode", icon: Scale },
          { label: "Status selesai", value: String(completedCount), hint: "Aktivitas tuntas", icon: PackageCheck },
          { label: "Nilai tercatat", value: totalValue > 0 ? formatCurrency(totalValue) : "Belum tersedia", hint: "Berdasarkan data bernilai", icon: WalletCards },
        ].map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <metric.icon className="size-5 text-[var(--color-leaf-700)]" aria-hidden="true" />
            <p className="mt-5 text-xs font-semibold text-[var(--color-ink-500)]">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-forest-900)]">{metric.value}</p>
            <p className="mt-2 text-xs text-[var(--color-ink-500)]">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white" aria-labelledby="report-table-title">
        <div className="border-b border-[var(--color-line)] px-5 py-4"><h2 id="report-table-title" className="text-lg font-semibold text-[var(--color-forest-900)]">Aktivitas terbaru</h2></div>
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center"><p className="font-semibold text-[var(--color-forest-900)]">Belum ada aktivitas pada periode ini.</p><p className="mt-2 text-sm text-[var(--color-ink-500)]">Ubah periode untuk melihat data demo lainnya.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-[var(--color-sage-50)] text-xs uppercase tracking-wide text-[var(--color-ink-500)]"><tr><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3">Aktivitas</th><th className="px-5 py-3">Item</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Berat</th><th className="px-5 py-3 text-right">Nilai</th></tr></thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {filteredRows.map((row) => <tr key={row.id}><td className="whitespace-nowrap px-5 py-4 text-[var(--color-ink-500)]">{new Date(row.date).toLocaleDateString("id-ID")}</td><td className="px-5 py-4 font-medium text-[var(--color-ink-700)]">{row.activity}</td><td className="px-5 py-4 font-semibold text-[var(--color-forest-900)]">{row.item}</td><td className="px-5 py-4 text-[var(--color-ink-700)]">{row.status}</td><td className="whitespace-nowrap px-5 py-4 text-right text-[var(--color-ink-700)]">{formatWeight(row.weightKg)}</td><td className="whitespace-nowrap px-5 py-4 text-right font-medium text-[var(--color-earth-700)]">{row.value ? formatCurrency(row.value) : "—"}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
