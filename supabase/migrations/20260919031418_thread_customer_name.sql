-- A freelancer answering a message saw "Người dùng" instead of a name: the name
-- lives in `accounts`, and a thread alone does not entitle them to that row --
-- only a shared booking does, because the row also carries the phone number.
--
-- Third time this pattern has bitten, so the same fix: the name the other side
-- may see is snapshotted onto the thread. The phone number stays where it is,
-- released only once a job is accepted.

alter table public.threads add column customer_name text not null default 'Khách hàng';

update public.threads t
set customer_name = coalesce(nullif(a.full_name, ''), 'Khách hàng')
from public.accounts a
where a.id = t.customer_id;

create or replace function public.open_thread(p_pro uuid, p_booking uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  customer uuid;
  pro record;
  existing uuid;
  new_id uuid;
  who text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;

  select * into pro from public.pros where id = p_pro;
  if pro is null then raise exception 'Không tìm thấy chuyên viên.' using errcode = 'no_data_found'; end if;

  if me = p_pro then
    raise exception 'Không thể tự nhắn tin cho mình.' using errcode = 'check_violation';
  end if;
  customer := me;

  if exists (select 1 from public.pros where id = me) and p_booking is not null then
    select customer_id into customer from public.bookings where id = p_booking and pro_id = me;
    if customer is null then
      raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
    end if;
  elsif not pro.published and p_booking is null then
    raise exception 'Chuyên viên chưa mở hồ sơ.' using errcode = 'check_violation';
  end if;

  if p_booking is not null and not exists (
    select 1 from public.bookings
    where id = p_booking and pro_id = p_pro and customer_id = customer
  ) then
    raise exception 'Lịch hẹn không thuộc hai người này.' using errcode = 'check_violation';
  end if;

  select id into existing from public.threads
  where pro_id = p_pro and customer_id = customer
    and booking_id is not distinct from p_booking;
  if existing is not null then return existing; end if;

  select coalesce(nullif(full_name, ''), 'Khách hàng') into who from public.accounts where id = customer;

  insert into public.threads (customer_id, pro_id, booking_id, customer_name)
  values (customer, p_pro, p_booking, who)
  returning id into new_id;
  return new_id;
end $$;
