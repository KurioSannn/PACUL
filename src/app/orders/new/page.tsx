import { OrdersNewConnected } from "@/components/connected/orders-new-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function OrdersNewPage() {
  return (
    <AppPageShell>
      <OrdersNewConnected />
    </AppPageShell>
  );
}
