-- Public creator claims must be traceable to the exact original post. TikTok
-- claims require a direct /video/:id or /photo/:id URL whose id matches the
-- archived source_post_id. Profile links and reconstructed links cannot pass.

create or replace function private.is_direct_creator_source(
  source_platform text,
  source_url text,
  source_post_id text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    source_url ~* '^https://'
    and source_url !~* '^https://(www\.)?360dep\.vn(/|$)'
    and nullif(btrim(source_post_id), '') is not null
    and (
      lower(source_platform) not like '%tiktok%'
      or (
        source_url ~* '^https://(www\.)?tiktok\.com/@[^/]+/(video|photo)/[0-9]+/?$'
        and source_post_id = coalesce(
          substring(source_url from '/video/([0-9]+)'),
          substring(source_url from '/photo/([0-9]+)')
        )
      )
    );
$$;

revoke execute on function private.is_direct_creator_source(text, text, text) from public;
grant execute on function private.is_direct_creator_source(text, text, text) to anon, authenticated, service_role;

update public.creator_evidence_items
set status = 'rejected'
where status = 'published'
  and not private.is_direct_creator_source(source_platform, source_url, source_post_id);

update public.creator_product_events
set verification_status = 'rejected', verified_by = null, verified_at = null
where verification_status = 'verified'
  and not private.is_direct_creator_source(source_platform, source_url, source_post_id);

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
      and private.is_direct_creator_source(source_platform, source_url, source_post_id)
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
      and private.is_direct_creator_source(source_platform, source_url, source_post_id)
      and lower(source_platform) not like '%seed%'
      and lower(source_platform) not like '%internal%'
      and jsonb_array_length(evidence_spans) > 0
    )
  );

create or replace function private.is_public_creator_evidence(
  target_evidence_id text,
  target_creator_id text,
  target_source_url text,
  target_source_post_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.creator_evidence_items evidence
    where evidence.id = target_evidence_id
      and evidence.creator_id = target_creator_id
      and evidence.source_url = target_source_url
      and evidence.source_post_id = target_source_post_id
      and evidence.status = 'published'
      and evidence.reviewed_by is not null
      and evidence.reviewed_at is not null
      and evidence.requires_human_review = false
      and evidence.confidence_score >= 90
      and private.is_direct_creator_source(evidence.source_platform, evidence.source_url, evidence.source_post_id)
      and jsonb_array_length(evidence.evidence_spans) > 0
  );
$$;

revoke execute on function private.is_public_creator_evidence(text, text, text, text) from public;
grant execute on function private.is_public_creator_evidence(text, text, text, text) to anon, authenticated, service_role;

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
    and private.is_direct_creator_source(source_platform, source_url, source_post_id)
    and lower(source_platform) not like '%seed%'
    and lower(source_platform) not like '%internal%'
    and jsonb_array_length(evidence_spans) > 0
    and (valid_until is null or valid_until > now())
    and private.is_public_creator_evidence(evidence_id, creator_id, source_url, source_post_id)
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
      where event.id = creator_product_states.last_event_id
        and event.verification_status = 'verified'
        and event.verified_by is not null
        and event.verified_at is not null
        and event.exact_sku_verified
        and event.confidence_score >= 90
        and private.is_direct_creator_source(event.source_platform, event.source_url, event.source_post_id)
        and jsonb_array_length(event.evidence_spans) > 0
        and private.is_public_creator_evidence(event.evidence_id, event.creator_id, event.source_url, event.source_post_id)
        and (event.valid_until is null or event.valid_until > now())
    )
  )
  or (select public.is_admin())
);

revoke all on function private.is_public_creator_evidence(text) from public, anon, authenticated, service_role;
drop function private.is_public_creator_evidence(text);

notify pgrst, 'reload schema';
