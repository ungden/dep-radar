-- availability_problem() learns three new reasons, and free_days() answers the
-- question the date picker actually asks.
--
-- Same body as 20260923100200, plus:
--  * a model service needs the freelancer verified *and* 18 or over
--    (20260924100100);
--  * a wallet past its overdraft limit takes no new booking (20260924100200).
--    The customer is told the freelancer is not taking jobs, which is true; the
--    freelancer asking (send_offer) is told why;
--  * a time block (20260924100300) is busy time, exactly like a booking,
--    including the travel buffer after the new job.
-- Still security definer (20260919111530): it has to see other customers'
-- bookings and the freelancer's private blocks to answer truthfully, and it
-- returns only a sentence.

create or replace function public.availability_problem(
  p_pro uuid,
  p_template text,
  p_variant text,
  p_quantity int,
  p_starts_at timestamptz,
  p_at_home boolean,
  p_lat double precision default null,
  p_lng double precision default null,
  p_ignore_booking uuid default null
) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  pro record; policy record; tpl record; minutes int; km numeric; lead_min numeric; day_count int;
begin
  select * into pro from public.pros where id = p_pro;
  if pro is null then return 'Không tìm thấy chuyên viên.'; end if;
  if pro.suspended_at is not null then return 'Hồ sơ chuyên viên đang tạm khoá.'; end if;
  if not pro.published then return 'Chuyên viên chưa mở hồ sơ nhận lịch.'; end if;
  if not pro.accepting_jobs then return 'Chuyên viên đang tạm không nhận job mới.'; end if;
  if public.wallet_below_floor(p_pro) then
    return case when auth.uid() = p_pro
      then 'Ví đang âm quá hạn mức, nạp ví để nhận lịch lại.'
      else 'Chuyên viên đang tạm không nhận job mới.' end;
  end if;

  select * into policy from public.fee_policy where id;
  select * into tpl from public.service_templates where id = p_template and active;
  if tpl is null then return 'Dịch vụ không còn được cung cấp.'; end if;
  if tpl.requires_verification and not (pro.identity_status = 'verified' and coalesce(pro.adult, false)) then
    return 'Dịch vụ người mẫu chỉ dành cho tài khoản đã xác minh và đủ 18 tuổi.';
  end if;

  if public.listed_price(p_pro, p_template, p_variant) is null then
    return 'Chuyên viên không nhận dịch vụ/gói này.';
  end if;

  minutes := public.service_duration_min(p_template, p_variant, p_quantity);
  if minutes is null then return 'Gói dịch vụ không hợp lệ.'; end if;

  lead_min := extract(epoch from (p_starts_at - now())) / 60;
  if lead_min < policy.min_lead_minutes then
    return format('Cần đặt trước ít nhất %s phút.', policy.min_lead_minutes);
  end if;

  if tpl.studio_only and p_at_home then
    return 'Dịch vụ này chỉ thực hiện tại studio.';
  end if;
  if p_at_home and not pro.home_service then
    return 'Chuyên viên không nhận làm tại nhà.';
  end if;
  if not p_at_home and coalesce(pro.studio_address, '') = '' then
    return 'Chuyên viên không có studio.';
  end if;

  if p_at_home then
    km := public.travel_distance_km(pro.lat, pro.lng, p_lat, p_lng, policy.road_factor);
    if km is null then
      return 'Cần địa chỉ có toạ độ để tính đường đi.';
    end if;
    if km > pro.max_travel_km then
      return format('Ngoài phạm vi di chuyển (%s km, tối đa %s km).', km, pro.max_travel_km);
    end if;
  end if;

  if not public.within_working_hours(p_pro, p_starts_at, minutes) then
    return 'Ngoài giờ làm việc của chuyên viên.';
  end if;

  select count(*) into day_count from public.bookings b
  where b.pro_id = p_pro
    and b.status in ('pending', 'confirmed', 'in_progress', 'completed')
    and (b.starts_at at time zone public.app_timezone())::date
        = (p_starts_at at time zone public.app_timezone())::date
    and (p_ignore_booking is null or b.id <> p_ignore_booking);
  if day_count >= pro.max_jobs_per_day then
    return 'Chuyên viên đã đủ số job trong ngày.';
  end if;

  if exists (
    select 1 from public.bookings b
    where b.pro_id = p_pro
      and b.status in ('pending', 'confirmed', 'in_progress')
      and (p_ignore_booking is null or b.id <> p_ignore_booking)
      and b.blocked_range && tstzrange(
            p_starts_at,
            p_starts_at + make_interval(mins => minutes + pro.buffer_min), '[)')
  ) then
    return 'Khung giờ này đã có lịch khác.';
  end if;

  -- Same words as a booking: the customer does not need to know it is not one.
  if exists (
    select 1 from public.time_blocks t
    where t.pro_id = p_pro
      and t.starts_at < p_starts_at + make_interval(mins => minutes + pro.buffer_min)
      and t.ends_at > p_starts_at
  ) then
    return 'Khung giờ này đã có lịch khác.';
  end if;

  return null;
end $$;

-- Which days in a window have at least one bookable start time. The date picker
-- used to ask free_slots() one day at a time and showed a day as open until the
-- customer tapped it and found nothing. This asks the same function, so a day
-- listed here is a day free_slots() will fill.
--
-- At most 21 days per call, never before today (Vietnam time): each day is a full
-- free_slots() run, and this is callable without signing in.
create function public.free_days(
  p_pro uuid,
  p_template text,
  p_variant text,
  p_quantity int,
  p_from date,
  p_days int,
  p_at_home boolean default true,
  p_lat double precision default null,
  p_lng double precision default null
) returns setof date
language plpgsql stable security definer set search_path = '' as $$
declare
  today date := (now() at time zone public.app_timezone())::date;
  first_day date := greatest(coalesce(p_from, today), today);
  last_day date := coalesce(p_from, today) + least(greatest(coalesce(p_days, 14), 1), 21) - 1;
  d date := first_day;
begin
  while d <= last_day loop
    if exists (
      select 1 from public.free_slots(p_pro, p_template, p_variant, p_quantity, d, p_at_home, p_lat, p_lng)
    ) then
      return next d;
    end if;
    d := d + 1;
  end loop;
end $$;

revoke all on function
  public.availability_problem(uuid, text, text, int, timestamptz, boolean, double precision, double precision, uuid),
  public.free_days(uuid, text, text, int, date, int, boolean, double precision, double precision)
from public, anon, authenticated;
-- Read-only, and useful before signing in, like free_slots().
grant execute on function
  public.availability_problem(uuid, text, text, int, timestamptz, boolean, double precision, double precision, uuid),
  public.free_days(uuid, text, text, int, date, int, boolean, double precision, double precision)
to anon, authenticated;
