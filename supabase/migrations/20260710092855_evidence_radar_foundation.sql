-- Evidence Radar: public-source creator monitoring, human review and derived usage state.
-- Queue consumers must use service_role from a server/Edge Function. Never expose the
-- pgmq_public helpers to anon/authenticated clients.

create extension if not exists pgmq;
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.creator_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.kols(id) on delete cascade,
  platform text not null,
  profile_url text not null,
  external_account_id text,
  priority_tier text not null default 'c',
  crawl_interval_minutes integer not null default 1440,
  cursor text,
  last_polled_at timestamptz,
  next_poll_at timestamptz not null default now(),
  last_error text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_accounts_priority_check check (priority_tier in ('a', 'b', 'c')),
  constraint creator_accounts_interval_check check (crawl_interval_minutes between 30 and 10080),
  constraint creator_accounts_profile_url_unique unique (platform, profile_url)
);

create index if not exists creator_accounts_due_idx
  on public.creator_accounts(active, next_poll_at, priority_tier);
create index if not exists creator_accounts_creator_idx
  on public.creator_accounts(creator_id, platform);

create table if not exists public.source_posts (
  id uuid primary key default gen_random_uuid(),
  creator_account_id uuid not null references public.creator_accounts(id) on delete cascade,
  creator_id text not null references public.kols(id) on delete cascade,
  source_platform text not null,
  external_post_id text,
  source_url text not null,
  published_at timestamptz,
  observed_at timestamptz not null default now(),
  title text not null default '',
  caption text not null default '',
  media_url text,
  media_metadata jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  content_hash text not null,
  analysis_status text not null default 'pending',
  analysis_attempts integer not null default 0,
  last_error text,
  raw_media_expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_posts_status_check check (
    analysis_status in ('pending', 'queued', 'processing', 'ready', 'failed', 'ignored')
  ),
  constraint source_posts_url_unique unique (source_url),
  constraint source_posts_content_hash_unique unique (creator_id, content_hash)
);

create unique index if not exists source_posts_external_id_unique
  on public.source_posts(source_platform, external_post_id)
  where external_post_id is not null;
create index if not exists source_posts_analysis_idx
  on public.source_posts(analysis_status, observed_at);
create index if not exists source_posts_creator_idx
  on public.source_posts(creator_id, published_at desc);

alter table public.creator_evidence_items
  add column if not exists source_post_ref uuid references public.source_posts(id) on delete set null,
  add column if not exists extracted_claims jsonb not null default '[]'::jsonb,
  add column if not exists confidence_score integer,
  add column if not exists model_name text,
  add column if not exists prompt_version text,
  add column if not exists evidence_spans jsonb not null default '[]'::jsonb,
  add column if not exists risk_flags text[] not null default '{}',
  add column if not exists requires_human_review boolean not null default true,
  add column if not exists review_reason text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

do $$
begin
  alter table public.creator_evidence_items
    add constraint creator_evidence_confidence_score_check
    check (confidence_score is null or confidence_score between 0 and 100);
exception when duplicate_object then null;
end $$;

create index if not exists creator_evidence_source_post_idx
  on public.creator_evidence_items(source_post_ref);
create index if not exists creator_evidence_review_queue_idx
  on public.creator_evidence_items(requires_human_review, status, confidence_score desc nulls last);

alter table public.creator_product_events
  add column if not exists confidence_score integer,
  add column if not exists verification_status text not null default 'verified',
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists verified_at timestamptz,
  add column if not exists valid_until timestamptz;

alter table public.creator_product_events
  drop constraint if exists creator_product_events_event_type_check;

alter table public.creator_product_events
  add constraint creator_product_events_event_type_check check (
    event_type in (
      'first_seen', 'mentioned', 'unboxed', 'used', 'reviewed', 'recommended',
      'disliked', 'emptied', 'repurchased', 'switched_to', 'stopped_using',
      'live_sold', 'sponsored'
    )
  );

do $$
begin
  alter table public.creator_product_events
    add constraint creator_product_events_confidence_score_check
    check (confidence_score is null or confidence_score between 0 and 100);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.creator_product_events
    add constraint creator_product_events_verification_status_check
    check (verification_status in ('pending', 'verified', 'rejected'));
exception when duplicate_object then null;
end $$;

create unique index if not exists creator_product_events_evidence_product_type_unique
  on public.creator_product_events(evidence_id, product_id, event_type)
  where evidence_id is not null;
create index if not exists creator_product_events_verified_state_idx
  on public.creator_product_events(creator_id, product_id, event_date desc)
  where verification_status = 'verified';

create table if not exists public.creator_product_states (
  creator_id text not null references public.kols(id) on delete cascade,
  product_id text not null references public.radar_products(id) on delete cascade,
  state text not null default 'unknown',
  state_confidence integer not null default 0,
  last_confirmed_at date,
  expires_at date,
  evidence_count integer not null default 0,
  last_event_id text references public.creator_product_events(id) on delete set null,
  computed_at timestamptz not null default now(),
  primary key (creator_id, product_id),
  constraint creator_product_states_state_check check (
    state in ('current', 'recently_used', 'past', 'reviewed_only', 'promoted_only', 'disliked', 'unknown')
  ),
  constraint creator_product_states_confidence_check check (state_confidence between 0 and 100)
);

create index if not exists creator_product_states_creator_idx
  on public.creator_product_states(creator_id, state, last_confirmed_at desc);
create index if not exists creator_product_states_product_idx
  on public.creator_product_states(product_id, state, last_confirmed_at desc);

create table if not exists public.evidence_audit_log (
  id uuid primary key default gen_random_uuid(),
  evidence_id text references public.creator_evidence_items(id) on delete set null,
  event_id text references public.creator_product_events(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'admin',
  decision text not null,
  reason text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  constraint evidence_audit_actor_type_check check (actor_type in ('admin', 'system', 'model')),
  constraint evidence_audit_decision_check check (
    decision in ('ingested', 'extracted', 'queued_for_review', 'published', 'rejected', 'edited', 'auto_published')
  )
);

create index if not exists evidence_audit_evidence_idx
  on public.evidence_audit_log(evidence_id, created_at desc);

create table if not exists public.evidence_radar_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  provider text,
  status text not null default 'running',
  records_seen integer not null default 0,
  records_inserted integer not null default 0,
  records_failed integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  error_summary text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint evidence_radar_runs_type_check check (run_type in ('collection', 'analysis', 'state_recompute', 'cleanup')),
  constraint evidence_radar_runs_status_check check (status in ('running', 'completed', 'partial', 'failed'))
);

create or replace function private.recompute_creator_product_state(
  p_creator_id text,
  p_product_id text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_last_event public.creator_product_events%rowtype;
  v_direct_count integer := 0;
  v_evidence_count integer := 0;
  v_state text := 'unknown';
  v_state_confidence integer := 0;
  v_expires_at date;
begin
  select * into v_last_event
  from public.creator_product_events
  where creator_id = p_creator_id
    and product_id = p_product_id
    and verification_status = 'verified'
  order by event_date desc, observed_at desc
  limit 1;

  if not found then
    delete from public.creator_product_states
    where creator_id = p_creator_id and product_id = p_product_id;
    return;
  end if;

  select count(*) into v_evidence_count
  from public.creator_product_events
  where creator_id = p_creator_id
    and product_id = p_product_id
    and verification_status = 'verified';

  select count(*) into v_direct_count
  from public.creator_product_events
  where creator_id = p_creator_id
    and product_id = p_product_id
    and verification_status = 'verified'
    and event_type in ('used', 'repurchased', 'switched_to')
    and event_date >= current_date - 90;

  v_state_confidence := coalesce(
    v_last_event.confidence_score,
    case v_last_event.confidence when 'high' then 92 when 'medium' then 75 else 50 end
  );

  if v_last_event.event_type = 'disliked' then
    v_state := 'disliked';
  elsif v_last_event.event_type = 'stopped_using' then
    v_state := 'past';
  elsif v_last_event.event_type = 'repurchased'
    and v_last_event.event_date >= current_date - 90 then
    v_state := 'current';
    v_expires_at := v_last_event.event_date + 90;
  elsif v_last_event.event_type in ('used', 'switched_to')
    and v_last_event.event_date >= current_date - 60 then
    v_state := 'current';
    v_expires_at := v_last_event.event_date + 60;
  elsif v_direct_count >= 2
    and exists (
      select 1 from public.creator_product_events
      where creator_id = p_creator_id
        and product_id = p_product_id
        and verification_status = 'verified'
        and event_type in ('used', 'repurchased', 'switched_to')
        and event_date >= current_date - 60
    ) then
    v_state := 'current';
    v_expires_at := v_last_event.event_date + 60;
  elsif exists (
    select 1 from public.creator_product_events
    where creator_id = p_creator_id
      and product_id = p_product_id
      and verification_status = 'verified'
      and event_type in ('used', 'emptied', 'repurchased', 'switched_to', 'stopped_using')
  ) then
    if exists (
      select 1 from public.creator_product_events
      where creator_id = p_creator_id
        and product_id = p_product_id
        and verification_status = 'verified'
        and event_type in ('used', 'emptied', 'repurchased', 'switched_to')
        and event_date >= current_date - 180
    ) then
      v_state := 'recently_used';
    else
      v_state := 'past';
    end if;
  elsif exists (
    select 1 from public.creator_product_events
    where creator_id = p_creator_id and product_id = p_product_id
      and verification_status = 'verified'
      and event_type in ('reviewed', 'recommended')
  ) then
    v_state := 'reviewed_only';
  elsif exists (
    select 1 from public.creator_product_events
    where creator_id = p_creator_id and product_id = p_product_id
      and verification_status = 'verified'
      and event_type in ('sponsored', 'live_sold')
  ) then
    v_state := 'promoted_only';
  end if;

  insert into public.creator_product_states (
    creator_id, product_id, state, state_confidence, last_confirmed_at,
    expires_at, evidence_count, last_event_id, computed_at
  ) values (
    p_creator_id, p_product_id, v_state, v_state_confidence, v_last_event.event_date,
    v_expires_at, v_evidence_count, v_last_event.id, now()
  )
  on conflict (creator_id, product_id) do update set
    state = excluded.state,
    state_confidence = excluded.state_confidence,
    last_confirmed_at = excluded.last_confirmed_at,
    expires_at = excluded.expires_at,
    evidence_count = excluded.evidence_count,
    last_event_id = excluded.last_event_id,
    computed_at = excluded.computed_at;
end;
$$;

create or replace function private.refresh_creator_product_state_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.recompute_creator_product_state(old.creator_id, old.product_id);
    return old;
  end if;

  perform private.recompute_creator_product_state(new.creator_id, new.product_id);
  if tg_op = 'UPDATE' and (old.creator_id, old.product_id) is distinct from (new.creator_id, new.product_id) then
    perform private.recompute_creator_product_state(old.creator_id, old.product_id);
  end if;
  return new;
end;
$$;

drop trigger if exists creator_product_events_refresh_state on public.creator_product_events;
create trigger creator_product_events_refresh_state
after insert or update or delete on public.creator_product_events
for each row execute function private.refresh_creator_product_state_trigger();

do $$
begin
  perform pgmq.create('creator_monitor');
exception when duplicate_table then null;
end $$;

do $$
begin
  perform pgmq.create('evidence_analysis');
exception when duplicate_table then null;
end $$;

create or replace function private.enqueue_due_creator_accounts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.creator_accounts%rowtype;
  v_count integer := 0;
begin
  for v_account in
    select * from public.creator_accounts
    where active = true and next_poll_at <= now()
    order by priority_tier, next_poll_at
    limit 100
    for update skip locked
  loop
    perform pgmq.send(
      'creator_monitor',
      jsonb_build_object('creator_account_id', v_account.id, 'enqueued_at', now())
    );
    update public.creator_accounts
    set next_poll_at = now() + make_interval(mins => crawl_interval_minutes),
        updated_at = now()
    where id = v_account.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function private.queue_source_post_for_analysis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pgmq.send(
    'evidence_analysis',
    jsonb_build_object('source_post_id', new.id, 'enqueued_at', now())
  );
  new.analysis_status := 'queued';
  return new;
end;
$$;

drop trigger if exists source_posts_queue_analysis on public.source_posts;
create trigger source_posts_queue_analysis
before insert on public.source_posts
for each row execute function private.queue_source_post_for_analysis();

do $$
begin
  perform cron.unschedule('evidence-radar-enqueue-due-accounts');
exception when others then null;
end $$;

select cron.schedule(
  'evidence-radar-enqueue-due-accounts',
  '*/5 * * * *',
  'select private.enqueue_due_creator_accounts()'
);

create or replace function private.invoke_evidence_radar_worker()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_worker_url text;
  v_worker_secret text;
  v_request_id bigint;
begin
  select decrypted_secret into v_worker_url
  from vault.decrypted_secrets
  where name = 'evidence_radar_worker_url'
  limit 1;

  select decrypted_secret into v_worker_secret
  from vault.decrypted_secrets
  where name = 'evidence_radar_cron_secret'
  limit 1;

  if coalesce(v_worker_url, '') = '' or coalesce(v_worker_secret, '') = '' then
    return null;
  end if;

  select net.http_post(
    url := v_worker_url,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || v_worker_secret
    ),
    body := jsonb_build_object('trigger', 'supabase-cron'),
    timeout_milliseconds := 5000
  ) into v_request_id;
  return v_request_id;
end;
$$;

do $$
begin
  perform cron.unschedule('evidence-radar-run-worker');
exception when others then null;
end $$;

select cron.schedule(
  'evidence-radar-run-worker',
  '*/5 * * * *',
  'select private.invoke_evidence_radar_worker()'
);

create or replace function private.cleanup_expired_source_media()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  update public.source_posts
  set media_url = null,
      raw_payload = '{}'::jsonb,
      updated_at = now()
  where raw_media_expires_at <= now()
    and (media_url is not null or raw_payload <> '{}'::jsonb);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

do $$
begin
  perform cron.unschedule('evidence-radar-cleanup-media');
exception when others then null;
end $$;

select cron.schedule(
  'evidence-radar-cleanup-media',
  '30 3 * * *',
  'select private.cleanup_expired_source_media()'
);

alter table public.creator_accounts enable row level security;
alter table public.source_posts enable row level security;
alter table public.creator_product_states enable row level security;
alter table public.evidence_audit_log enable row level security;
alter table public.evidence_radar_runs enable row level security;

revoke all on public.creator_accounts, public.source_posts, public.evidence_audit_log, public.evidence_radar_runs from anon;
revoke all on public.creator_accounts, public.source_posts, public.evidence_audit_log, public.evidence_radar_runs from authenticated;
grant select on public.creator_accounts, public.source_posts, public.evidence_audit_log, public.evidence_radar_runs to authenticated;
grant insert, update, delete on public.creator_accounts to authenticated;
grant insert on public.evidence_audit_log to authenticated;
grant select, insert, update, delete on public.creator_accounts, public.source_posts to service_role;
grant select, insert on public.evidence_audit_log to service_role;
grant select, insert, update on public.evidence_radar_runs to service_role;

grant select on public.creator_product_states to anon, authenticated;
grant select, insert, update, delete on public.creator_product_states to service_role;

drop policy if exists "Public can read verified creator product states" on public.creator_product_states;
create policy "Public can read verified creator product states"
on public.creator_product_states for select to anon, authenticated using (state_confidence >= 70);

drop policy if exists "Admins can read creator accounts" on public.creator_accounts;
create policy "Admins can read creator accounts"
on public.creator_accounts for select to authenticated using (public.is_admin());

drop policy if exists "Admins can manage creator accounts" on public.creator_accounts;
create policy "Admins can manage creator accounts"
on public.creator_accounts for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can read source posts" on public.source_posts;
create policy "Admins can read source posts"
on public.source_posts for select to authenticated using (public.is_admin());

drop policy if exists "Admins can read evidence audit" on public.evidence_audit_log;
create policy "Admins can read evidence audit"
on public.evidence_audit_log for select to authenticated using (public.is_admin());

drop policy if exists "Admins can append evidence audit" on public.evidence_audit_log;
create policy "Admins can append evidence audit"
on public.evidence_audit_log for insert to authenticated with check (public.is_admin());

drop policy if exists "Admins can read evidence radar runs" on public.evidence_radar_runs;
create policy "Admins can read evidence radar runs"
on public.evidence_radar_runs for select to authenticated using (public.is_admin());

-- Bootstrap the primary public account for each existing KOL. Additional social accounts
-- can be added in Admin > Monitoring without changing the creator profile row.
with ranked_kols as (
  select
    id,
    platform,
    handle,
    row_number() over (order by trustscore desc nulls last, id) as priority_rank
  from public.kols
  where coalesce(handle, '') <> '' and coalesce(platform, '') <> ''
), account_seed as (
  select
    id as creator_id,
    platform,
    case lower(platform)
      when 'youtube' then 'https://www.youtube.com/@' || regexp_replace(handle, '^@', '')
      when 'tiktok' then 'https://www.tiktok.com/@' || regexp_replace(handle, '^@', '')
      when 'instagram' then 'https://www.instagram.com/' || regexp_replace(handle, '^@', '')
      when 'facebook' then 'https://www.facebook.com/' || regexp_replace(handle, '^@', '')
      else null
    end as profile_url,
    case when priority_rank <= 50 then 'a' when priority_rank <= 200 then 'b' else 'c' end as priority_tier,
    case when priority_rank <= 50 then 120 when priority_rank <= 200 then 360 else 1440 end as crawl_interval_minutes
  from ranked_kols
)
insert into public.creator_accounts (
  creator_id, platform, profile_url, priority_tier, crawl_interval_minutes
)
select creator_id, platform, profile_url, priority_tier, crawl_interval_minutes
from account_seed
where profile_url is not null
on conflict (platform, profile_url) do nothing;

drop policy if exists "Allow public read-only access on creator_product_events" on public.creator_product_events;
drop policy if exists "Allow public verified creator events" on public.creator_product_events;
create policy "Allow public verified creator events"
on public.creator_product_events for select to anon, authenticated
using (
  verification_status = 'verified'
  and coalesce(confidence_score, case confidence when 'high' then 92 when 'medium' then 75 else 50 end) >= 70
  and source_url is not null
);

-- Backfill confidence values and derived state for existing verified events.
update public.creator_product_events
set confidence_score = case confidence when 'high' then 92 when 'medium' then 75 else 50 end
where confidence_score is null;

do $$
declare v_pair record;
begin
  for v_pair in
    select distinct creator_id, product_id from public.creator_product_events
  loop
    perform private.recompute_creator_product_state(v_pair.creator_id, v_pair.product_id);
  end loop;
end $$;
