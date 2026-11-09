-- Existing clients keep their original RPC. New clients pass a retry key.
create table partner_private.booking_operations (
  account_id uuid not null references public.accounts(id) on delete cascade,
  operation_id uuid not null,
  payload jsonb not null,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  primary key (account_id, operation_id)
);
alter table partner_private.booking_operations enable row level security;
revoke all on partner_private.booking_operations from public, anon, authenticated;

create function partner_private.create_cart_booking_once(
  p_operation_id uuid, p_pro uuid, p_items jsonb, p_starts_at timestamptz,
  p_at_home boolean, p_address_id uuid, p_note text, p_payment public.payment_method,
  p_expected_total int, p_sessions timestamptz[]
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  saved partner_private.booking_operations;
  booking uuid;
  args jsonb := jsonb_build_array(p_pro, p_items, p_starts_at, p_at_home,
    p_address_id, p_note, p_payment, p_expected_total, p_sessions);
begin
  if me is null or p_operation_id is null then
    raise exception 'Không thể xác thực lần gửi lịch này.' using errcode = 'insufficient_privilege';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(me::text || ':' || p_operation_id::text, 2));
  select * into saved from partner_private.booking_operations where account_id = me and operation_id = p_operation_id;
  if found then
    if saved.payload is distinct from args then
      raise exception 'Nội dung lịch đã thay đổi. Kiểm tra lại trước khi gửi.' using errcode = 'check_violation';
    end if;
    return saved.booking_id;
  end if;
  booking := public.create_cart_booking(p_pro, p_items, p_starts_at, p_at_home,
    p_address_id, p_note, p_payment, p_expected_total, p_sessions);
  insert into partner_private.booking_operations values (me, p_operation_id, args, booking);
  return booking;
end $$;
revoke all on function partner_private.create_cart_booking_once(uuid,uuid,jsonb,timestamptz,boolean,uuid,text,public.payment_method,int,timestamptz[]) from public, anon;
grant execute on function partner_private.create_cart_booking_once(uuid,uuid,jsonb,timestamptz,boolean,uuid,text,public.payment_method,int,timestamptz[]) to authenticated;

create function public.create_cart_booking_once(
  p_operation_id uuid, p_pro uuid, p_items jsonb, p_starts_at timestamptz,
  p_at_home boolean, p_address_id uuid, p_note text, p_payment public.payment_method,
  p_expected_total int, p_sessions timestamptz[]
) returns uuid language sql security invoker set search_path = '' as $$
  select partner_private.create_cart_booking_once(p_operation_id, p_pro, p_items,
    p_starts_at, p_at_home, p_address_id, p_note, p_payment, p_expected_total, p_sessions)
$$;
revoke all on function public.create_cart_booking_once(uuid,uuid,jsonb,timestamptz,boolean,uuid,text,public.payment_method,int,timestamptz[]) from public, anon;
grant execute on function public.create_cart_booking_once(uuid,uuid,jsonb,timestamptz,boolean,uuid,text,public.payment_method,int,timestamptz[]) to authenticated;

-- Only a service that actually started may be finished by the timer.
create or replace function public.auto_complete_bookings() returns int
language plpgsql security definer set search_path = '' as $$
declare candidate uuid; n int := 0;
begin
  for candidate in
    select b.id from public.bookings b
    cross join lateral (
      select greatest(b.ends_at, max(c.ends_at)) as ends_at from public.bookings c where c.parent_booking_id = b.id and c.in_cart
    ) visit
    where b.status = 'in_progress' and b.started_at is not null and not b.in_cart
      and not exists (select 1 from public.reports r
        where r.status in ('open','reviewing') and (r.booking_id = b.id or exists (
          select 1 from public.bookings c where c.id = r.booking_id and c.parent_booking_id = b.id and c.in_cart
        )))
      and greatest(visit.ends_at, b.started_at + (visit.ends_at - b.starts_at)) + interval '24 hours' < now()
    order by visit.ends_at
    limit 500 for update of b skip locked
  loop
    perform public.finish_booking(candidate, 'auto');
    n := n + 1;
  end loop;
  return n;
end $$;

create function partner_private.unregister_push_token(p_token text) returns void
language sql security definer set search_path = '' as $$
  delete from public.push_tokens where account_id = (select auth.uid()) and token = p_token
$$;
revoke all on function partner_private.unregister_push_token(text) from public, anon;
grant execute on function partner_private.unregister_push_token(text) to authenticated;

create function public.unregister_push_token(p_token text) returns void
language sql security invoker set search_path = '' as $$
  select partner_private.unregister_push_token(p_token)
$$;
revoke all on function public.unregister_push_token(text) from public, anon;
grant execute on function public.unregister_push_token(text) to authenticated;

-- Detailed content stays in the authenticated inbox, including on shared devices.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.push_notification()'::regprocedure) into definition;
  definition := replace(definition, '''title'', new.title,', '''title'', ''360đẹp'',');
  definition := replace(definition, '''body'', new.body,', '''body'', ''Bạn có thông báo mới.'',');
  definition := replace(definition, 'where t.account_id = new.account_id;', 'where t.account_id = new.account_id and t.last_seen_at > now() - interval ''7 days'';');
  execute definition;
end $$;

-- Both wallet credit and the reconciliation record share the same transaction.
-- The webhook authenticates separately. The recipient must match 360đẹp's
-- configured receiving account or the server-configured virtual account.
create function public.record_sepay_topup(
  p_ref text, p_content text, p_amount int, p_memos text[], p_account text, p_sub_account text, p_expected_va text
) returns text language plpgsql security invoker set search_path = '' as $$
declare memo text; account text;
begin
  select topup_account_no into account from public.platform_settings where id;
  if nullif(p_expected_va, '') is not null then
    if p_expected_va is distinct from p_sub_account and p_expected_va is distinct from p_account then return 'other_account'; end if;
  else
    if account is null then raise exception 'Missing receiving account'; end if;
    if account is distinct from p_account then return 'other_account'; end if;
  end if;
  if p_ref is null or p_ref !~ '^sepay:[1-9][0-9]*$' or p_amount is null or p_amount <= 0 then
    raise exception 'Invalid bank transaction' using errcode = 'check_violation';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_ref, 3));
  if exists (select 1 from public.wallet_entries where ref in (p_ref, 'staff:' || p_ref))
    or exists (select 1 from public.unmatched_transfers where ref = p_ref) then
    return 'duplicate';
  end if;
  foreach memo in array coalesce(p_memos, '{}'::text[]) loop
    if public.record_bank_topup(memo, p_amount, p_ref) then return 'credited'; end if;
  end loop;
  perform public.record_unmatched_transfer(p_ref, p_content, p_amount);
  return 'unmatched';
end $$;
revoke all on function public.record_sepay_topup(text,text,int,text[],text,text,text) from public, anon, authenticated;
grant execute on function public.record_sepay_topup(text,text,int,text[],text,text,text) to service_role;
