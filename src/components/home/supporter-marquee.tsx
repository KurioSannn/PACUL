const demoSupporters = [
  { name: "Sirkula", initials: "SK", shape: "circle" },
  { name: "Hijau Lab", initials: "HL", shape: "diamond" },
  { name: "Material Works", initials: "MW", shape: "square" },
  { name: "Rantai Baik", initials: "RB", shape: "circle" },
  { name: "Kolektif Bumi", initials: "KB", shape: "diamond" },
  { name: "Ruang Pulih", initials: "RP", shape: "square" },
];

function DemoLogo({ initials, shape }: { initials: string; shape: string }) {
  return (
    <svg viewBox="0 0 44 44" className="size-9 shrink-0" aria-hidden="true">
      {shape === "circle" ? <circle cx="22" cy="22" r="18" fill="currentColor" opacity="0.12" /> : null}
      {shape === "diamond" ? <path d="M22 3 41 22 22 41 3 22Z" fill="currentColor" opacity="0.12" /> : null}
      {shape === "square" ? <rect x="4" y="4" width="36" height="36" rx="11" fill="currentColor" opacity="0.12" /> : null}
      <text x="22" y="25" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="800">
        {initials}
      </text>
    </svg>
  );
}

function SupporterList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="supporter-marquee-group" aria-hidden={hidden || undefined}>
      {demoSupporters.map((supporter) => (
        <li key={supporter.name} className="flex min-w-48 items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4 text-[var(--color-forest-800)]">
          <DemoLogo initials={supporter.initials} shape={supporter.shape} />
          <span className="whitespace-nowrap text-sm font-semibold">{supporter.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function SupporterMarquee() {
  return (
    <div className="mt-14 border-t border-[var(--color-line)] pt-10 sm:mt-16 sm:pt-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Supported by</p>
          <h3 className="text-xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-2xl">
            Contoh identitas pendukung ekosistem.
          </h3>
        </div>
        <p className="max-w-md text-xs leading-5 text-[var(--color-ink-500)]">
          Logo generik untuk kebutuhan tampilan demo. Belum menunjukkan sponsor atau kerja sama resmi.
        </p>
      </div>

      <div className="supporter-marquee mt-7" aria-label="Contoh logo pendukung ekosistem">
        <div className="supporter-marquee-track">
          <SupporterList />
          <SupporterList hidden />
        </div>
      </div>
    </div>
  );
}
