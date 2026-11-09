-- Orders without a chosen Artist are local to that customer's market.
create function partner_private.can_view_open_request(p_customer uuid, p_city text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.pros p
    where p.id = auth.uid() and p.city = p_city and p.published
      and p.kind = 'artist' and p.home_service and p.suspended_at is null)
    and not public.blocked_between(p_customer, auth.uid())
$$;
revoke all on function partner_private.can_view_open_request(uuid,text) from public, anon;
grant execute on function partner_private.can_view_open_request(uuid,text) to authenticated;

drop policy "job visibility" on public.jobs;
create policy "job visibility" on public.jobs for select to authenticated using (
  customer_id = (select auth.uid())
  or (status = 'open' and partner_private.can_view_open_request(customer_id, city))
  or (select public.is_admin())
);

-- Serialize duplicate submissions by the same customer. A retry after timeout
-- hits the existing overlapping order rather than posting to the board twice.
do $$
declare definition text; revised text;
begin
  select pg_get_functiondef('public.post_job_checked(text,text,timestamptz,boolean,uuid,integer,text,public.payment_method,integer,integer)'::regprocedure) into definition;
  revised := replace(definition, '  if p_max_total is null', '  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 22));' || E'\n  if p_max_total is null');
  if revised = definition then raise exception 'Unexpected checked order implementation'; end if;
  execute revised;

  -- Direct booking locks the provider before it closes overlapping requests.
  -- Take the same lock first so a simultaneous direct booking cannot deadlock.
  select pg_get_functiondef('public.take_job(uuid)'::regprocedure) into definition;
  revised := replace(definition, '  select * into j from public.jobs where id = p_job for update;',
    '  perform pg_advisory_xact_lock(hashtextextended(me::text, 1));' || E'\n  select * into j from public.jobs where id = p_job for update;');
  if revised = definition then raise exception 'Unexpected claim order implementation'; end if;
  execute revised;
end $$;
