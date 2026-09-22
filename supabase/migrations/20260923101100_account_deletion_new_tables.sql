-- Deleting an account has to reach the tables added for the new trades.
--
-- Same body as 20260922092824, plus: the model profile, the equipment line and
-- the interests go (they only describe this person); casting calls they posted
-- and applications they sent go, and a call they had been accepted on gets its
-- place back; and what freelancers wrote about them as a customer goes, because
-- it is only about them. What they wrote about others as a freelancer stays,
-- like any other record of a finished job.

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
  delete from public.model_profiles where pro_id = me;
  delete from public.customer_reviews where customer_id = me;

  update public.castings c set accepted_count = c.accepted_count - 1
    from public.casting_applications a
    where a.casting_id = c.id and a.account_id = me and a.status = 'accepted';
  delete from public.casting_applications where account_id = me;
  delete from public.castings where pro_id = me;

  update public.messages set image_paths = '{}' where sender_id = me;
  update public.threads set customer_name = 'Người dùng đã xoá' where customer_id = me;
  update public.reviews set author_name = 'Người dùng đã xoá', photo_paths = '{}' where customer_id = me;
  update public.pros set display_name = 'Chuyên viên đã rời nền tảng', published = false,
    suspended_at = now(), accepting_jobs = false, bio = '', avatar_path = null,
    identity_status = 'none', identity_name = null, studio_address = null,
    lat = null, lng = null, areas = '{}', equipment = null where id = me;
  update public.accounts set full_name = 'Người dùng đã xoá', phone = '', avatar_path = null, interests = '{}'
    where id = me;

  delete from auth.sessions where user_id = me;
  delete from auth.identities where user_id = me;
  update auth.users set phone = null, email = null, encrypted_password = null,
    raw_user_meta_data = '{}'::jsonb, banned_until = 'infinity' where id = me;

  perform set_config('app.deleting_account', '', true);
end $$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
