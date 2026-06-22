"use client";

import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { exportReportExcel, exportReportPdf, listReports } from "@/lib/api";

export function ReportsConnected() {
  const { accessToken } = useAuth();
  const { pushToast } = useToast();
  const [isExporting, setIsExporting] = useState<"pdf" | "excel" | null>(null);
  const reportsQuery = useAsyncData(
    () => listReports(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const exportPdf = async () => {
    if (!accessToken) return;
    setIsExporting("pdf");
    try {
      const report = await exportReportPdf(accessToken, {});
      pushToast(`Laporan PDF dibuat (${report.id.slice(0, 8)}).`, "success");
      await reportsQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Export PDF gagal.", "error");
    } finally {
      setIsExporting(null);
    }
  };

  const exportExcel = async () => {
    if (!accessToken) return;
    setIsExporting("excel");
    try {
      const report = await exportReportExcel(accessToken, {});
      pushToast(`Laporan Excel dibuat (${report.id.slice(0, 8)}).`, "success");
      await reportsQuery.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Export Excel gagal.", "error");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <RequireAuth>
      <div className="page-shell grow space-y-6 py-8">
        <PageHeader
          eyebrow="Laporan"
          title="Export dan riwayat laporan"
          description="Unduh ringkasan dampak dan transaksi dalam format PDF atau Excel untuk presentasi juri."
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isExporting !== null}
            onClick={() => void exportPdf()}
            className="rounded-full bg-[var(--color-forest-900)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isExporting === "pdf" ? "Mengekspor..." : "Export PDF"}
          </button>
          <button
            type="button"
            disabled={isExporting !== null}
            onClick={() => void exportExcel()}
            className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {isExporting === "excel" ? "Mengekspor..." : "Export Excel"}
          </button>
        </div>

        <section className="space-y-3">
          <h2 className="font-semibold">Riwayat laporan</h2>
          {(reportsQuery.data ?? []).map((report) => (
            <article key={report.id} className="rounded-2xl border bg-white p-4 text-sm shadow-sm">
              <p className="font-semibold capitalize">{report.report_type} · {report.format.toUpperCase()}</p>
              <p className="text-[var(--color-ink-500)]">
                {report.status} · {new Date(report.created_at).toLocaleString("id-ID")}
              </p>
            </article>
          ))}
          {!reportsQuery.isLoading && (reportsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-ink-500)]">Belum ada laporan. Klik export di atas untuk membuat.</p>
          ) : null}
        </section>
      </div>
    </RequireAuth>
  );
}
