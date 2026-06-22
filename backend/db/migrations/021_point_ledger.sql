-- 021_point_ledger.sql
-- EcoPoints ledger: append-only record of points awarded for platform actions.
-- Also extends the traceability_events event_type CHECK to allow the new
-- 'eco_points_awarded' event emitted when points are granted.

create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  points integer not null,
  event_type text not null check (
    event_type in (
      'listing_published',
      'pickup_completed',
      'material_batch_created',
      'material_published',
      'transaction_completed',
      'rating_submitted',
      'first_time_bonus'
    )
  ),
  entity_type text,
  entity_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists point_ledger_user_id_idx
  on public.point_ledger(user_id);

create index if not exists point_ledger_event_type_idx
  on public.point_ledger(event_type);

create index if not exists point_ledger_created_at_idx
  on public.point_ledger(created_at);

-- ---------------------------------------------------------------------------
-- RLS (backend service-role client bypasses these; protects direct access)
-- ---------------------------------------------------------------------------

alter table public.point_ledger enable row level security;

drop policy if exists point_ledger_select on public.point_ledger;
create policy point_ledger_select on public.point_ledger
  for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Extend traceability_events event_type CHECK with 'eco_points_awarded'
-- ---------------------------------------------------------------------------

alter table public.traceability_events
  drop constraint if exists traceability_events_event_type_check;

alter table public.traceability_events
  add constraint traceability_events_event_type_check check (
    event_type in (
      'waste_uploaded',
      'ai_classified',
      'listing_published',
      'pickup_claimed',
      'route_created',
      'picked_up',
      'sorted_by_collector',
      'material_batch_created',
      'material_listed',
      'order_created',
      'negotiation_started',
      'offer_sent',
      'counter_offer_sent',
      'deal_accepted',
      'transaction_completed',
      'rating_submitted',
      'report_exported',
      'ai_classification_overridden',
      'listing_cancelled',
      'order_cancelled',
      'eco_points_awarded'
    )
  );
