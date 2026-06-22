-- 005_waste_listings.sql
-- Household waste listings and attached images.

create table if not exists public.waste_listings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.user_profiles(id) on delete cascade,
  category_id uuid not null references public.waste_categories(id) on delete restrict,
  classification_id uuid references public.ai_classifications(id) on delete set null,
  title text not null,
  description text,
  estimated_weight_kg decimal not null check (estimated_weight_kg > 0),
  actual_weight_kg decimal,
  status text not null default 'draft' check (
    status in (
      'draft',
      'available',
      'claimed',
      'pickup_planned',
      'picked_up',
      'sorting',
      'sorted',
      'converted_to_material',
      'cancelled'
    )
  ),
  address text not null,
  latitude decimal(10,8) not null,
  longitude decimal(11,8) not null,
  district text,
  city text,
  province text,
  available_from timestamptz,
  available_until timestamptz,
  notes text,
  pickup_fee decimal not null default 0,
  claimed_by uuid references public.user_profiles(id) on delete set null,
  claimed_at timestamptz,
  picked_up_at timestamptz,
  sorted_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists waste_listings_household_id_idx
  on public.waste_listings(household_id);

create index if not exists waste_listings_status_idx
  on public.waste_listings(status);

create index if not exists waste_listings_category_id_idx
  on public.waste_listings(category_id);

create index if not exists waste_listings_latitude_longitude_idx
  on public.waste_listings(latitude, longitude);

create index if not exists waste_listings_claimed_by_idx
  on public.waste_listings(claimed_by);

create trigger waste_listings_set_updated_at
before update on public.waste_listings
for each row
execute procedure public.update_updated_at();

create table if not exists public.waste_listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.waste_listings(id) on delete cascade,
  image_path text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists waste_listing_images_listing_id_idx
  on public.waste_listing_images(listing_id);
