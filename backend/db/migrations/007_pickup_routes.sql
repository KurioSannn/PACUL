-- 007_pickup_routes.sql
-- Collector pickup routes and ordered route stops.

create table if not exists public.pickup_routes (
  id uuid primary key default gen_random_uuid(),
  collector_id uuid not null references public.user_profiles(id) on delete cascade,
  status text not null default 'planned' check (
    status in ('planned', 'ongoing', 'completed', 'cancelled')
  ),
  total_distance_km decimal not null,
  estimated_duration_minutes integer,
  total_weight_kg decimal,
  estimated_cost integer,
  actual_cost integer,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pickup_routes_collector_id_idx
  on public.pickup_routes(collector_id);

create index if not exists pickup_routes_status_idx
  on public.pickup_routes(status);

create index if not exists pickup_routes_collector_id_status_idx
  on public.pickup_routes(collector_id, status);

create trigger pickup_routes_set_updated_at
before update on public.pickup_routes
for each row
execute procedure public.update_updated_at();

create table if not exists public.pickup_route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.pickup_routes(id) on delete cascade,
  listing_id uuid not null references public.waste_listings(id) on delete cascade,
  sequence_number integer not null,
  distance_from_previous_km decimal,
  estimated_arrival_minutes integer,
  status text not null default 'pending' check (
    status in ('pending', 'arrived', 'completed', 'skipped')
  ),
  arrived_at timestamptz,
  completed_at timestamptz,
  notes text
);

create index if not exists pickup_route_stops_route_id_idx
  on public.pickup_route_stops(route_id);

create index if not exists pickup_route_stops_listing_id_idx
  on public.pickup_route_stops(listing_id);

create index if not exists pickup_route_stops_route_id_sequence_number_idx
  on public.pickup_route_stops(route_id, sequence_number);

alter table public.pickup_claims
  add constraint pickup_claims_route_id_fkey
  foreign key (route_id) references public.pickup_routes(id) on delete set null;
