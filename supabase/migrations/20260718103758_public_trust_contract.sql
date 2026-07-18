-- Public trust contract: only audited offers and external creator evidence may
-- cross the anonymous API boundary. Raw and rejected rows remain available to
-- admins for remediation.

alter table public.product_offers
  add column if not exists verification_status text not null default 'pending',
  add column if not exists match_status text not null default 'unreviewed',
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists verified_at timestamptz,
  add column if not exists is_active boolean not null default false,
  add column if not exists valid_until timestamptz;

do $$
begin
  alter table public.product_offers
    add constraint product_offers_verification_status_check
    check (verification_status in ('pending', 'verified', 'rejected'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.product_offers
    add constraint product_offers_match_status_check
    check (match_status in ('unreviewed', 'exact', 'mismatch'));
exception when duplicate_object then null;
end $$;

-- Existing rows predate the audit metadata contract and must not remain public.
update public.product_offers
set
  verification_status = 'rejected',
  match_status = 'unreviewed',
  is_active = false,
  verified_by = null,
  verified_at = null
where verified_by is null
   or verified_at is null
   or affiliate_url is null
   or affiliate_url !~* '^https://'
   or affiliate_url ~* '(/search|search\\?|keyword=|[?&](q|query)=)';

alter table public.product_offers
  drop constraint if exists product_offers_verified_contract_check;

alter table public.product_offers
  add constraint product_offers_verified_contract_check check (
    verification_status <> 'verified'
    or (
      match_status = 'exact'
      and is_active
      and verified_by is not null
      and verified_at is not null
      and affiliate_url ~* '^https://'
      and affiliate_url !~* '(/search|search\\?|keyword=|[?&](q|query)=)'
      and last_checked_at >= verified_at - interval '1 minute'
    )
  );

create index if not exists product_offers_public_quality_idx
  on public.product_offers(product_id, is_preferred desc, last_checked_at desc)
  where verification_status = 'verified' and match_status = 'exact' and is_active;

drop policy if exists "Allow public read-only access on product_offers"
  on public.product_offers;
drop policy if exists "Public verified or admin product offers"
  on public.product_offers;

create policy "Public verified or admin product offers"
on public.product_offers
for select
to anon, authenticated
using (
  (
    verification_status = 'verified'
    and match_status = 'exact'
    and is_active
    and verified_by is not null
    and verified_at is not null
    and affiliate_url ~* '^https://'
    and affiliate_url !~* '(/search|search\\?|keyword=|[?&](q|query)=)'
    and last_checked_at >= now() - interval '30 days'
    and (valid_until is null or valid_until > now())
  )
  or public.is_admin()
);

-- The old default made newly inserted evidence public before review.
alter table public.creator_product_events
  alter column verification_status set default 'pending';

update public.creator_product_events
set
  verification_status = 'rejected',
  verified_by = null,
  verified_at = null
where verification_status = 'verified'
  and (
    evidence_id is null
    or verified_by is null
    or verified_at is null
    or source_url is null
    or source_url !~* '^https://'
    or source_url ~* '^https://(www\\.)?360dep\\.vn(/|$)'
    or lower(source_platform) like '%seed%'
    or lower(source_platform) like '%internal%'
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
      and source_url ~* '^https://'
      and source_url !~* '^https://(www\\.)?360dep\\.vn(/|$)'
      and lower(source_platform) not like '%seed%'
      and lower(source_platform) not like '%internal%'
    )
  );

drop policy if exists "Public verified or admin creator events"
  on public.creator_product_events;
drop policy if exists "Allow public verified creator events"
  on public.creator_product_events;

create policy "Public verified or admin creator events"
on public.creator_product_events
for select
to anon, authenticated
using (
  (
    verification_status = 'verified'
    and verified_by is not null
    and verified_at is not null
    and evidence_id is not null
    and coalesce(
      confidence_score,
      case confidence when 'high' then 92 when 'medium' then 75 else 50 end
    ) >= 70
    and source_url ~* '^https://'
    and source_url !~* '^https://(www\\.)?360dep\\.vn(/|$)'
    and lower(source_platform) not like '%seed%'
    and lower(source_platform) not like '%internal%'
    and (valid_until is null or valid_until > now())
  )
  or public.is_admin()
);

drop policy if exists "Public can read verified creator product states"
  on public.creator_product_states;

create policy "Public can read audited creator product states"
on public.creator_product_states
for select
to anon, authenticated
using (
  (
    state_confidence >= 70
    and exists (
      select 1
      from public.creator_product_events event
      where event.id = creator_product_states.last_event_id
        and event.verification_status = 'verified'
        and event.verified_by is not null
        and event.verified_at is not null
        and event.evidence_id is not null
        and event.source_url ~* '^https://'
        and event.source_url !~* '^https://(www\\.)?360dep\\.vn(/|$)'
        and lower(event.source_platform) not like '%seed%'
        and lower(event.source_platform) not like '%internal%'
        and (event.valid_until is null or event.valid_until > now())
    )
  )
  or public.is_admin()
);

-- Force a final cleanup in case any state predates the recompute trigger.
delete from public.creator_product_states state
where not exists (
  select 1
  from public.creator_product_events event
  where event.creator_id = state.creator_id
    and event.product_id = state.product_id
    and event.verification_status = 'verified'
    and event.verified_by is not null
    and event.verified_at is not null
    and event.evidence_id is not null
    and event.source_url ~* '^https://'
    and event.source_url !~* '^https://(www\\.)?360dep\\.vn(/|$)'
    and lower(event.source_platform) not like '%seed%'
    and lower(event.source_platform) not like '%internal%'
    and (event.valid_until is null or event.valid_until > now())
);

-- Legacy editorial scores are not community ratings. Keep the columns for
-- admin compatibility, but clear public-looking values when no approved review
-- exists. The app derives its public summary from approved user_ratings only.
update public.radar_products product
set rating = null, reviews = 0
where not exists (
  select 1
  from public.user_ratings review
  where review.product_id = product.id
    and review.status = 'approved'
);
