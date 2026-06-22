import { OrdersConnected } from "@/components/connected/orders-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function OrdersPage() {
  return (
    <AppPageShell>
      <OrdersConnected />
    </AppPageShell>
  );
}
