import { catalogueSections } from "@/lib/catalogue"
import { catalogueGuides } from "@/lib/catalogue-guide"
import { CATALOGUE_READ_POSTS } from "@/lib/catalogue-read-posts"
import { getMatrixNodeByArticleSlug, type ResearchStage } from "@/lib/content-matrix"
import { EDITORIAL_HUB_FOUNDATIONS, EDITORIAL_TOPIC_GUIDANCE } from "@/lib/editorial-topic-guidance"
import type { Post } from "@/lib/types"

export type ArticleStatus = "planned" | "draft" | "published"
export type ArticleIntent = "pillar" | "problem-solving" | "decision" | "safety"
export type MedicalDisclaimerLevel = "none" | "light" | "medical"

export interface ArticleImageSpec {
  status: "category-fallback" | "queued" | "generated"
  prompt: string
  assetPath: string
  usage: "hero" | "inline" | "social"
  needsGeneration: boolean
}

export interface ArticleContent {
  sections: { title: string; body: string[] }[]
  takeaways: string[]
  faq: { question: string; answer: string }[]
  sourceNotes: { label: string; url: string }[]
  medicalDisclaimerLevel: MedicalDisclaimerLevel
}

export interface ArticleBrief {
  title: string
  slug: string
  hubSlug: string
  intent: ArticleIntent
  audience: string
  priority: 1 | 2 | 3
  status: ArticleStatus
  summary: string
  targetKeywords: string[]
  relatedProducts: string[]
  researchStage?: ResearchStage
  userQuestion?: string
  nextArticleSlugs?: string[]
  productGroupKeys?: string[]
  matrixProductIds?: string[]
  kolIds?: string[]
  kolReasons?: Record<string, string>
  relatedNodeKeys?: string[]
  imagePolicy: "category" | "generate" | "custom"
  image: ArticleImageSpec
  content?: ArticleContent
}

const HUB_CATEGORY_IMAGE: Record<string, string> = {
  "da-mat": "/images/catalogue/skincare-foundation.jpg",
  "tri-mun": "/images/catalogue/acne-sun-education.jpg",
  "sang-da-chong-nang": "/images/catalogue/acne-sun-education.jpg",
  "ingredient-radar": "/images/catalogue/skincare-foundation.jpg",
  "product-radar": "/brand/social-share.jpg",
  bodycare: "/images/catalogue/hair-body-grooming.jpg",
  "toc-da-dau": "/images/catalogue/hair-body-grooming.jpg",
  makeup: "/images/catalogue/makeup-fragrance-tech.jpg",
  "mui-huong": "/images/products/miss-dior-eau-de-parfum.jpg",
  "nam-gioi": "/images/catalogue/hair-body-grooming.jpg",
  "clinic-treatment": "/images/catalogue/acne-sun-education.jpg",
  "beauty-lifestyle": "/images/catalogue/skincare-foundation.jpg",
  "nails-mi-long-may": "/images/catalogue/makeup-fragrance-tech.jpg",
  "beauty-tech": "/images/catalogue/makeup-fragrance-tech.jpg",
}

const HUB_SOURCE_NOTES: Record<string, { label: string; url: string }[]> = {
  "da-mat": [
    { label: "AAD: A dermatologist's guide to skincare", url: "https://www.aad.org/news/dermatologist-guide-skincare" },
    { label: "AAD: Retinoid or retinol?", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol" },
  ],
  "tri-mun": [
    { label: "AAD: Acne clinical guideline highlights", url: "https://www.aad.org/member/clinical-quality/guidelines/acne" },
    { label: "AAD: How to treat different types of acne", url: "https://www.aad.org/public/diseases/acne/diy/types-breakouts" },
  ],
  "sang-da-chong-nang": [
    { label: "AAD: How to select sunscreen", url: "https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-select-sunscreen" },
    { label: "FDA: Sunscreen and skin protection", url: "https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun" },
  ],
  "ingredient-radar": [
    { label: "AAD: Pregnancy skin care", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care" },
    { label: "AAD: Acne guideline highlights", url: "https://www.aad.org/member/clinical-quality/guidelines/acne" },
  ],
  "product-radar": [
    { label: "FTC: Disclosures for social media influencers", url: "https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers" },
    { label: "FDA: Cosmetic ingredient names and labeling", url: "https://www.fda.gov/cosmetics/cosmetics-labeling/cosmetic-ingredient-names" },
  ],
  bodycare: [
    { label: "AAD: Folliculitis overview", url: "https://www.aad.org/public/diseases/a-z/folliculitis" },
    { label: "AAD: Choosing the right sunscreen", url: "https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/choosing-right-sunscreen" },
  ],
  "clinic-treatment": [
    { label: "AAD: Cosmetic treatments", url: "https://www.aad.org/public/cosmetic" },
    { label: "AAD: Acne scars treatment", url: "https://www.aad.org/public/diseases/acne/derm-treat/scars/treatment" },
  ],
  "toc-da-dau": [
    { label: "AAD: Hair loss diagnosis and treatment", url: "https://www.aad.org/public/diseases/hair-loss/treatment/diagnosis-treat" },
  ],
  makeup: [
    { label: "FDA: Eye cosmetic safety", url: "https://www.fda.gov/cosmetics/cosmetic-products/eye-cosmetic-safety" },
  ],
  "mui-huong": [
    { label: "FDA: Allergens in cosmetics", url: "https://www.fda.gov/cosmetics/cosmetic-ingredients/allergens-cosmetics" },
    { label: "FDA: Using cosmetics safely", url: "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely" },
  ],
  "nam-gioi": [
    { label: "AAD: Healthy-looking skin basics", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/healthier-looking-skin" },
    { label: "AAD: Folliculitis overview", url: "https://www.aad.org/public/diseases/a-z/folliculitis" },
  ],
  "nails-mi-long-may": [
    { label: "AAD: Manicure and pedicure safety", url: "https://www.aad.org/public/everyday-care/nail-care-secrets/basics/pedicures/manicure-pedicure-safety" },
    { label: "FDA: Eye cosmetic safety", url: "https://www.fda.gov/cosmetics/cosmetic-products/eye-cosmetic-safety" },
  ],
  "beauty-tech": [
    { label: "FDA: Risks from certain RF microneedling uses", url: "https://www.fda.gov/medical-devices/safety-communications/potential-risks-certain-uses-radiofrequency-rf-microneedling-fda-safety-communication" },
    { label: "FDA: Radiation-emitting products", url: "https://www.fda.gov/consumers/consumer-updates/radiation-emitting-products" },
  ],
  "beauty-lifestyle": [
    { label: "AAD: Pregnancy skin care", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care" },
    { label: "AAD: Supplements for skin", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/supplements-for-your-skin" },
  ],
}

const MEDICAL_HUBS = new Set([
  "da-mat",
  "tri-mun",
  "sang-da-chong-nang",
  "ingredient-radar",
  "clinic-treatment",
  "beauty-lifestyle",
  "toc-da-dau",
  "nails-mi-long-may",
  "beauty-tech",
])

const NEXT_READ_HUB_BY_TITLE = Object.entries(catalogueGuides).reduce<Record<string, string>>((acc, [hubSlug, guide]) => {
  guide.nextReads.forEach((title) => {
    acc[title] = hubSlug
  })
  return acc
}, {})

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

function imagePrompt(title: string, hubTitle: string) {
  return `Editorial beauty education hero for "${title}" in the ${hubTitle} hub. Premium Vietnamese beauty-tech visual, scientific but approachable, no text, no watermark.`
}

function imageSpec(title: string, hubSlug: string, policy: ArticleBrief["imagePolicy"]): ArticleImageSpec {
  const section = catalogueSections.find((item) => item.slug === hubSlug)
  const fallback = HUB_CATEGORY_IMAGE[hubSlug] ?? "/brand/social-share.jpg"
  const slug = slugify(title)
  const needsGeneration = policy === "generate"

  return {
    status: needsGeneration ? "generated" : "category-fallback",
    prompt: imagePrompt(title, section?.title ?? hubSlug),
    assetPath: needsGeneration ? `/images/editorial/${slug}.jpg` : fallback,
    usage: "hero",
    needsGeneration: false,
  }
}

function sourceNotesForHub(hubSlug: string) {
  return HUB_SOURCE_NOTES[hubSlug] ?? [
    { label: "FDA: Using cosmetics safely", url: "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely" },
  ]
}

function publishedContent(post: Post, hubSlug: string): ArticleContent {
  return {
    sections: [],
    takeaways: post.takeaways ?? [
      "Bắt đầu từ vấn đề chính và mức chịu đựng của da/cơ thể.",
      "Giữ routine đủ đơn giản để theo dõi phản ứng thật.",
      "Dừng tự xử lý khi có dấu hiệu đau, viêm nặng, sẹo hoặc biến chứng.",
    ],
    faq: post.faq ?? [
      {
        question: "Bài này có thay thế tư vấn bác sĩ không?",
        answer: "Không. Nội dung dùng để định hướng chăm sóc và câu hỏi cần hỏi chuyên gia, không thay thế chẩn đoán hoặc điều trị cá nhân.",
      },
    ],
    sourceNotes: post.sourceNotes ?? sourceNotesForHub(hubSlug),
    medicalDisclaimerLevel: MEDICAL_HUBS.has(hubSlug) ? "medical" : "light",
  }
}

function markdownFromSections(sections: ArticleContent["sections"]) {
  return sections
    .flatMap((section) => [
      `## ${section.title}`,
      ...section.body,
    ])
    .join("\n\n")
}

function categoryForHub(hubSlug: string) {
  return catalogueSections.find((section) => section.slug === hubSlug)?.title ?? "360dep.vn Beauty Desk"
}

function researchStageForIntent(intent: ArticleIntent): ResearchStage {
  if (intent === "pillar") return "start"
  if (intent === "decision") return "product"
  if (intent === "safety") return "safety"
  return "problem"
}

function contentFormatForIntent(intent: ArticleIntent): Post["contentFormat"] {
  if (intent === "pillar") return "guide"
  if (intent === "decision") return "comparison"
  if (intent === "safety") return "checklist"
  return "explainer"
}

function buildGeneratedContent(seed: EditorialSeed, hubSlug: string): ArticleContent {
  const hubTitle = categoryForHub(hubSlug)
  const slug = slugify(seed.title)
  const guidance = EDITORIAL_TOPIC_GUIDANCE[slug]
  const foundation = EDITORIAL_HUB_FOUNDATIONS[hubSlug]
  const isSafety = seed.intent === "safety"
  const isDecision = seed.intent === "decision"
  const isPillar = seed.intent === "pillar"
  const medicalLevel: MedicalDisclaimerLevel = MEDICAL_HUBS.has(hubSlug) || isSafety ? "medical" : "light"

  if (!guidance || !foundation) {
    throw new Error(`Missing topic-specific editorial guidance for ${hubSlug}/${slug}`)
  }

  const sections: ArticleContent["sections"] = [
    {
      title: isPillar ? `Nền tảng cần nắm trong ${hubTitle}` : `Đọc đúng vấn đề: ${seed.title}`,
      body: [
        `${seed.summary} ${foundation}`,
        guidance.explain,
      ],
    },
    {
      title: isDecision ? "Khung quyết định trước khi mua hoặc làm" : "Cách kiểm tra trên chính bối cảnh của bạn",
      body: [
        "- [ ] Ghi vấn đề chính, vùng xuất hiện và mốc bắt đầu.\n- [ ] Liệt kê sản phẩm, thuốc, thủ thuật hoặc thay đổi lối sống gần đây.\n- [ ] Chọn một thay đổi có mục tiêu và mốc đánh giá rõ.\n- [ ] Lưu ảnh trong cùng ánh sáng thay vì dựa vào cảm giác một ngày.",
        guidance.plan,
      ],
    },
    {
      title: "Cách triển khai mà vẫn đọc được phản ứng",
      body: [
        isPillar
          ? "Đi từ bước ít rủi ro và dễ duy trì đến treatment có mục tiêu. Mỗi bước mới phải trả lời được nó giải quyết vấn đề nào và tiêu chí nào cho biết nên giữ, giảm hay dừng."
          : "Giữ các bước nền ổn định, thêm đúng một thay đổi và theo dõi đủ lâu nếu không có phản ứng bất thường. Như vậy mới phân biệt được hiệu quả thật với dao động tự nhiên hoặc hiệu ứng tức thời.",
        isDecision
          ? "Trước khi trả tiền, kiểm tra ba câu: lựa chọn này có đúng mục tiêu không, dữ liệu nào áp dụng cho đúng sản phẩm/dịch vụ này, và nếu không hợp thì chi phí dừng hoặc phục hồi là gì."
          : "Đánh giá bằng xu hướng: mức khó chịu, số tổn thương mới, độ dễ duy trì và ảnh chuẩn. Không dùng một ảnh before/after khác ánh sáng làm tiêu chí duy nhất.",
      ],
    },
    {
      title: isSafety ? "Ranh giới cần dừng hoặc đi khám" : "Sai lầm thường gặp và ranh giới an toàn",
      body: [
        guidance.boundary,
        "Nếu đang mang thai, cho con bú, có bệnh nền, đang dùng thuốc, từng dị ứng nặng hoặc chuẩn bị làm thủ thuật, hãy kiểm tra hướng dẫn với bác sĩ/dược sĩ thay vì suy rộng từ trải nghiệm của người khác.",
      ],
    },
  ]

  return {
    sections,
    takeaways: [guidance.explain, guidance.plan, guidance.boundary],
    faq: [
      {
        question: `Điểm quan trọng nhất khi đọc “${seed.title}” là gì?`,
        answer: guidance.explain,
      },
      {
        question: "Nên bắt đầu từ đâu?",
        answer: guidance.plan,
      },
      {
        question: "Khi nào không nên tiếp tục tự thử?",
        answer: guidance.boundary,
      },
    ],
    sourceNotes: guidance.sources ?? sourceNotesForHub(hubSlug),
    medicalDisclaimerLevel: medicalLevel,
  }
}

function generatedPostFromBrief(article: ArticleBrief): Post {
  const content = article.content ?? buildGeneratedContent(
    {
      title: article.title,
      intent: article.intent,
      priority: article.priority,
      summary: article.summary,
      keywords: article.targetKeywords,
      imagePolicy: article.imagePolicy,
      status: article.status,
    },
    article.hubSlug
  )
  const matrixNode = getMatrixNodeByArticleSlug(article.slug)

  return {
    id: article.slug,
    title: article.title,
    slug: article.slug,
    excerpt: article.summary,
    content: markdownFromSections(content.sections),
    author_name: "360dep.vn Beauty Desk",
    author_avatar: "/brand/icon-192.png",
    category: categoryForHub(article.hubSlug),
    tags: article.targetKeywords,
    image: article.image.assetPath,
    likes: 0,
    comments: 0,
    created_at: "2026-07-21T08:00:00Z",
    product_ids: article.relatedProducts,
    hubSlug: article.hubSlug,
    intent: article.intent,
    contentFormat: contentFormatForIntent(article.intent),
    conditionSlugs: article.targetKeywords.map(slugify),
    status: "published",
    takeaways: content.takeaways,
    faq: content.faq,
    sourceNotes: matrixNode?.sourceRefs ?? content.sourceNotes,
    medicalDisclaimerLevel: matrixNode?.safetyLevel ?? content.medicalDisclaimerLevel,
    researchStage: matrixNode?.stage ?? article.researchStage ?? researchStageForIntent(article.intent),
    userQuestion: matrixNode?.userQuestion ?? article.userQuestion ?? article.title,
    nextArticleSlugs: matrixNode?.nextArticleSlugs ?? article.nextArticleSlugs ?? [],
    productGroupKeys: matrixNode?.productGroupKeys ?? article.productGroupKeys,
    matrixProductIds: matrixNode?.productIds ?? article.matrixProductIds,
    kolIds: matrixNode?.kolIds ?? article.kolIds,
    kolReasons: matrixNode?.kolReasons ?? article.kolReasons,
    relatedNodeKeys: matrixNode?.relatedNodeKeys ?? article.relatedNodeKeys,
  }
}

function publishedBriefFromPost(post: Post): ArticleBrief {
  const hubSlug = NEXT_READ_HUB_BY_TITLE[post.title] ?? "product-radar"
  const policy: ArticleBrief["imagePolicy"] = ["clinic-treatment", "beauty-tech", "ingredient-radar"].includes(hubSlug) ? "generate" : "category"
  const matrixNode = getMatrixNodeByArticleSlug(post.slug)
  const content = publishedContent(post, hubSlug)

  return {
    title: post.title,
    slug: post.slug,
    hubSlug,
    intent: "problem-solving",
    audience: catalogueSections.find((section) => section.slug === hubSlug)?.audience ?? "Người đọc 360dep.vn",
    priority: 1,
    status: "published",
    summary: post.excerpt,
    targetKeywords: post.tags,
    relatedProducts: post.product_ids ?? [],
    researchStage: matrixNode?.stage ?? post.researchStage,
    userQuestion: matrixNode?.userQuestion ?? post.userQuestion,
    nextArticleSlugs: matrixNode?.nextArticleSlugs ?? post.nextArticleSlugs,
    productGroupKeys: matrixNode?.productGroupKeys ?? post.productGroupKeys,
    matrixProductIds: matrixNode?.productIds ?? post.matrixProductIds,
    kolIds: matrixNode?.kolIds ?? post.kolIds,
    kolReasons: matrixNode?.kolReasons ?? post.kolReasons,
    relatedNodeKeys: matrixNode?.relatedNodeKeys ?? post.relatedNodeKeys,
    imagePolicy: policy,
    image: {
      ...imageSpec(post.title, hubSlug, "category"),
      assetPath: `/images/editorial/${post.slug}.jpg`,
      status: "generated",
      needsGeneration: false,
    },
    content: {
      ...content,
      sourceNotes: matrixNode?.sourceRefs ?? content.sourceNotes,
      medicalDisclaimerLevel: matrixNode?.safetyLevel ?? content.medicalDisclaimerLevel,
    },
  }
}

type EditorialSeed = {
  title: string
  intent: ArticleIntent
  priority?: 1 | 2 | 3
  summary: string
  keywords: string[]
  imagePolicy?: ArticleBrief["imagePolicy"]
  status?: ArticleStatus
}

const COMPLETED_ROADMAP_BY_HUB: Record<string, EditorialSeed[]> = {
  "da-mat": [
    { title: "Hướng dẫn nền skincare cho người mới", intent: "pillar", priority: 1, summary: "Pillar guide về loại da, tình trạng da, routine sáng/tối và thứ tự thêm treatment.", keywords: ["skincare cơ bản", "routine người mới"], imagePolicy: "generate" },
    { title: "Da nhạy cảm nên xây routine như thế nào", intent: "problem-solving", summary: "Cách giảm biến số, chọn cleanser/dưỡng/chống nắng và đọc dấu hiệu kích ứng.", keywords: ["da nhạy cảm", "routine dịu nhẹ"] },
    { title: "Da khô thiếu nước khác da thiếu dầu ra sao", intent: "problem-solving", summary: "Phân biệt cảm giác căng, bong, mất nước và cách chọn humectant/lipid.", keywords: ["da khô", "thiếu nước"] },
    { title: "Tẩy da chết AHA BHA PHA cho người mới", intent: "decision", summary: "Chọn acid theo vấn đề, lịch dùng và dấu hiệu quá tải.", keywords: ["AHA", "BHA", "PHA"] },
    { title: "Khi nào da cần bác sĩ thay vì skincare", intent: "safety", summary: "Checklist mụn nang, nám lan nhanh, viêm da, dị ứng và nhiễm trùng.", keywords: ["bác sĩ da liễu", "dấu hiệu cần khám"], imagePolicy: "generate" },
  ],
  "tri-mun": [
    { title: "Bản đồ trị mụn từ mụn ẩn đến mụn nang", intent: "pillar", priority: 1, summary: "Pillar phân loại mụn, mức viêm, treatment tại nhà và ranh giới đi khám.", keywords: ["trị mụn", "mụn nang"], imagePolicy: "generate" },
    { title: "Mụn nội tiết quanh cằm đọc thế nào", intent: "problem-solving", summary: "Theo dõi chu kỳ, vị trí mụn và khi nào nên hỏi bác sĩ.", keywords: ["mụn nội tiết", "mụn cằm"] },
    { title: "Mụn đầu đen có nên nặn không", intent: "decision", summary: "So sánh nặn, BHA, retinoid và thói quen làm sạch.", keywords: ["mụn đầu đen", "nặn mụn"] },
    { title: "Routine da mụn nhạy cảm", intent: "problem-solving", summary: "Tối giản treatment cho da vừa mụn vừa dễ rát.", keywords: ["da mụn nhạy cảm", "routine mụn"] },
    { title: "Sẹo mụn bắt đầu phòng từ khi nào", intent: "safety", summary: "Dấu hiệu nguy cơ sẹo và thời điểm cần can thiệp y khoa.", keywords: ["sẹo mụn", "mụn để sẹo"], imagePolicy: "generate" },
  ],
  "sang-da-chong-nang": [
    { title: "Pillar sáng da và chống nắng an toàn", intent: "pillar", priority: 1, summary: "Khung chống nắng, thâm mụn, nám, xỉn màu và hoạt chất làm sáng.", keywords: ["sáng da", "chống nắng"], imagePolicy: "generate" },
    { title: "Vitamin C dùng sáng hay tối", intent: "decision", summary: "Cách chọn vitamin C theo da, routine và chống nắng.", keywords: ["vitamin C", "dùng sáng tối"] },
    { title: "Tranexamic acid hợp ai", intent: "decision", summary: "Vai trò của TXA trong đều màu và nám nhẹ, kỳ vọng thực tế.", keywords: ["tranexamic acid", "nám"] },
    { title: "Da xỉn màu do thiếu ngủ hay skincare", intent: "problem-solving", summary: "Đọc da xỉn từ lối sống, thiếu ẩm, lớp sừng và nắng.", keywords: ["da xỉn màu", "thiếu ngủ"] },
    { title: "Dấu hiệu sản phẩm làm trắng không an toàn", intent: "safety", summary: "Nhận biết claim trắng cấp tốc, bong lột và thành phần mập mờ.", keywords: ["làm trắng cấp tốc", "kem trộn"], imagePolicy: "generate" },
  ],
  "ingredient-radar": [
    { title: "Cách đọc ingredient list cho người mới", intent: "pillar", priority: 1, summary: "Pillar về thứ tự thành phần, nhóm công dụng, nồng độ và nền công thức.", keywords: ["ingredient list", "đọc thành phần"], imagePolicy: "generate" },
    { title: "Retinoid, retinal, retinol khác nhau thế nào", intent: "decision", summary: "So sánh nhóm retinoid và cách vào routine.", keywords: ["retinoid", "retinal", "retinol"] },
    { title: "Peptide trong skincare có đáng mua không", intent: "decision", summary: "Kỳ vọng peptide, công thức và nhóm da phù hợp.", keywords: ["peptide", "chống lão hóa"] },
    { title: "Hoạt chất nào không nên phối cùng tối", intent: "safety", summary: "Các phối hợp dễ quá tải và cách tách lịch sáng/tối.", keywords: ["phối hoạt chất", "kích ứng"], imagePolicy: "generate" },
    { title: "Pregnancy-safe ingredient checklist", intent: "safety", summary: "Nhóm nên tránh/hỏi bác sĩ trong thai kỳ và sau sinh.", keywords: ["pregnancy-safe", "retinoid"], imagePolicy: "generate" },
  ],
  "product-radar": [
    { title: "Cách đọc review mỹ phẩm đáng tin", intent: "pillar", priority: 1, summary: "Pillar về review có ngữ cảnh, loại da, thời gian dùng và affiliate bias.", keywords: ["review mỹ phẩm", "đáng tin"], imagePolicy: "generate" },
    { title: "Cách tính giá trị thật của một serum", intent: "decision", summary: "Giá/ml, tần suất dùng, khả năng dùng hết và thay thế sản phẩm khác.", keywords: ["serum đáng tiền", "giá ml"] },
    { title: "Sản phẩm viral có nên mua ngay không", intent: "decision", summary: "Khung shortlist trước khi mua sản phẩm đang viral.", keywords: ["viral", "mua mỹ phẩm"] },
    { title: "Dấu hiệu review affiliate thiếu minh bạch", intent: "safety", summary: "Nhận biết review thiếu loại da, thiếu cách dùng hoặc né nhược điểm.", keywords: ["affiliate", "fake review"] },
    { title: "Checklist mua mỹ phẩm online an toàn", intent: "safety", summary: "Nguồn hàng, hạn dùng, batch code và đổi trả.", keywords: ["mỹ phẩm online", "hàng giả"] },
  ],
  bodycare: [
    { title: "Pillar bodycare theo từng vùng cơ thể", intent: "pillar", priority: 1, summary: "Bản đồ lưng/ngực/nách/bikini/tay chân và vấn đề thường gặp.", keywords: ["bodycare", "chăm sóc cơ thể"], imagePolicy: "generate" },
    { title: "Thâm nách do ma sát hay deodorant", intent: "problem-solving", summary: "Đọc thâm nách từ cạo/wax, ma sát, viêm và sản phẩm khử mùi.", keywords: ["thâm nách", "deodorant"] },
    { title: "Body mist có thay deodorant không", intent: "decision", summary: "Phân biệt tạo hương, khử mùi và giảm tiết mồ hôi.", keywords: ["body mist", "deodorant"] },
    { title: "Chống nắng body khi đi biển", intent: "decision", summary: "SPF body, thoa lại, kháng nước và che chắn.", keywords: ["chống nắng body", "đi biển"] },
    { title: "Khi mụn body là viêm nang lông nặng", intent: "safety", summary: "Dấu hiệu đau, mủ, lan rộng và khi cần bác sĩ.", keywords: ["mụn body", "viêm nang lông"], imagePolicy: "generate" },
  ],
  "toc-da-dau": [
    { title: "Pillar chăm tóc và da đầu theo vấn đề", intent: "pillar", priority: 1, summary: "Tách da đầu, nang tóc, thân tóc và thói quen tạo kiểu.", keywords: ["haircare", "da đầu"], imagePolicy: "generate" },
    { title: "Tóc nhanh bết nên gội mỗi ngày không", intent: "decision", summary: "Tần suất gội, dầu gội treatment và residue tạo kiểu.", keywords: ["tóc bết", "gội đầu"] },
    { title: "Dầu gội trị gàu dùng bao lâu", intent: "decision", summary: "Lịch dùng treatment scalp và khi nào cần khám.", keywords: ["dầu gội trị gàu", "gàu"] },
    { title: "Tóc rụng sau stress theo dõi thế nào", intent: "problem-solving", summary: "Theo dõi telogen shedding, ảnh đường ngôi và mốc đi khám.", keywords: ["rụng tóc stress", "theo dõi"] },
    { title: "Da đầu đỏ đau có nên tự đổi dầu gội", intent: "safety", summary: "Dấu hiệu viêm, nhiễm trùng hoặc bệnh da đầu cần bác sĩ.", keywords: ["da đầu đỏ", "đau da đầu"], imagePolicy: "generate" },
  ],
  makeup: [
    { title: "Pillar makeup theo nền da và dịp dùng", intent: "pillar", priority: 1, summary: "Bản đồ base, mắt, môi, má, dụng cụ và tẩy trang theo hoàn cảnh.", keywords: ["makeup cơ bản", "base makeup"], imagePolicy: "generate" },
    { title: "Kem nền, cushion, skin tint khác gì nhau", intent: "decision", summary: "Chọn base theo che phủ, finish và loại da.", keywords: ["kem nền", "cushion", "skin tint"] },
    { title: "Mascara bị lem do đâu", intent: "problem-solving", summary: "Dầu mí, công thức, powder, setting và tẩy trang.", keywords: ["mascara lem", "eye makeup"] },
    { title: "Cọ hay mút tán nền hợp ai", intent: "decision", summary: "So sánh dụng cụ theo coverage, texture và vệ sinh.", keywords: ["cọ nền", "mút trang điểm"] },
    { title: "Dùng tester makeup mắt có an toàn không", intent: "safety", summary: "Rủi ro nhiễm bẩn vùng mắt và cách thử sản phẩm an toàn.", keywords: ["tester makeup", "mắt"], imagePolicy: "generate" },
  ],
  "mui-huong": [
    { title: "Pillar chọn mùi hương theo dịp và mùa", intent: "pillar", priority: 1, summary: "Nhóm note, projection, longevity, drydown và etiquette.", keywords: ["nước hoa", "mùi hương"], imagePolicy: "generate" },
    { title: "Nước hoa văn phòng nên tỏa bao xa", intent: "decision", summary: "Khoảng cách mùi phù hợp nơi kín và cách giảm quá nồng.", keywords: ["nước hoa văn phòng", "projection"] },
    { title: "Mùi gourmand mùa nóng dùng sao cho không gắt", intent: "decision", summary: "Điều chỉnh lượng xịt, vị trí và layering.", keywords: ["gourmand", "mùa nóng"] },
    { title: "Layer lotion và perfume thế nào", intent: "problem-solving", summary: "Phối vibe mùi, dưỡng ẩm nền và tránh lẫn mùi.", keywords: ["layer nước hoa", "lotion"] },
    { title: "Dấu hiệu kích ứng hương liệu", intent: "safety", summary: "Da đỏ ngứa, đau đầu, khó chịu và khi cần dừng.", keywords: ["kích ứng hương liệu", "fragrance"], imagePolicy: "generate" },
  ],
  "nam-gioi": [
    { title: "Pillar grooming nam ít bước", intent: "pillar", priority: 1, summary: "Da mặt, tóc, râu, mùi cơ thể và chống nắng trong routine ngắn.", keywords: ["grooming nam", "skincare nam"], imagePolicy: "generate" },
    { title: "Sữa rửa mặt nam có cần riêng không", intent: "decision", summary: "Đọc cleanser theo dầu, mụn và cảm giác căng rít.", keywords: ["sữa rửa mặt nam", "da dầu"] },
    { title: "Aftershave làm rát da phải làm sao", intent: "problem-solving", summary: "Kích ứng sau cạo, phục hồi và đổi kỹ thuật cạo.", keywords: ["aftershave", "cạo râu"] },
    { title: "Chống nắng cho nam chơi thể thao", intent: "decision", summary: "SPF không cay mắt, kháng nước và thoa lại.", keywords: ["chống nắng nam", "thể thao"] },
    { title: "Viêm nang lông vùng râu khi nào cần khám", intent: "safety", summary: "Dấu hiệu mủ, đau, lan rộng và sẹo.", keywords: ["viêm nang lông râu", "khám"], imagePolicy: "generate" },
  ],
  "clinic-treatment": [
    { title: "Pillar chọn clinic treatment an toàn", intent: "pillar", priority: 1, summary: "Cơ chế, chỉ định, downtime, biến chứng, consent và aftercare.", keywords: ["clinic", "treatment an toàn"], imagePolicy: "generate" },
    { title: "Peel da tại clinic khác peel tại nhà thế nào", intent: "decision", summary: "Mức can thiệp, downtime và rủi ro PIH.", keywords: ["peel da", "clinic"] },
    { title: "Hydrafacial có thay skincare không", intent: "decision", summary: "Vai trò facial, kỳ vọng và maintenance.", keywords: ["hydrafacial", "facial"] },
    { title: "Triệt lông laser cần hỏi gì", intent: "decision", summary: "Màu da/lông, thiết bị, số buổi, chống chỉ định.", keywords: ["triệt lông laser", "clinic"] },
    { title: "Dấu hiệu nhiễm trùng sau thủ thuật", intent: "safety", summary: "Đỏ nóng đau, mủ, sốt và kênh liên hệ khẩn.", keywords: ["biến chứng", "nhiễm trùng"], imagePolicy: "generate" },
  ],
  "beauty-lifestyle": [
    { title: "Pillar da và lối sống: ngủ stress hormone", intent: "pillar", priority: 1, summary: "Theo dõi da trong bối cảnh đời sống, không chỉ mỹ phẩm.", keywords: ["beauty lifestyle", "stress"], imagePolicy: "generate" },
    { title: "Ăn ngọt có làm mụn nặng hơn không", intent: "problem-solving", summary: "Đọc trigger cá nhân và tránh kết luận cực đoan.", keywords: ["ăn ngọt", "mụn"] },
    { title: "Da tuổi 30 nên ưu tiên gì", intent: "decision", summary: "Chống nắng, phục hồi, retinoid/peptide và lifestyle.", keywords: ["da tuổi 30", "anti-aging"] },
    { title: "Supplement collagen có nên mua không", intent: "decision", summary: "Kỳ vọng, bằng chứng, chi phí và claim quá đà.", keywords: ["collagen", "supplement"] },
    { title: "Dấu hiệu kem trộn corticoid", intent: "safety", summary: "Da trắng nhanh, mỏng yếu, mụn viêm và cách dừng an toàn.", keywords: ["kem trộn", "corticoid"], imagePolicy: "generate" },
  ],
  "nails-mi-long-may": [
    { title: "Pillar nail mi mày đẹp nhưng an toàn", intent: "pillar", priority: 1, summary: "Vệ sinh dụng cụ, vật liệu, dị ứng, form và aftercare.", keywords: ["nail", "nối mi", "lông mày"], imagePolicy: "generate" },
    { title: "Nail công sở chọn form và màu thế nào", intent: "decision", summary: "Độ dài, màu, độ bền và môi trường làm việc.", keywords: ["nail công sở", "form móng"] },
    { title: "Serum dưỡng mi có rủi ro không", intent: "decision", summary: "Đọc claim mọc mi, kích ứng mắt và cách thử.", keywords: ["serum dưỡng mi", "mi"] },
    { title: "Phun mày bị trổ màu vì sao", intent: "problem-solving", summary: "Màu da, kỹ thuật, mực, chăm sau và dặm lại.", keywords: ["phun mày", "trổ màu"] },
    { title: "Dấu hiệu nhiễm trùng sau làm nail", intent: "safety", summary: "Đau, mủ, móng đổi màu và khi cần khám.", keywords: ["nhiễm trùng nail", "móng"], imagePolicy: "generate" },
  ],
  "beauty-tech": [
    { title: "Pillar beauty tech đáng mua hay không", intent: "pillar", priority: 1, summary: "Thiết bị, cơ chế, chống chỉ định, bảo hành và giá/lần dùng.", keywords: ["beauty tech", "thiết bị làm đẹp"], imagePolicy: "generate" },
    { title: "Máy sấy tạo kiểu đắt tiền có đáng mua", intent: "decision", summary: "Nhiệt, tóc hư tổn, tốc độ sấy và bảo hành.", keywords: ["máy sấy tóc", "đáng mua"] },
    { title: "AI soi da có đáng tin không", intent: "decision", summary: "AI skin analysis là gợi ý theo dõi, không phải chẩn đoán.", keywords: ["AI soi da", "skin analysis"] },
    { title: "Thiết bị nâng cơ tại nhà kỳ vọng ra sao", intent: "decision", summary: "Microcurrent/RF tại nhà, lịch dùng và giới hạn.", keywords: ["nâng cơ tại nhà", "microcurrent"] },
    { title: "Dấu hiệu thiết bị làm đẹp gây kích ứng", intent: "safety", summary: "Bỏng, rát, đỏ kéo dài, đau mắt và khi cần dừng.", keywords: ["thiết bị làm đẹp", "kích ứng"], imagePolicy: "generate" },
  ],
}

function nextRoadmapArticleSlugs(hubSlug: string, currentSlug: string) {
  const slugs = (COMPLETED_ROADMAP_BY_HUB[hubSlug] ?? []).map((seed) => slugify(seed.title))
  const index = slugs.indexOf(currentSlug)
  if (index < 0 || slugs.length < 2) return []
  return [slugs[(index + 1) % slugs.length]]
}

function completedBrief(hubSlug: string, seed: EditorialSeed): ArticleBrief {
  const content = buildGeneratedContent(seed, hubSlug)
  const slug = slugify(seed.title)
  const matrixNode = getMatrixNodeByArticleSlug(slug)

  return {
    title: seed.title,
    slug,
    hubSlug,
    intent: seed.intent,
    audience: catalogueSections.find((section) => section.slug === hubSlug)?.audience ?? "Người đọc 360dep.vn",
    priority: seed.priority ?? 2,
    // Every roadmap item below has topic-specific guidance, reviewed source
    // notes and a real editorial image, so it is safe to publish by default.
    status: seed.status ?? "published",
    summary: seed.summary,
    targetKeywords: seed.keywords,
    relatedProducts: [],
    researchStage: matrixNode?.stage ?? researchStageForIntent(seed.intent),
    userQuestion: matrixNode?.userQuestion ?? seed.title,
    nextArticleSlugs: matrixNode?.nextArticleSlugs ?? nextRoadmapArticleSlugs(hubSlug, slug),
    productGroupKeys: matrixNode?.productGroupKeys,
    matrixProductIds: matrixNode?.productIds,
    kolIds: matrixNode?.kolIds,
    kolReasons: matrixNode?.kolReasons,
    relatedNodeKeys: matrixNode?.relatedNodeKeys,
    imagePolicy: "generate",
    image: imageSpec(seed.title, hubSlug, "generate"),
    content: {
      ...content,
      sourceNotes: matrixNode?.sourceRefs ?? content.sourceNotes,
      medicalDisclaimerLevel: matrixNode?.safetyLevel ?? content.medicalDisclaimerLevel,
    },
  }
}

export const EDITORIAL_ARTICLE_REGISTRY: ArticleBrief[] = [
  ...CATALOGUE_READ_POSTS.map(publishedBriefFromPost),
  ...Object.entries(COMPLETED_ROADMAP_BY_HUB).flatMap(([hubSlug, seeds]) => seeds.map((seed) => completedBrief(hubSlug, seed))),
]

export const PUBLISHED_EDITORIAL_BRIEFS = EDITORIAL_ARTICLE_REGISTRY.filter((article) => article.status === "published")
export const PLANNED_EDITORIAL_BRIEFS = EDITORIAL_ARTICLE_REGISTRY.filter((article) => article.status !== "published")

export function getEditorialArticle(slug: string) {
  return EDITORIAL_ARTICLE_REGISTRY.find((article) => article.slug === slug)
}

export function getPublishedEditorialPosts(): Post[] {
  return PUBLISHED_EDITORIAL_BRIEFS.map((article) => {
    const fallbackPost = CATALOGUE_READ_POSTS.find((post) => post.slug === article.slug)
    const generated = generatedPostFromBrief(article)

    if (!fallbackPost) return generated
    return {
      ...fallbackPost,
      image: article.image.assetPath,
      hubSlug: article.hubSlug,
      status: "published",
      takeaways: article.content?.takeaways,
      faq: article.content?.faq,
      sourceNotes: article.content?.sourceNotes,
      medicalDisclaimerLevel: article.content?.medicalDisclaimerLevel,
      researchStage: article.researchStage,
      userQuestion: article.userQuestion,
      nextArticleSlugs: article.nextArticleSlugs,
      productGroupKeys: article.productGroupKeys,
      matrixProductIds: article.matrixProductIds,
      kolIds: article.kolIds,
      kolReasons: article.kolReasons,
      relatedNodeKeys: article.relatedNodeKeys,
    }
  })
}

export function getPublishedEditorialPost(idOrSlug: string) {
  return getPublishedEditorialPosts().find((post) => post.id === idOrSlug || post.slug === idOrSlug) ?? null
}

export function getPublishedNextReadPosts(hubSlug: string) {
  const reads = catalogueGuides[hubSlug]?.nextReads ?? []
  const published = getPublishedEditorialPosts()
  const direct = reads
    .map((title) => published.find((post) => post.title === title))
    .filter((post): post is Post => Boolean(post))

  if (direct.length > 0) return direct
  return published.filter((post) => post.hubSlug === hubSlug).slice(0, 3)
}

export function getEditorialImageQueue() {
  return EDITORIAL_ARTICLE_REGISTRY.filter((article) => article.image.needsGeneration)
}

export function getEditorialStats() {
  const byHub = catalogueSections.map((hub) => {
    const articles = EDITORIAL_ARTICLE_REGISTRY.filter((article) => article.hubSlug === hub.slug)
    return {
      hubSlug: hub.slug,
      total: articles.length,
      published: articles.filter((article) => article.status === "published").length,
      planned: articles.filter((article) => article.status !== "published").length,
      imageQueue: articles.filter((article) => article.image.needsGeneration).length,
    }
  })

  return {
    total: EDITORIAL_ARTICLE_REGISTRY.length,
    published: PUBLISHED_EDITORIAL_BRIEFS.length,
    planned: PLANNED_EDITORIAL_BRIEFS.length,
    imageQueue: getEditorialImageQueue().length,
    byHub,
  }
}
