-- Messaging. The tables were there from the start; nothing used them.
--
-- A thread is between one customer and one freelancer. Opening one needs a
-- reason: either a booking they share, or the customer asking a published
-- freelancer a question before booking. Without that rule the inbox becomes a
-- channel for anyone to message any freelancer.

-- Realtime pushes new messages to the other side without polling.
alter publication supabase_realtime add table public.messages;

-- Updating the thread's timestamp keeps the inbox in a sensible order without
-- the client having to remember to do it.
create function public.touch_thread() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end $$;

create trigger message_touches_thread
  after insert on public.messages
  for each row execute function public.touch_thread();

/**
 * Find or open the thread between the caller and the other party. Returns the
 * thread id. A customer may open one with any published freelancer; a freelancer
 * may only reply inside a thread that already exists, or open one about a
 * booking they share.
 */
create function public.open_thread(p_pro uuid, p_booking uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  customer uuid;
  pro record;
  existing uuid;
  new_id uuid;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;

  select * into pro from public.pros where id = p_pro;
  if pro is null then raise exception 'Không tìm thấy chuyên viên.' using errcode = 'no_data_found'; end if;

  if me = p_pro then
    raise exception 'Không thể tự nhắn tin cho mình.' using errcode = 'check_violation';
  end if;
  customer := me;

  -- A freelancer opening a thread must have a booking with that customer.
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

  -- One thread per pair per booking; the general thread has a null booking.
  select id into existing from public.threads
  where pro_id = p_pro and customer_id = customer
    and booking_id is not distinct from p_booking;
  if existing is not null then return existing; end if;

  insert into public.threads (customer_id, pro_id, booking_id)
  values (customer, p_pro, p_booking)
  returning id into new_id;
  return new_id;
end $$;

-- A freelancer has to be able to reply, so they may insert the thread row too
-- when it is about a booking of theirs -- open_thread() is the only path, and it
-- checks that.
create policy "pro opens thread about own booking" on public.threads
  for insert with check (pro_id = auth.uid());

grant execute on function public.open_thread(uuid, uuid) to authenticated;
