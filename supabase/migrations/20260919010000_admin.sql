-- Someone has to be able to answer. A verification the AI was unsure about lands
-- in "chờ kiểm tra", a suspended freelancer has to be un-suspended, and a report
-- needs a person at the other end. Until now none of that had a door.

-- Admins may read and act across the tables the queues are built from.
create policy "admin reads every pro" on public.pros for select using (public.is_admin());
create policy "admin edits any pro" on public.pros
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin reads every account" on public.accounts for select using (public.is_admin());
create policy "admin reads every booking" on public.bookings for select using (public.is_admin());
create policy "admin reads every identity check" on public.identity_checks for select using (public.is_admin());
create policy "admin reads every review" on public.reviews for select using (public.is_admin());

/**
 * Decide a verification the AI left pending. The decision is recorded on the
 * check as well as on the profile, so there is a trail of who was let through
 * and on what basis.
 */
create function public.decide_identity_check(p_check uuid, p_approve boolean, p_reason text default '')
returns void
language plpgsql security definer set search_path = '' as $$
declare c public.identity_checks;
begin
  if not public.is_admin() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  select * into c from public.identity_checks where id = p_check;
  if c is null then raise exception 'Không tìm thấy hồ sơ xác minh.' using errcode = 'no_data_found'; end if;
  if c.status <> 'pending' then
    raise exception 'Hồ sơ này đã được xử lý.' using errcode = 'check_violation';
  end if;

  update public.identity_checks
    set status = (case when p_approve then 'verified' else 'rejected' end)::public.verification_status,
        reject_reason = nullif(p_reason, ''),
        decided_at = now()
    where id = p_check;

  update public.pros
    set identity_status = (case when p_approve then 'verified' else 'rejected' end)::public.verification_status,
        identity_name = case when p_approve then coalesce(c.name_on_card, identity_name) else identity_name end
    where id = c.pro_id;

  perform public.notify(
    c.pro_id,
    'identity_decided',
    case when p_approve then 'Hồ sơ của bạn đã được xác minh' else 'Xác minh danh tính chưa thành công' end,
    coalesce(nullif(p_reason, ''), ''),
    '/studio/profile');
end $$;

/** Take a freelancer off the marketplace, or put them back. */
create function public.set_pro_suspended(p_pro uuid, p_suspended boolean, p_reason text default '')
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  update public.pros
    set suspended_at = case when p_suspended then now() end,
        accepting_jobs = case when p_suspended then false else accepting_jobs end
    where id = p_pro;
  perform public.notify(
    p_pro,
    'account_status',
    case when p_suspended then 'Hồ sơ của bạn đang tạm khoá' else 'Hồ sơ của bạn đã hoạt động trở lại' end,
    coalesce(nullif(p_reason, ''), ''),
    '/studio');
end $$;

/** Hide a review that breaks the rules. It is never edited or deleted. */
create function public.set_review_hidden(p_booking uuid, p_hidden boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if not public.is_admin() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  update public.reviews set hidden_at = case when p_hidden then now() end where booking_id = p_booking
    returning pro_id into r;
  if r.pro_id is not null then perform public.refresh_pro_rating(r.pro_id); end if;
end $$;

create function public.resolve_report(p_report uuid, p_status text, p_resolution text default '')
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if p_status not in ('reviewing', 'resolved', 'rejected') then
    raise exception 'Trạng thái không hợp lệ.' using errcode = 'check_violation';
  end if;
  update public.reports
    set status = p_status,
        resolution = nullif(p_resolution, ''),
        resolved_at = case when p_status in ('resolved', 'rejected') then now() end
    where id = p_report;
end $$;

grant execute on function
  public.decide_identity_check(uuid, boolean, text),
  public.set_pro_suspended(uuid, boolean, text),
  public.set_review_hidden(uuid, boolean),
  public.resolve_report(uuid, text, text)
to authenticated;
