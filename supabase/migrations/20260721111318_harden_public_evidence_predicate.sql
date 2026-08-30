-- Keep the RLS helper out of PostgREST's exposed public schema. Anonymous
-- readers need EXECUTE for policy evaluation, but must not be able to call the
-- SECURITY DEFINER helper as a public RPC endpoint.

create or replace function private.is_public_creator_evidence(target_evidence_id text)
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
      and evidence.status = 'published'
      and evidence.reviewed_by is not null
      and evidence.reviewed_at is not null
      and evidence.requires_human_review = false
      and evidence.confidence_score >= 90
      and evidence.source_url ~* '^https://'
      and evidence.source_url !~* '^https://(www\.)?360dep\.vn(/|$)'
      and jsonb_array_length(evidence.evidence_spans) > 0
  );
$$;

-- Private routines are deny-by-default. Schema USAGE alone cannot expose
-- tables or any other function; only this predicate is executable by clients.
revoke execute on all functions in schema private from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public;
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.is_public_creator_evidence(text) to anon, authenticated, service_role;

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
    and private.is_public_creator_evidence(evidence_id)
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
        and jsonb_array_length(event.evidence_spans) > 0
        and private.is_public_creator_evidence(event.evidence_id)
        and (event.valid_until is null or event.valid_until > now())
    )
  )
  or (select public.is_admin())
);

revoke all on function public.is_public_creator_evidence(text) from public, anon, authenticated, service_role;
drop function public.is_public_creator_evidence(text);

notify pgrst, 'reload schema';
