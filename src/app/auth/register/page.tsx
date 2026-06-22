import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";

export default function RegisterPage() {
  return (
    <RoutePage
      eyebrow="Auth and RBAC"
      title="Daftar akun PACUL"
      description="Form register mock untuk menyiapkan onboarding tiga role, verifikasi input, dan pilihan akses awal."
      statusLabel="Frontend foundation"
      primaryActionLabel="Daftar demo"
      secondaryActionLabel="Lihat role"
      preview={
        <RoutePreview
          title="Form register mock"
          badge="Onboarding"
          description="Halaman ini menyiapkan struktur input, helper text, dan hint role sebelum auth production aktif."
          list={[
            { label: "Nama", value: "Keluarga Ardi", helper: "Field nama ditandai jelas" },
            { label: "Role", value: "Rumah Tangga", helper: "Card role selection disiapkan" },
            { label: "Status", value: "Pending verifikasi", helper: "Belum ada verifikasi backend" },
            { label: "CTA", value: "Daftar demo", helper: "Non-production action" },
          ]}
        />
      }
      previewTitle="Mock register"
      previewDescription="Bentuk formulir sudah siap untuk dikembangkan tanpa mengunci arsitektur auth final."
      states={[
        { variant: "empty", title: "Belum ada akun", description: "Buat akun demo untuk masuk ke role yang sesuai.", actionLabel: "Daftar demo" },
        { variant: "loading", title: "Menyimpan data", description: "Validasi register mock sedang berjalan." },
        { variant: "disabled", title: "Verifikasi email", description: "Belum aktif karena backend production belum dihubungkan.", actionLabel: "Kirim ulang" },
      ]}
      checklist={["Form register mock", "Role badge", "Guard state placeholder"]}
      integrationLabel="Supabase integration pending"
      integrationNote="Register masih mock. Production auth dan session handling berada di scope backend branch, bukan block ini."
    />
  );
}