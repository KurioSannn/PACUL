# PACUL Frontend Foundation

## Overview
PACUL adalah marketplace daur ulang tiga lapis untuk Rumah Tangga, Pengepul, dan Industri Pengolah. Repository ini sekarang berfokus pada fondasi frontend yang menyiapkan seluruh route MVP dan bonus, lengkap dengan shell dashboard, mock data, state UI, dan titik integrasi yang jelas.

## Frontend Scope
Frontend block ini menyiapkan struktur penuh agar fitur wajib MVP dan bonus pembeda punya route, UI shell, placeholder page, dan contract data yang rapi. Backend production tetap berada di branch backend: Supabase, auth production, storage, realtime, AI classification production, dan export production belum diimplementasikan di block ini.

## MVP Feature Coverage
- Auth and RBAC
- CRUD listing and waste master
- Pickup map and route
- Waste image classification
- Sell, pickup, sort, material flow
- Order, negotiation, transaction
- Three-layer marketplace and dashboard
- Public deploy readiness

## Bonus Feature Coverage
- Route optimization
- Realtime negotiation chat and history
- Material traceability
- Rating and review
- Impact dashboard
- PDF/Excel report export

## Route Map
Public and auth:
- `/`
- `/auth/login`
- `/auth/register`
- `/auth/role`

Dashboard:
- `/dashboard`
- `/dashboard/household`
- `/dashboard/collector`
- `/dashboard/industry`

Marketplace and master data:
- `/marketplace/waste`
- `/marketplace/materials`
- `/listings/new`
- `/listings/[id]`
- `/listings/[id]/edit`
- `/master/waste-categories`

Pickup and collector flow:
- `/pickup/routes`
- `/pickup/[id]`
- `/pickup/optimizer`
- `/collector/pickups`
- `/collector/sorting`
- `/collector/materials/new`

Classification:
- `/classification/demo`

Orders and transactions:
- `/orders`
- `/orders/new`
- `/negotiations`
- `/negotiations/[id]`
- `/negotiations/[id]/chat`
- `/transactions/[id]`

Bonus and support:
- `/traceability/[materialId]`
- `/reviews`
- `/reviews/new`
- `/impact`
- `/reports`
- `/deploy-readiness`

## Tech Stack
- Next.js 15 App Router
- React 19
- TypeScript
- npm
- Tailwind CSS v4 with `@tailwindcss/postcss`

## Tailwind CSS
Tailwind CSS sekarang tersedia dan terpasang melalui `tailwindcss` dan `@tailwindcss/postcss`. Global CSS ada di `src/app/globals.css` dan diimpor dari root layout.

## Getting Started
```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Available Scripts
- `npm run dev`: menjalankan development server.
- `npm run build`: membuat production build.
- `npm run start`: menjalankan production build.
- `npm run typecheck`: menjalankan TypeScript typecheck tanpa emit.

## Demo Data
Semua halaman skeleton memakai mock data dari `src/data/mock-pacul.ts`. Data tersebut hanya placeholder untuk membangun UI dan alur, bukan data produksi.

## Backend Integration Notes
Integrasi produksi untuk Supabase, auth, storage, AI classification, realtime negotiation chat, dan export laporan masih pending dan akan dihubungkan dari branch backend.

## Notes
- Arah visual mengikuti desain hijau natural, clean, dan operasional dari `DESIGN .md`.
- Route skeleton dibangun agar tidak ada halaman kosong saat dikembangkan bertahap.
- Tidak ada env baru yang ditambahkan pada block ini.