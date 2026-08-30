-- 360dep Content Factory foundation.
-- Additive/idempotent because the linked project contains older migration
-- timestamps that do not map one-to-one to this repository.

create extension if not exists pgmq;

create schema if not exists private;

alter table public.posts
  add column if not exists hub_slug text,
  add column if not exists intent text,
  add column if not exists risk_level text not null default 'low',
  add column if not exists content_format text,
  add column if not exists condition_slugs text[] not null default '{}',
  add column if not exists status text not null default 'published',
  add column if not exists takeaways jsonb not null default '[]'::jsonb,
  add column if not exists faq jsonb not null default '[]'::jsonb,
  add column if not exists source_notes jsonb not null default '[]'::jsonb,
  add column if not exists structured_content jsonb not null default '{}'::jsonb,
  add column if not exists medical_disclaimer_level text not null default 'none',
  add column if not exists research_stage text,
  add column if not exists user_question text,
  add column if not exists next_article_slugs text[] not null default '{}',
  add column if not exists product_group_keys text[] not null default '{}',
  add column if not exists matrix_product_ids text[] not null default '{}',
  add column if not exists kol_ids text[] not null default '{}',
  add column if not exists kol_reasons jsonb not null default '{}'::jsonb,
  add column if not exists related_node_keys text[] not null default '{}',
  add column if not exists generation_method text not null default 'legacy_registry',
  add column if not exists provenance jsonb not null default '{}'::jsonb,
  add column if not exists quality_score integer,
  add column if not exists verifier_score integer,
  add column if not exists prompt_version text,
  add column if not exists published_at timestamptz,
  add column if not exists refreshed_at timestamptz,
  add column if not exists last_verified_at timestamptz,
  add column if not exists refresh_due_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.posts
set status = 'published',
    published_at = coalesce(published_at, created_at, now()),
    updated_at = coalesce(updated_at, created_at, now())
where status is null or status = 'published';

do $$
begin
  alter table public.posts add constraint posts_content_factory_status_check
    check (status in ('planned', 'draft', 'verifying', 'publishable', 'policy_blocked', 'published', 'archived'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.posts add constraint posts_content_factory_risk_check
    check (risk_level in ('low', 'medium', 'high'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.posts add constraint posts_content_factory_quality_check
    check (quality_score is null or quality_score between 0 and 100);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.posts add constraint posts_content_factory_verifier_check
    check (verifier_score is null or verifier_score between 0 and 100);
exception when duplicate_object then null;
end $$;

create unique index if not exists posts_slug_unique_idx on public.posts(slug);
create index if not exists posts_publication_idx on public.posts(status, published_at desc);
create index if not exists posts_refresh_idx on public.posts(status, refresh_due_at);
create index if not exists posts_hub_status_idx on public.posts(hub_slug, status);

create table if not exists public.content_signals (
  id uuid primary key default gen_random_uuid(),
  signal_type text not null,
  source_type text not null,
  external_key text,
  title text not null,
  summary text not null default '',
  source_url text,
  hub_slug text,
  intent text,
  risk_level text not null default 'low',
  payload jsonb not null default '{}'::jsonb,
  evidence_score integer not null default 0,
  freshness_score integer not null default 0,
  opportunity_score integer not null default 0,
  total_score integer generated always as (evidence_score + freshness_score + opportunity_score) stored,
  status text not null default 'pending',
  dedupe_hash text not null,
  observed_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_signals_type_check check (signal_type in ('creator_evidence', 'product_evidence', 'content_gap', 'search_console', 'freshness', 'evergreen')),
  constraint content_signals_risk_check check (risk_level in ('low', 'medium', 'high')),
  constraint content_signals_status_check check (status in ('pending', 'selected', 'consumed', 'rejected', 'expired')),
  constraint content_signals_score_check check (
    evidence_score between 0 and 100 and freshness_score between 0 and 100 and opportunity_score between 0 and 100
  ),
  constraint content_signals_dedupe_unique unique (dedupe_hash)
);

create unique index if not exists content_signals_external_key_unique
  on public.content_signals(source_type, external_key)
  where external_key is not null;
create index if not exists content_signals_planner_idx
  on public.content_signals(status, total_score desc, observed_at desc);

create table if not exists public.content_jobs (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references public.content_signals(id) on delete set null,
  post_id text references public.posts(id) on delete set null,
  job_type text not null,
  slot_type text not null,
  status text not null default 'queued',
  risk_level text not null default 'low',
  hub_slug text,
  intent text,
  scheduled_for timestamptz not null,
  idempotency_key text not null unique,
  checkpoint jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  lease_until timestamptz,
  leased_by text,
  generator_model text,
  verifier_model text,
  draft_version_id uuid,
  published_version_id uuid,
  deterministic_score integer,
  verifier_score integer,
  similarity_score numeric(5,4),
  policy_reasons text[] not null default '{}',
  estimated_cost_usd numeric(12,6) not null default 0,
  actual_cost_usd numeric(12,6) not null default 0,
  shadow_mode boolean not null default true,
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_jobs_type_check check (job_type in ('new', 'refresh')),
  constraint content_jobs_slot_check check (slot_type in ('refresh', 'evidence', 'evergreen')),
  constraint content_jobs_status_check check (status in ('queued', 'researching', 'drafting', 'verifying', 'asset_preparation', 'publishable', 'policy_blocked', 'published', 'failed')),
  constraint content_jobs_risk_check check (risk_level in ('low', 'medium', 'high')),
  constraint content_jobs_attempt_check check (attempt_count between 0 and max_attempts and max_attempts between 1 and 3),
  constraint content_jobs_deterministic_check check (deterministic_score is null or deterministic_score between 0 and 100),
  constraint content_jobs_verifier_check check (verifier_score is null or verifier_score between 0 and 100),
  constraint content_jobs_similarity_check check (similarity_score is null or similarity_score between 0 and 1)
);

create index if not exists content_jobs_worker_idx on public.content_jobs(status, scheduled_for, lease_until);
create index if not exists content_jobs_ops_idx on public.content_jobs(created_at desc, status);

create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.posts(id) on delete cascade,
  job_id uuid references public.content_jobs(id) on delete set null,
  version_number integer not null,
  snapshot_stage text not null,
  supersedes_version_id uuid references public.content_versions(id) on delete set null,
  title text not null,
  slug text not null,
  excerpt text not null,
  content text not null,
  structured_content jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  risk_level text not null,
  provenance jsonb not null default '{}'::jsonb,
  quality_report jsonb not null default '{}'::jsonb,
  content_hash text not null,
  created_at timestamptz not null default now(),
  constraint content_versions_number_check check (version_number > 0),
  constraint content_versions_stage_check check (snapshot_stage in ('legacy', 'draft', 'verified', 'published', 'rejected')),
  constraint content_versions_risk_check check (risk_level in ('low', 'medium', 'high')),
  constraint content_versions_snapshot_unique unique (post_id, version_number, snapshot_stage)
);

create index if not exists content_versions_post_idx on public.content_versions(post_id, version_number desc);
create index if not exists content_versions_job_idx on public.content_versions(job_id);

alter table public.content_jobs
  add constraint content_jobs_draft_version_fk foreign key (draft_version_id) references public.content_versions(id) on delete set null,
  add constraint content_jobs_published_version_fk foreign key (published_version_id) references public.content_versions(id) on delete set null;

alter table public.posts add column if not exists current_version_id uuid;
do $$
begin
  alter table public.posts add constraint posts_current_version_fk
    foreign key (current_version_id) references public.content_versions(id) on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.content_versions(id) on delete cascade,
  canonical_url text not null,
  source_title text not null,
  publisher text,
  source_type text not null,
  source_tier text not null,
  accessed_at timestamptz not null default now(),
  accessible boolean not null default false,
  official boolean not null default false,
  regulator_or_professional boolean not null default false,
  evidence_excerpt text,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint content_sources_tier_check check (source_tier in ('A', 'B', 'C', 'D')),
  constraint content_sources_version_url_unique unique (version_id, canonical_url)
);

create index if not exists content_sources_version_idx on public.content_sources(version_id, source_tier);

create table if not exists public.content_claims (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.content_versions(id) on delete cascade,
  claim_key text not null,
  claim_text text not null,
  claim_type text not null,
  risk_level text not null,
  source_ids uuid[] not null default '{}',
  verification_status text not null default 'pending',
  verifier_confidence integer,
  verifier_note text,
  created_at timestamptz not null default now(),
  constraint content_claims_risk_check check (risk_level in ('low', 'medium', 'high')),
  constraint content_claims_status_check check (verification_status in ('pending', 'supported', 'unsupported', 'contradictory', 'not_applicable')),
  constraint content_claims_confidence_check check (verifier_confidence is null or verifier_confidence between 0 and 100),
  constraint content_claims_version_key_unique unique (version_id, claim_key)
);

create index if not exists content_claims_version_idx on public.content_claims(version_id, verification_status);

create table if not exists public.content_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.content_jobs(id) on delete set null,
  stage text not null,
  provider text,
  model text,
  prompt_version text,
  prompt_hash text,
  cost_category text not null default 'ai_text',
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cached_tokens integer not null default 0,
  estimated_cost_usd numeric(12,6) not null default 0,
  actual_cost_usd numeric(12,6) not null default 0,
  retry_number integer not null default 0,
  idempotency_key text not null unique,
  status text not null default 'running',
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint content_runs_category_check check (cost_category in ('ai_text', 'collection', 'image', 'reserve')),
  constraint content_runs_status_check check (status in ('running', 'completed', 'failed', 'skipped')),
  constraint content_runs_retry_check check (retry_number between 0 and 3)
);

create index if not exists content_runs_budget_idx on public.content_runs(started_at, cost_category, status);
create index if not exists content_runs_job_idx on public.content_runs(job_id, started_at);

create table if not exists public.content_performance_daily (
  post_id text not null references public.posts(id) on delete cascade,
  metric_date date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  ctr numeric(8,6) not null default 0,
  reads integer not null default 0,
  affiliate_clicks integer not null default 0,
  avg_read_seconds integer not null default 0,
  source text not null default 'internal',
  refresh_score integer not null default 0,
  refresh_recommended boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (post_id, metric_date),
  constraint content_performance_nonnegative_check check (
    impressions >= 0 and clicks >= 0 and reads >= 0 and affiliate_clicks >= 0 and avg_read_seconds >= 0
  ),
  constraint content_performance_refresh_score_check check (refresh_score between 0 and 100)
);

create index if not exists content_performance_refresh_idx
  on public.content_performance_daily(refresh_recommended, refresh_score desc, metric_date desc);

create table if not exists public.content_budget_config (
  id boolean primary key default true check (id),
  monthly_limit_usd numeric(12,2) not null default 25,
  ai_text_limit_usd numeric(12,2) not null default 12,
  collection_limit_usd numeric(12,2) not null default 8,
  image_limit_usd numeric(12,2) not null default 2,
  reserve_limit_usd numeric(12,2) not null default 3,
  warning_ratio numeric(5,4) not null default 0.8,
  updated_at timestamptz not null default now(),
  constraint content_budget_total_check check (
    monthly_limit_usd > 0
    and ai_text_limit_usd + collection_limit_usd + image_limit_usd + reserve_limit_usd <= monthly_limit_usd
    and warning_ratio between 0.5 and 0.99
  )
);

insert into public.content_budget_config(id) values (true) on conflict (id) do nothing;

create or replace function private.content_factory_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists posts_content_factory_updated_at on public.posts;
create trigger posts_content_factory_updated_at before update on public.posts
for each row execute function private.content_factory_set_updated_at();

drop trigger if exists content_signals_updated_at on public.content_signals;
create trigger content_signals_updated_at before update on public.content_signals
for each row execute function private.content_factory_set_updated_at();

drop trigger if exists content_jobs_updated_at on public.content_jobs;
create trigger content_jobs_updated_at before update on public.content_jobs
for each row execute function private.content_factory_set_updated_at();

create or replace function private.content_versions_are_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'content_versions are append-only';
end;
$$;

drop trigger if exists content_versions_immutable on public.content_versions;
create trigger content_versions_immutable before update or delete on public.content_versions
for each row execute function private.content_versions_are_immutable();

do $$
begin
  perform pgmq.create('content_pipeline');
exception when duplicate_table then null;
end $$;

create or replace function public.content_factory_queue_send(
  job_id uuid,
  idempotency_key text
) returns bigint
language sql
security invoker
set search_path = ''
as $$
  select pgmq.send(
    'content_pipeline',
    jsonb_build_object('job_id', $1, 'idempotency_key', $2, 'enqueued_at', now())
  );
$$;

create or replace function public.content_factory_queue_read(
  visibility_seconds integer,
  message_count integer
) returns setof pgmq.message_record
language sql
security invoker
set search_path = ''
as $$
  select * from pgmq.read('content_pipeline', $1, $2, null::jsonb);
$$;

create or replace function public.content_factory_queue_delete(message_id bigint)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select pgmq.delete('content_pipeline', $1);
$$;

-- One transaction creates the public snapshot, points the canonical post to it,
-- and closes the job. The worker may safely retry with the same job/version.
create or replace function public.content_factory_publish(
  p_job_id uuid,
  p_draft_version_id uuid,
  p_published_at timestamptz default now()
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.content_jobs%rowtype;
  v_draft public.content_versions%rowtype;
  v_published_id uuid;
begin
  select * into v_job from public.content_jobs where id = p_job_id for update;
  if not found then raise exception 'content job not found'; end if;
  if v_job.status = 'published' and v_job.published_version_id is not null then
    return v_job.published_version_id;
  end if;
  if v_job.status <> 'publishable' then raise exception 'content job is not publishable'; end if;

  select * into v_draft from public.content_versions
  where id = p_draft_version_id and job_id = p_job_id and snapshot_stage in ('draft', 'verified');
  if not found then raise exception 'draft version not found'; end if;

  select id into v_published_id from public.content_versions
  where post_id = v_draft.post_id and version_number = v_draft.version_number and snapshot_stage = 'published';

  if v_published_id is null then
    insert into public.content_versions (
      post_id, job_id, version_number, snapshot_stage, supersedes_version_id,
      title, slug, excerpt, content, structured_content, metadata, risk_level,
      provenance, quality_report, content_hash, created_at
    ) values (
      v_draft.post_id, p_job_id, v_draft.version_number, 'published', v_draft.id,
      v_draft.title, v_draft.slug, v_draft.excerpt, v_draft.content,
      v_draft.structured_content, v_draft.metadata, v_draft.risk_level,
      v_draft.provenance, v_draft.quality_report, v_draft.content_hash, p_published_at
    ) returning id into v_published_id;
  end if;

  update public.posts set
    title = v_draft.title,
    slug = v_draft.slug,
    excerpt = v_draft.excerpt,
    content = v_draft.content,
    structured_content = v_draft.structured_content,
    category = coalesce(v_draft.metadata->>'category', category),
    tags = coalesce(array(select jsonb_array_elements_text(v_draft.metadata->'tags')), tags, '{}'),
    image = coalesce(v_draft.metadata->>'image', image, '/brand/social-share.jpg'),
    takeaways = coalesce(v_draft.metadata->'takeaways', takeaways, '[]'::jsonb),
    faq = coalesce(v_draft.metadata->'faq', faq, '[]'::jsonb),
    source_notes = coalesce((
      select jsonb_agg(jsonb_build_object('label', source_title, 'url', canonical_url) order by source_tier, source_title)
      from public.content_sources where version_id = v_draft.id and accessible = true
    ), '[]'::jsonb),
    product_ids = coalesce(array(select jsonb_array_elements_text(v_draft.metadata->'productIds')), product_ids, '{}'),
    next_article_slugs = coalesce(array(select jsonb_array_elements_text(v_draft.metadata->'internalLinkSlugs')), next_article_slugs, '{}'),
    hub_slug = coalesce(v_draft.structured_content->>'hubSlug', hub_slug),
    intent = coalesce(v_draft.structured_content->>'intent', intent),
    content_format = coalesce(v_draft.structured_content->>'contentFormat', content_format),
    medical_disclaimer_level = coalesce(v_draft.metadata->>'medicalDisclaimerLevel', medical_disclaimer_level, 'none'),
    status = 'published',
    risk_level = v_draft.risk_level,
    current_version_id = v_published_id,
    quality_score = v_job.deterministic_score,
    verifier_score = v_job.verifier_score,
    published_at = case when v_job.job_type = 'new' then p_published_at else coalesce(published_at, p_published_at) end,
    refreshed_at = case when v_job.job_type = 'refresh' then p_published_at else refreshed_at end,
    last_verified_at = p_published_at,
    refresh_due_at = p_published_at + interval '180 days',
    generation_method = 'content_factory',
    provenance = provenance || jsonb_build_object('content_job_id', p_job_id, 'published_version_id', v_published_id)
  where id = v_draft.post_id;

  update public.content_jobs set
    status = 'published', published_version_id = v_published_id,
    published_at = p_published_at, lease_until = null, leased_by = null
  where id = p_job_id;

  if v_job.signal_id is not null then
    update public.content_signals set status = 'consumed' where id = v_job.signal_id;
  end if;

  return v_published_id;
end;
$$;

alter table public.content_signals enable row level security;
alter table public.content_jobs enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_sources enable row level security;
alter table public.content_claims enable row level security;
alter table public.content_runs enable row level security;
alter table public.content_performance_daily enable row level security;
alter table public.content_budget_config enable row level security;
alter table public.posts enable row level security;

drop policy if exists "Allow public read-only access on posts" on public.posts;
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts" on public.posts
  for select to anon, authenticated using (status = 'published');

drop policy if exists "Admins can manage content signals" on public.content_signals;
create policy "Admins can manage content signals" on public.content_signals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage content jobs" on public.content_jobs;
create policy "Admins can manage content jobs" on public.content_jobs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage content versions" on public.content_versions;
create policy "Admins can manage content versions" on public.content_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Public can read published content versions" on public.content_versions;
drop policy if exists "Admins can manage content sources" on public.content_sources;
create policy "Admins can manage content sources" on public.content_sources
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage content claims" on public.content_claims;
create policy "Admins can manage content claims" on public.content_claims
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage content runs" on public.content_runs;
create policy "Admins can manage content runs" on public.content_runs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage content performance" on public.content_performance_daily;
create policy "Admins can manage content performance" on public.content_performance_daily
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage content budget" on public.content_budget_config;
create policy "Admins can manage content budget" on public.content_budget_config
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on table public.content_signals, public.content_jobs, public.content_sources,
  public.content_claims, public.content_runs, public.content_performance_daily,
  public.content_budget_config from anon;
revoke all on table public.content_versions from anon;
grant select, insert, update, delete on table public.content_signals, public.content_jobs,
  public.content_sources, public.content_claims, public.content_runs,
  public.content_performance_daily, public.content_budget_config to authenticated;
grant select, insert on table public.content_versions to authenticated;

revoke all on function public.content_factory_queue_send(uuid, text) from public, anon, authenticated;
revoke all on function public.content_factory_queue_read(integer, integer) from public, anon, authenticated;
revoke all on function public.content_factory_queue_delete(bigint) from public, anon, authenticated;
revoke all on function public.content_factory_publish(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.content_factory_queue_send(uuid, text) to service_role;
grant execute on function public.content_factory_queue_read(integer, integer) to service_role;
grant execute on function public.content_factory_queue_delete(bigint) to service_role;
grant execute on function public.content_factory_publish(uuid, uuid, timestamptz) to service_role;

grant usage on schema pgmq to service_role;
grant execute on function pgmq.send(text, jsonb) to service_role;
grant execute on function pgmq.read(text, integer, integer, jsonb) to service_role;
grant execute on function pgmq.delete(text, bigint) to service_role;
grant select, insert, update, delete on table pgmq.q_content_pipeline to service_role;
