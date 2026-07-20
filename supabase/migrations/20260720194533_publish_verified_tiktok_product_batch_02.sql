-- Publish exact-SKU evidence as soon as a creator video has a usable transcript
-- and the product identity has been checked against an official product page.
-- Offers remain null until an exact affiliate URL is verified separately.

create temporary table verified_tiktok_product_batch_02 (
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
  researcher_note text not null
) on commit drop;

insert into verified_tiktok_product_batch_02 values
  ('34', '7662360006066441493', 'cocoon-hau-giang-lotus-mineral-sunscreen-50ml', 'Sữa chống nắng vô cơ Sen Hậu Giang 50ml - Tone-up Beige', 'reviewed', 'unknown', 'positive', 'Vũ Thái Bình review sữa chống nắng vô cơ Sen Hậu Giang', 'Creator cho biết đã dùng khoảng một tuần, mô tả texture sữa thấm nhanh, nâng tông tự nhiên và phù hợp da nhạy cảm.', 'Sản phẩm được thoa và đánh giá trực tiếp; caption không thể hiện disclosure thương mại rõ.', 96, 'Đối chiếu transcript, hashtag sản phẩm và packshot chính thức Tone-up Beige của Cocoon.'),
  ('52', '7663346331133447431', 'cocoon-hau-giang-lotus-mineral-sunscreen-50ml', 'Sữa chống nắng vô cơ Sen Hậu Giang 50ml - Tone-up Beige', 'reviewed', 'unknown', 'positive', 'Skincare Đúng Cách by Sơn thử sữa chống nắng vô cơ Sen Hậu Giang', 'Creator thử trực tiếp tại sự kiện ra mắt, mô tả finish tự nhiên và nêu SPF 50+, PA++++ cùng hai màng lọc vô cơ.', 'Video được ghi tại sự kiện của brand; chưa có đủ dữ liệu để kết luận hình thức hợp tác.', 96, 'Đối chiếu transcript, sự kiện ra mắt và packshot chính thức Tone-up Beige của Cocoon.'),
  ('52', '7650113216822938888', 'biore-uv-aqua-rich-airy-hold-cream', 'UV Aqua Rich Airy Hold Cream SPF50+ PA++++', 'reviewed', 'pr', 'positive', 'Skincare Đúng Cách by Sơn review Bioré UV Aqua Rich Airy Hold Cream', 'Creator thử kem chống nắng dạng mousse trên mặt, mô tả thấm nhanh, ráo thoáng và dùng được như lớp lót.', 'Creator tham gia study session của Bioré trước khi sản phẩm mở bán; không suy diễn thêm về tài trợ.', 96, 'Tên Aqua Rich Airy Hold Cream, texture mousse và bao bì trùng khớp trang sản phẩm chính thức Kao.'),
  ('52', '7653083434255994130', 'olay-super-spf50-fluid-moisturiser', 'Super SPF50+ Fluid Moisturiser PA++++', 'reviewed', 'unknown', 'positive', 'Skincare Đúng Cách by Sơn review Olay Super SPF50+', 'Creator mô tả sản phẩm dưỡng chống nắng 5 trong 1, finish mỏng nhẹ và dùng trực tiếp trong routine ban ngày.', 'Caption và transcript không cung cấp disclosure thương mại đủ rõ.', 94, 'Đối chiếu transcript, tên Olay Super SPF50+ và product record đã xác minh trước đó.'),
  ('87', '7664591318059977992', 'geek-gorgeous-c-glow', 'C-Glow 15% Vitamin C Serum', 'used', 'affiliate', 'positive', 'Tôm nhắc Geek & Gorgeous C-Glow trong danh sách skincare đáng tiền', 'Creator nói đã dùng nhiều lần và nhắc đúng công thức 15% vitamin C cùng vitamin E và ferulic acid.', 'Creator nói rõ có gắn affiliate nhưng không có booking cho hai sản phẩm Geek & Gorgeous.', 97, 'Tên C-Glow và công thức 15% ascorbic acid, ferulic acid, vitamin E trùng khớp trang chính thức.'),
  ('87', '7664591318059977992', 'geek-gorgeous-power-peptides', 'Power Peptides Pro-Collagen Multi-Peptide Serum', 'used', 'affiliate', 'positive', 'Tôm nhắc Geek & Gorgeous Power Peptides trong danh sách skincare đáng tiền', 'Creator nói đã dùng nhiều lần, mô tả texture sữa nhẹ và công thức peptide minh bạch.', 'Creator nói rõ có gắn affiliate nhưng không có booking cho hai sản phẩm Geek & Gorgeous.', 97, 'Tên Power Peptides, texture sữa và bốn công nghệ peptide trùng khớp trang chính thức.');

insert into public.radar_products (
  id, name, brand, image, rating, reviews, sold, price, category, tags,
  affiliate_url, description, category_key, subcategory_key, concern_tags,
  ingredient_tags, aliases, status
) values
  ('cocoon-hau-giang-lotus-mineral-sunscreen-50ml', 'Sữa chống nắng vô cơ Sen Hậu Giang 50ml - Tone-up Beige', 'Cocoon', '/images/products/cocoon-hau-giang-lotus-mineral-sunscreen-50ml.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['SPF50+','PA++++','Tone-up Beige'], null, 'Sữa chống nắng vô cơ nâng tông beige cho da rất nhạy cảm, có hai creator cùng thử trực tiếp.', 'skincare', 'sunscreen', array['chống nắng','da rất nhạy cảm','nâng tông'], array['zinc oxide','titanium dioxide','ceramides','chiết xuất sen Hậu Giang'], array['Cocoon Sữa chống nắng Sen Hậu Giang','Hau Giang Lotus Mineral Sun Fluid'], 'published'),
  ('biore-uv-aqua-rich-airy-hold-cream', 'UV Aqua Rich Airy Hold Cream SPF50+ PA++++', 'Bioré', '/images/products/biore-uv-aqua-rich-airy-hold-cream.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['SPF50+','PA++++','Airy mousse'], null, 'Kem chống nắng dạng mousse mỏng nhẹ, hướng tới finish ráo và kiểm soát bóng dầu.', 'skincare', 'sunscreen', array['chống nắng','da dầu','makeup base'], array['hyaluronic acid','vitamin C derivative','butylene glycol'], array['Bioré Airy Hold Cream','Aqua Rich Airy Hold Cream'], 'published'),
  ('geek-gorgeous-c-glow', 'C-Glow 15% Vitamin C Serum', 'Geek & Gorgeous', '/images/products/geek-gorgeous-c-glow.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['15% Vitamin C','Ferulic Acid','Vitamin E'], null, 'Serum vitamin C dạng nước với 15% ascorbic acid và hai chất chống oxy hóa hỗ trợ.', 'skincare', 'serum', array['da xỉn màu','đốm nâu','chống oxy hóa'], array['ascorbic acid 15%','ferulic acid','tocopherol'], array['Geek & Gorgeous C-Glow','G&G C Glow'], 'published'),
  ('geek-gorgeous-power-peptides', 'Power Peptides Pro-Collagen Multi-Peptide Serum', 'Geek & Gorgeous', '/images/products/geek-gorgeous-power-peptides.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['Multi-peptide','Pro-collagen','Milky serum'], null, 'Serum đa peptide texture sữa nhẹ với bốn công nghệ peptide được brand công bố.', 'skincare', 'serum', array['da thiếu đàn hồi','tuổi 30','phục hồi'], array['Matrixyl 3000','Matrixyl Synthe''6','Tetrapeptide-21','peptide complex'], array['Geek & Gorgeous Power Peptides','G&G Power Peptides'], 'published')
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
  batch.creator_id,
  'TikTok',
  post.source_url,
  batch.external_post_id,
  post.published_at,
  post.observed_at,
  batch.source_title,
  batch.source_excerpt,
  post.transcript_text,
  null,
  'published',
  array[batch.product_id],
  array[batch.product_name],
  batch.researcher_note,
  post.id,
  jsonb_build_array(jsonb_build_object('product_id', batch.product_id, 'product_name', batch.product_name, 'claim', batch.source_excerpt)),
  batch.confidence_score,
  'human-reviewed-transcript',
  'manual-sku-review-v1',
  jsonb_build_array(jsonb_build_object('source', 'caption_and_transcript', 'external_post_id', batch.external_post_id)),
  case when batch.disclosure = 'unknown' then array['disclosure_not_stated']::text[] else '{}'::text[] end,
  false,
  'Đã đối chiếu transcript, disclosure và đúng SKU với nguồn sản phẩm chính thức.',
  reviewer.user_id,
  now(),
  now()
from verified_tiktok_product_batch_02 batch
join public.source_posts post on post.creator_id = batch.creator_id and post.external_post_id = batch.external_post_id
cross join reviewer
where post.transcription_status = 'ready' and post.transcript_text is not null
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
  verified_by, verified_at, valid_until, updated_at
)
select
  'event-tiktok-' || batch.external_post_id || '-' || batch.product_id,
  batch.creator_id,
  batch.product_id,
  'evidence-tiktok-' || batch.external_post_id || '-' || batch.product_id,
  batch.event_type,
  post.published_at::date,
  post.observed_at,
  'TikTok',
  post.source_url,
  batch.external_post_id,
  batch.source_title,
  batch.source_excerpt,
  null,
  batch.sentiment,
  batch.disclosure,
  batch.usage_context,
  batch.researcher_note,
  'high',
  batch.confidence_score,
  'verified',
  reviewer.user_id,
  now(),
  now() + interval '365 days',
  now()
from verified_tiktok_product_batch_02 batch
join public.source_posts post on post.creator_id = batch.creator_id and post.external_post_id = batch.external_post_id
join public.creator_evidence_items evidence on evidence.id = 'evidence-tiktok-' || batch.external_post_id || '-' || batch.product_id
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
  updated_at = now();

do $$
declare item record;
begin
  for item in select distinct creator_id, product_id from verified_tiktok_product_batch_02
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
  reviewer.user_id,
  'admin',
  'published',
  'Manual transcript, disclosure and exact-SKU review completed.',
  jsonb_build_object('creator_id', batch.creator_id, 'product_id', batch.product_id, 'source_post_id', batch.external_post_id, 'confidence_score', batch.confidence_score)
from verified_tiktok_product_batch_02 batch
cross join reviewer;
