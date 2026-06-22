"use client";

import Link from "next/link";
import { Bell, LogOut, Menu, MessageCircle, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { getHeaderNav, getPrimaryCta, showMessagesLink } from "@/lib/role-navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const publicNav = [
  { href: "#alur", label: "Alur" },
  { href: "#marketplace", label: "Marketplace" },
  { href: routes.demo, label: "Demo" },
  { href: routes.deployReadiness, label: "Status" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, profile, signOut, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  const isLoggedIn = Boolean(accessToken && profile);
  const navItems = isLoggedIn
    ? getHeaderNav(profile?.role, true)
    : publicNav.map((item) => ({ href: item.href.startsWith("#") ? `${routes.home}${item.href}` : item.href, label: item.label }));
  const primaryCta = getPrimaryCta(profile?.role, isLoggedIn);

  useEffect(() => {
    const onScroll = () => {
      if (pathname !== routes.home) {
        setScrolled(true);
        return;
      }

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
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.replace(routes.authLogin);
  };

  const linkClass = cn(
    "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
    scrolled
      ? "!text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)] hover:text-[var(--color-leaf-700)]"
      : "!text-white hover:bg-white/15",
  );

  const iconClass = cn(
    "relative inline-flex size-9 items-center justify-center rounded-full transition-colors",
    scrolled
      ? "text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)]"
      : "text-white hover:bg-white/15",
  );

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
        <Link
          href={isLoggedIn ? routes.dashboard : routes.home}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl p-1.5 font-semibold tracking-tight transition-colors",
            scrolled ? "hover:bg-[var(--color-mint-100)]" : "hover:bg-white/10",
          )}
        >
          <img
            src="/BISSMILAH MENANG fix.png"
            alt="PACUL"
            className={cn(
              "h-8 w-auto object-contain transition-all duration-300",
              scrolled ? "" : "brightness-0 invert",
            )}
          />
        </Link>

        <div className="hidden items-center gap-1.5 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {isLoggedIn && showMessagesLink(profile?.role) ? (
            <Link href={routes.messages} className={iconClass} aria-label="Pesan">
              <MessageCircle className="size-[18px]" aria-hidden="true" />
            </Link>
          ) : null}
          {isLoggedIn ? (
            <Link href={routes.notifications} className={iconClass} aria-label="Notifikasi">
              <Bell className="size-[18px]" aria-hidden="true" />
            </Link>
          ) : null}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          {isLoading ? (
            <span className={cn("text-sm", scrolled ? "text-[var(--color-ink-500)]" : "text-white/70")}>...</span>
          ) : isLoggedIn ? (
            <>
              <Link href={routes.profile} className={linkClass}>
                <span className="inline-flex items-center gap-2">
                  <User className="size-4" aria-hidden="true" />
                  {profile?.display_name ?? "Profil"}
                </span>
              </Link>
              <button type="button" onClick={() => void handleSignOut()} className={linkClass} aria-label="Keluar">
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <Link
              href={routes.authLogin}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 border",
                scrolled
                  ? "border-[var(--color-line)] !text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]"
                  : "border-white/30 bg-transparent !text-white hover:bg-white/15 hover:border-white/60",
              )}
            >
              Masuk
            </Link>
          )}
          <Link
            href={primaryCta.href}
            className={cn(
              "rounded-full px-4.5 py-2 text-sm font-semibold transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
              scrolled
                ? "bg-[var(--color-leaf-600)] !text-white hover:bg-[var(--color-leaf-700)]"
                : "bg-white !text-[var(--color-forest-900)] hover:bg-white/90",
            )}
          >
            {primaryCta.label}
          </Link>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          {isLoggedIn ? (
            <Link href={routes.profile} className={iconClass} aria-label="Profil">
              <User className="size-[18px]" aria-hidden="true" />
            </Link>
          ) : null}
          <Link
            href={primaryCta.href}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-300",
              scrolled
                ? "bg-[var(--color-leaf-600)] text-white hover:bg-[var(--color-leaf-700)]"
                : "bg-white text-[var(--color-forest-900)] hover:bg-white/90",
            )}
          >
            {primaryCta.label}
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
                <SheetTitle className="text-[var(--color-forest-900)]">PACUL</SheetTitle>
                <SheetDescription>
                  {isLoggedIn ? `Masuk sebagai ${profile?.display_name ?? profile?.role}` : "Marketplace daur ulang tiga lapis"}
                </SheetDescription>
              </SheetHeader>
              <nav className="grid gap-1 p-4" aria-label="Navigasi mobile">
                {navItems.map((item) => (
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
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="rounded-full border border-[var(--color-line)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-forest-900)]"
                  >
                    Keluar
                  </button>
                ) : (
                  <Link
                    href={routes.authLogin}
                    className="rounded-full border border-[var(--color-line)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-forest-900)]"
                  >
                    Masuk
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
