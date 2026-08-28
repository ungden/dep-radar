-- The linked project predates the local product-research metadata migration.
-- Content Factory may only use a product source when these explicit provenance
-- fields exist; affiliate_url is never treated as a research source.
alter table public.radar_products
  add column if not exists source_label text,
  add column if not exists source_url text,
  add column if not exists source_type text,
  add column if not exists source_last_verified_at timestamptz;

do $$
begin
  alter table public.radar_products add constraint radar_products_source_type_check
    check (source_type is null or source_type in ('official', 'brand-retail', 'retailer'));
exception when duplicate_object then null;
end $$;

create index if not exists radar_products_source_ready_idx
  on public.radar_products(status, source_last_verified_at desc)
  where source_url is not null;
