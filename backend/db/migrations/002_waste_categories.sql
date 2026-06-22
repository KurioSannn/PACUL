-- 002_waste_categories.sql
-- Master data for waste material categories.

create table if not exists public.waste_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  icon_key text,
  unit text not null default 'kg',
  typical_price_per_kg decimal,
  ai_model_class text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists waste_categories_code_idx on public.waste_categories(code);
create index if not exists waste_categories_is_active_idx on public.waste_categories(is_active);
create index if not exists waste_categories_ai_model_class_idx on public.waste_categories(ai_model_class);
