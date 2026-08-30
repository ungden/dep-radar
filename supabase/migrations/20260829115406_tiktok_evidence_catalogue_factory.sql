-- TikTok Evidence-to-Catalogue Factory. Raw creator media and prompts remain
-- private; only verified product records and derived evidence can be public.

begin;

alter table public.source_posts
  add column if not exists collector_batch_id text,
  add column if not exists automation_cohort text not null default 'legacy',
  add column if not exists cover_ocr_text text,
  add column if not exists triage_sampled boolean not null default false,
  add column if not exists visual_verified_at timestamptz;

create index if not exists source_posts_factory_cohort_idx
  on public.source_posts(automation_cohort, analysis_status, published_at desc);

alter table public.product_candidates
  add column if not exists verification_metadata jsonb not null default '{}'::jsonb,
  add column if not exists system_verified_at timestamptz,
  add column if not exists last_enrichment_error text;

alter table public.product_candidates
  drop constraint if exists product_candidates_status_check;

alter table public.product_candidates
  add constraint product_candidates_status_check check (status in (
    'new', 'needs_identity', 'ready_to_create', 'merged', 'rejected',
    'extracting', 'enriching', 'verified', 'needs_official_source',
    'policy_blocked', 'failed'
  ));

create index if not exists product_candidates_enrichment_idx
  on public.product_candidates(status, identity_confidence desc, updated_at asc)
  where status in ('new', 'extracting', 'enriching', 'needs_official_source', 'failed');

create table if not exists public.product_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.product_candidates(id) on delete cascade,
  source_post_id uuid references public.source_posts(id) on delete set null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  idempotency_key text not null unique,
  lease_expires_at timestamptz,
  official_url text,
  image_url text,
  source_domain text,
  extracted_facts jsonb not null default '{}'::jsonb,
  citations jsonb not null default '[]'::jsonb,
  usage_metadata jsonb not null default '{}'::jsonb,
  actual_cost_usd numeric(12, 6) not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint product_enrichment_jobs_status_check check (
    status in ('queued', 'processing', 'verified', 'needs_official_source', 'policy_blocked', 'failed')
  ),
  constraint product_enrichment_jobs_attempts_check check (attempt_count between 0 and max_attempts and max_attempts between 1 and 3),
  constraint product_enrichment_jobs_urls_check check (
    (official_url is null or official_url ~* '^https://') and (image_url is null or image_url ~* '^https://')
  )
);

create index if not exists product_enrichment_jobs_work_idx
  on public.product_enrichment_jobs(status, created_at asc);

create table if not exists public.product_source_provenance (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.radar_products(id) on delete cascade,
  candidate_id uuid references public.product_candidates(id) on delete set null,
  enrichment_job_id uuid references public.product_enrichment_jobs(id) on delete set null,
  source_url text not null,
  source_domain text not null,
  source_type text not null default 'official',
  image_url text not null,
  extracted_facts jsonb not null default '{}'::jsonb,
  citations jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  content_hash text not null,
  unique(product_id, source_url),
  constraint product_source_provenance_type_check check (source_type = 'official'),
  constraint product_source_provenance_urls_check check (source_url ~* '^https://' and image_url ~* '^https://')
);

create index if not exists product_source_provenance_product_idx
  on public.product_source_provenance(product_id, fetched_at desc);

alter table public.radar_products
  add column if not exists provenance jsonb not null default '{}'::jsonb;

alter table public.evidence_radar_runs
  drop constraint if exists evidence_radar_runs_type_check;
alter table public.evidence_radar_runs
  add constraint evidence_radar_runs_type_check check (run_type in ('collection', 'analysis', 'enrichment', 'state_recompute', 'cleanup'));

alter table public.content_budget_config
  add column if not exists vision_ai_limit_usd numeric(12,2) not null default 5,
  add column if not exists draft_ai_limit_usd numeric(12,2) not null default 7;
alter table public.content_budget_config
  drop constraint if exists content_budget_vision_split_check;
alter table public.content_budget_config
  add constraint content_budget_vision_split_check check (
    vision_ai_limit_usd >= 0 and draft_ai_limit_usd >= 0
    and vision_ai_limit_usd + draft_ai_limit_usd <= ai_text_limit_usd
  );

select pgmq.create('product_enrichment');
grant select, update, delete on table pgmq.q_product_enrichment to service_role;
grant insert on table pgmq.q_product_enrichment to service_role;

create or replace function public.product_enrichment_queue_send(
  job_id uuid,
  idempotency_key text
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return pgmq.send('product_enrichment', jsonb_build_object(
    'job_id', job_id,
    'idempotency_key', idempotency_key,
    'enqueued_at', now()
  ));
end;
$$;

revoke all on function public.product_enrichment_queue_send(uuid, text) from public, anon, authenticated;
grant execute on function public.product_enrichment_queue_send(uuid, text) to service_role;

create or replace function public.evidence_radar_enqueue_source_posts(
  source_post_ids uuid[]
) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    update public.source_posts
    set analysis_status = 'queued', last_error = null, updated_at = now()
    where id = any(source_post_ids)
      and (
        (media_url is not null and raw_media_expires_at > now())
        or transcription_status in ('ready', 'no_speech')
        or coalesce(array_length(archive_frame_paths, 1), 0) > 0
      )
      and analysis_status in ('pending', 'failed', 'ignored')
    returning id
  loop
    perform pgmq.send('evidence_analysis', jsonb_build_object('source_post_id', v_id, 'enqueued_at', now()));
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

alter table public.product_enrichment_jobs enable row level security;
alter table public.product_source_provenance enable row level security;
revoke all on table public.product_enrichment_jobs, public.product_source_provenance from anon;
grant select, insert, update, delete on table public.product_enrichment_jobs, public.product_source_provenance to authenticated, service_role;

drop policy if exists "Admins manage product enrichment jobs" on public.product_enrichment_jobs;
create policy "Admins manage product enrichment jobs" on public.product_enrichment_jobs
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins manage product source provenance" on public.product_source_provenance;
create policy "Admins manage product source provenance" on public.product_source_provenance
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

commit;
