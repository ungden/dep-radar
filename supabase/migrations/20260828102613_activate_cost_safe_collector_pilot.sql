-- Cost-safe collection routing. TikTok pilot accounts are fed by the signed
-- inbound collector webhook and must never be enqueued for Bright Data.
alter table public.creator_accounts
  add column if not exists collection_mode text not null default 'disabled',
  add column if not exists source_quality_score integer not null default 0;

do $$
begin
  alter table public.creator_accounts add constraint creator_accounts_collection_mode_check
    check (collection_mode in ('disabled', 'webhook', 'youtube_api', 'paid_provider'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.creator_accounts add constraint creator_accounts_source_quality_check
    check (source_quality_score between 0 and 100);
exception when duplicate_object then null;
end $$;

with evidence_quality as (
  select
    creator_id,
    least(100, round(
      coalesce(avg(confidence_score), 0) * 0.8
      + least(count(*) filter (where exact_sku_verified = true), 10) * 2
    ))::integer as score
  from public.creator_product_events
  where verification_status = 'verified'
  group by creator_id
)
update public.creator_accounts as account
set source_quality_score = quality.score,
    updated_at = now()
from evidence_quality as quality
where quality.creator_id = account.creator_id;

-- Capability defaults are deliberately disabled. YouTube becomes youtube_api
-- only after a key exists; Instagram/Facebook remain disabled until cost per
-- accepted record is measured.
update public.creator_accounts
set active = false,
    collection_mode = 'disabled',
    updated_at = now();

with ranked_tiktok as (
  select
    account.id,
    row_number() over (
      order by
        (coalesce(kol.trustscore, 0) * 0.6 + account.source_quality_score * 0.4) desc,
        account.source_quality_score desc,
        coalesce(kol.trustscore, 0) desc,
        account.id
    ) as pilot_rank
  from public.creator_accounts as account
  join public.kols as kol on kol.id = account.creator_id
  where lower(account.platform) = 'tiktok'
    and kol.directory_status = 'active'
    and coalesce(account.profile_url, '') like 'https://www.tiktok.com/@%'
)
update public.creator_accounts as account
set active = true,
    collection_mode = 'webhook',
    priority_tier = 'a',
    crawl_interval_minutes = 1440,
    last_error = null,
    updated_at = now()
from ranked_tiktok as ranked
where ranked.id = account.id and ranked.pilot_rank <= 20;

create index if not exists creator_accounts_collection_mode_idx
  on public.creator_accounts(active, collection_mode, priority_tier, next_poll_at);

-- Only API/paid modes are polled. Webhook accounts are push-only and therefore
-- cannot create a paid queue backlog.
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
    where active = true
      and collection_mode in ('youtube_api', 'paid_provider')
      and next_poll_at <= now()
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
