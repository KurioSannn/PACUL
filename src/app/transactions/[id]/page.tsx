import { TransactionDetailConnected } from "@/components/connected/transactions-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function TransactionDetailPage() {
  return (
    <AppPageShell>
      <TransactionDetailConnected />
    </AppPageShell>
  );
}
