-- Model work is for adults.
--
-- The identity check already reads the CCCD, and the card carries a date of
-- birth. /api/identity now reads it too, works out whether the person is 18 or
-- over on the day of the check, and stores exactly two facts: that answer, and
-- the year of birth. Not the date: a full date of birth next to a verified name
-- is an identity-theft kit, and nothing here needs it.
--
--  * adult is null until a card has been read for it (profiles verified before
--    this change). Null counts as "no" everywhere; such a freelancer can run the
--    check again from the studio to have their age read.
--  * birth_year is kept so a 17-year-old's "no" can be revisited later, and so an
--    admin can see why without re-reading anyone's card.
--
-- Both are the platform's to write, like identity_status: the column grants from
-- 20260922092824 do not include them, and the guards below reset them.

alter table public.pros
  add column adult boolean,
  add column birth_year smallint check (birth_year between 1900 and 2100);

-- Same as 20260918060000, plus the two new columns.
create or replace function public.guard_pro_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.identity_status := 'none';
  new.identity_name := null;
  new.adult := null;
  new.birth_year := null;
  new.suspended_at := null;
  new.completed_jobs := 0;
  new.response_minutes := 0;
  new.rating_avg := 0;
  new.rating_count := 0;
  new.published := false;
  if coalesce(new.display_name, '') = '' then
    select coalesce(nullif(full_name, ''), 'Chuyên viên') into new.display_name
      from public.accounts where id = new.id;
  end if;
  return new;
end $$;

-- Same as 20260923100200, with "verified" now meaning "verified and 18 or over".
create or replace function public.check_listing_allowed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare tpl record; pro record;
begin
  select category, studio_only, requires_verification into tpl
    from public.service_templates where id = new.template_id;
  select studio_address, categories, identity_status, adult into pro from public.pros where id = new.pro_id;
  if tpl.studio_only and coalesce(pro.studio_address, '') = '' then
    raise exception 'Dịch vụ này chỉ làm tại studio, hồ sơ chưa có địa chỉ studio'
      using errcode = 'check_violation';
  end if;
  if not (tpl.category = any (pro.categories)) then
    raise exception 'Dịch vụ ngoài chuyên môn đã khai của bạn' using errcode = 'check_violation';
  end if;
  -- Switching a listing off must stay possible whatever the badge says.
  if tpl.requires_verification and new.active
     and not (pro.identity_status = 'verified' and coalesce(pro.adult, false)) then
    raise exception 'Dịch vụ người mẫu chỉ dành cho tài khoản đã xác minh và đủ 18 tuổi.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

revoke all on function public.guard_pro_insert(), public.check_listing_allowed() from public, anon, authenticated;
