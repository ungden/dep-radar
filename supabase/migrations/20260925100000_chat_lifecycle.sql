-- Chat has a beginning and an end, the way Grab, Airbnb and TaskRabbit do it.
--
-- 1. Before a booking, a customer may ask a freelancer questions (Airbnb's
--    "inquiry"), but contact details are hidden until the two have a confirmed
--    booking or an accepted casting: phone numbers, e-mail addresses, links and
--    @handles become "[đã ẩn]". A deal taken to Zalo before it is booked leaves
--    both people without the reminders, the review and the no-show protection.
--    And until the freelancer answers, a customer can send three messages, not
--    thirty.
-- 2. A booking's chat closes on its own once there is nothing left to arrange:
--    72 hours after the job is done (or after the files are accepted), 72 hours
--    after a no-show (the dispute window), 24 hours after a cancellation,
--    decline or expiry. The history stays readable; the box to write in goes.
--    Anything after that is a new booking, or support.
-- 3. Every message now reaches the other person: a notification (and so a push),
--    one per conversation until they read it, not one per line.
-- 4. Photos sent in chat can be read by the two people in the thread (the app
--    signs them with the user's own session and was refused).
-- 5. Accepting a model for a casting call no longer opens a chat between two
--    people when one has blocked the other.
-- 6. Threads and notifications join the realtime publication, which the apps
--    already listen to.

-- 1. Contact details ---------------------------------------------------------------

-- Whether the two may exchange contact details: they have a booking that went
-- ahead, or the freelancer accepted this person for a casting call.
create function public.contact_allowed(p_customer uuid, p_pro uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bookings b
    where b.customer_id = p_customer and b.pro_id = p_pro
      and b.status in ('confirmed', 'in_progress', 'completed', 'no_show')
  ) or exists (
    select 1 from public.casting_applications a
    join public.castings c on c.id = a.casting_id
    where a.account_id = p_customer and c.pro_id = p_pro and a.status = 'accepted'
  )
$$;

-- Hides what would take the conversation off 360dep: e-mail addresses, links
-- (zalo.me/..., fb.com/..., www...), phone numbers written any common way
-- (0912 345 678, 0912.345.678, +84 912...), long runs of digits (bank
-- accounts) and @handles. Prices ("150.000 - 200.000") are left alone: a
-- phone number starts with 0 or 84 and is not the tail of another number.
create function public.mask_contact(p_body text) returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    coalesce(p_body, ''),
    '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', '[đã ẩn]', 'gi'),
    '(https?://[^[:space:]]+|www\.[^[:space:]]+|[a-z0-9-]+\.(com|vn|me|net|org|ly|io|app)\M(/[^[:space:]]*)?)', '[đã ẩn]', 'gi'),
    '(^|[^0-9.,])(\+?84|0)([ .-]?[0-9]){8,10}', '\1[đã ẩn]', 'g'),
    '[0-9]{9,}', '[đã ẩn]', 'g'),
    '(^|[[:space:]])@[a-z0-9._]{3,}', '\1[đã ẩn]', 'gi')
$$;

-- 2. When a conversation closes ------------------------------------------------------

-- Null while it is open for good. A PostgREST computed field: select `closes_at`
-- on threads and it comes back with each row.
create function public.closes_at(t public.threads) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select case
    when t.booking_id is null then null
    when b.status in ('pending', 'confirmed', 'in_progress') then null
    when b.status = 'completed' then
      case
        -- Files still owed: open until they are accepted, or a week past the due date.
        when b.delivery_due_at is not null and b.delivery_accepted_at is null then b.delivery_due_at + interval '7 days'
        else greatest(b.completed_at, coalesce(b.delivery_accepted_at, b.completed_at)) + interval '72 hours'
      end
    when b.status = 'no_show' then b.cancelled_at + interval '72 hours'
    else coalesce(b.cancelled_at, b.confirm_by, b.starts_at) + interval '24 hours'
  end
  from public.bookings b
  where b.id = t.booking_id
$$;

revoke all on function public.closes_at(public.threads) from public, anon;
grant execute on function public.closes_at(public.threads) to authenticated;

-- Same as 20260924100900, plus: a closed conversation takes no more messages,
-- contact details are hidden until they are allowed, and a customer who has not
-- had an answer yet can send three messages. Returns whether anything was hidden,
-- so the app can say so.
drop function public.send_message(uuid, text, text[]);
create function public.send_message(p_thread uuid, p_body text default '', p_image_paths text[] default '{}') returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  thread_row public.threads;
  v_body text := left(trim(coalesce(p_body, '')), 2000);
  masked text;
  ends timestamptz;
  waiting int;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into thread_row from public.threads where id = p_thread for share;
  if thread_row is null or me not in (thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if public.blocked_between(thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không thể nhắn tin với tài khoản này.' using errcode = 'check_violation';
  end if;
  ends := public.closes_at(thread_row);
  if ends is not null and now() >= ends then
    raise exception 'Cuộc trò chuyện này đã kết thúc. Đặt lịch mới hoặc liên hệ hỗ trợ nếu cần.' using errcode = 'check_violation';
  end if;
  if length(v_body) = 0 and coalesce(array_length(p_image_paths, 1), 0) = 0 then
    raise exception 'Nhập tin nhắn.' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_image_paths, 1), 0) > 6
     or exists (select 1 from unnest(coalesce(p_image_paths, '{}')) path where path !~ ('^' || me::text || '/[0-9a-f-]+\.jpg$')) then
    raise exception 'Ảnh chat không hợp lệ.' using errcode = 'check_violation';
  end if;

  -- A question before booking: three messages until the freelancer answers.
  if thread_row.booking_id is null and me = thread_row.customer_id
     and not exists (select 1 from public.messages m where m.thread_id = p_thread and m.sender_id = thread_row.pro_id) then
    select count(*) into waiting from public.messages m where m.thread_id = p_thread and m.sender_id = me;
    if waiting >= 3 then
      raise exception 'Bạn đã gửi 3 tin. Đợi người làm trả lời rồi nhắn tiếp nhé.' using errcode = 'check_violation';
    end if;
  end if;

  masked := case when public.contact_allowed(thread_row.customer_id, thread_row.pro_id) then v_body else public.mask_contact(v_body) end;
  insert into public.messages (thread_id, sender_id, body, image_paths)
  values (p_thread, me, masked, coalesce(p_image_paths, '{}'));
  return masked <> v_body;
end $$;

revoke all on function public.send_message(uuid, text, text[]) from public, anon;
grant execute on function public.send_message(uuid, text, text[]) to authenticated;

-- 3. A notification per conversation ---------------------------------------------------

create function public.notify_new_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t public.threads; recipient uuid; sender_name text; v_link text;
begin
  select * into t from public.threads where id = new.thread_id;
  recipient := case when new.sender_id = t.customer_id then t.pro_id else t.customer_id end;
  v_link := '/tin-nhan/' || t.id;
  -- One unread notification per conversation is enough to bring them back.
  if exists (
    select 1 from public.notifications n
    where n.account_id = recipient and n.kind = 'message_new' and n.link = v_link and n.read_at is null
  ) then
    return new;
  end if;
  sender_name := case
    when new.sender_id = t.pro_id then (select coalesce(nullif(display_name, ''), 'Người làm') from public.pros where id = t.pro_id)
    else t.customer_name
  end;
  insert into public.notifications (account_id, kind, title, body, link)
  values (recipient, 'message_new', 'Tin nhắn từ ' || coalesce(sender_name, '360dep'),
          case when new.body = '' then '[Ảnh]' else left(new.body, 120) end, v_link);
  return new;
end $$;

create trigger messages_notify after insert on public.messages
  for each row execute function public.notify_new_message();

-- Reading the conversation reads its notification too.
create or replace function public.mark_thread_read(p_thread uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  if not exists (select 1 from public.threads where id = p_thread and me in (customer_id, pro_id)) then
    return;
  end if;
  update public.messages set read_at = now()
    where thread_id = p_thread and sender_id <> me and read_at is null;
  update public.notifications set read_at = now()
    where account_id = me and kind = 'message_new' and link = '/tin-nhan/' || p_thread and read_at is null;
end $$;

-- 4. Chat photos are readable by the thread -------------------------------------------

create policy "thread parties read chat media" on storage.objects
  for select to authenticated using (
    bucket_id = 'chat' and exists (
      select 1 from public.messages m
      join public.threads t on t.id = m.thread_id
      where m.image_paths @> array[name]
        and (select auth.uid()) in (t.customer_id, t.pro_id)
    )
  );

create index if not exists messages_image_paths_idx on public.messages using gin (image_paths)
  where image_paths <> '{}';

-- 5. Castings respect blocks ---------------------------------------------------------

-- Same as 20260923100900, plus the block check before the two are put in a chat.
create or replace function public.decide_application(p_application uuid, p_accept boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); a public.casting_applications; c public.castings; thread uuid;
begin
  select * into a from public.casting_applications where id = p_application;
  if a is null then raise exception 'Không tìm thấy đơn ứng tuyển.' using errcode = 'no_data_found'; end if;
  select * into c from public.castings where id = a.casting_id for update;
  if c.pro_id is distinct from me then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  select * into a from public.casting_applications where id = p_application for update;
  if a.status <> 'pending' then
    raise exception 'Đơn này đã được xử lý.' using errcode = 'check_violation';
  end if;

  if not coalesce(p_accept, false) then
    update public.casting_applications set status = 'rejected', decided_at = now() where id = a.id;
    perform public.notify(a.account_id, 'casting_rejected', 'Tin tuyển mẫu: chưa phù hợp lần này',
      c.title, '/tuyen-mau/' || c.id);
    return null;
  end if;

  if public.blocked_between(a.account_id, c.pro_id) then
    raise exception 'Không thể chọn tài khoản này.' using errcode = 'check_violation';
  end if;
  if c.status <> 'open' or c.starts_at <= now() then
    raise exception 'Tin tuyển mẫu đã đóng.' using errcode = 'check_violation';
  end if;
  if c.accepted_count >= c.slots then
    raise exception 'Đã đủ số mẫu cần tuyển.' using errcode = 'check_violation';
  end if;
  update public.casting_applications set status = 'accepted', decided_at = now() where id = a.id;
  update public.castings set accepted_count = accepted_count + 1 where id = c.id;

  select id into thread from public.threads
    where customer_id = a.account_id and pro_id = c.pro_id and booking_id is null;
  if thread is null then
    insert into public.threads (customer_id, pro_id, booking_id, customer_name)
    values (a.account_id, c.pro_id, null, a.applicant_name)
    returning id into thread;
  end if;
  insert into public.messages (thread_id, sender_id, body)
  values (thread, me, format('Chào %s, mình đã chọn bạn làm mẫu cho "%s" lúc %s. Mình nhắn để hẹn chi tiết nhé.',
    a.applicant_name, c.title, to_char(c.starts_at at time zone public.app_timezone(), 'HH24:MI DD/MM')));

  perform public.notify(a.account_id, 'casting_accepted', 'Bạn đã được chọn làm mẫu', c.title,
    '/tin-nhan/' || thread);
  return thread;
end $$;

-- 6. Realtime ----------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
      alter publication supabase_realtime add table public.notifications;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'threads') then
      alter publication supabase_realtime add table public.threads;
    end if;
  end if;
end $$;

revoke all on function public.contact_allowed(uuid, uuid) from public, anon, authenticated;
revoke all on function public.mask_contact(text) from public, anon, authenticated;
revoke all on function public.notify_new_message() from public, anon, authenticated;
