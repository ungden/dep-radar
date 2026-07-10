# Evidence Radar operations

Evidence Radar tracks only public creator evidence. A public event must be verified, have confidence `>= 70`, retain its source URL, and remain separate from private/off-platform behavior.

## Provisioning

1. Apply `supabase/migrations/20260710090820_evidence_radar_foundation.sql`.
2. Apply `supabase/migrations/20260710093242_evidence_radar_service_queue_rpc.sql`. It exposes only two `security invoker` RPCs to `service_role`; do not expose the full `pgmq` schema or grant queue access to `anon`/`authenticated`.
3. Set the server-only variables documented in `.env.example` on the Next.js deployment.
   Keep `NEXT_PUBLIC_EVIDENCE_RADAR_READY=false` until the migration and queue API grants are verified, then set it to `true` and redeploy.
4. Add the two Vault secrets used by Supabase Cron:

```sql
select vault.create_secret(
  'https://YOUR_DOMAIN/api/cron/evidence-radar',
  'evidence_radar_worker_url'
);

select vault.create_secret(
  'THE_SAME_VALUE_AS_EVIDENCE_RADAR_CRON_SECRET',
  'evidence_radar_cron_secret'
);
```

The database queues due accounts every five minutes and invokes the authenticated worker every five minutes. Missing Vault secrets intentionally make the worker invocation a no-op.

## Pilot gate

- Keep `EVIDENCE_RADAR_AUTO_PUBLISH=false` and `EVIDENCE_RADAR_GOLDEN_SAMPLE_COUNT=0` while labeling the first 500 posts.
- Keep `EVIDENCE_RADAR_COLLECTION_ENABLED=false` until Bright Data, YouTube and Gemini credentials have each passed a live request. Then activate the desired creator accounts and turn this flag on.
- Only set the golden count to `500` after the checked-in evaluation reaches product-match precision `>=98%` and current-use precision `>=95%`.
- Auto-publish additionally requires confidence `>=92` and zero risk flags. Every other claim remains in Evidence Inbox.

## Retention and incident handling

- Raw provider payload is removed immediately after successful extraction; `raw_media_expires_at` is an upper-bound 30-day cleanup marker.
- Failed queue messages remain invisible until their visibility timeout expires and are retried. `creator_accounts.last_error` and `source_posts.last_error` show the last failure.
- Pause an unstable account from Admin > Evidence Radar instead of deleting its audit trail.
