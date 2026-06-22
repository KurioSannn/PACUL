import Link from "next/link";
import { ArrowRight, Box, MapPin, PackageOpen, Recycle, Sparkles } from "lucide-react";
import { formatCurrency, formatWeight } from "@/lib/format";
import { wasteCategoryLabels } from "@/lib/constants";

export type UnifiedListing = {
  id: string;
  type: "raw" | "processed" | "finished";
  title: string;
  category: keyof typeof wasteCategoryLabels;
  weightKg: number;
  pricePerKg?: number;
  location: string;
  actorName: string;
  isAiPredicted?: boolean;
};

const badgeConfig = {
  raw: {
    label: "Sampah Terpilah",
    classes: "bg-[#fff3cd] text-[#6b4f24]", // Earthy amber
    Icon: PackageOpen,
    cta: "Hubungi Pengepul",
  },
  processed: {
    label: "Bahan Baku",
    classes: "bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]", // Neutral green
    Icon: Recycle,
    cta: "Buat Order",
  },
  finished: {
    label: "Bahan Jadi",
    classes: "bg-[var(--color-blue-100)] text-[var(--color-blue-700)]", // Premium blue
    Icon: Box,
    cta: "Lihat Transaksi",
  },
};

export function ListingCard({ listing }: { listing: UnifiedListing }) {
  const config = badgeConfig[listing.type];
  const Icon = config.Icon;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white transition-colors hover:border-[var(--color-mint-200)] hover:shadow-sm">
      {/* Photo Placeholder */}
      <div className="relative h-40 w-full bg-[var(--color-sage-50)]">
        {listing.isAiPredicted && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-leaf-700)] shadow-sm backdrop-blur-md">
            <Sparkles className="size-3" aria-hidden="true" />
            AI Detected
          </div>
        )}
        <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md bg-white/90 text-[var(--color-ink-700)]">
           {wasteCategoryLabels[listing.category]}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.classes}`}>
            <Icon className="size-3" aria-hidden="true" />
            {config.label}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug text-[var(--color-forest-900)]">
          {listing.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">{listing.actorName}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-[var(--color-line)] py-4">
          <div>
            <dt className="text-xs text-[var(--color-ink-500)]">Volume</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--color-forest-900)]">
              {formatWeight(listing.weightKg)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-ink-500)]">Estimasi Harga</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--color-forest-900)]">
              {listing.pricePerKg ? `${formatCurrency(listing.pricePerKg)}/kg` : "Nego"}
            </dd>
          </div>
        </dl>

        <p className="mt-4 flex items-center gap-1.5 text-sm text-[var(--color-ink-700)]">
          <MapPin className="size-4 text-[var(--color-leaf-700)]" aria-hidden="true" />
          {listing.location}
        </p>

        <div className="mt-5 pt-2">
          <Link
            href="/auth/login"
            className="group flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-white py-2.5 text-sm font-semibold text-[var(--color-forest-900)] transition-colors hover:bg-[var(--color-sage-50)]"
          >
            {config.cta}
            <ArrowRight className="size-4 text-[var(--color-ink-500)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
