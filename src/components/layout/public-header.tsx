"use client";

import Link from "next/link";
import { Bell, LogOut, Menu, MessageCircle, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { getHeaderNav, showMessagesLink } from "@/lib/role-navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useActiveSection } from "@/hooks/use-active-section";

const publicNav = [
  { href: "/#fitur", label: "Fitur", id: "fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja", id: "cara-kerja" },
  { href: routes.marketplace, label: "Marketplace", id: "marketplace-page" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, profile, signOut, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const activeSection = useActiveSection(["fitur", "cara-kerja"]);

  const isLoggedIn = Boolean(accessToken && profile);

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

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && pathname === routes.home) {
      e.preventDefault();
      const id = href.replace("/#", "");
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 72;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  };

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
          href={routes.home}
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

        {/* Desktop Nav */}
        <div className="hidden items-center gap-2 md:flex">
          {(isLoggedIn ? getHeaderNav(profile?.role, true) : publicNav).map((item) => {
            const isAnchor = "id" in item;
            const isActive = isAnchor ? activeSection === item.id : (pathname === item.href && item.href !== "/");
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={(e) => handleScroll(e, item.href)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-all duration-300",
                  isActive ? "font-bold" : "font-semibold",
                  scrolled
                    ? "!text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)] hover:!text-[var(--color-leaf-700)]"
                    : "!text-white hover:bg-white/15"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Right Nav (Auth / User) */}
        <div className="hidden items-center gap-2 md:flex">
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

          {isLoading ? (
            <span className={cn("text-sm ml-2", scrolled ? "text-[var(--color-ink-500)]" : "text-white/70")}>...</span>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-2 ml-1">
              <Link href={routes.profile} className={cn("rounded-full px-4 py-2 text-sm font-semibold transition-all", scrolled ? "text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)]" : "text-white hover:bg-white/15")}>
                <span className="inline-flex items-center gap-2">
                  <User className="size-4" aria-hidden="true" />
                  {profile?.display_name ?? "Profil"}
                </span>
              </Link>
              <button type="button" onClick={() => void handleSignOut()} className={cn("rounded-full px-3 py-2 text-sm font-semibold transition-all", scrolled ? "text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)]" : "text-white hover:bg-white/15")} aria-label="Keluar">
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
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
              <Link
                href={routes.authRegister}
                className={cn(
                  "rounded-full px-4.5 py-2 text-sm font-semibold transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
                  scrolled
                    ? "bg-[var(--color-leaf-600)] !text-white hover:bg-[var(--color-leaf-700)]"
                    : "bg-white !text-[var(--color-forest-900)] hover:bg-white/90",
                )}
              >
                Daftar Gratis
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="flex items-center gap-1.5 md:hidden">
          {isLoggedIn ? (
            <Link href={routes.profile} className={iconClass} aria-label="Profil">
              <User className="size-[18px]" aria-hidden="true" />
            </Link>
          ) : null}
          {!isLoggedIn && (
            <Link
              href={routes.authRegister}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-300",
                scrolled
                  ? "bg-[var(--color-leaf-600)] text-white hover:bg-[var(--color-leaf-700)]"
                  : "bg-white text-[var(--color-forest-900)] hover:bg-white/90",
              )}
            >
              Daftar Gratis
            </Link>
          )}
          <Sheet>
            <SheetTrigger
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border text-sm transition-colors duration-300",
                scrolled
                  ? "border-[var(--color-line)] bg-white text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)]"
                  : "border-white/20 bg-transparent text-white hover:bg-white/10",
              )}
              aria-label="Buka navigasi"
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(86vw,22rem)] border-[var(--color-line)] bg-white p-0">
              <SheetHeader className="border-b border-[var(--color-line)] p-4 text-left">
                <SheetTitle className="text-[var(--color-forest-900)]">Menu PACUL</SheetTitle>
                <SheetDescription>
                  {isLoggedIn ? `Masuk sebagai ${profile?.display_name ?? profile?.role}` : "Marketplace daur ulang tiga lapis"}
                </SheetDescription>
              </SheetHeader>
              <nav className="grid gap-1 p-4" aria-label="Navigasi mobile">
                {(isLoggedIn ? getHeaderNav(profile?.role, true) : publicNav).map((item) => {
                  const isAnchor = "id" in item;
                  const isActive = isAnchor ? activeSection === item.id : (pathname === item.href && item.href !== "/");
                  return (
                    <SheetClose 
                      key={item.href}
                      render={
                        <Link
                          href={item.href}
                          onClick={(e) => handleScroll(e, item.href)}
                          className={cn(
                            "rounded-xl px-4 py-3 text-sm transition-colors",
                            isActive ? "font-bold text-[var(--color-leaf-700)] bg-[var(--color-sage-50)]" : "font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)] hover:text-[var(--color-leaf-700)]"
                          )}
                        />
                      }
                    >
                      {item.label}
                    </SheetClose>
                  );
                })}
              </nav>
              <div className="grid gap-3 border-t border-[var(--color-line)] p-4 mt-auto">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="w-full rounded-full border border-[var(--color-line)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]"
                  >
                    Keluar
                  </button>
                ) : (
                  <>
                    <SheetClose 
                      render={
                        <Link
                          href={routes.authLogin}
                          className="w-full rounded-full border border-[var(--color-line)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-sage-50)]"
                        />
                      }
                    >
                      Masuk
                    </SheetClose>
                    <SheetClose 
                      render={
                        <Link
                          href={routes.authRegister}
                          className="w-full rounded-full bg-[var(--color-leaf-600)] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--color-leaf-700)] shadow-sm"
                        />
                      }
                    >
                      Daftar Gratis
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
