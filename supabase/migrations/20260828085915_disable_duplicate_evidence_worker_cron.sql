-- Vercel Cron is the single scheduler for /api/cron/evidence-radar. Keep the
-- Supabase enqueue and cleanup jobs, but stop the duplicate pg_net worker call.
do $$
begin
  perform cron.unschedule('evidence-radar-run-worker');
exception
  when others then null;
end $$;

-- Terminal rows and rows that exhausted the application retry budget no longer
-- need queue messages. Removing only those messages preserves all source data
-- and leaves retryable work queued.
delete from pgmq.q_evidence_analysis as queue
using public.source_posts as source
where source.id::text = queue.message->>'source_post_id'
  and (
    source.analysis_status in ('ready', 'ignored')
    or source.analysis_attempts >= 3
  );
