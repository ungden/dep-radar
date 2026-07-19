-- Audio-first private evidence pipeline. Original video and derived audio stay
-- in the collector's evidence archive; only service-role/admin paths can read
-- these fields because source_posts already has RLS enabled and no anon access.

alter table public.source_posts
  add column if not exists transcription_status text not null default 'pending',
  add column if not exists transcript_text text,
  add column if not exists transcript_language text,
  add column if not exists transcript_segments jsonb not null default '[]'::jsonb,
  add column if not exists transcription_provider text,
  add column if not exists transcription_model text,
  add column if not exists transcribed_at timestamptz,
  add column if not exists archive_video_path text,
  add column if not exists archive_audio_path text,
  add column if not exists media_sha256 text,
  add column if not exists audio_sha256 text,
  add column if not exists vision_fallback_required boolean not null default false;

do $$
begin
  alter table public.source_posts
    add constraint source_posts_transcription_status_check
    check (transcription_status in ('pending', 'processing', 'ready', 'no_speech', 'failed', 'skipped'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.source_posts
    add constraint source_posts_transcript_size_check
    check (transcript_text is null or length(transcript_text) <= 100000);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.source_posts
    add constraint source_posts_media_sha256_check
    check (media_sha256 is null or media_sha256 ~ '^[a-f0-9]{64}$');
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.source_posts
    add constraint source_posts_audio_sha256_check
    check (audio_sha256 is null or audio_sha256 ~ '^[a-f0-9]{64}$');
exception when duplicate_object then null;
end $$;

create index if not exists source_posts_transcription_queue_idx
  on public.source_posts(transcription_status, observed_at)
  where transcription_status in ('pending', 'processing', 'failed');

-- A source post becomes eligible for private product extraction when it has a
-- transcript. Legacy media analysis remains available only as an explicit
-- fallback and still requires an unexpired media URL.
create or replace function public.evidence_radar_enqueue_source_posts(
  source_post_ids uuid[]
) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    update public.source_posts
    set analysis_status = 'queued',
        last_error = null,
        updated_at = now()
    where id = any(source_post_ids)
      and (
        (transcription_status = 'ready' and nullif(trim(transcript_text), '') is not null)
        or (media_url is not null and raw_media_expires_at > now())
      )
      and analysis_status in ('pending', 'failed', 'ignored')
    returning id
  loop
    perform pgmq.send(
      'evidence_analysis',
      jsonb_build_object('source_post_id', v_id, 'enqueued_at', now())
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.evidence_radar_enqueue_source_posts(uuid[]) from public, anon, authenticated;
grant execute on function public.evidence_radar_enqueue_source_posts(uuid[]) to service_role;
