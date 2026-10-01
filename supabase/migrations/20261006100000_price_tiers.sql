-- Fixed price levels. Partners no longer type a price inside a band: every
-- option has 2–3 levels (Phổ thông / Tiêu chuẩn / Cao cấp) researched from
-- public price lists in Hà Nội and TP.HCM, and a partner picks one. Customers
-- posting a request pick one too. lib/catalog.ts is the source; the upserts
-- below come from scripts/gen-catalog-sql.ts --templates=beauty,photo,model,
-- which also adds 24 commonly booked services and 7 options.

alter table public.service_variants add column price_tiers int[];

-- 1. Catalogue with its levels ------------------------------------------------

insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'nail-gel', 'nail', 'Sơn gel trơn', 'Làm sạch, tạo form và sơn gel một màu.', array['Cắt da, tạo form móng', 'Sơn gel 1 màu', 'Dưỡng viền móng']::text[], false, false, null, null, false, true, 0)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-gel', 'hand', 'Tay', 45, 120000, 220000, 160000, array[120000, 160000, 220000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-gel', 'cat-eye', 'Tay · mắt mèo / tráng gương', 50, 140000, 240000, 180000, array[140000, 180000, 240000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-gel', 'hand-foot', 'Tay + chân', 90, 220000, 400000, 300000, array[220000, 300000, 400000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'nail-design', 'nail', 'Nail thiết kế', 'Sơn gel kèm thiết kế theo mẫu khách chọn.', array['Cắt da, tạo form móng', 'Sơn gel nền', 'Thiết kế theo mẫu']::text[], false, false, null, null, false, true, 1)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-design', 'simple', 'Ombre / French', 75, 200000, 350000, 260000, array[200000, 260000, 350000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-design', 'stone', 'Đính đá / charm', 90, 250000, 450000, 330000, array[250000, 330000, 450000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-design', 'art', 'Vẽ nghệ thuật', 120, 350000, 650000, 480000, array[350000, 480000, 650000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'nail-extension', 'nail', 'Nối móng', 'Nối dài móng bằng móng úp hoặc đắp gel.', array['Tạo form móng thật', 'Nối móng', 'Sơn gel 1 màu']::text[], false, false, null, null, false, true, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-extension', 'tips', 'Úp móng', 90, 220000, 360000, 280000, array[220000, 280000, 360000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-extension', 'builder', 'Đắp gel', 120, 300000, 500000, 380000, array[300000, 380000, 500000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-extension', 'gelx', 'Móng úp mềm Gel-X', 100, 350000, 600000, 450000, array[350000, 450000, 600000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'nail-removal', 'nail', 'Tháo gel & dưỡng móng', 'Tháo gel/bột an toàn, không làm mỏng móng.', array['Tháo gel bằng dung dịch chuyên dụng', 'Dũa lại form', 'Dưỡng móng']::text[], false, false, null, null, false, true, 3)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-removal', 'remove', 'Tháo gel', 20, 50000, 80000, 50000, array[50000, 80000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-removal', 'remove-care', 'Tháo + dưỡng', 45, 100000, 150000, 100000, array[100000, 150000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'nail-pedicure', 'nail', 'Chăm sóc bàn chân (pedicure)', 'Ngâm chân, lấy da chết, cắt da và dưỡng gót.', array['Ngâm chân thảo mộc', 'Lấy da chết, cắt da', 'Dưỡng gót & massage chân']::text[], false, false, null, null, false, true, 4)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-pedicure', 'basic', 'Cơ bản', 45, 130000, 250000, 180000, array[130000, 180000, 250000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-pedicure', 'deluxe', 'Có đắp mặt nạ chân', 75, 220000, 350000, 280000, array[220000, 280000, 350000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'nail-manicure', 'nail', 'Cắt da, sửa form & sơn thường', 'Chăm sóc móng cơ bản cho khách không dùng gel.', array['Cắt da, sửa form móng', 'Sơn thường 1 màu', 'Dưỡng viền móng']::text[], false, false, null, null, false, true, 5)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-manicure', 'hand', 'Tay', 30, 80000, 150000, 110000, array[80000, 110000, 150000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-manicure', 'hand-foot', 'Tay + chân', 60, 150000, 260000, 200000, array[150000, 200000, 260000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'nail-refill', 'nail', 'Dặm móng nối', 'Dặm phần móng mọc ra và sơn lại cho bộ móng đã nối.', array['Dũa, làm sạch phần móng mọc', 'Đắp bù gel', 'Sơn lại 1 màu']::text[], false, false, null, null, false, true, 6)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'nail-refill', 'refill', 'Dặm móng', 75, 150000, 260000, 200000, array[150000, 200000, 260000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'makeup-daily', 'makeup', 'Makeup nhẹ / đi làm', 'Lớp nền mỏng, tự nhiên, phù hợp đi làm, đi học, hẹn hò.', array['Làm sạch & dưỡng nền', 'Makeup tự nhiên', 'Mỹ phẩm của chuyên viên']::text[], false, false, null, null, false, true, 7)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-daily', 'single', '1 người', 45, 200000, 350000, 280000, array[200000, 280000, 350000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'makeup-party', 'makeup', 'Makeup dự tiệc', 'Makeup bền màu cho tiệc, sự kiện, kèm mi giả.', array['Makeup bền 8 tiếng', 'Mi giả', 'Tư vấn layout theo trang phục']::text[], false, false, null, null, false, true, 8)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-party', 'makeup', 'Makeup', 60, 300000, 550000, 400000, array[300000, 400000, 550000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-party', 'makeup-hair', 'Makeup + làm tóc', 90, 400000, 750000, 550000, array[400000, 550000, 750000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'makeup-photo', 'makeup', 'Makeup chụp ảnh / kỷ yếu', 'Layout lên hình theo concept, ánh sáng.', array['Layout theo concept', 'Mi giả', 'Dặm lại 1 lần trong buổi chụp (nếu ở lại)']::text[], false, false, null, null, false, true, 9)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-photo', 'single', '1 người', 60, 350000, 650000, 450000, array[350000, 450000, 650000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-photo', 'group', 'Nhóm (giá mỗi người)', 45, 200000, 300000, 250000, array[200000, 250000, 300000], true, 8, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'makeup-bridal', 'makeup', 'Makeup cô dâu', 'Makeup và làm tóc cô dâu, tư vấn layout trước ngày cưới.', array['Tư vấn layout trước ngày cưới', 'Makeup + làm tóc cô dâu', 'Mi giả, phụ kiện tóc cơ bản']::text[], false, false, null, null, false, true, 10)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-bridal', 'one', '1 lễ (ăn hỏi hoặc cưới)', 120, 1200000, 2800000, 1800000, array[1200000, 1800000, 2800000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-bridal', 'two', 'Trọn gói 2 lễ (2 buổi)', 240, 2200000, 4800000, 3200000, array[2200000, 3200000, 4800000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-bridal', 'fullday', 'Theo cô dâu cả ngày (dặm, đổi layout)', 600, 3000000, 6500000, 4500000, array[3000000, 4500000, 6500000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'makeup-family', 'makeup', 'Makeup mẹ cô dâu / người nhà / phụ dâu', 'Makeup và làm tóc cho người nhà trong ngày cưới.', array['Makeup bền', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, true, 11)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-family', 'mother', 'Mẹ cô dâu / chú rể', 75, 400000, 700000, 550000, array[400000, 550000, 700000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-family', 'family', 'Người nhà / phụ dâu (giá mỗi người)', 60, 250000, 450000, 350000, array[250000, 350000, 450000], true, 8, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'makeup-event', 'makeup', 'Makeup sự kiện / MC / biểu diễn', 'Layout lên đèn sân khấu, lên hình livestream.', array['Makeup lên đèn, lên hình', 'Làm tóc', 'Mi giả']::text[], false, false, null, null, false, true, 12)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-event', 'event', 'Sự kiện', 90, 500000, 1000000, 700000, array[500000, 700000, 1000000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'makeup-prewedding', 'makeup', 'Makeup chụp ảnh cưới', 'Makeup cô dâu cho buổi chụp ảnh cưới trong studio hoặc ngoại cảnh.', array['Makeup + tóc cô dâu', 'Đổi layout theo trang phục', 'Mi giả']::text[], false, false, null, null, false, true, 13)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-prewedding', 'studio', 'Chụp trong studio', 120, 700000, 1500000, 1000000, array[700000, 1000000, 1500000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'makeup-prewedding', 'outdoor', 'Ngoại cảnh, theo cả buổi', 300, 1000000, 2200000, 1500000, array[1000000, 1500000, 2200000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'skin-basic', 'skincare', 'Chăm sóc da cơ bản', 'Làm sạch, tẩy tế bào chết, massage và đắp mặt nạ.', array['Soi da', 'Làm sạch 2 bước, tẩy tế bào chết', 'Massage mặt', 'Mặt nạ theo loại da']::text[], false, false, null, null, false, true, 14)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-basic', '60m', '60 phút', 60, 200000, 380000, 280000, array[200000, 280000, 380000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-basic', '90m', '90 phút', 90, 300000, 550000, 400000, array[300000, 400000, 550000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'skin-acne', 'skincare', 'Lấy nhân mụn chuẩn y khoa', 'Lấy nhân mụn vô khuẩn, làm dịu và kháng viêm.', array['Soi da', 'Lấy nhân mụn bằng dụng cụ vô khuẩn', 'Mặt nạ làm dịu']::text[], false, false, null, null, false, true, 15)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-acne', '60m', '60 phút', 60, 220000, 420000, 300000, array[220000, 300000, 420000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-acne', '90m', '90 phút', 90, 300000, 550000, 420000, array[300000, 420000, 550000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'skin-recovery', 'skincare', 'Phục hồi da nhạy cảm', 'Liệu trình dịu nhẹ cho da đỏ, kích ứng, sau treatment.', array['Soi da', 'Làm sạch dịu nhẹ', 'Serum & mặt nạ phục hồi']::text[], false, false, null, null, false, true, 16)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-recovery', '75m', '75 phút', 75, 300000, 580000, 420000, array[300000, 420000, 580000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'skin-wax', 'skincare', 'Waxing', 'Wax lông bằng sáp nóng hoặc sáp hạt, kèm dịu da sau wax.', array['Làm sạch vùng wax', 'Wax', 'Dịu da sau wax']::text[], false, false, null, null, false, true, 17)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-wax', 'underarm', 'Nách', 20, 70000, 150000, 100000, array[70000, 100000, 150000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-wax', 'half-leg', 'Nửa chân', 30, 150000, 280000, 200000, array[150000, 200000, 280000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-wax', 'full-leg', 'Cả chân', 45, 250000, 450000, 330000, array[250000, 330000, 450000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-wax', 'arm', 'Cả tay', 30, 180000, 300000, 240000, array[180000, 240000, 300000], false, 1, 3)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-wax', 'half-arm', 'Nửa tay', 20, 120000, 220000, 160000, array[120000, 160000, 220000], false, 1, 4)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-wax', 'lip', 'Mép / ria', 15, 50000, 100000, 70000, array[50000, 70000, 100000], false, 1, 5)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-wax', 'bikini', 'Bikini', 30, 250000, 500000, 350000, array[250000, 350000, 500000], false, 1, 6)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'skin-hydration', 'skincare', 'Điện di cấp ẩm / vitamin C', 'Cấp ẩm và làm sáng da bằng điện di, không xâm lấn.', array['Làm sạch da', 'Điện di tinh chất', 'Mặt nạ khoá ẩm']::text[], false, false, null, null, false, true, 18)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'skin-hydration', '60m', '60 phút', 60, 220000, 400000, 300000, array[220000, 300000, 400000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-cut', 'hair', 'Cắt tóc', 'Cắt theo dáng mặt, gội và sấy tạo kiểu.', array['Tư vấn dáng tóc', 'Cắt & tỉa', 'Gội, sấy tạo kiểu']::text[], false, false, null, null, false, true, 19)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-cut', 'women', 'Nữ', 45, 120000, 250000, 180000, array[120000, 180000, 250000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-cut', 'men', 'Nam', 30, 80000, 180000, 120000, array[80000, 120000, 180000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-color', 'hair', 'Nhuộm tóc', 'Nhuộm phủ bạc hoặc đổi màu, kèm dưỡng sau nhuộm.', array['Test da đầu', 'Nhuộm', 'Dưỡng phục hồi sau nhuộm']::text[], true, false, null, null, false, true, 20)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-color', 'roots', 'Phủ chân tóc / phủ bạc', 90, 200000, 450000, 300000, array[200000, 300000, 450000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-color', 'full', 'Nhuộm toàn đầu', 120, 450000, 1000000, 700000, array[450000, 700000, 1000000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-color', 'bleach', 'Tẩy & nhuộm màu sáng', 180, 900000, 1800000, 1300000, array[900000, 1300000, 1800000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-perm', 'hair', 'Uốn tóc', 'Uốn lạnh hoặc uốn nóng, kèm dưỡng giữ nếp.', array['Tư vấn kiểu lọn', 'Uốn', 'Dưỡng giữ nếp']::text[], true, false, null, null, false, true, 21)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-perm', 'cold', 'Uốn lạnh', 150, 400000, 950000, 650000, array[400000, 650000, 950000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-perm', 'hot', 'Uốn nóng / setting', 180, 600000, 1300000, 900000, array[600000, 900000, 1300000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-treatment', 'hair', 'Hấp dầu & phục hồi tóc', 'Phục hồi tóc khô xơ sau tẩy, nhuộm hoặc uốn.', array['Gội làm sạch', 'Ủ dưỡng chuyên sâu', 'Sấy tạo kiểu nhẹ']::text[], true, false, null, null, false, true, 22)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-treatment', '45m', '45 phút', 45, 150000, 380000, 250000, array[150000, 250000, 380000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-treatment', '75m', '75 phút', 75, 350000, 800000, 550000, array[350000, 550000, 800000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-wash', 'hair', 'Gội đầu dưỡng sinh', 'Gội, massage da đầu và cổ vai, sấy khô.', array['Gội 2 lần', 'Massage da đầu, cổ vai', 'Sấy tạo phồng nhẹ']::text[], true, false, null, null, false, true, 23)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-wash', '45m', '45 phút', 45, 130000, 250000, 180000, array[130000, 180000, 250000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-wash', '60m', '60 phút', 60, 180000, 300000, 240000, array[180000, 240000, 300000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-styling', 'hair', 'Tạo kiểu tóc sự kiện', 'Uốn, búi, tết theo trang phục và dáng mặt.', array['Tư vấn kiểu tóc', 'Tạo kiểu', 'Keo/xịt giữ nếp']::text[], false, false, null, null, false, true, 24)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-styling', 'curl', 'Uốn / duỗi tạo kiểu', 45, 150000, 300000, 220000, array[150000, 220000, 300000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-styling', 'updo', 'Búi / tết cầu kỳ', 60, 200000, 450000, 300000, array[200000, 300000, 450000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-bridal', 'hair', 'Làm tóc cô dâu', 'Làm tóc cô dâu có buổi thử trước.', array['1 buổi thử tóc', 'Tạo kiểu & cài phụ kiện', 'Giữ nếp suốt lễ']::text[], false, false, null, null, false, true, 25)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-bridal', 'one', '1 lễ', 120, 800000, 1800000, 1200000, array[800000, 1200000, 1800000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-straighten', 'hair', 'Duỗi / ép tóc', 'Duỗi thẳng tự nhiên hoặc duỗi phồng chân tóc, kèm dưỡng giữ nếp.', array['Tư vấn độ thẳng', 'Duỗi dập thuốc', 'Dưỡng giữ nếp']::text[], true, false, null, null, false, true, 26)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-straighten', 'bangs', 'Duỗi / uốn mái', 30, 100000, 200000, 150000, array[100000, 150000, 200000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-straighten', 'full', 'Duỗi toàn đầu', 150, 450000, 1000000, 700000, array[450000, 700000, 1000000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-scalp', 'hair', 'Chăm sóc da đầu (gàu, ngứa, rụng tóc)', 'Làm sạch sâu da đầu và ủ tinh chất theo tình trạng.', array['Soi da đầu', 'Tẩy tế bào chết da đầu', 'Ủ tinh chất & massage']::text[], true, false, null, null, false, true, 27)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-scalp', '50m', '50 phút', 50, 150000, 300000, 220000, array[150000, 220000, 300000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'hair-home-cut', 'hair', 'Cắt tóc tại nhà cho bé & người lớn tuổi', 'Thợ đến nhà cắt gọn, hợp với người ngại ra tiệm.', array['Cắt, tỉa theo yêu cầu', 'Dọn tóc vụn']::text[], false, false, null, null, false, true, 28)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-home-cut', 'kid', 'Trẻ em', 20, 60000, 120000, 80000, array[60000, 80000, 120000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'hair-home-cut', 'senior', 'Người lớn tuổi', 30, 80000, 150000, 100000, array[80000, 100000, 150000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'lash-lift', 'lash-brow', 'Uốn mi (lash lift)', 'Uốn cong mi thật, không cần nối, giữ 4–6 tuần.', array['Test kích ứng', 'Uốn mi', 'Nhuộm mi (nếu chọn)']::text[], false, false, null, null, false, true, 29)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'lash-lift', 'lift', 'Uốn mi', 60, 180000, 350000, 250000, array[180000, 250000, 350000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'lash-lift', 'lift-tint', 'Uốn + nhuộm mi', 75, 230000, 400000, 300000, array[230000, 300000, 400000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'brow-tattoo', 'lash-brow', 'Phun xăm mày', 'Phun sợi hoặc phun bột, có buổi dặm lại sau 1 tháng.', array['Test màu & vẽ dáng', 'Phun mày', '1 buổi dặm lại trong 45 ngày']::text[], true, false, null, null, false, true, 30)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'brow-tattoo', 'hairstroke', 'Phun sợi', 150, 1500000, 3500000, 2500000, array[1500000, 2500000, 3500000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'brow-tattoo', 'powder', 'Phun bột / ombre', 150, 1300000, 3000000, 2000000, array[1300000, 2000000, 3000000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'brow-tint', 'lash-brow', 'Nhuộm mày', 'Nhuộm mày cho dáng rõ hơn mà chưa cần phun xăm.', array['Tỉa gọn', 'Nhuộm mày', 'Hướng dẫn giữ màu']::text[], false, false, null, null, false, true, 31)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'brow-tint', 'tint', 'Nhuộm mày', 30, 120000, 250000, 180000, array[120000, 180000, 250000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'lash-classic', 'lash-brow', 'Nối mi classic', 'Nối mi 1:1 tự nhiên như mi thật.', array['Test kích ứng keo', 'Nối mi 1:1', 'Hướng dẫn chăm sóc mi']::text[], true, false, null, null, false, true, 32)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'lash-classic', 'full', 'Full set', 90, 200000, 380000, 280000, array[200000, 280000, 380000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'lash-volume', 'lash-brow', 'Nối mi volume', 'Mi dày vừa, không nặng mắt.', array['Test kích ứng keo', 'Nối mi volume 2D–4D', 'Hướng dẫn chăm sóc mi']::text[], true, false, null, null, false, true, 33)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'lash-volume', 'full', 'Full set', 120, 300000, 550000, 400000, array[300000, 400000, 550000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'lash-refill', 'lash-brow', 'Dặm mi', 'Dặm lại mi đã nối trong vòng 3 tuần.', array['Làm sạch mi cũ', 'Dặm mi rụng']::text[], true, false, null, null, false, true, 34)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'lash-refill', 'refill', 'Dặm mi', 60, 120000, 220000, 160000, array[120000, 160000, 220000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'brow-shaping', 'lash-brow', 'Tạo dáng & tỉa mày', 'Đo tỉ lệ và tạo dáng mày theo khuôn mặt.', array['Đo tỉ lệ khuôn mặt', 'Tỉa, wax lông mày', 'Kẻ dáng mày']::text[], false, false, null, null, false, true, 35)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'brow-shaping', 'shape', 'Tạo dáng', 30, 80000, 180000, 120000, array[80000, 120000, 180000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'lash-design', 'lash-brow', 'Nối mi thiết kế (Katun, baby doll, mi thỏ, wispy)', 'Các kiểu mi thiết kế đang thịnh, dày hơn classic.', array['Test kích ứng keo', 'Nối mi theo mẫu', 'Hướng dẫn chăm sóc']::text[], true, false, null, null, false, true, 36)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'lash-design', 'full', 'Full set', 120, 300000, 500000, 380000, array[300000, 380000, 500000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'lash-removal', 'lash-brow', 'Tháo mi nối', 'Tháo mi cũ an toàn bằng dung dịch chuyên dụng.', array['Tháo bằng dung dịch chuyên dụng', 'Làm sạch mi thật']::text[], false, false, null, null, false, true, 37)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'lash-removal', 'remove', 'Tháo mi', 20, 50000, 80000, 50000, array[50000, 80000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'brow-lamination', 'lash-brow', 'Định hình (uốn) chân mày', 'Dựng và định hình sợi mày, giữ 6–8 tuần, không dùng kim.', array['Tỉa gọn', 'Uốn định hình', 'Nhuộm mày nếu cần']::text[], false, false, null, null, false, true, 38)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'brow-lamination', 'lamination', 'Định hình mày', 60, 300000, 600000, 450000, array[300000, 450000, 600000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'massage-foot', 'massage', 'Massage chân', 'Ngâm chân thảo mộc và bấm huyệt bàn chân, bắp chân.', array['Ngâm chân thảo mộc', 'Bấm huyệt bàn chân', 'Massage bắp chân']::text[], false, false, null, null, false, true, 39)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-foot', '60m', '60 phút', 60, 220000, 380000, 300000, array[220000, 300000, 380000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-foot', '90m', '90 phút', 90, 300000, 520000, 400000, array[300000, 400000, 520000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-foot', '120m', '120 phút', 120, 380000, 650000, 500000, array[380000, 500000, 650000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'massage-neck', 'massage', 'Massage cổ vai gáy', 'Giảm căng cứng cổ, vai, gáy cho dân văn phòng.', array['Chườm nóng', 'Massage cổ vai gáy', 'Bấm huyệt đầu']::text[], false, false, null, null, false, true, 40)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-neck', '60m', '60 phút', 60, 250000, 420000, 330000, array[250000, 330000, 420000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-neck', '90m', '90 phút', 90, 350000, 580000, 450000, array[350000, 450000, 580000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-neck', '120m', '120 phút', 120, 450000, 720000, 580000, array[450000, 580000, 720000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'massage-oil-cupping', 'massage', 'Massage dầu + giác hơi', 'Massage body với tinh dầu, kết hợp giác hơi lưng.', array['Massage body tinh dầu', 'Giác hơi lưng', 'Khăn nóng']::text[], false, false, null, null, false, true, 41)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-oil-cupping', '60m', '60 phút', 60, 300000, 480000, 380000, array[300000, 380000, 480000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-oil-cupping', '90m', '90 phút', 90, 420000, 650000, 520000, array[420000, 520000, 650000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-oil-cupping', '120m', '120 phút', 120, 520000, 800000, 650000, array[520000, 650000, 800000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'massage-prenatal', 'massage', 'Massage bầu', 'Massage an toàn cho mẹ bầu từ tháng thứ 4.', array['Tư thế nằm nghiêng an toàn', 'Dầu massage lành tính', 'Giảm đau lưng, phù chân']::text[], false, false, null, null, false, true, 42)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-prenatal', '60m', '60 phút', 60, 350000, 550000, 450000, array[350000, 450000, 550000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-prenatal', '90m', '90 phút', 90, 450000, 700000, 550000, array[450000, 550000, 700000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'massage-dry', 'massage', 'Massage không dầu', 'Massage body ấn huyệt, không dùng dầu.', array['Ấn huyệt toàn thân', 'Kéo giãn nhẹ', 'Khăn nóng']::text[], false, false, null, null, false, true, 43)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-dry', '60m', '60 phút', 60, 300000, 480000, 380000, array[300000, 380000, 480000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-dry', '90m', '90 phút', 90, 420000, 650000, 520000, array[420000, 520000, 650000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-dry', '120m', '120 phút', 120, 520000, 800000, 650000, array[520000, 650000, 800000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'massage-hot-stone', 'massage', 'Massage đá nóng', 'Massage body tinh dầu kết hợp đá bazan làm ấm, giãn cơ sâu.', array['Massage body tinh dầu', 'Đá nóng dọc lưng & chân', 'Khăn nóng']::text[], false, false, null, null, false, true, 44)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-hot-stone', '60m', '60 phút', 60, 350000, 550000, 450000, array[350000, 450000, 550000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-hot-stone', '90m', '90 phút', 90, 450000, 720000, 580000, array[450000, 580000, 720000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'massage-postnatal', 'massage', 'Massage sau sinh', 'Chăm sóc mẹ sau sinh tại nhà: chườm muối thảo dược, giảm đau lưng.', array['Chườm muối thảo dược vùng bụng', 'Massage lưng, vai, chân', 'Ngâm chân thảo mộc']::text[], false, false, null, null, false, true, 45)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-postnatal', '60m', '60 phút', 60, 300000, 500000, 400000, array[300000, 400000, 500000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'massage-postnatal', '90m', '90 phút', 90, 400000, 650000, 500000, array[400000, 500000, 650000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-phone', 'photophone', 'Chụp ảnh bằng điện thoại', 'Chụp dạo, đi cafe, hẹn hò, sinh nhật bằng điện thoại đời mới. Có hướng dẫn tạo dáng.', array['Hướng dẫn tạo dáng', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu theo gói']::text[], false, true, 'Toàn bộ ảnh gốc + ảnh chỉnh màu', 2, false, true, 46)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-phone', '30m', '30 phút · 5 ảnh chỉnh', 30, 120000, 200000, 150000, array[120000, 150000, 200000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-phone', '60m', '60 phút · 10–15 ảnh chỉnh', 60, 200000, 450000, 300000, array[200000, 300000, 450000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-phone', '90m', '90 phút · 15–20 ảnh chỉnh', 90, 280000, 600000, 400000, array[280000, 400000, 600000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-phone', '120m', '2 giờ · 20–25 ảnh chỉnh', 120, 350000, 750000, 500000, array[350000, 500000, 750000], false, 1, 3)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-phone-group', 'photophone', 'Chụp đôi / nhóm bạn', 'Chụp cặp đôi, nhóm bạn, gia đình nhỏ bằng điện thoại.', array['Hướng dẫn tạo dáng theo nhóm', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu theo gói']::text[], false, true, 'Toàn bộ ảnh gốc + ảnh chỉnh màu', 2, false, true, 47)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-phone-group', 'pair-60', '2 người · 60 phút', 60, 300000, 550000, 400000, array[300000, 400000, 550000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-phone-group', 'group-90', '3–6 người · 90 phút', 90, 450000, 900000, 650000, array[450000, 650000, 900000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-tour', 'photophone', 'Photo tour du lịch', 'Đi cùng bạn một buổi ở điểm du lịch, chụp suốt hành trình.', array['Lên lịch trình điểm chụp', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu']::text[], false, true, 'Toàn bộ ảnh gốc + 50–100 ảnh chỉnh', 4, false, true, 48)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-tour', 'half', 'Nửa ngày', 240, 800000, 1800000, 1200000, array[800000, 1200000, 1800000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-tour', 'full', 'Cả ngày', 480, 1500000, 3200000, 2200000, array[1500000, 2200000, 3200000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-outfit', 'photophone', 'Chụp outfit / feedback quần áo', 'Chụp từng bộ đồ khách tự mặc hoặc của shop, ảnh dọc kiểu mạng xã hội.', array['Hướng dẫn tạo dáng theo từng bộ', 'Toàn bộ ảnh gốc', '2–3 ảnh chỉnh mỗi bộ']::text[], false, true, 'Ảnh gốc + 2–3 ảnh chỉnh mỗi bộ', 2, false, true, 49)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-outfit', '5', '5 bộ · 60 phút', 60, 300000, 650000, 450000, array[300000, 450000, 650000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-outfit', '10', '10 bộ · 2 giờ', 120, 500000, 1200000, 800000, array[500000, 800000, 1200000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-party', 'photophone', 'Chụp sinh nhật / tiệc nhỏ', 'Ghi lại buổi tiệc tại nhà, quán cà phê hoặc nhà hàng.', array['Chụp khoảnh khắc và ảnh nhóm', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu chọn lọc']::text[], false, true, 'Ảnh gốc + ảnh chỉnh chọn lọc', 2, false, true, 50)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-party', '60m', '60 phút', 60, 300000, 650000, 450000, array[300000, 450000, 650000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-party', '120m', '2 giờ', 120, 550000, 1200000, 800000, array[550000, 800000, 1200000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-portrait', 'camera', 'Chụp chân dung máy ảnh', 'Chân dung, áo dài, kỷ yếu, concept cá nhân bằng máy ảnh.', array['Tư vấn concept & trang phục', 'Chụp máy ảnh', 'Ảnh chỉnh da, màu']::text[], false, true, 'Ảnh gốc chọn lọc + ảnh chỉnh', 5, false, true, 51)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-portrait', '60m', '60 phút · 15 ảnh chỉnh', 60, 500000, 1000000, 700000, array[500000, 700000, 1000000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-portrait', '120m', '2 giờ · 30 ảnh chỉnh', 120, 900000, 1800000, 1200000, array[900000, 1200000, 1800000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-profile', 'camera', 'Ảnh hồ sơ / CV', 'Ảnh chân dung gọn gàng cho CV, LinkedIn, hồ sơ công ty.', array['Hướng dẫn tư thế', 'Chụp nền trơn hoặc văn phòng', 'Chỉnh da nhẹ']::text[], false, true, '5–10 ảnh chỉnh', 3, false, true, 52)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-profile', '30m', '30 phút · 5 ảnh chỉnh', 30, 250000, 500000, 350000, array[250000, 350000, 500000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-profile', '60m', '60 phút · 10 ảnh chỉnh', 60, 400000, 800000, 550000, array[400000, 550000, 800000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-event', 'camera', 'Chụp sự kiện nhỏ', 'Sinh nhật, tiệc công ty nhỏ, khai trương, lễ tốt nghiệp.', array['Chụp toàn bộ sự kiện', 'Ảnh gốc chọn lọc', 'Chỉnh màu']::text[], false, true, 'Ảnh sự kiện đã chỉnh màu', 5, false, true, 53)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-event', '120m', '2 giờ', 120, 800000, 1800000, 1200000, array[800000, 1200000, 1800000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-event', '240m', '4 giờ', 240, 1400000, 3000000, 2000000, array[1400000, 2000000, 3000000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-family', 'camera', 'Chụp ảnh gia đình', 'Chụp gia đình ngoại cảnh hoặc tại nhà bằng máy ảnh.', array['Tư vấn trang phục & địa điểm', 'Ảnh gốc chọn lọc', 'Ảnh chỉnh da & màu']::text[], false, true, 'Ảnh gốc chọn lọc + ảnh chỉnh', 5, false, true, 54)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-family', '60m', '60 phút', 60, 700000, 1500000, 1000000, array[700000, 1000000, 1500000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-family', '120m', '2 giờ', 120, 1200000, 2500000, 1700000, array[1200000, 1700000, 2500000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-couple', 'camera', 'Chụp cặp đôi / kỷ niệm', 'Chụp cặp đôi, kỷ niệm ngày yêu (không phải trọn gói ảnh cưới).', array['Tư vấn concept', 'Chụp bằng máy ảnh', '25 ảnh chỉnh']::text[], false, true, 'Ảnh gốc chọn lọc + 25 ảnh chỉnh', 5, false, true, 55)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-couple', '120m', '2 giờ · 25 ảnh chỉnh', 120, 1000000, 2300000, 1500000, array[1000000, 1500000, 2300000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-yearbook-group', 'camera', 'Kỷ yếu nhóm bạn / lớp nhỏ', 'Chụp kỷ yếu cho nhóm 5–15 người tại trường hoặc ngoại cảnh.', array['Lên concept nhóm', 'Ảnh nhóm và ảnh từng người', 'Ảnh chỉnh']::text[], false, true, 'Ảnh nhóm + ảnh từng người đã chỉnh', 7, false, true, 56)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'photo-yearbook-group', 'half', 'Buổi 3 giờ (giá mỗi người)', 180, 150000, 400000, 250000, array[150000, 250000, 400000], true, 15, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'video-short', 'short-video', 'Quay & dựng clip ngắn', 'Clip 15–60 giây cho TikTok, Reels: quay, dựng, nhạc, phụ đề.', array['Gợi ý kịch bản ngắn', 'Quay bằng điện thoại/máy ảnh', 'Dựng, chèn nhạc, phụ đề']::text[], false, true, 'Clip dọc 9:16 đã dựng', 3, false, true, 57)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'video-short', '1', '1 clip', 90, 400000, 1200000, 700000, array[400000, 700000, 1200000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'video-short', '3', '3 clip', 180, 1000000, 3000000, 1800000, array[1000000, 1800000, 3000000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'video-short', '5', '5 clip', 240, 1500000, 4500000, 2700000, array[1500000, 2700000, 4500000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'video-event', 'short-video', 'Quay hậu trường / sự kiện', 'Quay lại buổi tiệc, buổi chụp, sự kiện nhỏ và dựng thành clip.', array['Quay toàn buổi', 'Dựng 1 clip tổng hợp', 'Nhạc & chuyển cảnh']::text[], false, true, '1 clip tổng hợp 1–3 phút', 5, false, true, 58)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'video-event', '120m', '2 giờ', 120, 800000, 2000000, 1200000, array[800000, 1200000, 2000000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'video-event', '240m', '4 giờ', 240, 1400000, 3500000, 2200000, array[1400000, 2200000, 3500000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'video-talking', 'short-video', 'Quay clip nói trước ống kính', 'Quay một buổi nhiều clip chia sẻ cho kênh cá nhân.', array['Gợi ý kịch bản & chủ đề', 'Quay một buổi nhiều clip', 'Dựng, phụ đề']::text[], false, true, 'Clip dọc 9:16 đã dựng, có phụ đề', 5, false, true, 59)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'video-talking', '5', '5 clip · 3 giờ', 180, 1200000, 3200000, 2000000, array[1200000, 2000000, 3200000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'video-talking', '10', '10 clip · 5 giờ', 300, 2000000, 5500000, 3500000, array[2000000, 3500000, 5500000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'product-basic', 'product-photo', 'Chụp sản phẩm nền trơn', 'Ảnh sản phẩm nền trắng/nền màu cho sàn thương mại điện tử.', array['Setup nền & ánh sáng', '3 góc mỗi sản phẩm', 'Tách nền, chỉnh màu']::text[], false, true, '3 ảnh mỗi sản phẩm', 3, false, true, 60)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-basic', '10', '10 sản phẩm', 60, 400000, 1200000, 700000, array[400000, 700000, 1200000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-basic', '30', '30 sản phẩm', 150, 1000000, 3000000, 1800000, array[1000000, 1800000, 3000000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-basic', '50', '50 sản phẩm', 240, 1500000, 4000000, 2500000, array[1500000, 2500000, 4000000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'product-lifestyle', 'product-photo', 'Chụp sản phẩm bối cảnh', 'Sản phẩm đặt trong bối cảnh sử dụng thật, hợp quảng cáo và fanpage.', array['Lên concept bối cảnh', 'Đạo cụ cơ bản', 'Chỉnh màu']::text[], false, true, '2 ảnh bối cảnh mỗi sản phẩm', 4, false, true, 61)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-lifestyle', '10', '10 sản phẩm', 120, 900000, 2500000, 1500000, array[900000, 1500000, 2500000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-lifestyle', '30', '30 sản phẩm', 240, 2000000, 5500000, 3500000, array[2000000, 3500000, 5500000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'product-video', 'product-photo', 'Quay clip sản phẩm', 'Clip ngắn giới thiệu sản phẩm cho TikTok Shop, Shopee Video.', array['Kịch bản ngắn theo sản phẩm', 'Quay & dựng dọc 9:16', 'Nhạc, phụ đề']::text[], false, true, 'Clip dọc đã dựng', 4, false, true, 62)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-video', '3', '3 clip', 120, 900000, 2400000, 1500000, array[900000, 1500000, 2400000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-video', '5', '5 clip', 180, 1400000, 3500000, 2200000, array[1400000, 2200000, 3500000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'product-flatlay', 'product-photo', 'Chụp quần áo trải sàn / ma-nơ-canh', 'Chụp flatlay hoặc ma-nơ-canh cho shop thời trang online.', array['Là phẳng & sắp đặt', '2–3 góc mỗi bộ', 'Tách nền, chỉnh màu']::text[], false, true, '2–3 ảnh mỗi bộ', 3, false, true, 63)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-flatlay', '10', '10 bộ', 90, 400000, 1000000, 650000, array[400000, 650000, 1000000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-flatlay', '30', '30 bộ', 240, 1000000, 2600000, 1700000, array[1000000, 1700000, 2600000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'product-food', 'product-photo', 'Chụp món ăn cho menu / app giao đồ ăn', 'Chụp món tại quán cho menu, GrabFood, ShopeeFood.', array['Bày món cơ bản', 'Chụp tại quán', 'Chỉnh màu']::text[], false, true, '1–2 ảnh mỗi món', 3, false, true, 64)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-food', '10', '10 món', 120, 600000, 1600000, 1000000, array[600000, 1000000, 1600000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'product-food', '20', '20 món', 180, 1000000, 2800000, 1700000, array[1000000, 1700000, 2800000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-lookbook', 'model-photo', 'Mẫu chụp lookbook', 'Mặc và tạo dáng cho bộ sưu tập thời trang, ảnh shop online.', array['Tạo dáng theo concept', 'Thay trang phục của shop', 'Không bao gồm makeup & người chụp']::text[], false, true, null, null, true, true, 65)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-lookbook', '60m', '1 giờ', 60, 400000, 1000000, 600000, array[400000, 600000, 1000000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-lookbook', '120m', '2 giờ', 120, 700000, 1800000, 1100000, array[700000, 1100000, 1800000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-lookbook', '240m', '4 giờ', 240, 1300000, 3200000, 2000000, array[1300000, 2000000, 3200000], false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-hand', 'model-photo', 'Mẫu tay / cầm sản phẩm', 'Mẫu tay cho nail, trang sức, mỹ phẩm, sản phẩm cầm tay.', array['Tay được chăm sóc sẵn', 'Tạo dáng tay theo góc máy']::text[], false, true, null, null, true, true, 66)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-hand', '60m', '1 giờ', 60, 250000, 600000, 400000, array[250000, 400000, 600000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-hand', '120m', '2 giờ', 120, 450000, 1000000, 700000, array[450000, 700000, 1000000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-beauty', 'model-photo', 'Mẫu làm đẹp cho thương hiệu', 'Làm mẫu makeup, tóc, chăm sóc da cho thương hiệu hoặc lớp dạy nghề.', array['Làm mẫu theo yêu cầu', 'Tạo dáng khi chụp kết quả']::text[], false, true, null, null, true, true, 67)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-beauty', '60m', '1 giờ', 60, 150000, 500000, 300000, array[150000, 300000, 500000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-beauty', '120m', '2 giờ', 120, 250000, 800000, 500000, array[250000, 500000, 800000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-outfit', 'model-photo', 'Mẫu mặc thử chụp ảnh (theo số bộ)', 'Mẫu mặc từng bộ của shop cho ảnh sàn thương mại điện tử.', array['Thay đồ, tạo dáng từng bộ', 'Tự chuẩn bị tóc, makeup đơn giản', 'Không gồm người chụp']::text[], false, true, null, null, true, true, 68)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-outfit', '10', '10 bộ', 120, 600000, 1500000, 1000000, array[600000, 1000000, 1500000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-outfit', '20', '20 bộ', 210, 1000000, 2600000, 1700000, array[1000000, 1700000, 2600000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-clip', 'model-video', 'Diễn viên clip ngắn', 'Diễn clip TikTok, Reels, video giới thiệu sản phẩm theo kịch bản.', array['Diễn theo kịch bản', 'Nói/ lồng tiếng nếu cần']::text[], false, true, null, null, true, true, 69)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-clip', '60m', '1 giờ', 60, 300000, 800000, 500000, array[300000, 500000, 800000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-clip', '120m', '2 giờ', 120, 500000, 1400000, 900000, array[500000, 900000, 1400000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-live', 'model-video', 'Mẫu livestream / mặc thử', 'Mặc thử, giới thiệu sản phẩm trong phiên livestream bán hàng.', array['Mặc thử & giới thiệu', 'Tương tác người xem theo kịch bản']::text[], false, true, null, null, true, true, 70)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-live', '120m', '2 giờ', 120, 600000, 1600000, 1000000, array[600000, 1000000, 1600000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-live', '240m', '4 giờ', 240, 1100000, 3000000, 1800000, array[1100000, 1800000, 3000000], false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-tryon', 'model-video', 'Mẫu mặc thử quay clip (theo số bộ)', 'Mẫu mặc thử, xoay dáng và giới thiệu ngắn từng bộ trong clip.', array['Mặc thử, xoay dáng từng bộ', 'Nói ngắn giới thiệu sản phẩm', 'Không gồm người quay']::text[], false, true, null, null, true, true, 71)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order) values (
  'model-tryon', '10', '10 bộ', 120, 700000, 1700000, 1100000, array[700000, 1100000, 1700000], false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;

-- Every option now has levels; the band is the lowest and highest of them.
alter table public.service_variants
  alter column price_tiers set not null,
  add constraint service_variants_price_tiers_check check (
    cardinality(price_tiers) between 2 and 3
    and price_tiers[1] = min_price
    and price_tiers[cardinality(price_tiers)] = max_price
    and suggested_price = any(price_tiers)
  );

-- 2. A listing is one of the levels -------------------------------------------

create or replace function public.check_listing_price() returns trigger
language plpgsql security definer set search_path = '' as $$
declare levels int[];
begin
  select price_tiers into levels
    from public.service_variants
    where template_id = new.template_id and id = new.variant_id;
  if levels is null then
    raise exception 'Unknown service option %/%', new.template_id, new.variant_id;
  end if;
  if not new.price = any(levels) then
    raise exception 'Chọn một trong các mức giá có sẵn của gói này.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- Prices listed before the levels move to the closest level (the lower one on a tie).
update public.pro_service_prices p
set price = (
  select t from unnest(v.price_tiers) t order by abs(t - p.price), t limit 1
)
from public.service_variants v
where v.template_id = p.template_id and v.id = p.variant_id
  and not p.price = any(v.price_tiers);

-- 3. A request is posted at one of the levels ---------------------------------
-- Same as 20260926100000, but the price must be one of the option's levels.
-- Requests already posted keep their price (take_job still checks the band).

create or replace function public.post_job(
  p_template text, p_variant text, p_starts_at timestamptz, p_at_home boolean,
  p_address_id uuid default null, p_quantity int default 1, p_description text default '',
  p_payment public.payment_method default 'cash', p_price int default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); addr record; policy record; variant record; new_id uuid; who text; v_price int;
  j public.jobs; n int;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into policy from public.fee_policy where id;
  select * into variant from public.service_variants where template_id = p_template and id = p_variant;
  if variant is null or p_quantity < 1 or p_quantity > variant.max_quantity then
    raise exception 'Số người không hợp lệ cho gói dịch vụ này.' using errcode = 'check_violation';
  end if;
  v_price := coalesce(p_price, variant.suggested_price);
  if not v_price = any(variant.price_tiers) then
    raise exception 'Chọn một trong các mức giá có sẵn của gói này.' using errcode = 'check_violation';
  end if;
  if extract(epoch from (p_starts_at - now())) / 60 < policy.min_lead_minutes then
    raise exception 'Cần đặt trước ít nhất % phút.', policy.min_lead_minutes using errcode = 'check_violation';
  end if;
  if not p_at_home then raise exception 'Yêu cầu hiện chỉ dành cho dịch vụ tại nhà.' using errcode = 'feature_not_supported'; end if;
  select * into addr from public.addresses where id = p_address_id and account_id = me;
  if addr is null then raise exception 'Cần chọn địa chỉ đã lưu.' using errcode = 'check_violation'; end if;
  select coalesce(nullif(full_name, ''), 'Khách hàng') into who from public.accounts where id = me;
  insert into public.jobs (customer_id, customer_name, template_id, variant_id, quantity, description,
                           starts_at, at_home, address_id, city, district, payment_method, price)
  values (me, who, p_template, p_variant, p_quantity, left(coalesce(p_description, ''), 500),
          p_starts_at, true, p_address_id, addr.city, addr.district, p_payment, v_price)
  returning * into j;
  new_id := j.id;

  -- Every freelancer who could take it right now hears about it.
  insert into public.notifications (account_id, kind, title, body, link)
  select p.id, 'job_new',
         'Việc mới: ' || coalesce((select name from public.service_templates where id = p_template), 'dịch vụ'),
         addr.district || ' · ' || to_char(p_starts_at at time zone public.app_timezone(), 'HH24:MI DD/MM')
           || ' · ' || to_char(v_price * p_quantity, 'FM999G999G999') || 'đ. Ai nhận trước được việc.',
         '/studio/jobs'
  from public.pros p
  where p.published and p.suspended_at is null and p.accepting_jobs and p.city = addr.city
    and public.job_problem(p.id, j) is null;
  get diagnostics n = row_count;
  update public.jobs set notified = n where id = new_id;
  return new_id;
end $$;

