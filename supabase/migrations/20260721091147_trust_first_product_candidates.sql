-- Trust-first KOL/KOC decision data.
-- Product discovery stays private until an exact SKU and human review exist.

create schema if not exists private;

alter table public.source_posts
  add column if not exists content_lane text not null default 'unclassified',
  add column if not exists priority_score integer not null default 0,
  add column if not exists triage_reason text,
  add column if not exists triaged_at timestamptz,
  add column if not exists duplicate_of_source_post_id uuid references public.source_posts(id) on delete set null,
  add column if not exists vision_sample_timestamps numeric[] not null default '{}'::numeric[];

do $$
begin
  alter table public.source_posts
    add constraint source_posts_content_lane_check
    check (content_lane in (
      'unclassified', 'product_review', 'expert_education',
      'commercial_trend', 'lifestyle', 'vision_required'
    ));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.source_posts
    add constraint source_posts_priority_score_check
    check (priority_score between 0 and 100);
exception when duplicate_object then null;
end $$;

create index if not exists source_posts_priority_analysis_idx
  on public.source_posts(priority_score desc, published_at desc)
  where analysis_status in ('pending', 'queued', 'failed');

create index if not exists source_posts_media_dedupe_idx
  on public.source_posts(media_sha256)
  where media_sha256 is not null;

create index if not exists source_posts_audio_dedupe_idx
  on public.source_posts(audio_sha256)
  where audio_sha256 is not null;

create table if not exists public.product_candidates (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  brand text not null,
  product_name text not null,
  variant text,
  aliases text[] not null default '{}'::text[],
  source_post_count integer not null default 0 check (source_post_count >= 0),
  creator_count integer not null default 0 check (creator_count >= 0),
  identity_confidence integer not null default 0 check (identity_confidence between 0 and 100),
  official_product_url text,
  image_source_url text,
  status text not null default 'new' check (status in ('new', 'needs_identity', 'ready_to_create', 'merged', 'rejected')),
  matched_product_id text references public.radar_products(id) on delete set null,
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (official_product_url is null or official_product_url ~* '^https://'),
  check (image_source_url is null or image_source_url ~* '^https://'),
  check (
    status not in ('ready_to_create', 'merged', 'rejected')
    or (reviewed_by is not null and reviewed_at is not null)
  ),
  check (status <> 'merged' or matched_product_id is not null)
);

create table if not exists public.product_candidate_sources (
  candidate_id uuid not null references public.product_candidates(id) on delete cascade,
  source_post_id uuid not null references public.source_posts(id) on delete cascade,
  creator_id text not null references public.kols(id) on delete cascade,
  evidence_id text references public.creator_evidence_items(id) on delete set null,
  event_type text not null,
  disclosure text not null,
  evidence_spans jsonb not null default '[]'::jsonb,
  risk_flags text[] not null default '{}'::text[],
  product_identity_score integer not null default 0 check (product_identity_score between 0 and 40),
  action_evidence_score integer not null default 0 check (action_evidence_score between 0 and 35),
  source_authenticity_score integer not null default 0 check (source_authenticity_score between 0 and 15),
  evidence_localization_score integer not null default 0 check (evidence_localization_score between 0 and 10),
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (event_type in (
    'first_seen', 'mentioned', 'unboxed', 'used', 'reviewed', 'recommended',
    'disliked', 'emptied', 'repurchased', 'switched_to', 'stopped_using',
    'live_sold', 'sponsored'
  )),
  check (disclosure in ('organic', 'pr', 'sponsored', 'affiliate', 'unknown')),
  primary key (candidate_id, source_post_id)
);

create table if not exists public.evidence_golden_samples (
  id uuid primary key default gen_random_uuid(),
  source_post_id uuid not null unique references public.source_posts(id) on delete cascade,
  cohort text not null default 'pilot-200',
  content_class text not null default 'unlabeled' check (content_class in (
    'unlabeled', 'product_review', 'expert_education', 'commercial', 'ambiguous', 'no_product'
  )),
  expected_claims jsonb not null default '[]'::jsonb,
  reviewer_note text,
  status text not null default 'pending' check (status in ('pending', 'labeled', 'excluded')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    status <> 'labeled'
    or (
      reviewed_by is not null
      and reviewed_at is not null
      and content_class <> 'unlabeled'
      and (content_class in ('expert_education', 'no_product') or jsonb_array_length(expected_claims) > 0)
    )
  )
);

create index if not exists product_candidates_review_queue_idx
  on public.product_candidates(status, creator_count desc, identity_confidence desc, updated_at desc);

create index if not exists product_candidate_sources_creator_idx
  on public.product_candidate_sources(creator_id, created_at desc);

alter table public.product_candidates enable row level security;
alter table public.product_candidate_sources enable row level security;
alter table public.evidence_golden_samples enable row level security;

revoke all on public.product_candidates from anon, authenticated;
revoke all on public.product_candidate_sources from anon, authenticated;
revoke all on public.evidence_golden_samples from anon, authenticated;
grant select, insert, update, delete on public.product_candidates to authenticated, service_role;
grant select, insert, update, delete on public.product_candidate_sources to authenticated, service_role;
grant select, insert, update, delete on public.evidence_golden_samples to authenticated, service_role;

drop policy if exists "Admins manage product candidates" on public.product_candidates;
create policy "Admins manage product candidates"
on public.product_candidates
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage product candidate sources" on public.product_candidate_sources;
create policy "Admins manage product candidate sources"
on public.product_candidate_sources
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage evidence golden samples" on public.evidence_golden_samples;
create policy "Admins manage evidence golden samples"
on public.evidence_golden_samples
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create or replace function private.refresh_product_candidate_counts()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  candidate_ids uuid[];
begin
  if tg_op = 'INSERT' then
    candidate_ids := array[new.candidate_id];
  elsif tg_op = 'DELETE' then
    candidate_ids := array[old.candidate_id];
  else
    candidate_ids := array[new.candidate_id, old.candidate_id];
  end if;

  update public.product_candidates candidate
  set
    source_post_count = counts.source_count,
    creator_count = counts.creator_count,
    identity_confidence = greatest(candidate.identity_confidence, counts.identity_confidence),
    updated_at = now()
  from (
    select
      source.candidate_id,
      count(*)::integer as source_count,
      count(distinct source.creator_id)::integer as creator_count,
      coalesce(max(source.confidence_score), 0)::integer as identity_confidence
    from public.product_candidate_sources source
    where source.candidate_id = any(candidate_ids)
    group by source.candidate_id
  ) counts
  where candidate.id = counts.candidate_id;

  update public.product_candidates candidate
  set source_post_count = 0, creator_count = 0, updated_at = now()
  where candidate.id = any(candidate_ids)
    and not exists (
      select 1 from public.product_candidate_sources source
      where source.candidate_id = candidate.id
    );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists product_candidate_sources_refresh_counts on public.product_candidate_sources;
create trigger product_candidate_sources_refresh_counts
after insert or update or delete on public.product_candidate_sources
for each row execute function private.refresh_product_candidate_counts();

alter table public.creator_product_events
  add column if not exists evidence_spans jsonb not null default '[]'::jsonb,
  add column if not exists risk_flags text[] not null default '{}'::text[],
  add column if not exists product_identity_score integer,
  add column if not exists action_evidence_score integer,
  add column if not exists source_authenticity_score integer,
  add column if not exists evidence_localization_score integer,
  add column if not exists exact_sku_verified boolean not null default false;

do $$
begin
  alter table public.creator_product_events
    add constraint creator_product_events_component_scores_check
    check (
      (product_identity_score is null or product_identity_score between 0 and 40)
      and (action_evidence_score is null or action_evidence_score between 0 and 35)
      and (source_authenticity_score is null or source_authenticity_score between 0 and 15)
      and (evidence_localization_score is null or evidence_localization_score between 0 and 10)
    );
exception when duplicate_object then null;
end $$;

-- Remove old internal/blog seed evidence from the publish surface.
update public.creator_evidence_items
set
  status = 'rejected',
  review_reason = 'Internal/blog seed is not public creator evidence.',
  researcher_note = coalesce(researcher_note, 'Rejected by trust-first public evidence gate.'),
  updated_at = now()
where status = 'published'
  and (
    reviewed_by is null
    or reviewed_at is null
    or source_url is null
    or source_url !~* '^https://'
    or source_url ~* '^https://(www\.)?360dep\.vn(/|$)'
  );

update public.creator_product_events event
set
  evidence_spans = evidence.evidence_spans,
  risk_flags = evidence.risk_flags,
  exact_sku_verified = true
from public.creator_evidence_items evidence
where event.evidence_id = evidence.id
  and event.verification_status = 'verified'
  and evidence.status = 'published'
  and evidence.reviewed_by is not null
  and evidence.reviewed_at is not null
  and jsonb_array_length(evidence.evidence_spans) > 0;

alter table public.creator_evidence_items
  drop constraint if exists creator_evidence_items_published_contract_check;

alter table public.creator_evidence_items
  add constraint creator_evidence_items_published_contract_check check (
    status <> 'published'
    or (
      reviewed_by is not null
      and reviewed_at is not null
      and requires_human_review = false
      and confidence_score >= 90
      and source_url ~* '^https://'
      and source_url !~* '^https://(www\.)?360dep\.vn(/|$)'
      and jsonb_array_length(evidence_spans) > 0
    )
  );

alter table public.creator_product_events
  drop constraint if exists creator_product_events_verified_contract_check;

alter table public.creator_product_events
  add constraint creator_product_events_verified_contract_check check (
    verification_status <> 'verified'
    or (
      evidence_id is not null
      and verified_by is not null
      and verified_at is not null
      and exact_sku_verified
      and confidence_score >= 90
      and source_url ~* '^https://'
      and source_url !~* '^https://(www\.)?360dep\.vn(/|$)'
      and lower(source_platform) not like '%seed%'
      and lower(source_platform) not like '%internal%'
      and jsonb_array_length(evidence_spans) > 0
    )
  );

drop policy if exists "Public verified or admin creator events" on public.creator_product_events;
create policy "Public verified or admin creator events"
on public.creator_product_events
for select
to anon, authenticated
using (
  (
    verification_status = 'verified'
    and verified_by is not null
    and verified_at is not null
    and exact_sku_verified
    and confidence_score >= 90
    and source_url ~* '^https://'
    and source_url !~* '^https://(www\.)?360dep\.vn(/|$)'
    and lower(source_platform) not like '%seed%'
    and lower(source_platform) not like '%internal%'
    and jsonb_array_length(evidence_spans) > 0
    and (valid_until is null or valid_until > now())
    and exists (
      select 1
      from public.creator_evidence_items evidence
      where evidence.id = creator_product_events.evidence_id
        and evidence.status = 'published'
        and evidence.reviewed_by is not null
        and evidence.reviewed_at is not null
        and evidence.requires_human_review = false
    )
  )
  or (select public.is_admin())
);

drop policy if exists "Public can read audited creator product states" on public.creator_product_states;
create policy "Public can read audited creator product states"
on public.creator_product_states
for select
to anon, authenticated
using (
  (
    state_confidence >= 90
    and exists (
      select 1
      from public.creator_product_events event
      join public.creator_evidence_items evidence on evidence.id = event.evidence_id
      where event.id = creator_product_states.last_event_id
        and event.verification_status = 'verified'
        and event.verified_by is not null
        and event.verified_at is not null
        and event.exact_sku_verified
        and event.confidence_score >= 90
        and jsonb_array_length(event.evidence_spans) > 0
        and evidence.status = 'published'
        and evidence.reviewed_by is not null
        and evidence.reviewed_at is not null
        and evidence.requires_human_review = false
        and (event.valid_until is null or event.valid_until > now())
    )
  )
  or (select public.is_admin())
);

notify pgrst, 'reload schema';
