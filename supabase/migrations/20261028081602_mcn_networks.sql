-- MCN v1: split the existing fee, never charge the KTV twice.
-- Only narrow, actor-checked RPC projections are exposed. All tables deny client writes/reads.
create schema if not exists mcn_private;
revoke all on schema mcn_private from public, anon, authenticated;
grant usage on schema mcn_private to authenticated;

create table public.mcn_organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.accounts(id),
  name text not null check (length(name) between 3 and 100),
  legal_name text not null check (length(legal_name) between 3 and 200),
  tax_id text not null unique check (tax_id ~ '^[0-9-]{10,14}$'),
  contact_phone text not null check (contact_phone ~ '^\+?[0-9]{9,15}$'),
  city text not null check (length(city) between 2 and 100),
  description text not null check (length(description) between 20 and 2000),
  bank_name text not null check (length(bank_name) between 2 and 100),
  bank_account text not null check (bank_account ~ '^[0-9]{6,30}$'),
  bank_holder text not null check (length(bank_holder) between 3 and 200),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  review_note text,
  reviewed_by uuid references public.accounts(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.mcn_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.mcn_organizations(id),
  pro_id uuid not null references public.pros(id),
  status text not null default 'invited' check (status in ('invited','active','declined','left','removed','expired')),
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  joined_at timestamptz,
  ended_at timestamptz,
  consent_version text,
  support_note text not null default '' check (length(support_note) <= 2000),
  next_follow_up date,
  unique (organization_id, pro_id)
);
create unique index mcn_one_active_network on public.mcn_memberships(pro_id) where status = 'active';
create index mcn_memberships_pro_idx on public.mcn_memberships(pro_id, status);
create index mcn_memberships_organization_idx on public.mcn_memberships(organization_id, status);

create table public.mcn_payouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.mcn_organizations(id),
  amount bigint not null check (amount >= 100000),
  gross_amount bigint not null check (gross_amount > 0),
  recovery_amount bigint not null default 0 check (recovery_amount >= 0),
  bank_reference text not null unique check (length(bank_reference) between 6 and 120),
  bank_name text not null,
  bank_account text not null,
  bank_holder text not null,
  paid_at timestamptz not null default now(),
  recorded_by uuid not null references public.accounts(id),
  note text not null default '' check (length(note) <= 1000),
  check (amount = gross_amount - recovery_amount)
);
create table public.mcn_commissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.mcn_organizations(id),
  membership_id uuid not null references public.mcn_memberships(id),
  booking_id uuid not null unique references public.bookings(id),
  pro_id uuid not null references public.pros(id),
  service_price int not null check (service_price > 0),
  commission int not null check (commission >= 0),
  amount int not null check (amount >= 0),
  platform_amount int not null check (platform_amount >= 0),
  completed_at timestamptz not null,
  available_at timestamptz not null,
  status text not null default 'held' check (status in ('held','paid','void','reversed')),
  payout_id uuid references public.mcn_payouts(id),
  recovery_payout_id uuid references public.mcn_payouts(id),
  paid_at timestamptz,
  adjustment_reason text,
  adjusted_at timestamptz,
  check (commission = amount + platform_amount),
  check (available_at >= completed_at + interval '7 days'),
  check ((status in ('held','void') and payout_id is null and paid_at is null)
      or (status in ('paid','reversed') and payout_id is not null and paid_at is not null)),
  check (recovery_payout_id is null or status = 'reversed')
);
create index mcn_commissions_org_status_idx on public.mcn_commissions(organization_id,status,available_at);
create index mcn_commissions_pro_idx on public.mcn_commissions(pro_id);
create index mcn_commissions_membership_idx on public.mcn_commissions(membership_id);
create index mcn_commissions_payout_idx on public.mcn_commissions(payout_id) where payout_id is not null;
create index mcn_commissions_recovery_idx on public.mcn_commissions(recovery_payout_id) where recovery_payout_id is not null;
create index mcn_payouts_org_idx on public.mcn_payouts(organization_id,paid_at desc);
create table public.mcn_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.mcn_organizations(id),
  actor_id uuid references public.accounts(id),
  action text not null,
  target_id uuid,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index mcn_events_org_idx on public.mcn_events(organization_id,created_at desc);

alter table public.mcn_organizations enable row level security;
alter table public.mcn_memberships enable row level security;
alter table public.mcn_payouts enable row level security;
alter table public.mcn_commissions enable row level security;
alter table public.mcn_events enable row level security;
revoke all on public.mcn_organizations, public.mcn_memberships, public.mcn_payouts,
  public.mcn_commissions, public.mcn_events from public, anon, authenticated;
revoke all on sequence public.mcn_events_id_seq from public, anon, authenticated;
grant all on public.mcn_organizations, public.mcn_memberships, public.mcn_payouts,
  public.mcn_commissions, public.mcn_events to service_role;
grant usage, select on sequence public.mcn_events_id_seq to service_role;

alter table public.bookings
  add column mcn_organization_id uuid references public.mcn_organizations(id),
  add column mcn_membership_id uuid references public.mcn_memberships(id),
  add column mcn_share_rate numeric(4,3) not null default 0,
  add column mcn_commission int not null default 0,
  add constraint booking_mcn_split check (
    (mcn_organization_id is null and mcn_membership_id is null and mcn_share_rate = 0 and mcn_commission = 0)
    or (mcn_organization_id is not null and mcn_membership_id is not null and mcn_share_rate = 0.2
      and mcn_commission = round(commission * mcn_share_rate)::int));
create index bookings_mcn_org_idx on public.bookings(mcn_organization_id) where mcn_organization_id is not null;
create index bookings_mcn_member_idx on public.bookings(mcn_membership_id) where mcn_membership_id is not null;

create function mcn_private.audit(p_org uuid, p_action text, p_target uuid, p_detail jsonb default '{}') returns void
language sql security definer set search_path = '' as $$
  insert into public.mcn_events(organization_id,actor_id,action,target_id,detail)
  values(p_org,auth.uid(),p_action,p_target,coalesce(p_detail,'{}'));
$$;

create function mcn_private.snapshot_booking() returns trigger
language plpgsql security definer set search_path = '' as $$
declare m public.mcn_memberships;
begin
  if tg_op = 'UPDATE' then
    if (new.mcn_organization_id,new.mcn_membership_id,new.mcn_share_rate,new.mcn_commission)
       is distinct from (old.mcn_organization_id,old.mcn_membership_id,old.mcn_share_rate,old.mcn_commission) then
      raise exception 'Phân chia MCN đã chốt khi tạo lịch, không thể thay đổi.' using errcode = 'check_violation';
    end if;
    return new;
  end if;
  -- Serialize joins/leaves with booking creation for this freelancer.
  perform 1 from public.pros where id = new.pro_id for update;
  select x.* into m from public.mcn_memberships x
    join public.mcn_organizations o on o.id = x.organization_id
    join public.accounts a on a.id = o.owner_id
    where x.pro_id = new.pro_id and x.status = 'active' and o.status = 'approved'
      and a.suspended_at is null and exists(select 1 from auth.users u where u.id=a.id and (u.banned_until is null or u.banned_until <= now()));
  -- Never trust caller-supplied snapshot columns, including service-role imports.
  new.mcn_organization_id := m.organization_id;
  new.mcn_membership_id := m.id;
  new.mcn_share_rate := case when m.id is null then 0 else 0.2 end;
  new.mcn_commission := round(new.commission * new.mcn_share_rate)::int;
  return new;
end $$;
create trigger mcn_booking_snapshot before insert or update on public.bookings
  for each row execute function mcn_private.snapshot_booking();

create function mcn_private.reverse_earning(p_booking uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.mcn_commissions;
begin
  select * into c from public.mcn_commissions where booking_id = p_booking for update;
  if c.id is null or c.status in ('void','reversed') then return; end if;
  update public.mcn_commissions set status = case when c.status = 'paid' then 'reversed' else 'void' end,
    adjustment_reason = left(p_reason,1000), adjusted_at = now() where id = c.id;
  perform mcn_private.audit(c.organization_id,'commission:reverse',c.id,
    jsonb_build_object('amount',c.amount,'previousStatus',c.status,'reason',left(p_reason,1000)));
end $$;
create function mcn_private.booking_earning() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'completed' and old.status <> 'completed' and new.mcn_organization_id is not null then
    insert into public.mcn_commissions(organization_id,membership_id,booking_id,pro_id,service_price,
      commission,amount,platform_amount,completed_at,available_at)
    values(new.mcn_organization_id,new.mcn_membership_id,new.id,new.pro_id,new.service_price,
      new.commission,new.mcn_commission,new.commission-new.mcn_commission,
      coalesce(new.completed_at,now()),coalesce(new.completed_at,now()) + interval '7 days')
    on conflict(booking_id) do nothing;
  end if;
  if (old.status = 'completed' and new.status <> 'completed') or new.refunded_amount > 0 then
    perform mcn_private.reverse_earning(new.id,'Lịch bị hoàn tiền hoặc không còn hoàn thành.');
  end if;
  return new;
end $$;
create trigger mcn_booking_earning after update on public.bookings
  for each row execute function mcn_private.booking_earning();

-- A wallet change and a payout cannot pass one another's collection check.
create function mcn_private.wallet_lock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.pros where id = case when tg_op = 'DELETE' then old.pro_id else new.pro_id end for update;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger mcn_wallet_lock before insert or update or delete on public.wallet_entries
  for each row execute function mcn_private.wallet_lock();
create function mcn_private.wallet_refund() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.booking_id is not null and new.amount > 0 and new.kind in ('refund','adjustment') then
    perform mcn_private.reverse_earning(new.booking_id,'Phí của lịch đã được hoàn hoặc điều chỉnh tăng lại cho KTV.');
  end if;
  return new;
end $$;
create trigger mcn_wallet_refund after insert or update on public.wallet_entries
  for each row execute function mcn_private.wallet_refund();
create function mcn_private.report_lock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.booking_id is not null then perform 1 from public.bookings where id = new.booking_id for update; end if;
  return new;
end $$;
create trigger mcn_report_lock before insert or update on public.reports
  for each row execute function mcn_private.report_lock();

create function mcn_private.hold_reason(p_commission uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when c.status <> 'held' then case c.status when 'paid' then 'Đã chi trả' when 'void' then 'Đã hủy hoa hồng' else 'Khoản phải thu hồi' end
    when o.status <> 'approved' or a.suspended_at is not null or not exists(select 1 from auth.users u where u.id=a.id and (u.banned_until is null or u.banned_until <= now())) then 'Network chưa hoạt động'
    when b.status <> 'completed' then 'Lịch chưa hoàn thành'
    when b.refunded_amount > 0 or exists(select 1 from public.wallet_entries w where w.booking_id = b.id and w.amount > 0 and w.kind in ('refund','adjustment')) then 'Lịch có hoàn phí, cần đối soát'
    when exists(select 1 from public.reports r where r.booking_id = b.id and r.status in ('open','reviewing')) then 'Đang xử lý khiếu nại'
    when c.available_at > now() then 'Đang giữ đối soát 7 ngày'
    when not exists(select 1 from public.wallet_entries w where w.booking_id = b.id and w.kind = 'commission' and w.amount = -c.commission)
      or public.wallet_balance(c.pro_id) < 0 then 'Chờ KTV thanh toán đủ phí'
    when c.amount = 0 then 'Không phát sinh hoa hồng'
    else null end
  from public.mcn_commissions c join public.mcn_organizations o on o.id=c.organization_id
  join public.accounts a on a.id=o.owner_id join public.bookings b on b.id=c.booking_id
  where c.id=p_commission;
$$;

create function mcn_private.command(p_action text,p_input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid(); admin boolean; org public.mcn_organizations; member public.mcn_memberships;
  pro public.pros; earning public.mcn_commissions; target uuid; selected uuid[]; recovery_ids uuid[]; selected_count int;
  gross bigint; recovery bigint; net bigint; v_payout_id uuid; ref text; note text; changed text;
begin
  if me is null then raise exception 'Đăng nhập để sử dụng MCN.' using errcode='insufficient_privilege'; end if;
  if not exists(select 1 from public.accounts where id=me and suspended_at is null and exists(select 1 from auth.users u where u.id=me and (u.banned_until is null or u.banned_until <= now()))) then
    raise exception 'Tài khoản không có quyền thao tác.' using errcode='insufficient_privilege';
  end if;
  if p_input is null or jsonb_typeof(p_input) <> 'object' or length(p_input::text) > 20000 then
    raise exception 'Dữ liệu gửi lên không hợp lệ.' using errcode='check_violation';
  end if;
  admin := public.is_admin();

  if p_action = 'apply' then
    if not exists(select 1 from public.accounts where id=me and phone <> '') then
      raise exception 'Bổ sung số điện thoại tài khoản trước khi đăng ký MCN.' using errcode='check_violation';
    end if;
    -- A row lock on the account also serializes two first-time applications.
    perform 1 from public.accounts where id=me for update;
    select * into org from public.mcn_organizations where owner_id=me for update;
    if org.id is not null and org.status <> 'rejected' then
      raise exception 'Bạn đã có hồ sơ network; không thể tạo thêm.' using errcode='check_violation';
    end if;
    insert into public.mcn_organizations(owner_id,name,legal_name,tax_id,contact_phone,city,description,bank_name,bank_account,bank_holder)
    values(me,trim(p_input->>'name'),trim(p_input->>'legalName'),trim(p_input->>'taxId'),trim(p_input->>'contactPhone'),
      trim(p_input->>'city'),trim(p_input->>'description'),trim(p_input->>'bankName'),trim(p_input->>'bankAccount'),trim(p_input->>'bankHolder'))
    on conflict(owner_id) do update set name=excluded.name,legal_name=excluded.legal_name,tax_id=excluded.tax_id,
      contact_phone=excluded.contact_phone,city=excluded.city,description=excluded.description,
      bank_name=excluded.bank_name,bank_account=excluded.bank_account,bank_holder=excluded.bank_holder,
      status='pending',review_note=null,reviewed_by=null,reviewed_at=null,updated_at=now()
    returning * into org;
    perform mcn_private.audit(org.id,'organization:apply',org.id);
    return to_jsonb(org.id);

  elsif p_action = 'review' then
    if not admin then raise exception 'Chỉ quản trị viên được duyệt network.' using errcode='insufficient_privilege'; end if;
    select * into org from public.mcn_organizations where id=(p_input->>'organizationId')::uuid for update;
    if org.id is null then raise exception 'Không tìm thấy network.' using errcode='no_data_found'; end if;
    changed := p_input->>'status'; note := trim(coalesce(p_input->>'note',''));
    if changed is null or changed not in ('approved','rejected','suspended') or length(note) not between 5 and 1000 then
      raise exception 'Chọn trạng thái và ghi lý do duyệt từ 5 đến 1.000 ký tự.' using errcode='check_violation';
    end if;
    if changed = 'rejected' and org.status <> 'pending' then
      raise exception 'Chỉ từ chối hồ sơ đang chờ duyệt. Dùng tạm dừng cho network đang hoạt động.' using errcode='check_violation';
    end if;
    update public.mcn_organizations set status=changed,review_note=note,reviewed_by=me,reviewed_at=now(),updated_at=now() where id=org.id;
    perform mcn_private.audit(org.id,'organization:'||changed,org.id,jsonb_build_object('reason',note,'previousStatus',org.status));
    perform public.log_admin_action('mcn:'||changed,org.id,jsonb_build_object('reason',note));
    perform public.notify(org.owner_id,'mcn_review','Cập nhật hồ sơ network',note,'/mcn/dashboard');
    return to_jsonb(org.id);

  elsif p_action = 'invite' then
    select * into org from public.mcn_organizations where id=(p_input->>'organizationId')::uuid for update;
    if org.id is null or org.owner_id <> me then raise exception 'Bạn không quản lý network này.' using errcode='insufficient_privilege'; end if;
    if org.status <> 'approved' then raise exception 'Network cần được duyệt và đang hoạt động để mời KTV.' using errcode='check_violation'; end if;
    select * into pro from public.pros where slug=trim(p_input->>'proSlug') and suspended_at is null;
    if pro.id is null or pro.id=me or not exists(select 1 from public.accounts where id=pro.id and suspended_at is null) then
      raise exception 'Không tìm thấy KTV phù hợp. Kiểm tra mã hồ sơ của KTV.' using errcode='check_violation';
    end if;
    if exists(select 1 from public.mcn_memberships where pro_id=pro.id and status='active') then
      raise exception 'KTV đã thuộc một network. KTV cần rời network hiện tại trước.' using errcode='check_violation';
    end if;
    select * into member from public.mcn_memberships where organization_id=org.id and pro_id=pro.id;
    if member.status='invited' and member.expires_at > now() then
      raise exception 'Lời mời vẫn còn hiệu lực.' using errcode='check_violation';
    end if;
    if member.invited_at > now()-interval '7 days' then
      raise exception 'Chờ đủ 7 ngày từ lời mời gần nhất trước khi mời lại.' using errcode='check_violation';
    end if;
    if (select count(*) from public.mcn_memberships where organization_id=org.id and invited_at>now()-interval '1 day') >= 50 then
      raise exception 'Network đã dùng hết 50 lời mời trong 24 giờ. Vui lòng thử lại sau.' using errcode='check_violation';
    end if;
    insert into public.mcn_memberships(organization_id,pro_id) values(org.id,pro.id)
    on conflict(organization_id,pro_id) do update set status='invited',invited_at=now(),expires_at=now()+interval '7 days',
      joined_at=null,ended_at=null,consent_version=null,support_note='',next_follow_up=null
    returning * into member;
    perform mcn_private.audit(org.id,'membership:invite',member.id);
    perform public.notify(pro.id,'mcn_invitation','Lời mời tham gia '||org.name,
      'Bạn tự quyết định tham gia. Phí tổng là 20%, network nhận một phần từ phí của sàn.','/studio/network');
    return to_jsonb(member.id);

  elsif p_action in ('respond','leave','remove','support') then
    select * into member from public.mcn_memberships where id=(p_input->>'membershipId')::uuid;
    if member.id is null then raise exception 'Không tìm thấy lời mời hoặc thành viên.' using errcode='no_data_found'; end if;
    -- Same lock as snapshot_booking, before the member row, for join/leave races.
    perform 1 from public.pros where id=member.pro_id for update;
    select * into member from public.mcn_memberships where id=member.id for update;
    select * into org from public.mcn_organizations where id=member.organization_id;
    if p_action in ('respond','leave') and member.pro_id <> me then
      raise exception 'Chỉ KTV được quyết định tham gia hoặc rời network.' using errcode='insufficient_privilege';
    end if;
    if p_action in ('remove','support') and org.owner_id <> me then
      raise exception 'Bạn không quản lý thành viên này.' using errcode='insufficient_privilege';
    end if;
    if p_action='respond' then
      if member.status <> 'invited' or member.expires_at <= now() then
        raise exception 'Lời mời đã hết hạn hoặc đã được xử lý.' using errcode='check_violation';
      end if;
      if p_input->'accept' is null or jsonb_typeof(p_input->'accept') <> 'boolean' then
        raise exception 'Hãy chọn đồng ý hoặc từ chối lời mời.' using errcode='check_violation';
      end if;
      if (p_input->>'accept')::boolean then
        if org.status <> 'approved' or not exists(select 1 from public.accounts a join auth.users u on u.id=a.id where a.id=org.owner_id and a.suspended_at is null and (u.banned_until is null or u.banned_until <= now())) then
          raise exception 'Network hiện chưa hoạt động.' using errcode='check_violation';
        end if;
        if exists(select 1 from public.pros where id=me and suspended_at is not null) then
          raise exception 'Hồ sơ KTV đang tạm khóa.' using errcode='check_violation';
        end if;
        if exists(select 1 from public.mcn_memberships where pro_id=me and status='active') then
          raise exception 'Bạn chỉ được tham gia một network tại một thời điểm.' using errcode='check_violation';
        end if;
        update public.mcn_memberships set status='active',joined_at=now(),consent_version='mcn-v1-fee20-2026-10-28' where id=member.id;
        changed:='accepted';
      else
        update public.mcn_memberships set status='declined',ended_at=now() where id=member.id;
        changed:='declined';
      end if;
      perform public.notify(org.owner_id,'mcn_member','KTV đã phản hồi lời mời',
        case when changed='accepted' then 'Một KTV đã đồng ý gia nhập network.' else 'Một KTV đã từ chối lời mời.' end,'/mcn/dashboard');
    elsif p_action in ('leave','remove') then
      if member.status <> 'active' and not (p_action='remove' and member.status='invited') then
        raise exception 'Thành viên không còn hoạt động trong network.' using errcode='check_violation';
      end if;
      changed:=case when p_action='leave' then 'left' else 'removed' end;
      update public.mcn_memberships set status=changed,ended_at=now() where id=member.id;
      perform public.notify(case when p_action='leave' then org.owner_id else member.pro_id end,
        'mcn_member','Kết thúc hợp tác network','Các lịch tạo mới sẽ không chia hoa hồng cho network này. Lịch cũ giữ thỏa thuận đã chốt.',
        case when p_action='leave' then '/mcn/dashboard' else '/studio/network' end);
    else
      if member.status <> 'active' or org.status <> 'approved' then
        raise exception 'Chỉ chăm sóc thành viên đang hoạt động của network đã duyệt.' using errcode='check_violation';
      end if;
      note:=trim(coalesce(p_input->>'supportNote',''));
      if length(note)>2000 then raise exception 'Ghi chú tối đa 2.000 ký tự.' using errcode='check_violation'; end if;
      update public.mcn_memberships set support_note=note,next_follow_up=nullif(p_input->>'nextFollowUp','')::date where id=member.id;
      changed:='support';
    end if;
    perform mcn_private.audit(org.id,'membership:'||changed,member.id,
      case when changed='accepted' then jsonb_build_object('consentVersion','mcn-v1-fee20-2026-10-28','joinedAt',now(),'feeShareRate',0.2,'totalFeeRate',0.2)
           when changed in ('left','removed','declined') then jsonb_build_object('endedAt',now(),'status',changed)
           else '{}'::jsonb end);
    return to_jsonb(member.id);

  elsif p_action='reverse' then
    if not admin then raise exception 'Chỉ quản trị viên được điều chỉnh hoa hồng.' using errcode='insufficient_privilege'; end if;
    select * into earning from public.mcn_commissions where id=(p_input->>'commissionId')::uuid;
    if earning.id is null then raise exception 'Không tìm thấy khoản hoa hồng.' using errcode='no_data_found'; end if;
    -- Same org lock as payout, so a manual reversal cannot be lost behind it.
    perform 1 from public.mcn_organizations where id=earning.organization_id for update;
    note:=trim(coalesce(p_input->>'reason',''));
    if length(note) not between 5 and 1000 then raise exception 'Ghi lý do điều chỉnh từ 5 đến 1.000 ký tự.' using errcode='check_violation'; end if;
    perform mcn_private.reverse_earning(earning.booking_id,note);
    perform public.log_admin_action('mcn:reverse',earning.id,jsonb_build_object('reason',note));
    return to_jsonb(earning.id);

  elsif p_action='payout' then
    if not admin then raise exception 'Chỉ quản trị viên được ghi nhận chi trả.' using errcode='insufficient_privilege'; end if;
    select * into org from public.mcn_organizations where id=(p_input->>'organizationId')::uuid for update;
    if org.id is null or org.status<>'approved' or not exists(select 1 from public.accounts a join auth.users u on u.id=a.id where a.id=org.owner_id and a.suspended_at is null and (u.banned_until is null or u.banned_until <= now())) then
      raise exception 'Network chưa hoạt động, không thể chi trả.' using errcode='check_violation';
    end if;
    if jsonb_typeof(p_input->'commissionIds') is distinct from 'array' then
      raise exception 'Chọn các khoản hoa hồng cần chi trả.' using errcode='check_violation';
    end if;
    select array_agg(x::uuid),count(*) into selected,selected_count from jsonb_array_elements_text(p_input->'commissionIds') x;
    if coalesce(selected_count,0) not between 1 and 500 or selected_count<>(select count(distinct x) from unnest(selected) x) then
      raise exception 'Chọn từ 1 đến 500 khoản hoa hồng khác nhau.' using errcode='check_violation';
    end if;
    ref:=upper(trim(coalesce(p_input->>'bankReference',''))); note:=trim(coalesce(p_input->>'note',''));
    if length(ref) not between 6 and 120 or length(note)>1000 then
      raise exception 'Mã giao dịch cần 6–120 ký tự, ghi chú tối đa 1.000 ký tự.' using errcode='check_violation';
    end if;
    select id into v_payout_id from public.mcn_payouts where bank_reference=ref and organization_id=org.id;
    if jsonb_typeof(p_input->'expectedAmount') is distinct from 'number' or (p_input->>'expectedAmount') !~ '^[0-9]{1,15}$' then
      raise exception 'Nhập đúng số tiền đã chuyển khoản để đối chiếu.' using errcode='check_violation';
    end if;
    if v_payout_id is not null and
      (select amount from public.mcn_payouts where id=v_payout_id) = (p_input->>'expectedAmount')::bigint and
      (select array_agg(id order by id) from public.mcn_commissions where payout_id=v_payout_id) =
      (select array_agg(x order by x) from unnest(selected) x) then
      return to_jsonb(v_payout_id); -- Exact retry records no second payment.
    end if;
    if exists(select 1 from public.mcn_payouts where bank_reference=ref) then
      raise exception 'Mã giao dịch ngân hàng này đã được ghi nhận cho khoản chi khác.' using errcode='check_violation';
    end if;
    -- Match finish_booking/refund lock order: booking, pro/wallet, commission.
    perform 1 from public.bookings where id in(select booking_id from public.mcn_commissions where id=any(selected)) order by id for update;
    perform 1 from public.pros where id in(select pro_id from public.mcn_commissions where id=any(selected)) order by id for update;
    perform 1 from public.mcn_commissions where organization_id=org.id and id=any(selected) order by id for update;
    -- Freeze the exact recovery set. A late automatic refund can create a new
    -- reversal while this transaction runs; it belongs to the NEXT payout and
    -- must never be marked recovered without being included in this net amount.
    select coalesce(array_agg(locked.id),'{}'::uuid[]) into recovery_ids from (
      select id from public.mcn_commissions where organization_id=org.id and status='reversed' and recovery_payout_id is null order by id for update
    ) locked;
    if (select count(*) from public.mcn_commissions where id=any(selected) and organization_id=org.id)<>selected_count then
      raise exception 'Khoản hoa hồng không thuộc network đã chọn.' using errcode='check_violation';
    end if;
    if exists(select 1 from public.mcn_commissions c where c.id=any(selected) and mcn_private.hold_reason(c.id) is not null) then
      raise exception 'Có khoản chưa đủ điều kiện. Tải lại danh sách và kiểm tra thời gian giữ, phí KTV, khiếu nại.' using errcode='check_violation';
    end if;
    select coalesce(sum(amount),0) into gross from public.mcn_commissions where id=any(selected);
    select coalesce(sum(amount),0) into recovery from public.mcn_commissions where id=any(recovery_ids);
    net:=gross-recovery;
    if net <> (p_input->>'expectedAmount')::bigint then
      raise exception 'Số tiền đã chuyển không khớp đối soát hiện tại. Kiểm tra lại khoản thu hồi và giao dịch ngân hàng trước khi ghi nhận.' using errcode='check_violation';
    end if;
    if net<100000 then raise exception 'Số tiền thực chi sau thu hồi cần từ 100.000đ.' using errcode='check_violation'; end if;
    insert into public.mcn_payouts(organization_id,amount,gross_amount,recovery_amount,bank_reference,bank_name,bank_account,bank_holder,recorded_by,note)
    values(org.id,net,gross,recovery,ref,org.bank_name,org.bank_account,org.bank_holder,me,note) returning id into v_payout_id;
    update public.mcn_commissions set status='paid',payout_id=v_payout_id,paid_at=now() where id=any(selected);
    update public.mcn_commissions set recovery_payout_id=v_payout_id where id=any(recovery_ids);
    perform mcn_private.audit(org.id,'payout:record',v_payout_id,jsonb_build_object('amount',net,'gross',gross,'recovery',recovery,'bankReference',ref));
    perform public.log_admin_action('mcn:payout',v_payout_id,jsonb_build_object('organizationId',org.id,'amount',net,'bankReference',ref));
    perform public.notify(org.owner_id,'mcn_payout','Đã ghi nhận chi trả MCN',
      to_char(net,'FM999G999G999')||'đ. Mã giao dịch: '||ref,'/mcn/dashboard');
    return to_jsonb(v_payout_id);
  end if;
  raise exception 'Thao tác MCN không hợp lệ.' using errcode='check_violation';
end $$;

create function mcn_private.workspace() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid:=auth.uid(); admin boolean; org_ids uuid[];
begin
  if me is null then raise exception 'Đăng nhập để sử dụng MCN.' using errcode='insufficient_privilege'; end if;
  if not exists(select 1 from public.accounts where id=me and suspended_at is null and exists(select 1 from auth.users u where u.id=me and (u.banned_until is null or u.banned_until <= now()))) then
    raise exception 'Tài khoản không có quyền truy cập.' using errcode='insufficient_privilege';
  end if;
  admin:=public.is_admin();
  select coalesce(array_agg(o.id),'{}') into org_ids from public.mcn_organizations o
    where admin or o.owner_id=me or exists(select 1 from public.mcn_memberships m where m.organization_id=o.id and m.pro_id=me);
  return jsonb_build_object(
    'available',true,'error',null,'isAdmin',admin,'isPro',exists(select 1 from public.pros where id=me),
    'organizations',coalesce((select jsonb_agg(jsonb_build_object(
      'id',o.id,'name',o.name,'legalName',o.legal_name,'taxId',o.tax_id,'contactPhone',o.contact_phone,
      'city',o.city,'description',o.description,'status',o.status,'reviewNote',o.review_note,
      'createdAt',o.created_at,'isOwner',o.owner_id=me,
      'bankName',case when admin or o.owner_id=me then o.bank_name end,
      'bankAccount',case when admin or o.owner_id=me then o.bank_account end,
      'bankHolder',case when admin or o.owner_id=me then o.bank_holder end
    ) order by o.created_at desc) from public.mcn_organizations o where o.id=any(org_ids)),'[]'),
    'memberships',coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,'organizationId',m.organization_id,'organizationName',o.name,
      'proId',p.id,'proSlug',p.slug,'proName',p.display_name,'city',p.city,
      'status',case when m.status='invited' and m.expires_at<=now() then 'expired' else m.status end,
      'invitedAt',m.invited_at,'expiresAt',m.expires_at,'joinedAt',m.joined_at,'endedAt',m.ended_at,
      'supportNote',m.support_note,'nextFollowUp',m.next_follow_up,
      'published',p.published,'acceptingJobs',p.accepting_jobs,'completedJobs',p.completed_jobs,'rating',p.rating_avg,'isMine',m.pro_id=me
    ) order by m.invited_at desc) from public.mcn_memberships m join public.mcn_organizations o on o.id=m.organization_id
      join public.pros p on p.id=m.pro_id where admin or o.owner_id=me or m.pro_id=me),'[]'),
    'commissions',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'organizationId',c.organization_id,'organizationName',o.name,
      'bookingCode',upper(left(c.booking_id::text,8)),'proName',p.display_name,
      'servicePrice',c.service_price,'commission',c.commission,'amount',c.amount,'platformAmount',c.platform_amount,
      'completedAt',c.completed_at,'availableAt',c.available_at,'status',c.status,
      'eligible',mcn_private.hold_reason(c.id) is null,'holdReason',mcn_private.hold_reason(c.id),
      'payoutId',c.payout_id,'paidAt',c.paid_at,'adjustmentReason',c.adjustment_reason,'recoveredAt',r.paid_at
    ) order by c.completed_at desc) from public.mcn_commissions c join public.mcn_organizations o on o.id=c.organization_id
      join public.pros p on p.id=c.pro_id left join public.mcn_payouts r on r.id=c.recovery_payout_id
      where admin or o.owner_id=me or c.pro_id=me),'[]'),
    'payouts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',p.id,'organizationId',p.organization_id,'amount',p.amount,'grossAmount',p.gross_amount,
      'recoveryAmount',p.recovery_amount,'bankReference',p.bank_reference,'paidAt',p.paid_at,'note',p.note
    ) order by p.paid_at desc) from public.mcn_payouts p join public.mcn_organizations o on o.id=p.organization_id
      where admin or o.owner_id=me),'[]')
  );
end $$;

-- The data behind an entitlement is immutable. Corrections change its state and
-- append an event; paid reversals become recoverable debt in the next payout.
create function mcn_private.guard_commission() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.organization_id,new.membership_id,new.booking_id,new.pro_id,new.service_price,new.commission,
      new.amount,new.platform_amount,new.completed_at,new.available_at)
    is distinct from
     (old.organization_id,old.membership_id,old.booking_id,old.pro_id,old.service_price,old.commission,
      old.amount,old.platform_amount,old.completed_at,old.available_at) then
    raise exception 'Không sửa số tiền hoặc nguồn gốc hoa hồng đã ghi nhận.' using errcode='check_violation';
  end if;
  return new;
end $$;
create trigger mcn_commission_immutable before update on public.mcn_commissions
  for each row execute function mcn_private.guard_commission();

create function public.mcn_command(p_action text,p_input jsonb default '{}') returns jsonb
language sql security invoker set search_path = '' as $$ select mcn_private.command(p_action,p_input) $$;
create function public.mcn_workspace() returns jsonb
language sql stable security invoker set search_path = '' as $$ select mcn_private.workspace() $$;

revoke all on all functions in schema mcn_private from public,anon,authenticated;
-- Only the two actor-checked entry points are callable, through invoker wrappers.
grant execute on function mcn_private.command(text,jsonb),mcn_private.workspace() to authenticated;
revoke all on function public.mcn_command(text,jsonb),public.mcn_workspace() from public,anon,authenticated;
grant execute on function public.mcn_command(text,jsonb),public.mcn_workspace() to authenticated;

-- Gross KTV fees include the MCN allocation, not platform net revenue.
create or replace function public.admin_finance_summary(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  tz text := public.app_timezone();
  lo timestamptz := (p_from::timestamp) at time zone tz;
  hi timestamptz := ((p_to + 1)::timestamp) at time zone tz;
  result jsonb;
begin
  perform public.require_admin();
  select jsonb_build_object(
    'completed', count(*) filter (where status = 'completed' and completed_at >= lo and completed_at < hi),
    'gmv', coalesce(sum(total) filter (where status = 'completed' and completed_at >= lo and completed_at < hi), 0),
    'serviceRevenue', coalesce(sum(service_price) filter (where status = 'completed' and completed_at >= lo and completed_at < hi), 0),
    'commission', coalesce(sum(commission) filter (where status = 'completed' and completed_at >= lo and completed_at < hi), 0),
    'discounts', coalesce(sum(discount) filter (where status = 'completed' and completed_at >= lo and completed_at < hi), 0),
    'created', count(*) filter (where created_at >= lo and created_at < hi),
    'cancelled', count(*) filter (where status = 'cancelled' and cancelled_at >= lo and cancelled_at < hi),
    'noShows', count(*) filter (where status = 'no_show' and cancelled_at >= lo and cancelled_at < hi),
    'expired', count(*) filter (where status in ('expired', 'declined') and created_at >= lo and created_at < hi)
  ) into result from public.bookings;

  result := result || (
    select jsonb_build_object(
      'topupsSepay', coalesce(sum(amount) filter (where kind = 'topup' and ref like 'sepay:%'), 0),
      'topupsStaff', coalesce(sum(amount) filter (where kind = 'topup' and coalesce(ref, '') not like 'sepay:%'), 0),
      'feesCharged', -coalesce(sum(amount) filter (where kind = 'commission'), 0),
      'adjustments', coalesce(sum(amount) filter (where kind in ('adjustment', 'refund')), 0),
      'voucherCredits', coalesce(sum(amount) filter (where kind = 'voucher'), 0),
      'referralPaid', coalesce(sum(amount) filter (where kind = 'referral'), 0),
      'noShowComp', coalesce(sum(amount) filter (where kind = 'no_show_comp'), 0)
    ) from public.wallet_entries where created_at >= lo and created_at < hi
  );

  -- Right now, not for the period: who owes and how much.
  result := result || (
    select jsonb_build_object('owing', count(*) filter (where bal < 0), 'owed', -coalesce(sum(bal) filter (where bal < 0), 0),
                              'credit', coalesce(sum(bal) filter (where bal > 0), 0))
    from (select pro_id, sum(amount) bal from public.wallet_entries group by pro_id) w
  );
  result := result || jsonb_build_object(
    'mcnCommission', (select coalesce(sum(amount),0) from public.mcn_commissions where status in ('held','paid') and completed_at >= lo and completed_at < hi),
    'mcnPaid', (select coalesce(sum(amount),0) from public.mcn_payouts where paid_at >= lo and paid_at < hi)
  );
  return result;
end $$;
