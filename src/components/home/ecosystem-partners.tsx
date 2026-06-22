const partnerSlots = [
  "Bank Sampah",
  "CSR Hijau",
  "Industri Daur Ulang",
  "Pengepul Lokal",
  "Kampus",
  "Komunitas Lingkungan",
];

export function EcosystemPartners() {
  return (
    <section className="border-b border-[var(--color-line)] bg-white" aria-labelledby="ecosystem-title">
      <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-center">
          <div>
            <p className="eyebrow">Calon Mitra Ekosistem</p>
            <h2 id="ecosystem-title" className="text-xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-2xl">
              Kolaborasi yang relevan untuk alur PACUL.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-ink-700)]">
              PACUL dirancang untuk dapat dikolaborasikan dengan bank sampah, pengepul lokal, industri pengolah, program CSR, dan mitra lingkungan.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Jenis calon mitra ekosistem">
            {partnerSlots.map((partner) => (
              <li key={partner} className="rounded-xl border border-dashed border-[var(--color-mint-200)] bg-[var(--color-sage-50)] px-3 py-4 text-center text-xs font-semibold text-[var(--color-forest-800)] sm:text-sm">
                {partner}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
