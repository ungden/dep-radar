-- Storage that listed everyone's files, a bucket with no ceiling, and three
-- indexes the database linter asked for.

-- 1. Public buckets without public listing ---------------------------------------
--
-- "public can view images" / "public can view videos" let anyone, signed in or
-- not, *list* every object in the four public buckets -- every account id that
-- ever uploaded, and every file name under it. Serving a file never needed them:
-- a public bucket answers /storage/v1/object/public/... without looking at
-- storage.objects policies at all, which is the only way the app reads these
-- files (getPublicUrl, on the web and in the mobile app).
--
-- They are not simply dropped. Whether the Storage API's upload reads the new row
-- back (INSERT ... RETURNING, which needs a SELECT policy to pass) depends on its
-- version, and a remove() certainly reads the row it deletes. So the broad policy
-- is replaced by one that lets a signed-in owner see their own folder and nothing
-- else: uploads (upsert: false) and removals keep working exactly as before, and
-- nobody can enumerate anybody else's files. Admin work uses the service key and
-- is not affected.

drop policy if exists "public can view images" on storage.objects;
drop policy if exists "public can view videos" on storage.objects;

create policy "owner reads own public media" on storage.objects
  for select to authenticated using (
    bucket_id in ('avatars', 'works', 'reviews', 'videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 2. At most 30 clips per account --------------------------------------------------
--
-- The videos bucket takes 50 MB a file, and nothing limited the number of files.
-- A policy can only say no, and says it in English; this function says no in
-- Vietnamese, and the insert policy asks it. Two uploads racing past the 30th
-- can both land -- a cap of 31 is fine, a cap of none was not.
create function public.video_quota_ok() returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  if (
    select count(*) from storage.objects o
    where o.bucket_id = 'videos' and o.name like (select auth.uid())::text || '/%'
  ) >= 30 then
    raise exception 'Mỗi tài khoản lưu tối đa 30 clip. Xoá bớt clip cũ rồi tải lên tiếp nhé.'
      using errcode = 'check_violation';
  end if;
  return true;
end $$;

-- The insert policy calls it, so a signed-in uploader needs EXECUTE. It answers
-- only about the caller's own folder.
revoke all on function public.video_quota_ok() from public, anon, authenticated;
grant execute on function public.video_quota_ok() to authenticated;

drop policy "owner uploads own videos" on storage.objects;
create policy "owner uploads own videos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.video_quota_ok()
  );

-- 3. Indexes ----------------------------------------------------------------------

-- The unread badge on every page load: "my notifications not yet read".
create index if not exists notifications_unread_idx on public.notifications (account_id) where read_at is null;

-- The two foreign keys on no-show claims without a covering index, and the one
-- 20260924100700 added.
create index if not exists no_show_compensation_requests_pro_idx on public.no_show_compensation_requests (pro_id);
create index if not exists no_show_compensation_requests_decided_by_idx on public.no_show_compensation_requests (decided_by);
create index if not exists no_show_compensation_requests_report_idx on public.no_show_compensation_requests (dispute_report_id);
