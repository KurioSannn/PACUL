"use client";

import { useState, useEffect } from "react";
import { ListingCard, type UnifiedListing } from "./ListingCard";
import { PackageSearch } from "lucide-react";

const demoListings: UnifiedListing[] = [
  {
    id: "ul-1",
    type: "raw",
    title: "Botol PET bening 8 kg",
    category: "plastic",
    weightKg: 8,
    location: "Rungkut, Surabaya",
    actorName: "Keluarga Ardi",
    isAiPredicted: true,
  },
  {
    id: "ul-2",
    type: "processed",
    title: "PET Flake Grade A",
    category: "plastic",
    weightKg: 45,
    pricePerKg: 6500,
    location: "Sidoarjo",
    actorName: "UD Maju Hijau",
  },
  {
    id: "ul-3",
    type: "raw",
    title: "Kardus kering 12 kg",
    category: "paper",
    weightKg: 12,
    location: "Wonokromo, Surabaya",
    actorName: "Keluarga Sari",
    isAiPredicted: true,
  },
  {
    id: "ul-4",
    type: "finished",
    title: "Biji plastik HDPE hitam",
    category: "plastic",
    weightKg: 200,
    pricePerKg: 12000,
    location: "Gresik",
    actorName: "PT Plastik Nusantara",
  },
  {
    id: "ul-5",
    type: "processed",
    title: "Aluminium press 30 kg",
    category: "metal",
    weightKg: 30,
    pricePerKg: 18000,
    location: "Gresik",
    actorName: "CV Logam Bersih",
  },
  {
    id: "ul-6",
    type: "raw",
    title: "Kaleng aluminium campuran",
    category: "metal",
    weightKg: 3,
    location: "Gubeng, Surabaya",
    actorName: "Keluarga Roni",
  },
  {
    id: "ul-7",
    type: "processed",
    title: "Kardus press bale 100 kg",
    category: "paper",
    weightKg: 100,
    pricePerKg: 2800,
    location: "Sidoarjo",
    actorName: "UD Maju Hijau",
  },
  {
    id: "ul-8",
    type: "raw",
    title: "Botol kaca bekas minuman",
    category: "glass",
    weightKg: 5,
    location: "Sukolilo, Surabaya",
    actorName: "Keluarga Dita",
    isAiPredicted: true,
  },
  {
    id: "ul-9",
    type: "finished",
    title: "Kertas daur ulang roll",
    category: "paper",
    weightKg: 500,
    pricePerKg: 4200,
    location: "Pasuruan",
    actorName: "PT Kertas Jaya Abadi",
  },
];

function ListingSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
      <div className="h-40 w-full animate-pulse bg-neutral-200" />
      <div className="flex flex-1 flex-col p-5">
        <div className="h-5 w-24 animate-pulse rounded-full bg-neutral-200" />
        <div className="mt-4 h-6 w-3/4 animate-pulse rounded-md bg-neutral-200" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded-md bg-neutral-200" />
        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[var(--color-line)] py-4">
          <div>
            <div className="h-3 w-12 animate-pulse bg-neutral-200" />
            <div className="mt-1.5 h-4 w-16 animate-pulse bg-neutral-200" />
          </div>
          <div>
            <div className="h-3 w-16 animate-pulse bg-neutral-200" />
            <div className="mt-1.5 h-4 w-20 animate-pulse bg-neutral-200" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="size-4 animate-pulse rounded-full bg-neutral-200" />
          <div className="h-4 w-1/3 animate-pulse bg-neutral-200" />
        </div>
        <div className="mt-5 pt-2">
          <div className="h-[42px] w-full animate-pulse rounded-full bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

export function ListingFeed() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section aria-labelledby="feed-title">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-leaf-700)]">
            Etalase Terbuka
          </p>
          <h2
            id="feed-title"
            className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)]"
          >
            {isLoading ? "Memuat listing..." : `${demoListings.length} listing tersedia`}
          </h2>
        </div>
        <p className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-sage-50)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-500)]">
          Data demo MVP
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <ListingSkeleton key={i} />)
        ) : demoListings.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[var(--color-mint-200)] bg-white p-10 text-center">
            <PackageSearch
              className="mx-auto size-8 text-[var(--color-leaf-700)]"
              aria-hidden="true"
            />
            <h3 className="mt-4 text-lg font-semibold text-[var(--color-forest-900)]">
              Belum ada listing yang cocok
            </h3>
            <p className="mt-2 text-sm text-[var(--color-ink-700)]">
              Ubah kata kunci atau reset filter untuk melihat data demo lainnya.
            </p>
          </div>
        ) : (
          demoListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        )}
      </div>
    </section>
  );
}
