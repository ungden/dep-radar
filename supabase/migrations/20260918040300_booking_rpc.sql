-- The booking state machine. Clients never write to bookings; they call these.
-- Allowed transitions:
--   pending    -> confirmed (pro called and accepted) | declined | cancelled | expired
--   confirmed  -> in_progress | cancelled | no_show
--   in_progress-> completed | no_show
--   completed / declined / cancelled / expired / no_show are final.

create function public.notify(p_account uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (account_id, kind, title, body, link)
  values (p_account, p_kind, p_title, p_body, p_link)
$$;

-- Loads a booking and asserts the caller is the customer or the freelancer on it.
create function public.booking_for_caller(p_booking uuid, p_as public.app_role)
returns public.bookings
language plpgsql stable security definer set search_path = '' as $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = p_booking;
  if b is null then raise exception 'Không tìm thấy lịch hẹn.' using errcode = 'no_data_found'; end if;
  if p_as = 'pro' and b.pro_id <> auth.uid() then
    raise exception 'Bạn không phải chuyên viên của lịch hẹn này.' using errcode = 'insufficient_privilege';
  end if;
  if p_as = 'customer' and b.customer_id <> auth.uid() then
    raise exception 'Bạn không phải khách của lịch hẹn này.' using errcode = 'insufficient_privilege';
  end if;
  return b;
end $$;

-- Create a booking ------------------------------------------------------------

create function public.create_booking(
  p_pro uuid,
  p_template text,
  p_variant text,
  p_starts_at timestamptz,
  p_at_home boolean,
  p_address_id uuid default null,
  p_quantity int default 1,
  p_note text default '',
  p_payment public.payment_method default 'cash'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  pro record; addr record; policy record;
  minutes int; unit int; km numeric; q public.quote;
  problem text; new_id uuid;
  city text; district text; detail text; note text; lat double precision; lng double precision;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  if me = p_pro then raise exception 'Không thể tự đặt lịch với chính mình.' using errcode = 'check_violation'; end if;
  if p_payment = 'online' then
    raise exception 'Thanh toán online chưa hoạt động.' using errcode = 'feature_not_supported';
  end if;

  select * into pro from public.pros where id = p_pro;
  select * into policy from public.fee_policy where id;

  if p_at_home then
    select * into addr from public.addresses where id = p_address_id and account_id = me;
    if addr is null then raise exception 'Cần chọn địa chỉ đã lưu.' using errcode = 'check_violation'; end if;
    city := addr.city; district := addr.district; detail := addr.detail; note := addr.note;
    lat := addr.lat; lng := addr.lng;
  else
    city := pro.city; district := pro.district; detail := pro.studio_address;
    note := ''; lat := pro.lat; lng := pro.lng;
  end if;

  problem := public.availability_problem(p_pro, p_template, p_variant, p_quantity, p_starts_at, p_at_home, lat, lng);
  if problem is not null then raise exception '%', problem using errcode = 'check_violation'; end if;

  minutes := public.service_duration_min(p_template, p_variant, p_quantity);
  unit := public.listed_price(p_pro, p_template, p_variant);
  km := case when p_at_home then public.travel_distance_km(pro.lat, pro.lng, lat, lng, policy.road_factor) end;
  q := public.build_quote(unit, p_quantity, p_at_home, km, public.is_urgent(p_starts_at));

  insert into public.bookings (
    customer_id, pro_id, template_id, variant_id, quantity, source,
    starts_at, duration_min, buffer_min,
    at_home, city, district, address, address_note, lat, lng, note,
    service_price, distance_km, travel_fee, urgent_fee, commission_rate, commission,
    payment_method, status, confirm_by
  ) values (
    me, p_pro, p_template, p_variant, p_quantity, 'direct',
    p_starts_at, minutes, pro.buffer_min,
    p_at_home, city, district, coalesce(detail, ''), coalesce(note, ''), lat, lng, left(coalesce(p_note, ''), 500),
    q.service_price, q.distance_km, q.travel_fee, q.urgent_fee, q.commission_rate, q.commission,
    p_payment, 'pending',
    least(p_starts_at, now() + make_interval(hours => policy.confirm_within_hours))
  ) returning id into new_id;

  perform public.notify(p_pro, 'booking_new', 'Có yêu cầu đặt lịch mới',
    'Gọi cho khách để xác nhận trước khi nhận job.', '/studio/jobs');
  return new_id;
exception
  when exclusion_violation then
    raise exception 'Khung giờ này vừa có người đặt. Chọn giờ khác nhé.' using errcode = 'check_violation';
end $$;

-- Freelancer side -------------------------------------------------------------

create function public.confirm_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status <> 'pending' then
    raise exception 'Lịch hẹn không còn ở trạng thái chờ xác nhận.' using errcode = 'check_violation';
  end if;
  update public.bookings set status = 'confirmed', confirmed_at = now() where id = p_booking;
  perform public.notify(b.customer_id, 'booking_confirmed', 'Chuyên viên đã nhận lịch',
    'Hẹn gặp bạn đúng giờ.', '/bookings/' || p_booking);
end $$;

create function public.decline_booking(p_booking uuid, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status <> 'pending' then
    raise exception 'Chỉ có thể từ chối lịch đang chờ xác nhận.' using errcode = 'check_violation';
  end if;
  update public.bookings
    set status = 'declined', cancelled_at = now(), cancelled_by = 'pro', cancel_reason = left(p_reason, 300)
    where id = p_booking;
  perform public.notify(b.customer_id, 'booking_declined', 'Chuyên viên không nhận được lịch này',
    coalesce(nullif(p_reason, ''), 'Bạn có thể chọn chuyên viên khác.'), '/bookings/' || p_booking);
end $$;

create function public.start_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status <> 'confirmed' then
    raise exception 'Chỉ bắt đầu được job đã xác nhận.' using errcode = 'check_violation';
  end if;
  if now() < b.starts_at - interval '1 hour' then
    raise exception 'Chưa tới giờ hẹn.' using errcode = 'check_violation';
  end if;
  update public.bookings set status = 'in_progress', started_at = now() where id = p_booking;
end $$;

-- Completing the job is what charges the commission: one wallet entry, never twice.
create function public.complete_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status not in ('confirmed', 'in_progress') then
    raise exception 'Job không ở trạng thái có thể hoàn thành.' using errcode = 'check_violation';
  end if;
  if now() < b.starts_at then
    raise exception 'Chưa tới giờ hẹn, không thể đánh dấu hoàn thành.' using errcode = 'check_violation';
  end if;
  update public.bookings set status = 'completed', completed_at = now() where id = p_booking;
  insert into public.wallet_entries (pro_id, booking_id, kind, amount, note)
  values (b.pro_id, b.id, 'commission', -b.commission, 'Hoa hồng job hoàn thành')
  on conflict (booking_id, kind) do nothing;
  perform public.notify(b.customer_id, 'booking_completed', 'Job đã hoàn thành',
    'Đánh giá chuyên viên để giúp người sau chọn đúng.', '/bookings/' || p_booking);
end $$;

create function public.mark_no_show(p_booking uuid, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; policy record; comp int;
begin
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status not in ('confirmed', 'in_progress') then
    raise exception 'Chỉ báo vắng mặt cho job đã xác nhận.' using errcode = 'check_violation';
  end if;
  if now() < b.starts_at + interval '15 minutes' then
    raise exception 'Đợi ít nhất 15 phút sau giờ hẹn rồi hãy báo vắng mặt.' using errcode = 'check_violation';
  end if;
  select * into policy from public.fee_policy where id;
  update public.bookings
    set status = 'no_show', cancelled_at = now(), cancelled_by = 'customer',
        cancel_reason = left(coalesce(p_reason, 'Khách không có mặt'), 300)
    where id = p_booking;
  -- The freelancer travelled for nothing: dep360 covers the travel fee, no commission.
  comp := b.travel_fee;
  if comp > 0 then
    insert into public.wallet_entries (pro_id, booking_id, kind, amount, note)
    values (b.pro_id, b.id, 'no_show_comp', comp, 'Bù phí di chuyển khi khách vắng mặt')
    on conflict (booking_id, kind) do nothing;
  end if;
  perform public.notify(b.customer_id, 'booking_no_show', 'Chuyên viên báo bạn không có mặt',
    'Nếu có nhầm lẫn, hãy liên hệ hỗ trợ.', '/bookings/' || p_booking);
end $$;

-- Either side -----------------------------------------------------------------

create function public.cancel_booking(p_booking uuid, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; me uuid := auth.uid(); who public.app_role;
begin
  select * into b from public.bookings where id = p_booking;
  if b is null then raise exception 'Không tìm thấy lịch hẹn.' using errcode = 'no_data_found'; end if;
  who := case when b.customer_id = me then 'customer' when b.pro_id = me then 'pro' end;
  if who is null then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if b.status not in ('pending', 'confirmed') then
    raise exception 'Lịch hẹn này không thể huỷ.' using errcode = 'check_violation';
  end if;
  update public.bookings
    set status = 'cancelled', cancelled_at = now(), cancelled_by = who, cancel_reason = left(p_reason, 300)
    where id = p_booking;
  perform public.notify(
    case when who = 'customer' then b.pro_id else b.customer_id end,
    'booking_cancelled', 'Lịch hẹn đã bị huỷ',
    coalesce(nullif(p_reason, ''), 'Không có lý do kèm theo.'), '/bookings/' || p_booking);
end $$;

-- Rescheduling is a proposal: the other side has to accept it.
create function public.request_reschedule(p_booking uuid, p_starts_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; me uuid := auth.uid(); who public.app_role; problem text;
begin
  select * into b from public.bookings where id = p_booking;
  if b is null then raise exception 'Không tìm thấy lịch hẹn.' using errcode = 'no_data_found'; end if;
  who := case when b.customer_id = me then 'customer' when b.pro_id = me then 'pro' end;
  if who is null then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if b.status not in ('pending', 'confirmed') then
    raise exception 'Lịch hẹn này không thể đổi giờ.' using errcode = 'check_violation';
  end if;
  problem := public.availability_problem(
    b.pro_id, b.template_id, b.variant_id, b.quantity, p_starts_at, b.at_home, b.lat, b.lng, b.id);
  if problem is not null then raise exception '%', problem using errcode = 'check_violation'; end if;

  update public.bookings set reschedule_to = p_starts_at, reschedule_by = who where id = p_booking;
  perform public.notify(
    case when who = 'customer' then b.pro_id else b.customer_id end,
    'reschedule_requested', 'Có đề nghị đổi giờ hẹn',
    to_char(p_starts_at at time zone public.app_timezone(), 'HH24:MI DD/MM'), '/bookings/' || p_booking);
end $$;

create function public.respond_reschedule(p_booking uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; me uuid := auth.uid(); who public.app_role; problem text;
begin
  select * into b from public.bookings where id = p_booking;
  if b is null then raise exception 'Không tìm thấy lịch hẹn.' using errcode = 'no_data_found'; end if;
  who := case when b.customer_id = me then 'customer' when b.pro_id = me then 'pro' end;
  if who is null then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if b.reschedule_to is null then
    raise exception 'Không có đề nghị đổi giờ nào.' using errcode = 'check_violation';
  end if;
  if b.reschedule_by = who then
    raise exception 'Đề nghị này do bạn gửi, đợi bên kia trả lời.' using errcode = 'check_violation';
  end if;

  if not p_accept then
    update public.bookings set reschedule_to = null, reschedule_by = null where id = p_booking;
  else
    problem := public.availability_problem(
      b.pro_id, b.template_id, b.variant_id, b.quantity, b.reschedule_to, b.at_home, b.lat, b.lng, b.id);
    if problem is not null then raise exception '%', problem using errcode = 'check_violation'; end if;
    update public.bookings
      set starts_at = b.reschedule_to, reschedule_to = null, reschedule_by = null,
          -- A new time means a new deadline to call and accept.
          confirm_by = case when b.status = 'pending'
            then least(b.reschedule_to, now() + interval '2 hours') else confirm_by end
      where id = p_booking;
  end if;
  perform public.notify(
    case when who = 'customer' then b.pro_id else b.customer_id end,
    'reschedule_answered',
    case when p_accept then 'Đổi giờ hẹn đã được đồng ý' else 'Đề nghị đổi giờ bị từ chối' end,
    '', '/bookings/' || p_booking);
end $$;

-- Requests & offers -----------------------------------------------------------

create function public.post_job(
  p_template text,
  p_variant text,
  p_starts_at timestamptz,
  p_at_home boolean,
  p_address_id uuid default null,
  p_quantity int default 1,
  p_description text default '',
  p_payment public.payment_method default 'cash'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); addr record; policy record; new_id uuid; city text; district text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into policy from public.fee_policy where id;
  if extract(epoch from (p_starts_at - now())) / 60 < policy.min_lead_minutes then
    raise exception 'Cần đặt trước ít nhất % phút.', policy.min_lead_minutes using errcode = 'check_violation';
  end if;
  if p_at_home then
    select * into addr from public.addresses where id = p_address_id and account_id = me;
    if addr is null then raise exception 'Cần chọn địa chỉ đã lưu.' using errcode = 'check_violation'; end if;
    city := addr.city; district := addr.district;
  else
    raise exception 'Yêu cầu báo giá hiện chỉ dành cho dịch vụ tại nhà.' using errcode = 'feature_not_supported';
  end if;

  insert into public.jobs (customer_id, template_id, variant_id, quantity, description,
                           starts_at, at_home, address_id, city, district, payment_method)
  values (me, p_template, p_variant, p_quantity, left(coalesce(p_description, ''), 500),
          p_starts_at, p_at_home, p_address_id, city, district, p_payment)
  returning id into new_id;
  return new_id;
end $$;

-- A freelancer may only quote services they actually list, at their own price or above.
create function public.send_offer(p_job uuid, p_price int, p_message text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid(); job record; addr record; listed int; problem text; new_id uuid;
  band record;
begin
  if not exists (select 1 from public.pros where id = me) then
    raise exception 'Chỉ chuyên viên mới báo giá được.' using errcode = 'insufficient_privilege';
  end if;
  select * into job from public.jobs where id = p_job;
  if job is null or job.status <> 'open' then
    raise exception 'Yêu cầu không còn mở.' using errcode = 'check_violation';
  end if;
  if job.customer_id = me then
    raise exception 'Không thể báo giá cho yêu cầu của chính mình.' using errcode = 'check_violation';
  end if;

  listed := public.listed_price(me, job.template_id, job.variant_id);
  if listed is null then
    raise exception 'Bạn chưa niêm yết dịch vụ/gói này.' using errcode = 'check_violation';
  end if;
  if p_price < listed then
    raise exception 'Giá báo không được thấp hơn giá bạn đang niêm yết (%đ).', listed
      using errcode = 'check_violation';
  end if;
  select min_price, max_price into band from public.service_variants
    where template_id = job.template_id and id = job.variant_id;
  if p_price > band.max_price then
    raise exception 'Giá báo vượt khung cho phép (tối đa %đ).', band.max_price using errcode = 'check_violation';
  end if;

  select * into addr from public.addresses where id = job.address_id;
  problem := public.availability_problem(
    me, job.template_id, job.variant_id, job.quantity, job.starts_at, job.at_home, addr.lat, addr.lng);
  if problem is not null then raise exception '%', problem using errcode = 'check_violation'; end if;

  insert into public.offers (job_id, pro_id, price, message, expires_at)
  values (p_job, me, p_price, p_message, least(job.starts_at, now() + interval '24 hours'))
  on conflict (job_id, pro_id) do update
    set price = excluded.price, message = excluded.message, status = 'pending',
        expires_at = excluded.expires_at, created_at = now()
  returning id into new_id;

  perform public.notify(job.customer_id, 'offer_new', 'Có báo giá mới cho yêu cầu của bạn',
    '', '/requests');
  return new_id;
end $$;

-- Accepting an offer goes through the same checks as a direct booking and lands in
-- 'pending': the freelancer still calls the customer before it is confirmed.
create function public.accept_offer(p_offer uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid(); offer record; job record; addr record; pro record; policy record;
  minutes int; km numeric; q public.quote; problem text; new_id uuid;
begin
  select * into offer from public.offers where id = p_offer;
  if offer is null then raise exception 'Không tìm thấy báo giá.' using errcode = 'no_data_found'; end if;
  select * into job from public.jobs where id = offer.job_id;
  if job.customer_id <> me then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if job.status <> 'open' then raise exception 'Yêu cầu này đã được chốt.' using errcode = 'check_violation'; end if;
  if offer.status <> 'pending' then raise exception 'Báo giá không còn hiệu lực.' using errcode = 'check_violation'; end if;
  if offer.expires_at < now() then raise exception 'Báo giá đã hết hạn.' using errcode = 'check_violation'; end if;

  select * into pro from public.pros where id = offer.pro_id;
  select * into policy from public.fee_policy where id;
  select * into addr from public.addresses where id = job.address_id and account_id = me;
  if addr is null then raise exception 'Địa chỉ của yêu cầu không còn.' using errcode = 'check_violation'; end if;

  problem := public.availability_problem(
    offer.pro_id, job.template_id, job.variant_id, job.quantity, job.starts_at, job.at_home, addr.lat, addr.lng);
  if problem is not null then raise exception '%', problem using errcode = 'check_violation'; end if;

  minutes := public.service_duration_min(job.template_id, job.variant_id, job.quantity);
  km := public.travel_distance_km(pro.lat, pro.lng, addr.lat, addr.lng, policy.road_factor);
  -- The offer price is for the whole job, so it is already the service price.
  q := public.build_quote(offer.price, 1, job.at_home, km, public.is_urgent(job.starts_at));

  insert into public.bookings (
    customer_id, pro_id, template_id, variant_id, quantity, offer_id, source,
    starts_at, duration_min, buffer_min,
    at_home, city, district, address, address_note, lat, lng, note,
    service_price, distance_km, travel_fee, urgent_fee, commission_rate, commission,
    payment_method, status, confirm_by
  ) values (
    me, offer.pro_id, job.template_id, job.variant_id, job.quantity, offer.id, 'job',
    job.starts_at, minutes, pro.buffer_min,
    job.at_home, addr.city, addr.district, addr.detail, addr.note, addr.lat, addr.lng, job.description,
    q.service_price, q.distance_km, q.travel_fee, q.urgent_fee, q.commission_rate, q.commission,
    job.payment_method, 'pending',
    least(job.starts_at, now() + make_interval(hours => policy.confirm_within_hours))
  ) returning id into new_id;

  update public.offers set status = 'accepted' where id = p_offer;
  update public.offers set status = 'rejected' where job_id = job.id and id <> p_offer and status = 'pending';
  update public.jobs set status = 'booked' where id = job.id;

  perform public.notify(offer.pro_id, 'offer_accepted', 'Báo giá của bạn được chọn',
    'Gọi cho khách để xác nhận nhận job.', '/studio/jobs');
  return new_id;
exception
  when exclusion_violation then
    raise exception 'Chuyên viên vừa có lịch khác vào giờ này.' using errcode = 'check_violation';
end $$;

create function public.withdraw_offer(p_offer uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare offer record;
begin
  select * into offer from public.offers where id = p_offer;
  if offer is null or offer.pro_id <> auth.uid() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if offer.status <> 'pending' then
    raise exception 'Báo giá đã được chọn, hãy huỷ job thay vì rút báo giá.' using errcode = 'check_violation';
  end if;
  update public.offers set status = 'withdrawn' where id = p_offer;
end $$;

-- Reviews ---------------------------------------------------------------------

create function public.write_review(
  p_booking uuid, p_rating int, p_tags text[], p_body text, p_photo_paths text[] default '{}'
) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status <> 'completed' then
    raise exception 'Chỉ đánh giá được job đã hoàn thành.' using errcode = 'check_violation';
  end if;
  insert into public.reviews (booking_id, pro_id, customer_id, rating, tags, body, photo_paths)
  values (p_booking, b.pro_id, b.customer_id, p_rating, coalesce(p_tags, '{}'), p_body, coalesce(p_photo_paths, '{}'))
  on conflict (booking_id) do update
    set rating = excluded.rating, tags = excluded.tags, body = excluded.body,
        photo_paths = excluded.photo_paths, created_at = now();
  perform public.refresh_pro_rating(b.pro_id);
  perform public.notify(b.pro_id, 'review_new', 'Bạn có đánh giá mới', '', '/pros/' || b.pro_id);
end $$;

create function public.reply_review(p_booking uuid, p_reply text) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  select * into r from public.reviews where booking_id = p_booking;
  if r is null then raise exception 'Không tìm thấy đánh giá.' using errcode = 'no_data_found'; end if;
  if r.pro_id <> auth.uid() then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  update public.reviews set reply = left(p_reply, 1000), replied_at = now() where booking_id = p_booking;
end $$;

create function public.refresh_pro_rating(p_pro uuid) returns void
language sql security definer set search_path = '' as $$
  update public.pros p set
    rating_avg = coalesce(r.avg_rating, 0),
    rating_count = coalesce(r.n, 0)
  from (
    select avg(rating)::numeric(3, 2) as avg_rating, count(*) as n
    from public.reviews where pro_id = p_pro and hidden_at is null
  ) r
  where p.id = p_pro
$$;

grant execute on function
  public.create_booking(uuid, text, text, timestamptz, boolean, uuid, int, text, public.payment_method),
  public.confirm_booking(uuid),
  public.decline_booking(uuid, text),
  public.start_booking(uuid),
  public.complete_booking(uuid),
  public.mark_no_show(uuid, text),
  public.cancel_booking(uuid, text),
  public.request_reschedule(uuid, timestamptz),
  public.respond_reschedule(uuid, boolean),
  public.post_job(text, text, timestamptz, boolean, uuid, int, text, public.payment_method),
  public.send_offer(uuid, int, text),
  public.accept_offer(uuid),
  public.withdraw_offer(uuid),
  public.write_review(uuid, int, text[], text, text[]),
  public.reply_review(uuid, text)
to authenticated;

revoke execute on function public.notify(uuid, text, text, text, text) from authenticated, anon;
revoke execute on function public.refresh_pro_rating(uuid) from authenticated, anon;
revoke execute on function public.booking_for_caller(uuid, public.app_role) from authenticated, anon;
