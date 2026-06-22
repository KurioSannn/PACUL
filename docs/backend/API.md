# PACUL Backend API

## Database Schema — Users

Core tables that extend Supabase Auth (`auth.users`) with role-based profiles.

### Table: `public.user_profiles`

- `id` (uuid, PK) — references `auth.users.id` on delete cascade.
- `role` (text) — one of `household`, `collector`, `industry`; source of truth for RBAC.
- `display_name` (text) — human-friendly name shown in dashboards.
- `phone` (text, nullable) — contact phone number.
- `avatar_url` (text, nullable) — URL to profile avatar image.
- `is_active` (boolean, default `true`) — soft-active flag for deactivating accounts.
- `created_at` (timestamptz, default `now()`).
- `updated_at` (timestamptz, default `now()`) — maintained by `public.update_updated_at()` trigger.

Indexes:
- `user_profiles_role_idx` on `(role)`.
- `user_profiles_is_active_idx` on `(is_active)`.

### Table: `public.household_profiles`

One-to-one with `user_profiles` for household users.

- `id` (uuid, PK) — FK to `public.user_profiles.id`.
- `address` (text, nullable).
- `latitude` (numeric(10,8), nullable).
- `longitude` (numeric(11,8), nullable).
- `district` / `city` / `province` (text, nullable) — location breakdown.
- `total_waste_kg` (numeric, default `0`) — cumulative waste amount created.
- `total_listings` (integer, default `0`) — total waste listings created.

### Table: `public.collector_profiles`

One-to-one with `user_profiles` for collector users.

- `id` (uuid, PK) — FK to `public.user_profiles.id`.
- `business_name` (text, nullable).
- `service_area_description` (text, nullable) — description of coverage area.
- `base_latitude` / `base_longitude` (numeric(10,8)/(11,8), nullable) — depot coordinate.
- `vehicle_capacity_kg` (numeric, nullable) — nominal vehicle capacity.
- `rating_average` (numeric(3,2), default `0`).
- `rating_count` (integer, default `0`).
- `total_pickups` (integer, default `0`).
- `total_kg_collected` (numeric, default `0`).

### Table: `public.industry_profiles`

One-to-one with `user_profiles` for industry users.

- `id` (uuid, PK) — FK to `public.user_profiles.id`.
- `company_name` (text, not null).
- `industry_type` (text, nullable).
- `address` (text, nullable).
- `latitude` / `longitude` (numeric(10,8)/(11,8), nullable).
- `rating_average` (numeric(3,2), default `0`).
- `rating_count` (integer, default `0`).
- `total_orders` (integer, default `0`).

### Apply Migration

From `backend/` run one of:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or using psql
psql "$DATABASE_URL" -f db/migrations/001_core_user_schema.sql
```

## Endpoints

### `GET /roles/capabilities` (public)

Returns the RBAC capability map for all roles. No authentication required.

**Response**

```json
{
  "success": true,
  "data": {
    "household": [
      "create_waste_listing",
      "view_own_waste_listings",
      "view_pickup_status",
      "view_material_traceability",
      "rate_collector",
      "view_own_impact_dashboard",
      "export_own_report"
    ],
    "collector": [
      "view_available_waste_listings",
      "claim_waste_listing",
      "create_pickup_route",
      "manage_route_status",
      "sort_waste_into_material_batch",
      "create_material_batch",
      "publish_material_listing",
      "negotiate_with_industry",
      "rate_household",
      "rate_industry",
      "view_collector_dashboard",
      "export_collector_report"
    ],
    "industry": [
      "view_material_marketplace",
      "create_order",
      "negotiate_with_collector",
      "complete_transaction",
      "rate_collector",
      "view_industry_dashboard",
      "export_industry_report",
      "view_material_traceability"
    ]
  }
}
```

Protected routes use `@Roles('household' | 'collector' | 'industry')` with global `RolesGuard` (runs after `SupabaseAuthGuard`). Insufficient role returns `403` with `code: INSUFFICIENT_ROLE`.

### `GET /me` (authenticated)

Returns the authenticated user's profile and role-specific sub-profile.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "household",
    "display_name": "Budi",
    "phone": "+628123456789",
    "avatar_url": null,
    "is_active": true,
    "profile": {
      "address": "Jl. Contoh No. 1",
      "latitude": -6.2,
      "longitude": 106.8,
      "district": "Kebayoran",
      "city": "Jakarta Selatan",
      "province": "DKI Jakarta",
      "total_waste_kg": 0,
      "total_listings": 0
    }
  }
}
```

`profile` shape depends on `role` (household, collector, or industry fields).

**Errors**

- `401 AUTH_REQUIRED` — missing or invalid token
- `403 PROFILE_MISSING` — user has not completed profile setup

### `PATCH /me/profile` (authenticated)

Updates `user_profiles` and the role-specific sub-profile. Body fields are validated according to `req.user.role`.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Household body (all optional)**

`displayName`, `phone`, `avatarUrl`, `address`, `latitude`, `longitude`, `district`, `city`, `province`

**Collector body (all optional)**

`displayName`, `phone`, `avatarUrl`, `businessName`, `serviceAreaDescription`, `baseLatitude`, `baseLongitude`, `vehicleCapacityKg`

**Industry body (all optional)**

`displayName`, `phone`, `avatarUrl`, `companyName`, `industryType`, `address`, `latitude`, `longitude`

**Response:** same shape as `GET /me`.

### `POST /auth/complete-profile` (authenticated, no profile required)

Creates `user_profiles` and the matching sub-profile for a newly registered Supabase user. Marked public for the global auth guard, but still requires a valid Bearer token (users without a profile cannot access other protected routes).

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body**

```json
{
  "role": "household",
  "displayName": "Budi",
  "phone": "+628123456789",
  "address": "Jl. Contoh No. 1",
  "city": "Jakarta Selatan"
}
```

For `role: "industry"`, `companyName` is required. Collector and household role-specific fields follow the create DTOs in `src/modules/profiles/dto/`.

**Response:** same shape as `GET /me`.

**Errors**

- `401 AUTH_REQUIRED` — missing or invalid token
- `409 PROFILE_EXISTS` — profile already created
- `400 VALIDATION_ERROR` — invalid payload for selected role

### `GET /waste-categories` (public)

Returns active waste categories ordered by `sort_order`. Used by listing forms, AI classification mapping, and collector handled-category setup.

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "PLASTIC_PET",
      "name": "Botol PET",
      "description": "Botol plastik PET seperti botol minuman.",
      "icon_key": "plastic-pet",
      "unit": "kg",
      "typical_price_per_kg": 2500,
      "ai_model_class": "plastic_pet",
      "sort_order": 1
    }
  ]
}
```

`typical_price_per_kg` is reference pricing only. `ai_model_class` links AI classifier output to database categories.

### Apply waste categories migration and seed

From `backend/`:

```bash
# Apply migration
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/002_waste_categories.sql

# Seed 8 categories (idempotent upsert by code)
npx ts-node db/seeds/index.ts
```

### `GET /collector/handled-categories` (collector)

Returns waste categories the authenticated collector handles, including category details and offered pricing.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "collector_id": "uuid",
      "category_id": "uuid",
      "min_weight_kg": 0,
      "max_weight_kg": null,
      "price_offered_per_kg": 2500,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00.000Z",
      "category": {
        "id": "uuid",
        "code": "PLASTIC_PET",
        "name": "Botol PET",
        "description": "Botol plastik PET seperti botol minuman.",
        "icon_key": "plastic-pet",
        "unit": "kg",
        "typical_price_per_kg": 2500,
        "ai_model_class": "plastic_pet",
        "sort_order": 1
      }
    }
  ]
}
```

### `POST /collector/handled-categories` (collector)

Upserts handled categories for the authenticated collector. Categories not included in the request are **not** deleted.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body**

```json
{
  "categories": [
    {
      "categoryId": "uuid",
      "minWeightKg": 0,
      "maxWeightKg": 50,
      "priceOfferedPerKg": 2400
    }
  ]
}
```

**Response:** same array shape as `GET /collector/handled-categories`.

`price_offered_per_kg` is the collector's offered buy price per kg for that category.

### `DELETE /collector/handled-categories/:categoryId` (collector)

Removes a handled category for the authenticated collector. Only rows owned by the collector can be deleted.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Response**

```json
{
  "success": true,
  "data": null
}
```

**Errors**

- `404 HANDLED_CATEGORY_NOT_FOUND` — category not handled by this collector

### `GET /collector/available-waste` (collector)

Returns available waste listings filtered by the collector's active handled categories. Private household data (address, phone, exact household id) is excluded; only `household_display_name` is included.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Query**

| Param | Description |
|-------|-------------|
| `city` | Filter by city (case-insensitive exact match) |
| `category_id` | Filter by waste category (must be in handled categories) |
| `lat` | Center latitude for radius filter |
| `lng` | Center longitude for radius filter |
| `radius_km` | Radius in km (uses `lat`/`lng` or collector base coordinates) |
| `page` | Page number (default `1`) |
| `limit` | Page size (default `20`, max `50`) |

When `radius_km` is provided, listings are fetched (up to 200 rows), filtered in-memory with haversine distance, sorted nearest-first, then paginated. `distance_km` is included when the collector profile has base coordinates.

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Botol PET bekas",
        "description": "Sekitar 3 kg",
        "estimated_weight_kg": 3,
        "status": "available",
        "city": "Jakarta Selatan",
        "district": "Kebayoran",
        "province": "DKI Jakarta",
        "latitude": -6.2,
        "longitude": 106.8,
        "available_from": null,
        "available_until": null,
        "pickup_fee": 0,
        "created_at": "2026-06-22T00:00:00.000Z",
        "category": {
          "id": "uuid",
          "code": "PLASTIC_PET",
          "name": "Botol PET"
        },
        "household_display_name": "Rumah Tangga Andi",
        "images": [],
        "distance_km": 4.2
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

**Errors**

- `400 LISTING_FILTER_INVALID` — `radius_km` provided without `lat`/`lng` or collector base coordinates
- `403 INSUFFICIENT_ROLE` — non-collector role

### `POST /collector/pickup-claims` (collector)

Claims an available waste listing. Creates a `pickup_claims` row and transitions the listing to `claimed`.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body**

```json
{
  "listingId": "uuid"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "listing_id": "uuid",
    "collector_id": "uuid",
    "status": "claimed",
    "claimed_at": "2026-06-22T00:00:00.000Z",
    "pickup_scheduled_at": null,
    "pickup_completed_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "route_id": null,
    "notes": null,
    "created_at": "2026-06-22T00:00:00.000Z",
    "updated_at": "2026-06-22T00:00:00.000Z"
  }
}
```

**Errors**

- `404 LISTING_NOT_FOUND`
- `400 LISTING_NOT_AVAILABLE` — listing is not `available`
- `400 CATEGORY_NOT_HANDLED` — category not in collector handled categories
- `409 CLAIM_ALREADY_EXISTS` — listing already has a claim (`UNIQUE(listing_id)`)

### `GET /collector/pickup-claims` (collector)

Lists pickup claims for the authenticated collector.

**Query:** `status` (optional) — `claimed` | `pickup_planned` | `picked_up` | `cancelled`

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "listing_id": "uuid",
      "collector_id": "uuid",
      "status": "claimed",
      "claimed_at": "2026-06-22T00:00:00.000Z",
      "pickup_scheduled_at": null,
      "pickup_completed_at": null,
      "cancelled_at": null,
      "cancel_reason": null,
      "route_id": null,
      "notes": null,
      "created_at": "2026-06-22T00:00:00.000Z",
      "updated_at": "2026-06-22T00:00:00.000Z"
    }
  ]
}
```

### `PATCH /collector/pickup-claims/:id/status` (collector)

Updates claim status and syncs the linked waste listing via the status transition engine.

**Body**

```json
{
  "status": "pickup_planned",
  "pickup_scheduled_at": "2026-06-23T08:00:00.000Z",
  "notes": "Jemput pagi",
  "cancel_reason": "Kendaraan rusak"
}
```

**Allowed claim transitions**

| From | To |
|------|-----|
| `claimed` | `pickup_planned`, `cancelled` |
| `pickup_planned` | `picked_up`, `cancelled` |

Linked listing transitions: `pickup_planned`, `picked_up`, or `cancelled` accordingly.

**Errors**

- `404 CLAIM_NOT_FOUND`
- `400 INVALID_CLAIM_TRANSITION`

### Apply pickup claims migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/006_pickup_claims.sql
```

### Apply collector handled categories migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/003_collector_handled_categories.sql
```

### `POST /waste-images/upload` (authenticated, any role)

Uploads a waste image to private storage. Image is stored under a temporary listing folder until linked to a waste listing later.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body:** `multipart/form-data` with field `image`

**Limits:** max size from `AI_MAX_FILE_SIZE_MB` (default 5MB). Allowed types from `AI_ALLOWED_MIME_TYPES` (default `image/jpeg`, `image/png`, `image/webp`). Content is validated using MIME type and image magic bytes.

**Response**

```json
{
  "success": true,
  "data": {
    "path": "waste-images/{userId}/temp/{timestamp}_{fileName}",
    "signedUrl": "https://...",
    "expiresAt": "2026-06-22T15:00:00.000Z"
  }
}
```

**Errors**

- `400 FILE_REQUIRED` — missing multipart field `image`
- `400 FILE_TOO_LARGE` — exceeds `AI_MAX_FILE_SIZE_MB`
- `400 INVALID_FILE_TYPE` — MIME or magic bytes do not match allowed image types
- `400 INVALID_FILE_NAME` — path traversal characters in original filename

### `GET /waste-images/signed-url` (authenticated, any role)

Returns a fresh signed URL for a previously uploaded waste image. The `path` query value must belong to the authenticated user.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Query:** `path` — storage path returned from upload (must contain `req.user.id`)

**Response**

```json
{
  "success": true,
  "data": {
    "signedUrl": "https://...",
    "expiresAt": "2026-06-22T15:00:00.000Z"
  }
}
```

**Errors**

- `400 PATH_REQUIRED` — missing `path` query parameter
- `400 INVALID_STORAGE_PATH` — malformed or traversal path
- `403 STORAGE_ACCESS_DENIED` — path does not belong to the authenticated user

Signed URLs expire after **1 hour** by default.

### `POST /ai/classify-waste` (authenticated, rate-limited)

Runs AI inference on a previously uploaded waste image, persists the result, and returns the mapped waste category.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Rate limit:** `RATE_LIMIT_AI_PER_MINUTE` requests per minute per user (default 10).

**Body**

```json
{
  "imagePath": "waste-images/{userId}/temp/{timestamp}_{fileName}"
}
```

`imagePath` must belong to the authenticated user (same ownership rules as waste image storage).

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "image_path": "waste-images/...",
    "top_class": "plastic_pet",
    "confidence": 0.82,
    "top_k_results": [
      {
        "class": "plastic_pet",
        "confidence": 0.82,
        "label": "Botol PET"
      }
    ],
    "category": {
      "id": "uuid",
      "code": "PLASTIC_PET",
      "name": "Botol PET"
    },
    "is_mock": true,
    "model_version": "mock-1.0.0",
    "inference_time_ms": 320,
    "is_overridden": false,
    "created_at": "2026-06-22T00:00:00.000Z",
    "lowConfidence": true,
    "suggestion": "Gunakan override manual"
  }
}
```

`lowConfidence` and `suggestion` appear when confidence is below the taxonomy threshold.

**Errors**

- `404 IMAGE_NOT_FOUND` — image path not found in storage
- `403 STORAGE_ACCESS_DENIED` — image path does not belong to user
- `503 AI_UNAVAILABLE` — classifier not ready or inference failed
- `429` — rate limit exceeded

### `GET /ai/model-version` (public)

Returns the currently active AI model version from the `ai_model_versions` registry. No authentication required (public reference for clients).

**Response**

```json
{
  "success": true,
  "data": {
    "version": "mock-1.0.0",
    "model_type": "mock",
    "taxonomy_version": "1.0",
    "deployed_at": "2026-06-01T00:00:00.000Z"
  }
}
```

`data` is `null` when no active model version has been seeded. Every inference request (success or error) is recorded in `inference_logs`, linked to the active model version and, when available, the resulting classification.

### `GET /ai/classifications/:id` (authenticated)

Returns a persisted classification result. Only the owning user can access it.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Response:** same `data` shape as `POST /ai/classify-waste` (without new `lowConfidence` recomputation on read).

**Errors**

- `404 CLASSIFICATION_NOT_FOUND` — missing or not owned by user

### `POST /ai/classifications/:id/override` (authenticated)

Manually correct an AI classification result before creating a listing. Each classification can only be overridden once.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body**

```json
{
  "categoryId": "uuid",
  "reason": "Bukan botol PET, ini kaca bening"
}
```

`reason` is optional (max 500 characters).

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "image_path": "waste-images/...",
    "top_class": "plastic_pet",
    "confidence": 0.42,
    "top_k_results": [],
    "category": {
      "id": "uuid",
      "code": "GLASS",
      "name": "Kaca"
    },
    "is_mock": true,
    "model_version": "mock-1.0.0",
    "inference_time_ms": 250,
    "is_overridden": true,
    "override_category_id": "uuid",
    "override_reason": "Bukan botol PET, ini kaca bening",
    "overridden_at": "2026-06-22T01:00:00.000Z",
    "overridden_by": "uuid",
    "created_at": "2026-06-22T00:00:00.000Z"
  }
}
```

After override, `category` reflects the manually selected waste category (not the original AI mapping).

**Errors**

- `404 CLASSIFICATION_NOT_FOUND` — missing or not owned by user
- `404 CATEGORY_NOT_FOUND` — override category does not exist or is inactive
- `409 ALREADY_OVERRIDDEN` — classification was already overridden

### Apply AI classifications migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/004_ai_classifications.sql
```

## Waste Listings

### `POST /waste-listings` (household)

Creates a new waste listing in `draft` status.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body**

```json
{
  "category_id": "uuid",
  "classification_id": "uuid",
  "title": "Botol PET bekas minuman",
  "description": "Sekitar 3 kg, sudah dicuci",
  "estimated_weight_kg": 3,
  "address": "Jl. Contoh No. 12",
  "latitude": -6.2,
  "longitude": 106.8,
  "district": "Kebayoran",
  "city": "Jakarta Selatan",
  "province": "DKI Jakarta",
  "available_from": "2026-06-22T08:00:00.000Z",
  "available_until": "2026-06-25T18:00:00.000Z",
  "notes": "Ambil pagi hari",
  "imagePaths": [
    "waste-images/{userId}/temp/{timestamp}_photo.jpg"
  ]
}
```

`classification_id` and `imagePaths` are optional. Each `imagePath` must belong to the authenticated household user. The first image is marked as primary.

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "household_id": "uuid",
    "category_id": "uuid",
    "classification_id": "uuid",
    "title": "Botol PET bekas minuman",
    "description": "Sekitar 3 kg, sudah dicuci",
    "estimated_weight_kg": 3,
    "actual_weight_kg": null,
    "status": "draft",
    "address": "Jl. Contoh No. 12",
    "latitude": -6.2,
    "longitude": 106.8,
    "district": "Kebayoran",
    "city": "Jakarta Selatan",
    "province": "DKI Jakarta",
    "available_from": "2026-06-22T08:00:00.000Z",
    "available_until": "2026-06-25T18:00:00.000Z",
    "notes": "Ambil pagi hari",
    "pickup_fee": 0,
    "claimed_by": null,
    "claimed_at": null,
    "picked_up_at": null,
    "sorted_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "created_at": "2026-06-22T00:00:00.000Z",
    "updated_at": "2026-06-22T00:00:00.000Z",
    "category": {
      "id": "uuid",
      "code": "PLASTIC_PET",
      "name": "Botol PET"
    },
    "images": [
      {
        "id": "uuid",
        "listing_id": "uuid",
        "image_path": "waste-images/...",
        "is_primary": true,
        "sort_order": 0,
        "created_at": "2026-06-22T00:00:00.000Z"
      }
    ]
  }
}
```

**Errors**

- `403 INSUFFICIENT_ROLE` — non-household role
- `404 CATEGORY_NOT_FOUND` — invalid or inactive category
- `404 CLASSIFICATION_NOT_FOUND` — classification missing or not owned by user
- `403 STORAGE_ACCESS_DENIED` — image path does not belong to user

### `GET /waste-listings` (household | collector)

Returns paginated listings with role-aware visibility.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Query**

| Param | Description |
|-------|-------------|
| `status` | Filter by status (household only; collector always sees `available`) |
| `category_id` | Filter by waste category |
| `page` | Page number (default `1`) |
| `limit` | Page size (default `20`, max `100`) |

**Visibility**

- **Household:** own listings across all statuses
- **Collector:** `available` listings whose `category_id` is in the collector's active handled categories
- **Industry:** denied (`403 INSUFFICIENT_ROLE`)

**Response**

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

Each item uses the same shape as `POST /waste-listings` response `data`.

### `GET /waste-listings/:id` (authenticated, role-aware)

Returns a single listing if the requester is allowed to view it.

**Visibility**

- **Household:** own listings or any listing with status `available`
- **Collector:** listings with status `available` or listings claimed by the collector
- **Industry:** denied (`403 INSUFFICIENT_ROLE`)

**Errors**

- `404 LISTING_NOT_FOUND` — missing or not visible to requester

### `PATCH /waste-listings/:id` (household)

Updates a draft listing owned by the authenticated household user. Status cannot be changed via this endpoint.

**Body:** same fields as create, all optional. Passing `imagePaths` replaces all attached images.

**Errors**

- `400 LISTING_NOT_EDITABLE` — listing is not in `draft` status
- `404 LISTING_NOT_FOUND` — missing or not owned by user

### `POST /waste-listings/:id/publish` (household)

Publishes a draft listing to `available` after readiness validation.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Readiness requirements**

- At least one attached image
- `estimated_weight_kg` > 0
- Valid `latitude` and `longitude`

**Response:** same `data` shape as create listing, with `status: "available"`.

**Errors**

- `404 LISTING_NOT_FOUND` — missing or not owned by household
- `409 ALREADY_PUBLISHED` — listing is no longer in `draft`
- `400 LISTING_NOT_READY` — readiness validation failed (`issues` array included)

### `POST /waste-listings/:id/cancel` (household | collector)

Cancels a listing and records an optional reason.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body**

```json
{
  "reason": "Tidak jadi dijemput"
}
```

**Rules**

- **Household:** may cancel own listings in `draft` or `available`
- **Collector:** may cancel listings in `claimed` or `pickup_planned` that they claimed

**Response:** listing `data` with `status: "cancelled"` and `cancel_reason` when provided.

**Errors**

- `404 LISTING_NOT_FOUND` — missing or not visible to actor
- `400 CANNOT_CANCEL` — status not allowed for the actor role
- `403 INSUFFICIENT_ROLE` — industry or other roles

## Routes

### `POST /routes/preview` (collector)

Calculates an optimized pickup route and cost estimate without persisting to the database. Listings must be in `claimed` status and claimed by the authenticated collector.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body**

```json
{
  "listingIds": [
    "uuid-1",
    "uuid-2"
  ]
}
```

**Validation:** `listingIds` — array of 1–20 unique UUIDs.

**Response**

```json
{
  "success": true,
  "data": {
    "collectorBase": {
      "latitude": -7.2575,
      "longitude": 112.7521
    },
    "orderedStops": [
      {
        "listingId": "uuid-1",
        "sequenceNumber": 1,
        "distanceFromPreviousKm": 1.234,
        "latitude": -7.26,
        "longitude": 112.75,
        "estimated_weight_kg": 5,
        "address": "Jl. Contoh 1"
      },
      {
        "listingId": "uuid-2",
        "sequenceNumber": 2,
        "distanceFromPreviousKm": 2.456,
        "latitude": -7.27,
        "longitude": 112.76,
        "estimated_weight_kg": 3,
        "address": "Jl. Contoh 2"
      }
    ],
    "totalDistanceKm": 3.69,
    "estimatedDurationMinutes": 31,
    "totalWeightKg": 8,
    "costEstimation": {
      "baseFee": 5000,
      "distanceCost": 7380,
      "handlingCost": 2400,
      "totalCost": 14800,
      "breakdown": {
        "baseFee": 5000,
        "distanceFee": 7380,
        "handlingFee": 2400
      },
      "configUsed": {
        "baseFee": 5000,
        "costPerKm": 2000,
        "handlingCostPerKg": 300
      }
    },
    "isPreview": true
  }
}
```

**Rules**

- No database writes; preview only.
- Route uses nearest-neighbor optimization from collector base coordinates.
- Duration estimate: `round(totalDistanceKm × 3 + stopCount × 10)` minutes.
- Cost uses `ROUTE_BASE_FEE`, `ROUTE_COST_PER_KM`, and `ROUTE_HANDLING_COST_PER_KG` env values; `totalCost` rounded up to nearest 100 IDR.

**Errors**

- `400 COLLECTOR_BASE_NOT_SET` — collector profile has no base coordinates
- `400 LISTINGS_NOT_ELIGIBLE` — one or more listings not found, wrong status, or not claimed by collector (`details` array per listing)
- `400 VALIDATION_ERROR` — invalid body (e.g. empty array, >20 IDs, duplicate UUIDs)
- `403 INSUFFICIENT_ROLE` — non-collector role

### `POST /routes` (collector)

Commits a pickup route: persists `pickup_routes` and `pickup_route_stops`, transitions each listing from `claimed` to `pickup_planned`, and links `pickup_claims.route_id`. Reuses the same validation and optimization as preview.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body**

```json
{
  "listingIds": [
    "uuid-1",
    "uuid-2"
  ],
  "notes": "Optional route notes"
}
```

**Validation:** `listingIds` — array of 1–20 unique UUIDs; `notes` optional (max 1000 chars).

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "collector_id": "uuid",
    "status": "planned",
    "total_distance_km": 3.69,
    "estimated_duration_minutes": 31,
    "total_weight_kg": 8,
    "estimated_cost": 14800,
    "actual_cost": null,
    "started_at": null,
    "completed_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "notes": "Optional route notes",
    "created_at": "2026-06-22T00:00:00.000Z",
    "updated_at": "2026-06-22T00:00:00.000Z",
    "stops": [
      {
        "id": "uuid",
        "route_id": "uuid",
        "listing_id": "uuid-1",
        "sequence_number": 1,
        "distance_from_previous_km": 1.234,
        "estimated_arrival_minutes": 14,
        "status": "pending",
        "arrived_at": null,
        "completed_at": null,
        "notes": null
      }
    ]
  }
}
```

**Side effects**

- Inserts `pickup_routes` row with `status: planned`
- Inserts ordered `pickup_route_stops` rows
- Each listing: `claimed` → `pickup_planned`
- Each `pickup_claims` row: `route_id` set, `status` → `pickup_planned`, `pickup_scheduled_at` set

**Errors**

- Same eligibility errors as `POST /routes/preview`
- `400 CLAIM_NOT_FOUND` — no active claim for a listing
- `500 ROUTE_CREATE_FAILED` / `ROUTE_STOPS_CREATE_FAILED` / `CLAIM_ROUTE_LINK_FAILED` — persistence failure

### `GET /routes/:id` (collector, household)

Returns a persisted pickup route with stops.

**Access**

- **Collector:** route `collector_id` must match authenticated user
- **Household:** at least one stop `listing_id` must belong to the authenticated household
- Other roles receive `404 ROUTE_NOT_FOUND` (no existence leak)

**Response:** same `PickupRoute` shape as `POST /routes` commit response.

**Errors**

- `404 ROUTE_NOT_FOUND` — missing route or not visible to requester
- `403 INSUFFICIENT_ROLE` — industry or other roles

### `PATCH /routes/:id/status` (collector)

Updates pickup route status. Collector must own the route.

**Body**

```json
{
  "status": "ongoing",
  "cancel_reason": "Optional when status is cancelled"
}
```

**Allowed transitions**

| From | To | Side effects |
|------|-----|--------------|
| `planned` | `ongoing` | Sets `started_at` |
| `planned` \| `ongoing` | `cancelled` | Sets `cancelled_at`; `pickup_planned` listings on pending/arrived stops revert to `claimed` (pickup claims unchanged) |
| `ongoing` | `completed` | Sets `completed_at`; pending/arrived stop listings transition to `picked_up` |

**Response:** updated `PickupRoute` with stops.

**Errors**

- `404 ROUTE_NOT_FOUND`
- `400 INVALID_ROUTE_TRANSITION`
- `400 LISTING_NOT_REVERTIBLE` — cancel attempted but listing not in `pickup_planned`

### `PATCH /routes/:id/stops/:stopId/status` (collector)

Updates an individual route stop status. Collector must own the route.

**Body**

```json
{
  "status": "arrived",
  "notes": "Optional stop notes"
}
```

**Allowed stop transitions**

| From | To | Side effects |
|------|-----|--------------|
| `pending` | `arrived` | Sets `arrived_at` |
| `pending` \| `arrived` | `completed` | Sets `completed_at`; listing → `picked_up` |
| `pending` \| `arrived` | `skipped` | No listing status change |

**Response:** updated `PickupRoute` with stops.

**Errors**

- `404 ROUTE_NOT_FOUND` / `ROUTE_STOP_NOT_FOUND`
- `400 INVALID_STOP_TRANSITION`

### `POST /routes/:id/recalculate` (collector)

Re-optimizes remaining stops (`pending` or `arrived`) for a `planned` or `ongoing` route, then updates sequence numbers, distances, duration, weight, and estimated cost. Completed/skipped stops keep their relative order at the front of the route.

**Response:** updated `PickupRoute` with stops.

**Errors**

- `404 ROUTE_NOT_FOUND`
- `400 ROUTE_NOT_RECALCULABLE` — route is `completed` or `cancelled`
- `400 ROUTE_NO_REMAINING_STOPS` — all stops are completed or skipped
- `400 COLLECTOR_BASE_NOT_SET`

### Apply pickup routes migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/007_pickup_routes.sql
```

### Apply waste listings migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/005_waste_listings.sql
```

## Material Batches

Collector material batches link sorted waste listings into sellable raw-material inventory.

### `POST /collector/material-batches` (collector)

Creates a draft material batch from picked-up waste listings. At least one `sourceListingIds` entry is required (batch `total_weight_kg` must be > 0).

**Body**

```json
{
  "category_id": "uuid",
  "name": "Plastik PET Batch Juni",
  "description": "Hasil sortir minggu ini",
  "price_per_kg": 3500,
  "min_order_kg": 10,
  "location_address": "Gudang collector",
  "city": "Surabaya",
  "province": "Jawa Timur",
  "sourceListingIds": ["uuid-1", "uuid-2"]
}
```

**Side effects**

- Inserts `material_batches` row with `status: draft`
- Resolves source weights from listing `actual_weight_kg` or `estimated_weight_kg`
- Links sources and transitions eligible listings `picked_up` → `sorting`

**Response:** `MaterialBatchWithDetails` with `sources`, `source_summary`, and nested `listing` per source.

**Errors**

- `400 CATEGORY_NOT_FOUND`
- `400 BATCH_REQUIRES_SOURCES`
- `400 LISTING_NOT_ELIGIBLE` / `LISTING_NOT_OWNED` / `LISTING_CATEGORY_MISMATCH`
- `404 LISTING_NOT_FOUND`
- `409 BATCH_SOURCE_ALREADY_EXISTS`

### `GET /collector/material-batches` (collector)

Lists batches for the authenticated collector.

**Query:** `status` (optional) — `draft` | `available` | `ordered` | `negotiating` | `sold` | `unavailable`

### `GET /collector/material-batches/:id` (collector)

Returns batch details with sources and linked listing summary fields.

**Errors**

- `404 MATERIAL_BATCH_NOT_FOUND`

### `PATCH /collector/material-batches/:id` (collector)

Updates a draft batch (pricing, location, notes, etc.). Only `status: draft` batches are editable.

**Errors**

- `404 MATERIAL_BATCH_NOT_FOUND`
- `400 BATCH_NOT_EDITABLE`

### `POST /collector/material-batches/:id/sources` (collector)

Adds waste listing sources to an existing batch.

**Body**

```json
{
  "sources": [
    {
      "listingId": "uuid",
      "weightKg": 12.5,
      "notes": "Kantong biru"
    }
  ]
}
```

**Rules**

- Listing must be `picked_up`, `sorting`, or `sorted`
- Listing must be claimed by collector and match batch `category_id`
- `picked_up` listings transition to `sorting` when added
- Batch `total_weight_kg` is recomputed from all sources

### `POST /collector/material-batches/:id/sorting-complete` (collector)

Marks sorting complete for batch sources: transitions linked listings in `sorting` → `sorted`. Batch status is unchanged.

**Errors**

- `404 MATERIAL_BATCH_NOT_FOUND`

### Apply material batches migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/008_material_batches.sql
```

## Material Marketplace

Public marketplace listings for available material batches. Responses are privacy-safe: no household identities, listing titles, or pickup addresses from source waste.

### `GET /materials` (industry, collector)

Lists published material batches with `status: available`.

**Query**

| Param | Type | Description |
|-------|------|-------------|
| `category_id` | UUID | Filter by waste category |
| `city` | string | Partial match on batch `city` |
| `province` | string | Partial match on batch `province` |
| `min_weight_kg` | number | Minimum `total_weight_kg` |
| `max_price_per_kg` | number | Maximum `price_per_kg` |
| `sort` | `published_at` \| `price_per_kg` | Default: newest `published_at` first; `price_per_kg` sorts lowest price first |
| `page` | integer | Default `1` |
| `limit` | integer | Default `20`, max `50` |

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "collector_id": "uuid",
        "category_id": "uuid",
        "name": "Plastik PET Batch Juni",
        "total_weight_kg": 120,
        "price_per_kg": 3500,
        "min_order_kg": 10,
        "status": "available",
        "city": "Surabaya",
        "province": "Jawa Timur",
        "published_at": "2026-06-22T00:00:00.000Z",
        "category": {
          "id": "uuid",
          "code": "PLASTIC_PET",
          "name": "Botol PET",
          "unit": "kg"
        },
        "collector": {
          "display_name": "Collector Jaya",
          "rating_average": 4.5
        }
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### `GET /materials/:id` (industry, collector)

Returns a single available material batch with category and collector summary. Source summary includes only aggregate data.

**Response `source_summary`**

```json
{
  "source_count": 8,
  "cities": ["Malang", "Surabaya"]
}
```

No individual household names, listing titles, or addresses are exposed.

**Errors**

- `404 MATERIAL_BATCH_NOT_FOUND` — missing or not `available`
- `403 INSUFFICIENT_ROLE` — household or other roles

## Orders

Industry orders for collector material batches. Orders link an industry buyer to a published batch with negotiated weight and pricing.

### `POST /orders` (industry)

Creates an order against an `available` material batch. Batch transitions to `ordered`.

**Body**

```json
{
  "batchId": "uuid",
  "requested_weight_kg": 50,
  "offered_price_per_kg": 3400,
  "notes": "Butuh pengiriman minggu depan"
}
```

**Rules**

- `requested_weight_kg` must be `<= batch.total_weight_kg` and `>= batch.min_order_kg`
- Emits traceability event `order_created`

**Response:** `OrderWithDetails` including nested `batch` summary.

**Errors**

- `404 MATERIAL_BATCH_NOT_FOUND`
- `400 BATCH_NOT_ORDERABLE` — batch not `available`
- `400 ORDER_WEIGHT_EXCEEDS_BATCH`
- `400 ORDER_WEIGHT_BELOW_MINIMUM`

### `GET /orders` (industry, collector)

Lists orders visible to the requester.

- **Industry:** own orders (`industry_id`)
- **Collector:** orders for own batches (`collector_id`)

**Query:** `status` (optional) — `created` | `negotiating` | `accepted` | `rejected` | `cancelled` | `completed`

### `GET /orders/:id` (industry, collector)

Returns order details if the requester owns the order (industry) or the batch (collector).

**Errors**

- `404 ORDER_NOT_FOUND`

### `PATCH /orders/:id/status` (industry, collector)

Transitions order status with role-based permissions.

**Body**

```json
{
  "status": "accepted",
  "final_price_per_kg": 3350,
  "final_weight_kg": 48,
  "cancel_reason": "Required when rejecting"
}
```

**Role permissions**

| Role | Allowed transitions |
|------|---------------------|
| Industry | `created` → `negotiating`, `cancelled`; `accepted` → `cancelled` |
| Collector | `created` → `accepted`, `rejected`; `negotiating` → `accepted`, `rejected`; `accepted` → `completed` |

**Rules**

- `rejected` requires `cancel_reason`
- `accepted` requires `final_price_per_kg` and `final_weight_kg`; sets `total_amount`
- `completed` marks linked batch as `sold` (via batch status sync)

**Errors**

- `404 ORDER_NOT_FOUND`
- `400 INVALID_ORDER_TRANSITION`
- `400 ORDER_REJECT_REASON_REQUIRED`
- `400 ORDER_ACCEPT_DATA_REQUIRED`
- `403 INSUFFICIENT_ROLE`

### Apply orders migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/009_orders.sql
```

## Negotiation Chat

Realtime negotiation between industry buyers and collectors for an order. Messages are stored in `negotiation_messages`; INSERT events can be streamed via Supabase Realtime (see [../realtime.md](../realtime.md)).

### `POST /orders/:orderId/negotiation` (industry)

Starts or resumes negotiation for an order in `created` or `negotiating` status.

**Response:** `NegotiationThreadWithDetails` (thread, messages, offers).

**Side effects**

- Creates thread with `expires_at` = now + 24h (refreshed if thread already active)
- System message: `Negosiasi dimulai`
- Order status → `negotiating` (when starting from `created`)

**Errors**

- `404 ORDER_NOT_FOUND`
- `403 INSUFFICIENT_ROLE`
- `400 NEGOTIATION_START_INVALID_ORDER`
- `400 NEGOTIATION_INVALID_STATE`

### `GET /negotiations/:id` (industry, collector)

Returns negotiation thread with full message and offer history. Party-only access.

**Errors**

- `404 NEGOTIATION_THREAD_NOT_FOUND`

### `GET /negotiations/:id/messages` (industry, collector)

Paginated messages, newest first.

**Query**

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | `50` | Max 100 |
| `before` | — | ISO timestamp cursor (`created_at` less than) |

**Response:** `NegotiationMessage[]`

### `POST /negotiations/:id/messages` (industry, collector)

Sends a text chat message. INSERT on `negotiation_messages` triggers Supabase Realtime on channel `negotiation:{threadId}`.

**Body**

```json
{
  "content": "Bisa dikirim minggu depan?"
}
```

**Response:** `NegotiationMessage`

**Errors**

- `404 NEGOTIATION_THREAD_NOT_FOUND`
- `400 NEGOTIATION_INVALID_STATE`
- `400 NEGOTIATION_THREAD_EXPIRED`

### `POST /negotiations/:id/offers` (industry, collector)

Sends an offer (industry) or counter-offer (collector).

**Body**

```json
{
  "price_per_kg": 3350,
  "weight_kg": 48
}
```

**Response:** `NegotiationThreadWithDetails`

**Errors**

- `403 INSUFFICIENT_ROLE` — wrong role for party
- `400 NEGOTIATION_CANNOT_ACCEPT_OWN_OFFER` — N/A here
- `400 NEGOTIATION_THREAD_EXPIRED`
- `400 NEGOTIATION_WEIGHT_EXCEEDS_BATCH`
- `400 NEGOTIATION_WEIGHT_BELOW_MINIMUM`

### `POST /negotiations/:id/accept` (industry, collector)

Accepts the latest pending offer. Acceptor must not be `last_offer_by`.

**Response:** `NegotiationThreadWithDetails`

**Side effects**

- Thread and order → `accepted` with agreed price/weight
- System message: `Penawaran diterima`
- Traceability event: `deal_accepted`

**Errors**

- `400 NEGOTIATION_CANNOT_ACCEPT_OWN_OFFER`
- `400 NEGOTIATION_NO_PENDING_OFFER`
- `400 NEGOTIATION_THREAD_EXPIRED`

### `POST /negotiations/:id/cancel` (industry, collector)

Cancels an active negotiation.

**Body**

```json
{
  "reason": "Jadwal tidak cocok"
}
```

**Response:** `NegotiationThreadWithDetails`

**Side effects**

- Thread → `cancelled`; pending offers → `cancelled`
- Order → `cancelled`
- Linked batch → `available`

**Errors**

- `400 NEGOTIATION_INVALID_STATE`

### `GET /orders/:orderId/negotiation/history` (industry, collector)

Returns the full negotiation thread for an order with messages and offers in chronological order (oldest first). Party-only access.

**Response:** `NegotiationThreadWithDetails`

```json
{
  "id": "uuid",
  "order_id": "uuid",
  "status": "countered",
  "messages": [
    { "message_type": "system", "content": "Negosiasi dimulai", "created_at": "..." },
    { "message_type": "offer", "offer_price_per_kg": 3300, "created_at": "..." }
  ],
  "offers": [
    { "status": "countered", "price_per_kg": 3300, "created_at": "..." },
    { "status": "pending", "price_per_kg": 3350, "created_at": "..." }
  ]
}
```

**Errors**

- `404 ORDER_NOT_FOUND` — order missing or requester is not a party
- `404 NEGOTIATION_HISTORY_NOT_FOUND` — no thread exists for the order

**Audit**

Negotiation actions persist audit log entries via `AuditService` (`action: negotiation.<action>`). Counter-party in-app notifications are sent on offer and acceptance.

### Apply negotiation migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/010_negotiation.sql
```

---

## Realtime channel authorization

Secure Supabase Realtime subscriptions for negotiation chat. See also [../realtime.md](../realtime.md).

### `POST /realtime/channel-auth` (industry, collector)

Verifies that the authenticated user is a party on the negotiation thread encoded in `channelName` before the client subscribes to Realtime.

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Body**

```json
{
  "channelName": "negotiation:a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response — authorized**

```json
{
  "success": true,
  "data": {
    "authorized": true,
    "token": "<supabase_access_jwt>"
  }
}
```

**Response — not a party or unknown channel**

```json
{
  "success": true,
  "data": {
    "authorized": false
  }
}
```

**Validation**

- `channelName` must match `negotiation:{uuid}`.

**Notes**

- `token` is the same Supabase access JWT from the `Authorization` header; clients should use it when creating a user-scoped Supabase client so RLS on `negotiation_messages` applies.
- Only `negotiation:{threadId}` channels are supported; other names return `authorized: false`.
- Prefer calling this endpoint (or `GET /negotiations/:id`) before subscribing; never open Realtime channels without a membership check.

### Apply RLS migration

Row Level Security for direct Supabase client access (including Realtime) is defined in `016_rls_policies.sql`. From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/016_rls_policies.sql
```

---

## Transactions (Simulation)

> **WARNING:** Simulation only. No real money is processed.

Simulated payment records for accepted orders. One transaction per order (`order_id` UNIQUE). Payment references use the `SIM-` prefix to indicate demo mode.

### Table: `public.transactions`

- `id` (uuid, PK)
- `order_id` (uuid, NOT NULL, UNIQUE) — FK to `public.orders(id)` on delete cascade
- `industry_id` (uuid, NOT NULL) — FK to `public.user_profiles(id)`
- `collector_id` (uuid, NOT NULL) — FK to `public.user_profiles(id)`
- `batch_id` (uuid, NOT NULL) — FK to `public.material_batches(id)`
- `amount` (decimal, NOT NULL) — `final_weight_kg × final_price_per_kg` (rounded)
- `status` (text, default `simulated_pending`) — one of `simulated_pending`, `simulated_paid`, `completed`, `cancelled`
- `payment_method` (text, default `simulation`)
- `payment_reference` (text, nullable) — e.g. `SIM-1710000000000-550E8400`
- `notes` (text, nullable)
- `simulated_at`, `completed_at`, `cancelled_at` (timestamptz, nullable)
- `created_at` (timestamptz, default `now()`)

Indexes: `order_id`, `industry_id`, `collector_id`, `status`.

### `POST /orders/:id/transactions/simulate` (industry)

Creates a simulated payment record for an accepted order. Only the ordering industry may call this endpoint.

**Response:** `Transaction`

```json
{
  "id": "uuid",
  "order_id": "uuid",
  "industry_id": "uuid",
  "collector_id": "uuid",
  "batch_id": "uuid",
  "amount": 160800,
  "status": "simulated_pending",
  "payment_method": "simulation",
  "payment_reference": "SIM-1710000000000-550E8400",
  "simulated_at": "2026-06-22T10:00:00.000Z",
  "completed_at": null,
  "cancelled_at": null,
  "created_at": "2026-06-22T10:00:00.000Z"
}
```

**Errors**

- `404 ORDER_NOT_FOUND`
- `403 INSUFFICIENT_ROLE` — caller is not the ordering industry
- `400 TRANSACTION_SIMULATE_INVALID_ORDER` — order is not `accepted`
- `400 TRANSACTION_MISSING_FINAL_VALUES` — order lacks agreed price/weight
- `400 TRANSACTION_ALREADY_EXISTS` — one transaction per order

### `POST /transactions/:id/complete` (industry, collector)

Marks a simulated transaction as completed. Either party (industry or collector) may complete. Uses optimistic status checks on transaction, order, and batch rows.

**Response:** `Transaction` with `status: "completed"`

**Side effects**

- Transaction → `completed` with `completed_at`
- Linked order → `completed` with `completed_at`
- Linked material batch → `sold` with `sold_at`
- Traceability event: `transaction_completed`

**Errors**

- `404 TRANSACTION_NOT_FOUND` — missing or requester is not a party
- `400 TRANSACTION_INVALID_STATE` — not `simulated_pending` or `simulated_paid`
- `400 TRANSACTION_COMPLETE_INVALID_ORDER` — order is not `accepted`
- `400 INVALID_BATCH_TRANSITION` — batch cannot transition to `sold`

### `GET /transactions` (industry, collector)

Lists transactions for the authenticated party. Industry sees orders they placed; collector sees orders on their batches.

**Response:** `Transaction[]`

**Errors**

- `403 INSUFFICIENT_ROLE` — role other than industry or collector

### Apply transaction migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/011_transactions.sql
```

## Traceability (PACUL Track)

Timeline endpoints that connect waste listings, material batches, and orders. Responses use city-level location data only — exact household addresses are never exposed to industry viewers.

All endpoints require authentication.

### `GET /traceability/material/:batchId` (collector, industry)

Returns the full material batch timeline with linked waste sources, orders, events, and a privacy-safe `chain_summary`.

**Access**

- Collector who owns the batch
- Industry user who placed an order on the batch

**Response:** `MaterialTrackTimeline`

```json
{
  "batch": {
    "id": "uuid",
    "collector_id": "uuid",
    "category_id": "uuid",
    "name": "Sorted cardboard batch",
    "status": "sold",
    "total_weight_kg": 120,
    "price_per_kg": 5000,
    "published_at": "2026-06-20T08:00:00.000Z",
    "sold_at": "2026-06-22T10:00:00.000Z",
    "created_at": "2026-06-19T12:00:00.000Z"
  },
  "batchEvents": [],
  "sources": [
    {
      "listing": {
        "id": "uuid",
        "category_id": "uuid",
        "title": "Cardboard bundle",
        "status": "converted_to_material",
        "estimated_weight_kg": 120,
        "actual_weight_kg": 118,
        "city": "Bandung",
        "created_at": "2026-06-17T09:00:00.000Z"
      },
      "listingEvents": []
    }
  ],
  "orders": [
    {
      "order": {
        "id": "uuid",
        "industry_id": "uuid",
        "collector_id": "uuid",
        "batch_id": "uuid",
        "status": "completed",
        "requested_weight_kg": 120,
        "final_weight_kg": 118,
        "final_price_per_kg": 5200,
        "total_amount": 613600,
        "created_at": "2026-06-20T09:00:00.000Z"
      },
      "orderEvents": []
    }
  ],
  "chain_summary": {
    "waste_sources": [
      {
        "listingId": "uuid",
        "householdCity": "Bandung",
        "weightKg": 118,
        "uploadedAt": "2026-06-17T09:00:00.000Z"
      }
    ],
    "collection": {
      "collectorName": "Eco Collect Bandung",
      "pickedUpAt": "2026-06-18T16:00:00.000Z",
      "routeId": "uuid"
    },
    "processing": {
      "sortedAt": "2026-06-19T14:00:00.000Z",
      "batchCreatedAt": "2026-06-19T12:00:00.000Z"
    },
    "market": {
      "listedAt": "2026-06-20T08:00:00.000Z",
      "orderedAt": "2026-06-20T09:00:00.000Z"
    },
    "transaction": {
      "agreedPricePerKg": 5200,
      "completedAt": "2026-06-22T10:00:00.000Z"
    }
  }
}
```

**Privacy notes**

- `chain_summary.waste_sources` exposes `householdCity` only (no street address)
- Industry viewers do not receive `household_id` on source listings

**Errors**

- `404 MATERIAL_BATCH_NOT_FOUND` — batch missing or caller is not authorized

### `GET /traceability/waste/:listingId` (household, collector, industry)

Returns the waste listing journey with listing events and linked material batch events.

**Access**

- Household owner of the listing
- Collector who claimed the listing
- Any authenticated role once the listing journey is completed (`converted_to_material` or linked order `completed`)

**Response:** `WasteListingJourney`

```json
{
  "listing": {
    "id": "uuid",
    "household_id": "uuid",
    "category_id": "uuid",
    "title": "Cardboard bundle",
    "status": "picked_up",
    "estimated_weight_kg": 120,
    "actual_weight_kg": 118,
    "city": "Bandung",
    "created_at": "2026-06-17T09:00:00.000Z"
  },
  "events": [],
  "materialBatches": [
    {
      "batchId": "uuid",
      "batchEvents": []
    }
  ]
}
```

**Errors**

- `404 LISTING_NOT_FOUND` — listing missing or caller is not authorized

### `GET /traceability/order/:orderId` (industry, collector)

Returns order timeline events plus linked material batch events.

**Access**

- Industry user who created the order
- Collector who owns the linked batch

**Response:** `OrderTrackTimeline`

```json
{
  "order": {
    "id": "uuid",
    "industry_id": "uuid",
    "collector_id": "uuid",
    "batch_id": "uuid",
    "status": "completed",
    "requested_weight_kg": 120,
    "final_weight_kg": 118,
    "final_price_per_kg": 5200,
    "total_amount": 613600,
    "created_at": "2026-06-20T09:00:00.000Z"
  },
  "orderEvents": [],
  "batch": {
    "id": "uuid",
    "collector_id": "uuid",
    "category_id": "uuid",
    "name": "Sorted cardboard batch",
    "status": "sold",
    "total_weight_kg": 120,
    "price_per_kg": 5000,
    "published_at": "2026-06-20T08:00:00.000Z",
    "sold_at": "2026-06-22T10:00:00.000Z",
    "created_at": "2026-06-19T12:00:00.000Z"
  },
  "batchEvents": []
}
```

Order events include both order entity events and events linked to the order (for example `deal_accepted`, `transaction_completed`).

**Errors**

- `404 ORDER_NOT_FOUND` — order missing or caller is not authorized

## Database Schema — Ratings

### Table: `public.ratings_reviews`

Post-pickup and post-transaction ratings between platform actors. One rating per rater/ratee/context combination.

- `id` (uuid, PK).
- `rater_id` (uuid, FK → `user_profiles.id`) — user submitting the rating.
- `ratee_id` (uuid, FK → `user_profiles.id`) — user being rated.
- `rating` (integer, 1–5) — star score.
- `review_text` (text, nullable) — optional written feedback.
- `context_type` (text) — `pickup` or `transaction`.
- `context_id` (uuid) — pickup claim id (`pickup`) or order id (`transaction`).
- `created_at` (timestamptz, default `now()`).

Constraints:

- `UNIQUE (rater_id, ratee_id, context_type, context_id)` — prevents double rating for the same context.

Indexes: `ratee_id`, `rater_id`, `context_type`, `context_id`.

Profile aggregates on `collector_profiles` and `industry_profiles` (`rating_average`, `rating_count`) are updated automatically when a rating is submitted.

### Apply ratings migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/013_ratings.sql
```

## Endpoints — Ratings

### `POST /ratings` (household, collector, industry)

Submit a rating after a completed pickup or transaction. Only participants in the rated context may submit.

**Request body**

```json
{
  "rateeId": "uuid",
  "rating": 5,
  "reviewText": "Pickup tepat waktu dan komunikasi jelas.",
  "contextType": "pickup",
  "contextId": "uuid"
}
```

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `rateeId` | uuid | yes | User being rated |
| `rating` | integer | yes | 1–5 |
| `reviewText` | string | no | Max 1000 characters |
| `contextType` | string | yes | `pickup` or `transaction` |
| `contextId` | uuid | yes | Pickup claim id or order id |

**Context rules**

- `pickup`: household ↔ collector; pickup claim must have `status: "picked_up"`.
- `transaction`: industry ↔ collector; order must have `status: "completed"`.

**Response:** `RatingReview`

```json
{
  "id": "uuid",
  "raterId": "uuid",
  "rateeId": "uuid",
  "rating": 5,
  "reviewText": "Pickup tepat waktu dan komunikasi jelas.",
  "contextType": "pickup",
  "contextId": "uuid",
  "createdAt": "2026-06-22T12:00:00.000Z"
}
```

**Side effects**

- Updates `rating_average` and `rating_count` on the ratee profile when ratee is a collector or industry user.
- Traceability event: `rating_submitted`.

**Errors**

- `400 RATING_SELF_NOT_ALLOWED` — rater and ratee are the same user
- `400 RATING_PICKUP_NOT_COMPLETED` — pickup claim is not `picked_up`
- `400 RATING_ORDER_NOT_COMPLETED` — order is not `completed`
- `400 RATING_INVALID_PARTIES` — ratee is not the counterparty for the context
- `403 RATING_CONTEXT_FORBIDDEN` — role cannot rate in this context (e.g. industry on pickup)
- `403 RATING_NOT_PARTICIPANT` — caller is not a party to the context
- `404 RATING_CONTEXT_NOT_FOUND` — pickup claim or order not found
- `404 RATEE_NOT_FOUND` — ratee profile missing
- `409 RATING_ALREADY_EXISTS` — duplicate rating for same context

### `GET /ratings/summary/:actorId` (public)

Returns aggregated rating data for a user (collector, industry, or household). No authentication required.

**Response:** `RatingSummary`

```json
{
  "average": 4.5,
  "count": 12,
  "distribution": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 6
  },
  "recentReviews": [
    {
      "id": "uuid",
      "raterId": "uuid",
      "rateeId": "uuid",
      "rating": 5,
      "reviewText": "Pickup tepat waktu.",
      "contextType": "pickup",
      "contextId": "uuid",
      "createdAt": "2026-06-22T12:00:00.000Z"
    }
  ]
}
```

**Errors**

- `500 RATING_SUMMARY_LOAD_FAILED` — database query failed

## Endpoints — Dashboard

Role-aware dashboard summary for the authenticated user. Responses are cached for 60 seconds via `Cache-Control: max-age=60`.

### `GET /dashboard/summary` (household, collector, industry)

Returns a compact operational summary tailored to the caller's role. The backend dispatches on `req.user.role`; each role receives a different payload shape.

**Headers**

- `Cache-Control: max-age=60`

**Response:** `HouseholdSummary` | `CollectorSummary` | `IndustrySummary`

#### Household (`role: "household"`)

```json
{
  "role": "household",
  "counts": {
    "total_listings": 8,
    "active_listings": 3,
    "waiting_pickup": 1,
    "picked_up": 2,
    "completed": 2,
    "cancelled": 0
  },
  "weights": {
    "total_estimated_kg": 42.5,
    "total_actual_kg": 18.0,
    "collected_kg": 18.0
  },
  "costs": {
    "total_pickup_fees_idr": 75000
  },
  "ratings": {
    "average": 4.5,
    "count": 2
  },
  "recent_listings": [
    {
      "id": "uuid",
      "title": "Plastik PET bersih",
      "status": "available",
      "estimated_weight_kg": 5.5,
      "actual_weight_kg": null,
      "city": "Bandung",
      "created_at": "2026-06-22T08:00:00.000Z"
    }
  ]
}
```

| Field group | Notes |
| ----------- | ----- |
| `counts.active_listings` | `draft`, `available`, `claimed`, `pickup_planned` |
| `counts.waiting_pickup` | `claimed`, `pickup_planned` |
| `counts.picked_up` | `picked_up`, `sorting`, `sorted` |
| `counts.completed` | `converted_to_material` |
| `weights.collected_kg` | Sum of actual (or estimated) weight for collected lifecycle statuses |
| `ratings` | Aggregated from `ratings_reviews` where user is `ratee_id` |

#### Collector (`role: "collector"`)

```json
{
  "role": "collector",
  "counts": {
    "active_claims": 2,
    "planned_routes": 1,
    "ongoing_routes": 0,
    "available_batches": 3,
    "completed_pickups": 12
  },
  "weights": {
    "total_kg_collected": 240.5,
    "material_stock_kg": 85.0
  },
  "distances": {
    "total_route_distance_km": 48.25,
    "today_planned_distance_km": 12.5
  },
  "costs": {
    "total_estimated_route_cost_idr": 320000,
    "today_estimated_route_cost_idr": 85000
  },
  "ratings": {
    "average": 4.2,
    "count": 15
  },
  "recent_claims": [
    {
      "id": "uuid",
      "listing_id": "uuid",
      "status": "claimed",
      "claimed_at": "2026-06-22T07:30:00.000Z"
    }
  ],
  "recent_routes": [
    {
      "id": "uuid",
      "status": "planned",
      "total_distance_km": 12.5,
      "total_weight_kg": 18.0,
      "estimated_cost": 85000,
      "created_at": "2026-06-22T06:00:00.000Z"
    }
  ],
  "recent_material_batches": [
    {
      "id": "uuid",
      "name": "Plastik PET cacah",
      "status": "available",
      "total_weight_kg": 25.0,
      "price_per_kg": 5200,
      "city": "Bandung",
      "created_at": "2026-06-21T15:00:00.000Z"
    }
  ]
}
```

| Field group | Notes |
| ----------- | ----- |
| `counts.completed_pickups` | From `collector_profiles.total_pickups` |
| `weights.material_stock_kg` | Sum of `total_weight_kg` for batches in `draft`, `available`, `ordered`, `negotiating` |
| `distances.today_planned_distance_km` | Routes created today (UTC) with status `planned` or `ongoing` |
| `ratings` | From `collector_profiles.rating_average` and `rating_count` |

#### Industry (`role: "industry"`)

```json
{
  "role": "industry",
  "counts": {
    "active_orders": 2,
    "open_negotiations": 1,
    "completed_orders": 5,
    "available_material_batches": 18
  },
  "weights": {
    "total_purchased_kg": 120.0,
    "pending_order_kg": 40.0
  },
  "costs": {
    "total_transaction_value_idr": 624000,
    "pending_order_value_idr": 208000
  },
  "ratings": {
    "average": 4.0,
    "count": 3
  },
  "recent_orders": [
    {
      "id": "uuid",
      "status": "negotiating",
      "requested_weight_kg": 20.0,
      "total_amount": 104000,
      "batch_name": "Plastik PET cacah",
      "created_at": "2026-06-22T09:00:00.000Z"
    }
  ],
  "recent_negotiations": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "status": "countered",
      "last_offer_price_per_kg": 5200,
      "updated_at": "2026-06-22T09:15:00.000Z"
    }
  ]
}
```

| Field group | Notes |
| ----------- | ----- |
| `counts.active_orders` | Orders in `created`, `negotiating`, `accepted` |
| `counts.open_negotiations` | Threads in `open`, `countered` |
| `counts.completed_orders` | From `industry_profiles.total_orders` |
| `counts.available_material_batches` | Platform-wide count of batches with `status: "available"` |
| `ratings` | From `industry_profiles.rating_average` and `rating_count` |

**Errors**

- `401` — missing or invalid auth token
- `400 DASHBOARD_UNSUPPORTED_ROLE` — role not supported (should not occur for standard roles)
- `500 DASHBOARD_SUMMARY_LOAD_FAILED` — aggregate query failed

**Implementation notes**

- Uses bounded parallel aggregate queries per role (no N+1 per listing/order).
- Recent lists are capped at 5 items each, ordered by most recent activity.

---

## Reports

Export PDF impact summaries and Excel data extracts. Files are generated server-side (`pdfkit`, `exceljs`), uploaded to the private Supabase Storage `reports` bucket, and tracked in `report_exports`.

**WARNING:** Transaction amounts in reports reflect **simulated payments only**. No real payment gateway is connected.

### Export expiry

- Each completed export record sets `expires_at = completed_at + REPORT_EXPORT_EXPIRES_HOURS` (default **24 hours**, env `REPORT_EXPORT_EXPIRES_HOURS`).
- After expiry, `GET /reports/:id/download` returns `410 EXPORT_EXPIRED`.
- Signed download URLs are valid for **1 hour** from issue time.

### `GET /reports` (household, collector, industry)

List the authenticated user's last **20** export records (newest first).

**Response `200`**

```json
[
  {
    "id": "uuid",
    "export_type": "pdf_impact",
    "status": "completed",
    "created_at": "2026-06-22T10:00:00.000Z",
    "completed_at": "2026-06-22T10:00:02.000Z",
    "expires_at": "2026-06-23T10:00:02.000Z",
    "file_size_bytes": 48210
  }
]
```

### `POST /reports/export/pdf` (household, collector, industry)

Generate a multi-page PDF impact report (platform metrics, role dashboard summary, top categories, notes).

**Body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `from_date` | ISO 8601 string | No | Filter listings/transactions/routes created on or after |
| `to_date` | ISO 8601 string | No | Filter created on or before |
| `city` | string | No | Filter waste listings by city |

**Response `200`**

```json
{
  "id": "uuid",
  "export_type": "pdf_impact",
  "status": "completed",
  "created_at": "2026-06-22T10:00:00.000Z",
  "completed_at": "2026-06-22T10:00:02.000Z",
  "expires_at": "2026-06-23T10:00:02.000Z",
  "file_size_bytes": 48210,
  "downloadUrl": "https://...signed-url..."
}
```

Emits traceability event `report_exported` on success.

### `POST /reports/export/excel` (household, collector, industry)

Generate an Excel workbook and upload to Storage.

**Body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `type` | `"transactions"` \| `"materials"` \| `"routes"` | Yes | Export type |
| `from_date` | ISO 8601 string | No | Date filter on `created_at` |
| `to_date` | ISO 8601 string | No | Date filter on `created_at` |

**Role access**

| `type` | Allowed roles | Data scope |
| ------ | ------------- | ---------- |
| `transactions` | industry, collector | Own transactions only |
| `materials` | collector | Own material batches + sources |
| `routes` | collector | Own pickup routes + stops |

**Sheets**

| `type` | Worksheets |
| ------ | ---------- |
| `transactions` | `Transaksi` |
| `materials` | `Material Batch`, `Sumber Material` |
| `routes` | `Rute`, `Stop Detail` |

Header rows are bold with gray fill. Transaction exports include a **simulation-only** payment disclaimer in API docs; amounts are not real settlements.

**Response `200`** — same shape as PDF export with `export_type` of `excel_transactions`, `excel_materials`, or `excel_routes`.

**Errors**

- `403 INSUFFICIENT_ROLE` — role cannot export requested type (e.g. household + transactions, industry + routes)
- `500 REPORT_*` — generation or storage failure (record marked `failed`)

### `GET /reports/:id` (household, collector, industry)

Get export metadata for an owned record.

**Response `200`**

```json
{
  "id": "uuid",
  "export_type": "pdf_impact",
  "status": "completed",
  "created_at": "2026-06-22T10:00:00.000Z",
  "completed_at": "2026-06-22T10:00:02.000Z",
  "expires_at": "2026-06-23T10:00:02.000Z",
  "file_size_bytes": 48210,
  "downloadUrl": "https://...signed-url..."
}
```

`downloadUrl` is included when `status` is `completed`, the export is not expired, and a storage path exists. Signed URL expires in **1 hour**.

**Errors**

- `404 REPORT_NOT_FOUND` — missing or not owned by caller

### `GET /reports/:id/download` (household, collector, industry)

Get a fresh signed download URL for a completed export.

**Response `200`**

```json
{
  "signedUrl": "https://...",
  "expiresAt": "2026-06-22T11:00:00.000Z"
}
```

**Errors**

- `400 EXPORT_NOT_READY` — export still `pending` or `failed`
- `410 EXPORT_EXPIRED` — `expires_at` is in the past
- `404 REPORT_NOT_FOUND` — missing or not owned

**Implementation notes**

- Requires migration `014_report_exports.sql`.
- Storage path: `{reportId}/{timestamp}_{fileName}` in the `reports` bucket.
- CO2 estimate in PDF uses `recycled_kg × 2.5` (documented approximation).
- Schedule periodic cleanup of expired storage objects in production (see `docs/backend/README.md`).

---

## Notifications & Audit Logs

In-app notifications and actor-scoped audit trail for contextual platform events. Notifications are targeted to specific users (not broadcast). Audit writes are fire-and-forget and never block the main request flow.

### Table: `public.notifications`

- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL) — FK to `public.user_profiles(id)` on delete cascade
- `type` (text, NOT NULL) — e.g. `pickup_claimed`, `negotiation_offer`, `negotiation_accepted`, `transaction_completed`
- `title` (text, NOT NULL)
- `message` (text, NOT NULL)
- `data` (jsonb, default `{}`) — contextual payload (listingId, threadId, orderId, etc.)
- `is_read` (boolean, default `false`)
- `read_at` (timestamptz, nullable)
- `created_at` (timestamptz, default `now()`)

Indexes: `user_id`, `is_read`, `created_at`, composite `(user_id, is_read, created_at)`.

### Table: `public.audit_logs`

- `id` (uuid, PK)
- `actor_id` (uuid, nullable) — FK to `public.user_profiles(id)` on delete set null
- `actor_role` (text, nullable)
- `action` (text, NOT NULL) — e.g. `pickup.claimed`, `negotiation.offer_sent`, `transaction.completed`
- `entity_type` (text, nullable)
- `entity_id` (uuid, nullable)
- `ip_address` (text, nullable)
- `user_agent` (text, nullable)
- `metadata` (jsonb, default `{}`)
- `created_at` (timestamptz, default `now()`)

Indexes: `actor_id`, `action`, `entity_id`, `created_at`.

### Contextual notification triggers

| Event | Recipient(s) | Type |
| ----- | ------------ | ---- |
| Collector claims pickup | Household (listing owner) | `pickup_claimed` |
| Negotiation offer sent | Counter-party (not sender) | `negotiation_offer` |
| Negotiation offer accepted | Industry + collector | `negotiation_accepted` |
| Transaction completed | Industry + collector | `transaction_completed` |

### `GET /notifications` (authenticated)

List notifications for the current user. All roles (`household`, `collector`, `industry`).

**Query parameters**

| Param | Type | Description |
| ----- | ---- | ----------- |
| `is_read` | boolean | Filter by read state (`true` / `false`) |
| `limit` | integer | Max items (1–100, default 50) |

**Response**

```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "pickup_claimed",
      "title": "Listing diklaim pengepul",
      "message": "Pengepul telah mengklaim listing sampah Anda. Pantau status pickup di dashboard.",
      "data": {
        "listingId": "uuid",
        "claimId": "uuid",
        "collectorId": "uuid"
      },
      "is_read": false,
      "read_at": null,
      "created_at": "2026-06-22T10:00:00.000Z"
    }
  ],
  "unread_count": 3
}
```

**Errors**

- `401` — missing or invalid auth token
- `500 NOTIFICATION_LIST_FAILED` — query failed

### `PATCH /notifications/read-all` (authenticated)

Mark all unread notifications for the current user as read.

**Response**

```json
{
  "updated_count": 5
}
```

**Errors**

- `401` — missing or invalid auth token
- `500 NOTIFICATION_READ_ALL_FAILED` — update failed

### `PATCH /notifications/:id/read` (authenticated)

Mark a single notification as read. Ownership enforced (`user_id` must match current user).

**Response:** `Notification` object (same shape as list item).

**Errors**

- `401` — missing or invalid auth token
- `404 NOTIFICATION_NOT_FOUND` — notification missing or not owned by caller
- `500 NOTIFICATION_READ_FAILED` — update failed

### `GET /audit-logs` (authenticated)

Returns audit log entries where `actor_id` equals the current user (own actions only). All roles. Default limit 50, ordered by `created_at` descending.

**Response:** array of audit log entries

```json
[
  {
    "id": "uuid",
    "actor_id": "uuid",
    "actor_role": "collector",
    "action": "pickup.claimed",
    "entity_type": "pickup_claim",
    "entity_id": "uuid",
    "ip_address": null,
    "user_agent": null,
    "metadata": {
      "listingId": "uuid",
      "householdId": "uuid"
    },
    "created_at": "2026-06-22T10:00:00.000Z"
  }
]
```

**Errors**

- `401` — missing or invalid auth token

### Apply migration

From `backend/`:

```bash
supabase db push
# or: psql "$DATABASE_URL" -f db/migrations/015_audit_notifications.sql
```

### `GET /dashboard/impact` (household, collector, industry)

Platform-wide impact metrics with optional filters. Responses are cached for 60 seconds via `Cache-Control: max-age=60`.

**Query parameters**

| Param | Type | Description |
| ----- | ---- | ----------- |
| `from` | ISO date string | Include records on or after this date (UTC) |
| `to` | ISO date string | Include records on or before end of this date (UTC) |
| `city` | string | Case-insensitive partial match on listing/batch `city` |
| `province` | string | Case-insensitive partial match on listing/batch `province` |

**Response:** `PlatformImpact`

```json
{
  "filters": {
    "from_date": "2026-06-01",
    "to_date": "2026-06-22",
    "city": "Bandung",
    "province": "Jawa Barat"
  },
  "total_waste_submitted_kg": 1250.5,
  "total_waste_collected_kg": 980.0,
  "total_material_produced_kg": 720.0,
  "total_material_sold_kg": 540.0,
  "total_transactions": 12,
  "total_transaction_value_idr": 2808000,
  "total_pickups_completed": 45,
  "total_route_distance_km": 186.5,
  "total_route_cost_idr": 1240000,
  "top_categories": [
    {
      "category_name": "Plastik PET",
      "weight_kg": 320.0,
      "percentage": 32.7
    }
  ],
  "estimated_co2_saved_kg": 1350.0,
  "estimated_economic_value_idr": 2808000,
  "active_households": 120,
  "active_collectors": 18,
  "active_industries": 6
}
```

| Field | Notes |
| ----- | ----- |
| `total_waste_submitted_kg` | Sum of `estimated_weight_kg` for non-cancelled listings |
| `total_waste_collected_kg` | Sum of actual (or estimated) weight for collected lifecycle statuses |
| `total_material_produced_kg` | Sum of batch weight for produced statuses (`available`, `ordered`, `negotiating`, `sold`, `unavailable`) |
| `total_material_sold_kg` | Sum of batch weight where `status = sold` |
| `total_transactions` | Completed/simulated-paid transactions |
| `estimated_co2_saved_kg` | **`total_material_sold_kg × 2.5`** — platform estimate of kg CO₂ avoided per kg material sold/recycled |
| `estimated_economic_value_idr` | Same as `total_transaction_value_idr` |
| `active_*` | Count of `user_profiles` with `is_active = true` per role (not date-filtered) |
| `top_categories` | Top 10 categories by collected listing weight; `percentage` is share of collected weight |

**CO₂ formula (documented constant)**

```
estimated_co2_saved_kg = total_material_sold_kg × CO2_SAVED_KG_PER_RECYCLED_KG
CO2_SAVED_KG_PER_RECYCLED_KG = 2.5
```

**Errors**

- `401` — missing or invalid auth token
- `403 INSUFFICIENT_ROLE` — role not allowed
- `500 DASHBOARD_SUMMARY_LOAD_FAILED` — aggregate query failed

### `GET /dashboard/material-flow` (household, collector, industry)

Aggregate Sankey-style material flow for visualization. **No PII** — only stage totals and category breakdowns. Supports the same query filters as `/dashboard/impact`.

**Query parameters:** same as `GET /dashboard/impact` (`from`, `to`, `city`, `province`)

**Response:** `MaterialFlow`

```json
{
  "filters": {},
  "nodes": [
    { "id": "household", "label": "Household waste", "type": "household", "value": 1250.5 },
    { "id": "collector", "label": "Collector pickup", "type": "collector", "value": 980.0 },
    { "id": "material", "label": "Material batches", "type": "material", "value": 720.0 },
    { "id": "industry", "label": "Industry purchase", "type": "industry", "value": 540.0 }
  ],
  "edges": [
    { "from": "household", "to": "collector", "weight_kg": 980.0, "value_idr": 0 },
    { "from": "collector", "to": "material", "weight_kg": 720.0, "value_idr": 0 },
    { "from": "material", "to": "industry", "weight_kg": 540.0, "value_idr": 2808000 }
  ],
  "categories_breakdown": [
    {
      "category_name": "Plastik PET",
      "weight_kg_in": 320.0,
      "weight_kg_out": 180.0
    }
  ]
}
```

| Field | Notes |
| ----- | ----- |
| `nodes` | Four lifecycle stages with total kg at each stage |
| `edges` | Flow between stages; monetary value only on `material → industry` |
| `categories_breakdown.weight_kg_in` | Collected listing weight per category |
| `categories_breakdown.weight_kg_out` | Sold batch weight per category |

**Errors**

- `401` — missing or invalid auth token
- `403 INSUFFICIENT_ROLE` — role not allowed
- `500 DASHBOARD_SUMMARY_LOAD_FAILED` — aggregate query failed

### `GET /dashboard/routes` (collector)

Route performance aggregates for the authenticated collector. Responses are cached for 60 seconds via `Cache-Control: max-age=60`.

**Response:** `RouteStats`

```json
{
  "counts": {
    "total_routes": 8,
    "planned_routes": 1,
    "ongoing_routes": 0,
    "completed_routes": 6,
    "cancelled_routes": 1
  },
  "total_distance_km": 96.5,
  "total_weight_kg": 142.0,
  "total_estimated_cost_idr": 640000,
  "total_actual_cost_idr": 620000,
  "average_distance_km": 13.79,
  "average_weight_kg": 20.29
}
```

| Field | Notes |
| ----- | ----- |
| Distance/weight/cost totals | Exclude `cancelled` routes |
| Averages | Computed over non-cancelled routes only |

**Errors**

- `401` — missing or invalid auth token
- `403 INSUFFICIENT_ROLE` — caller is not a collector
- `500 DASHBOARD_SUMMARY_LOAD_FAILED` — aggregate query failed