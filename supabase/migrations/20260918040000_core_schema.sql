-- dep360 core schema.
--
-- Rules encoded here (the server, not the browser, owns them):
--  * dep360 owns the service catalogue: names, options, durations and price bands.
--    Freelancers list catalogue services only and price each option inside its band.
--  * Customers pay no platform fee. dep360 takes a flat commission on the service
--    price, paid by the freelancer. Travel and urgent fees go 100% to the freelancer.
--  * No deposit. The freelancer calls the customer and accepts before a booking is
--    confirmed; money changes hands between customer and freelancer.
--  * A quote is computed and snapshotted when the booking is created, never recomputed.
--  * Identity verification (CCCD + selfie read by a vision AI) is optional and rewarded
--    with a badge and a ranking boost. No image is ever stored.
--  * Every timestamp is timestamptz; the product speaks Asia/Ho_Chi_Minh.

create extension if not exists btree_gist;

-- Enums -----------------------------------------------------------------------

create type public.app_role as enum ('customer', 'pro');
create type public.category_id as enum ('nail', 'makeup', 'skincare', 'hair', 'lash-brow', 'massage');
create type public.verification_status as enum ('none', 'pending', 'verified', 'rejected');
create type public.payment_method as enum ('online', 'cash');

-- pending: waiting for the freelancer to call and accept.
-- expired: nobody accepted in time.
-- no_show: the customer was not there.
create type public.booking_status as enum (
  'pending', 'confirmed', 'in_progress', 'completed',
  'declined', 'cancelled', 'expired', 'no_show'
);

create type public.job_status as enum ('open', 'booked', 'expired', 'closed');
create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');

-- Platform configuration ------------------------------------------------------

-- Single row. Read by the pricing functions, so no client can invent a fee.
create table public.fee_policy (
  id boolean primary key default true check (id),
  commission_rate numeric(4, 3) not null default 0.15,
  confirm_within_hours int not null default 2,
  late_cancel_rate numeric(4, 3) not null default 0.3,
  free_travel_km numeric(5, 1) not null default 5,
  travel_fee_per_km int not null default 5000,
  travel_fee_cap int not null default 100000,
  urgent_within_hours int not null default 3,
  urgent_fee int not null default 50000,
  min_lead_minutes int not null default 60,
  free_cancel_hours int not null default 12,
  -- Road factor applied to straight-line distance between two points.
  road_factor numeric(4, 2) not null default 1.35,
  -- Travel time reserved after each job before the freelancer's next one.
  default_buffer_min int not null default 30,
  updated_at timestamptz not null default now()
);

insert into public.fee_policy (id) values (true);

-- Catalogue -------------------------------------------------------------------

create table public.service_templates (
  id text primary key,
  category public.category_id not null,
  name text not null,
  description text not null default '',
  includes text[] not null default '{}',
  studio_only boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0
);

create table public.service_variants (
  template_id text not null references public.service_templates (id) on delete cascade,
  id text not null,
  label text not null,
  duration_min int not null check (duration_min >= 15),
  min_price int not null check (min_price > 0 and min_price % 5000 = 0),
  max_price int not null check (max_price % 5000 = 0),
  suggested_price int not null check (suggested_price % 5000 = 0),
  -- "Nhóm (giá mỗi người)": price and duration are multiplied by the head count.
  per_person boolean not null default false,
  max_quantity int not null default 1 check (max_quantity between 1 and 20),
  sort_order int not null default 0,
  primary key (template_id, id),
  check (min_price <= suggested_price and suggested_price <= max_price),
  check (per_person or max_quantity = 1)
);

-- Reference geography. Not a foreign key anywhere: addresses carry their own
-- coordinates, this table only powers pickers and the city/district fallback.
create table public.districts (
  city text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  sort_order int not null default 0,
  primary key (city, district)
);

-- People ----------------------------------------------------------------------

create table public.accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',            -- E.164
  avatar_path text,
  active_role public.app_role not null default 'customer',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.pros (
  id uuid primary key references public.accounts (id) on delete cascade,
  slug text unique not null,
  title text not null default '',
  bio text not null default '',
  highlights text[] not null default '{}',
  categories public.category_id[] not null default '{}',
  city text not null,
  district text not null,
  lat double precision,
  lng double precision,
  areas text[] not null default '{}',
  home_service boolean not null default true,
  studio_address text,
  max_travel_km numeric(4, 1) not null default 10 check (max_travel_km between 1 and 30),
  buffer_min int not null default 30 check (buffer_min between 0 and 120),
  max_jobs_per_day int not null default 6 check (max_jobs_per_day between 1 and 20),
  years_exp int not null default 0,
  accepting_jobs boolean not null default true,
  -- A profile is only listed once it has a service, working hours and a portrait.
  published boolean not null default false,
  suspended_at timestamptz,
  identity_status public.verification_status not null default 'none',
  identity_name text,                        -- locked display name from the ID card
  -- Denormalised metrics, recomputed nightly by recompute_pro_metrics().
  completed_jobs int not null default 0,
  response_minutes int not null default 0,
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);

create index pros_city_idx on public.pros (city, district) where published;

create table public.identity_checks (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  status public.verification_status not null default 'pending',
  model text not null,
  name_on_card text,
  name_matches boolean,
  same_person text check (same_person in ('yes', 'no', 'uncertain')),
  confidence numeric(4, 3),
  reject_reason text,
  -- Hash of the ID number, so one card cannot verify many accounts. Never the number.
  card_hash text,
  consent_at timestamptz not null,           -- explicit consent, Decree 13/2023
  created_at timestamptz not null default now(),
  decided_at timestamptz
  -- No image columns: the CCCD and selfie are sent to the AI and not stored.
);

create index identity_checks_pro_idx on public.identity_checks (pro_id, created_at desc);
create unique index identity_checks_card_idx on public.identity_checks (card_hash)
  where status = 'verified' and card_hash is not null;

-- Availability ----------------------------------------------------------------

-- One row per working window; a split shift is two rows for the same weekday.
create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_min int not null check (start_min between 0 and 1439),
  end_min int not null check (end_min between 1 and 1440),
  check (start_min < end_min),
  unique (pro_id, weekday, start_min)
);

create table public.days_off (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  reason text not null default '',
  check (starts_on <= ends_on)
);

create index days_off_pro_idx on public.days_off (pro_id, starts_on);

-- Addresses -------------------------------------------------------------------

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  label text not null default 'Nhà',
  city text not null,
  district text not null,
  detail text not null,
  note text not null default '',             -- building, floor, gate code
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_account_idx on public.addresses (account_id);
create unique index addresses_one_default_idx on public.addresses (account_id) where is_default;

-- Listings --------------------------------------------------------------------

create table public.pro_services (
  pro_id uuid not null references public.pros (id) on delete cascade,
  template_id text not null references public.service_templates (id),
  active boolean not null default true,
  primary key (pro_id, template_id)
);

create table public.pro_service_prices (
  pro_id uuid not null,
  template_id text not null,
  variant_id text not null,
  price int not null check (price % 5000 = 0),
  primary key (pro_id, template_id, variant_id),
  foreign key (pro_id, template_id) references public.pro_services (pro_id, template_id) on delete cascade,
  foreign key (template_id, variant_id) references public.service_variants (template_id, id)
);

-- The catalogue band is enforced on every write, including by the owner.
create function public.check_listing_price() returns trigger
language plpgsql security definer set search_path = '' as $$
declare band record;
begin
  select min_price, max_price into band
    from public.service_variants
    where template_id = new.template_id and id = new.variant_id;
  if band is null then
    raise exception 'Unknown service option %/%', new.template_id, new.variant_id;
  end if;
  if new.price < band.min_price or new.price > band.max_price then
    raise exception 'Giá % nằm ngoài khung cho phép [%, %]', new.price, band.min_price, band.max_price
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger listing_price_band
  before insert or update on public.pro_service_prices
  for each row execute function public.check_listing_price();

-- A studio-only service needs a studio; a service needs a matching speciality.
create function public.check_listing_allowed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare tpl record; pro record;
begin
  select category, studio_only into tpl from public.service_templates where id = new.template_id;
  select studio_address, categories into pro from public.pros where id = new.pro_id;
  if tpl.studio_only and coalesce(pro.studio_address, '') = '' then
    raise exception 'Dịch vụ này chỉ làm tại studio, hồ sơ chưa có địa chỉ studio'
      using errcode = 'check_violation';
  end if;
  if not (tpl.category = any (pro.categories)) then
    raise exception 'Dịch vụ ngoài chuyên môn đã khai của bạn' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger listing_allowed
  before insert or update on public.pro_services
  for each row execute function public.check_listing_allowed();

create table public.works (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  template_id text not null references public.service_templates (id),
  title text not null,
  description text not null default '',
  image_paths text[] not null check (cardinality(image_paths) > 0),
  is_cover boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index works_pro_idx on public.works (pro_id, sort_order);
create index works_template_idx on public.works (template_id);

-- Requests & offers -----------------------------------------------------------

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.accounts (id) on delete cascade,
  template_id text not null,
  variant_id text not null,
  quantity int not null default 1 check (quantity between 1 and 20),
  description text not null default '',
  starts_at timestamptz not null,
  at_home boolean not null default true,
  address_id uuid references public.addresses (id) on delete set null,
  city text not null,
  district text not null,
  payment_method public.payment_method not null default 'cash',
  status public.job_status not null default 'open',
  created_at timestamptz not null default now(),
  foreign key (template_id, variant_id) references public.service_variants (template_id, id)
);

create index jobs_open_idx on public.jobs (city, starts_at) where status = 'open';
create index jobs_customer_idx on public.jobs (customer_id, created_at desc);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  pro_id uuid not null references public.pros (id) on delete cascade,
  price int not null check (price % 5000 = 0),
  message text not null check (char_length(message) >= 10),
  status public.offer_status not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (job_id, pro_id)
);

create index offers_job_idx on public.offers (job_id, status);

-- Bookings --------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.accounts (id),
  pro_id uuid not null references public.pros (id),
  template_id text not null,
  variant_id text not null,
  quantity int not null default 1 check (quantity between 1 and 20),
  offer_id uuid references public.offers (id) on delete set null,
  source text not null default 'direct' check (source in ('direct', 'job')),

  starts_at timestamptz not null,
  duration_min int not null check (duration_min > 0),
  buffer_min int not null default 0 check (buffer_min >= 0),
  -- Both derived from starts_at/duration/buffer by the trigger below. They are
  -- columns rather than generated ones because timestamptz + interval is only
  -- STABLE, and a stored generated column has to be immutable.
  ends_at timestamptz not null default now(),
  -- What the freelancer's calendar is blocked for, travel time included.
  blocked_range tstzrange not null default tstzrange(now(), now()),

  at_home boolean not null,
  city text not null,
  district text not null,
  address text not null default '',
  address_note text not null default '',
  lat double precision,
  lng double precision,
  note text not null default '',

  -- Quote snapshot. Written once by create_booking/accept_offer, never recomputed.
  service_price int not null check (service_price > 0),
  distance_km numeric(5, 1),
  travel_fee int not null default 0 check (travel_fee >= 0),
  urgent_fee int not null default 0 check (urgent_fee >= 0),
  total int generated always as (service_price + travel_fee + urgent_fee) stored,
  commission_rate numeric(4, 3) not null,
  commission int not null check (commission >= 0),
  payout int generated always as (service_price + travel_fee + urgent_fee - commission) stored,

  payment_method public.payment_method not null,
  paid_at timestamptz,
  refunded_amount int not null default 0,

  status public.booking_status not null default 'pending',
  -- The freelancer must call and accept before this moment.
  confirm_by timestamptz not null,
  confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by public.app_role,
  cancel_reason text,
  -- Proposed new start time, waiting for the other side.
  reschedule_to timestamptz,
  reschedule_by public.app_role,
  created_at timestamptz not null default now(),

  foreign key (template_id, variant_id) references public.service_variants (template_id, id),
  check (customer_id <> pro_id)
);

-- Keep the derived window in step with the times, on every write.
create function public.set_booking_window() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.ends_at := new.starts_at + make_interval(mins => new.duration_min);
  new.blocked_range := tstzrange(
    new.starts_at, new.starts_at + make_interval(mins => new.duration_min + new.buffer_min), '[)');
  return new;
end $$;

create trigger booking_window
  before insert or update of starts_at, duration_min, buffer_min on public.bookings
  for each row execute function public.set_booking_window();

-- The database, not the UI, is what makes double-booking impossible.
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (pro_id with =, blocked_range with &&)
  where (status in ('pending', 'confirmed', 'in_progress'));

create index bookings_pro_idx on public.bookings (pro_id, starts_at desc);
create index bookings_customer_idx on public.bookings (customer_id, starts_at desc);
create index bookings_confirm_by_idx on public.bookings (confirm_by) where status = 'pending';

create table public.reviews (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  pro_id uuid not null references public.pros (id) on delete cascade,
  customer_id uuid not null references public.accounts (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  body text not null check (char_length(body) >= 10),
  photo_paths text[] not null default '{}',
  reply text,
  replied_at timestamptz,
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);

create index reviews_pro_idx on public.reviews (pro_id, created_at desc);

-- Freelancer wallet -----------------------------------------------------------

-- Prepaid commission: the freelancer tops the wallet up, each completed job debits
-- the commission. A negative balance past the threshold stops new jobs.
create table public.wallet_entries (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  kind text not null check (kind in ('topup', 'commission', 'adjustment', 'refund', 'no_show_comp')),
  -- Positive credits the freelancer, negative debits them.
  amount int not null,
  ref text,                                  -- bank transfer reference
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (booking_id, kind)
);

create index wallet_pro_idx on public.wallet_entries (pro_id, created_at desc);

-- Messaging, notifications, reports -------------------------------------------

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.accounts (id) on delete cascade,
  pro_id uuid not null references public.pros (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (customer_id, pro_id, booking_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_id uuid not null references public.accounts (id) on delete cascade,
  body text not null default '',
  image_paths text[] not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (body <> '' or cardinality(image_paths) > 0)
);

create index messages_thread_idx on public.messages (thread_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_account_idx on public.notifications (account_id, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.accounts (id) on delete cascade,
  target_account_id uuid references public.accounts (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  work_id uuid references public.works (id) on delete set null,
  review_booking_id uuid references public.reviews (booking_id) on delete set null,
  reason text not null,
  detail text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_open_idx on public.reports (created_at desc) where status in ('open', 'reviewing');

-- Saved / followed ------------------------------------------------------------

create table public.saved_works (
  account_id uuid not null references public.accounts (id) on delete cascade,
  work_id uuid not null references public.works (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_id, work_id)
);

create table public.follows (
  account_id uuid not null references public.accounts (id) on delete cascade,
  pro_id uuid not null references public.pros (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_id, pro_id)
);

-- An account row appears for every auth user, so the app never has to create one.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.accounts (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
