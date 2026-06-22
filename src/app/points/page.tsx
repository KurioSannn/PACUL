"use client";

import { AppPageShell } from "@/components/layout/app-page-shell";
import { PointsConnected } from "@/components/connected/points-connected";

export default function PointsPage() {
  return (
    <AppPageShell>
      <PointsConnected />
    </AppPageShell>
  );
}
