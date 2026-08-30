-- Human-reviewed candidate batch 04.
--
-- Exact product identity was checked against the archived TikTok post, its
-- transcript/caption and a brand product page. The three new products are
-- intentionally published without ratings or offers; commerce remains gated
-- until an exact destination URL is separately verified.

create temporary table verified_candidate_batch_04 (
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
  risk_flags text[] not null default '{}'::text[]
) on commit drop;

insert into verified_candidate_batch_04 values
  (
    '88c1762d-aebc-48cc-a252-62af504f3041', '34', '7656768885181402389',
    'loreal-revitalift-melasyl-dark-spot-creamy-serum',
    'Revitalift Melasyl Dark Spot Creamy-Serum',
    'used', 'unknown', 'positive',
    'Vũ Thái Bình dùng L’Oréal Revitalift Melasyl Dark Spot Creamy-Serum',
    'Creator cho biết đã dùng nhiều chai, đánh giá 9/10 và mô tả da sáng hơn, vết thâm mờ nhanh hơn sau một thời gian sử dụng.',
    'Signal sử dụng thực tế từ creator thứ hai; video không nêu rõ booking, PR hay affiliate.',
    96,
    'https://www.lorealparisusa.com/skin-care/face-serums/revitalift-triple-power-melasyl-dark-spot-creamy-serum',
    'https://www.lorealparisusa.com/skin-care/face-serums/revitalift-triple-power-melasyl-dark-spot-creamy-serum',
    'Frame hiển thị các chai serum hồng và overlay Melasyl; transcript nêu sử dụng thực tế. Disclosure giữ unknown vì nguồn không nói rõ.',
    array['disclosure_not_stated']::text[]
  ),
  (
    'e99b8fcb-09c5-4dd3-9272-16d451db6ade', '2', '7655905148123876616',
    'benzac-ac-mild-strength-2-5-acne-gel',
    'Benzac AC Mild Strength 2.5% Acne Gel',
    'recommended', 'unknown', 'positive',
    'Góc Của Rư đối chiếu Benzac AC 2.5% trong thử nghiệm chấm mụn 17 ngày',
    'Trong thử nghiệm so sánh, vùng dùng Benzac 2.5% giảm sưng đáng kể và người tham gia ưu tiên bản 2.5% hơn bản 5%.',
    'Kết quả thuộc một thử nghiệm creator quy mô nhỏ, không thay thế tư vấn da liễu; disclosure không được nêu rõ.',
    96,
    'https://www.benzac.com/au/product/mild-strength-acne-gel',
    'https://www.benzac.com/au/sites/default/files/styles/cp_product_medium/public/2026-03/Benzac_AC_2_Tube_60g_Front_RGB_3.png',
    'Pack Benzac AC 2.5% được đọc trong video; transcript tách rõ kết quả 2.5% khỏi 5% và trang Benzac xác nhận đúng nồng độ.',
    array['disclosure_not_stated']::text[]
  ),
  (
    '2900ba03-b4ff-4493-9553-50df18415f57', '2', '7655905148123876616',
    'benzac-ac-moderate-strength-5-acne-gel',
    'Benzac AC Moderate Strength 5% Acne Gel',
    'reviewed', 'unknown', 'mixed',
    'Góc Của Rư đối chiếu Benzac AC 5% trong thử nghiệm chấm mụn 17 ngày',
    'Benzac 5% cũng giúp giảm sưng trong thử nghiệm nhưng người tham gia ghi nhận cảm giác châm chích nhiều hơn bản 2.5%.',
    'Evidence có cả hiệu quả quan sát và caution về dung nạp; disclosure không được nêu rõ.',
    95,
    'https://www.benzac.com/au/product/moderate-strength-acne-gel',
    'https://www.benzac.com/au/sites/default/files/styles/cp_product_medium/public/2024-08/DCO-13051-0.png',
    'Pack Benzac AC 5% và nồng độ đọc được trong video; transcript tách rõ hiệu quả và châm chích so với bản 2.5%.',
    array['disclosure_not_stated','tolerability_caution']::text[]
  ),
  (
    'e5b7bc95-7b61-447a-9a70-1f0fc20a739f', '87', '7664540601139907847',
    'allies-of-skin-multi-peptides-gf-advanced-lifting-serum',
    'Multi Peptides & GF Advanced Lifting Serum',
    'used', 'organic', 'positive',
    'Tôm dùng Allies of Skin Multi Peptides & GF Advanced Lifting Serum',
    'Creator nói rõ video không booking, sản phẩm tự mua; mô tả texture lỏng nhẹ, thấm nhanh và trải nghiệm dùng cùng routine retinoid.',
    'Nguồn organic có sử dụng thực tế; đây là trải nghiệm cá nhân, không phải bằng chứng hiệu quả lâm sàng độc lập.',
    96,
    'https://us.allies.shop/products/multi-peptides-gf-advanced-lifting-serum',
    'https://us.allies.shop/cdn/shop/files/multi-peptides-gf-advanced-lifting-serum_d66a6e0e-e069-4d8e-9db2-7d5315f04a25.png?v=1779971748&width=1200',
    'Sửa brand từ lỗi ASR Ally of Skin thành Allies of Skin; pack đen, tên serum và 3% GF Complex khớp trang chính thức.',
    '{}'::text[]
  );

insert into public.radar_products (
  id, name, brand, image, rating, reviews, sold, price, category, tags,
  affiliate_url, description, category_key, subcategory_key, concern_tags,
  ingredient_tags, aliases, status
) values
  (
    'benzac-ac-mild-strength-2-5-acne-gel',
    'Benzac AC Mild Strength 2.5% Acne Gel', 'Benzac',
    '/images/products/benzac-ac-mild-strength-2-5-gel.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Benzoyl peroxide 2.5%','Acne treatment'], null,
    'Gel benzoyl peroxide 2,5% cho mụn. Có thể gây khô hoặc kích ứng; bắt đầu chậm và dùng theo hướng dẫn chuyên môn.',
    'skincare', 'treatment', array['mụn viêm','mụn đầu trắng'],
    array['benzoyl peroxide 2.5%'],
    array['Benzac 2.5','Benzac AC 2.5%','Benzac Mild Strength Acne Gel'],
    'published'
  ),
  (
    'benzac-ac-moderate-strength-5-acne-gel',
    'Benzac AC Moderate Strength 5% Acne Gel', 'Benzac',
    '/images/products/benzac-ac-moderate-strength-5-gel.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Benzoyl peroxide 5%','Acne treatment'], null,
    'Gel benzoyl peroxide 5% cho mụn. Nồng độ cao hơn có thể tăng kích ứng; không nên tự tăng mức nếu da chưa dung nạp.',
    'skincare', 'treatment', array['mụn viêm','mụn đầu trắng'],
    array['benzoyl peroxide 5%'],
    array['Benzac 5','Benzac AC 5%','Benzac Moderate Strength Acne Gel'],
    'published'
  ),
  (
    'allies-of-skin-multi-peptides-gf-advanced-lifting-serum',
    'Multi Peptides & GF Advanced Lifting Serum', 'Allies of Skin',
    '/images/products/allies-of-skin-multi-peptides-gf-advanced-lifting-serum.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['3% GF Complex','9% Peptide Complex','Serum'], null,
    'Serum peptide và growth-factor complex có texture lỏng nhẹ; evidence public hiện là trải nghiệm organic từ một creator.',
    'skincare', 'serum', array['lão hóa','độ đàn hồi','nếp nhăn'],
    array['growth factor complex 3%','peptide complex 9%'],
    array['Allies of Skin GF Serum','3% GF Complex Serum','Multi Peptides and GF Advanced Lifting Serum'],
    'published'
  )
on conflict (id) do update set
  name = excluded.name,
  brand = excluded.brand,
  image = excluded.image,
  rating = null,
  reviews = 0,
  sold = excluded.sold,
  price = excluded.price,
  category = excluded.category,
  tags = excluded.tags,
  affiliate_url = null,
  description = excluded.description,
  category_key = excluded.category_key,
  subcategory_key = excluded.subcategory_key,
  concern_tags = excluded.concern_tags,
  ingredient_tags = excluded.ingredient_tags,
  aliases = excluded.aliases,
  status = 'published';

-- Merge reviewed exact candidates. Duplicate detections are closed without
-- creating duplicate public events; Melasyl gets a new event because this post
-- is from a second independent creator.
with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), exact_matches(candidate_id, product_id, official_url, image_url, note) as (
  values
    ('cd8e8e79-4497-442d-94d1-b9b10a4aec50'::uuid, 'skinoxy-pro-b3-aha-concentrate-body-serum', 'https://www.skinoxy.com/skinoxy-pro-b3-aha-concentrate-body-serum-275g.html', 'https://www.skinoxy.com/skinoxy-pro-b3-aha-concentrate-body-serum-275g.html', 'Exact candidate trùng post/SKU đã public; merge để không nhân đôi signal affiliate.'),
    ('d2aaa6e7-88a4-4281-a70f-7b68822e2f4d'::uuid, 'biore-uv-aqua-rich-mild-essence', 'https://www.kao.com/vn/products/biore/bio_uv_aquarich_mild_00/', 'https://www.kao.com/vn/products/biore/bio_uv_aquarich_mild_00/', 'Exact candidate trùng post/SKU Bioré đã public; merge không tạo event lặp.'),
    ('88c1762d-aebc-48cc-a252-62af504f3041'::uuid, 'loreal-revitalift-melasyl-dark-spot-creamy-serum', 'https://www.lorealparisusa.com/skin-care/face-serums/revitalift-triple-power-melasyl-dark-spot-creamy-serum', 'https://www.lorealparisusa.com/skin-care/face-serums/revitalift-triple-power-melasyl-dark-spot-creamy-serum', 'Frame, overlay Melasyl, transcript và catalogue official source xác nhận exact serum; disclosure vẫn unknown.'),
    ('e99b8fcb-09c5-4dd3-9272-16d451db6ade'::uuid, 'benzac-ac-mild-strength-2-5-acne-gel', 'https://www.benzac.com/au/product/mild-strength-acne-gel', 'https://www.benzac.com/au/sites/default/files/styles/cp_product_medium/public/2026-03/Benzac_AC_2_Tube_60g_Front_RGB_3.png', 'Video, transcript và trang Benzac xác nhận exact strength 2.5%.'),
    ('2900ba03-b4ff-4493-9553-50df18415f57'::uuid, 'benzac-ac-moderate-strength-5-acne-gel', 'https://www.benzac.com/au/product/moderate-strength-acne-gel', 'https://www.benzac.com/au/sites/default/files/styles/cp_product_medium/public/2024-08/DCO-13051-0.png', 'Video, transcript và trang Benzac xác nhận exact strength 5%.'),
    ('e5b7bc95-7b61-447a-9a70-1f0fc20a739f'::uuid, 'allies-of-skin-multi-peptides-gf-advanced-lifting-serum', 'https://us.allies.shop/products/multi-peptides-gf-advanced-lifting-serum', 'https://us.allies.shop/cdn/shop/files/multi-peptides-gf-advanced-lifting-serum_d66a6e0e-e069-4d8e-9db2-7d5315f04a25.png?v=1779971748&width=1200', 'Sửa alias ASR; frame, 3% GF Complex và trang Allies of Skin xác nhận exact serum.')
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
  post.published_at, post.observed_at, batch.source_title,
  batch.source_excerpt, post.transcript_text, null, 'published',
  array[batch.product_id], array[batch.product_name], batch.researcher_note,
  post.id,
  jsonb_build_array(jsonb_build_object(
    'product_id', batch.product_id,
    'product_name', batch.product_name,
    'claim', batch.source_excerpt,
    'event_type', batch.event_type,
    'disclosure', batch.disclosure
  )),
  batch.confidence_score, 'human-reviewed-transcript-and-frame',
  'manual-sku-review-v2',
  jsonb_build_array(
    jsonb_build_object('source', 'transcript', 'external_post_id', batch.external_post_id),
    jsonb_build_object('source', 'archived_video_frame', 'external_post_id', batch.external_post_id),
    jsonb_build_object('source', 'product_page', 'url', batch.official_product_url)
  ),
  batch.risk_flags,
  false,
  'Đã đối chiếu exact SKU, hành vi và disclosure bằng transcript, frame video và nguồn sản phẩm.',
  reviewer.user_id, now(), now()
from verified_candidate_batch_04 batch
join public.source_posts post
  on post.creator_id = batch.creator_id
 and post.external_post_id = batch.external_post_id
cross join reviewer
where post.transcription_status = 'ready'
  and post.transcript_text is not null
on conflict (id) do update set
  source_url = excluded.source_url,
  published_at = excluded.published_at,
  observed_at = excluded.observed_at,
  source_title = excluded.source_title,
  source_excerpt = excluded.source_excerpt,
  raw_text = excluded.raw_text,
  status = 'published',
  candidate_product_ids = excluded.candidate_product_ids,
  candidate_product_names = excluded.candidate_product_names,
  researcher_note = excluded.researcher_note,
  source_post_ref = excluded.source_post_ref,
  extracted_claims = excluded.extracted_claims,
  confidence_score = excluded.confidence_score,
  model_name = excluded.model_name,
  prompt_version = excluded.prompt_version,
  evidence_spans = excluded.evidence_spans,
  risk_flags = excluded.risk_flags,
  requires_human_review = false,
  review_reason = excluded.review_reason,
  reviewed_by = excluded.reviewed_by,
  reviewed_at = excluded.reviewed_at,
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
  jsonb_build_array(
    jsonb_build_object('source', 'transcript', 'external_post_id', batch.external_post_id),
    jsonb_build_object('source', 'archived_video_frame', 'external_post_id', batch.external_post_id),
    jsonb_build_object('source', 'product_page', 'url', batch.official_product_url)
  ),
  batch.risk_flags,
  true, now()
from verified_candidate_batch_04 batch
join public.source_posts post
  on post.creator_id = batch.creator_id
 and post.external_post_id = batch.external_post_id
join public.creator_evidence_items evidence
  on evidence.id = 'evidence-tiktok-' || batch.external_post_id || '-' || batch.product_id
cross join reviewer
on conflict (id) do update set
  creator_id = excluded.creator_id,
  product_id = excluded.product_id,
  evidence_id = excluded.evidence_id,
  event_type = excluded.event_type,
  event_date = excluded.event_date,
  observed_at = excluded.observed_at,
  source_platform = excluded.source_platform,
  source_url = excluded.source_url,
  source_post_id = excluded.source_post_id,
  source_title = excluded.source_title,
  source_excerpt = excluded.source_excerpt,
  sentiment = excluded.sentiment,
  disclosure = excluded.disclosure,
  usage_context = excluded.usage_context,
  evidence_note = excluded.evidence_note,
  confidence = excluded.confidence,
  confidence_score = excluded.confidence_score,
  verification_status = 'verified',
  verified_by = excluded.verified_by,
  verified_at = excluded.verified_at,
  valid_until = excluded.valid_until,
  evidence_spans = excluded.evidence_spans,
  risk_flags = excluded.risk_flags,
  exact_sku_verified = true,
  updated_at = now();

do $$
declare item record;
begin
  for item in select distinct creator_id, product_id from verified_candidate_batch_04
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
  'Manual transcript, archived-frame, disclosure and exact-SKU review completed.',
  jsonb_build_object(
    'creator_id', batch.creator_id,
    'product_id', batch.product_id,
    'source_post_id', batch.external_post_id,
    'confidence_score', batch.confidence_score,
    'official_product_url', batch.official_product_url
  )
from verified_candidate_batch_04 batch
cross join reviewer;

-- Only samples that were genuinely inspected in this batch are labeled.
with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), labels(external_post_id, content_class, expected_claims, note) as (
  values
    (
      '7656768885181402389', 'product_review',
      jsonb_build_array(jsonb_build_object(
        'brand', 'L''Oréal Paris',
        'product_name', 'Revitalift Melasyl Dark Spot Creamy-Serum',
        'variant', null,
        'product_id', 'loreal-revitalift-melasyl-dark-spot-creamy-serum',
        'event_type', 'used',
        'disclosure', 'unknown'
      )),
      'Transcript và frame xác nhận Melasyl Creamy-Serum; creator nói đã dùng nhiều chai nhưng không nêu disclosure.'
    ),
    (
      '7655905148123876616', 'product_review',
      jsonb_build_array(
        jsonb_build_object(
          'brand', 'Benzac',
          'product_name', 'Benzac AC Mild Strength 2.5% Acne Gel',
          'variant', '2.5%',
          'product_id', 'benzac-ac-mild-strength-2-5-acne-gel',
          'event_type', 'recommended',
          'disclosure', 'unknown'
        ),
        jsonb_build_object(
          'brand', 'Benzac',
          'product_name', 'Benzac AC Moderate Strength 5% Acne Gel',
          'variant', '5%',
          'product_id', 'benzac-ac-moderate-strength-5-acne-gel',
          'event_type', 'reviewed',
          'disclosure', 'unknown'
        )
      ),
      'Transcript và frame tách exact 2.5%/5%; 2.5% được ưu tiên còn 5% gây châm chích hơn trong thử nghiệm.'
    )
)
update public.evidence_golden_samples sample set
  content_class = labels.content_class,
  expected_claims = labels.expected_claims,
  reviewer_note = labels.note,
  status = 'labeled',
  reviewed_by = reviewer.user_id,
  reviewed_at = now(),
  updated_at = now()
from labels
join public.source_posts post on post.external_post_id = labels.external_post_id
cross join reviewer
where sample.source_post_id = post.id;
