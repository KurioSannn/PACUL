import type { UserRole } from "@/lib/api/types";
import { roleDashboardPath } from "@/lib/labels";
import { routes } from "@/lib/routes";

export function getDashboardPath(role?: UserRole | string | null): string {
  if (role && role in roleDashboardPath) {
    return roleDashboardPath[role as UserRole];
  }
  return routes.authLogin;
}
