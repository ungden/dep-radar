-- Database rule tests. Run with `npm run db:test` against the local stack.
-- Every assertion here is a rule the product promises out loud, so a failure means
-- the app is lying to somebody. Anything that costs money is checked twice: once in
-- tests/pricing.test.ts for the UI, once here for the server.

\set ON_ERROR_STOP on
\timing off
\pset pager off

do $$
declare
  linh uuid; thu uuid; customer uuid; addr uuid; booking uuid; other uuid;
  msg text; km numeric; q public.quote; n int; slot timestamptz; thread uuid;
  other_phone text; other_avatar text; leaving uuid; google_user uuid; google_addr uuid;
  -- Every date below is anchored to the next Monday, so the tests never land on
  -- the Sunday the demo freelancers take off.
  monday date := current_date + (7 - ((extract(dow from current_date)::int + 6) % 7));
begin
  select id into linh from public.pros where slug = 'linh-pham';
  select id into thu from public.pros where slug = 'thu-anh';
  select a.id into customer from public.accounts a where a.full_name = 'Ngọc Hân';
  select id into addr from public.addresses where account_id = customer;

  ---------------------------------------------------------------------------
  raise notice 'travel fee bands';
  assert public.travel_fee(null) = 0, 'unknown distance is free';
  assert public.travel_fee(0) = 0, 'zero km is free';
  assert public.travel_fee(5) = 0, 'the free radius is free';
  -- 1.1 km x 5.000 = 5.500, rounded up to 10.000.
  assert public.travel_fee(6.1) = 10000, format('6.1km -> %s', public.travel_fee(6.1));
  assert public.travel_fee(10.6) = 30000, format('10.6km -> %s', public.travel_fee(10.6));
  assert public.travel_fee(500) = 100000, 'the cap holds';

  raise notice 'commission rounds the same way as the UI';
  assert public.commission_for(350000, 0.15) = 53000, 'commission of 350.000';
  q := public.build_quote(350000, 1, false, null, false);
  assert q.commission = 53000 and q.payout = 297000, format('quote %s/%s', q.commission, q.payout);
  assert q.commission + q.payout = q.total, 'commission and payout add back up';

  raise notice 'fees belong to the freelancer, commission only to the service';
  q := public.build_quote(300000, 1, true, 10.6, true);
  assert q.travel_fee = 30000 and q.urgent_fee = 50000, 'fees applied';
  assert q.total = 380000, format('total %s', q.total);
  assert q.commission = public.commission_for(300000, q.commission_rate), 'commission ignores fees';
  assert q.payout = q.total - q.commission, 'payout keeps the fees';

  raise notice 'a studio visit ignores distance';
  q := public.build_quote(200000, 1, false, 20, false);
  assert q.distance_km is null and q.travel_fee = 0, 'no travel fee at the studio';

  raise notice 'group options multiply by head count';
  assert public.service_duration_min('makeup-photo', 'group', 3) = 135, 'three heads take three slots';
  assert public.service_duration_min('makeup-photo', 'single', 3) = 60, 'a single option ignores quantity';
  q := public.build_quote(380000, 3, false, null, false);
  assert q.service_price = 1140000, format('group price %s', q.service_price);

  raise notice 'distance is symmetric and never below the in-district minimum';
  km := public.travel_distance_km(21.0341, 105.8142, 20.9937, 105.811);   -- Ba Dinh -> Thanh Xuan
  assert km = public.travel_distance_km(20.9937, 105.811, 21.0341, 105.8142), 'symmetric';
  assert km > 2, format('across districts is more than the minimum, got %s', km);
  assert public.travel_distance_km(21.0341, 105.8142, 21.0341, 105.8142) = 2, 'same point still costs a ride';
  assert public.travel_distance_km(null, null, 21.0, 105.0) is null, 'unknown point is unknown';

  ---------------------------------------------------------------------------
  raise notice 'a listing may not leave the catalogue band';
  begin
    insert into public.pro_service_prices (pro_id, template_id, variant_id, price)
    values (linh, 'nail-design', 'simple', 5000);
    assert false, 'a price below the band was accepted';
  exception when check_violation then null;
  end;

  raise notice 'a service outside the freelancer speciality is refused';
  begin
    insert into public.pro_services (pro_id, template_id) values (linh, 'massage-foot');
    assert false, 'a nail artist was allowed to list massage';
  exception when check_violation then null;
  end;

  ---------------------------------------------------------------------------
  raise notice 'availability explains itself';
  slot := monday + time '10:00' at time zone public.app_timezone();

  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, now() + interval '10 minutes', true,
                                     21.0181, 105.829);
  assert msg like 'Cần đặt trước%', format('lead time: %s', msg);

  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, slot, true, 21.0181, 105.829);
  assert msg is null, format('a normal slot should be bookable: %s', msg);

  msg := public.availability_problem(linh, 'nail-design', 'simple', 1,
    monday + time '23:00' at time zone public.app_timezone(), true, 21.0181, 105.829);
  assert msg = 'Ngoài giờ làm việc của chuyên viên.', format('night slot: %s', msg);

  msg := public.availability_problem(linh, 'massage-foot', '60m', 1, slot, true, 21.0181, 105.829);
  assert msg = 'Chuyên viên không nhận dịch vụ/gói này.', format('unlisted service: %s', msg);

  -- Ha Giang, far outside any freelancer's radius.
  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, slot, true, 22.8, 104.98);
  assert msg like 'Ngoài phạm vi%', format('out of range: %s', msg);

  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, slot, true, null, null);
  assert msg like 'Cần địa chỉ%', format('no coordinates: %s', msg);

  raise notice 'slots are generated from the working hours, not a fixed list';
  select count(*) into n from public.free_slots(linh, 'nail-design', 'simple', 1, monday, true, 21.0181, 105.829);
  assert n > 0, 'a working day has slots';
  select count(*) into n from public.free_slots(linh, 'nail-design', 'simple', 1, monday + 6, true, 21.0181, 105.829);
  assert n = 0, 'Sunday is closed';

  ---------------------------------------------------------------------------
  raise notice 'booking goes through the state machine';
  perform set_config('request.jwt.claim.sub', customer::text, true);

  booking := public.create_booking(linh, 'nail-design', 'simple', slot, true, addr, 1, 'Ghi chú test');
  assert (select status from public.bookings where id = booking) = 'pending', 'a new booking waits for the call';
  assert (select travel_fee from public.bookings where id = booking) >= 0, 'travel fee snapshotted';
  -- The deadline depends on the hour the booking is made (20260924100600), and CI
  -- runs at any hour, so compare with the rule itself; its hours are tested below.
  assert (select confirm_by from public.bookings where id = booking) = public.confirm_deadline(slot),
    'the freelancer has a deadline to call';
  assert (select confirm_by from public.bookings where id = booking) <= slot, 'the deadline is after the appointment';
  assert exists (select 1 from public.notifications where account_id = linh and kind = 'booking_new'
                 and link = '/bookings/' || booking), 'the new-booking notification does not open the booking';

  raise notice 'the same slot cannot be sold twice';
  begin
    perform public.create_booking(linh, 'nail-design', 'simple', slot, true, addr, 1, '');
    assert false, 'the slot was sold twice';
  exception when check_violation then null;
  end;

  raise notice 'the travel buffer blocks the slot right after, too';
  begin
    perform public.create_booking(linh, 'nail-design', 'simple', slot + interval '80 minutes', true, addr, 1, '');
    assert false, 'a booking inside the travel buffer was accepted';
  exception when check_violation then null;
  end;

  raise notice 'a customer cannot confirm their own booking';
  begin
    perform public.confirm_booking(booking);
    assert false, 'the customer confirmed it';
  exception when insufficient_privilege then null;
  end;

  raise notice 'the freelancer confirms, then completes';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(booking);
  assert (select status from public.bookings where id = booking) = 'confirmed', 'confirmed';

  begin
    perform public.complete_booking(booking);
    assert false, 'a future job was marked complete';
  exception when check_violation then null;
  end;

  -- Move the appointment into the past so completing it is legitimate.
  update public.bookings set starts_at = now() - interval '2 hours' where id = booking;
  perform public.complete_booking(booking);
  assert (select status from public.bookings where id = booking) = 'completed', 'completed';

  raise notice 'completing charges the commission exactly once';
  select count(*) into n from public.wallet_entries where booking_id = booking and kind = 'commission';
  assert n = 1, format('wallet entries: %s', n);
  assert (select amount from public.wallet_entries where booking_id = booking and kind = 'commission')
       = -(select commission from public.bookings where id = booking), 'the debit matches the quote';

  raise notice 'only the customer reviews, and only a finished job';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  select rating_count into n from public.pros where id = linh;
  perform public.write_review(booking, 5, array['Đúng giờ'], 'Rất hài lòng với buổi làm này.');
  -- Blind until the freelancer has reviewed the customer (or 14 days pass).
  assert (select published_at is null from public.reviews where booking_id = booking), 'the review was public at once';
  assert (select rating_count from public.pros where id = linh) = n, 'a blind review moved the rating';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.review_customer(booking, 5, 'Khách dễ thương, đúng giờ.');
  assert (select published_at is not null from public.reviews where booking_id = booking), 'both written, still blind';
  -- The demo data sets rating_count by hand; once recomputed it is the published reviews.
  assert (select rating_count from public.pros where id = linh)
       = (select count(*) from public.reviews where pro_id = linh and published_at is not null and hidden_at is null),
    'the rating does not follow published reviews';

  perform set_config('request.jwt.claim.sub', thu::text, true);
  begin
    perform public.reply_review(booking, 'Cảm ơn bạn');
    assert false, 'another freelancer replied to the review';
  exception when insufficient_privilege then null;
  end;

  raise notice 'a read receipt clears the unread count, and only for a thread party';
  -- This is not a hypothetical: the app used to stamp read_at with a plain
  -- update, which RLS silently dropped, so the unread badge never cleared.
  -- Chat lives only while the booking does; reopen it for these checks.
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set status = 'confirmed' where id = booking;
  perform set_config('request.jwt.claim.sub', customer::text, true);
  thread := public.open_thread(linh, booking);
  perform public.send_message(thread, 'Chị tới lúc 3h nhé');

  raise notice 'a photo in chat is accepted from its owner, refused from anyone else''s folder';
  -- The path check once had a doubled backslash and refused every photo.
  perform public.send_message(thread, '', array[customer::text || '/' || gen_random_uuid()::text || '.jpg']);
  begin
    perform public.send_message(thread, '', array[linh::text || '/' || gen_random_uuid()::text || '.jpg']);
    assert false, 'a photo from somebody else''s folder was accepted';
  exception when check_violation then null;
  end;

  perform set_config('request.jwt.claim.sub', linh::text, true);
  select count(*) into n from public.messages
   where thread_id = thread and sender_id <> linh and read_at is null;
  assert n = 2, format('unread before reading: %s', n);

  perform public.mark_thread_read(thread);
  select count(*) into n from public.messages
   where thread_id = thread and sender_id <> linh and read_at is null;
  assert n = 0, format('unread after reading: %s', n);

  -- Somebody outside the thread neither reads it nor clears it. The count has
  -- to be taken back as a party: read from the outsider it is zero either way.
  perform set_config('request.jwt.claim.sub', customer::text, true);
  perform public.send_message(thread, 'Em đợi chị ạ');
  perform set_config('request.jwt.claim.sub', thu::text, true);
  perform public.mark_thread_read(thread);

  perform set_config('request.jwt.claim.sub', linh::text, true);
  select count(*) into n from public.messages
   where thread_id = thread and sender_id <> linh and read_at is null;
  assert n = 1, 'an outsider cleared somebody else''s unread count';

  raise notice 'the freelancer opens the chat about their own booking, too';
  -- They pass themselves as the thread's freelancer; that used to be refused as
  -- "messaging yourself" before the booking was looked at.
  perform set_config('request.jwt.claim.sub', linh::text, true);
  assert public.open_thread(linh, booking) = thread, 'the freelancer got another thread for the same booking';
  begin
    perform public.open_thread(linh, null);
    assert false, 'a freelancer opened a chat with themselves';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', thu::text, true);
  begin
    perform public.open_thread(thu, booking);
    assert false, 'a freelancer opened a chat about somebody else''s booking';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set status = 'completed' where id = booking;

  raise notice 'nobody books themselves';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.create_booking(linh, 'nail-design', 'simple', slot + interval '1 day', true, addr, 1, '');
    assert false, 'a freelancer booked themselves';
  exception when check_violation or insufficient_privilege then null;
  end;

  raise notice 'online payment is refused while it does not exist';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.create_booking(linh, 'nail-design', 'simple', slot + interval '2 days', true, addr, 1, '', 'online');
    assert false, 'online payment was accepted';
  exception when feature_not_supported then null;
  end;

  ---------------------------------------------------------------------------
  raise notice 'an unanswered booking expires and frees the slot';
  other := public.create_booking(thu, 'makeup-party', 'makeup',
    (monday + 1) + time '10:00' at time zone public.app_timezone(), true, addr, 1, '');
  update public.bookings set confirm_by = now() - interval '1 minute' where id = other;
  perform public.expire_stale_bookings();
  assert (select status from public.bookings where id = other) = 'expired', 'expired';
  -- The slot is free again, which is the whole point of expiring it.
  msg := public.availability_problem(thu, 'makeup-party', 'makeup', 1,
    (monday + 1) + time '10:00' at time zone public.app_timezone(), true, 21.0181, 105.829);
  assert msg is null, format('the freed slot is still blocked: %s', msg);

  ---------------------------------------------------------------------------
  raise notice 'a freelancer cannot hand themselves a badge or a rating';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  update public.pros set identity_status = 'verified', rating_avg = 5, rating_count = 999,
                         completed_jobs = 9999, suspended_at = null
    where id = linh;
  assert (select rating_count from public.pros where id = linh) < 999, 'the rating was writable';
  assert (select completed_jobs from public.pros where id = linh) < 9999, 'the job count was writable';

  raise notice 'the account-deletion tombstone is not a way past the guards';
  -- 20260919111530 skipped every guard when the new row looked deleted, and any
  -- client can send those values. These two updates were the whole exploit.
  perform set_config('request.jwt.claim.sub', customer::text, true);
  select full_name, phone into msg, other_phone from public.accounts where id = customer;
  update public.accounts set full_name = 'Người dùng đã xoá', phone = '', avatar_path = null, is_admin = true
    where id = customer;
  assert not (select is_admin from public.accounts where id = customer), 'the tombstone made a customer an admin';
  assert (select phone from public.accounts where id = customer) = other_phone, 'the tombstone cleared a phone number';
  update public.accounts set full_name = msg where id = customer;

  perform set_config('request.jwt.claim.sub', linh::text, true);
  select display_name, avatar_path into msg, other_avatar from public.pros where id = linh;
  update public.pros set display_name = 'Chuyên viên đã rời nền tảng', published = false, avatar_path = null,
    identity_status = 'verified', identity_name = 'NGUYEN VAN A', rating_count = 999, suspended_at = null
    where id = linh;
  assert (select identity_status from public.pros where id = linh) = 'none', 'the tombstone handed out a badge';
  assert (select rating_count from public.pros where id = linh) < 999, 'the tombstone set a rating';
  perform set_config('request.jwt.claim.sub', '', true);
  update public.pros set display_name = msg, avatar_path = other_avatar, published = true where id = linh;

  raise notice 'a client holds no write privilege on the platform''s columns';
  assert not has_column_privilege('authenticated', 'public.accounts', 'is_admin', 'UPDATE'), 'is_admin is writable';
  assert not has_column_privilege('authenticated', 'public.accounts', 'phone', 'UPDATE'), 'phone is writable';
  assert has_column_privilege('authenticated', 'public.accounts', 'full_name', 'UPDATE'), 'a name is no longer editable';
  foreach msg in array array['identity_status', 'identity_name', 'suspended_at', 'rating_avg', 'rating_count',
                             'completed_jobs', 'response_minutes', 'slug', 'id'] loop
    assert not has_column_privilege('authenticated', 'public.pros', msg, 'UPDATE'), format('pros.%s is writable', msg);
  end loop;
  foreach msg in array array['display_name', 'bio', 'avatar_path', 'published', 'accepting_jobs', 'max_travel_km'] loop
    assert has_column_privilege('authenticated', 'public.pros', msg, 'UPDATE'), format('pros.%s is no longer editable', msg);
  end loop;
  assert not has_table_privilege('anon', 'public.accounts', 'UPDATE'), 'anon can update accounts';
  assert not has_table_privilege('anon', 'public.pros', 'UPDATE'), 'anon can update pros';

  raise notice 'deleting an account still anonymises it';
  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'leaving@example.invalid', jsonb_build_object('full_name', 'Sắp rời đi', 'phone', '0900 000 123'), now(), now())
  returning id into leaving;
  assert (select phone from public.accounts where id = leaving) = '+84900000123', 'a new account stores E.164';
  perform set_config('request.jwt.claim.sub', leaving::text, true);
  perform public.delete_my_account();
  assert (select full_name from public.accounts where id = leaving) = 'Người dùng đã xoá', 'the name survived deletion';
  assert (select phone from public.accounts where id = leaving) = '', 'the phone survived deletion';
  assert (select email from auth.users where id = leaving) is null, 'the email survived deletion';
  assert coalesce(current_setting('app.deleting_account', true), '') = '', 'the deletion flag outlived the deletion';

  raise notice 'a Google account starts without a phone number and cannot book until it has one';
  insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'google@example.invalid', '{"provider":"google","providers":["google"]}',
          jsonb_build_object('name', 'Khách Google'), now(), now())
  returning id into google_user;
  assert (select phone from public.accounts where id = google_user) = '', 'a Google account got a phone number';
  assert (select full_name from public.accounts where id = google_user) = 'Khách Google', 'Google''s name was lost';

  perform set_config('request.jwt.claim.sub', google_user::text, true);
  begin
    insert into public.pros (id, slug, city, district) values (google_user, 'khach-google-test', 'Hà Nội', 'Đống Đa');
    assert false, 'an account without a phone opened a freelancer profile';
  exception when check_violation then null;
  end;
  -- Everything else about this booking is valid (same address, a free slot), so
  -- the missing phone number is the only reason left to refuse it.
  insert into public.addresses (account_id, city, district, detail, lat, lng)
  select google_user, city, district, detail, lat, lng from public.addresses where id = addr
  returning id into google_addr;
  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, slot + interval '3 days', true, 21.0181, 105.829);
  assert msg is null, format('the control slot is not bookable: %s', msg);
  begin
    perform public.create_booking(linh, 'nail-design', 'simple', slot + interval '3 days', true, google_addr, 1, '');
    assert false, 'an account without a phone booked';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg like 'Cần thêm số điện thoại%', format('refused for another reason: %s', msg);
  end;

  raise notice 'a phone number is set once, normalised, and never shared';
  begin
    perform public.set_my_phone(other_phone);
    assert false, 'two accounts share a phone number';
  exception when check_violation then null;
  end;
  assert public.set_my_phone('0900 000 321') = '+84900000321', 'the number was not normalised';
  assert public.set_my_phone('+84900000321') = '+84900000321', 'repeating the same number is harmless';
  begin
    perform public.set_my_phone('0900 000 322');
    assert false, 'a phone number was changed without support';
  exception when check_violation then null;
  end;
  update public.accounts set phone = '+84900000999' where id = google_user;
  assert (select phone from public.accounts where id = google_user) = '+84900000321', 'a plain update changed the phone';
  assert coalesce(current_setting('app.setting_phone', true), '') = '', 'the phone flag outlived the call';

  begin
    insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
            'badphone@example.invalid', jsonb_build_object('full_name', 'Số sai', 'phone', '12345'), now(), now());
    assert false, 'an account with a malformed phone number was created';
  exception when check_violation then null;
  end;
  assert public.normalize_vn_phone('0968 112 233') = '+84968112233', 'local form';
  assert public.normalize_vn_phone('84968112233') = '+84968112233', 'country code without plus';
  assert public.normalize_vn_phone('0084968112233') = '+84968112233', 'international prefix';
  assert public.normalize_vn_phone('012345') is null, 'not a mobile number';

  perform set_config('request.jwt.claim.sub', linh::text, true);
  raise notice 'and cannot publish an empty profile';
  insert into public.pros (id, slug, city, district) values (customer, 'ngoc-han-test', 'Hà Nội', 'Đống Đa');
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    update public.pros set published = true where id = customer;
    assert false, 'an empty profile went public';
  exception when check_violation then null;
  end;
  delete from public.pros where id = customer;

  perform set_config('request.jwt.claim.sub', '', true);

  ---------------------------------------------------------------------------
  -- Postgres grants EXECUTE on every new function to PUBLIC. That has slipped
  -- through twice, so this asserts the list rather than trusting the habit: if
  -- a new function is reachable without signing in and is not one of the
  -- read-only pricing helpers, this fails.
  raise notice 'anonymous callers reach only the read-only helpers';
  select string_agg(p.proname, ', ' order by p.proname) into msg
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and has_function_privilege('anon', p.oid, 'EXECUTE')
    and p.proname <> all (array[
      'app_timezone', 'travel_distance_km', 'travel_fee', 'commission_for', 'is_urgent', 'build_quote',
      'service_duration_min', 'listed_price', 'within_working_hours', 'availability_problem', 'free_slots',
      'slugify', 'is_admin', 'is_pro', 'free_days',
      -- the feed: reporting and reading interest counts, and the content check
      'log_work_events', 'work_stats_30d', 'banned_content',
      -- called by a row level security policy
      'applied_to_casting'
    ]);
  assert msg is null, format('anon can execute: %s', msg);

  raise notice 'signed-in callers reach only their own actions';
  select string_agg(p.proname, ', ' order by p.proname) into msg
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and has_function_privilege('authenticated', p.oid, 'EXECUTE')
    and p.proname <> all (array[
      -- read-only helpers
      'app_timezone', 'travel_distance_km', 'travel_fee', 'commission_for', 'is_urgent', 'build_quote',
      'service_duration_min', 'listed_price', 'within_working_hours', 'availability_problem', 'free_slots',
      'slugify', 'is_admin', 'is_pro', 'log_work_events', 'work_stats_30d', 'banned_content', 'applied_to_casting',
      'free_days',
      -- the state machine and the things a person does to their own account
      'create_booking', 'confirm_booking', 'decline_booking', 'start_booking', 'complete_booking',
      'mark_no_show', 'cancel_booking', 'request_reschedule', 'respond_reschedule', 'post_job',
      'send_offer', 'accept_offer', 'withdraw_offer', 'write_review', 'reply_review', 'open_thread',
      'send_message', 'replace_working_hours', 'my_wallet_balance', 'mark_thread_read', 'delete_my_account',
      'set_my_phone', 'set_interests',
      -- photo & video, combos, casting calls, two-way reviews
      'set_booking_terms', 'deliver_booking', 'accept_delivery', 'link_bookings',
      'create_casting', 'close_casting', 'apply_casting', 'withdraw_application', 'decide_application',
      'review_customer',
      -- busy time, disputes, blocks, push, and the clip cap a storage policy asks
      'add_time_block', 'remove_time_block', 'dispute_no_show', 'block_user', 'unblock_user',
      'register_push_token', 'video_quota_ok',
      -- chat that closes, jobs either side finishes, referrals and vouchers
      'closes_at', 'confirm_booking_done', 'report_pro_no_show', 'my_referral_code', 'claim_referral',
      'apply_voucher', 'remove_voucher', 'chat_status', 'take_job', 'record_topup',
      -- admin decisions, which check is_admin() themselves
      'decide_identity_check', 'decide_no_show_compensation', 'set_pro_suspended', 'set_review_hidden', 'resolve_report',
      'admin_override_ai_decision'
    ]);
  assert msg is null, format('authenticated can execute: %s', msg);

end $$;


-- The three trades: photo & video, models, and what they changed about bookings,
-- the feed and the request board.
do $$
declare
  linh uuid; thu uuid; customer uuid; addr uuid; other_customer uuid; nobody uuid;
  b uuid; late uuid; makeup uuid; photos uuid; far uuid; gid uuid;
  casting uuid; nail_call uuid; first_app uuid; second_app uuid; thread uuid; beauty uuid;
  msg text; n int; w1 uuid; w1_slug text; events jsonb;
  p_city text; p_district text;
  monday date := current_date + (7 - ((extract(dow from current_date)::int + 6) % 7));
  at_ timestamptz;
begin
  select id into linh from public.pros where slug = 'linh-pham';          -- nail, not verified
  select id into thu from public.pros where slug = 'thu-anh';             -- makeup, verified
  select a.id into customer from public.accounts a where a.full_name = 'Ngọc Hân';
  select id into addr from public.addresses where account_id = customer;
  select a.id into other_customer from public.accounts a where a.full_name = 'Thảo Vy';

  -- The platform (no JWT subject) opens the new trades on both profiles.
  perform set_config('request.jwt.claim.sub', '', true);
  update public.pros set categories = categories || array['photophone', 'model-photo']::public.category_id[]
    where id in (linh, thu);

  ---------------------------------------------------------------------------
  raise notice 'model services are for verified adults only';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    insert into public.pro_services (pro_id, template_id) values (linh, 'model-hand');
    assert false, 'an unverified freelancer listed a model service';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg = 'Dịch vụ người mẫu chỉ dành cho tài khoản đã xác minh và đủ 18 tuổi.', format('refused for another reason: %s', msg);
  end;
  -- Listing it switched off is harmless and allowed.
  insert into public.pro_services (pro_id, template_id, active) values (linh, 'model-hand', false);
  begin
    update public.pro_services set active = true where pro_id = linh and template_id = 'model-hand';
    assert false, 'an unverified freelancer switched a model service on';
  exception when check_violation then null;
  end;

  -- Verified, but the card was never read for an age: not yet.
  perform set_config('request.jwt.claim.sub', thu::text, true);
  begin
    insert into public.pro_services (pro_id, template_id) values (thu, 'model-hand');
    assert false, 'a verified freelancer of unknown age listed a model service';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg like 'Dịch vụ người mẫu chỉ dành cho%', format('refused for another reason: %s', msg);
  end;
  -- Nor can a freelancer say it about themselves: the age is the platform's to write.
  update public.pros set adult = true, birth_year = 1990 where id = thu;
  assert (select adult is null and birth_year is null from public.pros where id = thu), 'a freelancer set their own age';
  -- /api/identity read the card: 18 or over.
  perform set_config('request.jwt.claim.sub', '', true);
  update public.pros set adult = true, birth_year = 1998 where id = thu;
  perform set_config('request.jwt.claim.sub', thu::text, true);
  insert into public.pro_services (pro_id, template_id) values (thu, 'model-hand');
  insert into public.pro_service_prices (pro_id, template_id, variant_id, price) values (thu, 'model-hand', '60m', 350000);
  at_ := ((monday + 2) + time '10:00') at time zone public.app_timezone();
  msg := public.availability_problem(thu, 'model-hand', '60m', 1, at_, true, 21.0181, 105.829);
  assert msg is null, format('a verified model is bookable: %s', msg);

  -- A badge that is taken away stops new bookings at once, listing or not.
  perform set_config('request.jwt.claim.sub', '', true);
  update public.pros set identity_status = 'pending' where id = thu;
  msg := public.availability_problem(thu, 'model-hand', '60m', 1, at_, true, 21.0181, 105.829);
  assert msg = 'Dịch vụ người mẫu chỉ dành cho tài khoản đã xác minh và đủ 18 tuổi.', format('an unverified model was bookable: %s', msg);
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.create_booking(thu, 'model-hand', '60m', at_, true, addr, 1, '');
    assert false, 'an unverified model was booked';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  update public.pros set identity_status = 'verified' where id = thu;

  -- Verified but under 18: the same refusal.
  update public.pros set adult = false, birth_year = 2010 where id = thu;
  msg := public.availability_problem(thu, 'model-hand', '60m', 1, at_, true, 21.0181, 105.829);
  assert msg like 'Dịch vụ người mẫu chỉ dành cho%', format('a minor was bookable as a model: %s', msg);
  update public.pros set adult = true, birth_year = 1998 where id = thu;
  msg := public.availability_problem(thu, 'model-hand', '60m', 1, at_, true, 21.0181, 105.829);
  assert msg is null, format('a verified adult model is not bookable: %s', msg);

  ---------------------------------------------------------------------------
  raise notice 'a photo session owes files, on a clock that starts at completion';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  insert into public.pro_services (pro_id, template_id) values (linh, 'photo-phone');
  insert into public.pro_service_prices (pro_id, template_id, variant_id, price) values (linh, 'photo-phone', '60m', 300000);

  perform set_config('request.jwt.claim.sub', customer::text, true);
  b := public.create_booking(linh, 'photo-phone', '60m',
    ((monday + 3) + time '14:00') at time zone public.app_timezone(), true, addr, 1, '');

  raise notice 'the customer sets the terms, and only while nothing has happened yet';
  perform public.set_booking_terms(b, 'commercial', true);
  assert (select usage_scope = 'commercial' and consent_repost from public.bookings where id = b), 'terms not saved';
  begin
    perform public.set_booking_terms(b, 'resale', true);
    assert false, 'an unknown usage scope was accepted';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.set_booking_terms(b, 'personal', false);
    assert false, 'the freelancer changed the customer''s terms';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.deliver_booking(b, 'https://drive.google.com/x', '');
    assert false, 'files were delivered before the session';
  exception when check_violation then null;
  end;

  perform public.confirm_booking(b);
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set starts_at = now() - interval '2 hours' where id = b;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.complete_booking(b);
  assert (select delivery_due_at between now() + interval '47 hours' and now() + interval '49 hours'
          from public.bookings where id = b), 'photo-phone promises files within 2 days';

  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.set_booking_terms(b, 'personal', false);
    assert false, 'terms changed after the session';
  exception when check_violation then null;
  end;

  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.deliver_booking(b, 'ftp://example.com/files', '');
    assert false, 'a non-web link was accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.deliver_booking(b, 'javascript:alert(1)', '');
    assert false, 'a script link was accepted';
  exception when check_violation then null;
  end;
  perform public.deliver_booking(b, 'https://drive.google.com/drive/folders/abc', 'Ảnh gốc và 20 ảnh chỉnh');
  assert (select delivered_at is not null from public.bookings where id = b), 'delivery not recorded';
  assert exists (select 1 from public.notifications where account_id = customer and kind = 'booking_delivered'
                 and link = '/bookings/' || b), 'the customer was not told the files arrived';

  perform set_config('request.jwt.claim.sub', customer::text, true);
  perform public.accept_delivery(b);
  assert (select delivery_accepted_at is not null from public.bookings where id = b), 'acceptance not recorded';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.deliver_booking(b, 'https://example.com/other', '');
    assert false, 'a delivery was changed after the customer accepted it';
  exception when check_violation then null;
  end;

  raise notice 'a nail set has no files to deliver';
  select id into beauty from public.bookings where pro_id = linh and status = 'completed' and template_id like 'nail-%' limit 1;
  begin
    perform public.deliver_booking(beauty, 'https://example.com/x', '');
    assert false, 'a beauty booking took a delivery';
  exception when check_violation then null;
  end;

  raise notice 'an overdue delivery is chased once';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  late := public.create_booking(linh, 'photo-phone', '60m',
    ((monday + 3) + time '17:00') at time zone public.app_timezone(), true, addr, 1, '');
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(late);
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set starts_at = now() - interval '5 hours' where id = late;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.complete_booking(late);
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set delivery_due_at = now() - interval '1 hour' where id = late;
  perform public.remind_overdue_deliveries();
  perform public.remind_overdue_deliveries();
  select count(*) into n from public.notifications
    where account_id = linh and kind = 'delivery_overdue' and link = '/bookings/' || late;
  assert n = 1, format('overdue reminders sent: %s', n);

  ---------------------------------------------------------------------------
  raise notice 'a combo links two or three of the customer''s own bookings, close in time';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  makeup := public.create_booking(thu, 'makeup-party', 'makeup',
    ((monday + 4) + time '10:00') at time zone public.app_timezone(), true, addr, 1, '');
  photos := public.create_booking(linh, 'photo-phone', '60m',
    ((monday + 4) + time '10:30') at time zone public.app_timezone(), true, addr, 1, '');
  far := public.create_booking(linh, 'photo-phone', '60m',
    ((monday + 4) + time '14:00') at time zone public.app_timezone(), true, addr, 1, '');

  begin
    perform public.link_bookings(array[makeup]);
    assert false, 'a combo of one was accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.link_bookings(array[makeup, far]);
    assert false, 'bookings four hours apart were linked';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg like '%60 phút%', format('refused for another reason: %s', msg);
  end;
  perform set_config('request.jwt.claim.sub', other_customer::text, true);
  begin
    perform public.link_bookings(array[makeup, photos]);
    assert false, 'somebody linked another customer''s bookings';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', customer::text, true);
  gid := public.link_bookings(array[makeup, photos]);
  assert (select count(*) from public.bookings where booking_group_id = gid) = 2, 'the combo was not recorded';
  begin
    perform public.link_bookings(array[photos, far]);
    assert false, 'a booking was pulled out of a live combo';
  exception when check_violation then null;
  end;

  raise notice 'when part of a combo falls through, the rest stands and the customer is told';
  perform set_config('request.jwt.claim.sub', thu::text, true);
  perform public.decline_booking(makeup, 'Trùng lịch');
  assert (select status from public.bookings where id = photos) = 'pending', 'the other booking was cancelled for them';
  assert exists (select 1 from public.notifications where account_id = customer and kind = 'combo_partial'
                 and link = '/bookings/' || photos), 'the customer was not told the rest of the combo stands';

  ---------------------------------------------------------------------------
  raise notice 'a freelancer rates a customer once, after the job';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.review_customer(b, 5, 'Tự đánh giá mình');
    assert false, 'a customer reviewed themselves';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.review_customer(photos, 5, '');
    assert false, 'a customer was reviewed before the job';
  exception when check_violation then null;
  end;
  perform public.review_customer(b, 5, 'Đúng giờ, dễ thương.');
  begin
    perform public.review_customer(b, 1, 'Sửa lại sau khi cãi nhau');
    assert false, 'a customer review was rewritten';
  exception when check_violation then null;
  end;
  assert (select rating from public.customer_reviews where booking_id = b) = 5, 'the first review did not stand';

  ---------------------------------------------------------------------------
  raise notice 'the content filter reads past accents and capitals, and not past context';
  assert public.banned_content('Tuyển mẫu KHOẢ THÂN nghệ thuật'), 'khoả thân';
  assert public.banned_content('can mau khoa than'), 'khoa than without accents';
  assert public.banned_content('Chụp ảnh nude nghệ thuật'), 'nude photos';
  assert public.banned_content('mẫu nội y cho shop'), 'nội y';
  assert public.banned_content('Clip 18+ thù lao cao'), '18+';
  assert public.banned_content('Phong cách sexy'), 'sexy';
  assert public.banned_content('Mẫu cần đóng phí hồ sơ 200k'), 'phí hồ sơ';
  assert public.banned_content('Vui lòng đặt cọc trước 500k'), 'đặt cọc trước';
  assert not public.banned_content('Sơn gel tone nude'), 'nude is a colour';
  assert not public.banned_content('Làm móng tay màu nude'), 'màu nude is a colour, not mẫu nude';
  assert not public.banned_content('son mau nude'), 'the colour typed without accents';
  assert public.banned_content('Tuyển mẫu nude'), 'a nude model';
  assert public.banned_content('Cần người làm mẫu nude'), 'modelling nude';
  assert not public.banned_content('Phục hồi da nhạy cảm'), 'sensitive skin is a service';
  assert not public.banned_content('Chụp lookbook bikini cho shop đồ bơi'), 'swimwear is legitimate';
  assert not public.banned_content('Wax sugar nách'), 'sugar wax';
  assert not public.banned_content('Họ hàng nói ý kiến về kiểu tóc'), 'everyday words that lose their accents';
  assert not public.banned_content('Kỷ yếu lớp 12A, năm 2018+ ai cũng được'), 'a year is not 18+';

  raise notice 'and it guards requests as well as casting calls';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.post_job('nail-gel', 'hand', now() + interval '3 days', true, addr, 1, 'Thợ phải chuyển khoản trước 100k');
    assert false, 'a request carrying a scam marker was posted';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg = 'Nội dung này không được phép trên 360dep.', format('refused for another reason: %s', msg);
  end;

  ---------------------------------------------------------------------------
  raise notice 'a casting call: who may post it';
  select city, district into p_city, p_district from public.pros where id = thu;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.create_casting('nail', 'Cần mẫu tay có thù lao', '', now() + interval '3 days',
      p_city, p_district, 1, 'paid', null, 200000);
    assert false, 'an unverified freelancer posted a paid call';
  exception when check_violation then null;
  end;
  begin
    perform public.create_casting('model-photo', 'Cần mẫu chụp lookbook', '', now() + interval '3 days',
      p_city, p_district, 1, 'free');
    assert false, 'an unverified freelancer posted a model call';
  exception when check_violation then null;
  end;
  -- Free and for their own trade is not enough any more: every call needs the badge.
  begin
    perform public.create_casting('nail', 'Cần 2 mẫu tay làm gel miễn phí', 'Cho phép chụp và đăng ảnh.',
      now() + interval '3 days', p_city, p_district, 2, 'free');
    assert false, 'an unverified freelancer posted a free call';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg = 'Tuyển mẫu chỉ mở cho tài khoản đã xác minh danh tính.', format('refused for another reason: %s', msg);
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  update public.pros set identity_status = 'verified' where id = linh;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  nail_call := public.create_casting('nail', 'Cần 2 mẫu tay làm gel miễn phí', 'Cho phép chụp và đăng ảnh.',
    now() + interval '3 days', p_city, p_district, 2, 'free');

  perform set_config('request.jwt.claim.sub', thu::text, true);
  begin
    perform public.create_casting('makeup', 'Tuyển mẫu chụp ảnh nude nghệ thuật', '', now() + interval '3 days',
      p_city, p_district, 1, 'free');
    assert false, 'a banned call was posted';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg = 'Nội dung này không được phép trên 360dep.', format('refused for another reason: %s', msg);
  end;
  begin
    perform public.create_casting('makeup', 'Cần mẫu makeup hôm qua', '', now() - interval '1 day',
      p_city, p_district, 1, 'free');
    assert false, 'a call in the past was posted';
  exception when check_violation then null;
  end;
  casting := public.create_casting('makeup', 'Cần mẫu makeup cô dâu chụp portfolio', 'Giảm 50% gói makeup.',
    now() + interval '3 days', p_city, p_district, 1, 'discount', 50);

  raise notice 'applying needs a phone number, and never to your own call';
  begin
    perform public.apply_casting(casting, 'Tự ứng tuyển');
    assert false, 'a freelancer applied to their own call';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'nophone@example.invalid', jsonb_build_object('name', 'Chưa có số'), now(), now())
  returning id into nobody;
  perform set_config('request.jwt.claim.sub', nobody::text, true);
  begin
    perform public.apply_casting(casting, 'Em muốn làm mẫu');
    assert false, 'an account without a phone applied';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg like 'Cần thêm số điện thoại%', format('refused for another reason: %s', msg);
  end;

  perform set_config('request.jwt.claim.sub', customer::text, true);
  first_app := public.apply_casting(casting, 'Em rảnh cả ngày ạ');
  begin
    perform public.apply_casting(casting, 'Lần nữa');
    assert false, 'the same person applied twice';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', other_customer::text, true);
  second_app := public.apply_casting(casting, 'Mình muốn thử');

  raise notice 'accepting stops at the number of models wanted, and opens a chat';
  perform set_config('request.jwt.claim.sub', other_customer::text, true);
  begin
    perform public.decide_application(second_app, true);
    assert false, 'an applicant accepted themselves';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', thu::text, true);
  thread := public.decide_application(first_app, true);
  assert thread is not null, 'no chat for the accepted model';
  assert exists (select 1 from public.messages where thread_id = thread), 'the chat is empty, so no inbox shows it';
  assert (select accepted_count from public.castings where id = casting) = 1, 'the accepted count did not move';
  begin
    perform public.decide_application(second_app, true);
    assert false, 'more models were accepted than wanted';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg = 'Đã đủ số mẫu cần tuyển.', format('refused for another reason: %s', msg);
  end;

  raise notice 'a withdrawal frees the place';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  perform public.withdraw_application(first_app);
  assert (select accepted_count from public.castings where id = casting) = 0, 'a withdrawal kept the place';
  perform set_config('request.jwt.claim.sub', thu::text, true);
  perform public.decide_application(second_app, true);

  raise notice 'a call closes itself when its time has passed';
  perform set_config('request.jwt.claim.sub', '', true);
  update public.castings set starts_at = now() - interval '1 hour' where id = casting;
  perform public.expire_stale_jobs();
  assert (select status from public.castings where id = casting) = 'closed', 'a past call stayed open';

  ---------------------------------------------------------------------------
  raise notice 'feed events are counted per post per call, capped, and never fail';
  select id, slug into w1, w1_slug from public.works order by sort_order limit 1;
  -- 60 impressions of one post (one call counts it once), then an open that is
  -- event number 61 and must be dropped.
  select jsonb_agg(jsonb_build_object('work', w1_slug, 'kind', 'impression')) into events from generate_series(1, 60);
  events := events || jsonb_build_array(jsonb_build_object('work', w1::text, 'kind', 'open'));
  perform public.log_work_events(events);
  assert (select impressions from public.work_stats_daily where work_id = w1) = 1,
    format('impressions: %s', (select impressions from public.work_stats_daily where work_id = w1));
  assert (select opens from public.work_stats_daily where work_id = w1) = 0, 'the 61st event was counted';

  -- Signed in: a tap on "book" only counts from a person (20260924100000).
  perform set_config('request.jwt.claim.sub', customer::text, true);
  n := public.log_work_events(jsonb_build_array(
    jsonb_build_object('work', w1::text, 'kind', 'open'),
    jsonb_build_object('work', w1_slug, 'kind', 'book_click'),
    jsonb_build_object('work', 'khong-co-bai-nay', 'kind', 'open'),
    jsonb_build_object('work', gen_random_uuid()::text, 'kind', 'open'),
    jsonb_build_object('work', w1::text, 'kind', 'like'),
    '"not an object"'::jsonb));
  assert n = 1, format('rows written: %s', n);
  perform set_config('request.jwt.claim.sub', '', true);
  assert public.log_work_events('{"not": "an array"}') = 0, 'a malformed batch was not ignored';
  assert (select opens + book_clicks from public.work_stats_daily where work_id = w1) = 2, 'id and slug both count';
  assert (select impressions from public.work_stats_30d() where work_id = w1) = 1, '30-day totals';

  ---------------------------------------------------------------------------
  raise notice 'interests: a few categories, once each';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  perform public.set_interests(array['nail', 'nail', 'photophone']::public.category_id[]);
  assert (select cardinality(interests) from public.accounts where id = customer) = 2, 'duplicates were kept';
  begin
    perform public.set_interests(array['nail', 'makeup', 'hair', 'skincare', 'massage', 'camera', 'photophone']::public.category_id[]);
    assert false, 'seven interests were accepted';
  exception when check_violation then null;
  end;

  raise notice 'a model profile has sane bounds';
  perform set_config('request.jwt.claim.sub', thu::text, true);
  begin
    insert into public.model_profiles (pro_id, height_cm) values (thu, 300);
    assert false, 'a height of three metres was accepted';
  exception when check_violation then null;
  end;
  insert into public.model_profiles (pro_id, height_cm, top_size, styles) values (thu, 165, 'S', array['Thanh lịch']);

  raise notice 'deleting an account gives back the place it held on a call';
  perform set_config('request.jwt.claim.sub', nobody::text, true);
  perform public.set_my_phone('0900 000 456');
  first_app := public.apply_casting(nail_call, 'Tay em đẹp ạ');
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.decide_application(first_app, true);
  assert (select accepted_count from public.castings where id = nail_call) = 1, 'the nail call did not count the model';
  perform set_config('request.jwt.claim.sub', nobody::text, true);
  perform public.delete_my_account();
  assert not exists (select 1 from public.casting_applications where account_id = nobody), 'an application survived deletion';
  assert (select accepted_count from public.castings where id = nail_call) = 0, 'a deleted account still holds a place';

  perform set_config('request.jwt.claim.sub', '', true);
end $$;


-- What the review of the release found (20260924*): who may read what, money
-- held until it is fair to pay, and the rules around time.
--
-- Row level security does not apply to the superuser this file runs as, so the
-- reads that test a policy switch to the API's role (`set local role`) for the
-- one query, and switch back before asserting.
do $$
declare
  linh uuid; thu uuid; customer uuid; other_customer uuid; addr uuid; stranger_pro uuid; admin_id uuid;
  leaving uuid; b1 uuid; b2 uuid; terms_booking uuid; blk uuid; debt uuid; thread uuid; report uuid;
  c1 uuid; app uuid; w uuid;
  msg text; n int; i int; total int; at_ timestamptz; today date; d date;
  p_city text; p_district text; extra uuid[] := '{}'; fake uuid := gen_random_uuid();
  claim public.no_show_compensation_requests;
  tz text := public.app_timezone();
  monday date := current_date + (7 - ((extract(dow from current_date)::int + 6) % 7));
begin
  select id into linh from public.pros where slug = 'linh-pham';
  select id into thu from public.pros where slug = 'thu-anh';
  select a.id into customer from public.accounts a where a.full_name = 'Ngọc Hân';
  select a.id into other_customer from public.accounts a where a.full_name = 'Thảo Vy';
  select id into addr from public.addresses where account_id = customer;
  -- A published freelancer with posts who has never had a booking with the customer.
  select p.id into stranger_pro from public.pros p
  where p.published and p.suspended_at is null and p.id not in (linh, thu)
    and not exists (select 1 from public.bookings b where b.pro_id = p.id and b.customer_id = customer)
    and exists (select 1 from public.works k where k.pro_id = p.id)
  order by p.slug limit 1;
  assert stranger_pro is not null, 'the demo data has no freelancer the customer never booked';

  ---------------------------------------------------------------------------
  raise notice 'a review of a customer is for the freelancers who meet them, not for every freelancer';
  -- Published as if the customer had reviewed back; the blind itself is tested at the end.
  update public.customer_reviews set published_at = now() where customer_id = customer and published_at is null;
  assert exists (select 1 from public.customer_reviews where customer_id = customer), 'no review of the customer to test with';

  perform set_config('request.jwt.claim.sub', stranger_pro::text, true);
  set local role authenticated;
  select count(*) into n from public.customer_reviews where customer_id = customer;
  reset role;
  assert n = 0, format('a freelancer who never met the customer read %s reviews of them', n);

  -- thu has had bookings with the customer (above), but did not write the review.
  perform set_config('request.jwt.claim.sub', thu::text, true);
  set local role authenticated;
  select count(*) into n from public.customer_reviews where customer_id = customer;
  reset role;
  assert n > 0, 'a freelancer with a booking with the customer cannot read their reviews';

  perform set_config('request.jwt.claim.sub', customer::text, true);
  set local role authenticated;
  select count(*) into n from public.customer_reviews where customer_id = customer;
  reset role;
  assert n > 0, 'the customer cannot read what was written about them';

  perform set_config('request.jwt.claim.sub', other_customer::text, true);
  set local role authenticated;
  select count(*) into n from public.customer_reviews where customer_id = customer;
  reset role;
  assert n = 0, 'another customer read reviews of someone else';

  ---------------------------------------------------------------------------
  raise notice 'a suspended freelancer leaves the marketplace: profile, posts and feed numbers';
  select count(*) into total from public.works where pro_id = stranger_pro;
  select id into w from public.works where pro_id = stranger_pro order by created_at limit 1;
  perform set_config('request.jwt.claim.sub', '', true);
  perform public.log_work_events(jsonb_build_array(jsonb_build_object('work', w::text, 'kind', 'impression')));
  assert exists (select 1 from public.work_stats_30d() s where s.work_id = w), 'a listed post has no numbers';
  update public.pros set suspended_at = now() where id = stranger_pro;
  assert not exists (select 1 from public.work_stats_30d() s where s.work_id = w), 'a suspended freelancer''s post still ranks';

  set local role anon;
  select count(*) into n from public.pros where id = stranger_pro;
  reset role;
  assert n = 0, 'an anonymous visitor still sees a suspended profile';
  set local role anon;
  select count(*) into n from public.works where pro_id = stranger_pro;
  reset role;
  assert n = 0, format('an anonymous visitor still sees %s posts of a suspended freelancer', n);

  perform set_config('request.jwt.claim.sub', customer::text, true);
  set local role authenticated;
  select count(*) into n from public.pros where id = stranger_pro;
  reset role;
  assert n = 0, 'a signed-in stranger still sees a suspended profile';

  perform set_config('request.jwt.claim.sub', stranger_pro::text, true);
  set local role authenticated;
  select count(*) into n from public.works where pro_id = stranger_pro;
  reset role;
  assert n = total, format('the suspended freelancer sees %s of their own %s posts', n, total);

  -- A customer's own booking keeps its freelancer, suspended or not.
  perform set_config('request.jwt.claim.sub', '', true);
  update public.pros set suspended_at = now() where id = linh;
  perform set_config('request.jwt.claim.sub', customer::text, true);
  set local role authenticated;
  select count(*) into n from public.pros where id = linh;
  reset role;
  assert n = 1, 'a customer lost the freelancer on their own booking to a suspension';
  perform set_config('request.jwt.claim.sub', '', true);
  update public.pros set suspended_at = null where id in (linh, stranger_pro);

  ---------------------------------------------------------------------------
  raise notice 'an anonymous caller''s saves and book taps are not counted';
  today := (now() at time zone tz)::date;
  select id into w from public.works where pro_id = linh order by created_at limit 1;
  perform set_config('request.jwt.claim.sub', '', true);
  perform public.log_work_events(jsonb_build_array(jsonb_build_object('work', w::text, 'kind', 'open')));
  select saves + book_clicks, opens into total, n from public.work_stats_daily where work_id = w and day = today;
  perform public.log_work_events(jsonb_build_array(
    jsonb_build_object('work', w::text, 'kind', 'save'),
    jsonb_build_object('work', w::text, 'kind', 'book_click'),
    jsonb_build_object('work', w::text, 'kind', 'open')));
  assert (select saves + book_clicks from public.work_stats_daily where work_id = w and day = today) = total,
    'an anonymous save or book tap was counted';
  assert (select opens from public.work_stats_daily where work_id = w and day = today) = n + 1,
    'an anonymous open was not counted';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  perform public.log_work_events(jsonb_build_array(
    jsonb_build_object('work', w::text, 'kind', 'save'),
    jsonb_build_object('work', w::text, 'kind', 'book_click')));
  assert (select saves + book_clicks from public.work_stats_daily where work_id = w and day = today) = total + 2,
    'a signed-in save and book tap were not counted';

  ---------------------------------------------------------------------------
  raise notice 'a paid call needs a poster who is 18 or over';
  select city, district into p_city, p_district from public.pros where id = thu;
  -- linh was verified for the casting tests above, but her age was never read.
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.create_casting('nail', 'Cần mẫu tay có thù lao', '', now() + interval '3 days',
      p_city, p_district, 1, 'paid', null, 200000);
    assert false, 'a paid call was posted by someone whose age is unknown';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg like 'Tin tuyển mẫu có thù lao chỉ dành cho%', format('refused for another reason: %s', msg);
  end;

  raise notice 'the poster hears about an applicant once, not on every re-apply';
  perform set_config('request.jwt.claim.sub', thu::text, true);
  c1 := public.create_casting('makeup', 'Cần mẫu makeup tiệc tối', '', now() + interval '4 days',
    p_city, p_district, 2, 'free');
  extra := extra || c1;
  perform set_config('request.jwt.claim.sub', customer::text, true);
  app := public.apply_casting(c1, 'Em muốn thử ạ');
  perform public.withdraw_application(app);
  assert public.apply_casting(c1, 'Em đổi ý, vẫn muốn làm ạ') = app, 're-applying made a new application';
  perform public.withdraw_application(app);
  perform public.apply_casting(c1, 'Lần cuối ạ');
  select count(*) into n from public.notifications
  where account_id = thu and kind = 'casting_application' and link = '/tuyen-mau/' || c1;
  assert n = 1, format('the poster was notified %s times about one applicant', n);

  raise notice 'at most five calls a week, and closing one does not make room';
  perform set_config('request.jwt.claim.sub', thu::text, true);
  select count(*) into n from public.castings where pro_id = thu and created_at > now() - interval '7 days';
  while n < 5 loop
    c1 := public.create_casting('makeup', 'Cần mẫu makeup buổi ' || n, '', now() + interval '5 days',
      p_city, p_district, 1, 'free');
    extra := extra || c1;
    perform public.close_casting(c1);
    n := n + 1;
  end loop;
  begin
    perform public.create_casting('makeup', 'Cần mẫu makeup thêm một buổi', '', now() + interval '5 days',
      p_city, p_district, 1, 'free');
    assert false, 'a sixth call in a week was posted';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg like 'Mỗi tuần đăng tối đa 5%', format('refused for another reason: %s', msg);
  end;
  -- Leave thu's week as the rest of the suite expects: the API tests post a call too.
  perform set_config('request.jwt.claim.sub', '', true);
  delete from public.castings where id = any (extra);

  ---------------------------------------------------------------------------
  raise notice 'the terms are fixed once the freelancer has accepted them';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  terms_booking := public.create_booking(linh, 'photo-phone', '60m',
    ((monday + 1) + time '11:00') at time zone tz, true, addr, 1, '');
  assert exists (select 1 from public.notifications where account_id = linh and kind = 'booking_new'
                 and link = '/bookings/' || terms_booking), 'the new-booking notification does not open the booking';
  perform public.set_booking_terms(terms_booking, 'commercial', false);
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(terms_booking);
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.set_booking_terms(terms_booking, 'personal', true);
    assert false, 'the terms changed after the freelancer accepted them';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg like 'Chỉ đổi được thoả thuận khi lịch còn chờ%', format('refused for another reason: %s', msg);
  end;
  assert (select usage_scope = 'commercial' and not consent_repost from public.bookings where id = terms_booking),
    'the accepted terms moved';
  perform public.cancel_booking(terms_booking, 'Xong phần kiểm tra');

  ---------------------------------------------------------------------------
  raise notice 'a booking made at night gives the freelancer until the morning';
  d := monday + 7;
  -- Daytime: two hours, as before.
  assert public.confirm_deadline(((d + 1) + time '15:00') at time zone tz, (d + time '14:00') at time zone tz)
       = ((d + time '16:00') at time zone tz), 'daytime: two hours';
  assert public.confirm_deadline(((d + 1) + time '15:00') at time zone tz, (d + time '20:59') at time zone tz)
       = ((d + time '22:59') at time zone tz), '20:59 is still daytime';
  -- Overnight: ten the next morning.
  assert public.confirm_deadline(((d + 1) + time '15:00') at time zone tz, (d + time '21:00') at time zone tz)
       = (((d + 1) + time '10:00') at time zone tz), '21:00 waits for the morning';
  assert public.confirm_deadline(((d + 1) + time '15:00') at time zone tz, (d + time '23:00') at time zone tz)
       = (((d + 1) + time '10:00') at time zone tz), '23:00 waits for the morning';
  assert public.confirm_deadline(((d + 1) + time '15:00') at time zone tz, ((d + 1) + time '02:00') at time zone tz)
       = (((d + 1) + time '10:00') at time zone tz), 'after midnight, the same morning';
  assert public.confirm_deadline((d + time '15:00') at time zone tz, (d + time '07:30') at time zone tz)
       = ((d + time '10:00') at time zone tz), '07:30 is still night';
  -- Never later than an hour before the start.
  assert public.confirm_deadline(((d + 1) + time '09:00') at time zone tz, (d + time '23:00') at time zone tz)
       = (((d + 1) + time '08:00') at time zone tz), 'an early start is answered an hour before';
  -- Never less time than the old rule gave.
  assert public.confirm_deadline((d + time '09:30') at time zone tz, (d + time '07:00') at time zone tz)
       = ((d + time '09:00') at time zone tz), 'the two hours still hold before an early start';
  assert public.confirm_deadline(((d + 1) + time '00:30') at time zone tz, (d + time '23:00') at time zone tz)
       = (((d + 1) + time '00:30') at time zone tz), 'never past the start';

  ---------------------------------------------------------------------------
  raise notice 'a no-show pays the travel fee after 24 hours, unless the customer disputes it';
  perform set_config('request.jwt.claim.sub', '', true);
  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'admin-test@example.invalid', jsonb_build_object('full_name', 'Quản trị thử'), now(), now())
  returning id into admin_id;
  update public.accounts set is_admin = true where id = admin_id;

  perform set_config('request.jwt.claim.sub', customer::text, true);
  b1 := public.create_booking(linh, 'nail-design', 'simple', ((monday + 2) + time '10:00') at time zone tz, true, addr, 1, '');
  b2 := public.create_booking(linh, 'nail-design', 'simple', ((monday + 2) + time '14:00') at time zone tz, true, addr, 1, '');
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(b1);
  perform public.confirm_booking(b2);
  -- Into the past, each with a travel fee to pay back.
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set starts_at = now() - interval '1 hour', travel_fee = 30000 where id = b1;
  update public.bookings set starts_at = now() - interval '4 hours', travel_fee = 20000 where id = b2;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.mark_no_show(b1, 'Khách không nghe máy');
  perform public.mark_no_show(b2, 'Khách không có nhà');

  select * into claim from public.no_show_compensation_requests where booking_id = b1;
  assert claim.status = 'pending' and claim.amount = 30000, 'the no-show claim was not filed';
  assert claim.release_at between now() + interval '23 hours' and now() + interval '25 hours',
    'the credit is not held for 24 hours';
  assert not exists (select 1 from public.wallet_entries where booking_id in (b1, b2) and kind = 'no_show_comp'),
    'the credit was paid before the 24 hours';
  perform set_config('request.jwt.claim.sub', '', true);
  assert public.release_no_show_credits() = 0, 'a claim was released inside its 24 hours';

  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.dispute_no_show(b1, 'Tôi có mặt đúng giờ mà.');
    assert false, 'the freelancer disputed their own report';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.dispute_no_show(b1, 'Sai');
    assert false, 'a dispute without a reason was filed';
  exception when check_violation then null;
  end;
  report := public.dispute_no_show(b1, 'Em có ở nhà, chị ấy không gọi cửa.');
  assert (select reason = 'no_show_dispute' and target_account_id = linh and status = 'open'
          from public.reports where id = report), 'the dispute left no report for the admins';
  assert (select disputed_at is not null and dispute_report_id = report
          from public.no_show_compensation_requests where booking_id = b1), 'the dispute did not hold the credit';
  assert exists (select 1 from public.notifications where account_id = admin_id and kind = 'no_show_disputed'),
    'the admins were not told about the dispute';
  assert exists (select 1 from public.notifications where account_id = linh and kind = 'no_show_disputed'
                 and link = '/bookings/' || b1), 'the freelancer was not told about the dispute';
  begin
    perform public.dispute_no_show(b1, 'Em khiếu nại thêm lần nữa.');
    assert false, 'the same no-show was disputed twice';
  exception when check_violation then null;
  end;

  -- b2: more than 24 hours ago and never disputed. It can no longer be disputed,
  -- and the credit is paid; b1's stays held although its 24 hours are up too.
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set cancelled_at = now() - interval '25 hours' where id = b2;
  update public.no_show_compensation_requests set release_at = now() - interval '1 hour' where booking_id in (b1, b2);
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.dispute_no_show(b2, 'Em có ở nhà, chị ấy không gọi cửa.');
    assert false, 'a no-show was disputed after 24 hours';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg like 'Đã quá 24 giờ%', format('refused for another reason: %s', msg);
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  assert public.release_no_show_credits() = 1, 'the undisputed claim was not released';
  assert public.release_no_show_credits() = 0, 'a claim was released twice';
  assert (select amount from public.wallet_entries where booking_id = b2 and kind = 'no_show_comp') = 20000,
    'the undisputed credit did not reach the wallet';
  assert not exists (select 1 from public.wallet_entries where booking_id = b1 and kind = 'no_show_comp'),
    'a disputed credit was paid without an admin';

  -- An admin decides the disputed one, and the dispute closes with it.
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  perform public.decide_no_show_compensation(
    (select id from public.no_show_compensation_requests where booking_id = b1), false, 'Khách gửi ảnh có ở nhà.');
  assert not exists (select 1 from public.wallet_entries where booking_id = b1 and kind = 'no_show_comp'),
    'a rejected claim was paid';
  assert (select status from public.reports where id = report) = 'resolved', 'the dispute stayed open after the decision';

  ---------------------------------------------------------------------------
  raise notice 'a wallet past its limit takes no new booking and cannot switch itself back on';
  at_ := ((monday + 1) + time '10:00') at time zone tz;
  perform set_config('request.jwt.claim.sub', customer::text, true);
  msg := public.availability_problem(thu, 'makeup-party', 'makeup', 1, at_, true, 21.0181, 105.829);
  assert msg is null, format('the control slot is not bookable: %s', msg);

  perform set_config('request.jwt.claim.sub', '', true);
  insert into public.wallet_entries (pro_id, kind, amount, note)
  values (thu, 'adjustment', -5000000, 'Kiểm tra hạn mức ví')
  returning id into debt;

  perform set_config('request.jwt.claim.sub', customer::text, true);
  msg := public.availability_problem(thu, 'makeup-party', 'makeup', 1, at_, true, 21.0181, 105.829);
  assert msg = 'Chuyên viên đang tạm không nhận job mới.', format('a freelancer in debt was bookable: %s', msg);
  begin
    perform public.create_booking(thu, 'makeup-party', 'makeup', at_, true, addr, 1, '');
    assert false, 'a freelancer past the wallet limit was booked';
  exception when check_violation then null;
  end;
  -- The freelancer asking is told why.
  perform set_config('request.jwt.claim.sub', thu::text, true);
  msg := public.availability_problem(thu, 'makeup-party', 'makeup', 1, at_, true, 21.0181, 105.829);
  assert msg = 'Thanh toán phí của đơn trước để nhận lịch mới.', format('the freelancer was not told why: %s', msg);

  perform set_config('request.jwt.claim.sub', '', true);
  perform public.enforce_wallet_threshold();
  assert exists (select 1 from public.notifications where account_id = thu and kind = 'fee_due'),
    'the hourly check did not ask for the fee';
  -- Switching jobs off is always allowed; back on, not while the fee is owed.
  perform set_config('request.jwt.claim.sub', thu::text, true);
  update public.pros set accepting_jobs = false where id = thu;
  begin
    update public.pros set accepting_jobs = true where id = thu;
    assert false, 'a freelancer past the wallet limit switched jobs back on';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg = 'Thanh toán phí của đơn trước để nhận lịch mới.', format('refused for another reason: %s', msg);
  end;
  -- Topped up, they can.
  perform set_config('request.jwt.claim.sub', '', true);
  delete from public.wallet_entries where id = debt;
  perform set_config('request.jwt.claim.sub', thu::text, true);
  update public.pros set accepting_jobs = true where id = thu;
  assert (select accepting_jobs from public.pros where id = thu), 'a topped-up freelancer could not switch jobs back on';

  ---------------------------------------------------------------------------
  raise notice 'a time block is busy time: nothing is booked or offered inside it';
  at_ := ((monday + 1) + time '15:00') at time zone tz;
  perform set_config('request.jwt.claim.sub', customer::text, true);
  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, at_, true, 21.0181, 105.829);
  assert msg is null, format('the control slot is not bookable: %s', msg);
  begin
    perform public.add_time_block(at_, at_ + interval '1 hour', '');
    assert false, 'a customer blocked time';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.add_time_block(at_, at_ - interval '1 hour', '');
    assert false, 'a block that ends before it starts was accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.add_time_block(now() - interval '3 hours', now() - interval '1 hour', '');
    assert false, 'a block in the past was accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.add_time_block(now() + interval '61 days', now() + interval '62 days', '');
    assert false, 'a block beyond 60 days was accepted';
  exception when check_violation then null;
  end;
  blk := public.add_time_block(at_ - interval '30 minutes', at_ + interval '1 hour', 'Đi khám răng');

  perform set_config('request.jwt.claim.sub', customer::text, true);
  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, at_, true, 21.0181, 105.829);
  assert msg = 'Khung giờ này đã có lịch khác.', format('a slot inside a block: %s', msg);
  -- 75 minutes and the 30-minute travel buffer from 13:00 run into a block at 14:30.
  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, at_ - interval '2 hours', true, 21.0181, 105.829);
  assert msg = 'Khung giờ này đã có lịch khác.', format('the travel buffer ran into a block: %s', msg);
  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, at_ + interval '1 hour', true, 21.0181, 105.829);
  assert msg is null, format('the slot right after a block: %s', msg);
  select count(*) into n
  from public.free_slots(linh, 'nail-design', 'simple', 1, monday + 1, true, 21.0181, 105.829) s
  where s >= at_ - interval '30 minutes' and s < at_ + interval '1 hour';
  assert n = 0, format('%s slots were offered inside a block', n);

  -- Private to its owner.
  set local role authenticated;
  select count(*) into n from public.time_blocks where id = blk;
  reset role;
  assert n = 0, 'a customer read a freelancer''s time block';
  perform set_config('request.jwt.claim.sub', thu::text, true);
  begin
    perform public.remove_time_block(blk);
    assert false, 'another freelancer removed a time block';
  exception when no_data_found then null;
  end;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  set local role authenticated;
  select count(*) into n from public.time_blocks where id = blk;
  reset role;
  assert n = 1, 'the freelancer cannot read their own time block';
  perform public.remove_time_block(blk);
  perform set_config('request.jwt.claim.sub', customer::text, true);
  msg := public.availability_problem(linh, 'nail-design', 'simple', 1, at_, true, 21.0181, 105.829);
  assert msg is null, format('a removed block still blocks: %s', msg);

  ---------------------------------------------------------------------------
  raise notice 'free days are the days free_slots fills, never a Sunday or the past';
  select count(*) into n from public.free_days(linh, 'nail-design', 'simple', 1, monday, 7, true, 21.0181, 105.829);
  assert n between 1 and 6, format('free days in a week: %s', n);
  assert not exists (
    select 1 from public.free_days(linh, 'nail-design', 'simple', 1, monday, 7, true, 21.0181, 105.829) f
    where extract(dow from f) = 0
  ), 'a Sunday was listed as free';
  select count(*) into n from public.free_days(linh, 'nail-design', 'simple', 1, current_date, 60, true, 21.0181, 105.829);
  assert n <= 21, format('%s days came back; the cap is 21', n);
  select count(*) into n from public.free_days(linh, 'nail-design', 'simple', 1, current_date - 10, 5, true, 21.0181, 105.829);
  assert n = 0, 'days in the past were listed';
  select f into d from public.free_days(linh, 'nail-design', 'simple', 1, monday, 7, true, 21.0181, 105.829) f limit 1;
  assert exists (select 1 from public.free_slots(linh, 'nail-design', 'simple', 1, d, true, 21.0181, 105.829)),
    'a day listed as free has no slot';

  ---------------------------------------------------------------------------
  raise notice 'platform settings: one row, anyone reads it, only an admin writes it';
  assert (select count(*) from public.platform_settings) = 1, 'platform settings is not one row';
  begin
    insert into public.platform_settings (id) values (false);
    assert false, 'a second settings row was accepted';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  select count(*) into n from public.platform_settings;
  reset role;
  assert n = 1, 'an anonymous visitor cannot read the platform settings';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  set local role authenticated;
  update public.platform_settings set support_zalo = '0900000000';
  get diagnostics n = row_count;
  reset role;
  assert n = 0, 'a customer changed the platform settings';
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  set local role authenticated;
  update public.platform_settings set support_zalo = '0900000000';
  get diagnostics n = row_count;
  reset role;
  assert n = 1, 'an admin cannot change the platform settings';
  update public.platform_settings set support_zalo = null;

  ---------------------------------------------------------------------------
  raise notice 'a block stops messages both ways, and only the blocker sees it';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  blk := public.create_booking(linh, 'nail-design', 'simple',
    ((monday + 3) + time '09:00') at time zone tz, true, addr, 1, '');
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(blk);
  perform set_config('request.jwt.claim.sub', customer::text, true);
  thread := public.open_thread(linh, blk);
  perform public.send_message(thread, 'Chị ơi em ở tầng 5 nhé');
  begin
    perform public.block_user(customer);
    assert false, 'an account blocked itself';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.block_user(customer);
  perform public.block_user(customer);
  begin
    perform public.send_message(thread, 'Chào em');
    assert false, 'the blocker still sent a message';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.send_message(thread, 'Chị ơi?');
    assert false, 'a blocked account sent a message';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg = 'Không thể nhắn tin với tài khoản này.', format('refused for another reason: %s', msg);
  end;
  begin
    perform public.open_thread(linh, blk);
    assert false, 'a blocked account opened a conversation';
  exception when check_violation then null;
  end;
  set local role authenticated;
  select count(*) into n from public.user_blocks where blocked = customer;
  reset role;
  assert n = 0, 'the blocked side can see who blocked them';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  set local role authenticated;
  select count(*) into n from public.user_blocks where blocked = customer;
  reset role;
  assert n = 1, 'the blocker cannot see their own block';
  perform public.unblock_user(customer);
  perform set_config('request.jwt.claim.sub', customer::text, true);
  perform public.send_message(thread, 'Chị ơi em ở tầng 5 nhé');
  perform public.cancel_booking(blk, 'Xong phần kiểm tra chặn');

  ---------------------------------------------------------------------------
  raise notice 'push tokens: Expo only, one account per token, and a notification queues a push';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.register_push_token('https://example.com/hook', 'ios');
    assert false, 'a token that is not Expo''s was accepted';
  exception when check_violation then null;
  end;
  perform public.register_push_token('ExponentPushToken[rules-test-0000000001]', 'ios');
  assert (select account_id from public.push_tokens where token = 'ExponentPushToken[rules-test-0000000001]') = customer,
    'the token was not registered';
  -- The same phone, now signed in as someone else.
  perform set_config('request.jwt.claim.sub', other_customer::text, true);
  perform public.register_push_token('ExponentPushToken[rules-test-0000000001]', 'android');
  assert (select account_id = other_customer and platform = 'android' from public.push_tokens
          where token = 'ExponentPushToken[rules-test-0000000001]'), 'the token did not move to the account signed in now';
  for i in 2..12 loop
    perform public.register_push_token(format('ExponentPushToken[rules-test-%s]', lpad(i::text, 10, '0')), 'ios');
  end loop;
  assert (select count(*) from public.push_tokens where account_id = other_customer) = 10, 'more than ten tokens were kept';

  perform set_config('request.jwt.claim.sub', '', true);
  perform public.notify(other_customer, 'push_test', 'Thử thông báo', 'Nội dung thử', '/me');
  assert exists (select 1 from public.notifications where account_id = other_customer and kind = 'push_test'),
    'a notification with a phone to push to was not written';
  if to_regclass('net.http_request_queue') is not null then
    execute 'select count(*) from net.http_request_queue where url = $1'
      into n using 'https://exp.host/--/api/v2/push/send';
    assert n > 0, 'no push was queued for the notification';
  else
    raise notice 'pg_net is not installed here; the push itself is not exercised';
  end if;
  -- Nothing real to send to: leave no tokens behind for the API tests' notifications.
  delete from public.push_tokens where token like 'ExponentPushToken[rules-test-%';

  ---------------------------------------------------------------------------
  raise notice 'storage: nobody lists other people''s files, and 30 clips is the ceiling';
  assert not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname in ('public can view images', 'public can view videos')
  ), 'the public listing policies are back';
  begin
    begin
      insert into storage.objects (bucket_id, name)
      select 'videos', fake::text || '/' || g || '.mp4' from generate_series(1, 29) g;
    exception when others then
      raise notice 'storage.objects is not writable here (%); the clip cap is not exercised', sqlerrm;
      raise sqlstate 'U0002';
    end;
    perform set_config('request.jwt.claim.sub', fake::text, true);
    assert public.video_quota_ok(), 'the 30th clip was refused';
    insert into storage.objects (bucket_id, name) values ('videos', fake::text || '/30.mp4');
    begin
      perform public.video_quota_ok();
      assert false, 'a 31st clip was allowed';
    exception when check_violation then
      get stacked diagnostics msg = message_text;
      assert msg like 'Mỗi tài khoản lưu tối đa 30 clip%', format('refused for another reason: %s', msg);
    end;
    -- Undo the fake rows: nothing else should ever see them.
    raise sqlstate 'U0001';
  exception when sqlstate 'U0001' or sqlstate 'U0002' then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);

  assert to_regclass('public.notifications_unread_idx') is not null, 'the unread-notifications index is missing';
  assert to_regclass('public.no_show_compensation_requests_pro_idx') is not null
     and to_regclass('public.no_show_compensation_requests_decided_by_idx') is not null,
    'a foreign key on no-show claims is not indexed';

  ---------------------------------------------------------------------------
  raise notice 'deleting an account takes its push tokens and blocks with it';
  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'leaving-2@example.invalid', jsonb_build_object('full_name', 'Rời đi lần hai', 'phone', '0900 000 789'), now(), now())
  returning id into leaving;
  perform set_config('request.jwt.claim.sub', leaving::text, true);
  perform public.register_push_token('ExponentPushToken[rules-test-leaving01]', 'ios');
  perform public.block_user(linh);
  perform public.delete_my_account();
  assert not exists (select 1 from public.push_tokens where account_id = leaving), 'a push token survived deletion';
  assert not exists (select 1 from public.user_blocks where blocker = leaving or blocked = leaving), 'a block survived deletion';

  perform set_config('request.jwt.claim.sub', '', true);
  raise notice 'ALL DATABASE RULES PASS';
end $$;

-- How a connection ends: chat, finishing a job, reviews, referrals.
do $$
declare
  linh uuid; thu uuid; customer uuid; addr uuid; b uuid; b2 uuid; b3 uuid; thread uuid; general uuid;
  friend uuid; friend_addr uuid; code text; v uuid; n int; msg text; hidden boolean; bal int;
  monday date := current_date + (7 - ((extract(dow from current_date)::int + 6) % 7));
  tz text := public.app_timezone();
begin
  select id into linh from public.pros where slug = 'linh-pham';
  select id into thu from public.pros where slug = 'thu-anh';
  select a.id into customer from public.accounts a where a.full_name = 'Ngọc Hân';
  select id into addr from public.addresses where account_id = customer;

  ---------------------------------------------------------------------------
  raise notice 'no chat before a match';
  -- A brand-new customer who has never booked linh.
  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'friend@example.invalid', jsonb_build_object('full_name', 'Bạn Mới', 'phone', '0900 000 456'), now(), now())
  returning id into friend;
  insert into public.addresses (account_id, city, district, detail, lat, lng, is_default)
  select friend, city, district, detail, lat, lng, true from public.addresses where id = addr
  returning id into friend_addr;

  perform set_config('request.jwt.claim.sub', friend::text, true);
  begin
    perform public.open_thread(linh, null);
    assert false, 'a question from the profile opened a chat';
  exception when check_violation then null;
  end;

  ---------------------------------------------------------------------------
  raise notice 'the referral code: once, for a new account, never your own';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  code := public.my_referral_code();
  assert code ~ '^[A-HJ-NP-Z2-9]{6}$', format('code %s', code);
  assert public.my_referral_code() = code, 'the code changed on the second ask';
  begin
    perform public.claim_referral(code);
    assert false, 'an account used its own code';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', friend::text, true);
  begin
    perform public.claim_referral('ZZZZZZ');
    assert false, 'an unknown code was accepted';
  exception when check_violation then null;
  end;
  perform public.claim_referral(lower(code));
  assert (select referred_by from public.accounts where id = friend) = customer, 'the referral was not recorded';
  begin
    perform public.claim_referral(code);
    assert false, 'a second code was accepted';
  exception when check_violation then null;
  end;

  ---------------------------------------------------------------------------
  raise notice 'a booking''s chat opens when the freelancer accepts';
  b := public.create_booking(linh, 'nail-design', 'simple',
    ((monday + 5) + time '09:00') at time zone tz, true, friend_addr, 1, '');
  begin
    perform public.open_thread(linh, b);
    assert false, 'a chat opened before the freelancer accepted';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(b);
  perform set_config('request.jwt.claim.sub', friend::text, true);
  thread := public.open_thread(linh, b);
  assert public.chat_status((select t from public.threads t where id = thread)) = 'open', 'an accepted booking''s chat is not open';
  perform public.send_message(thread, 'Số em 0987 654 321 nha chị');
  perform public.send_message(thread, 'Em ở tầng 5');

  raise notice 'a message notifies the other side once per conversation until read';
  select count(*) into n from public.notifications
    where account_id = linh and kind = 'message_new' and link = '/tin-nhan/' || thread and read_at is null;
  assert n = 1, format('unread message notifications: %s', n);
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.mark_thread_read(thread);
  assert not exists (select 1 from public.notifications
    where account_id = linh and kind = 'message_new' and link = '/tin-nhan/' || thread and read_at is null),
    'reading the conversation left its notification unread';
  perform set_config('request.jwt.claim.sub', friend::text, true);

  raise notice 'the customer confirms it is done; commission charged, referral paid';
  begin
    perform public.confirm_booking_done(b);
    assert false, 'a future job was confirmed done';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set starts_at = now() - interval '3 hours' where id = b;
  perform set_config('request.jwt.claim.sub', friend::text, true);
  perform public.confirm_booking_done(b);
  assert (select status from public.bookings where id = b) = 'completed', 'the customer could not finish the job';
  assert exists (select 1 from public.wallet_entries where booking_id = b and kind = 'commission'), 'no commission on a customer-finished job';
  assert (select count(*) from public.vouchers where account_id in (friend, customer) and source = 'referral') = 2,
    'the first completed booking did not reward both sides';
  assert exists (select 1 from public.referral_rewards where referee = friend and kind = 'customer'), 'no reward row';

  raise notice 'the chat ends with the job';
  assert public.chat_status((select t from public.threads t where id = thread)) = 'closed', 'a finished job''s chat is still open';
  begin
    perform public.send_message(thread, 'Chị ơi');
    assert false, 'a finished job''s chat took a message';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.send_message(thread, 'Cảm ơn em');
    assert false, 'the freelancer wrote after the job';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', friend::text, true);

  ---------------------------------------------------------------------------
  raise notice 'reviews: blind, tagged, in a window, one reply';
  begin
    perform public.write_review(b, 2, array['Đúng giờ'], 'Không như mong đợi lắm.');
    assert false, 'two stars without saying what went wrong';
  exception when check_violation then null;
  end;
  begin
    perform public.write_review(b, 5, array['Tuyệt cú mèo'], 'Rất hài lòng với buổi làm này.');
    assert false, 'a tag outside the list';
  exception when check_violation then null;
  end;
  perform public.write_review(b, 2, array['Trễ giờ'], 'Đến trễ nửa tiếng, làm hơi vội.');
  perform public.write_review(b, 4, array['Tay nghề tốt'], 'Đến trễ chút nhưng làm đẹp.');
  assert (select rating from public.reviews where booking_id = b) = 4, 'a blind review could not be changed';

  -- The public, and the freelancer, do not see it yet.
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  select count(*) into n from public.reviews where booking_id = b;
  reset role;
  assert n = 0, 'a blind review was public';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  set local role authenticated;
  select count(*) into n from public.reviews where booking_id = b;
  reset role;
  assert n = 0, 'the freelancer read the review before writing theirs';
  begin
    perform public.reply_review(b, 'Cảm ơn em');
    assert false, 'a reply to a blind review';
  exception when check_violation then null;
  end;
  begin
    perform public.review_customer(b, 1, 'Tệ');
    assert false, 'one star without a reason';
  exception when check_violation then null;
  end;
  perform public.review_customer(b, 5, '');
  assert (select published_at is not null from public.reviews where booking_id = b), 'both written, review still blind';
  assert (select published_at is not null from public.customer_reviews where booking_id = b), 'both written, customer review still blind';
  perform public.reply_review(b, 'Xin lỗi em vì đến trễ, lần sau chị sẽ đúng giờ.');
  begin
    perform public.reply_review(b, 'Sửa lại câu trả lời');
    assert false, 'a reply was rewritten';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', friend::text, true);
  begin
    perform public.write_review(b, 5, array['Tay nghề tốt'], 'Sửa sau khi đã hiện công khai.');
    assert false, 'a published review was changed';
  exception when check_violation then null;
  end;

  ---------------------------------------------------------------------------
  raise notice 'a voucher: used before the start, credited to the freelancer at the end, returned if cancelled';
  select id into v from public.vouchers where account_id = friend and booking_id is null order by created_at limit 1;
  b2 := public.create_booking(linh, 'nail-design', 'simple',
    ((monday + 5) + time '11:00') at time zone tz, true, friend_addr, 1, '');
  perform public.apply_voucher(b2, v);
  assert (select discount from public.bookings where id = b2) = 50000, 'the discount was not applied';
  begin
    perform public.apply_voucher(b2, v);
    assert false, 'a voucher went on twice';
  exception when check_violation then null;
  end;
  perform public.cancel_booking(b2, 'Bận việc');
  assert (select booking_id is null from public.vouchers where id = v), 'a cancelled booking kept the voucher';

  b3 := public.create_booking(linh, 'nail-design', 'simple',
    ((monday + 5) + time '13:00') at time zone tz, true, friend_addr, 1, '');
  perform public.apply_voucher(b3, v);
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(b3);
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set starts_at = now() - interval '2 hours' where id = b3;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.complete_booking(b3);
  assert (select amount from public.wallet_entries where booking_id = b3 and kind = 'voucher') = 50000,
    'the freelancer was not paid back the voucher';
  assert (select used_at is not null from public.vouchers where id = v), 'the voucher was not marked used';

  ---------------------------------------------------------------------------
  raise notice 'a job nobody closes completes itself a day after its end';
  perform set_config('request.jwt.claim.sub', friend::text, true);
  b2 := public.create_booking(linh, 'nail-design', 'simple',
    ((monday + 5) + time '15:00') at time zone tz, true, friend_addr, 1, '');
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(b2);
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set starts_at = now() - interval '27 hours' where id = b2;
  perform set_config('request.jwt.claim.sub', friend::text, true);
  begin
    perform public.cancel_booking(b2, 'Huỷ sau khi đã làm');
    assert false, 'a booking was cancelled after its start';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  perform public.auto_complete_bookings();
  assert (select status from public.bookings where id = b2) = 'completed', 'a forgotten job stayed open';

  raise notice 'the freelancer did not come: the customer reports it, no commission';
  perform set_config('request.jwt.claim.sub', friend::text, true);
  b3 := public.create_booking(linh, 'nail-design', 'simple',
    ((monday + 5) + time '17:00') at time zone tz, true, friend_addr, 1, '');
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(b3);
  perform set_config('request.jwt.claim.sub', friend::text, true);
  begin
    perform public.report_pro_no_show(b3, 'Chưa tới giờ');
    assert false, 'a no-show was reported before the start';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set starts_at = now() - interval '30 minutes' where id = b3;
  perform set_config('request.jwt.claim.sub', friend::text, true);
  perform public.report_pro_no_show(b3, 'Đợi 30 phút không thấy ai');
  assert (select status = 'cancelled' and cancelled_by = 'pro' from public.bookings where id = b3), 'the booking was not cancelled on the freelancer';
  assert not exists (select 1 from public.wallet_entries where booking_id = b3), 'commission on a job that did not happen';
  assert exists (select 1 from public.reports where booking_id = b3 and reason = 'pro_no_show'), 'no report for 360dep';

  ---------------------------------------------------------------------------
  raise notice 'the window: no review after 14 days, and a lone review is published when it closes';
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set completed_at = now() - interval '15 days' where id = b2;
  perform set_config('request.jwt.claim.sub', friend::text, true);
  begin
    perform public.write_review(b2, 5, array['Đúng giờ'], 'Viết sau 15 ngày mới nhớ ra.');
    assert false, 'a review after the window';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set completed_at = now() - interval '1 day' where id = b2;
  perform set_config('request.jwt.claim.sub', friend::text, true);
  perform public.write_review(b2, 5, array['Đúng giờ'], 'Ổn áp, sẽ quay lại lần sau.');
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set completed_at = now() - interval '15 days' where id = b2;
  perform public.publish_due_reviews();
  assert (select published_at is not null from public.reviews where booking_id = b2), 'the window closed and the review stayed blind';

  ---------------------------------------------------------------------------
  raise notice 'a request goes to everyone who can do it; the first to take it gets it';
  perform set_config('request.jwt.claim.sub', friend::text, true);
  begin
    perform public.post_job('nail-design', 'simple', ((monday + 5) + time '11:00') at time zone tz, true, friend_addr, 1, '', 'cash', 1000);
    assert false, 'a request below the catalogue price';
  exception when check_violation then null;
  end;
  v := public.post_job('nail-design', 'simple', ((monday + 5) + time '11:00') at time zone tz, true, friend_addr, 1, 'Làm móng đi tiệc');
  assert (select price = suggested_price from public.jobs j join public.service_variants sv
          on sv.template_id = j.template_id and sv.id = j.variant_id where j.id = v), 'the request is not at the catalogue price';
  assert exists (select 1 from public.notifications where account_id = linh and kind = 'job_new'), 'linh was not told about the request';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.send_offer(v, 300000, 'Chị nhận nhé em, 300k ạ');
    assert false, 'a quote on a request';
  exception when feature_not_supported then null;
  end;
  b2 := public.take_job(v);
  assert (select status = 'confirmed' and source = 'job' from public.bookings where id = b2), 'taking a request did not make a confirmed booking';
  assert (select status = 'booked' and booking_id = b2 from public.jobs where id = v), 'the request is still open';
  perform set_config('request.jwt.claim.sub', thu::text, true);
  begin
    perform public.take_job(v);
    assert false, 'a taken request was taken twice';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', friend::text, true);
  thread := public.open_thread(linh, b2);
  perform public.send_message(thread, 'Chị nhận rồi ạ, em cảm ơn');
  perform public.cancel_booking(b2, 'Xong phần kiểm tra');

  ---------------------------------------------------------------------------
  raise notice 'the fee is paid before the next job, and a bank transfer pays it once';
  perform set_config('request.jwt.claim.sub', '', true);
  insert into public.wallet_entries (pro_id, kind, amount, note) values (linh, 'adjustment', -10000000, 'Kiểm tra phí');
  bal := public.wallet_balance(linh);
  assert bal < 0, 'the wallet is not owing';
  perform set_config('request.jwt.claim.sub', friend::text, true);
  -- A customer cannot book someone who owes; a booking made before, they cannot accept.
  begin
    perform public.create_booking(linh, 'nail-design', 'simple', ((monday + 5) + time '13:00') at time zone tz, true, friend_addr, 1, '');
    assert false, 'a freelancer who owes the fee was booked';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  update public.wallet_entries set amount = 0 where pro_id = linh and note = 'Kiểm tra phí';
  perform set_config('request.jwt.claim.sub', friend::text, true);
  b3 := public.create_booking(linh, 'nail-design', 'simple', ((monday + 5) + time '13:00') at time zone tz, true, friend_addr, 1, '');
  perform set_config('request.jwt.claim.sub', '', true);
  update public.wallet_entries set amount = -10000000 where pro_id = linh and note = 'Kiểm tra phí';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  begin
    perform public.confirm_booking(b3);
    assert false, 'a freelancer who owes the fee accepted a booking';
  exception when check_violation then
    get stacked diagnostics msg = message_text;
    assert msg like 'Thanh toán phí%', format('refused for another reason: %s', msg);
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  code := (select pay_code from public.pros where id = linh);
  assert public.record_bank_topup('CT DEN DEP' || code || ' FT123', -bal, 'sepay:TEST-1'), 'the transfer was not credited';
  assert not public.record_bank_topup('CT DEN DEP' || code || ' FT123', -bal, 'sepay:TEST-1'), 'the same transfer was credited twice';
  assert not public.record_bank_topup('chuyen tien', 100000, 'sepay:TEST-2'), 'a transfer without a code was credited';
  assert public.record_bank_topup('DEPOSIT dep ' || lower(code), 1000, 'sepay:TEST-3'), 'a word before the code hid it';
  assert public.wallet_balance(linh) >= 0, 'paid, still owing';
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(b3);
  begin
    perform public.record_topup(linh, 100000, 'x');
    assert false, 'a freelancer recorded their own top-up';
  exception when insufficient_privilege then null;
  end;

  raise notice 'money reads the Vietnamese way';
  assert public.vnd(27000) = '27.000', public.vnd(27000);
  assert public.vnd(1250000) = '1.250.000', public.vnd(1250000);
  assert not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname <> 'vnd' and p.prosrc like '%FM999G999G999%'
  ), 'a function still formats money with a comma';

  perform set_config('request.jwt.claim.sub', '', true);
  raise notice 'CONNECTION RULES PASS';
end $$;

-- The AI reviewer (20260929100000): "Mở hồ sơ" asks for a review, the reviewer's
-- decisions are applied and logged, an admin can reverse them, and the log is
-- for admins only.
do $$
declare
  linh uuid; newbie uuid; admin_id uuid; w uuid; log_id uuid; n int; msg text;
  tpl text; cats public.category_id[];
begin
  select id into linh from public.pros where slug = 'linh-pham';

  ---------------------------------------------------------------------------
  raise notice 'the profiles already on the marketplace count as approved';
  assert not exists (select 1 from public.pros where published and review_status <> 'approved'),
    'a published profile is not approved';

  -- A new partner with everything a profile needs: a service, hours, a post.
  perform set_config('request.jwt.claim.sub', '', true);
  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'ai-review@example.invalid', jsonb_build_object('full_name', 'Đối Tác Mới', 'phone', '0900 000 654'), now(), now())
  returning id into newbie;
  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'admin-ai@example.invalid', jsonb_build_object('full_name', 'Quản trị AI'), now(), now())
  returning id into admin_id;
  update public.accounts set is_admin = true where id = admin_id;

  select s.template_id, p.categories into tpl, cats
  from public.pro_services s join public.pros p on p.id = s.pro_id
  join public.service_templates t on t.id = s.template_id
  where s.pro_id = linh and s.active and not t.studio_only and not t.requires_verification
  limit 1;
  assert tpl is not null, 'linh has no service to copy';
  perform set_config('request.jwt.claim.sub', newbie::text, true);
  -- Whatever a client sends, a new profile starts as a draft.
  insert into public.pros (id, slug, city, district, categories, review_status, reviewed_at)
  values (newbie, 'doi-tac-moi-test', 'Hà Nội', 'Đống Đa', cats, 'approved', now());
  assert (select review_status = 'draft' and reviewed_at is null from public.pros where id = newbie),
    'a new profile did not start as a draft';
  insert into public.pro_services (pro_id, template_id, active) values (newbie, tpl, true);
  insert into public.working_hours (pro_id, weekday, start_min, end_min) values (newbie, 1, 540, 1080);
  insert into public.works (pro_id, template_id, title, image_paths, slug, hidden_at, ai_checked_at)
  values (newbie, tpl, 'Mẫu đầu tiên', array['https://example.invalid/storage/v1/object/public/works/a.jpg'],
          'mau-dau-tien-ai-test', null, now())
  returning id into w;
  assert (select ai_checked_at is null from public.works where id = w), 'a new post skipped the reviewer''s queue';

  ---------------------------------------------------------------------------
  raise notice 'pressing "Mở hồ sơ" before approval asks for a review, and the profile stays hidden';
  update public.pros set published = true where id = newbie;
  assert (select not published and review_status = 'pending' and review_requested_at is not null
          from public.pros where id = newbie), 'publishing without approval did not go to pending';
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  select count(*) into n from public.pros where id = newbie;
  reset role;
  assert n = 0, 'an anonymous visitor sees a profile waiting for review';
  set local role anon;
  select count(*) into n from public.works where id = w;
  reset role;
  assert n = 0, 'an anonymous visitor sees a post of a profile waiting for review';

  raise notice 'a partner cannot write their own review state';
  perform set_config('request.jwt.claim.sub', newbie::text, true);
  update public.pros set review_status = 'approved', review_note = 'ok', reviewed_at = now() where id = newbie;
  assert (select review_status = 'pending' and review_note is null and reviewed_at is null from public.pros where id = newbie),
    'a partner approved themselves';
  foreach msg in array array['review_status', 'review_note', 'review_requested_at', 'reviewed_at'] loop
    assert not has_column_privilege('authenticated', 'public.pros', msg, 'UPDATE'), format('pros.%s is writable', msg);
  end loop;
  -- Nor unhide a post, nor mark it checked.
  update public.works set hidden_at = now(), ai_checked_at = now() where id = w;
  assert (select hidden_at is null and ai_checked_at is null from public.works where id = w), 'a partner wrote the reviewer''s columns';

  ---------------------------------------------------------------------------
  raise notice 'the reviewer asking for changes tells the partner what to fix';
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.apply_ai_profile_decision(newbie, 'changes_requested', '{}', 'x', 'rules', '{}');
    assert false, 'changes were requested without a reason';
  exception when check_violation then null;
  end;
  log_id := public.apply_ai_profile_decision(newbie, 'changes_requested',
    array['Ảnh tác phẩm là ảnh chụp màn hình, hãy đăng ảnh thật'], 'Ảnh chưa đạt', 'gemini-test', '{}');
  assert log_id is not null, 'the decision was not logged';
  assert (select not published and review_status = 'changes_requested' and review_note like 'Ảnh tác phẩm%'
          from public.pros where id = newbie), 'the request for changes was not applied';
  assert exists (select 1 from public.notifications where account_id = newbie and kind = 'profile_review'
                 and title like 'Hồ sơ cần chỉnh%'), 'the partner was not told what to fix';
  assert public.apply_ai_profile_decision(newbie, 'approved', '{}', 'late', 'gemini-test', '{}') is null,
    'a decision on a profile no longer waiting was applied';

  raise notice 'sending it again, then an approval publishes it and is logged';
  perform set_config('request.jwt.claim.sub', newbie::text, true);
  update public.pros set published = true where id = newbie;
  assert (select review_status from public.pros where id = newbie) = 'pending', 'resubmitting did not ask for a review';
  perform set_config('request.jwt.claim.sub', '', true);
  log_id := public.apply_ai_profile_decision(newbie, 'approved', '{}', 'Hồ sơ đạt', 'gemini-test',
    jsonb_build_object('work_ids', jsonb_build_array(w::text, 'not-a-uuid')));
  assert (select published and review_status = 'approved' and reviewed_at is not null from public.pros where id = newbie),
    'an approval did not publish';
  assert (select ai_checked_at is not null from public.works where id = w), 'the post the reviewer saw is still queued';
  assert exists (select 1 from public.ai_decisions where id = log_id and subject = 'pro_profile' and decision = 'approved'
                 and model = 'gemini-test'), 'the approval was not logged';
  assert exists (select 1 from public.notifications where account_id = newbie and kind = 'profile_approved'),
    'the partner was not told';

  raise notice 'an approved partner hides and shows their profile themselves, and editing keeps the approval';
  perform set_config('request.jwt.claim.sub', newbie::text, true);
  update public.pros set published = false where id = newbie;
  update public.pros set published = true, bio = 'Làm móng tại nhà, 5 năm kinh nghiệm' where id = newbie;
  assert (select published and review_status = 'approved' from public.pros where id = newbie),
    'an approved partner could not show their profile again';

  ---------------------------------------------------------------------------
  raise notice 'a hidden post leaves the marketplace, and the owner is told';
  perform set_config('request.jwt.claim.sub', '', true);
  log_id := public.apply_ai_work_decision(w, 'hidden', array['Ảnh có logo của thương hiệu khác'],
    'Ảnh lấy của người khác', 'gemini-test', '{}');
  assert (select hidden_at is not null and hidden_by = 'ai' from public.works where id = w), 'the post was not hidden';
  set local role anon;
  select count(*) into n from public.works where id = w;
  reset role;
  assert n = 0, 'an anonymous visitor sees a hidden post';
  perform set_config('request.jwt.claim.sub', newbie::text, true);
  set local role authenticated;
  select count(*) into n from public.works where id = w;
  reset role;
  assert n = 1, 'the owner lost sight of their hidden post';
  assert exists (select 1 from public.notifications where account_id = newbie and kind = 'work_hidden'), 'the owner was not told';

  raise notice 'new photos put a post back in the queue';
  update public.works set image_paths = array['https://example.invalid/storage/v1/object/public/works/b.jpg'] where id = w;
  assert (select ai_checked_at is null and hidden_at is not null from public.works where id = w), 'an edited post was not queued again';

  ---------------------------------------------------------------------------
  raise notice 'only an admin reverses a decision, and it is applied';
  begin
    perform public.admin_override_ai_decision(log_id, 'kept', 'tự mở');
    assert false, 'a partner reversed a decision';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  perform public.admin_override_ai_decision(log_id, 'kept', 'Ảnh của chính chị ấy');
  assert (select hidden_at is null from public.works where id = w), 'unhiding did not show the post';
  assert (select overridden_by = admin_id and override_decision = 'kept' from public.ai_decisions where id = log_id),
    'the override was not recorded';
  begin
    perform public.admin_override_ai_decision(log_id, 'kept', '');
    assert false, 'the same override twice';
  exception when check_violation then null;
  end;

  select id into log_id from public.ai_decisions
  where pro_id = newbie and subject = 'pro_profile' and decision = 'approved' order by created_at desc limit 1;
  perform public.admin_override_ai_decision(log_id, 'rejected', 'Ảnh lấy từ trang khác');
  assert (select not published and review_status = 'rejected' and review_note = 'Ảnh lấy từ trang khác'
          from public.pros where id = newbie), 'an admin rejection did not unpublish';
  perform public.admin_override_ai_decision(log_id, 'approved', '');
  assert (select published and review_status = 'approved' from public.pros where id = newbie), 'flipping it back did not publish';

  ---------------------------------------------------------------------------
  raise notice 'the log is for admins only';
  perform set_config('request.jwt.claim.sub', newbie::text, true);
  set local role authenticated;
  select count(*) into n from public.ai_decisions;
  reset role;
  assert n = 0, format('a partner read %s rows of the AI log', n);
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    set local role anon;
    select count(*) into n from public.ai_decisions;
    assert false, 'an anonymous caller read the AI log';
  exception when insufficient_privilege then null;
  end;
  reset role;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  set local role authenticated;
  select count(*) into n from public.ai_decisions where pro_id = newbie;
  reset role;
  assert n >= 3, format('an admin reads %s rows', n);
  perform set_config('request.jwt.claim.sub', '', true);

  raise notice 'follow-ups are logged and notified';
  log_id := public.log_ai_followup(newbie, 'Nhắc lần 1', array['Chưa có giờ làm'], jsonb_build_object('kind', 'setup'),
    'Còn 1 bước nữa', 'Lưu giờ làm việc', '/studio');
  assert exists (select 1 from public.ai_decisions where id = log_id and decision = 'nudged' and subject = 'follow_up'),
    'the nudge was not logged';
  assert exists (select 1 from public.notifications where account_id = newbie and kind = 'ai_follow_up'), 'the nudge was not sent';
  -- A draft two days old is due a reminder; the one just sent counts.
  update public.pros set published = false, review_status = 'draft', review_requested_at = null,
    created_at = now() - interval '2 days' where id = newbie;
  assert exists (select 1 from public.ai_followup_facts(500) f where f.pro_id = newbie and f.kind = 'setup' and f.prior = 1
                 and f.has_service and f.has_hours and f.has_work), 'the setup reminder facts are wrong';

  raise notice 'leaving takes the log with the account';
  perform set_config('request.jwt.claim.sub', newbie::text, true);
  perform public.delete_my_account();
  assert not exists (select 1 from public.ai_decisions where pro_id = newbie), 'the AI log survived deletion';

  perform set_config('request.jwt.claim.sub', '', true);
  raise notice 'an admin publishing their own partner profile is reviewed like anyone';
  declare own uuid;
  begin
    select p.id into own from public.pros p where p.published and p.review_status = 'approved' limit 1;
    perform set_config('request.jwt.claim.sub', '', true);
    update public.accounts set is_admin = true where id = own;
    update public.pros set published = false, review_status = 'draft', reviewed_at = null where id = own;
    perform set_config('request.jwt.claim.sub', own::text, true);
    update public.pros set published = true where id = own;
    perform set_config('request.jwt.claim.sub', '', true);
    assert (select not published and review_status = 'pending' from public.pros where id = own),
      'an admin skipped the review of their own profile';
    update public.accounts set is_admin = false where id = own;
    update public.pros set published = true, review_status = 'approved' where id = own;
  end;
  raise notice 'AI REVIEW RULES PASS';
end $$;

-- One commission for every booking (20261002100000 dropped the own-client rate).
do $$
begin
  assert not exists (select 1 from pg_trigger where tgname = 'booking_own_client'), 'a second commission rate is back';
  assert not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'fee_policy' and column_name = 'own_client_commission_rate'),
    'fee_policy still has an own-client rate';
  assert (select commission_rate from public.fee_policy) = 0.15, 'the commission is not 15%';
  raise notice 'FLAT COMMISSION PASS';
end $$;

-- The flow run on production (20261003100000): completed_jobs follows a
-- completion straight away instead of waiting for the nightly recount.
do $$
declare
  linh uuid; customer uuid; addr uuid; b uuid; before int; actual int;
  monday date := current_date + (7 - ((extract(dow from current_date)::int + 6) % 7));
  tz text := public.app_timezone();
begin
  select id into linh from public.pros where slug = 'linh-pham';
  select a.id into customer from public.accounts a where a.full_name = 'Ngọc Hân';
  select id into addr from public.addresses where account_id = customer;

  raise notice 'completing a booking counts it at once';
  perform set_config('request.jwt.claim.sub', customer::text, true);
  b := public.create_booking(linh, 'nail-gel', 'hand', ((monday + 3) + time '17:30') at time zone tz, true, addr, 1, '');
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.confirm_booking(b);
  perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set starts_at = now() - interval '1 hour' where id = b;
  select completed_jobs into before from public.pros where id = linh;
  perform set_config('request.jwt.claim.sub', linh::text, true);
  perform public.complete_booking(b);
  perform set_config('request.jwt.claim.sub', '', true);
  select count(*) into actual from public.bookings where pro_id = linh and status = 'completed';
  assert (select completed_jobs from public.pros where id = linh) = actual,
    format('completed_jobs %s, completed bookings %s (was %s)', (select completed_jobs from public.pros where id = linh), actual, before);
  raise notice 'FLOW FIX RULES PASS';
end $$;
