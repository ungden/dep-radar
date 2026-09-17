-- dep360: proposed schema for moving the client-side prototype (lib/store.tsx) to Supabase.
-- NOT applied to any database. Review, then add as a migration when the backend is wired up.
-- Only creates new tables; does not touch the legacy review/evidence-radar tables.

create type public.dep360_role as enum ('customer', 'pro');
create type public.dep360_category as enum ('nail', 'makeup', 'skincare', 'hair', 'lash-brow');
create type public.dep360_booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'declined');
create type public.dep360_job_status as enum ('open', 'booked', 'closed');
create type public.dep360_offer_status as enum ('pending', 'accepted', 'rejected');

create table public.dep360_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  default_address text,
  active_role public.dep360_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.dep360_pros (
  id uuid primary key references public.dep360_accounts (id) on delete cascade,
  slug text unique not null,
  title text not null,
  bio text not null default '',
  categories public.dep360_category[] not null default '{}',
  city text not null,
  district text not null,
  areas text[] not null default '{}',
  home_service boolean not null default true,
  studio_address text,
  years_exp int not null default 0,
  accepting_jobs boolean not null default true,
  verified boolean not null default false,
  rating numeric(2, 1) not null default 0,
  review_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.dep360_services (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  category public.dep360_category not null,
  name text not null,
  description text not null default '',
  duration_min int not null check (duration_min >= 15),
  price int not null check (price > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.dep360_works (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  service_id uuid references public.dep360_services (id) on delete set null,
  category public.dep360_category not null,
  title text not null,
  description text not null default '',
  image_paths text[] not null check (cardinality(image_paths) > 0),
  created_at timestamptz not null default now()
);

create table public.dep360_jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.dep360_accounts (id) on delete cascade,
  category public.dep360_category not null,
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  city text not null,
  district text not null,
  at_home boolean not null default true,
  budget_min int not null,
  budget_max int not null check (budget_max >= budget_min),
  status public.dep360_job_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.dep360_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.dep360_jobs (id) on delete cascade,
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  price int not null check (price > 0),
  message text not null,
  status public.dep360_offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (job_id, pro_id)
);

create table public.dep360_bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.dep360_accounts (id),
  pro_id uuid not null references public.dep360_pros (id),
  service_id uuid references public.dep360_services (id) on delete set null,
  offer_id uuid references public.dep360_offers (id) on delete set null,
  service_name text not null,
  category public.dep360_category not null,
  duration_min int not null,
  starts_at timestamptz not null,
  at_home boolean not null,
  address text not null,
  note text not null default '',
  total int not null,
  deposit int not null,
  status public.dep360_booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index on public.dep360_bookings (pro_id, starts_at);
create index on public.dep360_bookings (customer_id, starts_at);
create index on public.dep360_jobs (status, city, category, starts_at);

create table public.dep360_reviews (
  booking_id uuid primary key references public.dep360_bookings (id) on delete cascade,
  pro_id uuid not null references public.dep360_pros (id) on delete cascade,
  customer_id uuid not null references public.dep360_accounts (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now()
);

create table public.dep360_saved_works (
  account_id uuid references public.dep360_accounts (id) on delete cascade,
  work_id uuid references public.dep360_works (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_id, work_id)
);

create table public.dep360_follows (
  account_id uuid references public.dep360_accounts (id) on delete cascade,
  pro_id uuid references public.dep360_pros (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_id, pro_id)
);

-- Row level security ---------------------------------------------------------
alter table public.dep360_accounts enable row level security;
alter table public.dep360_pros enable row level security;
alter table public.dep360_services enable row level security;
alter table public.dep360_works enable row level security;
alter table public.dep360_jobs enable row level security;
alter table public.dep360_offers enable row level security;
alter table public.dep360_bookings enable row level security;
alter table public.dep360_reviews enable row level security;
alter table public.dep360_saved_works enable row level security;
alter table public.dep360_follows enable row level security;

create policy "own account" on public.dep360_accounts
  for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "public pros" on public.dep360_pros for select using (true);
create policy "pro edits self" on public.dep360_pros
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "public active services" on public.dep360_services
  for select using (active or (select auth.uid()) = pro_id);
create policy "pro manages services" on public.dep360_services
  for all using ((select auth.uid()) = pro_id) with check ((select auth.uid()) = pro_id);

create policy "public works" on public.dep360_works for select using (true);
create policy "pro manages works" on public.dep360_works
  for all using ((select auth.uid()) = pro_id) with check ((select auth.uid()) = pro_id);

-- Open jobs are visible to signed-in pros; customers see their own.
create policy "job visibility" on public.dep360_jobs for select using (
  (select auth.uid()) = customer_id
  or (status = 'open' and exists (select 1 from public.dep360_pros p where p.id = (select auth.uid())))
);
create policy "customer manages jobs" on public.dep360_jobs
  for all using ((select auth.uid()) = customer_id) with check ((select auth.uid()) = customer_id);

create policy "offer visibility" on public.dep360_offers for select using (
  (select auth.uid()) = pro_id
  or exists (select 1 from public.dep360_jobs j where j.id = job_id and j.customer_id = (select auth.uid()))
);
create policy "pro sends offers" on public.dep360_offers
  for insert with check ((select auth.uid()) = pro_id);
create policy "pro withdraws pending offer" on public.dep360_offers
  for delete using ((select auth.uid()) = pro_id and status = 'pending');

create policy "booking parties" on public.dep360_bookings
  for select using ((select auth.uid()) in (customer_id, pro_id));
create policy "customer creates booking" on public.dep360_bookings
  for insert with check ((select auth.uid()) = customer_id and status = 'pending');
-- Status transitions (confirm/decline/complete/cancel, accepting an offer) should go
-- through security-definer RPCs that enforce who may move a booking to which status.

create policy "public reviews" on public.dep360_reviews for select using (true);
create policy "customer reviews completed booking" on public.dep360_reviews for insert with check (
  (select auth.uid()) = customer_id
  and exists (
    select 1 from public.dep360_bookings b
    where b.id = booking_id and b.customer_id = (select auth.uid()) and b.status = 'completed'
  )
);

create policy "own saved works" on public.dep360_saved_works
  for all using ((select auth.uid()) = account_id) with check ((select auth.uid()) = account_id);
create policy "own follows" on public.dep360_follows
  for all using ((select auth.uid()) = account_id) with check ((select auth.uid()) = account_id);
