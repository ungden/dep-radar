-- Human-reviewed candidate batch 05.
--
-- Each row below was checked against the archived TikTok video, transcript,
-- visible pack and an official brand product page. Products remain offerless
-- and unrated until those independent quality gates are satisfied.

create temporary table verified_candidate_batch_05 (
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

insert into verified_candidate_batch_05 values
  (
    '7b1ab445-a36b-46f5-9ccd-d42522873186', '34', '7614350581133544725',
    'loreal-revitalift-triple-power-tri-peptides-age-defying-serum',
    'RevitaLift Triple Power Tri-Peptides Age-Defying Serum',
    'used', 'unknown', 'positive',
    'Vũ Thái Bình dùng RevitaLift Triple Power Tri-Peptides Age-Defying Serum',
    'Creator cho biết đã trải nghiệm bộ đôi trong bốn tuần; riêng serum có kết cấu lỏng nhẹ và có thể dùng sáng lẫn tối.',
    'Signal sử dụng thực tế trong video nói về cả serum và kem dưỡng; event này chỉ ghi nhận phần serum đã được nhìn thấy và gọi tên chính xác.',
    96,
    'https://www.lorealparisusa.com/skin-care/face-serums/revitalift-triple-power-age-defying-serum',
    'https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/face-serums/revitalift-triple-power-age-defying-serum/071249703212-t1.png',
    'Pack đỏ Tri-Peptides Age-Defying Serum khớp trang L’Oréal. Video là nội dung nhiều sản phẩm nên chỉ tạo event cho exact serum; disclosure không được nêu rõ.',
    array['disclosure_not_stated','multi_product_bundle']::text[]
  ),
  (
    '7b1ab445-a36b-46f5-9ccd-d42522873186', '84', '7617475859699567893',
    'loreal-revitalift-triple-power-tri-peptides-age-defying-serum',
    'RevitaLift Triple Power Tri-Peptides Age-Defying Serum',
    'used', 'unknown', 'positive',
    'Bác sĩ Hằng Trần dùng RevitaLift Triple Power Tri-Peptides Age-Defying Serum',
    'Creator nói gần đây đã dùng serum, mô tả pack đỏ và thảo luận Tri-Peptides, hyaluronic acid cùng trải nghiệm kết cấu của bộ sản phẩm.',
    'Nguồn chuyên gia có trải nghiệm sử dụng nhưng vẫn là nội dung creator; không xem các claim của brand được nhắc trong video là bằng chứng lâm sàng độc lập.',
    95,
    'https://www.lorealparisusa.com/skin-care/face-serums/revitalift-triple-power-age-defying-serum',
    'https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/face-serums/revitalift-triple-power-age-defying-serum/071249703212-t1.png',
    'Pack đỏ và tên RevitaLift Triple Power khớp nguồn hãng; serum được tách khỏi hai kem dưỡng xuất hiện cùng video. Disclosure giữ unknown.',
    array['disclosure_not_stated','multi_product_bundle']::text[]
  ),
  (
    '6c0cec70-cfee-4a32-98f4-867518439a89', '83', '7645567416235330823',
    'biotrade-keratolin-hydro-body-lotion-8-urea',
    'Keratolin Hydro Body Lotion 8% Urea',
    'reviewed', 'unknown', 'positive',
    'Bác sĩ Minh Điềm review Biotrade Keratolin Hydro Body Lotion 8% Urea',
    'Creator cho biết thường dùng hoặc tư vấn dòng lotion 8% urea, mô tả texture dạng emulsion, độ ẩm mịn và hai dung tích 200 ml, 400 ml.',
    'Review tập trung vào body lotion 8% urea; disclosure không được nêu trong caption hoặc transcript.',
    97,
    'https://biotrade.global/product/keratolin-hydro-body-lotion-8-urea/',
    'https://biotrade.global/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2020/03/keratolin-8-urea-1.jpg.webp',
    'Tên Keratolin, nồng độ 8% urea, dạng lotion và pack trắng-xanh khớp video lẫn trang Biotrade chính thức.',
    array['disclosure_not_stated']::text[]
  ),
  (
    'dae017e5-f2aa-48e9-bb6e-b03719301440', '84', '7620819047860653332',
    'simple-repair-plus-replenishing-cream-cleanser',
    'Repair+ Replenishing Cream Cleanser',
    'used', 'sponsored', 'positive',
    'Bác sĩ Hằng Trần dùng Simple Repair+ Replenishing Cream Cleanser',
    'Creator giới thiệu sữa rửa mặt Repair+ với 11% Pro-Ceramides và hyaluronic acid, đồng thời nói đã dùng bộ đôi cleanser và kem dưỡng.',
    'Nội dung hợp tác với Unilever, vì vậy signal được công khai nhưng mang disclosure sponsored và không được tính như nguồn organic.',
    97,
    'https://www.simple.co.uk/p/repair%20-replenishing-cream-cleanser.html/08720181705380',
    'https://assets.unileversolutions.com/v1/137856909.png',
    'Pack Repair+ Cream Cleanser, Pro-Ceramides + Hyaluronic Acid khớp video và trang Simple; caption có hashtag hợp tác cùng Unilever.',
    array['commercial_content','multi_product_bundle']::text[]
  ),
  (
    'b9a280fa-2c61-423a-9465-a27087a869d1', '84', '7620819047860653332',
    'simple-repair-plus-rich-face-cream',
    'Repair+ Pro-Ceramides + Cica Rich Face Cream',
    'used', 'sponsored', 'positive',
    'Bác sĩ Hằng Trần dùng Simple Repair+ Pro-Ceramides + Cica Rich Face Cream',
    'Creator giới thiệu kem Repair+ với hệ 22% Pro-Ceramides và cica, cho biết bộ đôi giúp da bớt căng, ít bong tróc và ổn định nhanh hơn.',
    'Nội dung hợp tác với Unilever, vì vậy signal được công khai nhưng mang disclosure sponsored và không được tính như nguồn organic.',
    97,
    'https://www.simple.co.uk/p/repair%2B-pro-ceramides-%2B-cica-facial-moisturiser.html/08720181705373',
    'https://assets.unileversolutions.com/v1/137393407.png',
    'Hũ Repair+ Rich Cream, Pro-Ceramides + Cica khớp video và trang Simple; caption có hashtag hợp tác cùng Unilever.',
    array['commercial_content','multi_product_bundle']::text[]
  ),
  (
    '6f6c44de-74c5-4bae-be97-21f4422506cc', '87', '7642613151959239944',
    'geek-gorgeous-stress-less',
    'Stress Less 0.2% Beta-Glucan + 0.3% Madecassoside Serum',
    'recommended', 'affiliate', 'positive',
    'Tôm chấm Geek & Gorgeous Stress Less 10/10 trong roundup phục hồi có affiliate',
    'Creator gọi đúng Stress Less, nêu đây là công thức beta-glucan và madecassoside giá dễ tiếp cận, rồi chấm sản phẩm 10/10.',
    'Video là roundup nhiều sản phẩm và creator nói rõ hoạt động affiliate; event phản ánh recommendation thương mại, không phải xác nhận organic độc lập.',
    94,
    'https://geekandgorgeous.us/products/stress-less',
    'https://geekandgorgeous.us/cdn/shop/files/StressLess-new-front.jpg?v=1715589127&width=1200',
    'Pack nâu-trắng Stress Less và công thức 0.2% beta-glucan, 0.3% madecassoside khớp frame và trang Geek & Gorgeous.',
    array['commercial_content','multi_product_bundle']::text[]
  );

insert into public.radar_products (
  id, name, brand, image, rating, reviews, sold, price, category, tags,
  affiliate_url, description, category_key, subcategory_key, concern_tags,
  ingredient_tags, aliases, status
) values
  (
    'loreal-revitalift-triple-power-tri-peptides-age-defying-serum',
    'RevitaLift Triple Power Tri-Peptides Age-Defying Serum', 'L’Oréal Paris',
    '/images/products/loreal-revitalift-triple-power-age-defying-serum.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Tri-Peptides','Hyaluronic Acid','Vitamin C'], null,
    'Serum chống lão hóa chứa tri-peptides, hyaluronic acid và vitamin C. Hai creator độc lập đã nói về trải nghiệm dùng; disclosure của cả hai nguồn chưa được nêu rõ.',
    'skincare', 'serum', array['lão hóa','nếp nhăn','độ đàn hồi','da xỉn màu'],
    array['tri-peptides','hyaluronic acid','vitamin c'],
    array['Revitalift Triple Power Serum','L’Oreal Triple Power Tri-Peptides Serum','Revitalip Triple Power Serum'],
    'published'
  ),
  (
    'biotrade-keratolin-hydro-body-lotion-8-urea',
    'Keratolin Hydro Body Lotion 8% Urea', 'Biotrade',
    '/images/products/biotrade-keratolin-hydro-body-lotion-8-urea.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Bodycare',
    array['Urea 8%','Glycerin','Body lotion'], null,
    'Sữa dưỡng thể 8% urea và glycerin cho da body khô, căng hoặc bong tróc. Evidence public hiện đến từ một bác sĩ da liễu; disclosure chưa được nêu rõ.',
    'bodycare', 'body_lotion', array['da body khô','da bong tróc','da căng ngứa'],
    array['urea 8%','glycerin'],
    array['Keratolin 8% Urea','Biotrade Keratolin Body Lotion','Keracoline 8%'],
    'published'
  ),
  (
    'simple-repair-plus-replenishing-cream-cleanser',
    'Repair+ Replenishing Cream Cleanser', 'Simple',
    '/images/products/simple-repair-plus-replenishing-cream-cleanser.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Pro-Ceramides','Hyaluronic Acid','Cream cleanser'], null,
    'Sữa rửa mặt dạng cream thuộc dòng Repair+, hướng đến làm sạch dịu và hỗ trợ hàng rào da. Evidence public hiện là nội dung hợp tác thương mại.',
    'skincare', 'cleanser', array['da khô','da nhạy cảm','hàng rào da yếu'],
    array['pro-ceramides','hyaluronic acid'],
    array['Simple Repair Cream Cleanser','Simple Repair+ Cleanser','Repair+ 11% Pro-Ceramides Cleanser'],
    'published'
  ),
  (
    'simple-repair-plus-rich-face-cream',
    'Repair+ Pro-Ceramides + Cica Rich Face Cream', 'Simple',
    '/images/products/simple-repair-plus-rich-face-cream.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Pro-Ceramides','Cica','Rich cream'], null,
    'Kem dưỡng Repair+ giàu ẩm với pro-ceramides và cica, hướng đến da khô hoặc hàng rào da suy yếu. Evidence public hiện là nội dung hợp tác thương mại.',
    'skincare', 'moisturizer', array['da khô','da nhạy cảm','phục hồi hàng rào da'],
    array['pro-ceramides','cica','panthenol'],
    array['Simple Repair Rich Cream','Simple Repair+ Rich Cream','Repair Rich Cream 22% Pro-Ceramides'],
    'published'
  ),
  (
    'geek-gorgeous-stress-less',
    'Stress Less 0.2% Beta-Glucan + 0.3% Madecassoside Serum', 'Geek & Gorgeous',
    '/images/products/geek-gorgeous-stress-less.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Beta-Glucan 0.2%','Madecassoside 0.3%','Soothing serum'], null,
    'Serum làm dịu với 0,2% beta-glucan và 0,3% madecassoside. Evidence hiện là recommendation trong nội dung có affiliate nên được gắn nhãn thương mại rõ ràng.',
    'skincare', 'serum', array['da nhạy cảm','đỏ rát','hàng rào da yếu','thiếu ẩm'],
    array['beta-glucan 0.2%','madecassoside 0.3%'],
    array['Geek and Gorgeous Stress Less','G&G Stress Less','Stress Lab'],
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

with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), exact_matches(candidate_id, product_id, official_url, image_url, note) as (
  values
    ('7b1ab445-a36b-46f5-9ccd-d42522873186'::uuid, 'loreal-revitalift-triple-power-tri-peptides-age-defying-serum', 'https://www.lorealparisusa.com/skin-care/face-serums/revitalift-triple-power-age-defying-serum', 'https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/face-serums/revitalift-triple-power-age-defying-serum/071249703212-t1.png', 'Hai archived video, transcript và pack đỏ đối chiếu đúng Tri-Peptides Age-Defying Serum; hai kem dưỡng cùng video không được merge vào SKU này.'),
    ('6c0cec70-cfee-4a32-98f4-867518439a89'::uuid, 'biotrade-keratolin-hydro-body-lotion-8-urea', 'https://biotrade.global/product/keratolin-hydro-body-lotion-8-urea/', 'https://biotrade.global/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2020/03/keratolin-8-urea-1.jpg.webp', 'Frame, transcript và trang Biotrade xác nhận exact lotion 8% urea.'),
    ('dae017e5-f2aa-48e9-bb6e-b03719301440'::uuid, 'simple-repair-plus-replenishing-cream-cleanser', 'https://www.simple.co.uk/p/repair%20-replenishing-cream-cleanser.html/08720181705380', 'https://assets.unileversolutions.com/v1/137856909.png', 'Pack, tên Repair+ Cream Cleanser và nguồn Simple xác nhận exact cleanser; nội dung sponsored.'),
    ('b9a280fa-2c61-423a-9465-a27087a869d1'::uuid, 'simple-repair-plus-rich-face-cream', 'https://www.simple.co.uk/p/repair%2B-pro-ceramides-%2B-cica-facial-moisturiser.html/08720181705373', 'https://assets.unileversolutions.com/v1/137393407.png', 'Hũ Repair+ Rich Cream, pro-ceramides + cica và nguồn Simple xác nhận exact moisturizer; nội dung sponsored.'),
    ('6f6c44de-74c5-4bae-be97-21f4422506cc'::uuid, 'geek-gorgeous-stress-less', 'https://geekandgorgeous.us/products/stress-less', 'https://geekandgorgeous.us/cdn/shop/files/StressLess-new-front.jpg?v=1715589127&width=1200', 'Pack và công thức 0.2% beta-glucan, 0.3% madecassoside khớp Stress Less; transcript nói rõ affiliate.')
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
from verified_candidate_batch_05 batch
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
from verified_candidate_batch_05 batch
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
  for item in select distinct creator_id, product_id from verified_candidate_batch_05
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
from verified_candidate_batch_05 batch
cross join reviewer;

-- Only posts inspected in this batch are added to the labeled golden set.
with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), labels(external_post_id, content_class, expected_claims, note) as (
  values
    (
      '7614350581133544725', 'product_review',
      jsonb_build_array(jsonb_build_object(
        'brand', 'L’Oréal Paris',
        'product_name', 'RevitaLift Triple Power Tri-Peptides Age-Defying Serum',
        'variant', null,
        'product_id', 'loreal-revitalift-triple-power-tri-peptides-age-defying-serum',
        'event_type', 'used',
        'disclosure', 'unknown'
      )),
      'Frame và transcript xác nhận exact serum trong bundle; creator mô tả trải nghiệm bốn tuần, disclosure không được nêu.'
    ),
    (
      '7617475859699567893', 'product_review',
      jsonb_build_array(jsonb_build_object(
        'brand', 'L’Oréal Paris',
        'product_name', 'RevitaLift Triple Power Tri-Peptides Age-Defying Serum',
        'variant', null,
        'product_id', 'loreal-revitalift-triple-power-tri-peptides-age-defying-serum',
        'event_type', 'used',
        'disclosure', 'unknown'
      )),
      'Frame và transcript xác nhận exact serum; video có thêm hai cream nên chỉ label claim serum rõ ràng.'
    ),
    (
      '7620819047860653332', 'commercial',
      jsonb_build_array(
        jsonb_build_object(
          'brand', 'Simple',
          'product_name', 'Repair+ Replenishing Cream Cleanser',
          'variant', '11% Pro-Ceramides',
          'product_id', 'simple-repair-plus-replenishing-cream-cleanser',
          'event_type', 'used',
          'disclosure', 'sponsored'
        ),
        jsonb_build_object(
          'brand', 'Simple',
          'product_name', 'Repair+ Pro-Ceramides + Cica Rich Face Cream',
          'variant', '22% Pro-Ceramides',
          'product_id', 'simple-repair-plus-rich-face-cream',
          'event_type', 'used',
          'disclosure', 'sponsored'
        )
      ),
      'Pack, transcript và hashtag hợp tác cùng Unilever xác nhận hai exact SKU và disclosure sponsored.'
    ),
    (
      '7645567416235330823', 'product_review',
      jsonb_build_array(jsonb_build_object(
        'brand', 'Biotrade',
        'product_name', 'Keratolin Hydro Body Lotion 8% Urea',
        'variant', '8% Urea',
        'product_id', 'biotrade-keratolin-hydro-body-lotion-8-urea',
        'event_type', 'reviewed',
        'disclosure', 'unknown'
      )),
      'Frame, transcript và trang Biotrade xác nhận lotion 8% urea; disclosure không được nêu.'
    ),
    (
      '7642613151959239944', 'commercial',
      jsonb_build_array(jsonb_build_object(
        'brand', 'Geek & Gorgeous',
        'product_name', 'Stress Less',
        'variant', '0.2% Beta-Glucan + 0.3% Madecassoside',
        'product_id', 'geek-gorgeous-stress-less',
        'event_type', 'recommended',
        'disclosure', 'affiliate'
      )),
      'Roundup nhiều sản phẩm; pack và công thức xác nhận Stress Less, transcript nêu rõ affiliate.'
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
