"use client";

import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { useAuth } from "@/contexts/auth-context";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  const { accessToken, profile, isLoading } = useAuth();
  const isAppUser = appConfig.devBypassAuth
    ? Boolean(profile && !isLoading)
    : Boolean(accessToken && profile && !isLoading);

  if (!isAppUser) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <div className="flex-1 pt-[72px]">{children}</div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)]">
      <AppHeader />
      <div className={cn("flex flex-1", appConfig.devBypassAuth ? "pt-[5.75rem]" : "pt-14")}>
        <AppSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
