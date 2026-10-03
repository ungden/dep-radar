-- Run in a transaction against local demo fixtures, then rollback.
do $$
declare pro uuid; customer uuid; fresh uuid; addr uuid; bid uuid; job uuid; q jsonb; original jsonb; s text; at timestamptz;
  unit int; why text; before_price int; multi uuid; follow uuid; session_id uuid; count_before int; budget_job uuid;
begin
  assert (select count(*)=145 and bool_and(cardinality(price_tiers)=3) from public.service_variants), 'every variant has exactly three prices';
  assert public.service_duration_min('photo-yearbook-group','half',5)=180, 'group photo blocks three hours total';
  assert public.service_duration_min('photo-yearbook-group','half',3) is null, 'minimum group size enforced';
  assert public.service_duration_min('makeup-photo','group',3)=135, 'makeup remains sequential per person';
  assert (select sessions=2 and duration_min=120 from public.service_variants where template_id='makeup-bridal' and id='two'), 'bridal has two appointments';
  assert (select bool_and(v.deliverable is not null and v.revisions=1) from public.service_variants v join public.service_templates t on t.id=v.template_id where t.category in('photophone','camera','product-photo','short-video')), 'photo output and revisions specified';
  select id into pro from public.pros where slug='linh-pham';
  select id into customer from public.accounts where full_name='Ngọc Hân';
  select id into fresh from public.accounts where full_name='Thảo Vy';
  select id into addr from public.addresses where account_id=customer limit 1;
  assert pro is not null and customer is not null and fresh is not null and addr is not null, 'demo fixtures present';
  -- Isolate only the synthetic partner fixture inside the caller's transaction.
  delete from public.bookings where pro_id=pro and status in('pending','confirmed','in_progress');
  at:=(((current_date+14)+(8-extract(isodow from current_date+14)::int)%7)+time '10:00') at time zone public.app_timezone();
  perform set_config('request.jwt.claim.sub',pro::text,true);
  perform public.confirm_partner_hours((select jsonb_agg(jsonb_build_object('weekday',d,'startMin',540,'endMin',1140)) from generate_series(1,6)d));
  select price into unit from public.pro_service_prices where pro_id=pro and template_id='nail-design' and variant_id='simple';
  before_price:=unit;
  begin
    perform public.save_pro_service('nail-design','{"simple":265000}',true);
    assert false, 'invalid tier accepted';
  exception when check_violation then null; end;
  assert (select price=before_price from public.pro_service_prices where pro_id=pro and template_id='nail-design' and variant_id='simple'), 'invalid save preserved old price';
  perform set_config('request.jwt.claim.sub',customer::text,true);
  q:=public.booking_quote(pro,'nail-design','simple',at,true,addr,1);
  begin
    perform public.create_booking_checked(pro,'nail-design','simple',at,true,addr,1,'','cash',(q->>'total')::int+5000,unit,'{}');
    assert false, 'unapproved total accepted';
  exception when check_violation then null; end;
  bid:=public.create_booking_checked(pro,'nail-design','simple',at,true,addr,1,'','cash',(q->>'total')::int,unit,'{}');
  select service_contract into original from public.bookings where id=bid;
  assert original->>'tierLabel' is not null and original->>'version'='2', 'booking contract captured';
  update public.bookings set service_contract='{}' where id=bid;
  assert (select service_contract=original from public.bookings where id=bid), 'contract immutable';
  job:=public.post_job_checked('nail-design','simple',at+interval '1 day',true,addr,1,'','cash',unit,unit+100000);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  select public.job_problem(pro,j) into why from public.jobs j where id=job;
  assert why is null, format('matching partner eligible: %s',why);
  -- Force a travel fee without relying on the fixture's current district.
  perform set_config('app.system_write','on',true);
  update public.addresses set lat=21.0288,lng=105.8525 where id=addr;
  perform set_config('app.system_write','off',true);
  perform set_config('request.jwt.claim.sub',customer::text,true);
  budget_job:=public.post_job_checked('nail-design','simple',at+interval '2 days',true,addr,1,'','cash',unit,unit);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  select public.job_problem(pro,j) into why from public.jobs j where id=budget_job;
  assert why like 'Tổng tiền vượt%',format('fee above approved cap refused: %s',why);
  perform public.save_pro_service('nail-design',jsonb_build_object('simple',case when unit=350000 then 260000 else 350000 end),true);
  select public.job_problem(pro,j) into why from public.jobs j where id=job;
  assert why like 'Mức giá yêu cầu khác%', format('mismatched tier refused: %s',why);
  -- One package reserves both appointments atomically and retains travel buffers.
  perform set_config('app.system_write','on',true);
  update public.pros set categories=array['nail','makeup','lash-brow']::public.category_id[],studio_address='Studio test' where id=pro;
  perform set_config('app.system_write','off',true);
  perform public.save_pro_service('makeup-bridal','{"two":2200000,"one":1200000}',true);
  perform public.save_pro_service('brow-tattoo','{"powder":1300000}',true);
  perform set_config('request.jwt.claim.sub',customer::text,true);
  q:=public.booking_quote(pro,'makeup-bridal','two',at+interval '7 days',false,null,1);
  select count(*) into count_before from public.bookings where pro_id=pro;
  begin
    perform public.create_booking_checked(pro,'makeup-bridal','two',at+interval '7 days',false,null,1,'','cash',(q->>'total')::int,2200000,array[at+interval '7 days 1 hour']);
    assert false,'overlapping sessions accepted';
  exception when check_violation then null; end;
  assert (select count(*) from public.bookings where pro_id=pro)=count_before,'failed second session rolls back primary booking';
  multi:=public.create_booking_checked(pro,'makeup-bridal','two',at+interval '7 days',false,null,1,'','cash',(q->>'total')::int,2200000,array[at+interval '8 days']);
  assert (select count(*)=1 from public.booking_sessions where booking_id=multi and confirmed),'second session reserved';
  why:=public.availability_problem(pro,'makeup-bridal','one',1,at+interval '8 days',false);
  assert why like 'Khung giờ trùng một buổi%',format('other bookings respect secondary session: %s',why);
  perform set_config('request.jwt.claim.sub',pro::text,true);
  perform public.confirm_booking(multi);
  begin
    perform public.complete_booking(multi);
    assert false,'multi-session package finished before the second session';
  exception when check_violation then null; when raise_exception then null; end;
  -- A tattoo follow-up has no extra charge, requires the other party, and is once only.
  perform set_config('request.jwt.claim.sub',customer::text,true);
  q:=public.booking_quote(pro,'brow-tattoo','powder',at+interval '9 days',false,null,1);
  follow:=public.create_booking_checked(pro,'brow-tattoo','powder',at+interval '9 days',false,null,1,'','cash',(q->>'total')::int,1300000,'{}');
  perform set_config('app.system_write','on',true);
  update public.bookings set starts_at=at-interval '21 days',status='completed',completed_at=at-interval '21 days' where id=follow;
  perform set_config('app.system_write','off',true);
  perform public.propose_followup(follow,at+interval '3 days');
  select id into session_id from public.booking_sessions where booking_id=follow;
  begin perform public.confirm_followup(session_id); assert false,'proposal confirmed by its author'; exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub',fresh::text,true);
  begin perform public.confirm_followup(session_id); assert false,'unrelated user confirmed session'; exception when insufficient_privilege then null; end;
  set local role authenticated;
  assert not exists(select 1 from public.booking_sessions where booking_id=follow),'unrelated user read sessions';
  reset role;
  perform set_config('request.jwt.claim.sub',pro::text,true);
  perform public.confirm_followup(session_id);
  assert (select confirmed from public.booking_sessions where id=session_id),'other participant confirmed follow-up';
  assert (select total=(q->>'total')::int from public.bookings where id=follow),'follow-up did not charge again';
  update public.booking_sessions set starts_at=at-interval '21 days' where id=session_id;
  begin perform public.propose_followup(follow,at+interval '4 days'); assert false,'used follow-up reused'; exception when raise_exception then null; end;
  perform set_config('request.jwt.claim.sub',fresh::text,true);
  s:=public.create_partner('Thợ nail mới','Hà Nội','Ba Đình',array['nail']::public.category_id[]);
  assert s is not null, 'native partner RPC works';
  assert not exists(select 1 from public.working_hours where pro_id=fresh), 'no automatic working hours';
  assert (select not published and not accepting_jobs and not hours_confirmed from public.pros where id=fresh), 'new partner remains a paused draft';
  begin perform public.submit_partner_profile(false); assert false, 'missing consent accepted'; exception when raise_exception then null; end;
  perform set_config('request.jwt.claim.sub','',true);
  raise notice 'PARTNER FLOW RULES PASS';
end $$;
