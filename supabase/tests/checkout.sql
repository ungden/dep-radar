\set ON_ERROR_STOP on
begin;

do $$
declare
  customer uuid; staff uuid; admin_id uuid; outsider uuid; artist uuid; addr uuid; booking uuid;
  quote jsonb; args jsonb; invoice jsonb; payment text; amount int; code text; ref text; other_ref text;
  voucher uuid; promo text := 'QATEST-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  base bigint := 4000000000000 + (random()*1000000000)::bigint;
  at_ timestamptz := (((date_trunc('week',now() at time zone 'Asia/Ho_Chi_Minh'))::date + 15) + time '11:00') at time zone 'Asia/Ho_Chi_Minh';
begin
  select id into artist from public.pros where slug='linh-pham';
  insert into auth.users(id,email,raw_user_meta_data)
    values (gen_random_uuid(),gen_random_uuid()||'@test.invalid','{"full_name":"Checkout Test","phone":"0900000012"}') returning id into customer;
  insert into auth.users(id,email) values(gen_random_uuid(),gen_random_uuid()||'@test.invalid') returning id into outsider;
  insert into auth.users(id,email) values(gen_random_uuid(),gen_random_uuid()||'@test.invalid') returning id into admin_id;
  insert into auth.users(id,email) values(gen_random_uuid(),gen_random_uuid()||'@test.invalid') returning id into staff;
  update public.accounts set is_admin=true where id=admin_id;
  insert into partner_private.support_staff(account_id) values(staff);
  insert into public.addresses(account_id,city,district,detail,lat,lng)
    values(customer,'Hà Nội','Đống Đa','Địa chỉ kiểm thử',21.0181,105.829) returning id into addr;

  args := jsonb_build_object('pro',artist,'template','nail-gel','variant','hand','home',true,'address',addr,'startsAt',at_);
  perform set_config('request.jwt.claim.sub',outsider::text,true);
  set local role authenticated;
  begin
    perform public.support_assisted_booking('options',customer,'{"slug":"linh-pham"}');
    assert false,'ordinary account read assisted booking options';
  exception when insufficient_privilege then null; end;
  reset role;
  perform set_config('request.jwt.claim.sub',staff::text,true);
  set local role authenticated;
  assert jsonb_array_length(public.support_assisted_booking('options',customer,'{"slug":"linh-pham"}')->'addresses')=1;
  quote := public.support_assisted_booking('quote',customer,args);
  assert auth.uid()=staff,'quote changed JWT subject';
  args := args||jsonb_build_object('operation',gen_random_uuid(),'total',(quote->>'total')::int,'consent','Khách đồng ý giờ và giá qua điện thoại');
  begin
    perform public.support_assisted_booking('place',customer,args);
    assert false,'placed without consent';
  exception when check_violation then null; end;
  args := args||'{"approved":true}';
  booking := (public.support_assisted_booking('place',customer,args)->>'id')::uuid;
  assert booking=(public.support_assisted_booking('place',customer,args)->>'id')::uuid,'retry created a second booking';
  assert auth.uid()=staff,'booking changed JWT subject';
  reset role;
  assert exists (select 1 from public.bookings where id=booking and customer_id=customer and pro_id=artist and status='pending' and payment_method='cash');
  assert exists (select 1 from public.admin_actions where actor_id=staff and target_id=booking and action='booking_assisted');
  assert (select count(*) from public.notifications where account_id=customer and kind='booking_assisted')=1;

  perform set_config('request.jwt.claim.sub',artist::text,true);
  perform public.confirm_booking(booking);
  perform set_config('request.jwt.claim.sub',customer::text,true);
  assert (public.booking_checkout(booking)->>'canIssue')::boolean=false,'feature enabled by default';
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  perform public.admin_booking_money('configure',null,'{"enabled":true,"bin":"970436","account":"1234567890","holder":"CHECKOUT TEST"}');
  perform set_config('request.jwt.claim.sub',customer::text,true);
  set local role authenticated;
  invoice := public.booking_checkout(booking,'issue')->'invoice';
  assert invoice=public.booking_checkout(booking,'issue')->'invoice','created a second open invoice';
  amount := (invoice->>'amount')::int;
  code := invoice->>'memo';
  assert amount=(quote->>'total')::int;
  reset role;
  assert (select paid_at is null and payment_method='cash' from public.bookings where id=booking),'issuance marked payment as paid';
  perform set_config('request.jwt.claim.sub',outsider::text,true);
  set local role authenticated;
  begin
    perform public.booking_checkout(booking);
    assert false,'stranger read checkout';
  exception when insufficient_privilege then null; end;
  assert not has_function_privilege('authenticated','public.record_marketplace_transfer(text,text,integer,text,text[],text,text,text)','execute');
  reset role;

  ref := 'sepay:'||base::text;
  other_ref := 'sepay:'||(base+1)::text;
  set local role service_role;
  payment := public.record_marketplace_transfer(ref,'PAY '||code,amount,null,'{}','9999999999','',null);
  assert payment='other_account',payment;
  payment := public.record_marketplace_transfer(other_ref,'PAY '||code,amount-1,null,'{}','1234567890','',null);
  assert payment='unmatched',payment;
  payment := public.record_marketplace_transfer(ref,'PAY '||code,amount,null,'{}','1234567890','',null);
  assert payment='credited',payment;
  payment := public.record_marketplace_transfer(ref,'PAY '||code,amount,null,'{}','1234567890','',null);
  assert payment='duplicate',payment;
  reset role;
  assert (select paid_at is not null and payment_method='online' from public.bookings where id=booking),'bank receipt not attached';
  assert not exists(select 1 from public.wallet_entries where wallet_entries.ref='sepay:'||base::text),'payment also credited to wallet';

  perform set_config('request.jwt.claim.sub',customer::text,true);
  perform public.cancel_booking(booking,'Khách cần dời lịch');
  assert (public.booking_checkout(booking)->>'refundDue')::boolean;
  perform public.request_booking_cashout(booking,'TEST BANK','0987654321','CHECKOUT TEST');
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  perform public.admin_booking_money('reserve',booking);
  perform public.admin_booking_money('sent',booking,jsonb_build_object('reference','TEST-'||base::text));
  perform public.admin_booking_money('sent',booking,jsonb_build_object('reference','TEST-'||base::text));
  assert (select refunded_amount=amount from public.bookings where id=booking),'refund not recorded';
  assert (select count(*) from public.notifications where account_id=customer and kind='booking_cashout')=1;
  perform public.admin_voucher_campaign('create',jsonb_build_object('code',promo,'title','QA promo','amount',20000,'minTotal',100000,'limit',1,'endsAt',now()+interval '1 day'));
  perform set_config('request.jwt.claim.sub',customer::text,true);
  set local role authenticated;
  begin
    perform public.claim_campaign_voucher(promo);
    assert false,'campaign issued a voucher before activation';
  exception when check_violation then null; end;
  begin
    perform public.admin_voucher_campaign('resume',jsonb_build_object('code',promo));
    assert false,'customer activated the campaign';
  exception when insufficient_privilege then null; end;
  reset role;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  perform public.admin_voucher_campaign('resume',jsonb_build_object('code',promo));
  perform set_config('request.jwt.claim.sub',customer::text,true);
  voucher := public.claim_campaign_voucher(lower(promo));
  assert voucher=public.claim_campaign_voucher(promo),'campaign retry consumed another voucher';
  assert (select v.amount=20000 and v.source='admin' from public.vouchers v where v.id=voucher and v.account_id=customer);
  perform set_config('request.jwt.claim.sub',outsider::text,true);
  begin
    perform public.claim_campaign_voucher(promo);
    assert false,'campaign issued more vouchers than the cap';
  exception when check_violation then null; end;
  raise notice 'PASS campaign activation, authority, cap and duplicate redemption';
  raise notice 'PASS assisted booking consent and retry, QR identity and idempotency, cancelled booking refund';
end $$;
rollback;
