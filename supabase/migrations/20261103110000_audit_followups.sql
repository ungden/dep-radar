-- The rest of the audit of 2026-11-03 that needs no new app build.
--
-- 1. Only a live partner reads open orders: a draft profile could read every
--    customer's name, ward and reference photos.
-- 2. A locked admin is no longer an admin.
-- 3. The staff's decisions on partners, reviews, reports and top-ups go to the
--    admin log, like the rest of the desk.
-- 4. A transfer the bank reported with no pay code is kept for the staff to see
--    (it used to vanish), and one transfer cannot be credited twice, once by
--    the webhook and once by hand under the same bank reference.
-- Functions that later migrations rewrote are patched in place, as in 20261103100000.

-- 1 ---------------------------------------------------------------------------
create function public.is_live_pro() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.pros where id = auth.uid() and published and suspended_at is null)
$$;
revoke all on function public.is_live_pro() from public;
grant execute on function public.is_live_pro() to anon, authenticated;

drop policy "job visibility" on public.jobs;
create policy "job visibility" on public.jobs for select using (
  customer_id = (select auth.uid())
  or (status = 'open' and public.is_live_pro())
  or public.is_admin()
);

-- 2 ---------------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin and suspended_at is null from public.accounts where id = auth.uid()), false)
$$;

-- 3 ---------------------------------------------------------------------------
do $patch$
declare
  patch record; definition text; fixed text;
begin
  for patch in
    select * from (values
      ('public.set_pro_suspended(uuid,boolean,text)',
       $l$perform public.log_admin_action(case when p_suspended then 'pro:lock' else 'pro:unlock' end, p_pro, jsonb_build_object('reason', coalesce(p_reason, '')));$l$),
      ('public.set_review_hidden(uuid,boolean)',
       $l$perform public.log_admin_action(case when p_hidden then 'review:hide' else 'review:show' end, p_booking, '{}');$l$),
      ('public.resolve_report(uuid,text,text)',
       $l$perform public.log_admin_action('report:resolve', p_report, jsonb_build_object('status', p_status, 'note', coalesce(p_resolution, '')));$l$)
    ) as t(fn, line)
  loop
    select pg_get_functiondef(patch.fn::regprocedure) into definition;
    fixed := regexp_replace(definition, $r$end\s*\$function\$\s*$$r$, patch.line || E'\nend $function$\n');
    if fixed = definition then raise exception '% changed: review this migration', patch.fn; end if;
    execute fixed;
  end loop;
end $patch$;

-- 4 ---------------------------------------------------------------------------
do $$
declare definition text; needle text;
begin
  select pg_get_functiondef('public.record_topup(uuid,integer,text)'::regprocedure) into definition;
  needle := 'return public.credit_topup(p_pro, p_amount,';
  if position(needle in definition) = 0 then raise exception 'record_topup changed: review this migration'; end if;
  definition := replace(definition, needle,
    $l$if trim(coalesce(p_ref, '')) <> '' and exists (select 1 from public.wallet_entries where ref = trim(p_ref)) then
    raise exception 'Giao dịch này đã được cộng tự động từ ngân hàng.' using errcode = 'check_violation';
  end if;
  perform public.log_admin_action('wallet:topup', p_pro, jsonb_build_object('amount', p_amount, 'ref', coalesce(p_ref, '')));
  $l$ || needle);
  execute definition;

  select pg_get_functiondef('public.record_bank_topup(text,integer,text)'::regprocedure) into definition;
  needle := E'begin\n  for code in';
  if position(needle in definition) = 0 then raise exception 'record_bank_topup changed: review this migration'; end if;
  definition := replace(definition, needle,
    E'begin\n  if exists (select 1 from public.wallet_entries where ref = ''staff:'' || p_ref) then return false; end if;\n  for code in');
  execute definition;
end $$;

create table public.unmatched_transfers (
  ref text primary key,
  content text not null default '',
  amount int not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.accounts (id) on delete set null
);
alter table public.unmatched_transfers enable row level security;
revoke all on public.unmatched_transfers from public, anon, authenticated;
grant all on public.unmatched_transfers to service_role;

-- From the bank's webhook, with the server's key only.
create function public.record_unmatched_transfer(p_ref text, p_content text, p_amount int) returns void
language sql security definer set search_path = '' as $$
  insert into public.unmatched_transfers (ref, content, amount)
  select p_ref, left(coalesce(p_content, ''), 500), p_amount
  where not exists (select 1 from public.wallet_entries where ref in (p_ref, 'staff:' || p_ref))
  on conflict (ref) do nothing
$$;
revoke all on function public.record_unmatched_transfer(text, text, int) from public, anon, authenticated;
grant execute on function public.record_unmatched_transfer(text, text, int) to service_role;

create function public.admin_unmatched_transfers() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('ref', ref, 'content', content, 'amount', amount, 'createdAt', created_at) order by created_at desc)
    from public.unmatched_transfers where resolved_at is null), '[]');
end $$;

create function public.admin_resolve_transfer(p_ref text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin();
  update public.unmatched_transfers set resolved_at = now(), resolved_by = auth.uid() where ref = p_ref and resolved_at is null;
  if not found then raise exception 'Giao dịch đã được xử lý.' using errcode = 'check_violation'; end if;
  perform public.log_admin_action('transfer:resolve', null, jsonb_build_object('ref', p_ref));
end $$;

revoke execute on function public.admin_unmatched_transfers(), public.admin_resolve_transfer(text) from public, anon;
grant execute on function public.admin_unmatched_transfers(), public.admin_resolve_transfer(text) to authenticated;
