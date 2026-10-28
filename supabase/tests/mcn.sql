-- MCN business/security regression suite. Uses synthetic people only and rolls back.
-- Run after migrations: psql -X -v ON_ERROR_STOP=1 -d <local_test_database> -f supabase/tests/mcn.sql
-- The API calls run as authenticated/anon; fixture setup alone runs as the DB owner.
\set ON_ERROR_STOP on
begin;

create function pg_temp.reject_mcn(p_action text, p_input jsonb) returns void
language plpgsql as $$
declare rejected boolean := false;
begin
  begin
    perform public.mcn_command(p_action, p_input);
  exception when insufficient_privilege or check_violation or unique_violation or raise_exception then
    rejected := true;
  end;
  assert rejected, format('MCN command unexpectedly accepted: %s %s', p_action, p_input);
end $$;

create function pg_temp.command_id(p_action text, p_input jsonb) returns uuid
language sql as $$ select (public.mcn_command(p_action, p_input) #>> '{}')::uuid $$;

create function pg_temp.mcn_booking(p_pro uuid, p_customer uuid, p_price int, p_day int) returns uuid
language plpgsql as $$
declare result uuid; rate numeric;
begin
  select commission_rate into rate from public.fee_policy where id;
  insert into public.bookings (
    customer_id, pro_id, template_id, variant_id, starts_at, duration_min,
    at_home, city, district, address, service_price, travel_fee, urgent_fee,
    commission_rate, commission, payment_method, status, confirm_by, confirmed_at
  ) values (
    p_customer, p_pro, 'nail-extension', 'tips', now() - make_interval(days => p_day), 60,
    true, 'Hà Nội', 'Phường Ba Đình', 'MCN PRIVATE CUSTOMER ADDRESS', p_price, 100000, 50000,
    rate, public.commission_for(p_price, rate), 'cash', 'confirmed', now() - interval '1 day', now()
  ) returning id into result;
  return result;
end $$;

do $$
declare
  admin_id uuid := gen_random_uuid(); owner_a uuid := gen_random_uuid(); owner_b uuid := gen_random_uuid();
  pro_a uuid := gen_random_uuid(); pro_b uuid := gen_random_uuid(); customer uuid := gen_random_uuid(); stranger uuid := gen_random_uuid();
  org_a uuid; org_b uuid; member_a uuid; member_b uuid; invite_b uuid; invite_expired uuid;
  before_join uuid; with_a uuid; payout_booking uuid; after_leave uuid; with_b uuid; suspended_booking uuid; refund_booking uuid; recovery_booking uuid;
  commission_a uuid; commission_large uuid; commission_refund uuid; commission_recovery uuid; payout_id uuid; retry_id uuid; report_id uuid;
  target_policy uuid; snapshot jsonb; result jsonb; row_data jsonb; expected_fee int; before_count int; denied boolean; table_name text;
begin
  insert into auth.users (id, email, phone, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  select id, 'mcn-' || id || '@example.invalid', phone, jsonb_build_object('full_name', label), '{}', now(), now()
  from (values
    (admin_id, '+84990000101', 'MCN Test Admin'), (owner_a, '+84990000102', 'MCN Owner A'),
    (owner_b, '+84990000103', 'MCN Owner B'), (pro_a, '+84990000104', 'MCN Pro A'),
    (pro_b, '+84990000105', 'MCN Pro B'), (customer, '+84990000106', 'MCN PRIVATE CUSTOMER'),
    (stranger, '+84990000107', 'MCN Stranger')
  ) fixtures(id, phone, label);
  update public.accounts set is_admin = true where id = admin_id;
  insert into public.pros (id, slug, display_name, city, district, categories)
  values (pro_a, 'mcn-test-pro-a', 'MCN Pro A', 'Hà Nội', 'Phường Ba Đình', array['nail']::public.category_id[]),
         (pro_b, 'mcn-test-pro-b', 'MCN Pro B', 'Hà Nội', 'Phường Ba Đình', array['nail']::public.category_id[]);
  insert into public.wallet_entries(pro_id, kind, amount, ref)
  values (pro_a, 'topup', 5000000, 'MCN-TEST-PREPAID-A'), (pro_b, 'topup', 5000000, 'MCN-TEST-PREPAID-B');
  assert (select commission_rate=.20 from public.fee_policy where id), 'deployed fee policy for new bookings is 20%';
  -- Simulate a booking agreed before the policy migration, then change policy only.
  update public.fee_policy set commission_rate=.15 where id;
  before_join := pg_temp.mcn_booking(pro_a, customer, 350000, 30);
  update public.fee_policy set commission_rate=.20 where id;
  assert (select commission_rate=.15 and commission=53000 and payout=447000 from public.bookings where id=before_join),
    'changing the platform rate preserves an existing booking at its agreed 15% and payout';

  raise notice 'MCN: application, approval and actor boundaries';
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  org_a := pg_temp.command_id('apply', jsonb_build_object(
    'name', 'MCN Test Network A', 'legalName', 'MCN Test Company A', 'taxId', '0101234567',
    'contactPhone', '0990000102', 'city', 'Hà Nội', 'description', 'Tuyển dụng, đào tạo và hỗ trợ chuyên viên nail.',
    'bankName', 'Test Bank', 'bankAccount', '123456789', 'bankHolder', 'MCN TEST COMPANY A'))::uuid;
  result := public.mcn_workspace();
  assert result->>'isAdmin' = 'false', 'owner must not become platform admin';
  assert result->'organizations' @> jsonb_build_array(jsonb_build_object('id', org_a, 'status', 'pending')),
    'application must wait for approval';
  perform pg_temp.reject_mcn('review', jsonb_build_object('organizationId', org_a, 'status', 'approved', 'note', 'self approval'));
  perform pg_temp.reject_mcn('invite', jsonb_build_object('organizationId', org_a, 'proSlug', 'mcn-test-pro-a'));
  perform pg_temp.reject_mcn('apply', jsonb_build_object(
    'name', 'Duplicate network', 'legalName', 'Duplicate company', 'taxId', '0101234567',
    'contactPhone', '0990000102', 'city', 'Hà Nội', 'description', 'Duplicate network application.',
    'bankName', 'Test Bank', 'bankAccount', '123456789', 'bankHolder', 'MCN TEST COMPANY A'));
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  org_b := pg_temp.command_id('apply', jsonb_build_object(
    'name', 'MCN Test Network B', 'legalName', 'MCN Test Company B', 'taxId', '0101234568',
    'contactPhone', '0990000103', 'city', 'Hà Nội', 'description', 'Tuyển dụng và hỗ trợ chuyên viên làm đẹp.',
    'bankName', 'Test Bank', 'bankAccount', '987654321', 'bankHolder', 'MCN TEST COMPANY B'))::uuid;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  perform public.mcn_command('review', jsonb_build_object('organizationId', org_a, 'status', 'approved', 'note', 'Đã đối chiếu hồ sơ và hợp đồng.'));
  perform public.mcn_command('review', jsonb_build_object('organizationId', org_b, 'status', 'approved', 'note', 'Đã đối chiếu hồ sơ và hợp đồng.'));

  raise notice 'MCN: consent, cross-network restrictions and invitation expiry';
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  member_a := pg_temp.command_id('invite', jsonb_build_object('organizationId', org_a, 'proSlug', 'mcn-test-pro-a'))::uuid;
  invite_b := pg_temp.command_id('invite', jsonb_build_object('organizationId', org_a, 'proSlug', 'mcn-test-pro-b'))::uuid;
  perform pg_temp.reject_mcn('respond', jsonb_build_object('membershipId', member_a, 'accept', true));
  perform pg_temp.reject_mcn('invite', jsonb_build_object('organizationId', org_b, 'proSlug', 'mcn-test-pro-a'));
  perform set_config('request.jwt.claim.sub', stranger::text, true);
  perform pg_temp.reject_mcn('respond', jsonb_build_object('membershipId', member_a, 'accept', true));
  result := public.mcn_workspace();
  assert jsonb_array_length(result->'organizations') = 0 and jsonb_array_length(result->'memberships') = 0,
    'unrelated account cannot enumerate networks/members';
  perform set_config('request.jwt.claim.sub', pro_b::text, true);
  perform public.mcn_command('respond', jsonb_build_object('membershipId', invite_b, 'accept', false));
  result := public.mcn_workspace();
  assert not exists(select 1 from jsonb_array_elements(result->'memberships') m where m->>'status'='active'),
    'declining an invitation cannot join a network';
  perform set_config('request.jwt.claim.sub', pro_a::text, true);
  perform public.mcn_command('respond', jsonb_build_object('membershipId', member_a, 'accept', true));
  result := public.mcn_workspace();
  assert result->'memberships' @> jsonb_build_array(jsonb_build_object('id', member_a, 'status', 'active', 'isMine', true)),
    'only KTV consent activates membership';
  assert not exists(select 1 from jsonb_array_elements(result->'organizations') o where o->>'bankAccount' is not null), 'members cannot read network bank details';
  assert not exists(select 1 from jsonb_array_elements(result->'memberships') m where m->>'proId'<>pro_a::text), 'KTV cannot enumerate other members';
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  perform pg_temp.reject_mcn('invite', jsonb_build_object('organizationId', org_b, 'proSlug', 'mcn-test-pro-a'));
  perform set_config('request.jwt.claim.sub', pro_a::text, true);
  reset role;
  assert (select count(*) = 1 from public.mcn_memberships where pro_id=pro_a and status='active'), 'one active MCN per KTV';
  assert exists(select 1 from public.mcn_events where target_id=member_a and action='membership:accepted' and detail->>'consentVersion'='mcn-v1-fee20-2026-10-28' and detail->>'joinedAt' is not null and (detail->>'feeShareRate')::numeric=.2), 'audit retains the exact historical consent and share even after re-invitation';
  assert (select mcn_organization_id is null and mcn_commission=0 from public.bookings where id=before_join),
    'joining must not attribute an older booking retroactively';

  raise notice 'MCN: immutable booking attribution and no additional KTV fee';
  with_a := pg_temp.mcn_booking(pro_a, customer, 350000, 29);
  payout_booking := pg_temp.mcn_booking(pro_a, customer, 4000000, 28);
  refund_booking := pg_temp.mcn_booking(pro_a, customer, 4000000, 24);
  recovery_booking := pg_temp.mcn_booking(pro_a, customer, 10000000, 23);
  select jsonb_build_object('organization', mcn_organization_id, 'member', mcn_membership_id, 'share', mcn_share_rate, 'amount', mcn_commission)
    into snapshot from public.bookings where id=with_a;
  assert snapshot->>'organization'=org_a::text and snapshot->>'member'=member_a::text, 'booking snapshots consenting active membership';
  assert (select commission_rate=.20 and commission=70000 and mcn_commission=14000 and payout=430000 from public.bookings where id=with_a),
    'MCN receives 20% of actual rounded fee; travel/urgent stay with KTV';
  assert (select commission=mcn_commission+(commission-mcn_commission) and total=commission+payout from public.bookings where id=with_a),
    'all money reconciles exactly';
  begin
    update public.bookings set mcn_organization_id=org_b, mcn_membership_id=null, mcn_share_rate=.9, mcn_commission=49000 where id=with_a;
  exception when check_violation or raise_exception then null;
  end;
  assert (select jsonb_build_object('organization', mcn_organization_id, 'member', mcn_membership_id, 'share', mcn_share_rate, 'amount', mcn_commission)=snapshot from public.bookings where id=with_a),
    'booking attribution cannot be rewritten';
  perform set_config('request.jwt.claim.sub', pro_a::text, true);
  set local role authenticated;
  perform public.mcn_command('leave', jsonb_build_object('membershipId', member_a));
  reset role;
  after_leave := pg_temp.mcn_booking(pro_a, customer, 350000, 27);
  assert (select mcn_organization_id is null and mcn_commission=0 from public.bookings where id=after_leave), 'leaving takes effect for new bookings immediately';
  assert (select mcn_organization_id=org_a and mcn_commission=14000 from public.bookings where id=with_a), 'leaving preserves agreed historical attribution';
  set local role authenticated;
  perform public.complete_booking(with_a);
  perform public.complete_booking(payout_booking);
  perform public.complete_booking(refund_booking);
  perform public.complete_booking(recovery_booking);
  reset role;
  select id into commission_a from public.mcn_commissions where booking_id=with_a;
  select id into commission_large from public.mcn_commissions where booking_id=payout_booking;
  select id into commission_refund from public.mcn_commissions where booking_id=refund_booking;
  select id into commission_recovery from public.mcn_commissions where booking_id=recovery_booking;
  assert commission_a is not null and commission_large is not null, 'completion accrues a ledger entry';
  assert (select amount=14000 and platform_amount=56000 and commission=70000 from public.mcn_commissions where id=commission_a), 'ledger reconciles with actual service fee';
  assert (select available_at >= completed_at + interval '7 days' from public.mcn_commissions where id=commission_a), 'earnings have a seven-day hold';
  assert (select count(*)=1 from public.wallet_entries where booking_id=with_a and kind='commission' and amount=-70000), 'KTV is debited only the existing fee';
  update public.bookings set status='completed' where id=with_a;
  assert (select count(*)=1 from public.mcn_commissions where booking_id=with_a), 'repeated completion cannot accrue twice';
  assert not exists(select 1 from public.mcn_commissions where booking_id in(before_join, after_leave)), 'uncompleted bookings earn nothing';

  raise notice 'MCN: private data and mutation grants';
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  result := public.mcn_workspace();
  assert result::text not like '%MCN PRIVATE CUSTOMER%' and result::text not like '%0990000106%', 'MCN projection excludes customer names, phones and addresses';
  assert not exists(select 1 from public.bookings where id=with_a), 'network owner cannot read raw member booking';
  assert not exists(select 1 from public.accounts where id=customer), 'network owner cannot read customer account';
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'SELF-PAYOUT', 'note', 'Attempt'));
  perform pg_temp.reject_mcn('reverse', jsonb_build_object('commissionId', commission_a, 'reason', 'Unauthorized reversal'));
  foreach table_name in array array['mcn_organizations','mcn_memberships','mcn_commissions','mcn_payouts','mcn_events'] loop
    assert not has_table_privilege('authenticated', 'public.' || table_name, 'INSERT,UPDATE,DELETE'), format('direct writes must be revoked: %s', table_name);
  end loop;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'TOO-EARLY', 'note', 'Before hold ends'));
  reset role;
  denied := false;
  begin update public.mcn_commissions set amount=amount+1,platform_amount=platform_amount-1 where id=commission_a;
  exception when check_violation then denied := true; end;
  assert denied, 'accrued money cannot be edited even through a privileged connection';
  -- Privileged fixture clock travel only. Guard is immediately restored, and the whole suite rolls back.
  alter table public.mcn_commissions disable trigger mcn_commission_immutable;
  update public.mcn_commissions set completed_at=now()-interval '8 days',available_at=now()-interval '1 day'
    where id in(commission_a,commission_large,commission_refund,commission_recovery);
  alter table public.mcn_commissions enable trigger mcn_commission_immutable;

  raise notice 'MCN: collection, disputes, refunds and payout threshold';
  insert into public.wallet_entries(pro_id, kind, amount, note) values(pro_a,'adjustment',-10000000,'Test outstanding fees');
  set local role authenticated;
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'UNPAID-FEE', 'note', 'Outstanding KTV fees'));
  reset role;
  insert into public.wallet_entries(pro_id, kind, amount, note) values(pro_a,'topup',10000000,'Settle test fee debt');
  insert into public.reports(reporter_id, target_account_id, booking_id, reason, detail)
    values(customer,pro_a,payout_booking,'quality','MCN test unresolved booking dispute') returning id into report_id;
  set local role authenticated;
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'OPEN-DISPUTE', 'note', 'Unresolved dispute'));
  reset role;
  update public.reports set status='resolved', resolution='Test resolved' where id=report_id;
  update public.bookings set refunded_amount=10000 where id=refund_booking;
  set local role authenticated;
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_refund), 'bankReference', 'REFUNDED', 'note', 'Refunded booking'));
  reset role;
  update public.bookings set refunded_amount=0 where id=refund_booking;
  set local role authenticated;
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 14000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_a), 'bankReference', 'BELOW-MINIMUM', 'note', 'Below 100k'));
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_b, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'WRONG-NETWORK', 'note', 'Wrong network'));
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large,commission_large), 'bankReference', 'DUPLICATE-SELECTION', 'note', 'Duplicate entry'));
  perform public.mcn_command('review', jsonb_build_object('organizationId', org_a, 'status', 'suspended', 'note', 'Tạm dừng để đối chiếu hồ sơ.'));
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'SUSPENDED', 'note', 'Suspended network'));
  perform public.mcn_command('review', jsonb_build_object('organizationId', org_a, 'status', 'approved', 'note', 'Đã hoàn tất đối chiếu.'));

  raise notice 'MCN: payout idempotency and post-payout recovery';
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 170000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'WRONG-TRANSFER-AMOUNT', 'note', 'Reject stale or incorrect transfer amount'));
  payout_id := pg_temp.command_id('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'MCN-TEST-BANK-PAID-001', 'note', 'Đã đối chiếu sao kê chuyển khoản.'))::uuid;
  retry_id := pg_temp.command_id('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'MCN-TEST-BANK-PAID-001', 'note', 'Đã đối chiếu sao kê chuyển khoản.'))::uuid;
  assert payout_id=retry_id, 'same bank reference and selection must recover the same payout';
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 14000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_a), 'bankReference', 'MCN-TEST-BANK-PAID-001', 'note', 'Reusing reference for different earnings'));
  perform pg_temp.reject_mcn('payout', jsonb_build_object('expectedAmount', 160000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_large), 'bankReference', 'MCN-TEST-BANK-PAID-002', 'note', 'Paying twice'));
  perform public.mcn_command('reverse', jsonb_build_object('commissionId', commission_large, 'reason', 'Hoàn tiền sau khi chốt đối soát, thu hồi kỳ sau.'));
  reset role;
  assert (select c.status='reversed' and c.payout_id is not null from public.mcn_commissions c where c.id=commission_large), 'paid reversal keeps original payout evidence';
  assert (select count(*)=1 from public.mcn_payouts where organization_id=org_a), 'retries and reversals do not invent bank transfers';

  set local role authenticated;
  retry_id := pg_temp.command_id('payout', jsonb_build_object('expectedAmount', 240000, 'organizationId', org_a, 'commissionIds', jsonb_build_array(commission_recovery), 'bankReference', 'MCN-TEST-BANK-RECOVERY-003', 'note', 'Khấu trừ khoản thu hồi kỳ trước.'));
  reset role;
  assert (select amount=240000 and gross_amount=400000 and recovery_amount=160000 from public.mcn_payouts where id=retry_id), 'next payout deducts outstanding recovery exactly once';
  assert (select recovery_payout_id=retry_id from public.mcn_commissions where id=commission_large), 'recovery links to the payout that offset it';

  raise notice 'MCN: network switch, suspended attribution and expiry';
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  set local role authenticated;
  member_b := pg_temp.command_id('invite', jsonb_build_object('organizationId', org_b, 'proSlug', 'mcn-test-pro-a'))::uuid;
  perform set_config('request.jwt.claim.sub', pro_a::text, true);
  perform public.mcn_command('respond', jsonb_build_object('membershipId', member_b, 'accept', true));
  reset role;
  with_b := pg_temp.mcn_booking(pro_a, customer, 350000, 26);
  assert (select mcn_organization_id=org_b from public.bookings where id=with_b), 'future bookings follow the new network';
  assert (select mcn_organization_id=org_a from public.bookings where id=with_a), 'switch does not transfer old earnings';
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  set local role authenticated;
  perform public.mcn_command('review', jsonb_build_object('organizationId', org_b, 'status', 'suspended', 'note', 'Kiểm tra hoạt động network.'));
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  perform pg_temp.reject_mcn('invite', jsonb_build_object('organizationId', org_b, 'proSlug', 'mcn-test-pro-b'));
  reset role;
  suspended_booking := pg_temp.mcn_booking(pro_a, customer, 350000, 25);
  assert (select mcn_organization_id is null from public.bookings where id=suspended_booking), 'suspended network earns no new attribution';
  update public.mcn_memberships set invited_at=now()-interval '8 days' where id=invite_b;
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  invite_expired := pg_temp.command_id('invite', jsonb_build_object('organizationId', org_a, 'proSlug', 'mcn-test-pro-b'))::uuid;
  reset role;
  update public.mcn_memberships set expires_at=now()-interval '1 minute' where id=invite_expired;
  perform set_config('request.jwt.claim.sub', pro_b::text, true);
  set local role authenticated;
  perform pg_temp.reject_mcn('respond', jsonb_build_object('membershipId', invite_expired, 'accept', true));
  reset role;
  update auth.users set banned_until='infinity' where id=owner_a;
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  denied := false;
  begin perform public.mcn_workspace(); exception when insufficient_privilege then denied := true; end;
  assert denied, 'a banned/deleted owner cannot keep using an unexpired JWT';
  perform pg_temp.reject_mcn('invite', jsonb_build_object('organizationId', org_a, 'proSlug', 'mcn-test-pro-b'));
  perform set_config('request.jwt.claim.sub', '', true);
  perform pg_temp.reject_mcn('apply', '{}');
  set local role anon;
  denied := false;
  begin perform public.mcn_workspace(); exception when insufficient_privilege then denied := true; end;
  assert denied, 'anonymous callers must not access MCN workspace';
  reset role;
  assert exists(select 1 from public.mcn_events), 'sensitive MCN changes leave an audit trail';

  raise notice 'MCN admin reports and effective policy';
  perform set_config('request.jwt.claim.sub',stranger::text,true);
  set local role authenticated;
  denied:=false;
  begin perform public.mcn_admin_report(current_date-100,current_date); exception when insufficient_privilege then denied:=true; end;
  assert denied,'non-admin cannot read aggregate financial or audit data';
  perform pg_temp.reject_mcn('policy',jsonb_build_object('effectiveAt',now()+interval '2 days','feeShareRate',.25,'holdDays',10,'minimumPayout',200000,'reason','Policy test only'));
  reset role;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  set local role authenticated;
  result:=public.mcn_admin_report(current_date-100,current_date);
  assert jsonb_array_length(result->'networks')=2,'report contains both organizations even without revenue';
  assert jsonb_array_length(result->'events')>0,'admin has a readable consent and settlement timeline';
  assert (result->'policy'->>'feeShareRate')::numeric=.2,'default policy preserves original split';
  perform pg_temp.reject_mcn('policy',jsonb_build_object('effectiveAt',now(),'feeShareRate',.25,'holdDays',10,'minimumPayout',200000,'reason','Policy test only'));
  target_policy := pg_temp.command_id('policy',jsonb_build_object('effectiveAt',now()+interval '2 days','feeShareRate',.25,'holdDays',10,'minimumPayout',200000,'reason','Policy test only'));
  assert (public.mcn_policy()->>'feeShareRate')::numeric=.2,'future policy must not apply early';
  perform public.mcn_command('cancel_policy',jsonb_build_object('id',target_policy,'reason','Cancel scheduled test policy'));
  reset role;
  assert exists(select 1 from mcn_private.policies where id=target_policy and cancelled_at is not null),'cancellation preserves history';
  -- Make a scheduled policy effective only inside this rolled-back fixture.
  update mcn_private.policies set effective_at=now()-interval '1 minute',cancelled_at=null where id=target_policy;
  update auth.users set banned_until=null where id=owner_a;
  set local role authenticated;
  retry_id:=pg_temp.command_id('payout',jsonb_build_object('expectedAmount',160000,'organizationId',org_a,'commissionIds',jsonb_build_array(commission_large),'bankReference','MCN-TEST-BANK-PAID-001'));
  assert retry_id=payout_id,'historical payout retry remains idempotent after minimum increases';
  perform pg_temp.reject_mcn('payout',jsonb_build_object('expectedAmount',160000,'organizationId',org_a,'commissionIds',jsonb_build_array(commission_large),'bankReference','NEW-BELOW-POLICY-MINIMUM'));
  reset role;
  update public.mcn_organizations set status='approved' where id=org_b;
  recovery_booking:=pg_temp.mcn_booking(pro_a,customer,350000,22);
  assert (select mcn_share_rate=.25 and mcn_commission=17500 and mcn_hold_days=10 from public.bookings where id=recovery_booking),'new booking snapshots effective share and hold';
  assert (select mcn_share_rate=.2 and mcn_hold_days=7 from public.bookings where id=with_b),'existing booking retains prior contract';
  update public.bookings set status='completed',completed_at=now() where id=recovery_booking;
  assert (select available_at=completed_at+interval '10 days' from public.mcn_commissions where booking_id=recovery_booking),'availability uses booking hold snapshot';
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  set local role authenticated;
  perform pg_temp.reject_mcn('cancel_policy',jsonb_build_object('id',target_policy,'reason','Cannot cancel effective policy'));
  reset role;
  raise notice 'MCN BUSINESS AND SECURITY RULES PASS';
end $$;
rollback;
