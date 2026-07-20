-- Publish the first human-reviewed TikTok evidence batch. Products remain
-- independently useful without an offer; purchase CTAs stay hidden until a
-- separately verified exact-match affiliate offer exists.

create temporary table verified_tiktok_product_batch (
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

insert into verified_tiktok_product_batch values
  ('2', '7648484506923437319', 'babe-stop-akn-purifying-cleansing-gel', 'Stop AKN Purifying Cleansing Gel', 'reviewed', 'sponsored', 'mixed', 'Góc Của Rư review sữa rửa mặt BABÉ Stop AKN', 'Sau hai tuần, team Rư ghi nhận da đổ ít dầu hơn; video cũng nêu nhược điểm mùi và lưu ý thử vùng nhỏ vì có 0,5% BHA.', 'Review có thử nghiệm thực tế và disclosure #goccuarupartner.', 94, 'Đối chiếu transcript, caption partner và bao bì BABÉ Stop AKN.'),
  ('2', '7655538284537449736', 'biore-uv-aqua-rich-mild-essence', 'UV Aqua Rich Mild Essence SPF50+ PA++++', 'reviewed', 'sponsored', 'mixed', 'Góc Của Rư review Bioré UV Aqua Rich Mild Essence', 'Review SPF50+ PA++++ dạng essence, finish trong veo và ẩm; phù hợp da thường đến khô hơn thời tiết quá nóng.', 'Review có thử finish và disclosure #goccuarupartner.', 93, 'Đối chiếu transcript, caption partner và tên dòng Mild Essence.'),
  ('2', '7656646581063585032', 'olay-super-spf50-fluid-moisturiser', 'Super SPF50+ Fluid Moisturiser PA++++', 'reviewed', 'sponsored', 'mixed', 'Góc Của Rư review Olay Super SPF50+', 'Video test khi chạy bộ: finish ẩm, không nâng tông và có thể cay mắt tùy cơ địa.', 'Review có thử vận động và disclosure #goccuarupartner, #HoptaccungPG.', 95, 'Đối chiếu transcript, caption hợp tác P&G và bao bì Olay Super SPF50+.'),
  ('2', '7661108096734924050', 'dr-g-red-blemish-clear-soothing-cream', 'R.E.D Blemish Clear Soothing Cream', 'reviewed', 'sponsored', 'mixed', 'Góc Của Rư review Dr.G R.E.D Blemish Clear Soothing Cream', 'Team dùng và ghi nhận giảm đỏ, bong tróc và đủ ẩm; video lưu ý đây không phải sản phẩm trị mụn.', 'Review có thử nghiệm thực tế và disclosure #HợpTácCùngDrG.', 95, 'Đối chiếu transcript, caption hợp tác Dr.G và bao bì R.E.D Blemish.'),
  ('2', '7661483735350594823', 'ahc-pro-shot-pore-eraser-serum', 'Pro Shot Pore Eraser Serum', 'reviewed', 'sponsored', 'mixed', 'Góc Của Rư review AHC Pro Shot Pore Eraser Serum', 'Team test thấy bề mặt da mượt hơn; video cảnh báo vi kim còn mới và da nhạy cảm cần cân nhắc.', 'Review có thử nghiệm thực tế và disclosure #goccuarupartner.', 94, 'Đối chiếu transcript, caption partner và tên AHC Pore Eraser.'),
  ('2', '7661858969455037714', 'simple-mattifying-uv-fluid-spf50', 'Mattifying UV Fluid SPF50 PA++++', 'reviewed', 'sponsored', 'mixed', 'Góc Của Rư review Simple Mattifying UV Fluid SPF50', 'Test cho finish ẩm, có thể vón trên một số lớp dưỡng và khả năng kháng nước ở mức trung bình.', 'Review có nhiều tình huống test và disclosure #goccuarupartner.', 95, 'Đối chiếu transcript, caption partner và packshot Simple Mattifying UV Fluid.'),
  ('37', '7658282321178627349', 'lagom-brightening-tone-up-sun', 'Brightening Tone Up Sun SPF50+ PA++++', 'used', 'unknown', 'positive', 'Kim Chung Phan dùng LAGOM Brightening Tone Up Sun', 'Creator dùng trong routine và mô tả chất kem dễ tán, thấm nhanh, nâng tông hồng nhẹ.', 'Sản phẩm được thoa trực tiếp trong video; caption không thể hiện disclosure rõ.', 91, 'Đối chiếu transcript, caption và tên LAGOM Tone Up Sun.'),
  ('37', '7660480288514116884', 'loreal-revitalift-melasyl-dark-spot-creamy-serum', 'Revitalift Melasyl Dark Spot Creamy-Serum', 'used', 'sponsored', 'positive', 'Kim Chung Phan dùng L’Oréal Revitalift Melasyl Creamy-Serum', 'Creator cho biết dùng serum trên mặt và một số vùng thâm trên cơ thể; caption ghi rõ hợp tác cùng L’Oréal Paris.', 'Sản phẩm được mô tả trong routine và có disclosure tài trợ.', 96, 'Đối chiếu transcript, caption #hợptáccùngLOrealParis và bao bì serum Melasyl hồng.'),
  ('37', '7661961242923273493', 'beplain-sunmuse-tone-up-correcting-sunscreen', 'Sunmuse Tone Up & Correcting Sunscreen SPF50+ PA++++', 'reviewed', 'pr', 'mixed', 'Kim Chung Phan review dòng beplain Sunmuse', 'Creator cho biết đã dùng bốn màu và mô tả finish, loại da phù hợp của từng biến thể; sản phẩm do brand gửi tặng.', 'Review theo dòng Sunmuse; cần chọn đúng biến thể khi tạo link mua.', 90, 'Đối chiếu transcript, caption và bốn packshot Sunmuse; giữ cảnh báo variant.'),
  ('4', '7658858840687037717', 'skinoxy-pro-b3-aha-concentrate-body-serum', 'Pro B3 AHA Concentrate Body Serum', 'reviewed', 'affiliate', 'positive', 'Call Me Duy review SKINOXY Pro B3 AHA Body Serum', 'Video giới thiệu bản hồng với 10% niacinamide và 2% lactic acid cho routine dưỡng sáng, làm mịn body.', 'Creator nói rõ sản phẩm đang được bán trên live.', 95, 'Đối chiếu transcript, caption và packshot bản hồng Pro B3 AHA.'),
  ('4', '7660125075487657237', 'ekseption-hyaluronic-znpca-mixlab-serum', 'Hyaluronic ZnPCA Mixlab Serum', 'used', 'affiliate', 'positive', 'Call Me Duy dùng Ekseption Hyaluronic ZnPCA Mixlab Serum', 'Creator dùng serum kẽm trong routine tối giản cho da dầu, dễ nổi mụn và mô tả cách dùng buổi tối.', 'Video có disclosure đối tác và bán trên live.', 95, 'Đối chiếu transcript, caption và tên Hyaluronic ZnPCA Mixlab Serum.'),
  ('4', '7663091389370060053', 'koai-dry-shampoo-spray', 'Dry Shampoo Spray 150ml', 'used', 'affiliate', 'positive', 'Call Me Duy dùng KOAI Dry Shampoo Spray', 'Creator mang sản phẩm khi đi Đài Loan và mô tả tóc bồng hơn, hút dầu mà không để lại vệt trắng rõ.', 'Video dẫn tới TikTok Shop/brand và có trình diễn trực tiếp.', 94, 'Đối chiếu transcript, caption, packshot KOAI và phần trình diễn trên tóc.');

insert into public.radar_products (
  id, name, brand, image, rating, reviews, sold, price, category, tags,
  affiliate_url, description, category_key, subcategory_key, concern_tags,
  ingredient_tags, aliases, status
) values
  ('babe-stop-akn-purifying-cleansing-gel', 'Stop AKN Purifying Cleansing Gel', 'Laboratorios BABÉ', '/images/products/babe-stop-akn-purifying-cleansing-gel.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['0.5% BHA','Gel cleanser','Da dầu mụn'], null, 'Gel rửa mặt cho da dầu mụn với 0,5% salicylic acid; evidence public ghi nhận trải nghiệm sạch dầu nhưng không khô căng.', 'skincare', 'cleanser', array['da dầu','mụn','làm sạch'], array['salicylic acid 0.5%','succinic acid 1%','prebiotic','postbiotic'], array['BABÉ Stop AKN cleanser','BABE Purifying Cleansing Gel'], 'published'),
  ('biore-uv-aqua-rich-mild-essence', 'UV Aqua Rich Mild Essence SPF50+ PA++++', 'Bioré', '/images/products/biore-uv-aqua-rich-mild-essence.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['SPF50+','PA++++','Micro Defense'], null, 'Tinh chất chống nắng màng nước không nâng tông, cho finish ẩm bóng nhẹ.', 'skincare', 'sunscreen', array['chống nắng','da thường','da khô'], array['centella asiatica','vitamin C derivative','panthenol'], array['Bioré Mild Essence','Biore UV Màng Nước Dịu Nhẹ'], 'published'),
  ('olay-super-spf50-fluid-moisturiser', 'Super SPF50+ Fluid Moisturiser PA++++', 'Olay', '/images/products/olay-super-spf50-fluid-moisturiser.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['SPF50+','PA++++','Dưỡng ẩm'], null, 'Kem dưỡng chống nắng không nâng tông với finish ẩm.', 'skincare', 'sunscreen', array['chống nắng','da thường','da khô'], array['chemical UV filters','humectants'], array['Olay Super SPF50','Olay Super Fluid Moisturiser'], 'published'),
  ('dr-g-red-blemish-clear-soothing-cream', 'R.E.D Blemish Clear Soothing Cream', 'Dr.G', '/images/products/dr-g-red-blemish-clear-soothing-cream.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['Cica','Gel cream','Soothing'], null, 'Kem dưỡng gel làm dịu và cấp ẩm; không được mô tả như thuốc trị mụn.', 'skincare', 'moisturizer', array['da dầu','đỏ da','phục hồi'], array['niacinamide','panthenol','centella asiatica'], array['Dr.G Red Blemish Cream','Dr G kem dưỡng đỏ'], 'published'),
  ('ahc-pro-shot-pore-eraser-serum', 'Pro Shot Pore Eraser Serum', 'AHC', '/images/products/ahc-pro-shot-pore-eraser-serum.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['Spicule','Pore care','Retinoid'], null, 'Serum vi kim hướng tới bề mặt da và lỗ chân lông; da nhạy cảm cần cân nhắc.', 'skincare', 'serum', array['lỗ chân lông','texture','da xỉn màu'], array['niacinamide','glutathione','retinoid','spicule'], array['AHC Pore Eraser','AHC serum vi kim'], 'published'),
  ('simple-mattifying-uv-fluid-spf50', 'Mattifying UV Fluid SPF50 PA++++', 'Simple', '/images/products/simple-mattifying-uv-fluid-spf50.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['SPF50','PA++++','UV Fluid'], null, 'Sữa chống nắng trong veo không nâng tông; có thể vón trên một số lớp dưỡng.', 'skincare', 'sunscreen', array['chống nắng','da thường','da khô'], array['chemical UV filters'], array['Simple Mattifying Sunscreen','Simple UV Fluid'], 'published'),
  ('lagom-brightening-tone-up-sun', 'Brightening Tone Up Sun SPF50+ PA++++', 'LAGOM', '/images/products/lagom-brightening-tone-up-sun.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['Tone up','SPF50+','PA++++'], null, 'Kem chống nắng nâng tông hồng nhẹ, dễ tán và dùng được như lớp nền.', 'skincare', 'sunscreen', array['chống nắng','da xỉn màu','makeup base'], array['niacinamide','glutathione','tocopherol'], array['Lagom Tone Up Sun'], 'published'),
  ('loreal-revitalift-melasyl-dark-spot-creamy-serum', 'Revitalift Melasyl Dark Spot Creamy-Serum', 'L''Oréal Paris', '/images/products/loreal-revitalift-melasyl-dark-spot-creamy-serum.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['Melasyl','Dark spots','Creamy serum'], null, 'Serum-creamy hướng tới đốm nâu và da không đều màu.', 'skincare', 'serum', array['thâm mụn','đốm nâu','da không đều màu'], array['melasyl','niacinamide','vitamin C'], array['L''Oréal serum Melasyl hồng','Revitalift Laser Melasyl'], 'published'),
  ('beplain-sunmuse-tone-up-correcting-sunscreen', 'Sunmuse Tone Up & Correcting Sunscreen SPF50+ PA++++', 'beplain', '/images/products/beplain-sunmuse-tone-up-correcting-sunscreen.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['Tone correcting','SPF50+','PA++++'], null, 'Dòng chống nắng hiệu chỉnh màu da; cần chọn đúng biến thể khi tạo offer.', 'skincare', 'sunscreen', array['chống nắng','da xỉn màu','makeup base'], array['niacinamide','glutathione','tocopherol'], array['beplain Sunmuse','Sunmuse sunscreen'], 'published'),
  ('skinoxy-pro-b3-aha-concentrate-body-serum', 'Pro B3 AHA Concentrate Body Serum', 'SKINOXY', '/images/products/skinoxy-pro-b3-aha-concentrate-body-serum.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Bodycare', array['10% Niacinamide','2% Lactic Acid','Body serum'], null, 'Body serum bản hồng cho routine dưỡng sáng và làm mịn da body.', 'bodycare', 'body_lotion', array['body sáng da','texture body','da khô'], array['niacinamide 10%','lactic acid 2%','AHA'], array['Skinoxy body serum hồng','Skinoxy Pro B3 AHA'], 'published'),
  ('ekseption-hyaluronic-znpca-mixlab-serum', 'Hyaluronic ZnPCA Mixlab Serum', 'Ekseption', '/images/products/ekseption-hyaluronic-znpca-mixlab-serum.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare', array['Zinc PCA','Hyaluronic acid','Mixlab'], null, 'Serum kẽm cho da dầu và dễ nổi mụn trong routine tối giản.', 'skincare', 'serum', array['da dầu','mụn','lỗ chân lông'], array['zinc PCA 1%','hyaluronic acid 2%','fruit acids'], array['Ekseption serum kẽm','Mixlab ZnPCA'], 'published'),
  ('koai-dry-shampoo-spray', 'Dry Shampoo Spray 150ml', 'KOAI', '/images/products/koai-dry-shampoo-spray.jpg', null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Haircare', array['Dry shampoo','Kiềm dầu','Không vệt trắng'], null, 'Xịt gội khô hỗ trợ hút dầu và làm tóc trông bồng hơn.', 'haircare', 'shampoo', array['tóc bết','da đầu dầu','tóc mỏng'], array['oil absorbing powder'], array['KOAI dầu gội khô','Koai Dry Shampoo'], 'published')
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
  select user_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1
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
  'evidence-tiktok-' || batch.external_post_id,
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
  jsonb_build_array(jsonb_build_object(
    'product_id', batch.product_id,
    'product_name', batch.product_name,
    'claim', batch.source_excerpt
  )),
  batch.confidence_score,
  'human-reviewed-transcript',
  'manual-sku-review-v1',
  jsonb_build_array(jsonb_build_object(
    'source', 'caption_and_transcript',
    'external_post_id', batch.external_post_id
  )),
  case when batch.disclosure = 'unknown' then array['disclosure_not_stated']::text[] else '{}'::text[] end,
  false,
  'Đã đối chiếu transcript, caption/disclosure và nhận diện đúng SKU trước khi public.',
  reviewer.user_id,
  now(),
  now()
from verified_tiktok_product_batch batch
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
  select user_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1
)
insert into public.creator_product_events (
  id, creator_id, product_id, evidence_id, event_type, event_date,
  observed_at, source_platform, source_url, source_post_id, source_title,
  source_excerpt, media_url, sentiment, disclosure, usage_context,
  evidence_note, confidence, confidence_score, verification_status,
  verified_by, verified_at, valid_until, updated_at
)
select
  'event-tiktok-' || batch.external_post_id,
  batch.creator_id,
  batch.product_id,
  'evidence-tiktok-' || batch.external_post_id,
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
from verified_tiktok_product_batch batch
join public.source_posts post
  on post.creator_id = batch.creator_id
 and post.external_post_id = batch.external_post_id
join public.creator_evidence_items evidence
  on evidence.id = 'evidence-tiktok-' || batch.external_post_id
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
declare
  item record;
begin
  for item in
    select distinct creator_id, product_id
    from verified_tiktok_product_batch
  loop
    perform private.recompute_creator_product_state(item.creator_id, item.product_id);
  end loop;
end $$;

with reviewer as (
  select user_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1
)
insert into public.evidence_audit_log (
  evidence_id, event_id, actor_id, actor_type, decision, reason, after_data
)
select
  'evidence-tiktok-' || batch.external_post_id,
  'event-tiktok-' || batch.external_post_id,
  reviewer.user_id,
  'admin',
  'published',
  'Manual transcript, disclosure and exact-SKU review completed.',
  jsonb_build_object(
    'creator_id', batch.creator_id,
    'product_id', batch.product_id,
    'source_post_id', batch.external_post_id,
    'confidence_score', batch.confidence_score
  )
from verified_tiktok_product_batch batch
cross join reviewer;
