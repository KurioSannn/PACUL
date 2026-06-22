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

Dashboard and Household:
- `/dashboard`
- `/dashboard/household`
- `/dashboard/collector`
- `/dashboard/industry`
- `/profile`
- `/my-materials`
- `/notifications`
- `/messages`

Marketplace and master data:
- `/marketplace/waste`
- `/marketplace/materials`
- `/listings/new`
- `/listings/[id]`
- `/listings/[id]/edit`
- `/master/waste-categories`

Pickup and collector flow:
- `/pickup/confirm`
- `/pickup/tracking`
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

## UI System

Frontend menggunakan Tailwind CSS, shadcn/ui, lucide-react, dan motion untuk komponen UI, ikon, dan micro-interaction.

- `src/components/layout/public-header.tsx`: header publik fixed dengan navigasi desktop dan Sheet menu mobile.
- `src/components/media/video-backdrop.tsx`: backdrop video dekoratif yang aman, termasuk overlay dan fallback saat video atau motion tidak tersedia.
- `src/components/home/`: hero PACUL dan slot calon mitra ekosistem tanpa klaim sponsor atau logo eksternal.

## Landing Page

Hero utama dipertahankan sebagai pembuka. Konten setelah hero disusun ulang dengan pendekatan mobile-first menjadi:

- `Mengapa PACUL` dengan tiga metrik demo yang diberi penanda jelas.
- `Etalase Sirkular` untuk membedakan material mentah dan produk daur ulang.
- `Kolaborasi Ekosistem` dengan kategori calon mitra tanpa klaim kerja sama resmi.
- Marquee `Supported by` berisi logo SVG generik dengan penanda demo, pause saat hover/focus, dan dukungan reduced motion.
- Blok ajakan bergabung yang mengarah ke route register dan marketplace yang tersedia.

## Marketplace dan Laporan

- `/marketplace/waste`: pencarian, filter kategori/status, empty state, dan tautan detail listing berbasis mock data.
- `/marketplace/materials`: pencarian, filter kategori/ketersediaan, traceability, serta entry point order yang mengikuti status stok.
- `/reports`: filter peran dan periode, metrik aktivitas, tabel laporan, empty state, serta ekspor CSV lokal.

Marketplace dan laporan masih menggunakan data demo. Persistensi listing, sinkronisasi stok, autentikasi user, dan data laporan produksi menunggu integrasi backend.

## User 1: Rumah Tangga (Household)
Sprint fitur khusus rumah tangga mencakup:
- **Profil**: Halaman `/profile` dengan identitas, metrik aktivitas, preferensi notifikasi, dan shortcut aksi.
- **Material Saya**: Halaman `/my-materials` menampilkan daftar listing yang dibuat dengan integrasi status (draft, listed, scheduled).
- **Konfirmasi Pickup**: Alur domain-specific (bukan e-commerce biasa) di `/pickup/confirm` untuk mengulas rincian material, jadwal, mitra pengangkut, dan estimasi nilai sebelum menyetujui.
- **Notifikasi**: Halaman pusat notifikasi di `/notifications` (serta ikon badge di navbar desktop/mobile) untuk melacak status pickup, pesan baru, dsb. Mendukung filter "Belum dibaca".
- **Chat Mitra**: Integrasi chat mock di `/messages` untuk komunikasi langsung dengan mitra pengangkut.
- **Tracking Pickup**: Halaman visual realtime-ready di `/pickup/tracking` menampilkan placeholder map, timeline status pengambilan, dan ETA.

*Penting:* Seluruh data profil, notifikasi, riwayat chat, dan tracking masih bersifat **mock/demo**. Fungsionalitas *realtime* di UI sudah siap diintegrasikan melalui channel WebSocket/Supabase yang akan datang dari backend.

## Hero Video Asset

Hero mendukung video lokal opsional pada path berikut:

- `public/videos/pacul-hero.webm`
- `public/videos/pacul-hero.mp4`
- `public/images/pacul-hero-poster.jpg`

Jika asset belum tersedia, UI memakai fallback visual hijau dan tetap bisa berjalan. Tidak ada video remote yang digunakan sebagai default.

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
Semua halaman skeleton memakai mock data dari `src/data/mock-pacul.ts` dan `src/data/mock-household.ts`. Data tersebut hanya placeholder untuk membangun UI dan alur, bukan data produksi.

## Backend Integration Notes
Integrasi produksi untuk Supabase, auth, storage, AI classification, realtime negotiation chat, dan export laporan masih pending dan akan dihubungkan dari branch backend.

## Notes
- Arah visual mengikuti desain hijau natural, clean, dan operasional dari `DESIGN .md`.
- Route skeleton dibangun agar tidak ada halaman kosong saat dikembangkan bertahap.
- Tidak ada env baru yang ditambahkan pada block ini.
