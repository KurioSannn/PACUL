import { Suspense } from "react";

import { LoginView } from "@/components/auth/login-view";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Memuat halaman login...</p>}>
      <LoginView />
    </Suspense>
  );
}
