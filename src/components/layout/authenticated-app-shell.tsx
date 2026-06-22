"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { useAuth } from "@/contexts/auth-context";

export function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  const { accessToken, profile, isLoading } = useAuth();
  const showSidebar = Boolean(accessToken && profile && !isLoading);

  return (
    <div className="flex min-h-screen flex-col pt-[72px]">
      <PublicHeader />
      <div className="flex flex-1">
        {showSidebar ? <AppSidebar /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          {showSidebar ? <MobileNav /> : null}
          {children}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
