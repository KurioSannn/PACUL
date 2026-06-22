import { MessagesView } from "@/components/chat/messages-view";
import { PublicHeader } from "@/components/layout/public-header";

export default function MessagesPage() {
  return (
    <div className="flex h-screen flex-col bg-[var(--color-sage-50)] pt-[72px]">
      <PublicHeader />
      <MessagesView />
    </div>
  );
}
