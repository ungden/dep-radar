alter table public.kols
  add column if not exists directory_status text not null default 'legacy',
  add column if not exists tiktok_profile_url text,
  add column if not exists tiktok_followers bigint,
  add column if not exists tiktok_last_post_at timestamptz,
  add column if not exists tiktok_audited_at timestamptz;

alter table public.kols
  drop constraint if exists kols_directory_status_check;

alter table public.kols
  add constraint kols_directory_status_check
  check (directory_status in ('active', 'watchlist', 'legacy', 'excluded'));

update public.kols
set directory_status = 'legacy';

update public.kols
set directory_status = 'active',
    tiktok_audited_at = '2026-07-18T12:17:00Z'::timestamptz
where id = any (array[
  '1','2','4','7','10','21','23','26','28','31','33','34','37','39','41','42',
  '50','51','52','53','55','56','63','71','74','78','79','81','86','87','89','98'
]::text[]);

update public.kols
set directory_status = 'watchlist',
    tiktok_audited_at = '2026-07-18T12:17:00Z'::timestamptz
where id = any (array[
  '17','36','46','49','59','62','64','65','66','68','70','73','77','92','94','95'
]::text[]);

update public.kols
set directory_status = 'excluded',
    tiktok_audited_at = '2026-07-18T12:17:00Z'::timestamptz
where id = any (array['3','13','16']::text[]);

insert into public.kols (
  id, name, avatar, cover, platform, handle, followers, trustscore,
  categories, recentreview, verified, directory_status, tiktok_profile_url,
  tiktok_followers, tiktok_last_post_at, tiktok_audited_at
)
values
  (
    '101', 'Emlyy', '', '', 'Tiktok', '@emlyreview', '563.4K', 82,
    array['Skincare','Makeup','Haircare'],
    'Skincare, makeup test và rating sản phẩm', true, 'active',
    'https://www.tiktok.com/@emlyreview', 563431, '2026-07-17T00:00:00Z', '2026-07-18T12:17:00Z'
  ),
  (
    '102', 'Hà Giang', '', '', 'Tiktok', '@ciaramakeup2003', '1.3M', 88,
    array['Makeup'],
    'Makeup tutorial, cushion và makeup look', true, 'active',
    'https://www.tiktok.com/@ciaramakeup2003', 1303955, '2026-07-18T00:00:00Z', '2026-07-18T12:17:00Z'
  ),
  (
    '103', 'Hoàng Minh Ngọc', '', '', 'Tiktok', '@hoangminhngoc21', '1.1M', 86,
    array['Makeup','Skincare'],
    'Beauty education và kỹ thuật makeup', true, 'active',
    'https://www.tiktok.com/@hoangminhngoc21', 1113334, '2026-07-17T00:00:00Z', '2026-07-18T12:17:00Z'
  ),
  (
    '104', 'Quỳnh Alee', '', '', 'Tiktok', '@quynhalee', '5M', 92,
    array['Skincare','Haircare','Makeup','Lifestyle'],
    'Haircare, skincare và beauty campaign', true, 'active',
    'https://www.tiktok.com/@quynhalee', 5006384, '2026-07-17T00:00:00Z', '2026-07-18T12:17:00Z'
  )
on conflict (id) do update
set name = excluded.name,
    platform = excluded.platform,
    handle = excluded.handle,
    followers = excluded.followers,
    trustscore = excluded.trustscore,
    categories = excluded.categories,
    recentreview = excluded.recentreview,
    verified = excluded.verified,
    directory_status = excluded.directory_status,
    tiktok_profile_url = excluded.tiktok_profile_url,
    tiktok_followers = excluded.tiktok_followers,
    tiktok_last_post_at = excluded.tiktok_last_post_at,
    tiktok_audited_at = excluded.tiktok_audited_at;

create index if not exists idx_kols_directory_status_trustscore
  on public.kols(directory_status, trustscore desc);
