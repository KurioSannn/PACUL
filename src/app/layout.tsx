import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Pacul | Frontend Foundation",
  description: "Fondasi frontend Pacul untuk marketplace material daur ulang tiga lapis.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body
        className="min-h-screen antialiased"
        style={{ backgroundColor: "var(--color-sage-50)", color: "var(--color-ink-900)" }}
      >
        {children}
      </body>
    </html>
  );
}
