-- What is left of the audit of 2026-11-03 on the order side.
--
-- 1. A partner hears when a booking waiting for them expires; only the customer did.
-- 2. A customer holds at most five orders waiting at a time.
-- 3. Notifications say "Artist" as the app does.
-- Patched in place, as in 20261103100000: these functions have been rewritten before.

do $patch$
declare definition text; needle text;
begin
  select pg_get_functiondef('public.expire_stale_bookings()'::regprocedure) into definition;
  needle := '  return n;';
  if position(needle in definition) = 0 then raise exception 'expire_stale_bookings changed: review this migration'; end if;
  definition := replace(definition, needle, $l$  insert into public.notifications (account_id, kind, title, body, link)
  select b.pro_id, 'booking_expired', 'Một lịch đã hết hạn nhận',
         'Bạn chưa nhận lịch kịp nên lịch đã tự huỷ, khách được báo để chọn người khác.', '/bookings/' || b.id
  from public.bookings b
  where b.status = 'expired' and b.cancelled_at > now() - interval '1 minute';

$l$ || needle);
  execute definition;

  select pg_get_functiondef('public.post_job_checked(text,text,timestamptz,boolean,uuid,integer,text,public.payment_method,integer,integer)'::regprocedure) into definition;
  needle := $l$  perform set_config('app.job_max_total'$l$;
  if position(needle in definition) = 0 then raise exception 'post_job_checked changed: review this migration'; end if;
  definition := replace(definition, needle, $l$  if (select count(*) from public.jobs j where j.customer_id=auth.uid() and j.status='open')>=5 then
    raise exception 'Bạn đang có 5 đơn chờ Artist nhận. Huỷ bớt hoặc đợi rồi đặt tiếp.' using errcode='check_violation'; end if;
$l$ || needle);
  execute definition;

  select pg_get_functiondef('public.take_job(uuid)'::regprocedure) into definition;
  needle := $l$coalesce(nullif(pro.display_name, ''), 'Người làm') || ' đã nhận việc',
    'Xem lịch hẹn và nhắn tin với người làm.'$l$;
  if position(needle in definition) = 0 then raise exception 'take_job changed: review this migration'; end if;
  definition := replace(definition, needle, $l$coalesce(nullif(pro.display_name, ''), 'Artist') || ' đã nhận đơn',
    'Xem lịch hẹn và nhắn tin với Artist.'$l$);
  execute definition;

  select pg_get_functiondef('public.confirm_booking(uuid)'::regprocedure) into definition;
  needle := $l$'Người làm đã nhận lịch'$l$;
  if position(needle in definition) = 0 then raise exception 'confirm_booking changed: review this migration'; end if;
  definition := replace(definition, needle, $l$'Artist đã nhận lịch'$l$);
  execute definition;
end $patch$;
