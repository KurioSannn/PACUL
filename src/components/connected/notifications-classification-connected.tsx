"use client";

import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useAsyncData } from "@/hooks/use-async-data";
import { classifyWaste, getModelVersion, listNotifications, markAllNotificationsRead, markNotificationRead, uploadWasteImage } from "@/lib/api";

export function NotificationsConnected() {
  const { accessToken } = useAuth();
  const notificationsQuery = useAsyncData(
    () => listNotifications(accessToken!),
    [accessToken],
    Boolean(accessToken),
  );

  const markRead = async (id: string) => {
    if (!accessToken) return;
    await markNotificationRead(accessToken, id);
    await notificationsQuery.reload();
  };

  const markAll = async () => {
    if (!accessToken) return;
    await markAllNotificationsRead(accessToken);
    await notificationsQuery.reload();
  };

  return (
    <RequireAuth>
      <div className="page-shell grow space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Notifikasi</h1>
            {(notificationsQuery.data?.unread_count ?? 0) > 0 ? (
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                {notificationsQuery.data?.unread_count} belum dibaca
              </p>
            ) : null}
          </div>
          <button type="button" onClick={() => void markAll()} className="text-sm font-semibold text-[var(--color-leaf-700)]">
            Tandai semua dibaca
          </button>
        </div>
        {notificationsQuery.isLoading ? <p>Memuat...</p> : null}
        <div className="space-y-3">
          {(notificationsQuery.data?.items ?? []).map((item) => (
            <article key={item.id} className={`rounded-2xl border p-4 ${item.is_read ? "bg-white" : "bg-[var(--color-mint-50)]"}`}>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="text-sm text-[var(--color-ink-600)]">{item.message}</p>
              {!item.is_read ? (
                <button type="button" onClick={() => void markRead(item.id)} className="mt-2 text-xs font-semibold text-[var(--color-leaf-700)]">
                  Tandai dibaca
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}

export function ClassificationDemoConnected() {
  const { accessToken } = useAuth();
  const modelQuery = useAsyncData(() => getModelVersion(), []);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File) => {
    if (!accessToken) return;
    setError(null);
    try {
      const uploaded = await uploadWasteImage(accessToken, file);
      const classified = await classifyWaste(accessToken, uploaded.path);
      setResult(`${classified.top_class} · ${Math.round(classified.confidence * 100)}% · model ${classified.model_version}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Klasifikasi gagal");
    }
  };

  return (
    <RequireAuth>
      <div className="page-shell grow space-y-6 py-8">
        <h1 className="text-2xl font-semibold">Klasifikasi AI (Backend)</h1>
        <p className="text-sm text-[var(--color-ink-600)]">
          Model aktif: {modelQuery.data?.version_string ?? "memuat..."} ({modelQuery.data?.model_type ?? "—"})
        </p>
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }} />
        {result ? <p className="rounded-xl bg-[var(--color-mint-50)] px-4 py-3 text-sm">{result}</p> : null}
        {error ? <p className="rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">{error}</p> : null}
      </div>
    </RequireAuth>
  );
}
