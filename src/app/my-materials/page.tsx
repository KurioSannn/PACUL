import { MyMaterialsView } from "@/components/user/my-materials";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { mockWasteListings } from "@/data/mock-pacul";

export default function MyMaterialsPage() {
  // Hanya ambil data untuk household-rina sebagai mock
  const myData = mockWasteListings.filter(l => l.householdId === "household-ardi" || l.householdId === "household-rina");

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <MyMaterialsView listings={myData.length > 0 ? myData : mockWasteListings} />
      <PublicFooter />
    </div>
  );
}
