-- If a source gap was repaired after a job was blocked, let the signal compete
-- in a later slot. The failed job remains immutable audit history.
update public.content_signals as signal
set status = 'pending'
where signal.status = 'selected'
  and signal.signal_type = 'creator_evidence'
  and exists (
    select 1
    from public.radar_products as product
    where product.id = signal.payload #>> '{ownData,product,id}'
      and product.source_url is not null
      and product.source_label is not null
      and product.source_type is not null
  )
  and exists (
    select 1
    from public.content_jobs as job
    where job.signal_id = signal.id
      and job.status = 'policy_blocked'
      and job.policy_reasons @> array['insufficient_accessible_sources']
  );
