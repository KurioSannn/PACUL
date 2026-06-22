import type { UserRole } from "@/lib/api/types";
import { defaultDemoPassword } from "@/lib/labels";

export const DEV_ROLE_STORAGE_KEY = "pacul-dev-role";

export const DEV_DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string }> = {
  household: { email: "household1@pacul-demo.com", password: defaultDemoPassword },
  collector: { email: "collector1@pacul-demo.com", password: defaultDemoPassword },
  industry: { email: "industry1@pacul-demo.com", password: defaultDemoPassword },
};

export function getDevRole(): UserRole {
  if (typeof window === "undefined") return "industry";
  const stored = localStorage.getItem(DEV_ROLE_STORAGE_KEY);
  if (stored === "household" || stored === "collector" || stored === "industry") return stored;
  return "industry";
}

export function setDevRole(role: UserRole) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEV_ROLE_STORAGE_KEY, role);
}

export function createDevFallbackProfile(role: UserRole) {
  const creds = DEV_DEMO_CREDENTIALS[role];
  return {
    id: `dev-bypass-${role}`,
    email: creds.email,
    role,
    display_name: `Dev ${role}`,
    phone: null,
    avatar_url: null,
    is_active: true,
    profile: {},
  };
}
