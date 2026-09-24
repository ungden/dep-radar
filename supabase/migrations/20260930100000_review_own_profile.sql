-- The first real run of the AI review (24/09/2026) went around it: the owner
-- is an admin, is_privileged() is true for admins, and so publishing their own
-- partner profile made it 'approved' at once, with no AI and no log.
--
-- Your own profile now goes through the review whoever you are, and an admin
-- publishing someone else's profile directly leaves a row in the log.
--
-- Same as 20260929100000 otherwise.

create or replace function public.guard_pro_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  deleting boolean := coalesce(current_setting('app.deleting_account', true), '') = old.id::text;
  system boolean := coalesce(current_setting('app.system_write', true), '') = 'on';
begin
  -- delete_my_account() writes the tombstone itself; nothing below applies to it.
  if deleting or system then
    return new;
  end if;
  -- Your own profile is a partner's profile, admin or not: an admin who is
  -- also a partner goes through the same review, and it is logged.
  if not public.is_privileged() or (select auth.uid()) = old.id then
    new.identity_status := old.identity_status;
    new.identity_name := old.identity_name;
    new.adult := old.adult;
    new.birth_year := old.birth_year;
    new.suspended_at := old.suspended_at;
    new.completed_jobs := old.completed_jobs;
    new.response_minutes := old.response_minutes;
    new.rating_avg := old.rating_avg;
    new.rating_count := old.rating_count;
    new.slug := old.slug;
    new.review_status := old.review_status;
    new.review_note := old.review_note;
    new.review_requested_at := old.review_requested_at;
    new.reviewed_at := old.reviewed_at;
    if new.published and not old.published then
      if not exists (select 1 from public.pro_services s where s.pro_id = new.id and s.active)
         or not exists (select 1 from public.working_hours w where w.pro_id = new.id)
         or not exists (select 1 from public.works k where k.pro_id = new.id and k.hidden_at is null) then
        raise exception 'Cần ít nhất 1 dịch vụ, giờ làm việc và 1 ảnh tác phẩm trước khi mở hồ sơ.'
          using errcode = 'check_violation';
      end if;
      if old.review_status <> 'approved' then
        new.published := false;
        new.review_status := 'pending';
        new.review_requested_at := now();
      end if;
    end if;
    if new.accepting_jobs and not old.accepting_jobs and public.wallet_below_floor(new.id) then
      raise exception 'Thanh toán phí của đơn trước để nhận lịch mới.' using errcode = 'check_violation';
    end if;
  elsif new.published and not old.published
        and new.review_status is not distinct from old.review_status and old.review_status <> 'approved' then
    new.review_status := 'approved';
    new.reviewed_at := coalesce(new.reviewed_at, now());
    -- An admin publishing someone's profile directly is a decision too.
    if (select auth.uid()) is not null then
      insert into public.ai_decisions (subject, pro_id, decision, reasons, summary, model, input)
      values ('pro_profile', new.id, 'approved', '{}', 'Admin mở hồ sơ trực tiếp, không qua AI.', 'admin',
              jsonb_build_object('admin', (select auth.uid())));
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
