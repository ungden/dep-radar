-- Staff issue capped vouchers through the existing voucher lifecycle.
create table partner_private.voucher_campaigns (
  code text primary key check (code ~ '^[A-Z0-9][A-Z0-9-]{4,19}$'),
  title text not null check (length(title) between 3 and 80),
  amount integer not null check (amount between 1000 and 5000000),
  min_total integer not null check (min_total >= amount),
  claim_limit integer not null check (claim_limit between 1 and 10000),
  claimed integer not null default 0 check (claimed between 0 and claim_limit),
  ends_at timestamptz not null,
  paused boolean not null default false,
  created_at timestamptz not null default now()
);
create table partner_private.voucher_campaign_claims (
  code text not null references partner_private.voucher_campaigns(code) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete cascade,
  voucher_id uuid not null unique references public.vouchers(id) on delete cascade,
  primary key(code,account_id)
);
alter table partner_private.voucher_campaigns enable row level security;
alter table partner_private.voucher_campaign_claims enable row level security;
revoke all on partner_private.voucher_campaigns,partner_private.voucher_campaign_claims from public,anon,authenticated;

create function partner_private.claim_campaign_voucher(p_code text) returns uuid
language plpgsql security definer set search_path='' as $$
declare campaign partner_private.voucher_campaigns; voucher uuid;
begin
  if auth.uid() is null or not exists(select 1 from public.accounts a where a.id=auth.uid() and a.suspended_at is null) then
    raise exception 'Bạn cần đăng nhập để nhận voucher.' using errcode='insufficient_privilege';
  end if;
  select * into campaign from partner_private.voucher_campaigns where code=upper(trim(p_code)) for update;
  select voucher_id into voucher from partner_private.voucher_campaign_claims c where c.code=campaign.code and c.account_id=auth.uid();
  if voucher is not null then return voucher; end if;
  if campaign.code is null or campaign.paused or campaign.ends_at<=now() or campaign.claimed>=campaign.claim_limit then
    raise exception 'Mã ưu đãi không khả dụng hoặc đã hết lượt.' using errcode='check_violation';
  end if;
  insert into public.vouchers(account_id,amount,min_total,expires_at,source,note)
    values(auth.uid(),campaign.amount,campaign.min_total,campaign.ends_at,'admin',campaign.title) returning id into voucher;
  insert into partner_private.voucher_campaign_claims(code,account_id,voucher_id) values(campaign.code,auth.uid(),voucher);
  update partner_private.voucher_campaigns set claimed=claimed+1 where code=campaign.code;
  return voucher;
end $$;

create function partner_private.admin_voucher_campaign(p_action text,p_input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c text:=upper(trim(p_input->>'code'));
begin
  perform public.require_admin();
  if p_action='read' then
    return (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]') from (
      select * from partner_private.voucher_campaigns order by created_at desc limit 100) x);
  elsif p_action='create' then
    if not coalesce((p_input->>'endsAt')::timestamptz between now()+interval '1 hour' and now()+interval '180 days',false) then
      raise exception 'Hạn voucher phải từ 1 giờ đến 180 ngày kể từ bây giờ.' using errcode='check_violation';
    end if;
    insert into partner_private.voucher_campaigns(code,title,amount,min_total,claim_limit,ends_at,paused)
      values(c,trim(p_input->>'title'),(p_input->>'amount')::int,(p_input->>'minTotal')::int,(p_input->>'limit')::int,(p_input->>'endsAt')::timestamptz,true);
  elsif p_action in ('pause','resume') then
    update partner_private.voucher_campaigns set paused=(p_action='pause')
      where code=c and (p_action='pause' or (ends_at>now() and claimed<claim_limit));
    if not found then raise exception 'Không tìm thấy chiến dịch còn hiệu lực.' using errcode='check_violation'; end if;
  else
    raise exception 'Thao tác không hợp lệ.' using errcode='check_violation';
  end if;
  perform public.log_admin_action('voucher_campaign:'||p_action,null,jsonb_build_object('code',c));
  return '{}'::jsonb;
end $$;

create function public.claim_campaign_voucher(p_code text) returns uuid
language sql security invoker set search_path='' as $$ select partner_private.claim_campaign_voucher(p_code) $$;
create function public.admin_voucher_campaign(p_action text,p_input jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$ select partner_private.admin_voucher_campaign(p_action,p_input) $$;
revoke all on function public.claim_campaign_voucher(text),partner_private.claim_campaign_voucher(text),
  public.admin_voucher_campaign(text,jsonb),partner_private.admin_voucher_campaign(text,jsonb) from public,anon,authenticated;
grant execute on function public.claim_campaign_voucher(text),partner_private.claim_campaign_voucher(text),
  public.admin_voucher_campaign(text,jsonb),partner_private.admin_voucher_campaign(text,jsonb) to authenticated;
