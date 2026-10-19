-- A person approves partner profiles; the AI only suggests (owner, 19/10/2026:
-- "hồ sơ đối tác mới chỉ hiện sau khi admin bấm Duyệt, AI chỉ gợi ý").
-- Replaces the profile half of 20260929100000. Posts are still checked by the
-- AI on their own, and reminders are still sent by it.
--
-- 1. apply_ai_profile_decision() only writes the AI's answer to the log, marked
--    as a suggestion. The profile stays 'pending' and the partner is not told.
-- 2. ai_profiles_to_review(): the pending profiles the AI has not answered for
--    since the partner last asked, so a suggestion is made once per request.
-- 3. admin_decide_profile(): the staff's decision, from /admin → "Duyệt hồ sơ".
--    Applied as the AI's used to be, written next to the AI's suggestion in the
--    log and to admin_actions, and the partner is told.
-- 4. The staff are told when a profile starts waiting.

-- 1 ---------------------------------------------------------------------------

create or replace function public.apply_ai_profile_decision(
  p_pro uuid, p_decision text, p_reasons text[], p_summary text, p_model text, p_input jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  p public.pros;
  log_id uuid;
  reasons text[] := coalesce(array_remove(p_reasons, ''), '{}');
begin
  if p_decision not in ('approved', 'changes_requested', 'rejected', 'skipped') then
    raise exception 'Quyết định không hợp lệ: %', p_decision using errcode = 'check_violation';
  end if;
  if p_decision in ('changes_requested', 'rejected') and cardinality(reasons) = 0 then
    raise exception 'Cần nêu lý do.' using errcode = 'check_violation';
  end if;
  select * into p from public.pros where id = p_pro;
  if p.id is null or p.review_status <> 'pending' then
    return null;
  end if;
  insert into public.ai_decisions (subject, pro_id, decision, reasons, summary, model, input)
  values ('pro_profile', p_pro, p_decision, reasons, coalesce(p_summary, ''), coalesce(nullif(p_model, ''), 'rules'),
          coalesce(p_input, '{}') || '{"suggestion": true}')
  returning id into log_id;
  return log_id;
end $$;

-- 2 ---------------------------------------------------------------------------

create function public.ai_profiles_to_review(p_limit int default 10)
returns setof uuid
language sql stable security definer set search_path = '' as $$
  select p.id
  from public.pros p
  where p.review_status = 'pending' and p.suspended_at is null
    and not exists (
      select 1 from public.ai_decisions d
      where d.pro_id = p.id and d.subject = 'pro_profile' and d.decision <> 'skipped'
        and d.created_at >= coalesce(p.review_requested_at, '-infinity')
    )
  order by p.review_requested_at nulls first
  limit greatest(coalesce(p_limit, 10), 0)
$$;

-- 3 ---------------------------------------------------------------------------

create function public.admin_decide_profile(p_pro uuid, p_decision text, p_note text default '')
returns void
language plpgsql security definer set search_path = '' as $$
declare
  p public.pros;
  s public.ai_decisions;
  note text := nullif(trim(coalesce(p_note, '')), '');
  uuid_re constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not public.is_admin() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if p_decision not in ('approved', 'changes_requested', 'rejected') then
    raise exception 'Quyết định không hợp lệ: %', p_decision using errcode = 'check_violation';
  end if;
  if p_decision <> 'approved' and note is null then
    raise exception 'Ghi lý do để đối tác biết cần sửa gì.' using errcode = 'check_violation';
  end if;
  select * into p from public.pros where id = p_pro for update;
  if p.id is null then
    raise exception 'Không tìm thấy hồ sơ.' using errcode = 'no_data_found';
  end if;
  if p.review_status <> 'pending' then
    raise exception 'Hồ sơ này không còn chờ duyệt (đối tác đã ẩn lại hoặc người khác đã duyệt).' using errcode = 'check_violation';
  end if;

  -- The AI's latest suggestion for this request, if it made one.
  select * into s from public.ai_decisions d
  where d.pro_id = p_pro and d.subject = 'pro_profile' and d.decision <> 'skipped'
    and d.created_at >= coalesce(p.review_requested_at, '-infinity')
  order by d.created_at desc limit 1
  for update;
  if s.id is not null then
    update public.ai_decisions set overridden_by = auth.uid(), overridden_at = now(),
      override_decision = p_decision, override_note = note
    where id = s.id;
  end if;

  perform set_config('app.system_write', 'on', true);
  if p_decision = 'approved' then
    update public.pros set published = true, review_status = 'approved', review_note = null, reviewed_at = now()
    where id = p_pro;
    -- The posts the AI looked at for this profile are checked; the rest wait in its queue.
    if s.id is not null then
      update public.works set ai_checked_at = now()
      where pro_id = p_pro and ai_checked_at is null
        and id in (select x::uuid from jsonb_array_elements_text(coalesce(s.input -> 'work_ids', '[]')) x where x ~* uuid_re);
    end if;
    perform public.notify(p_pro, 'profile_approved', 'Hồ sơ đã được duyệt',
      'Khách đã thấy hồ sơ của bạn và đặt lịch được rồi.', '/studio');
  else
    update public.pros set published = false, review_status = p_decision, review_note = note, reviewed_at = now()
    where id = p_pro;
    perform public.notify(p_pro, 'profile_review',
      case when p_decision = 'rejected' then 'Hồ sơ chưa được duyệt: ' else 'Hồ sơ cần chỉnh: ' end || left(split_part(note, E'\n', 1), 80),
      note || E'\nSửa xong bấm "Gửi duyệt lại".', '/studio/profile/edit');
  end if;
  perform set_config('app.system_write', '', true);

  perform public.log_admin_action('profile_review', p_pro, jsonb_build_object(
    'decision', p_decision, 'note', note, 'ai_suggestion', s.decision, 'name', p.display_name));
end $$;

-- 4 ---------------------------------------------------------------------------

create function public.notify_admins_profile_pending() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (account_id, kind, title, body, link)
  select a.id, 'profile_pending', 'Hồ sơ chờ duyệt: ' || left(coalesce(new.display_name, 'Đối tác'), 60),
         'Xem hồ sơ và gợi ý của AI rồi bấm Duyệt.', '/admin?tab=approvals'
  from public.accounts a where a.is_admin;
  return new;
end $$;

-- Not "update of review_status": the partner's update names published, and the
-- guard turns it into a request for review.
create trigger pros_notify_admins_pending
  after update on public.pros
  for each row when (new.review_status = 'pending' and old.review_status is distinct from 'pending')
  execute function public.notify_admins_profile_pending();

-- Privileges ------------------------------------------------------------------

revoke all on function
  public.ai_profiles_to_review(int),
  public.admin_decide_profile(uuid, text, text),
  public.notify_admins_profile_pending()
from public, anon, authenticated;
grant execute on function public.ai_profiles_to_review(int) to service_role;
-- Checks is_admin() itself.
grant execute on function public.admin_decide_profile(uuid, text, text) to authenticated;
