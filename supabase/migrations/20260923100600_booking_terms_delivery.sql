-- Photo & video changes what a booking is.
--
-- 1. Terms. Whether the pictures are for the customer's own use or will sell
--    something, and whether the freelancer may post the result as their work.
--    Both are the customer's to say, and both are fixed once the session starts.
-- 2. Delivery. A photo session is not finished when the freelancer leaves: the
--    customer is owed files. Completing the session starts a clock (the
--    service's delivery_days), the freelancer hands over a link, the customer
--    confirms they got it, and an overdue delivery is chased once.
-- 3. Combos. Makeup and photos at the same time and place are two bookings with
--    two freelancers. Linking them tells both sides they belong together. If one
--    falls through, the customer is told the other still stands and decides
--    themselves; nothing is cancelled on their behalf.

alter table public.bookings
  add column usage_scope text not null default 'personal' check (usage_scope in ('personal', 'commercial')),
  add column consent_repost boolean not null default false,
  add column booking_group_id uuid,
  add column delivery_due_at timestamptz,
  add column delivered_at timestamptz,
  add column delivery_url text check (delivery_url ~* '^https?://[^[:space:]]+$' and char_length(delivery_url) <= 500),
  add column delivery_note text check (char_length(delivery_note) <= 1000),
  add column delivery_accepted_at timestamptz;

create index bookings_group_idx on public.bookings (booking_group_id) where booking_group_id is not null;
create index bookings_delivery_due_idx on public.bookings (delivery_due_at)
  where delivered_at is null and delivery_due_at is not null;

-- 1. Terms ----------------------------------------------------------------------

create function public.set_booking_terms(p_booking uuid, p_usage_scope text, p_consent_repost boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status not in ('pending', 'confirmed') then
    raise exception 'Chỉ đổi được thoả thuận trước khi buổi làm bắt đầu.' using errcode = 'check_violation';
  end if;
  if p_usage_scope is null or p_usage_scope not in ('personal', 'commercial') then
    raise exception 'Mục đích sử dụng không hợp lệ.' using errcode = 'check_violation';
  end if;
  if b.usage_scope = p_usage_scope and b.consent_repost = coalesce(p_consent_repost, false) then
    return;
  end if;
  update public.bookings
    set usage_scope = p_usage_scope, consent_repost = coalesce(p_consent_repost, false)
    where id = b.id;
  -- The freelancer quoted for one use; if it changed, they should hear it from us.
  perform public.notify(b.pro_id, 'booking_terms', 'Khách cập nhật thoả thuận sử dụng ảnh',
    case when p_usage_scope = 'commercial' then 'Ảnh/clip sẽ dùng cho mục đích kinh doanh.'
         else 'Ảnh/clip chỉ dùng cá nhân.' end
    || case when coalesce(p_consent_repost, false) then ' Khách đồng ý cho bạn đăng lại làm tác phẩm.'
            else ' Khách chưa đồng ý cho đăng lại.' end,
    '/bookings/' || b.id);
end $$;

-- 2. Delivery -------------------------------------------------------------------

-- Same as 20260918040300, plus: the row is locked before it is read (as the other
-- transitions have been since 20260919111530), and a service that owes files
-- gets its due date.
create or replace function public.complete_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; days int; due timestamptz;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status not in ('confirmed', 'in_progress') then
    raise exception 'Job không ở trạng thái có thể hoàn thành.' using errcode = 'check_violation';
  end if;
  if now() < b.starts_at then
    raise exception 'Chưa tới giờ hẹn, không thể đánh dấu hoàn thành.' using errcode = 'check_violation';
  end if;
  select delivery_days into days from public.service_templates where id = b.template_id;
  due := case when days is not null then now() + make_interval(days => days) end;
  update public.bookings set status = 'completed', completed_at = now(), delivery_due_at = due where id = p_booking;
  insert into public.wallet_entries (pro_id, booking_id, kind, amount, note)
  values (b.pro_id, b.id, 'commission', -b.commission, 'Hoa hồng job hoàn thành')
  on conflict (booking_id, kind) do nothing;
  perform public.notify(b.customer_id, 'booking_completed', 'Job đã hoàn thành',
    case when due is null then 'Đánh giá chuyên viên để giúp người sau chọn đúng.'
         else 'Ảnh/clip sẽ được giao trước ' || to_char(due at time zone public.app_timezone(), 'DD/MM') || '.' end,
    '/bookings/' || p_booking);
end $$;

create function public.deliver_booking(p_booking uuid, p_url text, p_note text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; days int; v_url text := trim(coalesce(p_url, ''));
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'pro');
  select delivery_days into days from public.service_templates where id = b.template_id;
  if days is null then
    raise exception 'Dịch vụ này không có bước giao file.' using errcode = 'check_violation';
  end if;
  if b.status <> 'completed' then
    raise exception 'Chỉ giao file sau khi buổi làm đã hoàn thành.' using errcode = 'check_violation';
  end if;
  if b.delivery_accepted_at is not null then
    raise exception 'Khách đã nhận file, không sửa được nữa.' using errcode = 'check_violation';
  end if;
  if v_url !~* '^https?://[^[:space:]/]+\.[^[:space:]]+$' or char_length(v_url) > 500 then
    raise exception 'Link giao file phải là một địa chỉ http:// hoặc https:// đầy đủ.' using errcode = 'check_violation';
  end if;
  -- A wrong link can be replaced until the customer confirms.
  update public.bookings
    set delivered_at = now(), delivery_url = v_url, delivery_note = left(trim(coalesce(p_note, '')), 1000)
    where id = b.id;
  perform public.notify(b.customer_id, 'booking_delivered', 'Ảnh/clip của bạn đã được giao',
    'Mở link kiểm tra, rồi bấm "Đã nhận" nhé.', '/bookings/' || b.id);
end $$;

create function public.accept_delivery(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'customer');
  if b.delivered_at is null then
    raise exception 'Chuyên viên chưa giao file.' using errcode = 'check_violation';
  end if;
  if b.delivery_accepted_at is not null then return; end if;
  update public.bookings set delivery_accepted_at = now() where id = b.id;
  perform public.notify(b.pro_id, 'delivery_accepted', 'Khách đã nhận file', '', '/bookings/' || b.id);
end $$;

-- Once per booking, like the reminders: the notification itself is the record
-- that it was sent.
create function public.remind_overdue_deliveries() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with due as (
    select b.id, b.pro_id
    from public.bookings b
    where b.status = 'completed'
      and b.delivered_at is null
      and b.delivery_due_at < now()
      and not exists (
        select 1 from public.notifications x
        where x.account_id = b.pro_id and x.kind = 'delivery_overdue' and x.link = '/bookings/' || b.id
      )
  ),
  sent as (
    insert into public.notifications (account_id, kind, title, body, link)
    select d.pro_id, 'delivery_overdue', 'Đã quá hạn giao file',
           'Khách đang chờ ảnh/clip. Giao ngay, hoặc nhắn khách để hẹn lại.', '/bookings/' || d.id
    from due d
    returning 1
  )
  select count(*) into n from sent;
  return n;
end $$;

-- 3. Combos ---------------------------------------------------------------------

create function public.link_bookings(p_bookings uuid[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); ids uuid[]; n int; spread interval; gid uuid := gen_random_uuid();
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select coalesce(array_agg(distinct x), '{}') into ids from unnest(coalesce(p_bookings, '{}')) x where x is not null;
  n := cardinality(ids);
  if n < 2 or n > 3 then
    raise exception 'Combo gồm 2 hoặc 3 lịch hẹn.' using errcode = 'check_violation';
  end if;
  -- Lock in a fixed order, so two overlapping requests cannot deadlock.
  perform 1 from public.bookings where id = any (ids) order by id for update;
  if (select count(*) from public.bookings where id = any (ids) and customer_id = me) <> n then
    raise exception 'Chỉ gộp được các lịch hẹn của chính bạn.' using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from public.bookings where id = any (ids) and status not in ('pending', 'confirmed')) then
    raise exception 'Chỉ gộp được lịch đang chờ hoặc đã xác nhận.' using errcode = 'check_violation';
  end if;
  select max(starts_at) - min(starts_at) into spread from public.bookings where id = any (ids);
  if spread > interval '60 minutes' then
    raise exception 'Các lịch trong combo phải bắt đầu cách nhau không quá 60 phút.' using errcode = 'check_violation';
  end if;
  -- A booking already in a combo may move into a bigger one, but not leave a
  -- live partner behind without the customer choosing to.
  if exists (
    select 1 from public.bookings o
    where o.booking_group_id in (
            select booking_group_id from public.bookings where id = any (ids) and booking_group_id is not null)
      and o.id <> all (ids)
      and o.status in ('pending', 'confirmed', 'in_progress')
  ) then
    raise exception 'Một lịch hẹn đã nằm trong combo khác.' using errcode = 'check_violation';
  end if;
  update public.bookings set booking_group_id = gid where id = any (ids);
  return gid;
end $$;

-- A trigger rather than a line in each RPC: bookings leave a combo through
-- cancel_booking, decline_booking, confirm_booking's late expiry and the cron.
create function public.notify_combo_break() returns trigger
language plpgsql security definer set search_path = '' as $$
declare other uuid;
begin
  if new.booking_group_id is null or new.status = old.status
     or new.status not in ('cancelled', 'declined', 'expired') then
    return new;
  end if;
  select id into other from public.bookings
    where booking_group_id = new.booking_group_id and id <> new.id and status in ('pending', 'confirmed')
    order by starts_at limit 1;
  if other is not null then
    perform public.notify(new.customer_id, 'combo_partial', 'Một lịch trong combo không còn',
      'Các lịch còn lại trong combo vẫn giữ nguyên. Giữ hay huỷ là do bạn quyết định.', '/bookings/' || other);
  end if;
  return new;
end $$;

create trigger bookings_combo_break
  after update of status on public.bookings
  for each row execute function public.notify_combo_break();

-- Schedule ----------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is not available here; schedules skipped';
    return;
  end if;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobname) from cron.job where jobname = 'dep360-delivery-overdue';
  -- Hourly: a freelancer past the delivery date hears about it, once.
  perform cron.schedule('dep360-delivery-overdue', '20 * * * *', 'select public.remind_overdue_deliveries()');
end $$;

-- Privileges --------------------------------------------------------------------

revoke all on function
  public.set_booking_terms(uuid, text, boolean),
  public.complete_booking(uuid),
  public.deliver_booking(uuid, text, text),
  public.accept_delivery(uuid),
  public.link_bookings(uuid[]),
  public.remind_overdue_deliveries(),
  public.notify_combo_break()
from public, anon, authenticated;

grant execute on function
  public.set_booking_terms(uuid, text, boolean),
  public.complete_booking(uuid),
  public.deliver_booking(uuid, text, text),
  public.accept_delivery(uuid),
  public.link_bookings(uuid[])
to authenticated;
