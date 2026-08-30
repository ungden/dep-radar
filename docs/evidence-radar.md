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
- Keep `EVIDENCE_RADAR_COLLECTION_ENABLED=false` until the signed TikTok collector and Gemini credentials have each passed a live request. The default source focus is TikTok KOL/KOC only; Bright Data, YouTube, Facebook and Instagram remain paused and cannot collect unless deliberately re-enabled in code and environment.
- `EVIDENCE_RADAR_ANALYSIS_ENABLED` is independent: it may process manually ingested posts with resolved media while account collection remains off.
- Only set the golden count to `500` after the checked-in evaluation reaches product-match precision `>=98%` and current-use precision `>=95%`.
- Auto-publish additionally requires confidence `>=92` and zero risk flags. Every other claim remains in Evidence Inbox.

## TikTok channel collector

`downloadtiktok` is the private collector for recent TikTok history. It does not write directly to Supabase and it cannot publish evidence. It sends a versioned manifest to `/api/webhooks/tiktok-collector`, where the creator/profile/post relationship is checked again before service-role ingestion.

Use two passes so a daily scan does not become a multi-gigabyte archive by default:

1. At 02:15 Asia/Ho_Chi_Minh, the private collector fetches the signed active TikTok roster and scans only post IDs absent from its cursor.
2. Every new post is scored from caption, cover OCR and deterministic beauty terms. Only high-score posts plus a bounded negative sample resolve media; media is not selected by position in the feed.
3. The manifest carries an automation cohort. 360dep analyses only the configured cohort, so historical rows and stale queue messages cannot consume the shadow budget.
4. Transcript and sampled video evidence are sent together. A product candidate needs an exact official page and official image before it can be materialized; otherwise it stays private as `needs_official_source`.

Dry-run the ten-creator pilot from the `downloadtiktok` repository:

```bash
.venv/bin/python scripts/export_360dep_evidence.py \
  --accounts ../đẹp-radar/config/evidence-radar/tiktok-pilot.json \
  --limit 100 \
  --max-accounts 10 \
  --dry-run
```

For ingestion, set `TIKTOK_COLLECTOR_WEBHOOK_URL`, `TIKTOK_COLLECTOR_ROSTER_URL` and the same server-only `TIKTOK_COLLECTOR_WEBHOOK_SECRET` on the collector and 360dep. The Railway scheduler remains disabled until `EVIDENCE_RADAR_DAILY_COLLECTOR_ENABLED=true`; start with two resolved clips per creator. Never place the secret in the JSON manifest or browser code.

The collector contract rejects cross-creator URLs, URL/post-ID mismatches, duplicate IDs, future timestamps, non-HTTPS media and unapproved media hosts. Accepted rows remain private while `EVIDENCE_RADAR_AUTO_PUBLISH=false`.

## Retention and incident handling

- Raw provider payload is removed immediately after successful extraction. Downloadtiktok media URLs default to a six-hour expiry and are capped at seven days; other providers retain the existing 30-day upper bound.
- Failed queue messages remain invisible until their visibility timeout expires and are retried. `creator_accounts.last_error` and `source_posts.last_error` show the last failure.
- Pause an unstable account from Admin > Evidence Radar instead of deleting its audit trail.
