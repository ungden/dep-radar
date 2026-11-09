\set ON_ERROR_STOP on
begin;

do $$
declare
  sender uuid; other_user uuid; result text; notification uuid;
  bank_ref text := 'sepay:' || (1000000000000 + (random()*1000000000)::bigint)::text;
  token text := 'ExponentPushToken[test360depToken]';
begin
  select id into sender from public.accounts where full_name = 'Ngọc Hân' limit 1;
  select id into other_user from public.accounts where id <> sender and not is_admin limit 1;
  assert sender is not null and other_user is not null, 'load development seed first';

  -- Do not touch real money or ask Expo to send. Every write rolls back.
  update public.platform_settings set topup_account_no = '1234567890' where id;
  set local role service_role;
  result := public.record_sepay_topup(bank_ref, 'Unmatched test', 1000, array[]::text[], '9876543210', '', null);
  assert result = 'other_account', 'wrong receiving account accepted';
  result := public.record_sepay_topup(bank_ref, 'Unmatched test', 1000, array[]::text[], '1234567890', '', null);
  assert result = 'unmatched', 'unmatched payment not stored';
  result := public.record_sepay_topup(bank_ref, 'Unmatched test', 1000, array[]::text[], '1234567890', '', null);
  assert result = 'duplicate', 'payment callback not idempotent';
  assert (select count(*) from public.unmatched_transfers where ref = bank_ref) = 1;
  reset role;

  perform set_config('request.jwt.claim.sub', sender::text, true);
  set local role authenticated;
  perform public.register_push_token(token, 'ios');
  reset role;
  perform set_config('request.jwt.claim.sub', other_user::text, true);
  set local role authenticated;
  perform public.unregister_push_token(token);
  begin
    perform public.support_desk(null, 'stalled');
    assert false, 'ordinary account read the support desk';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.add_customer_note(sender, 'Unauthorized');
    assert false, 'ordinary account wrote a support note';
  exception when insufficient_privilege then null;
  end;
  reset role;
  assert (select account_id from public.push_tokens where push_tokens.token = 'ExponentPushToken[test360depToken]') = sender;
  perform set_config('request.jwt.claim.sub', sender::text, true);
  set local role authenticated;
  perform public.unregister_push_token(token);
  reset role;
  assert not exists (select 1 from public.push_tokens where push_tokens.token = 'ExponentPushToken[test360depToken]');

  insert into partner_private.support_staff(account_id) values(other_user) on conflict do nothing;
  perform set_config('request.jwt.claim.sub', other_user::text, true);
  set local role authenticated;
  perform public.add_customer_note(sender, 'Đã hẹn gọi lại');
  assert public.support_desk(sender, 'recent')->'notes'->0->>'body' = 'Đã hẹn gọi lại', 'note is missing';
  begin
    perform public.require_admin();
    assert false, 'support staff inherited admin privileges';
  exception when insufficient_privilege then null;
  end;
  reset role;
  assert exists (select 1 from partner_private.customer_notes where customer_id = sender and author_id = other_user);

  -- Fake receipt: no HTTP request is sent and the transaction rolls back.
  if to_regnamespace('net') is not null then
    perform set_config('request.jwt.claim.sub', sender::text, true);
    perform public.register_push_token_v2(token, 'ios');
    insert into public.notifications(account_id, kind, title) values(sender, 'qa', 'QA receipt') returning id into notification;
    assert exists (select 1 from partner_private.push_deliveries d where d.notification_id = notification and d.token = 'ExponentPushToken[test360depToken]');
    update partner_private.push_deliveries set next_attempt_at = 'infinity';
    update partner_private.push_deliveries d
      set status = 'ticket', ticket_id = 'qa-360dep', receipt_request_id = -9073500, next_attempt_at = now()
      where d.notification_id = notification and d.token = 'ExponentPushToken[test360depToken]';
    insert into net._http_response(id,status_code,content) values(-9073500,200,'{"data":{"qa-360dep":{"status":"ok"}}}');
    perform partner_private.deliver_push_outbox();
    assert exists (select 1 from partner_private.push_deliveries d where d.notification_id = notification and d.token = 'ExponentPushToken[test360depToken]' and d.status = 'accepted');
  end if;
end $$;
rollback;
