
create table mcn_private.policies (
 id uuid primary key default gen_random_uuid(), effective_at timestamptz not null unique,
 share_rate numeric(4,3) not null check(share_rate between 0 and 0.5),
 hold_days int not null check(hold_days between 7 and 90),
 minimum_payout int not null check(minimum_payout between 100000 and 10000000),
 reason text not null check(length(reason) between 10 and 1000),
 created_by uuid references public.accounts(id),created_at timestamptz not null default now(),cancelled_at timestamptz
);
alter table mcn_private.policies enable row level security;
revoke all on mcn_private.policies from public,anon,authenticated;
insert into mcn_private.policies(effective_at,share_rate,hold_days,minimum_payout,reason) values('2026-10-28 00:00:00+07',.2,7,100000,'Chính sách MCN ban đầu');
alter table public.mcn_events alter column organization_id drop not null;
create function mcn_private.policy() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('feeShareRate',share_rate,'holdDays',hold_days,'minimumPayout',minimum_payout,'effectiveAt',effective_at)
 from mcn_private.policies where effective_at<=now() and cancelled_at is null order by effective_at desc limit 1
$$;
create function public.mcn_policy() returns jsonb language sql stable security invoker set search_path='' as $$ select mcn_private.policy() $$;
revoke all on function mcn_private.policy(),public.mcn_policy() from public,anon,authenticated;
grant execute on function mcn_private.policy(),public.mcn_policy() to anon,authenticated;
-- Anonymous callers can resolve only the explicitly granted public policy helper.
grant usage on schema mcn_private to anon;
alter table public.bookings add column mcn_hold_days int not null default 7 check(mcn_hold_days between 7 and 90);
alter table public.bookings drop constraint booking_mcn_split;
alter table public.bookings add constraint booking_mcn_split check (
 (mcn_organization_id is null and mcn_membership_id is null and mcn_share_rate=0 and mcn_commission=0)
 or (mcn_organization_id is not null and mcn_membership_id is not null and mcn_share_rate between 0 and .5 and mcn_commission=round(commission*mcn_share_rate)::int));
create or replace function mcn_private.snapshot_booking() returns trigger
language plpgsql security definer set search_path = '' as $$
declare m public.mcn_memberships;
begin
  if tg_op = 'UPDATE' then
    if (new.mcn_organization_id,new.mcn_membership_id,new.mcn_share_rate,new.mcn_commission,new.mcn_hold_days)
       is distinct from (old.mcn_organization_id,old.mcn_membership_id,old.mcn_share_rate,old.mcn_commission,old.mcn_hold_days) then
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
  new.mcn_share_rate := case when m.id is null then 0 else (mcn_private.policy()->>'feeShareRate')::numeric end;
  new.mcn_hold_days := (mcn_private.policy()->>'holdDays')::int;
  new.mcn_commission := round(new.commission * new.mcn_share_rate)::int;
  return new;
end $$;
create or replace function mcn_private.booking_earning() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'completed' and old.status <> 'completed' and new.mcn_organization_id is not null then
    insert into public.mcn_commissions(organization_id,membership_id,booking_id,pro_id,service_price,
      commission,amount,platform_amount,completed_at,available_at)
    values(new.mcn_organization_id,new.mcn_membership_id,new.id,new.pro_id,new.service_price,
      new.commission,new.mcn_commission,new.commission-new.mcn_commission,
      coalesce(new.completed_at,now()),coalesce(new.completed_at,now()) + make_interval(days=>new.mcn_hold_days))
    on conflict(booking_id) do nothing;
  end if;
  if (old.status = 'completed' and new.status <> 'completed') or new.refunded_amount > 0 then
    perform mcn_private.reverse_earning(new.id,'Lịch bị hoàn tiền hoặc không còn hoàn thành.');
  end if;
  return new;
end $$;

alter function mcn_private.command(text,jsonb) rename to command_original;
revoke all on function mcn_private.command_original(text,jsonb) from public,anon,authenticated;
create function mcn_private.command(p_action text,p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare effective timestamptz; target uuid; reason text;
begin
 if p_action in ('policy','cancel_policy') then
  perform public.require_admin();
  if not exists(select 1 from public.accounts a join auth.users u on u.id=a.id where a.id=auth.uid() and a.suspended_at is null and (u.banned_until is null or u.banned_until<=now())) then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(36020261028);
  reason:=btrim(p_input->>'reason');
  if reason is null or length(reason)<10 or length(reason)>1000 then raise exception 'Cần ghi lý do từ 10 đến 1000 ký tự.' using errcode='check_violation'; end if;
  if p_action='policy' then
   effective:=(p_input->>'effectiveAt')::timestamptz;
   if effective is null or effective<now()+interval '1 day' then raise exception 'Chính sách mới cần báo trước ít nhất 24 giờ.' using errcode='check_violation'; end if;
   insert into mcn_private.policies(effective_at,share_rate,hold_days,minimum_payout,reason,created_by)
   values(effective,(p_input->>'feeShareRate')::numeric,(p_input->>'holdDays')::int,(p_input->>'minimumPayout')::int,reason,auth.uid()) returning id into target;
  else
   target:=(p_input->>'id')::uuid;
   update mcn_private.policies set cancelled_at=now() where id=target and effective_at>now() and cancelled_at is null;
   if not found then raise exception 'Chỉ huỷ lịch chính sách chưa hiệu lực.' using errcode='check_violation'; end if;
  end if;
  perform mcn_private.audit(null,'policy:'||p_action,target,p_input);
  perform public.log_admin_action('mcn:'||p_action,target,p_input);
  return to_jsonb(target);
 end if;
 if p_action='payout' and not exists(select 1 from public.mcn_payouts p where p.bank_reference=upper(btrim(p_input->>'bankReference')) and p.organization_id=(p_input->>'organizationId')::uuid) and coalesce((p_input->>'expectedAmount')::bigint,0)<(mcn_private.policy()->>'minimumPayout')::int then raise exception 'Chưa đạt mức chi tối thiểu của chính sách hiện tại.' using errcode='check_violation'; end if;
 return mcn_private.command_original(p_action,p_input);
end $$;
revoke all on function mcn_private.command(text,jsonb) from public,anon,authenticated;
grant execute on function mcn_private.command(text,jsonb) to authenticated;
-- Admin-only aggregates use the same booking attribution and ledger as settlement.
create function mcn_private.admin_report(p_from date,p_to date,p_org uuid default null,p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare lo timestamptz; hi timestamptz; result jsonb;
begin
 perform public.require_admin();
 if not exists(select 1 from public.accounts a join auth.users u on u.id=a.id where a.id=auth.uid() and a.suspended_at is null and (u.banned_until is null or u.banned_until<=now())) then raise insufficient_privilege; end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>366 or p_offset<0 then raise exception 'Chọn khoảng ngày tối đa 367 ngày.' using errcode='check_violation'; end if;
 lo:=p_from::timestamp at time zone public.app_timezone(); hi:=(p_to+1)::timestamp at time zone public.app_timezone();
 with orgs as (select * from public.mcn_organizations where p_org is null or id=p_org),
 rows as (select o.id,o.name,o.status,
 (select count(*) from public.mcn_memberships m where m.organization_id=o.id and m.status='active') as active,
 (select count(*) from public.mcn_memberships m where m.organization_id=o.id and m.invited_at>=lo and m.invited_at<hi) as invited,
 (select count(*) from public.mcn_memberships m where m.organization_id=o.id and m.invited_at>=lo and m.invited_at<hi and m.joined_at is not null) as joined,
 (select count(*) from public.mcn_memberships m where m.organization_id=o.id and m.invited_at>=lo and m.invited_at<hi and exists(select 1 from public.bookings b where b.mcn_membership_id=m.id and b.status='completed')) as activated,
 (select count(distinct b.pro_id) from public.bookings b where b.mcn_organization_id=o.id and b.status='completed' and b.completed_at>=lo and b.completed_at<hi) as working,
 (select count(*) from public.bookings b where b.mcn_organization_id=o.id and b.created_at>=lo and b.created_at<hi) as created,
 (select count(*) from public.bookings b where b.mcn_organization_id=o.id and b.created_at>=lo and b.created_at<hi and b.status='cancelled') as cancelled,
 (select count(*) from public.bookings b where b.mcn_organization_id=o.id and b.created_at>=lo and b.created_at<hi and b.status='no_show') as no_shows,
 (select count(distinct b.id) from public.bookings b join public.reports r on r.booking_id=b.id where b.mcn_organization_id=o.id and b.created_at>=lo and b.created_at<hi) as reported,
 (select count(*) from public.bookings b where b.mcn_organization_id=o.id and b.status='completed' and b.completed_at>=lo and b.completed_at<hi) as completed,
 (select coalesce(sum(b.service_price),0) from public.bookings b where b.mcn_organization_id=o.id and b.status='completed' and b.completed_at>=lo and b.completed_at<hi) as revenue,
 (select coalesce(sum(b.commission),0) from public.bookings b where b.mcn_organization_id=o.id and b.status='completed' and b.completed_at>=lo and b.completed_at<hi) as fee,
 (select coalesce(sum(c.amount),0) from public.mcn_commissions c where c.organization_id=o.id and c.status in ('held','paid') and c.completed_at>=lo and c.completed_at<hi) as earned,
 (select coalesce(sum(p.amount),0) from public.mcn_payouts p where p.organization_id=o.id and p.paid_at>=lo and p.paid_at<hi) as paid,
 (select coalesce(sum(c.amount),0) from public.mcn_commissions c where c.organization_id=o.id and c.status='held' and mcn_private.hold_reason(c.id) is null) as eligible,
 (select coalesce(sum(c.amount),0) from public.mcn_commissions c where c.organization_id=o.id and c.status='held' and mcn_private.hold_reason(c.id) is not null) as held,
 (select coalesce(sum(c.amount),0) from public.mcn_commissions c where c.organization_id=o.id and c.status='reversed' and c.recovery_payout_id is null) as recovery
 from orgs o)
 select jsonb_build_object('networks',coalesce(jsonb_agg(to_jsonb(rows) order by revenue desc,name),'[]')) into result from rows;
 result:=result||jsonb_build_object('daily',(select coalesce(jsonb_agg(to_jsonb(d) order by day),'[]') from (
 select to_char(b.completed_at at time zone public.app_timezone(),'YYYY-MM-DD') as day,count(*) as completed,sum(b.service_price) as revenue,sum(b.commission) as fee,
 coalesce(sum(c.amount) filter(where c.status in ('held','paid')),0) as earned
 from public.bookings b left join public.mcn_commissions c on c.booking_id=b.id
 where b.mcn_organization_id is not null and (p_org is null or b.mcn_organization_id=p_org) and b.status='completed' and b.completed_at>=lo and b.completed_at<hi group by 1) d),
 'events',(select coalesce(jsonb_agg(to_jsonb(e) order by id desc),'[]') from (
 select e.id,e.organization_id,o.name as organization,e.actor_id,coalesce(a.full_name,e.actor_id::text,'Hệ thống') as actor,e.action,e.target_id,e.detail,e.created_at
 from public.mcn_events e left join public.mcn_organizations o on o.id=e.organization_id left join public.accounts a on a.id=e.actor_id
 where (p_org is null or e.organization_id=p_org) and e.created_at>=lo and e.created_at<hi order by e.id desc limit 201 offset p_offset) e));
 result:=result||jsonb_build_object('policies',(select coalesce(jsonb_agg(to_jsonb(p) order by effective_at desc),'[]') from mcn_private.policies p),'policy',mcn_private.policy());
 return result;
end $$;
create function public.mcn_admin_report(p_from date,p_to date,p_org uuid default null,p_offset int default 0) returns jsonb
language sql stable security invoker set search_path='' as $$ select mcn_private.admin_report(p_from,p_to,p_org,p_offset) $$;
revoke all on function mcn_private.admin_report(date,date,uuid,int),public.mcn_admin_report(date,date,uuid,int) from public,anon,authenticated;
grant execute on function mcn_private.admin_report(date,date,uuid,int),public.mcn_admin_report(date,date,uuid,int) to authenticated;

alter function mcn_private.workspace() rename to workspace_original;
revoke all on function mcn_private.workspace_original() from public,anon,authenticated;
create function mcn_private.workspace() returns jsonb language sql stable security definer set search_path='' as $$ select mcn_private.workspace_original()||jsonb_build_object('policy',mcn_private.policy()) $$;
revoke all on function mcn_private.workspace() from public,anon,authenticated;
grant execute on function mcn_private.workspace() to authenticated;

create index bookings_mcn_completed_idx on public.bookings(mcn_organization_id,completed_at) where mcn_organization_id is not null and status='completed';
create index bookings_mcn_created_idx on public.bookings(mcn_organization_id,created_at) where mcn_organization_id is not null;
create index mcn_commissions_completed_idx on public.mcn_commissions(organization_id,completed_at);
create index mcn_payouts_paid_idx on public.mcn_payouts(organization_id,paid_at);
create or replace function mcn_private.command_original(p_action text,p_input jsonb) returns jsonb
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
      case when changed='accepted' then jsonb_build_object('consentVersion','mcn-v1-fee20-2026-10-28','joinedAt',now(),'feeShareRate',(mcn_private.policy()->>'feeShareRate')::numeric,'totalFeeRate',0.2)
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

create or replace function mcn_private.hold_reason(p_commission uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when c.status <> 'held' then case c.status when 'paid' then 'Đã chi trả' when 'void' then 'Đã hủy hoa hồng' else 'Khoản phải thu hồi' end
    when o.status <> 'approved' or a.suspended_at is not null or not exists(select 1 from auth.users u where u.id=a.id and (u.banned_until is null or u.banned_until <= now())) then 'Network chưa hoạt động'
    when b.status <> 'completed' then 'Lịch chưa hoàn thành'
    when b.refunded_amount > 0 or exists(select 1 from public.wallet_entries w where w.booking_id = b.id and w.amount > 0 and w.kind in ('refund','adjustment')) then 'Lịch có hoàn phí, cần đối soát'
    when exists(select 1 from public.reports r where r.booking_id = b.id and r.status in ('open','reviewing')) then 'Đang xử lý khiếu nại'
    when c.available_at > now() then 'Đang giữ theo thời hạn của lịch'
    when not exists(select 1 from public.wallet_entries w where w.booking_id = b.id and w.kind = 'commission' and w.amount = -c.commission)
      or public.wallet_balance(c.pro_id) < 0 then 'Chờ KTV thanh toán đủ phí'
    when c.amount = 0 then 'Không phát sinh hoa hồng'
    else null end
  from public.mcn_commissions c join public.mcn_organizations o on o.id=c.organization_id
  join public.accounts a on a.id=o.owner_id join public.bookings b on b.id=c.booking_id
  where c.id=p_commission;
$$;

