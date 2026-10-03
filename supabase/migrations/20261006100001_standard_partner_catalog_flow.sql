-- Shared catalogue and partner workflow. Existing agreed prices are preserved.
create schema if not exists partner_private;
revoke all on schema partner_private from public;
grant usage on schema partner_private to authenticated;

alter table public.service_templates add column catalog_version int not null default 1;
alter table public.service_variants
  add column duration_rule text not null default 'fixed' check (duration_rule in ('fixed', 'per_person')),
  add column min_quantity int not null default 1 check (min_quantity > 0),
  add column deliverable text,
  add column revisions int not null default 0 check (revisions between 0 and 5),
  add column sessions int not null default 1 check (sessions between 1 and 3),
  add column followup_days int check (followup_days between 1 and 90);
update public.service_variants set duration_rule = 'per_person' where per_person;
alter table public.bookings add column service_contract jsonb;
alter table public.jobs add column service_contract jsonb, add column max_total int check (max_total > 0);

create function partner_private.service_contract(p_template text, p_variant text, p_quantity int, p_unit int, p_minutes int)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'version', t.catalog_version, 'serviceName', t.name, 'variantLabel', v.label,
    'category', t.category, 'includes', t.includes,
    'deliverable', coalesce(v.deliverable, t.deliverable), 'deliveryDays', t.delivery_days,
    'revisions', v.revisions, 'tier', array_position(v.price_tiers, p_unit),
    'tierLabel', (array['Cơ bản','Chuyên nghiệp','Master'])[array_position(v.price_tiers,p_unit)],
    'unitPrice', p_unit, 'quantity', p_quantity, 'durationMin', p_minutes,
    'sessions', v.sessions, 'followupDays', v.followup_days)
  from public.service_templates t join public.service_variants v on v.template_id=t.id
  where t.id=p_template and v.id=p_variant
$$;
revoke all on function partner_private.service_contract(text,text,int,int,int) from public, anon, authenticated;

-- Capture the OLD scope before changing catalogue labels, durations or output.
update public.bookings b set service_contract=partner_private.service_contract(
  b.template_id,b.variant_id,b.quantity,b.service_price/greatest(b.quantity,1),b.duration_min);
update public.jobs j set service_contract=partner_private.service_contract(
  j.template_id,j.variant_id,j.quantity,j.price,public.service_duration_min(j.template_id,j.variant_id,j.quantity));

update public.service_variants set price_tiers=array[50000,80000,100000],max_price=100000,suggested_price=80000
  where (template_id,id) in (('nail-removal','remove'),('lash-removal','remove'));
update public.service_variants set price_tiers=array[100000,150000,200000],max_price=200000,suggested_price=150000
  where template_id='nail-removal' and id='remove-care';
alter table public.service_variants drop constraint service_variants_price_tiers_check;
alter table public.service_variants add constraint service_variants_price_tiers_check check (
  cardinality(price_tiers)=3 and price_tiers[1]>0
  and price_tiers[1]<price_tiers[2] and price_tiers[2]<price_tiers[3]
  and price_tiers[1]%5000=0 and price_tiers[2]%5000=0 and price_tiers[3]%5000=0
  and min_price=price_tiers[1] and max_price=price_tiers[3] and suggested_price=price_tiers[2]);

create or replace function public.service_duration_min(p_template text,p_variant text,p_quantity int default 1)
returns int language sql stable set search_path = '' as $$
  select case when v.duration_rule='per_person' then v.duration_min*p_quantity else v.duration_min end
  from public.service_variants v where v.template_id=p_template and v.id=p_variant
    and p_quantity between v.min_quantity and v.max_quantity
$$;

alter table public.pros add column hours_confirmed boolean not null default false,
  add column terms_accepted_at timestamptz;
-- Grandfather profiles already reviewed; never publish a draft by migration.
update public.pros p set hours_confirmed=true,terms_accepted_at=now()
  where p.review_status in ('approved','pending') and exists(select 1 from public.working_hours w where w.pro_id=p.id);

create function partner_private.guard_partner_setup() returns trigger
language plpgsql security definer set search_path = '' as $$
declare d public.districts;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.id::text,1));
  if coalesce(current_setting('app.deleting_account',true),'')=new.id::text
    or coalesce(current_setting('app.system_write',true),'')='on' then return new; end if;
  if cardinality(new.categories)<1 or cardinality(new.categories)>(select count(*) from pg_enum where enumtypid='public.category_id'::regtype) then
    raise exception 'Chọn ít nhất một nghề bạn nhận làm.' using errcode='check_violation';
  end if;
  if tg_op='INSERT' or new.city is distinct from old.city or new.district is distinct from old.district then
    select * into d from public.districts where city=new.city and district=new.district;
    if d is null then raise exception 'Khu vực phục vụ không hợp lệ.' using errcode='check_violation'; end if;
    new.lat:=d.lat; new.lng:=d.lng;
  end if;
  if tg_op='UPDATE' and new.categories is distinct from old.categories then
    update public.pro_services s set active=false from public.service_templates t
      where s.pro_id=new.id and s.template_id=t.id and not(t.category=any(new.categories));
  end if;
  if tg_op='UPDATE' and new.published and not old.published and not public.is_privileged() then
    if not new.home_service and coalesce(trim(new.studio_address),'')='' then raise exception 'Chọn nhận tại nhà hoặc lưu địa chỉ studio trước khi gửi duyệt.'; end if;
    if not new.hours_confirmed or new.terms_accepted_at is null then
      raise exception 'Lưu giờ làm và xác nhận chính sách trước khi gửi duyệt.' using errcode='check_violation';
    end if;
  end if;
  return new;
end $$;
revoke all on function partner_private.guard_partner_setup() from public,anon,authenticated;
-- Run before the existing pro guard converts a publish request into pending.
create trigger aa_partner_setup before insert or update on public.pros
  for each row execute function partner_private.guard_partner_setup();

create function partner_private.create_partner(p_title text,p_city text,p_district text,p_categories public.category_id[])
returns text language plpgsql security definer set search_path = '' as $$
declare me uuid:=auth.uid(); s text; who text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode='insufficient_privilege'; end if;
  if not exists(select 1 from public.accounts where id=me and coalesce(phone,'')<>'') then
    raise exception 'Thêm số điện thoại trước khi mở hồ sơ đối tác.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(me::text,0));
  select slug into s from public.pros where id=me;
  if s is not null then return s; end if;
  if char_length(trim(coalesce(p_title,''))) not between 3 and 80 or coalesce(cardinality(p_categories),0)=0 then
    raise exception 'Chọn nghề và viết giới thiệu từ 3 đến 80 ký tự.' using errcode='check_violation'; end if;
  select full_name into who from public.accounts where id=me;
  s:='doi-tac-'||replace(me::text,'-','');
  insert into public.pros(id,slug,title,city,district,categories,home_service,accepting_jobs)
    values(me,s,trim(p_title),p_city,p_district,p_categories,false,false);
  update public.accounts set active_role='pro' where id=me;
  return s;
end $$;
create function public.create_partner(p_title text,p_city text,p_district text,p_categories public.category_id[])
returns text language sql security invoker set search_path='' as $$
  select partner_private.create_partner(p_title,p_city,p_district,p_categories)
$$;

create function partner_private.partner_setup() returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object('profile',(select to_jsonb(p) from public.pros p where p.id=auth.uid()),
    'services',coalesce((select jsonb_agg(jsonb_build_object('template_id',s.template_id,'active',s.active,
      'prices',coalesce((select jsonb_object_agg(v.variant_id,v.price) from public.pro_service_prices v
        where v.pro_id=s.pro_id and v.template_id=s.template_id),'{}'::jsonb)))
      from public.pro_services s where s.pro_id=auth.uid()),'[]'::jsonb),
    'hours',coalesce((select jsonb_agg(jsonb_build_object('weekday',weekday,'startMin',start_min,'endMin',end_min))
      from public.working_hours where pro_id=auth.uid()),'[]'::jsonb),
    'workCount',(select count(*) from public.works where pro_id=auth.uid() and hidden_at is null))
$$;
create function public.partner_setup() returns jsonb language sql stable security invoker set search_path='' as $$
  select partner_private.partner_setup()
$$;

create function public.save_partner_profile(p_profile jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare me uuid:=auth.uid();
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode='insufficient_privilege'; end if;
  if jsonb_typeof(p_profile)<>'object' then raise exception 'Hồ sơ không hợp lệ.'; end if;
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
    avatar_path=case when p_profile?'avatarPath' then nullif(p_profile->>'avatarPath','') else avatar_path end
    where id=me;
  if not found then raise exception 'Cần tạo hồ sơ đối tác trước.'; end if;
end $$;
create function partner_private.confirm_partner_hours(p_windows jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
  perform public.replace_working_hours(p_windows);
  update public.pros set hours_confirmed=jsonb_array_length(p_windows)>0 where id=auth.uid();
end $$;
create function partner_private.submit_partner_profile(p_agree boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
  if p_agree is distinct from true then raise exception 'Xác nhận chính sách phí, nhận việc và hủy lịch trước khi gửi duyệt.'; end if;
  update public.pros set terms_accepted_at=now(),published=true where id=auth.uid();
  if not found then raise exception 'Cần tạo hồ sơ đối tác trước.'; end if;
end $$;

create function public.confirm_partner_hours(p_windows jsonb) returns void language sql security invoker set search_path='' as $$ select partner_private.confirm_partner_hours(p_windows) $$;
create function public.submit_partner_profile(p_agree boolean) returns void language sql security invoker set search_path='' as $$ select partner_private.submit_partner_profile(p_agree) $$;

create function partner_private.capture_service_contract() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' then
    new.service_contract:=old.service_contract;
    if tg_table_name='jobs' then new.max_total:=old.max_total; end if;
    return new;
  end if;
  if tg_table_name='bookings' then
    perform pg_advisory_xact_lock(hashtextextended(new.pro_id::text,1));
    if (select sessions>1 from public.service_variants where template_id=new.template_id and id=new.variant_id) and coalesce(current_setting('app.checked_booking',true),'')<>'on' then raise exception 'Chọn đủ các buổi qua luồng đặt lịch mới.'; end if;
    new.service_contract:=partner_private.service_contract(new.template_id,new.variant_id,new.quantity,
      new.service_price/greatest(new.quantity,1),new.duration_min);
  else
    new.service_contract:=partner_private.service_contract(new.template_id,new.variant_id,new.quantity,new.price,
      public.service_duration_min(new.template_id,new.variant_id,new.quantity));
    new.max_total:=coalesce(nullif(current_setting('app.job_max_total',true),'')::int,
      new.price*new.quantity+(select travel_fee_cap+case when public.is_urgent(new.starts_at) then urgent_fee else 0 end from public.fee_policy where id));
    if new.max_total<new.price*new.quantity then raise exception 'Tổng tối đa không được thấp hơn giá dịch vụ.'; end if;
  end if;
  return new;
end $$;
revoke all on function partner_private.capture_service_contract() from public,anon,authenticated;
create trigger aa_booking_contract before insert or update on public.bookings for each row execute function partner_private.capture_service_contract();
create trigger aa_job_contract before insert or update on public.jobs for each row execute function partner_private.capture_service_contract();

create or replace function public.job_problem(p_pro uuid,j public.jobs) returns text
language plpgsql stable security definer set search_path='' as $$
declare pro public.pros; addr public.addresses; q public.quote; km numeric; why text;
begin
  select * into pro from public.pros where id=p_pro;
  if pro is null then return 'Chỉ đối tác mới nhận việc được.'; end if;
  if public.wallet_below_floor(p_pro) then return 'Thanh toán phí của đơn trước để nhận việc mới.'; end if;
  if j.customer_id=p_pro then return 'Không thể nhận yêu cầu của chính mình.'; end if;
  if coalesce((j.service_contract->>'version')::int,1)<>(select catalog_version from public.service_templates where id=j.template_id) then return 'Gói dịch vụ đã cập nhật. Khách cần đăng lại yêu cầu để xác nhận phạm vi mới.'; end if;
  if j.status<>'open' or j.starts_at<=now() then return 'Yêu cầu không còn nhận được.'; end if;
  if pro.city<>j.city then return 'Yêu cầu ở thành phố khác.'; end if;
  if public.listed_price(p_pro,j.template_id,j.variant_id) is null then return 'Bạn chưa niêm yết dịch vụ/gói này.'; end if;
  if public.listed_price(p_pro,j.template_id,j.variant_id) is distinct from j.price then
    return 'Mức giá yêu cầu khác giá bạn đang niêm yết cho gói này.'; end if;
  if public.blocked_between(j.customer_id,p_pro) then return 'Không nhận được yêu cầu này.'; end if;
  select * into addr from public.addresses where id=j.address_id;
  if addr is null then return 'Địa chỉ của yêu cầu không còn.'; end if;
  why:=public.availability_problem(p_pro,j.template_id,j.variant_id,j.quantity,j.starts_at,j.at_home,addr.lat,addr.lng);
  if why is not null then return why; end if;
  km:=public.travel_distance_km(pro.lat,pro.lng,addr.lat,addr.lng,(select road_factor from public.fee_policy where id));
  q:=public.build_quote(j.price,j.quantity,j.at_home,km,public.is_urgent(j.starts_at));
  if j.max_total is not null and q.total>j.max_total then return 'Tổng tiền vượt mức phụ phí khách đã đồng ý.'; end if;
  if coalesce((j.service_contract->>'sessions')::int,1)>1 then
    return 'Gói nhiều buổi cần đặt trực tiếp để chọn đủ lịch.'; end if;
  return null;
end $$;

create function partner_private.my_job_eligibility(p_ids uuid[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare j public.jobs; pro public.pros; addr public.addresses; q public.quote; why text; out jsonb:='[]'; km numeric;
begin
  select * into pro from public.pros where id=auth.uid();
  if pro is null then raise exception 'Cần đăng nhập tài khoản đối tác.' using errcode='insufficient_privilege'; end if;
  if cardinality(p_ids)>200 then raise exception 'Tối đa 200 yêu cầu mỗi lượt.'; end if;
  for j in select * from public.jobs where id=any(p_ids) and status='open' loop
    why:=public.job_problem(pro.id,j);
    q:=null;
    if why is null then
      select * into addr from public.addresses where id=j.address_id;
      km:=public.travel_distance_km(pro.lat,pro.lng,addr.lat,addr.lng,(select road_factor from public.fee_policy where id));
      q:=public.build_quote(j.price,j.quantity,j.at_home,km,public.is_urgent(j.starts_at));
    end if;
    out:=out||jsonb_build_array(jsonb_build_object('id',j.id,'reason',why,'total',q.total,'payout',q.payout));
  end loop;
  return out;
end $$;
create function public.my_job_eligibility(p_ids uuid[]) returns jsonb language sql stable security invoker set search_path='' as $$
  select partner_private.my_job_eligibility(p_ids)
$$;

create function public.post_job_checked(p_template text,p_variant text,p_starts_at timestamptz,p_at_home boolean,
  p_address_id uuid,p_quantity int,p_description text,p_payment public.payment_method,p_price int,p_max_total int)
returns uuid language plpgsql security invoker set search_path='' as $$
begin
  if p_max_total is null or p_max_total<p_price*p_quantity then raise exception 'Xác nhận tổng tiền tối đa trước khi gửi yêu cầu.'; end if;
  if (select sessions>1 from public.service_variants where template_id=p_template and id=p_variant) then
    raise exception 'Gói nhiều buổi cần đặt trực tiếp từ hồ sơ đối tác.'; end if;
  perform set_config('app.job_max_total',p_max_total::text,true);
  return public.post_job(p_template,p_variant,p_starts_at,p_at_home,p_address_id,p_quantity,p_description,p_payment,p_price);
end $$;

create function partner_private.booking_quote(p_pro uuid,p_template text,p_variant text,p_starts_at timestamptz,
  p_at_home boolean,p_address_id uuid,p_quantity int) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare pro public.pros; a public.addresses; q public.quote; why text; km numeric; unit int;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập để xác nhận tổng tiền.' using errcode='insufficient_privilege'; end if;
  select * into pro from public.pros where id=p_pro;
  if p_at_home then
    select * into a from public.addresses where id=p_address_id and account_id=auth.uid();
    if a is null then raise exception 'Cần chọn địa chỉ đã lưu.'; end if;
  else a.lat:=pro.lat; a.lng:=pro.lng; end if;
  why:=public.availability_problem(p_pro,p_template,p_variant,p_quantity,p_starts_at,p_at_home,a.lat,a.lng);
  if why is not null then raise exception '%',why using errcode='check_violation'; end if;
  unit:=public.listed_price(p_pro,p_template,p_variant);
  km:=case when p_at_home then public.travel_distance_km(pro.lat,pro.lng,a.lat,a.lng,(select road_factor from public.fee_policy where id)) end;
  q:=public.build_quote(unit,p_quantity,p_at_home,km,public.is_urgent(p_starts_at));
  return jsonb_build_object('servicePrice',q.service_price,'distanceKm',q.distance_km,'travelFee',q.travel_fee,
    'urgentFee',q.urgent_fee,'total',q.total,'commissionRate',q.commission_rate,'commission',q.commission,'payout',q.payout,
    'unitPrice',unit,'expiresAt',now()+interval '5 minutes');
end $$;
create function public.booking_quote(p_pro uuid,p_template text,p_variant text,p_starts_at timestamptz,
  p_at_home boolean,p_address_id uuid,p_quantity int) returns jsonb
language sql stable security invoker set search_path='' as $$
  select partner_private.booking_quote(p_pro,p_template,p_variant,p_starts_at,p_at_home,p_address_id,p_quantity)
$$;

-- The native and web quote must stay valid even during a legacy direct price edit.
create function partner_private.lock_service_price() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(coalesce(new.pro_id,old.pro_id)::text,1));
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function partner_private.lock_service_price() from public,anon,authenticated;
create trigger aa_lock_service_price before insert or update or delete on public.pro_service_prices
  for each row execute function partner_private.lock_service_price();

-- Additional appointments belong to one paid package; they never charge again.
create table public.booking_sessions(
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
  pro_id uuid not null references public.pros(id), sequence int not null check(sequence between 2 and 3),
  starts_at timestamptz not null, duration_min int not null check(duration_min between 15 and 720),
  confirmed boolean not null default false, proposed_by uuid not null references public.accounts(id),
  unique(booking_id,sequence));
create index booking_sessions_pro_time_idx on public.booking_sessions(pro_id,starts_at);
alter table public.booking_sessions enable row level security;
revoke all on public.booking_sessions from public,anon,authenticated;
grant select on public.booking_sessions to authenticated;
grant all on public.booking_sessions to service_role;
create policy "booking participants read appointments" on public.booking_sessions for select to authenticated using(
  exists(select 1 from public.bookings b where b.id=booking_id and auth.uid() in (b.customer_id,b.pro_id)));

create or replace function partner_private.guard_booking_sessions() returns trigger
language plpgsql security definer set search_path='' as $$
declare parent public.bookings; pro public.pros; day date; count_day int;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.pro_id::text,1));
  if tg_table_name='bookings' then
    if new.status in ('pending','confirmed','in_progress') and exists(
      select 1 from public.booking_sessions s join public.bookings b on b.id=s.booking_id
      where s.pro_id=new.pro_id and s.booking_id<>new.id and s.confirmed
      and b.status in ('pending','confirmed','in_progress','completed')
      and tstzrange(s.starts_at,s.starts_at+make_interval(mins=>s.duration_min+b.buffer_min),'[)') &&
          tstzrange(new.starts_at,new.starts_at+make_interval(mins=>new.duration_min+new.buffer_min),'[)')) then
      raise exception 'Khung giờ trùng một buổi trong gói đã nhận.' using errcode='check_violation';
    end if;
    if tg_op='UPDATE' and new.status='completed' and old.status<>'completed' and
      coalesce((new.service_contract->>'sessions')::int,1)>1 and (
        (select count(*) from public.booking_sessions s where s.booking_id=new.id and s.confirmed)<(new.service_contract->>'sessions')::int-1
        or exists(select 1 from public.booking_sessions s where s.booking_id=new.id and s.starts_at+make_interval(mins=>s.duration_min)>now())) then
      raise exception 'Chưa thực hiện đủ các buổi trong gói.' using errcode='check_violation';
    end if;
    return new;
  end if;
  select * into parent from public.bookings where id=new.booking_id;
  if parent.id is null or parent.pro_id<>new.pro_id then raise exception 'Buổi hẹn không thuộc đối tác của đơn.' using errcode='check_violation'; end if;
  if new.confirmed then
    if not public.within_working_hours(new.pro_id,new.starts_at,new.duration_min) then raise exception 'Buổi hẹn nằm ngoài giờ làm hoặc trong ngày nghỉ.' using errcode='check_violation'; end if;
    select * into pro from public.pros where id=new.pro_id;
    day:=(new.starts_at at time zone public.app_timezone())::date;
    select (select count(*) from public.bookings b where b.pro_id=new.pro_id and b.status in('pending','confirmed','in_progress','completed') and (b.starts_at at time zone public.app_timezone())::date=day)
      +(select count(*) from public.booking_sessions s join public.bookings b on b.id=s.booking_id where s.pro_id=new.pro_id and s.id<>new.id and s.confirmed and b.status in('pending','confirmed','in_progress','completed') and (s.starts_at at time zone public.app_timezone())::date=day) into count_day;
    if count_day>=pro.max_jobs_per_day then raise exception 'Đối tác đã đủ số lịch trong ngày.' using errcode='check_violation'; end if;
  end if;
  if new.confirmed and (
    exists(select 1 from public.bookings b where b.pro_id=new.pro_id and b.status in('pending','confirmed','in_progress')
      and tstzrange(b.starts_at,b.starts_at+make_interval(mins=>b.duration_min+b.buffer_min),'[)') &&
          tstzrange(new.starts_at,new.starts_at+make_interval(mins=>new.duration_min+parent.buffer_min),'[)'))
    or exists(select 1 from public.booking_sessions s join public.bookings b on b.id=s.booking_id
      where s.pro_id=new.pro_id and s.id<>new.id and s.confirmed and b.status in('pending','confirmed','in_progress','completed')
      and tstzrange(s.starts_at,s.starts_at+make_interval(mins=>s.duration_min+b.buffer_min),'[)') &&
          tstzrange(new.starts_at,new.starts_at+make_interval(mins=>new.duration_min+parent.buffer_min),'[)'))) then
    raise exception 'Khung giờ này đã có lịch khác.' using errcode='check_violation';
  end if;
  return new;
end $$;
revoke all on function partner_private.guard_booking_sessions() from public,anon,authenticated;
create trigger ab_booking_sessions before insert or update on public.bookings for each row execute function partner_private.guard_booking_sessions();
create trigger sessions_conflict before insert or update on public.booking_sessions for each row execute function partner_private.guard_booking_sessions();

create function partner_private.create_booking_checked(p_pro uuid,p_template text,p_variant text,p_starts_at timestamptz,
  p_at_home boolean,p_address_id uuid,p_quantity int,p_note text,p_payment public.payment_method,
  p_expected_total int,p_expected_unit int,p_sessions timestamptz[])
returns uuid language plpgsql security definer set search_path='' as $$
declare quote jsonb; bid uuid; v public.service_variants; at timestamptz; seq int:=2;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_pro::text,1));
  quote:=partner_private.booking_quote(p_pro,p_template,p_variant,p_starts_at,p_at_home,p_address_id,p_quantity);
  if p_expected_total is null or p_expected_unit is null
    or (quote->>'total')::int<>p_expected_total or (quote->>'unitPrice')::int<>p_expected_unit then
    raise exception 'Giá hoặc phụ phí vừa thay đổi. Xem lại tổng tiền rồi xác nhận.' using errcode='check_violation'; end if;
  select * into v from public.service_variants where template_id=p_template and id=p_variant;
  if coalesce(cardinality(p_sessions),0)<>v.sessions-1 then raise exception 'Chọn đủ lịch cho các buổi trong gói.'; end if;
  perform set_config('app.checked_booking','on',true);
  bid:=public.create_booking(p_pro,p_template,p_variant,p_starts_at,p_at_home,p_address_id,p_quantity,p_note,p_payment);
  perform set_config('app.checked_booking','off',true);
  foreach at in array coalesce(p_sessions,'{}'::timestamptz[]) loop
    if at<=p_starts_at or not public.within_working_hours(p_pro,at,v.duration_min) then
      raise exception 'Buổi tiếp theo phải sau buổi đầu và trong giờ làm của đối tác.'; end if;
    insert into public.booking_sessions(booking_id,pro_id,sequence,starts_at,duration_min,confirmed,proposed_by)
      values(bid,p_pro,seq,at,v.duration_min,true,auth.uid());
    seq:=seq+1;
  end loop;
  return bid;
end $$;
create function public.create_booking_checked(p_pro uuid,p_template text,p_variant text,p_starts_at timestamptz,
  p_at_home boolean,p_address_id uuid,p_quantity int,p_note text,p_payment public.payment_method,
  p_expected_total int,p_expected_unit int,p_sessions timestamptz[] default '{}')
returns uuid language sql security invoker set search_path='' as $$
  select partner_private.create_booking_checked(p_pro,p_template,p_variant,p_starts_at,p_at_home,p_address_id,p_quantity,
    p_note,p_payment,p_expected_total,p_expected_unit,p_sessions)
$$;

create function partner_private.propose_followup(p_booking uuid,p_starts_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
declare b public.bookings; days int;
begin
  select * into b from public.bookings where id=p_booking for update;
  if b.id is null or auth.uid() is null or auth.uid() not in(b.customer_id,b.pro_id) then raise exception 'Không có quyền.' using errcode='insufficient_privilege'; end if;
  days:=(b.service_contract->>'followupDays')::int;
  if days is null or b.status<>'completed' or p_starts_at<=now() or p_starts_at>b.starts_at+make_interval(days=>days) then
    raise exception 'Buổi dặm phải nằm trong thời hạn của gói đã hoàn thành.'; end if;
  if not public.within_working_hours(b.pro_id,p_starts_at,60) then raise exception 'Buổi dặm nằm ngoài giờ làm.'; end if;
  if exists(select 1 from public.booking_sessions where booking_id=b.id and confirmed and starts_at<=now()) then raise exception 'Buổi dặm trong gói đã được sử dụng.'; end if;
  insert into public.booking_sessions(booking_id,pro_id,sequence,starts_at,duration_min,proposed_by)
    values(b.id,b.pro_id,2,p_starts_at,60,auth.uid())
    on conflict(booking_id,sequence) do update set starts_at=excluded.starts_at,confirmed=false,proposed_by=excluded.proposed_by;
  perform public.notify(case when auth.uid()=b.pro_id then b.customer_id else b.pro_id end,'booking_followup',
    'Có đề xuất lịch dặm','Xem và xác nhận buổi dặm đã gồm trong gói.','/bookings/'||b.id);
end $$;
create function public.propose_followup(p_booking uuid,p_starts_at timestamptz) returns void language sql security invoker set search_path='' as $$
  select partner_private.propose_followup(p_booking,p_starts_at)
$$;
create function partner_private.confirm_followup(p_session uuid) returns void
language plpgsql security definer set search_path='' as $$
declare s public.booking_sessions; b public.bookings;
begin
  select * into s from public.booking_sessions where id=p_session for update;
  select * into b from public.bookings where id=s.booking_id;
  if b.id is null or auth.uid() is null or auth.uid() not in(b.customer_id,b.pro_id) or auth.uid()=s.proposed_by then
    raise exception 'Buổi dặm cần phía còn lại xác nhận.' using errcode='insufficient_privilege'; end if;
  if b.status<>'completed' or (b.service_contract->>'followupDays') is null then raise exception 'Đơn không còn đủ điều kiện hẹn dặm.'; end if;
  if s.starts_at<=now() then raise exception 'Buổi dặm đã quá giờ. Đề xuất lịch mới.'; end if;
  if not public.within_working_hours(b.pro_id,s.starts_at,s.duration_min) then raise exception 'Giờ làm đã thay đổi. Đề xuất lịch mới.'; end if;
  update public.booking_sessions set confirmed=true where id=s.id;
end $$;
create function public.confirm_followup(p_session uuid) returns void language sql security invoker set search_path='' as $$
  select partner_private.confirm_followup(p_session)
$$;

-- Keep existing availability/privacy checks and add included appointments.
do $$ declare definition text; needle text:='  minutes := public.service_duration_min(p_template, p_variant, p_quantity);'; begin
  select pg_get_functiondef('public.availability_problem(uuid,text,text,integer,timestamptz,boolean,double precision,double precision,uuid)'::regprocedure) into definition;
  if position(needle in definition)=0 then raise exception 'availability_problem changed: review migration'; end if;
  definition:=replace(definition,needle,needle||E'\n  if exists (select 1 from public.booking_sessions s join public.bookings b on b.id=s.booking_id\n    where s.pro_id=p_pro and s.confirmed and b.status in (''pending'',''confirmed'',''in_progress'',''completed'')\n    and (p_ignore_booking is null or s.booking_id<>p_ignore_booking)\n    and tstzrange(s.starts_at,s.starts_at+make_interval(mins=>s.duration_min+b.buffer_min),''[)'') &&\n        tstzrange(p_starts_at,p_starts_at+make_interval(mins=>minutes+pro.buffer_min),''[)'')) then\n    return ''Khung giờ trùng một buổi trong gói đã nhận.'';\n  end if;');
  definition:=replace(definition,'  if day_count >= pro.max_jobs_per_day then',E'  day_count := day_count + (select count(*) from public.booking_sessions s join public.bookings b on b.id=s.booking_id where s.pro_id=p_pro and s.confirmed and b.status in (''pending'',''confirmed'',''in_progress'',''completed'') and (s.starts_at at time zone public.app_timezone())::date=(p_starts_at at time zone public.app_timezone())::date and (p_ignore_booking is null or s.booking_id<>p_ignore_booking));\n  if day_count >= pro.max_jobs_per_day then');
  execute definition;
end $$;

revoke all on all functions in schema partner_private from public,anon,authenticated;
grant execute on function partner_private.confirm_partner_hours(jsonb),partner_private.submit_partner_profile(boolean),partner_private.create_partner(text,text,text,public.category_id[]),partner_private.partner_setup(),
  partner_private.my_job_eligibility(uuid[]),partner_private.booking_quote(uuid,text,text,timestamptz,boolean,uuid,int),
  partner_private.create_booking_checked(uuid,text,text,timestamptz,boolean,uuid,int,text,public.payment_method,int,int,timestamptz[]),
  partner_private.propose_followup(uuid,timestamptz),partner_private.confirm_followup(uuid) to authenticated;
revoke all on function public.create_partner(text,text,text,public.category_id[]),public.partner_setup(),
  public.save_partner_profile(jsonb),public.confirm_partner_hours(jsonb),public.submit_partner_profile(boolean),
  public.my_job_eligibility(uuid[]),public.booking_quote(uuid,text,text,timestamptz,boolean,uuid,int),
  public.post_job_checked(text,text,timestamptz,boolean,uuid,int,text,public.payment_method,int,int),
  public.create_booking_checked(uuid,text,text,timestamptz,boolean,uuid,int,text,public.payment_method,int,int,timestamptz[]),
  public.propose_followup(uuid,timestamptz),public.confirm_followup(uuid) from public,anon,authenticated;
grant execute on function public.create_partner(text,text,text,public.category_id[]),public.partner_setup(),
  public.save_partner_profile(jsonb),public.confirm_partner_hours(jsonb),public.submit_partner_profile(boolean),
  public.my_job_eligibility(uuid[]),public.booking_quote(uuid,text,text,timestamptz,boolean,uuid,int),
  public.post_job_checked(text,text,timestamptz,boolean,uuid,int,text,public.payment_method,int,int),
  public.create_booking_checked(uuid,text,text,timestamptz,boolean,uuid,int,text,public.payment_method,int,int,timestamptz[]),
  public.propose_followup(uuid,timestamptz),public.confirm_followup(uuid) to authenticated;

-- Version 2 catalogue metadata; existing partner prices and contracts stay intact.
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'nail-gel', 'nail', 'Sơn gel trơn', 'Làm sạch, tạo form và sơn gel một màu.', array['Cắt da, tạo form móng', 'Sơn gel 1 màu', 'Dưỡng viền móng']::text[], false, false, null, null, false, true, 0, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-gel', 'hand', 'Tay', 45, 120000, 220000, 160000, array[120000, 160000, 220000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-gel', 'cat-eye', 'Tay · mắt mèo / tráng gương', 50, 140000, 240000, 180000, array[140000, 180000, 240000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-gel', 'hand-foot', 'Tay + chân', 90, 220000, 400000, 300000, array[220000, 300000, 400000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'nail-design', 'nail', 'Nail thiết kế', 'Sơn gel kèm thiết kế theo mẫu khách chọn.', array['Cắt da, tạo form móng', 'Sơn gel nền', 'Thiết kế theo mẫu']::text[], false, false, null, null, false, true, 1, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'simple', 'Ombre / French', 75, 200000, 350000, 260000, array[200000, 260000, 350000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'stone', 'Đính đá / charm', 90, 250000, 450000, 330000, array[250000, 330000, 450000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-design', 'art', 'Vẽ nghệ thuật', 120, 350000, 650000, 480000, array[350000, 480000, 650000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'nail-extension', 'nail', 'Nối móng', 'Nối dài móng bằng móng úp hoặc đắp gel.', array['Tạo form móng thật', 'Nối móng', 'Sơn gel 1 màu']::text[], false, false, null, null, false, true, 2, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-extension', 'tips', 'Úp móng', 90, 220000, 360000, 280000, array[220000, 280000, 360000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-extension', 'builder', 'Đắp gel', 120, 300000, 500000, 380000, array[300000, 380000, 500000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-extension', 'gelx', 'Móng úp mềm Gel-X', 100, 350000, 600000, 450000, array[350000, 450000, 600000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'nail-removal', 'nail', 'Tháo gel & dưỡng móng', 'Tháo gel/bột an toàn, không làm mỏng móng.', array['Tháo gel bằng dung dịch chuyên dụng', 'Dũa lại form', 'Dưỡng móng']::text[], false, false, null, null, false, true, 3, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-removal', 'remove', 'Tháo gel', 20, 50000, 100000, 80000, array[50000, 80000, 100000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-removal', 'remove-care', 'Tháo + dưỡng', 45, 100000, 200000, 150000, array[100000, 150000, 200000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'nail-pedicure', 'nail', 'Chăm sóc bàn chân (pedicure)', 'Ngâm chân, lấy da chết, cắt da và dưỡng gót.', array['Ngâm chân thảo mộc', 'Lấy da chết, cắt da', 'Dưỡng gót & massage chân']::text[], false, false, null, null, false, true, 4, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-pedicure', 'basic', 'Cơ bản', 45, 130000, 250000, 180000, array[130000, 180000, 250000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-pedicure', 'deluxe', 'Có đắp mặt nạ chân', 75, 220000, 350000, 280000, array[220000, 280000, 350000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'nail-manicure', 'nail', 'Cắt da, sửa form & sơn thường', 'Chăm sóc móng cơ bản cho khách không dùng gel.', array['Cắt da, sửa form móng', 'Sơn thường 1 màu', 'Dưỡng viền móng']::text[], false, false, null, null, false, true, 5, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-manicure', 'hand', 'Tay', 30, 80000, 150000, 110000, array[80000, 110000, 150000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-manicure', 'hand-foot', 'Tay + chân', 60, 150000, 260000, 200000, array[150000, 200000, 260000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'nail-refill', 'nail', 'Dặm móng nối', 'Dặm phần móng mọc ra và sơn lại cho bộ móng đã nối.', array['Dũa, làm sạch phần móng mọc', 'Đắp bù gel', 'Sơn lại 1 màu']::text[], false, false, null, null, false, true, 6, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-refill', 'refill', 'Dặm móng', 75, 150000, 260000, 200000, array[150000, 200000, 260000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'makeup-daily', 'makeup', 'Makeup nhẹ / đi làm', 'Lớp nền mỏng, tự nhiên, phù hợp đi làm, đi học, hẹn hò.', array['Làm sạch & dưỡng nền', 'Makeup tự nhiên', 'Mỹ phẩm của chuyên viên']::text[], false, false, null, null, false, true, 7, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-daily', 'single', '1 người', 45, 200000, 350000, 280000, array[200000, 280000, 350000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'makeup-party', 'makeup', 'Makeup dự tiệc', 'Makeup bền màu cho tiệc, sự kiện, kèm mi giả.', array['Makeup bền 8 tiếng', 'Mi giả', 'Tư vấn layout theo trang phục']::text[], false, false, null, null, false, true, 8, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-party', 'makeup', 'Makeup', 60, 300000, 550000, 400000, array[300000, 400000, 550000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-party', 'makeup-hair', 'Makeup + làm tóc', 90, 400000, 750000, 550000, array[400000, 550000, 750000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'makeup-photo', 'makeup', 'Makeup chụp ảnh / kỷ yếu', 'Layout lên hình theo concept, ánh sáng.', array['Layout theo concept', 'Mi giả', 'Dặm lại 1 lần trong buổi chụp (nếu ở lại)']::text[], false, false, null, null, false, true, 9, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'single', '1 người', 60, 350000, 650000, 450000, array[350000, 450000, 650000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-photo', 'group', 'Nhóm (giá mỗi người)', 45, 200000, 300000, 250000, array[200000, 250000, 300000], true, 8, 1, 'per_person', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'makeup-bridal', 'makeup', 'Makeup cô dâu', 'Makeup và làm tóc cô dâu, tư vấn layout trước ngày cưới.', array['Tư vấn layout trước ngày cưới', 'Makeup + làm tóc cô dâu', 'Mi giả, phụ kiện tóc cơ bản']::text[], false, false, null, null, false, true, 10, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'one', '1 lễ (ăn hỏi hoặc cưới)', 120, 1200000, 2800000, 1800000, array[1200000, 1800000, 2800000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'two', 'Trọn gói 2 lễ (2 buổi × 120 phút)', 120, 2200000, 4800000, 3200000, array[2200000, 3200000, 4800000], false, 1, 1, 'fixed', 1, null, 0, 2, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-bridal', 'fullday', 'Theo cô dâu cả ngày (dặm, đổi layout)', 600, 3000000, 6500000, 4500000, array[3000000, 4500000, 6500000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'makeup-family', 'makeup', 'Makeup mẹ cô dâu / người nhà / phụ dâu', 'Makeup và làm tóc cho người nhà trong ngày cưới.', array['Makeup bền', 'Làm tóc đơn giản', 'Mi giả']::text[], false, false, null, null, false, true, 11, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-family', 'mother', 'Mẹ cô dâu / chú rể', 75, 400000, 700000, 550000, array[400000, 550000, 700000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-family', 'family', 'Người nhà / phụ dâu (giá mỗi người)', 60, 250000, 450000, 350000, array[250000, 350000, 450000], true, 8, 1, 'per_person', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'makeup-event', 'makeup', 'Makeup sự kiện / MC / biểu diễn', 'Layout lên đèn sân khấu, lên hình livestream.', array['Makeup lên đèn, lên hình', 'Làm tóc', 'Mi giả']::text[], false, false, null, null, false, true, 12, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-event', 'event', 'Sự kiện', 90, 500000, 1000000, 700000, array[500000, 700000, 1000000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'makeup-prewedding', 'makeup', 'Makeup chụp ảnh cưới', 'Makeup cô dâu cho buổi chụp ảnh cưới trong studio hoặc ngoại cảnh.', array['Makeup + tóc cô dâu', 'Đổi layout theo trang phục', 'Mi giả']::text[], false, false, null, null, false, true, 13, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-prewedding', 'studio', 'Chụp trong studio', 120, 700000, 1500000, 1000000, array[700000, 1000000, 1500000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'makeup-prewedding', 'outdoor', 'Ngoại cảnh, theo cả buổi', 300, 1000000, 2200000, 1500000, array[1000000, 1500000, 2200000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'skin-basic', 'skincare', 'Chăm sóc da cơ bản', 'Làm sạch, tẩy tế bào chết, massage và đắp mặt nạ.', array['Soi da', 'Làm sạch 2 bước, tẩy tế bào chết', 'Massage mặt', 'Mặt nạ theo loại da']::text[], false, false, null, null, false, true, 14, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-basic', '60m', '60 phút', 60, 200000, 380000, 280000, array[200000, 280000, 380000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-basic', '90m', '90 phút', 90, 300000, 550000, 400000, array[300000, 400000, 550000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'skin-acne', 'skincare', 'Lấy nhân mụn chuẩn y khoa', 'Lấy nhân mụn vô khuẩn, làm dịu và kháng viêm.', array['Soi da', 'Lấy nhân mụn bằng dụng cụ vô khuẩn', 'Mặt nạ làm dịu']::text[], false, false, null, null, false, true, 15, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-acne', '60m', '60 phút', 60, 220000, 420000, 300000, array[220000, 300000, 420000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-acne', '90m', '90 phút', 90, 300000, 550000, 420000, array[300000, 420000, 550000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'skin-recovery', 'skincare', 'Phục hồi da nhạy cảm', 'Liệu trình dịu nhẹ cho da đỏ, kích ứng, sau treatment.', array['Soi da', 'Làm sạch dịu nhẹ', 'Serum & mặt nạ phục hồi']::text[], false, false, null, null, false, true, 16, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-recovery', '75m', '75 phút', 75, 300000, 580000, 420000, array[300000, 420000, 580000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'skin-wax', 'skincare', 'Waxing', 'Wax lông bằng sáp nóng hoặc sáp hạt, kèm dịu da sau wax.', array['Làm sạch vùng wax', 'Wax', 'Dịu da sau wax']::text[], false, false, null, null, false, true, 17, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-wax', 'underarm', 'Nách', 20, 70000, 150000, 100000, array[70000, 100000, 150000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-wax', 'half-leg', 'Nửa chân', 30, 150000, 280000, 200000, array[150000, 200000, 280000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-wax', 'full-leg', 'Cả chân', 45, 250000, 450000, 330000, array[250000, 330000, 450000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-wax', 'arm', 'Cả tay', 30, 180000, 300000, 240000, array[180000, 240000, 300000], false, 1, 3, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-wax', 'half-arm', 'Nửa tay', 20, 120000, 220000, 160000, array[120000, 160000, 220000], false, 1, 4, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-wax', 'lip', 'Mép / ria', 15, 50000, 100000, 70000, array[50000, 70000, 100000], false, 1, 5, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-wax', 'bikini', 'Bikini', 30, 250000, 500000, 350000, array[250000, 350000, 500000], false, 1, 6, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'skin-hydration', 'skincare', 'Điện di cấp ẩm / vitamin C', 'Cấp ẩm và làm sáng da bằng điện di, không xâm lấn.', array['Làm sạch da', 'Điện di tinh chất', 'Mặt nạ khoá ẩm']::text[], false, false, null, null, false, true, 18, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'skin-hydration', '60m', '60 phút', 60, 220000, 400000, 300000, array[220000, 300000, 400000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-cut', 'hair', 'Cắt tóc', 'Cắt theo dáng mặt, gội và sấy tạo kiểu.', array['Tư vấn dáng tóc', 'Cắt & tỉa', 'Gội, sấy tạo kiểu']::text[], false, false, null, null, false, true, 19, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
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
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-color', 'hair', 'Nhuộm tóc', 'Nhuộm phủ bạc hoặc đổi màu, kèm dưỡng sau nhuộm.', array['Test da đầu', 'Nhuộm', 'Dưỡng phục hồi sau nhuộm']::text[], true, false, null, null, false, true, 20, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
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
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-perm', 'hair', 'Uốn tóc', 'Uốn lạnh hoặc uốn nóng, kèm dưỡng giữ nếp.', array['Tư vấn kiểu lọn', 'Uốn', 'Dưỡng giữ nếp']::text[], true, false, null, null, false, true, 21, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
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
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-treatment', 'hair', 'Hấp dầu & phục hồi tóc', 'Phục hồi tóc khô xơ sau tẩy, nhuộm hoặc uốn.', array['Gội làm sạch', 'Ủ dưỡng chuyên sâu', 'Sấy tạo kiểu nhẹ']::text[], true, false, null, null, false, true, 22, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
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
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-wash', 'hair', 'Gội đầu dưỡng sinh', 'Gội, massage da đầu và cổ vai, sấy khô.', array['Gội 2 lần', 'Massage da đầu, cổ vai', 'Sấy tạo phồng nhẹ']::text[], true, false, null, null, false, true, 23, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
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
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-styling', 'hair', 'Tạo kiểu tóc sự kiện', 'Uốn, búi, tết theo trang phục và dáng mặt.', array['Tư vấn kiểu tóc', 'Tạo kiểu', 'Keo/xịt giữ nếp']::text[], false, false, null, null, false, true, 24, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
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
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-bridal', 'hair', 'Làm tóc cô dâu', 'Làm tóc cô dâu có buổi thử trước.', array['1 buổi thử tóc', 'Tạo kiểu & cài phụ kiện', 'Giữ nếp suốt lễ']::text[], false, false, null, null, false, true, 25, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-bridal', 'one', '1 lễ', 120, 800000, 1800000, 1200000, array[800000, 1200000, 1800000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-straighten', 'hair', 'Duỗi / ép tóc', 'Duỗi thẳng tự nhiên hoặc duỗi phồng chân tóc, kèm dưỡng giữ nếp.', array['Tư vấn độ thẳng', 'Duỗi dập thuốc', 'Dưỡng giữ nếp']::text[], true, false, null, null, false, true, 26, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
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
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-scalp', 'hair', 'Chăm sóc da đầu (gàu, ngứa, rụng tóc)', 'Làm sạch sâu da đầu và ủ tinh chất theo tình trạng.', array['Soi da đầu', 'Tẩy tế bào chết da đầu', 'Ủ tinh chất & massage']::text[], true, false, null, null, false, true, 27, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'hair-scalp', '50m', '50 phút', 50, 150000, 300000, 220000, array[150000, 220000, 300000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'hair-home-cut', 'hair', 'Cắt tóc tại nhà cho bé & người lớn tuổi', 'Thợ đến nhà cắt gọn, hợp với người ngại ra tiệm.', array['Cắt, tỉa theo yêu cầu', 'Dọn tóc vụn']::text[], false, false, null, null, false, true, 28, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
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
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'lash-lift', 'lash-brow', 'Uốn mi (lash lift)', 'Uốn cong mi thật, không cần nối, giữ 4–6 tuần.', array['Test kích ứng', 'Uốn mi', 'Nhuộm mi (nếu chọn)']::text[], false, false, null, null, false, true, 29, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'lash-lift', 'lift', 'Uốn mi', 60, 180000, 350000, 250000, array[180000, 250000, 350000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'lash-lift', 'lift-tint', 'Uốn + nhuộm mi', 75, 230000, 400000, 300000, array[230000, 300000, 400000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'brow-tattoo', 'lash-brow', 'Phun xăm mày', 'Phun sợi hoặc phun bột, có buổi dặm lại sau 1 tháng.', array['Test màu & vẽ dáng', 'Phun mày', '1 buổi dặm lại trong 45 ngày']::text[], true, false, null, null, false, true, 30, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'brow-tattoo', 'hairstroke', 'Phun sợi', 150, 1500000, 3500000, 2500000, array[1500000, 2500000, 3500000], false, 1, 0, 'fixed', 1, null, 0, 1, 45)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'brow-tattoo', 'powder', 'Phun bột / ombre', 150, 1300000, 3000000, 2000000, array[1300000, 2000000, 3000000], false, 1, 1, 'fixed', 1, null, 0, 1, 45)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'brow-tint', 'lash-brow', 'Nhuộm mày', 'Nhuộm mày cho dáng rõ hơn mà chưa cần phun xăm.', array['Tỉa gọn', 'Nhuộm mày', 'Hướng dẫn giữ màu']::text[], false, false, null, null, false, true, 31, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'brow-tint', 'tint', 'Nhuộm mày', 30, 120000, 250000, 180000, array[120000, 180000, 250000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'lash-classic', 'lash-brow', 'Nối mi classic', 'Nối mi 1:1 tự nhiên như mi thật.', array['Test kích ứng keo', 'Nối mi 1:1', 'Hướng dẫn chăm sóc mi']::text[], true, false, null, null, false, true, 32, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'lash-classic', 'full', 'Full set', 90, 200000, 380000, 280000, array[200000, 280000, 380000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'lash-volume', 'lash-brow', 'Nối mi volume', 'Mi dày vừa, không nặng mắt.', array['Test kích ứng keo', 'Nối mi volume 2D–4D', 'Hướng dẫn chăm sóc mi']::text[], true, false, null, null, false, true, 33, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'lash-volume', 'full', 'Full set', 120, 300000, 550000, 400000, array[300000, 400000, 550000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'lash-refill', 'lash-brow', 'Dặm mi', 'Dặm lại mi đã nối trong vòng 3 tuần.', array['Làm sạch mi cũ', 'Dặm mi rụng']::text[], true, false, null, null, false, true, 34, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'lash-refill', 'refill', 'Dặm mi', 60, 120000, 220000, 160000, array[120000, 160000, 220000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'brow-shaping', 'lash-brow', 'Tạo dáng & tỉa mày', 'Đo tỉ lệ và tạo dáng mày theo khuôn mặt.', array['Đo tỉ lệ khuôn mặt', 'Tỉa, wax lông mày', 'Kẻ dáng mày']::text[], false, false, null, null, false, true, 35, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'brow-shaping', 'shape', 'Tạo dáng', 30, 80000, 180000, 120000, array[80000, 120000, 180000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'lash-design', 'lash-brow', 'Nối mi thiết kế (Katun, baby doll, mi thỏ, wispy)', 'Các kiểu mi thiết kế đang thịnh, dày hơn classic.', array['Test kích ứng keo', 'Nối mi theo mẫu', 'Hướng dẫn chăm sóc']::text[], true, false, null, null, false, true, 36, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'lash-design', 'full', 'Full set', 120, 300000, 500000, 380000, array[300000, 380000, 500000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'lash-removal', 'lash-brow', 'Tháo mi nối', 'Tháo mi cũ an toàn bằng dung dịch chuyên dụng.', array['Tháo bằng dung dịch chuyên dụng', 'Làm sạch mi thật']::text[], false, false, null, null, false, true, 37, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'lash-removal', 'remove', 'Tháo mi', 20, 50000, 100000, 80000, array[50000, 80000, 100000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'brow-lamination', 'lash-brow', 'Định hình (uốn) chân mày', 'Dựng và định hình sợi mày, giữ 6–8 tuần, không dùng kim.', array['Tỉa gọn', 'Uốn định hình', 'Nhuộm mày nếu cần']::text[], false, false, null, null, false, true, 38, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'brow-lamination', 'lamination', 'Định hình mày', 60, 300000, 600000, 450000, array[300000, 450000, 600000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'massage-foot', 'massage', 'Massage chân', 'Ngâm chân thảo mộc và bấm huyệt bàn chân, bắp chân.', array['Ngâm chân thảo mộc', 'Bấm huyệt bàn chân', 'Massage bắp chân']::text[], false, false, null, null, false, true, 39, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-foot', '60m', '60 phút', 60, 220000, 380000, 300000, array[220000, 300000, 380000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-foot', '90m', '90 phút', 90, 300000, 520000, 400000, array[300000, 400000, 520000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-foot', '120m', '120 phút', 120, 380000, 650000, 500000, array[380000, 500000, 650000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'massage-neck', 'massage', 'Massage cổ vai gáy', 'Giảm căng cứng cổ, vai, gáy cho dân văn phòng.', array['Chườm nóng', 'Massage cổ vai gáy', 'Bấm huyệt đầu']::text[], false, false, null, null, false, true, 40, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-neck', '60m', '60 phút', 60, 250000, 420000, 330000, array[250000, 330000, 420000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-neck', '90m', '90 phút', 90, 350000, 580000, 450000, array[350000, 450000, 580000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-neck', '120m', '120 phút', 120, 450000, 720000, 580000, array[450000, 580000, 720000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'massage-oil-cupping', 'massage', 'Massage dầu + giác hơi', 'Massage body với tinh dầu, kết hợp giác hơi lưng.', array['Massage body tinh dầu', 'Giác hơi lưng', 'Khăn nóng']::text[], false, false, null, null, false, true, 41, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-oil-cupping', '60m', '60 phút', 60, 300000, 480000, 380000, array[300000, 380000, 480000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-oil-cupping', '90m', '90 phút', 90, 420000, 650000, 520000, array[420000, 520000, 650000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-oil-cupping', '120m', '120 phút', 120, 520000, 800000, 650000, array[520000, 650000, 800000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'massage-prenatal', 'massage', 'Massage bầu', 'Massage an toàn cho mẹ bầu từ tháng thứ 4.', array['Tư thế nằm nghiêng an toàn', 'Dầu massage lành tính', 'Giảm đau lưng, phù chân']::text[], false, false, null, null, false, true, 42, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-prenatal', '60m', '60 phút', 60, 350000, 550000, 450000, array[350000, 450000, 550000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-prenatal', '90m', '90 phút', 90, 450000, 700000, 550000, array[450000, 550000, 700000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'massage-dry', 'massage', 'Massage không dầu', 'Massage body ấn huyệt, không dùng dầu.', array['Ấn huyệt toàn thân', 'Kéo giãn nhẹ', 'Khăn nóng']::text[], false, false, null, null, false, true, 43, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-dry', '60m', '60 phút', 60, 300000, 480000, 380000, array[300000, 380000, 480000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-dry', '90m', '90 phút', 90, 420000, 650000, 520000, array[420000, 520000, 650000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-dry', '120m', '120 phút', 120, 520000, 800000, 650000, array[520000, 650000, 800000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'massage-hot-stone', 'massage', 'Massage đá nóng', 'Massage body tinh dầu kết hợp đá bazan làm ấm, giãn cơ sâu.', array['Massage body tinh dầu', 'Đá nóng dọc lưng & chân', 'Khăn nóng']::text[], false, false, null, null, false, true, 44, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-hot-stone', '60m', '60 phút', 60, 350000, 550000, 450000, array[350000, 450000, 550000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-hot-stone', '90m', '90 phút', 90, 450000, 720000, 580000, array[450000, 580000, 720000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'massage-postnatal', 'massage', 'Massage sau sinh', 'Chăm sóc mẹ sau sinh tại nhà: chườm muối thảo dược, giảm đau lưng.', array['Chườm muối thảo dược vùng bụng', 'Massage lưng, vai, chân', 'Ngâm chân thảo mộc']::text[], false, false, null, null, false, true, 45, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-postnatal', '60m', '60 phút', 60, 300000, 500000, 400000, array[300000, 400000, 500000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'massage-postnatal', '90m', '90 phút', 90, 400000, 650000, 500000, array[400000, 500000, 650000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-phone', 'photophone', 'Chụp ảnh bằng điện thoại', 'Chụp dạo, đi cafe, hẹn hò, sinh nhật bằng điện thoại đời mới. Có hướng dẫn tạo dáng.', array['Hướng dẫn tạo dáng', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu theo gói']::text[], false, true, 'Toàn bộ ảnh gốc + ảnh chỉnh màu', 2, false, true, 46, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-phone', '30m', '30 phút · 5 ảnh chỉnh', 30, 120000, 200000, 150000, array[120000, 150000, 200000], false, 1, 0, 'fixed', 1, 'Toàn bộ ảnh gốc + 5 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-phone', '60m', '60 phút · 10–15 ảnh chỉnh', 60, 200000, 450000, 300000, array[200000, 300000, 450000], false, 1, 1, 'fixed', 1, 'Toàn bộ ảnh gốc + 10 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-phone', '90m', '90 phút · 15–20 ảnh chỉnh', 90, 280000, 600000, 400000, array[280000, 400000, 600000], false, 1, 2, 'fixed', 1, 'Toàn bộ ảnh gốc + 15 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-phone', '120m', '2 giờ · 20–25 ảnh chỉnh', 120, 350000, 750000, 500000, array[350000, 500000, 750000], false, 1, 3, 'fixed', 1, 'Toàn bộ ảnh gốc + 20 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-phone-group', 'photophone', 'Chụp đôi / nhóm bạn', 'Chụp cặp đôi, nhóm bạn, gia đình nhỏ bằng điện thoại.', array['Hướng dẫn tạo dáng theo nhóm', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu theo gói']::text[], false, true, 'Toàn bộ ảnh gốc + ảnh chỉnh màu', 2, false, true, 47, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-phone-group', 'pair-60', '2 người · 60 phút', 60, 300000, 550000, 400000, array[300000, 400000, 550000], false, 1, 0, 'fixed', 1, 'Toàn bộ ảnh gốc + 15 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-phone-group', 'group-90', '3–6 người · 90 phút', 90, 450000, 900000, 650000, array[450000, 650000, 900000], false, 1, 1, 'fixed', 1, 'Toàn bộ ảnh gốc + 25 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-tour', 'photophone', 'Photo tour du lịch', 'Đi cùng bạn một buổi ở điểm du lịch, chụp suốt hành trình.', array['Lên lịch trình điểm chụp', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu']::text[], false, true, 'Toàn bộ ảnh gốc + 50–100 ảnh chỉnh', 4, false, true, 48, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-tour', 'half', 'Nửa ngày', 240, 800000, 1800000, 1200000, array[800000, 1200000, 1800000], false, 1, 0, 'fixed', 1, 'Toàn bộ ảnh gốc + 50 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-tour', 'full', 'Cả ngày', 480, 1500000, 3200000, 2200000, array[1500000, 2200000, 3200000], false, 1, 1, 'fixed', 1, 'Toàn bộ ảnh gốc + 100 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-outfit', 'photophone', 'Chụp outfit / feedback quần áo', 'Chụp từng bộ đồ khách tự mặc hoặc của shop, ảnh dọc kiểu mạng xã hội.', array['Hướng dẫn tạo dáng theo từng bộ', 'Toàn bộ ảnh gốc', '2 ảnh chỉnh mỗi bộ']::text[], false, true, 'Ảnh gốc + 2 ảnh chỉnh mỗi bộ', 2, false, true, 49, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-outfit', '5', '5 bộ · 60 phút', 60, 300000, 650000, 450000, array[300000, 450000, 650000], false, 1, 0, 'fixed', 1, 'Ảnh gốc + 10 ảnh chỉnh (2 ảnh/bộ)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-outfit', '10', '10 bộ · 2 giờ', 120, 500000, 1200000, 800000, array[500000, 800000, 1200000], false, 1, 1, 'fixed', 1, 'Ảnh gốc + 20 ảnh chỉnh (2 ảnh/bộ)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-party', 'photophone', 'Chụp sinh nhật / tiệc nhỏ', 'Ghi lại buổi tiệc tại nhà, quán cà phê hoặc nhà hàng.', array['Chụp khoảnh khắc và ảnh nhóm', 'Toàn bộ ảnh gốc', 'Ảnh chỉnh màu chọn lọc']::text[], false, true, 'Ảnh gốc + ảnh chỉnh chọn lọc', 2, false, true, 50, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-party', '60m', '60 phút', 60, 300000, 650000, 450000, array[300000, 450000, 650000], false, 1, 0, 'fixed', 1, 'Ảnh gốc + 30 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-party', '120m', '2 giờ', 120, 550000, 1200000, 800000, array[550000, 800000, 1200000], false, 1, 1, 'fixed', 1, 'Ảnh gốc + 60 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-portrait', 'camera', 'Chụp chân dung máy ảnh', 'Chân dung, áo dài, kỷ yếu, concept cá nhân bằng máy ảnh.', array['Tư vấn concept & trang phục', 'Chụp máy ảnh', 'Ảnh chỉnh da, màu']::text[], false, true, 'Ảnh gốc chọn lọc + ảnh chỉnh', 5, false, true, 51, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-portrait', '60m', '60 phút · 15 ảnh chỉnh', 60, 500000, 1000000, 700000, array[500000, 700000, 1000000], false, 1, 0, 'fixed', 1, 'Ảnh gốc chọn lọc + 15 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-portrait', '120m', '2 giờ · 30 ảnh chỉnh', 120, 900000, 1800000, 1200000, array[900000, 1200000, 1800000], false, 1, 1, 'fixed', 1, 'Ảnh gốc chọn lọc + 30 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-profile', 'camera', 'Ảnh hồ sơ / CV', 'Ảnh chân dung gọn gàng cho CV, LinkedIn, hồ sơ công ty.', array['Hướng dẫn tư thế', 'Chụp nền trơn hoặc văn phòng', 'Chỉnh da nhẹ']::text[], false, true, '5–10 ảnh chỉnh', 3, false, true, 52, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-profile', '30m', '30 phút · 5 ảnh chỉnh', 30, 250000, 500000, 350000, array[250000, 350000, 500000], false, 1, 0, 'fixed', 1, '5 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-profile', '60m', '60 phút · 10 ảnh chỉnh', 60, 400000, 800000, 550000, array[400000, 550000, 800000], false, 1, 1, 'fixed', 1, '10 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-event', 'camera', 'Chụp sự kiện nhỏ', 'Sinh nhật, tiệc công ty nhỏ, khai trương, lễ tốt nghiệp.', array['Chụp toàn bộ sự kiện', 'Ảnh gốc chọn lọc', 'Chỉnh màu']::text[], false, true, 'Ảnh sự kiện đã chỉnh màu', 5, false, true, 53, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-event', '120m', '2 giờ', 120, 800000, 1800000, 1200000, array[800000, 1200000, 1800000], false, 1, 0, 'fixed', 1, '60 ảnh sự kiện đã chỉnh màu', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-event', '240m', '4 giờ', 240, 1400000, 3000000, 2000000, array[1400000, 2000000, 3000000], false, 1, 1, 'fixed', 1, '120 ảnh sự kiện đã chỉnh màu', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-family', 'camera', 'Chụp ảnh gia đình', 'Chụp gia đình ngoại cảnh hoặc tại nhà bằng máy ảnh.', array['Tư vấn trang phục & địa điểm', 'Ảnh gốc chọn lọc', 'Ảnh chỉnh da & màu']::text[], false, true, 'Ảnh gốc chọn lọc + ảnh chỉnh', 5, false, true, 54, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-family', '60m', '60 phút', 60, 700000, 1500000, 1000000, array[700000, 1000000, 1500000], false, 1, 0, 'fixed', 1, 'Ảnh gốc chọn lọc + 15 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-family', '120m', '2 giờ', 120, 1200000, 2500000, 1700000, array[1200000, 1700000, 2500000], false, 1, 1, 'fixed', 1, 'Ảnh gốc chọn lọc + 30 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-couple', 'camera', 'Chụp cặp đôi / kỷ niệm', 'Chụp cặp đôi, kỷ niệm ngày yêu (không phải trọn gói ảnh cưới).', array['Tư vấn concept', 'Chụp bằng máy ảnh', '25 ảnh chỉnh']::text[], false, true, 'Ảnh gốc chọn lọc + 25 ảnh chỉnh', 5, false, true, 55, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-couple', '120m', '2 giờ · 25 ảnh chỉnh', 120, 1000000, 2300000, 1500000, array[1000000, 1500000, 2300000], false, 1, 0, 'fixed', 1, 'Ảnh gốc chọn lọc + 25 ảnh chỉnh', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'photo-yearbook-group', 'camera', 'Kỷ yếu nhóm bạn / lớp nhỏ', 'Chụp kỷ yếu cho nhóm 5–15 người tại trường hoặc ngoại cảnh.', array['Lên concept nhóm', 'Ảnh nhóm và ảnh từng người', 'Ảnh chỉnh']::text[], false, true, 'Ảnh nhóm + ảnh từng người đã chỉnh', 7, false, true, 56, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'photo-yearbook-group', 'half', 'Buổi 3 giờ (giá mỗi người)', 180, 150000, 400000, 250000, array[150000, 250000, 400000], true, 15, 0, 'fixed', 5, '20 ảnh nhóm + 3 ảnh chỉnh mỗi người', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'video-short', 'short-video', 'Quay & dựng clip ngắn', 'Clip 15–60 giây cho TikTok, Reels: quay, dựng, nhạc, phụ đề.', array['Gợi ý kịch bản ngắn', 'Quay bằng điện thoại/máy ảnh', 'Dựng, chèn nhạc, phụ đề']::text[], false, true, 'Clip dọc 9:16 đã dựng', 3, false, true, 57, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'video-short', '1', '1 clip', 90, 400000, 1200000, 700000, array[400000, 700000, 1200000], false, 1, 0, 'fixed', 1, '1 clip dọc 9:16, 15–60 giây/clip, có nhạc và phụ đề; không gồm file dự án', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'video-short', '3', '3 clip', 180, 1000000, 3000000, 1800000, array[1000000, 1800000, 3000000], false, 1, 1, 'fixed', 1, '3 clip dọc 9:16, 15–60 giây/clip, có nhạc và phụ đề; không gồm file dự án', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'video-short', '5', '5 clip', 240, 1500000, 4500000, 2700000, array[1500000, 2700000, 4500000], false, 1, 2, 'fixed', 1, '5 clip dọc 9:16, 15–60 giây/clip, có nhạc và phụ đề; không gồm file dự án', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'video-event', 'short-video', 'Quay hậu trường / sự kiện', 'Quay lại buổi tiệc, buổi chụp, sự kiện nhỏ và dựng thành clip.', array['Quay toàn buổi', 'Dựng 1 clip tổng hợp', 'Nhạc & chuyển cảnh']::text[], false, true, '1 clip tổng hợp 1–3 phút', 5, false, true, 58, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'video-event', '120m', '2 giờ', 120, 800000, 2000000, 1200000, array[800000, 1200000, 2000000], false, 1, 0, 'fixed', 1, '1 clip tổng hợp 1–3 phút', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'video-event', '240m', '4 giờ', 240, 1400000, 3500000, 2200000, array[1400000, 2200000, 3500000], false, 1, 1, 'fixed', 1, '1 clip tổng hợp 1–3 phút', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'video-talking', 'short-video', 'Quay clip nói trước ống kính', 'Quay một buổi nhiều clip chia sẻ cho kênh cá nhân.', array['Gợi ý kịch bản & chủ đề', 'Quay một buổi nhiều clip', 'Dựng, phụ đề']::text[], false, true, 'Clip dọc 9:16 đã dựng, có phụ đề', 5, false, true, 59, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'video-talking', '5', '5 clip · 3 giờ', 180, 1200000, 3200000, 2000000, array[1200000, 2000000, 3200000], false, 1, 0, 'fixed', 1, '5 clip dọc 9:16, 15–60 giây/clip, có nhạc và phụ đề; không gồm file dự án', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'video-talking', '10', '10 clip · 5 giờ', 300, 2000000, 5500000, 3500000, array[2000000, 3500000, 5500000], false, 1, 1, 'fixed', 1, '10 clip dọc 9:16, 15–60 giây/clip, có nhạc và phụ đề; không gồm file dự án', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'product-basic', 'product-photo', 'Chụp sản phẩm nền trơn', 'Ảnh sản phẩm nền trắng/nền màu cho sàn thương mại điện tử.', array['Setup nền & ánh sáng', '3 góc mỗi sản phẩm', 'Tách nền, chỉnh màu']::text[], false, true, '3 ảnh mỗi sản phẩm', 3, false, true, 60, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-basic', '10', '10 sản phẩm', 60, 400000, 1200000, 700000, array[400000, 700000, 1200000], false, 1, 0, 'fixed', 1, '30 ảnh chỉnh (3 ảnh/sản phẩm)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-basic', '30', '30 sản phẩm', 150, 1000000, 3000000, 1800000, array[1000000, 1800000, 3000000], false, 1, 1, 'fixed', 1, '90 ảnh chỉnh (3 ảnh/sản phẩm)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-basic', '50', '50 sản phẩm', 240, 1500000, 4000000, 2500000, array[1500000, 2500000, 4000000], false, 1, 2, 'fixed', 1, '150 ảnh chỉnh (3 ảnh/sản phẩm)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'product-lifestyle', 'product-photo', 'Chụp sản phẩm bối cảnh', 'Sản phẩm đặt trong bối cảnh sử dụng thật, hợp quảng cáo và fanpage.', array['Lên concept bối cảnh', 'Đạo cụ cơ bản', 'Chỉnh màu']::text[], false, true, '2 ảnh bối cảnh mỗi sản phẩm', 4, false, true, 61, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-lifestyle', '10', '10 sản phẩm', 120, 900000, 2500000, 1500000, array[900000, 1500000, 2500000], false, 1, 0, 'fixed', 1, '20 ảnh chỉnh (2 ảnh/sản phẩm)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-lifestyle', '30', '30 sản phẩm', 240, 2000000, 5500000, 3500000, array[2000000, 3500000, 5500000], false, 1, 1, 'fixed', 1, '60 ảnh chỉnh (2 ảnh/sản phẩm)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'product-video', 'product-photo', 'Quay clip sản phẩm', 'Clip ngắn giới thiệu sản phẩm cho TikTok Shop, Shopee Video.', array['Kịch bản ngắn theo sản phẩm', 'Quay & dựng dọc 9:16', 'Nhạc, phụ đề']::text[], false, true, 'Clip dọc đã dựng', 4, false, true, 62, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-video', '3', '3 clip', 120, 900000, 2400000, 1500000, array[900000, 1500000, 2400000], false, 1, 0, 'fixed', 1, '3 clip dọc 9:16, 15–60 giây/clip, có nhạc và phụ đề; không gồm file dự án', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-video', '5', '5 clip', 180, 1400000, 3500000, 2200000, array[1400000, 2200000, 3500000], false, 1, 1, 'fixed', 1, '5 clip dọc 9:16, 15–60 giây/clip, có nhạc và phụ đề; không gồm file dự án', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'product-flatlay', 'product-photo', 'Chụp quần áo trải sàn / ma-nơ-canh', 'Chụp flatlay hoặc ma-nơ-canh cho shop thời trang online.', array['Là phẳng & sắp đặt', '2 góc mỗi bộ', 'Tách nền, chỉnh màu']::text[], false, true, '2 ảnh mỗi bộ', 3, false, true, 63, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-flatlay', '10', '10 bộ', 90, 400000, 1000000, 650000, array[400000, 650000, 1000000], false, 1, 0, 'fixed', 1, '20 ảnh chỉnh (2 ảnh/bộ)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-flatlay', '30', '30 bộ', 240, 1000000, 2600000, 1700000, array[1000000, 1700000, 2600000], false, 1, 1, 'fixed', 1, '60 ảnh chỉnh (2 ảnh/bộ)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'product-food', 'product-photo', 'Chụp món ăn cho menu / app giao đồ ăn', 'Chụp món tại quán cho menu, GrabFood, ShopeeFood.', array['Bày món cơ bản', 'Chụp tại quán', 'Chỉnh màu']::text[], false, true, '1 ảnh mỗi món', 3, false, true, 64, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-food', '10', '10 món', 120, 600000, 1600000, 1000000, array[600000, 1000000, 1600000], false, 1, 0, 'fixed', 1, '10 ảnh chỉnh (1 ảnh/món)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'product-food', '20', '20 món', 180, 1000000, 2800000, 1700000, array[1000000, 1700000, 2800000], false, 1, 1, 'fixed', 1, '20 ảnh chỉnh (1 ảnh/món)', 1, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'model-lookbook', 'model-photo', 'Mẫu chụp lookbook', 'Mặc và tạo dáng cho bộ sưu tập thời trang, ảnh shop online.', array['Tạo dáng theo concept', 'Thay trang phục của shop', 'Không bao gồm makeup & người chụp']::text[], false, true, null, null, true, true, 65, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-lookbook', '60m', '1 giờ', 60, 400000, 1000000, 600000, array[400000, 600000, 1000000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-lookbook', '120m', '2 giờ', 120, 700000, 1800000, 1100000, array[700000, 1100000, 1800000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-lookbook', '240m', '4 giờ', 240, 1300000, 3200000, 2000000, array[1300000, 2000000, 3200000], false, 1, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'model-hand', 'model-photo', 'Mẫu tay / cầm sản phẩm', 'Mẫu tay cho nail, trang sức, mỹ phẩm, sản phẩm cầm tay.', array['Tay được chăm sóc sẵn', 'Tạo dáng tay theo góc máy']::text[], false, true, null, null, true, true, 66, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-hand', '60m', '1 giờ', 60, 250000, 600000, 400000, array[250000, 400000, 600000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-hand', '120m', '2 giờ', 120, 450000, 1000000, 700000, array[450000, 700000, 1000000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'model-beauty', 'model-photo', 'Mẫu làm đẹp cho thương hiệu', 'Làm mẫu makeup, tóc, chăm sóc da cho thương hiệu hoặc lớp dạy nghề.', array['Làm mẫu theo yêu cầu', 'Tạo dáng khi chụp kết quả']::text[], false, true, null, null, true, true, 67, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-beauty', '60m', '1 giờ', 60, 150000, 500000, 300000, array[150000, 300000, 500000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-beauty', '120m', '2 giờ', 120, 250000, 800000, 500000, array[250000, 500000, 800000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'model-outfit', 'model-photo', 'Mẫu mặc thử chụp ảnh (theo số bộ)', 'Mẫu mặc từng bộ của shop cho ảnh sàn thương mại điện tử.', array['Thay đồ, tạo dáng từng bộ', 'Tự chuẩn bị tóc, makeup đơn giản', 'Không gồm người chụp']::text[], false, true, null, null, true, true, 68, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-outfit', '10', '10 bộ', 120, 600000, 1500000, 1000000, array[600000, 1000000, 1500000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-outfit', '20', '20 bộ', 210, 1000000, 2600000, 1700000, array[1000000, 1700000, 2600000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'model-clip', 'model-video', 'Diễn viên clip ngắn', 'Diễn clip TikTok, Reels, video giới thiệu sản phẩm theo kịch bản.', array['Diễn theo kịch bản', 'Nói/ lồng tiếng nếu cần']::text[], false, true, null, null, true, true, 69, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-clip', '60m', '1 giờ', 60, 300000, 800000, 500000, array[300000, 500000, 800000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-clip', '120m', '2 giờ', 120, 500000, 1400000, 900000, array[500000, 900000, 1400000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'model-live', 'model-video', 'Mẫu livestream / mặc thử', 'Mặc thử, giới thiệu sản phẩm trong phiên livestream bán hàng.', array['Mặc thử & giới thiệu', 'Tương tác người xem theo kịch bản']::text[], false, true, null, null, true, true, 70, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-live', '120m', '2 giờ', 120, 600000, 1600000, 1000000, array[600000, 1000000, 1600000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-live', '240m', '4 giờ', 240, 1100000, 3000000, 1800000, array[1100000, 1800000, 3000000], false, 1, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_templates (id, category, name, description, includes, studio_only, on_location, deliverable, delivery_days, requires_verification, active, sort_order, catalog_version) values (
  'model-tryon', 'model-video', 'Mẫu mặc thử quay clip (theo số bộ)', 'Mẫu mặc thử, xoay dáng và giới thiệu ngắn từng bộ trong clip.', array['Mặc thử, xoay dáng từng bộ', 'Nói ngắn giới thiệu sản phẩm', 'Không gồm người quay']::text[], false, true, null, null, true, true, 71, 2)
  on conflict (id) do update set category = excluded.category, name = excluded.name,
    description = excluded.description, includes = excluded.includes,
    studio_only = excluded.studio_only, on_location = excluded.on_location, deliverable = excluded.deliverable,
    delivery_days = excluded.delivery_days, requires_verification = excluded.requires_verification,
    active = excluded.active, sort_order = excluded.sort_order, catalog_version = excluded.catalog_version;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'model-tryon', '10', '10 bộ', 120, 700000, 1700000, 1100000, array[700000, 1100000, 1700000], false, 1, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;

-- Atomic listing save: an invalid tier cannot delete the partner's old options.
create function public.save_pro_service(p_template text,p_prices jsonb,p_active boolean default true) returns void
language plpgsql security invoker set search_path='' as $$
declare me uuid:=auth.uid(); item record;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode='insufficient_privilege'; end if;
  perform pg_advisory_xact_lock(hashtextextended(me::text,1));
  if jsonb_typeof(p_prices)<>'object' or p_prices='{}'::jsonb then raise exception 'Chọn ít nhất một gói và mức giá.'; end if;
  insert into public.pro_services(pro_id,template_id,active) values(me,p_template,p_active)
    on conflict(pro_id,template_id) do update set active=excluded.active;
  for item in select * from jsonb_each_text(p_prices) loop
    insert into public.pro_service_prices(pro_id,template_id,variant_id,price) values(me,p_template,item.key,item.value::int)
      on conflict(pro_id,template_id,variant_id) do update set price=excluded.price;
  end loop;
  delete from public.pro_service_prices where pro_id=me and template_id=p_template and not(p_prices?variant_id);
end $$;
revoke all on function public.save_pro_service(text,jsonb,boolean) from public,anon;
grant execute on function public.save_pro_service(text,jsonb,boolean) to authenticated;

-- Finish against the contracted delivery deadline, rather than a later catalogue edit.
do $$ declare definition text; begin
  select pg_get_functiondef('public.finish_booking(uuid,text)'::regprocedure) into definition;
  definition:=replace(definition,'select delivery_days into days from public.service_templates where id = b.template_id;',
    'days := (b.service_contract->>''deliveryDays'')::int;');
  definition:=replace(definition, 'days := (b.service_contract->>''deliveryDays'')::int;', E'if p_by=''auto'' and exists(select 1 from public.booking_sessions s where s.booking_id=b.id and s.confirmed and s.starts_at+make_interval(mins=>s.duration_min)>now()) then return; end if;\n  days := (b.service_contract->>''deliveryDays'')::int;');
  execute definition;
end $$;
