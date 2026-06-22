"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { getSidebarNav } from "@/lib/role-navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const items = getSidebarNav(profile?.role);

  if (!profile || items.length === 0) {
    return null;
  }

  const roleLabel =
    profile.role === "household"
      ? "Rumah Tangga"
      : profile.role === "collector"
        ? "Pengepul"
        : "Industri Pengolah";

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--color-line)] bg-white lg:block">
      <div className="sticky top-[72px] flex max-h-[calc(100vh-72px)] flex-col overflow-y-auto px-4 py-6">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-leaf-700)]">
          Menu {roleLabel}
        </p>
        <nav className="mt-4 flex flex-col gap-1" aria-label="Navigasi aplikasi">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[var(--color-mint-100)] text-[var(--color-forest-900)]"
                    : "text-[var(--color-ink-600)] hover:bg-[var(--color-sage-50)] hover:text-[var(--color-forest-900)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
