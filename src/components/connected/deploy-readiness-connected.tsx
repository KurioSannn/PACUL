"use client";

import { useEffect, useState } from "react";

import { apiHealthCheck, getCapabilities, getModelVersion } from "@/lib/api";
import { appConfig } from "@/lib/config";

type CheckItem = {
  label: string;
  status: "ok" | "fail" | "pending";
  note: string;
};

export function DeployReadinessConnected() {
  const [checks, setChecks] = useState<CheckItem[]>([
    { label: "API health", status: "pending", note: "Memeriksa GET /health" },
    { label: "RBAC capabilities", status: "pending", note: "Memeriksa GET /roles/capabilities" },
    { label: "AI model version", status: "pending", note: "Memeriksa GET /ai/model-version" },
    { label: "Frontend config", status: "pending", note: "Memeriksa env frontend" },
    { label: "Supabase client", status: "pending", note: "Memeriksa konfigurasi auth" },
  ]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const next: CheckItem[] = [...checks];

      try {
        const healthy = await apiHealthCheck();
        next[0] = {
          label: "API health",
          status: healthy ? "ok" : "fail",
          note: healthy ? `${appConfig.apiUrl}/health → ok` : "Backend tidak merespons",
        };
      } catch {
        next[0] = { label: "API health", status: "fail", note: "Backend tidak dapat dijangkau" };
      }

      try {
        const caps = await getCapabilities();
        const roleCount = Object.keys(caps).length;
        next[1] = {
          label: "RBAC capabilities",
          status: roleCount > 0 ? "ok" : "fail",
          note: `${roleCount} role terdaftar`,
        };
      } catch {
        next[1] = { label: "RBAC capabilities", status: "fail", note: "Gagal memuat capabilities" };
      }

      try {
        const model = await getModelVersion();
        next[2] = {
          label: "AI model version",
          status: "ok",
          note: `${model.model_type} v${model.version_string}`,
        };
      } catch {
        next[2] = { label: "AI model version", status: "fail", note: "Endpoint AI tidak tersedia" };
      }

      next[3] = {
        label: "Frontend config",
        status: appConfig.apiUrl ? "ok" : "fail",
        note: `API URL: ${appConfig.apiUrl}`,
      };

      next[4] = {
        label: "Supabase client",
        status: appConfig.isSupabaseConfigured ? "ok" : "fail",
        note: appConfig.isSupabaseConfigured
          ? "NEXT_PUBLIC_SUPABASE_URL & ANON_KEY terisi"
          : "Isi .env.local untuk login",
      };

      if (active) setChecks(next);
    };

    void run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-shell grow space-y-6 py-8">
      <header className="rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-10 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">Deploy readiness</p>
        <h1 className="mt-3 text-3xl font-semibold">Status integrasi lokal</h1>
        <p className="mt-3 text-sm text-white/70">Pemeriksaan otomatis terhadap backend dan konfigurasi frontend.</p>
      </header>

      <div className="grid gap-3">
        {checks.map((item) => (
          <article key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border bg-white p-5">
            <div>
              <p className="font-semibold">{item.label}</p>
              <p className="text-sm text-[var(--color-ink-600)]">{item.note}</p>
            </div>
            <span
              className={
                item.status === "ok"
                  ? "rounded-full bg-[var(--color-mint-100)] px-3 py-1 text-xs font-semibold text-[var(--color-leaf-700)]"
                  : item.status === "fail"
                    ? "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                    : "rounded-full bg-[var(--color-sage-50)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-500)]"
              }
            >
              {item.status === "ok" ? "OK" : item.status === "fail" ? "Gagal" : "..."}
            </span>
          </article>
        ))}
      </div>
    </main>
  );
}
