import { TransactionsListConnected } from "@/components/connected/transactions-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function TransactionsPage() {
  return (
    <AppPageShell>
      <TransactionsListConnected />
    </AppPageShell>
  );
}
