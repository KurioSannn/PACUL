"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Leaf, Repeat } from "lucide-react";

type StatItem = {
  id: string;
  icon: typeof BarChart3;
  label: string;
  target: number;
  suffix: string;
  description: string;
};

const stats: StatItem[] = [
  { id: "volume", icon: BarChart3, label: "Material tersalurkan", target: 2400, suffix: " kg", description: "Total berat material yang berhasil dipindahtangankan melalui platform." },
  { id: "transactions", icon: Repeat, label: "Transaksi aktif", target: 48, suffix: "", description: "Jumlah transaksi yang tercatat dalam sistem demo." },
  { id: "co2", icon: Leaf, label: "CO₂e dihindari", target: 1800, suffix: " kg", description: "Estimasi emisi karbon yang dihindari dari proses daur ulang." },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1600;
          const startTime = performance.now();

          function step(currentTime: number) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          }

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

export function DashboardStats() {
  return (
    <section aria-labelledby="stats-title">
      <h2 id="stats-title" className="sr-only">Statistik platform</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="rounded-2xl border border-[var(--color-line)] bg-white p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-500)]">
                  {stat.label}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-forest-900)]">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--color-ink-500)]">{stat.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
