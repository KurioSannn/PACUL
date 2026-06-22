import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Pacul | Frontend Foundation",
  description: "Fondasi frontend Pacul untuk marketplace material daur ulang tiga lapis.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <body
        className="min-h-screen antialiased"
        style={{ backgroundColor: "var(--color-sage-50)", color: "var(--color-ink-900)" }}
      >
        {children}
      </body>
    </html>
  );
}
