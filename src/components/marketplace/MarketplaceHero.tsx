"use client";

import Link from "next/link";
import { ArrowRight, Factory, Home, Truck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { routes } from "@/lib/routes";

const flowSteps = [
  { label: "Sampah Terpilah", sub: "Rumah Tangga" },
  { label: "Bahan Baku", sub: "Pengepul" },
  { label: "Produk Jadi", sub: "Industri" },
];

const roleCtas = [
  { icon: Home, label: "Jual sampah terpilah", href: routes.authLogin, role: "Rumah Tangga" },
  { icon: Truck, label: "Ambil & pilah material", href: routes.authLogin, role: "Pengepul" },
  { icon: Factory, label: "Beli bahan baku", href: routes.authLogin, role: "Industri" },
];

export function MarketplaceHero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--color-forest-950)] px-6 py-14 text-white sm:px-10 sm:py-16 lg:px-16 lg:py-20">
      {/* Background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a9dfbd]">
          Marketplace Tiga Lapis
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          Dari sampah rumah tangga ke rantai material yang bisa ditelusuri.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
          Material berubah wujud dan status seiring berpindah tangan — listing, pickup, batch, order, negosiasi, transaksi.
        </p>

        {/* Material Flow Indicator */}
        <div className="mt-10 flex items-center gap-0" role="img" aria-label="Alur transformasi material: Sampah Terpilah, Bahan Baku, Produk Jadi">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  className="flex size-3 items-center justify-center rounded-full bg-[#2e9e63]"
                  animate={prefersReducedMotion ? {} : { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                />
                <span className="text-center text-xs font-semibold text-white/90">{step.label}</span>
                <span className="text-[10px] text-white/40">{step.sub}</span>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="mx-3 h-px w-8 bg-gradient-to-r from-[#2e9e63]/60 to-white/10 sm:mx-5 sm:w-14" />
              )}
            </div>
          ))}
        </div>

        {/* Role CTAs */}
        <div className="mt-10 flex flex-wrap gap-3">
          {roleCtas.map((cta) => {
            const Icon = cta.icon;
            return (
              <Link
                key={cta.role}
                href={cta.href}
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <Icon className="size-4 text-[#a9dfbd]" aria-hidden="true" />
                {cta.label}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
