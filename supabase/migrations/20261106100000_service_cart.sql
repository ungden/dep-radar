-- A customer books several services of one Artist as one appointment.
--
-- Each line stays a booking of its own, chained after the main one as
-- attach_addons always did, so fees, commission and wallet entries keep working
-- line by line. What changes: the whole cart is priced, checked and created in
-- one transaction, and `in_cart` lines follow the main booking through every
-- step. Clients fold them into the main booking when they show it.
--
-- Bookings made by add_on_booking during a visit are not `in_cart`: the partner
-- still accepts and finishes each of those by itself.

alter table public.bookings add column in_cart boolean not null default false;

-- Functions later migrations rewrote are patched in place.
do $patch$
declare
  p record;
  def text;
begin
  for p in
    select * from (values
      ('public.attach_addons(uuid,jsonb)'::regprocedure,
       $old$if n > 3 then raise exception 'Thêm tối đa 3 dịch vụ đi kèm.' using errcode = 'check_violation'; end if;$old$,
       $new$if n > 9 then raise exception 'Mỗi lịch tối đa 10 món.' using errcode = 'check_violation'; end if;$new$),
      ('public.attach_addons(uuid,jsonb)'::regprocedure,
       $old$customer_id, pro_id, template_id, variant_id, quantity, source, parent_booking_id,$old$,
       $new$customer_id, pro_id, template_id, variant_id, quantity, source, parent_booking_id, in_cart,$new$),
      ('public.attach_addons(uuid,jsonb)'::regprocedure,
       $old$parent.customer_id, parent.pro_id, t.id, v.id, qty, 'direct', parent.id,$old$,
       $new$parent.customer_id, parent.pro_id, t.id, v.id, qty, 'direct', parent.id, true,$new$),
      -- One appointment is one job of the partner's day, however many lines it has.
      ('public.availability_problem(uuid,text,text,integer,timestamptz,boolean,double precision,double precision,uuid)'::regprocedure,
       $old$select count(*) into day_count from public.bookings b
  where b.pro_id = p_pro$old$,
       $new$select count(*) into day_count from public.bookings b
  where b.pro_id = p_pro
    and not b.in_cart$new$),
      -- Finishing a main booking finishes its lines, which this loop has already selected.
      ('public.auto_complete_bookings()'::regprocedure,
       $old$perform public.finish_booking(r.id, 'auto');$old$,
       $new$if (select b.status in ('confirmed', 'in_progress') from public.bookings b where b.id = r.id) then
      perform public.finish_booking(r.id, 'auto');
    end if;$new$),
      ('public.recount_completed_jobs()'::regprocedure,
       $old$where pro_id = new.pro_id and status = 'completed')$old$,
       $new$where pro_id = new.pro_id and status = 'completed' and not in_cart)$new$),
      -- "Khách quen, đã đặt bạn N lần" counts appointments, not lines.
      ('public.customer_history(uuid)'::regprocedure,
       $old$where b.customer_id = t.customer_id and b.status = 'completed';$old$,
       $new$where b.customer_id = t.customer_id and b.status = 'completed' and not b.in_cart;$new$),
      -- The lines are chained to the minute, and moving them together is not built yet.
      ('public.request_reschedule(uuid,timestamptz)'::regprocedure,
       $old$problem := public.availability_problem($old$,
       $new$if exists (select 1 from public.bookings c where c.parent_booking_id = b.id and c.in_cart) then
    raise exception 'Lịch nhiều món chưa đổi giờ được. Huỷ rồi đặt lại giúp 360dep nhé.' using errcode = 'check_violation';
  end if;
  problem := public.availability_problem($new$)
    ) as t(fn, needle, replacement)
  loop
    def := pg_get_functiondef(p.fn);
    if position(p.needle in def) = 0 then
      raise exception 'Cannot patch %: "%" not found', p.fn, p.needle;
    end if;
    execute replace(def, p.needle, p.replacement);
  end loop;
end $patch$;

-- Lines follow the main booking through every step. Add-ons made during a visit
-- still follow it only when it does not happen, as they always did.
create or replace function public.booking_addons_follow() returns trigger
language plpgsql security definer set search_path = '' as $$
declare line public.bookings;
begin
  if new.status = old.status or new.parent_booking_id is not null then return new; end if;
  if new.status = 'confirmed' and old.status = 'pending' then
    update public.bookings set status = 'confirmed', confirmed_at = now()
      where parent_booking_id = new.id and status = 'pending';
  elsif new.status = 'in_progress' then
    update public.bookings set status = 'in_progress', started_at = now()
      where parent_booking_id = new.id and in_cart and status = 'confirmed';
  elsif new.status = 'completed' then
    -- finish_booking's work without its messages: the customer and the partner
    -- hear about the appointment once, from the main booking.
    for line in
      select * from public.bookings
      where parent_booking_id = new.id and in_cart and status in ('confirmed', 'in_progress')
      for update
    loop
      update public.bookings set status = 'completed', completed_at = now() where id = line.id;
      insert into public.wallet_entries (pro_id, booking_id, kind, amount, note)
      values (line.pro_id, line.id, 'commission', -line.commission, 'Phí dịch vụ 360dep')
      on conflict (booking_id, kind) do nothing;
    end loop;
  elsif new.status in ('declined', 'expired', 'cancelled', 'no_show') then
    update public.bookings
      set status = 'cancelled', cancelled_at = now(), cancelled_by = coalesce(new.cancelled_by, 'pro'),
          cancel_reason = 'Lịch chính không diễn ra'
      where parent_booking_id = new.id
        and (status in ('pending', 'confirmed') or (in_cart and status = 'in_progress'));
  end if;
  return new;
end $$;

-- A cart in working order: main services first, in the order chosen, then what
-- can only come on top of them. Same rules as lib/service-cart.ts.
create function partner_private.cart_lines(p_pro uuid, p_items jsonb, p_at_home boolean)
returns table (ord int, l_template text, l_variant text, l_quantity int, l_minutes int, l_unit int)
language plpgsql stable security definer set search_path = '' as $$
declare
  item jsonb; t public.service_templates; v public.service_variants;
  n int; pass int; i int := 0; qty int;
  chosen text[] := '{}'; templates text[] := '{}'; categories public.category_id[] := '{}'; finishes int := 0;
begin
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Danh sách dịch vụ không hợp lệ.' using errcode = 'check_violation';
  end if;
  n := jsonb_array_length(p_items);
  if n = 0 then raise exception 'Chọn ít nhất một món.' using errcode = 'check_violation'; end if;
  if n > 10 then raise exception 'Mỗi lịch tối đa 10 món.' using errcode = 'check_violation'; end if;

  for pass in 1..2 loop
    for item in select * from jsonb_array_elements(p_items) loop
      select * into t from public.service_templates s where s.id = item->>'template' and s.active;
      select * into v from public.service_variants s where s.template_id = item->>'template' and s.id = item->>'variant';
      if t is null or v is null then
        raise exception 'Có món không còn được cung cấp.' using errcode = 'check_violation';
      end if;
      continue when t.addon_only <> (pass = 2);

      if pass = 2 and not t.category = any(categories) then
        raise exception '"%" cần đi kèm một dịch vụ chính.', t.name using errcode = 'check_violation';
      end if;
      if t.studio_only and p_at_home then
        raise exception '"%" chỉ làm tại studio.', t.name using errcode = 'check_violation';
      end if;
      if v.sessions > 1 and n > 1 then
        raise exception 'Gói nhiều buổi cần đặt riêng.' using errcode = 'check_violation';
      end if;
      -- Delivery deadlines and touch-up visits are tracked on one booking, and a
      -- line disappears into its main one on screen.
      if n > 1 and (t.delivery_days is not null or coalesce(v.deliverable, t.deliverable) is not null or v.followup_days is not null) then
        raise exception 'Món có giao ảnh, clip hoặc buổi dặm cần đặt riêng.' using errcode = 'check_violation';
      end if;
      if (t.id || '/' || v.id) = any(chosen) then
        raise exception 'Mỗi món chỉ chọn một lần.' using errcode = 'check_violation';
      end if;
      if pass = 1 and t.id = any(templates) then
        raise exception 'Mỗi dịch vụ chọn một gói.' using errcode = 'check_violation';
      end if;
      if t.id in ('nail-gel', 'nail-extension', 'nail-manicure', 'nail-refill') then
        finishes := finishes + 1;
        if finishes > 1 then
          raise exception 'Các món này đều đã gồm sơn móng, chọn một món thôi.' using errcode = 'check_violation';
        end if;
      end if;

      qty := greatest(coalesce((item->>'quantity')::int, 1), 1);
      ord := i;
      l_template := t.id;
      l_variant := v.id;
      l_quantity := qty;
      l_minutes := public.service_duration_min(t.id, v.id, qty);
      l_unit := public.listed_price(p_pro, t.id, v.id);
      if l_minutes is null then
        raise exception 'Số lượng không hợp lệ cho "%".', t.name using errcode = 'check_violation';
      end if;
      if l_unit is null then
        raise exception 'Artist chưa niêm yết "%".', t.name using errcode = 'check_violation';
      end if;
      return next;

      i := i + 1;
      chosen := chosen || (t.id || '/' || v.id);
      templates := templates || t.id;
      categories := categories || t.category;
    end loop;
  end loop;
end $$;

-- Why the whole chain cannot start at this time; null when it can.
create function partner_private.cart_problem(
  p_pro uuid, p_items jsonb, p_starts_at timestamptz, p_at_home boolean, p_lat double precision, p_lng double precision
) returns text
language plpgsql stable security definer set search_path = '' as $$
declare l record; at timestamptz := p_starts_at; why text;
begin
  for l in select * from partner_private.cart_lines(p_pro, p_items, p_at_home) order by ord loop
    why := public.availability_problem(p_pro, l.l_template, l.l_variant, l.l_quantity, at, p_at_home, p_lat, p_lng);
    if why is not null then return why; end if;
    at := at + make_interval(mins => l.l_minutes);
  end loop;
  return null;
end $$;

revoke all on function partner_private.cart_lines(uuid, jsonb, boolean) from public, anon, authenticated;
revoke all on function partner_private.cart_problem(uuid, jsonb, timestamptz, boolean, double precision, double precision) from public, anon, authenticated;

-- Start times with room for the whole cart. Open to the signed out, as free_slots is.
create function public.cart_slots(
  p_pro uuid, p_items jsonb, p_date date, p_at_home boolean default true,
  p_lat double precision default null, p_lng double precision default null
) returns setof timestamptz
language plpgsql stable security definer set search_path = '' as $$
declare total int; w record; candidate timestamptz; m int;
begin
  select sum(l_minutes) into total from partner_private.cart_lines(p_pro, p_items, p_at_home);
  for w in
    select start_min, end_min from public.working_hours
    where pro_id = p_pro and weekday = extract(dow from p_date)::int
    order by start_min
  loop
    m := w.start_min;
    while m + total <= w.end_min loop
      candidate := (p_date + make_interval(mins => m)) at time zone public.app_timezone();
      if partner_private.cart_problem(p_pro, p_items, candidate, p_at_home, p_lat, p_lng) is null then
        return next candidate;
      end if;
      m := m + 30;
    end loop;
  end loop;
end $$;

-- The main booking's quote with the other lines added: they travel with it, so
-- they carry neither travel nor urgent fees.
create function public.cart_quote(
  p_pro uuid, p_items jsonb, p_starts_at timestamptz, p_at_home boolean, p_address_id uuid
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  l record; q public.quote; main jsonb; lat double precision; lng double precision; why text;
  services int; commission int; minutes int := 0; lines jsonb := '[]';
begin
  if auth.uid() is null then
    raise exception 'Cần đăng nhập để xác nhận tổng tiền.' using errcode = 'insufficient_privilege';
  end if;
  if p_at_home then
    select a.lat, a.lng into lat, lng from public.addresses a where a.id = p_address_id and a.account_id = auth.uid();
  else
    select p.lat, p.lng into lat, lng from public.pros p where p.id = p_pro;
  end if;

  for l in select * from partner_private.cart_lines(p_pro, p_items, p_at_home) order by ord loop
    if l.ord = 0 then
      main := partner_private.booking_quote(p_pro, l.l_template, l.l_variant, p_starts_at, p_at_home, p_address_id, l.l_quantity);
      services := (main->>'servicePrice')::int;
      commission := (main->>'commission')::int;
      lines := lines || jsonb_build_object('template', l.l_template, 'variant', l.l_variant, 'quantity', l.l_quantity,
        'unitPrice', l.l_unit, 'total', services, 'minutes', l.l_minutes);
    else
      q := public.build_quote(l.l_unit, l.l_quantity, false, null, false);
      services := services + q.service_price;
      commission := commission + q.commission;
      lines := lines || jsonb_build_object('template', l.l_template, 'variant', l.l_variant, 'quantity', l.l_quantity,
        'unitPrice', l.l_unit, 'total', q.service_price, 'minutes', l.l_minutes);
    end if;
    minutes := minutes + l.l_minutes;
  end loop;

  why := partner_private.cart_problem(p_pro, p_items, p_starts_at, p_at_home, lat, lng);
  if why is not null then raise exception '%', why using errcode = 'check_violation'; end if;

  return main || jsonb_build_object(
    'servicePrice', services,
    'commission', commission,
    'total', services + (main->>'travelFee')::int + (main->>'urgentFee')::int,
    'payout', services + (main->>'travelFee')::int + (main->>'urgentFee')::int - commission,
    'durationMin', minutes,
    'lines', lines);
end $$;

-- All of it or none of it: a line that no longer fits leaves nothing behind.
create function public.create_cart_booking(
  p_pro uuid, p_items jsonb, p_starts_at timestamptz, p_at_home boolean, p_address_id uuid,
  p_note text, p_payment public.payment_method, p_expected_total int, p_sessions timestamptz[] default '{}'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare quote jsonb; first jsonb; others jsonb; main_total int; id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_pro::text, 1));
  quote := public.cart_quote(p_pro, p_items, p_starts_at, p_at_home, p_address_id);
  if p_expected_total is null or (quote->>'total')::int <> p_expected_total then
    raise exception 'Giá hoặc phụ phí vừa thay đổi. Xem lại tổng tiền rồi xác nhận.' using errcode = 'check_violation';
  end if;

  first := quote->'lines'->0;
  select coalesce(jsonb_agg(jsonb_build_object('template', e->>'template', 'variant', e->>'variant', 'quantity', (e->>'quantity')::int) order by i), '[]'),
         (quote->>'total')::int - coalesce(sum((e->>'total')::int), 0)
    into others, main_total
    from jsonb_array_elements(quote->'lines') with ordinality as x(e, i)
    where i > 1;

  id := partner_private.create_booking_checked(
    p_pro, first->>'template', first->>'variant', p_starts_at, p_at_home, p_address_id, (first->>'quantity')::int,
    p_note, p_payment, main_total, (first->>'unitPrice')::int, p_sessions);
  if jsonb_array_length(others) > 0 then
    perform public.attach_addons(id, others);
  end if;
  return id;
end $$;

revoke all on function public.cart_slots(uuid, jsonb, date, boolean, double precision, double precision) from public, anon, authenticated;
revoke all on function public.cart_quote(uuid, jsonb, timestamptz, boolean, uuid) from public, anon, authenticated;
revoke all on function public.create_cart_booking(uuid, jsonb, timestamptz, boolean, uuid, text, public.payment_method, int, timestamptz[]) from public, anon, authenticated;
grant execute on function public.cart_slots(uuid, jsonb, date, boolean, double precision, double precision) to anon, authenticated;
grant execute on function public.cart_quote(uuid, jsonb, timestamptz, boolean, uuid) to authenticated;
grant execute on function public.create_cart_booking(uuid, jsonb, timestamptz, boolean, uuid, text, public.payment_method, int, timestamptz[]) to authenticated;
