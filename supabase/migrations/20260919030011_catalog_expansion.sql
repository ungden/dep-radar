-- Catalogue expansion. The audit was right that the list was missing whole
-- revenue areas: hair cutting, colouring and perms, lash lifts, brow tattooing
-- and tinting, waxing, and pedicure as its own service. Generated from
-- lib/catalog.ts, so the price bands here are the ones the app shows.

insert into public.service_templates (id, category, name, description, includes, studio_only, active, sort_order) values (
  'nail-pedicure', 'nail', 'Chăm sóc bàn chân (pedicure)', 'Ngâm chân, lấy da chết, cắt da và dưỡng gót.', array['Ngâm chân thảo mộc', 'Lấy da chết, cắt da', 'Dưỡng gót & massage chân']::text[], false, true, 4)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'nail-pedicure', 'basic', 'Cơ bản', 45, 120000, 300000, 180000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'nail-pedicure', 'deluxe', 'Có đắp mặt nạ chân', 75, 220000, 500000, 320000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, active, sort_order) values (
  'skin-wax', 'skincare', 'Waxing', 'Wax lông bằng sáp nóng hoặc sáp hạt, kèm dịu da sau wax.', array['Làm sạch vùng wax', 'Wax', 'Dịu da sau wax']::text[], false, true, 12)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'skin-wax', 'underarm', 'Nách', 20, 80000, 200000, 120000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'skin-wax', 'half-leg', 'Nửa chân', 30, 120000, 300000, 180000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'skin-wax', 'full-leg', 'Cả chân', 45, 200000, 500000, 320000, false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'skin-wax', 'arm', 'Tay', 30, 120000, 300000, 180000, false, 1, 3)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, active, sort_order) values (
  'hair-cut', 'hair', 'Cắt tóc', 'Cắt theo dáng mặt, gội và sấy tạo kiểu.', array['Tư vấn dáng tóc', 'Cắt & tỉa', 'Gội, sấy tạo kiểu']::text[], false, true, 13)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'hair-cut', 'women', 'Nữ', 45, 120000, 350000, 200000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'hair-cut', 'men', 'Nam', 30, 80000, 250000, 150000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, active, sort_order) values (
  'hair-color', 'hair', 'Nhuộm tóc', 'Nhuộm phủ bạc hoặc đổi màu, kèm dưỡng sau nhuộm.', array['Test da đầu', 'Nhuộm', 'Dưỡng phục hồi sau nhuộm']::text[], true, true, 14)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'hair-color', 'roots', 'Phủ chân tóc / phủ bạc', 90, 250000, 600000, 380000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'hair-color', 'full', 'Nhuộm toàn đầu', 120, 400000, 1200000, 700000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'hair-color', 'bleach', 'Tẩy & nhuộm màu sáng', 180, 700000, 2500000, 1300000, false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, active, sort_order) values (
  'hair-perm', 'hair', 'Uốn tóc', 'Uốn lạnh hoặc uốn nóng, kèm dưỡng giữ nếp.', array['Tư vấn kiểu lọn', 'Uốn', 'Dưỡng giữ nếp']::text[], true, true, 15)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'hair-perm', 'cold', 'Uốn lạnh', 150, 500000, 1500000, 850000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'hair-perm', 'hot', 'Uốn nóng / setting', 180, 700000, 2000000, 1100000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, active, sort_order) values (
  'hair-treatment', 'hair', 'Hấp dầu & phục hồi tóc', 'Phục hồi tóc khô xơ sau tẩy, nhuộm hoặc uốn.', array['Gội làm sạch', 'Ủ dưỡng chuyên sâu', 'Sấy tạo kiểu nhẹ']::text[], true, true, 16)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'hair-treatment', '45m', '45 phút', 45, 150000, 400000, 250000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'hair-treatment', '75m', '75 phút', 75, 300000, 800000, 480000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, active, sort_order) values (
  'lash-lift', 'lash-brow', 'Uốn mi (lash lift)', 'Uốn cong mi thật, không cần nối, giữ 4–6 tuần.', array['Test kích ứng', 'Uốn mi', 'Nhuộm mi (nếu chọn)']::text[], false, true, 20)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'lash-lift', 'lift', 'Uốn mi', 60, 200000, 450000, 300000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'lash-lift', 'lift-tint', 'Uốn + nhuộm mi', 75, 250000, 550000, 380000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, active, sort_order) values (
  'brow-tattoo', 'lash-brow', 'Phun xăm mày', 'Phun sợi hoặc phun bột, có buổi dặm lại sau 1 tháng.', array['Test màu & vẽ dáng', 'Phun mày', '1 buổi dặm lại trong 45 ngày']::text[], true, true, 21)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'brow-tattoo', 'hairstroke', 'Phun sợi', 150, 1500000, 5000000, 2800000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'brow-tattoo', 'powder', 'Phun bột / ombre', 150, 1500000, 5000000, 2800000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, active, sort_order) values (
  'brow-tint', 'lash-brow', 'Nhuộm mày', 'Nhuộm mày cho dáng rõ hơn mà chưa cần phun xăm.', array['Tỉa gọn', 'Nhuộm mày', 'Hướng dẫn giữ màu']::text[], false, true, 22)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'brow-tint', 'tint', 'Nhuộm mày', 30, 100000, 250000, 150000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
-- Adding services in the middle of the list shifts everyone's position, so reset
-- the display order from the catalogue rather than leaving the old numbers.
update public.service_templates t
set sort_order = o.pos
from (values
  ('nail-gel', 0),
  ('nail-design', 1),
  ('nail-extension', 2),
  ('nail-removal', 3),
  ('nail-pedicure', 4),
  ('makeup-daily', 5),
  ('makeup-party', 6),
  ('makeup-photo', 7),
  ('makeup-bridal', 8),
  ('skin-basic', 9),
  ('skin-acne', 10),
  ('skin-recovery', 11),
  ('skin-wax', 12),
  ('hair-cut', 13),
  ('hair-color', 14),
  ('hair-perm', 15),
  ('hair-treatment', 16),
  ('hair-wash', 17),
  ('hair-styling', 18),
  ('hair-bridal', 19),
  ('lash-lift', 20),
  ('brow-tattoo', 21),
  ('brow-tint', 22),
  ('lash-classic', 23),
  ('lash-volume', 24),
  ('lash-refill', 25),
  ('brow-shaping', 26),
  ('massage-foot', 27),
  ('massage-neck', 28),
  ('massage-oil-cupping', 29),
  ('massage-prenatal', 30),
  ('massage-dry', 31)
) as o(id, pos)
where t.id = o.id;
