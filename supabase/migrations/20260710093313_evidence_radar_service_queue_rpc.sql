-- Minimal service-only Queue API. These wrappers are SECURITY INVOKER and only
-- service_role receives EXECUTE; anon/authenticated cannot inspect queue data.

create or replace function public.evidence_radar_queue_read(
  queue_name text,
  visibility_seconds integer,
  message_count integer
) returns setof pgmq.message_record
language sql
security invoker
set search_path = ''
as $$
  select * from pgmq.read($1, $2, $3, null::jsonb);
$$;

create or replace function public.evidence_radar_queue_delete(
  queue_name text,
  message_id bigint
) returns boolean
language sql
security invoker
set search_path = ''
as $$
  select pgmq.delete($1, $2);
$$;

revoke all on function public.evidence_radar_queue_read(text, integer, integer) from public, anon, authenticated;
revoke all on function public.evidence_radar_queue_delete(text, bigint) from public, anon, authenticated;
grant execute on function public.evidence_radar_queue_read(text, integer, integer) to service_role;
grant execute on function public.evidence_radar_queue_delete(text, bigint) to service_role;

grant usage on schema pgmq to service_role;
grant execute on function pgmq.read(text, integer, integer, jsonb) to service_role;
grant execute on function pgmq.delete(text, bigint) to service_role;
grant select, update, delete on table pgmq.q_creator_monitor, pgmq.q_evidence_analysis to service_role;
