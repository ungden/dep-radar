-- Evidence Radar follow-up: cover foreign keys and avoid overlapping permissive
-- SELECT policies while preserving admin access to unpublished evidence.

create index if not exists source_posts_creator_account_idx
  on public.source_posts(creator_account_id);

create index if not exists creator_evidence_items_reviewed_by_idx
  on public.creator_evidence_items(reviewed_by);

create index if not exists creator_product_events_verified_by_idx
  on public.creator_product_events(verified_by);

create index if not exists creator_product_states_last_event_idx
  on public.creator_product_states(last_event_id);

create index if not exists evidence_audit_log_actor_idx
  on public.evidence_audit_log(actor_id);

create index if not exists evidence_audit_log_event_idx
  on public.evidence_audit_log(event_id);

-- An ALL policy already covers SELECT for admins on these two tables.
drop policy if exists "Admins can read creator accounts"
  on public.creator_accounts;

drop policy if exists "Admins can read creator evidence"
  on public.creator_evidence_items;

-- Keep a single SELECT policy for both public verified rows and admin review rows.
-- Write privileges remain admin-only and are split by command so they do not also
-- contribute a second permissive SELECT policy.
drop policy if exists "Admins can manage creator_product_events"
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
    and coalesce(
      confidence_score,
      case confidence when 'high' then 92 when 'medium' then 75 else 50 end
    ) >= 70
    and source_url is not null
  )
  or public.is_admin()
);

create policy "Admins can insert creator_product_events"
on public.creator_product_events
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update creator_product_events"
on public.creator_product_events
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete creator_product_events"
on public.creator_product_events
for delete
to authenticated
using (public.is_admin());
