-- Sample content for the App Store / Google Play review account.
--
-- Apple (2.1(a), 2026-10-09) asked for a demo account with pre-populated
-- content, e.g. sample messages. This fills the existing review account
-- (09b832da…, a customer who is also a partner) on both sides:
--   customer: one upcoming booking with an open chat, one completed and reviewed
--   partner:  one booking waiting to be accepted, one upcoming with an open chat,
--             one completed with a review, a wallet with a top-up and a commission
-- The other party is always a hidden seed profile (Linh Phạm, seed customers),
-- so nothing here is visible to real users, and the review account's partner
-- profile stays unpublished.
--
-- The review account is 09b832da-c782-4638-acd9-b59541cea00e.
-- Re-runnable: it first removes what it inserted before (fixed ids, prefix ae000000-).
-- Remove with supabase/scripts/remove-app-review-demo.sql.
-- Upcoming dates are absolute; move them forward if a later review needs them.

begin;
select set_config('app.system_write', 'on', true);


-- Clean slate --------------------------------------------------------------
delete from public.notifications where link in (
  select '/tin-nhan/' || id from public.threads where id::text like 'ae000000-%'
  union all select '/bookings/' || id from public.bookings where id::text like 'ae000000-%');
delete from public.messages where thread_id::text like 'ae000000-%';
delete from public.threads where id::text like 'ae000000-%';
delete from public.reviews where booking_id::text like 'ae000000-%';
delete from public.wallet_entries where id::text like 'ae000000-%';
delete from public.bookings where id::text like 'ae000000-%';

-- The account and its partner profile -------------------------------------
update public.accounts set full_name = 'App Review' where id = '09b832da-c782-4638-acd9-b59541cea00e';

update public.pros set
  display_name = 'Demo Partner',
  title = 'Chuyên viên nail (tài khoản demo)',
  bio = 'Hồ sơ đối tác mẫu cho đội xét duyệt ứng dụng. Không hiển thị với khách thật.',
  studio_address = '12 Kim Mã, Ba Đình',
  equipment = null,
  home_service = true,
  accepting_jobs = true,
  hours_confirmed = true,
  terms_accepted_at = coalesce(terms_accepted_at, now()),
  completed_jobs = 1, rating_avg = 5, rating_count = 1
where id = '09b832da-c782-4638-acd9-b59541cea00e';

insert into public.working_hours (pro_id, weekday, start_min, end_min)
select '09b832da-c782-4638-acd9-b59541cea00e', d, 540, 1140 from generate_series(1, 6) d
where not exists (select 1 from public.working_hours w where w.pro_id = '09b832da-c782-4638-acd9-b59541cea00e' and w.weekday = d);

-- Bookings -----------------------------------------------------------------
insert into public.bookings (id, customer_id, pro_id, template_id, variant_id, source, starts_at, duration_min, buffer_min,
  at_home, city, district, address, lat, lng, note, service_price, distance_km, travel_fee, urgent_fee,
  commission_rate, commission, payment_method, status, confirm_by, confirmed_at, completed_at, created_at)
values
  -- Customer side, with Linh Phạm
  ('ae000000-0000-4000-8000-000000000001', '09b832da-c782-4638-acd9-b59541cea00e', '5cb61497-1c4a-49d9-80a2-9864426c89bb', 'nail-gel', 'hand-foot', 'direct',
   '2026-10-24 03:00+00', 90, 30, true, 'Hà Nội', 'Ba Đình', '12 Kim Mã', 21.0341, 105.8142, 'Tông nude hoặc hồng đất.',
   300000, 4.8, 0, 0, 0.15, 45000, 'cash', 'confirmed', '2026-10-24 01:00+00', '2026-10-08 10:20+00', null, '2026-10-08 10:00+00'),
  ('ae000000-0000-4000-8000-000000000002', '09b832da-c782-4638-acd9-b59541cea00e', '5cb61497-1c4a-49d9-80a2-9864426c89bb', 'nail-design', 'stone', 'direct',
   '2026-09-28 08:00+00', 90, 30, true, 'Hà Nội', 'Ba Đình', '12 Kim Mã', 21.0341, 105.8142, '',
   330000, 4.8, 0, 0, 0.15, 49500, 'cash', 'completed', '2026-09-28 06:00+00', '2026-09-27 12:00+00', '2026-09-28 10:00+00', '2026-09-27 11:40+00'),
  -- Partner side, with seed customers
  ('ae000000-0000-4000-8000-000000000003', 'f06b6da3-a344-4f36-8c08-bef99f162401', '09b832da-c782-4638-acd9-b59541cea00e', 'nail-extension', 'gelx', 'direct',
   '2026-10-20 07:00+00', 100, 30, true, 'Hà Nội', 'Đống Đa', '25 Tôn Đức Thắng', 21.0181, 105.829, 'Dáng móng vuông, màu trơn.',
   350000, 2.4, 0, 0, 0.15, 52500, 'cash', 'pending', '2026-10-20 05:00+00', null, null, now()),
  ('ae000000-0000-4000-8000-000000000004', '9a937381-49b2-4ef9-8edb-2c55ae893c48', '09b832da-c782-4638-acd9-b59541cea00e', 'nail-extension', 'gelx', 'direct',
   '2026-10-22 03:00+00', 100, 30, true, 'Hà Nội', 'Cầu Giấy', '88 Trần Duy Hưng', 21.0362, 105.7906, 'Dáng bầu, dài vừa.',
   350000, 2.6, 0, 0, 0.15, 52500, 'cash', 'confirmed', '2026-10-22 01:00+00', '2026-10-09 06:10+00', null, '2026-10-09 06:00+00'),
  ('ae000000-0000-4000-8000-000000000005', 'bdb0d68c-8db6-41bf-8584-4569b2534db0', '09b832da-c782-4638-acd9-b59541cea00e', 'nail-extension', 'gelx', 'direct',
   '2026-10-02 08:00+00', 100, 30, true, 'Hà Nội', 'Ba Đình', '5 Liễu Giai', 21.0341, 105.8142, '',
   350000, 1.2, 0, 0, 0.15, 52500, 'cash', 'completed', '2026-10-02 06:00+00', '2026-10-01 09:00+00', '2026-10-02 10:00+00', '2026-10-01 08:30+00');

-- Chats ----------------------------------------------------------------------
insert into public.threads (id, customer_id, pro_id, booking_id, customer_name, created_at) values
  ('ae000000-0000-4000-8000-000000000011', '09b832da-c782-4638-acd9-b59541cea00e', '5cb61497-1c4a-49d9-80a2-9864426c89bb', 'ae000000-0000-4000-8000-000000000001', 'App Review', '2026-10-08 10:21+00'),
  ('ae000000-0000-4000-8000-000000000012', '09b832da-c782-4638-acd9-b59541cea00e', '5cb61497-1c4a-49d9-80a2-9864426c89bb', 'ae000000-0000-4000-8000-000000000002', 'App Review', '2026-09-27 12:00+00'),
  ('ae000000-0000-4000-8000-000000000014', '9a937381-49b2-4ef9-8edb-2c55ae893c48', '09b832da-c782-4638-acd9-b59541cea00e', 'ae000000-0000-4000-8000-000000000004', 'Thảo Vy', '2026-10-09 06:00+00'),
  ('ae000000-0000-4000-8000-000000000015', 'bdb0d68c-8db6-41bf-8584-4569b2534db0', '09b832da-c782-4638-acd9-b59541cea00e', 'ae000000-0000-4000-8000-000000000005', 'Minh Châu', '2026-10-01 09:00+00');

-- (thread, sender, body, sent at, read): the last message from the other side stays unread.
insert into public.messages (thread_id, sender_id, body, created_at, read_at)
select t::uuid, s::uuid, b, at::timestamptz, case when r then at::timestamptz + interval '1 minute' end
from (values
  ('ae000000-0000-4000-8000-000000000011', '5cb61497-1c4a-49d9-80a2-9864426c89bb', 'Chào bạn, mình là Linh. Mình đã nhận lịch sơn gel tay + chân lúc 10:00 thứ Bảy 24/10 nhé.', '2026-10-08 10:21+00', true),
  ('ae000000-0000-4000-8000-000000000011', '09b832da-c782-4638-acd9-b59541cea00e', 'Cảm ơn Linh! Mình ở 12 Kim Mã, tầng 3, tới nơi bấm chuông giúp mình nhé.', '2026-10-08 10:30+00', true),
  ('ae000000-0000-4000-8000-000000000011', '5cb61497-1c4a-49d9-80a2-9864426c89bb', 'Dạ vâng. Bạn thích tông màu nào để mình mang thêm mẫu ạ?', '2026-10-08 10:32+00', true),
  ('ae000000-0000-4000-8000-000000000011', '09b832da-c782-4638-acd9-b59541cea00e', 'Mình thích tông nude hoặc hồng đất.', '2026-10-08 10:40+00', true),
  ('ae000000-0000-4000-8000-000000000011', '5cb61497-1c4a-49d9-80a2-9864426c89bb', 'Ok bạn, mình sẽ mang bảng màu nude và hồng đất. Hẹn gặp bạn thứ Bảy nhé!', '2026-10-08 11:05+00', false),

  ('ae000000-0000-4000-8000-000000000012', '5cb61497-1c4a-49d9-80a2-9864426c89bb', 'Chào bạn, mình nhận lịch vẽ móng đính đá 15:00 mai nhé.', '2026-09-27 12:00+00', true),
  ('ae000000-0000-4000-8000-000000000012', '09b832da-c782-4638-acd9-b59541cea00e', 'Ok Linh, hẹn mai nhé.', '2026-09-27 12:15+00', true),
  ('ae000000-0000-4000-8000-000000000012', '5cb61497-1c4a-49d9-80a2-9864426c89bb', 'Cảm ơn bạn đã đặt lịch. Đá bị bong trong 5 ngày cứ báo mình qua lịch hẹn nha.', '2026-09-28 10:05+00', true),

  ('ae000000-0000-4000-8000-000000000014', '9a937381-49b2-4ef9-8edb-2c55ae893c48', 'Chào chị, em đặt úp móng Gel-X lúc 10:00 thứ Năm 22/10 ạ. Em muốn dáng bầu, dài vừa.', '2026-10-09 06:00+00', true),
  ('ae000000-0000-4000-8000-000000000014', '09b832da-c782-4638-acd9-b59541cea00e', 'Chào em, chị đã nhận lịch. Dáng bầu dài vừa chị làm được nhé.', '2026-10-09 06:10+00', true),
  ('ae000000-0000-4000-8000-000000000014', '9a937381-49b2-4ef9-8edb-2c55ae893c48', 'Dạ, nhà em ở 88 Trần Duy Hưng, chị tới gọi em xuống đón nhé.', '2026-10-09 06:20+00', false),

  ('ae000000-0000-4000-8000-000000000015', 'bdb0d68c-8db6-41bf-8584-4569b2534db0', 'Chị ơi em ở sảnh B, tầng 12 nhé.', '2026-10-02 07:40+00', true),
  ('ae000000-0000-4000-8000-000000000015', '09b832da-c782-4638-acd9-b59541cea00e', 'Ok em, chị tới nơi rồi.', '2026-10-02 07:58+00', true)
) m(t, s, b, at, r);

update public.threads t set last_message_at = (select max(created_at) from public.messages m where m.thread_id = t.id)
where t.id::text like 'ae000000-%';

-- Reviews --------------------------------------------------------------------
insert into public.reviews (booking_id, pro_id, customer_id, rating, body, author_name, service_label, created_at, published_at) values
  ('ae000000-0000-4000-8000-000000000002', '5cb61497-1c4a-49d9-80a2-9864426c89bb', '09b832da-c782-4638-acd9-b59541cea00e', 5,
   'Linh làm kỹ, đá gắn chắc, đúng giờ.', 'App Review', 'Vẽ móng · Đính đá / charm', '2026-09-28 12:00+00', '2026-09-28 12:00+00'),
  ('ae000000-0000-4000-8000-000000000005', '09b832da-c782-4638-acd9-b59541cea00e', 'bdb0d68c-8db6-41bf-8584-4569b2534db0', 5,
   'Chị làm nhanh, dáng móng đẹp, sạch sẽ.', 'Minh Châu', 'Nối móng · Móng úp mềm Gel-X', '2026-10-02 12:00+00', '2026-10-02 12:00+00');

-- Partner wallet: a top-up, then the commission of the completed job ---------
insert into public.wallet_entries (id, pro_id, booking_id, kind, amount, ref, note, created_at) values
  ('ae000000-0000-4000-8000-000000000021', '09b832da-c782-4638-acd9-b59541cea00e', null, 'topup', 200000, 'DEMO', 'Nạp ví mẫu', '2026-10-01 08:00+00'),
  ('ae000000-0000-4000-8000-000000000022', '09b832da-c782-4638-acd9-b59541cea00e', 'ae000000-0000-4000-8000-000000000005', 'commission', -52500, null, 'Hoa hồng job hoàn thành', '2026-10-02 10:00+00');

-- Notifications --------------------------------------------------------------
-- The messages trigger added one per thread; the closed chats count as read.
update public.notifications set read_at = now()
where link in ('/tin-nhan/ae000000-0000-4000-8000-000000000012', '/tin-nhan/ae000000-0000-4000-8000-000000000015')
  and read_at is null;

insert into public.notifications (account_id, kind, title, body, link, created_at) values
  ('09b832da-c782-4638-acd9-b59541cea00e', 'booking_new', 'Có yêu cầu đặt lịch mới', 'Ngọc Hân đặt Móng úp mềm Gel-X lúc 14:00 thứ Ba 20/10.', '/bookings/ae000000-0000-4000-8000-000000000003', now()),
  ('09b832da-c782-4638-acd9-b59541cea00e', 'booking_confirmed', 'Người làm đã nhận lịch', 'Giờ hai bên nhắn tin được với nhau trong lịch hẹn.', '/bookings/ae000000-0000-4000-8000-000000000001', '2026-10-08 10:20+00');

commit;
