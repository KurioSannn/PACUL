-- 003_collector_handled_categories.sql
-- Categories handled by each collector for marketplace filtering.

create table if not exists public.collector_handled_categories (
  id uuid primary key default gen_random_uuid(),
  collector_id uuid not null references public.user_profiles(id) on delete cascade,
  category_id uuid not null references public.waste_categories(id) on delete cascade,
  min_weight_kg decimal not null default 0,
  max_weight_kg decimal,
  price_offered_per_kg decimal,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (collector_id, category_id)
);

create index if not exists collector_handled_categories_collector_id_idx
  on public.collector_handled_categories(collector_id);

create index if not exists collector_handled_categories_category_id_idx
  on public.collector_handled_categories(category_id);

create index if not exists collector_handled_categories_is_active_idx
  on public.collector_handled_categories(is_active);
