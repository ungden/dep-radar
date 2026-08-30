-- Human-reviewed candidate batch 03.
--
-- Every public event below was checked against the archived TikTok video,
-- transcript/caption and a brand or verified-retailer product page. Product
-- records remain useful without an offer; affiliate_url stays null until an
-- exact SKU destination has been separately verified.

create temporary table verified_candidate_batch_03 (
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
  researcher_note text not null
) on commit drop;

insert into verified_candidate_batch_03 values
  (
    'f1549e76-094c-491f-adc1-4f27aad6fd19', '55', '7661990487099837717',
    'cocoon-hau-giang-lotus-mineral-sunscreen-50ml',
    'Sữa chống nắng vô cơ Sen Hậu Giang 50ml - Tone-up Beige',
    'used', 'sponsored', 'positive',
    'Kỳ Kỳ dùng sữa chống nắng vô cơ Sen Hậu Giang tại sự kiện Cocoon',
    'Creator thoa thêm lớp thứ hai trên nền đã dùng sản phẩm, mô tả finish đều màu và cho biết đây là nội dung hợp tác cùng Cocoon.',
    'Dùng trực tiếp tại sự kiện brand; disclosure thương mại được giữ nguyên và không được tính như nguồn organic.',
    97,
    'https://cocoonvietnam.com/san-pham/sua-chong-nang-vo-co-sen-hau-giang-50ml-tone-up-beige',
    'https://cocoonvietnam.com/san-pham/sua-chong-nang-vo-co-sen-hau-giang-50ml-tone-up-beige',
    'Packshot trong video, tên Tone-up Beige, dung tích 50ml và trang chính thức Cocoon trùng khớp.'
  ),
  (
    '5a471038-dd0e-4941-a01c-2510c7b3d8de', '34', '7652351444204555541',
    'olay-super-spf50-fluid-moisturiser',
    'Super SPF50+ Fluid Moisturiser PA++++ 50ml',
    'reviewed', 'unknown', 'positive',
    'Vũ Thái Bình review Olay Super SPF50+ Fluid Moisturiser',
    'Creator cho biết đã dùng hơn một tuần, mô tả độ ẩm, finish và khả năng dùng dưới lớp makeup.',
    'Review có sử dụng thực tế; caption và transcript không đủ dữ liệu để kết luận hình thức hợp tác.',
    96,
    'https://www.watsons.com.ph/olay-olay-super-spf50-pa-fluid-moisturiser-50ml/p/BP_50059877',
    'https://www.watsons.com.ph/olay-olay-super-spf50-pa-fluid-moisturiser-50ml/p/BP_50059877',
    'Nhãn Olay Super SPF50+ Fluid Moisturiser PA++++ 50ml đọc rõ trong frame và trùng với listing Watsons.'
  ),
  (
    '735b10e9-c606-4090-955d-9146de8d51ae', '84', '7664593659915930900',
    'celimax-vita-a-retinal-shot-tightening-booster',
    'The Vita-A Retinal Shot Tightening Booster 15ml',
    'recommended', 'unknown', 'mixed',
    'Bác sĩ Hằng Trần phân tích Celimax Vita-A Retinal Shot Tightening Booster',
    'Creator nêu retinal 0,1%, công nghệ A-Shot, Matrixyl 3000 và hướng dẫn tăng tần suất từ từ để hạn chế kích ứng.',
    'Nguồn chuyên gia có exact SKU và cảnh báo sử dụng; disclosure không được nêu rõ.',
    96,
    'https://www.celimax.com/product/81201d39-c40a-4a68-9700-2acacdc37f23',
    'https://hypercape-build.s3.ap-northeast-2.amazonaws.com/images/product/1770103686783_3e67a6c0356c4d5fb27bc830cdae60fa.jpg',
    'Packshot Retinal 0.1% trong video trùng với trang sản phẩm chính thức Celimax; sửa lỗi ASR Retinol thành Retinal.'
  ),
  (
    'ab529179-3c0c-4cf0-9872-96517e27f85b', '52', '7647154520094510344',
    'ahc-masters-tone-up-sun-serum',
    'Masters Tone-Up Sun Serum SPF50+ PA++++ 50ml',
    'reviewed', 'unknown', 'mixed',
    'Skincare Đúng Cách by Sơn review AHC Masters Tone-Up Sun Serum',
    'Creator cho biết đã dùng trong ba tuần, mô tả finish căng bóng và cảnh báo da dầu cân nhắc vì độ ẩm cao.',
    'Review có sử dụng thực tế; disclosure không được nêu rõ nên giữ trạng thái unknown.',
    95,
    'https://www.hwahae.com/en/products/AHC-Masters-Tone-Up-Sun-Serum-SPF50PLUS-PAPLUS-PLUS-PLUS-PLUS/2194634',
    'https://www.dodoskin.com/cdn/shop/files/AHCMastersTone-UpSunSerumSPF50_PA_50ml-1.jpg?v=1779754972',
    'Tên MASTERS TONE UP SUN SERUM, SPF50+ PA++++ và pack đen đọc được trong video, khớp listing sản phẩm truy xuất được.'
  ),
  (
    '0598dee9-fd9e-401b-9597-c7133043d86d', '84', '7648253127786827029',
    'martiderm-dsp-intense-booster',
    'DSP-Intense Booster 30ml',
    'recommended', 'unknown', 'mixed',
    'Bác sĩ Hằng Trần phân tích MartiDerm DSP-Intense Booster',
    'Creator giới thiệu cysteamine, công thức hai ngăn và nhóm người tăng sắc tố có thể cân nhắc; nội dung có lưu ý cách dùng.',
    'Nguồn chuyên gia có exact SKU; disclosure không được nêu rõ.',
    96,
    'https://www.martiderm.com/int-en/products/dsp-intense-booster',
    'https://www.martiderm.com/sites/default/files/styles/crop_3_4/public/img/dsp-intense-booster-despigmentante-martiderm.jpg.webp?h=b3fafa37&itok=hRZnWDM9',
    'Packshot DSP-INTENSE BOOSTER và cấu trúc hai ngăn trong video trùng với trang chính thức MartiDerm; sửa lỗi ASR Intensity thành Intense.'
  );

insert into public.radar_products (
  id, name, brand, image, rating, reviews, sold, price, category, tags,
  affiliate_url, description, category_key, subcategory_key, concern_tags,
  ingredient_tags, aliases, status
) values
  (
    'celimax-vita-a-retinal-shot-tightening-booster',
    'The Vita-A Retinal Shot Tightening Booster 15ml', 'Celimax',
    '/images/products/celimax-vita-a-retinal-shot-tightening-booster.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Retinal 0.1%','A-Shot','15ml'], null,
    'Treatment retinal 0,1% dạng booster; cần tăng tần suất từ từ và dùng chống nắng ban ngày.',
    'skincare', 'treatment', array['lão hóa','nếp nhăn','texture'],
    array['retinal 0.1%','panthenol 1%','Matrixyl 3000'],
    array['Celimax Retinal Shot','Vita A Retinal Shot Tightening Booster','Vita-A Retinol Shot'],
    'published'
  ),
  (
    'ahc-masters-tone-up-sun-serum',
    'Masters Tone-Up Sun Serum SPF50+ PA++++ 50ml', 'AHC',
    '/images/products/ahc-masters-tone-up-sun-serum.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['SPF50+','PA++++','Tone-up'], null,
    'Serum chống nắng nâng tông hồng, cho finish ẩm bóng và có thể dùng như lớp lót makeup.',
    'skincare', 'sunscreen', array['chống nắng','da xỉn màu','makeup base'],
    array['zinc oxide','titanium dioxide','niacinamide','hyaluronic acid'],
    array['AHC Master Tone Up Sun Serum','AHC Masters Tone-Up Sun','Master Tone Up Sun Serum'],
    'published'
  ),
  (
    'martiderm-dsp-intense-booster',
    'DSP-Intense Booster 30ml', 'MartiDerm',
    '/images/products/martiderm-dsp-intense-booster.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Cysteamine','Retinol','30ml'], null,
    'Mặt nạ treatment hai ngăn cho tăng sắc tố; cần tuân thủ hướng dẫn, tăng tần suất theo khả năng dung nạp và chống nắng.',
    'skincare', 'treatment', array['nám','đốm nâu','tăng sắc tố'],
    array['cysteamine','tranexamic acid','retinol','niacinamide'],
    array['Martiderm DSP Intensity Booster','DSP Intense Booster','DSP-Intensity Booster'],
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

-- Resolve exact candidates to the canonical product record. These rows remain
-- private admin provenance; only the reviewed evidence/event rows below are
-- eligible for anon SELECT.
with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), exact_matches(candidate_id, product_id, official_url, image_url, note) as (
  values
    ('f1549e76-094c-491f-adc1-4f27aad6fd19'::uuid, 'cocoon-hau-giang-lotus-mineral-sunscreen-50ml', 'https://cocoonvietnam.com/san-pham/sua-chong-nang-vo-co-sen-hau-giang-50ml-tone-up-beige', 'https://cocoonvietnam.com/san-pham/sua-chong-nang-vo-co-sen-hau-giang-50ml-tone-up-beige', 'Frame, transcript và trang Cocoon xác nhận exact Tone-up Beige 50ml.'),
    ('40a8e39f-6c15-4bc5-80bc-44cf5edb9d59'::uuid, 'beplain-sunmuse-tone-up-correcting-sunscreen', 'https://beplain.com.vn/cua-hang/kem-chong-nang-vat-ly-hoa-hoc-nang-tone-beplain-tone-up-correcting-sunscreen-spf50-pa/', 'https://www.hwahae.com/en/products/beplain-SUNMUSE-TONE-UP-CORRECTING-SUNSCREEN-SPF50PLUS-PAPLUS-PLUS-PLUS-PLUS-PEACH-PINK/2204100', 'Frame xác nhận biến thể Peach Pink; evidence cho post này đã public ở batch trước.'),
    ('5a471038-dd0e-4941-a01c-2510c7b3d8de'::uuid, 'olay-super-spf50-fluid-moisturiser', 'https://www.watsons.com.ph/olay-olay-super-spf50-pa-fluid-moisturiser-50ml/p/BP_50059877', 'https://www.watsons.com.ph/olay-olay-super-spf50-pa-fluid-moisturiser-50ml/p/BP_50059877', 'Hai creator và frame đọc rõ Olay Super SPF50+ Fluid Moisturiser PA++++ 50ml.'),
    ('7396f452-33fd-40c3-84ac-67f61d06df0e'::uuid, 'geek-gorgeous-power-peptides', 'https://geekandgorgeous.com/products/power-peptides', 'https://geekandgorgeous.com/products/power-peptides', 'Tên Power Peptides và product page chính thức khớp; cùng creator/product đã có public signal nên không nhân đôi.'),
    ('dbd3fb79-fe22-4745-8384-ba6c6e386066'::uuid, 'simple-mattifying-uv-fluid-spf50', 'https://www.simple.co.uk/p/mattifying-uv-fluid-spf50.html/08720181350156', 'https://www.simple.co.uk/p/mattifying-uv-fluid-spf50.html/08720181350156', 'Nguồn trùng post đã public ở batch trước; merge để loại candidate lặp.'),
    ('0ef83192-f477-426c-8565-e78f40409346'::uuid, 'geek-gorgeous-c-glow', 'https://geekandgorgeous.com/products/c-glow', 'https://geekandgorgeous.com/products/c-glow', 'Tên C-Glow và 15% vitamin C khớp product page; cùng creator/product đã có signal mạnh hơn.'),
    ('f581a4be-6078-4504-92a6-3e50d7ec1a20'::uuid, 'geek-gorgeous-c-glow', 'https://geekandgorgeous.com/products/c-glow', 'https://geekandgorgeous.com/products/c-glow', 'Candidate ASR trùng C-Glow đã xác minh; merge không tạo event lặp.'),
    ('c19baddc-8c13-43d2-8014-548b862734c5'::uuid, 'biore-uv-aqua-rich-airy-hold-cream', 'https://www.kao.com/vn/products/biore/bio_uv_aquarich_airy_00/', 'https://www.kao.com/vn/products/biore/bio_uv_aquarich_airy_00/', 'Tên Airy Hold Cream và texture mousse khớp Kao; nguồn này đã public ở batch trước.'),
    ('735b10e9-c606-4090-955d-9146de8d51ae'::uuid, 'celimax-vita-a-retinal-shot-tightening-booster', 'https://www.celimax.com/product/81201d39-c40a-4a68-9700-2acacdc37f23', 'https://hypercape-build.s3.ap-northeast-2.amazonaws.com/images/product/1770103686783_3e67a6c0356c4d5fb27bc830cdae60fa.jpg', 'Frame, caption và trang Celimax xác nhận Retinal Shot 0.1% 15ml.'),
    ('ab529179-3c0c-4cf0-9872-96517e27f85b'::uuid, 'ahc-masters-tone-up-sun-serum', 'https://www.hwahae.com/en/products/AHC-Masters-Tone-Up-Sun-Serum-SPF50PLUS-PAPLUS-PLUS-PLUS-PLUS/2194634', 'https://www.dodoskin.com/cdn/shop/files/AHCMastersTone-UpSunSerumSPF50_PA_50ml-1.jpg?v=1779754972', 'Frame xác nhận MASTERS TONE UP SUN SERUM SPF50+ PA++++ 50ml.'),
    ('0598dee9-fd9e-401b-9597-c7133043d86d'::uuid, 'martiderm-dsp-intense-booster', 'https://www.martiderm.com/int-en/products/dsp-intense-booster', 'https://www.martiderm.com/sites/default/files/styles/crop_3_4/public/img/dsp-intense-booster-despigmentante-martiderm.jpg.webp?h=b3fafa37&itok=hRZnWDM9', 'Frame và trang MartiDerm xác nhận DSP-Intense Booster 30ml; sửa lỗi ASR Intensity.')
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

-- Definitive non-SKU/out-of-scope candidates are closed instead of being
-- retried forever. Other unresolved candidates remain private needs_identity.
with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), rejected(candidate_id, note) as (
  values
    ('62db5869-1025-4653-b43d-f44b05cdf832'::uuid, 'Máy lọc không khí LG nằm ngoài product radar skincare/makeup.'),
    ('cfeaf16c-9f63-4652-bee0-b5743eac55b5'::uuid, 'Bundle peptide và retinol không phải exact SKU; tách thành candidate riêng khi đọc được từng pack.'),
    ('4ba9285c-7d2d-4655-96ac-15e373dce0ec'::uuid, 'Chỉ xác định được hoạt chất HOCL, không xác định được brand/SKU từ transcript hoặc frame.')
)
update public.product_candidates candidate set
  status = 'rejected',
  review_note = rejected.note,
  reviewed_by = reviewer.user_id,
  reviewed_at = now(),
  updated_at = now()
from rejected cross join reviewer
where candidate.id = rejected.candidate_id;

with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
)
update public.product_candidates candidate set
  review_note = coalesce(candidate.review_note, 'Đã triage: chưa đọc đủ exact SKU/variant từ transcript và frame; tiếp tục giữ private.'),
  reviewed_by = reviewer.user_id,
  reviewed_at = now(),
  updated_at = now()
from reviewer
where candidate.status in ('new', 'needs_identity')
  and candidate.reviewed_at is null;

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
  case when batch.disclosure = 'unknown' then array['disclosure_not_stated']::text[] else '{}'::text[] end,
  false,
  'Đã đối chiếu exact SKU bằng transcript, frame video và nguồn sản phẩm truy xuất được.',
  reviewer.user_id, now(), now()
from verified_candidate_batch_03 batch
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
  case when batch.disclosure = 'unknown' then array['disclosure_not_stated']::text[] else '{}'::text[] end,
  true, now()
from verified_candidate_batch_03 batch
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
  for item in select distinct creator_id, product_id from verified_candidate_batch_03
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
from verified_candidate_batch_03 batch
cross join reviewer;

-- Three pilot samples were fully human-reviewed while resolving this batch.
with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), labels(external_post_id, content_class, expected_claims, note) as (
  values
    (
      '7652351444204555541', 'product_review',
      jsonb_build_array(jsonb_build_object(
        'brand', 'Olay',
        'product_name', 'Super SPF50+ Fluid Moisturiser PA++++ 50ml',
        'variant', '50ml',
        'product_id', 'olay-super-spf50-fluid-moisturiser',
        'event_type', 'reviewed',
        'disclosure', 'unknown'
      )),
      'Transcript và frame xác nhận exact Olay Super SPF50+ 50ml; disclosure không được nêu.'
    ),
    (
      '7648253127786827029', 'product_review',
      jsonb_build_array(jsonb_build_object(
        'brand', 'MartiDerm',
        'product_name', 'DSP-Intense Booster 30ml',
        'variant', '30ml',
        'product_id', 'martiderm-dsp-intense-booster',
        'event_type', 'recommended',
        'disclosure', 'unknown'
      )),
      'Nguồn bác sĩ có exact pack và khuyến nghị kèm hướng dẫn; disclosure không được nêu.'
    ),
    (
      '7661961242923273493', 'commercial',
      jsonb_build_array(jsonb_build_object(
        'brand', 'beplain',
        'product_name', 'Sunmuse Tone Up & Correcting Sunscreen SPF50+ PA++++',
        'variant', 'Peach Pink',
        'product_id', 'beplain-sunmuse-tone-up-correcting-sunscreen',
        'event_type', 'used',
        'disclosure', 'pr'
      )),
      'Creator nói rõ brand gửi tặng và frame xác nhận biến thể Peach Pink.'
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
