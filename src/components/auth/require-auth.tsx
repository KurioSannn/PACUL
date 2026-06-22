"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { appConfig } from "@/lib/config";
import type { UserRole } from "@/lib/api/types";
import { getDashboardPath } from "@/lib/navigation";
import { routes } from "@/lib/routes";

type RequireAuthProps = {
  children: ReactNode;
  roles?: UserRole[];
  fallback?: ReactNode;
};

export function RequireAuth({ children, roles, fallback }: RequireAuthProps) {
  const router = useRouter();
  const { isLoading, accessToken, profile, isConfigured } = useAuth();

  useEffect(() => {
    if (appConfig.devBypassAuth) return;

    if (isLoading) return;
    if (!isConfigured || !accessToken) {
      router.replace(routes.authLogin);
      return;
    }
    if (!profile) {
      router.replace(routes.authRole);
      return;
    }
    if (roles && profile && !roles.includes(profile.role)) {
      router.replace(getDashboardPath(profile.role));
    }
  }, [isLoading, accessToken, profile, roles, router, isConfigured]);

  if (appConfig.devBypassAuth) {
    if (isLoading) {
      return (
        fallback ?? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--color-ink-600)]">
            Memuat dev session...
          </div>
        )
      );
    }
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--color-ink-600)]">
          Memuat sesi...
        </div>
      )
    );
  }

  if (!accessToken || !profile) return null;
  if (roles && !roles.includes(profile.role)) return null;

  return <>{children}</>;
}
