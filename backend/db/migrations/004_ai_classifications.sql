-- 004_ai_classifications.sql
-- Persisted AI waste image classification results.

create table if not exists public.ai_classifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  image_path text not null,
  top_class text not null,
  confidence decimal(5,4) not null,
  top_k_results jsonb not null,
  db_category_id uuid references public.waste_categories(id) on delete set null,
  is_mock boolean not null default false,
  model_version text,
  inference_time_ms integer,
  is_overridden boolean not null default false,
  override_category_id uuid references public.waste_categories(id) on delete set null,
  override_reason text,
  overridden_at timestamptz,
  overridden_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_classifications_user_id_idx
  on public.ai_classifications(user_id);

create index if not exists ai_classifications_db_category_id_idx
  on public.ai_classifications(db_category_id);

create index if not exists ai_classifications_created_at_idx
  on public.ai_classifications(created_at);
