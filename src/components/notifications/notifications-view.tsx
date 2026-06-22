"use client";

import Link from "next/link";
import { Bell, Check, CheckCircle2, ChevronRight, MessageCircle, Package, Receipt, Info } from "lucide-react";
import { useMemo, useState } from "react";

import { mockNotifications } from "@/data/mock-household";
import type { NotificationItem, NotificationType } from "@/types/household";

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "pickup_scheduled":
    case "pickup_started":
    case "pickup_status":
      return <Package className="size-5 text-[var(--color-leaf-600)]" aria-hidden="true" />;
    case "transaction_completed":
      return <Receipt className="size-5 text-[var(--color-leaf-600)]" aria-hidden="true" />;
    case "chat_new":
      return <MessageCircle className="size-5 text-[var(--color-leaf-600)]" aria-hidden="true" />;
    case "report_ready":
    case "review_requested":
    default:
      return <Info className="size-5 text-[var(--color-ink-500)]" aria-hidden="true" />;
  }
}

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter(n => !n.read);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="page-shell grow py-8 max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Notifikasi</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Anda memiliki {unreadCount} pesan belum dibaca.</p>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex items-center rounded-full bg-white p-1 shadow-[var(--shadow-panel)] border border-[var(--color-line)]">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${filter === "all" ? "bg-[var(--color-forest-900)] text-white" : "text-[var(--color-ink-500)] hover:text-[var(--color-forest-900)]"}`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${filter === "unread" ? "bg-[var(--color-forest-900)] text-white" : "text-[var(--color-ink-500)] hover:text-[var(--color-forest-900)]"}`}
            >
              Belum dibaca
            </button>
          </nav>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-4 text-xs font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]"
            >
              <CheckCircle2 className="size-3.5" aria-hidden="true" /> Tandai semua dibaca
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-panel)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto size-10 text-[var(--color-ink-300)]" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-[var(--color-forest-900)]">Tidak ada notifikasi</p>
            <p className="mt-1 text-xs text-[var(--color-ink-500)]">Anda sudah membaca semua pemberitahuan.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-line)]">
            {filtered.map(item => (
              <li key={item.id} className={`group relative flex items-start gap-4 p-5 transition-colors hover:bg-[var(--color-sage-50)] ${!item.read ? "bg-[var(--color-mint-100)]/30" : ""}`}>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-sage-50)] border border-[var(--color-line)]">
                  <NotificationIcon type={item.type} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[var(--color-forest-900)]">{item.title}</h2>
                    <span className="shrink-0 text-xs text-[var(--color-ink-500)]">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ink-700)]">{item.message}</p>
                  
                  <div className="mt-3 flex items-center gap-3">
                    {item.relatedRoute && (
                      <Link
                        href={item.relatedRoute}
                        onClick={() => markAsRead(item.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-leaf-700)] hover:underline"
                      >
                        Lihat detail <ChevronRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    )}
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-500)] hover:text-[var(--color-forest-900)]"
                      >
                        <Check className="size-3.5" aria-hidden="true" /> Tandai dibaca
                      </button>
                    )}
                  </div>
                </div>
                {!item.read && <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-leaf-600)]" aria-hidden="true" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
