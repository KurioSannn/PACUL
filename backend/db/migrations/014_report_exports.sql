-- 014_report_exports.sql
-- Generated PDF/Excel report export records with Supabase Storage paths.

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  export_type text not null check (
    export_type in (
      'pdf_impact',
      'excel_transactions',
      'excel_routes',
      'excel_materials'
    )
  ),
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'failed')
  ),
  file_path text,
  file_size_bytes integer,
  filters jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz
);

create index if not exists report_exports_user_id_idx
  on public.report_exports(user_id);

create index if not exists report_exports_status_idx
  on public.report_exports(status);

create index if not exists report_exports_created_at_idx
  on public.report_exports(created_at);

create index if not exists report_exports_user_id_created_at_idx
  on public.report_exports(user_id, created_at desc);
