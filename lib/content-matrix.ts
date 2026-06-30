import { catalogueSections, type CatalogueBranch } from "@/lib/catalogue"
import { catalogueGuides } from "@/lib/catalogue-guide"

export type ResearchStage = "start" | "problem" | "routine" | "ingredient" | "product" | "safety"

export interface MatrixSourceRef {
  label: string
  url: string
}

export interface ProductGroup {
  key: string
  title: string
  description: string
  whenToConsider: string
  whenToAvoid: string
  shopeeQuery: string
  productIds: string[]
  relatedArticleSlugs: string[]
  recommendedKolIds: string[]
  recommendedKolReasons: Record<string, string>
  comparisonProductIds: string[]
  affiliateDisclosure: string
}

export interface MatrixNode {
  key: string
  hubSlug: string
  stage: ResearchStage
  title: string
  userQuestion: string
  articleSlug: string
  nextArticleSlugs: string[]
  productGroupKeys: string[]
  productIds: string[]
  kolIds: string[]
  kolReasons: Record<string, string>
  relatedNodeKeys: string[]
  safetyLevel: "none" | "light" | "medical"
  sourceRefs: MatrixSourceRef[]
}

export interface ContentMatrix {
  hubSlug: string
  title: string
  intro: string
  stageOrder: ResearchStage[]
  nodes: MatrixNode[]
}

export const researchStageLabels: Record<ResearchStage, string> = {
  start: "Bắt đầu",
  problem: "Đọc vấn đề",
  routine: "Xây routine",
  ingredient: "Hiểu hoạt chất",
  product: "Chọn sản phẩm",
  safety: "Ranh giới an toàn",
}

const aadSkincare: MatrixSourceRef = {
  label: "AAD: A dermatologist's guide to skincare",
  url: "https://www.aad.org/news/dermatologist-guide-skincare",
}

const aadRetinoid: MatrixSourceRef = {
  label: "AAD: Retinoid or retinol?",
  url: "https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol",
}

const aadSun: MatrixSourceRef = {
  label: "AAD: How to select sunscreen",
  url: "https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-select-sunscreen",
}

const aadPregnancy: MatrixSourceRef = {
  label: "AAD: Pregnancy skin care",
  url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care",
}

const aadAcne: MatrixSourceRef = {
  label: "AAD: How to treat different types of acne",
  url: "https://www.aad.org/public/diseases/acne/diy/types-breakouts",
}

const fdaCosmetics: MatrixSourceRef = {
  label: "FDA: Using cosmetics safely",
  url: "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely",
}

const aadHairLoss: MatrixSourceRef = {
  label: "AAD: Hair loss diagnosis and treatment",
  url: "https://www.aad.org/public/diseases/hair-loss/treatment/diagnosis-treat",
}

const aadCosmeticTreatments: MatrixSourceRef = {
  label: "AAD: Cosmetic treatments",
  url: "https://www.aad.org/public/cosmetic",
}

export const productGroups: Record<string, ProductGroup> = {
  "gentle-cleanser": {
    key: "gentle-cleanser",
    title: "Sữa rửa mặt dịu nhẹ",
    description: "Bước nền để làm sạch mà không kéo da vào vòng căng rát, bong hoặc tiết dầu bù.",
    whenToConsider: "Khi da căng sau rửa, đang treatment, mụn viêm nhẹ hoặc muốn routine ít biến số.",
    whenToAvoid: "Tránh công thức làm sạch quá gắt nếu da đang đỏ rát, bong hoặc dùng acid/retinoid.",
    shopeeQuery: "sữa rửa mặt dịu nhẹ da nhạy cảm",
    productIds: ["3", "6"],
    relatedArticleSlugs: ["huong-dan-nen-skincare-cho-nguoi-moi", "da-nhay-cam-nen-xay-routine-nhu-the-nao", "da-kho-thieu-nuoc-khac-da-thieu-dau-ra-sao"],
    recommendedKolIds: ["3", "4"],
    recommendedKolReasons: {
      "3": "Có review tẩy trang/làm sạch drugstore, hợp bước nền cho người mới.",
      "4": "Mạnh về skincare và da mụn, hữu ích khi cần soi cảm giác sạch nhưng không khô căng.",
    },
    comparisonProductIds: ["3", "6"],
    affiliateDisclosure: "Khi gắn link mua, ưu tiên sản phẩm có mô tả rõ loại da, độ dịu và cách dùng.",
  },
  "barrier-serum": {
    key: "barrier-serum",
    title: "Serum phục hồi",
    description: "Nhóm hỗ trợ hàng rào da khi da rát, bong, yếu sau treatment hoặc cần giảm biến số.",
    whenToConsider: "Khi da châm chích với sản phẩm từng dùng ổn, bong quanh mũi/miệng hoặc đỏ dai dẳng.",
    whenToAvoid: "Không cần chồng nhiều serum phục hồi cùng lúc; nếu bôi gì cũng xót, giảm routine trước.",
    shopeeQuery: "serum phục hồi B5 ceramide da treatment",
    productIds: ["1"],
    relatedArticleSlugs: ["da-treatment-bi-yeu-nen-phuc-hoi-ra-sao", "ceramide-va-b5-phuc-hoi-khac-gi-nhau", "retinol-cho-nguoi-moi"],
    recommendedKolIds: ["1", "4"],
    recommendedKolReasons: {
      "1": "Có review serum B5 trong hệ thống, phù hợp khi cần đối chiếu claim phục hồi.",
      "4": "Thường giải thích treatment và ingredient theo trải nghiệm dùng dài hơn.",
    },
    comparisonProductIds: ["1"],
    affiliateDisclosure: "Affiliate chỉ nên xuất hiện sau tiêu chí phục hồi và cảnh báo giảm treatment.",
  },
  "daily-sunscreen": {
    key: "daily-sunscreen",
    title: "Kem chống nắng hằng ngày",
    description: "Nền bắt buộc cho thâm, nám, treatment và mọi mục tiêu sáng da bền.",
    whenToConsider: "Khi bạn cần sản phẩm dùng đủ lượng mỗi sáng, không bí, không cay mắt, dễ thoa lại.",
    whenToAvoid: "Không chọn chỉ vì SPF cao nếu texture khiến bạn bôi thiếu lượng hoặc bỏ dùng sau vài ngày.",
    shopeeQuery: "kem chống nắng không bí da dầu nóng ẩm",
    productIds: [],
    relatedArticleSlugs: ["kem-chong-nang-khong-bi-cho-khi-hau-nong-am", "kem-chong-nang-da-dau-khong-bi", "tham-mun-bao-lau-mo"],
    recommendedKolIds: ["1", "3"],
    recommendedKolReasons: {
      "1": "Hợp để kiểm tra góc nhìn thực dụng: finish, vón, cay mắt và dùng đủ lượng.",
      "3": "Mạnh ở routine hằng ngày và review trải nghiệm dễ áp dụng cho người mới.",
    },
    comparisonProductIds: [],
    affiliateDisclosure: "Khi có link Shopee, ghi rõ tiêu chí finish, cay mắt, vón và khả năng thoa lại.",
  },
  "acne-treatment": {
    key: "acne-treatment",
    title: "Treatment trị mụn",
    description: "Một hoạt chất chính để xử lý bít tắc hoặc mụn viêm nhẹ, không phối ồ ạt.",
    whenToConsider: "Khi routine nền đã ổn và bạn cần BHA, azelaic acid, benzoyl peroxide hoặc retinoid.",
    whenToAvoid: "Tránh bắt đầu nhiều hoạt chất trong cùng tuần, nhất là khi da đang yếu hoặc đỏ rát.",
    shopeeQuery: "BHA azelaic acid trị mụn da dầu",
    productIds: [],
    relatedArticleSlugs: ["routine-da-dau-mun-4-buoc", "bha-benzoyl-peroxide-azelaic-acid-chon-the-nao", "mun-an-khac-gi-purging"],
    recommendedKolIds: ["1", "4"],
    recommendedKolReasons: {
      "1": "Có phong cách review ưu/nhược rõ, giúp tránh mua treatment theo hype.",
      "4": "Phù hợp khi cần nghe thêm về da dầu mụn và cách tăng tần suất chậm.",
    },
    comparisonProductIds: [],
    affiliateDisclosure: "Affiliate treatment phải đi kèm nhắc patch test, tần suất thấp và phục hồi.",
  },
  "brightening-active": {
    key: "brightening-active",
    title: "Hoạt chất sáng da",
    description: "Vitamin C, niacinamide, tranexamic acid hoặc nhóm đều màu dùng sau khi chống nắng ổn.",
    whenToConsider: "Khi mụn mới đã ổn hơn, thâm/xỉn màu là mục tiêu chính và bạn theo dõi theo tháng.",
    whenToAvoid: "Tránh kỳ vọng trắng nhanh hoặc dùng hoạt chất mạnh khi đang mang thai/sau sinh mà chưa hỏi chuyên gia.",
    shopeeQuery: "serum sáng da thâm mụn niacinamide vitamin C tranexamic acid",
    productIds: [],
    relatedArticleSlugs: ["tham-mun-bao-lau-mo", "vitamin-c-dung-sang-hay-toi", "tranexamic-acid-hop-ai"],
    recommendedKolIds: ["1", "3"],
    recommendedKolReasons: {
      "1": "Hợp để soi claim trắng/sáng da có quá tay hay không.",
      "3": "Có thế mạnh review mỹ phẩm và routine đời thường, dễ đối chiếu texture.",
    },
    comparisonProductIds: [],
    affiliateDisclosure: "Affiliate nhóm làm sáng cần tránh claim trắng cấp tốc và luôn nối với chống nắng.",
  },
  "moisture-cream": {
    key: "moisture-cream",
    title: "Kem dưỡng khóa ẩm",
    description: "Giữ nước, giảm căng rít và làm routine chịu được treatment hơn.",
    whenToConsider: "Khi da thiếu nước, bong nhẹ, makeup mốc hoặc cần phục hồi hàng rào da.",
    whenToAvoid: "Tránh texture quá bí nếu đang mụn ẩn; ưu tiên test nhỏ trước khi đổi full routine.",
    shopeeQuery: "kem dưỡng phục hồi ceramide panthenol da khô nhạy cảm",
    productIds: ["1"],
    relatedArticleSlugs: ["da-kho-thieu-nuoc-khac-da-thieu-dau-ra-sao", "ceramide-va-b5-phuc-hoi-khac-gi-nhau", "da-treatment-bi-yeu-nen-phuc-hoi-ra-sao"],
    recommendedKolIds: ["2", "3"],
    recommendedKolReasons: {
      "2": "Mạnh về mô tả texture, độ thấm và cảm giác trên da theo thời gian.",
      "3": "Hợp để đối chiếu routine dưỡng ẩm hằng ngày, không chỉ claim phục hồi.",
    },
    comparisonProductIds: ["1", "6"],
    affiliateDisclosure: "Link mua nên đứng sau tiêu chí texture, độ bí và mục tiêu phục hồi.",
  },
  "body-active-lotion": {
    key: "body-active-lotion",
    title: "Body lotion / body active",
    description: "Nhóm dưỡng body, làm mềm sần, hỗ trợ đều màu và giảm khô ráp theo nhịp dùng đều.",
    whenToConsider: "Khi da body sần, khô, xỉn, thâm do ma sát hoặc cần routine body dễ duy trì.",
    whenToAvoid: "Tránh acid/retinol body khi da vừa wax/cạo, trầy xước hoặc kích ứng kéo dài.",
    shopeeQuery: "body lotion AHA urea dưỡng sáng da sần",
    productIds: ["8"],
    relatedArticleSlugs: ["routine-body-sang-da-an-toan", "viem-nang-long-nen-dung-aha-bha-hay-urea", "mun-lung-va-thoi-quen-toc-bodycare"],
    recommendedKolIds: ["1", "3"],
    recommendedKolReasons: {
      "1": "Hợp để soi claim trắng/sáng body có bị quá tay hay không.",
      "3": "Hợp để đối chiếu texture body lotion trong khí hậu nóng ẩm.",
    },
    comparisonProductIds: ["8"],
    affiliateDisclosure: "Affiliate bodycare cần tránh claim trắng cấp tốc và nối với chống nắng/giảm ma sát.",
  },
  "scalp-care": {
    key: "scalp-care",
    title: "Chăm sóc da đầu",
    description: "Dầu gội, treatment da đầu và thói quen gội/xả theo vấn đề gàu, bết, ngứa hoặc rụng.",
    whenToConsider: "Khi da đầu nhanh bết, vảy, ngứa nhẹ hoặc cần phân biệt da đầu khô với gàu dầu.",
    whenToAvoid: "Không tự xử lý lâu nếu da đầu đau, đỏ, chảy dịch, rụng tóc nhanh hoặc từng mảng.",
    shopeeQuery: "dầu gội trị gàu da đầu dầu dịu nhẹ",
    productIds: ["5"],
    relatedArticleSlugs: ["gau-dau-hay-da-dau-kho", "rung-toc-nam-khi-nao-nen-di-kham", "mun-lung-va-thoi-quen-toc-bodycare"],
    recommendedKolIds: ["2", "3"],
    recommendedKolReasons: {
      "2": "Hợp với góc chăm sóc tóc/da đầu theo trải nghiệm đời thường.",
      "3": "Hữu ích khi cần routine tóc đơn giản, không làm nặng da đầu.",
    },
    comparisonProductIds: ["5"],
    affiliateDisclosure: "Link mua scalp care nên đi sau dấu hiệu da đầu và cảnh báo khi cần đi khám.",
  },
  "hair-repair": {
    key: "hair-repair",
    title: "Phục hồi tóc hư tổn",
    description: "Mask tóc, bond repair, dầu dưỡng và heat protectant cho tóc tẩy nhuộm, khô xơ hoặc dễ gãy.",
    whenToConsider: "Khi tóc tẩy nhuộm, xơ rối, dễ đứt, chẻ ngọn hoặc dùng nhiệt thường xuyên.",
    whenToAvoid: "Không kỳ vọng sản phẩm biến tóc hư nặng thành tóc nguyên bản nếu vẫn tẩy/nhiệt liên tục.",
    shopeeQuery: "bond repair mask tóc tẩy nhuộm heat protectant",
    productIds: ["5"],
    relatedArticleSlugs: ["bond-repair-co-dang-tien-cho-toc-tay-nhuom", "giai-cuu-toc-hu-ton-sau-tay-nhuom"],
    recommendedKolIds: ["2", "3"],
    recommendedKolReasons: {
      "2": "Hợp để nghe mô tả chất tóc, độ mượt và cảm giác sau dùng.",
      "3": "Hữu ích khi cần routine tóc dễ duy trì tại nhà.",
    },
    comparisonProductIds: ["5"],
    affiliateDisclosure: "Affiliate hair repair phải ghi rõ kỳ vọng thực tế và giới hạn của tóc đã hư tổn.",
  },
  "base-makeup": {
    key: "base-makeup",
    title: "Base makeup",
    description: "Kem nền, cushion, concealer, primer và phấn phủ đọc theo loại da, finish và độ bền.",
    whenToConsider: "Khi cần nền đi học/đi làm, da dầu nóng ẩm, che điểm hoặc makeup nam nhẹ.",
    whenToAvoid: "Tránh chọn nền chỉ vì trắng hơn; sai undertone/texture dễ lộ và xuống tone.",
    shopeeQuery: "kem nền da dầu cushion concealer nóng ẩm",
    productIds: ["2"],
    relatedArticleSlugs: ["base-makeup-cho-da-dau-nong-am", "makeup-nam-nhe-khong-lo-nen", "drugstore-makeup-haul-duoi-500k"],
    recommendedKolIds: ["1", "3"],
    recommendedKolReasons: {
      "1": "Hợp để kiểm tra độ bền, xuống tone và claim che phủ.",
      "3": "Hợp với layout makeup đời thường, dễ áp dụng.",
    },
    comparisonProductIds: ["2"],
    affiliateDisclosure: "Link makeup nên đi sau tiêu chí shade, finish, độ bền và tẩy trang.",
  },
  "lip-cheek-color": {
    key: "lip-cheek-color",
    title: "Son, má và màu sắc",
    description: "Nhóm son, blush, tint và màu makeup đọc theo undertone, độ bám, texture và dịp dùng.",
    whenToConsider: "Khi cần layout nhanh, son/má dễ dùng hoặc drugstore makeup dưới ngân sách rõ.",
    whenToAvoid: "Tránh mua màu viral nếu lệch undertone, khô môi hoặc khó phối với routine thật.",
    shopeeQuery: "son tint blush drugstore màu dễ dùng",
    productIds: ["4"],
    relatedArticleSlugs: ["drugstore-makeup-haul-duoi-500k", "son-tint-ben-mau-co-lam-kho-moi-khong"],
    recommendedKolIds: ["1", "3"],
    recommendedKolReasons: {
      "1": "Hợp để soi màu son, texture và độ đáng tiền.",
      "3": "Hợp với makeup haul và cách phối layout nhanh.",
    },
    comparisonProductIds: ["4"],
    affiliateDisclosure: "Affiliate màu makeup nên ghi rõ undertone, finish, độ khô và ánh sáng test.",
  },
  "fragrance-layering": {
    key: "fragrance-layering",
    title: "Fragrance layering",
    description: "Nước hoa, body mist, hair mist và lotion thơm đọc theo dịp dùng, độ lưu hương và độ dễ chịu.",
    whenToConsider: "Khi muốn chọn mùi đi làm, đi date, mùa nóng hoặc phối bodycare với nước hoa.",
    whenToAvoid: "Tránh xịt quá nhiều trong không gian kín hoặc chọn mùi chỉ vì viral mà không test trên da.",
    shopeeQuery: "nước hoa body mist hair mist layering",
    productIds: ["7", "8"],
    relatedArticleSlugs: ["nuoc-hoa-van-phong-mua-nong", "body-mist-hair-mist-layering", "mui-di-date-khong-qua-gat"],
    recommendedKolIds: ["2", "3"],
    recommendedKolReasons: {
      "2": "Hợp để mô tả vibe mùi và bối cảnh dùng hằng ngày.",
      "3": "Hợp với cách phối mùi nhẹ, dễ áp dụng.",
    },
    comparisonProductIds: ["7", "8"],
    affiliateDisclosure: "Affiliate mùi hương nên nhắc test trên da, dịp dùng và độ tỏa trong không gian.",
  },
  "men-basic-grooming": {
    key: "men-basic-grooming",
    title: "Men grooming cơ bản",
    description: "Routine ít bước cho da, tóc, râu, mùi cơ thể và makeup nam nhẹ.",
    whenToConsider: "Khi người dùng nam muốn giải quyết nhanh da dầu mụn, tóc/râu hoặc chống nắng.",
    whenToAvoid: "Tránh routine quá nhiều bước khiến không duy trì được hoặc treatment mạnh khi chưa có nền.",
    shopeeQuery: "skincare nam sữa rửa mặt chống nắng khử mùi",
    productIds: ["2", "5", "6"],
    relatedArticleSlugs: ["skincare-nam-co-ban", "makeup-nam-nhe-khong-lo-nen", "rung-toc-nam-khi-nao-nen-di-kham"],
    recommendedKolIds: ["4", "3"],
    recommendedKolReasons: {
      "4": "Hợp với skincare/treatment và routine ít bước.",
      "3": "Hợp để đối chiếu sản phẩm dễ mua, dễ dùng hằng ngày.",
    },
    comparisonProductIds: ["2", "5", "6"],
    affiliateDisclosure: "Affiliate men grooming nên ưu tiên ít bước, dễ dùng và tránh claim trị bệnh.",
  },
  "clinic-consult": {
    key: "clinic-consult",
    title: "Clinic / treatment consult",
    description: "Checklist trước peel, laser, trị sẹo, nám, triệt lông hoặc dịch vụ thẩm mỹ.",
    whenToConsider: "Khi vấn đề vượt mỹ phẩm tại nhà: sẹo, nám dai dẳng, mụn nặng, thủ thuật có downtime.",
    whenToAvoid: "Tránh nơi chỉ bán gói mà không hỏi tiền sử, routine, thuốc, rủi ro và kỳ vọng thực tế.",
    shopeeQuery: "kem phục hồi sau laser peel chống nắng",
    productIds: ["1", "6"],
    relatedArticleSlugs: ["laser-tri-nam-can-hoi-gi-truoc-khi-lam", "peel-da-tai-nha-va-clinic-khac-gi", "khi-nao-da-can-bac-si-thay-vi-skincare"],
    recommendedKolIds: ["4", "1"],
    recommendedKolReasons: {
      "4": "Hợp khi cần đối chiếu chuyên môn skincare và ranh giới treatment.",
      "1": "Hợp để soi claim trước/sau và lời hứa hiệu quả quá nhanh.",
    },
    comparisonProductIds: ["1", "6"],
    affiliateDisclosure: "Không đẩy affiliate trước tư vấn an toàn, chống nắng và phục hồi sau thủ thuật.",
  },
  "beauty-device": {
    key: "beauty-device",
    title: "Beauty tools / tech",
    description: "Thiết bị chăm sóc da/tóc, máy rửa mặt, LED, triệt lông tại nhà và tool makeup.",
    whenToConsider: "Khi routine nền đã ổn và thiết bị giải quyết được một bước lặp lại rõ ràng.",
    whenToAvoid: "Tránh thiết bị claim y khoa quá mức, không hướng dẫn chống chỉ định hoặc không rõ bảo hành.",
    shopeeQuery: "máy rửa mặt LED mask beauty device",
    productIds: [],
    relatedArticleSlugs: ["may-rua-mat-co-can-thiet-khong", "led-mask-tai-nha-can-luu-y-gi", "beauty-device-co-dang-tien-khong"],
    recommendedKolIds: ["1", "4"],
    recommendedKolReasons: {
      "1": "Hợp để kiểm tra claim thiết bị có bị marketing quá tay.",
      "4": "Hợp để đối chiếu ranh giới an toàn và da nhạy cảm.",
    },
    comparisonProductIds: [],
    affiliateDisclosure: "Affiliate thiết bị phải ghi rõ chống chỉ định, bảo hành và kỳ vọng thực tế.",
  },
  "nail-lash-brow-care": {
    key: "nail-lash-brow-care",
    title: "Nails, lash, brow care",
    description: "Làm móng, mi, brow, keo/dung môi và chăm vùng mắt/móng an toàn.",
    whenToConsider: "Khi làm nail/lash/brow thường xuyên hoặc cần phục hồi móng/mi sau dịch vụ.",
    whenToAvoid: "Tránh tự xử lý khi mắt đỏ đau, sưng, mủ, dị ứng keo hoặc móng nhiễm trùng.",
    shopeeQuery: "dưỡng móng dưỡng mi brow gel an toàn",
    productIds: [],
    relatedArticleSlugs: ["lam-mi-bi-do-mat-khi-nao-can-di-kham", "mong-yeu-sau-gel-can-phuc-hoi-ra-sao", "brow-lamination-can-luu-y-gi"],
    recommendedKolIds: ["2", "3"],
    recommendedKolReasons: {
      "2": "Hợp với trải nghiệm dịch vụ làm đẹp đời thường.",
      "3": "Hợp với checklist sản phẩm/dịch vụ dễ áp dụng.",
    },
    comparisonProductIds: [],
    affiliateDisclosure: "Affiliate vùng mắt/móng cần đặt cảnh báo kích ứng và vệ sinh lên trước.",
  },
}

export const contentMatrices: Record<string, ContentMatrix> = {
  "da-mat": {
    hubSlug: "da-mat",
    title: "Ma trận research Da mặt / Skincare",
    intro:
      "Đi từ nền routine đến vấn đề cụ thể, rồi mới sang hoạt chất và sản phẩm. Mục tiêu là đọc đủ để mua ít hơn nhưng đúng hơn.",
    stageOrder: ["start", "problem", "routine", "ingredient", "product", "safety"],
    nodes: [
      {
        key: "skincare-beginner",
        hubSlug: "da-mat",
        stage: "start",
        title: "Người mới skincare",
        userQuestion: "Tôi chưa biết bắt đầu routine từ đâu và sợ mua quá nhiều thứ.",
        articleSlug: "huong-dan-nen-skincare-cho-nguoi-moi",
        nextArticleSlugs: ["routine-da-dau-mun-4-buoc", "da-kho-thieu-nuoc-khac-da-thieu-dau-ra-sao", "kem-chong-nang-khong-bi-cho-khi-hau-nong-am"],
        productGroupKeys: ["gentle-cleanser", "moisture-cream", "daily-sunscreen"],
        productIds: ["3", "6", "1"],
        kolIds: ["3", "2"],
        kolReasons: {
          "3": "Hợp với người mới vì review routine và sản phẩm nền dễ tiếp cận.",
          "2": "Có cách giải thích skincare gần gũi, hữu ích khi bạn chưa quen đọc texture.",
        },
        relatedNodeKeys: ["daily-sunscreen", "dry-dehydrated", "oily-acne"],
        safetyLevel: "light",
        sourceRefs: [aadSkincare, aadSun],
      },
      {
        key: "oily-acne",
        hubSlug: "da-mat",
        stage: "routine",
        title: "Da dầu mụn",
        userQuestion: "Da tôi dầu, dễ bí, có mụn ẩn hoặc mụn viêm nhẹ thì nên đi routine nào?",
        articleSlug: "routine-da-dau-mun-4-buoc",
        nextArticleSlugs: ["mun-an-khac-gi-purging", "bha-benzoyl-peroxide-azelaic-acid-chon-the-nao", "tham-mun-bao-lau-mo"],
        productGroupKeys: ["gentle-cleanser", "acne-treatment", "daily-sunscreen"],
        productIds: ["3", "6"],
        kolIds: ["1", "4"],
        kolReasons: {
          "1": "Hợp để nghe góc nhìn review thẳng về sản phẩm trị mụn dễ bị hype.",
          "4": "Có chuyên môn skincare/treatment, phù hợp với routine da dầu mụn.",
        },
        relatedNodeKeys: ["post-acne-marks", "retinol-acid", "treatment-repair"],
        safetyLevel: "medical",
        sourceRefs: [aadAcne, aadSkincare],
      },
      {
        key: "treatment-repair",
        hubSlug: "da-mat",
        stage: "problem",
        title: "Da yếu sau treatment",
        userQuestion: "Da đang bong, rát, châm chích sau acid/retinoid thì nên dừng gì và phục hồi ra sao?",
        articleSlug: "da-treatment-bi-yeu-nen-phuc-hoi-ra-sao",
        nextArticleSlugs: ["ceramide-va-b5-phuc-hoi-khac-gi-nhau", "treatment-qua-da-nhan-biet-ra-sao", "khi-nao-da-can-bac-si-thay-vi-skincare"],
        productGroupKeys: ["barrier-serum", "moisture-cream", "daily-sunscreen"],
        productIds: ["1", "6"],
        kolIds: ["1", "4"],
        kolReasons: {
          "1": "Có review serum B5, hợp để đối chiếu tiêu chí phục hồi thực tế.",
          "4": "Hợp khi cần nghe thêm về treatment quá đà và cách giảm biến số.",
        },
        relatedNodeKeys: ["retinol-acid", "sensitive-skin", "dry-dehydrated"],
        safetyLevel: "medical",
        sourceRefs: [aadSkincare],
      },
      {
        key: "daily-sunscreen",
        hubSlug: "da-mat",
        stage: "product",
        title: "Chống nắng hằng ngày",
        userQuestion: "Kem chống nắng nào dùng đủ lượng mỗi ngày mà không bí ở khí hậu nóng ẩm?",
        articleSlug: "kem-chong-nang-khong-bi-cho-khi-hau-nong-am",
        nextArticleSlugs: ["kem-chong-nang-da-dau-khong-bi", "kem-chong-nang-duoi-300k-cho-da-dau", "chong-nang-body-khi-di-bien"],
        productGroupKeys: ["daily-sunscreen", "gentle-cleanser"],
        productIds: [],
        kolIds: ["1", "3"],
        kolReasons: {
          "1": "Hợp để kiểm tra tiêu chí dùng đủ lượng: bí, vón, cay mắt, thoa lại.",
          "3": "Hợp với routine hằng ngày và trải nghiệm sản phẩm nền dễ theo dõi.",
        },
        relatedNodeKeys: ["post-acne-marks", "pigmentation-postpartum", "skincare-beginner"],
        safetyLevel: "light",
        sourceRefs: [aadSun],
      },
      {
        key: "post-acne-marks",
        hubSlug: "da-mat",
        stage: "problem",
        title: "Thâm mụn, da xỉn màu",
        userQuestion: "Thâm mụn bao lâu mờ và nên dùng hoạt chất sáng da lúc nào?",
        articleSlug: "tham-mun-bao-lau-mo",
        nextArticleSlugs: ["vitamin-c-dung-sang-hay-toi", "tranexamic-acid-hop-ai", "dau-hieu-san-pham-lam-trang-khong-an-toan"],
        productGroupKeys: ["daily-sunscreen", "brightening-active", "barrier-serum"],
        productIds: ["1"],
        kolIds: ["1", "3"],
        kolReasons: {
          "1": "Hợp để đối chiếu claim sáng da/thâm mụn có bị nói quá không.",
          "3": "Hợp với góc routine thực tế: texture, khả năng dùng đều, ít kích ứng.",
        },
        relatedNodeKeys: ["daily-sunscreen", "oily-acne", "pigmentation-postpartum"],
        safetyLevel: "light",
        sourceRefs: [aadSun, aadSkincare],
      },
      {
        key: "dry-dehydrated",
        hubSlug: "da-mat",
        stage: "problem",
        title: "Da khô căng, thiếu ẩm",
        userQuestion: "Da tôi căng sau rửa mặt, bong nhẹ hoặc makeup mốc là thiếu nước hay thiếu dầu?",
        articleSlug: "da-kho-thieu-nuoc-khac-da-thieu-dau-ra-sao",
        nextArticleSlugs: ["ceramide-va-b5-phuc-hoi-khac-gi-nhau", "da-treatment-bi-yeu-nen-phuc-hoi-ra-sao"],
        productGroupKeys: ["gentle-cleanser", "barrier-serum", "moisture-cream"],
        productIds: ["1", "6"],
        kolIds: ["2", "3"],
        kolReasons: {
          "2": "Hợp để nghe kỹ về texture, độ thấm và cảm giác căng rít sau dùng.",
          "3": "Hợp với routine dễ duy trì cho da khô/thiếu nước.",
        },
        relatedNodeKeys: ["treatment-repair", "sensitive-skin", "skincare-beginner"],
        safetyLevel: "light",
        sourceRefs: [aadSkincare],
      },
      {
        key: "sensitive-skin",
        hubSlug: "da-mat",
        stage: "routine",
        title: "Da nhạy cảm",
        userQuestion: "Da dễ đỏ rát, kích ứng hoặc đổi sản phẩm là nổi mẩn thì xây routine thế nào?",
        articleSlug: "da-nhay-cam-nen-xay-routine-nhu-the-nao",
        nextArticleSlugs: ["dau-hieu-kich-ung-huong-lieu", "da-treatment-bi-yeu-nen-phuc-hoi-ra-sao", "khi-nao-da-can-bac-si-thay-vi-skincare"],
        productGroupKeys: ["gentle-cleanser", "barrier-serum", "moisture-cream"],
        productIds: ["3", "6", "1"],
        kolIds: ["2", "4"],
        kolReasons: {
          "2": "Hợp với nội dung skincare mềm, dễ hiểu khi cần routine ít biến số.",
          "4": "Hợp để đối chiếu treatment/ingredient trước khi thêm hoạt chất.",
        },
        relatedNodeKeys: ["treatment-repair", "dry-dehydrated", "retinol-acid"],
        safetyLevel: "medical",
        sourceRefs: [aadSkincare],
      },
      {
        key: "retinol-acid",
        hubSlug: "da-mat",
        stage: "ingredient",
        title: "Retinol hoặc acid cho người mới",
        userQuestion: "Tôi muốn thêm retinol/AHA/BHA nhưng sợ purging, bong rát hoặc hỏng barrier.",
        articleSlug: "retinol-cho-nguoi-moi",
        nextArticleSlugs: ["tay-da-chet-aha-bha-pha-cho-nguoi-moi", "retinoid-retinal-retinol-khac-nhau-the-nao", "hoat-chat-nao-khong-nen-phoi-cung-toi"],
        productGroupKeys: ["acne-treatment", "barrier-serum", "daily-sunscreen"],
        productIds: ["1", "6"],
        kolIds: ["1", "4"],
        kolReasons: {
          "1": "Hợp để soi lời hứa treatment và cảnh báo khi sản phẩm bị hype.",
          "4": "Hợp để nghe thêm về cách tăng tần suất acid/retinoid an toàn.",
        },
        relatedNodeKeys: ["treatment-repair", "sensitive-skin", "oily-acne"],
        safetyLevel: "medical",
        sourceRefs: [aadRetinoid, aadSun],
      },
      {
        key: "pigmentation-postpartum",
        hubSlug: "da-mat",
        stage: "safety",
        title: "Nám, sắc tố hoặc sau sinh",
        userQuestion: "Nám, tàn nhang hoặc thâm sau sinh nên chăm tại nhà hay hỏi clinic/bác sĩ?",
        articleSlug: "nam-sau-sinh-cham-tai-nha-hay-di-clinic",
        nextArticleSlugs: ["pregnancy-safe-beauty", "pregnancy-safe-ingredient-checklist", "laser-tri-nam-can-hoi-gi-truoc-khi-lam"],
        productGroupKeys: ["daily-sunscreen", "brightening-active", "moisture-cream"],
        productIds: ["1"],
        kolIds: ["1", "3"],
        kolReasons: {
          "1": "Hợp để soi claim làm trắng/sáng da, đặc biệt khi cần tránh lời hứa quá mức.",
          "3": "Hợp để đối chiếu routine chăm da đời thường trước khi nghĩ tới clinic.",
        },
        relatedNodeKeys: ["daily-sunscreen", "post-acne-marks"],
        safetyLevel: "medical",
        sourceRefs: [aadPregnancy, aadSun],
      },
    ],
  },
}

export function getContentMatrix(hubSlug: string) {
  return contentMatrices[hubSlug] ?? buildGeneratedContentMatrix(hubSlug)
}

export function getMatrixNodeByArticleSlug(slug: string) {
  return getAllContentMatrices()
    .flatMap((matrix) => matrix.nodes)
    .find((node) => node.articleSlug === slug)
}

export function getMatrixProductGroups(keys: string[]) {
  return keys.map((key) => productGroups[key]).filter((group): group is ProductGroup => Boolean(group))
}

export function getMatrixNodesByProductId(productId: string) {
  return getAllContentMatrices()
    .flatMap((matrix) => matrix.nodes)
    .filter((node) => {
      const groupProductIds = getMatrixProductGroups(node.productGroupKeys).flatMap((group) => [
        ...group.productIds,
        ...group.comparisonProductIds,
      ])
      return [...node.productIds, ...groupProductIds].includes(productId)
    })
}

export function getMatrixNodesByKolId(kolId: string) {
  return getAllContentMatrices()
    .flatMap((matrix) => matrix.nodes)
    .filter((node) => {
      const groupKolIds = getMatrixProductGroups(node.productGroupKeys).flatMap((group) => group.recommendedKolIds)
      return [...node.kolIds, ...groupKolIds].includes(kolId)
    })
}

function getAllContentMatrices() {
  return catalogueSections
    .map((section) => getContentMatrix(section.slug))
    .filter((matrix): matrix is ContentMatrix => Boolean(matrix))
}

const generatedMatrixCache = new Map<string, ContentMatrix | null>()

type HubGraphProfile = {
  productGroupKeys: string[]
  kolIds: string[]
  sourceRefs: MatrixSourceRef[]
  safetyLevel: MatrixNode["safetyLevel"]
}

const hubGraphProfiles: Record<string, HubGraphProfile> = {
  "tri-mun": {
    productGroupKeys: ["gentle-cleanser", "acne-treatment", "barrier-serum", "daily-sunscreen"],
    kolIds: ["1", "4"],
    sourceRefs: [aadAcne, aadSkincare],
    safetyLevel: "medical",
  },
  "sang-da-chong-nang": {
    productGroupKeys: ["daily-sunscreen", "brightening-active", "barrier-serum"],
    kolIds: ["1", "3"],
    sourceRefs: [aadSun, aadPregnancy],
    safetyLevel: "light",
  },
  "ingredient-radar": {
    productGroupKeys: ["acne-treatment", "brightening-active", "barrier-serum", "daily-sunscreen"],
    kolIds: ["4", "1"],
    sourceRefs: [aadRetinoid, aadAcne, aadPregnancy],
    safetyLevel: "medical",
  },
  "product-radar": {
    productGroupKeys: ["gentle-cleanser", "barrier-serum", "daily-sunscreen", "base-makeup"],
    kolIds: ["1", "3"],
    sourceRefs: [fdaCosmetics],
    safetyLevel: "light",
  },
  bodycare: {
    productGroupKeys: ["body-active-lotion", "fragrance-layering"],
    kolIds: ["1", "3"],
    sourceRefs: [fdaCosmetics],
    safetyLevel: "light",
  },
  "toc-da-dau": {
    productGroupKeys: ["scalp-care", "hair-repair"],
    kolIds: ["2", "3"],
    sourceRefs: [aadHairLoss, fdaCosmetics],
    safetyLevel: "medical",
  },
  makeup: {
    productGroupKeys: ["base-makeup", "lip-cheek-color", "gentle-cleanser"],
    kolIds: ["1", "3"],
    sourceRefs: [fdaCosmetics],
    safetyLevel: "light",
  },
  "mui-huong": {
    productGroupKeys: ["fragrance-layering", "body-active-lotion"],
    kolIds: ["2", "3"],
    sourceRefs: [fdaCosmetics],
    safetyLevel: "light",
  },
  "nam-gioi": {
    productGroupKeys: ["men-basic-grooming", "scalp-care", "base-makeup"],
    kolIds: ["4", "3"],
    sourceRefs: [aadSkincare, aadHairLoss],
    safetyLevel: "light",
  },
  "clinic-treatment": {
    productGroupKeys: ["clinic-consult", "barrier-serum", "daily-sunscreen"],
    kolIds: ["4", "1"],
    sourceRefs: [aadCosmeticTreatments, aadSkincare],
    safetyLevel: "medical",
  },
  "beauty-lifestyle": {
    productGroupKeys: ["daily-sunscreen", "body-active-lotion", "fragrance-layering"],
    kolIds: ["2", "3"],
    sourceRefs: [aadPregnancy, fdaCosmetics],
    safetyLevel: "light",
  },
  "nails-mi-long-may": {
    productGroupKeys: ["nail-lash-brow-care"],
    kolIds: ["2", "3"],
    sourceRefs: [fdaCosmetics],
    safetyLevel: "medical",
  },
  "beauty-tech": {
    productGroupKeys: ["beauty-device", "clinic-consult"],
    kolIds: ["1", "4"],
    sourceRefs: [fdaCosmetics, aadCosmeticTreatments],
    safetyLevel: "medical",
  },
}

function buildGeneratedContentMatrix(hubSlug: string): ContentMatrix | null {
  if (generatedMatrixCache.has(hubSlug)) return generatedMatrixCache.get(hubSlug) ?? null
  const section = catalogueSections.find((item) => item.slug === hubSlug)
  if (!section) {
    generatedMatrixCache.set(hubSlug, null)
    return null
  }

  const guide = catalogueGuides[hubSlug]
  const profile = hubGraphProfiles[hubSlug] ?? {
    productGroupKeys: ["gentle-cleanser", "barrier-serum"],
    kolIds: ["1", "3"],
    sourceRefs: [fdaCosmetics],
    safetyLevel: "light" as const,
  }
  const titleSeeds = uniqueTitleSeeds([
    ...section.branches.map((branch) => ({
      title: branch.articleTitle ?? branch.title,
      branch,
    })),
    ...(guide?.nextReads ?? []).map((title) => ({ title })),
  ])
  const titles = titleSeeds.map((seed) => seed.title)

  const nodes = titleSeeds.map((seed, index): MatrixNode => {
    const titleSlug = slugify(seed.title)
    const nextArticleSlugs = titles
      .filter((title) => title !== seed.title)
      .slice(index + 1)
      .concat(titles.filter((title) => title !== seed.title).slice(0, index))
      .slice(0, 3)
      .map(slugify)
    const stage = stageForGeneratedNode(seed.title, seed.branch, index)
    const relatedNodeKeys = nextArticleSlugs.map((slug) => `${hubSlug}-${slug}`).slice(0, 2)

    return {
      key: `${hubSlug}-${titleSlug}`,
      hubSlug,
      stage,
      title: seed.branch?.title ?? seed.title,
      userQuestion: seed.branch?.description ?? `Tôi nên hiểu "${seed.title}" trong ${section.shortTitle} như thế nào để đọc tiếp và chọn sản phẩm đúng hơn?`,
      articleSlug: titleSlug,
      nextArticleSlugs,
      productGroupKeys: profile.productGroupKeys,
      productIds: productIdsForHub(hubSlug),
      kolIds: profile.kolIds,
      kolReasons: Object.fromEntries(profile.kolIds.map((id) => [id, kolReasonForHub(section.shortTitle)])),
      relatedNodeKeys,
      safetyLevel: stage === "safety" ? "medical" : profile.safetyLevel,
      sourceRefs: profile.sourceRefs,
    }
  })

  const matrix: ContentMatrix = {
    hubSlug,
    title: `Ma trận research ${section.title}`,
    intro: guide?.snapshot ?? section.description,
    stageOrder: ["start", "problem", "routine", "ingredient", "product", "safety"],
    nodes,
  }
  generatedMatrixCache.set(hubSlug, matrix)
  return matrix
}

function uniqueTitleSeeds(seeds: { title: string; branch?: CatalogueBranch }[]) {
  const seen = new Set<string>()
  return seeds.filter((seed) => {
    const key = slugify(seed.title)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function stageForGeneratedNode(title: string, branch: CatalogueBranch | undefined, index: number): ResearchStage {
  const text = `${title} ${branch?.description ?? ""} ${branch?.keywords.join(" ") ?? ""}`.toLowerCase()
  if (/bác sĩ|clinic|laser|peel|an toàn|dị ứng|đỏ mắt|đi khám|rủi ro|pregnancy|sau sinh|nhiễm trùng/.test(text)) return "safety"
  if (/ingredient|retinol|bha|aha|vitamin|niacinamide|ceramide|urea|hoạt chất|thành phần/.test(text)) return "ingredient"
  if (/routine|layout|flow|cơ bản|bước|layer/.test(text)) return "routine"
  if (/sản phẩm|kem|serum|dầu gội|son|nước hoa|device|máy|mua|dưới/.test(text)) return "product"
  if (index === 0) return "start"
  return "problem"
}

function productIdsForHub(hubSlug: string) {
  const ids: Record<string, string[]> = {
    "product-radar": ["1", "2", "3", "4", "5", "6", "7", "8"],
    bodycare: ["8"],
    "toc-da-dau": ["5"],
    makeup: ["2", "4"],
    "mui-huong": ["7", "8"],
    "nam-gioi": ["2", "5", "6"],
    "clinic-treatment": ["1", "6"],
    "beauty-lifestyle": ["1", "7", "8"],
  }
  return ids[hubSlug] ?? []
}

function kolReasonForHub(shortTitle: string) {
  return `Đối chiếu thêm trải nghiệm review trong mảng ${shortTitle}, đặc biệt bối cảnh loại da/tóc, disclosure và sản phẩm được nhắc.`
}
