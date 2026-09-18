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
  msg text; km numeric; q public.quote; n int; slot timestamptz;
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
  raise notice 'ALL DATABASE RULES PASS';
end $$;
