-- A freelancer cannot publish a profile without a photo of their work, and there
-- was no way to add one: every image in the app was a file checked into the repo.
--
-- Three public buckets. Public is right for portfolio and avatars -- they are
-- what a customer browses -- and the path carries the owner's id so a policy can
-- tell whose file it is. Nothing private is ever put here: CCCD and selfie
-- images go to the AI and are never stored anywhere.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']),
  ('works', 'works', true, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']),
  ('reviews', 'reviews', true, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files live under "<account id>/<name>", which is what makes ownership checkable.
create policy "public can view images" on storage.objects
  for select using (bucket_id in ('avatars', 'works', 'reviews'));

create policy "owner uploads own images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'works', 'reviews')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owner replaces own images" on storage.objects
  for update to authenticated
  using (bucket_id in ('avatars', 'works', 'reviews') and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('avatars', 'works', 'reviews') and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner deletes own images" on storage.objects
  for delete to authenticated
  using (bucket_id in ('avatars', 'works', 'reviews') and (storage.foldername(name))[1] = auth.uid()::text);
