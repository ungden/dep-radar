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

## TikTok channel collector

`downloadtiktok` is the private collector for recent TikTok history. It does not write directly to Supabase and it cannot publish evidence. It sends a versioned manifest to `/api/webhooks/tiktok-collector`, where the creator/profile/post relationship is checked again before service-role ingestion.

Use two passes so a 100-video scan does not become a multi-gigabyte archive by default:

1. Scan metadata/captions for 100 recent posts per pilot creator.
2. Resolve media for at most 10 likely-useful posts, analyse them promptly, then let the short media URL expire.
3. Review extracted products, action type, disclosure and timestamp/frame evidence in Evidence Inbox.
4. Expand to 200 posts only after measuring scan success, product-match precision, media cost and review throughput.

Dry-run the ten-creator pilot from the `downloadtiktok` repository:

```bash
.venv/bin/python scripts/export_360dep_evidence.py \
  --accounts ../đẹp-radar/config/evidence-radar/tiktok-pilot.json \
  --limit 100 \
  --max-accounts 10 \
  --dry-run
```

For ingestion, set `TIKTOK_COLLECTOR_WEBHOOK_URL` and the same server-only `TIKTOK_COLLECTOR_WEBHOOK_SECRET` on the collector and 360dep. Start with `--resolve-media 10`. Never place the secret in the JSON manifest or browser code.

The collector contract rejects cross-creator URLs, URL/post-ID mismatches, duplicate IDs, future timestamps, non-HTTPS media and unapproved media hosts. Accepted rows remain private while `EVIDENCE_RADAR_AUTO_PUBLISH=false`.

## Retention and incident handling

- Raw provider payload is removed immediately after successful extraction. Downloadtiktok media URLs default to a six-hour expiry and are capped at seven days; other providers retain the existing 30-day upper bound.
- Failed queue messages remain invisible until their visibility timeout expires and are retried. `creator_accounts.last_error` and `source_posts.last_error` show the last failure.
- Pause an unstable account from Admin > Evidence Radar instead of deleting its audit trail.
