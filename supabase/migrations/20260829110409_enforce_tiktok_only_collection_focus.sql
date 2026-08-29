-- Temporary source focus: TikTok KOL/KOC only. Keep non-TikTok records for
-- audit, but make them impossible to collect or schedule into new content.
update public.creator_accounts
set active = false,
    collection_mode = 'disabled',
    updated_at = now()
where lower(platform) in ('youtube', 'facebook', 'instagram')
  and (active = true or collection_mode <> 'disabled');

do $$
begin
  alter table public.creator_accounts add constraint creator_accounts_tiktok_webhook_focus_check
    check (not active or (lower(platform) like '%tiktok%' and collection_mode = 'webhook'));
exception when duplicate_object then null;
end $$;

-- Existing non-TikTok social signals remain inspectable but cannot be planned.
update public.content_signals
set status = 'rejected',
    payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
      'policy', jsonb_build_object(
        'reason', 'social_source_paused_tiktok_focus',
        'applied_at', now()
      )
    )
where lower(source_type) in ('youtube', 'facebook', 'instagram')
  and status in ('pending', 'selected');

-- A job created before the focus change must fail closed before generation.
update public.content_jobs as job
set status = 'policy_blocked',
    policy_reasons = array(select distinct reason from unnest(job.policy_reasons || array['social_source_paused_tiktok_focus']) as reason),
    last_error = 'Social source paused while TikTok KOL/KOC focus is active.',
    lease_until = null,
    leased_by = null
from public.content_signals as signal
where signal.id = job.signal_id
  and lower(signal.source_type) in ('youtube', 'facebook', 'instagram')
  and job.status in ('queued', 'researching', 'drafting', 'verifying', 'publishable');
