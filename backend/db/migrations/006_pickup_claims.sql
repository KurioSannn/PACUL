-- 006_pickup_claims.sql
-- Collector pickup claims linked to waste listings.

create table if not exists public.pickup_claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.waste_listings(id) on delete cascade,
  collector_id uuid not null references public.user_profiles(id) on delete cascade,
  status text not null default 'claimed' check (
    status in ('claimed', 'pickup_planned', 'picked_up', 'cancelled')
  ),
  claimed_at timestamptz not null default now(),
  pickup_scheduled_at timestamptz,
  pickup_completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  route_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id)
);

create index if not exists pickup_claims_collector_id_idx
  on public.pickup_claims(collector_id);

create index if not exists pickup_claims_status_idx
  on public.pickup_claims(status);

create index if not exists pickup_claims_listing_id_idx
  on public.pickup_claims(listing_id);

create trigger pickup_claims_set_updated_at
before update on public.pickup_claims
for each row
execute procedure public.update_updated_at();
