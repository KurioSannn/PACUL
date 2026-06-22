# Deployment Checklist — PACUL Backend

Use this checklist before exposing the NestJS API publicly (Render, Railway, Fly.io, VM, or Docker).

## Pre-deploy

| Step | Check | Notes |
| --- | --- | --- |
| Environment | [ ] | Copy `backend/.env.example` → `.env` (or platform env vars). All required Supabase keys set. |
| Supabase project | [ ] | Project created; URL, anon key, service role key, JWT secret available. |
| Migrations | [ ] | Apply `backend/db/migrations/*.sql` in numeric order (`001` → `016`). |
| Storage buckets | [ ] | Run `npm run db:setup` (or `npx ts-node db/setup.ts`) — idempotent `initBuckets()`. |
| Demo seed (optional) | [ ] | For hackathon demo: `npm run db:seed` with `DEMO_SEED_ENABLED=true`. Skip in production. |
| AI classifier | [ ] | Set `AI_USE_MOCK_CLASSIFIER=true` for demo/hackathon unless ONNX model is deployed. |
| CORS | [ ] | `CORS_ALLOWED_ORIGINS` includes frontend URL(s), comma-separated (e.g. `https://app.example.com`). |
| Rate limits | [ ] | Review `RATE_LIMIT_GLOBAL_PER_MINUTE`, `RATE_LIMIT_AI_PER_MINUTE`, `RATE_LIMIT_REPORT_EXPORT_PER_HOUR`. |
| Port | [ ] | `PORT` matches platform (default `4000`). |
| Health probe | [ ] | `GET /health` returns 200 after deploy. |

## Migration commands

Migrations are plain SQL files under `backend/db/migrations/`. Apply in order:

```bash
# Option A — Supabase CLI (linked project)
cd backend
supabase db push

# Option B — psql
psql "$DATABASE_URL" -f db/migrations/001_core_user_schema.sql
# ... repeat through 016_rls_policies.sql
```

Or run the helper (prints instructions only):

```bash
npm run db:migrate
```

## Setup & seed scripts

From `backend/` with `.env` configured:

```bash
npm run db:setup   # storage buckets (safe to re-run)
npm run db:seed    # optional demo data (idempotent)
```

## Docker

Build and run locally:

```bash
cd backend
docker build -t pacul-backend .
docker run --env-file .env -p 4000:4000 pacul-backend
```

The container runs `node dist/src/main.js` and listens on `PORT` (default 4000).

## Platform notes

| Platform | Suggested config |
| --- | --- |
| **Render** | Web Service, Node, build: `npm ci && npm run build`, start: `node dist/src/main.js`, health check `/health`. |
| **Railway** | Nixpacks or Dockerfile; set env vars in dashboard; expose `PORT`. |
| **Fly.io** | `fly launch` with Dockerfile; `fly secrets set` for Supabase keys. |
| **VM / VPS** | `npm ci`, `npm run build`, process manager (systemd/pm2), reverse proxy (nginx) with TLS. |

## Post-deploy verification

```bash
curl https://your-api.example.com/health
npm run backend:check   # run locally before merge
```

Follow [SMOKE_TEST_GUIDE.md](./SMOKE_TEST_GUIDE.md) — all 5 scenarios must **PASS** before PR merge.

## Security reminders

- Never commit `.env` or production secrets.
- Disable demo seeds in production (`DEMO_SEED_ENABLED=false`).
- Use a strong unique `DEMO_PASSWORD` only in non-production demo environments.
- Service role key stays server-side only.
