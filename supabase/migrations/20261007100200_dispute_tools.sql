-- Tools that take the usual disputes out of guesswork (owner, 07/10/2026):
--
-- 1. A customer's phone reaches the freelancer only once the booking is
--    accepted, like the other way round. Until then the freelancer sees the
--    name, now kept on the booking (and kept in step with the account, so a
--    deleted account's name goes from its bookings too).
-- 2. "Đã nhận tiền": the freelancer records that the customer paid (paid_at),
--    and the customer is told. The end of "I paid" / "you did not".
-- 3. A freelancer reported as "không đến" can dispute it within 24 hours,
--    the way a customer can dispute a no-show; it goes to the staff.
-- 4. "Đặt thêm dịch vụ" during an appointment: the customer adds a listed
--    service right after the current one, same place, no travel or urgent
--    fee (same trip); the freelancer accepts it like any booking.

-- 1 ---------------------------------------------------------------------------
alter table public.bookings add column customer_name text not null default '';

update public.bookings b
set customer_name = coalesce(nullif(a.full_name, ''), 'Khách hàng')
from public.accounts a
where a.id = b.customer_id;

create function public.booking_customer_name() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select coalesce(nullif(a.full_name, ''), 'Khách hàng') into new.customer_name
  from public.accounts a where a.id = new.customer_id;
  return new;
end $$;
revoke all on function public.booking_customer_name() from public, anon, authenticated;
create trigger bookings_customer_name before insert on public.bookings
  for each row execute function public.booking_customer_name();

create function public.account_name_to_bookings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.bookings set customer_name = coalesce(nullif(new.full_name, ''), 'Khách hàng')
  where customer_id = new.id;
  return new;
end $$;
revoke all on function public.account_name_to_bookings() from public, anon, authenticated;
create trigger accounts_name_to_bookings after update of full_name on public.accounts
  for each row when (new.full_name is distinct from old.full_name)
  execute function public.account_name_to_bookings();

drop policy "read own account" on public.accounts;
create policy "read own account" on public.accounts for select using (
  id = (select auth.uid())
  or public.is_admin()
  -- Each side of a booking sees the other's account (name, phone) once the
  -- booking is real: accepted, in progress, or over after it happened.
  or exists (
    select 1 from public.bookings b
    where b.status in ('confirmed', 'in_progress', 'completed', 'no_show')
      and ((b.customer_id = accounts.id and b.pro_id = (select auth.uid()))
        or (b.pro_id = accounts.id and b.customer_id = (select auth.uid())))
  )
);

-- 2 ---------------------------------------------------------------------------
create function public.confirm_payment_received(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status not in ('confirmed', 'in_progress', 'completed') then
    raise exception 'Chỉ xác nhận được tiền của lịch hẹn đã nhận.' using errcode = 'check_violation';
  end if;
  if now() < b.starts_at - interval '15 minutes' then
    raise exception 'Xác nhận đã nhận tiền sau khi làm.' using errcode = 'check_violation';
  end if;
  if b.paid_at is not null then return; end if;
  update public.bookings set paid_at = now() where id = b.id;
  perform public.notify(b.customer_id, 'payment_received', 'Người làm đã xác nhận nhận tiền',
    'Đã nhận ' || public.vnd(b.total - coalesce(b.discount, 0)) || 'đ cho lịch hẹn này.', '/bookings/' || b.id);
end $$;

-- 3 ---------------------------------------------------------------------------
create function public.dispute_pro_no_show(p_booking uuid, p_reason text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; v_reason text := trim(coalesce(p_reason, '')); report_id uuid;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status <> 'cancelled' or b.cancel_reason is distinct from 'Người làm không đến' then
    raise exception 'Chỉ khiếu nại được lịch hẹn bị khách báo không đến.' using errcode = 'check_violation';
  end if;
  if now() > b.cancelled_at + interval '24 hours' then
    raise exception 'Đã quá 24 giờ kể từ khi bị báo. Liên hệ hỗ trợ nếu cần.' using errcode = 'check_violation';
  end if;
  if char_length(v_reason) < 10 then
    raise exception 'Cho 360dep biết chuyện gì đã xảy ra (ít nhất 10 ký tự).' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.reports r where r.booking_id = b.id and r.reporter_id = b.pro_id and r.reason = 'pro_no_show_dispute') then
    raise exception 'Bạn đã khiếu nại lịch hẹn này rồi.' using errcode = 'check_violation';
  end if;
  -- The insert reaches the staff through reports_notify_staff (20261007100100).
  insert into public.reports (reporter_id, target_account_id, booking_id, reason, detail)
  values (b.pro_id, b.customer_id, b.id, 'pro_no_show_dispute', left(v_reason, 1000))
  returning id into report_id;
  return report_id;
end $$;

-- 4 ---------------------------------------------------------------------------
alter table public.bookings add column parent_booking_id uuid references public.bookings (id) on delete set null;

create function public.add_on_booking(
  p_parent uuid, p_template text, p_variant text, p_quantity int default 1, p_note text default ''
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  parent public.bookings; v public.service_variants; t public.service_templates;
  unit int; minutes int; starts timestamptz; q public.quote; new_id uuid;
begin
  perform 1 from public.bookings where id = p_parent for update;
  parent := public.booking_for_caller(p_parent, 'customer');
  if parent.status not in ('confirmed', 'in_progress') then
    raise exception 'Chỉ đặt thêm được trong một lịch hẹn đang diễn ra.' using errcode = 'check_violation';
  end if;
  if now() < parent.starts_at - interval '15 minutes' or now() > parent.ends_at + interval '1 hour' then
    raise exception 'Đặt thêm dịch vụ được trong lúc buổi hẹn đang diễn ra.' using errcode = 'check_violation';
  end if;
  select * into v from public.service_variants where template_id = p_template and id = p_variant;
  select * into t from public.service_templates where id = p_template;
  if v is null or t is null then raise exception 'Dịch vụ không còn được cung cấp.' using errcode = 'check_violation'; end if;
  if v.sessions > 1 then raise exception 'Gói nhiều buổi cần đặt riêng.' using errcode = 'check_violation'; end if;
  if p_quantity < v.min_quantity or p_quantity > v.max_quantity then
    raise exception 'Số người không hợp lệ cho gói dịch vụ này.' using errcode = 'check_violation';
  end if;
  if t.studio_only and parent.at_home then
    raise exception 'Dịch vụ này chỉ làm tại studio.' using errcode = 'check_violation';
  end if;
  unit := public.listed_price(parent.pro_id, p_template, p_variant);
  if unit is null then raise exception 'Người làm chưa niêm yết gói này.' using errcode = 'check_violation'; end if;

  minutes := public.service_duration_min(p_template, p_variant, p_quantity);
  starts := greatest(parent.ends_at, date_trunc('minute', now()));
  -- Same trip: no travel fee, no urgent fee.
  q := public.build_quote(unit, p_quantity, false, null, false);
  -- The freelancer stays on, so no gap is needed after the current job.
  update public.bookings set buffer_min = 0 where id = parent.id;

  insert into public.bookings (
    customer_id, pro_id, template_id, variant_id, quantity, source, parent_booking_id,
    starts_at, duration_min, buffer_min,
    at_home, city, district, address, address_note, lat, lng, note,
    service_price, distance_km, travel_fee, urgent_fee, commission_rate, commission,
    payment_method, status, confirm_by
  )
  select parent.customer_id, parent.pro_id, p_template, p_variant, p_quantity, 'direct', parent.id,
    starts, minutes, p.buffer_min,
    parent.at_home, parent.city, parent.district, parent.address, parent.address_note, parent.lat, parent.lng,
    left(coalesce(p_note, ''), 500),
    q.service_price, null, 0, 0, q.commission_rate, q.commission,
    'cash', 'pending', greatest(now() + interval '30 minutes', starts)
  from public.pros p where p.id = parent.pro_id
  returning id into new_id;

  perform public.notify(parent.pro_id, 'booking_new', 'Khách đặt thêm dịch vụ',
    coalesce(t.name, 'Dịch vụ') || ' ngay sau lịch hiện tại, ' || public.vnd(q.service_price) || 'đ. Bấm Nhận lịch nếu bạn làm được.',
    '/bookings/' || new_id);
  return new_id;
exception
  when exclusion_violation then
    raise exception 'Người làm đã có lịch ngay sau, không thêm được vào lúc này.' using errcode = 'check_violation';
end $$;

revoke all on function
  public.confirm_payment_received(uuid),
  public.dispute_pro_no_show(uuid, text),
  public.add_on_booking(uuid, text, text, int, text)
from public, anon;
grant execute on function
  public.confirm_payment_received(uuid),
  public.dispute_pro_no_show(uuid, text),
  public.add_on_booking(uuid, text, text, int, text)
to authenticated;
