-- 020_material_market_listings.sql
-- Formal "Green Market" listings for processed material batches.
-- One market listing per batch (batch_id unique). Keeps marketing fields
-- (quality grade, specs, photos, asking price) separate from the batch record.

create table if not exists public.material_market_listings (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null unique
    references public.material_batches(id) on delete cascade,
  collector_id uuid not null references public.user_profiles(id) on delete cascade,
  category_id uuid not null references public.waste_categories(id) on delete restrict,
  title text not null,
  quality_grade text not null check (quality_grade in ('A', 'B', 'C')),
  specifications jsonb not null default '{}'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  asking_price_per_kg decimal(12,2) not null,
  available_weight_kg decimal(10,2) not null,
  status text not null default 'active'
    check (status in ('active', 'sold', 'withdrawn')),
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_market_listings_collector_id_idx
  on public.material_market_listings(collector_id);

create index if not exists material_market_listings_category_id_idx
  on public.material_market_listings(category_id);

create index if not exists material_market_listings_status_idx
  on public.material_market_listings(status);

-- ---------------------------------------------------------------------------
-- RLS (backend service-role client bypasses these; protects direct access)
-- ---------------------------------------------------------------------------

alter table public.material_market_listings enable row level security;

drop policy if exists material_market_listings_select
  on public.material_market_listings;
create policy material_market_listings_select
  on public.material_market_listings
  for select
  to authenticated
  using (status = 'active' or collector_id = auth.uid());
