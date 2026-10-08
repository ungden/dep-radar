-- paths_in_folder ran inside a CHECK constraint, so every role inserting a
-- report needed EXECUTE on it, anon included. The ownership check moves into
-- the insert trigger (security definer) and the helper closes to clients;
-- add_report_evidence already checks the files it appends.

alter table public.reports drop constraint reports_evidence_check;
alter table public.reports add constraint reports_evidence_check check (cardinality(evidence_paths) <= 8);

create or replace function public.report_filed_open() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_privileged() then
    new.status := 'open';
    new.resolution := null;
    new.resolved_at := null;
    new.staff_question := null;
  end if;
  if not public.paths_in_folder(new.evidence_paths, new.reporter_id) then
    raise exception 'Ảnh, clip đính kèm không hợp lệ.' using errcode = 'check_violation';
  end if;
  new.detail := left(coalesce(new.detail, ''), 2000);
  new.updated_at := now();
  return new;
end $$;

revoke all on function public.paths_in_folder(text[], uuid) from public, anon, authenticated;
