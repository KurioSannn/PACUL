"use client";

import Link from "next/link";
import { Menu, Recycle } from "lucide-react";
import { useEffect, useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "#alur", label: "Alur" },
  { href: routes.marketplaceWaste, label: "Marketplace" },
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.impact, label: "Dampak" },
  { href: routes.reports, label: "Laporan" },
];

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const heroEl = document.getElementById("utama");
      if (heroEl) {
        const heroBottom = heroEl.getBoundingClientRect().bottom;
        setScrolled(heroBottom <= 72);
      } else {
        setScrolled(window.scrollY > 12);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-white/95 backdrop-blur-lg shadow-sm"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="landing-shell flex h-[72px] items-center justify-between">
        {/* Logo */}
        <Link
          href={routes.home}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl p-2 font-semibold tracking-tight transition-colors",
            scrolled ? "hover:bg-[var(--color-mint-100)]" : "hover:bg-white/10"
          )}
        >
          <span className="grid size-8 place-items-center rounded-[10px] bg-[var(--color-forest-900)] text-white shadow-[0_1px_0_rgba(255,255,255,0.12)]">
            <Recycle className="size-4" aria-hidden="true" />
          </span>
          <span
            className={cn(
              "text-xs tracking-[0.22em] transition-colors duration-300 sm:text-sm",
              scrolled ? "text-[var(--color-forest-900)]" : "text-white",
            )}
          >
            PACUL
          </span>
        </Link>

        {/* Center nav — desktop */}
        <div className="hidden items-center gap-1.5 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                scrolled
                  ? "text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)] hover:text-[var(--color-leaf-700)]"
                  : "text-white hover:bg-white/15",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right actions — desktop */}
        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href={routes.authLogin}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 border",
              scrolled
                ? "border-[var(--color-line)] text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]"
                : "border-white/30 bg-transparent text-white hover:bg-white/15 hover:border-white/60",
            )}
          >
            Masuk
          </Link>
          <Link
            href={routes.listingsNew}
            className={cn(
              "rounded-full px-4.5 py-2 text-sm font-semibold transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
              scrolled
                ? "bg-[var(--color-leaf-600)] text-white hover:bg-[var(--color-leaf-700)]"
                : "bg-white text-[var(--color-forest-900)] hover:bg-white/90",
            )}
          >
            Buat Listing
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href={routes.listingsNew}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-300",
              scrolled
                ? "bg-[var(--color-leaf-600)] text-white hover:bg-[var(--color-leaf-700)]"
                : "bg-white text-[var(--color-forest-900)] hover:bg-white/90",
            )}
          >
            Buat Listing
          </Link>
          <Sheet>
            <SheetTrigger
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border text-sm transition-colors duration-300",
                scrolled
                  ? "border-[var(--color-line)] bg-white text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)]"
                  : "border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white",
              )}
              aria-label="Buka navigasi"
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(86vw,22rem)] border-[var(--color-line)] bg-white p-0">
              <SheetHeader className="border-b border-[var(--color-line)] p-4">
                <SheetTitle className="text-[var(--color-forest-900)]">Navigasi PACUL</SheetTitle>
                <SheetDescription>Jelajahi alur dan halaman demo PACUL.</SheetDescription>
              </SheetHeader>
              <nav className="grid gap-1 p-4" aria-label="Navigasi publik mobile">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-3 text-sm font-semibold text-[var(--color-forest-900)] transition-colors hover:bg-[var(--color-mint-100)] hover:text-[var(--color-leaf-700)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="grid gap-2 border-t border-[var(--color-line)] p-4">
                <Link
                  href={routes.authLogin}
                  className="rounded-full border border-[var(--color-line)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-forest-900)] transition-colors hover:bg-[var(--color-sage-50)]"
                >
                  Masuk
                </Link>
                <Link
                  href={routes.listingsNew}
                  className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)]"
                >
                  Buat Listing
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
