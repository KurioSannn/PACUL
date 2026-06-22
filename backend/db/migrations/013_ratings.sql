-- 013_ratings.sql
-- Post-pickup and post-transaction ratings between platform actors.

create table if not exists public.ratings_reviews (
  id uuid primary key default gen_random_uuid(),
  rater_id uuid not null references public.user_profiles(id) on delete cascade,
  ratee_id uuid not null references public.user_profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  context_type text not null check (context_type in ('pickup', 'transaction')),
  context_id uuid not null,
  created_at timestamptz not null default now(),
  unique (rater_id, ratee_id, context_type, context_id)
);

create index if not exists ratings_reviews_ratee_id_idx
  on public.ratings_reviews(ratee_id);

create index if not exists ratings_reviews_rater_id_idx
  on public.ratings_reviews(rater_id);

create index if not exists ratings_reviews_context_type_idx
  on public.ratings_reviews(context_type);

create index if not exists ratings_reviews_context_id_idx
  on public.ratings_reviews(context_id);
