"use client";

import Link from "next/link";
import { Menu, Recycle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { routes } from "@/lib/routes";
import { gentleTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "#alur", label: "Alur" },
  { href: routes.marketplaceWaste, label: "Marketplace" },
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.impact, label: "Dampak" },
  { href: routes.reports, label: "Laporan" },
];

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const updateScrolledState = () => setIsScrolled(window.scrollY > 12);

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolledState);
  }, []);

  const textColor = isScrolled ? "text-[var(--color-forest-900)]" : "text-white";

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[border-color,background-color,backdrop-filter]",
        isScrolled ? "border-[var(--color-line)] bg-[rgba(251,253,251,0.94)] backdrop-blur-md" : "border-white/10 bg-transparent",
      )}
      animate={prefersReducedMotion ? undefined : { y: 0 }}
      transition={gentleTransition}
    >
      <div className="landing-shell flex h-[72px] items-center justify-between gap-3">
        <Link href={routes.home} className={cn("inline-flex items-center gap-2 font-semibold tracking-tight transition-colors", textColor)}>
          <span className={cn("grid size-9 place-items-center rounded-[11px]", isScrolled ? "bg-[var(--color-forest-900)] text-white" : "bg-white text-[var(--color-forest-900)]")}>
            <Recycle className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm tracking-[0.18em] sm:text-base">PACUL</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/75 p-1 lg:flex" aria-label="Navigasi publik">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-mint-100)] hover:text-[var(--color-forest-900)]",
                textColor,
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href={routes.authLogin} className={cn("rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/60 hover:text-[var(--color-leaf-600)]", textColor)}>
            Masuk
          </Link>
          <Link href={routes.listingsNew} className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)]">
            Buat Listing
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link href={routes.listingsNew} className="rounded-full bg-[var(--color-leaf-600)] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)]">
            Buat Listing
          </Link>

          <Sheet>
            <SheetTrigger className={cn("grid size-10 place-items-center rounded-full border transition-colors", isScrolled ? "border-[var(--color-line)] bg-white text-[var(--color-forest-900)]" : "border-white/20 bg-white/10 text-white")} aria-label="Buka navigasi">
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(86vw,22rem)] border-[var(--color-line)] bg-white p-0">
              <SheetHeader className="border-b border-[var(--color-line)]">
                <SheetTitle className="text-[var(--color-forest-900)]">Navigasi PACUL</SheetTitle>
                <SheetDescription>Jelajahi alur dan halaman demo PACUL.</SheetDescription>
              </SheetHeader>
              <nav className="grid gap-1 p-4" aria-label="Navigasi publik mobile">
                {navigationItems.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-xl px-3 py-3 text-sm font-semibold text-[var(--color-forest-900)] transition-colors hover:bg-[var(--color-mint-100)]">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="grid gap-2 border-t border-[var(--color-line)] p-4">
                <Link href={routes.authLogin} className="rounded-xl border border-[var(--color-mint-200)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-leaf-700)]">
                  Masuk
                </Link>
                <Link href={routes.listingsNew} className="rounded-xl bg-[var(--color-leaf-600)] px-4 py-2.5 text-center text-sm font-semibold text-white">
                  Buat Listing
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
