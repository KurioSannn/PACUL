-- 001_core_user_schema.sql
-- Core user, profile, and role tables for PACUL.

set check_function_bodies = off;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('household','collector','industry')),
  display_name text not null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_role_idx on public.user_profiles(role);
create index if not exists user_profiles_is_active_idx on public.user_profiles(is_active);

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute procedure public.update_updated_at();

create table if not exists public.household_profiles (
  id uuid primary key references public.user_profiles(id) on delete cascade,
  address text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  district text,
  city text,
  province text,
  total_waste_kg numeric default 0,
  total_listings integer default 0
);

create table if not exists public.collector_profiles (
  id uuid primary key references public.user_profiles(id) on delete cascade,
  business_name text,
  service_area_description text,
  base_latitude numeric(10,8),
  base_longitude numeric(11,8),
  vehicle_capacity_kg numeric,
  rating_average numeric(3,2) default 0,
  rating_count integer default 0,
  total_pickups integer default 0,
  total_kg_collected numeric default 0
);

create table if not exists public.industry_profiles (
  id uuid primary key references public.user_profiles(id) on delete cascade,
  company_name text not null,
  industry_type text,
  address text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  rating_average numeric(3,2) default 0,
  rating_count integer default 0,
  total_orders integer default 0
);