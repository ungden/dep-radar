-- One visit, one booking, many scoped lines. Historical contracts stay immutable.
create table partner_private.cart_quotes (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null,
 pro_id uuid not null, starts_at timestamptz not null, at_home boolean not null,
 address_id uuid, items jsonb not null, quote jsonb not null,
 expires_at timestamptz not null default now()+interval '5 minutes', booking_id uuid
);
alter table partner_private.cart_quotes enable row level security;
revoke all on partner_private.cart_quotes from public, anon, authenticated;
alter table public.bookings add column cart_quote_id uuid unique references partner_private.cart_quotes(id);

create function partner_private.cart_scope(p_item jsonb) returns text[]
language sql immutable set search_path='' as $$
 select case when p_item->>'region'='both' or p_item->>'variant'='hand-foot' then array['hand','foot']
 else array[coalesce(p_item->>'region',case when p_item->>'template'='nail-pedicure' then 'foot' else 'hand' end)] end
$$;

create function partner_private.cart_lines(p_pro uuid,p_items jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare item jsonb; prev jsonb; lines jsonb:='[]'; v public.service_variants; t public.service_templates;
 qty int; unit int; minutes int; recipient text; conflict boolean;
begin
 if octet_length(p_items::text)>50000 then raise exception 'Giỏ dịch vụ quá lớn.'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 40 then raise exception 'Chọn từ 1 đến 40 dòng dịch vụ.'; end if;
 for item in select * from jsonb_array_elements(p_items) loop
  select * into t from public.service_templates where id=item->>'template';
  select * into v from public.service_variants where template_id=t.id and id=item->>'variant';
  qty:=(item->>'quantity')::int;
  if t.id is null or v.id is null or qty is null or qty<v.min_quantity or qty>v.max_quantity then raise exception 'Dịch vụ hoặc số lượng không hợp lệ.'; end if;
  if jsonb_array_length(lines)=0 and t.addon_only then raise exception 'Chọn dịch vụ chính trước các món bổ sung.';end if;
  if item->>'region'='both' and v.id<>'hand-foot' then raise exception 'Chọn tay và chân thành hai dòng riêng.'; end if;
  if item ? 'region' and item->>'region' not in ('hand','foot','both') then raise exception 'Vùng thực hiện không hợp lệ.'; end if;
  if t.category='nail' and item->>'variant'='hand-foot' and coalesce(item->>'region','both')<>'both' then raise exception 'Gói tay và chân phải giữ đủ hai vùng.'; end if;
  recipient:=coalesce(nullif(trim(item->>'recipient'),''),'Mình');
  if length(recipient)>60 then raise exception 'Tên người nhận tối đa60 ký tự.'; end if;
  for prev in select * from jsonb_array_elements(lines) loop
   if prev->>'recipient'<>recipient then continue; end if;
   if t.category='nail' and prev->>'category'='nail' and not partner_private.cart_scope(prev)&&partner_private.cart_scope(item) then continue; end if;
   conflict:=false;
   if prev->>'template'=t.id and (t.id not in ('nail-design','nail-art-pilot') or prev->>'variant'=v.id) then
    conflict:=true;
    if t.id='nail-prep-pilot' and prev->>'variant'<>v.id and ((prev->>'variant' like 'remove%')<>(v.id like 'remove%')) then conflict:=false; end if;
    if t.id='skin-wax' and prev->>'variant'<>v.id and not (
      prev->>'variant' in ('half-leg','full-leg') and v.id in ('half-leg','full-leg') or
      prev->>'variant' in ('half-arm','arm') and v.id in ('half-arm','arm')) then conflict:=false; end if;
   end if;
   if t.id in ('nail-gel','nail-extension','nail-refill','nail-manicure','nail-pilot') and prev->>'template' in ('nail-gel','nail-extension','nail-refill','nail-manicure','nail-pilot') then conflict:=true; end if;
   if t.category='makeup' and prev->>'category'='makeup' and t.id not in ('makeup-hair-updo','makeup-takecare') and prev->>'template' not in ('makeup-hair-updo','makeup-takecare') then conflict:=true; end if;
   if (t.id='makeup-bridal' and prev->>'template' in ('makeup-hair-updo','hair-bridal')) or (prev->>'template'='makeup-bridal' and t.id in ('makeup-hair-updo','hair-bridal')) then conflict:=true; end if;
   if t.id in ('brow-tint','brow-lamination','brow-shaping','brow-tattoo') and prev->>'template' in ('brow-tint','brow-lamination','brow-shaping','brow-tattoo') then conflict:=true; end if;
   if t.id in ('lash-classic','lash-volume','lash-design','lash-refill','lash-lift') and prev->>'template' in ('lash-classic','lash-volume','lash-design','lash-refill','lash-lift') then conflict:=true; end if;
   if t.category='massage' and prev->>'category'='massage' then conflict:=true; end if;
   if t.category='skincare' and prev->>'category'='skincare' and t.id<>'skin-wax' and prev->>'template'<>'skin-wax' then conflict:=true; end if;
   if conflict then raise exception 'Phần việc đã gồm hoặc trùng cho %. Đổi lựa chọn, người nhận hoặc vùng thực hiện.',recipient; end if;
  end loop;
  unit:=public.listed_price(p_pro,t.id,v.id);
  if unit is null then raise exception 'Đối tác chưa nhận dịch vụ này.'; end if;
  minutes:=public.service_duration_min(t.id,v.id,qty);
  if jsonb_array_length(lines)>0 and v.sessions>1 then raise exception 'Chọn gói nhiều buổi làm dịch vụ chính.'; end if;
  lines:=lines||jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('region',item->'region','site',item->'site'))||partner_private.service_contract(t.id,v.id,qty,unit,minutes)||jsonb_build_object(
   'template',t.id,'variant',v.id,'recipient',recipient,'name',t.name,'label',case when t.category='nail' and v.id='hand' and item->>'region'='foot' then '10 móng chân' else v.label end,'unit',case when t.id in ('nail-design','nail-art-pilot') then case when v.id in ('stone','charm') then 'viên' else 'ngón' end when t.id='nail-prep-pilot' and v.id='repair' then 'ngón' when v.per_person then 'người' else 'gói' end,
   'quantity',qty,'unitPrice',unit,'total',unit*qty,'durationMin',minutes,'category',t.category));
 end loop;
 for item in select * from jsonb_array_elements(lines) where value->>'template' in ('nail-design','nail-art-pilot') loop
  if not exists(select 1 from jsonb_array_elements(lines) base where base->>'template' in ('nail-gel','nail-extension','nail-refill','nail-pilot') and base->>'recipient'=item->>'recipient' and partner_private.cart_scope(base)&&partner_private.cart_scope(item)) then raise exception 'Trang trí cần nền gel cùng người và vùng móng.'; end if;
 end loop;
 return lines;
end $$;

create function partner_private.cart_available(p_pro uuid,p_lines jsonb,p_at timestamptz,p_home boolean,p_lat double precision,p_lng double precision) returns text
language plpgsql stable security definer set search_path='' as $$
declare item jsonb; problem text; minutes int:=0; pro public.pros;
begin
 select * into pro from public.pros where id=p_pro;
 for item in select * from jsonb_array_elements(p_lines) loop
  -- Check eligibility for every service at the visit start; check the total range below.
  problem:=public.availability_problem(p_pro,item->>'template',item->>'variant',(item->>'quantity')::int,p_at,p_home,p_lat,p_lng);
  if problem is not null then return problem; end if;
  minutes:=minutes+(item->>'durationMin')::int;
 end loop;
 if minutes>720 or not public.within_working_hours(p_pro,p_at,minutes) then return 'Không đủ giờ làm cho toàn bộ giỏ dịch vụ.'; end if;
 if exists(select 1 from public.bookings b where b.pro_id=p_pro and b.status in ('pending','confirmed','in_progress') and b.blocked_range && tstzrange(p_at,p_at+make_interval(mins=>minutes+pro.buffer_min),'[)'))
 or exists(select 1 from public.booking_sessions s join public.bookings b on b.id=s.booking_id where s.pro_id=p_pro and s.confirmed and b.status in ('pending','confirmed','in_progress','completed') and tstzrange(s.starts_at,s.starts_at+make_interval(mins=>s.duration_min+b.buffer_min),'[)') && tstzrange(p_at,p_at+make_interval(mins=>minutes+pro.buffer_min),'[)')) then return 'Không đủ giờ trống cho toàn bộ giỏ dịch vụ.'; end if;
 return null;
end $$;

create function partner_private.cart_quote(p_pro uuid,p_items jsonb,p_starts_at timestamptz,p_at_home boolean,p_address_id uuid,p_sessions timestamptz[] default '{}',p_ready_by timestamptz default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare lines jsonb; a public.addresses; pro public.pros; problem text; total_service int; minutes int; q public.quote; result jsonb; qid uuid; at timestamptz; extra_urgent int:=0; expected_sessions int; session_minutes int;
begin
 if auth.uid() is null then raise exception 'Cần đăng nhập.' using errcode='insufficient_privilege'; end if;
 select * into pro from public.pros where id=p_pro;
 if p_at_home then select * into a from public.addresses where id=p_address_id and account_id=auth.uid(); if a.id is null then raise exception 'Chọn địa chỉ đã lưu.'; end if;
 else a.lat:=pro.lat; a.lng:=pro.lng; end if;
 delete from partner_private.cart_quotes where customer_id=auth.uid() and booking_id is null and expires_at<now()-interval '1 day';
 lines:=partner_private.cart_lines(p_pro,p_items);
 problem:=partner_private.cart_available(p_pro,lines,p_starts_at,p_at_home,a.lat,a.lng);
 if problem is not null then raise exception '%',problem; end if;
 select sum((x->>'total')::int),sum((x->>'durationMin')::int) into total_service,minutes from jsonb_array_elements(lines) x;
 select sessions,duration_min into expected_sessions,session_minutes from public.service_variants where template_id=lines->0->>'template' and id=lines->0->>'variant';
 if cardinality(coalesce(p_sessions,'{}'))<>expected_sessions-1 then raise exception 'Chọn đủ lịch cho các buổi trong gói.'; end if;
 if p_ready_by is not null and p_starts_at+make_interval(mins=>minutes+30)>p_ready_by then raise exception 'Không đủ thời gian hoàn thiện trước giờ yêu cầu (gồm30 phút dự phòng).'; end if;
 foreach at in array coalesce(p_sessions,'{}') loop
  if at<p_starts_at+make_interval(mins=>minutes+pro.buffer_min) then raise exception 'Buổi tiếp theo phải sau toàn bộ buổi đầu.'; end if;
  problem:=partner_private.cart_available(p_pro,jsonb_build_array(case when lines->0->>'template'='hair-bridal' then (lines->0)||jsonb_build_object('durationMin',120) else lines->0 end),at,p_at_home,a.lat,a.lng);
  if problem is not null then raise exception '%',problem; end if;
  if public.is_urgent(at) then extra_urgent:=extra_urgent+(select urgent_fee from public.fee_policy where id); end if;
 end loop;

 q:=public.build_quote(total_service,1,p_at_home,case when p_at_home then public.travel_distance_km(pro.lat,pro.lng,a.lat,a.lng,(select road_factor from public.fee_policy where id)) end,public.is_urgent(p_starts_at));
 q.travel_fee:=q.travel_fee*expected_sessions; q.urgent_fee:=q.urgent_fee+extra_urgent; q.total:=q.service_price+q.travel_fee+q.urgent_fee; q.payout:=q.total-q.commission;
 result:=jsonb_build_object('servicePrice',q.service_price,'distanceKm',q.distance_km,'travelFee',q.travel_fee,'urgentFee',q.urgent_fee,'total',q.total,'commissionRate',q.commission_rate,'commission',q.commission,'payout',q.payout,'unitPrice',(lines->0->>'unitPrice')::int,'sessions',to_jsonb(coalesce(p_sessions,'{}'::timestamptz[])),'readyBy',p_ready_by,'addressFingerprint',md5(to_jsonb(a)::text),'lines',lines,'durationMin',minutes,'expiresAt',now()+interval '5 minutes');
 insert into partner_private.cart_quotes(customer_id,pro_id,starts_at,at_home,address_id,items,quote) values(auth.uid(),p_pro,p_starts_at,p_at_home,p_address_id,p_items,result) returning id into qid;
 return result||jsonb_build_object('quoteId',qid);
end $$;
create function public.cart_quote(p_pro uuid,p_items jsonb,p_starts_at timestamptz,p_at_home boolean,p_address_id uuid,p_sessions timestamptz[] default '{}',p_ready_by timestamptz default null) returns jsonb language sql security invoker set search_path='' as $$ select partner_private.cart_quote(p_pro,p_items,p_starts_at,p_at_home,p_address_id,p_sessions,p_ready_by) $$;

create function partner_private.cart_slots(p_pro uuid,p_items jsonb,p_date date,p_at_home boolean,p_lat double precision default null,p_lng double precision default null) returns timestamptz[]
language plpgsql stable security definer set search_path='' as $$
declare lines jsonb; at timestamptz; result timestamptz[]:='{}';
begin
 lines:=partner_private.cart_lines(p_pro,p_items);
 for at in select * from public.free_slots(p_pro,lines->0->>'template',lines->0->>'variant',(lines->0->>'quantity')::int,p_date,p_at_home,p_lat,p_lng) loop
  if partner_private.cart_available(p_pro,lines,at,p_at_home,p_lat,p_lng) is null then result:=array_append(result,at); end if;
 end loop;
 return result;
end $$;
create function public.cart_slots(p_pro uuid,p_items jsonb,p_date date,p_at_home boolean,p_lat double precision default null,p_lng double precision default null) returns timestamptz[] language sql stable security invoker set search_path='' as $$ select partner_private.cart_slots(p_pro,p_items,p_date,p_at_home,p_lat,p_lng) $$;

-- Install the full quote BEFORE INSERT, so calendar, MCN and notification
-- triggers all see the final order, and no immutable snapshot needs rewriting.
create function partner_private.cart_booking_snapshot(p_booking public.bookings) returns public.bookings
language plpgsql stable security definer set search_path='' as $$
declare saved partner_private.cart_quotes; lines jsonb; contract jsonb;
begin
 if nullif(current_setting('app.cart_quote',true),'') is null then return p_booking; end if;
 select * into saved from partner_private.cart_quotes where id=current_setting('app.cart_quote',true)::uuid and customer_id=auth.uid() and pro_id=p_booking.pro_id and starts_at=p_booking.starts_at and booking_id is null and expires_at>=now();
 if saved.id is null then raise exception 'Báo giá không hợp lệ.'; end if;
 lines:=saved.quote->'lines'; contract:=p_booking.service_contract;
 contract:=contract||jsonb_build_object('version',3,'lines',lines,'readyBy',saved.quote->'readyBy','servicePrice',(saved.quote->>'servicePrice')::int,'durationMin',(saved.quote->>'durationMin')::int,
 'serviceName',case when jsonb_array_length(lines)>1 then 'Buổi dịch vụ · '||jsonb_array_length(lines)||' hạng mục' else contract->>'serviceName' end,
 'variantLabel',case when jsonb_array_length(lines)>1 then 'Theo danh sách đã chốt' else contract->>'variantLabel' end,
 'revisions',(select max((x->>'revisions')::int) from jsonb_array_elements(lines) x),
 'deliveryDays',(select max((x->>'deliveryDays')::int) from jsonb_array_elements(lines) x),
 'deliverable',(select string_agg((x->>'name')||': '||(x->>'deliverable'),'; ') from jsonb_array_elements(lines) x where x->>'deliverable' is not null));
 return jsonb_populate_record(p_booking,jsonb_build_object('cart_quote_id',saved.id,'service_contract',contract,
 'duration_min',(saved.quote->>'durationMin')::int,'service_price',(saved.quote->>'servicePrice')::int,
 'travel_fee',(saved.quote->>'travelFee')::int,'urgent_fee',(saved.quote->>'urgentFee')::int,
 'commission_rate',(saved.quote->>'commissionRate')::numeric,'commission',(saved.quote->>'commission')::int));
end $$;
revoke all on function partner_private.cart_booking_snapshot(public.bookings) from public,anon,authenticated;
do $$ declare definition text; needle text:=E'new.duration_min);\n  else'; begin
 select pg_get_functiondef('partner_private.capture_service_contract()'::regprocedure) into definition;
 if position(needle in definition)=0 then raise exception 'capture_service_contract changed: review snapshot hook'; end if;
 definition:=replace(definition,needle,E'new.duration_min);\n    new:=partner_private.cart_booking_snapshot(new);\n  else');
 execute definition;
end $$;

create function partner_private.create_cart_booking(p_quote uuid,p_note text,p_payment public.payment_method,p_sessions timestamptz[],p_usage text,p_repost boolean,p_references text[]) returns uuid
language plpgsql security definer set search_path='' as $$
declare saved partner_private.cart_quotes; main jsonb; fresh jsonb; bid uuid; a public.addresses; pro public.pros; problem text; contract jsonb; lines jsonb; total_minutes int;
begin
 select * into saved from partner_private.cart_quotes where id=p_quote and customer_id=auth.uid() for update;
 if saved.id is null then raise exception 'Không có quyền xem báo giá.' using errcode='insufficient_privilege'; end if;
 if saved.booking_id is not null then return saved.booking_id; end if;
 if saved.expires_at<now() then raise exception 'Báo giá hết hạn. Xác nhận lại tổng tiền.'; end if;
 if p_usage is null or p_usage not in ('personal','commercial') then raise exception 'Mục đích sử dụng không hợp lệ.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(saved.pro_id::text,1));
 -- Recheck current eligibility, but keep the promised prices and duration snapshot.
 perform partner_private.cart_lines(saved.pro_id,saved.items);
 lines:=saved.quote->'lines'; main:=lines->0;
 select * into pro from public.pros where id=saved.pro_id;
 if saved.at_home then select * into a from public.addresses where id=saved.address_id and account_id=auth.uid(); if a.id is null then raise exception 'Địa chỉ không còn tồn tại.'; end if;
 else a.lat:=pro.lat; a.lng:=pro.lng; end if;
 if saved.quote->>'addressFingerprint' is distinct from md5(to_jsonb(a)::text) then raise exception 'Địa chỉ đã thay đổi. Xác nhận lại báo giá.'; end if;
 problem:=partner_private.cart_available(saved.pro_id,lines,saved.starts_at,saved.at_home,a.lat,a.lng);
 if problem is not null then raise exception '%',problem; end if;
 if to_jsonb(coalesce(p_sessions,'{}'::timestamptz[])) is distinct from saved.quote->'sessions' then raise exception 'Lịch các buổi đã thay đổi. Xác nhận lại báo giá.'; end if;
 fresh:=partner_private.booking_quote(saved.pro_id,main->>'template',main->>'variant',saved.starts_at,saved.at_home,saved.address_id,(main->>'quantity')::int);
 perform set_config('app.cart_quote',p_quote::text,true);
 bid:=partner_private.create_booking_checked(saved.pro_id,main->>'template',main->>'variant',saved.starts_at,saved.at_home,saved.address_id,(main->>'quantity')::int,p_note,p_payment,(fresh->>'total')::int,(fresh->>'unitPrice')::int,p_sessions);
 perform set_config('app.cart_quote','',true);
 update public.bookings set usage_scope=p_usage,consent_repost=coalesce(p_repost,false) where id=bid;
 perform public.set_booking_references(bid,coalesce(p_references,'{}'));
 update partner_private.cart_quotes set booking_id=bid where id=p_quote;
 return bid;
end $$;
create function public.create_cart_booking(p_quote uuid,p_note text default '',p_payment public.payment_method default 'cash',p_sessions timestamptz[] default '{}',p_usage text default 'personal',p_repost boolean default false,p_references text[] default '{}') returns uuid language sql security invoker set search_path='' as $$ select partner_private.create_cart_booking(p_quote,p_note,p_payment,p_sessions,p_usage,p_repost,p_references) $$;
revoke all on function partner_private.cart_scope(jsonb),partner_private.cart_lines(uuid,jsonb),partner_private.cart_available(uuid,jsonb,timestamptz,boolean,double precision,double precision) from public,anon,authenticated;
revoke all on function partner_private.cart_quote(uuid,jsonb,timestamptz,boolean,uuid,timestamptz[],timestamptz),partner_private.cart_slots(uuid,jsonb,date,boolean,double precision,double precision),partner_private.create_cart_booking(uuid,text,public.payment_method,timestamptz[],text,boolean,text[]),public.cart_quote(uuid,jsonb,timestamptz,boolean,uuid,timestamptz[],timestamptz),public.cart_slots(uuid,jsonb,date,boolean,double precision,double precision),public.create_cart_booking(uuid,text,public.payment_method,timestamptz[],text,boolean,text[]) from public,anon,authenticated;
grant execute on function partner_private.cart_slots(uuid,jsonb,date,boolean,double precision,double precision),public.cart_slots(uuid,jsonb,date,boolean,double precision,double precision) to anon,authenticated;
grant execute on function partner_private.cart_quote(uuid,jsonb,timestamptz,boolean,uuid,timestamptz[],timestamptz),partner_private.create_cart_booking(uuid,text,public.payment_method,timestamptz[],text,boolean,text[]),public.cart_quote(uuid,jsonb,timestamptz,boolean,uuid,timestamptz[],timestamptz),public.create_cart_booking(uuid,text,public.payment_method,timestamptz[],text,boolean,text[]) to authenticated;

grant usage on schema partner_private to anon;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-gel', 'nail', 'Sơn gel trơn', 'Cắt da, tạo form và sơn gel một màu.', array['Cắt da, tạo form móng', 'Sơn gel 1 màu', 'Dưỡng viền móng']::text[], false, false, null, null, false, false, true, 0, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-gel', 'hand', 'Tay', 45, 90000, 180000, 130000, array[90000, 130000, 180000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-gel', 'hand-foot', 'Tay + chân', 90, 170000, 340000, 240000, array[170000, 240000, 340000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-extension', 'nail', 'Up móng / nối móng', 'Up móng giả bằng keo hoặc gel, hoặc đắp dual form gel gôm, kèm sơn gel một màu.', array['Tạo form móng thật', 'Up hoặc đắp móng', 'Sơn gel 1 màu']::text[], false, false, null, null, false, false, true, 1, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-extension', 'tips', 'Up móng bằng keo + sơn trơn 1 màu', 75, 140000, 240000, 180000, array[140000, 180000, 240000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-extension', 'gelx', 'Up móng gel + sơn trơn 1 màu', 90, 170000, 290000, 220000, array[170000, 220000, 290000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-extension', 'builder', 'Dual form + gel gôm', 120, 220000, 320000, 260000, array[220000, 260000, 320000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-removal', 'nail', 'Phá gel & dưỡng móng', 'Phá gel, móng úp hoặc móng đắp an toàn, không làm mỏng móng.', array['Phá bằng dung dịch chuyên dụng', 'Dũa lại form', 'Dưỡng móng']::text[], false, false, null, null, false, false, true, 2, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-removal', 'remove', 'Phá gel', 20, 40000, 40000, 40000, array[40000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-removal', 'remove-tips', 'Phá móng úp / móng đắp', 30, 60000, 60000, 60000, array[60000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-removal', 'remove-care', 'Phá gel + dưỡng móng', 45, 80000, 130000, 100000, array[80000, 100000, 130000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-pedicure', 'nail', 'Chăm sóc bàn chân (pedicure)', 'Ngâm chân, lấy da chết, cắt da và dưỡng gót.', array['Ngâm chân thảo mộc', 'Lấy da chết, cắt da', 'Dưỡng gót & massage chân']::text[], false, false, null, null, false, false, true, 3, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-pedicure', 'basic', 'Cơ bản', 45, 120000, 180000, 150000, array[120000, 150000, 180000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-pedicure', 'deluxe', 'Có đắp mặt nạ chân, chà gót', 75, 200000, 300000, 250000, array[200000, 250000, 300000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-manicure', 'nail', 'Cắt da, sửa form & sơn thường', 'Chăm sóc móng cơ bản cho khách không dùng gel.', array['Cắt da, sửa form móng', 'Sơn thường 1 màu', 'Dưỡng viền móng']::text[], false, false, null, null, false, false, true, 4, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-manicure', 'hand', 'Tay', 30, 60000, 100000, 80000, array[60000, 80000, 100000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-manicure', 'hand-foot', 'Tay + chân', 60, 110000, 190000, 150000, array[110000, 150000, 190000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-refill', 'nail', 'Dặm móng nối', 'Dặm phần móng mọc ra và sơn lại cho bộ móng đã up hoặc đắp.', array['Dũa, làm sạch phần móng mọc', 'Đắp bù gel', 'Sơn lại 1 màu']::text[], false, false, null, null, false, false, true, 5, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-refill', 'refill-tips', 'Dặm móng úp', 60, 90000, 140000, 110000, array[90000, 110000, 140000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-refill', 'refill', 'Dặm móng đắp / dual form', 75, 130000, 200000, 160000, array[130000, 160000, 200000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-pilot', 'nail', 'Nail · chăm da và màu', 'Menu thử nghiệm: giá cho 10 móng tay hoặc 10 móng chân. Đối tác tự chọn niêm yết menu mới.', array['Chăm da cơ bản', 'Tạo form', 'Base/top và dưỡng viền']::text[], false, false, null, null, false, false, true, 6, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-pilot', 'gel', 'Da + gel', 60, 150000, 150000, 150000, array[150000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-pilot', 'jelly', 'Da + thạch', 60, 170000, 170000, 170000, array[170000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-pilot', 'cat-eye', 'Da + mắt mèo', 75, 190000, 190000, 190000, array[190000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-daily', 'makeup', 'Makeup nhẹ / đi làm', 'Lớp nền mỏng, tự nhiên, phù hợp đi làm, đi học, hẹn hò.', array['Makeup tự nhiên', 'Làm tóc đơn giản', 'Mỹ phẩm của chuyên viên']::text[], false, false, null, null, false, false, true, 7, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-daily', 'single', '1 người', 45, 250000, 600000, 350000, array[250000, 350000, 600000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-party', 'makeup', 'Makeup dự tiệc', 'Makeup bền màu cho tiệc, kèm làm tóc đơn giản và mi giả.', array['Makeup phù hợp thời lượng và điều kiện sự kiện', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, false, true, 8, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-party', 'makeup', '1 người', 60, 300000, 800000, 450000, array[300000, 450000, 800000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-photo', 'makeup', 'Makeup kỷ yếu / chụp ảnh', 'Layout lên hình theo concept. Đi theo nhóm được giảm: 2 người 10%, 3–4 người có giá ưu đãi riêng, từ 5 người 20%.', array['Layout theo concept', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, false, true, 9, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'single', '1 người', 60, 250000, 550000, 350000, array[250000, 350000, 550000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'group2', 'Nhóm 2 người, giảm 10% (giá mỗi người)', 60, 225000, 495000, 315000, array[225000, 315000, 495000], true, 2, 1, 'per_person', 2, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'group3', 'Nhóm 3–4 người, giá ưu đãi mỗi người', 60, 210000, 465000, 295000, array[210000, 295000, 465000], true, 4, 2, 'per_person', 3, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'group5', 'Nhóm từ 5 người, giảm 20% (giá mỗi người)', 60, 200000, 440000, 280000, array[200000, 280000, 440000], true, 10, 3, 'per_person', 5, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-bridal', 'makeup', 'Makeup cô dâu', 'Makeup và làm tóc cô dâu cho từng lễ, dự kiến 3 giờ mỗi buổi. Nên test makeup trước để xem layout đã chọn có hợp không.', array['Makeup + làm tóc cô dâu', 'Mi giả, phụ kiện tóc cơ bản', 'Tư vấn layout theo váy, áo dài']::text[], false, false, null, null, false, false, true, 10, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'trial', 'Test makeup trước ngày cưới', 180, 600000, 1500000, 900000, array[600000, 900000, 1500000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'engagement', 'Dạm ngõ / đám hỏi', 180, 1000000, 2800000, 1600000, array[1000000, 1600000, 2800000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'wedding', 'Gia tiên / tiệc cưới', 180, 1300000, 3500000, 2000000, array[1300000, 2000000, 3500000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'two', 'Trọn gói 2 lễ: đám hỏi + tiệc cưới (2 buổi)', 180, 2300000, 6300000, 3600000, array[2300000, 3600000, 6300000], false, 1, 3, 'fixed', 1, null, 0, 2, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-takecare', 'makeup', 'Take care cô dâu (theo dâu)', 'Đi theo cô dâu sau khi đã makeup xong, lo phần phụ: dặm lại phấn, cầm đồ, hỗ trợ tạo dáng. Chính thợ makeup theo dâu cũng tính giá này.', array['Dặm lại phấn, son, chỉnh tóc', 'Cầm đồ, chỉnh váy giúp cô dâu', 'Hỗ trợ tạo dáng khi chụp']::text[], false, false, null, null, false, false, true, 11, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-takecare', 'takecare', 'Theo dâu 1 buổi (đến 4 tiếng)', 240, 300000, 800000, 500000, array[300000, 500000, 800000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-takecare', 'fullday', 'Theo dâu cả ngày', 480, 1000000, 3000000, 1800000, array[1000000, 1800000, 3000000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-family', 'makeup', 'Makeup mẹ cô dâu / họ hàng / phụ dâu', 'Makeup và làm tóc cho người nhà trong ngày cưới.', array['Makeup bền', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, false, true, 12, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-family', 'mother', 'Mẹ cô dâu / chú rể', 75, 400000, 900000, 600000, array[400000, 600000, 900000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-family', 'family', 'Họ hàng / phụ dâu (giá mỗi người)', 60, 300000, 500000, 400000, array[300000, 400000, 500000], true, 8, 1, 'per_person', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-event', 'makeup', 'Makeup sự kiện / MC / biểu diễn', 'Layout lên đèn sân khấu, lên hình livestream.', array['Makeup lên đèn, lên hình', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, false, true, 13, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-event', 'event', 'Sự kiện', 90, 450000, 1200000, 700000, array[450000, 700000, 1200000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-prewedding', 'makeup', 'Makeup chụp ảnh cưới', 'Makeup cô dâu cho buổi chụp ảnh cưới trong studio hoặc ngoại cảnh. Dự kiến ít nhất 3 giờ, đã gồm làm tóc.', array['Makeup + tóc cô dâu', 'Đổi layout theo trang phục', 'Mi giả']::text[], false, false, null, null, false, false, true, 14, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-prewedding', 'studio', 'Chụp trong studio', 180, 900000, 2200000, 1300000, array[900000, 1300000, 2200000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-prewedding', 'outdoor', 'Ngoại cảnh, theo cả buổi', 300, 1200000, 3000000, 1800000, array[1200000, 1800000, 3000000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-prep-pilot', 'nail', 'Tháo và nền móng', 'Menu mới; màu và chăm da trong gói chính, không tính lại.', array['Thực hiện phần nền đã chọn']::text[], false, false, null, null, false, true, true, 73, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-prep-pilot', 'remove', 'Tháo gel', 20, 20000, 20000, 20000, array[20000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-prep-pilot', 'remove-tips', 'Tháo úp hoặc gel đắp', 30, 50000, 50000, 50000, array[50000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-prep-pilot', 'tips', 'Úp nền 10 móng', 45, 130000, 130000, 130000, array[130000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-prep-pilot', 'repair', 'Úp/sửa lẻ', 15, 15000, 15000, 15000, array[15000], true, 10, 3, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-art-pilot', 'nail', 'Trang trí theo menu', 'Chọn số ngón hoặc số viên trên nền gel cùng người/vùng.', array['Vật tư và công trang trí theo mẫu chuẩn']::text[], false, false, null, null, false, true, true, 74, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'simple', 'Vẽ đơn giản', 15, 10000, 10000, 10000, array[10000], true, 10, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'detail', 'Vẽ chi tiết', 30, 25000, 25000, 25000, array[25000], true, 10, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', '3d', 'Vẽ nổi 3D', 45, 40000, 40000, 40000, array[40000], true, 10, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'stone', 'Đá nhỏ', 15, 5000, 5000, 5000, array[5000], true, 20, 3, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'charm', 'Charm chuẩn', 20, 20000, 20000, 20000, array[20000], true, 20, 4, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'nail-design', 'nail', 'Nail thiết kế (tính theo ngón)', 'Mỗi ngón một kiểu nên tính theo ngón, đặt kèm sơn gel hoặc up móng.', array['Thiết kế theo mẫu khách chọn', 'Làm trên nền gel đã đặt']::text[], false, false, null, null, false, true, true, 75, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'design', 'Thiết kế (vẽ, sticker, phối màu)', 30, 10000, 40000, 20000, array[10000, 20000, 40000], true, 10, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'cat-eye', 'Mắt mèo / tráng gương', 15, 5000, 15000, 10000, array[5000, 10000, 15000], true, 10, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'ombre', 'Ombre', 20, 10000, 20000, 15000, array[10000, 15000, 20000], true, 10, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'french', 'French', 20, 10000, 10000, 10000, array[10000], true, 10, 3, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'stone', 'Đính đá (theo cỡ đá)', 20, 3000, 20000, 10000, array[3000, 10000, 20000], true, 20, 4, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', '3d', 'Vẽ nổi', 45, 15000, 50000, 30000, array[15000, 30000, 50000], true, 10, 5, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'makeup-hair-updo', 'makeup', 'Làm tóc cầu kỳ', 'Búi, tết, uốn tạo kiểu cầu kỳ thay cho tóc đơn giản đã gồm trong giá makeup. Makeup cô dâu đã gồm tóc, không tính thêm.', array['Búi, tết hoặc uốn tạo kiểu', 'Keo, kẹp tóc']::text[], false, false, null, null, false, true, true, 76, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-hair-updo', 'updo', 'Tóc cầu kỳ', 30, 100000, 250000, 150000, array[100000, 150000, 250000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;

-- Aggregate bookings must continue to fit working hours when rescheduled by old clients.
create function partner_private.guard_cart_window() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.cart_quote_id is not null and new.status in ('pending','confirmed','in_progress') and new.starts_at+make_interval(mins=>new.duration_min+30)>(new.service_contract->>'readyBy')::timestamptz then raise exception 'Không đủ thời gian trước giờ cần hoàn thiện đã chốt.';end if;
 if new.cart_quote_id is not null and new.status in ('pending','confirmed','in_progress') and not public.within_working_hours(new.pro_id,new.starts_at,new.duration_min) then raise exception 'Không đủ giờ làm cho toàn bộ giỏ dịch vụ.'; end if;
 if new.cart_quote_id is not null and new.status in ('pending','confirmed','in_progress') and exists(select 1 from public.booking_sessions s join public.bookings b on b.id=s.booking_id where s.pro_id=new.pro_id and s.confirmed and b.status in ('pending','confirmed','in_progress','completed') and tstzrange(s.starts_at,s.starts_at+make_interval(mins=>s.duration_min+b.buffer_min),'[)')&&tstzrange(new.starts_at,new.starts_at+make_interval(mins=>new.duration_min+new.buffer_min),'[)')) then raise exception 'Lịch toàn giỏ trùng buổi đã giữ.';end if;
 return new;
end $$;
revoke all on function partner_private.guard_cart_window() from public,anon,authenticated;
create trigger cart_full_window before insert or update of starts_at,duration_min,status on public.bookings for each row execute function partner_private.guard_cart_window();

create function partner_private.hair_trial_session() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.sequence=2 and exists(select 1 from public.bookings b where b.id=new.booking_id and b.template_id='hair-bridal' and (b.service_contract->>'sessions')::int=2) then new.duration_min:=120; end if;
 return new;
end $$;
revoke all on function partner_private.hair_trial_session() from public,anon,authenticated;
create trigger aa_hair_trial_session before insert or update on public.booking_sessions for each row execute function partner_private.hair_trial_session();
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-cut', 'hair', 'Cắt tóc', 'Cắt theo dáng mặt, gội và sấy tạo kiểu.', array['Tư vấn dáng tóc', 'Cắt & tỉa', 'Gội, sấy tạo kiểu']::text[], false, false, null, null, false, false, true, 20, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-cut', 'women', 'Nữ', 45, 120000, 250000, 180000, array[120000, 180000, 250000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-cut', 'men', 'Nam', 30, 80000, 180000, 120000, array[80000, 120000, 180000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-color', 'hair', 'Nhuộm tóc', 'Nhuộm phủ bạc hoặc đổi màu, kèm dưỡng sau nhuộm.', array['Test da đầu', 'Nhuộm', 'Dưỡng phục hồi sau nhuộm']::text[], true, false, null, null, false, false, true, 21, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-color', 'roots', 'Phủ chân tóc / phủ bạc', 90, 200000, 450000, 300000, array[200000, 300000, 450000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-color', 'full', 'Nhuộm toàn đầu', 120, 450000, 1000000, 700000, array[450000, 700000, 1000000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-color', 'bleach', 'Tẩy & nhuộm màu sáng', 180, 900000, 1800000, 1300000, array[900000, 1300000, 1800000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-perm', 'hair', 'Uốn tóc', 'Uốn lạnh hoặc uốn nóng, kèm dưỡng giữ nếp.', array['Tư vấn kiểu lọn', 'Uốn', 'Dưỡng giữ nếp']::text[], true, false, null, null, false, false, true, 22, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-perm', 'cold', 'Uốn lạnh', 150, 400000, 950000, 650000, array[400000, 650000, 950000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-perm', 'hot', 'Uốn nóng / setting', 180, 600000, 1300000, 900000, array[600000, 900000, 1300000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-treatment', 'hair', 'Hấp dầu & phục hồi tóc', 'Phục hồi tóc khô xơ sau tẩy, nhuộm hoặc uốn.', array['Gội làm sạch', 'Ủ dưỡng chuyên sâu', 'Sấy tạo kiểu nhẹ']::text[], true, false, null, null, false, false, true, 23, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-treatment', '45m', '45 phút', 45, 150000, 380000, 250000, array[150000, 250000, 380000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-treatment', '75m', '75 phút', 75, 350000, 800000, 550000, array[350000, 550000, 800000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-wash', 'hair', 'Gội đầu dưỡng sinh', 'Gội, massage da đầu và cổ vai, sấy khô.', array['Gội 2 lần', 'Massage da đầu, cổ vai', 'Sấy tạo phồng nhẹ']::text[], true, false, null, null, false, false, true, 24, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-wash', '45m', '45 phút', 45, 130000, 250000, 180000, array[130000, 180000, 250000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-wash', '60m', '60 phút', 60, 180000, 300000, 240000, array[180000, 240000, 300000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-styling', 'hair', 'Tạo kiểu tóc sự kiện', 'Uốn, búi, tết theo trang phục và dáng mặt.', array['Tư vấn kiểu tóc', 'Tạo kiểu', 'Keo/xịt giữ nếp']::text[], false, false, null, null, false, false, true, 25, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-styling', 'curl', 'Uốn / duỗi tạo kiểu', 45, 150000, 300000, 220000, array[150000, 220000, 300000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-styling', 'updo', 'Búi / tết cầu kỳ', 60, 200000, 450000, 300000, array[200000, 300000, 450000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-bridal', 'hair', 'Làm tóc cô dâu', 'Làm tóc cô dâu có buổi thử trước.', array['1 buổi thử tóc', 'Tạo kiểu & cài phụ kiện', 'Giữ nếp suốt lễ']::text[], false, false, null, null, false, false, true, 26, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-bridal', 'one', 'Thử tóc 60 phút + ngày lễ 120 phút', 60, 800000, 1800000, 1200000, array[800000, 1200000, 1800000], false, 1, 0, 'fixed', 1, null, 0, 2, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-straighten', 'hair', 'Duỗi / ép tóc', 'Duỗi thẳng tự nhiên hoặc duỗi phồng chân tóc, kèm dưỡng giữ nếp.', array['Tư vấn độ thẳng', 'Duỗi dập thuốc', 'Dưỡng giữ nếp']::text[], true, false, null, null, false, false, true, 27, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-straighten', 'bangs', 'Duỗi / uốn mái', 30, 100000, 200000, 150000, array[100000, 150000, 200000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-straighten', 'full', 'Duỗi toàn đầu', 150, 450000, 1000000, 700000, array[450000, 700000, 1000000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-scalp', 'hair', 'Chăm sóc da đầu (gàu, ngứa, rụng tóc)', 'Làm sạch sâu da đầu và ủ tinh chất theo tình trạng.', array['Soi da đầu', 'Tẩy tế bào chết da đầu', 'Ủ tinh chất & massage']::text[], true, false, null, null, false, false, true, 28, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-scalp', '50m', '50 phút', 50, 150000, 300000, 220000, array[150000, 220000, 300000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, addon_only, active, sort_order, catalog_version) values (
  'hair-home-cut', 'hair', 'Cắt tóc tại nhà cho bé & người lớn tuổi', 'Thợ đến nhà cắt gọn, hợp với người ngại ra tiệm.', array['Cắt, tỉa theo yêu cầu', 'Dọn tóc vụn']::text[], false, false, null, null, false, false, true, 29, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    addon_only = excluded.addon_only,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-home-cut', 'kid', 'Trẻ em', 20, 60000, 120000, 80000, array[60000, 80000, 120000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-home-cut', 'senior', 'Người lớn tuổi', 30, 80000, 150000, 100000, array[80000, 100000, 150000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;

-- Match the current launch policy even for previously verified accounts calling RPCs.
-- A later explicit model launch must change this guard together with lib/launch.ts.
create function partner_private.guard_closed_model_booking() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.service_templates t where t.id=new.template_id and t.category::text in ('model-photo','model-video')) then raise exception 'Dịch vụ mẫu chưa mở nhận lịch.' using errcode='check_violation'; end if;
 return new;
end $$;
revoke all on function partner_private.guard_closed_model_booking() from public,anon,authenticated;
create trigger aa_model_launch before insert on public.bookings for each row execute function partner_private.guard_closed_model_booking();
create trigger aa_model_launch before insert on public.jobs for each row execute function partner_private.guard_closed_model_booking();
