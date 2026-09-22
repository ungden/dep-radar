-- Close the account-deletion escape hatch in the column guards.
--
-- 20260919111530 let delete_my_account() anonymise a row by skipping the guards
-- whenever the NEW row carried the anonymised values ('Người dùng đã xoá', '' and
-- a null avatar). Those are values any client can send. One update carrying them
-- plus is_admin = true made the caller an admin; the same trick on pros handed a
-- freelancer the verified badge, any rating, and a way out of a suspension.
--
-- Two fixes, each enough on its own:
--   1. Column privileges. A client may only write the columns the app actually
--      edits. is_admin, phone, the metrics, the verification and the suspension
--      are not among them, so the API refuses the update outright.
--   2. The guards now recognise deletion by who is running, not by what the row
--      says: delete_my_account() sets a transaction-local flag naming the account
--      it is deleting, and nothing a client can call sets that flag.

-- 1. Column privileges ---------------------------------------------------------

-- Anonymous callers never write profiles. RLS already stopped them (no auth.uid()
-- matches a row), but they should not hold the privilege in the first place.
revoke insert, update, delete on public.accounts from anon;
revoke insert, update, delete on public.pros from anon;

-- A column grant only narrows anything once the table-wide grant is gone.
revoke update on public.accounts from authenticated;
grant update (full_name, avatar_path, active_role) on public.accounts to authenticated;

revoke update on public.pros from authenticated;
grant update (
  display_name, title, bio, highlights, categories, city, district, lat, lng, areas,
  home_service, studio_address, max_travel_km, buffer_min, max_jobs_per_day, years_exp,
  accepting_jobs, published, avatar_path
) on public.pros to authenticated;

-- 2. Guards --------------------------------------------------------------------

-- current_setting(..., true) is null when the flag was never set and '' once a
-- transaction that set it has ended, so both collapse to "not deleting".
create or replace function public.guard_account_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare deleting boolean := coalesce(current_setting('app.deleting_account', true), '') = old.id::text;
begin
  if not public.is_privileged() then
    new.id := old.id;
    new.created_at := old.created_at;
    new.is_admin := old.is_admin;
    if not deleting then
      new.phone := old.phone;            -- changing a phone means re-verifying it
    end if;
  end if;
  return new;
end $$;

create or replace function public.guard_pro_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare deleting boolean := coalesce(current_setting('app.deleting_account', true), '') = old.id::text;
begin
  -- delete_my_account() writes the tombstone itself; nothing below applies to it.
  if deleting then
    return new;
  end if;
  if not public.is_privileged() then
    new.identity_status := old.identity_status;
    new.identity_name := old.identity_name;
    new.suspended_at := old.suspended_at;
    new.completed_jobs := old.completed_jobs;
    new.response_minutes := old.response_minutes;
    new.rating_avg := old.rating_avg;
    new.rating_count := old.rating_count;
    new.slug := old.slug;
    if new.published and not old.published then
      if not exists (select 1 from public.pro_services s where s.pro_id = new.id and s.active)
         or not exists (select 1 from public.working_hours w where w.pro_id = new.id)
         or not exists (select 1 from public.works k where k.pro_id = new.id) then
        raise exception 'Cần ít nhất 1 dịch vụ, giờ làm việc và 1 ảnh tác phẩm trước khi mở hồ sơ.'
          using errcode = 'check_violation';
      end if;
    end if;
  end if;
  -- A verified freelancer is shown under the name on their ID card.
  if coalesce(new.identity_name, '') <> '' and new.identity_status = 'verified' then
    new.display_name := new.identity_name;
  end if;
  if coalesce(new.display_name, '') = '' then
    new.display_name := old.display_name;
  end if;
  return new;
end $$;

-- Same body as 20260919111530, with two changes:
--   * the flag above, set right after the checks;
--   * no `delete from storage.objects`. Supabase refuses direct deletes on the
--     storage tables ("Use the Storage API instead"), so that one line made the
--     whole function fail and nobody could delete their account. The files are
--     removed through the Storage API by deleteAccount() in lib/api/me.ts, after
--     this function has succeeded.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  perform 1 from public.accounts where id = me for update;
  if exists (select 1 from public.bookings where (customer_id = me or pro_id = me) and status in ('pending', 'confirmed', 'in_progress')) then
    raise exception 'Bạn còn lịch hẹn chưa hoàn tất.' using errcode = 'check_violation';
  end if;

  -- Transaction-local: gone at commit, and only this function sets it.
  perform set_config('app.deleting_account', me::text, true);

  delete from public.addresses where account_id = me;
  delete from public.saved_works where account_id = me;
  delete from public.follows where account_id = me;
  delete from public.notifications where account_id = me;
  delete from public.jobs where customer_id = me;
  delete from public.works where pro_id = me;
  delete from public.days_off where pro_id = me;
  delete from public.working_hours where pro_id = me;
  delete from public.pro_service_prices where pro_id = me;
  delete from public.pro_services where pro_id = me;
  delete from public.identity_checks where pro_id = me;

  update public.messages set image_paths = '{}' where sender_id = me;
  update public.threads set customer_name = 'Người dùng đã xoá' where customer_id = me;
  update public.reviews set author_name = 'Người dùng đã xoá', photo_paths = '{}' where customer_id = me;
  update public.pros set display_name = 'Chuyên viên đã rời nền tảng', published = false,
    suspended_at = now(), accepting_jobs = false, bio = '', avatar_path = null,
    identity_status = 'none', identity_name = null, studio_address = null,
    lat = null, lng = null, areas = '{}' where id = me;
  update public.accounts set full_name = 'Người dùng đã xoá', phone = '', avatar_path = null where id = me;

  delete from auth.sessions where user_id = me;
  delete from auth.identities where user_id = me;
  update auth.users set phone = null, email = null, encrypted_password = null,
    raw_user_meta_data = '{}'::jsonb, banned_until = 'infinity' where id = me;

  perform set_config('app.deleting_account', '', true);
end $$;

-- 3. Chat images ---------------------------------------------------------------

-- The path check was written '\\.' inside a standard string, which Postgres reads
-- as a literal backslash followed by any character. No real path contains a
-- backslash, so every message with a photo was refused. One backslash, a dot.
create or replace function public.send_message(p_thread uuid, p_body text default '', p_image_paths text[] default '{}') returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); thread_row public.threads;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into thread_row from public.threads where id = p_thread for share;
  if thread_row is null or me not in (thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
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

-- `create or replace` keeps existing grants, but name them anyway: this file is
-- also what a fresh database runs, and the privilege test reads the result.
revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
revoke all on function public.send_message(uuid, text, text[]) from public, anon, authenticated;
grant execute on function public.send_message(uuid, text, text[]) to authenticated;
revoke all on function public.guard_account_update(), public.guard_pro_update() from public, anon, authenticated;
