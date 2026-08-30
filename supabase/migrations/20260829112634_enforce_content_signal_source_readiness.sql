-- The signal that surfaced this gap has an exact, official product page. Keep
-- the source in the product record so the Content Factory can reproduce it.
update public.radar_products
set source_label = 'Paula''s Choice official product page',
    source_url = 'https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-exfoliant/201.html',
    source_type = 'official',
    source_last_verified_at = now()
where id = 'paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-118ml'
  and source_url is null;

-- Refresh queued signal payloads with the verified source already attached to
-- their exact product. This preserves the direct TikTok evidence and adds no
-- inferred product match.
update public.content_signals as signal
set payload = jsonb_set(
  signal.payload,
  '{sources}',
  case when exists (
    select 1
    from jsonb_array_elements(coalesce(signal.payload -> 'sources', '[]'::jsonb)) as source
    where source ->> 'url' = product.source_url
  ) then coalesce(signal.payload -> 'sources', '[]'::jsonb)
  else coalesce(signal.payload -> 'sources', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
    'url', product.source_url,
    'title', coalesce(product.source_label, product.brand || ' ' || product.name),
    'publisher', product.brand,
    'sourceType', product.source_type,
    'excerpt', product.description
  )) end,
  true
)
from public.radar_products as product
where product.id = signal.payload #>> '{ownData,product,id}'
  and signal.signal_type = 'creator_evidence'
  and signal.status in ('pending', 'selected')
  and product.source_url is not null
  and product.source_label is not null
  and product.source_type is not null;

-- Preserve audit history, but prevent a one-source TikTok signal from taking a
-- publication slot. These records can be re-enriched and re-signalled later.
update public.content_signals as signal
set status = 'rejected',
    payload = coalesce(signal.payload, '{}'::jsonb) || jsonb_build_object(
      'policy', jsonb_build_object(
        'reason', 'insufficient_product_provenance',
        'applied_at', now()
      )
    )
from public.radar_products as product
where product.id = signal.payload #>> '{ownData,product,id}'
  and signal.signal_type = 'creator_evidence'
  and signal.status = 'pending'
  and (product.source_url is null or product.source_label is null or product.source_type is null);

update public.content_jobs as job
set status = 'policy_blocked',
    policy_reasons = array(select distinct reason from unnest(job.policy_reasons || array['insufficient_product_provenance']) as reason),
    last_error = 'Exact product provenance is required before content generation.',
    lease_until = null,
    leased_by = null
from public.content_signals as signal
where signal.id = job.signal_id
  and signal.status = 'rejected'
  and signal.payload -> 'policy' ->> 'reason' = 'insufficient_product_provenance'
  and job.status in ('queued', 'researching', 'drafting', 'verifying', 'publishable');
