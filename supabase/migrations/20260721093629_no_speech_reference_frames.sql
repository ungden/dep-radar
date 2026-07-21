alter table public.source_posts
  add column if not exists archive_frame_paths text[] not null default '{}'::text[];

do $$
begin
  alter table public.source_posts
    add constraint source_posts_archive_frame_paths_check
    check (
      cardinality(archive_frame_paths) <= 3
      and (
        cardinality(archive_frame_paths) = 0
        or array_to_string(archive_frame_paths, '|') ~
          '^evidence-radar/tiktok/[a-zA-Z0-9._-]+/[0-9]{8,30}/frames/frame-[0-9]{2}\.jpg(\|evidence-radar/tiktok/[a-zA-Z0-9._-]+/[0-9]{8,30}/frames/frame-[0-9]{2}\.jpg){0,2}$'
      )
    );
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
