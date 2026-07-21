-- Catalogue-first metadata is additive so older app builds can keep reading the
-- same records while the public catalogue migrates to explicit mappings.
alter table if exists public.radar_products
  add column if not exists catalogue_slugs text[] not null default '{}',
  add column if not exists condition_tags text[] not null default '{}',
  add column if not exists audience_tags text[] not null default '{}',
  add column if not exists safety_flags text[] not null default '{}',
  add column if not exists catalogue_mapping_status text not null default 'unmapped';

do $$
begin
  alter table public.radar_products
    add constraint radar_products_catalogue_mapping_status_check
    check (catalogue_mapping_status in ('mapped', 'unmapped', 'needs_review'));
exception when duplicate_object then null;
end $$;

-- Only structured category keys and structured concern tags participate in the
-- backfill. Description/name keyword matching is intentionally excluded.
update public.radar_products
set catalogue_slugs = case category_key
  when 'skincare' then array['da-mat', 'product-radar']::text[]
  when 'haircare' then array['toc-da-dau', 'product-radar']::text[]
  when 'makeup' then array['makeup', 'product-radar']::text[]
  when 'fragrance' then array['mui-huong', 'product-radar']::text[]
  when 'bodycare' then array['bodycare', 'product-radar']::text[]
  when 'beauty_tools_tech' then array['beauty-tech', 'product-radar']::text[]
  when 'clinic_treatment' then array['clinic-treatment', 'product-radar']::text[]
  when 'nails_lash_brow' then array['nails-mi-long-may', 'product-radar']::text[]
  when 'men_grooming' then array['nam-gioi', 'product-radar']::text[]
  else '{}'::text[]
end,
catalogue_mapping_status = case
  when category_key in ('skincare', 'haircare', 'makeup', 'fragrance', 'bodycare', 'beauty_tools_tech', 'clinic_treatment', 'nails_lash_brow', 'men_grooming') then 'mapped'
  else 'unmapped'
end;

update public.radar_products
set catalogue_slugs = array_append(catalogue_slugs, 'tri-mun')
where category_key = 'skincare'
  and not ('tri-mun' = any(catalogue_slugs))
  and exists (
    select 1 from unnest(coalesce(condition_tags, '{}') || coalesce(concern_tags, '{}')) tag
    where lower(tag) = any(array['mụn', 'trị mụn', 'mụn ẩn', 'mụn viêm', 'mụn nội tiết', 'bít tắc', 'acne'])
  );

update public.radar_products
set catalogue_slugs = array_append(catalogue_slugs, 'sang-da-chong-nang')
where category_key = 'skincare'
  and not ('sang-da-chong-nang' = any(catalogue_slugs))
  and exists (
    select 1 from unnest(coalesce(condition_tags, '{}') || coalesce(concern_tags, '{}')) tag
    where lower(tag) = any(array['sáng da', 'đều màu', 'thâm mụn', 'pih', 'nám', 'tàn nhang', 'chống nắng'])
  );

alter table if exists public.posts
  add column if not exists hub_slug text,
  add column if not exists intent text,
  add column if not exists research_stage text,
  add column if not exists condition_slugs text[] not null default '{}',
  add column if not exists next_article_slugs text[] not null default '{}',
  add column if not exists medical_disclaimer_level text not null default 'none',
  add column if not exists content_format text;

create index if not exists radar_products_catalogue_slugs_gin
  on public.radar_products using gin (catalogue_slugs);
create index if not exists posts_hub_slug_idx on public.posts (hub_slug);
