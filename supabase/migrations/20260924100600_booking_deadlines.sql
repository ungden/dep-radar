-- When the freelancer has to answer, where the notification points, and when
-- the customer may still change the terms.
--
-- 1. The deadline to call and accept was "two hours, or the start time if that
--    comes first", around the clock. A booking made at 23:00 expired at 01:00,
--    while the freelancer slept, and the customer woke to "hết hạn chờ". Made
--    between 21:00 and 08:00 (Vietnam time), the deadline is now 10:00 the next
--    morning -- but never later than an hour before the appointment, so the
--    customer is not left hanging until the last minute, and never earlier than
--    the old rule, so no freelancer gets less time than before. One function,
--    used everywhere confirm_by is set: create_booking, accept_offer, and an
--    accepted reschedule of a pending booking.
-- 2. The new-booking notification pointed at /studio/jobs, a list, rather than
--    the booking it was about.
-- 3. Terms (what the pictures are for, whether they may be reposted) could be
--    changed until the session started. The freelancer accepted a job on the
--    terms they saw when they called; after that, the terms are the deal.

-- 1. The deadline --------------------------------------------------------------

-- p_at is the moment the booking is made; it is a parameter so the rule can be
-- tested at any hour, not just the hour CI happens to run.
create function public.confirm_deadline(p_starts_at timestamptz, p_at timestamptz default now())
returns timestamptz
language plpgsql stable set search_path = '' as $$
declare
  hours int;
  base timestamptz;
  local_at timestamp := p_at at time zone public.app_timezone();
  morning timestamptz;
begin
  select f.confirm_within_hours into hours from public.fee_policy f where f.id;
  -- The rule so far: two hours, or the start if that comes first.
  base := least(p_starts_at, p_at + make_interval(hours => hours));
  if local_at::time >= time '08:00' and local_at::time < time '21:00' then
    return base;
  end if;
  -- Overnight: 10:00 on the coming morning, local time.
  morning := ((local_at::date + case when local_at::time >= time '21:00' then 1 else 0 end)
              + time '10:00') at time zone public.app_timezone();
  -- No later than an hour before the start; never less time than the old rule.
  return greatest(base, least(morning, p_starts_at - interval '1 hour'));
end $$;

-- Same as 20260918040300, with the deadline above and the notification pointing
-- at the booking.
create or replace function public.create_booking(
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
    public.confirm_deadline(p_starts_at)
  ) returning id into new_id;

  perform public.notify(p_pro, 'booking_new', 'Có yêu cầu đặt lịch mới',
    'Gọi cho khách để xác nhận trước khi nhận job.', '/bookings/' || new_id);
  return new_id;
exception
  when exclusion_violation then
    raise exception 'Khung giờ này vừa có người đặt. Chọn giờ khác nhé.' using errcode = 'check_violation';
end $$;

-- Same as 20260919111530, with the deadline above and the notification pointing
-- at the booking the accepted offer became.
create or replace function public.accept_offer(p_offer uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); offer public.offers; job public.jobs; addr public.addresses; pro public.pros; policy public.fee_policy;
  minutes int; km numeric; q public.quote; problem text; new_id uuid;
begin
  select * into offer from public.offers where id = p_offer for update;
  if offer is null then raise exception 'Không tìm thấy báo giá.' using errcode = 'no_data_found'; end if;
  select * into job from public.jobs where id = offer.job_id for update;
  if job.customer_id <> me then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if job.status <> 'open' then raise exception 'Yêu cầu này đã được chốt.' using errcode = 'check_violation'; end if;
  if offer.status <> 'pending' or offer.expires_at < now() then raise exception 'Báo giá không còn hiệu lực.' using errcode = 'check_violation'; end if;
  select * into pro from public.pros where id = offer.pro_id;
  select * into policy from public.fee_policy where id;
  select * into addr from public.addresses where id = job.address_id and account_id = me;
  if addr is null then raise exception 'Địa chỉ của yêu cầu không còn.' using errcode = 'check_violation'; end if;
  problem := public.availability_problem(offer.pro_id, job.template_id, job.variant_id, job.quantity, job.starts_at, job.at_home, addr.lat, addr.lng);
  if problem is not null then raise exception '%', problem using errcode = 'check_violation'; end if;
  minutes := public.service_duration_min(job.template_id, job.variant_id, job.quantity);
  km := public.travel_distance_km(pro.lat, pro.lng, addr.lat, addr.lng, policy.road_factor);
  -- An offer is the same per-person unit price used by direct booking.
  q := public.build_quote(offer.price, job.quantity, job.at_home, km, public.is_urgent(job.starts_at));
  insert into public.bookings (customer_id, pro_id, template_id, variant_id, quantity, offer_id, source, starts_at, duration_min, buffer_min,
    at_home, city, district, address, address_note, lat, lng, note, service_price, distance_km, travel_fee, urgent_fee, commission_rate, commission,
    payment_method, status, confirm_by)
  values (me, offer.pro_id, job.template_id, job.variant_id, job.quantity, offer.id, 'job', job.starts_at, minutes, pro.buffer_min,
    job.at_home, addr.city, addr.district, addr.detail, addr.note, addr.lat, addr.lng, job.description, q.service_price, q.distance_km, q.travel_fee,
    q.urgent_fee, q.commission_rate, q.commission, job.payment_method, 'pending', public.confirm_deadline(job.starts_at))
  returning id into new_id;
  update public.offers set status = 'accepted' where id = offer.id;
  update public.offers set status = 'rejected' where job_id = job.id and id <> offer.id and status = 'pending';
  update public.jobs set status = 'booked' where id = job.id;
  perform public.notify(offer.pro_id, 'offer_accepted', 'Báo giá của bạn được chọn', 'Gọi cho khách để xác nhận nhận job.', '/bookings/' || new_id);
  return new_id;
exception when exclusion_violation then raise exception 'Chuyên viên vừa có lịch khác vào giờ này.' using errcode = 'check_violation';
end $$;

-- Same as 20260918040300, with the deadline above for a pending booking's new time.
create or replace function public.respond_reschedule(p_booking uuid, p_accept boolean) returns void
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
            then public.confirm_deadline(b.reschedule_to) else confirm_by end
      where id = p_booking;
  end if;
  perform public.notify(
    case when who = 'customer' then b.pro_id else b.customer_id end,
    'reschedule_answered',
    case when p_accept then 'Đổi giờ hẹn đã được đồng ý' else 'Đề nghị đổi giờ bị từ chối' end,
    '', '/bookings/' || p_booking);
end $$;

-- 3. Terms ---------------------------------------------------------------------

-- Same as 20260923100600, but only while the booking waits for the freelancer.
create or replace function public.set_booking_terms(p_booking uuid, p_usage_scope text, p_consent_repost boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status <> 'pending' then
    raise exception 'Chỉ đổi được thoả thuận khi lịch còn chờ chuyên viên xác nhận.' using errcode = 'check_violation';
  end if;
  if p_usage_scope is null or p_usage_scope not in ('personal', 'commercial') then
    raise exception 'Mục đích sử dụng không hợp lệ.' using errcode = 'check_violation';
  end if;
  if b.usage_scope = p_usage_scope and b.consent_repost = coalesce(p_consent_repost, false) then
    return;
  end if;
  update public.bookings
    set usage_scope = p_usage_scope, consent_repost = coalesce(p_consent_repost, false)
    where id = b.id;
  -- The freelancer will quote on these terms when they call; tell them they moved.
  perform public.notify(b.pro_id, 'booking_terms', 'Khách cập nhật thoả thuận sử dụng ảnh',
    case when p_usage_scope = 'commercial' then 'Ảnh/clip sẽ dùng cho mục đích kinh doanh.'
         else 'Ảnh/clip chỉ dùng cá nhân.' end
    || case when coalesce(p_consent_repost, false) then ' Khách đồng ý cho bạn đăng lại làm tác phẩm.'
            else ' Khách chưa đồng ý cho đăng lại.' end,
    '/bookings/' || b.id);
end $$;

-- Privileges -------------------------------------------------------------------

revoke all on function public.confirm_deadline(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function
  public.create_booking(uuid, text, text, timestamptz, boolean, uuid, int, text, public.payment_method),
  public.accept_offer(uuid),
  public.respond_reschedule(uuid, boolean),
  public.set_booking_terms(uuid, text, boolean)
from public, anon, authenticated;
grant execute on function
  public.create_booking(uuid, text, text, timestamptz, boolean, uuid, int, text, public.payment_method),
  public.accept_offer(uuid),
  public.respond_reschedule(uuid, boolean),
  public.set_booking_terms(uuid, text, boolean)
to authenticated;
