-- User-audited TikTok handles for the skincare/beauty audio-first batch.
-- Changed/new rows remain watchlist until current public stats and content are
-- audited. Fragrance-only creators are intentionally not included here.

update public.kols
set directory_status = 'excluded'
where id = any(array['59','65','66','82']::text[]);

update public.creator_accounts
set active = false, updated_at = now()
where creator_id = any(array['59','65','66','82']::text[]);

with roster(id, handle, profile_url) as (
  values
    ('12', '@tyle1994', 'https://www.tiktok.com/@tyle1994'),
    ('15', '@norinpham_m4', 'https://www.tiktok.com/@norinpham_m4'),
    ('22', '@quynhitraan', 'https://www.tiktok.com/@quynhitraan'),
    ('35', '@vanmiu_beauty', 'https://www.tiktok.com/@vanmiu_beauty'),
    ('58', '@anphuongtruong', 'https://www.tiktok.com/@anphuongtruong'),
    ('83', '@bacsidiemdalieu', 'https://www.tiktok.com/@bacsidiemdalieu'),
    ('84', '@bshangdalieu', 'https://www.tiktok.com/@bshangdalieu'),
    ('88', '@misoamisoa', 'https://www.tiktok.com/@misoamisoa')
)
update public.kols k
set platform = 'Tiktok',
    handle = roster.handle,
    tiktok_profile_url = roster.profile_url,
    tiktok_followers = null,
    tiktok_last_post_at = null,
    tiktok_audited_at = null,
    directory_status = 'watchlist',
    verified = false
from roster
where k.id = roster.id;

insert into public.kols (
  id, name, avatar, cover, platform, handle, followers, trustscore,
  categories, recentreview, verified, directory_status, tiktok_profile_url
) values
  ('105', 'Lương Thục Hiền', '', '', 'Tiktok', '@luongthuchien6868', 'Đang audit', 0, array['Skincare','Makeup'], 'Beauty và skincare', false, 'watchlist', 'https://www.tiktok.com/@luongthuchien6868'),
  ('106', 'Sĩ Thanh', '', '', 'Tiktok', '@sithanh', 'Đang audit', 0, array['Skincare','Makeup'], 'Beauty, skincare và son', false, 'watchlist', 'https://www.tiktok.com/@sithanh'),
  ('107', 'Jolie Bận Xinh', '', '', 'Tiktok', '@joliehtt25', 'Đang audit', 0, array['Skincare','Makeup'], 'Beauty và skincare', false, 'watchlist', 'https://www.tiktok.com/@joliehtt25'),
  ('108', 'Dr Chun', '', '', 'Tiktok', '@drchunmd', 'Đang audit', 0, array['Skincare','Dermatology'], 'Kiến thức da liễu và skincare', false, 'watchlist', 'https://www.tiktok.com/@drchunmd'),
  ('109', 'Xoài Non', '', '', 'Tiktok', '@xoainon.official', 'Đang audit', 0, array['Skincare','Makeup'], 'Beauty, skincare và son', false, 'watchlist', 'https://www.tiktok.com/@xoainon.official'),
  ('110', 'Gigi Ngọc Ngân', '', '', 'Tiktok', '@gigi.ngocngan', 'Đang audit', 0, array['Skincare','Makeup'], 'Beauty và skincare', false, 'watchlist', 'https://www.tiktok.com/@gigi.ngocngan'),
  ('111', 'Kê (Skinlosophy)', '', '', 'Tiktok', '@ketalk', 'Đang audit', 0, array['Skincare'], 'Skincare education và công thức sản phẩm', false, 'watchlist', 'https://www.tiktok.com/@ketalk'),
  ('112', 'Doãn Hải My', '', '', 'Tiktok', '@_doanhaimy', 'Đang audit', 0, array['Skincare','Makeup'], 'Beauty, skincare và son', false, 'watchlist', 'https://www.tiktok.com/@_doanhaimy')
on conflict (id) do update
set name = excluded.name,
    platform = excluded.platform,
    handle = excluded.handle,
    categories = excluded.categories,
    recentreview = excluded.recentreview,
    verified = false,
    directory_status = 'watchlist',
    tiktok_profile_url = excluded.tiktok_profile_url,
    tiktok_followers = null,
    tiktok_last_post_at = null,
    tiktok_audited_at = null;

with roster(creator_id, profile_url) as (
  values
    ('12', 'https://www.tiktok.com/@tyle1994'),
    ('15', 'https://www.tiktok.com/@norinpham_m4'),
    ('22', 'https://www.tiktok.com/@quynhitraan'),
    ('35', 'https://www.tiktok.com/@vanmiu_beauty'),
    ('58', 'https://www.tiktok.com/@anphuongtruong'),
    ('83', 'https://www.tiktok.com/@bacsidiemdalieu'),
    ('84', 'https://www.tiktok.com/@bshangdalieu'),
    ('88', 'https://www.tiktok.com/@misoamisoa'),
    ('74', 'https://www.tiktok.com/@drkhonghanhnguyen')
)
update public.creator_accounts ca
set profile_url = roster.profile_url,
    platform = 'TikTok',
    priority_tier = 'a',
    active = false,
    updated_at = now()
from roster
where ca.creator_id = roster.creator_id
  and lower(ca.platform) like '%tiktok%';

with roster(creator_id, profile_url) as (
  values
    ('12', 'https://www.tiktok.com/@tyle1994'),
    ('15', 'https://www.tiktok.com/@norinpham_m4'),
    ('22', 'https://www.tiktok.com/@quynhitraan'),
    ('35', 'https://www.tiktok.com/@vanmiu_beauty'),
    ('58', 'https://www.tiktok.com/@anphuongtruong'),
    ('83', 'https://www.tiktok.com/@bacsidiemdalieu'),
    ('84', 'https://www.tiktok.com/@bshangdalieu'),
    ('88', 'https://www.tiktok.com/@misoamisoa'),
    ('105', 'https://www.tiktok.com/@luongthuchien6868'),
    ('106', 'https://www.tiktok.com/@sithanh'),
    ('107', 'https://www.tiktok.com/@joliehtt25'),
    ('108', 'https://www.tiktok.com/@drchunmd'),
    ('109', 'https://www.tiktok.com/@xoainon.official'),
    ('110', 'https://www.tiktok.com/@gigi.ngocngan'),
    ('111', 'https://www.tiktok.com/@ketalk'),
    ('112', 'https://www.tiktok.com/@_doanhaimy'),
    ('74', 'https://www.tiktok.com/@drkhonghanhnguyen')
)
insert into public.creator_accounts (
  creator_id, platform, profile_url, priority_tier, crawl_interval_minutes, active
)
select creator_id, 'TikTok', profile_url, 'a', 1440, false
from roster
on conflict (platform, profile_url) do update
set creator_id = excluded.creator_id,
    priority_tier = 'a',
    active = false,
    updated_at = now();
