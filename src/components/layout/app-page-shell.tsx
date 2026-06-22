"use client";

import type { ReactNode } from "react";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";

export function AppPageShell({ children }: { children: ReactNode }) {
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
