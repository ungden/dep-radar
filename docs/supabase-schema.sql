-- dep360: proposed schema for moving the client-side prototype (lib/store.tsx) to Supabase.
-- NOT applied to any database. Review, then add as a migration when the backend is wired up.
--
-- Business rules encoded here (mirrors lib/catalog.ts, lib/pricing.ts, lib/trust.ts):
--  * dep360 owns the service catalogue (names, what's included, options, price bands).
--  * Freelancers list catalogue services only, pricing each option inside its band.
--  * Customers pay no platform fee. dep360 takes a flat commission on the service
--    price only; travel and urgent fees go 100% to the freelancer.
--  * Identity verification (CCCD + selfie read by a vision AI) is optional; verified
--    freelancers get a badge and a ranking boost. Images are not stored.
--  * Quotes are computed and snapshotted server-side at booking time.
--  * No deposit. Customers pay the full amount online, or pay the freelancer directly
--    after the service; cash-job commission becomes freelancer debt netted weekly.
--  * The freelancer calls the customer to confirm before accepting a booking.

create type public.dep360_role as enum ('customer', 'pro');
create type public.dep360_category as enum ('nail', 'makeup', 'skincare', 'hair', 'lash-brow', 'massage');
create type public.dep360_verification_status as enum ('none', 'pending', 'verified', 'rejected');
create type public.dep360_booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'declined');
create type public.dep360_job_status as enum ('open', 'booked', 'closed');
create type public.dep360_offer_status as enum ('pending', 'accepted', 'rejected');
create type public.dep360_payment_method as enum ('online', 'cash');

-- Platform configuration ------------------------------------------------------

create table public.dep360_fee_policy (
  id boolean primary key default true check (id), -- single row
  confirm_within_hours int not null default 2,
  late_cancel_rate numeric(4, 3) not null default 0.3,
  free_travel_km numeric(5, 1) not null default 5,
  travel_fee_per_km int not null default 5000,
  travel_fee_cap int not null default 100000,
  urgent_within_hours int not null default 3,
  urgent_fee int not null default 50000,
  min_lead_minutes int not null default 60,
  free_cancel_hours int not null default 12,
  commission_rate numeric(4, 3) not null default 0.15,
  updated_at timestamptz not null default now()
);

create table public.dep360_service_templates (
  id text primary key,
  category public.dep360_category not null,
  name text not null,
  description text not null,
  includes text[] not null default '{}',
  studio_only boolean not null default false,
  active boolean not null default true
);

create table public.dep360_service_variants (
  template_id text not null references public.dep360_service_templates (id) on delete cascade,
  id text not null,
  label text not null,
  duration_min int not null check (duration_min >= 15),
  min_price int not null check (min_price > 0),
  max_price int not null,
  suggested_price int not null,
  primary key (template_id, id),
  check (min_price <= suggested_price and suggested_price <= max_price)
);

create table public.dep360_districts (
  city text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  primary key (city, district)
);

-- People ------------------------------------------------------------------------

create table public.dep360_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  default_city text,
  default_district text,
  default_address text,
  active_role public.dep360_role not null default 'customer',
  created_at timestamptz not null default now(),
  foreign key (default_city, default_district) references public.dep360_districts (city, district)
);

create table public.dep360_pros (
  id uuid primary key references public.dep360_accounts (id) on delete cascade,
  slug text unique not null,
  title text not null,
  bio text not null default '',
  highlights text[] not null default '{}',
  categories public.dep360_category[] not null default '{}',
  city text not null,
  district text not null,
  home_service boolean not null default true,
  studio_address text,
  max_travel_km numeric(4, 1) not null default 10 check (max_travel_km between 1 and 30),
  years_exp int not null default 0,
  accepting_jobs boolean not null default true,
  -- Denormalised metrics, recomputed nightly.
  completed_jobs int not null default 0,
  response_minutes int not null default 0,
  identity_status public.dep360_verification_status not null default 'none', -- drives badge & ranking boost
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  foreign key (city, district) references public.dep360_districts (city, district)
);

create table public.dep360_identity_checks (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  status public.dep360_verification_status not null default 'pending',
  model text not null,                 -- e.g. 'gemini-3.5-flash'
  name_on_card text,
  name_matches boolean,
  same_person text check (same_person in ('yes', 'no', 'uncertain')),
  confidence numeric(4, 3),
  reject_reason text,
  consent_at timestamptz not null,     -- explicit consent (Decree 13/2023)
  created_at timestamptz not null default now(),
  decided_at timestamptz
  -- No image columns: CCCD and selfie images are sent to the AI and not stored.
);

-- Listings ----------------------------------------------------------------------

create table public.dep360_pro_services (
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  template_id text not null references public.dep360_service_templates (id),
  active boolean not null default true,
  primary key (pro_id, template_id)
);

create table public.dep360_pro_service_prices (
  pro_id uuid not null,
  template_id text not null,
  variant_id text not null,
  price int not null check (price % 5000 = 0),
  primary key (pro_id, template_id, variant_id),
  foreign key (pro_id, template_id) references public.dep360_pro_services (pro_id, template_id) on delete cascade,
  foreign key (template_id, variant_id) references public.dep360_service_variants (template_id, id)
);

-- Enforce the catalogue price band on every write.
create function public.dep360_check_listing_price() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  select min_price, max_price into v from public.dep360_service_variants
    where template_id = new.template_id and id = new.variant_id;
  if new.price < v.min_price or new.price > v.max_price then
    raise exception 'Price % outside allowed band [%, %]', new.price, v.min_price, v.max_price;
  end if;
  return new;
end $$;

create trigger dep360_listing_price_band
  before insert or update on public.dep360_pro_service_prices
  for each row execute function public.dep360_check_listing_price();

create table public.dep360_works (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  template_id text not null references public.dep360_service_templates (id),
  title text not null,
  description text not null default '',
  image_paths text[] not null check (cardinality(image_paths) > 0),
  created_at timestamptz not null default now()
);

-- Requests & offers -------------------------------------------------------------

create table public.dep360_jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.dep360_accounts (id) on delete cascade,
  template_id text not null,
  variant_id text not null,
  description text not null default '',
  starts_at timestamptz not null,
  city text not null,
  district text not null,
  address_detail text not null default '',
  at_home boolean not null default true,
  payment_method public.dep360_payment_method not null default 'online',
  status public.dep360_job_status not null default 'open',
  created_at timestamptz not null default now(),
  foreign key (template_id, variant_id) references public.dep360_service_variants (template_id, id),
  foreign key (city, district) references public.dep360_districts (city, district)
);

create table public.dep360_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.dep360_jobs (id) on delete cascade,
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  price int not null check (price % 5000 = 0), -- band checked in the send_offer RPC
  message text not null check (char_length(message) >= 10),
  status public.dep360_offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (job_id, pro_id)
);

-- Bookings (quote snapshot) -----------------------------------------------------

create table public.dep360_bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.dep360_accounts (id),
  pro_id uuid not null references public.dep360_pros (id),
  template_id text not null,
  variant_id text not null,
  offer_id uuid references public.dep360_offers (id) on delete set null,
  starts_at timestamptz not null,
  duration_min int not null,
  at_home boolean not null,
  city text not null,
  district text not null,
  address text not null,
  note text not null default '',
  -- Snapshot of the quote at booking time (never recomputed).
  service_price int not null,
  distance_km numeric(5, 1),
  travel_fee int not null default 0,
  urgent_fee int not null default 0,
  total int generated always as (service_price + travel_fee + urgent_fee) stored,
  payment_method public.dep360_payment_method not null,
  paid_at timestamptz,          -- online payments only
  refunded_amount int not null default 0,
  commission_rate numeric(4, 3) not null,
  commission int not null,
  payout int generated always as (service_price + travel_fee + urgent_fee - commission) stored,
  status public.dep360_booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,     -- set when the freelancer has called and accepted
  completed_at timestamptz,
  cancelled_by public.dep360_role,
  cancelled_at timestamptz,
  foreign key (template_id, variant_id) references public.dep360_service_variants (template_id, id)
);

create index on public.dep360_bookings (pro_id, starts_at);
create index on public.dep360_bookings (customer_id, starts_at);
create index on public.dep360_jobs (status, city, starts_at);

-- Commission ledger: one row per completed booking. Online jobs are settled by
-- paying out `payout`; cash jobs create a debit of `commission`. Weekly settlement
-- nets the two per freelancer.
create table public.dep360_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  booking_id uuid references public.dep360_bookings (id) on delete set null,
  kind text not null check (kind in ('online_payout', 'cash_commission', 'late_cancel_comp', 'settlement')),
  amount int not null, -- positive: dep360 owes freelancer; negative: freelancer owes dep360
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.dep360_reviews (
  booking_id uuid primary key references public.dep360_bookings (id) on delete cascade,
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  customer_id uuid not null references public.dep360_accounts (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  body text not null check (char_length(body) >= 10),
  photo_path text,
  reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.dep360_saved_works (
  account_id uuid references public.dep360_accounts (id) on delete cascade,
  work_id uuid references public.dep360_works (id) on delete cascade,
  primary key (account_id, work_id)
);

create table public.dep360_follows (
  account_id uuid references public.dep360_accounts (id) on delete cascade,
  pro_id uuid references public.dep360_pros (id) on delete cascade,
  primary key (account_id, pro_id)
);

-- Row level security -------------------------------------------------------------
-- Money and status changes (create_booking, confirm/decline/complete/cancel,
-- send_offer, accept_offer, recompute metrics) go through security-definer RPCs that
-- read dep360_fee_policy, so clients can never write prices or fees.

alter table public.dep360_fee_policy enable row level security;
alter table public.dep360_service_templates enable row level security;
alter table public.dep360_service_variants enable row level security;
alter table public.dep360_districts enable row level security;
alter table public.dep360_accounts enable row level security;
alter table public.dep360_pros enable row level security;
alter table public.dep360_identity_checks enable row level security;
alter table public.dep360_pro_services enable row level security;
alter table public.dep360_pro_service_prices enable row level security;
alter table public.dep360_works enable row level security;
alter table public.dep360_jobs enable row level security;
alter table public.dep360_offers enable row level security;
alter table public.dep360_bookings enable row level security;
alter table public.dep360_ledger_entries enable row level security;
alter table public.dep360_reviews enable row level security;
alter table public.dep360_saved_works enable row level security;
alter table public.dep360_follows enable row level security;

create policy "public config" on public.dep360_fee_policy for select using (true);
create policy "public catalogue" on public.dep360_service_templates for select using (active);
create policy "public variants" on public.dep360_service_variants for select using (true);
create policy "public districts" on public.dep360_districts for select using (true);

create policy "own account" on public.dep360_accounts
  for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "public pros" on public.dep360_pros for select using (true);
-- Pros edit profile fields through an RPC that ignores metric columns.

create policy "pro sees own identity checks" on public.dep360_identity_checks
  for select using ((select auth.uid()) = pro_id);
-- Checks are created by the /api/identity server route (service role), never by clients.

create policy "public listings" on public.dep360_pro_services for select using (active or (select auth.uid()) = pro_id);
create policy "pro manages listings" on public.dep360_pro_services
  for all using ((select auth.uid()) = pro_id) with check ((select auth.uid()) = pro_id);
create policy "public prices" on public.dep360_pro_service_prices for select using (true);
create policy "pro manages prices" on public.dep360_pro_service_prices
  for all using ((select auth.uid()) = pro_id) with check ((select auth.uid()) = pro_id);

create policy "public works" on public.dep360_works for select using (true);
create policy "pro manages works" on public.dep360_works
  for all using ((select auth.uid()) = pro_id) with check ((select auth.uid()) = pro_id);

create policy "job visibility" on public.dep360_jobs for select using (
  (select auth.uid()) = customer_id
  or (status = 'open' and exists (select 1 from public.dep360_pros p where p.id = (select auth.uid())))
);
create policy "customer posts jobs" on public.dep360_jobs
  for insert with check ((select auth.uid()) = customer_id and status = 'open');

create policy "offer visibility" on public.dep360_offers for select using (
  (select auth.uid()) = pro_id
  or exists (select 1 from public.dep360_jobs j where j.id = job_id and j.customer_id = (select auth.uid()))
);
create policy "pro withdraws pending offer" on public.dep360_offers
  for delete using ((select auth.uid()) = pro_id and status = 'pending');

create policy "booking parties" on public.dep360_bookings
  for select using ((select auth.uid()) in (customer_id, pro_id));

create policy "pro sees own ledger" on public.dep360_ledger_entries
  for select using ((select auth.uid()) = pro_id);

create policy "public reviews" on public.dep360_reviews for select using (true);

create policy "own saved works" on public.dep360_saved_works
  for all using ((select auth.uid()) = account_id) with check ((select auth.uid()) = account_id);
create policy "own follows" on public.dep360_follows
  for all using ((select auth.uid()) = account_id) with check ((select auth.uid()) = account_id);
