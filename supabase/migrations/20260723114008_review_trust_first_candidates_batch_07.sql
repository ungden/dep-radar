-- Human-reviewed candidate batch 07.
--
-- Exact SKU identity was confirmed from archived TikTok frames. Every public
-- claim retains the original clip URL, post id, localized evidence and reviewer.

create temporary table verified_candidate_batch_07 (
  candidate_id uuid not null,
  creator_id text not null,
  external_post_id text not null,
  product_id text not null,
  product_name text not null,
  event_type text not null,
  disclosure text not null,
  sentiment text not null,
  source_title text not null,
  source_excerpt text not null,
  usage_context text not null,
  confidence_score integer not null,
  official_product_url text not null,
  image_source_url text not null,
  researcher_note text not null,
  evidence_spans jsonb not null,
  risk_flags text[] not null default '{}'::text[]
) on commit drop;

insert into verified_candidate_batch_07 values
  (
    'a8225a5c-3887-46d0-9760-1460855fdb7e', '87', '7580734296772676872',
    'dr-althea-345-relief-cream-50ml', '345 Relief Cream 50ml',
    'reviewed', 'affiliate', 'positive',
    'Tôm review Dr.Althea 345 Relief Cream trong nhóm kem dưỡng cho da dầu mụn',
    'Creator gọi đúng Dr.Althea 345 Relief Cream, mô tả khả năng làm dịu, dưỡng ẩm và các thành phần B5, rau má, niacinamide, beta-glucan.',
    'Review so sánh nhiều kem dưỡng; clip ghi rõ không booking nhưng có thể chứa affiliate marketing.',
    98,
    'https://doctoraltheaglobal.com/products/345-relief-cream',
    'https://doctoraltheaglobal.com/cdn/shop/files/345_cream.jpg?v=1782461402&width=1024',
    'Archived frame tại giây 54 hiển thị tuýp 345 Relief Cream và overlay tên đầy đủ; disclosure được chuẩn hóa thành affiliate theo chính thông báo trên clip.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','Kem 3, 4, 5 của Dr. Althea','timestamp_seconds',52),
      jsonb_build_object('kind','quote','value','B5, rau má, nia, beta-glucan nó có hết','timestamp_seconds',58),
      jsonb_build_object('kind','frame','value','Tuýp Dr.Althea 345 Relief Cream và overlay tên sản phẩm hiện rõ','timestamp_seconds',54)
    ),
    array['affiliate_disclosed']::text[]
  ),
  (
    'a8225a5c-3887-46d0-9760-1460855fdb7e', '52', '7577334522518228232',
    'dr-althea-345-relief-cream-50ml', '345 Relief Cream 50ml',
    'emptied', 'affiliate', 'positive',
    'Skincare Đúng Cách by Sơn cho thấy tuýp Dr.Althea 345 Relief Cream đã dùng hết',
    'Creator cho thấy tuýp 345 Relief Cream đã dùng hết và nói sản phẩm phù hợp da dầu mụn trong video săn deal livestream.',
    'Evidence emptied trực tiếp nhưng nằm trong nội dung bán hàng, vì vậy được ghi nhận affiliate và không tính như nguồn organic.',
    98,
    'https://doctoraltheaglobal.com/products/345-relief-cream',
    'https://doctoraltheaglobal.com/cdn/shop/files/345_cream.jpg?v=1782461402&width=1024',
    'Archived frame tại giây 208 hiển thị rõ tuýp 345 Relief Cream đã bóp gần hết; video là danh sách deal dẫn vào livestream.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','Kem dưỡng 3-4-5 của Dr. Althea','timestamp_seconds',205),
      jsonb_build_object('kind','quote','value','Nhìn mình xài hết sạch như thế này là biết rồi ha','timestamp_seconds',209),
      jsonb_build_object('kind','frame','value','Tuýp Dr.Althea 345 Relief Cream đã dùng gần hết hiện rõ','timestamp_seconds',208)
    ),
    array['affiliate_content','commercial_context']::text[]
  ),
  (
    'fb969101-83ed-45c8-95cb-27ac0db65564', '55', '7491484884872088850',
    'paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-118ml',
    'Skin Perfecting 2% BHA Liquid Exfoliant 118ml',
    'used', 'unknown', 'positive',
    'Kỳ Kỳ dùng Paula’s Choice Skin Perfecting 2% BHA Liquid Exfoliant',
    'Creator mô tả cách dùng BHA 2% ở vùng dễ bít tắc và archived frame cho thấy đúng chai Skin Perfecting 2% BHA Liquid Exfoliant.',
    'Sản phẩm được dùng trong routine mùa nóng; clip không nêu rõ disclosure.',
    99,
    'https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-exfoliant/201-2010.html',
    'https://www.paulaschoice.com/dw/image/v2/BBNX_PRD/on/demandware.static/-/Sites-pc-catalog/default/dw006e394e/images/products/2-percent-bha-liquid-exfoliant-2010-portrait.png?sw=2000&sfrm=png',
    'Archived frame tại giây 69 hiển thị đúng chai đen Paula’s Choice Skin Perfecting 2% BHA Liquid Exfoliant; exact liquid variant được xác nhận, không suy từ ASR.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','Kỳ lật cái mặt lại kỳ đổ BHA 2% ra','timestamp_seconds',67),
      jsonb_build_object('kind','quote','value','Kỳ thoa tập trung vào những vùng dễ bít tắc như mũi và hai bên cánh mũi','timestamp_seconds',70),
      jsonb_build_object('kind','frame','value','Chai Paula’s Choice Skin Perfecting 2% BHA Liquid Exfoliant hiện rõ','timestamp_seconds',69)
    ),
    array['disclosure_not_stated']::text[]
  );

insert into public.radar_products (
  id, name, brand, image, rating, reviews, sold, price, category, tags,
  affiliate_url, description, category_key, subcategory_key, concern_tags,
  ingredient_tags, aliases, status
) values
  (
    'dr-althea-345-relief-cream-50ml', '345 Relief Cream 50ml', 'Dr.Althea',
    '/images/products/dr-althea-345-relief-cream-50ml.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['345 Relief Cream','Barrier care','50ml'], null,
    'Kem dưỡng gel cho da dễ nổi mụn và cần làm dịu. Hai creator độc lập đã review hoặc dùng hết sản phẩm, nhưng cả hai nguồn đều có yếu tố affiliate.',
    'skincare', 'moisturizer', array['da dầu mụn','phục hồi','sau mụn','da nhạy cảm'],
    array['niacinamide','panthenol','beta-glucan','centella asiatica','ceramide NP'],
    array['Dr Althea 345 Cream','Kem 345','Dr.Althea 345 Relief Cream'],
    'published'
  ),
  (
    'paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-118ml',
    'Skin Perfecting 2% BHA Liquid Exfoliant 118ml', 'Paula’s Choice',
    '/images/products/paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-118ml.png',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['BHA 2%','Salicylic acid','118ml'], null,
    'Dung dịch tẩy tế bào chết chứa 2% BHA. Evidence public hiện là một creator dùng đúng liquid variant trong routine vùng dễ bít tắc.',
    'skincare', 'treatment', array['bít tắc','mụn đầu đen','lỗ chân lông','da dầu'],
    array['salicylic acid 2%','green tea','methylpropanediol'],
    array['Paula Choice BHA 2% Liquid','Skin Perfecting BHA 2%','Paula’s Choice 2 BHA'],
    'published'
  )
on conflict (id) do update set
  name = excluded.name, brand = excluded.brand, image = excluded.image,
  rating = null, reviews = 0, sold = excluded.sold, price = excluded.price,
  category = excluded.category, tags = excluded.tags, affiliate_url = null,
  description = excluded.description, category_key = excluded.category_key,
  subcategory_key = excluded.subcategory_key, concern_tags = excluded.concern_tags,
  ingredient_tags = excluded.ingredient_tags, aliases = excluded.aliases,
  status = 'published';

with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), exact_matches(candidate_id, product_id, official_url, image_url, note) as (
  values
    (
      'a8225a5c-3887-46d0-9760-1460855fdb7e'::uuid,
      'dr-althea-345-relief-cream-50ml',
      'https://doctoraltheaglobal.com/products/345-relief-cream',
      'https://doctoraltheaglobal.com/cdn/shop/files/345_cream.jpg?v=1782461402&width=1024',
      'Hai archived frames từ hai creator xác nhận exact Dr.Althea 345 Relief Cream 50 ml; cả hai nguồn có yếu tố affiliate.'
    ),
    (
      'fb969101-83ed-45c8-95cb-27ac0db65564'::uuid,
      'paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-118ml',
      'https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-exfoliant/201-2010.html',
      'https://www.paulaschoice.com/dw/image/v2/BBNX_PRD/on/demandware.static/-/Sites-pc-catalog/default/dw006e394e/images/products/2-percent-bha-liquid-exfoliant-2010-portrait.png?sw=2000&sfrm=png',
      'Archived frame xác nhận exact Skin Perfecting 2% BHA Liquid Exfoliant full size 118 ml.'
    )
)
update public.product_candidates candidate set
  status = 'merged',
  matched_product_id = exact_matches.product_id,
  official_product_url = exact_matches.official_url,
  image_source_url = exact_matches.image_url,
  review_note = exact_matches.note,
  reviewed_by = reviewer.user_id,
  reviewed_at = now(),
  updated_at = now()
from exact_matches cross join reviewer
where candidate.id = exact_matches.candidate_id;

with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
)
insert into public.creator_evidence_items (
  id, creator_id, source_platform, source_url, source_post_id, published_at,
  observed_at, source_title, source_excerpt, raw_text, media_url, status,
  candidate_product_ids, candidate_product_names, researcher_note,
  source_post_ref, extracted_claims, confidence_score, model_name,
  prompt_version, evidence_spans, risk_flags, requires_human_review,
  review_reason, reviewed_by, reviewed_at, updated_at
)
select
  'evidence-tiktok-' || batch.external_post_id || '-' || batch.product_id,
  batch.creator_id, 'TikTok', post.source_url, batch.external_post_id,
  post.published_at, post.observed_at, batch.source_title, batch.source_excerpt,
  post.transcript_text, null, 'published', array[batch.product_id],
  array[batch.product_name], batch.researcher_note, post.id,
  jsonb_build_array(jsonb_build_object(
    'product_id', batch.product_id, 'product_name', batch.product_name,
    'claim', batch.source_excerpt, 'event_type', batch.event_type,
    'disclosure', batch.disclosure
  )),
  batch.confidence_score, 'human-reviewed-transcript-and-frame',
  'manual-sku-review-v3',
  batch.evidence_spans || jsonb_build_array(
    jsonb_build_object('kind','product_page','url',batch.official_product_url)
  ),
  batch.risk_flags, false,
  'Đã đối chiếu exact SKU, hành vi, clip id và disclosure bằng transcript, archived frame và nguồn sản phẩm.',
  reviewer.user_id, now(), now()
from verified_candidate_batch_07 batch
join public.source_posts post
  on post.creator_id = batch.creator_id
 and post.external_post_id = batch.external_post_id
cross join reviewer
where post.transcription_status = 'ready' and post.transcript_text is not null
on conflict (id) do update set
  source_url = excluded.source_url, source_post_id = excluded.source_post_id,
  published_at = excluded.published_at, observed_at = excluded.observed_at,
  source_title = excluded.source_title, source_excerpt = excluded.source_excerpt,
  raw_text = excluded.raw_text, status = 'published',
  candidate_product_ids = excluded.candidate_product_ids,
  candidate_product_names = excluded.candidate_product_names,
  researcher_note = excluded.researcher_note, source_post_ref = excluded.source_post_ref,
  extracted_claims = excluded.extracted_claims, confidence_score = excluded.confidence_score,
  model_name = excluded.model_name, prompt_version = excluded.prompt_version,
  evidence_spans = excluded.evidence_spans, risk_flags = excluded.risk_flags,
  requires_human_review = false, review_reason = excluded.review_reason,
  reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at,
  updated_at = now();

with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
)
insert into public.creator_product_events (
  id, creator_id, product_id, evidence_id, event_type, event_date,
  observed_at, source_platform, source_url, source_post_id, source_title,
  source_excerpt, media_url, sentiment, disclosure, usage_context,
  evidence_note, confidence, confidence_score, verification_status,
  verified_by, verified_at, valid_until, evidence_spans, risk_flags,
  exact_sku_verified, updated_at
)
select
  'event-tiktok-' || batch.external_post_id || '-' || batch.product_id,
  batch.creator_id, batch.product_id,
  'evidence-tiktok-' || batch.external_post_id || '-' || batch.product_id,
  batch.event_type, post.published_at::date, post.observed_at, 'TikTok',
  post.source_url, batch.external_post_id, batch.source_title,
  batch.source_excerpt, null, batch.sentiment, batch.disclosure,
  batch.usage_context, batch.researcher_note, 'high',
  batch.confidence_score, 'verified', reviewer.user_id, now(),
  now() + interval '365 days',
  batch.evidence_spans || jsonb_build_array(
    jsonb_build_object('kind','product_page','url',batch.official_product_url)
  ),
  batch.risk_flags, true, now()
from verified_candidate_batch_07 batch
join public.source_posts post
  on post.creator_id = batch.creator_id
 and post.external_post_id = batch.external_post_id
join public.creator_evidence_items evidence
  on evidence.id = 'evidence-tiktok-' || batch.external_post_id || '-' || batch.product_id
cross join reviewer
on conflict (id) do update set
  creator_id = excluded.creator_id, product_id = excluded.product_id,
  evidence_id = excluded.evidence_id, event_type = excluded.event_type,
  event_date = excluded.event_date, observed_at = excluded.observed_at,
  source_platform = excluded.source_platform, source_url = excluded.source_url,
  source_post_id = excluded.source_post_id, source_title = excluded.source_title,
  source_excerpt = excluded.source_excerpt, sentiment = excluded.sentiment,
  disclosure = excluded.disclosure, usage_context = excluded.usage_context,
  evidence_note = excluded.evidence_note, confidence = excluded.confidence,
  confidence_score = excluded.confidence_score, verification_status = 'verified',
  verified_by = excluded.verified_by, verified_at = excluded.verified_at,
  valid_until = excluded.valid_until, evidence_spans = excluded.evidence_spans,
  risk_flags = excluded.risk_flags, exact_sku_verified = true, updated_at = now();

do $$
declare item record;
begin
  for item in select distinct creator_id, product_id from verified_candidate_batch_07
  loop
    perform private.recompute_creator_product_state(item.creator_id, item.product_id);
  end loop;
end $$;

with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
)
insert into public.evidence_audit_log (
  evidence_id, event_id, actor_id, actor_type, decision, reason, after_data
)
select
  'evidence-tiktok-' || batch.external_post_id || '-' || batch.product_id,
  'event-tiktok-' || batch.external_post_id || '-' || batch.product_id,
  reviewer.user_id, 'admin', 'published',
  'Manual transcript, archived-frame, direct clip URL, disclosure and exact-SKU review completed.',
  jsonb_build_object(
    'creator_id', batch.creator_id, 'product_id', batch.product_id,
    'source_post_id', batch.external_post_id, 'source_url', post.source_url,
    'confidence_score', batch.confidence_score,
    'official_product_url', batch.official_product_url
  )
from verified_candidate_batch_07 batch
join public.source_posts post
  on post.creator_id = batch.creator_id
 and post.external_post_id = batch.external_post_id
cross join reviewer;

with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), labels as (
  select
    post.id as source_post_id,
    case when batch.disclosure in ('sponsored','affiliate','pr') then 'commercial' else 'product_review' end as content_class,
    jsonb_build_array(jsonb_build_object(
      'brand', product.brand, 'product_name', batch.product_name,
      'variant', null, 'product_id', batch.product_id,
      'event_type', batch.event_type, 'disclosure', batch.disclosure
    )) as expected_claims,
    batch.researcher_note as note
  from verified_candidate_batch_07 batch
  join public.source_posts post
    on post.creator_id = batch.creator_id
   and post.external_post_id = batch.external_post_id
  join public.radar_products product on product.id = batch.product_id
)
update public.evidence_golden_samples sample set
  content_class = labels.content_class,
  expected_claims = labels.expected_claims,
  reviewer_note = labels.note,
  status = 'labeled',
  reviewed_by = reviewer.user_id,
  reviewed_at = now(),
  updated_at = now()
from labels cross join reviewer
where sample.source_post_id = labels.source_post_id;
