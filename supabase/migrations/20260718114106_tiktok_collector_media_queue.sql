-- Two-pass TikTok ingestion: metadata is retained privately, but expensive AI
-- work starts only after the collector has resolved a short-lived media URL.

drop trigger if exists source_posts_queue_analysis on public.source_posts;
create trigger source_posts_queue_analysis
before insert on public.source_posts
for each row
when (new.media_url is not null)
execute function private.queue_source_post_for_analysis();

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
      and media_url is not null
      and raw_media_expires_at > now()
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
grant execute on function pgmq.send(text, jsonb) to service_role;
grant execute on function pgmq.send(text, jsonb, integer) to service_role;
