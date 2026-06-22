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
  "Sampah jadi bahan bernilai.",
  "Satu alur daur ulang cerdas.",
  "Pasok industri dari rumah.",
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


          {/* Rotating Headline */}
          <motion.div
            variants={slideUp}
            className="relative mb-8 h-[6rem] sm:h-[7rem] md:h-[8rem] lg:h-[10rem] w-full max-w-5xl px-4"
          >
            <AnimatePresence mode="wait">
              <motion.h1
                key={lineIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-balance text-center text-4xl font-bold tracking-tight !text-white sm:text-5xl md:text-6xl lg:text-[4.5rem] lg:leading-[1.1]"
              >
                {heroLines[lineIndex]}
              </motion.h1>
            </AnimatePresence>
          </motion.div>

          {/* Sub-copy */}
          <motion.p
            variants={slideUp}
            className="mx-auto max-w-[520px] text-center text-lg tracking-wide !text-white sm:text-xl md:text-2xl"
          >
            Hubungkan rumah tangga, pengepul, dan industri <br className="hidden md:block" /> dalam satu ekosistem daur ulang.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={slideUp}
            className="mt-8 flex flex-row flex-wrap items-center justify-center gap-5"
          >
            <Link
              href="#fitur"
              className="inline-flex min-h-16 items-center justify-center rounded-full border-2 border-white/50 px-10 py-5 text-lg font-bold !text-white transition-colors hover:bg-white/20"
            >
              Lihat Alur
            </Link>
            <Link
              href={routes.listingsNew}
              className="inline-flex min-h-16 items-center justify-center gap-3 rounded-full bg-[#1f7a4d] px-10 py-5 text-lg font-bold !text-white transition-colors hover:bg-[#17643f]"
            >
              Buat Listing
              <ArrowRight className="size-5 !text-white" aria-hidden="true" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

