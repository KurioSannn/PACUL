# PACUL Frontend Audit — Block 0

Tanggal audit: 2026-06-22  
Scope: frontend only (`src/`, root `package.json`, `.env.local.example`)

## Stack

| Item | Nilai |
| --- | --- |
| Framework | Next.js 15 App Router |
| Bahasa | TypeScript |
| Styling | Tailwind CSS 4 |
| UI | shadcn/base-ui, komponen custom |
| Auth | Supabase (`@supabase/supabase-js`) |
| API | `src/lib/api/client.ts` + `services.ts` |
| Package manager | npm (`package-lock.json`) |

## Route existing (42 halaman)

Semua halaman app utama sudah memakai komponen `connected/*` kecuali landing (`/`) dan auth views.

| Area | Route | Status integrasi |
| --- | --- | --- |
| Landing | `/` | Mock sections sebagian (hero OK) |
| Auth | `/auth/login`, `/auth/register`, `/auth/role` | Login + register + onboarding terhubung |
| Dashboard | `/dashboard`, `/dashboard/{role}` | Connected; `/dashboard` redirect per role |
| Marketplace | `/marketplace`, `/marketplace/waste`, `/marketplace/materials` | Connected |
| Listings | `/listings/new`, `/listings/[id]`, `/my-materials` | Connected |
| Collector | `/collector/pickups`, `/collector/sorting`, `/collector/materials/new` | Connected |
| Pickup | `/pickup/routes`, `/pickup/[id]`, `/pickup/tracking` | Connected |
| Industry | `/orders`, `/negotiations`, `/transactions`, `/materials/[id]` | Connected |
| Impact | `/impact`, `/reports` | Connected |
| Traceability | `/traceability/[materialId]` | Connected |
| Misc | `/deploy-readiness`, `/notifications`, `/messages` | Connected / partial |

## Demo blockers (prioritas)

1. ~~**Register mock**~~ — diperbaiki Block 3: `register-view.tsx` memanggil `signUp` + redirect onboarding.
2. ~~**Dashboard `/dashboard`**~~ — diperbaiki Block 3: `DashboardRedirect` ke role dashboard.
3. ~~**RequireAuth role mismatch**~~ — diperbaiki Block 3: `getDashboardPath()`.
4. ~~**App shell**~~ — diperbaiki Block 1: `AuthenticatedAppShell` + `AppSidebar`.
5. ~~**UI state**~~ — diperbaiki Block 2: `EmptyState`/`ErrorState`/`AsyncContent` + toast.
6. ~~**Toast feedback**~~ — diperbaiki Block 2: `ToastProvider`.
7. **Data kosong** — jika backend belum di-seed, tampilan 0 (bukan bug frontend).
8. **Komponen mock legacy** — masih ada di `src/components/{collector,industry,pickup,...}` tapi tidak dipakai halaman app.

## Button / link mati atau membingungkan

| Lokasi | Masalah |
| --- | --- |
| `PublicHeader` (guest) | "Buat Listing" tanpa login → perlu auth guard di halaman |
| `/messages` | Menampilkan negotiations (label membingungkan) |

## API integration status

| Modul | Client | UI connected |
| --- | --- | --- |
| Auth / me / profile | Ya | Login + register + onboarding |
| Waste listings | Ya | Ya |
| AI classify | Ya | Ya (classification demo) |
| Collector available / claims | Ya | Ya |
| Routes / pickup map | Ya | Partial (flows-connected) |
| Materials / batches | Ya | Ya |
| Orders / negotiation / transactions | Ya | Ya |
| Dashboard summary / impact | Ya | Ya |
| Reports export | Ya | Ya |
| Points / ratings | Ya | Partial |
| Notifications | Ya | Ya |

## API mismatch / TODO

- Beberapa path backend mungkin berbeda dari daftar ideal; ikuti `backend/openapi` atau `services.ts` existing.
- `/messages` vs `/negotiations` — duplikasi navigasi.
- Route ideal `/household/*`, `/industry/*` belum ada; gunakan alias route existing di `routes.ts` (jangan rewrite massal di Block 0–3).

## Prioritas perbaikan (Block 0–3)

1. Audit doc (file ini)
2. App shell + sidebar role-based
3. API error helper + async UI states + toast
4. Register + onboarding + role redirect

## Validasi

```bash
npm run typecheck
npm run build
```

Lint: tidak tersedia di `package.json`.
