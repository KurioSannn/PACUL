import { HouseholdProfileView } from "@/components/user/household-profile";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <HouseholdProfileView />
      <PublicFooter />
    </div>
  );
}
