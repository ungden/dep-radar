-- Complete requests using the same scoped cart validation as direct bookings.
do $$declare definition text;needle text:='unit:=public.listed_price(p_pro,t.id,v.id);';begin
 select pg_get_functiondef('partner_private.cart_lines(uuid,jsonb)'::regprocedure) into definition;
 if position(needle in definition)=0 then raise exception 'cart_lines changed';end if;
 definition:=replace(definition,needle,E'if p_pro is null then\n   unit:=(item->>''unitPrice'')::int;\n   if unit is null or not unit=any(v.price_tiers) then raise exception ''Chọn mức giá niêm yết hợp lệ cho từng món.'';end if;\n  else\n   unit:=public.listed_price(p_pro,t.id,v.id);\n  end if;');
 execute definition;
end$$;
create function partner_private.aggregate_contract(p_contract jsonb,p_lines jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select p_contract||jsonb_build_object('version',3,'lines',p_lines,
 'serviceName',case when jsonb_array_length(p_lines)>1 then 'Buổi dịch vụ · '||jsonb_array_length(p_lines)||' hạng mục' else p_contract->>'serviceName' end,
 'servicePrice',(select sum((x->>'total')::int) from jsonb_array_elements(p_lines) x),
 'durationMin',(select sum((x->>'durationMin')::int) from jsonb_array_elements(p_lines) x),
 'deliverable',(select string_agg((x->>'name')||': '||(x->>'deliverable'),'; ') from jsonb_array_elements(p_lines) x where x->>'deliverable' is not null),
 'deliveryDays',(select max((x->>'deliveryDays')::int) from jsonb_array_elements(p_lines) x),
 'revisions',coalesce((select max((x->>'revisions')::int) from jsonb_array_elements(p_lines) x),0))
$$;
revoke all on function partner_private.aggregate_contract(jsonb,jsonb) from public,anon,authenticated;

create function partner_private.job_cart_snapshot(p_job public.jobs) returns public.jobs
language plpgsql stable security definer set search_path='' as $$
declare items jsonb;lines jsonb;
begin
 if nullif(current_setting('app.job_cart',true),'') is null then return p_job;end if;
 if auth.uid() is null or p_job.customer_id<>auth.uid() then raise exception 'Không có quyền.';end if;
 items:=current_setting('app.job_cart',true)::jsonb;
 lines:=partner_private.cart_lines(null,items);
 p_job.service_contract:=partner_private.aggregate_contract(p_job.service_contract,lines);
 if p_job.max_total<(p_job.service_contract->>'servicePrice')::int then raise exception 'Tổng tối đa thấp hơn giỏ dịch vụ.';end if;
 return p_job;
end$$;
revoke all on function partner_private.job_cart_snapshot(public.jobs) from public,anon,authenticated;
do $$declare definition text;needle text:=E'  return new;\nend';begin
 select pg_get_functiondef('partner_private.capture_service_contract()'::regprocedure) into definition;
 if position(needle in definition)=0 then raise exception 'capture_service_contract changed';end if;
 definition:=replace(definition,needle,E'  if tg_table_name=''jobs'' then new:=partner_private.job_cart_snapshot(new);end if;\n  return new;\nend');
 execute definition;
 -- Preserve the existing single-service eligibility checks.
 select pg_get_functiondef('public.job_problem(uuid,public.jobs)'::regprocedure) into definition;
 execute replace(definition,'public.job_problem(', 'partner_private.legacy_job_problem(');
end$$;
revoke all on function partner_private.legacy_job_problem(uuid,public.jobs) from public,anon,authenticated;

create function partner_private.full_job_problem(p_pro uuid,j public.jobs) returns text
language plpgsql stable security definer set search_path='' as $$
declare shadow public.jobs;problem text;lines jsonb;item jsonb;saved jsonb;addr public.addresses;pro public.pros;q public.quote;km numeric;
begin
 if j.service_contract->'lines' is null then return partner_private.legacy_job_problem(p_pro,j);end if;
 shadow:=j;shadow.service_contract:=shadow.service_contract||jsonb_build_object('version',(select catalog_version from public.service_templates where id=j.template_id));
 problem:=partner_private.legacy_job_problem(p_pro,shadow);if problem is not null then return problem;end if;
 begin lines:=partner_private.cart_lines(p_pro,j.service_contract->'lines');exception when others then return 'Bạn chưa niêm yết đủ các món và kỹ thuật của yêu cầu.';end;
 for item in select value from jsonb_array_elements(lines) with ordinality x(value,n) loop
  -- Every requested line must match the listed price and saved scope.
  if not exists(select 1 from jsonb_array_elements(j.service_contract->'lines') x where x->>'template'=item->>'template' and x->>'variant'=item->>'variant' and x->>'recipient'=item->>'recipient' and coalesce(x->>'region','')=coalesce(item->>'region','') and x->>'unitPrice'=item->>'unitPrice' and x->>'durationMin'=item->>'durationMin' and x->>'version'=item->>'version') then return 'Giá hoặc phạm vi từng món chưa khớp yêu cầu.';end if;
 end loop;
 select * into addr from public.addresses where id=j.address_id;
 select * into pro from public.pros where id=p_pro;
 problem:=partner_private.cart_available(p_pro,lines,j.starts_at,j.at_home,addr.lat,addr.lng);if problem is not null then return problem;end if;
 km:=public.travel_distance_km(pro.lat,pro.lng,addr.lat,addr.lng,(select road_factor from public.fee_policy where id));
 q:=public.build_quote((j.service_contract->>'servicePrice')::int,1,j.at_home,km,public.is_urgent(j.starts_at));
 if q.total>j.max_total then return 'Tổng giỏ và di chuyển vượt mức khách đồng ý.';end if;
 return null;
end$$;
create or replace function public.job_problem(p_pro uuid,j public.jobs) returns text
language sql stable security invoker set search_path='' as $$select partner_private.full_job_problem(p_pro,j)$$;
revoke all on function partner_private.full_job_problem(uuid,public.jobs) from public,anon;
grant execute on function partner_private.full_job_problem(uuid,public.jobs) to authenticated,service_role;

create function partner_private.post_cart_job(p_items jsonb,p_starts_at timestamptz,p_address uuid,p_description text,p_max_total int,p_references text[]) returns uuid
language plpgsql security definer set search_path='' as $$
declare lines jsonb;main jsonb;bid uuid;
begin
 lines:=partner_private.cart_lines(null,p_items);main:=lines->0;
 if exists(select 1 from jsonb_array_elements(lines) x where (x->>'sessions')::int>1) then raise exception 'Gói nhiều buổi cần đặt trực tiếp và giữ đủ lịch.';end if;
 perform set_config('app.job_cart',p_items::text,true);
 bid:=public.post_job_checked(main->>'template',main->>'variant',p_starts_at,true,p_address,(main->>'quantity')::int,p_description,'cash',(main->>'unitPrice')::int,p_max_total);
 perform set_config('app.job_cart','',true);
 perform public.set_job_references(bid,coalesce(p_references,'{}'));
 return bid;
end$$;
create function public.post_cart_job(p_items jsonb,p_starts_at timestamptz,p_address uuid,p_description text,p_max_total int,p_references text[] default '{}') returns uuid language sql security invoker set search_path='' as $$select partner_private.post_cart_job(p_items,p_starts_at,p_address,p_description,p_max_total,p_references)$$;
revoke all on function partner_private.post_cart_job(jsonb,timestamptz,uuid,text,int,text[]),public.post_cart_job(jsonb,timestamptz,uuid,text,int,text[]) from public,anon;
grant execute on function partner_private.post_cart_job(jsonb,timestamptz,uuid,text,int,text[]),public.post_cart_job(jsonb,timestamptz,uuid,text,int,text[]) to authenticated;

create function partner_private.job_booking_snapshot(p_booking public.bookings) returns public.bookings
language plpgsql stable security definer set search_path='' as $$
declare j public.jobs;q public.quote;lines jsonb;
begin
 if p_booking.source<>'job' or nullif(current_setting('app.taking_cart_job',true),'') is null then return p_booking;end if;
 select * into j from public.jobs where id=current_setting('app.taking_cart_job',true)::uuid and customer_id=p_booking.customer_id and status='open';
 if j.id is null or auth.uid()<>p_booking.pro_id then raise exception 'Không có quyền nhận giỏ yêu cầu.';end if;
 if j.service_contract->'lines' is null then return p_booking;end if;
 lines:=j.service_contract->'lines';
 p_booking.service_contract:=partner_private.aggregate_contract(p_booking.service_contract,lines);
 q:=public.build_quote((p_booking.service_contract->>'servicePrice')::int,1,p_booking.at_home,p_booking.distance_km,public.is_urgent(p_booking.starts_at));
 p_booking.duration_min:=(p_booking.service_contract->>'durationMin')::int;p_booking.service_price:=q.service_price;p_booking.commission:=q.commission;p_booking.commission_rate:=q.commission_rate;
 p_booking.reference_photos:=j.reference_photos;
 return p_booking;
end$$;
revoke all on function partner_private.job_booking_snapshot(public.bookings) from public,anon,authenticated;
do $$declare definition text;begin
 select pg_get_functiondef('partner_private.capture_service_contract()'::regprocedure) into definition;
 definition:=replace(definition,'new:=partner_private.cart_booking_snapshot(new);','new:=partner_private.cart_booking_snapshot(new); new:=partner_private.job_booking_snapshot(new);');execute definition;
 select pg_get_functiondef('public.take_job(uuid)'::regprocedure) into definition;
 definition:=replace(definition,E'begin\n',E'begin\n  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));\n  perform set_config(''app.taking_cart_job'',p_job::text,true);\n');
 definition:=replace(definition,'  return new_id;',E'  perform set_config(''app.taking_cart_job'','''',true);\n  return new_id;');execute definition;
 select pg_get_functiondef('partner_private.my_job_eligibility(uuid[])'::regprocedure) into definition;
 definition:=replace(definition,'public.build_quote(j.price,j.quantity,','public.build_quote(coalesce((j.service_contract->>''servicePrice'')::int,j.price*j.quantity),1,');execute definition;
end$$;
-- Versioned delivery and bundled feedback, shared by web and native.
create table public.booking_delivery_versions(
 id uuid primary key default gen_random_uuid(),booking_id uuid not null references public.bookings(id) on delete cascade,
 sequence int not null, url text not null,note text not null default '',created_at timestamptz not null default now(),unique(booking_id,sequence));
create table public.booking_revision_requests(
 id uuid primary key default gen_random_uuid(),booking_id uuid not null references public.bookings(id) on delete cascade,
 version_id uuid not null references public.booking_delivery_versions(id),feedback text not null check(length(feedback) between 5 and 2000),
 correction boolean not null default false,created_at timestamptz not null default now(),resolved_by uuid references public.booking_delivery_versions(id));
create unique index one_open_delivery_feedback on public.booking_revision_requests(booking_id) where resolved_by is null;
alter table public.booking_delivery_versions enable row level security;
alter table public.booking_revision_requests enable row level security;
revoke all on public.booking_delivery_versions,public.booking_revision_requests from public,anon,authenticated;
grant select on public.booking_delivery_versions,public.booking_revision_requests to authenticated;
grant all on public.booking_delivery_versions,public.booking_revision_requests to service_role;
create policy delivery_parties on public.booking_delivery_versions for select to authenticated using(exists(select 1 from public.bookings b where b.id=booking_id and auth.uid() in(b.customer_id,b.pro_id)));
create policy feedback_parties on public.booking_revision_requests for select to authenticated using(exists(select 1 from public.bookings b where b.id=booking_id and auth.uid() in(b.customer_id,b.pro_id)));
insert into public.booking_delivery_versions(booking_id,sequence,url,note,created_at) select id,1,delivery_url,coalesce(delivery_note,''),delivered_at from public.bookings where delivered_at is not null and delivery_url is not null;
create function partner_private.capture_delivery_version() returns trigger language plpgsql security definer set search_path='' as $$
declare vid uuid;
begin
 if new.delivered_at is not null and (new.delivered_at,new.delivery_url,new.delivery_note) is distinct from (old.delivered_at,old.delivery_url,old.delivery_note) then
  insert into public.booking_delivery_versions(booking_id,sequence,url,note) values(new.id,coalesce((select max(sequence) from public.booking_delivery_versions where booking_id=new.id),0)+1,new.delivery_url,coalesce(new.delivery_note,'')) returning id into vid;
  update public.booking_revision_requests set resolved_by=vid where booking_id=new.id and resolved_by is null;
 end if;
 return new;
end$$;
revoke all on function partner_private.capture_delivery_version() from public,anon,authenticated;
create trigger delivery_version after update of delivered_at,delivery_url,delivery_note on public.bookings for each row execute function partner_private.capture_delivery_version();
create function partner_private.request_delivery_revision(p_booking uuid,p_feedback text,p_correction boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare b public.bookings;vid uuid;result uuid;
begin
 select * into b from public.bookings where id=p_booking for update;
 if b.id is null or auth.uid() is distinct from b.customer_id then raise exception 'Không có quyền.' using errcode='insufficient_privilege';end if;
 if b.status<>'completed' or b.delivered_at is null or b.delivery_accepted_at is not null then raise exception 'Chỉ phản hồi file đã giao và chưa xác nhận nhận đủ.';end if;
 if length(trim(p_feedback)) not between 5 and 2000 then raise exception 'Nhập phản hồi từ5 đến2000 ký tự.';end if;
 if exists(select 1 from public.booking_revision_requests where booking_id=b.id and resolved_by is null) then raise exception 'Đã có phản hồi đang chờ người làm xử lý.';end if;
 if not coalesce(p_correction,false) and (select count(*) from public.booking_revision_requests where booking_id=b.id and not correction)>=coalesce((b.service_contract->>'revisions')::int,0) then raise exception 'Đã dùng hết lượt sửa trong gói. Đổi brief cần báo giá riêng.';end if;
 select id into vid from public.booking_delivery_versions where booking_id=b.id order by sequence desc limit 1;
 insert into public.booking_revision_requests(booking_id,version_id,feedback,correction) values(b.id,vid,trim(p_feedback),coalesce(p_correction,false)) returning id into result;
 perform public.notify(b.pro_id,'delivery_feedback','Khách có phản hồi sản phẩm','Xem phản hồi tổng hợp và giao bản cập nhật.','/bookings/'||b.id);
 return result;
end$$;
create function public.request_delivery_revision(p_booking uuid,p_feedback text,p_correction boolean default false) returns uuid language sql security invoker set search_path='' as $$select partner_private.request_delivery_revision(p_booking,p_feedback,p_correction)$$;
create function partner_private.delivery_workspace(p_booking uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b public.bookings;
begin
 select * into b from public.bookings where id=p_booking;
 if b.id is null or auth.uid() is null or auth.uid() not in(b.customer_id,b.pro_id) then raise exception 'Không có quyền.' using errcode='insufficient_privilege';end if;
 return jsonb_build_object('isPro',auth.uid()=b.pro_id,'acceptedAt',b.delivery_accepted_at,'dueAt',b.delivery_due_at,'revisions',coalesce((b.service_contract->>'revisions')::int,0),'rights',coalesce(b.service_contract->'rights','{}'),
 'versions',coalesce((select jsonb_agg(to_jsonb(v) order by sequence) from public.booking_delivery_versions v where booking_id=b.id),'[]'),
 'feedback',coalesce((select jsonb_agg(to_jsonb(r) order by created_at) from public.booking_revision_requests r where booking_id=b.id),'[]'));
end$$;
create function public.delivery_workspace(p_booking uuid) returns jsonb language sql stable security invoker set search_path='' as $$select partner_private.delivery_workspace(p_booking)$$;
revoke all on function partner_private.request_delivery_revision(uuid,text,boolean),public.request_delivery_revision(uuid,text,boolean),partner_private.delivery_workspace(uuid),public.delivery_workspace(uuid) from public,anon;
grant execute on function partner_private.request_delivery_revision(uuid,text,boolean),public.request_delivery_revision(uuid,text,boolean),partner_private.delivery_workspace(uuid),public.delivery_workspace(uuid) to authenticated;
do $$declare definition text;begin
 select pg_get_functiondef('public.deliver_booking(uuid,text,text)'::regprocedure) into definition;
 definition:=replace(definition,'select delivery_days into days from public.service_templates where id = b.template_id;', 'days:=coalesce((b.service_contract->>''deliveryDays'')::int,(select delivery_days from public.service_templates where id=b.template_id));');execute definition;
 select pg_get_functiondef('public.accept_delivery(uuid)'::regprocedure) into definition;
 definition:=replace(definition,'  if b.delivery_accepted_at is not null then return; end if;',E'  if b.delivery_accepted_at is not null then return; end if;\n  if exists(select 1 from public.booking_revision_requests where booking_id=b.id and resolved_by is null) then raise exception ''Đang chờ xử lý phản hồi sản phẩm.'';end if;');execute definition;
end$$;

-- Scope changes are proposals, never silent edits. Keep every accepted contract.
create table public.booking_scope_proposals(
 id uuid primary key default gen_random_uuid(),booking_id uuid not null references public.bookings(id) on delete cascade,proposed_by uuid not null references public.accounts(id),
 base_fingerprint text not null,items jsonb not null,contract jsonb not null,starts_at timestamptz not null,
 service_price int not null,duration_min int not null,discount int not null,reason text not null,
 status text not null default 'pending' check(status in('pending','accepted','rejected','superseded')),
 created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '15 minutes');
create table public.booking_contract_versions(
 id uuid primary key default gen_random_uuid(),booking_id uuid not null references public.bookings(id) on delete cascade,proposal_id uuid references public.booking_scope_proposals(id),
 contract jsonb not null,starts_at timestamptz not null,service_price int not null,discount int not null,commission int not null,created_at timestamptz not null default now());
alter table public.booking_scope_proposals enable row level security;alter table public.booking_contract_versions enable row level security;
revoke all on public.booking_scope_proposals,public.booking_contract_versions from public,anon,authenticated;
grant select on public.booking_scope_proposals,public.booking_contract_versions to authenticated;grant all on public.booking_scope_proposals,public.booking_contract_versions to service_role;
create policy scope_parties on public.booking_scope_proposals for select to authenticated using(exists(select 1 from public.bookings b where b.id=booking_id and auth.uid() in(b.customer_id,b.pro_id)));
create policy version_parties on public.booking_contract_versions for select to authenticated using(exists(select 1 from public.bookings b where b.id=booking_id and auth.uid() in(b.customer_id,b.pro_id)));
create function partner_private.scope_fingerprint(b public.bookings) returns text language sql immutable set search_path='' as $$select md5(jsonb_build_array(b.service_contract,b.starts_at,b.service_price,b.discount,b.voucher_id)::text)$$;
revoke all on function partner_private.scope_fingerprint(public.bookings) from public,anon,authenticated;
-- Overload availability with an explicit self booking to ignore during an amendment.
do $$declare definition text;begin
 select pg_get_functiondef('partner_private.cart_available(uuid,jsonb,timestamptz,boolean,double precision,double precision)'::regprocedure) into definition;
 definition:=replace(definition,'p_lng double precision)','p_lng double precision, p_ignore uuid)');
 definition:=replace(definition,'p_at,p_home,p_lat,p_lng);','p_at,p_home,p_lat,p_lng,p_ignore);');
 definition:=replace(definition,'b.pro_id=p_pro and b.status','b.pro_id=p_pro and b.id<>p_ignore and b.status');
 definition:=replace(definition,'s.pro_id=p_pro and s.confirmed','s.pro_id=p_pro and s.booking_id<>p_ignore and s.confirmed');execute definition;
end$$;
revoke all on function partner_private.cart_available(uuid,jsonb,timestamptz,boolean,double precision,double precision,uuid) from public,anon,authenticated;

create function partner_private.propose_booking_scope(p_booking uuid,p_items jsonb,p_starts_at timestamptz,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare b public.bookings;lines jsonb;contract jsonb;item jsonb;prior jsonb;i int:=0;amount int;minutes int;discount int:=0;v public.vouchers;problem text;pid uuid;
begin
 select * into b from public.bookings where id=p_booking for update;
 if b.id is null or auth.uid() is null or auth.uid() not in(b.customer_id,b.pro_id) then raise exception 'Không có quyền.' using errcode='insufficient_privilege';end if;
 if b.status not in('pending','confirmed','in_progress') or b.paid_at is not null then raise exception 'Chỉ thay đổi phần việc chưa thanh toán trong lịch đang nhận.';end if;
 if length(trim(p_reason)) not between 5 and 500 then raise exception 'Nêu lý do thay đổi từ5 đến500 ký tự.';end if;
 lines:=partner_private.cart_lines(b.pro_id,p_items);
 if b.status='in_progress' then
  if p_starts_at<>b.starts_at then raise exception 'Không đổi giờ bắt đầu của buổi đang làm.';end if;
  for prior in select * from jsonb_array_elements(b.service_contract->'lines') loop
   if not exists(select 1 from jsonb_array_elements(lines) x where x->>'template'=prior->>'template' and x->>'variant'=prior->>'variant' and x->>'recipient'=prior->>'recipient' and coalesce(x->>'region','')=coalesce(prior->>'region','') and (x->>'quantity')::int>=(prior->>'quantity')::int) then raise exception 'Buổi đang làm chỉ thêm công việc; không hủy hoặc giảm phần có thể đã thực hiện.';end if;
  end loop;
 end if;
 if coalesce((b.service_contract->>'sessions')::int,1)>1 and (p_items->0->>'template'<>b.template_id or p_items->0->>'variant'<>b.variant_id or (p_items->0->>'quantity')::int<>b.quantity) then raise exception 'Giữ gói nhiều buổi đã chốt; chỉ đổi phần thêm của buổi đầu.';end if;
 -- Only the provider may propose an explicitly described custom quote.
 for item in select * from jsonb_array_elements(p_items) loop
  select x into prior from jsonb_array_elements(b.service_contract->'lines') x where x->>'template'=item->>'template' and x->>'variant'=item->>'variant' and x->>'recipient'=coalesce(nullif(trim(item->>'recipient'),''),'Mình') and coalesce(x->>'region','')=coalesce(item->>'region','') limit 1;
  if prior is not null then
   if prior ? 'scope' and (prior->>'quantity')::int<>(item->>'quantity')::int and not item ? 'quotedUnitPrice' then raise exception 'Thay số lượng của món báo riêng cần đối tác báo lại công và giá.';end if;
   lines:=jsonb_set(lines,array[i::text],(lines->i)||jsonb_build_object('unitPrice',(prior->>'unitPrice')::int,'total',case when item->>'template'='nail-art-pilot' and item->>'variant'='cat-eye' then least(40000,(prior->>'unitPrice')::int*(item->>'quantity')::int) else (prior->>'unitPrice')::int*(item->>'quantity')::int end)||case when prior ? 'scope' then jsonb_build_object('scope',prior->>'scope','durationMin',(prior->>'durationMin')::int) else '{}'::jsonb end);
  end if;
  if item ? 'quotedUnitPrice' then
   if auth.uid()<>b.pro_id or length(trim(coalesce(item->>'scope','')))<5 then raise exception 'Chỉ đối tác báo giá riêng với phạm vi rõ ràng.';end if;
   amount:=(item->>'quotedUnitPrice')::int;minutes:=(item->>'quotedMinutes')::int;
   if amount is null or minutes is null or amount not between 1000 and 20000000 or amount%500<>0 or minutes not between 15 and 720 then raise exception 'Giá hoặc thời gian báo riêng không hợp lệ.';end if;
   lines:=jsonb_set(lines,array[i::text],(lines->i)||jsonb_build_object('unitPrice',amount,'total',amount*(item->>'quantity')::int,'durationMin',minutes,'scope',left(item->>'scope',1000)));
  end if;i:=i+1;
 end loop;
 if p_starts_at+make_interval(mins=>(select sum((x->>'durationMin')::int)::int from jsonb_array_elements(lines) x)+30)>(b.service_contract->>'readyBy')::timestamptz then raise exception 'Không đủ thời gian trước giờ cần hoàn thiện đã chốt.';end if;
 problem:=partner_private.cart_available(b.pro_id,lines,p_starts_at,b.at_home,b.lat,b.lng,b.id);if problem is not null then raise exception '%',problem;end if;
 contract:=partner_private.aggregate_contract((lines->0)||jsonb_build_object('rights',coalesce(b.service_contract->'rights','{}'),'visits',b.service_contract->'visits','readyBy',b.service_contract->'readyBy'),lines);
 if jsonb_typeof(contract->'visits')='array' then contract:=jsonb_set(contract,'{visits,0}',(contract->'visits'->0)||jsonb_build_object('durationMin',(contract->>'durationMin')::int,'startsAt',p_starts_at,'serviceShare',(contract->>'servicePrice')::int-coalesce((select sum((x->>'serviceShare')::int) from jsonb_array_elements(contract->'visits') x where (x->>'sequence')::int>1),0)));end if;
 if coalesce((contract->>'sessions')::int,1)>1 and coalesce((b.service_contract->>'sessions')::int,1)<=1 then raise exception 'Gói nhiều buổi cần đặt riêng và giữ đủ lịch.';end if;amount:=(contract->>'servicePrice')::int;minutes:=(contract->>'durationMin')::int;
 if b.voucher_id is not null then select * into v from public.vouchers where id=b.voucher_id for update;if v.used_at is null and amount+b.travel_fee+b.urgent_fee>=v.min_total then discount:=least(v.amount,amount+b.travel_fee+b.urgent_fee);end if;end if;
 update public.booking_scope_proposals set status='superseded' where booking_id=b.id and status='pending';
 insert into public.booking_scope_proposals(booking_id,proposed_by,base_fingerprint,items,contract,starts_at,service_price,duration_min,discount,reason)
 values(b.id,auth.uid(),partner_private.scope_fingerprint(b),p_items,contract,p_starts_at,amount,minutes,discount,trim(p_reason)) returning id into pid;
 perform public.notify(case when auth.uid()=b.pro_id then b.customer_id else b.pro_id end,'booking_scope_change','Có đề xuất thay đổi dịch vụ','Xem từng món, chênh giá và thời gian trước khi đồng ý.','/bookings/'||b.id);
 return pid;
end$$;
create function public.propose_booking_scope(p_booking uuid,p_items jsonb,p_starts_at timestamptz,p_reason text) returns uuid language sql security invoker set search_path='' as $$select partner_private.propose_booking_scope(p_booking,p_items,p_starts_at,p_reason)$$;

create function partner_private.respond_booking_scope(p_proposal uuid,p_accept boolean) returns void language plpgsql security definer set search_path='' as $$
declare p public.booking_scope_proposals;b public.bookings;problem text;
begin
 select booking_id into p.booking_id from public.booking_scope_proposals where id=p_proposal;
 select * into b from public.bookings where id=p.booking_id for update;
 select * into p from public.booking_scope_proposals where id=p_proposal for update;
 if b.id is null or auth.uid() is null or auth.uid() not in(b.customer_id,b.pro_id) or auth.uid()=p.proposed_by then raise exception 'Đề xuất cần bên còn lại duyệt.' using errcode='insufficient_privilege';end if;
 if p_accept is null then raise exception 'Chọn đồng ý hoặc từ chối.';end if;
 if p.status='accepted' and p_accept then return;end if;
 if p.status<>'pending' then raise exception 'Đề xuất không còn chờ duyệt.';end if;
 if not p_accept then update public.booking_scope_proposals set status='rejected' where id=p.id;return;end if;
 if p.expires_at<now() or p.base_fingerprint<>partner_private.scope_fingerprint(b) or b.status not in('pending','confirmed','in_progress') or b.paid_at is not null then raise exception 'Đơn đã thay đổi hoặc đề xuất hết hạn. Gửi đề xuất mới.';end if;
 perform pg_advisory_xact_lock(hashtextextended(b.pro_id::text,1));
 perform partner_private.cart_lines(b.pro_id,p.items);
 problem:=partner_private.cart_available(b.pro_id,p.contract->'lines',p.starts_at,b.at_home,b.lat,b.lng,b.id);if problem is not null then raise exception '%',problem;end if;
 insert into public.booking_contract_versions(booking_id,proposal_id,contract,starts_at,service_price,discount,commission) values(b.id,p.id,b.service_contract,b.starts_at,b.service_price,b.discount,b.commission);
 update public.booking_scope_proposals set status='accepted' where id=p.id;
 perform set_config('app.approved_scope',p.id::text,true);
 update public.bookings set template_id=p.items->0->>'template',variant_id=p.items->0->>'variant',quantity=(p.items->0->>'quantity')::int,service_contract=p.contract,starts_at=p.starts_at,duration_min=p.duration_min,service_price=p.service_price,
 commission=public.commission_for(p.service_price,b.commission_rate),mcn_commission=round(public.commission_for(p.service_price,b.commission_rate)*b.mcn_share_rate)::int,discount=p.discount,
 voucher_id=case when p.discount>0 then b.voucher_id else null end where id=b.id;
 if p.discount=0 and b.voucher_id is not null then update public.vouchers set booking_id=null where id=b.voucher_id;end if;
 perform set_config('app.approved_scope','',true);
 perform public.notify(p.proposed_by,'booking_scope_accepted','Thay đổi dịch vụ đã được đồng ý','Phạm vi, tổng tiền và thời gian mới đã lưu trong lịch hẹn.','/bookings/'||b.id);
end$$;
create function public.respond_booking_scope(p_proposal uuid,p_accept boolean) returns void language sql security invoker set search_path='' as $$select partner_private.respond_booking_scope(p_proposal,p_accept)$$;
revoke all on function partner_private.propose_booking_scope(uuid,jsonb,timestamptz,text),public.propose_booking_scope(uuid,jsonb,timestamptz,text),partner_private.respond_booking_scope(uuid,boolean),public.respond_booking_scope(uuid,boolean) from public,anon;
grant execute on function partner_private.propose_booking_scope(uuid,jsonb,timestamptz,text),public.propose_booking_scope(uuid,jsonb,timestamptz,text),partner_private.respond_booking_scope(uuid,boolean),public.respond_booking_scope(uuid,boolean) to authenticated;
create function partner_private.approved_scope_for(p_booking uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.booking_scope_proposals p where p.id=nullif(current_setting('app.approved_scope',true),'')::uuid and p.booking_id=p_booking and p.status='accepted' and p.proposed_by<>auth.uid())$$;
revoke all on function partner_private.approved_scope_for(uuid) from public,anon,authenticated;
do $$declare definition text;begin
 select pg_get_functiondef('partner_private.capture_service_contract()'::regprocedure) into definition;
 definition:=replace(definition,'new.service_contract:=old.service_contract;','if tg_table_name=''bookings'' and partner_private.approved_scope_for(new.id) then null;else new.service_contract:=old.service_contract;end if;');execute definition;
 select pg_get_functiondef('mcn_private.snapshot_booking()'::regprocedure) into definition;
 definition:=replace(definition,'  if tg_op = ''UPDATE'' then',E'  if tg_op = ''UPDATE'' then\n    if partner_private.approved_scope_for(new.id) and old.status in (''pending'',''confirmed'',''in_progress'') and (new.mcn_organization_id,new.mcn_membership_id,new.mcn_share_rate) is not distinct from (old.mcn_organization_id,old.mcn_membership_id,old.mcn_share_rate) then return new;end if;');execute definition;
 select pg_get_functiondef('partner_private.guard_cart_window()'::regprocedure) into definition;
 definition:=replace(definition,'new.cart_quote_id is not null','new.service_contract->''lines'' is not null');execute definition;
end$$;
create function partner_private.booking_scope_workspace(p_booking uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b public.bookings;items jsonb;
begin
 select * into b from public.bookings where id=p_booking;
 if b.id is null or auth.uid() is null or auth.uid() not in(b.customer_id,b.pro_id) then raise exception 'Không có quyền.' using errcode='insufficient_privilege';end if;
 items:=coalesce(b.service_contract->'lines',jsonb_build_array(b.service_contract||jsonb_build_object('template',b.template_id,'variant',b.variant_id,'quantity',b.quantity,'unitPrice',b.service_price/b.quantity,'recipient','Mình')));
 return jsonb_build_object('isPro',auth.uid()=b.pro_id,'canChange',b.status in('pending','confirmed','in_progress') and b.paid_at is null,'items',items,'startsAt',b.starts_at,'total',b.total-b.discount,
 'proposals',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('mine',p.proposed_by=auth.uid(),'total',p.service_price+b.travel_fee+b.urgent_fee-p.discount) order by p.created_at desc) from public.booking_scope_proposals p where p.booking_id=b.id),'[]'),
 'versions',coalesce((select jsonb_agg(to_jsonb(v) order by v.created_at) from public.booking_contract_versions v where v.booking_id=b.id),'[]'));
end$$;
create function public.booking_scope_workspace(p_booking uuid) returns jsonb language sql stable security invoker set search_path='' as $$select partner_private.booking_scope_workspace(p_booking)$$;
revoke all on function partner_private.booking_scope_workspace(uuid),public.booking_scope_workspace(uuid) from public,anon;
grant execute on function partner_private.booking_scope_workspace(uuid),public.booking_scope_workspace(uuid) to authenticated;
-- A running visit keeps its original start; waive only the new-booking lead-time
-- rule for that same appointment, retaining eligibility, hours and conflicts.
do $$declare definition text;begin
 select pg_get_functiondef('public.availability_problem(uuid,text,text,integer,timestamptz,boolean,double precision,double precision,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'public.availability_problem(', 'partner_private.scope_availability_problem(');
 definition:=replace(definition,'if lead_min < policy.min_lead_minutes then', 'if lead_min < policy.min_lead_minutes and not exists(select 1 from public.bookings b where b.id=p_ignore_booking and b.pro_id=p_pro and b.starts_at=p_starts_at and b.status in (''pending'',''confirmed'',''in_progress'')) then');execute definition;
 select pg_get_functiondef('partner_private.cart_available(uuid,jsonb,timestamptz,boolean,double precision,double precision,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'public.availability_problem(', 'partner_private.scope_availability_problem(');execute definition;
end$$;
revoke all on function partner_private.scope_availability_problem(uuid,text,text,integer,timestamptz,boolean,double precision,double precision,uuid) from public,anon,authenticated;
create function partner_private.normalized_rights(p_rights jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
begin
 if p_rights is null then return '{}'::jsonb;end if;
 if jsonb_typeof(p_rights)<>'object' or octet_length(p_rights::text)>5000 then raise exception 'Phạm vi sử dụng không hợp lệ.';end if;
 return jsonb_build_object('channels',left(coalesce(p_rights->>'channels',''),500),'term',left(coalesce(p_rights->>'term',''),300),'territory',left(coalesce(p_rights->>'territory',''),200),'buyer',left(coalesce(p_rights->>'buyer',''),200),'paidAds',coalesce((p_rights->>'paidAds')::boolean,false),'exclusive',coalesce((p_rights->>'exclusive')::boolean,false));
end$$;
revoke all on function partner_private.normalized_rights(jsonb) from public,anon,authenticated;
create function partner_private.create_cart_booking_with_rights(p_quote uuid,p_note text,p_payment public.payment_method,p_sessions timestamptz[],p_usage text,p_repost boolean,p_references text[],p_rights jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare rights jsonb;bid uuid;
begin
 rights:=partner_private.normalized_rights(p_rights)||jsonb_build_object('purpose',p_usage,'portfolioConsent',p_repost);
 if p_usage='commercial' and (length(trim(coalesce(rights->>'channels','')))=0 or length(trim(coalesce(rights->>'term','')))=0) then raise exception 'Nêu kênh và thời hạn sử dụng thương mại trước khi đặt.';end if;
 perform set_config('app.cart_rights',rights::text,true);
 bid:=partner_private.create_cart_booking(p_quote,p_note,p_payment,p_sessions,p_usage,p_repost,p_references);
 perform set_config('app.cart_rights','',true);return bid;
end$$;
create function public.create_cart_booking_with_rights(p_quote uuid,p_note text,p_payment public.payment_method,p_sessions timestamptz[],p_usage text,p_repost boolean,p_references text[],p_rights jsonb) returns uuid language sql security invoker set search_path='' as $$select partner_private.create_cart_booking_with_rights(p_quote,p_note,p_payment,p_sessions,p_usage,p_repost,p_references,p_rights)$$;
revoke all on function partner_private.create_cart_booking_with_rights(uuid,text,public.payment_method,timestamptz[],text,boolean,text[],jsonb),public.create_cart_booking_with_rights(uuid,text,public.payment_method,timestamptz[],text,boolean,text[],jsonb) from public,anon;
grant execute on function partner_private.create_cart_booking_with_rights(uuid,text,public.payment_method,timestamptz[],text,boolean,text[],jsonb),public.create_cart_booking_with_rights(uuid,text,public.payment_method,timestamptz[],text,boolean,text[],jsonb) to authenticated;
do $$declare definition text;begin
 select pg_get_functiondef('partner_private.cart_booking_snapshot(public.bookings)'::regprocedure) into definition;
 definition:=replace(definition,' return jsonb_populate_record(p_booking,',E' contract:=contract||jsonb_build_object(''rights'',coalesce(nullif(current_setting(''app.cart_rights'',true),'''')::jsonb,''{}''::jsonb));\n return jsonb_populate_record(p_booking,');execute definition;
end$$;
create function partner_private.post_cart_job_with_rights(p_items jsonb,p_starts_at timestamptz,p_address uuid,p_description text,p_max_total int,p_references text[],p_usage text,p_repost boolean,p_rights jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare rights jsonb;bid uuid;
begin
 if p_usage not in('personal','commercial') or p_usage is null then raise exception 'Mục đích sử dụng không hợp lệ.';end if;
 rights:=partner_private.normalized_rights(p_rights)||jsonb_build_object('purpose',p_usage,'portfolioConsent',p_repost);
 if p_usage='commercial' and (length(trim(coalesce(rights->>'channels','')))=0 or length(trim(coalesce(rights->>'term','')))=0) then raise exception 'Nêu kênh và thời hạn sử dụng thương mại.';end if;
 perform set_config('app.job_rights',rights::text,true);
 bid:=partner_private.post_cart_job(p_items,p_starts_at,p_address,p_description,p_max_total,p_references);
 perform set_config('app.job_rights','',true);return bid;
end$$;
create function public.post_cart_job_with_rights(p_items jsonb,p_starts_at timestamptz,p_address uuid,p_description text,p_max_total int,p_references text[],p_usage text,p_repost boolean,p_rights jsonb) returns uuid language sql security invoker set search_path='' as $$select partner_private.post_cart_job_with_rights(p_items,p_starts_at,p_address,p_description,p_max_total,p_references,p_usage,p_repost,p_rights)$$;
revoke all on function partner_private.post_cart_job_with_rights(jsonb,timestamptz,uuid,text,int,text[],text,boolean,jsonb),public.post_cart_job_with_rights(jsonb,timestamptz,uuid,text,int,text[],text,boolean,jsonb) from public,anon;
grant execute on function partner_private.post_cart_job_with_rights(jsonb,timestamptz,uuid,text,int,text[],text,boolean,jsonb),public.post_cart_job_with_rights(jsonb,timestamptz,uuid,text,int,text[],text,boolean,jsonb) to authenticated;
do $$declare definition text;begin
 select pg_get_functiondef('partner_private.job_cart_snapshot(public.jobs)'::regprocedure) into definition;
 definition:=replace(definition,' p_job.service_contract:=partner_private.aggregate_contract(p_job.service_contract,lines);',' p_job.service_contract:=partner_private.aggregate_contract(p_job.service_contract,lines)||jsonb_build_object(''rights'',coalesce(nullif(current_setting(''app.job_rights'',true),'''')::jsonb,''{}''::jsonb));');execute definition;
 select pg_get_functiondef('partner_private.job_booking_snapshot(public.bookings)'::regprocedure) into definition;
 definition:=replace(definition,' p_booking.service_contract:=partner_private.aggregate_contract(p_booking.service_contract,lines);', E' p_booking.service_contract:=partner_private.aggregate_contract(p_booking.service_contract,lines)||jsonb_build_object(''rights'',coalesce(j.service_contract->''rights'',''{}''::jsonb));\n p_booking.usage_scope:=coalesce(j.service_contract->''rights''->>''purpose'',''personal'');\n p_booking.consent_repost:=coalesce((j.service_contract->''rights''->>''portfolioConsent'')::boolean,false);');execute definition;
end$$;
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
  'nail-prep-pilot', 'biab', 'Gia cố BIAB 10 móng', 45, 180000, 180000, 180000, array[180000], false, 1, 3, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-prep-pilot', 'builder', 'Nối gel 10 móng', 75, 250000, 250000, 250000, array[250000], false, 1, 4, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-prep-pilot', 'repair', 'Úp/sửa lẻ', 15, 15000, 15000, 15000, array[15000], true, 10, 5, 'fixed', 1, null, 0, 1, null)
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
  'nail-art-pilot', 'cat-eye', 'Mắt mèo điểm trên nền gel', 15, 10000, 10000, 10000, array[10000], true, 10, 0, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'french', 'French đơn giản', 20, 10000, 10000, 10000, array[10000], true, 10, 1, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'mirror', 'Tráng gương đơn giản', 20, 10000, 10000, 10000, array[10000], true, 10, 2, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'ombre', 'Ombre đơn giản', 20, 10000, 10000, 10000, array[10000], true, 10, 3, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'simple', 'Vẽ đơn giản', 15, 10000, 10000, 10000, array[10000], true, 10, 4, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'detail', 'Vẽ chi tiết', 30, 25000, 25000, 25000, array[25000], true, 10, 5, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', '3d', 'Vẽ nổi 3D', 45, 40000, 40000, 40000, array[40000], true, 10, 6, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'stone', 'Đá nhỏ', 15, 5000, 5000, 5000, array[5000], true, 20, 7, 'fixed', 1, null, 0, 1, null)
  on conflict (template_id, id) do update set label = excluded.label, duration_min = excluded.duration_min,
    min_price = excluded.min_price, max_price = excluded.max_price, suggested_price = excluded.suggested_price,
    price_tiers = excluded.price_tiers,
    per_person = excluded.per_person, max_quantity = excluded.max_quantity, sort_order = excluded.sort_order,
    duration_rule = excluded.duration_rule, min_quantity = excluded.min_quantity, deliverable = excluded.deliverable,
    revisions = excluded.revisions, sessions = excluded.sessions, followup_days = excluded.followup_days;
insert into public.service_variants (template_id, id, label, duration_min, min_price, max_price, suggested_price, price_tiers, per_person, max_quantity, sort_order, duration_rule, min_quantity, deliverable, revisions, sessions, followup_days) values (
  'nail-art-pilot', 'charm', 'Charm chuẩn', 20, 20000, 20000, 20000, array[20000], true, 20, 8, 'fixed', 1, null, 0, 1, null)
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
do $$declare definition text;begin
 select pg_get_functiondef('partner_private.cart_lines(uuid,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'  recipient:=coalesce',E'  if t.category::text in (''model-photo'',''model-video'') then raise exception ''Dịch vụ mẫu chưa mở nhận lịch.'';end if;\n  recipient:=coalesce');
 definition:=replace(definition,'   if t.category=''massage''',E'   if (t.id=''nail-pilot'' and v.id=''cat-eye'' and prev->>''template''=''nail-art-pilot'' and prev->>''variant''=''cat-eye'') or (prev->>''template''=''nail-pilot'' and prev->>''variant''=''cat-eye'' and t.id=''nail-art-pilot'' and v.id=''cat-eye'') then conflict:=true;end if;\n   if (t.id in (''nail-extension'',''nail-refill'') and prev->>''template''=''nail-prep-pilot'' and prev->>''variant'' not like ''remove%'') or (prev->>''template'' in (''nail-extension'',''nail-refill'') and t.id=''nail-prep-pilot'' and v.id not like ''remove%'') then conflict:=true;end if;\n   if t.category=''massage''');
 definition:=replace(definition,'''total'',unit*qty,''durationMin''', '''total'',case when t.id=''nail-art-pilot'' and v.id=''cat-eye'' then least(40000,unit*qty) else unit*qty end,''discount'',case when t.id=''nail-art-pilot'' and v.id=''cat-eye'' then greatest(0,unit*qty-40000) else 0 end,''durationMin''');execute definition;
end$$;
alter table public.pro_services add column service_setup jsonb;
create function partner_private.save_pro_service_with_setup(p_template text,p_prices jsonb,p_active boolean,p_notes jsonb,p_setup jsonb) returns void language plpgsql security definer set search_path='' as $$
declare normalized jsonb;needs jsonb;
begin
 if coalesce((p_setup->>'equipmentConfirmed')::boolean,false) is not true then raise exception 'Xác nhận có đủ dụng cụ cho dịch vụ trước khi niêm yết.';end if;
 needs:=jsonb_build_object('electricity',coalesce((p_setup->'needs'->>'electricity')::boolean,false),'water',coalesce((p_setup->'needs'->>'water')::boolean,false),'table',coalesce((p_setup->'needs'->>'table')::boolean,false),'bed',coalesce((p_setup->'needs'->>'bed')::boolean,false));
 normalized:=jsonb_build_object('equipmentConfirmed',true,'confirmedAt',now(),'needs',needs,'note',left(coalesce(p_setup->>'note',''),500));
 perform public.save_pro_service(p_template,p_prices,p_active,p_notes);
 update public.pro_services set service_setup=normalized where pro_id=auth.uid() and template_id=p_template;
end$$;
create function public.save_pro_service_with_setup(p_template text,p_prices jsonb,p_active boolean,p_notes jsonb,p_setup jsonb) returns void language sql security invoker set search_path='' as $$select partner_private.save_pro_service_with_setup(p_template,p_prices,p_active,p_notes,p_setup)$$;
revoke all on function partner_private.save_pro_service_with_setup(text,jsonb,boolean,jsonb,jsonb),public.save_pro_service_with_setup(text,jsonb,boolean,jsonb,jsonb) from public,anon;
grant execute on function partner_private.save_pro_service_with_setup(text,jsonb,boolean,jsonb,jsonb),public.save_pro_service_with_setup(text,jsonb,boolean,jsonb,jsonb) to authenticated;
do $$declare definition text;needle text:='  minutes:=public.service_duration_min(t.id,v.id,qty);';begin
 select pg_get_functiondef('partner_private.cart_lines(uuid,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'recipient text; conflict boolean;','recipient text; conflict boolean; setup jsonb; requirement text;');
 definition:=replace(definition,needle,E'  setup:=null;\n  if p_pro is not null then select service_setup into setup from public.pro_services where pro_id=p_pro and template_id=t.id;end if;\n  if p_pro is not null and (t.id=''nail-pilot'' or t.id like ''nail-%-pilot'') and coalesce((setup->>''equipmentConfirmed'')::boolean,false) is not true then raise exception ''Đối tác cần xác nhận dụng cụ cho menu mới trước khi nhận lịch.'';end if;\n  if setup is not null then\n   for requirement in select key from jsonb_each(setup->''needs'') where value=''true''::jsonb loop\n    if coalesce((item->''site''->>requirement)::boolean,false) is not true then raise exception ''Nơi làm chưa đáp ứng điều kiện đã niêm yết: %.'',case requirement when ''electricity'' then ''điện'' when ''water'' then ''nước'' when ''table'' then ''bàn/ghế'' else ''giường/chỗ nằm'' end;end if;\n   end loop;\n  end if;\n'||needle);
 definition:=replace(definition,'''category'',t.category', '''category'',t.category,''serviceSetup'',setup');execute definition;
 select pg_get_functiondef('partner_private.partner_setup()'::regprocedure) into definition;
 definition:=replace(definition,'''template_id'',s.template_id,''active'',s.active,', '''template_id'',s.template_id,''active'',s.active,''service_setup'',s.service_setup,');execute definition;
end$$;
alter table public.booking_sessions add column address_id uuid references public.addresses(id) on delete set null,add column address_snapshot jsonb,add column travel_fee int not null default 0,add column urgent_fee int not null default 0;
create function partner_private.cart_quote_with_visits(p_pro uuid,p_items jsonb,p_starts_at timestamptz,p_at_home boolean,p_address_id uuid,p_visits jsonb,p_ready_by timestamptz) returns jsonb language plpgsql security definer set search_path='' as $$
declare q jsonb;original jsonb;times timestamptz[];visit jsonb;visits jsonb:='[]';a public.addresses;pro public.pros;problem text;at timestamptz;aid uuid;minutes int;travel int;urgent int;alltravel int:=0;allurgent int:=0;seq int:=1;n int;share int;main_share int;allocated int:=0;
begin
 if p_visits is null or jsonb_typeof(p_visits)<>'array' or jsonb_array_length(p_visits)>2 then raise exception 'Lịch các buổi không hợp lệ.';end if;
 select array_agg((x->>'startsAt')::timestamptz order by ordinality) into times from jsonb_array_elements(p_visits) with ordinality v(x,ordinality);
 q:=partner_private.cart_quote(p_pro,p_items,p_starts_at,p_at_home,p_address_id,coalesce(times,'{}'),p_ready_by);
 original:=q;n:=1+jsonb_array_length(p_visits);main_share:=round((q->'lines'->0->>'total')::numeric/n)::int;
 select * into pro from public.pros where id=p_pro;
 for visit in select * from jsonb_array_elements(jsonb_build_array(jsonb_build_object('startsAt',p_starts_at,'addressId',p_address_id))||p_visits) loop
  at:=(visit->>'startsAt')::timestamptz;aid:=coalesce((visit->>'addressId')::uuid,p_address_id);
  if p_at_home then select * into a from public.addresses where id=aid and account_id=auth.uid();if a.id is null then raise exception 'Chọn địa chỉ đã lưu cho từng buổi.';end if;else a.lat:=pro.lat;a.lng:=pro.lng;end if;
  minutes:=case when seq=1 then (q->>'durationMin')::int when q->'lines'->0->>'template'='hair-bridal' then 120 else (q->'lines'->0->>'durationMin')::int end;
  problem:=partner_private.cart_available(p_pro,case when seq=1 then q->'lines' else jsonb_build_array((q->'lines'->0)||jsonb_build_object('durationMin',minutes)) end,at,p_at_home,a.lat,a.lng);if problem is not null then raise exception '%',problem;end if;
  travel:=case when p_at_home then public.travel_fee(public.travel_distance_km(pro.lat,pro.lng,a.lat,a.lng,(select road_factor from public.fee_policy where id))) else 0 end;
  urgent:=case when public.is_urgent(at) then (select urgent_fee from public.fee_policy where id) else 0 end;
  share:=case when seq=n then (q->>'servicePrice')::int-allocated when seq=1 then main_share+(q->>'servicePrice')::int-(q->'lines'->0->>'total')::int else main_share end;
  allocated:=allocated+share;alltravel:=alltravel+travel;allurgent:=allurgent+urgent;
  visits:=visits||jsonb_build_array(jsonb_build_object('sequence',seq,'startsAt',at,'addressId',aid,'addressSnapshot',to_jsonb(a),'addressFingerprint',md5(to_jsonb(a)::text),'durationMin',minutes,'travelFee',travel,'urgentFee',urgent,'serviceShare',share));seq:=seq+1;
 end loop;
 q:=q||jsonb_build_object('visits',visits,'travelFee',alltravel,'urgentFee',allurgent,'total',(q->>'servicePrice')::int+alltravel+allurgent,'payout',(q->>'servicePrice')::int+alltravel+allurgent-(q->>'commission')::int);
 update partner_private.cart_quotes set quote=q where id=(q->>'quoteId')::uuid and customer_id=auth.uid();
 return q;
end$$;
create function public.cart_quote_with_visits(p_pro uuid,p_items jsonb,p_starts_at timestamptz,p_at_home boolean,p_address_id uuid,p_visits jsonb,p_ready_by timestamptz default null) returns jsonb language sql security invoker set search_path='' as $$select partner_private.cart_quote_with_visits(p_pro,p_items,p_starts_at,p_at_home,p_address_id,p_visits,p_ready_by)$$;
revoke all on function partner_private.cart_quote_with_visits(uuid,jsonb,timestamptz,boolean,uuid,jsonb,timestamptz),public.cart_quote_with_visits(uuid,jsonb,timestamptz,boolean,uuid,jsonb,timestamptz) from public,anon;
grant execute on function partner_private.cart_quote_with_visits(uuid,jsonb,timestamptz,boolean,uuid,jsonb,timestamptz),public.cart_quote_with_visits(uuid,jsonb,timestamptz,boolean,uuid,jsonb,timestamptz) to authenticated;
do $$declare definition text;begin
 select pg_get_functiondef('partner_private.create_cart_booking(uuid,text,public.payment_method,timestamptz[],text,boolean,text[])'::regprocedure) into definition;
 definition:=replace(definition,'total_minutes int;','total_minutes int; visit jsonb; seq int; visit_address public.addresses; visit_problem text;');
 definition:=replace(definition,' fresh:=partner_private.booking_quote(',E' for visit in select * from jsonb_array_elements(saved.quote->''visits'') where (value->>''sequence'')::int>1 loop\n  select * into visit_address from public.addresses where id=(visit->>''addressId'')::uuid and account_id=auth.uid();\n  if saved.at_home and (visit_address.id is null or md5(to_jsonb(visit_address)::text) is distinct from visit->>''addressFingerprint'') then raise exception ''Địa chỉ buổi sau đã thay đổi. Xác nhận lại báo giá.'';end if;\n  visit_problem:=partner_private.cart_available(saved.pro_id,jsonb_build_array((lines->0)||jsonb_build_object(''durationMin'',(visit->>''durationMin'')::int)),(visit->>''startsAt'')::timestamptz,saved.at_home,visit_address.lat,visit_address.lng);\n  if visit_problem is not null then raise exception ''%'',visit_problem;end if;\n end loop;\n fresh:=partner_private.booking_quote(');
 definition:=replace(definition,' update partner_private.cart_quotes set booking_id=bid',E' for visit in select * from jsonb_array_elements(saved.quote->''visits'') where (value->>''sequence'')::int>1 loop\n  update public.booking_sessions set address_id=(visit->>''addressId'')::uuid,address_snapshot=visit->''addressSnapshot'',travel_fee=(visit->>''travelFee'')::int,urgent_fee=(visit->>''urgentFee'')::int where booking_id=bid and sequence=(visit->>''sequence'')::int;\n end loop;\n update partner_private.cart_quotes set booking_id=bid');execute definition;
 select pg_get_functiondef('partner_private.cart_booking_snapshot(public.bookings)'::regprocedure) into definition;
 definition:=replace(definition,' contract:=contract||jsonb_build_object(''rights'',', ' contract:=contract||jsonb_build_object(''visits'',saved.quote->''visits'',''rights'',');execute definition;
end$$;

-- Each deliverable retains its own revision allowance in a combined order.
-- Legacy clients keep the bundled endpoint; one bundled round consumes one
-- round on every deliverable, so the strictest remaining allowance applies.
alter table public.booking_revision_requests add column line_index int;
create function partner_private.request_delivery_line_revision(p_booking uuid,p_feedback text,p_correction boolean,p_line int) returns uuid language plpgsql security definer set search_path='' as $$
declare b public.bookings;vid uuid;result uuid;line jsonb;idx int;quota int;used int;
begin
 select * into b from public.bookings where id=p_booking for update;
 if b.id is null or auth.uid() is distinct from b.customer_id then raise exception 'Không có quyền.' using errcode='insufficient_privilege';end if;
 if b.status<>'completed' or b.delivered_at is null or b.delivery_accepted_at is not null then raise exception 'Chỉ phản hồi file đã giao và chưa xác nhận nhận đủ.';end if;
 if p_feedback is null or length(trim(p_feedback)) not between 5 and 2000 then raise exception 'Nhập phản hồi từ 5 đến 2000 ký tự.';end if;
 if exists(select 1 from public.booking_revision_requests where booking_id=b.id and resolved_by is null) then raise exception 'Đã có phản hồi đang chờ người làm xử lý.';end if;
 if p_line is not null and not exists(select 1 from jsonb_array_elements(coalesce(b.service_contract->'lines',jsonb_build_array(b.service_contract))) with ordinality x(value,n) where n-1=p_line and value->>'deliverable' is not null) then raise exception 'Chọn đầu ra có trong hợp đồng.';end if;
 if not coalesce(p_correction,false) then
  for line,idx in select value,(n-1)::int from jsonb_array_elements(coalesce(b.service_contract->'lines',jsonb_build_array(b.service_contract))) with ordinality x(value,n) where value->>'deliverable' is not null and (p_line is null or n-1=p_line) loop
   quota:=coalesce((line->>'revisions')::int,0);
   select count(*) into used from public.booking_revision_requests where booking_id=b.id and not correction and (line_index is null or line_index=idx);
   if used>=quota then raise exception 'Đã dùng hết lượt sửa cho %. Đổi brief cần báo giá riêng.',coalesce(line->>'name',line->>'serviceName');end if;
  end loop;
 end if;
 select id into vid from public.booking_delivery_versions where booking_id=b.id order by sequence desc limit 1;
 insert into public.booking_revision_requests(booking_id,version_id,feedback,correction,line_index) values(b.id,vid,trim(p_feedback),coalesce(p_correction,false),p_line) returning id into result;
 perform public.notify(b.pro_id,'delivery_feedback','Khách có phản hồi sản phẩm','Xem phản hồi tổng hợp và giao bản cập nhật.','/bookings/'||b.id);
 return result;
end$$;
create function public.request_delivery_line_revision(p_booking uuid,p_feedback text,p_correction boolean,p_line int) returns uuid language sql security invoker set search_path='' as $$select partner_private.request_delivery_line_revision(p_booking,p_feedback,p_correction,p_line)$$;
create or replace function partner_private.request_delivery_revision(p_booking uuid,p_feedback text,p_correction boolean) returns uuid language sql security definer set search_path='' as $$select partner_private.request_delivery_line_revision(p_booking,p_feedback,p_correction,null)$$;
revoke all on function partner_private.request_delivery_line_revision(uuid,text,boolean,int),public.request_delivery_line_revision(uuid,text,boolean,int) from public,anon;
grant execute on function partner_private.request_delivery_line_revision(uuid,text,boolean,int),public.request_delivery_line_revision(uuid,text,boolean,int) to authenticated;
do $$declare definition text;begin
 select pg_get_functiondef('partner_private.delivery_workspace(uuid)'::regprocedure) into definition;
 definition:=replace(definition,'''versions'',coalesce(','''deliverables'',coalesce((select jsonb_agg(jsonb_build_object(''index'',n-1,''name'',coalesce(value->>''name'',value->>''serviceName''),''output'',value->>''deliverable'',''revisions'',coalesce((value->>''revisions'')::int,0),''used'',(select count(*) from public.booking_revision_requests r where r.booking_id=b.id and not correction and (line_index is null or line_index=n-1))) order by n) from jsonb_array_elements(coalesce(b.service_contract->''lines'',jsonb_build_array(b.service_contract))) with ordinality x(value,n) where value->>''deliverable'' is not null),''[]''),''versions'',coalesce(');
 execute definition;
end$$;

-- Older clients may read and operate the booking, but cannot split a V3 cart
-- into legacy child orders or overwrite rights agreed in its contract.
do $$declare definition text;begin
 select pg_get_functiondef('public.attach_addons(uuid,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'  parent := public.booking_for_caller(p_parent, ''customer'');',E'  parent := public.booking_for_caller(p_parent, ''customer'');\n  if parent.service_contract->''lines'' is not null then raise exception ''Cập nhật ứng dụng và dùng đề xuất thay đổi cho giỏ dịch vụ này.'';end if;');execute definition;
 select pg_get_functiondef('public.set_booking_terms(uuid,text,boolean)'::regprocedure) into definition;
 definition:=replace(definition,'  b := public.booking_for_caller(p_booking, ''customer'');',E'  b := public.booking_for_caller(p_booking, ''customer'');\n  if b.service_contract->''lines'' is not null and (b.usage_scope,b.consent_repost) is distinct from (p_usage_scope,coalesce(p_consent_repost,false)) then raise exception ''Quyền sử dụng đã chốt trong hợp đồng; đặt lại báo giá để đổi thỏa thuận.'';end if;');execute definition;
end$$;

do $$declare definition text;begin
 select pg_get_functiondef('partner_private.create_cart_booking(uuid,text,public.payment_method,timestamptz[],text,boolean,text[])'::regprocedure) into definition;
 definition:=replace(definition,$old$ lines:=saved.quote->'lines'; main:=lines->0;$old$,$patch$ lines:=saved.quote->'lines'; main:=lines->0;
 if p_usage='commercial' and (length(trim(coalesce(nullif(current_setting('app.cart_rights',true),'')::jsonb->>'channels','')))=0 or length(trim(coalesce(nullif(current_setting('app.cart_rights',true),'')::jsonb->>'term','')))=0) then raise exception 'Nêu kênh và thời hạn sử dụng thương mại trước khi đặt.';end if;$patch$);execute definition;
end$$;
