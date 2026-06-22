-- 019_route_cost_estimates.sql
-- Persisted pickup route cost estimates for preview, commit, and actual phases.
-- Lets preview costs be saved before a route is committed and compared to the
-- actual cost after completion. config_snapshot captures the cost config at
-- calculation time so historical estimates stay reproducible.

create table if not exists public.route_cost_estimates (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references public.pickup_routes(id) on delete cascade,
  collector_id uuid not null references public.user_profiles(id) on delete cascade,
  estimate_type text not null check (
    estimate_type in ('preview', 'committed', 'actual')
  ),
  total_distance_km decimal(10,2) not null,
  total_weight_kg decimal(10,2) not null,
  stop_count integer not null,
  base_fee integer not null,
  distance_cost integer not null,
  handling_cost integer not null,
  total_cost integer not null,
  config_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists route_cost_estimates_route_id_idx
  on public.route_cost_estimates(route_id);

create index if not exists route_cost_estimates_collector_id_idx
  on public.route_cost_estimates(collector_id);

create index if not exists route_cost_estimates_estimate_type_idx
  on public.route_cost_estimates(estimate_type);

-- ---------------------------------------------------------------------------
-- RLS (backend service-role client bypasses these; protects direct access)
-- ---------------------------------------------------------------------------

alter table public.route_cost_estimates enable row level security;

drop policy if exists route_cost_estimates_select on public.route_cost_estimates;
create policy route_cost_estimates_select on public.route_cost_estimates
  for select
  to authenticated
  using (collector_id = auth.uid());
