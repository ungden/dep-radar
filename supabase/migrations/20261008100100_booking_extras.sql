-- At-home booking, per the owner's spec (08/10/2026):
--
-- 1. Add-ons chosen with the booking ("tháo móng cũ", "làm tóc đi kèm"…):
--    each one is a booking of its own, chained right after the main one, same
--    place, at the partner's listed price, with no travel or urgent fee. The
--    partner accepts the main booking and its add-ons come with it; when the
--    main one does not happen, neither do they.
-- 2. 1 to 3 reference photos ("ảnh mẫu"), seen by the customer and the
--    partner of that booking only.
-- 3. "Thợ đang di chuyển": the partner says they have set off; the customer
--    is told.

-- 1 ---------------------------------------------------------------------------
create function public.attach_addons(p_parent uuid, p_items jsonb) returns uuid[]
language plpgsql security definer set search_path = '' as $$
declare
  parent public.bookings; item jsonb; v public.service_variants; t public.service_templates; pro public.pros;
  unit int; qty int; minutes int; starts timestamptz; q public.quote; new_id uuid; ids uuid[] := '{}'; n int; i int := 0;
begin
  perform 1 from public.bookings where id = p_parent for update;
  parent := public.booking_for_caller(p_parent, 'customer');
  if parent.status <> 'pending' or parent.created_at < now() - interval '15 minutes' then
    raise exception 'Chỉ thêm dịch vụ đi kèm ngay khi đặt lịch.' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Danh sách dịch vụ không hợp lệ.' using errcode = 'check_violation'; end if;
  n := jsonb_array_length(p_items);
  if n = 0 then return ids; end if;
  if n > 3 then raise exception 'Thêm tối đa 3 dịch vụ đi kèm.' using errcode = 'check_violation'; end if;
  if exists (select 1 from public.bookings b where b.parent_booking_id = parent.id) then
    raise exception 'Lịch này đã có dịch vụ đi kèm.' using errcode = 'check_violation';
  end if;
  select * into pro from public.pros where id = parent.pro_id;

  starts := parent.ends_at;
  -- The partner stays on: no gap after the main job or between the add-ons.
  update public.bookings set buffer_min = 0 where id = parent.id;

  for item in select * from jsonb_array_elements(p_items) loop
    i := i + 1;
    select * into v from public.service_variants where template_id = item->>'template' and id = item->>'variant';
    select * into t from public.service_templates where id = item->>'template';
    if v is null or t is null then raise exception 'Dịch vụ đi kèm không còn được cung cấp.' using errcode = 'check_violation'; end if;
    if v.sessions > 1 then raise exception 'Gói nhiều buổi cần đặt riêng.' using errcode = 'check_violation'; end if;
    if t.studio_only and parent.at_home then
      raise exception '"%" chỉ làm tại studio.', t.name using errcode = 'check_violation';
    end if;
    qty := greatest(coalesce((item->>'quantity')::int, 1), 1);
    if qty < v.min_quantity or qty > v.max_quantity then
      raise exception 'Số người không hợp lệ cho "%".', t.name using errcode = 'check_violation';
    end if;
    unit := public.listed_price(parent.pro_id, t.id, v.id);
    if unit is null then raise exception 'Người làm chưa niêm yết "%".', t.name using errcode = 'check_violation'; end if;
    minutes := public.service_duration_min(t.id, v.id, qty);
    -- Accepting the main booking accepts these too, so they must fit the hours the partner opened.
    if not public.within_working_hours(parent.pro_id, starts, minutes) then
      raise exception '"%" làm nối sau sẽ quá giờ làm của người làm. Bỏ bớt dịch vụ hoặc chọn giờ sớm hơn.', t.name using errcode = 'check_violation';
    end if;
    q := public.build_quote(unit, qty, false, null, false);
    insert into public.bookings (
      customer_id, pro_id, template_id, variant_id, quantity, source, parent_booking_id,
      starts_at, duration_min, buffer_min,
      at_home, city, district, address, address_note, lat, lng, note,
      service_price, distance_km, travel_fee, urgent_fee, commission_rate, commission,
      payment_method, status, confirm_by
    ) values (
      parent.customer_id, parent.pro_id, t.id, v.id, qty, 'direct', parent.id,
      starts, minutes, case when i = n then pro.buffer_min else 0 end,
      parent.at_home, parent.city, parent.district, parent.address, parent.address_note, parent.lat, parent.lng,
      'Dịch vụ đi kèm lịch chính',
      q.service_price, null, 0, 0, q.commission_rate, q.commission,
      parent.payment_method, 'pending', parent.confirm_by
    ) returning id into new_id;
    ids := ids || new_id;
    starts := starts + make_interval(mins => minutes);
  end loop;
  return ids;
exception
  when exclusion_violation then
    raise exception 'Người làm đã có lịch ngay sau, chưa thêm được dịch vụ đi kèm.' using errcode = 'check_violation';
end $$;

-- The main booking decides for its add-ons: accepted together, gone together.
create function public.booking_addons_follow() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = old.status or new.parent_booking_id is not null then return new; end if;
  if new.status = 'confirmed' and old.status = 'pending' then
    update public.bookings set status = 'confirmed', confirmed_at = now()
      where parent_booking_id = new.id and status = 'pending';
  elsif new.status in ('declined', 'expired', 'cancelled') then
    update public.bookings
      set status = 'cancelled', cancelled_at = now(), cancelled_by = coalesce(new.cancelled_by, 'pro'),
          cancel_reason = 'Lịch chính không diễn ra'
      where parent_booking_id = new.id and status in ('pending', 'confirmed');
  end if;
  return new;
end $$;
revoke all on function public.booking_addons_follow() from public, anon, authenticated;
create trigger bookings_addons_follow after update of status on public.bookings
  for each row execute function public.booking_addons_follow();

-- 2 ---------------------------------------------------------------------------
alter table public.bookings add column reference_photos text[] not null default '{}'
  check (cardinality(reference_photos) <= 3);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('references', 'references', false, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "customer uploads own reference photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'references' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "booking parties read reference photos" on storage.objects for select to authenticated
  using (bucket_id = 'references' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.bookings b where b.pro_id = (select auth.uid()) and b.reference_photos @> array[objects.name])
    or (select public.is_admin())
  ));
create policy "customer removes own reference photos" on storage.objects for delete to authenticated
  using (bucket_id = 'references' and (storage.foldername(name))[1] = (select auth.uid())::text);

create function public.set_booking_references(p_booking uuid, p_paths text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; p text;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status not in ('pending', 'confirmed') then
    raise exception 'Chỉ gửi ảnh mẫu cho lịch hẹn chưa diễn ra.' using errcode = 'check_violation';
  end if;
  if coalesce(cardinality(p_paths), 0) > 3 then raise exception 'Gửi tối đa 3 ảnh mẫu.' using errcode = 'check_violation'; end if;
  foreach p in array coalesce(p_paths, '{}') loop
    if split_part(p, '/', 1) <> b.customer_id::text then
      raise exception 'Ảnh mẫu không hợp lệ.' using errcode = 'check_violation';
    end if;
  end loop;
  update public.bookings set reference_photos = coalesce(p_paths, '{}') where id = b.id;
end $$;

-- 3 ---------------------------------------------------------------------------
alter table public.bookings add column departed_at timestamptz;

create function public.mark_departed(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status <> 'confirmed' then
    raise exception 'Chỉ báo đang di chuyển cho lịch đã nhận, chưa bắt đầu.' using errcode = 'check_violation';
  end if;
  if not b.at_home then raise exception 'Lịch tại studio không cần báo di chuyển.' using errcode = 'check_violation'; end if;
  if now() < b.starts_at - interval '3 hours' then
    raise exception 'Báo đang di chuyển được từ 3 giờ trước giờ hẹn.' using errcode = 'check_violation';
  end if;
  if b.departed_at is not null then return; end if;
  update public.bookings set departed_at = now() where id = b.id;
  perform public.notify(b.customer_id, 'pro_departed', 'Người làm đang trên đường tới',
    'Giữ điện thoại để người làm liên lạc khi tới nơi.', '/bookings/' || b.id);
end $$;

revoke all on function
  public.attach_addons(uuid, jsonb),
  public.set_booking_references(uuid, text[]),
  public.mark_departed(uuid)
from public, anon;
grant execute on function
  public.attach_addons(uuid, jsonb),
  public.set_booking_references(uuid, text[]),
  public.mark_departed(uuid)
to authenticated;
