export interface ResearchSource {
  label: string
  url: string
}

export interface CataloguePillar {
  title: string
  points: string[]
}

export interface CatalogueResearch {
  marketSignal: string
  userJobs: string[]
  contentPillars: CataloguePillar[]
  productRules: string[]
  safetyNotes: string[]
  articleBriefs: string[]
  sourceRefs: ResearchSource[]
}

const aadPublic = {
  label: "AAD public education",
  url: "https://www.aad.org/public",
}

const aadSun = {
  label: "AAD sun protection",
  url: "https://www.aad.org/public/everyday-care/sun-protection",
}

const aadHair = {
  label: "AAD hair loss resource center",
  url: "https://www.aad.org/public/diseases/hair-loss",
}

const buzzmetrics = {
  label: "Buzzmetrics x MMA Vietnam Facial Skincare 2024-2025",
  url: "https://mmaglobal.com/documents/mma-x-buzzmetrics-vietnam-facial-skincare-report",
}

const vietnamBeautyMarket = {
  label: "Vietnam online beauty retail 2025",
  url: "https://theinvestor.vn/vietnams-retail-beauty-personal-care-market-expands-30-in-2025-amid-intense-competition-d18652.html",
}

const fdaPregnancy = {
  label: "FDA cosmetics and pregnancy",
  url: "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/cosmetics-pregnancy",
}

const aadPregnancy = {
  label: "AAD pregnancy skin care",
  url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care",
}

const aadNails = {
  label: "AAD nail care basics",
  url: "https://www.aad.org/public/everyday-care/nail-care-secrets/basics",
}

const asds = {
  label: "ASDS skin experts",
  url: "https://www.asds.net/",
}

const amaCosmetic = {
  label: "AMA cosmetic dermatology overview",
  url: "https://www.ama-assn.org/public-health/prevention-wellness/what-doctors-want-patients-know-about-cosmetic-dermatology",
}

const allureFragrance = {
  label: "Allure fragrance trends",
  url: "https://www.allure.com/story/2025-fragrance-trends",
}

export const catalogueResearch: Record<string, CatalogueResearch> = {
  "da-mat": {
    marketSignal:
      "Skincare Việt Nam đang dịch chuyển từ routine phức tạp sang duy trì làn da ổn định dài hạn. Các nhu cầu thảo luận nổi bật gồm cấp ẩm, sáng da, làm sạch, chống lão hóa, trị mụn và chống nắng; da dầu là loại da được nhắc nhiều.",
    userJobs: [
      "Tôi cần biết vấn đề da của mình thuộc nhóm nào trước khi mua sản phẩm.",
      "Tôi muốn routine ít bước nhưng đúng cho da dầu, mụn, nhạy cảm hoặc treatment.",
      "Tôi cần phân biệt chăm tại nhà và lúc nào nên đi bác sĩ.",
    ],
    contentPillars: [
      { title: "Diagnosis-lite", points: ["Quiz loại da và tình trạng da", "Bản đồ triệu chứng: mụn, đỏ rát, bong tróc, xỉn màu", "Cảnh báo khi không tự xử lý tại nhà"] },
      { title: "Routine builder", points: ["Routine sáng/tối 3-5 bước", "Thứ tự bôi sản phẩm", "Tần suất treatment theo mức chịu đựng"] },
      { title: "Ingredient fit", points: ["Hoạt chất chính cho từng nhu cầu", "Cặp hoạt chất nên/không nên phối", "Nhánh pregnancy-safe và da nhạy cảm"] },
    ],
    productRules: [
      "Mọi product card skincare nên có need tags như trị mụn, chống nắng, phục hồi thay vì chỉ category.",
      "Bắt buộc lưu skin type fit: da dầu, da khô, nhạy cảm, treatment, mọi loại da.",
      "Review phải có texture, finish, mùi, khả năng bí da/cay mắt và giá/ml.",
    ],
    safetyNotes: [
      "Không claim trị bệnh hoặc chữa khỏi nám/mụn nặng bằng mỹ phẩm.",
      "Retinoid, hydroquinone và thuốc bôi/uống cần nhánh cảnh báo pregnancy-safe.",
      "Mụn viêm nặng, kích ứng kéo dài, nghi corticoid hoặc nhiễm trùng nên khuyến nghị gặp bác sĩ da liễu.",
    ],
    articleBriefs: [
      "Routine da dầu mụn 4 bước cho người mới ở khí hậu nóng ẩm",
      "Da đang treatment bị bong tróc: nên ngưng gì và phục hồi thế nào",
      "Sáng da / đều màu khác gì trắng da: cách viết an toàn cho người Việt",
    ],
    sourceRefs: [buzzmetrics, aadPublic, aadSun, aadPregnancy],
  },
  "tri-mun": {
    marketSignal:
      "Khi người tiêu dùng thật sự tham gia thảo luận skincare, mụn là một trong các vấn đề nổi bật nhất. Đây nên là entry point độc lập, không chôn trong skincare.",
    userJobs: [
      "Tôi muốn biết mụn của mình là mụn ẩn, viêm, đầu đen hay nội tiết.",
      "Tôi cần chọn treatment nhưng không phá hàng rào da.",
      "Tôi muốn biết dấu hiệu nào cần đi khám thay vì mua thêm sản phẩm.",
    ],
    contentPillars: [
      { title: "Phân loại mụn", points: ["Mụn ẩn/bít tắc", "Mụn viêm, mụn mủ", "Mụn nội tiết và mụn body"] },
      { title: "Treatment ladder", points: ["Làm sạch dịu nhẹ + dưỡng phục hồi", "BHA/azelaic/benzoyl peroxide theo tình trạng", "Retinoid cho người đã có nền routine ổn"] },
      { title: "After-acne", points: ["Thâm mụn", "Sẹo rỗ", "Đỏ sau viêm", "Chống nắng để giảm tăng sắc tố"] },
    ],
    productRules: [
      "Product filter cần loại mụn, mức kích ứng, tần suất dùng và có/không fragrance.",
      "Review treatment phải ghi cách bắt đầu: patch test, tần suất tuần đầu, sản phẩm phục hồi đi kèm.",
      "Không xếp sản phẩm treatment chung với serum cấp ẩm nếu không có nhãn risk level.",
    ],
    safetyNotes: [
      "Mụn nang, đau, để sẹo, tái phát nặng hoặc đã thử OTC lâu không cải thiện nên gặp bác sĩ.",
      "Không khuyến khích tự phối nhiều acid/retinoid trong cùng routine.",
      "Không dùng ngôn ngữ bảo đảm hết mụn trong vài ngày.",
    ],
    articleBriefs: [
      "Mụn ẩn khác gì purging: checklist 7 ngày đầu",
      "BHA, benzoyl peroxide, azelaic acid: chọn gì cho từng loại mụn",
      "Mụn lưng: tóc, dầu xả, mồ hôi và body wash có liên quan thế nào",
    ],
    sourceRefs: [buzzmetrics, { label: "AAD acne treatment", url: "https://www.aad.org/public/diseases/acne/derm-treat/treat" }],
  },
  "sang-da-chong-nang": {
    marketSignal:
      "Chống nắng và sáng da/đều màu là intent lớn ở Việt Nam, đặc biệt với da dầu, thâm mụn và nám sau sinh. Nên dùng ngôn ngữ 'sáng da / đều màu' thay vì đặt trục chính là 'trắng da'.",
    userJobs: [
      "Tôi cần chống nắng không bí, không cay mắt, hợp da dầu.",
      "Tôi muốn xử lý thâm mụn/sạm mà không bị cảm giác kem trộn.",
      "Tôi cần route riêng cho nám nhẹ, nám sau sinh và tăng sắc tố sau viêm.",
    ],
    contentPillars: [
      { title: "SPF by context", points: ["Đi làm", "Đi biển", "Chơi thể thao", "Makeup có SPF", "Da treatment"] },
      { title: "Brightening safely", points: ["Vitamin C", "Niacinamide", "Tranexamic acid", "Arbutin", "Exfoliation nhẹ"] },
      { title: "Pigmentation escalation", points: ["Thâm mụn tại nhà", "Nám/tàn nhang cần kiên trì", "Khi cân nhắc clinic"] },
    ],
    productRules: [
      "Sunscreen card cần finish, khả năng nâng tone, cay mắt, chống nước, có vón khi makeup.",
      "Sáng da phải gắn chống nắng như điều kiện nền, không tách rời.",
      "Filter theo da dầu/khô/nhạy cảm quan trọng hơn nam/nữ.",
    ],
    safetyNotes: [
      "Khuyến nghị broad-spectrum, dùng đủ lượng và thoa lại khi hoạt động ngoài trời.",
      "Nám sau sinh/pregnancy-safe phải có cảnh báo tránh retinoids/hydroquinone nếu không có tư vấn y tế.",
      "Không dùng claim làm trắng cấp tốc.",
    ],
    articleBriefs: [
      "Kem chống nắng da dầu: cách đọc finish và test bí da",
      "Thâm mụn cần bao lâu mờ: routine thực tế 8-12 tuần",
      "Nám sau sinh: mỹ phẩm làm được gì và khi nào nên hỏi bác sĩ",
    ],
    sourceRefs: [buzzmetrics, aadSun, { label: "FDA sunscreen guidance", url: "https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun" }, aadPregnancy],
  },
  "ingredient-radar": {
    marketSignal:
      "Ingredient Radar là lớp chuyên môn giúp site khác blog review: người dùng hiểu hoạt chất, nồng độ, cách phối và rủi ro trước khi mua.",
    userJobs: [
      "Tôi muốn biết hoạt chất này giải quyết vấn đề gì.",
      "Tôi cần biết có dùng chung được với routine hiện tại không.",
      "Tôi muốn cảnh báo cho da nhạy cảm, pregnancy-safe hoặc treatment mạnh.",
    ],
    contentPillars: [
      { title: "Ingredient profile", points: ["Công dụng", "Mức bằng chứng", "Nồng độ thường gặp", "Da phù hợp"] },
      { title: "Pairing matrix", points: ["Có thể phối", "Nên tách sáng/tối", "Không nên dùng chung khi mới bắt đầu"] },
      { title: "Risk index", points: ["Kích ứng", "Purging", "Photosensitivity", "Pregnancy caution"] },
    ],
    productRules: [
      "Product detail nên show key ingredients và mapped need.",
      "Mỗi ingredient page cần list sản phẩm có hoạt chất đó và bài hướng dẫn liên quan.",
      "Không để tag ingredient chỉ là SEO; phải có warning và routine placement.",
    ],
    safetyNotes: [
      "Retinoid, hydroquinone, finasteride, spironolactone và một số thuốc kháng sinh cần cảnh báo khi mang thai.",
      "Hoạt chất mạnh cần patch test và tăng tần suất chậm.",
      "Không biến ingredient page thành kê đơn y khoa.",
    ],
    articleBriefs: [
      "Niacinamide: vì sao hợp da dầu nhưng không phải càng cao càng tốt",
      "Retinol cho người mới: lịch 6 tuần không phá barrier",
      "Tranexamic acid, arbutin, vitamin C: chọn gì cho thâm/nám nhẹ",
    ],
    sourceRefs: [aadPublic, fdaPregnancy, aadPregnancy],
  },
  "product-radar": {
    marketSignal:
      "Beauty & personal care là nhóm online retail rất lớn ở Việt Nam, với báo cáo 2025 ghi nhận doanh số khoảng 74,4 nghìn tỷ đồng và tăng gần 30% YoY. Product Radar nên là bộ lọc mua hàng, không chỉ listing sản phẩm.",
    userJobs: [
      "Tôi cần shortlist sản phẩm theo vấn đề và ngân sách.",
      "Tôi muốn biết sản phẩm đáng tiền hay chỉ đang viral.",
      "Tôi muốn so sánh texture/finish/giá/ml/review thật trước khi mua.",
    ],
    contentPillars: [
      { title: "Commerce filters", points: ["Nhu cầu", "Loại da", "Budget", "Brand origin", "Texture", "Affiliate availability"] },
      { title: "Review standard", points: ["Ai phù hợp", "Ai nên tránh", "Cảm giác dùng", "Tác dụng phụ", "Giá trị so với lựa chọn khác"] },
      { title: "Comparison UX", points: ["So sánh 2-4 sản phẩm", "Highlight best value", "Link bài KOC/blog liên quan"] },
    ],
    productRules: [
      "Không list theo nam/nữ trước; giới tính là filter optional.",
      "Bắt buộc có need tags và skin type fit trên mỗi sản phẩm.",
      "Cần trường price band: dưới 200k, 200-500k, luxury.",
    ],
    safetyNotes: [
      "Affiliate content phải tách đánh giá thật và link mua.",
      "Không dùng product score nếu chưa có dữ liệu review/tiêu chí rõ.",
      "Sản phẩm treatment phải hiển thị warning ngắn.",
    ],
    articleBriefs: [
      "Top kem chống nắng da dầu dưới 300k: test finish và bí da",
      "Serum phục hồi đáng mua: B5, ceramide, centella khác gì nhau",
      "Retinol drugstore vs luxury: khi nào đáng nâng cấp",
    ],
    sourceRefs: [vietnamBeautyMarket, { label: "Vietnam beauty sector overview", url: "https://www.vietnam-briefing.com/news/vietnam-beauty-personal-care-sector-market-entry.html/" }],
  },
  bodycare: {
    marketSignal:
      "Bodycare nên đi cùng xu hướng skincare toàn thân: mụn lưng, viêm nang lông, body sáng da, khử mùi và chống nắng body đều có search intent rõ.",
    userJobs: [
      "Tôi muốn xử lý mụn lưng/thâm body mà không dùng sản phẩm quá mạnh.",
      "Tôi cần khử mùi và body mist phù hợp khí hậu nóng ẩm.",
      "Tôi muốn chống nắng body cho đi biển/thể thao.",
    ],
    contentPillars: [
      { title: "Body concerns", points: ["Mụn lưng", "Viêm nang lông/KP", "Thâm vùng gấp", "Mồ hôi/mùi"] },
      { title: "Body routine", points: ["Sữa tắm", "Tẩy da chết body", "Body serum/lotion", "Sunscreen body"] },
      { title: "Lifestyle triggers", points: ["Mồ hôi", "Quần áo bó", "Dầu xả chảy xuống lưng", "Cạo/wax"] },
    ],
    productRules: [
      "Body product cần filter theo vùng dùng: lưng, ngực, nách, đầu gối, bikini.",
      "Review phải ghi độ dính, mùi, thấm nhanh và có dây áo/quần không.",
      "Mụn body nên nối với haircare vì dầu xả/sản phẩm tóc có thể gây residue.",
    ],
    safetyNotes: [
      "Vùng bikini/nách dễ kích ứng; tránh acid quá mạnh nếu mới wax/cạo.",
      "Mụn body lan rộng, đau, có mủ hoặc nghi viêm nang lông nặng nên đi khám.",
      "Không quảng bá body trắng cấp tốc.",
    ],
    articleBriefs: [
      "Mụn lưng có liên quan dầu gội/xả không?",
      "Routine body sáng da an toàn cho thâm đầu gối và khuỷu tay",
      "Viêm nang lông: AHA/BHA/urea nên chọn gì?",
    ],
    sourceRefs: [aadPublic, vietnamBeautyMarket],
  },
  "toc-da-dau": {
    marketSignal:
      "Tóc và da đầu có intent mạnh cho cả nam lẫn nữ: rụng tóc, gàu, tóc nhanh bết, tóc hư tổn và chăm râu. AAD tách hair loss thành resource center riêng, nên Đẹp Radar cũng nên tách khỏi skincare mặt.",
    userJobs: [
      "Tôi cần biết rụng tóc của mình có đáng lo không.",
      "Tôi muốn xử lý gàu/ngứa/tóc bết bằng sản phẩm phù hợp.",
      "Tôi cần phục hồi tóc tẩy nhuộm hoặc chọn sản phẩm tạo kiểu nam.",
    ],
    contentPillars: [
      { title: "Scalp-first", points: ["Gàu khô/dầu", "Da đầu dầu", "Ngứa", "Nấm/viêm nghiêm trọng"] },
      { title: "Hair loss triage", points: ["Rụng theo mùa", "Hói chữ M", "Sau sinh/stress", "Khi nên đi khám"] },
      { title: "Hair shaft care", points: ["Tóc tẩy nhuộm", "Bond repair", "Heat protection", "Giữ màu"] },
    ],
    productRules: [
      "Filter tóc cần tách scalp concern và hair shaft concern.",
      "Sản phẩm tạo kiểu nam cần ghi độ giữ nếp, độ bóng, gội sạch dễ không.",
      "Dầu gội trị gàu/treatment scalp phải có tần suất và warning.",
    ],
    safetyNotes: [
      "Rụng tóc từng mảng, rụng kéo dài, đau/ngứa/đóng vảy nên gặp bác sĩ.",
      "Không claim mọc tóc chắc chắn nếu không có bằng chứng rõ.",
      "Một số thuốc trị rụng tóc không phù hợp khi mang thai.",
    ],
    articleBriefs: [
      "Rụng tóc nam: phân biệt hói chữ M và rụng tóc tạm thời",
      "Gàu dầu hay da đầu khô: chọn dầu gội thế nào",
      "Tóc tẩy nhuộm hư tổn: bond repair có đáng tiền không",
    ],
    sourceRefs: [aadHair, aadPublic],
  },
  makeup: {
    marketSignal:
      "Makeup kéo traffic tốt từ Gen Z và trend social. Nên tổ chức theo dịp dùng, loại sản phẩm và finish thay vì tách nam/nữ trước.",
    userJobs: [
      "Tôi cần look nhanh cho đi học, đi làm hoặc đi tiệc.",
      "Tôi muốn base không mốc, không xuống tone trên da dầu/khô.",
      "Tôi cần makeup nam nhẹ để che mụn/thâm nhưng tự nhiên.",
    ],
    contentPillars: [
      { title: "Look by occasion", points: ["Đi học", "Đi làm", "Date night", "Wedding guest", "Glam"] },
      { title: "Base resolver", points: ["Da dầu", "Da khô", "Lỗ chân lông", "Cakey/mốc nền", "Oxidize"] },
      { title: "Product skill", points: ["Son", "Mascara", "Eyeliner", "Blush", "Cọ/mút"] },
    ],
    productRules: [
      "Makeup product cần tone range, undertone, finish và độ bền.",
      "Base makeup phải có filter da dầu/khô và khí hậu nóng ẩm.",
      "Makeup nam là shortcut riêng nhưng vẫn dùng chung filter nhu cầu.",
    ],
    safetyNotes: [
      "Eye makeup cần cảnh báo kích ứng, lens, hạn dùng sau mở nắp.",
      "Không dùng tester chung hoặc dụng cụ bẩn trong nội dung dịch vụ.",
      "Da đang mụn viêm nên có hướng dẫn tẩy trang/làm sạch kỹ.",
    ],
    articleBriefs: [
      "Base makeup cho da dầu ở thời tiết Việt Nam",
      "Makeup đi tiệc: checklist nền, mắt, môi không trôi",
      "Makeup nam nhẹ: che mụn và đều màu nhưng không lộ nền",
    ],
    sourceRefs: [vietnamBeautyMarket],
  },
  "mui-huong": {
    marketSignal:
      "Fragrance đang mở rộng từ perfume sang body mist, hair mist và layering. Đây là mảng rất hợp chữ Radar vì người dùng chọn mùi theo dịp, mùa và vibe.",
    userJobs: [
      "Tôi muốn mùi đi làm/đi học/đi date không quá gắt.",
      "Tôi cần chọn nước hoa nam/nữ/unisex theo note và độ lưu hương.",
      "Tôi muốn layering body lotion, mist, perfume sao cho sạch và bền mùi.",
    ],
    contentPillars: [
      { title: "Scent by context", points: ["Văn phòng", "Mùa hè", "Đi bar/date", "Đi học", "Gym"] },
      { title: "Olfactive families", points: ["Fresh", "Woody", "Floral", "Gourmand", "Musk", "Skin scent"] },
      { title: "Layering wardrobe", points: ["Sữa tắm", "Lotion", "Body mist", "Hair mist", "Perfume"] },
    ],
    productRules: [
      "Fragrance card cần notes, projection, longevity, occasion và gender expression.",
      "Body/hair mist cần ghi độ nhẹ, alcohol feel và khả năng layering.",
      "Không gắn cứng nam/nữ; cho phép unisex và vibe tags.",
    ],
    safetyNotes: [
      "Người nhạy cảm hương liệu nên patch test và tránh xịt lên vùng kích ứng.",
      "Không xịt perfume mạnh trực tiếp lên tóc nếu công thức không dành cho tóc.",
      "Không dùng mùi quá nồng trong không gian kín/công sở.",
    ],
    articleBriefs: [
      "Skin scent là gì và vì sao hợp văn phòng?",
      "Body mist, hair mist, perfume: khác nhau thế nào?",
      "Nước hoa nam mùa hè: fresh, woody, clean chọn sao cho không gắt",
    ],
    sourceRefs: [allureFragrance, { label: "Allure hair fragrance wardrobe 2026", url: "https://www.allure.com/story/hair-fragrance-wardrobe-2026" }],
  },
  "nam-gioi": {
    marketSignal:
      "Men's grooming nên là shortcut, không phải trục phân loại toàn site. Nam giới thường cần ít bước, dễ mua, giải quyết nhanh mụn/dầu/tóc/râu/mùi.",
    userJobs: [
      "Tôi muốn routine nam cơ bản không quá nhiều bước.",
      "Tôi cần xử lý da dầu mụn, gàu, rụng tóc hoặc mùi cơ thể.",
      "Tôi muốn sản phẩm grooming dễ dùng, ít mùi, không bóng nhờn.",
    ],
    contentPillars: [
      { title: "3-step grooming", points: ["Rửa mặt", "Dưỡng ẩm nhẹ", "Chống nắng"] },
      { title: "Male concern shortcuts", points: ["Da dầu mụn", "Rụng tóc", "Pomade/gàu", "Cạo râu", "Mồ hôi"] },
      { title: "Low-friction buying", points: ["Dưới 200k", "Mua ở drugstore", "Không mùi nồng", "Dùng sáng nhanh"] },
    ],
    productRules: [
      "Tag nam giới nên gắn thêm need tags để không tạo catalogue song song.",
      "Review cần ghi cảm giác sau cạo râu, độ bóng, mùi và thời gian dùng.",
      "Tóc nam/tạo kiểu cần hold, shine, washability.",
    ],
    safetyNotes: [
      "Mụn do cạo râu, viêm nang lông hoặc kích ứng aftershave cần hướng dẫn phân biệt.",
      "Rụng tóc nam không nên chỉ bán serum; phải có nhánh đi khám.",
      "Makeup nam cần tẩy trang/làm sạch như makeup thông thường.",
    ],
    articleBriefs: [
      "Skincare nam 3 bước cho da dầu mụn",
      "Pomade gây mụn trán/lưng không? Cách dùng và gội sạch",
      "Rụng tóc nam: khi nào serum không đủ",
    ],
    sourceRefs: [aadHair, vietnamBeautyMarket],
  },
  "clinic-treatment": {
    marketSignal:
      "Clinic/Treatment giúp Đẹp Radar khác blog beauty thông thường. Đây là mảng cần kiểm chứng, hỏi đúng câu hỏi và nhấn mạnh rủi ro trước khi làm.",
    userJobs: [
      "Tôi muốn biết peel/laser/filler phù hợp vấn đề nào.",
      "Tôi cần checklist chọn clinic/bác sĩ và câu hỏi trước khi làm.",
      "Tôi muốn hiểu downtime, rủi ro và dấu hiệu biến chứng.",
    ],
    contentPillars: [
      { title: "Procedure explainers", points: ["Peel", "Laser/IPL", "RF microneedling", "Subcision", "Botox/filler"] },
      { title: "Clinic checklist", points: ["Bằng cấp", "Tư vấn trước thủ thuật", "Consent", "Thiết bị", "Aftercare"] },
      { title: "Risk & recovery", points: ["PIH", "Bỏng", "Sưng bầm", "Nhiễm trùng", "Khi cần tái khám"] },
    ],
    productRules: [
      "Clinic listing phải khác product listing: có provider, quy trình, rủi ro, downtime.",
      "Không cho điểm clinic nếu chưa có tiêu chí minh bạch.",
      "Mọi nội dung procedure cần disclaimer không thay thế tư vấn y tế.",
    ],
    safetyNotes: [
      "Thủ thuật xâm lấn/tối thiểu xâm lấn nên được tư vấn bởi bác sĩ/chuyên gia đủ năng lực.",
      "Da châu Á/dễ tăng sắc tố cần cảnh báo PIH với peel/laser.",
      "Nội dung filler/botox phải nhấn mạnh biến chứng và xử trí khẩn cấp.",
    ],
    articleBriefs: [
      "Laser trị nám: 10 câu hỏi cần hỏi clinic trước khi làm",
      "Sẹo rỗ: subcision, TCA cross, RF microneedling khác gì nhau",
      "Botox/filler: dấu hiệu biến chứng không nên bỏ qua",
    ],
    sourceRefs: [asds, amaCosmetic, { label: "Cosmetic procedures in skin of color", url: "https://jcadonline.com/cosmetic-procedures-skin-of-color/" }],
  },
  "beauty-lifestyle": {
    marketSignal:
      "Beauty lifestyle giúp mở rộng từ sản phẩm sang thói quen: ngủ, stress, hormone, chu kỳ, sau sinh, fitness. Cần viết cẩn thận để không biến thành claim chữa bệnh.",
    userJobs: [
      "Tôi muốn biết stress, chu kỳ, ăn uống ảnh hưởng da thế nào.",
      "Tôi cần routine theo tuổi hoặc sau sinh an toàn.",
      "Tôi muốn tránh treatment quá đà và fake review.",
    ],
    contentPillars: [
      { title: "Lifestyle triggers", points: ["Stress", "Ngủ", "Chu kỳ", "Mồ hôi", "Ăn uống"] },
      { title: "Life-stage beauty", points: ["Tuổi 20/30/40+", "Sau sinh", "Pregnancy-safe", "Fitness"] },
      { title: "Safe beauty mindset", points: ["Kem trộn", "Corticoid", "Fake review", "Treatment overload"] },
    ],
    productRules: [
      "Không bán supplement như giải pháp chính nếu không có dữ liệu rõ.",
      "Pregnancy-safe content cần ingredient warning và khuyến nghị hỏi bác sĩ khi lo ngại.",
      "Routine theo tuổi nên dựa trên nhu cầu da, không chỉ tuổi sinh học.",
    ],
    safetyNotes: [
      "FDA không đưa lời khuyên y tế cá nhân cho mỹ phẩm khi mang thai; người dùng có lo ngại nên hỏi bác sĩ.",
      "AAD liệt kê nhiều hoạt chất/thuốc cần tránh trong thai kỳ như retinoids và hydroquinone.",
      "Không claim ăn uống/supplement chữa mụn/nám.",
    ],
    articleBriefs: [
      "Mụn trước kỳ kinh: skincare có thể làm gì và giới hạn ở đâu",
      "Pregnancy-safe beauty: hoạt chất nên tránh và lựa chọn dịu nhẹ",
      "Treatment quá đà: dấu hiệu hàng rào da đang báo động",
    ],
    sourceRefs: [fdaPregnancy, aadPregnancy],
  },
  "nails-mi-long-may": {
    marketSignal:
      "Nails/mi/lông mày không phải core đầu tiên nhưng có local search và dịch vụ mạnh. Góc khác biệt nên là an toàn dịch vụ, vệ sinh và dấu hiệu kích ứng.",
    userJobs: [
      "Tôi muốn mẫu nail/mi/mày hợp dịp và phong cách.",
      "Tôi cần biết rủi ro dị ứng keo, nhiễm trùng, hư móng.",
      "Tôi muốn checklist vệ sinh trước khi chọn salon.",
    ],
    contentPillars: [
      { title: "Style gallery", points: ["Nail công sở", "Nail đi tiệc", "Mi tự nhiên", "Dáng mày"] },
      { title: "Service safety", points: ["Vệ sinh dụng cụ", "Keo nối mi", "UV gel", "Cắt khóe/cuticle"] },
      { title: "Aftercare", points: ["Chăm móng yếu", "Dị ứng keo", "Serum dưỡng mi", "Tẩy/removal đúng cách"] },
    ],
    productRules: [
      "Service card cần thời gian bền, rủi ro, aftercare và đối tượng nên tránh.",
      "Nail/mi content nên có dấu hiệu cần gặp bác sĩ nếu đau, sưng, đổi màu, nhiễm trùng.",
      "Không dùng ảnh mẫu mà không nói rõ maintenance và removal.",
    ],
    safetyNotes: [
      "AAD khuyên chú ý thay đổi ở móng và gặp bác sĩ da liễu khi móng đổi bất thường.",
      "Gel manicure cần chống nắng tay hoặc bảo vệ khỏi UV khi phù hợp.",
      "Dị ứng keo nối mi hoặc sưng đau cần ngưng dịch vụ và xử lý y tế nếu nặng.",
    ],
    articleBriefs: [
      "Gel manicure: cách bảo vệ da tay và móng trước đèn UV",
      "Nối mi bị ngứa đỏ: dấu hiệu dị ứng keo và nên làm gì",
      "Dáng lông mày theo khuôn mặt: guide không chạy trend quá đà",
    ],
    sourceRefs: [aadNails, { label: "AAD gel manicure safety", url: "https://www.aad.org/media/news-releases/gel-manicures-dermatologists-share-tips-to-keep-nails-healthy" }],
  },
  "beauty-tech": {
    marketSignal:
      "Beauty tech hợp với chữ Radar vì có tính mới và giá cao. Nội dung nên đi theo hướng có đáng tiền không, bằng chứng gì, ai nên tránh, thay vì hype thiết bị.",
    userJobs: [
      "Tôi muốn biết máy rửa mặt/LED/IPL có đáng mua không.",
      "Tôi cần hiểu rủi ro và đối tượng nên tránh.",
      "Tôi muốn so sánh thiết bị theo giá, hiệu quả, bảo hành, tần suất dùng.",
    ],
    contentPillars: [
      { title: "Evidence check", points: ["Mức bằng chứng", "Kỳ vọng thực tế", "Thời gian thấy kết quả", "Không thay thế điều trị"] },
      { title: "Device safety", points: ["Mắt", "Da nhạy cảm", "Thai kỳ", "Màu da", "Thuốc đang dùng"] },
      { title: "Value radar", points: ["Giá/lần dùng", "Bảo hành", "Pin/phụ kiện", "Dễ duy trì"] },
    ],
    productRules: [
      "Tool card cần contraindications, frequency, warranty và cleaning hygiene.",
      "Không dùng claim trị mụn/trẻ hóa chắc chắn nếu chỉ là thiết bị consumer.",
      "So sánh nên có 'đáng mua nếu' và 'bỏ qua nếu'.",
    ],
    safetyNotes: [
      "LED/IPL/laser tại nhà cần cảnh báo mắt, da nhạy cảm, thuốc gây nhạy sáng.",
      "IPL tại nhà không phù hợp mọi màu da/màu lông; cần đọc hướng dẫn hãng.",
      "Máy rửa mặt có thể làm kích ứng nếu dùng quá thường xuyên hoặc da đang yếu.",
    ],
    articleBriefs: [
      "LED mask có đáng tiền không: kỳ vọng thật trong 8-12 tuần",
      "IPL tại nhà: ai nên tránh và checklist an toàn",
      "Máy rửa mặt: khi nào giúp sạch hơn, khi nào làm da yếu hơn",
    ],
    sourceRefs: [aadPublic],
  },
}

export function getCatalogueResearch(slug: string) {
  return catalogueResearch[slug]
}
