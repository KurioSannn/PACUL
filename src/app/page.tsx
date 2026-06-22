import { Badge } from "@/components/ui/badge";
import { PaculHero } from "@/components/home/pacul-hero";
import { EcosystemPartners } from "@/components/home/ecosystem-partners";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusPill } from "@/components/ui/status-pill";
import { mockMaterialStocks, mockWasteListings } from "@/data/mock-pacul";
import { formatCurrency, formatWeight } from "@/lib/format";

export default function HomePage() {
  const listing = mockWasteListings[0];
  const material = mockMaterialStocks[0];

  return (
    <div className="flex w-full flex-col">
      <PublicHeader />
      <main className="grow">
        <PaculHero />
        <EcosystemPartners />

        <section className="landing-shell py-16 sm:py-20" id="alur" aria-labelledby="flow-title">
          <p className="eyebrow">Tiga peran, satu alur material</p>
          <h2 id="flow-title">Foundation memulai dari informasi yang dibutuhkan setiap aktor.</h2>
          <div className="flow-grid">
            <Card><Badge tone="green">01</Badge><h3>Rumah Tangga</h3><p>Membuat listing sampah terpilah dengan kategori, berat, dan lokasi.</p></Card>
            <Card><Badge tone="earth">02</Badge><h3>Pengepul</h3><p>Mengambil dan memilah material berdasarkan ketersediaan yang tercatat.</p></Card>
            <Card><Badge>03</Badge><h3>Industri</h3><p>Meninjau bahan baku daur ulang beserta lokasi dan harga awal.</p></Card>
          </div>
        </section>

        <section className="border-t border-border bg-[var(--color-mint-100)]" id="foundation">
          <div className="landing-shell py-16 sm:py-20">
            <p className="eyebrow">Komponen dan kontrak awal</p>
            <h2>Data kecil, status jelas, dan komponen siap dipakai ulang.</h2>
            <div className="foundation-grid">
              <Card>
                <div className="preview-topline"><Badge tone="green">WasteListing</Badge><StatusPill label="Tersedia" /></div>
                <h3>{listing.title}</h3>
                <p>{listing.householdName} · {formatWeight(listing.weightKg)} · {listing.district}</p>
              </Card>
              <Card>
                <div className="preview-topline"><Badge tone="earth">MaterialStock</Badge><StatusPill label="Menunggu" tone="waiting" /></div>
                <h3>{material.materialName}</h3>
                <p>{material.collectorName} · {formatWeight(material.weightKg)} · {formatCurrency(material.pricePerKg)}/kg</p>
              </Card>
            </div>
          </div>
        </section>

        <section className="landing-shell py-16 sm:py-20" aria-labelledby="states-title">
          <p className="eyebrow">State dasar</p>
          <h2 id="states-title">Fondasi UI menangani kondisi utama sebelum fitur dibangun.</h2>
          <div className="state-grid">
            <LoadingState label="Memuat contoh listing..." />
            <EmptyState title="Belum ada listing" description="Mulai dari data sampah terpilah pertama Anda." actionLabel="Buat listing" />
            <ErrorState title="Data belum bisa dimuat" description="Periksa koneksi lalu coba lagi." />
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
