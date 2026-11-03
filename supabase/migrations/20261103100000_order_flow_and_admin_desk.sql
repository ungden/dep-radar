-- What the partner and admin audit of 2026-11-03 found. Owner's decision: a
-- partner listed at or below an order's level may take it, and is paid at the
-- order's level.
--
-- 1. Matching: an order reached only partners listed at exactly its level, and
--    both sides default to different levels. Now: listed price <= order price.
-- 2. The urgent fee is the customer's for booking at short notice, decided when
--    the order is posted. Reading it again when an Artist takes the order pushed
--    an unfilled one over the agreed total in its last hours.
-- 3. An order inside the minimum lead time can no longer be taken, so it closes
--    then rather than saying "waiting" until its start time.
-- 4. One order or booking per service and time for a customer.
-- 5. A locked account locks its partner profile too, and a locked partner cannot
--    accept a booking that was already waiting.
-- 6. The staff can search 09xx numbers, hide one post, and close or finish what
--    is stuck. Every action below is written to admin_actions.

-- 1, 2 ------------------------------------------------------------------------

create or replace function public.job_problem(p_pro uuid,j public.jobs) returns text
language plpgsql stable security definer set search_path='' as $$
declare pro public.pros; addr public.addresses; q public.quote; km numeric; why text;
begin
  select * into pro from public.pros where id=p_pro;
  if pro is null then return 'Chỉ đối tác mới nhận việc được.'; end if;
  if public.wallet_below_floor(p_pro) then return 'Thanh toán phí của đơn trước để nhận việc mới.'; end if;
  if j.customer_id=p_pro then return 'Không thể nhận yêu cầu của chính mình.'; end if;
  if coalesce((j.service_contract->>'version')::int,1)<>(select catalog_version from public.service_templates where id=j.template_id) then return 'Gói dịch vụ đã cập nhật. Khách cần đăng lại yêu cầu để xác nhận phạm vi mới.'; end if;
  if j.status<>'open' or j.starts_at<=now() then return 'Yêu cầu không còn nhận được.'; end if;
  if pro.city<>j.city then return 'Yêu cầu ở thành phố khác.'; end if;
  if public.listed_price(p_pro,j.template_id,j.variant_id) is null then return 'Bạn chưa niêm yết dịch vụ/gói này.'; end if;
  if public.listed_price(p_pro,j.template_id,j.variant_id)>j.price then
    return 'Mức giá khách chọn thấp hơn giá bạn đang niêm yết cho gói này.'; end if;
  if public.blocked_between(j.customer_id,p_pro) then return 'Không nhận được yêu cầu này.'; end if;
  select * into addr from public.addresses where id=j.address_id;
  if addr is null then return 'Địa chỉ của yêu cầu không còn.'; end if;
  why:=public.availability_problem(p_pro,j.template_id,j.variant_id,j.quantity,j.starts_at,j.at_home,addr.lat,addr.lng);
  if why is not null then return why; end if;
  km:=public.travel_distance_km(pro.lat,pro.lng,addr.lat,addr.lng,(select road_factor from public.fee_policy where id));
  q:=public.build_quote(j.price,j.quantity,j.at_home,km,public.is_urgent(j.starts_at,j.created_at));
  if j.max_total is not null and q.total>j.max_total then return 'Tổng tiền vượt mức phụ phí khách đã đồng ý.'; end if;
  if coalesce((j.service_contract->>'sessions')::int,1)>1 then
    return 'Gói nhiều buổi cần đặt trực tiếp để chọn đủ lịch.'; end if;
  return null;
end $$;

create or replace function partner_private.my_job_eligibility(p_ids uuid[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare j public.jobs; pro public.pros; addr public.addresses; q public.quote; why text; out jsonb:='[]'; km numeric;
begin
  select * into pro from public.pros where id=auth.uid();
  if pro is null then raise exception 'Cần đăng nhập tài khoản đối tác.' using errcode='insufficient_privilege'; end if;
  if cardinality(p_ids)>200 then raise exception 'Tối đa 200 yêu cầu mỗi lượt.'; end if;
  for j in select * from public.jobs where id=any(p_ids) and status='open' loop
    why:=public.job_problem(pro.id,j);
    q:=null;
    if why is null then
      select * into addr from public.addresses where id=j.address_id;
      km:=public.travel_distance_km(pro.lat,pro.lng,addr.lat,addr.lng,(select road_factor from public.fee_policy where id));
      q:=public.build_quote(j.price,j.quantity,j.at_home,km,public.is_urgent(j.starts_at,j.created_at));
    end if;
    out:=out||jsonb_build_array(jsonb_build_object('id',j.id,'reason',why,'total',q.total,'payout',q.payout));
  end loop;
  return out;
end $$;

-- Same as 20260926100000, with the urgent fee as posted (2.). app.taking_job
-- tells close_overlapping_jobs (4.) which order this booking is.
create or replace function public.take_job(p_job uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); j public.jobs; addr public.addresses; pro public.pros; policy public.fee_policy;
  variant public.service_variants; minutes int; km numeric; q public.quote; problem text; new_id uuid;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into j from public.jobs where id = p_job for update;
  if j is null then raise exception 'Không tìm thấy yêu cầu.' using errcode = 'no_data_found'; end if;
  if j.status <> 'open' then
    raise exception 'Đã có người nhận việc này.' using errcode = 'check_violation';
  end if;
  if j.starts_at <= now() then
    raise exception 'Yêu cầu đã quá giờ.' using errcode = 'check_violation';
  end if;
  if public.wallet_below_floor(me) then
    raise exception 'Thanh toán phí của đơn trước để nhận việc mới.' using errcode = 'check_violation';
  end if;
  problem := public.job_problem(me, j);
  if problem is not null then raise exception '%', problem using errcode = 'check_violation'; end if;

  select * into pro from public.pros where id = me;
  select * into policy from public.fee_policy where id;
  select * into addr from public.addresses where id = j.address_id;
  select * into variant from public.service_variants where template_id = j.template_id and id = j.variant_id;
  if j.price is null or j.price < variant.min_price or j.price > variant.max_price then
    raise exception 'Giá của yêu cầu không hợp lệ.' using errcode = 'check_violation';
  end if;
  minutes := public.service_duration_min(j.template_id, j.variant_id, j.quantity);
  km := public.travel_distance_km(pro.lat, pro.lng, addr.lat, addr.lng, policy.road_factor);
  q := public.build_quote(j.price, j.quantity, j.at_home, km, public.is_urgent(j.starts_at, j.created_at));

  perform set_config('app.taking_job', j.id::text, true);
  insert into public.bookings (customer_id, pro_id, template_id, variant_id, quantity, source, starts_at, duration_min, buffer_min,
    at_home, city, district, address, address_note, lat, lng, note, service_price, distance_km, travel_fee, urgent_fee,
    commission_rate, commission, payment_method, status, confirm_by, confirmed_at)
  values (j.customer_id, me, j.template_id, j.variant_id, j.quantity, 'job', j.starts_at, minutes, pro.buffer_min,
    j.at_home, addr.city, addr.district, addr.detail, addr.note, addr.lat, addr.lng, j.description,
    q.service_price, q.distance_km, q.travel_fee, q.urgent_fee, q.commission_rate, q.commission,
    j.payment_method, 'confirmed', now(), now())
  returning id into new_id;
  update public.jobs set status = 'booked', booking_id = new_id where id = j.id;
  update public.offers set status = 'rejected' where job_id = j.id and status = 'pending';

  perform public.notify(j.customer_id, 'job_taken', coalesce(nullif(pro.display_name, ''), 'Người làm') || ' đã nhận việc',
    'Xem lịch hẹn và nhắn tin với người làm.', '/bookings/' || new_id);
  return new_id;
exception when exclusion_violation then
  raise exception 'Bạn đã có lịch khác vào giờ này.' using errcode = 'check_violation';
end $$;

-- 3 ---------------------------------------------------------------------------

-- Same as 20261007100100, but an order closes once the lead time has passed:
-- availability_problem refuses every partner from then on.
create or replace function public.expire_stale_jobs()
 returns integer
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare n int;
begin
  with done as (
    update public.jobs set status = 'expired'
      where status = 'open'
        and starts_at < now() + make_interval(mins => (select min_lead_minutes from public.fee_policy where id))
      returning id, customer_id, template_id
  ),
  told as (
    insert into public.notifications (account_id, kind, title, body, link)
    select d.customer_id, 'job_expired', 'Đơn chưa có Artist nhận',
           'Đơn ' || coalesce((select t.name from public.service_templates t where t.id = d.template_id), 'dịch vụ')
             || ' đã sát giờ mà chưa có Artist nhận nên đã đóng. Bạn có thể tự chọn một Artist hoặc đặt lại cho giờ khác.',
           '/requests'
    from done d
    returning 1
  )
  select count(*) into n from done;
  update public.offers set status = 'rejected'
    where status = 'pending' and (expires_at < now()
      or job_id in (select id from public.jobs where status <> 'open'));
  update public.castings set status = 'closed' where status = 'open' and starts_at < now();
  return n;
end $function$;

-- 4 ---------------------------------------------------------------------------

-- Same as 20261006100001, refusing a second order for the same service and time.
create or replace function public.post_job_checked(p_template text,p_variant text,p_starts_at timestamptz,p_at_home boolean,
  p_address_id uuid,p_quantity int,p_description text,p_payment public.payment_method,p_price int,p_max_total int)
returns uuid language plpgsql security invoker set search_path='' as $$
declare minutes int:=coalesce(public.service_duration_min(p_template,p_variant,p_quantity),0);
  span tstzrange:=tstzrange(p_starts_at,p_starts_at+make_interval(mins=>minutes),'[)');
begin
  if p_max_total is null or p_max_total<p_price*p_quantity then raise exception 'Xác nhận tổng tiền tối đa trước khi gửi yêu cầu.'; end if;
  if (select sessions>1 from public.service_variants where template_id=p_template and id=p_variant) then
    raise exception 'Gói nhiều buổi cần đặt trực tiếp từ hồ sơ đối tác.'; end if;
  if exists(select 1 from public.jobs j where j.customer_id=auth.uid() and j.status='open' and j.template_id=p_template
      and tstzrange(j.starts_at,j.starts_at+make_interval(mins=>coalesce(public.service_duration_min(j.template_id,j.variant_id,j.quantity),0)),'[)')&&span) then
    raise exception 'Bạn đã có đơn đang chờ cho dịch vụ này vào giờ đó.' using errcode='check_violation'; end if;
  if exists(select 1 from public.bookings b where b.customer_id=auth.uid() and b.status in('pending','confirmed','in_progress')
      and b.template_id=p_template and tstzrange(b.starts_at,b.ends_at,'[)')&&span) then
    raise exception 'Bạn đã có lịch cho dịch vụ này vào giờ đó.' using errcode='check_violation'; end if;
  perform set_config('app.job_max_total',p_max_total::text,true);
  return public.post_job(p_template,p_variant,p_starts_at,p_at_home,p_address_id,p_quantity,p_description,p_payment,p_price);
end $$;

-- A customer who booked an Artist directly while an order for the same service
-- and time was still waiting would otherwise get a second Artist at the door.
create function partner_private.close_overlapping_jobs() returns trigger
language plpgsql security definer set search_path='' as $$
declare span tstzrange:=tstzrange(new.starts_at,new.starts_at+make_interval(mins=>new.duration_min),'[)'); taking text:=coalesce(current_setting('app.taking_job',true),''); n int;
begin
  update public.jobs j set status='closed'
  where j.customer_id=new.customer_id and j.status='open' and j.template_id=new.template_id
    and j.id::text<>taking
    and tstzrange(j.starts_at,j.starts_at+make_interval(mins=>coalesce(public.service_duration_min(j.template_id,j.variant_id,j.quantity),0)),'[)')&&span;
  get diagnostics n=row_count;
  if n>0 then
    perform public.notify(new.customer_id,'job_closed','Đơn đang chờ đã đóng',
      'Bạn đã có lịch cho dịch vụ này cùng giờ nên đơn đang chờ Artist nhận đã được đóng.','/requests');
  end if;
  return new;
end $$;
revoke all on function partner_private.close_overlapping_jobs() from public,anon,authenticated;
create trigger bookings_close_overlapping_jobs after insert on public.bookings
  for each row when (new.status in ('pending','confirmed'))
  execute function partner_private.close_overlapping_jobs();

-- 5 ---------------------------------------------------------------------------

-- Same as 20261004100000. A profile locked by this keeps the account's own
-- timestamp, so unlocking leaves alone a profile the staff had locked separately.
create or replace function public.admin_set_account_suspended(p_account uuid, p_suspended boolean, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare was timestamptz; at timestamptz;
begin
  perform public.require_admin();
  if p_account = auth.uid() then
    raise exception 'Không tự khoá tài khoản của mình.' using errcode = 'check_violation';
  end if;
  select suspended_at into was from public.accounts where id = p_account;
  update public.accounts set
    suspended_at = case when p_suspended then coalesce(suspended_at, now()) end,
    suspend_reason = case when p_suspended then left(coalesce(p_reason, ''), 300) else '' end
  where id = p_account
  returning suspended_at into at;
  if not found then raise exception 'Không tìm thấy tài khoản.' using errcode = 'no_data_found'; end if;
  perform set_config('app.system_write', 'on', true);
  if p_suspended then
    update public.pros set suspended_at = coalesce(suspended_at, at), accepting_jobs = false where id = p_account;
  else
    update public.pros set suspended_at = null where id = p_account and suspended_at = was;
  end if;
  perform set_config('app.system_write', '', true);
  perform public.log_admin_action(case when p_suspended then 'account:lock' else 'account:unlock' end, p_account,
    jsonb_build_object('reason', coalesce(p_reason, '')));
end $$;

-- Accounts locked before this.
do $$
begin
  perform set_config('app.system_write', 'on', true);
  update public.pros p set suspended_at = a.suspended_at, accepting_jobs = false
  from public.accounts a
  where a.id = p.id and a.suspended_at is not null and p.suspended_at is null;
  perform set_config('app.system_write', '', true);
end $$;

-- Same as 20260926100000, plus the profile lock.
create or replace function public.confirm_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = p_booking for update;
  if b is null or b.pro_id <> auth.uid() then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if b.status <> 'pending' then raise exception 'Lịch hẹn không còn ở trạng thái chờ xác nhận.' using errcode = 'check_violation'; end if;
  if (select suspended_at from public.pros where id = b.pro_id) is not null then
    raise exception 'Hồ sơ của bạn đang tạm khoá. Liên hệ hỗ trợ 360dep để được xem xét.' using errcode = 'check_violation';
  end if;
  if now() > b.confirm_by then
    update public.bookings set status = 'expired', cancelled_at = now(), cancel_reason = 'Quá hạn xác nhận' where id = b.id;
    raise exception 'Đã quá hạn xác nhận lịch hẹn.' using errcode = 'check_violation';
  end if;
  if public.wallet_below_floor(b.pro_id) then
    raise exception 'Thanh toán phí của đơn trước để nhận lịch này.' using errcode = 'check_violation';
  end if;
  update public.bookings set status = 'confirmed', confirmed_at = now() where id = b.id;
  perform public.notify(b.customer_id, 'booking_confirmed', 'Người làm đã nhận lịch',
    'Giờ hai bên nhắn tin được với nhau trong lịch hẹn.', '/bookings/' || p_booking);
end $$;

-- 6 ---------------------------------------------------------------------------

-- Same as 20261004100000, plus numbers as people type them: accounts keep
-- +84987..., the staff search 0987...
create or replace function public.admin_customers(p_query text default '', p_limit int default 200) returns table (
  id uuid, full_name text, phone text, email text, created_at timestamptz, is_pro boolean,
  bookings bigint, completed bigint, cancelled bigint, no_shows bigint, spent bigint,
  last_booking_at timestamptz, suspended_at timestamptz, suspend_reason text
)
language plpgsql stable security definer set search_path = '' as $$
declare
  q text := lower(trim(coalesce(p_query, '')));
  digits text := case when q ~ '^[+0-9 .()-]+$' then regexp_replace(regexp_replace(q, '\D', '', 'g'), '^(84|0)', '') else '' end;
begin
  perform public.require_admin();
  return query
  select a.id, a.full_name, a.phone,
    -- Phone-only accounts carry a stand-in address (lib/auth/identifier.ts).
    case when u.email like '%@sdt.360dep.vn' or u.email like '%.local' then null else u.email end::text,
    a.created_at, exists (select 1 from public.pros p where p.id = a.id),
    count(b.id), count(b.id) filter (where b.status = 'completed'),
    count(b.id) filter (where b.status = 'cancelled' and b.cancelled_by = 'customer'),
    count(b.id) filter (where b.status = 'no_show'),
    coalesce(sum(b.total - b.discount) filter (where b.status = 'completed'), 0)::bigint,
    max(b.starts_at), a.suspended_at, a.suspend_reason
  from public.accounts a
  left join auth.users u on u.id = a.id
  left join public.bookings b on b.customer_id = a.id
  where q = '' or lower(a.full_name) like '%' || q || '%' or a.phone like '%' || q || '%'
     or (char_length(digits) >= 3 and a.phone like '%' || digits || '%')
     or lower(coalesce(u.email, '')) like '%' || q || '%'
  group by a.id, u.email
  order by max(b.created_at) desc nulls last, a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 1000));
end $$;

-- Same as 20260926100000, with its own words when the staff close a job.
create or replace function public.finish_booking(p_booking uuid, p_by text) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; days int; due timestamptz; balance int;
begin
  select * into b from public.bookings where id = p_booking for update;
  if b.status not in ('confirmed', 'in_progress') then
    raise exception 'Job không ở trạng thái có thể hoàn thành.' using errcode = 'check_violation';
  end if;
  select delivery_days into days from public.service_templates where id = b.template_id;
  due := case when days is not null then now() + make_interval(days => days) end;
  update public.bookings set status = 'completed', completed_at = now(), delivery_due_at = due where id = p_booking;
  insert into public.wallet_entries (pro_id, booking_id, kind, amount, note)
  values (b.pro_id, b.id, 'commission', -b.commission, 'Phí dịch vụ 360dep')
  on conflict (booking_id, kind) do nothing;

  if p_by <> 'customer' then
    perform public.notify(b.customer_id, 'booking_completed',
      case p_by when 'auto' then 'Lịch hẹn đã tự động hoàn thành' when 'admin' then '360dep đã đóng lịch hẹn: hoàn thành' else 'Lịch hẹn đã hoàn thành' end,
      case when due is not null then 'Ảnh/clip sẽ được giao trước ' || to_char(due at time zone public.app_timezone(), 'DD/MM') || '. '
           else '' end || 'Đánh giá trong 14 ngày để giúp người sau chọn đúng.',
      '/bookings/' || p_booking);
  end if;

  -- The bill, now. Settled from a prepaid balance if there is one.
  balance := public.wallet_balance(b.pro_id);
  if balance < 0 then
    perform public.notify(b.pro_id, 'fee_due',
      'Thanh toán phí ' || to_char(-balance, 'FM999G999G999') || 'đ để nhận đơn tiếp',
      'Phí 360dep của lịch hẹn vừa xong. Chuyển khoản theo mã trong Ví; nạp dư để lần sau khỏi chờ.',
      '/studio/wallet');
  elsif p_by <> 'pro' then
    perform public.notify(b.pro_id, 'booking_completed',
      case p_by when 'auto' then 'Lịch hẹn đã tự động hoàn thành' when 'admin' then '360dep đã đóng lịch hẹn: hoàn thành' else 'Khách xác nhận đã xong' end,
      'Phí đã trừ vào ví. Đánh giá khách trong 14 ngày.', '/bookings/' || p_booking);
  end if;
end $$;

-- One post or clip, reported or not. Same words as admin_override_ai_decision.
create function public.admin_set_work_hidden(p_work uuid, p_hidden boolean, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare w public.works; note text := nullif(left(trim(coalesce(p_reason, '')), 300), '');
begin
  perform public.require_admin();
  select * into w from public.works where id = p_work for update;
  if w.id is null then raise exception 'Bài đăng này đã bị xoá.' using errcode = 'no_data_found'; end if;
  perform set_config('app.system_write', 'on', true);
  if p_hidden then
    update public.works set hidden_at = now(), hidden_by = 'admin', ai_checked_at = now(),
      hidden_reason = coalesce(note, 'Nội dung chưa phù hợp với quy định của 360dep.')
    where id = w.id;
    perform public.notify(w.pro_id, 'work_hidden', 'Một bài đăng đã bị ẩn: ' || left(w.title, 60),
      coalesce(note, 'Nội dung chưa phù hợp với quy định của 360dep.'), '/studio/works');
  else
    update public.works set hidden_at = null, hidden_reason = null, hidden_by = null, ai_checked_at = now()
    where id = w.id;
    perform public.notify(w.pro_id, 'work_shown', 'Bài đăng đã hiện lại: ' || left(w.title, 60),
      'Nhân viên 360dep đã xem lại và cho hiện bài đăng này.', '/studio/works');
  end if;
  perform set_config('app.system_write', '', true);
  perform public.log_admin_action(case when p_hidden then 'work:hide' else 'work:show' end, w.id,
    jsonb_build_object('reason', coalesce(note, ''), 'pro', w.pro_id));
end $$;

-- A booking that has to end: a locked partner, a dispute, a customer who cannot
-- be reached. No fee is charged on a cancelled booking, as in cancel_booking.
create function public.admin_cancel_booking(p_booking uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; why text := left(trim(coalesce(p_reason, '')), 280);
begin
  perform public.require_admin();
  if char_length(why) < 5 then raise exception 'Ghi lý do huỷ, hai bên sẽ đọc được.' using errcode = 'check_violation'; end if;
  select * into b from public.bookings where id = p_booking for update;
  if b.id is null then raise exception 'Không tìm thấy lịch hẹn.' using errcode = 'no_data_found'; end if;
  if b.status not in ('pending', 'confirmed', 'in_progress') then
    raise exception 'Lịch hẹn này không còn huỷ được.' using errcode = 'check_violation';
  end if;
  update public.bookings set status = 'cancelled', cancelled_at = now(), cancelled_by = null,
    cancel_reason = '360dep huỷ: ' || why where id = b.id;
  perform public.notify(b.customer_id, 'booking_cancelled', '360dep đã huỷ lịch hẹn', why, '/bookings/' || b.id);
  perform public.notify(b.pro_id, 'booking_cancelled', '360dep đã huỷ lịch hẹn', why, '/bookings/' || b.id);
  perform public.log_admin_action('booking:cancel', b.id, jsonb_build_object('reason', why, 'from', b.status));
end $$;

-- A job that happened but nobody closed. The fee is charged as on any completion.
create function public.admin_complete_booking(p_booking uuid, p_note text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  perform public.require_admin();
  select * into b from public.bookings where id = p_booking;
  if b.id is null then raise exception 'Không tìm thấy lịch hẹn.' using errcode = 'no_data_found'; end if;
  if now() < b.starts_at then raise exception 'Chưa tới giờ hẹn.' using errcode = 'check_violation'; end if;
  perform public.finish_booking(b.id, 'admin');
  perform public.log_admin_action('booking:complete', b.id, jsonb_build_object('note', left(coalesce(p_note, ''), 300)));
end $$;

-- An order that should not stay open. It is kept, closed, for the record.
create function public.admin_close_job(p_job uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare j public.jobs; why text := left(trim(coalesce(p_reason, '')), 280);
begin
  perform public.require_admin();
  if char_length(why) < 5 then raise exception 'Ghi lý do đóng đơn, khách sẽ đọc được.' using errcode = 'check_violation'; end if;
  update public.jobs set status = 'closed' where id = p_job and status = 'open' returning * into j;
  if j.id is null then raise exception 'Đơn không còn mở.' using errcode = 'check_violation'; end if;
  perform public.notify(j.customer_id, 'job_closed', '360dep đã đóng đơn của bạn', why, '/requests');
  perform public.log_admin_action('job:close', j.id, jsonb_build_object('reason', why));
end $$;

-- Tell again whoever can take it now: a partner approved or back at work since
-- it was posted. Returns how many were told.
create function public.admin_renotify_job(p_job uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare j public.jobs; n int;
begin
  perform public.require_admin();
  select * into j from public.jobs where id = p_job for update;
  if j.id is null or j.status <> 'open' then raise exception 'Đơn không còn mở.' using errcode = 'check_violation'; end if;
  insert into public.notifications (account_id, kind, title, body, link)
  select p.id, 'job_new',
         'Việc mới: ' || coalesce((select name from public.service_templates where id = j.template_id), 'dịch vụ'),
         j.district || ' · ' || to_char(j.starts_at at time zone public.app_timezone(), 'HH24:MI DD/MM')
           || ' · ' || public.vnd(j.price * j.quantity) || 'đ. Ai nhận trước được việc.',
         '/studio/jobs'
  from public.pros p
  where p.published and p.suspended_at is null and p.accepting_jobs and p.city = j.city
    and public.job_problem(p.id, j) is null;
  get diagnostics n = row_count;
  update public.jobs set notified = greatest(coalesce(notified, 0), n) where id = j.id;
  perform public.log_admin_action('job:renotify', j.id, jsonb_build_object('told', n));
  return n;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'admin_set_work_hidden(uuid, boolean, text)', 'admin_cancel_booking(uuid, text)',
    'admin_complete_booking(uuid, text)', 'admin_close_job(uuid, text)', 'admin_renotify_job(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
