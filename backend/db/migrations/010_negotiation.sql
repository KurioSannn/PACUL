-- 010_negotiation.sql
-- Negotiation threads, messages, and offers for industry–collector order deals.

create table if not exists public.negotiation_threads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  industry_id uuid not null references public.user_profiles(id) on delete cascade,
  collector_id uuid not null references public.user_profiles(id) on delete cascade,
  status text not null default 'open' check (
    status in ('open', 'countered', 'accepted', 'cancelled', 'expired')
  ),
  last_offer_by uuid references public.user_profiles(id) on delete set null,
  last_offer_price_per_kg decimal,
  last_offer_weight_kg decimal,
  agreed_price_per_kg decimal,
  agreed_weight_kg decimal,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists negotiation_threads_order_id_idx
  on public.negotiation_threads(order_id);

create index if not exists negotiation_threads_industry_id_idx
  on public.negotiation_threads(industry_id);

create index if not exists negotiation_threads_collector_id_idx
  on public.negotiation_threads(collector_id);

create index if not exists negotiation_threads_status_idx
  on public.negotiation_threads(status);

create trigger negotiation_threads_set_updated_at
before update on public.negotiation_threads
for each row
execute procedure public.update_updated_at();

create table if not exists public.negotiation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.negotiation_threads(id) on delete cascade,
  sender_id uuid not null references public.user_profiles(id) on delete cascade,
  message_type text not null check (
    message_type in (
      'text',
      'offer',
      'counter_offer',
      'system',
      'accepted',
      'cancelled'
    )
  ),
  content text,
  offer_price_per_kg decimal,
  offer_weight_kg decimal,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists negotiation_messages_thread_id_idx
  on public.negotiation_messages(thread_id);

create index if not exists negotiation_messages_sender_id_idx
  on public.negotiation_messages(sender_id);

create index if not exists negotiation_messages_created_at_idx
  on public.negotiation_messages(created_at);

create index if not exists negotiation_messages_thread_id_created_at_idx
  on public.negotiation_messages(thread_id, created_at);

create table if not exists public.negotiation_offers (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.negotiation_threads(id) on delete cascade,
  message_id uuid references public.negotiation_messages(id) on delete set null,
  offered_by uuid not null references public.user_profiles(id) on delete cascade,
  price_per_kg decimal not null,
  weight_kg decimal not null,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'countered', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

create index if not exists negotiation_offers_thread_id_idx
  on public.negotiation_offers(thread_id);

create index if not exists negotiation_offers_offered_by_idx
  on public.negotiation_offers(offered_by);

create index if not exists negotiation_offers_status_idx
  on public.negotiation_offers(status);

create index if not exists negotiation_offers_thread_id_status_idx
  on public.negotiation_offers(thread_id, status);
