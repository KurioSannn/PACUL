-- 016_rls_policies.sql
-- Row Level Security policies for direct Supabase client access (anon/authenticated).
-- Backend service-role client bypasses RLS by design.

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.auth_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid();
$$;

create or replace function public.can_access_waste_listing(listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.waste_listings wl
    where wl.id = listing_id
      and (
        wl.household_id = auth.uid()
        or wl.status = 'available'
        or wl.claimed_by = auth.uid()
      )
  );
$$;

create or replace function public.is_negotiation_party(thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.negotiation_threads nt
    where nt.id = thread_id
      and (nt.industry_id = auth.uid() or nt.collector_id = auth.uid())
  );
$$;

create or replace function public.owns_material_batch(batch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.material_batches mb
    where mb.id = batch_id
      and mb.collector_id = auth.uid()
  );
$$;

create or replace function public.can_read_traceability_event(
  p_entity_type text,
  p_entity_id uuid,
  p_actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_actor_id = auth.uid()
    or (
      p_entity_type = 'waste_listing'
      and exists (
        select 1
        from public.waste_listings wl
        where wl.id = p_entity_id
          and (wl.household_id = auth.uid() or wl.claimed_by = auth.uid())
      )
    )
    or (
      p_entity_type = 'material_batch'
      and exists (
        select 1
        from public.material_batches mb
        where mb.id = p_entity_id
          and (mb.collector_id = auth.uid() or mb.status = 'available')
      )
    )
    or (
      p_entity_type = 'order'
      and exists (
        select 1
        from public.orders o
        where o.id = p_entity_id
          and (o.industry_id = auth.uid() or o.collector_id = auth.uid())
      )
    )
    or (
      p_entity_type = 'pickup_claim'
      and exists (
        select 1
        from public.pickup_claims pc
        join public.waste_listings wl on wl.id = pc.listing_id
        where pc.id = p_entity_id
          and (pc.collector_id = auth.uid() or wl.household_id = auth.uid())
      )
    )
    or (
      p_entity_type = 'negotiation_thread'
      and public.is_negotiation_party(p_entity_id)
    );
$$;

-- ---------------------------------------------------------------------------
-- user_profiles
-- ---------------------------------------------------------------------------

alter table public.user_profiles enable row level security;

drop policy if exists user_profiles_select on public.user_profiles;
create policy user_profiles_select on public.user_profiles
  for select
  to authenticated
  using (id = auth.uid() or is_active = true);

drop policy if exists user_profiles_insert on public.user_profiles;
create policy user_profiles_insert on public.user_profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists user_profiles_update on public.user_profiles;
create policy user_profiles_update on public.user_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- role profiles
-- ---------------------------------------------------------------------------

alter table public.household_profiles enable row level security;

drop policy if exists household_profiles_select on public.household_profiles;
create policy household_profiles_select on public.household_profiles
  for select
  to authenticated
  using (id = auth.uid() or exists (
    select 1 from public.user_profiles up
    where up.id = household_profiles.id and up.is_active = true
  ));

drop policy if exists household_profiles_insert on public.household_profiles;
create policy household_profiles_insert on public.household_profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists household_profiles_update on public.household_profiles;
create policy household_profiles_update on public.household_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

alter table public.collector_profiles enable row level security;

drop policy if exists collector_profiles_select on public.collector_profiles;
create policy collector_profiles_select on public.collector_profiles
  for select
  to authenticated
  using (id = auth.uid() or exists (
    select 1 from public.user_profiles up
    where up.id = collector_profiles.id and up.is_active = true
  ));

drop policy if exists collector_profiles_insert on public.collector_profiles;
create policy collector_profiles_insert on public.collector_profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists collector_profiles_update on public.collector_profiles;
create policy collector_profiles_update on public.collector_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

alter table public.industry_profiles enable row level security;

drop policy if exists industry_profiles_select on public.industry_profiles;
create policy industry_profiles_select on public.industry_profiles
  for select
  to authenticated
  using (id = auth.uid() or exists (
    select 1 from public.user_profiles up
    where up.id = industry_profiles.id and up.is_active = true
  ));

drop policy if exists industry_profiles_insert on public.industry_profiles;
create policy industry_profiles_insert on public.industry_profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists industry_profiles_update on public.industry_profiles;
create policy industry_profiles_update on public.industry_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- reference data
-- ---------------------------------------------------------------------------

alter table public.waste_categories enable row level security;

drop policy if exists waste_categories_select on public.waste_categories;
create policy waste_categories_select on public.waste_categories
  for select
  to authenticated
  using (is_active = true);

alter table public.collector_handled_categories enable row level security;

drop policy if exists collector_handled_categories_select on public.collector_handled_categories;
create policy collector_handled_categories_select on public.collector_handled_categories
  for select
  to authenticated
  using (is_active = true);

drop policy if exists collector_handled_categories_insert on public.collector_handled_categories;
create policy collector_handled_categories_insert on public.collector_handled_categories
  for insert
  to authenticated
  with check (collector_id = auth.uid());

drop policy if exists collector_handled_categories_update on public.collector_handled_categories;
create policy collector_handled_categories_update on public.collector_handled_categories
  for update
  to authenticated
  using (collector_id = auth.uid())
  with check (collector_id = auth.uid());

drop policy if exists collector_handled_categories_delete on public.collector_handled_categories;
create policy collector_handled_categories_delete on public.collector_handled_categories
  for delete
  to authenticated
  using (collector_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ai_classifications
-- ---------------------------------------------------------------------------

alter table public.ai_classifications enable row level security;

drop policy if exists ai_classifications_select on public.ai_classifications;
create policy ai_classifications_select on public.ai_classifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists ai_classifications_insert on public.ai_classifications;
create policy ai_classifications_insert on public.ai_classifications
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- waste_listings
-- ---------------------------------------------------------------------------

alter table public.waste_listings enable row level security;

drop policy if exists waste_listings_select on public.waste_listings;
create policy waste_listings_select on public.waste_listings
  for select
  to authenticated
  using (
    household_id = auth.uid()
    or status = 'available'
    or claimed_by = auth.uid()
  );

drop policy if exists waste_listings_insert on public.waste_listings;
create policy waste_listings_insert on public.waste_listings
  for insert
  to authenticated
  with check (
    household_id = auth.uid()
    and public.auth_user_role() = 'household'
  );

drop policy if exists waste_listings_update on public.waste_listings;
create policy waste_listings_update on public.waste_listings
  for update
  to authenticated
  using (
    household_id = auth.uid()
    or claimed_by = auth.uid()
    or (
      status = 'available'
      and public.auth_user_role() = 'collector'
    )
  )
  with check (
    household_id = auth.uid()
    or claimed_by = auth.uid()
    or (
      status in ('available', 'claimed', 'pickup_planned', 'picked_up', 'sorting', 'sorted')
      and public.auth_user_role() = 'collector'
    )
  );

-- ---------------------------------------------------------------------------
-- waste_listing_images
-- ---------------------------------------------------------------------------

alter table public.waste_listing_images enable row level security;

drop policy if exists waste_listing_images_select on public.waste_listing_images;
create policy waste_listing_images_select on public.waste_listing_images
  for select
  to authenticated
  using (public.can_access_waste_listing(listing_id));

-- Inserts are performed by the backend service role only (no authenticated insert policy).

-- ---------------------------------------------------------------------------
-- pickup_claims
-- ---------------------------------------------------------------------------

alter table public.pickup_claims enable row level security;

drop policy if exists pickup_claims_select on public.pickup_claims;
create policy pickup_claims_select on public.pickup_claims
  for select
  to authenticated
  using (
    collector_id = auth.uid()
    or exists (
      select 1
      from public.waste_listings wl
      where wl.id = pickup_claims.listing_id
        and wl.household_id = auth.uid()
    )
  );

drop policy if exists pickup_claims_insert on public.pickup_claims;
create policy pickup_claims_insert on public.pickup_claims
  for insert
  to authenticated
  with check (
    collector_id = auth.uid()
    and public.auth_user_role() = 'collector'
  );

drop policy if exists pickup_claims_update on public.pickup_claims;
create policy pickup_claims_update on public.pickup_claims
  for update
  to authenticated
  using (collector_id = auth.uid())
  with check (collector_id = auth.uid());

-- ---------------------------------------------------------------------------
-- pickup_routes / pickup_route_stops
-- ---------------------------------------------------------------------------

alter table public.pickup_routes enable row level security;

drop policy if exists pickup_routes_select on public.pickup_routes;
create policy pickup_routes_select on public.pickup_routes
  for select
  to authenticated
  using (collector_id = auth.uid());

drop policy if exists pickup_routes_insert on public.pickup_routes;
create policy pickup_routes_insert on public.pickup_routes
  for insert
  to authenticated
  with check (collector_id = auth.uid());

drop policy if exists pickup_routes_update on public.pickup_routes;
create policy pickup_routes_update on public.pickup_routes
  for update
  to authenticated
  using (collector_id = auth.uid())
  with check (collector_id = auth.uid());

alter table public.pickup_route_stops enable row level security;

drop policy if exists pickup_route_stops_select on public.pickup_route_stops;
create policy pickup_route_stops_select on public.pickup_route_stops
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.pickup_routes pr
      where pr.id = pickup_route_stops.route_id
        and pr.collector_id = auth.uid()
    )
  );

drop policy if exists pickup_route_stops_insert on public.pickup_route_stops;
create policy pickup_route_stops_insert on public.pickup_route_stops
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.pickup_routes pr
      where pr.id = pickup_route_stops.route_id
        and pr.collector_id = auth.uid()
    )
  );

drop policy if exists pickup_route_stops_update on public.pickup_route_stops;
create policy pickup_route_stops_update on public.pickup_route_stops
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.pickup_routes pr
      where pr.id = pickup_route_stops.route_id
        and pr.collector_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.pickup_routes pr
      where pr.id = pickup_route_stops.route_id
        and pr.collector_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- material_batches / material_batch_sources
-- ---------------------------------------------------------------------------

alter table public.material_batches enable row level security;

drop policy if exists material_batches_select on public.material_batches;
create policy material_batches_select on public.material_batches
  for select
  to authenticated
  using (collector_id = auth.uid() or status = 'available');

drop policy if exists material_batches_insert on public.material_batches;
create policy material_batches_insert on public.material_batches
  for insert
  to authenticated
  with check (
    collector_id = auth.uid()
    and public.auth_user_role() = 'collector'
  );

drop policy if exists material_batches_update on public.material_batches;
create policy material_batches_update on public.material_batches
  for update
  to authenticated
  using (collector_id = auth.uid())
  with check (collector_id = auth.uid());

alter table public.material_batch_sources enable row level security;

drop policy if exists material_batch_sources_select on public.material_batch_sources;
create policy material_batch_sources_select on public.material_batch_sources
  for select
  to authenticated
  using (public.owns_material_batch(batch_id));

drop policy if exists material_batch_sources_insert on public.material_batch_sources;
create policy material_batch_sources_insert on public.material_batch_sources
  for insert
  to authenticated
  with check (public.owns_material_batch(batch_id));

drop policy if exists material_batch_sources_update on public.material_batch_sources;
create policy material_batch_sources_update on public.material_batch_sources
  for update
  to authenticated
  using (public.owns_material_batch(batch_id))
  with check (public.owns_material_batch(batch_id));

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

alter table public.orders enable row level security;

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select
  to authenticated
  using (industry_id = auth.uid() or collector_id = auth.uid());

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert
  to authenticated
  with check (
    industry_id = auth.uid()
    and public.auth_user_role() = 'industry'
  );

-- Order status updates are performed by the backend service role only.

-- ---------------------------------------------------------------------------
-- negotiation_*
-- ---------------------------------------------------------------------------

alter table public.negotiation_threads enable row level security;

drop policy if exists negotiation_threads_select on public.negotiation_threads;
create policy negotiation_threads_select on public.negotiation_threads
  for select
  to authenticated
  using (industry_id = auth.uid() or collector_id = auth.uid());

alter table public.negotiation_messages enable row level security;

drop policy if exists negotiation_messages_select on public.negotiation_messages;
create policy negotiation_messages_select on public.negotiation_messages
  for select
  to authenticated
  using (public.is_negotiation_party(thread_id));

alter table public.negotiation_offers enable row level security;

drop policy if exists negotiation_offers_select on public.negotiation_offers;
create policy negotiation_offers_select on public.negotiation_offers
  for select
  to authenticated
  using (public.is_negotiation_party(thread_id));

-- Negotiation writes are performed by the backend service role only.

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------

alter table public.transactions enable row level security;

drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select
  to authenticated
  using (industry_id = auth.uid() or collector_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ratings_reviews
-- ---------------------------------------------------------------------------

alter table public.ratings_reviews enable row level security;

drop policy if exists ratings_reviews_select on public.ratings_reviews;
create policy ratings_reviews_select on public.ratings_reviews
  for select
  to authenticated
  using (true);

drop policy if exists ratings_reviews_insert on public.ratings_reviews;
create policy ratings_reviews_insert on public.ratings_reviews
  for insert
  to authenticated
  with check (rater_id = auth.uid());

-- ---------------------------------------------------------------------------
-- report_exports
-- ---------------------------------------------------------------------------

alter table public.report_exports enable row level security;

drop policy if exists report_exports_select on public.report_exports;
create policy report_exports_select on public.report_exports
  for select
  to authenticated
  using (user_id = auth.uid());

-- Report generation is performed by the backend service role only.

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Notification inserts are performed by the backend service role only.

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select
  to authenticated
  using (actor_id = auth.uid());

-- Audit log inserts are performed by the backend service role only.

-- ---------------------------------------------------------------------------
-- traceability_events
-- ---------------------------------------------------------------------------

alter table public.traceability_events enable row level security;

drop policy if exists traceability_events_select on public.traceability_events;
create policy traceability_events_select on public.traceability_events
  for select
  to authenticated
  using (
    public.can_read_traceability_event(entity_type, entity_id, actor_id)
  );

-- Traceability inserts are performed by the backend service role only.
