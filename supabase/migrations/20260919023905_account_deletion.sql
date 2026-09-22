-- Deleting your own account, which Decree 13/2023 says a person must be able to
-- do. A client cannot delete an auth user, so this runs as the definer and
-- checks that the caller is deleting themselves and nobody else.
--
-- What survives: completed bookings and the reviews on them, with the person's
-- name replaced. A freelancer's rating is built from real jobs, so erasing the
-- history would quietly change everyone else's numbers -- and the other party to
-- a finished job keeps their own record of it either way.

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege';
  end if;
  if exists (
    select 1 from public.bookings
    where (customer_id = me or pro_id = me) and status in ('pending', 'confirmed', 'in_progress')
  ) then
    raise exception 'Bạn còn lịch hẹn chưa hoàn tất.' using errcode = 'check_violation';
  end if;

  -- Anything that is only about this person goes.
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

  -- A finished job is also the other party's record, so the row stays and the
  -- name on it becomes anonymous.
  update public.reviews set author_name = 'Người dùng đã xoá' where customer_id = me;
  update public.pros set display_name = 'Chuyên viên đã rời nền tảng', published = false,
                         suspended_at = now(), accepting_jobs = false, bio = '', avatar_path = null
    where id = me;

  update public.accounts set full_name = 'Người dùng đã xoá', phone = '', avatar_path = null where id = me;

  -- Cut the login. The accounts row is kept so finished bookings still resolve;
  -- it no longer carries a name or a number.
  delete from auth.identities where user_id = me;
  update auth.users
    set phone = null, email = null, encrypted_password = null,
        raw_user_meta_data = '{}'::jsonb, banned_until = 'infinity'
    where id = me;
end $$;

grant execute on function public.delete_my_account() to authenticated;
