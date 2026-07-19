-- Keep the audio-first pilot roster aligned with the verified TikTok handles.
-- Accounts remain inactive so only the explicit private batch worker collects.

update public.creator_accounts
set profile_url = 'https://www.tiktok.com/@goc.cua.ru',
    active = false,
    updated_at = now()
where creator_id = '2' and lower(platform) like '%tiktok%';

insert into public.creator_accounts (
  creator_id, platform, profile_url, priority_tier, crawl_interval_minutes, active
) values
  ('101', 'TikTok', 'https://www.tiktok.com/@emlyreview', 'a', 1440, false),
  ('102', 'TikTok', 'https://www.tiktok.com/@ciaramakeup2003', 'a', 1440, false)
on conflict (platform, profile_url) do update
set creator_id = excluded.creator_id,
    priority_tier = excluded.priority_tier,
    active = false,
    updated_at = now();
