\set ON_ERROR_STOP on
begin;
do $$declare pro uuid;customer uuid;address uuid;bid uuid;q jsonb;pid uuid;jid uuid;photo uuid;result jsonb;amount int;at timestamptz;address2 uuid;combo uuid;
 items jsonb:='[{"template":"nail-gel","variant":"hand","quantity":1,"recipient":"Mình"},{"template":"nail-design","variant":"stone","quantity":1,"recipient":"Mình"}]';
begin
 select id into pro from public.pros where slug='linh-pham';select id into customer from public.accounts where full_name='Ngọc Hân';select id into address from public.addresses where account_id=customer limit 1;
 assert pro is not null and customer is not null and address is not null,'seed fixtures exist';
 -- Isolate this disposable test calendar from demo appointments.
 delete from public.booking_sessions where pro_id=pro;delete from public.bookings where pro_id=pro;
 update public.pros set accepting_jobs=true,published=true,hours_confirmed=true,suspended_at=null where id=pro;
 at:=((current_date+14)+time '10:00') at time zone public.app_timezone();
 -- All weekdays available for deterministic fixture dates.
 delete from public.working_hours where pro_id=pro;
 insert into public.working_hours(pro_id,weekday,start_min,end_min) select pro,n,480,1200 from generate_series(0,6) n;
 perform set_config('request.jwt.claim.sub',customer::text,true);
 q:=public.cart_quote(pro,items,at,true,address,p_ready_by=>at+interval '2 hours');
 bid:=public.create_cart_booking((q->>'quoteId')::uuid,'QA','cash','{}','personal',false);
 assert (select jsonb_array_length(service_contract->'lines')=2 from public.bookings where id=bid),'cart contract inserted';
 amount:=(select service_price from public.bookings where id=bid);
 pid:=public.propose_booking_scope(bid,jsonb_build_array(items->0),at,'Bỏ phần đính đá chưa làm');
 assert (select service_price=amount from public.bookings where id=bid),'proposal does not mutate accepted amount';
 begin perform public.respond_booking_scope(pid,true);raise exception 'self approval accepted';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',pro::text,true);
 perform public.respond_booking_scope(pid,true);
 assert (select service_price=public.listed_price(pro,'nail-gel','hand') and duration_min=45 and jsonb_array_length(service_contract->'lines')=1 from public.bookings where id=bid),'approved removal changes price, duration and scope';
 assert (select count(*)=1 from public.booking_contract_versions where booking_id=bid),'original contract archived';
 perform public.respond_booking_scope(pid,true);
 assert (select count(*)=1 from public.booking_contract_versions where booking_id=bid),'approval retry idempotent';
 begin perform public.propose_booking_scope(bid,jsonb_build_array((items->0)||jsonb_build_object('quotedUnitPrice',200000,'quotedMinutes',150,'scope','Mẫu cần thêm công vượt deadline')),at,'Báo thêm công theo mẫu');raise exception 'deadline ignored';exception when raise_exception then if sqlerrm='deadline ignored' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',customer::text,true);
 items:=jsonb_build_array((items->0)||jsonb_build_object('unitPrice',public.listed_price(pro,'nail-gel','hand')),(items->1)||jsonb_build_object('unitPrice',public.listed_price(pro,'nail-design','stone')));
 jid:=public.post_cart_job(items,at+interval '1 day',address,'QA yêu cầu nhiều món',1000000,'{}');
 assert (select jsonb_array_length(service_contract->'lines')=2 from public.jobs where id=jid),'job stores full scope';
 assert public.job_problem(pro,(select j from public.jobs j where id=jid)) is null,'full cart eligible';
 perform set_config('request.jwt.claim.sub',pro::text,true);
 bid:=public.take_job(jid);
 assert (select service_price=(items->0->>'unitPrice')::int+(items->1->>'unitPrice')::int and duration_min=65 and jsonb_array_length(service_contract->'lines')=2 from public.bookings where id=bid),'take_job creates aggregate before financial triggers';
 assert (select booking_id=bid and status='booked' from public.jobs where id=jid),'job accepted atomically';
 -- Create a photo fixture through the real cart RPC, then prepare its completed
 -- state. Delivery RPCs below execute unchanged against the complete schema.
 perform set_config('request.jwt.claim.sub',customer::text,true);
 q:=public.cart_quote(pro,'[{"template":"photo-phone","variant":"60m","quantity":1}]',at+interval '2 days',true,address);
 photo:=public.create_cart_booking((q->>'quoteId')::uuid);
 update public.bookings set status='completed',completed_at=now() where id=photo;
 perform set_config('request.jwt.claim.sub',pro::text,true);
 perform public.deliver_booking(photo,'https://example.com/qa-v1','10 ảnh đã chỉnh');
 perform set_config('request.jwt.claim.sub',customer::text,true);
 perform public.request_delivery_revision(photo,'Chỉnh sáng đồng đều cho toàn bộ ảnh',false);
 begin perform public.accept_delivery(photo);raise exception 'open feedback accepted';exception when raise_exception then if sqlerrm='open feedback accepted' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',pro::text,true);
 perform public.deliver_booking(photo,'https://example.com/qa-v2','Đã chỉnh sáng');
 perform set_config('request.jwt.claim.sub',customer::text,true);
 assert (select count(*)=2 from public.booking_delivery_versions where booking_id=photo),'delivery version history';
 begin perform public.request_delivery_revision(photo,'Đổi màu theo một concept mới',false);raise exception 'extra revision accepted';exception when raise_exception then if sqlerrm='extra revision accepted' then raise;end if;end;
 perform public.request_delivery_revision(photo,'Thiếu một file trong10 ảnh đã chốt',true);
 perform set_config('request.jwt.claim.sub',pro::text,true);perform public.deliver_booking(photo,'https://example.com/qa-v3','Bổ sung file thiếu');
 perform set_config('request.jwt.claim.sub',customer::text,true);perform public.accept_delivery(photo);
 result:=public.delivery_workspace(photo);assert result->>'acceptedAt' is not null,'delivery accepted after correction';
 -- A combined delivery keeps independent rounds for each output.
 perform set_config('request.jwt.claim.sub',customer::text,true);
 q:=public.cart_quote(pro,'[{"template":"photo-phone","variant":"60m","quantity":1,"recipient":"Ảnh A"},{"template":"photo-phone","variant":"60m","quantity":1,"recipient":"Ảnh B"}]',at+interval '3 days',true,address);
 combo:=public.create_cart_booking((q->>'quoteId')::uuid);
 update public.bookings set status='completed',completed_at=now() where id=combo;
 perform set_config('request.jwt.claim.sub',pro::text,true);perform public.deliver_booking(combo,'https://example.com/combo-v1','Hai đầu ra');
 perform set_config('request.jwt.claim.sub',customer::text,true);perform public.request_delivery_line_revision(combo,'Chỉnh ánh sáng bộ ảnh A',false,0);
 perform set_config('request.jwt.claim.sub',pro::text,true);perform public.deliver_booking(combo,'https://example.com/combo-v2','Sửa bộ A');
 perform set_config('request.jwt.claim.sub',customer::text,true);perform public.request_delivery_line_revision(combo,'Chỉnh ánh sáng bộ ảnh B',false,1);
 result:=public.delivery_workspace(combo);assert jsonb_array_length(result->'deliverables')=2 and (result->'deliverables'->1->>'used')::int=1,'independent delivery rounds';
 -- New menus are opt-in, including equipment and venue requirements.
 perform set_config('request.jwt.claim.sub',pro::text,true);
 perform public.save_pro_service_with_setup('nail-pilot','{"gel":150000}',true,'{}','{"equipmentConfirmed":true,"needs":{"electricity":true},"note":"Chuẩn bị bàn và ổ điện"}');
 perform public.save_pro_service_with_setup('nail-prep-pilot','{"repair":15000}',true,'{}','{"equipmentConfirmed":true,"needs":{}}');
 perform public.save_pro_service_with_setup('nail-art-pilot','{"cat-eye":10000}',true,'{}','{"equipmentConfirmed":true,"needs":{}}');
 perform set_config('request.jwt.claim.sub',customer::text,true);
 begin perform public.cart_quote(pro,'[{"template":"nail-pilot","variant":"gel","quantity":1}]',at+interval '4 days',true,address);raise exception 'missing electricity accepted';exception when raise_exception then if sqlerrm='missing electricity accepted' then raise;end if;end;
 q:=public.cart_quote(pro,'[{"template":"nail-pilot","variant":"gel","quantity":1,"site":{"electricity":true}},{"template":"nail-art-pilot","variant":"cat-eye","quantity":8,"site":{"electricity":true}}]',at+interval '4 days',true,address);
 assert (q->>'servicePrice')::int=190000 and (q->'lines'->1->>'quantity')::int=8,'cat-eye cap preserves eight fingers';
 q:=public.cart_quote(pro,'[{"template":"nail-pilot","variant":"gel","quantity":1,"site":{"electricity":true}},{"template":"nail-prep-pilot","variant":"repair","quantity":2}]',at+interval '4 days',true,address);
 assert q->'lines'->1->>'unit'='ngón' and (q->>'servicePrice')::int=180000,'repair counted by fingers on the contract';
 -- Trial and ceremony may use different addresses; fees and snapshots survive.
 update public.pros set categories=array_append(categories,'hair'::public.category_id) where id=pro;
 perform set_config('request.jwt.claim.sub',pro::text,true);
 perform public.save_pro_service_with_setup('hair-bridal',jsonb_build_object('one',(select suggested_price from public.service_variants where template_id='hair-bridal' and id='one')),true,'{}','{"equipmentConfirmed":true,"needs":{}}');
 perform set_config('request.jwt.claim.sub',customer::text,true);
 insert into public.addresses(account_id,label,detail,city,district,lat,lng) select account_id,'Lễ cưới QA','Địa điểm thứ hai',city,district,lat+0.001,lng from public.addresses where id=address returning id into address2;
 q:=public.cart_quote_with_visits(pro,'[{"template":"hair-bridal","variant":"one","quantity":1}]',at+interval '5 days',true,address,jsonb_build_array(jsonb_build_object('startsAt',at+interval '6 days','addressId',address2)),null);
 bid:=public.create_cart_booking((q->>'quoteId')::uuid,'','cash',array[at+interval '6 days']);
 assert (select address_id=address2 and duration_min=120 from public.booking_sessions where booking_id=bid and sequence=2),'ceremony address and duration';
 assert (select jsonb_array_length(service_contract->'visits')=2 and duration_min=60 and travel_fee=(q->>'travelFee')::int from public.bookings where id=bid),'trial quote aggregate and fee snapshot';
 assert (select sum((x->>'serviceShare')::int)=(q->>'servicePrice')::int from jsonb_array_elements(q->'visits') x),'visit shares reconcile';
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin perform public.delivery_workspace(photo);raise exception 'foreign history exposed';exception when insufficient_privilege then null;end;
 raise notice 'COMMERCE LIFECYCLE PASS';
end$$;
rollback;
