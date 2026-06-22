import { OrdersView } from "@/components/industry/orders-view";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function OrdersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <OrdersView />
      <PublicFooter />
    </div>
  );
}