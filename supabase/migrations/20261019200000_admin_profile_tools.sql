-- The staff handle partner profiles from the desk (owner, 19/10/2026: "duyệt thì
-- cho người ta lên luôn"; "admin đâu có các tính năng handle profile").
--
-- 1. admin_decide_profile() works from any state, not only 'pending':
--    * approve: any profile not already shown and not locked. It goes live at
--      once and takes new jobs (accepting_jobs on, unless the wallet is past
--      its limit), whether or not the partner
--      pressed "Gửi duyệt". It still needs what a listing needs: one service,
--      opening hours and one visible post;
--    * request changes / reject: any profile, with a reason. A live profile is
--      taken down until the partner fixes it and sends it again.
--    The AI's suggestion is still marked with the staff's decision when the
--    profile was waiting for review.
-- 2. admin_set_accepting_jobs(): the staff switch "nhận khách mới" on or off.

-- 1 ---------------------------------------------------------------------------

create or replace function public.admin_decide_profile(p_pro uuid, p_decision text, p_note text default '')
returns void
language plpgsql security definer set search_path = '' as $$
declare
  p public.pros;
  s public.ai_decisions;
  note text := nullif(trim(coalesce(p_note, '')), '');
  missing text[] := '{}';
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
  if p.suspended_at is not null then
    raise exception 'Hồ sơ đang tạm khoá. Mở khoá trước.' using errcode = 'check_violation';
  end if;
  if p_decision = 'approved' then
    if p.published and p.review_status = 'approved' then
      raise exception 'Hồ sơ này đang hiện với khách rồi.' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from public.pro_services x where x.pro_id = p_pro and x.active) then
      missing := missing || 'dịch vụ'::text;
    end if;
    if not exists (select 1 from public.working_hours x where x.pro_id = p_pro) then
      missing := missing || 'giờ làm'::text;
    end if;
    if not exists (select 1 from public.works x where x.pro_id = p_pro and x.hidden_at is null) then
      missing := missing || 'ảnh tác phẩm'::text;
    end if;
    if cardinality(missing) > 0 then
      raise exception 'Chưa duyệt được: hồ sơ còn thiếu %.', array_to_string(missing, ', ') using errcode = 'check_violation';
    end if;
  elsif p.review_status = p_decision and not p.published and p.review_note is not distinct from note then
    raise exception 'Hồ sơ này đã như vậy rồi.' using errcode = 'check_violation';
  end if;

  -- The AI's latest suggestion for the request waiting, if there is one.
  if p.review_status = 'pending' then
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
  end if;

  perform set_config('app.system_write', 'on', true);
  if p_decision = 'approved' then
    -- Takes jobs at once, unless the wallet is past its limit (the same rule the partner's own switch follows).
    update public.pros set published = true, accepting_jobs = not public.wallet_below_floor(p_pro), review_status = 'approved', review_note = null,
      reviewed_at = now(), review_requested_at = coalesce(review_requested_at, now())
    where id = p_pro;
    if s.id is not null then
      update public.works set ai_checked_at = now()
      where pro_id = p_pro and ai_checked_at is null
        and id in (select x::uuid from jsonb_array_elements_text(coalesce(s.input -> 'work_ids', '[]')) x where x ~* uuid_re);
    end if;
    perform public.notify(p_pro, 'profile_approved', 'Hồ sơ đã được duyệt',
      'Hồ sơ của bạn đang hiện với khách và đang nhận lịch mới.', '/studio');
  else
    update public.pros set published = false, review_status = p_decision, review_note = note, reviewed_at = now()
    where id = p_pro;
    perform public.notify(p_pro, 'profile_review',
      case when p_decision = 'rejected' then 'Hồ sơ chưa được duyệt: ' else 'Hồ sơ cần chỉnh: ' end || left(split_part(note, E'\n', 1), 80),
      note || E'\nSửa xong bấm "Gửi duyệt lại".', '/studio/profile/edit');
  end if;
  perform set_config('app.system_write', '', true);

  perform public.log_admin_action('profile_review', p_pro, jsonb_build_object(
    'decision', p_decision, 'note', note, 'from', p.review_status, 'was_published', p.published,
    'ai_suggestion', s.decision, 'name', p.display_name));
end $$;

-- 2 ---------------------------------------------------------------------------

create function public.admin_set_accepting_jobs(p_pro uuid, p_on boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare p public.pros;
begin
  if not public.is_admin() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  select * into p from public.pros where id = p_pro for update;
  if p.id is null then
    raise exception 'Không tìm thấy hồ sơ.' using errcode = 'no_data_found';
  end if;
  if p_on and p.suspended_at is not null then
    raise exception 'Hồ sơ đang tạm khoá. Mở khoá trước.' using errcode = 'check_violation';
  end if;
  if p_on and public.wallet_below_floor(p_pro) then
    raise exception 'Đối tác đang nợ phí quá hạn mức: thanh toán phí trước khi nhận lịch mới.' using errcode = 'check_violation';
  end if;
  if p.accepting_jobs = p_on then
    return;
  end if;
  perform set_config('app.system_write', 'on', true);
  update public.pros set accepting_jobs = p_on where id = p_pro;
  perform set_config('app.system_write', '', true);
  perform public.notify(p_pro, 'account_status',
    case when p_on then 'Bạn đang nhận lịch mới' else 'Bạn đã được tạm dừng nhận lịch mới' end,
    case when p_on then 'Nhân viên 360dep đã bật nhận lịch mới cho hồ sơ của bạn.'
         else 'Nhân viên 360dep đã tạm dừng nhận lịch mới. Lịch đã nhận vẫn giữ. Liên hệ hỗ trợ nếu cần.' end,
    '/studio');
  perform public.log_admin_action('pro_accepting_jobs', p_pro, jsonb_build_object('on', p_on, 'name', p.display_name));
end $$;

revoke all on function public.admin_set_accepting_jobs(uuid, boolean) from public, anon;
-- Checks is_admin() itself.
grant execute on function public.admin_set_accepting_jobs(uuid, boolean) to authenticated;
