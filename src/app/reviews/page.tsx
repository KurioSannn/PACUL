import { ReviewsListConnected } from "@/components/connected/reviews-connected";
import { AppPageShell } from "@/components/layout/app-page-shell";

export default function ReviewsPage() {
  return (
    <AppPageShell>
      <ReviewsListConnected />
    </AppPageShell>
  );
}
