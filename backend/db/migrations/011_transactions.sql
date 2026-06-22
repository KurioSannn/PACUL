-- 011_transactions.sql
-- Simulated payment records for accepted industry orders (no real gateway).

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  industry_id uuid not null references public.user_profiles(id) on delete cascade,
  collector_id uuid not null references public.user_profiles(id) on delete cascade,
  batch_id uuid not null references public.material_batches(id) on delete restrict,
  amount decimal not null,
  status text not null default 'simulated_pending' check (
    status in (
      'simulated_pending',
      'simulated_paid',
      'completed',
      'cancelled'
    )
  ),
  payment_method text default 'simulation',
  payment_reference text,
  notes text,
  simulated_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists transactions_order_id_idx
  on public.transactions(order_id);

create index if not exists transactions_industry_id_idx
  on public.transactions(industry_id);

create index if not exists transactions_collector_id_idx
  on public.transactions(collector_id);

create index if not exists transactions_status_idx
  on public.transactions(status);
