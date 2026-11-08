-- Spas (owner, 08/11/2026): a partner can be a place customers go to, with
-- several beds working at the same time. Makeup and the travelling Artist stay
-- the main business; this adds a second kind of partner beside it.
--
-- 1. pros.kind ('artist' | 'spa'), pros.beds, pros.amenities.
-- 2. Every live booking holds one bed (bookings.seat). The overlap constraint
--    becomes per bed, so an Artist (one bed) is exactly as before and a spa
--    with N beds takes N customers at once.
-- 3. A spa is always booked at its own address, whatever the studio switch.
-- 4. Free times say how many beds are left (cart_slot_beds).
-- 5. A 90-minute "gội + massage cổ vai gáy" option on gội đầu dưỡng sinh.

-- 1. The partner --------------------------------------------------------------
alter table public.pros
  add column kind text not null default 'artist' check (kind in ('artist', 'spa')),
  add column beds smallint not null default 1 check (beds between 1 and 30),
  add column amenities text[] not null default '{}' check (cardinality(amenities) <= 12);
alter table public.pros add constraint pros_one_bed_artist check (kind = 'spa' or beds = 1);

grant update (kind, beds, amenities) on public.pros to authenticated;

create or replace function public.save_partner_profile(p_profile jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare me uuid:=auth.uid();
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode='insufficient_privilege'; end if;
  if jsonb_typeof(p_profile)<>'object' then raise exception 'Hồ sơ không hợp lệ.'; end if;
  if p_profile ? 'amenities' and jsonb_typeof(p_profile->'amenities') <> 'array' then
    raise exception 'Tiện nghi không hợp lệ.' using errcode='check_violation';
  end if;
  update public.pros set
    display_name=case when p_profile?'displayName' then trim(p_profile->>'displayName') else display_name end,
    title=case when p_profile?'title' then trim(p_profile->>'title') else title end,
    bio=case when p_profile?'bio' then trim(p_profile->>'bio') else bio end,
    categories=case when p_profile?'categories' then array(select jsonb_array_elements_text(p_profile->'categories'))::public.category_id[] else categories end,
    city=coalesce(p_profile->>'city',city),district=coalesce(p_profile->>'district',district),
    studio_address=case when p_profile?'studioAddress' then nullif(trim(p_profile->>'studioAddress'),'') else studio_address end,
    home_service=coalesce((p_profile->>'homeService')::boolean,home_service),
    max_travel_km=coalesce((p_profile->>'maxTravelKm')::int,max_travel_km),
    equipment=case when p_profile?'equipment' then nullif(trim(p_profile->>'equipment'),'') else equipment end,
    avatar_path=case when p_profile?'avatarPath' then nullif(p_profile->>'avatarPath','') else avatar_path end,
    kind=coalesce(p_profile->>'kind',kind),
    beds=case when coalesce(p_profile->>'kind',kind)='spa' then coalesce((p_profile->>'beds')::smallint,beds) else 1 end,
    amenities=case when p_profile?'amenities'
      then array(select trim(a) from jsonb_array_elements_text(p_profile->'amenities') a where trim(a)<>'' limit 12)
      else amenities end
    where id=me;
  if not found then raise exception 'Cần tạo hồ sơ đối tác trước.'; end if;
end $$;

-- A spa needs its address before it opens; it is never booked at home.
create or replace function partner_private.guard_spa_profile() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.kind = 'spa' then
    new.home_service := false;
    if new.published and coalesce(trim(new.studio_address), '') = '' then
      raise exception 'Spa cần địa chỉ cơ sở trước khi mở hồ sơ.' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
revoke all on function partner_private.guard_spa_profile() from public, anon, authenticated;
-- "aa_" so it runs before aa_partner_setup checks home service or an address.
create trigger aa_a_spa_profile before insert or update on public.pros
  for each row execute function partner_private.guard_spa_profile();

-- 2. One bed per live booking -------------------------------------------------
alter table public.bookings
  add column seat smallint not null default 1 check (seat between 1 and 30);

alter table public.bookings drop constraint bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (pro_id with =, seat with =, blocked_range with &&)
  where (status in ('pending', 'confirmed', 'in_progress'));

-- The lowest free bed, keeping the one already held when it is still free.
-- Runs after booking_window has set blocked_range.
create or replace function partner_private.assign_booking_seat() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n smallint; free smallint;
begin
  if new.status not in ('pending', 'confirmed', 'in_progress') then return new; end if;
  select p.beds into n from public.pros p where p.id = new.pro_id;
  if coalesce(n, 1) <= 1 then
    new.seat := 1;
    return new;
  end if;
  select s into free from generate_series(1, n) as s
  where not exists (
    select 1 from public.bookings b
    where b.pro_id = new.pro_id and b.id <> new.id and b.seat = s
      and b.status in ('pending', 'confirmed', 'in_progress')
      and b.blocked_range && new.blocked_range)
  order by (s = new.seat) desc, s
  limit 1;
  if free is null then
    raise exception 'Khung giờ này đã kín chỗ.' using errcode = 'exclusion_violation';
  end if;
  new.seat := free;
  return new;
end $$;
revoke all on function partner_private.assign_booking_seat() from public, anon, authenticated;
create trigger booking_zz_seat
  before insert or update of starts_at, duration_min, buffer_min, status, pro_id on public.bookings
  for each row execute function partner_private.assign_booking_seat();

-- availability_problem: a time is taken only when every bed is; a spa's day
-- is not capped by the one-person max_jobs_per_day.
do $$
declare
  fn regprocedure := 'public.availability_problem(uuid,text,text,integer,timestamptz,boolean,double precision,double precision,uuid)';
  def text := pg_get_functiondef(fn);
  old_head text := $o$  if exists (
    select 1 from public.bookings b
    where b.pro_id = p_pro
      and b.status in ('pending', 'confirmed', 'in_progress')
      and (p_ignore_booking is null or b.id <> p_ignore_booking)
      and b.blocked_range && tstzrange(
            p_starts_at,
            p_starts_at + make_interval(mins => minutes + pro.buffer_min), '[)')
  ) then
    return 'Khung giờ này đã có lịch khác.';$o$;
  new_head text := $n$  if not exists (
    select 1 from generate_series(1, greatest(pro.beds, 1)) as bed
    where not exists (
      select 1 from public.bookings b
      where b.pro_id = p_pro and b.seat = bed
        and b.status in ('pending', 'confirmed', 'in_progress')
        and (p_ignore_booking is null or b.id <> p_ignore_booking)
        and b.blocked_range && tstzrange(
              p_starts_at,
              p_starts_at + make_interval(mins => minutes + pro.buffer_min), '[)'))
  ) then
    return case when pro.beds > 1 then 'Khung giờ này đã kín chỗ.' else 'Khung giờ này đã có lịch khác.' end;$n$;
  old_cap text := '  if day_count >= pro.max_jobs_per_day then';
  new_cap text := '  if pro.kind <> ''spa'' and day_count >= pro.max_jobs_per_day then';
begin
  if position(old_head in def) = 0 or position(old_cap in def) = 0 then
    raise exception 'availability_problem changed: review 20261108100000_spa_venues';
  end if;
  def := replace(replace(def, old_head, new_head), old_cap, new_cap);
  execute def;
end $$;

-- 3. A spa is booked at the spa, whatever the studio switch ------------------
create or replace function partner_private.guard_travelling_freelancer_booking() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not new.at_home and not coalesce((
    select s.studio_booking_open from public.platform_settings s where s.id
  ), false) then
    if tg_table_name = 'bookings' then
      if exists (select 1 from public.pros p where p.id = new.pro_id and p.kind = 'spa') then
        return new;
      end if;
      if new.parent_booking_id is not null and exists (
        select 1 from public.bookings b where b.id = new.parent_booking_id and not b.at_home
      ) then return new; end if;
    end if;
    raise exception 'Hiện chỉ nhận lịch freelancer đến nhà hoặc địa điểm khách chọn. Đặt lịch tại studio chưa mở.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- 4. Free times with the beds left -------------------------------------------
-- Same times as cart_slots at the spa, plus how many beds stay free for the
-- whole appointment. Open to the signed out, as cart_slots is.
create or replace function public.cart_slot_beds(p_pro uuid, p_items jsonb, p_date date)
returns table (starts_at timestamptz, free_beds int)
language plpgsql stable security definer set search_path = '' as $$
declare v_minutes int; v_buffer int; v_beds int; v_at timestamptz;
begin
  select sum(l.l_minutes) into v_minutes from partner_private.cart_lines(p_pro, p_items, false) l;
  select p.buffer_min, greatest(p.beds, 1) into v_buffer, v_beds from public.pros p where p.id = p_pro;
  for v_at in select s from public.cart_slots(p_pro, p_items, p_date, false) s loop
    starts_at := v_at;
    select count(*) into free_beds from generate_series(1, v_beds) as bed
    where not exists (
      select 1 from public.bookings b
      where b.pro_id = p_pro and b.seat = bed
        and b.status in ('pending', 'confirmed', 'in_progress')
        and b.blocked_range && tstzrange(v_at, v_at + make_interval(mins => v_minutes + v_buffer), '[)'));
    return next;
  end loop;
end $$;
revoke all on function public.cart_slot_beds(uuid, jsonb, date) from public;
grant execute on function public.cart_slot_beds(uuid, jsonb, date) to anon, authenticated;

-- 5. Gội + massage cổ vai gáy, 90 phút (lib/catalog.ts) ------------------------
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-wash', 'combo90', '90 phút, kèm massage cổ vai gáy', 90, 250000, 450000, 320000, array[250000, 320000, 450000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers, sort_order = excluded.sort_order;
