import type { Post, Product } from "@/lib/types"

export interface CatalogueBranch {
  title: string
  description: string
  keywords: string[]
}

export interface CatalogueSection {
  slug: string
  title: string
  shortTitle: string
  description: string
  audience: string
  branches: CatalogueBranch[]
  filters: string[]
  productTypes: string[]
  featuredQueries: string[]
  topMenu?: boolean
}

export const catalogueSections: CatalogueSection[] = [
  {
    slug: "da-mat",
    title: "Da mặt / Skincare",
    shortTitle: "Da mặt",
    description: "Trung tâm skincare theo nhu cầu: trị mụn, da dầu, sáng da, chống nắng, phục hồi, lão hóa và routine cơ bản.",
    audience: "Người mới skincare, da đang treatment, người cần routine rõ ràng theo tình trạng da.",
    filters: ["Loại da", "Độ nhạy cảm", "Tuổi", "Ngân sách", "Mang thai/sau sinh"],
    productTypes: ["Sữa rửa mặt", "Toner", "Serum", "Kem dưỡng", "Kem chống nắng", "Treatment"],
    featuredQueries: ["kem chống nắng da dầu", "routine da mụn", "serum phục hồi B5", "sáng da đều màu"],
    topMenu: true,
    branches: [
      { title: "Trị mụn", description: "Mụn ẩn, mụn viêm, mụn đầu đen, mụn nội tiết, routine da mụn.", keywords: ["mụn", "acne", "bha", "retinoid", "azelaic"] },
      { title: "Da dầu & lỗ chân lông", description: "Kiềm dầu, bã nhờn, lỗ chân lông to, da bóng nhờn.", keywords: ["da dầu", "kiềm dầu", "lỗ chân lông", "pore"] },
      { title: "Sáng da / đều màu", description: "Thâm mụn, sạm da, xỉn màu, tàn nhang, dưỡng sáng an toàn.", keywords: ["sáng da", "đều màu", "thâm", "vitamin c", "niacinamide"] },
      { title: "Nám / sắc tố", description: "Nám mảng, nám chân sâu, melasma, tăng sắc tố sau viêm.", keywords: ["nám", "melasma", "sắc tố", "tranexamic", "arbutin"] },
      { title: "Chống nắng", description: "Chống nắng da dầu, da khô, da nhạy cảm, đi biển, đi làm.", keywords: ["chống nắng", "spf", "sunscreen", "uv"] },
      { title: "Cấp ẩm & phục hồi", description: "Da khô, bong tróc, hàng rào bảo vệ da, ceramide, B5, HA.", keywords: ["cấp ẩm", "phục hồi", "b5", "ha", "ceramide"] },
      { title: "Chống lão hóa", description: "Nếp nhăn, chảy xệ, mất đàn hồi, retinol, peptide.", keywords: ["lão hóa", "retinol", "peptide", "collagen", "nếp nhăn"] },
      { title: "Da nhạy cảm / kích ứng", description: "Đỏ rát, châm chích, dị ứng mỹ phẩm, phục hồi sau treatment.", keywords: ["nhạy cảm", "kích ứng", "đỏ rát", "centella"] },
      { title: "Tẩy da chết", description: "AHA, BHA, PHA, enzyme, tẩy da chết vật lý.", keywords: ["tẩy da chết", "aha", "bha", "pha", "enzyme"] },
      { title: "Routine cơ bản", description: "Routine sáng/tối, routine 3 bước, skincare cho người mới.", keywords: ["routine", "người mới", "3 bước", "sáng tối"] },
    ],
  },
  {
    slug: "tri-mun",
    title: "Trị mụn",
    shortTitle: "Trị mụn",
    description: "Shortcut cho nhu cầu mạnh nhất: phân loại mụn, routine tối giản, sản phẩm treatment và khi nào nên đi bác sĩ.",
    audience: "Người bị mụn ẩn, mụn viêm, mụn nội tiết, mụn lưng hoặc da dầu dễ bít tắc.",
    filters: ["Loại mụn", "Vị trí", "Da dầu/nhạy cảm", "Treatment đang dùng", "Ngân sách"],
    productTypes: ["BHA", "Benzoyl peroxide", "Retinoid", "Azelaic acid", "Sữa rửa mặt dịu nhẹ", "Kem phục hồi"],
    featuredQueries: ["mụn ẩn nên dùng gì", "mụn viêm da dầu", "mụn lưng", "routine da mụn nhạy cảm"],
    topMenu: true,
    branches: [
      { title: "Mụn ẩn", description: "Bít tắc, sần dưới da, routine làm sạch và tẩy da chết hợp lý.", keywords: ["mụn ẩn", "bít tắc", "bha"] },
      { title: "Mụn viêm", description: "Mụn đỏ, đau, dễ thâm; ưu tiên giảm viêm và phục hồi.", keywords: ["mụn viêm", "benzoyl", "azelaic"] },
      { title: "Mụn nội tiết", description: "Mụn quanh cằm, tái phát theo chu kỳ; có nhánh cảnh báo đi khám.", keywords: ["mụn nội tiết", "hormone", "chu kỳ"] },
      { title: "Mụn body", description: "Mụn lưng, mụn ngực, mụn mông và sản phẩm body treatment.", keywords: ["mụn lưng", "mụn body", "body"] },
    ],
  },
  {
    slug: "sang-da-chong-nang",
    title: "Sáng da & chống nắng",
    shortTitle: "Sáng da & chống nắng",
    description: "Gộp hai nhu cầu tìm kiếm lớn: đều màu, thâm mụn, nám nhẹ và chống nắng theo loại da/ngữ cảnh.",
    audience: "Người có thâm mụn, da xỉn màu, sạm nắng, nám nhẹ hoặc cần SPF dùng hằng ngày.",
    filters: ["Da dầu", "Da khô", "Da nhạy cảm", "Đi làm/đi biển", "Có makeup", "Mang thai/sau sinh"],
    productTypes: ["Vitamin C", "Niacinamide", "Tranexamic acid", "Kem chống nắng", "Tẩy da chết nhẹ"],
    featuredQueries: ["kem chống nắng da dầu", "sáng da đều màu", "thâm mụn", "nám sau sinh"],
    topMenu: true,
    branches: [
      { title: "Thâm mụn / PIH", description: "Tăng sắc tố sau viêm, cách phối treatment và chống nắng.", keywords: ["thâm", "pih", "mụn"] },
      { title: "Da xỉn màu", description: "Thiếu ẩm, thiếu ngủ, sạm nắng, routine dưỡng sáng an toàn.", keywords: ["xỉn màu", "sáng da", "đều màu"] },
      { title: "Chống nắng da dầu", description: "Finish ráo, không bí, không cay mắt, hợp khí hậu Việt Nam.", keywords: ["chống nắng", "da dầu", "không bí"] },
      { title: "Nám / tàn nhang", description: "Nội dung kiểm chứng, phân biệt chăm tại nhà và clinic.", keywords: ["nám", "tàn nhang", "melasma"] },
    ],
  },
  {
    slug: "ingredient-radar",
    title: "Ingredient Radar",
    shortTitle: "Ingredient Radar",
    description: "Bản đồ thành phần theo công dụng, rủi ro kích ứng, cách phối routine và đối tượng nên tránh.",
    audience: "Người đọc label, so sánh hoạt chất, muốn hiểu vì sao sản phẩm phù hợp hoặc không phù hợp.",
    filters: ["Công dụng", "Độ kích ứng", "Nồng độ", "Có dùng treatment", "Pregnancy-safe"],
    productTypes: ["BHA", "Vitamin C", "Niacinamide", "Retinol", "Ceramide", "Zinc oxide"],
    featuredQueries: ["niacinamide dùng với gì", "retinol cho người mới", "BHA trị mụn ẩn", "ceramide phục hồi da"],
    topMenu: true,
    branches: [
      { title: "Trị mụn", description: "BHA, benzoyl peroxide, retinoid, azelaic acid, sulfur.", keywords: ["bha", "benzoyl", "retinoid", "azelaic"] },
      { title: "Sáng da / thâm nám", description: "Vitamin C, niacinamide, tranexamic acid, arbutin, kojic acid.", keywords: ["vitamin c", "niacinamide", "tranexamic", "arbutin"] },
      { title: "Phục hồi", description: "Ceramide, panthenol/B5, centella, madecassoside, peptide.", keywords: ["ceramide", "b5", "centella", "peptide"] },
      { title: "Chống nắng", description: "Zinc oxide, titanium dioxide, avobenzone, Tinosorb, Uvinul.", keywords: ["zinc oxide", "tinosorb", "uvinul", "avobenzone"] },
    ],
  },
  {
    slug: "product-radar",
    title: "Product Radar / Review sản phẩm",
    shortTitle: "Review sản phẩm",
    description: "Bộ lọc mua hàng theo loại sản phẩm, nhu cầu, ngân sách và độ đáng tiền thay vì chỉ là bài review rời rạc.",
    audience: "Người sắp mua mỹ phẩm, cần shortlist sản phẩm theo vấn đề da và ngân sách.",
    filters: ["Nhu cầu", "Loại sản phẩm", "Brand", "Ngân sách", "Da dầu/khô/nhạy cảm", "Đáng tiền"],
    productTypes: ["Làm sạch", "Treatment", "Dưỡng ẩm", "Chống nắng", "Mặt nạ", "Dược mỹ phẩm"],
    featuredQueries: ["serum dưới 500k", "kem chống nắng không bí", "sữa rửa mặt dịu nhẹ", "retinol cho người mới"],
    topMenu: true,
    branches: [
      { title: "Làm sạch", description: "Tẩy trang, sữa rửa mặt, dầu tẩy trang, cleansing balm.", keywords: ["tẩy trang", "rửa mặt", "cleansing"] },
      { title: "Treatment", description: "Serum trị mụn, serum sáng da, retinol, BHA, AHA.", keywords: ["serum", "retinol", "bha", "aha"] },
      { title: "Dưỡng ẩm", description: "Gel cream, cream, lotion, sleeping mask.", keywords: ["dưỡng ẩm", "cream", "lotion"] },
      { title: "Budget / luxury", description: "Dưới 200k, 200-500k, luxury, đáng tiền / không đáng tiền.", keywords: ["budget", "luxury", "đáng tiền"] },
    ],
  },
  {
    slug: "bodycare",
    title: "Bodycare / Chăm sóc cơ thể",
    shortTitle: "Bodycare",
    description: "Skincare cho toàn thân: mụn lưng, da sần, body sáng da, mùi cơ thể, chống nắng body, tẩy lông.",
    audience: "Người đã quen skincare mặt và bắt đầu xử lý vấn đề body rõ ràng hơn.",
    filters: ["Vùng body", "Mồ hôi/mùi", "Da sần", "Đi biển/thể thao", "Ngân sách"],
    productTypes: ["Body lotion", "Body serum", "Tẩy da chết body", "Deodorant", "Body sunscreen"],
    featuredQueries: ["mụn lưng", "body trắng sáng", "viêm nang lông", "khử mùi cơ thể"],
    topMenu: true,
    branches: [
      { title: "Mụn body", description: "Mụn lưng, mụn ngực, mụn mông.", keywords: ["mụn lưng", "mụn body"] },
      { title: "Body sáng da", description: "Thâm đầu gối, khuỷu tay, nách, mông, bikini.", keywords: ["body sáng", "thâm", "trắng da"] },
      { title: "Da sần / viêm nang lông", description: "KP, lông mọc ngược, da gà.", keywords: ["viêm nang lông", "kp", "da sần"] },
      { title: "Mùi cơ thể", description: "Lăn khử mùi, body mist, mồ hôi, hôi nách.", keywords: ["khử mùi", "body mist", "mồ hôi"] },
    ],
  },
  {
    slug: "toc-da-dau",
    title: "Tóc & da đầu",
    shortTitle: "Tóc & da đầu",
    description: "Search intent mạnh cho cả nam và nữ: rụng tóc, gàu, da đầu dầu, tóc hư tổn, tạo kiểu và chăm râu.",
    audience: "Người bị rụng tóc, tóc nhanh bết, gàu ngứa hoặc tóc hư tổn sau tẩy nhuộm.",
    filters: ["Nam/nữ", "Da đầu dầu/khô", "Tẩy nhuộm", "Rụng tóc nhiều", "Cần đi bác sĩ"],
    productTypes: ["Dầu gội", "Serum da đầu", "Dầu xả", "Mask tóc", "Pomade", "Beard oil"],
    featuredQueries: ["rụng tóc nam", "gàu dầu", "tóc nhanh bết", "phục hồi tóc tẩy nhuộm"],
    topMenu: true,
    branches: [
      { title: "Rụng tóc / hói", description: "Rụng tóc nam, nữ, hói chữ M, tóc thưa và dấu hiệu nên đi khám.", keywords: ["rụng tóc", "hói", "tóc thưa"] },
      { title: "Gàu / viêm da đầu", description: "Gàu khô, gàu dầu, ngứa da đầu, nấm da đầu.", keywords: ["gàu", "ngứa da đầu", "viêm da đầu"] },
      { title: "Da đầu dầu", description: "Tóc nhanh bết, dầu gội kiềm dầu, lịch gội phù hợp.", keywords: ["da đầu dầu", "tóc bết", "kiềm dầu"] },
      { title: "Tóc hư tổn", description: "Tẩy nhuộm, khô xơ, chẻ ngọn, phục hồi bond.", keywords: ["tóc hư tổn", "tẩy nhuộm", "bond"] },
    ],
  },
  {
    slug: "makeup",
    title: "Makeup / Trang điểm",
    shortTitle: "Makeup",
    description: "Makeup theo tình huống và sản phẩm: base, đi học/đi làm, đi tiệc, mắt, môi, má, makeup nam và dụng cụ.",
    audience: "Gen Z, người mới makeup, người cần look nhanh theo dịp hoặc sản phẩm đáng mua.",
    filters: ["Dịp dùng", "Tone da", "Da dầu/khô", "Ngân sách", "Nam/nữ/unisex"],
    productTypes: ["Kem nền", "Cushion", "Concealer", "Mascara", "Son", "Blush", "Cọ/mút"],
    featuredQueries: ["makeup đi tiệc", "kem nền da dầu", "son tint bền màu", "makeup cho nam"],
    topMenu: true,
    branches: [
      { title: "Base makeup", description: "Kem nền, cushion, concealer, powder, primer.", keywords: ["kem nền", "cushion", "concealer"] },
      { title: "Makeup tự nhiên", description: "Đi học, đi làm, no-makeup makeup.", keywords: ["tự nhiên", "đi học", "đi làm"] },
      { title: "Makeup đi tiệc", description: "Glam, date night, wedding guest.", keywords: ["đi tiệc", "glam", "date"] },
      { title: "Makeup cho nam", description: "Che khuyết điểm, lông mày, da đều màu, grooming makeup.", keywords: ["makeup nam", "che mụn", "lông mày"] },
    ],
  },
  {
    slug: "mui-huong",
    title: "Nước hoa & mùi hương",
    shortTitle: "Mùi hương",
    description: "Trend mùi, nước hoa nam/nữ/unisex, body mist, hair mist, khử mùi và fragrance layering.",
    audience: "Người chọn mùi theo dịp, mùa, ngân sách hoặc phong cách cá nhân.",
    filters: ["Nam/nữ/unisex", "Dịp dùng", "Mùa", "Độ lưu hương", "Ngân sách"],
    productTypes: ["Perfume", "Body mist", "Hair mist", "Deodorant", "Body spray"],
    featuredQueries: ["nước hoa nam văn phòng", "skin scent", "body mist thơm lâu", "mùi đi date"],
    branches: [
      { title: "Nước hoa nam", description: "Clean, woody, fresh, sexy, văn phòng.", keywords: ["nước hoa nam", "woody", "fresh"] },
      { title: "Nước hoa nữ", description: "Floral, gourmand, fruity, powdery.", keywords: ["nước hoa nữ", "floral", "gourmand"] },
      { title: "Unisex", description: "Niche, clean scent, skin scent.", keywords: ["unisex", "niche", "skin scent"] },
      { title: "Fragrance layering", description: "Sữa tắm + lotion + mist + perfume.", keywords: ["layering", "body mist", "hair mist"] },
    ],
  },
  {
    slug: "nam-gioi",
    title: "Nam giới / Men's Grooming",
    shortTitle: "Nam giới",
    description: "Shortcut cho người dùng nam: ít bước, giải quyết nhanh da dầu mụn, tóc, râu, mùi cơ thể và chống nắng.",
    audience: "Nam giới muốn skincare/grooming đơn giản, rõ hiệu quả, không phải đọc toàn bộ taxonomy.",
    filters: ["Da dầu mụn", "Tóc/râu", "Thể thao", "Ít bước", "Ngân sách"],
    productTypes: ["Sữa rửa mặt", "Dưỡng ẩm", "Chống nắng", "Pomade", "Deodorant", "Beard care"],
    featuredQueries: ["skincare nam cơ bản", "rụng tóc nam", "da dầu mụn nam", "mùi cơ thể nam"],
    topMenu: true,
    branches: [
      { title: "Skincare nam cơ bản", description: "Rửa mặt, dưỡng ẩm, chống nắng trong routine ít bước.", keywords: ["nam", "skincare nam", "rửa mặt"] },
      { title: "Da dầu mụn nam", description: "Mụn, dầu, lỗ chân lông, sẹo mụn.", keywords: ["da dầu nam", "mụn nam"] },
      { title: "Cạo râu / râu", description: "Dao cạo, aftershave, beard oil.", keywords: ["cạo râu", "beard", "aftershave"] },
      { title: "Gym / thể thao", description: "Mồ hôi, mụn lưng, chống nắng thể thao.", keywords: ["gym", "thể thao", "mồ hôi"] },
    ],
  },
  {
    slug: "clinic-treatment",
    title: "Clinic / Treatment / Spa Radar",
    shortTitle: "Clinic & Treatment",
    description: "Khác biệt của Đẹp Radar: thủ thuật da liễu thẩm mỹ, checklist chọn clinic, cảnh báo rủi ro và câu hỏi cần hỏi bác sĩ.",
    audience: "Người cân nhắc peel, laser, trị sẹo, nám, botox/filler, triệt lông hoặc facial chuyên sâu.",
    filters: ["Vấn đề da", "Mức xâm lấn", "Downtime", "Ngân sách", "Rủi ro", "Bác sĩ/clinic"],
    productTypes: ["Peel", "Laser", "RF microneedling", "TCA cross", "Botox", "Filler", "Hydrafacial"],
    featuredQueries: ["trị sẹo rỗ", "laser nám", "botox gọn hàm", "clinic trị mụn"],
    topMenu: true,
    branches: [
      { title: "Trị mụn clinic", description: "Peel, thuốc bôi/uống, lấy nhân mụn, bác sĩ da liễu.", keywords: ["clinic trị mụn", "peel", "bác sĩ"] },
      { title: "Sẹo rỗ", description: "Laser, RF microneedling, TCA cross, subcision.", keywords: ["sẹo rỗ", "laser", "subcision"] },
      { title: "Nám / sắc tố", description: "Laser, peel, meso, thuốc bôi và rủi ro tăng sắc tố.", keywords: ["nám", "laser", "meso"] },
      { title: "Botox / filler", description: "Xóa nhăn, gọn hàm, tiêm môi, rãnh cười.", keywords: ["botox", "filler", "tiêm"] },
    ],
  },
  {
    slug: "beauty-lifestyle",
    title: "Beauty Lifestyle / Làm đẹp từ lối sống",
    shortTitle: "Beauty Lifestyle",
    description: "Ăn uống, giấc ngủ, stress, hormone, chu kỳ, sau sinh, fitness và tư duy làm đẹp an toàn.",
    audience: "Người muốn nhìn làn da trong bối cảnh sinh hoạt, không chỉ đổi sản phẩm.",
    filters: ["Tuổi", "Chu kỳ", "Mang thai/sau sinh", "Stress", "Fitness", "Claim an toàn"],
    productTypes: ["Nội dung giáo dục", "Checklist", "Routine theo tuổi", "Pregnancy-safe guide"],
    featuredQueries: ["mụn do stress", "nám sau sinh", "mỹ phẩm khi mang thai", "làm đẹp tuổi 30"],
    branches: [
      { title: "Ăn uống & làn da", description: "Đường, sữa, đồ cay, nước, protein, collagen trong ăn uống.", keywords: ["ăn uống", "đường", "sữa"] },
      { title: "Giấc ngủ & stress", description: "Mụn do stress, da xỉn, quầng thâm.", keywords: ["stress", "ngủ", "quầng thâm"] },
      { title: "Hormone & chu kỳ", description: "Mụn nội tiết, da trước kỳ kinh, sau sinh.", keywords: ["hormone", "chu kỳ", "sau sinh"] },
      { title: "Tư duy làm đẹp an toàn", description: "Tránh kem trộn, corticoid, fake review, treatment quá đà.", keywords: ["kem trộn", "corticoid", "fake review"] },
    ],
  },
  {
    slug: "nails-mi-long-may",
    title: "Nails / Lông mày / Mi",
    shortTitle: "Nails & Mi",
    description: "Mảng local search và dịch vụ: mẫu nail, chăm móng, nối/uốn mi, serum dưỡng mi, phun/điêu khắc mày.",
    audience: "Người tìm ý tưởng dịch vụ làm đẹp và checklist an toàn vệ sinh.",
    filters: ["Dịp dùng", "Phong cách", "Dịch vụ", "Rủi ro dị ứng", "Vệ sinh dụng cụ"],
    productTypes: ["Nail care", "Serum mi", "Gel mày", "Dịch vụ nối mi/phun mày"],
    featuredQueries: ["mẫu nail công sở", "nối mi có hại không", "serum dưỡng mi", "dáng lông mày"],
    branches: [
      { title: "Nails", description: "Mẫu nail, chăm móng, nail đi tiệc, nail công sở.", keywords: ["nail", "móng", "công sở"] },
      { title: "Mi", description: "Nối mi, uốn mi, serum dưỡng mi.", keywords: ["mi", "nối mi", "uốn mi"] },
      { title: "Lông mày", description: "Điêu khắc, phun mày, gel mày, dáng mày.", keywords: ["lông mày", "phun mày", "gel mày"] },
      { title: "An toàn dịch vụ", description: "Nhiễm trùng, dị ứng keo, vệ sinh dụng cụ.", keywords: ["an toàn", "dị ứng", "vệ sinh"] },
    ],
  },
  {
    slug: "beauty-tech",
    title: "Beauty Tech / Tools",
    shortTitle: "Beauty Tech",
    description: "Radar cho máy rửa mặt, LED mask, IPL tại nhà, máy sấy/tạo kiểu, AI skin analysis và gadget đáng mua.",
    audience: "Người thích công nghệ làm đẹp nhưng cần review có đáng tiền không.",
    filters: ["Giá", "Bằng chứng", "Rủi ro", "Tần suất dùng", "Bảo hành"],
    productTypes: ["Máy rửa mặt", "LED mask", "IPL", "Máy sấy", "AI skin analysis"],
    featuredQueries: ["LED mask có đáng tiền", "IPL tại nhà", "máy rửa mặt có cần không", "Dyson vs Laifen"],
    branches: [
      { title: "Máy rửa mặt", description: "Có cần không, loại nào đáng mua, ai nên tránh.", keywords: ["máy rửa mặt", "tool"] },
      { title: "LED mask", description: "Ánh sáng đỏ/xanh, trị mụn, trẻ hóa, bằng chứng.", keywords: ["led mask", "đèn led"] },
      { title: "IPL tại nhà", description: "Triệt lông tại nhà, an toàn, vùng nên tránh.", keywords: ["ipl", "triệt lông"] },
      { title: "AI skin analysis", description: "Soi da, app phân tích da, camera da.", keywords: ["ai", "soi da", "skin analysis"] },
    ],
  },
]

export const topCatalogueNavigation = catalogueSections.filter((section) => section.topMenu)

export const beautyNeedFilters = [
  { label: "Trị mụn", slug: "tri-mun", keywords: ["mụn", "acne", "bha", "azelaic", "mụn lưng"] },
  { label: "Da dầu", slug: "da-dau", keywords: ["da dầu", "kiềm dầu", "bã nhờn", "lỗ chân lông"] },
  { label: "Sáng da", slug: "sang-da", keywords: ["sáng da", "đều màu", "thâm", "vitamin c", "niacinamide"] },
  { label: "Chống nắng", slug: "chong-nang", keywords: ["chống nắng", "spf", "sunscreen"] },
  { label: "Phục hồi", slug: "phuc-hoi", keywords: ["phục hồi", "b5", "ceramide", "cấp ẩm", "ha"] },
  { label: "Tóc & da đầu", slug: "toc-da-dau", keywords: ["tóc", "gàu", "rụng tóc", "da đầu"] },
  { label: "Bodycare", slug: "bodycare", keywords: ["body", "dưỡng thể", "mụn lưng", "khử mùi"] },
  { label: "Makeup", slug: "makeup", keywords: ["makeup", "kem nền", "son", "cushion"] },
]

export const secondaryFilterGroups = {
  audience: ["Tất cả", "Nam", "Nữ", "Unisex", "Pregnancy-safe"],
  skinType: ["Mọi loại da", "Da dầu", "Da khô", "Da nhạy cảm", "Da treatment"],
  budget: ["Tất cả giá", "Dưới 200k", "200-500k", "Luxury"],
}

export function getCatalogueSection(slug: string) {
  return catalogueSections.find((section) => section.slug === slug)
}

export function textMatchesKeywords(text: string, keywords: string[]) {
  const normalized = text.toLowerCase()
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
}

export function productMatchesNeed(product: Product, needSlug: string) {
  const need = beautyNeedFilters.find((item) => item.slug === needSlug)
  if (!need) return true

  const haystack = [
    product.name,
    product.brand,
    product.category,
    product.description,
    ...product.tags,
  ].join(" ")

  return textMatchesKeywords(haystack, need.keywords)
}

export function postMatchesCatalogue(post: Post, section: CatalogueSection) {
  const keywords = section.branches.flatMap((branch) => branch.keywords)
  const haystack = [
    post.title,
    post.excerpt,
    post.category,
    post.content,
    ...post.tags,
  ].join(" ")

  return textMatchesKeywords(haystack, keywords)
}

export function productMatchesCatalogue(product: Product, section: CatalogueSection) {
  if (section.slug === "product-radar") return true

  const keywords = section.branches.flatMap((branch) => branch.keywords)
  const haystack = [
    product.name,
    product.brand,
    product.category,
    product.description,
    ...product.tags,
  ].join(" ")

  return textMatchesKeywords(haystack, keywords)
}
