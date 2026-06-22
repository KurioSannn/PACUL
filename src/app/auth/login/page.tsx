import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";

export default function LoginPage() {
  return (
    <RoutePage
      eyebrow="Auth and RBAC"
      title="Masuk ke PACUL"
      description="Form login mock untuk menyiapkan autentikasi, role badge, dan guard state tanpa menyentuh production auth."
      statusLabel="Frontend foundation"
      primaryActionLabel="Masuk demo"
      secondaryActionLabel="Pilih peran"
      preview={
        <RoutePreview
          title="Form login mock"
          badge="Mock"
          description="Login layar depan ini hanya memvisualkan field, validasi, dan state akses berdasarkan role."
          list={[
            { label: "Email", value: "demo@pacul.local", helper: "Label input dan helper text tersedia" },
            { label: "Password", value: "••••••••", helper: "Field password sudah disiapkan" },
            { label: "Guard", value: "Belum aktif", helper: "Supabase auth production pending" },
            { label: "Next route", value: "/dashboard", helper: "Arah setelah login demo" },
          ]}
        />
      }
      previewTitle="Mock form"
      previewDescription="Gunakan halaman ini untuk menyiapkan alur akses, state gagal, dan role switch sebelum backend auth tersedia."
      states={[
        { variant: "loading", title: "Memeriksa kredensial", description: "Login mock sedang diproses." },
        { variant: "error", title: "Login ditolak", description: "Email atau password demo tidak cocok." },
        { variant: "empty", title: "Belum login", description: "Masuk untuk melihat dashboard sesuai role.", actionLabel: "Masuk demo" },
      ]}
      checklist={["Form login mock", "Role badge", "Guard state placeholder"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Login masih mock. Integrasi session, RBAC production, dan auth guard akan dihubungkan oleh backend branch."
    />
  );
}