# PACUL Backend, AI, and Model Development Prompt Plan (NestJS Edition)

> Repo: `backend-pacul` — **standalone NestJS backend** (greenfield, kosong, belum ada git).
> Stack final: **NestJS + TypeScript + Supabase** (PostgreSQL, Auth, Storage, Realtime, RLS).
> Dokumen ini adalah panduan prompt blok-demi-blok untuk diberikan ke Cursor/Claude Code.
> Output tiap blok adalah kode backend; dokumen ini sendiri BUKAN implementasi.

## Catatan Adaptasi Penting (baca dulu)

Berbeda dari draft awal yang mengasumsikan repo fullstack Next.js, kenyataan repo ini:

1. **Repo kosong & standalone backend.** Tidak ada folder `app/`, `pages/`, `components/`, `styles/`. Tidak ada UI untuk dilindungi. Maka guardrail "jangan sentuh frontend" diganti menjadi **disiplin API-contract**: backend ini harus menghasilkan kontrak (OpenAPI, contoh JSON, shared types) agar repo frontend terpisah bisa integrasi tanpa konflik.
2. **Belum ada git.** Blok 0.1 melakukan `git init` + scaffold NestJS, bukan sekadar membuat folder.
3. **Stack = NestJS**, jadi pola berubah dari "Next.js API routes + lib/server" menjadi **module Nest** (`controller` + `service` + `dto` + `guard` + `module`). Endpoint path tetap sama persis seperti spesifikasi.
4. **Database**: Supabase Postgres. Migration ditulis sebagai file SQL di `db/migrations/` dan diterapkan via Supabase CLI (`supabase db push`) atau `psql`. Tidak memakai ORM berat; akses data lewat `@supabase/supabase-js` (admin client untuk server-side, bypass RLS by design).
5. **Validasi**: idiomatik Nest = `class-validator` + `class-transformer` via global `ValidationPipe`. (Spec lama menyebut zod/joi/class-validator "sesuai stack" → untuk Nest dipakai class-validator.)
6. **Auth/RBAC**: Supabase JWT diverifikasi di `SupabaseAuthGuard`; role dicek di `RolesGuard` + decorator `@Roles()`. Response konsisten via global `ResponseInterceptor` + `AllExceptionsFilter`.
7. **Rate limit**: `@nestjs/throttler`. **Realtime**: Supabase Realtime (dokumentasi channel untuk frontend) + endpoint authorization. **Reports**: `pdfkit` (PDF) + `exceljs` (Excel). **AI**: mock classifier default, ONNX/tfjs opsional.

---

## Development Rules

Berlaku untuk SEMUA blok tanpa pengecualian:

- **Backend only.** Repo ini murni backend. Jangan scaffold/menambah frontend (React, Tailwind, halaman, dsb). Jika butuh kontrak untuk frontend, hasilkan OpenAPI/contoh JSON/shared types — bukan kode UI.
- **Inspect dulu, edit kemudian.** Tiap blok dimulai dengan membaca struktur `src/`, `package.json`, `tsconfig.json`, `nest-cli.json`, dan `docs/ARCHITECTURE_DECISION.md` sebelum mengubah file.
- **Satu blok = satu tanggung jawab.** Perubahan incremental dan mudah di-review. Jangan menggabung dua fitur tak berhubungan.
- **Update dokumentasi.** Setiap endpoint baru → `docs/API.md` + `docs/openapi.yaml`. Setiap env baru → `.env.example` + `docs/README.md`. Setiap tabel baru → migration + relasi + index + constraint + seed (bila relevan).
- **Jalankan validasi** di akhir tiap blok (lihat Validation Commands). Jika sebuah command belum ada, jelaskan alasannya secara eksplisit, jangan mengarang hasil.
- **Semantic commit** sesuai format tiap blok.
- **Jaga RBAC ketat.** Tiap controller/route protected oleh `SupabaseAuthGuard` + `RolesGuard` kecuali endpoint publik yang sengaja ditandai `@Public()`.
- **Jaga status transition.** Semua perubahan status bisnis lewat transition validator terpusat, bukan string bebas.
- **Jangan hardcode data production.** Data dummy hanya di `db/seeds/` atau script terpisah. Nilai konfigurasi dari `.env` via `ConfigService`.
- **Jangan commit secret.** Hanya `.env.example` yang berisi placeholder. `.env` masuk `.gitignore`.
- **RLS Supabase** diaktifkan pada setiap tabel yang menyimpan data user. Admin client backend memang bypass RLS (server-side trusted); RLS melindungi akses langsung via anon key.
- **Realtime channel** wajib punya authorization check sebelum subscribe diizinkan.

---

## Suggested Branch Strategy

Repo ini berdiri sendiri (kemungkinan frontend ada di repo lain). Strategi:

```
main
└── develop                     ← integrasi backend
    ├── backend/core-services    ← scaffold, config, supabase, auth, RBAC, profile, master data
    ├── backend/ai-classification← AI service, classifier, inference, override
    ├── backend/marketplace      ← listing, material batch, order
    ├── backend/routing          ← haversine, nearest-neighbor, route
    ├── backend/negotiation      ← realtime chat, offer, negosiasi
    ├── backend/traceability     ← PACUL Track, timeline
    ├── backend/reports          ← export PDF/Excel, dashboard
    └── backend/testing-docs     ← test, seed, docs, deploy
```

Aturan:
- Tiap fase besar boleh punya feature branch sendiri; PR menuju `develop`.
- `main` hanya menerima merge dari `develop` yang sudah lulus `npm run pr:check`.
- Jangan commit langsung ke `main`.

---

## Block Map

| Blok | Judul |
|------|-------|
| 0.0 | Scaffold Decision & Architecture Note |
| 0.1 | Git Init + NestJS Project Scaffold |
| 0.2 | Environment Config & .env.example Baseline |
| 1.0 | Supabase Module & Client Factories |
| 1.1 | Core Database Schema — Users, Profiles, Roles |
| 1.2 | Auth Guard — Supabase JWT Verification + Response/Filter |
| 1.3 | RBAC — RolesGuard, @Roles, Capability Map |
| 1.4 | Profile Module — /me, /me/profile, complete-profile |
| 2.0 | Master Data — Waste Categories |
| 2.1 | Collector Handled Categories |
| 3.0 | Storage Module — Supabase Storage Setup |
| 3.1 | Image Upload Endpoint & Validation |
| 4.0 | AI Classifier — Taxonomy & Mapping |
| 4.1 | AI Inference Engine — Mock Fallback & Model Loader |
| 4.2 | AI Classification Endpoint & Persistence |
| 4.3 | Manual Override Endpoint & Logging |
| 5.0 | Waste Listing Schema & Migration |
| 5.1 | Waste Listing CRUD Endpoints |
| 5.2 | Waste Listing Status Transition Engine |
| 5.3 | Waste Listing Publish & Cancel |
| 6.0 | Collector Marketplace — Available Waste Filter |
| 6.1 | Pickup Claim — Claim & Status Management |
| 7.0 | Haversine Distance Utility |
| 7.1 | Nearest-Neighbor Route Algorithm |
| 7.2 | Pickup Cost Estimation Service |
| 7.3 | Route Preview Endpoint |
| 7.4 | Route Commit — Persist Route & Route Stops |
| 7.5 | Route Status Management & Recalculate |
| 8.0 | Sorting & Material Batch Schema |
| 8.1 | Material Batch CRUD & Pemilahan Logic |
| 8.2 | Material Batch Status Transition |
| 8.3 | Material Marketplace — Listing untuk Industri |
| 9.0 | Order Schema & Migration |
| 9.1 | Order Create & Status Engine |
| 9.2 | Negotiation Thread & Message Schema |
| 9.3 | Negotiation Offer / Counter-offer Service |
| 9.4 | Realtime Chat — Supabase Realtime Channel |
| 9.5 | Negotiation Accept, Cancel & History |
| 10.0 | Transaction Simulation & Completion |
| 11.0 | Traceability Event System — Schema & Emitter |
| 11.1 | PACUL Track API — Timeline Endpoints |
| 12.0 | Rating & Review System |
| 13.0 | Dashboard Summary Endpoints |
| 13.1 | Dashboard Impact & Material Flow Endpoints |
| 14.0 | Export Laporan PDF |
| 14.1 | Export Laporan Excel |
| 14.2 | Report Metadata & Download Endpoint |
| 15.0 | Notification & Audit Log |
| 16.0 | RLS Policies — Supabase Row Level Security |
| 16.1 | Realtime Channel Security |
| 17.0 | Security Hardening & Input Validation |
| 18.0 | Seed Data Demo Lengkap |
| 19.0 | Unit Testing — AI, Haversine, Route, Cost, Status |
| 19.1 | Integration/E2E Testing — Listing, Pickup, Material, Order |
| 19.2 | E2E Testing — Traceability & Export Smoke Test |
| 20.0 | OpenAPI Specification (Swagger) |
| 20.1 | README Backend Lengkap |
| 21.0 | Deployment Config & Public Backend Setup |
| 21.1 | Final Smoke Test End-to-End |
| 21.2 | PR Checklist Backend |

**Total: 45 blok (0.0 – 21.2).**

---

## Target Project Structure (acuan semua blok)

```
backend-pacul/
├── src/
│   ├── main.ts                       # bootstrap, global pipe/interceptor/filter, swagger
│   ├── app.module.ts
│   ├── common/
│   │   ├── guards/                   # supabase-auth.guard.ts, roles.guard.ts
│   │   ├── decorators/               # roles.decorator.ts, current-user.decorator.ts, public.decorator.ts
│   │   ├── interceptors/             # response.interceptor.ts
│   │   ├── filters/                  # all-exceptions.filter.ts
│   │   ├── config/                   # capabilities.ts, status-transitions.ts
│   │   ├── dto/                      # pagination.dto.ts, api-response types
│   │   └── utils/                    # haversine.ts, route-optimizer.ts, file.utils.ts
│   ├── supabase/                     # supabase.module.ts, supabase.service.ts
│   └── modules/
│       ├── auth/  profiles/  waste-categories/  collector/  storage/  ai/
│       ├── waste-listings/  pickup/  routes/  materials/  orders/
│       ├── negotiation/  transactions/  traceability/  ratings/
│       ├── dashboard/  reports/  notifications/  realtime/
├── db/
│   ├── migrations/                   # 001_*.sql ... (Supabase CLI applies)
│   └── seeds/                        # 000_setup_storage.ts ... index.ts
├── test/                             # *.e2e-spec.ts (Supertest)
├── docs/
│   ├── PROMPT_PLAN.md  ARCHITECTURE_DECISION.md  API.md  README.md  openapi.yaml
├── .env.example  .gitignore  nest-cli.json  tsconfig.json  package.json
```

Tiap modul Nest mengikuti pola: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, dan tipe entity di `*.types.ts` atau `entities/`.

---

# DETAIL BLOK

## Block 0.0 — Scaffold Decision & Architecture Note

### Objective
Tetapkan keputusan teknis tertulis (stack NestJS + Supabase) sebelum scaffold, sebagai source of truth semua blok.

### Scope
Hanya membuat satu file dokumentasi keputusan. Belum init project, belum kode.

### Why This Block Matters
Repo kosong; tanpa keputusan tertulis, blok-blok berikut bisa saling bertabrakan soal struktur folder, tooling, dan konvensi.

### Cursor Prompt
```
The repository is empty and not yet a git repo. Do NOT scaffold code in this block.
Create ONLY: docs/ARCHITECTURE_DECISION.md

Record these decisions as the source of truth for all later work:
- Runtime/framework: NestJS (latest stable) + TypeScript (strict).
- HTTP adapter: Express (Nest default).
- DB/Auth/Storage/Realtime: Supabase. Server-side data access via @supabase/supabase-js admin client (service role) — intentionally bypasses RLS for trusted server logic; RLS protects direct anon-key access.
- Migrations: plain SQL files in db/migrations/, applied via Supabase CLI (`supabase db push`) or psql. No heavy ORM.
- Validation: class-validator + class-transformer via global ValidationPipe (whitelist + forbidNonWhitelisted + transform).
- Auth: SupabaseAuthGuard verifies Supabase JWT; RolesGuard + @Roles() for RBAC.
- Response shape: global ResponseInterceptor -> { success, data, meta? }; AllExceptionsFilter -> { success:false, error, code, details? }.
- Rate limit: @nestjs/throttler. AI: mock classifier default (onnxruntime-node/sharp optional). Reports: pdfkit + exceljs. Realtime: Supabase Realtime.
- Testing: Jest (unit) + Supertest (e2e in test/).
- Folder layout: src/common, src/supabase, src/modules/<feature>, db/migrations, db/seeds, docs.
- API contract discipline: this is a standalone backend; produce OpenAPI + JSON examples + shared DTO types for a separate frontend repo.

The file is the source of truth. Create no other file. Modify nothing else.
```

### Allowed Files / Areas
- `docs/ARCHITECTURE_DECISION.md` (baru)

### Forbidden Files / Areas
- Semua file lain (belum ada apa pun; jangan scaffold di sini)

### Data Model / API Notes
Tidak ada — dokumentasi keputusan saja.

### Acceptance Criteria
- [ ] `docs/ARCHITECTURE_DECISION.md` ada dan memuat seluruh keputusan di atas.
- [ ] Tidak ada file lain dibuat/diubah.

### Validation Commands
```
# Tidak ada build/test di blok ini (belum ada project). Cukup verifikasi isi file.
```

### Semantic Commit Message
`chore(repo): add architecture decision note for standalone NestJS + Supabase backend`

---

## Block 0.1 — Git Init + NestJS Project Scaffold

### Objective
Inisialisasi git dan scaffold project NestJS + TypeScript dengan tooling (lint, format, test, build) dan struktur folder dasar.

### Scope
`git init`, scaffold Nest, konfigurasi tsconfig strict, eslint/prettier, script npm, folder `src/common`, `src/supabase`, `src/modules`, `db/`, `docs/`. Belum ada logika bisnis.

### Why This Block Matters
Semua blok berikutnya butuh project Nest yang bisa di-build, di-lint, dan di-test.

### Cursor Prompt
```
Initialize the standalone NestJS backend per docs/ARCHITECTURE_DECISION.md.

1. git init (default branch main). Add a Node .gitignore including: node_modules, dist, .env, *.log, coverage, db/seeds/output, ai models (*.onnx).
2. Scaffold a NestJS app in the current directory (do not create a nested folder). Use npm. Enable TypeScript strict mode in tsconfig.json (strict: true, noImplicitAny, strictNullChecks).
3. Install core deps: @nestjs/config @supabase/supabase-js class-validator class-transformer @nestjs/throttler @nestjs/swagger. Keep Jest + Supertest from the Nest template.
4. Create folder skeleton with .gitkeep where empty:
   src/common/{guards,decorators,interceptors,filters,config,dto,utils}
   src/supabase
   src/modules
   db/migrations  db/seeds  docs  test
5. Wire src/main.ts with: global ValidationPipe ({ whitelist:true, forbidNonWhitelisted:true, transform:true }), and import ConfigModule.forRoot({ isGlobal:true }) in AppModule. Do NOT add business modules yet.
6. Add npm scripts: "typecheck": "tsc --noEmit", keep "lint", "format", "build", "start", "start:dev", "test", "test:e2e".
7. Confirm the app builds and starts (no business endpoints). Keep the default health/root controller minimal or remove it cleanly.
8. Create empty placeholders docs/API.md and docs/README.md with a title heading only.

Do NOT add Supabase logic, DB tables, or feature modules yet.
```

### Allowed Files / Areas
- Seluruh root project (scaffold), `src/`, `db/`, `docs/`, config files, `package.json`, `.gitignore`

### Forbidden Files / Areas
- Tidak ada kode fitur/bisnis, tidak ada tabel DB, tidak ada Supabase client di blok ini.

### Data Model / API Notes
Tidak ada.

### Acceptance Criteria
- [ ] `git` aktif; `.gitignore` mengabaikan `.env`, `dist`, `node_modules`.
- [ ] `npm run build` dan `npm run start` sukses.
- [ ] Global `ValidationPipe` aktif; `ConfigModule` global.
- [ ] Struktur folder sesuai acuan.

### Validation Commands
```
npm run typecheck
npm run lint
npm run build
```

### Semantic Commit Message
`chore(repo): init git and scaffold NestJS backend with tooling and folder skeleton`

---

## Block 0.2 — Environment Config & .env.example Baseline

### Objective
Buat `.env.example` lengkap + validasi env saat boot, dan dokumentasikan tiap variable.

### Scope
`.env.example`, schema validasi env (Nest ConfigModule `validate`), section env di `docs/README.md`.

### Why This Block Matters
Hackathon sering rusak karena env tidak terdokumentasi. Validasi saat boot mencegah error misterius.

### Cursor Prompt
```
Add full environment configuration.

1. Create .env.example at root with sections + comments:
   # Supabase
   SUPABASE_URL=  SUPABASE_ANON_KEY=  SUPABASE_SERVICE_ROLE_KEY=  SUPABASE_JWT_SECRET=
   # AI
   AI_MODEL_PATH=./models/waste_classifier.onnx  AI_MODEL_VERSION=1.0.0  AI_USE_MOCK_CLASSIFIER=true
   AI_MAX_FILE_SIZE_MB=5  AI_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
   AI_INFERENCE_TIMEOUT_MS=10000  AI_TOP_K_PREDICTIONS=3
   # Route
   ROUTE_BASE_FEE=5000  ROUTE_COST_PER_KM=2000  ROUTE_HANDLING_COST_PER_KG=300
   # Storage
   SUPABASE_STORAGE_BUCKET_WASTE_IMAGES=waste-images  SUPABASE_STORAGE_BUCKET_REPORTS=reports
   # Realtime
   SUPABASE_REALTIME_ENABLED=true
   # Reports
   REPORT_EXPORT_EXPIRES_HOURS=24
   # Security
   CORS_ALLOWED_ORIGINS=http://localhost:3000  RATE_LIMIT_AI_PER_MINUTE=10
   # App
   NODE_ENV=development  PORT=4000  APP_LOG_LEVEL=info
   # Demo
   DEMO_SEED_ENABLED=true
2. Create src/common/config/env.validation.ts using class-validator (a class with @IsString/@IsBoolean/@IsNumber etc.) and a validate() function; wire it into ConfigModule.forRoot({ validate, isGlobal:true }). App must throw a clear error at boot if required vars are missing.
3. Update docs/README.md with an "Environment Variables" section describing each var.
Do NOT create a real .env. Only .env.example.
```

### Allowed Files / Areas
- `.env.example`, `src/common/config/env.validation.ts`, `src/app.module.ts`, `docs/README.md`

### Forbidden Files / Areas
- `.env` (jangan dibuat), modul fitur.

### Data Model / API Notes
Tidak ada.

### Acceptance Criteria
- [ ] `.env.example` lengkap dengan komentar.
- [ ] App gagal boot dengan pesan jelas jika env wajib kosong.
- [ ] Section env ada di README.

### Validation Commands
```
npm run typecheck
npm run lint
npm run build
```

### Semantic Commit Message
`chore(config): add .env.example and boot-time env validation`

---

## Block 1.0 — Supabase Module & Client Factories

### Objective
Module Supabase global yang menyediakan admin client (service role) dan factory client per-request (anon + JWT user).

### Scope
`SupabaseModule`, `SupabaseService` (getAdminClient, getClientForToken), tipe dasar.

### Why This Block Matters
Semua modul data bergantung pada koneksi yang benar. Admin client untuk logika server; client per-token untuk operasi atas nama user.

### Cursor Prompt
```
Create a global Supabase module.

1. src/supabase/supabase.service.ts:
   - getAdminClient(): SupabaseClient (uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY; bypasses RLS; server-only).
   - getClientForToken(accessToken: string): SupabaseClient (uses SUPABASE_URL + SUPABASE_ANON_KEY with global Authorization: Bearer header).
   - getUserFromToken(accessToken: string): verifies token via auth.getUser(); returns user or null.
   - Read all values via ConfigService; throw clear errors if missing.
2. src/supabase/supabase.module.ts: @Global() module exporting SupabaseService.
3. Import SupabaseModule into AppModule.
4. Export shared types (SupabaseClient aliases) in src/supabase/supabase.types.ts.
Do NOT create any tables. Do NOT add feature endpoints.
```

### Allowed Files / Areas
- `src/supabase/*`, `src/app.module.ts`

### Forbidden Files / Areas
- Migrations, modul fitur.

### Data Model / API Notes
Admin client = service role (trusted, bypass RLS). Per-token client = atas nama user (tunduk RLS).

### Acceptance Criteria
- [ ] `SupabaseService` punya admin + per-token factory.
- [ ] Error jelas bila env hilang.
- [ ] Tidak ada secret hardcode.

### Validation Commands
```
npm run typecheck
npm run lint
npm run build
```

### Semantic Commit Message
`feat(db): add global Supabase module with admin and per-token client factories`

---

## Block 1.1 — Core Database Schema — Users, Profiles, Roles

### Objective
Migration tabel profil: `user_profiles`, `household_profiles`, `collector_profiles`, `industry_profiles` + trigger updated_at + tipe TS.

### Scope
Migration SQL + tipe TypeScript. Belum ada endpoint.

### Why This Block Matters
Fondasi RBAC dan semua relasi.

### Cursor Prompt
```
Create core user schema. Integrate with Supabase Auth (auth.users).

Create db/migrations/001_core_user_schema.sql:
- user_profiles(id UUID PK REFERENCES auth.users(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK (role IN ('household','collector','industry')), display_name TEXT NOT NULL, phone TEXT, avatar_url TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()); INDEX on role, is_active.
- household_profiles(id UUID PK REFERENCES user_profiles(id) ON DELETE CASCADE, address TEXT, latitude DECIMAL(10,8), longitude DECIMAL(11,8), district TEXT, city TEXT, province TEXT, total_waste_kg DECIMAL DEFAULT 0, total_listings INTEGER DEFAULT 0).
- collector_profiles(id PK REFERENCES user_profiles(id) ON DELETE CASCADE, business_name TEXT, service_area_description TEXT, base_latitude DECIMAL(10,8), base_longitude DECIMAL(11,8), vehicle_capacity_kg DECIMAL, rating_average DECIMAL(3,2) DEFAULT 0, rating_count INTEGER DEFAULT 0, total_pickups INTEGER DEFAULT 0, total_kg_collected DECIMAL DEFAULT 0).
- industry_profiles(id PK REFERENCES user_profiles(id) ON DELETE CASCADE, company_name TEXT NOT NULL, industry_type TEXT, address TEXT, latitude DECIMAL(10,8), longitude DECIMAL(11,8), rating_average DECIMAL(3,2) DEFAULT 0, rating_count INTEGER DEFAULT 0, total_orders INTEGER DEFAULT 0).
- Add function update_updated_at() and trigger on user_profiles.

Create src/modules/profiles/profiles.types.ts: UserRole union, UserProfile, HouseholdProfile, CollectorProfile, IndustryProfile, UserWithProfile.
Document the schema in docs/API.md under "Database Schema — Users".
Do not apply the migration automatically; document the apply command in README.
```

### Allowed Files / Areas
- `db/migrations/001_core_user_schema.sql`, `src/modules/profiles/profiles.types.ts`, `docs/API.md`

### Forbidden Files / Areas
- Endpoint/logika (belum), modul lain.

### Data Model / API Notes
Sub-profil one-to-one ke `user_profiles`. `role` adalah source of truth RBAC.

### Acceptance Criteria
- [ ] Migration valid (PK, FK, index, CHECK role).
- [ ] Tipe TS lengkap.
- [ ] Schema terdokumentasi.

### Validation Commands
```
npm run typecheck
npm run lint
# Manual: supabase db push  (atau psql -f db/migrations/001_core_user_schema.sql)
```

### Semantic Commit Message
`feat(db): add core user schema with role-based profiles and types`

---

## Block 1.2 — Auth Guard — Supabase JWT Verification + Response/Filter

### Objective
`SupabaseAuthGuard` yang verifikasi JWT dan menyuntik `req.user = { id, email, role }`, plus global response interceptor & exception filter.

### Scope
Guard, `@CurrentUser()` decorator, `@Public()` decorator, `ResponseInterceptor`, `AllExceptionsFilter`, unit test guard.

### Why This Block Matters
Tanpa guard terpusat, tiap controller menulis parsing session sendiri → inkonsistensi & celah keamanan.

### Cursor Prompt
```
Create authentication layer.

1. src/common/decorators/public.decorator.ts: @Public() sets metadata 'isPublic'.
2. src/common/decorators/current-user.decorator.ts: @CurrentUser() param decorator returning req.user.
3. src/common/guards/supabase-auth.guard.ts (implements CanActivate):
   - Skip if @Public().
   - Read Authorization: Bearer <token>. If missing/invalid -> UnauthorizedException with code 'AUTH_REQUIRED'.
   - Verify via SupabaseService.getUserFromToken(token).
   - Fetch role from user_profiles by user id (admin client). If no row -> ForbiddenException code 'PROFILE_MISSING'.
   - Attach req.user = { id, email, role }.
4. src/common/interceptors/response.interceptor.ts: wrap success -> { success:true, data, meta? }.
5. src/common/filters/all-exceptions.filter.ts: format errors -> { success:false, error, code, details? } with correct HTTP status.
6. Register guard/interceptor/filter globally in main.ts (or via APP_GUARD/APP_INTERCEPTOR/APP_FILTER providers).
7. src/common/types: AuthUser = { id, email, role }.
8. Unit test src/common/guards/supabase-auth.guard.spec.ts: (a) 401 no token, (b) 401 invalid token (mock SupabaseService), (c) attaches user with valid token.
Do not implement business endpoints.
```

### Allowed Files / Areas
- `src/common/guards/*`, `src/common/decorators/*`, `src/common/interceptors/*`, `src/common/filters/*`, `src/main.ts`, `src/common/types`, test file

### Forbidden Files / Areas
- Modul fitur, hardcode JWT secret.

### Data Model / API Notes
Error: `{ success:false, error, code }`. Success: `{ success:true, data, meta? }`. `AuthUser.role` dari `user_profiles`.

### Acceptance Criteria
- [ ] Guard verifikasi JWT & inject user+role.
- [ ] Response/error konsisten global.
- [ ] Min. 3 test guard hijau.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- supabase-auth.guard
```

### Semantic Commit Message
`feat(auth): add Supabase JWT guard, response interceptor, and exception filter`

---

## Block 1.3 — RBAC — RolesGuard, @Roles, Capability Map

### Objective
`RolesGuard` + `@Roles()` decorator komposisi dengan auth guard, plus capability map terpusat + endpoint publik `/roles/capabilities`.

### Scope
RolesGuard, decorator, `capabilities.ts`, controller capabilities, unit test.

### Why This Block Matters
RBAC tersentralisasi mencegah kebocoran akses antar role dan menjadi dokumentasi hidup.

### Cursor Prompt
```
Create RBAC.

1. src/common/decorators/roles.decorator.ts: @Roles(...roles: UserRole[]) via SetMetadata.
2. src/common/guards/roles.guard.ts: reads required roles; if req.user.role not included -> ForbiddenException code 'INSUFFICIENT_ROLE'. Register globally AFTER auth guard (order matters).
3. src/common/config/capabilities.ts: export PACUL_CAPABILITIES (household/collector/industry capability arrays exactly as in spec) and type Capability.
4. src/modules/auth/auth.controller.ts (or a roles controller): GET /roles/capabilities marked @Public(), returns PACUL_CAPABILITIES.
5. Unit test roles.guard.spec.ts: wrong role blocked, correct role passes, multiple allowed roles.
6. Document GET /roles/capabilities in docs/API.md.
```

Capability map (wajib):
- household: create_waste_listing, view_own_waste_listings, view_pickup_status, view_material_traceability, rate_collector, view_own_impact_dashboard, export_own_report
- collector: view_available_waste_listings, claim_waste_listing, create_pickup_route, manage_route_status, sort_waste_into_material_batch, create_material_batch, publish_material_listing, negotiate_with_industry, rate_household, rate_industry, view_collector_dashboard, export_collector_report
- industry: view_material_marketplace, create_order, negotiate_with_collector, complete_transaction, rate_collector, view_industry_dashboard, export_industry_report, view_material_traceability

### Allowed Files / Areas
- `src/common/guards/roles.guard.ts`, `src/common/decorators/roles.decorator.ts`, `src/common/config/capabilities.ts`, `src/modules/auth/*`, `docs/API.md`, test file

### Forbidden Files / Areas
- Modul fitur lain.

### Data Model / API Notes
`GET /roles/capabilities` → `{ success:true, data: { household:[...], collector:[...], industry:[...] } }`.

### Acceptance Criteria
- [ ] `@Roles()` + RolesGuard berfungsi & komposisi dgn auth guard.
- [ ] Capability map lengkap 3 role.
- [ ] Endpoint publik tersedia; test hijau.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- roles.guard
```

### Semantic Commit Message
`feat(auth): add RBAC RolesGuard, @Roles decorator, and capability map`

---

## Block 1.4 — Profile Module — /me, /me/profile, complete-profile

### Objective
Module profil: ambil profil lengkap, update profil per-role, dan complete-profile untuk user baru.

### Scope
ProfilesService, DTO (class-validator), ProfilesController (`GET /me`, `PATCH /me/profile`, `POST /auth/complete-profile`).

### Why This Block Matters
Tanpa profil (lokasi, jenis usaha), fitur marketplace tak jalan.

### Cursor Prompt
```
Create profiles module.

1. src/modules/profiles/profiles.service.ts:
   - getFullProfile(userId): user_profiles + sub-profile by role.
   - createProfile(userId, role, dto): insert user_profiles + sub-profile (use admin client; wrap in a logical transaction — insert sequentially and roll back/clean up on failure).
   - updateProfile(userId, dto): update user_profiles + sub-profile fields by role.
   - ensureProfileExists(userId): create blank if absent.
2. DTOs in src/modules/profiles/dto/ with class-validator:
   CreateHouseholdProfileDto, CreateCollectorProfileDto, CreateIndustryProfileDto, Update*ProfileDto, CompleteProfileDto ({ role, ...profile }).
3. src/modules/profiles/profiles.controller.ts (guards applied globally):
   - GET /me -> UserWithProfile.
   - PATCH /me/profile -> validate by req.user.role; update; return UserWithProfile.
   - POST /auth/complete-profile -> create user_profiles + sub-profile; return profile.
4. Register ProfilesModule in AppModule. Document all 3 endpoints in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/profiles/*`, `src/app.module.ts`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Data Model / API Notes
`GET /me` → `{ success:true, data: { id, email, role, display_name, phone, avatar_url, is_active, profile } }`.

### Acceptance Criteria
- [ ] `/me` kembalikan profil + sub-profil.
- [ ] `/me/profile` validasi sesuai role.
- [ ] DTO class-validator dipakai; terdokumentasi.

### Validation Commands
```
npm run typecheck
npm run lint
# smoke: curl -H "Authorization: Bearer <token>" http://localhost:4000/me
```

### Semantic Commit Message
`feat(auth): add profiles module with /me, /me/profile, and complete-profile`

---

## Block 2.0 — Master Data — Waste Categories

### Objective
Tabel + seed `waste_categories` + endpoint publik daftar kategori.

### Scope
Migration, seed TS, WasteCategoriesModule (`GET /waste-categories` publik), tipe.

### Why This Block Matters
Tabel referensi yang dipakai listing, AI mapping, handled categories, material batch. Harus ada lebih dulu.

### Cursor Prompt
```
Create waste categories master data.

1. db/migrations/002_waste_categories.sql: waste_categories(id UUID PK DEFAULT gen_random_uuid(), code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, icon_key TEXT, unit TEXT NOT NULL DEFAULT 'kg', typical_price_per_kg DECIMAL, ai_model_class TEXT, is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()); INDEX on code, is_active, ai_model_class.
2. db/seeds/002_waste_categories.ts: idempotent upsert by code. Seed 8: PLASTIC_PET(plastic_pet,2500), PLASTIC_OTHER(plastic_other,1500), PAPER(paper_cardboard,2000), METAL_CAN(metal_can,4000), GLASS(glass,500), ELECTRONICS(electronics,15000), ORGANIC(organic,300), TEXTILE(textile,1000).
3. src/modules/waste-categories/waste-categories.types.ts: WasteCategory.
4. src/modules/waste-categories/* module+service+controller: GET /waste-categories (@Public()) returns active categories ordered by sort_order.
5. db/seeds/index.ts: runner that calls seeds in order (create if absent).
6. Document endpoint in docs/API.md.
```

### Allowed Files / Areas
- `db/migrations/002_*.sql`, `db/seeds/002_*.ts`, `db/seeds/index.ts`, `src/modules/waste-categories/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Data Model / API Notes
`ai_model_class` menghubungkan output AI ke kategori DB. `typical_price_per_kg` hanya referensi.

### Acceptance Criteria
- [ ] Migration valid; 8 kategori seed.
- [ ] `GET /waste-categories` benar; tipe ada.

### Validation Commands
```
npm run typecheck
npm run lint
# supabase db push ; npx ts-node db/seeds/index.ts
```

### Semantic Commit Message
`feat(db): add waste categories schema, seed, and public endpoint`

---

## Block 2.1 — Collector Handled Categories

### Objective
Tabel `collector_handled_categories` + endpoint kelola jenis sampah yang ditangani pengepul.

### Scope
Migration, CollectorService, DTO, endpoint GET/POST/DELETE handled-categories.

### Why This Block Matters
Mekanisme filter inti marketplace: pengepul hanya melihat listing kategori yang ia tangani.

### Cursor Prompt
```
Create collector handled categories.

1. db/migrations/003_collector_handled_categories.sql: collector_handled_categories(id PK, collector_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE, category_id UUID NOT NULL REFERENCES waste_categories(id) ON DELETE CASCADE, min_weight_kg DECIMAL DEFAULT 0, max_weight_kg DECIMAL, price_offered_per_kg DECIMAL, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(collector_id, category_id)); INDEX collector_id, category_id, is_active.
2. src/modules/collector/collector.service.ts: getHandledCategories(collectorId) (join category details), setHandledCategories(collectorId, items) UPSERT (do not delete unspecified), removeHandledCategory(collectorId, categoryId), getCollectorsForCategory(categoryId).
3. DTO SetHandledCategoryDto: { categoryId, min_weight_kg?, max_weight_kg?, price_offered_per_kg? } (class-validator).
4. Controller (role: collector): GET /collector/handled-categories, POST /collector/handled-categories ({ categories: SetHandledCategoryDto[] }), DELETE /collector/handled-categories/:categoryId (ownership check).
5. Document endpoints in docs/API.md.
```

### Allowed Files / Areas
- `db/migrations/003_*.sql`, `src/modules/collector/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Data Model / API Notes
UNIQUE(collector_id, category_id). `price_offered_per_kg` = harga tawaran pengepul.

### Acceptance Criteria
- [ ] UNIQUE constraint; upsert tidak menghapus yang lain.
- [ ] Role `collector`; ownership pada DELETE.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(db): add collector handled categories schema and management endpoints`

---

## Block 3.0 — Storage Module — Supabase Storage Setup

### Objective
StorageService untuk bucket gambar sampah & laporan: init bucket, upload, signed URL, path generator, file utils.

### Scope
StorageService, file utils, setup script, dokumentasi.

### Why This Block Matters
AI classification butuh gambar di storage aman; setup harus selesai sebelum upload & AI.

### Cursor Prompt
```
Create storage module.

1. src/modules/storage/storage.service.ts (uses SupabaseService admin client):
   - initBuckets(): create 'waste-images' (private, 5MB, image/jpeg|png|webp) and 'reports' (private, 20MB) if absent.
   - uploadWasteImage(buffer, fileName, contentType) -> { path }.
   - getSignedWasteImageUrl(path, expiresSec=3600) -> string.
   - deleteWasteImage(path).
   - generateWasteImagePath(userId, listingId, originalName) -> waste-images/{userId}/{listingId}/{ts}_{sanitized}.
   - uploadReport(buffer, fileName, reportId) -> { path }; getSignedReportUrl(path, expiresSec=3600).
   Bucket names from ConfigService.
2. src/common/utils/file.utils.ts: validateFileType, validateFileSize, sanitizeFileName, getFileSizeMB.
3. db/seeds/000_setup_storage.ts: calls initBuckets(); logs result.
4. Document storage in docs/README.md ("Storage Setup").
```

### Allowed Files / Areas
- `src/modules/storage/*`, `src/common/utils/file.utils.ts`, `db/seeds/000_setup_storage.ts`, `docs/README.md`

### Forbidden Files / Areas
- Modul lain.

### Data Model / API Notes
Path aman & ber-namespace per user/listing. Signed URL default 1 jam.

### Acceptance Criteria
- [ ] `initBuckets()` jalan tanpa error.
- [ ] Signed URL + path generator + file utils ada.

### Validation Commands
```
npm run typecheck
npm run lint
npx ts-node db/seeds/000_setup_storage.ts
```

### Semantic Commit Message
`feat(storage): add Supabase Storage service for waste images and reports`

---

## Block 3.1 — Image Upload Endpoint & Validation

### Objective
Endpoint upload gambar dgn validasi ketat (tipe/ukuran), simpan ke Storage, kembalikan path + signed URL.

### Scope
Upload controller (Nest `FileInterceptor`/Multer memory storage), validasi, endpoint signed-url.

### Why This Block Matters
Pintu masuk gambar; AI memproses dari path hasil endpoint ini.

### Cursor Prompt
```
Create waste image upload endpoints (NestJS).

1. Install @nestjs/platform-express multer types if needed. Use FileInterceptor with memoryStorage; limits from AI_MAX_FILE_SIZE_MB. Allowed mime from AI_ALLOWED_MIME_TYPES.
2. POST /waste-images/upload (auth, any role): multipart field 'image'. Validate type+size (reject -> 400 codes FILE_TOO_LARGE / INVALID_FILE_TYPE). Generate path generateWasteImagePath(userId,'temp',name). Upload to waste-images. Return { path, signedUrl, expiresAt }. Do not link to a listing yet.
3. GET /waste-images/signed-url?path=... (auth): ownership check (path must contain req.user.id). Return { signedUrl, expiresAt }.
4. Validate magic bytes (not just mime) for images; reject path traversal in filename.
5. Document both in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/storage/*` (controller), `package.json`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain; jangan kaitkan ke listing dulu.

### Data Model / API Notes
`POST /waste-images/upload` (multipart) → `{ success:true, data: { path, signedUrl, expiresAt } }`.

### Acceptance Criteria
- [ ] Tolak >5MB & non-image dgn error jelas.
- [ ] Kembalikan path storage (bukan URL langsung).
- [ ] Signed URL berfungsi; ownership dicek.

### Validation Commands
```
npm run typecheck
npm run lint
# curl -F "image=@test.jpg" -H "Authorization: Bearer <token>" http://localhost:4000/waste-images/upload
```

### Semantic Commit Message
`feat(storage): add waste image upload endpoint with validation and signed URLs`

---

## Block 4.0 — AI Classifier — Taxonomy & Mapping

### Objective
Taksonomi kelas sampah, interface classifier, dan mapper kelas→kategori DB.

### Scope
`taxonomy.ts`, `classifier.interface.ts`, `category-mapper`, unit test mapper.

### Why This Block Matters
Mapping harus ada sebelum model agar output AI selalu valid terhadap DB.

### Cursor Prompt
```
Create AI taxonomy + mapping inside src/modules/ai/.

1. ai.taxonomy.ts: WASTE_AI_TAXONOMY const for: plastic_pet, plastic_other, paper_cardboard, metal_can, glass, electronics, organic, textile (each { class, label, description, db_category_code, confidence_threshold }) + unknown ({ db_category_code:null, confidence_threshold:0 }). Export type AIWasteClass.
2. classifier.interface.ts: ClassificationResult { top_class, confidence, top_k: {class,confidence,label}[], inference_time_ms, model_version, is_mock }; interface WasteClassifier { classify(buf,mime): Promise<ClassificationResult>; getModelVersion(): string; isReady(): boolean }.
3. category-mapper.ts (uses admin client): mapAIClassToDBCategory(aiClass) (query waste_categories by code), getTopKCategories(result), isBelowThreshold(result).
4. Unit test category-mapper.spec.ts: known->code, unknown->null, isBelowThreshold low-confidence.
```

### Allowed Files / Areas
- `src/modules/ai/ai.taxonomy.ts`, `src/modules/ai/classifier.interface.ts`, `src/modules/ai/category-mapper.ts`, test

### Forbidden Files / Areas
- Modul lain.

### Data Model / API Notes
`ai_model_class` di DB cocok dengan `class` taksonomi.

### Acceptance Criteria
- [ ] 8 kelas + unknown; interface jelas.
- [ ] Mapper pakai query DB (bukan hardcode); test hijau.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- category-mapper
```

### Semantic Commit Message
`feat(ai): add classifier taxonomy, interface, and category mapper`

---

## Block 4.1 — AI Inference Engine — Mock Fallback & Model Loader

### Objective
`MockClassifier` (selalu siap) + `ModelClassifier` (ONNX/tfjs opsional) + factory pemilih via env + inference logger.

### Scope
Mock, model loader, factory (DI provider Nest), logger, unit test mock.

### Why This Block Matters
Demo tetap jalan tanpa model nyata; arsitektur siap untuk model production.

### Cursor Prompt
```
Create AI inference in src/modules/ai/.

1. mock-classifier.ts (implements WasteClassifier): deterministic-but-varied result from buffer length hash; confidences ~sum 1.0; simulate 200-500ms; is_mock:true; model_version 'mock-1.0.0'; cycles plastic_pet, paper_cardboard, metal_can, glass, electronics, textile; top_k length 3; log [MOCK_CLASSIFIER].
2. model-classifier.ts (implements WasteClassifier): load ONNX from AI_MODEL_PATH; if missing -> ready=false and classify() throws clear error; if present -> preprocess (resize 224x224, normalize) and run. Install onnxruntime-node + sharp ONLY if used (else document why skipped). model_version from AI_MODEL_VERSION; is_mock:false.
3. Provide a Nest provider 'WASTE_CLASSIFIER' (factory): if AI_USE_MOCK_CLASSIFIER==='true' -> MockClassifier else ModelClassifier (singleton). Log which one is active at startup. Export from AiModule.
4. inference-logger.ts: logInference / logError (structured console for now; DB persistence handled in 4.2).
5. .gitignore: ignore model files (*.onnx, /models). Unit test mock-classifier.spec.ts: valid shape, top_k=3, confidence 0..1, is_mock true.
```

### Allowed Files / Areas
- `src/modules/ai/*`, `package.json`, `.gitignore`, test

### Forbidden Files / Areas
- Modul lain; jangan commit file model.

### Data Model / API Notes
Provider token `WASTE_CLASSIFIER` di-inject service klasifikasi (Blok 4.2).

### Acceptance Criteria
- [ ] Mock selalu jalan tanpa model.
- [ ] Factory pilih via env; model file di-ignore git; test hijau.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- mock-classifier
```

### Semantic Commit Message
`feat(ai): add mock classifier, model loader, and env-based classifier provider`

---

## Block 4.2 — AI Classification Endpoint & Persistence

### Objective
`POST /ai/classify-waste` (rate-limited) yang inferensi, simpan ke `ai_classifications`, kembalikan hasil + kategori ter-resolve. Plus `GET /ai/classifications/:id`.

### Scope
Migration `ai_classifications`, ClassificationService, controller, throttle.

### Why This Block Matters
Endpoint utama fitur AI; hasil tersimpan jadi dasar pembuatan listing.

### Cursor Prompt
```
Create AI classification endpoint + persistence.

1. db/migrations/004_ai_classifications.sql: ai_classifications(id PK, user_id UUID NOT NULL REFERENCES user_profiles(id), image_path TEXT NOT NULL, top_class TEXT NOT NULL, confidence DECIMAL(5,4) NOT NULL, top_k_results JSONB NOT NULL, db_category_id UUID REFERENCES waste_categories(id), is_mock BOOLEAN DEFAULT false, model_version TEXT, inference_time_ms INTEGER, is_overridden BOOLEAN DEFAULT false, override_category_id UUID REFERENCES waste_categories(id), override_reason TEXT, overridden_at TIMESTAMPTZ, overridden_by UUID REFERENCES user_profiles(id), created_at TIMESTAMPTZ DEFAULT now()); INDEX user_id, db_category_id, created_at.
2. src/modules/ai/classification.service.ts: classifyWasteImage(userId, imagePath) -> get classifier provider, download image from storage (admin), classify, map to category, insert row, return; getClassification(id,userId) ownership; listUserClassifications(userId, limit).
3. Controller: POST /ai/classify-waste (auth; @nestjs/throttler limit RATE_LIMIT_AI_PER_MINUTE/min/user; body { imagePath }) -> data incl joined category; if below threshold add { lowConfidence:true, suggestion:'Gunakan override manual' }; on model error -> 503 code AI_UNAVAILABLE. GET /ai/classifications/:id (auth, ownership).
4. Add AiClassification type. Document endpoints in docs/API.md.
```

### Allowed Files / Areas
- `db/migrations/004_*.sql`, `src/modules/ai/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Data Model / API Notes
Response memuat `category`, `top_k_results`, `is_mock`, `lowConfidence?`.

### Acceptance Criteria
- [ ] Hasil tersimpan tiap request; low-confidence ditandai.
- [ ] Rate limit aktif; ownership pada GET.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test
```

### Semantic Commit Message
`feat(ai): add classification persistence, classify-waste endpoint, and rate limiting`

---

## Block 4.3 — Manual Override Endpoint & Logging

### Objective
`POST /ai/classifications/:id/override` untuk koreksi manual hasil AI dgn logging lengkap.

### Scope
Method override di service, DTO, endpoint, unit test.

### Why This Block Matters
AI tidak sempurna; override memperbaiki data sebelum listing dan menghasilkan data koreksi berharga.

### Cursor Prompt
```
Add manual override.

1. classification.service.ts: overrideClassification(id, userId, overrideCategoryId, reason?) -> ownership; reject if already overridden; validate category exists; set is_overridden, override_category_id, override_reason, overridden_at, overridden_by; emit traceability 'ai_classification_overridden' (stub now; wired in Block 11).
2. DTO OverrideClassificationDto: { categoryId: UUID, reason?: string (<=500) }.
3. Controller: POST /ai/classifications/:id/override (auth) -> 409 ALREADY_OVERRIDDEN if repeated.
4. Unit test classification.override.spec.ts: success, no double override, no cross-user override.
5. Document endpoint in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/ai/*`, `docs/API.md`, test

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Override tersimpan lengkap; double override 409; ownership ketat.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- classification.override
```

### Semantic Commit Message
`feat(ai): add manual override endpoint for AI classification`

---

## Block 5.0 — Waste Listing Schema & Migration

### Objective
Migration `waste_listings` + `waste_listing_images`, tipe, dan definisi transition state machine.

### Scope
Migration SQL, tipe, `status-transitions.ts` (config terpusat).

### Why This Block Matters
Entitas utama PACUL; banyak tabel lain bergantung padanya.

### Cursor Prompt
```
Create waste listing schema.

1. db/migrations/005_waste_listings.sql:
   waste_listings(id PK, household_id UUID NOT NULL REFERENCES user_profiles(id), category_id UUID NOT NULL REFERENCES waste_categories(id), classification_id UUID REFERENCES ai_classifications(id), title TEXT NOT NULL, description TEXT, estimated_weight_kg DECIMAL NOT NULL CHECK (>0), actual_weight_kg DECIMAL, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','available','claimed','pickup_planned','picked_up','sorting','sorted','converted_to_material','cancelled')), address TEXT NOT NULL, latitude DECIMAL(10,8) NOT NULL, longitude DECIMAL(11,8) NOT NULL, district TEXT, city TEXT, province TEXT, available_from TIMESTAMPTZ, available_until TIMESTAMPTZ, notes TEXT, pickup_fee DECIMAL DEFAULT 0, claimed_by UUID REFERENCES user_profiles(id), claimed_at TIMESTAMPTZ, picked_up_at TIMESTAMPTZ, sorted_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ, cancel_reason TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()); INDEX household_id,status,category_id,(latitude,longitude),claimed_by; trigger update_updated_at.
   waste_listing_images(id PK, listing_id UUID NOT NULL REFERENCES waste_listings(id) ON DELETE CASCADE, image_path TEXT NOT NULL, is_primary BOOLEAN DEFAULT false, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()); INDEX listing_id.
2. src/modules/waste-listings/waste-listings.types.ts: WasteListingStatus union, WasteListing, WasteListingImage, CreateWasteListingDto/UpdateWasteListingDto types, WasteListingWithDetails.
3. src/common/config/status-transitions.ts: WASTE_LISTING_STATUS_TRANSITIONS (draft->available,cancelled; available->claimed,cancelled; claimed->pickup_planned,cancelled; pickup_planned->picked_up,cancelled; picked_up->sorting; sorting->sorted; sorted->converted_to_material; cancelled & converted_to_material terminal) + validateStatusTransition(from,to).
```

### Allowed Files / Areas
- `db/migrations/005_*.sql`, `src/modules/waste-listings/waste-listings.types.ts`, `src/common/config/status-transitions.ts`

### Forbidden Files / Areas
- Modul lain.

### Data Model / API Notes
Status terminal: `cancelled`, `converted_to_material`. `claimed_by` hanya saat claimed.

### Acceptance Criteria
- [ ] Migration valid + CHECK status.
- [ ] `validateStatusTransition` tolak transisi ilegal; tipe lengkap.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(db): add waste listings schema with status transitions and images`

---

## Block 5.1 — Waste Listing CRUD Endpoints

### Objective
Service + endpoint CRUD listing dgn visibilitas berbasis role & attach gambar.

### Scope
ListingService, DTO, controller POST/GET/GET:id/PATCH.

### Why This Block Matters
Fitur utama household; isi marketplace berasal dari sini.

### Cursor Prompt
```
Create waste listing CRUD in src/modules/waste-listings/.

1. listing.service.ts:
   - createListing(householdId, dto): validate category exists; if classification_id -> verify ownership; insert status 'draft'; if imagePaths[] -> create images (first primary); emit traceability 'waste_uploaded' (stub).
   - getListingById(id, requesterId, role): household sees own (or available); collector sees available + own claimed; industry no access.
   - listListings(filters, requesterId, role): household=own all statuses; collector=available filtered by handled categories; paginated.
   - updateListing(id, householdId, dto): only when status='draft'; never change status here.
2. DTOs (class-validator): CreateWasteListingDto, UpdateWasteListingDto, ListingFiltersDto (query).
3. Controller:
   - POST /waste-listings (role household)
   - GET /waste-listings (household|collector) ?status=&category_id=&page=&limit=
   - GET /waste-listings/:id (role-aware)
   - PATCH /waste-listings/:id (household, ownership, draft only)
4. Document with request/response examples in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/waste-listings/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Data Model / API Notes
`POST /waste-listings` body: category_id, classification_id?, title, description?, estimated_weight_kg, address, latitude, longitude, district?, city?, province?, available_from?, available_until?, notes?, imagePaths?[].

### Acceptance Criteria
- [ ] Update hanya saat draft; collector terfilter handled categories; industry ditolak; pagination ada.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add waste listing CRUD with role-aware visibility and category filtering`

---

## Block 5.2 — Waste Listing Status Transition Engine

### Objective
Service transition status listing dgn validasi state machine + izin aktor.

### Scope
StatusTransitionService (atau method di listing service), unit test ≥10.

### Why This Block Matters
Status sembarang merusak integritas & riwayat bisnis.

### Cursor Prompt
```
Create status transition engine for waste listings.

1. src/modules/waste-listings/status-transition.service.ts: transitionListingStatus(listingId, toStatus, actorId, actorRole, metadata?):
   - fetch current; validate actor permission (household: draft->available, ->cancelled when draft/available; collector: available->claimed, claimed->pickup_planned, pickup_planned->picked_up, picked_up->sorting, sorting->sorted, sorted->converted_to_material; system any valid);
   - validateStatusTransition(current,to) else throw INVALID_TRANSITION;
   - update status + timestamps (claimed_at, picked_up_at, sorted_at, cancelled_at); set claimed_by on 'claimed';
   - emit audit log + traceability (stub).
2. Unit test status-transition.spec.ts (>=10): valid (draft->available, available->claimed, sorted->converted_to_material), invalid (draft->picked_up, cancelled->available), actor perms (household !-> picked_up, collector !-> draft->available).
```

### Allowed Files / Areas
- `src/modules/waste-listings/status-transition.service.ts`, test

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Transisi ilegal ditolak; izin aktor divalidasi; timestamp diperbarui; ≥10 test hijau.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- status-transition
```

### Semantic Commit Message
`feat(api): add waste listing status transition engine with actor permissions`

---

## Block 5.3 — Waste Listing Publish & Cancel

### Objective
Endpoint publish (draft→available) & cancel, memakai transition engine + validasi kesiapan.

### Scope
Endpoint publish/cancel, `validatePublishReadiness`, test.

### Cursor Prompt
```
Add publish & cancel endpoints.

1. POST /waste-listings/:id/publish (role household, ownership): require >=1 image, estimated_weight_kg>0, lat/lng set; call transitionListingStatus(id,'available',userId,'household'); 409 if already published.
2. POST /waste-listings/:id/cancel (household|collector): household cancel if draft|available; collector cancel if claimed|pickup_planned; body { reason? }; set cancel_reason; transition to 'cancelled'.
3. listing.service.ts: add validatePublishReadiness(listing): string[].
4. Tests listing-publish.spec.ts: no image -> fail; no coords -> fail; valid publish; household cancel draft; household cannot cancel claimed.
5. Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/waste-listings/*`, `docs/API.md`, test

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Publish gagal tanpa gambar/koordinat; cancel collector hanya status diizinkan; ≥4 test hijau.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- listing-publish
```

### Semantic Commit Message
`feat(api): add waste listing publish and cancel endpoints with readiness validation`

---

## Block 6.0 — Collector Marketplace — Available Waste Filter

### Objective
Endpoint marketplace collector: listing `available` terfilter otomatis oleh handled categories + filter lokasi.

### Scope
Method service + endpoint `GET /collector/available-waste`.

### Why This Block Matters
Halaman utama collector; filter handled-category adalah pembeda PACUL.

### Cursor Prompt
```
Add collector marketplace.

1. listing.service.ts: getAvailableWasteForCollector(collectorId, filters):
   - load collector handled category ids; query waste_listings WHERE status='available' AND category_id IN (handled); apply city/categoryId filters; if lat/lng/radiusKm -> haversine filter (fetch up to 200, filter in-memory, comment "TODO: PostGIS ST_DWithin for scale"); join category + household display_name only (no private data); include distance from collector base if set; order created_at DESC or distance ASC; paginate (limit default 20, max 50).
2. CollectorListingFilters type: { city?, categoryId?, latitude?, longitude?, radiusKm?, page?, limit? }.
3. GET /collector/available-waste (role collector) query city,category_id,lat,lng,radius_km,page,limit; exclude private household info.
4. Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/waste-listings/*` atau `src/modules/collector/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain; jangan bocorkan data privat household.

### Acceptance Criteria
- [ ] Hanya kategori yang ditangani; filter jarak jalan; data privat aman; pagination ada.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add collector marketplace with handled-category filter and distance`

---

## Block 6.1 — Pickup Claim — Claim & Status Management

### Objective
Tabel `pickup_claims` + endpoint klaim listing & update status klaim.

### Scope
Migration, PickupClaimService, endpoint POST/GET/PATCH status.

### Cursor Prompt
```
Create pickup claims in src/modules/pickup/.

1. db/migrations/006_pickup_claims.sql: pickup_claims(id PK, listing_id UUID NOT NULL REFERENCES waste_listings(id), collector_id UUID NOT NULL REFERENCES user_profiles(id), status TEXT NOT NULL DEFAULT 'claimed' CHECK (IN ('claimed','pickup_planned','picked_up','cancelled')), claimed_at TIMESTAMPTZ DEFAULT now(), pickup_scheduled_at TIMESTAMPTZ, pickup_completed_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ, cancel_reason TEXT, route_id UUID, notes TEXT, created_at, updated_at, UNIQUE(listing_id)); INDEX collector_id,status,listing_id.
2. pickup-claim.service.ts: claimListing(collectorId,listingId) (verify listing 'available'; category in handled; no active claim; insert; transitionListingStatus->'claimed'); updateClaimStatus(claimId,collectorId,newStatus,data?); getCollectorClaims(collectorId,status?); getClaimByListing(listingId).
3. Endpoints (role collector): POST /collector/pickup-claims { listingId }; GET /collector/pickup-claims ?status=; PATCH /collector/pickup-claims/:id/status { status, pickup_scheduled_at?, notes? }.
4. Document in docs/API.md.
```

### Allowed Files / Areas
- `db/migrations/006_*.sql`, `src/modules/pickup/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] UNIQUE(listing_id) cegah klaim ganda; kategori dicek; klaim memicu transition; migration valid.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add pickup claim system with category validation and status sync`

---

## Block 7.0 — Haversine Distance Utility

### Objective
Util haversine akurat + tertest untuk route, filter jarak, dan cost.

### Scope
`haversine.ts`, unit test ≥8.

### Cursor Prompt
```
Create src/common/utils/haversine.ts:
- interface Coordinates { latitude:number; longitude:number }
- haversineDistance(from,to): km (R=6371).
- toRadians(deg).
- calculateTotalDistance(stops: Coordinates[]).
- findNearestPoint(from, candidates: (Coordinates & {id})[]): { id, distance } (O(n)).
Unit test haversine.spec.ts (>=8): Surabaya->Malang ~90km (±5), same point 0, symmetric A-B=B-A, calculateTotalDistance 3 pts, findNearestPoint correct, toRadians(180)=π.
```

### Allowed Files / Areas
- `src/common/utils/haversine.ts`, test

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Akurat (±1%); 8 test hijau; findNearestPoint O(n).

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- haversine
```

### Semantic Commit Message
`feat(route): add haversine distance utility with unit tests`

---

## Block 7.1 — Nearest-Neighbor Route Algorithm

### Objective
Algoritma nearest-neighbor untuk urutan pickup optimal.

### Scope
`route-optimizer.ts`, unit test ≥6.

### Cursor Prompt
```
Create src/common/utils/route-optimizer.ts:
- interface RouteStop { id; latitude; longitude; estimated_weight_kg; address }
- interface OptimizedRoute { orderedStops; distances:number[]; totalDistanceKm; estimatedDurationMinutes }
- optimizeRoute(collectorBase, stops): nearest-neighbor from base; distances base->s1->s2...; total=sum; duration=round(total*3 + stops.length*10).
- calculateRouteDistance(collectorBase, orderedStops): { distances, totalDistanceKm } (no reorder).
Unit test route-optimizer.spec.ts (>=6): empty->empty, single, nearest-first deterministic, distances length = stops length, total=sum, duration positive int.
```

### Allowed Files / Areas
- `src/common/utils/route-optimizer.ts`, test

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Nearest-neighbor lebih pendek dari random (terbukti test); 6 test hijau; panjang distances konsisten.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- route-optimizer
```

### Semantic Commit Message
`feat(route): add nearest-neighbor route optimization with unit tests`

---

## Block 7.2 — Pickup Cost Estimation Service

### Objective
Service biaya pickup dari jarak/berat/base fee, konfigurasi via env.

### Scope
`cost-estimation.service.ts`, unit test ≥6.

### Cursor Prompt
```
Create src/modules/routes/cost-estimation.service.ts:
- CostEstimationInput { totalDistanceKm; totalWeightKg; stopCount }
- CostEstimationResult { baseFee; distanceCost; handlingCost; totalCost; breakdown {baseFee,distanceFee,handlingFee}; configUsed {baseFee,costPerKm,handlingCostPerKg} }
- estimatePickupCost(input): read ROUTE_BASE_FEE(5000)/ROUTE_COST_PER_KM(2000)/ROUTE_HANDLING_COST_PER_KG(300) via ConfigService; IDR integers; round totalCost up to nearest 100.
Unit test cost-estimation.spec.ts (>=6): 0/0=base, 10km, 5kg, combined, total>=base, breakdown sums to total.
```

### Allowed Files / Areas
- `src/modules/routes/cost-estimation.service.ts`, test

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Formula benar; config dari env; 6 test hijau; `configUsed` disertakan.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- cost-estimation
```

### Semantic Commit Message
`feat(route): add pickup cost estimation service with env-configurable formula`

---

## Block 7.3 — Route Preview Endpoint

### Objective
`POST /routes/preview` menghitung rute + biaya tanpa simpan DB.

### Scope
RouteService.previewRoute, endpoint preview.

### Cursor Prompt
```
Create src/modules/routes/route.service.ts previewRoute(collectorId, listingIds):
- max 20 stops; fetch collector base coords; fetch listings -> verify status='claimed' AND claimed_by=collectorId; map to RouteStop[]; optimizeRoute; estimatePickupCost({totalDistanceKm, totalWeightKg sum, stopCount}); return RoutePreviewResult { collectorBase, orderedStops(+listingId,sequenceNumber,distanceFromPreviousKm), totalDistanceKm, estimatedDurationMinutes, totalWeightKg, costEstimation, isPreview:true }.
Endpoint POST /routes/preview (role collector) body { listingIds } (1-20 UUIDs); no DB writes; 400 with details if a listing not found/not owned.
Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/routes/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Tidak menulis DB; max 20 divalidasi; hanya listing milik collector; cost breakdown lengkap.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(route): add route preview endpoint with optimization and cost estimation`

---

## Block 7.4 — Route Commit — Persist Route & Route Stops

### Objective
Migration `pickup_routes` + `pickup_route_stops` + endpoint commit rute.

### Scope
Migration, RouteService.commitRoute, endpoint POST /routes, GET /routes/:id, tipe.

### Cursor Prompt
```
Create route persistence.

1. db/migrations/007_pickup_routes.sql:
   pickup_routes(id PK, collector_id UUID NOT NULL REFERENCES user_profiles(id), status TEXT NOT NULL DEFAULT 'planned' CHECK (IN ('planned','ongoing','completed','cancelled')), total_distance_km DECIMAL NOT NULL, estimated_duration_minutes INTEGER, total_weight_kg DECIMAL, estimated_cost INTEGER, actual_cost INTEGER, started_at, completed_at, cancelled_at, cancel_reason TEXT, notes TEXT, created_at, updated_at); INDEX collector_id,status.
   pickup_route_stops(id PK, route_id UUID NOT NULL REFERENCES pickup_routes(id) ON DELETE CASCADE, listing_id UUID NOT NULL REFERENCES waste_listings(id), sequence_number INTEGER NOT NULL, distance_from_previous_km DECIMAL, estimated_arrival_minutes INTEGER, status TEXT DEFAULT 'pending' CHECK (IN ('pending','arrived','completed','skipped')), arrived_at, completed_at, notes TEXT); INDEX route_id,listing_id,sequence_number.
   (Note: monetary columns are INTEGER IDR, not a custom type.)
2. route.service.ts commitRoute(collectorId, listingIds, notes?): reuse preview logic; insert route + stops in sequence; transition each listing claimed->pickup_planned; set pickup_claims.route_id; return route with stops.
3. Endpoints: POST /routes (role collector) { listingIds, notes? }; GET /routes/:id (collector ownership OR household whose listing is in route).
4. src/modules/routes/routes.types.ts: PickupRoute, PickupRouteStop. Document in docs/API.md.
```

### Allowed Files / Areas
- `db/migrations/007_*.sql`, `src/modules/routes/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Migration valid; commit ubah listing -> pickup_planned; `pickup_claims.route_id` terisi; tipe ada.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(route): add route and route stops persistence with listing status sync`

---

## Block 7.5 — Route Status Management & Recalculate

### Objective
Endpoint ubah status rute (start/complete/cancel), status stop, dan recalculate.

### Scope
RouteService methods + 3 endpoint.

### Cursor Prompt
```
Add route status management.

1. route.service.ts:
   - updateRouteStatus(routeId, collectorId, newStatus): planned->ongoing (started_at, first stop active), ongoing->completed (completed_at; pending/arrived listings -> picked_up), planned|ongoing->cancelled (cancelled_at; pickup_planned listings -> back to claimed).
   - updateStopStatus(stopId, collectorId, status): arrived(arrived_at); completed(completed_at; listing->picked_up; next stop active); skipped(no listing change).
   - recalculateRoute(routeId, collectorId): only planned|ongoing; re-optimize remaining non-skipped/non-completed stops; update sequence/distances; recompute totals + cost.
2. Endpoints: PATCH /routes/:id/status { status }; PATCH /routes/:id/stops/:stopId/status { status, notes? }; POST /routes/:id/recalculate. All role collector + ownership.
3. Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/routes/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Cancel tak ubah klaim; complete -> listing picked_up; recalc hanya rute belum selesai; stop completed -> listing update.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(route): add route status management and recalculation endpoints`

---

## Block 8.0 — Sorting & Material Batch Schema

### Objective
Migration `material_batches` + `material_batch_sources` + transition + tipe.

### Scope
Migration, status transitions, tipe.

### Why This Block Matters
Entitas pivot yang menghubungkan sampah → bahan baku → marketplace industri (inti circular economy & traceability).

### Cursor Prompt
```
Create material batch schema.

1. db/migrations/008_material_batches.sql:
   material_batches(id PK, collector_id UUID NOT NULL REFERENCES user_profiles(id), category_id UUID NOT NULL REFERENCES waste_categories(id), name TEXT NOT NULL, description TEXT, total_weight_kg DECIMAL NOT NULL CHECK (>0), price_per_kg DECIMAL NOT NULL, min_order_kg DECIMAL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft' CHECK (IN ('draft','available','ordered','negotiating','sold','unavailable')), location_address TEXT, latitude DECIMAL(10,8), longitude DECIMAL(11,8), city TEXT, province TEXT, available_from, available_until, notes TEXT, published_at, sold_at, created_at, updated_at); INDEX collector_id,status,category_id.
   material_batch_sources(id PK, batch_id UUID NOT NULL REFERENCES material_batches(id) ON DELETE CASCADE, listing_id UUID NOT NULL REFERENCES waste_listings(id), actual_weight_kg DECIMAL NOT NULL, notes TEXT, created_at, UNIQUE(batch_id,listing_id)); INDEX batch_id,listing_id.
2. status-transitions.ts: MATERIAL_BATCH_STATUS_TRANSITIONS (draft->available,unavailable; available->ordered,negotiating,unavailable; ordered->negotiating,sold,available; negotiating->sold,available; sold terminal; unavailable->available).
3. src/modules/materials/materials.types.ts: MaterialBatchStatus, MaterialBatch, MaterialBatchSource, MaterialBatchWithDetails, CreateMaterialBatchDto type.
```

### Allowed Files / Areas
- `db/migrations/008_*.sql`, `src/common/config/status-transitions.ts`, `src/modules/materials/materials.types.ts`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Migration valid + CHECK; UNIQUE(batch_id,listing_id); transitions ada; tipe lengkap.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(db): add material batch and batch sources schema for waste sorting`

---

## Block 8.1 — Material Batch CRUD & Pemilahan Logic

### Objective
Service pemilahan: dari listing picked_up → material batch, dgn validasi sumber.

### Scope
MaterialBatchService, DTO, endpoint CRUD + sources + sorting-complete.

### Cursor Prompt
```
Create material batch CRUD in src/modules/materials/.

1. material-batch.service.ts:
   - createBatch(collectorId, dto): validate category; insert 'draft'; if sourceListingIds -> addSourceListings.
   - addSourceListings(batchId, collectorId, sources[{listingId,weightKg}]): ownership; per listing verify status IN ('picked_up','sorting','sorted') AND claimed_by=collectorId AND category_id=batch.category_id; insert source; transition listing->'sorting'; recompute batch total_weight_kg.
   - getBatch(id, collectorId) with sources+listing details; listCollectorBatches(collectorId, status?); updateBatch(id,collectorId,dto) draft only; markSortingComplete(batchId,collectorId): transition 'sorting' sources -> 'sorted' (batch status unchanged).
2. DTOs: CreateMaterialBatchDto, AddSourceListingsDto.
3. Endpoints (role collector, ownership): POST /collector/material-batches; GET /collector/material-batches ?status=; GET /collector/material-batches/:id; PATCH /collector/material-batches/:id (draft); POST /collector/material-batches/:id/sources; POST /collector/material-batches/:id/sorting-complete.
4. Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/materials/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Sumber harus kategori sama & milik collector; sorting-complete -> sorted; berat batch auto-update.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add material batch CRUD and waste sorting logic`

---

## Block 8.2 — Material Batch Status Transition

### Objective
Transition status batch + endpoint publish/unavailable.

### Scope
Method transition + 2 endpoint + unit test.

### Cursor Prompt
```
Add material batch transitions.

1. material-batch.service.ts transitionBatchStatus(batchId, collectorId, toStatus): ownership; validate via MATERIAL_BATCH_STATUS_TRANSITIONS; ->available requires all sources 'sorted'/'converted_to_material' and sets published_at; ->sold sets sold_at and transitions sources -> 'converted_to_material'.
2. Endpoints (role collector, ownership): POST /collector/material-batches/:id/publish (require >=1 source, total_weight_kg>0, price_per_kg>0); POST /collector/material-batches/:id/unavailable (draft|available only).
3. Unit test material-batch-transition.spec.ts: cannot publish empty; publish->available; sold->sources converted.
```

### Allowed Files / Areas
- `src/modules/materials/*`, test

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Publish validasi sources sorted; sold ubah sources; ≥3 test hijau.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- material-batch-transition
```

### Semantic Commit Message
`feat(api): add material batch status transitions with source sync`

---

## Block 8.3 — Material Marketplace — Listing untuk Industri

### Objective
Endpoint marketplace material untuk industri (privacy-safe).

### Scope
Method getAvailableMaterials + endpoint GET /materials, GET /materials/:id.

### Cursor Prompt
```
Add material marketplace.

1. material-batch.service.ts getAvailableMaterials(filters): status='available'; filters category_id?, city?, min_weight_kg?, max_price_per_kg?, province?; join category + collector display_name + collector rating_average (no private collector data); order published_at DESC or price_per_kg; paginate (20, max 50).
2. Endpoints: GET /materials (role industry|collector) query category_id,city,min_weight_kg,max_price_per_kg,province,sort,page,limit; GET /materials/:id with source_summary { source_count, cities[] } only (no individual household info).
3. Extend MaterialBatchWithDetails (collector display_name+rating, category, source_summary). Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/materials/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain; jangan expose data household individual.

### Acceptance Criteria
- [ ] Industri lihat material available; data household tak bocor; filter & pagination jalan.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add material marketplace for industry with privacy-safe responses`

---

## Block 9.0 — Order Schema & Migration

### Objective
Migration `orders` + transitions + tipe.

### Cursor Prompt
```
Create orders schema.

1. db/migrations/009_orders.sql: orders(id PK, industry_id UUID NOT NULL REFERENCES user_profiles(id), collector_id UUID NOT NULL REFERENCES user_profiles(id), batch_id UUID NOT NULL REFERENCES material_batches(id), requested_weight_kg DECIMAL NOT NULL CHECK (>0), final_weight_kg DECIMAL, offered_price_per_kg DECIMAL NOT NULL, final_price_per_kg DECIMAL, total_amount DECIMAL, status TEXT NOT NULL DEFAULT 'created' CHECK (IN ('created','negotiating','accepted','rejected','cancelled','completed')), notes TEXT, created_at, updated_at, accepted_at, rejected_at, cancelled_at, completed_at, cancel_reason TEXT); INDEX industry_id,collector_id,batch_id,status.
2. status-transitions.ts: ORDER_STATUS_TRANSITIONS (created->negotiating,accepted,rejected,cancelled; negotiating->accepted,rejected,cancelled; accepted->completed,cancelled; rejected/cancelled/completed terminal).
3. src/modules/orders/orders.types.ts: OrderStatus, Order, OrderWithDetails, CreateOrderDto type.
```

### Allowed Files / Areas
- `db/migrations/009_*.sql`, `src/common/config/status-transitions.ts`, `src/modules/orders/orders.types.ts`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Migration valid + CHECK; transitions lengkap; tipe ada.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(db): add orders schema with complete status transitions`

---

## Block 9.1 — Order Create & Status Engine

### Objective
OrderService + endpoint buat order & ubah status (izin per role).

### Cursor Prompt
```
Create orders module.

1. order.service.ts:
   - createOrder(industryId, dto): batch must be 'available'; requested_weight_kg <= total & >= min_order_kg; collector_id from batch; insert 'created'; batch -> 'ordered'; emit traceability 'order_created'.
   - getOrder(id, requesterId, role): industry own; collector own batches.
   - listOrders(requesterId, role, status?).
   - transitionOrderStatus(orderId, actorId, role, toStatus, data?): industry (created->negotiating|cancelled, accepted->cancelled); collector (created->accepted|rejected, negotiating->accepted|rejected); system (accepted->completed); validate via ORDER_STATUS_TRANSITIONS; rejected requires reason; accepted requires final_price/final_weight (from negotiation); completed sets batch 'sold'.
2. DTO CreateOrderDto: { batchId, requested_weight_kg, offered_price_per_kg, notes? }.
3. Endpoints: POST /orders (industry); GET /orders (industry|collector) ?status=; GET /orders/:id (visibility); PATCH /orders/:id/status { status, cancel_reason? }.
4. Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/orders/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Order tak melebihi total batch; batch -> ordered; izin per role; rejected wajib alasan.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add order creation and status management`

---

## Block 9.2 — Negotiation Thread & Message Schema

### Objective
Migration `negotiation_threads`, `negotiation_messages`, `negotiation_offers` + tipe.

### Cursor Prompt
```
Create negotiation schema.

1. db/migrations/010_negotiation.sql:
   negotiation_threads(id PK, order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE, industry_id UUID NOT NULL REFERENCES user_profiles(id), collector_id UUID NOT NULL REFERENCES user_profiles(id), status TEXT NOT NULL DEFAULT 'open' CHECK (IN ('open','countered','accepted','cancelled','expired')), last_offer_by UUID REFERENCES user_profiles(id), last_offer_price_per_kg DECIMAL, last_offer_weight_kg DECIMAL, agreed_price_per_kg DECIMAL, agreed_weight_kg DECIMAL, expires_at TIMESTAMPTZ, created_at, updated_at); INDEX order_id,industry_id,collector_id,status.
   negotiation_messages(id PK, thread_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE, sender_id UUID NOT NULL REFERENCES user_profiles(id), message_type TEXT NOT NULL CHECK (IN ('text','offer','counter_offer','system','accepted','cancelled')), content TEXT, offer_price_per_kg DECIMAL, offer_weight_kg DECIMAL, metadata JSONB DEFAULT '{}', created_at); INDEX thread_id,sender_id,created_at.
   negotiation_offers(id PK, thread_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE, message_id UUID REFERENCES negotiation_messages(id), offered_by UUID NOT NULL REFERENCES user_profiles(id), price_per_kg DECIMAL NOT NULL, weight_kg DECIMAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (IN ('pending','accepted','countered','cancelled')), created_at); INDEX thread_id,offered_by,status.
2. src/modules/negotiation/negotiation.types.ts: thread/message/offer interfaces + status types + NegotiationThreadWithDetails.
```

### Allowed Files / Areas
- `db/migrations/010_*.sql`, `src/modules/negotiation/negotiation.types.ts`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Migration valid; `expires_at` ada; message types lengkap; tipe lengkap.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(db): add negotiation schema (threads, messages, offers)`

---

## Block 9.3 — Negotiation Offer / Counter-offer Service

### Objective
Service negosiasi: start, offer, counter, accept, cancel, getThread, messages.

### Cursor Prompt
```
Create src/modules/negotiation/negotiation.service.ts:
- startNegotiation(orderId, industryId): order 'created'|'negotiating' & industry matches; upsert thread; system message "Negosiasi dimulai"; order->'negotiating'; expires_at = now()+24h.
- sendOffer(threadId, senderId, role, dto): thread 'open'|'countered' & not expired & sender is party; type 'offer'(industry)/'counter_offer'(collector); insert message + offer; mark previous pending offer 'countered'; update thread last_offer_*; status 'countered'; emit traceability.
- acceptOffer(threadId, acceptorId): acceptor != last_offer_by; latest pending offer -> 'accepted'; thread agreed_* + 'accepted'; system message "Penawaran diterima"; order final_* + 'accepted'; emit 'deal_accepted'.
- cancelNegotiation(threadId, actorId, reason?): actor in thread; thread 'cancelled'; pending offers 'cancelled'; system message; order 'cancelled'; batch back to 'available'.
- getThread(threadId, requesterId) (party only); getThreadMessages(threadId, requesterId, limit, before?).
All multi-write operations must be atomic-ish (sequential with rollback/compensation on failure; document the approach).
DTOs: SendOfferDto { price_per_kg>0, weight_kg>0 }, CancelNegotiationDto { reason? }.
```

### Allowed Files / Areas
- `src/modules/negotiation/*`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Tak bisa accept offer sendiri; thread expired tolak offer; cancel kembalikan batch 'available'; perubahan konsisten.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add negotiation service with offer, counter, accept, cancel`

---

## Block 9.4 — Realtime Chat — Supabase Realtime Channel

### Objective
Endpoint chat negosiasi + setup channel Supabase Realtime + authorization.

### Scope
7 endpoint negosiasi, channel helper, README realtime.

### Why This Block Matters
Chat realtime adalah fitur pembeda; tanpa realtime UX & demo lemah.

### Cursor Prompt
```
Create negotiation chat endpoints + realtime setup.

1. Endpoints:
   POST /orders/:orderId/negotiation (role industry) -> startNegotiation.
   GET /negotiations/:id (party) -> thread with details.
   GET /negotiations/:id/messages (party) ?limit=50&before= -> paginated.
   POST /negotiations/:id/messages (party) { content } -> insert text message (INSERT triggers Supabase Realtime).
   POST /negotiations/:id/offers (party) SendOfferDto -> sendOffer.
   POST /negotiations/:id/accept (party, not last offerer) -> acceptOffer.
   POST /negotiations/:id/cancel (party) CancelNegotiationDto -> cancel.
2. src/modules/realtime/negotiation-channel.ts: getChannelName(threadId)=`negotiation:${threadId}`; verifyChannelAccess(threadId,userId): party check.
3. docs/realtime.md: channel pattern, listen INSERT on negotiation_messages, subscribe example, authorization requirement (must be party).
4. Document endpoints in docs/API.md. Do NOT implement client-side subscription.
```

### Allowed Files / Areas
- `src/modules/negotiation/*` (controller), `src/modules/realtime/*`, `docs/realtime.md`, `docs/API.md`

### Forbidden Files / Areas
- Implementasi client-side subscribe.

### Acceptance Criteria
- [ ] 7 endpoint ada + terdokumentasi; authorization party-only; channel helper + README realtime ada.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(realtime): add negotiation chat endpoints and Supabase Realtime docs`

---

## Block 9.5 — Negotiation Accept, Cancel & History

### Objective
History lengkap + e2e/integration test full flow negosiasi.

### Cursor Prompt
```
Finalize negotiation history + tests.

1. negotiation.service.ts getNegotiationHistory(orderId, requesterId): full thread + messages + offers chronological; access check.
2. GET /orders/:orderId/negotiation/history (party).
3. Integration/e2e test negotiation flow (>=7): start creates thread+system message; industry offer appears; collector counter marks previous 'countered'; cannot accept own offer; accept -> thread+order 'accepted'; cancel -> batch 'available'; expired thread rejects new offers.
4. Ensure all negotiation actions emit audit log entries. Document history endpoint in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/negotiation/*`, `test/` atau `*.spec.ts`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] History urut lengkap; ≥7 test hijau; audit entries ada.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- negotiation
```

### Semantic Commit Message
`feat(api): add negotiation history endpoint and integration tests`

---

## Block 10.0 — Transaction Simulation & Completion

### Objective
Simulasi transaksi (bukan payment nyata): record, complete, list.

### Cursor Prompt
```
Create transaction simulation (no real gateway).

1. db/migrations/011_transactions.sql: transactions(id PK, order_id UUID NOT NULL UNIQUE REFERENCES orders(id), industry_id UUID NOT NULL REFERENCES user_profiles(id), collector_id UUID NOT NULL REFERENCES user_profiles(id), batch_id UUID NOT NULL REFERENCES material_batches(id), amount DECIMAL NOT NULL, status TEXT NOT NULL DEFAULT 'simulated_pending' CHECK (IN ('simulated_pending','simulated_paid','completed','cancelled')), payment_method TEXT DEFAULT 'simulation', payment_reference TEXT, notes TEXT, simulated_at, completed_at, cancelled_at, created_at); INDEX order_id,industry_id,collector_id,status.
2. src/modules/transactions/transaction.service.ts: simulateTransaction(orderId, industryId) (order 'accepted'; industry matches; no existing; amount=final_weight*final_price; payment_reference=`SIM-${Date.now()}-${orderId.slice(0,8).toUpperCase()}`; status 'simulated_pending'); completeTransaction(transactionId, actorId) (party; status -> completed; order -> completed; batch -> sold; emit 'transaction_completed'); listTransactions(userId, role).
3. Endpoints: POST /orders/:id/transactions/simulate (industry); POST /transactions/:id/complete (party); GET /transactions (party).
4. docs/API.md: WARNING "Simulation only. No real money is processed."
```

### Allowed Files / Areas
- `db/migrations/011_*.sql`, `src/modules/transactions/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain; jangan integrasi payment gateway nyata.

### Acceptance Criteria
- [ ] 1 transaksi/order (UNIQUE); label simulasi jelas; complete selesaikan order+batch; tanpa gateway nyata.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add transaction simulation with clear demo labeling`

---

## Block 11.0 — Traceability Event System — Schema & Emitter

### Objective
Tabel `traceability_events` + emitter fire-and-forget, lalu sambungkan ke semua service.

### Scope
Migration, TraceabilityService, integrasi emitEvent ke service yang sudah ada.

### Why This Block Matters
Traceability adalah proposisi nilai utama PACUL ("botol ini dari rumah tangga mana, lewat proses apa").

### Cursor Prompt
```
Create PACUL Track traceability.

1. db/migrations/012_traceability_events.sql: traceability_events(id PK, event_type TEXT NOT NULL CHECK (IN (... all event types from spec incl waste_uploaded, ai_classified, listing_published, pickup_claimed, route_created, picked_up, sorted_by_collector, material_batch_created, material_listed, order_created, negotiation_started, offer_sent, counter_offer_sent, deal_accepted, transaction_completed, rating_submitted, report_exported, ai_classification_overridden, listing_cancelled, order_cancelled)), entity_type TEXT NOT NULL, entity_id UUID NOT NULL, actor_id UUID REFERENCES user_profiles(id), actor_role TEXT, previous_status TEXT, new_status TEXT, metadata JSONB DEFAULT '{}', linked_entity_type TEXT, linked_entity_id UUID, created_at TIMESTAMPTZ DEFAULT now()); INDEX entity_id,entity_type,event_type,actor_id,created_at.
2. src/modules/traceability/traceability.service.ts: emitEvent(dto) (try/catch, never throws/blocks), getEntityTimeline(type,id), getMaterialTimeline(batchId) { batch, batchEvents, sources:[{listing,listingEvents}], orders:[{order,orderEvents}] }, getWasteListingJourney(listingId). EmitEventDto interface.
3. Replace stub calls: wire emitEvent in listing(create->waste_uploaded, publish->listing_published, cancel->listing_cancelled), pickup(claim->pickup_claimed), routes(commit->route_created, stop complete->picked_up), materials(create->material_batch_created, publish->material_listed), orders(create->order_created, cancel->order_cancelled), negotiation(start->negotiation_started, offer->offer_sent/counter_offer_sent, accept->deal_accepted), transaction(complete->transaction_completed), classification(classify->ai_classified, override->ai_classification_overridden). All fire-and-forget.
4. traceability.types.ts with all interfaces. Make TraceabilityModule @Global() or import where needed.
```

### Allowed Files / Areas
- `db/migrations/012_*.sql`, `src/modules/traceability/*`, semua service yang sudah ada (untuk emitEvent)

### Forbidden Files / Areas
- Tidak ada (lintas modul diperbolehkan khusus untuk wiring emitEvent).

### Acceptance Criteria
- [ ] Emitter fire-and-forget; semua event_type ada; getMaterialTimeline hubungkan batch↔sources↔orders; semua service relevan memanggil emitEvent.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(traceability): add PACUL Track event system and wire into all services`

---

## Block 11.1 — PACUL Track API — Timeline Endpoints

### Objective
Endpoint timeline material/waste/order dgn `chain_summary` & privacy.

### Cursor Prompt
```
Create PACUL Track endpoints.

1. GET /traceability/material/:batchId (collector owner OR industry who ordered): getMaterialTimeline; include chain_summary { waste_sources:[{listingId,householdCity,weightKg,uploadedAt}], collection:{collectorName,pickedUpAt,routeId}, processing:{sortedAt,batchCreatedAt}, market:{listedAt,orderedAt}, transaction:{agreedPricePerKg,completedAt} } (city not exact address).
2. GET /traceability/waste/:listingId (household own | collector claimed | any if completed): getWasteListingJourney.
3. GET /traceability/order/:orderId (industry own | collector batch): order events + linked batch events.
4. Integration test traceability (>=3): structure correct; source events appear; order events linked.
5. Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/traceability/*`, test, `docs/API.md`

### Forbidden Files / Areas
- Modul lain; jangan expose alamat lengkap household ke industri.

### Acceptance Criteria
- [ ] Timeline hubungkan listing→batch→order satu response; privacy alamat; test hijau.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test -- traceability
```

### Semantic Commit Message
`feat(traceability): add PACUL Track timeline API endpoints`

---

## Block 12.0 — Rating & Review System

### Objective
Rating antar aktor pasca pickup/transaksi + proteksi double rating + agregasi.

### Cursor Prompt
```
Create rating system.

1. db/migrations/013_ratings.sql: ratings_reviews(id PK, rater_id UUID NOT NULL REFERENCES user_profiles(id), ratee_id UUID NOT NULL REFERENCES user_profiles(id), rating INTEGER NOT NULL CHECK (BETWEEN 1 AND 5), review_text TEXT, context_type TEXT NOT NULL CHECK (IN ('pickup','transaction')), context_id UUID NOT NULL, created_at, UNIQUE(rater_id,ratee_id,context_type,context_id)); INDEX ratee_id,rater_id,context_type,context_id.
2. src/modules/ratings/rating.service.ts: submitRating(raterId, raterRole, dto): validate scenarios (household<->collector pickup with pickup_claim.status='picked_up'; collector<->industry transaction with order.status='completed'); enforce no double rating; insert; update ratee rating_average+rating_count; emit 'rating_submitted'. getRatingSummary(actorId): { average, count, distribution{1..5}, recent_reviews }. updateRatingAverage(actorId, role).
3. Endpoints: POST /ratings { rateeId, rating, reviewText?, contextType, contextId }; GET /ratings/summary/:actorId.
4. Document in docs/API.md.
```

### Allowed Files / Areas
- `db/migrations/013_*.sql`, `src/modules/ratings/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] UNIQUE cegah double rating; hanya aktor terlibat boleh; average auto-update.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add rating system with double-rating protection and averages`

---

## Block 13.0 — Dashboard Summary Endpoints

### Objective
Dashboard ringkas per role.

### Cursor Prompt
```
Create dashboard summary.

1. src/modules/dashboard/dashboard.service.ts: getHouseholdSummary, getCollectorSummary, getIndustrySummary (fields exactly as in spec: counts, weights, distances, costs, ratings, recent lists). Use aggregate queries; avoid N+1.
2. GET /dashboard/summary (auth, any role): dispatch by req.user.role; add Cache-Control: max-age=60.
3. src/modules/dashboard/dashboard.types.ts: the three dashboard types. Document endpoint in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/dashboard/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] 3 role beda data relevan; tanpa N+1 tak perlu; tipe lengkap.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add role-aware dashboard summary endpoints`

---

## Block 13.1 — Dashboard Impact & Material Flow Endpoints

### Objective
Dashboard dampak platform + material flow (Sankey) + route stats.

### Cursor Prompt
```
Add platform impact + material flow.

1. dashboard.service.ts:
   - getPlatformImpact(filters {from_date?,to_date?,city?,province?}): total_waste_submitted_kg, total_waste_collected_kg, total_material_produced_kg, total_material_sold_kg, total_transactions, total_transaction_value_idr, total_pickups_completed, total_route_distance_km, total_route_cost_idr, top_categories[{category_name,weight_kg,percentage}], estimated_co2_saved_kg (= total_recycled_kg * 2.5, documented), estimated_economic_value_idr (= total_transaction_value_idr), active_households/collectors/industries.
   - getMaterialFlow(filters): nodes[{id,label,type,value}], edges[{from,to,weight_kg,value_idr}], categories_breakdown[{category_name,weight_kg_in,weight_kg_out}] (aggregate, no PII).
2. Endpoints: GET /dashboard/impact (auth) ?from&to&city&province; GET /dashboard/material-flow (auth); GET /dashboard/routes (collector).
3. Add types. Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/dashboard/*`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] CO2 formula terdokumentasi (bukan random); material flow tanpa PII; filter date jalan.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add platform impact dashboard and material flow endpoints`

---

## Block 14.0 — Export Laporan PDF

### Objective
Export PDF ringkasan dashboard + tabel `report_exports` + endpoint request/status/download.

### Cursor Prompt
```
Create PDF export (pdfkit, NOT puppeteer).

1. npm install pdfkit @types/pdfkit.
2. src/modules/reports/pdf-generator.ts generateImpactReport(userId, role, filters): fetch impact + role summary; produce multi-page PDF (cover, platform impact, role metrics, top categories table, notes); return Buffer.
3. db/migrations/014_report_exports.sql: report_exports(id PK, user_id UUID NOT NULL REFERENCES user_profiles(id), export_type TEXT NOT NULL CHECK (IN ('pdf_impact','excel_transactions','excel_routes','excel_materials')), status TEXT NOT NULL DEFAULT 'pending' CHECK (IN ('pending','completed','failed')), file_path TEXT, file_size_bytes INTEGER, filters JSONB DEFAULT '{}', error_message TEXT, created_at, completed_at, expires_at TIMESTAMPTZ); INDEX user_id,status,created_at.
4. src/modules/reports/report.service.ts: requestPdfExport(userId,role,filters) (insert pending; generate; upload to 'reports'; update completed + expires_at = created_at + REPORT_EXPORT_EXPIRES_HOURS); getExport(id,userId); getDownloadUrl(id,userId) (signed URL); listExports(userId).
5. Endpoints: POST /reports/export/pdf { from_date?, to_date?, city? }; GET /reports/:id; GET /reports/:id/download.
6. Emit 'report_exported'. Document in docs/API.md.
```

### Allowed Files / Areas
- `db/migrations/014_*.sql`, `src/modules/reports/*`, `package.json`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain; jangan pakai puppeteer/chromium.

### Acceptance Criteria
- [ ] PDF terbuka; tersimpan di Storage (bukan FS server); download via signed URL; record tersimpan.

### Validation Commands
```
npm run typecheck
npm run lint
npm run build
```

### Semantic Commit Message
`feat(report): add PDF impact report with Supabase Storage upload`

---

## Block 14.1 — Export Laporan Excel

### Objective
Export Excel transaksi/material/rute (exceljs).

### Cursor Prompt
```
Create Excel exports.

1. npm install exceljs.
2. src/modules/reports/excel-generator.ts: generateTransactionReport (sheet Transaksi), generateMaterialReport (sheets Material Batch + Sumber Material), generateRouteReport (sheets Rute + Stop Detail). Style header rows (bold + fill). Columns as in spec.
3. report.service.ts requestExcelExport(userId, role, exportType, filters): dispatch generator; upload to 'reports'; update report_exports.
4. POST /reports/export/excel { type:'transactions'|'materials'|'routes', from_date?, to_date? }; role collector for routes; own-data only otherwise.
5. Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/reports/*`, `package.json`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] File terbuka di Excel/LibreOffice; header berstyle; tersimpan di Storage; tiap tipe sheet sesuai.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(report): add Excel transaction, material, and route exports`

---

## Block 14.2 — Report Metadata & Download Endpoint

### Objective
Finalisasi endpoint status/download + smoke + handling expiry.

### Cursor Prompt
```
Finalize report download.

1. GET /reports/:id (ownership): { id, export_type, status, created_at, completed_at, expires_at, file_size_bytes }; include downloadUrl (signed, 1h) if completed.
2. GET /reports/:id/download (ownership): if not completed -> 400 EXPORT_NOT_READY; if expires_at<now -> 410 EXPORT_EXPIRED; else return { signedUrl, expiresAt } or 302 redirect.
3. GET /reports (auth): last 20 of user.
4. Smoke: request pdf -> poll status -> download -> verify accessible.
5. docs/README.md note: exports expire after REPORT_EXPORT_EXPIRES_HOURS; suggest cron cleanup. Document all in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/reports/*`, `docs/README.md`, `docs/API.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Expired -> 410; ownership ketat; smoke berhasil end-to-end.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(report): finalize report download endpoints with expiry handling`

---

## Block 15.0 — Notification & Audit Log

### Objective
Audit log + notifikasi in-app + trigger kontekstual.

### Cursor Prompt
```
Create audit + notification.

1. db/migrations/015_audit_notifications.sql:
   audit_logs(id PK, actor_id UUID REFERENCES user_profiles(id), actor_role TEXT, action TEXT NOT NULL, entity_type TEXT, entity_id UUID, ip_address TEXT, user_agent TEXT, metadata JSONB DEFAULT '{}', created_at); INDEX actor_id,action,entity_id,created_at.
   notifications(id PK, user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE, type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, data JSONB DEFAULT '{}', is_read BOOLEAN DEFAULT false, read_at TIMESTAMPTZ, created_at); INDEX user_id,is_read,created_at.
2. src/modules/notifications/audit.service.ts: logAction(...) fire-and-forget, never throws.
3. src/modules/notifications/notification.service.ts: createNotification, markAsRead, markAllAsRead, getUnreadCount. Wire createNotification in: pickup claim -> notify household; negotiation offer -> notify counter-party; accept -> notify both; transaction complete -> notify both.
4. Endpoints: GET /notifications ?is_read=&limit=; PATCH /notifications/:id/read (ownership); PATCH /notifications/read-all; GET /audit-logs (own only).
5. Document in docs/API.md.
```

### Allowed Files / Areas
- `db/migrations/015_*.sql`, `src/modules/notifications/*`, service terkait (untuk trigger), `docs/API.md`

### Forbidden Files / Areas
- Modul lain (selain wiring trigger).

### Acceptance Criteria
- [ ] Audit fire-and-forget; notifikasi tertarget (bukan broadcast); filter is_read; ownership pada read.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(api): add audit log and notification system with contextual triggers`

---

## Block 16.0 — RLS Policies — Supabase Row Level Security

### Objective
Aktifkan RLS + policy semua tabel (untuk akses langsung via anon key).

### Cursor Prompt
```
Create db/migrations/016_rls_policies.sql. ENABLE RLS + policies for every table per spec:
- user_profiles, *_profiles: own row read/update; public display fields for cross-role; insert when id=auth.uid().
- waste_listings: household own; collector available + claimed_by=auth.uid(); insert household; update own draft / claim.
- waste_listing_images: via listing; insert service_role.
- ai_classifications: own; insert authenticated.
- pickup_claims: collector own + household via own listing; insert collector.
- pickup_routes/stops: collector_id=auth.uid().
- material_batches: collector own + available visible; insert/update collector.
- material_batch_sources: via batch owner.
- orders: industry_id or collector_id = auth.uid(); insert industry; update service_role.
- negotiation_*: parties only.
- transactions: parties only (select).
- ratings_reviews: select public; insert rater_id=auth.uid().
- notifications: user_id=auth.uid() (select/update).
- audit_logs: actor_id=auth.uid() (select).
- traceability_events: select own/related; insert service_role.
Note: backend admin client bypasses RLS by design. Document policies in docs/README.md ("Row Level Security").
```

### Allowed Files / Areas
- `db/migrations/016_*.sql`, `docs/README.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Semua tabel ENABLE RLS; household tak bisa SELECT listing household lain; industry tak bisa SELECT order industry lain; pakai auth.uid().

### Validation Commands
```
# supabase db push ; test via anon client (bukan admin): akses data user lain -> kosong, bukan 403
```

### Semantic Commit Message
`feat(security): add Supabase RLS policies for all tables`

---

## Block 16.1 — Realtime Channel Security

### Objective
Authorization channel Supabase Realtime untuk negosiasi.

### Cursor Prompt
```
Secure realtime channels.

1. src/modules/realtime/channel-auth.ts: authorizeChannelAccess(channelName, userId) parse 'negotiation:{threadId}' -> party check; unknown -> false. getChannelJwt(userId, channelName) -> token or null.
2. Document presence payload { userId, role, displayName, online_at } if used.
3. docs/realtime.md: how frontend verifies before subscribe, error handling, naming convention, never subscribe without membership check.
4. Optional endpoint POST /realtime/channel-auth (auth) { channelName } -> { authorized, token? }.
5. Document in docs/API.md.
```

### Allowed Files / Areas
- `src/modules/realtime/*`, `docs/realtime.md`, `docs/API.md`

### Forbidden Files / Areas
- Implementasi client-side subscribe.

### Acceptance Criteria
- [ ] Authorization function ada; unauthorized -> authorized:false; README realtime lengkap.

### Validation Commands
```
npm run typecheck
npm run lint
```

### Semantic Commit Message
`feat(security): add Supabase Realtime channel authorization`

---

## Block 17.0 — Security Hardening & Input Validation

### Objective
Global validation, rate limit, CORS, security headers, audit endpoint compliance.

### Cursor Prompt
```
Harden security.

1. Confirm global ValidationPipe (whitelist, forbidNonWhitelisted, transform) covers ALL DTOs. Audit each controller; add missing DTO validation. Add a sanitize helper (trim, max length, strip HTML) for free-text fields.
2. @nestjs/throttler: global ThrottlerModule; stricter limits on POST /ai/classify-waste (RATE_LIMIT_AI_PER_MINUTE/min), POST /reports/export/pdf & /excel (3/hour). 429 with code RATE_LIMITED.
3. CORS in main.ts from CORS_ALLOWED_ORIGINS; reject unlisted origins.
4. Security headers (helmet or manual): X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin.
5. Verify every endpoint: auth guard (or @Public with comment), role guard where needed, validation, ownership checks. Produce docs/SECURITY_CHECKLIST.md listing endpoints with status per requirement.
6. Upload security: magic-byte verification, filename <=255, reject path traversal.
```

### Allowed Files / Areas
- `src/common/*`, `src/main.ts`, controllers (tambah validasi), `package.json`, `docs/SECURITY_CHECKLIST.md`

### Forbidden Files / Areas
- Modul lain di luar konteks hardening.

### Acceptance Criteria
- [ ] Semua input ber-DTO valid; AI & report rate-limited; CORS dari env; upload aman dari traversal; checklist ada.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test
```

### Semantic Commit Message
`feat(security): add validation coverage, rate limiting, CORS, and security headers`

---

## Block 18.0 — Seed Data Demo Lengkap

### Objective
Seed komprehensif (6 akun demo + data semua fitur), idempotent.

### Cursor Prompt
```
Create demo seeds in db/seeds/ (idempotent; check-before-insert; use Supabase Admin Auth API for users).

010_demo_users.ts: 2 household, 2 collector, 2 industry (emails @pacul-demo.com; passwords from env or constants documented as demo-only; realistic coords around Surabaya/Sidoarjo/Gresik).
011_collector_categories.ts: collector1 -> PLASTIC_PET,PLASTIC_OTHER,METAL_CAN,GLASS (prices); collector2 -> PAPER,TEXTILE.
012_waste_listings.ts: 6 listings across households with mixed statuses (available/claimed/picked_up).
013_ai_classifications.ts: 3 mock records linked to households.
014_pickup_routes.ts: 1 completed route for collector1 (2 stops, realistic distance/cost).
015_material_batches.ts: 2 batches for collector1 (PET available; METAL sold) with sources.
016_orders_negotiation.ts: 1 completed order + negotiation history + transaction; 1 active negotiating order.
017_ratings.ts: household1->collector1 5*, industry1->collector1 4*.
018_traceability.ts: backfill emitEvent for all key states above.
index.ts: run in order, each idempotent.
Update docs/README.md "Demo Accounts" table (role,email,password) with HACKATHON-ONLY warning.
```

### Allowed Files / Areas
- `db/seeds/010..018_*.ts`, `db/seeds/index.ts`, `docs/README.md`

### Forbidden Files / Areas
- Modul lain; jangan hardcode password di kode production (hanya seed/docs demo).

### Acceptance Criteria
- [ ] 6 akun demo bisa login; collector1 punya handled categories; data semua fitur ada; seed idempotent; akun terdokumentasi.

### Validation Commands
```
npx ts-node db/seeds/index.ts
# login tiap akun demo; cek Supabase Studio
```

### Semantic Commit Message
`chore(seed): add comprehensive demo seed data for all roles and features`

---

## Block 19.0 — Unit Testing — AI, Haversine, Route, Cost, Status

### Objective
Konsolidasi & lengkapi unit test inti.

### Cursor Prompt
```
Run npm run test and fix failures. Ensure these specs exist with coverage:
mock-classifier, category-mapper, haversine, route-optimizer, cost-estimation, status-transition (>=10), supabase-auth.guard, roles.guard.
Add "test:cov": "jest --coverage" if absent. Target >=50 total test cases. All green.
```

### Allowed Files / Areas
- `*.spec.ts`, `package.json` (coverage script)

### Forbidden Files / Areas
- Modul lain; jangan ubah logika bisnis hanya demi lolos test.

### Acceptance Criteria
- [ ] Semua spec ada; `npm run test` 0 fail; ≥50 test cases.

### Validation Commands
```
npm run test
npm run test:cov
```

### Semantic Commit Message
`test(api): consolidate and complete unit tests for core services`

---

## Block 19.1 — Integration/E2E Testing — Listing, Pickup, Material, Order

### Objective
E2E test alur bisnis utama (Supertest, test DB atau mock Supabase).

### Cursor Prompt
```
Create e2e tests in test/ (Supertest) or service-level integration tests. Use a test Supabase project or a consistent Supabase mock.
listing flow: create(draft)->upload(mock)->publish->visible to matching collector->NOT visible to non-matching->cancel->not in marketplace.
pickup flow: claim->commit route(pickup_planned)->stop completed(picked_up)->household sees status.
material flow: create batch->add picked_up source(sorting)->sorting-complete(sorted)->publish->visible in industry marketplace.
order flow: create order(batch ordered)->start negotiation->offer->counter->accept->simulate->complete->batch 'sold' & order 'completed'.
Min 5 cases each (20 total). All green.
```

### Allowed Files / Areas
- `test/*.e2e-spec.ts` atau `*.integration.spec.ts`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] 4 file; ≥5 case/file; semua hijau; setup mock/test DB jelas & reusable.

### Validation Commands
```
npm run test:e2e
```

### Semantic Commit Message
`test(api): add integration/e2e tests for listing, pickup, material, order`

---

## Block 19.2 — E2E Testing — Traceability & Export Smoke Test

### Objective
Test timeline traceability + smoke export PDF/Excel.

### Cursor Prompt
```
1. Traceability e2e: after full flow, getMaterialTimeline returns all events chronological; sources linked; chain_summary fields present.
2. reports export-smoke spec: generateImpactReport returns Buffer starting with %PDF and size>1000; generateTransactionReport & generateMaterialReport return Buffers. Mock dashboard data; mock storage upload.
3. Fix failures. Paste final "Test Suites: X passed, X total" into docs/README.md "Testing".
```

### Allowed Files / Areas
- `test/`/`*.spec.ts`, `docs/README.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Traceability test hijau; smoke export (magic bytes) hijau; summary di README.

### Validation Commands
```
npm run test
npm run test:e2e
```

### Semantic Commit Message
`test(api): add traceability integration and export smoke tests`

---

## Block 20.0 — OpenAPI Specification (Swagger)

### Objective
OpenAPI 3.0 lengkap untuk semua endpoint. Manfaatkan `@nestjs/swagger` agar otomatis dari DTO + dekorator.

### Cursor Prompt
```
Generate OpenAPI for all endpoints.

1. In main.ts, set up SwaggerModule (DocumentBuilder: title "PACUL Backend API", version "1.0.0-hackathon", bearerAuth, servers localhost:4000). Serve at /docs and write the spec to docs/openapi.yaml on build (a small script that boots the app and dumps the document).
2. Annotate controllers/DTOs with @ApiTags, @ApiOperation, @ApiResponse, @ApiBearerAuth, @ApiProperty so the generated spec is complete (200/400/401/403/404/422/429/500).
3. Define shared response schemas (ApiSuccess, ApiError, PaginatedResult) via Swagger extra models.
4. Validate the dumped docs/openapi.yaml (npx @apidevtools/swagger-cli validate docs/openapi.yaml).
5. Link the spec in docs/README.md.
```

### Allowed Files / Areas
- `src/main.ts`, controllers/DTO (anotasi swagger), script dump, `docs/openapi.yaml`, `docs/README.md`, `package.json`

### Forbidden Files / Areas
- Modul lain di luar anotasi.

### Acceptance Criteria
- [ ] `swagger-cli validate docs/openapi.yaml` lolos; semua endpoint ada; komponen reusable; error responses terdokumentasi.

### Validation Commands
```
npm run build
npx @apidevtools/swagger-cli validate docs/openapi.yaml
```

### Semantic Commit Message
`docs(readme): add OpenAPI 3.0 spec via @nestjs/swagger for all endpoints`

---

## Block 20.1 — README Backend Lengkap

### Objective
README lengkap untuk onboarding <10 menit.

### Cursor Prompt
```
Finalize docs/README.md with sections: Overview; Tech Stack (NestJS, Supabase, pdfkit, exceljs, class-validator, TS); Getting Started (prereqs, install, env); Database (migrations apply, seeds, RLS summary); API (base URL, auth, link to /docs + openapi.yaml + API.md, status codes); Demo Accounts table (HACKATHON ONLY); AI Model (mock default, how to enable real model, taxonomy 8 classes, threshold); Route Optimization (nearest-neighbor, cost formula, defaults); Payment/Transaction (SIMULATION ONLY); Status Lifecycles (waste_listing, material_batch, order — list form); Testing (commands + last summary); Deployment (env, build, deploy, storage setup); Known Limitations (simulation only, in-memory rate limit, NN not optimal, mock AI default, in-app notifications only).
```

### Allowed Files / Areas
- `docs/README.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Semua section akurat; demo accounts; status lifecycle; limitations jujur; engineer baru setup <10 menit.

### Validation Commands
```
# review manual
```

### Semantic Commit Message
`docs(readme): complete backend README with setup, API, and demo docs`

---

## Block 21.0 — Deployment Config & Public Backend Setup

### Objective
Konfigurasi deploy + script setup + `backend:check`.

### Cursor Prompt
```
Prepare deployment for a standalone NestJS service.

1. Ensure npm run build succeeds; fix type/import errors.
2. docs/DEPLOY.md checklist: env set; Supabase project; migrations applied; buckets created (ts-node db/seeds/000_setup_storage.ts); optional demo seed; AI_USE_MOCK_CLASSIFIER true for demo; CORS origins; rate limits.
3. Add a Dockerfile (node:lts-alpine, build, run dist/main.js, expose PORT) and a .dockerignore. (Nest is a long-running server; do NOT assume serverless.) Optionally document running on Render/Railway/Fly/VM.
4. db/setup.ts master script: initBuckets() + print "setup complete"; safe to re-run.
5. package.json scripts: "db:migrate" (echo apply instructions), "db:seed", "db:setup", "backend:check": "npm run typecheck && npm run lint && npm run test && npm run build".
6. Run backend:check; fix issues.
```

### Allowed Files / Areas
- `docs/DEPLOY.md`, `Dockerfile`, `.dockerignore`, `db/setup.ts`, `package.json` (scripts)

### Forbidden Files / Areas
- Jangan commit secret production.

### Acceptance Criteria
- [ ] `npm run build` & `npm run backend:check` sukses; checklist + Dockerfile ada; setup idempotent.

### Validation Commands
```
npm run typecheck
npm run lint
npm run test
npm run build
```

### Semantic Commit Message
`chore(deploy): add Dockerfile, deploy checklist, setup scripts, and backend:check`

---

## Block 21.1 — Final Smoke Test End-to-End

### Objective
Panduan smoke test E2E manual memakai akun demo.

### Cursor Prompt
```
Create docs/SMOKE_TEST_GUIDE.md with 5 scenarios and check columns (PASS/FAIL):
1) Household: sign-in -> upload -> classify -> create listing -> publish -> verify available.
2) Collector: available-waste -> claim -> route preview -> commit -> status ongoing -> stop completed -> verify picked_up.
3) Collector: create batch -> add sources -> sorting-complete -> publish -> industry sees in /materials.
4) Industry: create order -> start negotiation -> offer -> (collector) counter -> (industry) accept -> simulate -> complete -> traceability/material full timeline.
5) Rating & Reports: household rates collector -> industry exports pdf -> poll -> download verify.
All 5 must PASS before PR.
```

### Allowed Files / Areas
- `docs/SMOKE_TEST_GUIDE.md`

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] 5 skenario detail + kolom status; bisa dijalankan tanpa bertanya.

### Validation Commands
```
# eksekusi manual mengikuti guide; semua PASS
```

### Semantic Commit Message
`chore(repo): add end-to-end smoke test guide`

---

## Block 21.2 — PR Checklist Backend

### Objective
Checklist PR sebagai gate akhir + script `pr:check`.

### Cursor Prompt
```
Create docs/PR_CHECKLIST.md with sections:
Must Pass — Code Quality (typecheck/lint/test/build), Security (guards, roles, validation, no secrets, RLS for new tables), Database (migrations sequential, FK ON DELETE, CHECK on status, indexes), API (documented + openapi updated + standard response shapes), Business Rules (transitions via engine, ownership checks, role data isolation, terminal status protection), Frontend Contract (.env.example updated, shared types updated, breaking changes documented).
Nice to Have — unit/integration tests, no N+1, traceability events, notifications.
Sign-off — self-review, smoke 1-5 PASS, README updated, no stray TODOs.
Add "pr:check": "npm run typecheck && npm run lint && npm run test && npm run build". Run it.
```

### Allowed Files / Areas
- `docs/PR_CHECKLIST.md`, `package.json` (scripts)

### Forbidden Files / Areas
- Modul lain.

### Acceptance Criteria
- [ ] Checklist komprehensif; `pr:check` ada & sukses.

### Validation Commands
```
npm run pr:check
```

### Semantic Commit Message
`chore(repo): add PR checklist and pr:check gate`

---

## Ringkasan Blok

Total **45 blok (0.0 – 21.2)**, diadaptasi untuk **standalone NestJS + Supabase**:

- **Fondasi (0.0–1.4):** keputusan arsitektur, git init + scaffold Nest, env, Supabase module, schema user, auth guard, RBAC, profil.
- **Master Data & Storage (2.0–3.1):** kategori sampah, handled categories, storage, upload.
- **AI (4.0–4.3):** taksonomi+mapping, mock+model classifier, endpoint klasifikasi, override.
- **Waste Listing (5.0–5.3):** schema, CRUD, transition engine, publish/cancel.
- **Collector Marketplace (6.0–6.1):** filter available + pickup claim.
- **Routing (7.0–7.5):** haversine, nearest-neighbor, cost, preview, commit, status/recalculate.
- **Material & Sorting (8.0–8.3):** schema, CRUD/pemilahan, transition, marketplace industri.
- **Order & Negosiasi (9.0–9.5):** schema order, order engine, schema negosiasi, offer service, realtime chat, history+test.
- **Transaksi (10.0):** simulasi.
- **Traceability (11.0–11.1):** event system + PACUL Track API.
- **Rating (12.0).**
- **Dashboard (13.0–13.1):** summary + impact/material-flow.
- **Reports (14.0–14.2):** PDF, Excel, download.
- **Notif & Audit (15.0).**
- **Security (16.0–17.0):** RLS, realtime auth, hardening.
- **Seed (18.0).**
- **Testing (19.0–19.2):** unit, integration/e2e, traceability+export smoke.
- **Docs (20.0–20.1):** OpenAPI (Swagger), README.
- **Deploy & PR (21.0–21.2):** Dockerfile/checklist, smoke E2E, PR gate.

### Perubahan utama vs draft awal (karena repo = standalone NestJS, bukan fullstack Next.js)
- `lib/server/*` + Next API routes → **module Nest** (`src/modules/<feature>` + controller/service/dto, `src/common`).
- "Jangan sentuh frontend" → **disiplin API-contract** (OpenAPI + JSON + shared types) untuk repo frontend terpisah.
- Block 0.0/0.1 → **git init + scaffold Nest** (bukan inspeksi repo existing).
- Middleware → **Guards/Interceptors/Filters/Pipes** Nest; validasi → **class-validator**; rate limit → **@nestjs/throttler**; OpenAPI → **@nestjs/swagger**.
- Kolom uang `IDR INTEGER` yang keliru di draft → diperbaiki jadi **INTEGER (IDR)**.
- Deploy → **Dockerfile / long-running service** (bukan Vercel serverless), karena Nest adalah server persisten.
