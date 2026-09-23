-- Push notifications for the mobile app.
--
-- Everything the platform tells a person already goes through one table,
-- notifications, written by the RPCs and the cron work. So push is one trigger
-- on that table rather than a line in every function: whatever gets written
-- there also goes to the person's phones, through Expo's push service.
--
--  * The app registers its Expo push token after sign-in (register_push_token).
--    A token belongs to one account at a time: when someone else signs in on the
--    same phone, the token moves to them, and the previous account stops getting
--    pushes on a device it no longer uses.
--  * The trigger hands the request to pg_net, which sends it after the
--    transaction commits, from a background worker. A slow or failing Expo never
--    slows down or fails the booking that wrote the notification: the call only
--    queues a row, and it is wrapped so even that cannot raise.
--  * pg_net ships with Supabase. Where it is missing (some local images) the
--    trigger does nothing, like the cron schedules do without pg_cron.

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
  else
    raise notice 'pg_net is not available here; push notifications are skipped';
  end if;
end $$;

create table public.push_tokens (
  token text primary key check (char_length(token) between 10 and 200),
  account_id uuid not null references public.accounts (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index push_tokens_account_idx on public.push_tokens (account_id);

alter table public.push_tokens enable row level security;

create policy "own push tokens" on public.push_tokens
  for select using (account_id = (select auth.uid()));
-- Written through register_push_token() only.

revoke all on public.push_tokens from anon, authenticated;
grant select on public.push_tokens to authenticated;
grant all on public.push_tokens to service_role;

create function public.register_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); v_token text := trim(coalesce(p_token, ''));
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  -- Only Expo tokens: the trigger below sends to Expo and nowhere else.
  if v_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,180}\]$' then
    raise exception 'Mã nhận thông báo không hợp lệ.' using errcode = 'check_violation';
  end if;
  if p_platform is null or p_platform not in ('ios', 'android', 'web') then
    raise exception 'Nền tảng không hợp lệ.' using errcode = 'check_violation';
  end if;
  insert into public.push_tokens (token, account_id, platform)
  values (v_token, me, p_platform)
  on conflict (token) do update
    set account_id = excluded.account_id, platform = excluded.platform, last_seen_at = now();
  -- Ten devices is plenty; old tokens from reinstalled apps fall off the end.
  delete from public.push_tokens
  where account_id = me
    and token not in (
      select t.token from public.push_tokens t
      where t.account_id = me
      order by t.last_seen_at desc
      limit 10
    );
end $$;

create function public.push_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
declare messages jsonb;
begin
  if to_regnamespace('net') is null then return new; end if;
  -- Most accounts have no phone registered: answer them before paying for the
  -- subtransaction the exception block below costs.
  select jsonb_agg(jsonb_build_object(
           'to', t.token,
           'title', new.title,
           'body', new.body,
           'data', jsonb_build_object('link', new.link)))
    into messages
    from public.push_tokens t
    where t.account_id = new.account_id;
  if messages is null then return new; end if;
  begin
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  exception when others then
    -- A notification that could not be pushed is still a notification.
    raise warning 'push for notification % not queued: %', new.id, sqlerrm;
  end;
  return new;
end $$;

create trigger notifications_push
  after insert on public.notifications
  for each row execute function public.push_notification();

revoke all on function public.push_notification() from public, anon, authenticated;
revoke all on function public.register_push_token(text, text) from public, anon, authenticated;
grant execute on function public.register_push_token(text, text) to authenticated;
