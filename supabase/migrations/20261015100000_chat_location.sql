-- Sending a location in a chat.
--
-- The customer shows the freelancer exactly where the door is (a lane, a
-- building gate), or the freelancer shows where they are waiting. A message
-- carries a point; the app draws it as a card that opens Google Maps.
--
-- The body still says it in words with a Maps link, so an app build from
-- before this change shows something useful, and so does the notification.
-- Only send_location() writes a point: a person sends their own position, on
-- purpose, inside an open chat -- the same rules as any message.

alter table public.messages
  add column lat double precision,
  add column lng double precision,
  add constraint messages_point_check check (
    (lat is null and lng is null)
    or (lat between -90 and 90 and lng between -180 and 180)
  );

-- The rules for sending anything, shared by send_message and send_location.
create function public.check_can_send(p_thread uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  thread_row public.threads;
  state text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into thread_row from public.threads where id = p_thread;
  if thread_row is null or me not in (thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if public.blocked_between(thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không thể nhắn tin với tài khoản này.' using errcode = 'check_violation';
  end if;
  state := public.chat_status(thread_row);
  if state = 'waiting' then
    raise exception 'Nhắn tin mở khi người làm nhận lịch.' using errcode = 'check_violation';
  elsif state <> 'open' then
    raise exception 'Lịch hẹn đã kết thúc, cuộc trò chuyện đã đóng.' using errcode = 'check_violation';
  end if;
end $$;

revoke all on function public.check_can_send(uuid) from public, anon, authenticated;

/**
 * Send a point. Rounded to 5 decimals (about a metre): more is noise from the
 * phone, and it is all the other side needs to find the door. The body is the
 * words and link an older app shows; lib/chat-location.ts writes the same.
 */
create function public.send_location(p_thread uuid, p_lat double precision, p_lng double precision) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  v_lat double precision := round(p_lat::numeric, 5);
  v_lng double precision := round(p_lng::numeric, 5);
  new_id uuid;
begin
  perform 1 from public.threads where id = p_thread for share;
  perform public.check_can_send(p_thread);
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Vị trí không hợp lệ.' using errcode = 'check_violation';
  end if;
  insert into public.messages (thread_id, sender_id, body, lat, lng)
  values (
    p_thread, me,
    'Vị trí: https://www.google.com/maps/search/?api=1&query=' || v_lat::text || ',' || v_lng::text,
    v_lat, v_lng
  )
  returning id into new_id;
  return new_id;
end $$;

revoke all on function public.send_location(uuid, double precision, double precision) from public, anon;
grant execute on function public.send_location(uuid, double precision, double precision) to authenticated;

-- Same as 20260926100000, the checks moved into check_can_send().
create or replace function public.send_message(p_thread uuid, p_body text default '', p_image_paths text[] default '{}') returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  v_body text := left(trim(coalesce(p_body, '')), 2000);
begin
  perform 1 from public.threads where id = p_thread for share;
  perform public.check_can_send(p_thread);
  if length(v_body) = 0 and coalesce(array_length(p_image_paths, 1), 0) = 0 then
    raise exception 'Nhập tin nhắn.' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_image_paths, 1), 0) > 6
     or exists (select 1 from unnest(coalesce(p_image_paths, '{}')) path where path !~ ('^' || me::text || '/[0-9a-f-]+\.jpg$')) then
    raise exception 'Ảnh chat không hợp lệ.' using errcode = 'check_violation';
  end if;
  insert into public.messages (thread_id, sender_id, body, image_paths)
  values (p_thread, me, v_body, coalesce(p_image_paths, '{}'));
  return false;
end $$;

-- Same as 20260925100000, with a location said as one.
create or replace function public.notify_new_message() returns trigger
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
          case when new.lat is not null then 'Đã gửi vị trí' when new.body = '' then '[Ảnh]' else left(new.body, 120) end, v_link);
  return new;
end $$;

-- A deleted account's positions go with its photos. delete_my_account() clears
-- the sender's image_paths while app.deleting_account names them; the point
-- and the link in the body are cleared on that same update.
create function public.forget_deleted_location() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.lat is not null and current_setting('app.deleting_account', true) = new.sender_id::text then
    new.lat := null;
    new.lng := null;
    new.body := 'Vị trí đã xoá';
  end if;
  return new;
end $$;

create trigger messages_forget_location before update on public.messages
  for each row execute function public.forget_deleted_location();

revoke all on function public.forget_deleted_location() from public, anon, authenticated;
