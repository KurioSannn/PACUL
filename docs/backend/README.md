# PACUL Backend

NestJS REST API for the PACUL circular waste marketplace. Lives in `backend/` within the PACUL monorepo (Next.js frontend in `src/` at repo root).

## Overview

PACUL connects three roles in a waste circular economy:

- **Household** — upload waste, run AI classification, publish listings for pickup.
- **Collector** — claim listings, optimize pickup routes, sort into material batches, sell to industry.
- **Industry** — browse material marketplace, place orders, negotiate price, track traceability.

The backend handles auth (Supabase JWT), RBAC, marketplace flows, route optimization, negotiation, simulated transactions, PACUL Track traceability, dashboards, and PDF/Excel report exports.

Default API port: **4000** (`GET http://localhost:4000/health`).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js, NestJS 11, TypeScript (strict) |
| Database / Auth / Storage / Realtime | Supabase (PostgreSQL, Auth, Storage, Realtime, RLS) |
| Validation | `class-validator`, `class-transformer` |
| Reports | `pdfkit` (PDF), `exceljs` (Excel) |
| AI | Mock classifier (default); optional ONNX model path |
| Testing | Jest (unit), Supertest (e2e) |
| API docs | `@nestjs/swagger` → `/docs` + `docs/openapi.yaml` |

See [ARCHITECTURE_DECISION.md](./ARCHITECTURE_DECISION.md) for design rationale.

## Getting Started

### Prerequisites

- Node.js 20+
- npm (lockfile: `package-lock.json`)
- Supabase project with credentials

### Install and run

```bash
cd backend
cp .env.example .env   # fill Supabase credentials
npm install
npm run start:dev
```

Verify:

- Health: `GET http://localhost:4000/health`
- Swagger UI: `http://localhost:4000/docs`
- Capabilities: `GET http://localhost:4000/roles/capabilities`

### Environment variables

Copy `backend/.env.example` to `backend/.env`. The app validates all variables at boot and fails fast if required values are missing.

**Required (Supabase):**

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin client, bypasses RLS) |
| `SUPABASE_JWT_SECRET` | JWT secret for verifying Supabase tokens |

**Common optional variables** (defaults in `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | HTTP listen port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated frontend origins |
| `AI_USE_MOCK_CLASSIFIER` | `true` | Use mock AI instead of ONNX |
| `ROUTE_BASE_FEE` | `5000` | Base pickup fee (IDR) |
| `ROUTE_COST_PER_KM` | `2000` | Cost per km (IDR) |
| `ROUTE_HANDLING_COST_PER_KG` | `300` | Handling cost per kg (IDR) |
| `DEMO_PASSWORD` | `PaculDemo2025!` | Password for `@pacul-demo.com` seed accounts |

Full env reference remains in `.env.example`.

## Database

### Migrations

SQL migrations live in `backend/db/migrations/`. Apply via Supabase CLI or `psql`:

```bash
cd backend
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/016_rls_policies.sql
```

### Seeds

```bash
cd backend
npx ts-node db/seeds/index.ts          # all seeds (storage first)
npx ts-node db/seeds/000_setup_storage.ts   # storage buckets only
```

Seeds are idempotent (check-before-insert). Set `DEMO_SEED_ENABLED=true` for demo data.

### Row Level Security (RLS)

Migration `016_rls_policies.sql` enables RLS on all application tables. The NestJS backend uses the **service role** admin client, which bypasses RLS for trusted server logic. RLS protects direct browser/mobile access via the anon key.

Policy summary:

| Area | SELECT | INSERT / UPDATE |
|------|--------|-----------------|
| Profiles | Own row + active cross-role display | Own row only |
| `waste_listings` | Household own; collectors see `available` + claimed | Household/collector per status rules |
| `orders`, `negotiation_*` | Parties only | Backend-controlled writes |
| `notifications` | Own (`user_id`) | Update own; inserts backend only |
| `traceability_events` | Actor or related entity | Backend only |

See [../realtime.md](../realtime.md) for Realtime channel authorization.

### Storage buckets

Private Supabase buckets (initialized by `000_setup_storage.ts`):

| Bucket | Env | Max size | Types |
|--------|-----|----------|-------|
| `waste-images` | `SUPABASE_STORAGE_BUCKET_WASTE_IMAGES` | 5 MB | jpeg, png, webp |
| `reports` | `SUPABASE_STORAGE_BUCKET_REPORTS` | 20 MB | PDF, Excel, etc. |

## API

### Base URL

```
http://localhost:4000
```

Production: set via deployment env (`PORT`, reverse proxy).

### Authentication

Protected endpoints require a Supabase access token:

```
Authorization: Bearer <supabase_access_token>
```

Obtain the token via Supabase Auth sign-in on the frontend or Supabase client SDK. Role is resolved from `user_profiles.role` after JWT verification.

### Response shape

Success:

```json
{ "success": true, "data": { ... }, "meta": { ... } }
```

Error:

```json
{ "success": false, "error": "Human-readable message", "code": "ERROR_CODE", "details": { ... } }
```

### HTTP status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / validation |
| 401 | Missing or invalid JWT |
| 403 | RBAC denied |
| 404 | Resource not found |
| 410 | Export expired |
| 422 | Business rule violation |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### Documentation

| Resource | Location |
|----------|----------|
| **Swagger UI (interactive)** | [http://localhost:4000/docs](http://localhost:4000/docs) |
| **OpenAPI 3.0 spec (YAML)** | [../openapi.yaml](../openapi.yaml) |
| **Endpoint reference (Markdown)** | [API.md](./API.md) |

Regenerate the YAML spec after build:

```bash
cd backend
npm run build              # runs openapi:generate via postbuild
npm run openapi:generate   # manual dump to docs/openapi.yaml
npx @apidevtools/swagger-cli validate ../docs/openapi.yaml
```

## Demo Accounts

> **HACKATHON ONLY** — These accounts exist solely for local demos and judging. Do **not** deploy to production. Set a unique `DEMO_PASSWORD` in `.env` if re-seeding in a shared environment, and disable demo seeds (`DEMO_SEED_ENABLED=false`) outside hackathon setups.

Run demo seeds from `backend/` after migrations:

```bash
npx ts-node db/seeds/index.ts
```

| Role | Email | Password |
|------|-------|----------|
| Household | `household1@pacul-demo.com` | `DEMO_PASSWORD` or `PaculDemo2025!` |
| Household | `household2@pacul-demo.com` | `DEMO_PASSWORD` or `PaculDemo2025!` |
| Collector | `collector1@pacul-demo.com` | `DEMO_PASSWORD` or `PaculDemo2025!` |
| Collector | `collector2@pacul-demo.com` | `DEMO_PASSWORD` or `PaculDemo2025!` |
| Industry | `industry1@pacul-demo.com` | `DEMO_PASSWORD` or `PaculDemo2025!` |
| Industry | `industry2@pacul-demo.com` | `DEMO_PASSWORD` or `PaculDemo2025!` |

Demo data spans Surabaya, Sidoarjo, and Gresik coordinates and includes listings, AI classifications, routes, material batches, orders, negotiations, simulated transactions, ratings, and traceability events.

## AI Model

### Default: mock classifier

By default `AI_USE_MOCK_CLASSIFIER=true`. The mock returns deterministic-but-varied predictions based on image buffer hash (200–500 ms simulated latency). Suitable for hackathon demos without a trained model file.

### Enable real ONNX model

1. Place model at path configured by `AI_MODEL_PATH` (default `./models/waste_classifier.onnx`).
2. Set `AI_USE_MOCK_CLASSIFIER=false`.
3. Restart the server.

If the model file is missing or inference fails, the service falls back to mock behavior with logging.

### Taxonomy (8 classes + unknown)

| Class | Label | DB code | Confidence threshold |
|-------|-------|---------|---------------------|
| `plastic_pet` | Botol PET | `PLASTIC_PET` | 0.5 |
| `plastic_other` | Plastik Lainnya | `PLASTIC_OTHER` | 0.5 |
| `paper_cardboard` | Kertas dan Kardus | `PAPER` | 0.5 |
| `metal_can` | Kaleng Logam | `METAL_CAN` | 0.5 |
| `glass` | Kaca | `GLASS` | 0.5 |
| `electronics` | Elektronik | `ELECTRONICS` | 0.5 |
| `organic` | Organik | `ORGANIC` | 0.5 |
| `textile` | Tekstil | `TEXTILE` | 0.5 |
| `unknown` | Tidak dikenali | — | — |

Results below the class threshold are flagged as low-confidence; users can override manually via the override endpoint.

Rate limit: `RATE_LIMIT_AI_PER_MINUTE` (default 10 per user per minute).

## Route Optimization

Pickup routes use a **nearest-neighbor** heuristic starting from the collector base location:

1. Compute Haversine distances between stops.
2. Greedily pick the nearest unvisited stop until all are assigned.
3. Estimate cost from distance and weight.

**Cost formula** (defaults from env):

```
distanceCost = totalDistanceKm × ROUTE_COST_PER_KM
handlingCost = totalWeightKg × ROUTE_HANDLING_COST_PER_KG
subtotal     = ROUTE_BASE_FEE + distanceCost + handlingCost
totalCost    = roundUpToNearest100(subtotal)
```

Default env values: base fee **5,000 IDR**, **2,000 IDR/km**, **300 IDR/kg** handling.

Nearest-neighbor is fast but **not globally optimal** — acceptable for hackathon MVP route preview and cost estimates.

## Impact & Carbon Assumptions

> **Simulated demo values.** The CO₂ figures below are **not** peer-reviewed
> life-cycle assessment (LCA) numbers. They are coarse, hand-picked estimates for
> the hackathon MVP and must not be presented as authoritative carbon accounting.

`estimated_co2_saved_kg` (in `/dashboard/impact`, `/dashboard/local-impact`, and
report exports) is computed per material category:

```
estimated_co2_saved_kg = Σ (sold_weight_kg[category] × EMISSION_FACTOR[category_code])
```

Factors live in `backend/src/common/config/emission-factors.ts`. Categories
without a mapped code fall back to `DEFAULT_EMISSION_FACTOR` (1.0).

| Category code | Emission factor (kg CO₂e / kg recycled) |
| ------------- | --------------------------------------- |
| `ELECTRONICS` | 3.0 |
| `METAL_CAN` | 2.0 |
| `PLASTIC_PET` | 1.5 |
| `PLASTIC_OTHER` | 1.2 |
| `TEXTILE` | 1.0 |
| `PAPER` | 0.9 |
| `ORGANIC` | 0.5 |
| `GLASS` | 0.3 |
| _(unmapped)_ | 1.0 (default) |

To tune the model, edit the factor map only — all downstream code reads through
`getEmissionFactor` / `estimateCo2SavedKg`.

## Payment / Transaction — SIMULATION ONLY

> **No real payment gateway is integrated.** Transaction endpoints simulate deal completion for demo flows only.

- `POST /transactions/:id/complete` marks a simulated transaction as complete.
- No Midtrans, Xendit, Stripe, or bank transfer integration.
- Amounts are stored for reporting and traceability; no funds move.
- Do **not** present this as production payment processing.

## Status Lifecycles

All status changes go through centralized transition validators in `src/common/config/status-transitions.ts`.

### `waste_listing`

| From | Allowed transitions |
|------|---------------------|
| `draft` | `available`, `cancelled` |
| `available` | `claimed`, `cancelled` |
| `claimed` | `pickup_planned`, `cancelled` |
| `pickup_planned` | `picked_up`, `cancelled` |
| `picked_up` | `sorting` |
| `sorting` | `sorted` |
| `sorted` | `converted_to_material` |
| `cancelled` | *(terminal)* |
| `converted_to_material` | *(terminal)* |

### `material_batch`

| From | Allowed transitions |
|------|---------------------|
| `draft` | `available`, `unavailable` |
| `available` | `ordered`, `negotiating`, `unavailable` |
| `ordered` | `negotiating`, `sold`, `available` |
| `negotiating` | `sold`, `available` |
| `sold` | *(terminal)* |
| `unavailable` | `available` |

### `order`

| From | Allowed transitions |
|------|---------------------|
| `created` | `negotiating`, `accepted`, `rejected`, `cancelled` |
| `negotiating` | `accepted`, `rejected`, `cancelled` |
| `accepted` | `completed`, `cancelled` |
| `rejected` | *(terminal)* |
| `cancelled` | *(terminal)* |
| `completed` | *(terminal)* |

## Testing

Run from `backend/`:

```bash
npm run test        # unit specs under src/**/*.spec.ts
npm run test:cov    # unit tests + coverage/
npm run test:e2e    # service-level e2e under test/*.e2e-spec.ts
npm run typecheck   # TypeScript check
npm run lint        # ESLint
```

E2E tests use an in-memory Supabase mock (`test/helpers/supabase-mock.ts`) — no live database required.

### Latest results

```
Test Suites: 20 passed, 20 total   (npm run test)
Tests:       108 passed, 108 total

Test Suites: 7 passed, 7 total     (npm run test:e2e)
Tests:       34 passed, 34 total
```

| E2E file | Flow |
|----------|------|
| `test/listing-flow.e2e-spec.ts` | create → publish → marketplace → cancel |
| `test/pickup-flow.e2e-spec.ts` | claim → route → picked_up |
| `test/material-flow.e2e-spec.ts` | batch → sorting → publish → marketplace |
| `test/order-flow.e2e-spec.ts` | order → negotiation → accept → complete |
| `test/traceability-flow.e2e-spec.ts` | full timeline + chain_summary |
| `test/reports-export-smoke.e2e-spec.ts` | PDF/Excel buffer smoke |
| `test/app.e2e-spec.ts` | health + capabilities |

## Deployment

### Build

```bash
cd backend
npm install
npm run build          # compiles to dist/ and dumps docs/openapi.yaml
npm run start:prod     # node dist/src/main.js
```

Full pre-deploy checklist: [DEPLOY.md](./DEPLOY.md). Manual smoke tests: [SMOKE_TEST_GUIDE.md](./SMOKE_TEST_GUIDE.md). PR gate: [PR_CHECKLIST.md](./PR_CHECKLIST.md).

```bash
npm run db:setup       # storage buckets (idempotent)
npm run db:seed        # optional demo data
npm run backend:check  # typecheck + lint + test + build
npm run pr:check       # same gate before PR
```

### Checklist

1. Set all required env vars (Supabase URL, keys, JWT secret).
2. Apply migrations (`supabase db push`).
3. Initialize storage buckets: `npm run db:setup`.
4. Optional demo seed for judging: `npm run db:seed`.
5. Set `CORS_ALLOWED_ORIGINS` to your frontend URL(s).
6. Keep `AI_USE_MOCK_CLASSIFIER=true` for demo unless ONNX model is deployed.
7. Set `DEMO_SEED_ENABLED=false` in production.
8. Expose `PORT` (default 4000) behind HTTPS reverse proxy.

Report exports expire after `REPORT_EXPORT_EXPIRES_HOURS` (default 24h). Schedule cleanup of stale objects in the `reports` bucket for production.

## Known Limitations

| Area | Limitation |
|------|------------|
| Payments | **Simulation only** — no real payment gateway |
| AI | Mock classifier is the default; ONNX requires manual model deployment |
| Route optimization | Nearest-neighbor heuristic, not optimal TSP solution |
| Rate limiting | In-memory `@nestjs/throttler` — resets on process restart; not distributed |
| Notifications | In-app records only — no push/email/SMS |
| Realtime | Supabase Realtime for negotiation chat; requires frontend channel setup |
| Reports | Signed URLs expire in 1 hour; export records expire in 24 hours |
| Demo accounts | Hackathon-only credentials — never use in production |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Development server with watch |
| `npm run build` | Production build + OpenAPI dump |
| `npm run openapi:generate` | Dump `docs/openapi.yaml` |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests |
| `npm run test:e2e` | Integration/E2E tests |
| `npm run db:migrate` | Print migration apply instructions |
| `npm run db:setup` | Initialize Supabase storage buckets |
| `npm run db:seed` | Run demo seeds (idempotent) |
| `npm run backend:check` | typecheck + lint + test + build |
| `npm run pr:check` | PR merge gate (same as `backend:check`) |
