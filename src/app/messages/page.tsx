import { Suspense } from "react";

import { NegotiationsConnected } from "@/components/connected/negotiations-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function MessagesPage() {
  return (
    <AppPageShell>
      <Suspense fallback={<p className="page-shell py-8">Memuat pesan negosiasi...</p>}>
        <NegotiationsConnected />
      </Suspense>
    </AppPageShell>
  );
}
