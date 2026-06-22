"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { getSidebarNav } from "@/lib/role-navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useAuth();
  const items = getSidebarNav(profile?.role);

  if (!profile || items.length === 0) return null;

  return (
    <div className="border-b border-[var(--color-line)] bg-white lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold text-[var(--color-forest-900)]">Menu navigasi</p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-lg border border-[var(--color-line)]"
          aria-expanded={open}
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open ? (
        <nav className="border-t border-[var(--color-line)] px-2 pb-3" aria-label="Navigasi mobile">
          {items.map((group, i) => (
            <div key={i} className="mt-2">
              {group.title && (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-ink-500)]">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm font-semibold",
                      active
                        ? "bg-[var(--color-mint-100)] text-[var(--color-forest-900)]"
                        : "text-[var(--color-ink-600)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
