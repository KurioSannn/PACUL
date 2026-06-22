import { NegotiationThreadConnected } from "@/components/connected/negotiation-thread-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function NegotiationChatPage() {
  return (
    <AppPageShell>
      <NegotiationThreadConnected />
    </AppPageShell>
  );
}
