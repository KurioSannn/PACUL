# Security Checklist — Pacul Backend

Audit of HTTP endpoints against security requirements for Block 17.0.

**Legend**

| Column | Meaning |
| --- | --- |
| Auth | `Public` = no JWT; `Required` = Supabase JWT + profile |
| Roles | `@Roles(...)` when enforced; `Any authenticated` = auth only |
| DTO | Request validated via class-validator DTO + global `ValidationPipe` |
| Ownership | Resource scoped to `user.id` or role-based access in service layer |
| Rate limit | Per-user/IP throttling; `Strict` = tighter limit on this route |

**Global controls (all routes unless noted)**

- `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`, `forbidUnknownValues`
- `UserThrottlerGuard`: default `RATE_LIMIT_GLOBAL_PER_MINUTE` (120/min)
- CORS: origins from `CORS_ALLOWED_ORIGINS` (comma-separated)
- Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
- 429 responses use error code `RATE_LIMITED`

---

## Public endpoints

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/health` | Public | — | — | — | Global | Liveness probe |
| GET | `/roles/capabilities` | Public | — | — | — | Global | Static capability map |
| GET | `/waste-categories` | Public | — | — | — | Global | Read-only taxonomy |
| POST | `/auth/complete-profile` | Public | — | Yes | Self on create | Global | Profile bootstrap after Supabase signup |
| GET | `/ratings/summary/:actorId` | Public | — | UUID param | Public actor stats | Global | Aggregated ratings only |

---

## Auth & profile

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/me` | Required | Any authenticated | — | Self | Global | Current user profile |
| PATCH | `/me/profile` | Required | Any authenticated | Yes | Self | Global | Profile update |

---

## Waste images (upload security)

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/waste-images/upload` | Required | Any authenticated | Multipart | User-scoped path | Global | Magic-byte check (JPEG/PNG/WebP), MIME match, max size, filename ≤255, path traversal rejected, `sanitizeFileName` |
| GET | `/waste-images/signed-url` | Required | Any authenticated | Query `path` | `assertWasteImageOwnership` | Global | Signed URL for owned paths only |

---

## AI classification

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/ai/classify-waste` | Required | Any authenticated | Yes | Image path ownership | **Strict** (`RATE_LIMIT_AI_PER_MINUTE`/min) | 429 `RATE_LIMITED` |
| GET | `/ai/classifications/:id` | Required | Any authenticated | UUID param | Classification owner | Global | |
| POST | `/ai/classifications/:id/override` | Required | Any authenticated | Yes (sanitized `reason`) | Classification owner | Global | Manual category override |

---

## Waste listings

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/waste-listings` | Required | household | Yes | Creator | Global | Image path ownership validated |
| GET | `/waste-listings` | Required | household, collector | Query filters | Role-scoped list | Global | |
| GET | `/waste-listings/:id` | Required | Any authenticated | UUID param | Owner / collector view | Global | Service enforces access |
| PATCH | `/waste-listings/:id` | Required | household | Yes | Owner | Global | |
| POST | `/waste-listings/:id/publish` | Required | household | UUID param | Owner | Global | |
| POST | `/waste-listings/:id/cancel` | Required | household, collector | Yes | Owner / claim rules | Global | |

---

## Collector

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/collector/available-waste` | Required | collector | Query filters | Collector scope | Global | |
| GET | `/collector/handled-categories` | Required | collector | — | Self | Global | |
| POST | `/collector/handled-categories` | Required | collector | Yes | Self | Global | |
| DELETE | `/collector/handled-categories/:categoryId` | Required | collector | UUID param | Self | Global | |
| POST | `/collector/pickup-claims` | Required | collector | Yes | Claimant | Global | |
| GET | `/collector/pickup-claims` | Required | collector | Query filters | Self | Global | |
| PATCH | `/collector/pickup-claims/:id/status` | Required | collector | Yes | Claim owner | Global | |

---

## Material batches & marketplace

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/collector/material-batches` | Required | collector | Yes | Creator | Global | |
| GET | `/collector/material-batches` | Required | collector | Query filters | Self | Global | |
| GET | `/collector/material-batches/:id` | Required | collector | UUID param | Owner | Global | |
| PATCH | `/collector/material-batches/:id` | Required | collector | Yes | Owner | Global | |
| POST | `/collector/material-batches/:id/sources` | Required | collector | Yes | Owner | Global | |
| POST | `/collector/material-batches/:id/sorting-complete` | Required | collector | — | Owner | Global | |
| POST | `/collector/material-batches/:id/publish` | Required | collector | — | Owner | Global | |
| POST | `/collector/material-batches/:id/unavailable` | Required | collector | — | Owner | Global | |
| GET | `/materials` | Required | industry, collector | Query filters | Marketplace | Global | |
| GET | `/materials/:id` | Required | industry, collector | UUID param | Published batch | Global | |

---

## Orders, negotiation & transactions

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/orders` | Required | industry | Yes (sanitized notes) | Buyer | Global | |
| GET | `/orders` | Required | industry, collector | Query filters | Participant | Global | |
| GET | `/orders/:id` | Required | industry, collector | UUID param | Participant | Global | |
| PATCH | `/orders/:id/status` | Required | industry, collector | Yes | Participant | Global | |
| POST | `/orders/:orderId/negotiation` | Required | industry | Yes | Order participant | Global | |
| GET | `/orders/:orderId/negotiation/history` | Required | industry, collector | UUID param | Participant | Global | |
| GET | `/negotiations/:id` | Required | industry, collector | UUID param | Participant | Global | |
| GET | `/negotiations/:id/messages` | Required | industry, collector | UUID param | Participant | Global | |
| POST | `/negotiations/:id/messages` | Required | industry, collector | Yes | Participant | Global | |
| POST | `/negotiations/:id/offers` | Required | industry, collector | Yes | Participant | Global | |
| POST | `/negotiations/:id/accept` | Required | industry, collector | — | Participant | Global | |
| POST | `/negotiations/:id/cancel` | Required | industry, collector | Yes (sanitized reason) | Participant | Global | |
| POST | `/orders/:id/transactions/simulate` | Required | industry | UUID param | Order owner | Global | Demo simulation |
| GET | `/transactions` | Required | industry, collector | Query filters | Participant | Global | |
| POST | `/transactions/:id/complete` | Required | industry, collector | UUID param | Participant | Global | |

---

## Routes & pickup

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/routes/preview` | Required | collector | Yes | Collector | Global | |
| POST | `/routes` | Required | collector | Yes | Creator | Global | |
| GET | `/routes/:id` | Required | collector, household | UUID param | Route participant | Global | |
| PATCH | `/routes/:id/status` | Required | collector | Yes | Owner | Global | |
| PATCH | `/routes/:id/stops/:stopId/status` | Required | collector | Yes | Owner | Global | |
| POST | `/routes/:id/recalculate` | Required | collector | UUID param | Owner | Global | |

---

## Dashboard, reports & traceability

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/dashboard/summary` | Required | Any authenticated | — | Role-based summary | Global | Service branches by role |
| GET | `/dashboard/impact` | Required | household, collector, industry | Query filters | Platform aggregate | Global | |
| GET | `/dashboard/material-flow` | Required | household, collector, industry | Query filters | Platform aggregate | Global | |
| GET | `/dashboard/routes` | Required | collector | — | Self | Global | |
| GET | `/reports` | Required | household, collector, industry | — | Self exports | Global | |
| POST | `/reports/export/pdf` | Required | household, collector, industry | Yes | Self | **Strict** (`RATE_LIMIT_REPORT_EXPORT_PER_HOUR`/hour) | 429 `RATE_LIMITED` |
| POST | `/reports/export/excel` | Required | household, collector, industry | Yes | Self | **Strict** (`RATE_LIMIT_REPORT_EXPORT_PER_HOUR`/hour) | 429 `RATE_LIMITED` |
| GET | `/reports/:id` | Required | household, collector, industry | UUID param | Export owner | Global | |
| GET | `/reports/:id/download` | Required | household, collector, industry | UUID param | Export owner | Global | |
| GET | `/traceability/material/:batchId` | Required | collector, industry | UUID param | Access rules in service | Global | |
| GET | `/traceability/waste/:listingId` | Required | household, collector, industry | UUID param | Listing access | Global | |
| GET | `/traceability/order/:orderId` | Required | industry, collector | UUID param | Order participant | Global | |

---

## Notifications, ratings & audit

| Method | Path | Auth | Roles | DTO | Ownership | Rate limit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/notifications` | Required | household, collector, industry | Query filters | Self | Global | |
| PATCH | `/notifications/read-all` | Required | household, collector, industry | — | Self | Global | |
| PATCH | `/notifications/:id/read` | Required | household, collector, industry | UUID param | Self | Global | |
| GET | `/audit-logs` | Required | household, collector, industry | Query filters | Self | Global | |
| POST | `/ratings` | Required | household, collector, industry | Yes | Rater | Global | |

---

## Input sanitization

Free-text DTO fields use `SanitizeText` (`src/common/utils/sanitize.ts`) for trim, HTML stripping, and max-length enforcement on:

- AI override `reason`
- Order `notes`, `cancel_reason`
- Negotiation cancel `reason`

Additional DTOs should adopt `@SanitizeText({ maxLength: N })` when adding new user-facing text fields.

---

## Environment variables (security)

| Variable | Default | Purpose |
| --- | --- | --- |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed browser origins (comma-separated) |
| `RATE_LIMIT_GLOBAL_PER_MINUTE` | `120` | Default API rate limit per user/IP |
| `RATE_LIMIT_AI_PER_MINUTE` | `10` | POST `/ai/classify-waste` |
| `RATE_LIMIT_REPORT_EXPORT_PER_HOUR` | `3` | POST `/reports/export/pdf` and `/excel` |
| `AI_MAX_FILE_SIZE_MB` | `5` | Upload size cap |
| `AI_ALLOWED_MIME_TYPES` | `image/jpeg,image/png,image/webp` | Declared + magic-byte allowed types |

---

## Upload security verification

Storage module (`src/modules/storage/`) enforces:

1. **Magic bytes** — `detectImageMimeType()` validates JPEG (`FF D8 FF`), PNG, and WebP signatures before upload.
2. **MIME consistency** — Declared `Content-Type` must match detected type.
3. **Filename** — Rejects path traversal (`..`, `/`, `\`); max original name length 255; stored name sanitized via `sanitizeFileName` (max 255).
4. **Path ownership** — `assertWasteImageOwnership()` ensures object paths are under `{userId}/`.
5. **Size limits** — Multer limit + explicit validation against `AI_MAX_FILE_SIZE_MB`.

Covered by unit tests in `waste-image.validation.spec.ts` and upload flow in `waste-images.controller.ts`.

---

## Verification commands

```bash
cd backend
npm run typecheck
npm run lint
npm run test
```

Last updated: Block 17.0 — Security Hardening
