import { BarChart3, MessageSquareText, Scale } from "lucide-react";

const flowLayers = [
  {
    id: "household",
    label: "Lapisan rumah tangga",
    value: "Listing sampah",
    description: "Upload foto, klasifikasi AI, publish listing, lacak status pickup hingga material.",
    icon: Scale,
  },
  {
    id: "collector",
    label: "Lapisan pengepul",
    value: "Pickup & batch",
    description: "Klaim listing, optimasi rute, sorting, dan publikasi batch material ke marketplace.",
    icon: BarChart3,
  },
  {
    id: "industry",
    label: "Lapisan industri",
    value: "Order & transaksi",
    description: "Cari material, negosiasi harga, simulasi pembayaran, dan traceability rantai pasok.",
    icon: MessageSquareText,
  },
];

export function ImpactSection() {
  return (
    <section className="border-t border-border bg-white" id="alur" aria-labelledby="impact-title">
      <div className="landing-shell py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Alur tiga lapis</p>
          <h2
            id="impact-title"
            className="text-balance text-3xl font-semibold tracking-[-0.035em] text-[var(--color-forest-900)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]"
          >
            Satu platform dari sampah rumah tangga hingga bahan baku industri.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--color-ink-700)]">
            PACUL menghubungkan rumah tangga, pengepul, dan industri pengolah melalui API backend yang sama — listing, pickup, material batch, order, negosiasi, dan transaksi.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:mt-14">
          {flowLayers.map((layer) => {
            const Icon = layer.icon;
            return (
              <article
                key={layer.id}
                className="group rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-sage-50)] p-6 transition-colors hover:border-[var(--color-mint-200)] sm:p-7"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-[var(--color-mint-200)] bg-white text-[var(--color-leaf-700)]">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <h3 className="mt-7 text-sm font-semibold text-[var(--color-ink-700)]">{layer.label}</h3>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-forest-900)]">{layer.value}</p>
                <p className="mt-4 text-sm leading-6 text-[var(--color-ink-500)]">{layer.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
