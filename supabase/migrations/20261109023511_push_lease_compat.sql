-- A lease is opt-in for new clients. Old binaries keep receiving generic
-- push notifications until they update or the existing device is removed.
alter table public.push_tokens add column expires_at timestamptz;

create function partner_private.register_push_token_v2(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.register_push_token(p_token, p_platform);
  update public.push_tokens set expires_at = now() + interval '7 days'
  where token = trim(p_token) and account_id = auth.uid();
end $$;
create function public.register_push_token_v2(p_token text, p_platform text) returns void
language sql security invoker set search_path = '' as $$
  select partner_private.register_push_token_v2(p_token, p_platform)
$$;
revoke all on function partner_private.register_push_token_v2(text,text), public.register_push_token_v2(text,text) from public, anon;
grant execute on function partner_private.register_push_token_v2(text,text), public.register_push_token_v2(text,text) to authenticated;

do $$
declare definition text; revised text;
begin
  select pg_get_functiondef('public.push_notification()'::regprocedure) into definition;
  revised := replace(definition, 't.last_seen_at > now() - interval ''7 days''', '(t.expires_at is null or t.expires_at > now())');
  if definition = revised then raise exception 'Unexpected push notification predicate'; end if;
  execute revised;
end $$;
