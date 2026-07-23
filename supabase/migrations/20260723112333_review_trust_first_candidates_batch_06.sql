-- Human-reviewed candidate batch 06.
--
-- Every public claim keeps the original TikTok clip URL, external post id,
-- localized transcript spans and reviewer metadata. Ambiguous model flags were
-- resolved only where the transcript/visible pack matched a product source.

create temporary table verified_candidate_batch_06 (
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

insert into verified_candidate_batch_06 values
  (
    '8725118c-8ecc-499f-a958-dc35281115dc', '58', '7664976637439544584',
    'ahc-pro-shot-pore-eraser-serum', 'Pro Shot Pore Eraser Serum',
    'reviewed', 'sponsored', 'positive',
    'An Phương review AHC Pro Shot Pore Eraser Serum sau gần một tháng',
    'Creator nói đã dùng gần một tháng, gọi đúng AHC Pore Eraser Serum và highly recommend sản phẩm.',
    'Trải nghiệm sử dụng kéo dài gần một tháng; nội dung mang ngữ cảnh hợp tác nên không được tính như nguồn organic.',
    98,
    'https://www.hwahae.com/en/products/AHC-PRO-SHOT-PORE-ERASER-SERUM/2194191',
    'https://d1flfk77wl2xk4.cloudfront.net/Assets/ahc-pro-shot-pore-eraser-serum-30ml/11/076/XXL_p0224807611.jpg',
    'Tên đầy đủ, pack serum hồng và thời gian sử dụng khớp exact SKU 30 ml. Disclosure được hạ về sponsored theo ngữ cảnh campaign/disclaimer.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','gần 1 tháng kể từ ngày Anh Phương sử dụng cái sản phẩm này Serum vi kim thu nhỏ lỗ chân lông của AHC','timestamp_seconds',10),
      jsonb_build_object('kind','quote','value','Serum AHC Pore Eraser này rất là phù hợp cho những ai muốn cải thiện tình trạng da sạm màu','timestamp_seconds',100),
      jsonb_build_object('kind','quote','value','Anh Phương highly recommend nha','timestamp_seconds',null)
    ),
    array['commercial_content']::text[]
  ),
  (
    'f3d250e7-2818-4c23-92f1-8c1d06b405ff', '58', '7660898418650565906',
    'dr-g-red-blemish-clear-soothing-cream', 'R.E.D Blemish Clear Soothing Cream',
    'used', 'unknown', 'positive',
    'An Phương dùng Dr.G R.E.D Blemish Clear Soothing Cream sau laser',
    'Creator thoa kem Dr.G dạng gel trong routine phục hồi sau laser và recommend sản phẩm cho da dễ nổi mụn.',
    'Trải nghiệm dùng trong routine phục hồi; disclosure không được nêu rõ trong caption hoặc transcript.',
    97,
    'https://dr-g.com/collections/best-sellers/products/dr-g-red-blemish-clear-soothing-cream',
    'https://dr-g.com/collections/best-sellers/products/dr-g-red-blemish-clear-soothing-cream',
    'Tên R.E.D Blemish Clear Soothing Cream, hũ kem và kết cấu gel khớp exact SKU 70 ml.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','Đây là kem dưỡng Dr.G Red Blemish Clear Soothing Cream','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','với tầm giá này, Anh Phương luôn recommend sản phẩm này của nhà Dr.G','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','khi về nhà thì Phương sẽ tập trung dưỡng ẩm và phục hồi cho làn da','timestamp_seconds',null)
    ),
    array['disclosure_not_stated']::text[]
  ),
  (
    '5853eb48-d447-486b-a742-62dffbcb40f3', '35', '7644185590895840533',
    'cocoon-winter-melon-micellar-water-1000ml', 'Nước tẩy trang bí đao 1000ml',
    'used', 'unknown', 'positive',
    'Vân Miu dùng Nước tẩy trang bí đao Cocoon 1000ml trong hậu trường makeup',
    'Creator cho biết dùng chai 1 lít để thay nhiều layout makeup vì tẩy nhanh, sạch và lành tính.',
    'Sản phẩm được dùng trực tiếp trong hậu trường makeup; disclosure không được nêu rõ.',
    97,
    'https://cocoonvietnam.com/san-pham/nuoc-tay-trang-bi-dao-1000ml',
    'https://image.cocoonvietnam.com/uploads/Artboard_7_3x_100_58131bf2f7.jpg',
    'Archived frame cho thấy rõ chai Cocoon Winter melon micellar water và nhãn 1 lít; khớp trang sản phẩm Cocoon.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','Chai nước tẩy trang bí đao Cocoon khổng lồ một lít','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','Nói về nước tẩy trang thì Cocoon luôn là sự lựa chọn hàng đầu của Vân','timestamp_seconds',null),
      jsonb_build_object('kind','frame','value','Bao bì Cocoon Winter melon micellar water 1 lít hiện rõ trong clip','timestamp_seconds',20)
    ),
    array['disclosure_not_stated']::text[]
  ),
  (
    '5853eb48-d447-486b-a742-62dffbcb40f3', '52', '7599940752742927623',
    'cocoon-winter-melon-micellar-water-1000ml', 'Nước tẩy trang bí đao 1000ml',
    'reviewed', 'unknown', 'positive',
    'Skincare Đúng Cách by Sơn review Nước tẩy trang bí đao Cocoon 1000ml',
    'Creator gọi đúng bản 1 lít, nhận xét khả năng làm sạch makeup và mô tả nắp nhấn cùng bao bì nhựa tái chế.',
    'Review tập trung vào phiên bản 1 lít; disclosure không được nêu rõ.',
    96,
    'https://cocoonvietnam.com/san-pham/nuoc-tay-trang-bi-dao-1000ml',
    'https://image.cocoonvietnam.com/uploads/Artboard_7_3x_100_58131bf2f7.jpg',
    'Tên sản phẩm, dung tích 1 lít và thiết kế nắp nhấn khớp exact SKU trên nguồn Cocoon.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','Cuối cùng Cocoon cũng cho ra mắt chai nước tẩy trang bí đao size 1 lít','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','Khả năng làm sạch thì rất là sâu, thậm chí sạch được cả makeup và kem chống nắng bám lì','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','nó được làm bằng nhựa tái chế 100%','timestamp_seconds',null)
    ),
    array['disclosure_not_stated']::text[]
  ),
  (
    '7dce9525-a077-43fc-93ec-6404c0b54520', '52', '7553867240555187464',
    'cocoon-hau-giang-lotus-cleanser-310ml', 'Sữa rửa mặt sen Hậu Giang 310ml',
    'recommended', 'unknown', 'positive',
    'Skincare Đúng Cách by Sơn recommend Sữa rửa mặt sen Hậu Giang 310ml',
    'Creator giới thiệu đúng phiên bản 310 ml có vòi nhấn và cho biết đây là sản phẩm mình yêu thích.',
    'Recommendation cho phiên bản dung tích lớn; disclosure không được nêu rõ.',
    98,
    'https://cocoonvietnam.com/san-pham/sua-rua-mat-sen-hau-giang-310ml',
    'https://image.cocoonvietnam.com/uploads/Artboard_12_ea031b6b39.jpg',
    'Tên, dung tích 310 ml, bao bì vòi nhấn và trang Cocoon xác nhận exact SKU.',
    jsonb_build_array(
      jsonb_build_object('kind','caption','value','Sữa rửa mặt Sen Hậu Giang cuối cùng cũng có size to và bao bì mới rồi','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','phiên bản size lớn hơn với dung tích gấp đôi là 310 ml và chuyển thành dạng vòi nhấn','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','nếu có lỡ yêu sữa rửa mặt sen Hậu Giang này giống mình','timestamp_seconds',null)
    ),
    array['disclosure_not_stated']::text[]
  ),
  (
    'd05c8942-1862-42e3-a9ad-a7a54142593c', '58', '7650132239992327432',
    'revision-skincare-youthfull-lip-replenisher', 'YouthFull Lip Replenisher',
    'recommended', 'unknown', 'positive',
    'An Phương recommend Revision Skincare YouthFull Lip Replenisher',
    'Creator gọi đúng tên sản phẩm, nói đã dùng trong routine dưỡng môi và nhận xét chất dày, bám lâu qua đêm.',
    'Recommendation cá nhân trong video lifestyle; disclosure của sản phẩm này không được nêu rõ.',
    98,
    'https://revisionskincare.com/products/youthfull-lip-replenisher%C2%AE',
    'https://revisionskincare.com/cdn/shop/files/youthfull-lip-replenisher-1_e130a68c-b064-4056-a330-0f2d1c0e53df.jpg?v=1769525695&width=1024',
    'Tên YouthFull Lip Replenisher và tuýp đen khớp trang Revision Skincare chính thức.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','Anh Phương cực kì thích thỏi này của Revision luôn, YouthFull Lip Replenisher','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','cái chất của nó rất là dày nhưng mà Anh Phương thật sự cảm thấy là nó bám trên môi','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','tối Anh Phương thoa thì sáng ngày hôm sau nó vẫn còn ở trên môi','timestamp_seconds',null)
    ),
    array['disclosure_not_stated']::text[]
  ),
  (
    '020e6cc7-2d12-49bb-a9c2-02951bf20982', '58', '7657555911447170322',
    'revision-skincare-dej-night-face-cream', 'D.E.J Night Face Cream',
    'used', 'unknown', 'positive',
    'An Phương dùng Revision Skincare D.E.J Night Face Cream trong routine tối',
    'Creator nói sản phẩm nằm trong routine mỗi đêm và gọi đúng công thức 0,25% retinol giải phóng chậm.',
    'Signal sử dụng thường xuyên; disclosure không được nêu rõ.',
    97,
    'https://revisionskincare.com/products/d-e-j-night-face-cream',
    'https://revisionskincare.com/cdn/shop/files/d-e-j-night-face-cream-1_c1f2498d-f677-426a-81f1-4e4486154d04.jpg?v=1769524416&width=1024',
    'Tên D.E.J Night Face Cream và 0,25% retinol khớp trang Revision Skincare chính thức.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','đặc biệt là kem trẻ hóa màng đáy D.E.J Night Face Cream này','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','Đây nằm trong skincare routine của Phương mỗi đêm','timestamp_seconds',null),
      jsonb_build_object('kind','quote','value','Cụ thể là 0,25% retinol bọc giải phóng chậm','timestamp_seconds',null)
    ),
    array['disclosure_not_stated']::text[]
  ),
  (
    'af4f67af-1ea3-4f93-aa86-e0c8c237daeb', '35', '7653460515867462932',
    'kate-lip-monster-super-glossy-g04', 'Lip Monster Super Glossy G04',
    'used', 'unknown', 'positive',
    'Vân Miu dùng KATE Lip Monster Super Glossy màu G04',
    'Creator gọi đúng dòng Lip Monster Super Glossy và màu 04 trong video makeup.',
    'Sản phẩm được dùng trong nội dung beauty campaign; disclosure không được nêu rõ nên giữ unknown.',
    96,
    'https://www.kate-global.net/my/all_products/lip/',
    'https://kao-h.assetsadobe3.com/is/image/content/dam/sites/kanebo/www-kate-global-net/asean/all_products/lip/lip-lip_monster_super_glossy-thumb-m.png?fmt=png-alpha',
    'Tên dòng và màu 04 khớp bảng màu G04 Spider Lily trên trang KATE Global.',
    jsonb_build_array(
      jsonb_build_object('kind','quote','value','Đó chính là cây son bóng dòng Lip Monster Super Glossy, đây là màu 04','timestamp_seconds',null)
    ),
    array['disclosure_not_stated','commercial_context_unconfirmed']::text[]
  );

insert into public.radar_products (
  id, name, brand, image, rating, reviews, sold, price, category, tags,
  affiliate_url, description, category_key, subcategory_key, concern_tags,
  ingredient_tags, aliases, status
) values
  (
    'cocoon-winter-melon-micellar-water-1000ml', 'Nước tẩy trang bí đao 1000ml', 'Cocoon',
    '/images/products/cocoon-winter-melon-micellar-water-1000ml.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Micellar water','Bí đao','1000ml'], null,
    'Nước tẩy trang dung tích 1 lít cho da dầu mụn. Hai creator độc lập đã dùng hoặc review đúng phiên bản; disclosure của hai nguồn chưa được nêu rõ.',
    'skincare', 'cleanser', array['tẩy trang','da dầu','da mụn','makeup'],
    array['winter melon extract','centella asiatica','tea tree'],
    array['Cocoon Winter Melon Micellar Water 1L','Nước tẩy trang Cocoon 1 lít','Nước tẩy trang bí đao 1L'],
    'published'
  ),
  (
    'cocoon-hau-giang-lotus-cleanser-310ml', 'Sữa rửa mặt sen Hậu Giang 310ml', 'Cocoon',
    '/images/products/cocoon-hau-giang-lotus-cleanser-310ml.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Lotus','Madecassoside','310ml'], null,
    'Sữa rửa mặt dạng kem ít bọt cho da nhạy cảm, phiên bản 310 ml có vòi nhấn. Evidence public hiện đến từ một creator.',
    'skincare', 'cleanser', array['da nhạy cảm','làm sạch','hàng rào da yếu'],
    array['lotus extract','madecassoside','beta-glucan','panthenol'],
    array['Cocoon Hau Giang Lotus Cleanser 310ml','Sữa rửa mặt sen Cocoon 310ml'],
    'published'
  ),
  (
    'revision-skincare-youthfull-lip-replenisher', 'YouthFull Lip Replenisher', 'Revision Skincare',
    '/images/products/revision-skincare-youthfull-lip-replenisher.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Makeup',
    array['Hyaluronic Acid','Peptides','Lip treatment'], null,
    'Sản phẩm dưỡng môi dạng đặc, hướng đến cấp ẩm và làm mịn bề mặt môi. Evidence public hiện đến từ một creator.',
    'makeup', 'lip', array['môi khô','nếp môi','dưỡng môi qua đêm'],
    array['hyaluronic acid','peptides','shea butter'],
    array['Revision YouthFull Lip','Youthful Lip Replenisher','YouthFull Lip Treatment'],
    'published'
  ),
  (
    'revision-skincare-dej-night-face-cream', 'D.E.J Night Face Cream', 'Revision Skincare',
    '/images/products/revision-skincare-dej-night-face-cream.jpg',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Skincare',
    array['Retinol 0.25%','Bakuchiol','Night cream'], null,
    'Kem dưỡng đêm chứa 0,25% retinol giải phóng chậm và bakuchiol. Evidence public hiện là trải nghiệm dùng hằng đêm từ một creator.',
    'skincare', 'moisturizer', array['lão hóa','texture','nếp nhăn','da xỉn màu'],
    array['retinol 0.25%','bakuchiol','ceramides'],
    array['Revision DEJ Night Cream','D.E.J. Night Face Cream','DEJ Night Face Cream'],
    'published'
  ),
  (
    'kate-lip-monster-super-glossy-g04', 'Lip Monster Super Glossy G04', 'KATE Tokyo',
    '/images/products/kate-lip-monster-super-glossy-g04.png',
    null, 0, 'Chưa có dữ liệu', 'Đang cập nhật', 'Makeup',
    array['Lip Monster','Super Glossy','G04'], null,
    'Son bóng lâu trôi màu G04 Spider Lily. Evidence public hiện đến từ một creator trong nội dung beauty campaign chưa rõ disclosure.',
    'makeup', 'lip', array['son bóng','môi khô','màu đỏ beige'],
    array['hyaluronic acid'],
    array['KATE Super Glossy 04','Lip Monster G04','Spider Lily'],
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
    ('8725118c-8ecc-499f-a958-dc35281115dc'::uuid, 'ahc-pro-shot-pore-eraser-serum', 'https://www.hwahae.com/en/products/AHC-PRO-SHOT-PORE-ERASER-SERUM/2194191', 'https://d1flfk77wl2xk4.cloudfront.net/Assets/ahc-pro-shot-pore-eraser-serum-30ml/11/076/XXL_p0224807611.jpg', 'Tên, pack và trải nghiệm gần một tháng xác nhận exact AHC Pro Shot Pore Eraser Serum 30 ml; nguồn mang ngữ cảnh sponsored.'),
    ('f3d250e7-2818-4c23-92f1-8c1d06b405ff'::uuid, 'dr-g-red-blemish-clear-soothing-cream', 'https://dr-g.com/collections/best-sellers/products/dr-g-red-blemish-clear-soothing-cream', 'https://dr-g.com/collections/best-sellers/products/dr-g-red-blemish-clear-soothing-cream', 'Tên đầy đủ, hũ và kết cấu gel xác nhận exact R.E.D Blemish Clear Soothing Cream 70 ml.'),
    ('5853eb48-d447-486b-a742-62dffbcb40f3'::uuid, 'cocoon-winter-melon-micellar-water-1000ml', 'https://cocoonvietnam.com/san-pham/nuoc-tay-trang-bi-dao-1000ml', 'https://image.cocoonvietnam.com/uploads/Artboard_7_3x_100_58131bf2f7.jpg', 'Hai transcript và archived frame xác nhận Nước tẩy trang bí đao Cocoon 1000 ml.'),
    ('7dce9525-a077-43fc-93ec-6404c0b54520'::uuid, 'cocoon-hau-giang-lotus-cleanser-310ml', 'https://cocoonvietnam.com/san-pham/sua-rua-mat-sen-hau-giang-310ml', 'https://image.cocoonvietnam.com/uploads/Artboard_12_ea031b6b39.jpg', 'Tên, dung tích 310 ml và vòi nhấn xác nhận exact Sữa rửa mặt sen Hậu Giang.'),
    ('d05c8942-1862-42e3-a9ad-a7a54142593c'::uuid, 'revision-skincare-youthfull-lip-replenisher', 'https://revisionskincare.com/products/youthfull-lip-replenisher%C2%AE', 'https://revisionskincare.com/cdn/shop/files/youthfull-lip-replenisher-1_e130a68c-b064-4056-a330-0f2d1c0e53df.jpg?v=1769525695&width=1024', 'Tên và pack xác nhận exact YouthFull Lip Replenisher.'),
    ('020e6cc7-2d12-49bb-a9c2-02951bf20982'::uuid, 'revision-skincare-dej-night-face-cream', 'https://revisionskincare.com/products/d-e-j-night-face-cream', 'https://revisionskincare.com/cdn/shop/files/d-e-j-night-face-cream-1_c1f2498d-f677-426a-81f1-4e4486154d04.jpg?v=1769524416&width=1024', 'Tên sản phẩm và 0,25% retinol xác nhận exact D.E.J Night Face Cream.'),
    ('af4f67af-1ea3-4f93-aa86-e0c8c237daeb'::uuid, 'kate-lip-monster-super-glossy-g04', 'https://www.kate-global.net/my/all_products/lip/', 'https://kao-h.assetsadobe3.com/is/image/content/dam/sites/kanebo/www-kate-global-net/asean/all_products/lip/lip-lip_monster_super_glossy-thumb-m.png?fmt=png-alpha', 'Tên dòng và màu 04 khớp bảng màu G04 Spider Lily của KATE.')
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
  'Đã đối chiếu exact SKU, hành vi, clip id và disclosure bằng transcript, frame khi cần và nguồn sản phẩm.',
  reviewer.user_id, now(), now()
from verified_candidate_batch_06 batch
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
from verified_candidate_batch_06 batch
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
  for item in select distinct creator_id, product_id from verified_candidate_batch_06
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
  'Manual transcript, archived-frame when required, direct clip URL, disclosure and exact-SKU review completed.',
  jsonb_build_object(
    'creator_id', batch.creator_id, 'product_id', batch.product_id,
    'source_post_id', batch.external_post_id, 'source_url', post.source_url,
    'confidence_score', batch.confidence_score,
    'official_product_url', batch.official_product_url
  )
from verified_candidate_batch_06 batch
join public.source_posts post
  on post.creator_id = batch.creator_id
 and post.external_post_id = batch.external_post_id
cross join reviewer;

-- Add only the reviewed clips from this batch to the real labeled set.
with reviewer as (
  select user_id from public.profiles where role = 'admin' order by created_at limit 1
), labels as (
  select
    post.id as source_post_id,
    case when batch.disclosure = 'sponsored' then 'commercial' else 'product_review' end as content_class,
    jsonb_build_array(jsonb_build_object(
      'brand', product.brand, 'product_name', batch.product_name,
      'variant', null, 'product_id', batch.product_id,
      'event_type', batch.event_type, 'disclosure', batch.disclosure
    )) as expected_claims,
    batch.researcher_note as note
  from verified_candidate_batch_06 batch
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
