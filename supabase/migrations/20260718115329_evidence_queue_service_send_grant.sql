-- evidence_radar_enqueue_source_posts is SECURITY INVOKER. The service role
-- needs INSERT on the one private queue table that pgmq.send writes to.
grant insert on table pgmq.q_evidence_analysis to service_role;
