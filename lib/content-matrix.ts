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

const nodesByArticleSlug = Object.values(contentMatrices)
  .flatMap((matrix) => matrix.nodes)
  .reduce<Record<string, MatrixNode>>((acc, node) => {
    acc[node.articleSlug] = node
    return acc
  }, {})

export function getContentMatrix(hubSlug: string) {
  return contentMatrices[hubSlug]
}

export function getMatrixNodeByArticleSlug(slug: string) {
  return nodesByArticleSlug[slug]
}

export function getMatrixProductGroups(keys: string[]) {
  return keys.map((key) => productGroups[key]).filter((group): group is ProductGroup => Boolean(group))
}

export function getMatrixNodesByProductId(productId: string) {
  return Object.values(contentMatrices)
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
  return Object.values(contentMatrices)
    .flatMap((matrix) => matrix.nodes)
    .filter((node) => {
      const groupKolIds = getMatrixProductGroups(node.productGroupKeys).flatMap((group) => group.recommendedKolIds)
      return [...node.kolIds, ...groupKolIds].includes(kolId)
    })
}
