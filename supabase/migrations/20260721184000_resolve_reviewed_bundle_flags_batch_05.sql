-- The bundle flag is a review-routing flag, not a permanent public warning.
-- These exact-SKU events were manually separated from their multi-product
-- videos in batch 05, so the unresolved flag must not survive publication.

update public.creator_product_events
set risk_flags = array_remove(risk_flags, 'multi_product_bundle'),
    updated_at = now()
where id in (
  'event-tiktok-7614350581133544725-loreal-revitalift-triple-power-tri-peptides-age-defying-serum',
  'event-tiktok-7617475859699567893-loreal-revitalift-triple-power-tri-peptides-age-defying-serum',
  'event-tiktok-7620819047860653332-simple-repair-plus-replenishing-cream-cleanser',
  'event-tiktok-7620819047860653332-simple-repair-plus-rich-face-cream',
  'event-tiktok-7642613151959239944-geek-gorgeous-stress-less'
)
  and verification_status = 'verified'
  and exact_sku_verified = true
  and verified_by is not null
  and verified_at is not null;

update public.creator_evidence_items
set risk_flags = array_remove(risk_flags, 'multi_product_bundle'),
    updated_at = now()
where id in (
  'evidence-tiktok-7614350581133544725-loreal-revitalift-triple-power-tri-peptides-age-defying-serum',
  'evidence-tiktok-7617475859699567893-loreal-revitalift-triple-power-tri-peptides-age-defying-serum',
  'evidence-tiktok-7620819047860653332-simple-repair-plus-replenishing-cream-cleanser',
  'evidence-tiktok-7620819047860653332-simple-repair-plus-rich-face-cream',
  'evidence-tiktok-7642613151959239944-geek-gorgeous-stress-less'
)
  and status = 'published'
  and reviewed_by is not null
  and reviewed_at is not null;
