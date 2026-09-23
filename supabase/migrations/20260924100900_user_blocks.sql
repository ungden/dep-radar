-- Blocking another account.
--
-- An app where strangers message each other has to let a person make someone
-- stop -- the App Store asks for it, and it is right. A block is one-sided to
-- create and two-sided in effect: once either has blocked the other, neither can
-- open a conversation or send a message. Only the blocker knows; the other side
-- sees the same refusal they would get for any account they cannot write to.
--
-- open_thread() is rewritten here for the check anyway, and the rewrite also
-- fixes its freelancer side, which could never open a chat (see below).

create table public.user_blocks (
  blocker uuid not null references public.accounts (id) on delete cascade,
  blocked uuid not null references public.accounts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

-- The primary key covers "who have I blocked"; this covers "who blocked me"
-- and the foreign key.
create index user_blocks_blocked_idx on public.user_blocks (blocked);

alter table public.user_blocks enable row level security;

-- Your own list only. Being blocked is not something the blocked side can read.
create policy "own blocks" on public.user_blocks
  for select using (blocker = (select auth.uid()));
-- Writes go through block_user() / unblock_user().

revoke all on public.user_blocks from anon, authenticated;
grant select on public.user_blocks to authenticated;
grant all on public.user_blocks to service_role;

-- Internal: has either of the two blocked the other?
create function public.blocked_between(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_blocks u
    where (u.blocker = p_a and u.blocked = p_b) or (u.blocker = p_b and u.blocked = p_a)
  )
$$;

create function public.block_user(p_account uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  if p_account is null or p_account = me then
    raise exception 'Không thể tự chặn chính mình.' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.accounts where id = p_account) then
    raise exception 'Không tìm thấy tài khoản.' using errcode = 'no_data_found';
  end if;
  insert into public.user_blocks (blocker, blocked) values (me, p_account)
  on conflict (blocker, blocked) do nothing;
end $$;

create function public.unblock_user(p_account uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  delete from public.user_blocks where blocker = auth.uid() and blocked = p_account;
end $$;

-- Same as 20260922092824, plus the block check.
create or replace function public.send_message(p_thread uuid, p_body text default '', p_image_paths text[] default '{}') returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); thread_row public.threads;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into thread_row from public.threads where id = p_thread for share;
  if thread_row is null or me not in (thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if public.blocked_between(thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không thể nhắn tin với tài khoản này.' using errcode = 'check_violation';
  end if;
  if length(trim(coalesce(p_body, ''))) = 0 and coalesce(array_length(p_image_paths, 1), 0) = 0 then
    raise exception 'Nhập tin nhắn.' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_image_paths, 1), 0) > 6
     or exists (select 1 from unnest(coalesce(p_image_paths, '{}')) path where path !~ ('^' || me::text || '/[0-9a-f-]+\.jpg$')) then
    raise exception 'Ảnh chat không hợp lệ.' using errcode = 'check_violation';
  end if;
  insert into public.messages (thread_id, sender_id, body, image_paths)
  values (p_thread, me, left(trim(coalesce(p_body, '')), 2000), coalesce(p_image_paths, '{}'));
end $$;

-- Same as 20260919031418, plus the block check once both sides are known, and
-- the freelancer's side fixed. The freelancer opening a chat about their own
-- booking passes themselves as p_pro -- the thread's freelancer is them -- and
-- that was refused as "messaging yourself" before the booking was even looked
-- at, so a freelancer could never start the conversation. The branch is now
-- chosen by the caller's role in *this* thread (p_pro = me), not by whether the
-- caller has a freelancer profile at all: that also stops a freelancer who books
-- another freelancer from being mistaken for the pro side of their own booking.
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

  if me = p_pro and p_booking is not null then
    -- The freelancer, about one of their own bookings: the other side is its customer.
    select customer_id into customer from public.bookings where id = p_booking and pro_id = me;
    if customer is null then
      raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
    end if;
  elsif me = p_pro then
    raise exception 'Không thể tự nhắn tin cho mình.' using errcode = 'check_violation';
  else
    customer := me;
    if not pro.published and p_booking is null then
      raise exception 'Chuyên viên chưa mở hồ sơ.' using errcode = 'check_violation';
    end if;
  end if;

  if p_booking is not null and not exists (
    select 1 from public.bookings
    where id = p_booking and pro_id = p_pro and customer_id = customer
  ) then
    raise exception 'Lịch hẹn không thuộc hai người này.' using errcode = 'check_violation';
  end if;

  if public.blocked_between(customer, p_pro) then
    raise exception 'Không thể nhắn tin với tài khoản này.' using errcode = 'check_violation';
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

revoke all on function public.blocked_between(uuid, uuid) from public, anon, authenticated;
revoke all on function
  public.block_user(uuid),
  public.unblock_user(uuid),
  public.send_message(uuid, text, text[]),
  public.open_thread(uuid, uuid)
from public, anon, authenticated;
grant execute on function
  public.block_user(uuid),
  public.unblock_user(uuid),
  public.send_message(uuid, text, text[]),
  public.open_thread(uuid, uuid)
to authenticated;
