# Pacul

## Overview

Pacul adalah fondasi frontend untuk marketplace daur ulang yang menghubungkan Rumah Tangga, Pengepul, dan Industri Pengolah. Block 1 hanya menyiapkan struktur, sistem visual, komponen dasar, type contract, dan data demo kecil.

## Features

- Next.js App Router dengan TypeScript.
- Token desain hijau natural dari `DESIGN .md`.
- Komponen UI dasar: Button, Card, Badge, StatusPill, EmptyState, LoadingState, dan ErrorState.
- Type contract untuk listing sampah dan stok bahan baku.
- Landing placeholder dengan preview alur tiga peran dan state dasar.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- npm

## Getting Started

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Available Scripts

- `npm run dev`: menjalankan development server Next.js.
- `npm run build`: membuat production build.
- `npm run start`: menjalankan production build.
- `npm run typecheck`: memeriksa type TypeScript tanpa menghasilkan file output.

## Project Structure

```txt
src/
  app/                 App Router dan global CSS
  components/ui/       Komponen UI dasar
  data/                Mock data kecil untuk MVP
  lib/                 Constants, formatter, routes, dan utilities
  types/               Type contract domain Pacul
```

## Demo Data

Listing dan stok yang tampil adalah data demo kecil untuk memperlihatkan kontrak frontend. Data tersebut bukan data produksi dan belum berasal dari backend.

## Block 1 Scope

Block ini hanya frontend foundation. Dashboard final, marketplace final, upload sampah, autentikasi, Supabase, storage, AI classification production, negosiasi, dan transaksi belum diimplementasikan.

## Notes

Dependency audit npm saat ini melaporkan dua kerentanan moderat pada dependency transitif. Hindari `npm audit fix --force` tanpa menilai perubahan breaking terlebih dahulu.
