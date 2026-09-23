-- The owner's rules for how a customer and a freelancer meet (23/09/2026):
--
-- 1. They are matched first, and only then talk. A match is either
--    * the customer picked a freelancer and that freelancer accepted, or
--    * the customer posted a request, every freelancer who can do it was told,
--      and the first to press "Nhận việc" got it (as Grab, bTaskee do).
--    No chat before that: no questions from a profile, no quotes to compare.
-- 2. The fee is paid before the next job. Completing a job charges the
--    commission to the freelancer's wallet; while the wallet is below zero
--    they cannot accept a booking or take a request. Nothing to photograph:
--    "Hoàn thành" is one tap.
-- 3. The chat ends with the job. Completed, cancelled, declined, expired or
--    no-show: the conversation is read-only from that moment.
--
-- This replaces the pre-booking questions, contact masking, the 72-hour
-- after-care window and the quote board from 20260925100000 and 20260918040300.

-- 1a. Chat exists only around a live match -------------------------------------------

-- 'waiting': a booking the freelancer has not accepted yet; 'open': a live
-- match; 'closed': anything else. A PostgREST computed field on threads.
create function public.chat_status(t public.threads) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when t.booking_id is not null then coalesce((
      select case
        when b.status in ('confirmed', 'in_progress') then 'open'
        when b.status = 'pending' then 'waiting'
        else 'closed'
      end
      from public.bookings b where b.id = t.booking_id), 'closed')
    -- A model accepted for a casting call is a match too, until the day after the shoot.
    when exists (
      select 1 from public.casting_applications a
      join public.castings c on c.id = a.casting_id
      where a.account_id = t.customer_id and c.pro_id = t.pro_id and a.status = 'accepted'
        and c.starts_at > now() - interval '1 day'
    ) then 'open'
    else 'closed'
  end
$$;

revoke all on function public.chat_status(public.threads) from public, anon;
grant execute on function public.chat_status(public.threads) to authenticated;

-- When it closed (null while waiting or open).
create or replace function public.closes_at(t public.threads) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select case
    when public.chat_status(t) <> 'closed' then null
    when t.booking_id is not null then (
      select coalesce(b.completed_at, b.cancelled_at, b.confirm_by)
      from public.bookings b where b.id = t.booking_id)
    else coalesce((
      select max(c.starts_at) + interval '1 day'
      from public.casting_applications a
      join public.castings c on c.id = a.casting_id
      where a.account_id = t.customer_id and c.pro_id = t.pro_id and a.status = 'accepted'), t.created_at)
  end
$$;

-- Same as 20260924100900, but only about a booking the freelancer accepted (or
-- an accepted casting call). No conversation starts from a profile.
create or replace function public.open_thread(p_pro uuid, p_booking uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  customer uuid;
  pro record;
  b public.bookings;
  existing uuid;
  new_id uuid;
  who text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into pro from public.pros where id = p_pro;
  if pro is null then raise exception 'Không tìm thấy chuyên viên.' using errcode = 'no_data_found'; end if;

  if p_booking is null then
    -- Only the chat of an accepted casting call exists outside a booking.
    customer := me;
    if me = p_pro or not exists (
      select 1 from public.casting_applications a
      join public.castings c on c.id = a.casting_id
      where a.account_id = me and c.pro_id = p_pro and a.status = 'accepted'
        and c.starts_at > now() - interval '1 day'
    ) then
      raise exception 'Nhắn tin mở khi người làm đã nhận lịch của bạn.' using errcode = 'check_violation';
    end if;
  else
    select * into b from public.bookings where id = p_booking and pro_id = p_pro;
    if b is null or me not in (b.customer_id, b.pro_id) then
      raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
    end if;
    customer := b.customer_id;
    if b.status = 'pending' then
      raise exception 'Nhắn tin mở khi người làm nhận lịch.' using errcode = 'check_violation';
    end if;
    if b.status not in ('confirmed', 'in_progress') then
      raise exception 'Lịch hẹn đã kết thúc, không nhắn tin được nữa.' using errcode = 'check_violation';
    end if;
  end if;

  if public.blocked_between(customer, p_pro) then
    raise exception 'Không thể nhắn tin với tài khoản này.' using errcode = 'check_violation';
  end if;

  select id into existing from public.threads
  where pro_id = p_pro and customer_id = customer and booking_id is not distinct from p_booking;
  if existing is not null then return existing; end if;

  select coalesce(nullif(full_name, ''), 'Khách hàng') into who from public.accounts where id = customer;
  insert into public.threads (customer_id, pro_id, booking_id, customer_name)
  values (customer, p_pro, p_booking, who)
  returning id into new_id;
  return new_id;
end $$;

-- Same as 20260925100000, with the new rule in place of masking and the
-- question limit: only an open chat takes messages. Still returns a boolean
-- (always false now: nothing is hidden) so older app builds keep working.
create or replace function public.send_message(p_thread uuid, p_body text default '', p_image_paths text[] default '{}') returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  thread_row public.threads;
  v_body text := left(trim(coalesce(p_body, '')), 2000);
  state text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into thread_row from public.threads where id = p_thread for share;
  if thread_row is null or me not in (thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if public.blocked_between(thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không thể nhắn tin với tài khoản này.' using errcode = 'check_violation';
  end if;
  state := public.chat_status(thread_row);
  if state = 'waiting' then
    raise exception 'Nhắn tin mở khi người làm nhận lịch.' using errcode = 'check_violation';
  elsif state <> 'open' then
    raise exception 'Lịch hẹn đã kết thúc, cuộc trò chuyện đã đóng.' using errcode = 'check_violation';
  end if;
  if length(v_body) = 0 and coalesce(array_length(p_image_paths, 1), 0) = 0 then
    raise exception 'Nhập tin nhắn.' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_image_paths, 1), 0) > 6
     or exists (select 1 from unnest(coalesce(p_image_paths, '{}')) path where path !~ ('^' || me::text || '/[0-9a-f-]+\.jpg$')) then
    raise exception 'Ảnh chat không hợp lệ.' using errcode = 'check_violation';
  end if;
  insert into public.messages (thread_id, sender_id, body, image_paths)
  values (p_thread, me, v_body, coalesce(p_image_paths, '{}'));
  return false;
end $$;

drop function public.mask_contact(text);
drop function public.contact_allowed(uuid, uuid);

-- 1b. A request goes to everyone who can do it; the first to take it gets it -----------

alter table public.jobs
  -- What the customer pays per person, fixed when posting: the catalogue's
  -- suggested price unless they offer more (within the catalogue band).
  add column price int check (price > 0 and price % 5000 = 0),
  add column booking_id uuid references public.bookings (id) on delete set null,
  add column notified int not null default 0;

update public.jobs j set price = v.suggested_price
from public.service_variants v
where v.template_id = j.template_id and v.id = j.variant_id and j.price is null;

-- Customers no longer edit a posted request (the price is part of the deal a
-- freelancer accepts); they delete it and post again.
drop policy "customer edits own open job" on public.jobs;
revoke update on public.jobs from authenticated;

-- Why this freelancer cannot take this request, or null.
create function public.job_problem(p_pro uuid, j public.jobs) returns text
language plpgsql stable security definer set search_path = '' as $$
declare pro public.pros; addr public.addresses;
begin
  select * into pro from public.pros where id = p_pro;
  if pro is null then return 'Chỉ người làm mới nhận việc được.'; end if;
  if j.customer_id = p_pro then return 'Không thể nhận yêu cầu của chính mình.'; end if;
  if pro.city <> j.city then return 'Yêu cầu ở thành phố khác.'; end if;
  if public.listed_price(p_pro, j.template_id, j.variant_id) is null then
    return 'Bạn chưa niêm yết dịch vụ/gói này.';
  end if;
  if public.blocked_between(j.customer_id, p_pro) then return 'Không nhận được yêu cầu này.'; end if;
  select * into addr from public.addresses where id = j.address_id;
  if addr is null then return 'Địa chỉ của yêu cầu không còn.'; end if;
  return public.availability_problem(p_pro, j.template_id, j.variant_id, j.quantity, j.starts_at, j.at_home, addr.lat, addr.lng);
end $$;

-- Same as 20260919111530, with the price and the call-out.
drop function public.post_job(text, text, timestamptz, boolean, uuid, int, text, public.payment_method);
create function public.post_job(
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
  if v_price % 5000 <> 0 or v_price < variant.suggested_price or v_price > variant.max_price then
    raise exception 'Giá phải từ %đ đến %đ.', variant.suggested_price, variant.max_price using errcode = 'check_violation';
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

-- The first freelancer to press "Nhận việc" gets it: a confirmed booking at
-- the request's price, and the chat opens.
create function public.take_job(p_job uuid) returns uuid
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
  q := public.build_quote(j.price, j.quantity, j.at_home, km, public.is_urgent(j.starts_at));

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

-- Quotes are gone: a request is taken, not bid on.
create or replace function public.send_offer(p_job uuid, p_price int, p_message text) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'Yêu cầu giờ do người làm nhận trực tiếp: bấm "Nhận việc".' using errcode = 'feature_not_supported';
end $$;

-- 2. The fee before the next job ----------------------------------------------------

-- Below zero is below the floor: a completed job's commission is owed at once.
update public.fee_policy set wallet_floor = 0;
alter table public.fee_policy alter column wallet_floor set default 0;

-- Same as 20260919111530, plus the wallet: accepting is the next job.
create or replace function public.confirm_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = p_booking for update;
  if b is null or b.pro_id <> auth.uid() then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if b.status <> 'pending' then raise exception 'Lịch hẹn không còn ở trạng thái chờ xác nhận.' using errcode = 'check_violation'; end if;
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

-- Same as 20260925100100, plus asking for the fee straight away.
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
      case when p_by = 'auto' then 'Lịch hẹn đã tự động hoàn thành' else 'Lịch hẹn đã hoàn thành' end,
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
      case when p_by = 'auto' then 'Lịch hẹn đã tự động hoàn thành' else 'Khách xác nhận đã xong' end,
      'Phí đã trừ vào ví. Đánh giá khách trong 14 ngày.', '/bookings/' || p_booking);
  end if;
end $$;

-- Same as 20260924100200, but it only reminds: the floor itself (checked when
-- accepting and when a customer books) is what stops new jobs, and it lifts
-- by itself the moment the fee is paid. Switching accepting_jobs off meant the
-- freelancer had to remember to switch it back on.
create or replace function public.enforce_wallet_threshold(p_limit int default null) returns int
language plpgsql security definer set search_path = '' as $$
declare v_limit int; n int;
begin
  select coalesce(p_limit, f.wallet_floor) into v_limit from public.fee_policy f where f.id;
  insert into public.notifications (account_id, kind, title, body, link)
  select p.id, 'fee_due', 'Còn phí chưa thanh toán',
         'Thanh toán ' || to_char(-public.wallet_balance(p.id), 'FM999G999G999') || 'đ để nhận đơn mới.', '/studio/wallet'
  from public.pros p
  where public.wallet_balance(p.id) < v_limit
    and not exists (
      select 1 from public.notifications x
      where x.account_id = p.id and x.kind = 'fee_due' and x.created_at > now() - interval '1 day'
    );
  get diagnostics n = row_count;
  return n;
end $$;

-- Paying: a short code on the transfer, recorded by staff or by the bank's webhook.
alter table public.pros add column pay_code text unique check (pay_code ~ '^[A-HJ-NP-Z2-9]{6}$');

-- Executable by anyone: a profile may be created by the signed-in user, and a
-- column default runs as them. It only returns an unused random code.
create function public.new_pay_code() returns text
language plpgsql volatile set search_path = '' as $$
declare code text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.pros where pay_code = code);
  end loop;
  return code;
end $$;

update public.pros set pay_code = public.new_pay_code() where pay_code is null;
alter table public.pros alter column pay_code set default public.new_pay_code();
alter table public.pros alter column pay_code set not null;

-- One bank transaction is credited once.
create unique index wallet_entries_topup_ref_key on public.wallet_entries (ref) where kind = 'topup' and ref is not null;

create function public.credit_topup(p_pro uuid, p_amount int, p_ref text, p_note text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare balance int;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Số tiền không hợp lệ.' using errcode = 'check_violation';
  end if;
  insert into public.wallet_entries (pro_id, kind, amount, ref, note)
  values (p_pro, 'topup', p_amount, nullif(trim(coalesce(p_ref, '')), ''), left(coalesce(p_note, ''), 200));
  balance := public.wallet_balance(p_pro);
  perform public.notify(p_pro, 'wallet_topup', 'Đã nhận ' || to_char(p_amount, 'FM999G999G999') || 'đ vào ví',
    case when balance >= 0 then 'Bạn nhận đơn mới được rồi.' else 'Còn thiếu ' || to_char(-balance, 'FM999G999G999') || 'đ.' end,
    '/studio/wallet');
  return true;
exception when unique_violation then
  return false;  -- the same transfer, reported twice
end $$;

-- Staff, after checking the bank statement.
create function public.record_topup(p_pro uuid, p_amount int, p_ref text default '') returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if not exists (select 1 from public.pros where id = p_pro) then
    raise exception 'Không tìm thấy người làm.' using errcode = 'no_data_found';
  end if;
  perform public.credit_topup(p_pro, p_amount, p_ref, 'Nạp ví (nhân viên ghi nhận)');
end $$;

-- The bank's webhook (app/api/payments/sepay), with the server's key only.
-- Returns false when the code matches nobody or the transaction was already
-- credited.
create function public.record_bank_topup(p_content text, p_amount int, p_ref text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare code text; pro uuid;
begin
  code := upper(substring(coalesce(p_content, '') from '(?i)NAP[^A-Za-z0-9]*([A-HJ-NP-Z2-9]{6})'));
  if code is null then return false; end if;
  select id into pro from public.pros where pay_code = code;
  if pro is null then return false; end if;
  return public.credit_topup(pro, p_amount, p_ref, 'Chuyển khoản ' || code);
end $$;

revoke all on function
  public.job_problem(uuid, public.jobs),
  public.credit_topup(uuid, int, text, text),
  public.record_bank_topup(text, int, text),
  public.record_topup(uuid, int, text),
  public.take_job(uuid),
  public.post_job(text, text, timestamptz, boolean, uuid, int, text, public.payment_method, int)
from public, anon, authenticated;
grant execute on function
  public.take_job(uuid),
  public.post_job(text, text, timestamptz, boolean, uuid, int, text, public.payment_method, int),
  public.record_topup(uuid, int, text)
to authenticated;
grant execute on function public.record_bank_topup(text, int, text) to service_role;
