-- The operations desk, grown up (2026-09-24): customers, money and settings.
--
--  * Customers can be looked up and locked, as freelancers already could.
--  * Finance: what the period earned (commission is 360đẹp's revenue, the rest
--    is paid to the freelancer directly), what came in through transfers, what
--    freelancers still owe, and the rows an accountant needs, per booking, per
--    freelancer and per wallet movement.
--  * A wallet correction for disputes and mistakes, with a reason.
--  * Every admin action from here on is written to admin_actions.

-- Customer lock ---------------------------------------------------------------

alter table public.accounts
  add column suspended_at timestamptz,
  add column suspend_reason text not null default '' check (char_length(suspend_reason) <= 300);

-- No grant needed to keep these out of their owner's hands: accounts is only
-- updatable column by column, (full_name, avatar_path, active_role), since
-- 20260922092824.

create function public.refuse_locked_account() returns trigger
language plpgsql security definer set search_path = '' as $$
-- Read through jsonb: one function serves three tables with different columns.
declare
  r jsonb := to_jsonb(new);
  who uuid := coalesce(r ->> 'customer_id', r ->> 'sender_id')::uuid;
begin
  if who is not null and exists (select 1 from public.accounts where id = who and suspended_at is not null) then
    raise exception 'Tài khoản đang bị khoá. Liên hệ hỗ trợ 360dep để được xem xét.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

revoke execute on function public.refuse_locked_account() from public, anon, authenticated;

create trigger bookings_locked_customer before insert on public.bookings
  for each row execute function public.refuse_locked_account();
create trigger jobs_locked_customer before insert on public.jobs
  for each row execute function public.refuse_locked_account();
create trigger messages_locked_sender before insert on public.messages
  for each row execute function public.refuse_locked_account();

-- The admin log ---------------------------------------------------------------

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.accounts (id) on delete set null,
  action text not null,
  target_id uuid,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index admin_actions_created_idx on public.admin_actions (created_at desc);

alter table public.admin_actions enable row level security;
create policy "admins read the admin log" on public.admin_actions for select using ((select public.is_admin()));
revoke all on public.admin_actions from anon, authenticated;
grant select on public.admin_actions to authenticated;
grant all on public.admin_actions to service_role;

create function public.log_admin_action(p_action text, p_target uuid, p_detail jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.admin_actions (actor_id, action, target_id, detail) values (auth.uid(), p_action, p_target, coalesce(p_detail, '{}'));
$$;
revoke execute on function public.log_admin_action(text, uuid, jsonb) from public, anon, authenticated;

-- Settings changes are logged whoever makes them (the desk, or SQL by hand).
create function public.log_settings_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  changed jsonb;
begin
  select jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value)) into changed
  from jsonb_each(to_jsonb(new)) n join jsonb_each(to_jsonb(old)) o using (key)
  where n.value is distinct from o.value and n.key <> 'updated_at';
  if changed is not null then
    perform public.log_admin_action('settings:' || tg_table_name, null, changed);
  end if;
  return new;
end $$;
revoke execute on function public.log_settings_change() from public, anon, authenticated;

create trigger platform_settings_logged after update on public.platform_settings
  for each row execute function public.log_settings_change();
create trigger fee_policy_logged after update on public.fee_policy
  for each row execute function public.log_settings_change();

-- fee_policy had every privilege granted to the API roles (only a read policy
-- stood in the way). Reads stay public; nobody writes it over the API.
revoke all on public.fee_policy from anon, authenticated;
grant select on public.fee_policy to anon, authenticated;

create function public.require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Chỉ dành cho quản trị' using errcode = 'insufficient_privilege';
  end if;
end $$;
revoke execute on function public.require_admin() from public, anon, authenticated;

-- Customers -------------------------------------------------------------------

create function public.admin_customers(p_query text default '', p_limit int default 200) returns table (
  id uuid, full_name text, phone text, email text, created_at timestamptz, is_pro boolean,
  bookings bigint, completed bigint, cancelled bigint, no_shows bigint, spent bigint,
  last_booking_at timestamptz, suspended_at timestamptz, suspend_reason text
)
language plpgsql stable security definer set search_path = '' as $$
declare
  q text := lower(trim(coalesce(p_query, '')));
begin
  perform public.require_admin();
  return query
  select a.id, a.full_name, a.phone,
    -- Phone-only accounts carry a stand-in address (lib/auth/identifier.ts).
    case when u.email like '%@sdt.360dep.vn' or u.email like '%.local' then null else u.email end::text,
    a.created_at, exists (select 1 from public.pros p where p.id = a.id),
    count(b.id), count(b.id) filter (where b.status = 'completed'),
    count(b.id) filter (where b.status = 'cancelled' and b.cancelled_by = 'customer'),
    count(b.id) filter (where b.status = 'no_show'),
    coalesce(sum(b.total - b.discount) filter (where b.status = 'completed'), 0)::bigint,
    max(b.starts_at), a.suspended_at, a.suspend_reason
  from public.accounts a
  left join auth.users u on u.id = a.id
  left join public.bookings b on b.customer_id = a.id
  where q = '' or lower(a.full_name) like '%' || q || '%' or a.phone like '%' || q || '%'
     or lower(coalesce(u.email, '')) like '%' || q || '%'
  group by a.id, u.email
  order by max(b.created_at) desc nulls last, a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 1000));
end $$;

create function public.admin_set_account_suspended(p_account uuid, p_suspended boolean, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin();
  if p_account = auth.uid() then
    raise exception 'Không tự khoá tài khoản của mình.' using errcode = 'check_violation';
  end if;
  update public.accounts set
    suspended_at = case when p_suspended then coalesce(suspended_at, now()) end,
    suspend_reason = case when p_suspended then left(coalesce(p_reason, ''), 300) else '' end
  where id = p_account;
  if not found then raise exception 'Không tìm thấy tài khoản.' using errcode = 'no_data_found'; end if;
  perform public.log_admin_action(case when p_suspended then 'account:lock' else 'account:unlock' end, p_account,
    jsonb_build_object('reason', coalesce(p_reason, '')));
end $$;

-- Money -------------------------------------------------------------------------

-- A period is [from, to] in local dates; a booking belongs to the day it was
-- completed, a wallet movement to the day it was recorded.
create function public.admin_finance_summary(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  tz text := public.app_timezone();
  lo timestamptz := (p_from::timestamp) at time zone tz;
  hi timestamptz := ((p_to + 1)::timestamp) at time zone tz;
  result jsonb;
begin
  perform public.require_admin();
  select jsonb_build_object(
    'completed', count(*) filter (where status = 'completed' and completed_at >= lo and completed_at < hi),
    'gmv', coalesce(sum(total) filter (where status = 'completed' and completed_at >= lo and completed_at < hi), 0),
    'serviceRevenue', coalesce(sum(service_price) filter (where status = 'completed' and completed_at >= lo and completed_at < hi), 0),
    'commission', coalesce(sum(commission) filter (where status = 'completed' and completed_at >= lo and completed_at < hi), 0),
    'discounts', coalesce(sum(discount) filter (where status = 'completed' and completed_at >= lo and completed_at < hi), 0),
    'created', count(*) filter (where created_at >= lo and created_at < hi),
    'cancelled', count(*) filter (where status = 'cancelled' and cancelled_at >= lo and cancelled_at < hi),
    'noShows', count(*) filter (where status = 'no_show' and cancelled_at >= lo and cancelled_at < hi),
    'expired', count(*) filter (where status in ('expired', 'declined') and created_at >= lo and created_at < hi)
  ) into result from public.bookings;

  result := result || (
    select jsonb_build_object(
      'topupsSepay', coalesce(sum(amount) filter (where kind = 'topup' and ref like 'sepay:%'), 0),
      'topupsStaff', coalesce(sum(amount) filter (where kind = 'topup' and coalesce(ref, '') not like 'sepay:%'), 0),
      'feesCharged', -coalesce(sum(amount) filter (where kind = 'commission'), 0),
      'adjustments', coalesce(sum(amount) filter (where kind in ('adjustment', 'refund')), 0),
      'voucherCredits', coalesce(sum(amount) filter (where kind = 'voucher'), 0),
      'referralPaid', coalesce(sum(amount) filter (where kind = 'referral'), 0),
      'noShowComp', coalesce(sum(amount) filter (where kind = 'no_show_comp'), 0)
    ) from public.wallet_entries where created_at >= lo and created_at < hi
  );

  -- Right now, not for the period: who owes and how much.
  result := result || (
    select jsonb_build_object('owing', count(*) filter (where bal < 0), 'owed', -coalesce(sum(bal) filter (where bal < 0), 0),
                              'credit', coalesce(sum(bal) filter (where bal > 0), 0))
    from (select pro_id, sum(amount) bal from public.wallet_entries group by pro_id) w
  );
  return result;
end $$;

create function public.admin_finance_by_pro(p_from date, p_to date) returns table (
  pro_id uuid, slug text, display_name text, name_on_card text, identity text, phone text, city text, district text,
  completed bigint, gmv bigint, commission bigint, topups bigint, balance bigint
)
language plpgsql stable security definer set search_path = '' as $$
declare
  tz text := public.app_timezone();
  lo timestamptz := (p_from::timestamp) at time zone tz;
  hi timestamptz := ((p_to + 1)::timestamp) at time zone tz;
begin
  perform public.require_admin();
  return query
  select p.id, p.slug, p.display_name,
    (select c.name_on_card from public.identity_checks c where c.pro_id = p.id and c.status = 'verified' order by c.decided_at desc nulls last limit 1),
    p.identity_status::text, a.phone, p.city, p.district,
    (select count(*) from public.bookings b where b.pro_id = p.id and b.status = 'completed' and b.completed_at >= lo and b.completed_at < hi),
    (select coalesce(sum(b.total), 0) from public.bookings b where b.pro_id = p.id and b.status = 'completed' and b.completed_at >= lo and b.completed_at < hi)::bigint,
    (select coalesce(sum(b.commission), 0) from public.bookings b where b.pro_id = p.id and b.status = 'completed' and b.completed_at >= lo and b.completed_at < hi)::bigint,
    (select coalesce(sum(w.amount), 0) from public.wallet_entries w where w.pro_id = p.id and w.kind = 'topup' and w.created_at >= lo and w.created_at < hi)::bigint,
    (select coalesce(sum(w.amount), 0) from public.wallet_entries w where w.pro_id = p.id)::bigint
  from public.pros p join public.accounts a on a.id = p.id
  order by 11 desc, 10 desc, p.display_name;
end $$;

create function public.admin_finance_bookings(p_from date, p_to date) returns table (
  booking_id uuid, created_at timestamptz, starts_at timestamptz, completed_at timestamptz, status text,
  customer_name text, pro_name text, template_id text, variant_id text, quantity int, service_price int,
  travel_fee int, urgent_fee int, discount int, total int, commission_rate numeric, commission int, payment_method text
)
language plpgsql stable security definer set search_path = '' as $$
declare
  tz text := public.app_timezone();
  lo timestamptz := (p_from::timestamp) at time zone tz;
  hi timestamptz := ((p_to + 1)::timestamp) at time zone tz;
begin
  perform public.require_admin();
  return query
  select b.id, b.created_at, b.starts_at, b.completed_at, b.status::text, c.full_name, p.display_name,
    b.template_id, b.variant_id, b.quantity, b.service_price, b.travel_fee, b.urgent_fee, b.discount, b.total,
    b.commission_rate, b.commission, b.payment_method::text
  from public.bookings b
  join public.accounts c on c.id = b.customer_id
  join public.pros p on p.id = b.pro_id
  where (b.completed_at >= lo and b.completed_at < hi) or (b.completed_at is null and b.created_at >= lo and b.created_at < hi)
  order by coalesce(b.completed_at, b.created_at);
end $$;

create function public.admin_wallet_entries(p_from date, p_to date) returns table (
  entry_id uuid, created_at timestamptz, pro_name text, pro_slug text, kind text, amount int, ref text, note text, booking_id uuid
)
language plpgsql stable security definer set search_path = '' as $$
declare
  tz text := public.app_timezone();
  lo timestamptz := (p_from::timestamp) at time zone tz;
  hi timestamptz := ((p_to + 1)::timestamp) at time zone tz;
begin
  perform public.require_admin();
  return query
  select w.id, w.created_at, p.display_name, p.slug, w.kind, w.amount, w.ref, w.note, w.booking_id
  from public.wallet_entries w join public.pros p on p.id = w.pro_id
  where w.created_at >= lo and w.created_at < hi
  order by w.created_at;
end $$;

-- A correction: a fee charged by mistake, a goodwill credit, a dispute settled.
-- Always with a reason, always logged; never a substitute for record_topup.
create function public.admin_adjust_wallet(p_pro uuid, p_amount int, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin();
  if coalesce(p_amount, 0) = 0 or abs(p_amount) > 50000000 then
    raise exception 'Số tiền điều chỉnh không hợp lệ.' using errcode = 'check_violation';
  end if;
  if char_length(trim(coalesce(p_note, ''))) < 5 then
    raise exception 'Ghi lý do điều chỉnh (ít nhất 5 ký tự).' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.pros where id = p_pro) then
    raise exception 'Không tìm thấy người làm.' using errcode = 'no_data_found';
  end if;
  insert into public.wallet_entries (pro_id, kind, amount, ref, note)
  values (p_pro, 'adjustment', p_amount, 'admin:' || auth.uid(), left(trim(p_note), 300));
  perform public.log_admin_action('wallet:adjust', p_pro, jsonb_build_object('amount', p_amount, 'note', trim(p_note)));
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'admin_customers(text, integer)', 'admin_set_account_suspended(uuid, boolean, text)',
    'admin_finance_summary(date, date)', 'admin_finance_by_pro(date, date)',
    'admin_finance_bookings(date, date)', 'admin_wallet_entries(date, date)', 'admin_adjust_wallet(uuid, integer, text)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
