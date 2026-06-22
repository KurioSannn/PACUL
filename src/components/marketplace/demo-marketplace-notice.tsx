import { DEMO_MARKETPLACE_BADGE } from "@/data/demo-marketplace";

export function DemoMarketplaceNotice({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <p className="rounded-xl border border-dashed border-[var(--color-leaf-600)] bg-[var(--color-mint-50)] px-4 py-3 text-sm text-[var(--color-ink-600)]">
      <span className="mr-2 inline-flex rounded-full bg-[var(--color-leaf-600)] px-2 py-0.5 text-xs font-bold text-white">
        {DEMO_MARKETPLACE_BADGE}
      </span>
      Etalase diisi data contoh Surabaya agar alur 3 lapis terlihat lengkap. Semua peran melihat katalog yang sama; aksi nyata (klaim/checkout) membutuhkan data API atau seed backend.
    </p>
  );
}
