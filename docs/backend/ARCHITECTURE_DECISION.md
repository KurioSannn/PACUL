# PACUL Backend — Architecture Decision Record

Source of truth for the standalone NestJS API within the PACUL monorepo.

## Runtime & Framework

- **Framework:** NestJS (latest stable) + TypeScript (strict mode).
- **HTTP adapter:** Express (Nest default).
- **Location:** `backend/` directory (coexists with Next.js frontend in `src/`).

## Data & Platform

- **Database / Auth / Storage / Realtime:** Supabase (PostgreSQL, Auth, Storage, Realtime, RLS).
- **Server-side data access:** `@supabase/supabase-js` admin client (service role). Intentionally bypasses RLS for trusted server logic; RLS protects direct anon-key access.
- **Migrations:** Plain SQL files in `backend/db/migrations/`, applied via Supabase CLI (`supabase db push`) or `psql`. No heavy ORM.

## Validation

- `class-validator` + `class-transformer` via global `ValidationPipe`:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`

## Auth & RBAC

- `SupabaseAuthGuard` verifies Supabase JWT.
- `RolesGuard` + `@Roles()` decorator for RBAC.

## API Response Shape

- **Success:** global `ResponseInterceptor` → `{ success, data, meta? }`
- **Error:** `AllExceptionsFilter` → `{ success: false, error, code, details? }`

## Cross-Cutting Concerns

- **Rate limit:** `@nestjs/throttler`
- **AI classification:** mock classifier default; `onnxruntime-node` / `sharp` optional
- **Reports:** `pdfkit` (PDF) + `exceljs` (Excel)
- **Realtime:** Supabase Realtime channels with server-side authorization

## Testing

- **Unit:** Jest
- **E2E:** Supertest (`backend/test/`)

## Folder Layout

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/          # guards, decorators, interceptors, filters, config, dto, utils
│   ├── supabase/
│   └── modules/       # feature modules
├── db/
│   ├── migrations/
│   └── seeds/
└── test/
docs/backend/          # API docs, README, prompt plan
```

## API Contract Discipline

This backend serves a separate frontend (Next.js in `src/`). Produce OpenAPI spec, JSON examples, and shared DTO types so the frontend can integrate without coupling to implementation details.
