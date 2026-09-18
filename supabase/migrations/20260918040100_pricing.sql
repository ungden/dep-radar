-- Pricing and geography, server side. These functions are the SQL mirror of
-- lib/pricing.ts and lib/geo.ts; tests/pricing.test.ts and tests/db-pricing.test.ts
-- assert both sides agree, because a mismatch here is money.

create function public.app_timezone() returns text
language sql immutable set search_path = '' as $$ select 'Asia/Ho_Chi_Minh'::text $$;

-- Distance on the road between two points: haversine widened by the road factor.
create function public.travel_distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision,
  road_factor numeric default null
) returns numeric
language plpgsql stable set search_path = '' as $$
declare
  r constant double precision := 6371;
  factor numeric := road_factor;
  h double precision;
  straight double precision;
begin
  if lat1 is null or lng1 is null or lat2 is null or lng2 is null then
    return null;
  end if;
  if factor is null then
    select p.road_factor into factor from public.fee_policy p where p.id;
  end if;
  h := sin(radians(lat2 - lat1) / 2) ^ 2
     + cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2;
  straight := 2 * r * asin(sqrt(h));
  -- Same building or same block still costs a ride across the district.
  return greatest(round((straight * factor)::numeric, 1), 2.0);
end $$;

-- Free inside the radius, then per km, rounded up to 5.000đ, capped.
create function public.travel_fee(distance_km numeric) returns int
language plpgsql stable set search_path = '' as $$
declare p record; extra numeric;
begin
  if distance_km is null then return 0; end if;
  select * into p from public.fee_policy where id;
  extra := distance_km - p.free_travel_km;
  if extra <= 0 then return 0; end if;
  return least(p.travel_fee_cap, ceil(extra * p.travel_fee_per_km / 5000.0)::int * 5000);
end $$;

-- One rounding rule for commission everywhere: to the nearest 1.000đ.
create function public.commission_for(service_price int, rate numeric) returns int
language sql immutable set search_path = '' as $$
  select (round(service_price * rate / 1000.0) * 1000)::int
$$;

create function public.is_urgent(starts_at timestamptz, at timestamptz default now()) returns boolean
language plpgsql stable set search_path = '' as $$
declare hrs numeric; window_hours int;
begin
  select urgent_within_hours into window_hours from public.fee_policy where id;
  hrs := extract(epoch from (starts_at - at)) / 3600;
  return hrs >= 0 and hrs < window_hours;
end $$;

-- The quote a customer is shown and a booking stores. Computed here, once.
create type public.quote as (
  service_price int,
  distance_km numeric,
  travel_fee int,
  urgent_fee int,
  total int,
  commission_rate numeric,
  commission int,
  payout int
);

create function public.build_quote(
  unit_price int,
  quantity int,
  at_home boolean,
  distance_km numeric,
  urgent boolean
) returns public.quote
language plpgsql stable set search_path = '' as $$
declare p record; q public.quote;
begin
  select * into p from public.fee_policy where id;
  q.service_price := unit_price * greatest(quantity, 1);
  q.distance_km := case when at_home then distance_km end;
  q.travel_fee := case when at_home then public.travel_fee(distance_km) else 0 end;
  q.urgent_fee := case when urgent then p.urgent_fee else 0 end;
  q.total := q.service_price + q.travel_fee + q.urgent_fee;
  q.commission_rate := p.commission_rate;
  q.commission := public.commission_for(q.service_price, p.commission_rate);
  q.payout := q.total - q.commission;
  return q;
end $$;

-- Wallet balance. Prepaid commission: negative past the threshold stops new jobs.
create function public.wallet_balance(p_pro uuid) returns int
language sql stable set search_path = '' as $$
  select coalesce(sum(amount), 0)::int from public.wallet_entries where pro_id = p_pro
$$;

grant execute on function
  public.app_timezone(),
  public.travel_distance_km(double precision, double precision, double precision, double precision, numeric),
  public.travel_fee(numeric),
  public.commission_for(int, numeric),
  public.is_urgent(timestamptz, timestamptz),
  public.build_quote(int, int, boolean, numeric, boolean),
  public.wallet_balance(uuid)
to authenticated, anon;
