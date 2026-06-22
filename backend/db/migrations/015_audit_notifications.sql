-- 015_audit_notifications.sql
-- Audit trail and in-app notifications for contextual platform events.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.user_profiles(id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text,
  entity_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_id_idx
  on public.audit_logs(actor_id);

create index if not exists audit_logs_action_idx
  on public.audit_logs(action);

create index if not exists audit_logs_entity_id_idx
  on public.audit_logs(entity_id);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs(created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications(user_id);

create index if not exists notifications_is_read_idx
  on public.notifications(is_read);

create index if not exists notifications_created_at_idx
  on public.notifications(created_at);

create index if not exists notifications_user_id_is_read_created_at_idx
  on public.notifications(user_id, is_read, created_at);
