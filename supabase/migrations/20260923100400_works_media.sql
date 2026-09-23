-- A post in the feed is more than a photo now: a before/after pair, or a short
-- clip. Photo & video freelancers sell with clips, and a before/after is the most
-- honest picture a skincare or hair job has.

alter table public.works
  add column kind text not null default 'work' check (kind in ('work', 'before_after')),
  add column video_path text,
  -- images[0] is before, images[1] is after.
  add constraint works_before_after_pair check (kind <> 'before_after' or cardinality(image_paths) >= 2),
  -- A before/after is two photos; a clip belongs on an ordinary post.
  add constraint works_video_on_work check (video_path is null or kind = 'work'),
  -- The clip must be the freelancer's own upload in our storage, not any link on
  -- the internet: images[0] stays as its poster frame, and the policies below are
  -- what make "<owner id>/" mean something.
  add constraint works_video_own_upload check (
    video_path is null
    or position('/storage/v1/object/public/videos/' || pro_id::text || '/' in video_path) > 0
  );

create index works_created_idx on public.works (created_at desc);

-- Videos get a bucket of their own rather than a bigger `works` bucket. The size
-- and type limits are per bucket, and raising `works` to 50 MB would let a 50 MB
-- "photo" in too; photos are re-encoded on the device to a few hundred KB and
-- their 5 MB cap is a guard worth keeping. The owner-folder rules are the same.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 50 * 1024 * 1024, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "public can view videos" on storage.objects
  for select using (bucket_id = 'videos');

create policy "owner uploads own videos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "owner replaces own videos" on storage.objects
  for update to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "owner deletes own videos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
