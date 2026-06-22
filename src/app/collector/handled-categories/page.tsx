"use client";

import { AppPageShell } from "@/components/layout/app-page-shell";
import { CollectorHandledCategoriesConnected } from "@/components/connected/collector-handled-categories-connected";

export default function CollectorHandledCategoriesPage() {
  return (
    <AppPageShell>
      <CollectorHandledCategoriesConnected />
    </AppPageShell>
  );
}
