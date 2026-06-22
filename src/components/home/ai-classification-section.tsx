import Link from "next/link";
import { ScanLine, AlertTriangle, CheckCircle } from "lucide-react";

import { mockClassificationClasses } from "@/data/mock-landing";
import { routes } from "@/lib/routes";

export function AIClassificationSection() {
  return (
    <section className="border-t border-border" id="klasifikasi" aria-labelledby="ai-title">
      <div className="landing-shell py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <p className="eyebrow">Komponen AI/ML</p>
            <h2
              id="ai-title"
              className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl"
            >
              Klasifikasi foto sampah untuk mempercepat pemilahan.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-700)] sm:text-base">
              Model klasifikasi gambar mendeteksi jenis sampah dari foto yang diunggah rumah tangga. Hasil prediksi
              berupa kategori material, confidence score, dan saran pemilahan.
            </p>

            <div className="mt-5 rounded-xl border border-dashed border-[var(--color-mint-200)] bg-[var(--color-mint-100)] p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-earth-700)]" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-[var(--color-ink-700)]">
                  Hasil klasifikasi adalah bantuan awal dan bisa dikoreksi oleh pengguna. Model masih dalam tahap
                  pengembangan dan belum mencakup seluruh jenis material.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-ink-500)]">
                Output klasifikasi
              </h3>
              <ul className="mt-3 grid gap-2">
                {[
                  "Prediksi kategori material (plastik, kertas, logam, kaca, campuran)",
                  "Confidence score dalam persen",
                  "Saran pemilahan berdasarkan kategori",
                  "Opsi koreksi manual oleh pengguna",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-700)]">
                    <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-[var(--color-leaf-600)]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={routes.classificationDemo}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-leaf-600)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)]"
            >
              <ScanLine className="size-4" aria-hidden="true" />
              Coba Demo Klasifikasi
            </Link>
          </div>

          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-panel)]">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[var(--color-forest-900)] text-white">
                <ScanLine className="size-4" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-[var(--color-forest-900)]">Kelas material yang didukung</h3>
            </div>
            <div className="mt-4 grid gap-2">
              {mockClassificationClasses.map((cls) => (
                <div
                  key={cls.label}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-sage-50)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-forest-900)]">{cls.label}</p>
                    <p className="text-xs text-[var(--color-ink-500)]">{cls.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--color-mint-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-leaf-700)]">
                    {cls.confidence}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-[var(--color-ink-500)]">
              Simulasi MVP — confidence range berdasarkan estimasi awal
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
