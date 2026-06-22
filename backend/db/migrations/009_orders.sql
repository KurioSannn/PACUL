-- 009_orders.sql
-- Industry orders for collector material batches.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid not null references public.user_profiles(id) on delete cascade,
  collector_id uuid not null references public.user_profiles(id) on delete cascade,
  batch_id uuid not null references public.material_batches(id) on delete restrict,
  requested_weight_kg decimal not null check (requested_weight_kg > 0),
  final_weight_kg decimal,
  offered_price_per_kg decimal not null,
  final_price_per_kg decimal,
  total_amount decimal,
  status text not null default 'created' check (
    status in (
      'created',
      'negotiating',
      'accepted',
      'rejected',
      'cancelled',
      'completed'
    )
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  cancel_reason text
);

create index if not exists orders_industry_id_idx
  on public.orders(industry_id);

create index if not exists orders_collector_id_idx
  on public.orders(collector_id);

create index if not exists orders_batch_id_idx
  on public.orders(batch_id);

create index if not exists orders_status_idx
  on public.orders(status);

create index if not exists orders_industry_id_status_idx
  on public.orders(industry_id, status);

create index if not exists orders_collector_id_status_idx
  on public.orders(collector_id, status);

create trigger orders_set_updated_at
before update on public.orders
for each row
execute procedure public.update_updated_at();
