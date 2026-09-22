-- Sign-in with Google instead of a password.
--
-- Google hands over a name and an email, never a phone number. The phone number
-- is still what the product runs on (a freelancer calls the customer before
-- taking the job), so an account may now start without one, set it exactly once
-- through set_my_phone(), and cannot book, post a request or open a freelancer
-- profile until it has.

-- 1. A new account may arrive without a phone number ---------------------------

-- A number that is present must still be a real Vietnamese mobile number. Google
-- puts the display name in `full_name` and also `name`; either will do.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_given text := nullif(trim(coalesce(nullif(new.phone, ''), new.raw_user_meta_data ->> 'phone', '')), '');
  v_phone text := public.normalize_vn_phone(v_given);
  v_name text := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.raw_user_meta_data ->> 'name', '');
begin
  if v_given is not null and v_phone is null then
    raise exception 'Cần số điện thoại di động Việt Nam hợp lệ.' using errcode = 'check_violation';
  end if;
  insert into public.accounts (id, full_name, phone)
  values (new.id, left(trim(v_name), 80), coalesce(v_phone, ''))
  on conflict (id) do nothing;
  return new;
end $$;

-- 2. Setting the number, once ----------------------------------------------------

-- The column is not writable by clients (20260922092824) and the guard resets it,
-- so this function is the only way in. Like delete_my_account(), it tells the guard
-- what it is doing through a transaction-local flag nothing else sets.
create or replace function public.guard_account_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  deleting boolean := coalesce(current_setting('app.deleting_account', true), '') = old.id::text;
  setting_phone boolean := coalesce(current_setting('app.setting_phone', true), '') = old.id::text;
begin
  if not public.is_privileged() then
    new.id := old.id;
    new.created_at := old.created_at;
    new.is_admin := old.is_admin;
    if not deleting and not setting_phone then
      new.phone := old.phone;            -- changing a phone means re-verifying it
    end if;
  end if;
  return new;
end $$;

create function public.set_my_phone(p_phone text) returns text
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); v_phone text := public.normalize_vn_phone(p_phone); v_current text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  if v_phone is null then
    raise exception 'Số điện thoại không hợp lệ. Nhập số di động Việt Nam.' using errcode = 'check_violation';
  end if;
  select a.phone into v_current from public.accounts a where a.id = me for update;
  if v_current is null then raise exception 'Không tìm thấy tài khoản.' using errcode = 'no_data_found'; end if;
  if v_current = v_phone then return v_phone; end if;
  if v_current <> '' then
    raise exception 'Tài khoản đã có số điện thoại. Muốn đổi số, liên hệ hỗ trợ.' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.accounts a where a.phone = v_phone and a.id <> me) then
    raise exception 'Số điện thoại này đã thuộc một tài khoản khác.' using errcode = 'check_violation';
  end if;
  perform set_config('app.setting_phone', me::text, true);
  update public.accounts a set phone = v_phone where a.id = me;
  perform set_config('app.setting_phone', '', true);
  return v_phone;
exception when unique_violation then
  raise exception 'Số điện thoại này đã thuộc một tài khoản khác.' using errcode = 'check_violation';
end $$;

-- 3. No phone, no booking --------------------------------------------------------

-- Checked on the rows themselves, so every path that creates them is covered:
-- create_booking, accept_offer, post_job and becoming a freelancer.
create function public.require_phone() returns trigger
language plpgsql security definer set search_path = '' as $$
-- bookings and jobs name the customer; a pros row is the account itself. Read
-- through jsonb so one function serves all three shapes.
declare who uuid := coalesce((to_jsonb(new) ->> 'customer_id')::uuid, (to_jsonb(new) ->> 'id')::uuid);
begin
  if exists (select 1 from public.accounts a where a.id = who and a.phone = '') then
    raise exception 'Cần thêm số điện thoại vào tài khoản trước.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger bookings_require_phone before insert on public.bookings
  for each row execute function public.require_phone();
create trigger jobs_require_phone before insert on public.jobs
  for each row execute function public.require_phone();
create trigger pros_require_phone before insert on public.pros
  for each row execute function public.require_phone();

-- 4. What the password sign-in needed and nothing uses now ------------------------

drop function public.account_email_for_phone(text);

revoke all on function public.set_my_phone(text) from public, anon, authenticated;
grant execute on function public.set_my_phone(text) to authenticated;
revoke all on function public.require_phone() from public, anon, authenticated;
revoke all on function public.handle_new_user(), public.guard_account_update() from public, anon, authenticated;
