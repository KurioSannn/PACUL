-- 012_traceability_events.sql
-- PACUL Track event log for end-to-end waste and material traceability.

create table if not exists public.traceability_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
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
      'order_cancelled'
    )
  ),
  entity_type text not null,
  entity_id uuid not null,
  actor_id uuid references public.user_profiles(id) on delete set null,
  actor_role text,
  previous_status text,
  new_status text,
  metadata jsonb not null default '{}'::jsonb,
  linked_entity_type text,
  linked_entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists traceability_events_entity_id_idx
  on public.traceability_events(entity_id);

create index if not exists traceability_events_entity_type_idx
  on public.traceability_events(entity_type);

create index if not exists traceability_events_event_type_idx
  on public.traceability_events(event_type);

create index if not exists traceability_events_actor_id_idx
  on public.traceability_events(actor_id);

create index if not exists traceability_events_created_at_idx
  on public.traceability_events(created_at);

create index if not exists traceability_events_entity_type_entity_id_idx
  on public.traceability_events(entity_type, entity_id);
