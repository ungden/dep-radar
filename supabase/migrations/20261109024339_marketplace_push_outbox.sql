-- Delivery records are private and never send sensitive booking/report bodies to lock screens.
create table partner_private.push_deliveries (
 id uuid primary key default gen_random_uuid(), notification_id uuid not null references public.notifications(id) on delete cascade,
 account_id uuid not null references public.accounts(id) on delete cascade, token text not null,
 status text not null default 'pending' check(status in ('pending','sending','ticket','accepted','failed','dropped')),
 attempts int not null default 0, request_id bigint, receipt_request_id bigint, ticket_id text,
 next_attempt_at timestamptz not null default now(), created_at timestamptz not null default now(),
 error text, unique(notification_id,token)
);
alter table partner_private.push_deliveries enable row level security;
revoke all on partner_private.push_deliveries from public,anon,authenticated;
create index push_deliveries_due_idx on partner_private.push_deliveries(next_attempt_at) where status in ('pending','sending','ticket');
create or replace function public.push_notification() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into partner_private.push_deliveries(notification_id,account_id,token)
 select new.id,new.account_id,token from public.push_tokens where account_id=new.account_id and (expires_at is null or expires_at > now())
 on conflict do nothing;
 return new;
end $$;
-- CREATE OR REPLACE preserves the old owner. Align the trigger with its
-- private table even when migrations run through a different database owner.
alter function public.push_notification() owner to current_user;
revoke all on function public.push_notification() from public, anon, authenticated;

create or replace function partner_private.deliver_push_outbox() returns int
language plpgsql security definer set search_path='' as $$
declare d partner_private.push_deliveries; response record; payload jsonb; ticket jsonb; err text; request bigint; n int:=0;
begin
 if to_regnamespace('net') is null then return 0; end if;
 for d in select * from partner_private.push_deliveries where status in ('pending','sending','ticket') and next_attempt_at<=now() order by next_attempt_at for update skip locked limit 100 loop
  if d.created_at < now() - interval '24 hours' then
   update partner_private.push_deliveries set status='dropped',error='expired' where id=d.id;continue;
  end if;
  if not exists(select 1 from public.push_tokens where token=d.token and account_id=d.account_id and (expires_at is null or expires_at > now())) then
   update partner_private.push_deliveries set status='dropped',error='unregistered' where id=d.id;continue;
  end if;
  begin
  if d.status='sending' then
   select * into response from net._http_response where id=d.request_id;
   if not found then
    if d.next_attempt_at<now()-interval '5 minutes' then update partner_private.push_deliveries set status=case when attempts>=4 then 'failed' else 'pending' end,next_attempt_at=now()+interval '1 minute',error='response timeout' where id=d.id; end if;
    continue;
   end if;
   begin payload:=response.content::jsonb; ticket:=case when jsonb_typeof(payload->'data')='array' then payload->'data'->0 else payload->'data' end; exception when others then ticket:=null; end;
   if response.status_code=200 and ticket->>'status'='ok' and ticket->>'id' is not null then
    update partner_private.push_deliveries set status='ticket',ticket_id=ticket->>'id',next_attempt_at=now()+interval '15 minutes' where id=d.id;
   else
    err:=coalesce(ticket->'details'->>'error','transport');
    if err='DeviceNotRegistered' then delete from public.push_tokens where token=d.token and account_id=d.account_id and last_seen_at <= d.created_at; end if;
    update partner_private.push_deliveries set status=case when err='DeviceNotRegistered' then 'dropped' when attempts>=4 then 'failed' else 'pending' end,error=err,next_attempt_at=now()+make_interval(mins=>least(60,power(2,attempts)::int)) where id=d.id;
   end if;
  elsif d.status='ticket' then
   if d.receipt_request_id is null then
    request:=net.http_post(url:='https://exp.host/--/api/v2/push/getReceipts',body:=jsonb_build_object('ids',jsonb_build_array(d.ticket_id)),headers:='{"Content-Type":"application/json"}'::jsonb);
    update partner_private.push_deliveries set receipt_request_id=request,next_attempt_at=now()+interval '1 minute' where id=d.id;
   else
    select * into response from net._http_response where id=d.receipt_request_id;
    if not found then
     if d.created_at<now()-interval '24 hours' then
      update partner_private.push_deliveries set status='failed',error='receipt response timeout' where id=d.id;
     elsif d.next_attempt_at<now()-interval '5 minutes' then
      update partner_private.push_deliveries set receipt_request_id=null,next_attempt_at=now()+interval '15 minutes' where id=d.id;
     end if;
     continue;
    end if;
    begin ticket:=(response.content::jsonb)->'data'->d.ticket_id;exception when others then ticket:=null;end;
    if ticket->>'status'='ok' then update partner_private.push_deliveries set status='accepted' where id=d.id;
    elsif ticket->>'status'='error' then
     err:=coalesce(ticket->'details'->>'error','receipt error');
     if err='DeviceNotRegistered' then delete from public.push_tokens where token=d.token and account_id=d.account_id and last_seen_at <= d.created_at;end if;
     update partner_private.push_deliveries set status='failed',error=err where id=d.id;
    elsif d.created_at<now()-interval '24 hours' then update partner_private.push_deliveries set status='failed',error='receipt unavailable' where id=d.id;
    else update partner_private.push_deliveries set receipt_request_id=null,next_attempt_at=now()+interval '15 minutes' where id=d.id;end if;
   end if;
  else
   request:=net.http_post(url:='https://exp.host/--/api/v2/push/send',body:=jsonb_build_object('to',d.token,'title','360đẹp','body','Bạn có thông báo mới.','sound','default','data',jsonb_build_object('link',(select link from public.notifications where id=d.notification_id))),headers:='{"Content-Type":"application/json"}'::jsonb);
   update partner_private.push_deliveries set status='sending',attempts=attempts+1,request_id=request,next_attempt_at=now()+interval '1 minute' where id=d.id;
  end if;
  n:=n+1;
  exception when others then
   -- A transient network queue failure leaves this delivery retryable and
   -- cannot prevent the other notifications from being processed.
   update partner_private.push_deliveries
    set next_attempt_at=now()+interval '5 minutes',error='queue error'
    where id=d.id;
  end;
 end loop;
 return n;
end $$;
revoke all on function partner_private.deliver_push_outbox() from public,anon,authenticated;
do $$
begin
  if to_regnamespace('cron') is not null then
    perform cron.schedule('dep360-push-delivery','* * * * *','select partner_private.deliver_push_outbox()');
    perform cron.schedule('dep360-push-retention','36 18 * * *',
      $job$delete from partner_private.push_deliveries where created_at < now() - interval '7 days'$job$);
  end if;
end $$;
