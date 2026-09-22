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
  assert (select confirm_by from public.bookings where id = booking) <= now() + interval '2 hours',
    'the freelancer has a deadline to call';

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
  perform public.write_review(booking, 5, array['Đúng giờ'], 'Rất hài lòng với buổi làm này.');
  assert (select rating_count from public.pros where id = linh) > 0, 'the rating follows the reviews';

  perform set_config('request.jwt.claim.sub', thu::text, true);
  begin
    perform public.reply_review(booking, 'Cảm ơn bạn');
    assert false, 'another freelancer replied to the review';
  exception when insufficient_privilege then null;
  end;

  raise notice 'a read receipt clears the unread count, and only for a thread party';
  -- This is not a hypothetical: the app used to stamp read_at with a plain
  -- update, which RLS silently dropped, so the unread badge never cleared.
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
      'slugify', 'is_admin', 'is_pro'
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
      'slugify', 'is_admin', 'is_pro',
      -- the state machine and the things a person does to their own account
      'create_booking', 'confirm_booking', 'decline_booking', 'start_booking', 'complete_booking',
      'mark_no_show', 'cancel_booking', 'request_reschedule', 'respond_reschedule', 'post_job',
      'send_offer', 'accept_offer', 'withdraw_offer', 'write_review', 'reply_review', 'open_thread',
      'send_message', 'replace_working_hours', 'my_wallet_balance', 'mark_thread_read', 'delete_my_account',
      'set_my_phone',
      -- admin decisions, which check is_admin() themselves
      'decide_identity_check', 'decide_no_show_compensation', 'set_pro_suspended', 'set_review_hidden', 'resolve_report'
    ]);
  assert msg is null, format('authenticated can execute: %s', msg);

  raise notice 'ALL DATABASE RULES PASS';
end $$;
