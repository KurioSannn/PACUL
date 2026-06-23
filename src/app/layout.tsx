import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Geist } from "next/font/google";
import { ClientRoot } from "./client-root";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Pacul | Frontend Foundation",
  description: "Fondasi frontend Pacul untuk marketplace material daur ulang tiga lapis.",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body
        className="min-h-screen bg-[var(--color-sage-50)] text-[var(--color-ink-900)] antialiased"
        suppressHydrationWarning
      >
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
