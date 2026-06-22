-- 017_ai_model_versions_inference_logs.sql
-- AI model version registry and per-request inference logging.
-- Keeps inference history linked to the model version that produced it,
-- independent of the persisted ai_classifications rows.

create table if not exists public.ai_model_versions (
  id uuid primary key default gen_random_uuid(),
  version_string text not null unique,
  model_type text not null check (
    model_type in ('mock', 'tensorflow_js', 'onnx', 'teachable_machine')
  ),
  description text,
  taxonomy_version text,
  is_active boolean not null default false,
  deployed_at timestamptz,
  deprecated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_model_versions_version_string_idx
  on public.ai_model_versions(version_string);

create index if not exists ai_model_versions_is_active_idx
  on public.ai_model_versions(is_active);

create table if not exists public.inference_logs (
  id uuid primary key default gen_random_uuid(),
  classification_id uuid references public.ai_classifications(id) on delete set null,
  user_id uuid references public.user_profiles(id) on delete set null,
  model_version_id uuid references public.ai_model_versions(id) on delete set null,
  image_path text,
  input_size_bytes integer,
  inference_time_ms integer,
  top_class text,
  confidence decimal(5,4),
  error_message text,
  is_error boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists inference_logs_user_id_idx
  on public.inference_logs(user_id);

create index if not exists inference_logs_model_version_id_idx
  on public.inference_logs(model_version_id);

create index if not exists inference_logs_is_error_idx
  on public.inference_logs(is_error);

create index if not exists inference_logs_created_at_idx
  on public.inference_logs(created_at);

-- ---------------------------------------------------------------------------
-- RLS (backend service-role client bypasses these; protects direct access)
-- ---------------------------------------------------------------------------

alter table public.ai_model_versions enable row level security;

drop policy if exists ai_model_versions_select on public.ai_model_versions;
create policy ai_model_versions_select on public.ai_model_versions
  for select
  to authenticated
  using (true);

alter table public.inference_logs enable row level security;

drop policy if exists inference_logs_select on public.inference_logs;
create policy inference_logs_select on public.inference_logs
  for select
  to authenticated
  using (user_id = auth.uid());
