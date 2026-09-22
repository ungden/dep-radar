-- The photo & video and model catalogue, and what those services need that a
-- nail set does not.
--
--  * on_location: done at a place the customer picks (a café, a park, a shop)
--    rather than at their home. Same booking rules as home service, other words.
--  * deliverable / delivery_days: a photo session is not over when it ends. The
--    customer is owed files, and the days to hand them over start at completion.
--  * requires_verification: only an identity-verified freelancer may list it.
--    Model work is where casting scams and harassment happen, so the badge that
--    is optional for a manicurist is the price of entry here.
--
-- Production does not run seed files, so the new services are upserted here.
-- The statements below are generated, not typed:
--   npx tsx scripts/gen-catalog-sql.ts --templates=photo,model

alter table public.service_templates
  add column on_location boolean not null default false,
  add column deliverable text,
  add column delivery_days int check (delivery_days between 1 and 30),
  add column requires_verification boolean not null default false,
  -- A service happens either at the freelancer's studio or somewhere of the customer's.
  add constraint service_templates_place check (not (studio_only and on_location));

insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-phone', 'photophone', 'Chụp ảnh bằng điện thoại', 'Chụp dạo, đi cafe, hẹn hò, sinh nhật bằng điện thoại đời mới. Có hướng dẫn tạo dáng.', array['Hướng dẫn tạo dáng', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu theo gói']::text[], false, true, 'Toàn bộ ảnh gốc + ảnh chỉnh màu', 2, false, true, 32)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-phone', '30m', '30 phút · 10 ảnh chỉnh', 30, 120000, 300000, 180000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-phone', '60m', '60 phút · 20 ảnh chỉnh', 60, 200000, 500000, 300000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-phone', '90m', '90 phút · 30 ảnh chỉnh', 90, 280000, 700000, 420000, false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-phone', '120m', '2 giờ · 40 ảnh chỉnh', 120, 350000, 900000, 520000, false, 1, 3)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-phone-group', 'photophone', 'Chụp đôi / nhóm bạn', 'Chụp cặp đôi, nhóm bạn, gia đình nhỏ bằng điện thoại.', array['Hướng dẫn tạo dáng theo nhóm', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu theo gói']::text[], false, true, 'Toàn bộ ảnh gốc + ảnh chỉnh màu', 2, false, true, 33)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-phone-group', 'pair-60', '2 người · 60 phút', 60, 250000, 600000, 380000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-phone-group', 'group-90', '3–6 người · 90 phút', 90, 400000, 1000000, 600000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-tour', 'photophone', 'Photo tour du lịch', 'Đi cùng bạn một buổi ở điểm du lịch, chụp suốt hành trình.', array['Lên lịch trình điểm chụp', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu']::text[], false, true, 'Toàn bộ ảnh gốc + 50–100 ảnh chỉnh', 4, false, true, 34)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-tour', 'half', 'Nửa ngày', 240, 800000, 2500000, 1300000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-tour', 'full', 'Cả ngày', 480, 1500000, 4500000, 2500000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-portrait', 'camera', 'Chụp chân dung máy ảnh', 'Chân dung, áo dài, kỷ yếu, concept cá nhân bằng máy ảnh.', array['Tư vấn concept & trang phục', 'Chụp máy ảnh', 'Ảnh chỉnh da, màu']::text[], false, true, 'Ảnh gốc chọn lọc + ảnh chỉnh', 5, false, true, 35)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-portrait', '60m', '60 phút · 15 ảnh chỉnh', 60, 400000, 1200000, 700000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-portrait', '120m', '2 giờ · 30 ảnh chỉnh', 120, 700000, 2000000, 1200000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-profile', 'camera', 'Ảnh hồ sơ / CV', 'Ảnh chân dung gọn gàng cho CV, LinkedIn, hồ sơ công ty.', array['Hướng dẫn tư thế', 'Chụp nền trơn hoặc văn phòng', 'Chỉnh da nhẹ']::text[], false, true, '5–10 ảnh chỉnh', 3, false, true, 36)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-profile', '30m', '30 phút · 5 ảnh chỉnh', 30, 150000, 500000, 250000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-profile', '60m', '60 phút · 10 ảnh chỉnh', 60, 250000, 800000, 400000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'photo-event', 'camera', 'Chụp sự kiện nhỏ', 'Sinh nhật, tiệc công ty nhỏ, khai trương, lễ tốt nghiệp.', array['Chụp toàn bộ sự kiện', 'Ảnh gốc chọn lọc', 'Chỉnh màu']::text[], false, true, 'Ảnh sự kiện đã chỉnh màu', 5, false, true, 37)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-event', '120m', '2 giờ', 120, 600000, 2000000, 1000000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'photo-event', '240m', '4 giờ', 240, 1000000, 3500000, 1800000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'video-short', 'short-video', 'Quay & dựng clip ngắn', 'Clip 15–60 giây cho TikTok, Reels: quay, dựng, nhạc, phụ đề.', array['Gợi ý kịch bản ngắn', 'Quay bằng điện thoại/máy ảnh', 'Dựng, chèn nhạc, phụ đề']::text[], false, true, 'Clip dọc 9:16 đã dựng', 3, false, true, 38)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'video-short', '1', '1 clip', 90, 300000, 1500000, 600000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'video-short', '3', '3 clip', 180, 800000, 3500000, 1500000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'video-short', '5', '5 clip', 240, 1200000, 5000000, 2200000, false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'video-event', 'short-video', 'Quay hậu trường / sự kiện', 'Quay lại buổi tiệc, buổi chụp, sự kiện nhỏ và dựng thành clip.', array['Quay toàn buổi', 'Dựng 1 clip tổng hợp', 'Nhạc & chuyển cảnh']::text[], false, true, '1 clip tổng hợp 1–3 phút', 5, false, true, 39)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'video-event', '120m', '2 giờ', 120, 500000, 2000000, 900000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'video-event', '240m', '4 giờ', 240, 900000, 3500000, 1600000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'product-basic', 'product-photo', 'Chụp sản phẩm nền trơn', 'Ảnh sản phẩm nền trắng/nền màu cho sàn thương mại điện tử.', array['Setup nền & ánh sáng', '3 góc mỗi sản phẩm', 'Tách nền, chỉnh màu']::text[], false, true, '3 ảnh mỗi sản phẩm', 3, false, true, 40)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'product-basic', '10', '10 sản phẩm', 60, 200000, 800000, 400000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'product-basic', '30', '30 sản phẩm', 150, 500000, 2000000, 1000000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'product-basic', '50', '50 sản phẩm', 240, 800000, 3000000, 1500000, false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'product-lifestyle', 'product-photo', 'Chụp sản phẩm bối cảnh', 'Sản phẩm đặt trong bối cảnh sử dụng thật, hợp quảng cáo và fanpage.', array['Lên concept bối cảnh', 'Đạo cụ cơ bản', 'Chỉnh màu']::text[], false, true, '2 ảnh bối cảnh mỗi sản phẩm', 4, false, true, 41)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'product-lifestyle', '10', '10 sản phẩm', 120, 500000, 2000000, 900000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'product-lifestyle', '30', '30 sản phẩm', 240, 1200000, 4500000, 2200000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'product-video', 'product-photo', 'Quay clip sản phẩm', 'Clip ngắn giới thiệu sản phẩm cho TikTok Shop, Shopee Video.', array['Kịch bản ngắn theo sản phẩm', 'Quay & dựng dọc 9:16', 'Nhạc, phụ đề']::text[], false, true, 'Clip dọc đã dựng', 4, false, true, 42)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'product-video', '3', '3 clip', 120, 600000, 2500000, 1200000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'product-video', '5', '5 clip', 180, 900000, 4000000, 1800000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-lookbook', 'model-photo', 'Mẫu chụp lookbook', 'Mặc và tạo dáng cho bộ sưu tập thời trang, ảnh shop online.', array['Tạo dáng theo concept', 'Thay trang phục của shop', 'Không bao gồm makeup & người chụp']::text[], false, true, null, null, true, true, 43)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-lookbook', '60m', '1 giờ', 60, 300000, 1500000, 500000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-lookbook', '120m', '2 giờ', 120, 550000, 2800000, 900000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-lookbook', '240m', '4 giờ', 240, 1000000, 5000000, 1700000, false, 1, 2)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-hand', 'model-photo', 'Mẫu tay / cầm sản phẩm', 'Mẫu tay cho nail, trang sức, mỹ phẩm, sản phẩm cầm tay.', array['Tay được chăm sóc sẵn', 'Tạo dáng tay theo góc máy']::text[], false, true, null, null, true, true, 44)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-hand', '60m', '1 giờ', 60, 200000, 800000, 350000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-hand', '120m', '2 giờ', 120, 350000, 1500000, 600000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-beauty', 'model-photo', 'Mẫu làm đẹp cho thương hiệu', 'Làm mẫu makeup, tóc, chăm sóc da cho thương hiệu hoặc lớp dạy nghề.', array['Làm mẫu theo yêu cầu', 'Tạo dáng khi chụp kết quả']::text[], false, true, null, null, true, true, 45)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-beauty', '60m', '1 giờ', 60, 150000, 600000, 250000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-beauty', '120m', '2 giờ', 120, 250000, 1000000, 450000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-clip', 'model-video', 'Diễn viên clip ngắn', 'Diễn clip TikTok, Reels, video giới thiệu sản phẩm theo kịch bản.', array['Diễn theo kịch bản', 'Nói/ lồng tiếng nếu cần']::text[], false, true, null, null, true, true, 46)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-clip', '60m', '1 giờ', 60, 300000, 1500000, 500000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-clip', '120m', '2 giờ', 120, 500000, 2500000, 900000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order) values (
  'model-live', 'model-video', 'Mẫu livestream / mặc thử', 'Mặc thử, giới thiệu sản phẩm trong phiên livestream bán hàng.', array['Mặc thử & giới thiệu', 'Tương tác người xem theo kịch bản']::text[], false, true, null, null, true, true, 47)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-live', '120m', '2 giờ', 120, 400000, 2000000, 700000, false, 1, 0)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, per_person, max_quantity, sort_order) values (
  'model-live', '240m', '4 giờ', 240, 700000, 3500000, 1300000, false, 1, 1)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order;
