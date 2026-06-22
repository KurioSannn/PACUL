import Image from "next/image";

const demoSupporters = [
  { name: "Sirkula", image: "/3.png" },
  { name: "Hijau Lab", image: "/4.png" },
  { name: "Material Works", image: "/5.png" },
  { name: "Rantai Baik", image: "/6.png" },
  { name: "Kolektif Bumi", image: "/7.png" },
  { name: "Ruang Pulih", image: "/8.png" },
  { name: "PlayIT", image: "/9.png" },
  { name: "PlayIT Mark", image: "/10.png" },
];

function SupporterList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="supporter-marquee-group" aria-hidden={hidden || undefined}>
      {demoSupporters.map((supporter) => (
        <li key={supporter.name} className="flex shrink-0 items-center justify-center px-6">
          <div className="relative h-[4.5rem] w-36 md:h-[5.5rem] md:w-44">
            <Image
              src={supporter.image}
              alt={`${supporter.name} logo`}
              fill
              className="object-contain"
            />
          </div>
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
