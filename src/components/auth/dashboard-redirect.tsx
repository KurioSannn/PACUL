"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { getDashboardPath } from "@/lib/navigation";
import { routes } from "@/lib/routes";

export function DashboardRedirect() {
  const router = useRouter();
  const { accessToken, profile, isLoading, isConfigured } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isConfigured || !accessToken) {
      router.replace(routes.authLogin);
      return;
    }
    if (!profile) {
      router.replace(routes.authRole);
      return;
    }
    router.replace(getDashboardPath(profile.role));
  }, [accessToken, isConfigured, isLoading, profile, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--color-ink-600)]">
      Mengalihkan ke dashboard...
    </div>
  );
}
