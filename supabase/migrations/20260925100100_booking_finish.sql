-- How a job ends, from either side.
--
-- Until now only the freelancer could close a job, so a booking whose
-- freelancer forgot stayed "confirmed" for ever: no review, no commission, and
-- the chat never closed. As on Fiverr and TaskRabbit:
--
-- 1. The customer can confirm it is done ("Xác nhận đã xong") from the start
--    time on, exactly as if the freelancer had.
-- 2. Nobody does anything: 24 hours after the booked end, the job completes on
--    its own and both are told. A customer who was let down reports it within
--    those 24 hours instead (3.).
-- 3. The freelancer did not come (and never pressed "Bắt đầu"): the customer
--    reports it from 15 minutes after the start until 24 hours after the end. The booking is cancelled on the
--    freelancer, no commission is charged, 360dep gets a report to look at, and
--    a second one in 30 days is flagged to the admins as a pattern.

-- One way to finish a job, whoever finishes it.
create function public.finish_booking(p_booking uuid, p_by text) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; days int; due timestamptz;
begin
  select * into b from public.bookings where id = p_booking for update;
  if b.status not in ('confirmed', 'in_progress') then
    raise exception 'Job không ở trạng thái có thể hoàn thành.' using errcode = 'check_violation';
  end if;
  select delivery_days into days from public.service_templates where id = b.template_id;
  due := case when days is not null then now() + make_interval(days => days) end;
  update public.bookings set status = 'completed', completed_at = now(), delivery_due_at = due where id = p_booking;
  insert into public.wallet_entries (pro_id, booking_id, kind, amount, note)
  values (b.pro_id, b.id, 'commission', -b.commission, 'Hoa hồng job hoàn thành')
  on conflict (booking_id, kind) do nothing;

  if p_by <> 'customer' then
    perform public.notify(b.customer_id, 'booking_completed',
      case when p_by = 'auto' then 'Lịch hẹn đã tự động hoàn thành' else 'Job đã hoàn thành' end,
      case when due is not null then 'Ảnh/clip sẽ được giao trước ' || to_char(due at time zone public.app_timezone(), 'DD/MM') || '. '
           else '' end || 'Đánh giá trong 14 ngày để giúp người sau chọn đúng.',
      '/bookings/' || p_booking);
  end if;
  if p_by <> 'pro' then
    perform public.notify(b.pro_id, 'booking_completed',
      case when p_by = 'auto' then 'Lịch hẹn đã tự động hoàn thành' else 'Khách xác nhận đã xong' end,
      'Đánh giá khách trong 14 ngày để xem khách đánh giá bạn.',
      '/bookings/' || p_booking);
  end if;
end $$;

-- Same as 20260923100600, through finish_booking.
create or replace function public.complete_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'pro');
  if now() < b.starts_at then
    raise exception 'Chưa tới giờ hẹn, không thể đánh dấu hoàn thành.' using errcode = 'check_violation';
  end if;
  perform public.finish_booking(p_booking, 'pro');
end $$;

create function public.confirm_booking_done(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'customer');
  if now() < b.starts_at then
    raise exception 'Chưa tới giờ hẹn.' using errcode = 'check_violation';
  end if;
  perform public.finish_booking(p_booking, 'customer');
end $$;

-- Every fifteen minutes: jobs a day past their end that nobody closed.
create function public.auto_complete_bookings() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in
    select id from public.bookings
    where status in ('confirmed', 'in_progress') and ends_at + interval '24 hours' < now()
    order by ends_at
    limit 500
  loop
    perform public.finish_booking(r.id, 'auto');
    n := n + 1;
  end loop;
  return n;
end $$;

create function public.report_pro_no_show(p_booking uuid, p_detail text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; recent int;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'customer');
  -- Once the freelancer has pressed "Bắt đầu" they say they are there; a
  -- dispute about that is for support, not a button.
  if b.status <> 'confirmed' then
    raise exception 'Chỉ báo được lịch hẹn đã xác nhận mà người làm chưa bắt đầu. Liên hệ hỗ trợ nếu cần.' using errcode = 'check_violation';
  end if;
  if now() < b.starts_at + interval '15 minutes' then
    raise exception 'Đợi ít nhất 15 phút sau giờ hẹn rồi hãy báo.' using errcode = 'check_violation';
  end if;
  if now() > b.ends_at + interval '24 hours' then
    raise exception 'Đã quá 24 giờ sau giờ hẹn. Liên hệ hỗ trợ nếu cần.' using errcode = 'check_violation';
  end if;

  update public.bookings
    set status = 'cancelled', cancelled_at = now(), cancelled_by = 'pro',
        cancel_reason = 'Người làm không đến'
    where id = b.id;
  insert into public.reports (reporter_id, target_account_id, booking_id, reason, detail)
  values (b.customer_id, b.pro_id, b.id, 'pro_no_show', left(trim(coalesce(p_detail, '')), 1000));

  select count(*) into recent from public.reports r
  where r.target_account_id = b.pro_id and r.reason = 'pro_no_show' and r.created_at > now() - interval '30 days';

  insert into public.notifications (account_id, kind, title, body, link)
  select a.id, 'pro_no_show',
         case when recent >= 2 then 'Người làm không đến lần thứ ' || recent || ' trong 30 ngày' else 'Khách báo người làm không đến' end,
         left(trim(coalesce(p_detail, '')), 200), '/admin'
  from public.accounts a where a.is_admin;

  perform public.notify(b.pro_id, 'pro_no_show', 'Khách báo bạn không đến',
    'Lịch hẹn đã huỷ. Nếu có nhầm lẫn, hãy liên hệ 360dep. Không đến nhiều lần sẽ bị tạm khoá nhận lịch.',
    '/bookings/' || b.id);
end $$;

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is not available here; schedules skipped';
    return;
  end if;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobname) from cron.job where jobname = 'dep360-auto-complete';
  perform cron.schedule('dep360-auto-complete', '*/15 * * * *', 'select public.auto_complete_bookings()');
end $$;

revoke all on function
  public.finish_booking(uuid, text),
  public.auto_complete_bookings(),
  public.confirm_booking_done(uuid),
  public.report_pro_no_show(uuid, text)
from public, anon, authenticated;
grant execute on function
  public.confirm_booking_done(uuid),
  public.report_pro_no_show(uuid, text)
to authenticated;
