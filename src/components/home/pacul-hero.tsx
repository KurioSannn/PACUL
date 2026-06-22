"use client";

import Link from "next/link";
import { ArrowRight, Camera, Factory, House, Route, ScanSearch, Truck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { VideoBackdrop } from "@/components/media/video-backdrop";
import { routes } from "@/lib/routes";
import { slideUp, staggerContainer } from "@/lib/motion";

const flowSteps = [
  { label: "Rumah Tangga", detail: "Buat listing", icon: House },
  { label: "Pengepul", detail: "Ambil dan pilah", icon: Truck },
  { label: "Industri Pengolah", detail: "Pesan bahan baku", icon: Factory },
];

export function PaculHero() {
  const prefersReducedMotion = useReducedMotion();
  const animationState = prefersReducedMotion ? undefined : "hidden";

  return (
    <section id="utama" className="relative isolate overflow-hidden bg-[var(--color-forest-950)] pt-18 text-white">
      <VideoBackdrop
        srcWebm="/videos/pacul-hero.webm"
        srcMp4="/videos/pacul-hero.mp4"
        poster="/images/pacul-hero-poster.jpg"
        fallbackLabel="Latar hijau PACUL untuk alur daur ulang"
      />
      <div className="relative mx-auto grid min-h-[43rem] max-w-[1200px] items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-28">
        <motion.div variants={staggerContainer} initial={animationState} animate="visible" className="max-w-3xl">
          <motion.div variants={slideUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--color-mint-100)]">
            <span className="size-1.5 rounded-full bg-[var(--color-leaf-500)]" aria-hidden="true" />
            Data demo MVP
          </motion.div>
          <motion.h1 variants={slideUp} className="max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            PACUL menghubungkan sampah rumah tangga ke rantai daur ulang yang bisa ditelusuri.
          </motion.h1>
          <motion.p variants={slideUp} className="mt-6 max-w-2xl text-base leading-7 text-[#d6e8de] sm:text-lg">
            Rumah tangga membuat listing, pengepul mengambil dan memilah, lalu industri membeli bahan baku daur ulang dengan status transaksi yang jelas.
          </motion.p>
          <motion.div variants={slideUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={routes.listingsNew} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-leaf-600)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)]">
              Mulai Buat Listing <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a href="#alur" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Lihat Alur PACUL
            </a>
          </motion.div>
          <motion.p variants={slideUp} className="mt-7 flex max-w-xl items-start gap-2 text-sm leading-6 text-[#cdebda]">
            <ScanSearch className="mt-0.5 size-4 shrink-0 text-[var(--color-leaf-500)]" aria-hidden="true" />
            Klasifikasi foto membantu memberi saran kategori. Pengguna tetap bisa mengoreksi hasilnya.
          </motion.p>
        </motion.div>

        <motion.div variants={slideUp} initial={animationState} animate="visible" className="rounded-[22px] border border-white/18 bg-[#0b2f24]/72 p-5 shadow-[0_16px_38px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-[var(--color-mint-200)] uppercase">Alur material</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Status tetap mengikuti material</h2>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
              <Route className="size-5" aria-hidden="true" />
            </span>
          </div>
          <ol className="mt-6 grid gap-3">
            {flowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <li key={step.label} className="flex items-center gap-4 rounded-2xl border border-white/12 bg-white/7 p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{step.label}</p>
                    <p className="mt-0.5 text-xs text-[#cdebda]">{step.detail}</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-mint-200)]">0{index + 1}</span>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-[var(--color-mint-200)]/25 bg-[var(--color-mint-100)]/10 p-3 text-sm text-[#d6e8de]">
            <Camera className="size-4 shrink-0 text-[var(--color-leaf-500)]" aria-hidden="true" />
            Foto dan kategori awal tetap dapat diperiksa sebelum listing diterbitkan.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
