-- Busy time that is not a booking.
--
-- A freelancer's week has more in it than 360dep: a class, a job booked over the
-- phone, a doctor's appointment. Working hours are the week's shape and days off
-- take out whole days; neither can say "Thursday 14:00-16:30, busy". Without that
-- the only options were to switch accepting_jobs off for everyone, or to decline
-- a booking the customer should never have been offered.
--
-- A block is treated exactly like a booking's busy time by availability_problem()
-- (20260924100400), so free_slots() and every booking path skip it. It is private:
-- a customer sees a slot missing, never why. Bookings already inside the window
-- stand; blocking time does not cancel anyone.

create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- Serves both the owner's list and the overlap test in availability_problem().
create index time_blocks_pro_idx on public.time_blocks (pro_id, starts_at);

alter table public.time_blocks enable row level security;

create policy "pro reads own time blocks" on public.time_blocks
  for select using (pro_id = (select auth.uid()) or (select public.is_admin()));
-- No write policies: add_time_block() and remove_time_block() hold the rules
-- (the 60-day horizon, the cap) that a check constraint cannot, since they
-- depend on now().

revoke all on public.time_blocks from anon, authenticated;
grant select on public.time_blocks to authenticated;
grant all on public.time_blocks to service_role;

create function public.add_time_block(p_starts_at timestamptz, p_ends_at timestamptz, p_note text default '')
returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); new_id uuid; v_note text := trim(coalesce(p_note, ''));
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  -- Serialises one freelancer's writes, so the cap below cannot be raced past.
  perform 1 from public.pros where id = me for update;
  if not found then
    raise exception 'Chỉ chuyên viên mới chặn lịch được.' using errcode = 'insufficient_privilege';
  end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'Giờ kết thúc phải sau giờ bắt đầu.' using errcode = 'check_violation';
  end if;
  if p_ends_at <= now() then
    raise exception 'Khung giờ này đã qua.' using errcode = 'check_violation';
  end if;
  -- Bookings are not taken that far out either; a block beyond it only clutters.
  if p_ends_at > now() + interval '60 days' then
    raise exception 'Chỉ chặn lịch trong vòng 60 ngày tới.' using errcode = 'check_violation';
  end if;
  if char_length(v_note) > 200 then
    raise exception 'Ghi chú tối đa 200 ký tự.' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.time_blocks where pro_id = me and ends_at > now()) >= 100 then
    raise exception 'Bạn đã có 100 khung giờ bận sắp tới. Xoá bớt rồi thêm tiếp nhé.' using errcode = 'check_violation';
  end if;

  insert into public.time_blocks (pro_id, starts_at, ends_at, note)
  values (me, p_starts_at, p_ends_at, v_note)
  returning id into new_id;
  return new_id;
end $$;

create function public.remove_time_block(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  delete from public.time_blocks where id = p_id and pro_id = auth.uid();
  if not found then
    raise exception 'Không tìm thấy khung giờ bận.' using errcode = 'no_data_found';
  end if;
end $$;

revoke all on function
  public.add_time_block(timestamptz, timestamptz, text),
  public.remove_time_block(uuid)
from public, anon, authenticated;
grant execute on function
  public.add_time_block(timestamptz, timestamptz, text),
  public.remove_time_block(uuid)
to authenticated;
