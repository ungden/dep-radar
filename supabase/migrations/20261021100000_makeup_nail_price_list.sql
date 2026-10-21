-- Makeup & Nail: one national price list (21/10/2026), three levels Cơ bản /
-- Chuyên nghiệp / Master, from the owner's Nha Trang table and public price
-- lists in Hà Nội, TP.HCM and Đà Nẵng (docs/KHAO_SAT_GIA_MAKEUP_NAIL_2026-10.md).
-- lib/catalog.ts is the source; the upserts in
-- section 3 come from `npx tsx scripts/gen-catalog-sql.ts --categories=nail,makeup`.
--
-- New in the catalogue shape:
-- * a single price every partner charges ("Giá chung": phá gel, phá móng úp,
--   French);
-- * prices on the 1.000đ step (nail art per finger or stone, from 3k);
-- * add-ons (service_templates.addon_only): nail art per finger and an
--   elaborate hairdo, booked only on top of a main service.
-- Partners keep the level they had picked (Cơ bản stays Cơ bản) on the new
-- prices. Bookings and open requests keep the scope and price they were made at.

-- 1. Shape ---------------------------------------------------------------------
alter table public.service_variants
  drop constraint service_variants_price_tiers_check,
  drop constraint service_variants_min_price_check,
  drop constraint service_variants_max_price_check,
  drop constraint service_variants_suggested_price_check;
alter table public.service_variants
  add constraint service_variants_price_tiers_check check (
    cardinality(price_tiers) in (1, 3) and price_tiers[1] > 0
    and (cardinality(price_tiers) = 1 or (price_tiers[1] < price_tiers[2] and price_tiers[2] < price_tiers[3]))
    and price_tiers[1] % 1000 = 0 and coalesce(price_tiers[2], 0) % 1000 = 0 and coalesce(price_tiers[3], 0) % 1000 = 0
    and min_price = price_tiers[1] and max_price = price_tiers[cardinality(price_tiers)]
    and suggested_price = price_tiers[(cardinality(price_tiers) + 1) / 2]),
  add constraint service_variants_min_price_check check (min_price > 0 and min_price % 1000 = 0),
  add constraint service_variants_max_price_check check (max_price % 1000 = 0),
  add constraint service_variants_suggested_price_check check (suggested_price % 1000 = 0);
alter table public.pro_service_prices drop constraint pro_service_prices_price_check;
alter table public.pro_service_prices add constraint pro_service_prices_price_check check (price % 1000 = 0);

alter table public.service_templates add column addon_only boolean not null default false;

-- A single price has no level to name.
create or replace function partner_private.service_contract(p_template text, p_variant text, p_quantity int, p_unit int, p_minutes int)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'version', t.catalog_version, 'serviceName', t.name, 'variantLabel', v.label,
    'category', t.category, 'includes', t.includes,
    'deliverable', coalesce(v.deliverable, t.deliverable), 'deliveryDays', t.delivery_days,
    'revisions', v.revisions, 'tier', array_position(v.price_tiers, p_unit),
    'tierLabel', case when cardinality(v.price_tiers) = 1 then 'Giá chung'
      else (array['Cơ bản','Chuyên nghiệp','Master'])[array_position(v.price_tiers, p_unit)] end,
    'unitPrice', p_unit, 'quantity', p_quantity, 'durationMin', p_minutes,
    'sessions', v.sessions, 'followupDays', v.followup_days)
  from public.service_templates t join public.service_variants v on v.template_id = t.id
  where t.id = p_template and v.id = p_variant
$$;
revoke all on function partner_private.service_contract(text,text,int,int,int) from public, anon, authenticated;

-- 2. The level each partner picked, before the prices change ------------------
create table partner_private.price_list_levels as
  select p.pro_id, p.template_id, p.variant_id, p.price, array_position(v.price_tiers, p.price) as lvl
  from public.pro_service_prices p
  join public.service_variants v on v.template_id = p.template_id and v.id = p.variant_id
  join public.service_templates t on t.id = p.template_id
  where t.category in ('nail', 'makeup');

-- 3. Catalogue -----------------------------------------------------------------
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-gel', 'nail', 'Sơn gel trơn', 'Cắt da, tạo form và sơn gel một màu.', array['Cắt da, tạo form móng', 'Sơn gel 1 màu', 'Dưỡng viền móng']::text[], false, false, null, null, false, false, true, 0, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-gel', 'hand', 'Tay', 45, 90000, 180000, 130000, array[90000, 130000, 180000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-gel', 'hand-foot', 'Tay + chân', 90, 170000, 340000, 240000, array[170000, 240000, 340000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-extension', 'nail', 'Up móng / nối móng', 'Up móng giả bằng keo hoặc gel, hoặc đắp dual form gel gôm, kèm sơn gel một màu.', array['Tạo form móng thật', 'Up hoặc đắp móng', 'Sơn gel 1 màu']::text[], false, false, null, null, false, false, true, 1, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-extension', 'tips', 'Up móng bằng keo + sơn trơn 1 màu', 75, 140000, 240000, 180000, array[140000, 180000, 240000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-extension', 'gelx', 'Up móng gel + sơn trơn 1 màu', 90, 170000, 290000, 220000, array[170000, 220000, 290000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-extension', 'builder', 'Dual form + gel gôm', 120, 220000, 320000, 260000, array[220000, 260000, 320000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-removal', 'nail', 'Phá gel & dưỡng móng', 'Phá gel, móng úp hoặc móng đắp an toàn, không làm mỏng móng.', array['Phá bằng dung dịch chuyên dụng', 'Dũa lại form', 'Dưỡng móng']::text[], false, false, null, null, false, false, true, 2, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-removal', 'remove', 'Phá gel', 20, 40000, 40000, 40000, array[40000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-removal', 'remove-tips', 'Phá móng úp / móng đắp', 30, 60000, 60000, 60000, array[60000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-removal', 'remove-care', 'Phá gel + dưỡng móng', 45, 80000, 130000, 100000, array[80000, 100000, 130000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-pedicure', 'nail', 'Chăm sóc bàn chân (pedicure)', 'Ngâm chân, lấy da chết, cắt da và dưỡng gót.', array['Ngâm chân thảo mộc', 'Lấy da chết, cắt da', 'Dưỡng gót & massage chân']::text[], false, false, null, null, false, false, true, 3, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-pedicure', 'basic', 'Cơ bản', 45, 120000, 180000, 150000, array[120000, 150000, 180000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-pedicure', 'deluxe', 'Có đắp mặt nạ chân, chà gót', 75, 200000, 300000, 250000, array[200000, 250000, 300000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-manicure', 'nail', 'Cắt da, sửa form & sơn thường', 'Chăm sóc móng cơ bản cho khách không dùng gel.', array['Cắt da, sửa form móng', 'Sơn thường 1 màu', 'Dưỡng viền móng']::text[], false, false, null, null, false, false, true, 4, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-manicure', 'hand', 'Tay', 30, 60000, 100000, 80000, array[60000, 80000, 100000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-manicure', 'hand-foot', 'Tay + chân', 60, 110000, 190000, 150000, array[110000, 150000, 190000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-refill', 'nail', 'Dặm móng nối', 'Dặm phần móng mọc ra và sơn lại cho bộ móng đã up hoặc đắp.', array['Dũa, làm sạch phần móng mọc', 'Đắp bù gel', 'Sơn lại 1 màu']::text[], false, false, null, null, false, false, true, 5, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-refill', 'refill-tips', 'Dặm móng úp', 60, 90000, 140000, 110000, array[90000, 110000, 140000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-refill', 'refill', 'Dặm móng đắp / dual form', 75, 130000, 200000, 160000, array[130000, 160000, 200000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-daily', 'makeup', 'Makeup nhẹ / đi làm', 'Lớp nền mỏng, tự nhiên, phù hợp đi làm, đi học, hẹn hò.', array['Makeup tự nhiên', 'Làm tóc đơn giản', 'Mỹ phẩm của chuyên viên']::text[], false, false, null, null, false, false, true, 6, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-daily', 'single', '1 người', 45, 250000, 600000, 350000, array[250000, 350000, 600000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-party', 'makeup', 'Makeup dự tiệc', 'Makeup bền màu cho tiệc, kèm làm tóc đơn giản và mi giả.', array['Makeup bền 8 tiếng', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, false, true, 7, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-party', 'makeup', '1 người', 60, 300000, 800000, 450000, array[300000, 450000, 800000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-photo', 'makeup', 'Makeup kỷ yếu / chụp ảnh', 'Layout lên hình theo concept. Đi theo nhóm được giảm: 2 người 10%, 3 người 15%, từ 5 người 20%.', array['Layout theo concept', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, false, true, 8, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'single', '1 người', 60, 250000, 550000, 350000, array[250000, 350000, 550000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'group2', 'Nhóm 2 người, giảm 10% (giá mỗi người)', 45, 225000, 495000, 315000, array[225000, 315000, 495000], true, 2, 1, 'per_person', 2, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'group3', 'Nhóm 3–4 người, giảm 15% (giá mỗi người)', 45, 210000, 465000, 295000, array[210000, 295000, 465000], true, 4, 2, 'per_person', 3, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'group5', 'Nhóm từ 5 người, giảm 20% (giá mỗi người)', 45, 200000, 440000, 280000, array[200000, 280000, 440000], true, 10, 3, 'per_person', 5, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-bridal', 'makeup', 'Makeup cô dâu', 'Makeup và làm tóc cô dâu cho từng lễ. Nên test makeup trước để xem layout đã chọn có hợp không.', array['Makeup + làm tóc cô dâu', 'Mi giả, phụ kiện tóc cơ bản', 'Tư vấn layout theo váy, áo dài']::text[], false, false, null, null, false, false, true, 9, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'trial', 'Test makeup trước ngày cưới', 90, 600000, 1500000, 900000, array[600000, 900000, 1500000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'engagement', 'Dạm ngõ / đám hỏi', 120, 1000000, 2800000, 1600000, array[1000000, 1600000, 2800000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'wedding', 'Gia tiên / tiệc cưới', 120, 1300000, 3500000, 2000000, array[1300000, 2000000, 3500000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'two', 'Trọn gói 2 lễ: đám hỏi + tiệc cưới (2 buổi)', 120, 2300000, 6300000, 3600000, array[2300000, 3600000, 6300000], false, 1, 3, 'fixed', 1, null, 0, 2, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-takecare', 'makeup', 'Take care cô dâu (theo dâu)', 'Đi theo cô dâu sau khi đã makeup xong, lo phần phụ: dặm lại phấn, cầm đồ, hỗ trợ tạo dáng. Chính thợ makeup theo dâu cũng tính giá này.', array['Dặm lại phấn, son, chỉnh tóc', 'Cầm đồ, chỉnh váy giúp cô dâu', 'Hỗ trợ tạo dáng khi chụp']::text[], false, false, null, null, false, false, true, 10, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-takecare', 'takecare', 'Theo dâu 1 buổi (đến 4 tiếng)', 240, 300000, 800000, 500000, array[300000, 500000, 800000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-takecare', 'fullday', 'Theo dâu cả ngày', 480, 1000000, 3000000, 1800000, array[1000000, 1800000, 3000000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-family', 'makeup', 'Makeup mẹ cô dâu / họ hàng / phụ dâu', 'Makeup và làm tóc cho người nhà trong ngày cưới.', array['Makeup bền', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, false, true, 11, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-family', 'mother', 'Mẹ cô dâu / chú rể', 75, 400000, 900000, 600000, array[400000, 600000, 900000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-family', 'family', 'Họ hàng / phụ dâu (giá mỗi người)', 60, 300000, 500000, 400000, array[300000, 400000, 500000], true, 8, 1, 'per_person', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-event', 'makeup', 'Makeup sự kiện / MC / biểu diễn', 'Layout lên đèn sân khấu, lên hình livestream.', array['Makeup lên đèn, lên hình', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, false, true, 12, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-event', 'event', 'Sự kiện', 90, 450000, 1200000, 700000, array[450000, 700000, 1200000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-prewedding', 'makeup', 'Makeup chụp ảnh cưới', 'Makeup cô dâu cho buổi chụp ảnh cưới trong studio hoặc ngoại cảnh.', array['Makeup + tóc cô dâu', 'Đổi layout theo trang phục', 'Mi giả']::text[], false, false, null, null, false, false, true, 13, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-prewedding', 'studio', 'Chụp trong studio', 120, 900000, 2200000, 1300000, array[900000, 1300000, 2200000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-prewedding', 'outdoor', 'Ngoại cảnh, theo cả buổi', 300, 1200000, 3000000, 1800000, array[1200000, 1800000, 3000000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-design', 'nail', 'Nail thiết kế (tính theo ngón)', 'Mỗi ngón một kiểu nên tính theo ngón, đặt kèm sơn gel hoặc up móng.', array['Thiết kế theo mẫu khách chọn', 'Làm trên nền gel đã đặt']::text[], false, false, null, null, false, true, true, 72, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'design', 'Thiết kế (vẽ, sticker, phối màu)', 30, 10000, 40000, 20000, array[10000, 20000, 40000], true, 10, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'cat-eye', 'Mắt mèo / tráng gương', 15, 5000, 15000, 10000, array[5000, 10000, 15000], true, 10, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'ombre', 'Ombre', 20, 10000, 20000, 15000, array[10000, 15000, 20000], true, 10, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'french', 'French', 20, 10000, 10000, 10000, array[10000], true, 10, 3, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'stone', 'Đính đá (theo cỡ đá)', 20, 3000, 20000, 10000, array[3000, 10000, 20000], true, 20, 4, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', '3d', 'Vẽ nổi', 45, 15000, 50000, 30000, array[15000, 30000, 50000], true, 10, 5, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-hair-updo', 'makeup', 'Làm tóc cầu kỳ', 'Búi, tết, uốn tạo kiểu cầu kỳ thay cho tóc đơn giản đã gồm trong giá makeup. Makeup cô dâu đã gồm tóc, không tính thêm.', array['Búi, tết hoặc uốn tạo kiểu', 'Keo, kẹp tóc']::text[], false, false, null, null, false, true, true, 73, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-hair-updo', 'updo', 'Tóc cầu kỳ', 30, 100000, 250000, 150000, array[100000, 150000, 250000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;

-- 4. Options that left the catalogue -----------------------------------------
-- Their listings move to the option that replaced them, at the same level:
-- makeup + tóc (hair is now included), group kỷ yếu (now by group size), and
-- the bride's "1 lễ / cả ngày" (now per ceremony).
insert into public.pro_service_prices (pro_id, template_id, variant_id, price)
select l.pro_id, l.template_id, m.new_variant, v.price_tiers[least(coalesce(l.lvl, 2), cardinality(v.price_tiers))]
from partner_private.price_list_levels l
join (values
  ('makeup-party', 'makeup-hair', 'makeup', 1),
  ('makeup-photo', 'group', 'group2', 1), ('makeup-photo', 'group', 'group3', 1), ('makeup-photo', 'group', 'group5', 1),
  ('makeup-bridal', 'one', 'engagement', 1), ('makeup-bridal', 'one', 'wedding', 1),
  ('makeup-bridal', 'fullday', 'engagement', 2), ('makeup-bridal', 'fullday', 'wedding', 2)
) as m(template_id, old_variant, new_variant, pick) on m.template_id = l.template_id and m.old_variant = l.variant_id
join public.service_variants v on v.template_id = l.template_id and v.id = m.new_variant
order by m.pick
on conflict (pro_id, template_id, variant_id) do nothing;

-- Nail art used to be a whole service (gel + design); it is now priced per
-- finger and booked on top of one, so those listings and the cat-eye gel
-- option end: partners pick the per-finger prices themselves.
delete from public.pro_service_prices
where (template_id, variant_id) in (
  ('nail-gel', 'cat-eye'), ('nail-design', 'simple'), ('nail-design', 'stone'), ('nail-design', 'art'),
  ('makeup-party', 'makeup-hair'), ('makeup-photo', 'group'),
  ('makeup-bridal', 'one'), ('makeup-bridal', 'fullday'));
delete from public.pro_services s
where s.template_id = 'nail-design' and not exists (
  select 1 from public.pro_service_prices p where p.pro_id = s.pro_id and p.template_id = s.template_id);

-- Retired option rows go unless a booking or request still points at them.
delete from public.service_variants v
where (v.template_id, v.id) in (
  ('nail-gel', 'cat-eye'), ('nail-design', 'simple'), ('nail-design', 'art'),
  ('makeup-party', 'makeup-hair'), ('makeup-photo', 'group'),
  ('makeup-bridal', 'one'), ('makeup-bridal', 'fullday'))
  and not exists (select 1 from public.bookings b where b.template_id = v.template_id and b.variant_id = v.id)
  and not exists (select 1 from public.jobs j where j.template_id = v.template_id and j.variant_id = v.id);

-- 5. Kept options: same level, new price ---------------------------------------
-- A price that was not on a level (none should be) goes to the closest one.
update public.pro_service_prices p
set price = coalesce(
  v.price_tiers[least(l.lvl, cardinality(v.price_tiers))],
  (select t from unnest(v.price_tiers) t order by abs(t - p.price), t limit 1))
from partner_private.price_list_levels l, public.service_variants v
where l.pro_id = p.pro_id and l.template_id = p.template_id and l.variant_id = p.variant_id
  and v.template_id = p.template_id and v.id = p.variant_id
  and not p.price = any(v.price_tiers);

drop table partner_private.price_list_levels;

-- 6. Add-ons are only booked on top of a main service --------------------------
create function partner_private.guard_addon_only() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.service_templates where id = new.template_id and addon_only) then return new; end if;
  -- An add-on booking is chained to its main one (attach_addons); a request has none.
  if tg_table_name = 'bookings' then
    if new.parent_booking_id is not null then return new; end if;
  end if;
  raise exception 'Dịch vụ này chỉ đặt kèm một dịch vụ chính.' using errcode = 'check_violation';
end $$;
revoke all on function partner_private.guard_addon_only() from public, anon, authenticated;
create trigger aa_addon_only before insert on public.bookings
  for each row execute function partner_private.guard_addon_only();
create trigger aa_addon_only before insert on public.jobs
  for each row execute function partner_private.guard_addon_only();
