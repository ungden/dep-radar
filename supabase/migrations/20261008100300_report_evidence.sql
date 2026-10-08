-- Reports with evidence, followed through to the end (owner, 08/10/2026).
--
-- 1. Photos and clips as evidence: up to 8 files per report, in a private
--    bucket under the reporter's own folder; read by the reporter and the
--    staff only. Photos are re-encoded on the device and clips have their
--    location removed before upload, as everywhere else.
-- 2. A report is the reporter's to follow: they see its status, the staff can
--    ask them for more ("Cần thêm thông tin") and they can add a note and more
--    files while it is open. Every step reaches the other side as a notification.
-- 3. A report is filed open: the reporter cannot file it already decided.

-- 1 ---------------------------------------------------------------------------
create function public.paths_in_folder(p_paths text[], p_owner uuid) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(bool_and(split_part(p, '/', 1) = p_owner::text), true) from unnest(p_paths) p
$$;

alter table public.reports
  add column evidence_paths text[] not null default '{}',
  add column staff_question text check (staff_question is null or char_length(staff_question) <= 500),
  add column updated_at timestamptz not null default now();
alter table public.reports add constraint reports_evidence_check
  check (cardinality(evidence_paths) <= 8 and public.paths_in_folder(evidence_paths, reporter_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 200 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;
create policy "reporter uploads own evidence" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "reporter and staff read evidence" on storage.objects for select to authenticated
  using (bucket_id = 'evidence' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy "reporter removes own evidence" on storage.objects for delete to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 3 ---------------------------------------------------------------------------
create function public.report_filed_open() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_privileged() then
    new.status := 'open';
    new.resolution := null;
    new.resolved_at := null;
    new.staff_question := null;
  end if;
  new.detail := left(coalesce(new.detail, ''), 2000);
  new.updated_at := now();
  return new;
end $$;
revoke all on function public.report_filed_open() from public, anon, authenticated;
create trigger reports_filed_open before insert on public.reports
  for each row execute function public.report_filed_open();

-- 2 ---------------------------------------------------------------------------
-- The staff ask the reporter for more; the report stays with them, "đang xử lý".
create function public.ask_report_info(p_report uuid, p_question text) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.reports; q text := left(trim(coalesce(p_question, '')), 500);
begin
  perform public.require_admin();
  if char_length(q) < 5 then raise exception 'Viết câu hỏi cho người báo.' using errcode = 'check_violation'; end if;
  update public.reports set status = 'reviewing', staff_question = q, updated_at = now()
    where id = p_report and status in ('open', 'reviewing')
    returning * into r;
  if r.id is null then raise exception 'Báo cáo đã đóng.' using errcode = 'check_violation'; end if;
  perform public.log_admin_action('report:ask_info', r.id, jsonb_build_object('question', q));
  perform public.notify(r.reporter_id, 'report_question', '360dep cần thêm thông tin cho báo cáo của bạn', q, '/bao-cao#' || r.id);
end $$;

-- The reporter adds a note and files while the report is open.
create function public.add_report_evidence(p_report uuid, p_paths text[] default '{}', p_note text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare r public.reports; me uuid := auth.uid(); note text := left(trim(coalesce(p_note, '')), 1000);
begin
  select * into r from public.reports where id = p_report for update;
  if r.id is null or r.reporter_id is distinct from me then
    raise exception 'Không tìm thấy báo cáo.' using errcode = 'insufficient_privilege';
  end if;
  if r.status not in ('open', 'reviewing') then
    raise exception 'Báo cáo đã xử lý xong, không bổ sung được nữa. Gửi báo cáo mới nếu còn vấn đề.' using errcode = 'check_violation';
  end if;
  if note = '' and coalesce(cardinality(p_paths), 0) = 0 then
    raise exception 'Viết thêm thông tin hoặc chọn ảnh, clip.' using errcode = 'check_violation';
  end if;
  if cardinality(r.evidence_paths) + coalesce(cardinality(p_paths), 0) > 8 then
    raise exception 'Mỗi báo cáo có tối đa 8 ảnh, clip.' using errcode = 'check_violation';
  end if;
  if not public.paths_in_folder(coalesce(p_paths, '{}'), me) then
    raise exception 'Tệp không hợp lệ.' using errcode = 'check_violation';
  end if;
  update public.reports
    set evidence_paths = evidence_paths || coalesce(p_paths, '{}'),
        detail = left(detail || case when note = '' then '' else
          E'\n\n[Bổ sung ' || to_char(now() at time zone public.app_timezone(), 'DD/MM HH24:MI') || '] ' || note end, 4000),
        staff_question = null,
        updated_at = now()
    where id = r.id;
  insert into public.notifications (account_id, kind, title, body, link)
  select a.id, 'report_updated', 'Báo cáo được bổ sung: ' || left(r.reason, 80),
         case when note = '' then 'Thêm ' || cardinality(p_paths) || ' ảnh, clip.' else left(note, 200) end, '/admin'
  from public.accounts a where a.is_admin;
end $$;

-- The reporter now hears when the staff pick a report up, and every answer
-- leads to their reports page, where the status and the answer are.
create or replace function public.resolve_report(p_report uuid, p_status text, p_resolution text default '')
returns void
language plpgsql security definer set search_path = '' as $$
declare r public.reports;
begin
  if not public.is_admin() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if p_status not in ('reviewing', 'resolved', 'rejected') then
    raise exception 'Trạng thái không hợp lệ.' using errcode = 'check_violation';
  end if;
  update public.reports
    set status = p_status,
        resolution = case when p_status = 'reviewing' then resolution else nullif(p_resolution, '') end,
        resolved_at = case when p_status in ('resolved', 'rejected') then now() end,
        staff_question = case when p_status = 'reviewing' then staff_question end,
        updated_at = now()
    where id = p_report
    returning * into r;
  if r.id is null or r.reporter_id is null then return; end if;
  if p_status in ('resolved', 'rejected') then
    perform public.notify(r.reporter_id, 'report_resolved', '360dep đã xử lý báo cáo của bạn',
      coalesce(nullif(trim(p_resolution), ''),
        case when p_status = 'resolved' then 'Cảm ơn bạn đã báo. Đội ngũ đã xem xét và xử lý theo quy chế.'
             else 'Đội ngũ đã xem xét và chưa thấy vi phạm cần xử lý. Liên hệ hỗ trợ nếu bạn có thêm thông tin.' end),
      '/bao-cao#' || r.id);
  elsif p_status = 'reviewing' then
    perform public.notify(r.reporter_id, 'report_reviewing', '360dep đang xử lý báo cáo của bạn',
      'Đội ngũ đã nhận và đang xem xét. Bạn có thể bổ sung ảnh, clip hoặc thông tin trong mục Báo cáo của tôi.',
      '/bao-cao#' || r.id);
  end if;
end $$;

revoke all on function
  public.ask_report_info(uuid, text),
  public.add_report_evidence(uuid, text[], text)
from public, anon;
grant execute on function
  public.ask_report_info(uuid, text),
  public.add_report_evidence(uuid, text[], text)
to authenticated;
