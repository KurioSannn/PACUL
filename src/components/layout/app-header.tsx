"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, MessageCircle, ShoppingCart, Star, User } from "lucide-react";
import { useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { appConfig } from "@/lib/config";
import type { UserRole } from "@/lib/api/types";
import { getPrimaryCta, getSidebarNav, showMessagesLink } from "@/lib/role-navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const roleLabels = {
  household: "Rumah Tangga",
  collector: "Pengepul",
  industry: "Industri",
} as const;

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut, switchDevRole, isLoading } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!profile) {
    if (appConfig.devBypassAuth) {
      return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          DEV · Memuat session demo...
        </header>
      );
    }
    return null;
  }

  const sidebarItems = getSidebarNav(profile.role);
  const primaryCta = getPrimaryCta(profile.role, true);
  const roleLabel = roleLabels[profile.role];

  const handleSignOut = async () => {
    await signOut();
    router.replace(routes.authLogin);
  };

  const iconBtn =
    "inline-flex size-9 items-center justify-center rounded-lg text-[var(--color-ink-600)] transition-colors hover:bg-[var(--color-mint-100)] hover:text-[var(--color-forest-900)]";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-line)] bg-white/95 backdrop-blur-md">
      {appConfig.devBypassAuth ? (
        <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-900">
          <span className="font-semibold">DEV · Auth bypass aktif</span>
          <div className="flex items-center gap-1">
            {(["household", "collector", "industry"] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                disabled={isLoading || profile?.role === role}
                onClick={() => void switchDevRole?.(role)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-semibold capitalize",
                  profile?.role === role ? "bg-amber-600 text-white" : "bg-white hover:bg-amber-100",
                )}
              >
                {role === "household" ? "RT" : role === "collector" ? "Pengepul" : "Industri"}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger className={cn(iconBtn, "lg:hidden")} aria-label="Buka menu aplikasi">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(86vw,18rem)] border-[var(--color-line)] p-0">
            <SheetHeader className="border-b border-[var(--color-line)] p-4 text-left">
              <SheetTitle className="text-[var(--color-forest-900)]">PACUL</SheetTitle>
              <SheetDescription>Alur kerja {roleLabel}</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3" aria-label="Menu aplikasi">
              {sidebarItems.map((group, i) => (
                <div key={i} className="mb-2">
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
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm font-semibold",
                          active
                            ? "bg-[var(--color-mint-100)] text-[var(--color-forest-900)]"
                            : "text-[var(--color-ink-600)] hover:bg-[var(--color-sage-50)]",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href={routes.dashboard} className="inline-flex shrink-0 items-center gap-2">
          <img src="/BISSMILAH MENANG fix.png" alt="PACUL" className="h-7 w-auto object-contain" />
        </Link>

        <span className="hidden rounded-full bg-[var(--color-mint-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-leaf-700)] sm:inline-flex">
          {roleLabel}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {profile.role === "industry" ? (
            <Link href={routes.checkout} className={cn(iconBtn, "relative")} aria-label={`Keranjang (${itemCount})`}>
              <ShoppingCart className="size-[18px]" />
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-leaf-600)] text-[10px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          {showMessagesLink(profile.role) ? (
            <Link href={routes.messages} className={iconBtn} aria-label="Pesan">
              <MessageCircle className="size-[18px]" />
            </Link>
          ) : null}
          <Link href={routes.notifications} className={iconBtn} aria-label="Notifikasi">
            <Bell className="size-[18px]" />
          </Link>
          <Link href={routes.reviews} className={iconBtn} aria-label="Rating">
            <Star className="size-[18px]" />
          </Link>
          <Link href={routes.profile} className={iconBtn} aria-label="Profil">
            <User className="size-[18px]" />
          </Link>
          <button type="button" onClick={() => void handleSignOut()} className={iconBtn} aria-label="Keluar">
            <LogOut className="size-[18px]" />
          </button>
        </div>

        <Link
          href={primaryCta.href}
          className="hidden shrink-0 rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)] sm:inline-flex"
        >
          {primaryCta.label}
        </Link>
      </div>
    </header>
  );
}
