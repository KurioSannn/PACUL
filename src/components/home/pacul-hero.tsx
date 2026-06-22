"use client";

import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { VideoBackdrop } from "@/components/media/video-backdrop";
import { routes } from "@/lib/routes";
import { slideUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function PaculHero() {
  const prefersReducedMotion = useReducedMotion();
  const initial = prefersReducedMotion ? undefined : "hidden";

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
            href="#alur"
            className="group mx-auto flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white/10"
          >
            <Leaf className="size-3 text-[var(--color-leaf-500)]" />
            <span className="text-xs font-medium">Data demo MVP</span>
            <span className="block h-4 border-l border-white/20" />
            <ArrowRight className="size-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
          </motion.a>

          {/* Headline */}
          <motion.h1
            variants={slideUp}
            className="max-w-3xl text-balance text-center text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            Sampah rumah tangga ke <br className="hidden sm:block" />
            rantai daur ulang yang bisa ditelusuri.
          </motion.h1>

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
              href="#alur"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "rounded-full",
              )}
            >
              Lihat Alur
            </Link>
            <Link
              href={routes.listingsNew}
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "rounded-full",
              )}
            >
              Buat Listing
              <ArrowRight className="ml-2 size-4" data-icon="inline-end" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
