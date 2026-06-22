import { RegisterView } from "@/components/auth/register-view";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--color-sage-50)]">Memuat...</div>}>
      <RegisterView />
    </Suspense>
  );
}