import { ProfileConnectedView } from "@/components/connected/profile-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function ProfilePage() {
  return (
    <AppPageShell>
      <ProfileConnectedView />
    </AppPageShell>
  );
}
