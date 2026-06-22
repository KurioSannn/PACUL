"use client";

import { cn } from "@/lib/utils";
import { SupporterMarquee } from "@/components/home/supporter-marquee";
import {
  Building2,
  Factory,
  GraduationCap,
  Handshake,
  Recycle,
  Sprout,
  Store,
  Truck,
  LucideIcon
} from "lucide-react";

interface MitraCard {
  icon: LucideIcon;
  label: string;
  name: string;
  desc: string;
  color: {
    bg: string;
    text: string;
  };
}

const mitraList: MitraCard[] = [
  {
    icon: Building2,
    label: "Mitra",
    name: "Bank Sampah",
    desc: "Pengelolaan & pencatatan sampah terpilah warga secara digital.",
    color: { bg: "bg-emerald-50", text: "text-emerald-600" },
  },
  {
    icon: Sprout,
    label: "Komunitas",
    name: "Komunitas Lingkungan",
    desc: "Penggerak aksi kolektif & edukasi lingkungan di tingkat lokal.",
    color: { bg: "bg-green-50", text: "text-green-600" },
  },
  {
    icon: Recycle,
    label: "Industri",
    name: "Pelaku Daur Ulang",
    desc: "Pengolah material menjadi bahan baku baru yang bernilai.",
    color: { bg: "bg-blue-50", text: "text-blue-600" },
  },
  {
    icon: Store,
    label: "Usaha",
    name: "UMKM",
    desc: "Penyerap produk daur ulang & pendorong ekonomi sirkular.",
    color: { bg: "bg-amber-50", text: "text-amber-600" },
  },
  {
    icon: Factory,
    label: "Industri",
    name: "Industri Besar",
    desc: "Offtaker bahan baku skala besar & pelaksana program EPR.",
    color: { bg: "bg-purple-50", text: "text-purple-600" },
  },
  {
    icon: GraduationCap,
    label: "Edukasi",
    name: "Kampus",
    desc: "Riset, inovasi teknologi, dan edukasi lingkungan hidup.",
    color: { bg: "bg-sky-50", text: "text-sky-600" },
  },
  {
    icon: Handshake,
    label: "Program",
    name: "Program CSR",
    desc: "Pendanaan & aktivasi tanggung jawab sosial perusahaan.",
    color: { bg: "bg-rose-50", text: "text-rose-600" },
  },
  {
    icon: Truck,
    label: "Logistik",
    name: "Mitra Distribusi",
    desc: "Angkut & salurkan material ke titik pengolah secara efisien.",
    color: { bg: "bg-orange-50", text: "text-orange-600" },
  },
];

function MitraCardItem({ card }: { card: MitraCard }) {
  const Icon = card.icon;
  
  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl border border-gray-100 bg-white p-6",
        "cursor-pointer transition-all duration-150",
        "hover:-translate-y-1 hover:border-gray-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        "active:scale-[0.98] active:translate-y-0"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            card.color.bg,
            card.color.text
          )}
        >
          <Icon className="size-6" strokeWidth={2} />
        </div>

        {/* Title & Label */}
        <div className="flex flex-col">
          <p className="text-[15px] font-bold text-gray-900 leading-snug">
            {card.name}
          </p>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {card.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm text-gray-500 leading-relaxed">
        {card.desc}
      </p>
    </div>
  );
}

export function EcosystemPartners() {
  return (
    <section className="w-full py-20 px-6 md:px-12 lg:px-20 bg-white" id="kolaborasi">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
            Mitra Ekosistem
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mitraList.map((card) => (
            <MitraCardItem key={card.name} card={card} />
          ))}
        </div>
        
        <div className="mt-16">
          <SupporterMarquee />
        </div>
      </div>
    </section>
  );
}
