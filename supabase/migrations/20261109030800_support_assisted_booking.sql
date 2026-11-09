-- A support agent can quote and place a single-visit cash appointment with
-- the customer's consent, using only a saved address owned by that customer.
create table partner_private.assisted_bookings (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  staff_id uuid references public.accounts(id) on delete set null,
  consent_note text not null check (length(consent_note) between 12 and 240),
  created_at timestamptz not null default now()
);
alter table partner_private.assisted_bookings enable row level security;
revoke all on partner_private.assisted_bookings from public, anon, authenticated;

create function partner_private.support_assisted_booking(p_action text,p_customer uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  staff uuid := auth.uid();
  old_sub text := coalesce(current_setting('request.jwt.claim.sub',true),'');
  old_claims text := coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}');
  consent text := trim(coalesce(p_input->>'consent',''));
  target public.pros;
  booking uuid;
  items jsonb;
  at_ timestamptz;
  home boolean;
  address_id uuid;
  result jsonb;
begin
  if not partner_private.support_access() then
    raise exception 'Bạn không có quyền đặt lịch hộ.' using errcode='insufficient_privilege';
  end if;
  if p_customer is null or p_customer=staff or not exists (select 1 from public.accounts a join auth.users u on u.id=a.id where a.id=p_customer and a.suspended_at is null and (u.banned_until is null or u.banned_until <= now())) then
    raise exception 'Tài khoản khách không hợp lệ.' using errcode='check_violation';
  end if;
  if p_action='options' then
    select * into target from public.pros p where p.slug=lower(trim(p_input->>'slug')) and p.published and p.accepting_jobs and p.suspended_at is null;
    return jsonb_build_object(
      'addresses',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'label',a.label,'district',a.district,'city',a.city) order by a.is_default desc,a.created_at desc),'[]')
        from public.addresses a where a.account_id=p_customer and a.lat is not null and a.lng is not null),
      'pro',case when target.id is not null then jsonb_build_object('id',target.id,'name',target.display_name,'kind',target.kind,'home',target.home_service) end,
      'services',(select coalesce(jsonb_agg(jsonb_build_object('template',t.id,'variant',v.id,'label',t.name||' · '||v.label) order by t.name,v.label),'[]')
        from public.pro_services s join public.service_templates t on t.id=s.template_id
        join public.service_variants v on v.template_id=t.id
        where s.pro_id=target.id and s.active and not t.addon_only and v.sessions=1
          and public.listed_price(s.pro_id,t.id,v.id) is not null));
  end if;
  if p_action not in ('quote','place') then raise exception 'Thao tác không hợp lệ.' using errcode='check_violation'; end if;
  home := coalesce((p_input->>'home')::boolean,false);
  address_id := nullif(p_input->>'address','')::uuid;
  if home and not exists(select 1 from public.addresses a where a.id=address_id and a.account_id=p_customer) then
    raise exception 'Chọn một địa chỉ đã lưu của khách.' using errcode='check_violation';
  end if;
  at_ := (p_input->>'startsAt')::timestamptz;
  if at_ is null then raise exception 'Chọn ngày và giờ.' using errcode='check_violation'; end if;
  items := jsonb_build_array(jsonb_build_object('template',p_input->>'template','variant',p_input->>'variant','quantity',1));
  if p_action='place' and (jsonb_typeof(p_input->'approved') is distinct from 'boolean' or p_input->>'approved'<>'true'
    or length(consent) not between 12 and 240 or p_input->>'total' is null or p_input->>'operation' is null) then
    raise exception 'Cần khách đồng ý thời gian, địa điểm, tổng tiền và ghi lại cách xác nhận.' using errcode='check_violation';
  end if;

  -- Substitute the verified subject only while running the existing booking
  -- checks. Restore both JWT settings before any staff side effect.
  begin
    perform set_config('request.jwt.claim.sub',p_customer::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',p_customer,'role','authenticated')::text,true);
    if p_action='quote' then
      result := public.cart_quote((p_input->>'pro')::uuid,items,at_,home,address_id);
    else
      booking := partner_private.create_cart_booking_once((p_input->>'operation')::uuid,(p_input->>'pro')::uuid,items,at_,home,address_id,
        'Đặt qua hỗ trợ 360đẹp','cash',(p_input->>'total')::int,'{}');
      result := jsonb_build_object('id',booking);
    end if;
    perform set_config('request.jwt.claim.sub',old_sub,true);
    perform set_config('request.jwt.claims',old_claims,true);
  exception when others then
    -- The nested transaction rolls back both settings and any writes.
    raise;
  end;

  if booking is not null then
    insert into partner_private.assisted_bookings(booking_id,staff_id,consent_note)
      values(booking,staff,consent) on conflict do nothing;
    if found then
      perform public.log_admin_action('booking_assisted',booking,jsonb_build_object('customer',p_customer));
      perform public.notify(p_customer,'booking_assisted','360đẹp đã gửi lịch theo yêu cầu của bạn',
        'Mở Lịch hẹn để kiểm tra chi tiết.','/bookings/'||booking);
    end if;
  end if;
  return result;
end $$;

create function public.support_assisted_booking(p_action text,p_customer uuid,p_input jsonb default '{}')
returns jsonb language sql security invoker set search_path = '' as $$
  select partner_private.support_assisted_booking(p_action,p_customer,p_input)
$$;
revoke all on function partner_private.support_assisted_booking(text,uuid,jsonb),public.support_assisted_booking(text,uuid,jsonb)
  from public,anon,authenticated;
grant execute on function partner_private.support_assisted_booking(text,uuid,jsonb),public.support_assisted_booking(text,uuid,jsonb) to authenticated;
