import type { Pro, ProService, RatingSummary, Review, Work } from "./types"

export { CATEGORIES, categoryLabel } from "./catalog"
export { CITIES } from "./geo"

const img = (name: string) => `/images/works/${name}.webp`
const avatar = (id: string) => `/images/pros/${id}.webp`

const r = (
  id: string,
  proId: string,
  author: string,
  rating: number,
  tags: string[],
  text: string,
  date: string,
  serviceName: string,
  extra: Partial<Review> = {},
): Review => ({
  id,
  proId,
  author,
  rating,
  tags,
  text,
  date,
  serviceName,
  ...extra,
})

export const REVIEWS: Review[] = [
  r("r1", "linh-pham", "Ngọc Hân", 5, ["Tay nghề tốt", "Bền đẹp"], "Làm kỹ, form móng đẹp, đến đúng giờ. Giữ được hơn 3 tuần không bong.", "2026-09-02", "Nail thiết kế · Đính đá / charm", { photo: img("nail-milky-1"), reply: "Cảm ơn Hân nhiều, hẹn gặp lại lần sau nha!" }),
  r("r2", "linh-pham", "Thảo Vy", 5, ["Dụng cụ sạch sẽ", "Tư vấn kỹ"], "Tư vấn màu rất có tâm, dụng cụ hấp tiệt trùng trước mặt mình luôn.", "2026-08-21", "Sơn gel trơn · Tay"),
  r("r3", "linh-pham", "Minh Châu", 4, ["Tay nghề tốt"], "Đẹp, nhưng đến trễ 15 phút vì kẹt xe, có nhắn báo trước.", "2026-08-10", "Nối móng · Đắp gel", { reply: "Xin lỗi Châu vì hôm đó mưa kẹt xe, lần sau mình sẽ đi sớm hơn ạ." }),
  r("r4", "thu-anh", "Lan Phương", 5, ["Bền đẹp", "Nhẹ nhàng"], "Makeup trong veo, chụp ảnh lên rất xinh, bền cả tối.", "2026-09-05", "Makeup dự tiệc · Makeup", { photo: img("makeup-party-1") }),
  r("r5", "thu-anh", "Bảo Ngọc", 5, ["Tư vấn kỹ"], "Chị rất nhẹ nhàng, hỏi kỹ về da trước khi làm.", "2026-08-28", "Makeup chụp ảnh / kỷ yếu · 1 người"),
  r("r6", "thu-anh", "Hải Yến", 4, ["Tay nghề tốt"], "Layout đẹp, hơi lâu hơn dự kiến một chút.", "2026-08-12", "Makeup cô dâu · 1 lễ (ăn hỏi hoặc cưới)"),
  r("r7", "mai-tran", "Khánh Linh", 5, ["Dụng cụ sạch sẽ", "Nhẹ nhàng"], "Da dịu hẳn sau 2 buổi, không bị đỏ như lúc đi spa.", "2026-09-01", "Phục hồi da nhạy cảm · 75 phút", { photo: img("skin-glow"), reply: "Nhớ bôi kem chống nắng đều nha Linh!" }),
  r("r8", "mai-tran", "Tuấn Anh", 5, ["Tay nghề tốt", "Đúng giờ"], "Lấy mụn nhẹ tay, không thâm, dụng cụ bóc tem trước mặt.", "2026-08-19", "Lấy nhân mụn chuẩn y khoa · 60 phút"),
  r("r9", "quynh-vu", "Hồng Nhung", 5, ["Bền đẹp"], "Tóc giữ nếp tới cuối tiệc cưới.", "2026-08-17", "Tạo kiểu tóc sự kiện · Búi / tết cầu kỳ", { photo: img("hair-bun-1") }),
  r("r10", "quynh-vu", "Mỹ Duyên", 4, ["Giá hợp lý"], "Uốn đẹp nhưng lọn hơi nhanh xẹp.", "2026-08-02", "Tạo kiểu tóc sự kiện · Uốn / duỗi tạo kiểu"),
  r("r11", "ha-my", "Phương Anh", 5, ["Nhẹ nhàng", "Bền đẹp"], "Mi tự nhiên, không cộm, không cay mắt.", "2026-09-08", "Nối mi classic · Full set", { photo: img("lash-1") }),
  r("r12", "ha-my", "Thu Hà", 5, ["Đúng giờ"], "Dáng mày hợp mặt, làm nhanh.", "2026-08-25", "Tạo dáng & tỉa mày · Tạo dáng"),
  r("r13", "ngoc-bao", "Diệu Linh", 5, ["Giá hợp lý", "Nhẹ nhàng"], "Nhóm mình 3 người làm nhanh gọn, bạn rất dễ thương.", "2026-08-30", "Makeup dự tiệc · Makeup"),
  r("r14", "dieu-huong", "Quốc Bảo", 5, ["Tay nghề tốt", "Đúng giờ"], "Bấm huyệt đúng chỗ đau, mang theo cả giường gấp, rất chuyên nghiệp.", "2026-09-06", "Massage cổ vai gáy · 90 phút"),
  r("r15", "dieu-huong", "Thanh Tâm", 5, ["Nhẹ nhàng", "Tư vấn kỹ"], "Massage bầu tháng thứ 7, chị rất cẩn thận, hỏi kỹ tình trạng trước.", "2026-08-22", "Massage bầu · 60 phút", { reply: "Chúc mẹ bầu mẹ tròn con vuông nha!" }),
]

const PRO_PROFILES: Omit<Pro, "rating">[] = [
  {
    id: "linh-pham",
    name: "Linh Phạm",
    title: "Chuyên viên nail",
    phone: "0968 112 233",
    avatar: avatar("linh-pham"),
    tone: "#E9C9C6",
    categories: ["nail"],
    city: "Hà Nội",
    district: "Thanh Xuân",
    areas: ["Thanh Xuân", "Đống Đa", "Cầu Giấy", "Hai Bà Trưng"],
    homeService: true,
    studioAddress: "Ngõ 88 Nguyễn Trãi, Thanh Xuân",
    maxTravelKm: 12,
    yearsExp: 5,
    joinedAt: "2024-03-12",
    bio: "Mình chuyên nail tone nude, milky, đính đá nhẹ cho đi làm và đi tiệc. Dụng cụ tiệt trùng từng khách, gel chính hãng, có tư vấn form móng theo bàn tay.",
    highlights: ["Gel chính hãng có tem", "Tiệt trùng dụng cụ bằng nồi hấp", "Bảo hành bong tróc 5 ngày"],
    identity: "none",
    stats: { completedJobs: 486, responseMinutes: 10 },
  },
  {
    id: "thu-anh",
    name: "Thu Anh",
    title: "Chuyên viên makeup",
    phone: "0912 445 566",
    avatar: avatar("thu-anh"),
    tone: "#E6D2C3",
    categories: ["makeup"],
    city: "Hà Nội",
    district: "Ba Đình",
    areas: ["Ba Đình", "Hoàn Kiếm", "Tây Hồ", "Cầu Giấy", "Đống Đa"],
    homeService: true,
    maxTravelKm: 15,
    yearsExp: 6,
    joinedAt: "2024-01-20",
    bio: "Makeup trong trẻo, bền màu cho tiệc, kỷ yếu, chụp ảnh và cô dâu. Có sẵn kit mỹ phẩm cho da nhạy cảm, cọ vệ sinh riêng từng khách.",
    highlights: ["Kit mỹ phẩm cho da nhạy cảm", "Nhận makeup nhóm", "Có buổi thử cho cô dâu"],
    identity: "verified",
    stats: { completedJobs: 352, responseMinutes: 30 },
  },
  {
    id: "mai-tran",
    name: "Mai Trần",
    title: "Chuyên viên chăm sóc da",
    phone: "0903 778 899",
    avatar: avatar("mai-tran"),
    tone: "#DCD5C8",
    categories: ["skincare"],
    city: "TP.HCM",
    district: "Quận 3",
    areas: ["Quận 1", "Quận 3", "Phú Nhuận", "Bình Thạnh"],
    homeService: true,
    studioAddress: "Hẻm 214 Võ Văn Tần, Quận 3",
    maxTravelKm: 10,
    yearsExp: 7,
    joinedAt: "2023-11-02",
    bio: "Facial thư giãn, lấy nhân mụn chuẩn y khoa và phục hồi da tại nhà. Soi da trước khi làm, không lột tẩy mạnh, dụng cụ dùng một lần.",
    highlights: ["Chứng chỉ Điều dưỡng da liễu", "Dụng cụ lấy mụn dùng một lần", "Soi da miễn phí"],
    identity: "verified",
    stats: { completedJobs: 268, responseMinutes: 45 },
  },
  {
    id: "quynh-vu",
    name: "Quỳnh Vũ",
    title: "Stylist tóc",
    phone: "0938 221 447",
    avatar: avatar("quynh-vu"),
    tone: "#D9CBBF",
    categories: ["hair"],
    city: "TP.HCM",
    district: "Quận 1",
    areas: ["Quận 1", "Quận 3", "Quận 7"],
    homeService: true,
    studioAddress: "Lầu 2, 45 Lê Thánh Tôn, Quận 1",
    maxTravelKm: 10,
    yearsExp: 4,
    joinedAt: "2024-06-08",
    bio: "Tạo kiểu tóc sự kiện, uốn lọn, búi tết theo trang phục. Gội dưỡng sinh tại studio.",
    highlights: ["Mang máy uốn, máy sấy riêng", "Nhận làm tóc nhóm"],
    identity: "verified",
    stats: { completedJobs: 190, responseMinutes: 60 },
  },
  {
    id: "ha-my",
    name: "Hà My",
    title: "Chuyên viên mi & mày",
    phone: "0965 334 112",
    avatar: avatar("ha-my"),
    tone: "#EAD6D0",
    categories: ["lash-brow"],
    city: "Hà Nội",
    district: "Hoàn Kiếm",
    areas: ["Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa"],
    homeService: true,
    studioAddress: "Phố Hàng Bông, Hoàn Kiếm",
    maxTravelKm: 8,
    yearsExp: 5,
    joinedAt: "2023-09-15",
    bio: "Nối mi classic và volume nhẹ tại studio, tạo dáng mày theo khuôn mặt tại nhà hoặc studio. Test kích ứng keo trước khi làm.",
    highlights: ["Keo ít kích ứng, test trước", "Bảo hành rụng mi 3 ngày"],
    identity: "verified",
    stats: { completedJobs: 410, responseMinutes: 15 },
  },
  {
    id: "ngoc-bao",
    name: "Ngọc Bảo",
    title: "Chuyên viên nail & makeup",
    phone: "0906 553 224",
    avatar: avatar("ngoc-bao"),
    tone: "#E3CFC9",
    categories: ["nail", "makeup"],
    city: "Đà Nẵng",
    district: "Hải Châu",
    areas: ["Hải Châu", "Sơn Trà", "Thanh Khê"],
    homeService: true,
    maxTravelKm: 12,
    yearsExp: 2,
    joinedAt: "2026-08-01",
    bio: "Mới tham gia dep360. Combo nail + makeup nhẹ cho ngày đặc biệt, nhận nhóm bạn và phù dâu.",
    highlights: ["Nhận nhóm bạn, phù dâu"],
    identity: "pending",
    stats: { completedJobs: 7, responseMinutes: 90 },
  },
  {
    id: "dieu-huong",
    name: "Diệu Hương",
    title: "Kỹ thuật viên massage",
    phone: "0917 662 335",
    avatar: avatar("dieu-huong"),
    tone: "#DDD3C6",
    categories: ["massage"],
    city: "TP.HCM",
    district: "Bình Thạnh",
    areas: ["Bình Thạnh", "Phú Nhuận", "Quận 1", "Gò Vấp"],
    homeService: true,
    maxTravelKm: 12,
    yearsExp: 8,
    joinedAt: "2024-04-18",
    bio: "Kỹ thuật viên massage trị liệu 8 năm. Mang theo giường gấp, khăn sạch và tinh dầu. Massage bầu có chứng chỉ.",
    highlights: ["Mang giường massage gấp", "Có chứng chỉ massage bầu", "Khăn dùng riêng từng khách"],
    identity: "verified",
    stats: { completedJobs: 128, responseMinutes: 25 },
  },
]

/** Ratings are derived from the reviews we actually have, never hand-written. */
function ratingFromReviews(proId: string): RatingSummary {
  const rows = REVIEWS.filter((x) => x.proId === proId)
  if (!rows.length) return { average: 0, count: 0 }
  return { average: rows.reduce((sum, x) => sum + x.rating, 0) / rows.length, count: rows.length }
}

export const PROS: Pro[] = PRO_PROFILES.map((p) => ({ ...p, rating: ratingFromReviews(p.id) }))

const ps = (proId: string, templateId: string, prices: Record<string, number>): ProService => ({
  id: `${proId}:${templateId}`,
  proId,
  templateId,
  prices: Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, v * 1000])),
  active: true,
})

export const PRO_SERVICES: ProService[] = [
  ps("linh-pham", "nail-gel", { hand: 180, "hand-foot": 320 }),
  ps("linh-pham", "nail-design", { simple: 300, stone: 380, art: 520 }),
  ps("linh-pham", "nail-extension", { tips: 320, builder: 450 }),
  ps("linh-pham", "nail-removal", { remove: 80, "remove-care": 140 }),

  ps("thu-anh", "makeup-daily", { single: 350 }),
  ps("thu-anh", "makeup-party", { makeup: 600, "makeup-hair": 850 }),
  ps("thu-anh", "makeup-photo", { single: 550, group: 380 }),
  ps("thu-anh", "makeup-bridal", { one: 2200, two: 4000 }),

  ps("mai-tran", "skin-basic", { "60m": 350, "90m": 480 }),
  ps("mai-tran", "skin-acne", { "60m": 420, "90m": 560 }),
  ps("mai-tran", "skin-recovery", { "75m": 450 }),

  ps("quynh-vu", "hair-wash", { "45m": 160, "60m": 200 }),
  ps("quynh-vu", "hair-styling", { curl: 300, updo: 420 }),

  ps("ha-my", "lash-classic", { full: 350 }),
  ps("ha-my", "lash-volume", { full: 450 }),
  ps("ha-my", "lash-refill", { refill: 200 }),
  ps("ha-my", "brow-shaping", { shape: 120 }),

  ps("ngoc-bao", "nail-gel", { hand: 150, "hand-foot": 280 }),
  ps("ngoc-bao", "nail-design", { simple: 250, stone: 320 }),
  ps("ngoc-bao", "makeup-daily", { single: 300 }),
  ps("ngoc-bao", "makeup-party", { makeup: 500 }),

  ps("dieu-huong", "massage-foot", { "60m": 300, "90m": 420, "120m": 520 }),
  ps("dieu-huong", "massage-neck", { "60m": 300, "90m": 420, "120m": 520 }),
  ps("dieu-huong", "massage-oil-cupping", { "60m": 350, "90m": 480, "120m": 600 }),
  ps("dieu-huong", "massage-prenatal", { "60m": 420, "90m": 560 }),
  ps("dieu-huong", "massage-dry", { "60m": 350, "90m": 480, "120m": 600 }),
]

export const WORKS: Work[] = [
  { id: "w-milky-stone", proId: "linh-pham", templateId: "nail-design", category: "nail", title: "Nail milky đính đá nhẹ", description: "Thiết kế tinh tế, phù hợp đi làm, đi tiệc. Có thể tùy chỉnh theo tone da và độ dài móng.", images: [img("nail-milky-1"), img("nail-milky-2")], likes: 256, comments: 12 },
  { id: "w-ombre", proId: "linh-pham", templateId: "nail-design", category: "nail", title: "Nail ombre hồng", description: "Ombre hồng sữa chuyển nhẹ, form coffin mềm.", images: [img("nail-ombre"), img("nail-milky-2")], likes: 188, comments: 9 },
  { id: "w-nude-short", proId: "linh-pham", templateId: "nail-gel", category: "nail", title: "Móng ngắn tone nude", description: "Form vuông bo ngắn, hợp dân văn phòng gõ phím nhiều.", images: [img("nail-nude-short")], likes: 142, comments: 6 },
  { id: "w-french", proId: "linh-pham", templateId: "nail-design", category: "nail", title: "Nail French", description: "French đầu móng mảnh, nền hồng trong.", images: [img("nail-french"), img("nail-milky-1")], likes: 97, comments: 4 },
  { id: "w-party-glow", proId: "thu-anh", templateId: "makeup-party", category: "makeup", title: "Makeup trong trẻo đi tiệc", description: "Nền mỏng, má hồng đào, môi căng bóng.", images: [img("makeup-party-1"), img("makeup-party-2")], likes: 412, comments: 31 },
  { id: "w-smoky-soft", proId: "thu-anh", templateId: "makeup-photo", category: "makeup", title: "Mắt khói nâu mềm", description: "Layout chụp ảnh tone nâu ấm, không nặng mắt.", images: [img("makeup-smoky"), img("makeup-party-2")], likes: 305, comments: 18 },
  { id: "w-bride-natural", proId: "thu-anh", templateId: "makeup-bridal", category: "makeup", title: "Cô dâu tự nhiên", description: "Nền lì mỏng, bền suốt lễ cưới.", images: [img("makeup-bride-1"), img("makeup-bride-2")], likes: 520, comments: 44 },
  { id: "w-facial-calm", proId: "mai-tran", templateId: "skin-recovery", category: "skincare", title: "Phục hồi da nhạy cảm", description: "Liệu trình 4 buổi giúp da bớt đỏ, căng ẩm hơn.", images: [img("skin-glow"), img("skin-massage")], likes: 164, comments: 12 },
  { id: "w-deep-clean", proId: "mai-tran", templateId: "skin-acne", category: "skincare", title: "Lấy nhân mụn tại nhà", description: "Dụng cụ dùng một lần, lấy nhân mụn nhẹ tay, không để lại thâm.", images: [img("skin-deep"), img("skin-facial")], likes: 131, comments: 7 },
  { id: "w-body-glow", proId: "mai-tran", templateId: "skin-basic", category: "skincare", title: "Chăm sóc da cuối tuần", description: "Massage mặt 20 phút, mặt nạ dịu da.", images: [img("skin-facial"), img("skin-massage")], likes: 88, comments: 3 },
  { id: "w-event-waves", proId: "quynh-vu", templateId: "hair-styling", category: "hair", title: "Uốn lọn sóng dự tiệc", description: "Lọn to bồng bềnh, giữ nếp cả tối.", images: [img("hair-waves-1"), img("hair-waves-2")], likes: 176, comments: 10 },
  { id: "w-bride-bun", proId: "quynh-vu", templateId: "hair-styling", category: "hair", title: "Búi thấp dự tiệc cưới", description: "Búi thấp mềm, kết hợp phụ kiện ngọc trai.", images: [img("hair-bun-1"), img("hair-bun-2")], likes: 203, comments: 15 },
  { id: "w-classic-lash", proId: "ha-my", templateId: "lash-classic", category: "lash-brow", title: "Mi classic tự nhiên", description: "Mi mảnh, cong nhẹ, như mi thật.", images: [img("lash-1"), img("lash-2")], likes: 240, comments: 21 },
  { id: "w-brow-shape", proId: "ha-my", templateId: "brow-shaping", category: "lash-brow", title: "Dáng mày ngang mềm", description: "Mày ngang trẻ trung theo khuôn mặt tròn.", images: [img("brow-1"), img("brow-2")], likes: 158, comments: 8 },
  { id: "w-nb-gel", proId: "ngoc-bao", templateId: "nail-gel", category: "nail", title: "Gel trơn hồng đất", description: "Tone hồng đất ấm, hợp da ngăm.", images: [img("nail-earth")], likes: 64, comments: 2 },
  { id: "w-nb-combo", proId: "ngoc-bao", templateId: "makeup-party", category: "makeup", title: "Makeup nhóm phù dâu", description: "Makeup nhẹ đồng bộ cho nhóm 3 người.", images: [img("makeup-bridesmaid")], likes: 91, comments: 5 },
  { id: "w-foot", proId: "dieu-huong", templateId: "massage-foot", category: "massage", title: "Massage chân tại nhà", description: "Ngâm chân thảo mộc, bấm huyệt bàn chân sau ngày dài.", images: [img("massage-foot")], likes: 132, comments: 9 },
  { id: "w-neck", proId: "dieu-huong", templateId: "massage-neck", category: "massage", title: "Cổ vai gáy dân văn phòng", description: "Chườm nóng và massage giảm căng cứng cổ vai.", images: [img("massage-neck")], likes: 118, comments: 6 },
  { id: "w-cupping", proId: "dieu-huong", templateId: "massage-oil-cupping", category: "massage", title: "Massage dầu + giác hơi", description: "Massage tinh dầu kết hợp giác hơi lưng.", images: [img("massage-cupping")], likes: 97, comments: 4 },
]

export const getPro = (id: string) => PROS.find((p) => p.id === id)
export const getWork = (id: string) => WORKS.find((w) => w.id === id)
export const worksByPro = (proId: string) => WORKS.filter((w) => w.proId === proId)

/** The freelancer profile used by the demo "freelancer" session. */
export const DEMO_PRO_ID = "linh-pham"

/** Default address of the demo customer. */
export const DEMO_CUSTOMER = {
  name: "Nguyễn Phương",
  phone: "0912 345 678",
  address: { city: "Hà Nội", district: "Thanh Xuân", detail: "123 Nguyễn Trãi" },
}
