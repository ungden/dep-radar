-- Clips up to 200 MB. A 60-second clip at a phone's default 1080p is about
-- 60 MB on iPhone and 130 MB on Android, so 50 MB turned most of them away.
-- The web uploads clips over the resumable endpoint (lib/uploads.ts), and the
-- limit in code is lib/video-meta.ts (VIDEO_MAX_BYTES). The project-wide upload
-- limit (Storage settings) has to be at least this for it to take effect.
update storage.buckets set file_size_limit = 200 * 1024 * 1024 where id = 'videos';
