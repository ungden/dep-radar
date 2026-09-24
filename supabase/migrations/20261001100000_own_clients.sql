-- Khách tự mang về: a customer who reaches a partner through the partner's own
-- QR code (the portfolio pictures) or booking link, and books them, costs that
-- partner a lower commission on every booking with them, Fresha style. The
-- owner chose this over a cash bonus on 2026-09-24: it pays the partner for
-- bringing clients onto 360đẹp without the platform paying out.
--
-- The link carries ?src=qr or ?src=link. The browser keeps it until the visitor
-- is signed in, then claims the partner once (claim_own_client). A customer who
-- has already booked that partner through 360đẹp is the marketplace's, not
-- "brought", and is refused. The rate is decided here, when the booking row is
-- written, so no client can pick its own commission.

alter table public.fee_policy
  add column own_client_commission_rate numeric(4, 3) not null default 0.05,
  add constraint fee_policy_own_client_rate check (own_client_commission_rate between 0 and commission_rate);

-- Set by the trigger below, never by a client.
alter table public.bookings add column own_client boolean not null default false;

create table public.pro_clients (
  pro_id uuid not null references public.pros (id) on delete cascade,
  customer_id uuid not null references public.accounts (id) on delete cascade,
  channel text not null check (channel in ('qr', 'link')),
  created_at timestamptz not null default now(),
  primary key (pro_id, customer_id),
  check (pro_id <> customer_id)
);
create index pro_clients_customer_idx on public.pro_clients (customer_id);

alter table public.pro_clients enable row level security;
create policy "partner and customer see their tie" on public.pro_clients
  for select using ((select auth.uid()) in (pro_id, customer_id) or (select public.is_admin()));
revoke all on public.pro_clients from anon, authenticated;
grant select on public.pro_clients to authenticated;
grant all on public.pro_clients to service_role;

-- Visits to a partner's page that came from their own QR or link, per day. A
-- counter anyone can bump, so it is a vanity number and nothing is paid on it.
create table public.pro_link_visits (
  pro_id uuid not null references public.pros (id) on delete cascade,
  day date not null,
  channel text not null check (channel in ('qr', 'link')),
  visits int not null default 0 check (visits >= 0),
  primary key (pro_id, day, channel)
);

alter table public.pro_link_visits enable row level security;
create policy "partner sees their own visits" on public.pro_link_visits
  for select using ((select auth.uid()) = pro_id or (select public.is_admin()));
revoke all on public.pro_link_visits from anon, authenticated;
grant select on public.pro_link_visits to authenticated;
grant all on public.pro_link_visits to service_role;

create function public.log_pro_visit(p_slug text, p_channel text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
begin
  if p_channel not in ('qr', 'link') then return; end if;
  select id into target from public.pros where slug = p_slug and published and suspended_at is null;
  -- The partner opening their own link is not a visit.
  if target is null or target = auth.uid() then return; end if;
  insert into public.pro_link_visits as v (pro_id, day, channel, visits)
  values (target, (now() at time zone public.app_timezone())::date, p_channel, 1)
  on conflict (pro_id, day, channel) do update set visits = v.visits + 1;
end $$;

revoke execute on function public.log_pro_visit(text, text) from public;
grant execute on function public.log_pro_visit(text, text) to anon, authenticated;

-- 'claimed' with the partner's name, or why not: 'self', 'known' (already booked
-- them), 'already' (claimed before), 'unknown' (no such open profile).
create function public.claim_own_client(p_slug text, p_channel text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  target public.pros;
  who text;
begin
  if me is null then
    raise exception 'Cần đăng nhập' using errcode = 'check_violation';
  end if;
  if p_channel not in ('qr', 'link') then
    raise exception 'Nguồn không hợp lệ' using errcode = 'check_violation';
  end if;
  select * into target from public.pros where slug = p_slug and published and suspended_at is null;
  if target.id is null then return jsonb_build_object('result', 'unknown'); end if;
  if target.id = me then return jsonb_build_object('result', 'self'); end if;
  if exists (select 1 from public.pro_clients where pro_id = target.id and customer_id = me) then
    return jsonb_build_object('result', 'already');
  end if;
  if exists (select 1 from public.bookings where pro_id = target.id and customer_id = me) then
    return jsonb_build_object('result', 'known');
  end if;
  insert into public.pro_clients (pro_id, customer_id, channel) values (target.id, me, p_channel);
  select full_name into who from public.accounts where id = target.id;
  return jsonb_build_object('result', 'claimed', 'name', coalesce(nullif(target.display_name, ''), who));
end $$;

revoke execute on function public.claim_own_client(text, text) from public, anon;
grant execute on function public.claim_own_client(text, text) to authenticated;

-- Every booking row, whichever RPC writes it (create_booking, a request taken
-- from the board): the partner's own client gets the own-client rate.
create function public.booking_own_client_rate() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rate numeric;
begin
  new.own_client := false;
  if exists (select 1 from public.pro_clients where pro_id = new.pro_id and customer_id = new.customer_id) then
    select own_client_commission_rate into rate from public.fee_policy;
    if rate is not null and rate < new.commission_rate then
      new.own_client := true;
      new.commission_rate := rate;
      new.commission := public.commission_for(new.service_price, rate);
    end if;
  end if;
  return new;
end $$;

revoke execute on function public.booking_own_client_rate() from public, anon, authenticated;

create trigger booking_own_client
  before insert on public.bookings
  for each row execute function public.booking_own_client_rate();

-- What the partner's own channels brought them, for the studio.
create function public.my_own_client_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  policy public.fee_policy;
  result jsonb;
begin
  if me is null or not exists (select 1 from public.pros where id = me) then return null; end if;
  select * into policy from public.fee_policy;
  select jsonb_build_object(
    'rate', policy.own_client_commission_rate,
    'standardRate', policy.commission_rate,
    'visits30d', coalesce((select sum(visits) from public.pro_link_visits
                           where pro_id = me and day > (now() at time zone public.app_timezone())::date - 30), 0),
    'clients', (select count(*) from public.pro_clients where pro_id = me),
    'completed', (select count(*) from public.bookings where pro_id = me and own_client and status = 'completed'),
    'saved', coalesce((select sum(public.commission_for(service_price, policy.commission_rate) - commission)
                       from public.bookings where pro_id = me and own_client and status = 'completed'), 0)
  ) into result;
  return result;
end $$;

revoke execute on function public.my_own_client_stats() from public, anon;
grant execute on function public.my_own_client_stats() to authenticated;

-- Admin: partners ranked by the clients they bring.
create function public.admin_own_client_ranking() returns table (
  pro_id uuid, slug text, name text, visits30d bigint, clients bigint, completed bigint, gmv bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Chỉ dành cho quản trị' using errcode = 'insufficient_privilege';
  end if;
  return query
  select p.id, p.slug, coalesce(nullif(p.display_name, ''), a.full_name),
    coalesce((select sum(v.visits) from public.pro_link_visits v
              where v.pro_id = p.id and v.day > (now() at time zone public.app_timezone())::date - 30), 0)::bigint,
    (select count(*) from public.pro_clients c where c.pro_id = p.id),
    (select count(*) from public.bookings b where b.pro_id = p.id and b.own_client and b.status = 'completed'),
    coalesce((select sum(b.total) from public.bookings b where b.pro_id = p.id and b.own_client and b.status = 'completed'), 0)::bigint
  from public.pros p join public.accounts a on a.id = p.id
  where exists (select 1 from public.pro_link_visits v where v.pro_id = p.id)
     or exists (select 1 from public.pro_clients c where c.pro_id = p.id)
  order by 6 desc, 5 desc, 4 desc
  limit 100;
end $$;

revoke execute on function public.admin_own_client_ranking() from public, anon;
grant execute on function public.admin_own_client_ranking() to authenticated;
