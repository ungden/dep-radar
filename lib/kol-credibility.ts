import type { Kol } from "@/lib/types"

export type KolCredibilityTier =
  | "expert"
  | "trusted_reviewer"
  | "cross_check"
  | "commercial_koc"
  | "needs_verification"

export interface KolCredibility {
  credibilityScore: number
  influenceScore: number
  tier: KolCredibilityTier
  label: string
  shortLabel: string
  summary: string
  strengths: string[]
  cautions: string[]
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
}

function profileText(kol: Kol) {
  return normalize([
    kol.name,
    kol.realName,
    kol.platform,
    kol.handle,
    kol.recentreview,
    kol.activeSince,
    kol.bio,
    kol.contentStyle,
    kol.ownBrand,
    kol.transparencyNote,
    ...(kol.categories ?? []),
    ...(kol.specialties ?? []),
    ...(kol.knownFor ?? []),
    ...(kol.signatureProducts ?? []),
  ].filter(Boolean).join(" "))
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalize(term)))
}

function unique(items: string[]) {
  return Array.from(new Set(items))
}

export function getKolCredibility(kol: Kol): KolCredibility {
  const text = profileText(kol)
  const platforms = new Set(kol.socials?.map((social) => social.platform) ?? [kol.platform])
  const strengths: string[] = []
  const cautions: string[] = []
  let score = 48

  const isDoctor = includesAny(text, ["bác sĩ", "bac si", "da liễu", "da lieu", "chuyên khoa", "chuyen khoa", "thạc sĩ", "noi tru", "dr "])
  const isMua = includesAny(text, ["makeup artist", "mua", "chuyên gia trang điểm", "make-up", "makeup studio", "trang điểm chuyên nghiệp"])
  const isLongtimeBeauty = includesAny(text, ["beauty blogger", "beauty guru", "beauty editor", "đời đầu", "doi dau", "làm nội dung làm đẹp", "201"])
  const isReviewer = includesAny(text, ["review", "swatch", "routine", "trải nghiệm", "trai nghiem", "so sánh", "so sanh"])
  const isCommerceHeavy = includesAny(text, ["livestream", "chốt đơn", "chot don", "tiktok shop", "affiliate", "bán hàng", "ban hang", "deal"])
  const hasOwnBrand = Boolean(kol.ownBrand)
  const hasTransparency = Boolean(kol.transparencyNote)
  const hasEvidence = Boolean(kol.reviewHighlights?.length || kol.contentStyle || kol.knownFor?.length)
  const hasRealIdentity = Boolean(kol.realName || isDoctor || isMua || isLongtimeBeauty)

  if (kol.verified) {
    score += 8
    strengths.push("Danh tính/kênh đã được xác minh trong registry")
  } else {
    cautions.push("Chưa có dấu verified nội bộ, nên đối chiếu thêm nguồn")
  }

  if (hasRealIdentity) {
    score += 10
    strengths.push("Có danh tính hoặc vai trò cá nhân rõ")
  } else {
    score -= 8
    cautions.push("Tín hiệu danh tính cá nhân còn mỏng")
  }

  if (isDoctor) {
    score += 22
    strengths.push("Có nền tảng chuyên môn y khoa/da liễu")
  } else if (isMua) {
    score += 16
    strengths.push("Có chuyên môn thực hành makeup/làm đẹp")
  } else if (isLongtimeBeauty) {
    score += 14
    strengths.push("Có lịch sử làm beauty content lâu năm")
  } else if (isReviewer) {
    score += 8
    strengths.push("Có nội dung review/trải nghiệm sản phẩm")
  }

  if (hasEvidence) {
    score += 10
    strengths.push("Hồ sơ có mô tả phong cách, dấu ấn hoặc review tiêu biểu")
  } else {
    score -= 6
    cautions.push("Chưa có nhiều bằng chứng review có ngữ cảnh")
  }

  if (platforms.size >= 3) {
    score += 5
    strengths.push("Có dấu vết đa nền tảng để đối chiếu")
  } else if (platforms.size === 1) {
    score -= 2
  }

  if (hasTransparency) {
    score += 5
    strengths.push("Có ghi chú minh bạch/PR/booking")
  } else {
    cautions.push("Chưa có ghi chú minh bạch PR/affiliate")
  }

  if (hasOwnBrand) {
    score -= 6
    cautions.push("Có thương hiệu/kinh doanh riêng, cần đọc review với bối cảnh lợi ích")
  }

  if (isCommerceHeavy) {
    score -= 8
    cautions.push("Có tín hiệu thương mại/livestream/affiliate mạnh")
  }

  if (includesAny(text, ["kem trộn", "trắng cấp tốc", "corticoid"])) {
    score -= 10
    cautions.push("Cần kiểm tra kỹ các claim liên quan treatment/làm trắng")
  }

  const credibilityScore = Math.max(35, Math.min(98, Math.round(score)))
  let tier: KolCredibilityTier
  let label: string
  let shortLabel: string

  if (isCommerceHeavy && credibilityScore < 78) {
    tier = "commercial_koc"
    label = "KOC thương mại"
    shortLabel = "Thương mại"
  } else if (credibilityScore >= 85) {
    tier = "expert"
    label = isDoctor ? "Chuyên gia rất đáng tin" : "Reviewer rất đáng tin"
    shortLabel = isDoctor ? "Chuyên gia" : "Rất đáng tin"
  } else if (credibilityScore >= 75) {
    tier = "trusted_reviewer"
    label = isDoctor || isMua ? "Chuyên môn đáng tin" : "Reviewer đáng theo dõi"
    shortLabel = isDoctor || isMua ? "Chuyên môn" : "Đáng theo dõi"
  } else if (credibilityScore >= 65) {
    tier = "cross_check"
    label = "Nên đối chiếu thêm"
    shortLabel = "Đối chiếu"
  } else {
    tier = "needs_verification"
    label = "Cần kiểm chứng"
    shortLabel = "Kiểm chứng"
  }

  const summary = [
    `${label}: ${credibilityScore}/100.`,
    isDoctor
      ? "Ưu tiên vì có nền tảng chuyên môn."
      : isCommerceHeavy
        ? "Hữu ích để xem xu hướng/mua sắm, nhưng cần tách review khỏi mục tiêu bán hàng."
        : "Nên đọc cùng loại da, thời gian dùng và disclosure PR.",
  ].join(" ")

  return {
    credibilityScore,
    influenceScore: kol.trustscore,
    tier,
    label,
    shortLabel,
    summary,
    strengths: unique(strengths).slice(0, 4),
    cautions: unique(cautions).slice(0, 4),
  }
}

export function credibilityToneClass(tier: KolCredibilityTier) {
  switch (tier) {
    case "expert":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50"
    case "trusted_reviewer":
      return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-900/50"
    case "commercial_koc":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50"
    case "cross_check":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50"
    case "needs_verification":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700"
  }
}
