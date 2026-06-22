"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Leaf } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { getSidebarNav } from "@/lib/role-navigation";
import { routes } from "@/lib/routes";
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
    <aside className="hidden w-56 shrink-0 border-r border-[var(--color-line)] bg-white lg:block">
      <div className="sticky top-14 flex max-h-[calc(100vh-3.5rem)] flex-col overflow-y-auto px-3 py-5">
        <p className="px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-leaf-700)]">
          Menu {roleLabel}
        </p>

        {items.map((group, i) => (
          <div key={i} className="mt-4">
            {group.title && (
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-ink-500)]">
                {group.title}
              </p>
            )}
            <nav className="flex flex-col gap-0.5" aria-label={`Navigasi ${group.title ?? ""}`}>
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--color-mint-100)] font-semibold text-[var(--color-forest-900)]"
                        : "text-[var(--color-ink-600)] hover:bg-[var(--color-sage-50)] hover:text-[var(--color-forest-900)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
