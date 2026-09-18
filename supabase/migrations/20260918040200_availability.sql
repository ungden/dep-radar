-- Availability: whether a freelancer can take a job at a given moment, and which
-- slots a customer may pick. The customer-visible slot list is generated from the
-- freelancer's own working hours and the service duration -- there is no fixed
-- list of times anywhere.

-- Minutes a booking of this service occupies, head count included.
create function public.service_duration_min(p_template text, p_variant text, p_quantity int default 1)
returns int language sql stable set search_path = '' as $$
  select case when v.per_person then v.duration_min * greatest(p_quantity, 1) else v.duration_min end
  from public.service_variants v
  where v.template_id = p_template and v.id = p_variant
$$;

-- The freelancer's listed price for one unit of this option.
create function public.listed_price(p_pro uuid, p_template text, p_variant text)
returns int language sql stable set search_path = '' as $$
  select p.price
  from public.pro_service_prices p
  join public.pro_services s on s.pro_id = p.pro_id and s.template_id = p.template_id
  where p.pro_id = p_pro and p.template_id = p_template and p.variant_id = p_variant and s.active
$$;

-- Is the whole window inside one of the freelancer's working windows, and not a day off?
create function public.within_working_hours(p_pro uuid, p_starts_at timestamptz, p_minutes int)
returns boolean language plpgsql stable set search_path = '' as $$
declare
  local_start timestamp := p_starts_at at time zone public.app_timezone();
  day date := local_start::date;
  from_min int := extract(hour from local_start) * 60 + extract(minute from local_start);
  to_min int := from_min + p_minutes;
begin
  if exists (select 1 from public.days_off d
             where d.pro_id = p_pro and day between d.starts_on and d.ends_on) then
    return false;
  end if;
  return exists (
    select 1 from public.working_hours w
    where w.pro_id = p_pro
      and w.weekday = extract(dow from local_start)::int
      and from_min >= w.start_min
      and to_min <= w.end_min
  );
end $$;

-- Why this booking cannot be made, in Vietnamese, or null when it can.
-- Every reason a customer's button is disabled comes from here, so the UI and the
-- database can never disagree about what is bookable.
create function public.availability_problem(
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
language plpgsql stable set search_path = '' as $$
declare
  pro record; policy record; tpl record; minutes int; km numeric; lead_min numeric; day_count int;
begin
  select * into pro from public.pros where id = p_pro;
  if pro is null then return 'Không tìm thấy chuyên viên.'; end if;
  if pro.suspended_at is not null then return 'Hồ sơ chuyên viên đang tạm khoá.'; end if;
  if not pro.published then return 'Chuyên viên chưa mở hồ sơ nhận lịch.'; end if;
  if not pro.accepting_jobs then return 'Chuyên viên đang tạm không nhận job mới.'; end if;

  select * into policy from public.fee_policy where id;
  select * into tpl from public.service_templates where id = p_template and active;
  if tpl is null then return 'Dịch vụ không còn được cung cấp.'; end if;

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

  return null;
end $$;

-- Bookable start times on one local date, on the freelancer's own step of 30 minutes.
create function public.free_slots(
  p_pro uuid,
  p_template text,
  p_variant text,
  p_quantity int,
  p_date date,
  p_at_home boolean default true,
  p_lat double precision default null,
  p_lng double precision default null
) returns setof timestamptz
language plpgsql stable set search_path = '' as $$
declare
  minutes int := public.service_duration_min(p_template, p_variant, p_quantity);
  w record;
  candidate timestamptz;
  m int;
begin
  if minutes is null then return; end if;
  for w in
    select start_min, end_min from public.working_hours
    where pro_id = p_pro and weekday = extract(dow from p_date)::int
    order by start_min
  loop
    m := w.start_min;
    while m + minutes <= w.end_min loop
      candidate := (p_date + make_interval(mins => m)) at time zone public.app_timezone();
      if public.availability_problem(
           p_pro, p_template, p_variant, p_quantity, candidate, p_at_home, p_lat, p_lng
         ) is null then
        return next candidate;
      end if;
      m := m + 30;
    end loop;
  end loop;
end $$;

grant execute on function
  public.service_duration_min(text, text, int),
  public.listed_price(uuid, text, text),
  public.within_working_hours(uuid, timestamptz, int),
  public.availability_problem(uuid, text, text, int, timestamptz, boolean, double precision, double precision, uuid),
  public.free_slots(uuid, text, text, int, date, boolean, double precision, double precision)
to authenticated, anon;
