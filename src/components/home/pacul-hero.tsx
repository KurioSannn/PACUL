"use client";

import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";

import { VideoBackdrop } from "@/components/media/video-backdrop";
import { routes } from "@/lib/routes";
import { slideUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const heroLines = [
  "Sampah rumah tangga jadi bahan baku bernilai.",
  "Tiga aktor, satu alur daur ulang.",
  "Dari tong sampah ke rantai pasok industri.",
];

export function PaculHero() {
  const prefersReducedMotion = useReducedMotion();
  const initial = prefersReducedMotion ? undefined : "hidden";
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % heroLines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <section
      id="utama"
      className="relative isolate min-h-screen overflow-hidden bg-[var(--color-forest-950)]"
    >
      <VideoBackdrop
        srcWebm="/vidiopacul.webm"
        poster="/images/pacul-hero-poster.jpg"
        fallbackLabel="Latar hijau PACUL untuk alur daur ulang"
      />

      {/* Faded vertical borders like the reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 inset-x-0 mx-auto hidden w-full max-w-[1360px] px-[clamp(20px,4vw,64px)] lg:block"
      >
        <div className="relative size-full">
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-white/10" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-white/10" />
        </div>
      </div>

      {/* Main content */}
      <div className="landing-shell relative flex min-h-screen flex-col items-center justify-center gap-6 pb-24 pt-36">
        {/* Inner content faded borders */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute inset-y-0 left-4 w-px bg-gradient-to-b from-transparent via-white/5 to-white/5 md:left-12" />
          <div className="absolute inset-y-0 right-4 w-px bg-gradient-to-b from-transparent via-white/5 to-white/5 md:right-12" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial={initial}
          animate="visible"
          className="flex flex-col items-center gap-5"
        >
          {/* Badge pill */}
          <motion.a
            variants={slideUp}
            href="#fitur"
            className="group mx-auto flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white/10"
          >
            <Leaf className="size-3 text-[var(--color-leaf-500)]" />
            <span className="text-xs font-medium">Data demo MVP</span>
            <span className="block h-4 border-l border-white/20" />
            <ArrowRight className="size-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
          </motion.a>

          {/* Rotating Headline */}
          <motion.div
            variants={slideUp}
            className="relative h-[4.5rem] sm:h-[5rem] md:h-[5.5rem] lg:h-[7rem] w-full max-w-3xl overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.h1
                key={lineIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-balance text-center text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl"
              >
                {heroLines[lineIndex]}
              </motion.h1>
            </AnimatePresence>
          </motion.div>

          {/* Sub-copy */}
          <motion.p
            variants={slideUp}
            className="mx-auto max-w-lg text-center text-base tracking-wide text-white/70 sm:text-lg md:text-xl"
          >
            Rumah tangga membuat listing, pengepul mengambil, <br className="hidden md:block" />
            industri membeli bahan baku daur ulang.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={slideUp}
            className="flex flex-row flex-wrap items-center justify-center gap-3 pt-2"
          >
            <Link
              href="#fitur"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Lihat Alur
            </Link>
            <Link
              href={routes.listingsNew}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-leaf-600)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-leaf-700)]"
            >
              Buat Listing
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

