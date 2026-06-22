-- 008_material_batches.sql
-- Collector material batches and linked waste listing sources.

create table if not exists public.material_batches (
  id uuid primary key default gen_random_uuid(),
  collector_id uuid not null references public.user_profiles(id) on delete cascade,
  category_id uuid not null references public.waste_categories(id) on delete restrict,
  name text not null,
  description text,
  total_weight_kg decimal not null check (total_weight_kg > 0),
  price_per_kg decimal not null,
  min_order_kg decimal not null default 0,
  status text not null default 'draft' check (
    status in (
      'draft',
      'available',
      'ordered',
      'negotiating',
      'sold',
      'unavailable'
    )
  ),
  location_address text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  city text,
  province text,
  available_from timestamptz,
  available_until timestamptz,
  notes text,
  published_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_batches_collector_id_idx
  on public.material_batches(collector_id);

create index if not exists material_batches_status_idx
  on public.material_batches(status);

create index if not exists material_batches_category_id_idx
  on public.material_batches(category_id);

create index if not exists material_batches_collector_id_status_idx
  on public.material_batches(collector_id, status);

create trigger material_batches_set_updated_at
before update on public.material_batches
for each row
execute procedure public.update_updated_at();

create table if not exists public.material_batch_sources (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.material_batches(id) on delete cascade,
  listing_id uuid not null references public.waste_listings(id) on delete restrict,
  actual_weight_kg decimal not null check (actual_weight_kg > 0),
  notes text,
  created_at timestamptz not null default now(),
  unique (batch_id, listing_id)
);

create index if not exists material_batch_sources_batch_id_idx
  on public.material_batch_sources(batch_id);

create index if not exists material_batch_sources_listing_id_idx
  on public.material_batch_sources(listing_id);
