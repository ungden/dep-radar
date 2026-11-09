-- Restricted support desk: explicit roles, no access to payment or admin RPCs.
create table partner_private.support_staff (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  granted_at timestamptz not null default now()
);
create table partner_private.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.accounts(id) on delete cascade,
  author_id uuid references public.accounts(id) on delete set null default auth.uid(),
  body text not null check (length(trim(body)) between 1 and 1500),
  created_at timestamptz not null default now()
);
create index customer_notes_recent_idx on partner_private.customer_notes(customer_id, created_at desc);
create table partner_private.booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event text not null,
  happened_at timestamptz not null default now()
);
create index booking_events_recent_idx on partner_private.booking_events(booking_id, happened_at desc, id desc);
alter table partner_private.support_staff enable row level security;
alter table partner_private.customer_notes enable row level security;
alter table partner_private.booking_events enable row level security;
revoke all on partner_private.support_staff, partner_private.customer_notes, partner_private.booking_events from public, anon, authenticated;

create function partner_private.log_booking_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.in_cart then return new; end if;
  if tg_op = 'INSERT' then
    insert into partner_private.booking_events(booking_id, event) values(new.id, new.status::text);
  else
    if new.status is distinct from old.status then
      insert into partner_private.booking_events(booking_id, event) values(new.id, new.status::text);
    end if;
    if new.starts_at is distinct from old.starts_at then
      insert into partner_private.booking_events(booking_id, event) values(new.id, 'rescheduled');
    end if;
    if new.departed_at is not null and old.departed_at is null then
      insert into partner_private.booking_events(booking_id, event) values(new.id, 'departed');
    end if;
  end if;
  return new;
end $$;
revoke all on function partner_private.log_booking_event() from public, anon, authenticated;
create trigger marketplace_booking_event after insert or update of status, starts_at, departed_at
on public.bookings for each row execute function partner_private.log_booking_event();

create function partner_private.support_access() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (public.is_admin() or exists (
    select 1 from partner_private.support_staff s join public.accounts a on a.id = s.account_id
    where s.account_id = auth.uid() and a.suspended_at is null
  ))
$$;

create function partner_private.support_desk(p_customer uuid, p_filter text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare person jsonb := null; notes jsonb := '[]'; rows jsonb; counts jsonb;
begin
  if not partner_private.support_access() then
    raise exception 'Bạn không có quyền xem bàn CSKH.' using errcode = 'insufficient_privilege';
  end if;
  if p_customer is not null then
    select jsonb_build_object('id', id, 'name', full_name, 'phone', phone)
      into person from public.accounts where id = p_customer;
    if not found then return null; end if;
    select coalesce(jsonb_agg(to_jsonb(n) order by n."createdAt" desc), '[]') into notes
    from (select n.id, n.body, n.created_at as "createdAt", a.full_name as author
      from partner_private.customer_notes n left join public.accounts a on a.id = n.author_id
      where n.customer_id = p_customer order by n.created_at desc limit 100) n;
  end if;
  select coalesce(jsonb_agg(to_jsonb(r) order by r."startsAt" desc), '[]') into rows
  from (
    select b.id, b.customer_id as "customerId", a.full_name as customer,
      p.display_name as provider, coalesce(p.kind, 'artist') as kind,
      b.status::text as status, t.name as service, b.starts_at as "startsAt",
      b.cancel_reason as "reason",
      (select coalesce(jsonb_agg(to_jsonb(e) order by e."at", e.id), '[]')
       from (select e.id, e.event, e.happened_at as "at" from partner_private.booking_events e
         where e.booking_id = b.id order by e.happened_at desc, e.id desc limit 25) e) as events
    from public.bookings b join public.accounts a on a.id = b.customer_id
    join public.pros p on p.id = b.pro_id left join public.service_templates t on t.id = b.template_id
    where not b.in_cart and (p_customer is null or b.customer_id = p_customer)
      and (p_customer is not null or case p_filter
        when 'stalled' then (b.status = 'pending' and b.confirm_by <= now())
          or (b.status = 'confirmed' and b.started_at is null and b.ends_at < now())
        when 'live' then b.status in ('pending','confirmed','in_progress') and b.ends_at >= now()
        when 'failed' then b.status in ('expired','declined','cancelled','no_show') and b.created_at >= now() - interval '30 days'
        else b.created_at >= now() - interval '30 days' end)
    order by b.starts_at desc limit 100
  ) r;
  select jsonb_build_object(
    'waiting', count(*) filter (where status = 'pending'),
    'live', count(*) filter (where status = 'in_progress'),
    'stalled', count(*) filter (where (status = 'pending' and confirm_by <= now()) or (status = 'confirmed' and started_at is null and ends_at < now())),
    'failed', count(*) filter (where status in ('expired','declined','cancelled','no_show'))
  ) into counts from public.bookings
  where p_customer is null and not in_cart and (created_at >= now() - interval '30 days' or status in ('pending','confirmed','in_progress'));
  return jsonb_build_object('person', person, 'notes', notes, 'bookings', rows, 'counts', counts);
end $$;

create function partner_private.add_customer_note(p_customer uuid, p_body text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not partner_private.support_access() then
    raise exception 'Bạn không có quyền ghi chú CSKH.' using errcode = 'insufficient_privilege';
  end if;
  if p_body is null or length(trim(p_body)) not between 1 and 1500 then
    raise exception 'Ghi chú phải từ 1 đến 1500 ký tự.' using errcode = 'check_violation';
  end if;
  insert into partner_private.customer_notes(customer_id, body) values(p_customer, trim(p_body));
end $$;

create function public.support_desk(p_customer uuid default null, p_filter text default 'recent') returns jsonb
language sql security invoker set search_path = '' as $$
  select partner_private.support_desk(p_customer,p_filter)
$$;
create function public.add_customer_note(p_customer uuid, p_body text) returns void
language sql security invoker set search_path = '' as $$
  select partner_private.add_customer_note(p_customer,p_body)
$$;
revoke all on function partner_private.support_access(), partner_private.support_desk(uuid,text),
  partner_private.add_customer_note(uuid,text), public.support_desk(uuid,text),
  public.add_customer_note(uuid,text) from public, anon, authenticated;
grant execute on function partner_private.support_desk(uuid,text), partner_private.add_customer_note(uuid,text),
  public.support_desk(uuid,text), public.add_customer_note(uuid,text) to authenticated;
