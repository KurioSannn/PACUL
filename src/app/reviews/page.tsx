import { RoutePage } from "@/components/route/route-page";
import { RoutePreview } from "@/components/ui/route-preview";
import { mockReviews } from "@/data/mock-pacul";

export default function ReviewsPage() {
  const review = mockReviews[0];

  return (
    <RoutePage
      eyebrow="Bonus 4"
      title="Rating dan review"
      description="Halaman review menyiapkan summary, role-based review cards, dan state submitted disabled untuk alur demo."
      statusLabel="Frontend foundation"
      primaryActionLabel="Tulis ulasan"
      secondaryActionLabel="Lihat ringkasan"
      preview={<RoutePreview title="Review summary" badge="Review demo" description="Ringkasan ulasan lintas role tanpa backend production." list={[
        { label: "Role", value: review.reviewerRole, helper: review.subjectName },
        { label: "Rating", value: `${review.rating.toFixed(1)} / 5`, helper: review.comment },
        { label: "Status", value: review.status, helper: review.createdAt },
      ]} />}
      previewTitle="Review summary"
      previewDescription="Review cards akan dipakai untuk menampilkan feedback yang benar-benar relevan dengan role."
      states={[
        { variant: "empty", title: "Belum ada review", description: "Belum ada ulasan yang dikirim pada demo ini.", actionLabel: "Tulis ulasan" },
        { variant: "disabled", title: "Submitted locked", description: "State submit belum production.", actionLabel: "Disabled" },
      ]}
      checklist={["Review summary", "Rating form placeholder", "Role-based review cards", "Submitted disabled state"]}
      integrationLabel="Review integration pending"
      integrationNote="Rating, review, dan persistence produksi belum dihubungkan pada block ini."
    />
  );
}