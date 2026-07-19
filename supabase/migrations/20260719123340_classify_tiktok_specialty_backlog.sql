-- Complete user-audited handles that are outside the current skincare batch.
-- Fragrance creators remain watchlist and are collected only in a later wave.

update public.kols
set handle = '@drkhonghanhnguyen',
    tiktok_profile_url = 'https://www.tiktok.com/@drkhonghanhnguyen'
where id = '74';

update public.kols
set handle = '@kientran5292',
    tiktok_profile_url = 'https://www.tiktok.com/@kientran5292',
    directory_status = 'watchlist'
where id = '96';

update public.kols
set handle = '@nuochoajenna1038',
    tiktok_profile_url = 'https://www.tiktok.com/@nuochoajenna1038',
    directory_status = 'watchlist'
where id = '99';
