update public.kols as creator
set handle = snapshot.handle,
    followers = snapshot.followers_label,
    tiktok_profile_url = snapshot.profile_url,
    tiktok_followers = snapshot.follower_count,
    tiktok_last_post_at = snapshot.last_post_at,
    tiktok_audited_at = '2026-07-18T12:17:00Z'::timestamptz
from (values
  ('2', '@goc.cua.ru', '976.4K', 'https://www.tiktok.com/@goc.cua.ru', 976384::bigint, '2026-07-13T04:06:04Z'::timestamptz),
  ('4', '@justvuduy16', '1.2M', 'https://www.tiktok.com/@justvuduy16', 1219413::bigint, '2026-07-18T11:44:41Z'::timestamptz),
  ('34', '@bbskincare1', '1.2M', 'https://www.tiktok.com/@bbskincare1', 1170571::bigint, '2026-07-18T11:18:35Z'::timestamptz),
  ('37', '@kimchungphan20', '2.1M', 'https://www.tiktok.com/@kimchungphan20', 2143600::bigint, '2026-07-13T10:42:51Z'::timestamptz),
  ('50', '@chouchinchan', '615.6K', 'https://www.tiktok.com/@chouchinchan', 615594::bigint, '2026-07-18T05:28:18Z'::timestamptz),
  ('52', '@skincaredungcach.byson', '625.5K', 'https://www.tiktok.com/@skincaredungcach.byson', 625486::bigint, '2026-07-17T11:55:42Z'::timestamptz),
  ('55', '@unofficiallykyky', '361.2K', 'https://www.tiktok.com/@unofficiallykyky', 361150::bigint, '2026-07-13T12:36:24Z'::timestamptz),
  ('56', '@hoangxxiv', '453.8K', 'https://www.tiktok.com/@hoangxxiv', 453786::bigint, '2026-07-16T13:07:42Z'::timestamptz),
  ('71', '@bacsi.hieu.official', '287.8K', 'https://www.tiktok.com/@bacsi.hieu.official', 287819::bigint, '2026-07-18T11:30:00Z'::timestamptz),
  ('87', '@tomskincare', '629.1K', 'https://www.tiktok.com/@tomskincare', 629085::bigint, '2026-07-17T15:21:57Z'::timestamptz)
) as snapshot(id, handle, followers_label, profile_url, follower_count, last_post_at)
where creator.id = snapshot.id;
