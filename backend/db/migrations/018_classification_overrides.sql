-- 018_classification_overrides.sql
-- Independent audit trail for manual AI classification overrides.
-- ai_classifications keeps its inline override columns for quick lookup;
-- this table records every correction with before/after snapshots.

create table if not exists public.classification_overrides (
  id uuid primary key default gen_random_uuid(),
  classification_id uuid not null
    references public.ai_classifications(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  original_category_id uuid references public.waste_categories(id) on delete set null,
  original_class text,
  original_confidence decimal(5,4),
  override_category_id uuid not null
    references public.waste_categories(id) on delete restrict,
  override_reason text,
  created_at timestamptz not null default now()
);

create index if not exists classification_overrides_classification_id_idx
  on public.classification_overrides(classification_id);

create index if not exists classification_overrides_user_id_idx
  on public.classification_overrides(user_id);

-- ---------------------------------------------------------------------------
-- RLS (backend service-role client bypasses these; protects direct access)
-- ---------------------------------------------------------------------------

alter table public.classification_overrides enable row level security;

drop policy if exists classification_overrides_select
  on public.classification_overrides;
create policy classification_overrides_select
  on public.classification_overrides
  for select
  to authenticated
  using (user_id = auth.uid());
