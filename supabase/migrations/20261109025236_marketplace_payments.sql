-- Optional bank collection for confirmed appointments. The cash path remains
-- available. Receipts, bank details and settlement records are private.
create table partner_private.checkout_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  bin text check (bin ~ '^[0-9]{6}$'),
  account text check (account ~ '^[0-9]{4,20}$'),
  holder text check (length(holder) between 2 and 80),
  check (not enabled or (bin is not null and account is not null and holder is not null))
);
insert into partner_private.checkout_settings default values;
create table partner_private.booking_invoices (
  booking_id uuid primary key references public.bookings(id) on delete restrict,
  memo text not null unique check (memo ~ '^DB[A-F0-9]{16}$'),
  amount int not null check (amount > 0),
  bin text not null,
  account text not null,
  holder text not null,
  expires_at timestamptz not null,
  paid_at timestamptz,
  inbound_ref text unique,
  check ((paid_at is null) = (inbound_ref is null))
);
create table partner_private.booking_cashouts (
  booking_id uuid primary key references partner_private.booking_invoices(booking_id) on delete restrict,
  kind text not null check (kind in ('refund','artist')),
  beneficiary uuid references public.accounts(id) on delete set null,
  amount int not null check (amount > 0),
  bank text not null,
  account text not null check (account ~ '^[0-9]{6,20}$'),
  holder text not null,
  state text not null default 'queued' check (state in ('queued','processing','sent')),
  handled_by uuid references public.accounts(id) on delete set null,
  bank_ref text unique,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  check ((state = 'sent') = (bank_ref is not null and sent_at is not null))
);
alter table partner_private.checkout_settings enable row level security;
alter table partner_private.booking_invoices enable row level security;
alter table partner_private.booking_cashouts enable row level security;
revoke all on partner_private.checkout_settings, partner_private.booking_invoices, partner_private.booking_cashouts from public, anon, authenticated;
grant usage on schema partner_private to service_role;

create function partner_private.guard_invoice_booking() returns trigger
language plpgsql security definer set search_path = '' as $$
declare inv partner_private.booking_invoices;
begin
  if tg_op = 'INSERT' then
    if new.in_cart and exists (select 1 from partner_private.booking_invoices where booking_id = new.parent_booking_id) then
      raise exception 'Giỏ này đã có QR; không thể sửa số tiền.' using errcode='check_violation';
    end if;
    return new;
  end if;
  select * into inv from partner_private.booking_invoices where booking_id = case when old.in_cart then old.parent_booking_id else old.id end;
  if not found then return new; end if;
  if old.status not in ('cancelled','declined','expired','no_show') and (new.service_price, new.travel_fee, new.urgent_fee, new.discount) is distinct from
     (old.service_price, old.travel_fee, old.urgent_fee, old.discount) then
    raise exception 'Hãy huỷ QR chưa trả trước khi đổi giá hoặc voucher.' using errcode='check_violation';
  end if;
  if inv.paid_at is null and ((new.paid_at is distinct from old.paid_at) or
      (new.status in ('in_progress','completed') and new.status is distinct from old.status)) then
    raise exception 'Chưa nhận được tiền QR. Chờ đối soát hoặc huỷ QR để trả trực tiếp.' using errcode='check_violation';
  end if;
  return new;
end $$;
revoke all on function partner_private.guard_invoice_booking() from public, anon, authenticated;
create trigger marketplace_guard_invoice before insert or update on public.bookings
for each row execute function partner_private.guard_invoice_booking();

create function partner_private.booking_checkout(p_booking uuid, p_action text default 'read') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; cfg partner_private.checkout_settings; i partner_private.booking_invoices; c partner_private.booking_cashouts; charge int;
begin
  if p_action='read' then
    select * into b from public.bookings where id=p_booking;
  else
    select * into b from public.bookings where id=p_booking for update;
  end if;
  if b.id is null or auth.uid() is null or auth.uid() not in (b.customer_id,b.pro_id) or b.in_cart then
    raise exception 'Bạn không có quyền xem khoản thanh toán này.' using errcode='insufficient_privilege';
  end if;
  select * into cfg from partner_private.checkout_settings where id;
  select * into i from partner_private.booking_invoices where booking_id=b.id;
  if p_action <> 'read' and auth.uid() <> b.customer_id then raise exception 'Chỉ khách được đổi phương thức.' using errcode='insufficient_privilege'; end if;
  if p_action = 'issue' and i.booking_id is null then
    if not cfg.enabled or b.status <> 'confirmed' or b.paid_at is not null or b.starts_at <= now() then
      raise exception 'Lịch này chưa thể thanh toán QR.' using errcode='check_violation';
    end if;
    select b.total-b.discount + coalesce(sum(x.total-x.discount),0) into charge
      from public.bookings x where x.parent_booking_id=b.id and x.in_cart;
    if charge <= 0 then raise exception 'Lịch không có số dư phải thu.' using errcode='check_violation'; end if;
    insert into partner_private.booking_invoices(booking_id,memo,amount,bin,account,holder,expires_at)
      values(b.id,'DB'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),charge,cfg.bin,cfg.account,cfg.holder,
        least(b.starts_at,now()+interval '20 minutes')) returning * into i;
  elsif p_action = 'cancel' then
    if i.paid_at is not null then raise exception 'QR đã được thanh toán.' using errcode='check_violation'; end if;
    delete from partner_private.booking_invoices where booking_id=b.id;
    i := null;
  elsif p_action not in ('read','issue') then
    raise exception 'Thao tác không hợp lệ.' using errcode='check_violation';
  end if;
  select * into c from partner_private.booking_cashouts where booking_id=b.id;
  return jsonb_build_object(
    'canIssue', cfg.enabled and auth.uid()=b.customer_id and b.status='confirmed' and b.starts_at>now() and b.paid_at is null,
    'invoice', case when i.booking_id is null then null else jsonb_build_object('memo',i.memo,'amount',i.amount,'bin',i.bin,
      'account',i.account,'holder',i.holder,'expiresAt',i.expires_at,'paidAt',i.paid_at,'payable',i.paid_at is null and i.expires_at>now() and b.status='confirmed') end,
    'refundDue', i.paid_at is not null and b.status in ('cancelled','declined','expired','no_show') and auth.uid()=b.customer_id,
    'artistDue', i.paid_at is not null and b.status='completed' and auth.uid()=b.pro_id,
    'cashout', case when c.booking_id is null then null else jsonb_build_object('kind',c.kind,'state',c.state,'amount',c.amount,'sentAt',c.sent_at) end
  );
end $$;

-- Same transaction and reference lock as wallet credits. A malformed booking
-- payment on an accepted account is kept for staff reconciliation.
create function partner_private.record_marketplace_transfer(p_ref text,p_content text,p_amount int,p_code text,p_memos text[],p_account text,p_sub text,p_va text) returns text
language plpgsql security definer set search_path = '' as $$
declare code text; i partner_private.booking_invoices; b public.bookings; receiver text; cfg partner_private.checkout_settings;
begin
  if p_ref is null or p_ref !~ '^sepay:[1-9][0-9]*$' or p_amount is null or p_amount <= 0 then
    raise exception 'Invalid bank transaction' using errcode='check_violation';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_ref,3));
  if exists(select 1 from partner_private.booking_invoices where inbound_ref=p_ref)
    or exists(select 1 from public.wallet_entries where ref in (p_ref,'staff:'||p_ref))
    or exists(select 1 from public.unmatched_transfers where ref=p_ref) then return 'duplicate'; end if;
  receiver:=coalesce(nullif(trim(p_sub),''),trim(p_account));
  select m[1] into code from regexp_matches(upper(coalesce(p_code,'')||' '||coalesce(p_content,'')), '\m(DB[A-F0-9]{16})\M','g') m limit 1;
  if code is not null then
    select * into i from partner_private.booking_invoices where memo=code;
    if i.booking_id is not null then
      if i.account is distinct from receiver then return 'other_account'; end if;
      select * into b from public.bookings where id=i.booking_id for update;
      select * into i from partner_private.booking_invoices where booking_id=b.id and memo=code for update;
      if i.booking_id is not null and i.amount=p_amount and i.paid_at is null and i.expires_at>now() and b.status='confirmed' and b.paid_at is null then
        update partner_private.booking_invoices set paid_at=now(),inbound_ref=p_ref where booking_id=b.id;
        update public.bookings set paid_at=now(),payment_method='online' where id=b.id;
        perform public.notify(b.customer_id,'booking_paid','Đã nhận thanh toán QR','Xem trạng thái trong lịch hẹn.','/bookings/'||b.id);
        perform public.notify(b.pro_id,'booking_paid','Khách đã thanh toán QR','Không thu lại tiền của lịch này.','/bookings/'||b.id);
        return 'credited';
      end if;
      perform public.record_unmatched_transfer(p_ref,p_content,p_amount);
      return 'unmatched';
    end if;
  end if;
  select * into cfg from partner_private.checkout_settings where id;
  -- Never let a checkout memo credit a wallet, even if another code appears.
  if code is not null then
    if receiver is distinct from cfg.account then return 'other_account'; end if;
    perform public.record_unmatched_transfer(p_ref,p_content,p_amount);
    return 'unmatched';
  end if;
  if receiver=cfg.account and not exists(select 1 from public.platform_settings where id and topup_account_no=receiver)
      and receiver is distinct from nullif(p_va,'') then
    perform public.record_unmatched_transfer(p_ref,p_content,p_amount);
    return 'unmatched';
  end if;
  return public.record_sepay_topup(p_ref,p_content,p_amount,p_memos,p_account,p_sub,p_va);
end $$;

create function partner_private.request_booking_cashout(p_booking uuid,p_bank text,p_account text,p_holder text) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; i partner_private.booking_invoices; bank public.pro_payout; kind text;
begin
  select * into b from public.bookings where id=p_booking for update;
  if b.id is null or auth.uid() is null or auth.uid() not in (b.customer_id,b.pro_id) then raise exception 'Không có quyền.' using errcode='insufficient_privilege'; end if;
  select * into i from partner_private.booking_invoices where booking_id=b.id and paid_at is not null;
  if i.booking_id is null then raise exception 'Chưa có khoản QR đã thu.' using errcode='check_violation'; end if;
  if auth.uid()=b.customer_id and b.status in ('cancelled','declined','expired','no_show') then
    kind:='refund';
  elsif auth.uid()=b.pro_id and b.status='completed' then
    if b.completed_at is null or b.completed_at>now()-interval '24 hours' or exists
      (select 1 from public.reports where booking_id=b.id and status in ('open','reviewing')) then
      raise exception 'Khoản này chưa đủ điều kiện chi. Chờ ít nhất 24 giờ và xử lý xong vụ việc.' using errcode='check_violation';
    end if;
    select * into bank from public.pro_payout where pro_id=b.pro_id;
    p_bank:=bank.bank_name; p_account:=bank.account_number; p_holder:=bank.account_holder; kind:='artist';
  else raise exception 'Lịch chưa đủ điều kiện hoàn hoặc chi.' using errcode='check_violation'; end if;
  if p_account is null or trim(p_account) !~ '^[0-9]{6,20}$' or coalesce(length(trim(p_bank)),0) not between 2 and 80
    or coalesce(length(trim(p_holder)),0) not between 2 and 80 then raise exception 'Thông tin tài khoản nhận chưa hợp lệ.' using errcode='check_violation'; end if;
  insert into partner_private.booking_cashouts(booking_id,kind,beneficiary,amount,bank,account,holder)
    values(b.id,kind,auth.uid(),i.amount,trim(p_bank),trim(p_account),trim(p_holder))
    on conflict(booking_id) do nothing;
end $$;

create function partner_private.admin_booking_money(p_action text,p_booking uuid,p_input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c partner_private.booking_cashouts; b public.bookings; ref text;
begin
  perform public.require_admin();
  if p_action='read' then
    return jsonb_build_object('settings',(select to_jsonb(s)-'id' from partner_private.checkout_settings s where id),
      'cashouts',(select coalesce(jsonb_agg((to_jsonb(r)-'beneficiary'-'handled_by'-'bank'-'account'-'holder') || jsonb_build_object('mine',r.handled_by is not distinct from auth.uid()) || case when r.state='processing' and r.handled_by=auth.uid() then jsonb_build_object('bank',r.bank,'account',r.account,'holder',r.holder) else '{}'::jsonb end),'[]') from (
        select * from partner_private.booking_cashouts order by case state when 'processing' then 0 when 'queued' then 1 else 2 end,created_at desc limit 100) r));
  elsif p_action='configure' then
    update partner_private.checkout_settings set enabled=coalesce((p_input->>'enabled')::boolean,false),
      bin=nullif(trim(p_input->>'bin'),''),account=nullif(trim(p_input->>'account'),''),holder=nullif(trim(p_input->>'holder'),'') where id;
    perform public.log_admin_action('checkout_config',null,jsonb_build_object('enabled',p_input->>'enabled'));
    return '{}'::jsonb;
  end if;
  select * into b from public.bookings where id=p_booking for update;
  select * into c from partner_private.booking_cashouts where booking_id=p_booking for update;
  if c.booking_id is null then raise exception 'Không tìm thấy khoản chi.' using errcode='no_data_found'; end if;
  if p_action='reserve' and c.state='queued' then
    if c.kind='artist' and (b.status<>'completed' or exists(select 1 from public.reports where booking_id=b.id and status in ('open','reviewing'))) then
      raise exception 'Lịch đang bị giữ để đối soát.' using errcode='check_violation';
    end if;
    update partner_private.booking_cashouts set state='processing',handled_by=auth.uid() where booking_id=b.id;
  elsif p_action='sent' then
    ref:=upper(trim(coalesce(p_input->>'reference','')));
    if ref !~ '^[A-Z0-9-]{5,80}$' then raise exception 'Nhập mã giao dịch ngân hàng hợp lệ.' using errcode='check_violation'; end if;
    if c.state='sent' and c.bank_ref=ref then return '{}'::jsonb; end if;
    if c.state<>'processing' or c.handled_by is distinct from auth.uid() then raise exception 'Chỉ người đã giữ khoản chi được ghi nhận chuyển tiền.' using errcode='check_violation'; end if;
    perform pg_advisory_xact_lock(hashtextextended(ref,34));
    if exists(select 1 from public.mcn_payouts where bank_reference=ref) then raise exception 'Mã đã dùng cho MCN.' using errcode='unique_violation'; end if;
    update partner_private.booking_cashouts set state='sent',bank_ref=ref,sent_at=now() where booking_id=b.id;
    if c.kind='refund' then update public.bookings set refunded_amount=c.amount where id=b.id; end if;
    perform public.notify(c.beneficiary,'booking_cashout','Đã ghi nhận chuyển tiền','Xem trạng thái trong lịch hẹn.','/bookings/'||b.id);
  elsif p_action='release' and c.state='processing' then
    if coalesce(length(trim(p_input->>'reason')),0)<8 then raise exception 'Ghi lý do đã kiểm tra chưa chuyển.' using errcode='check_violation'; end if;
    update partner_private.booking_cashouts set state='queued',handled_by=null where booking_id=b.id;
  else raise exception 'Trạng thái đã thay đổi. Tải lại để kiểm tra.' using errcode='check_violation'; end if;
  perform public.log_admin_action('booking_cashout:'||p_action,b.id,jsonb_build_object('kind',c.kind,'amount',c.amount,'reference',ref,'reason',left(p_input->>'reason',200)));
  return '{}'::jsonb;
end $$;

create function partner_private.guard_mcn_cashout_ref() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.bank_reference,34));
  if exists(select 1 from partner_private.booking_cashouts where bank_ref=new.bank_reference) then
    raise exception 'Mã đã dùng cho chi trả lịch hẹn.' using errcode='unique_violation';
  end if;
  return new;
end $$;
revoke all on function partner_private.guard_mcn_cashout_ref() from public, anon, authenticated;
create trigger marketplace_mcn_payment_ref before insert or update of bank_reference on public.mcn_payouts
for each row execute function partner_private.guard_mcn_cashout_ref();

create function public.booking_checkout(p_booking uuid,p_action text default 'read') returns jsonb
language sql security invoker set search_path = '' as $$ select partner_private.booking_checkout(p_booking,p_action) $$;
create function public.request_booking_cashout(p_booking uuid,p_bank text default null,p_account text default null,p_holder text default null) returns void
language sql security invoker set search_path = '' as $$ select partner_private.request_booking_cashout(p_booking,p_bank,p_account,p_holder) $$;
create function public.admin_booking_money(p_action text,p_booking uuid default null,p_input jsonb default '{}') returns jsonb
language sql security invoker set search_path = '' as $$ select partner_private.admin_booking_money(p_action,p_booking,p_input) $$;
create function public.record_marketplace_transfer(p_ref text,p_content text,p_amount int,p_code text,p_memos text[],p_account text,p_sub text,p_va text) returns text
language sql security invoker set search_path = '' as $$ select partner_private.record_marketplace_transfer(p_ref,p_content,p_amount,p_code,p_memos,p_account,p_sub,p_va) $$;

revoke all on function partner_private.booking_checkout(uuid,text),public.booking_checkout(uuid,text),
  partner_private.request_booking_cashout(uuid,text,text,text),public.request_booking_cashout(uuid,text,text,text),
  partner_private.admin_booking_money(text,uuid,jsonb),public.admin_booking_money(text,uuid,jsonb),
  partner_private.record_marketplace_transfer(text,text,int,text,text[],text,text,text),public.record_marketplace_transfer(text,text,int,text,text[],text,text,text)
from public,anon,authenticated;
grant execute on function partner_private.booking_checkout(uuid,text),public.booking_checkout(uuid,text),
  partner_private.request_booking_cashout(uuid,text,text,text),public.request_booking_cashout(uuid,text,text,text),
  partner_private.admin_booking_money(text,uuid,jsonb),public.admin_booking_money(text,uuid,jsonb) to authenticated;
grant execute on function partner_private.record_marketplace_transfer(text,text,int,text,text[],text,text,text),public.record_marketplace_transfer(text,text,int,text,text[],text,text,text) to service_role;
