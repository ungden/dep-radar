import type { Category, CategoryId, Pro, Review, Service, Work } from "./types"

export const CATEGORIES: Category[] = [
  { id: "nail", label: "Nail", short: "Nail" },
  { id: "makeup", label: "Makeup", short: "Makeup" },
  { id: "skincare", label: "Chăm sóc da", short: "Chăm sóc da" },
  { id: "hair", label: "Tóc", short: "Tóc" },
  { id: "lash-brow", label: "Mi & mày", short: "Mi & mày" },
]

export const CITIES = ["Hà Nội", "TP.HCM", "Đà Nẵng"]

export const DISTRICTS: Record<string, string[]> = {
  "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Đống Đa", "Cầu Giấy", "Thanh Xuân", "Hai Bà Trưng", "Tây Hồ"],
  "TP.HCM": ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Phú Nhuận", "Thủ Đức"],
  "Đà Nẵng": ["Hải Châu", "Sơn Trà", "Ngũ Hành Sơn", "Thanh Khê"],
}

export function categoryLabel(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}

const img = (name: string) => `/images/works/${name}.webp`

export const PROS: Pro[] = [
  {
    id: "linh-pham",
    avatar: `/images/pros/linh-pham.webp`,
    name: "Linh Phạm",
    title: "Chuyên viên nail",
    categories: ["nail"],
    city: "Hà Nội",
    district: "Thanh Xuân",
    areas: ["Thanh Xuân", "Đống Đa", "Cầu Giấy"],
    rating: 4.9,
    reviewCount: 120,
    followers: 1200,
    completedJobs: 486,
    yearsExp: 5,
    bio: "Mình chuyên nail tone nude, milky, đính đá nhẹ cho đi làm và đi tiệc. Dụng cụ tiệt trùng từng khách, gel chính hãng, có tư vấn form móng theo bàn tay.",
    tags: ["Nhận làm tại nhà", "Tư vấn nhiệt tình", "Dụng cụ tiệt trùng"],
    homeService: true,
    studioAddress: "Ngõ 88 Nguyễn Trãi, Thanh Xuân",
    responseTime: "Thường phản hồi trong 10 phút",
    verified: true,
    tone: "#E9C9C6",
  },
  {
    id: "thu-anh",
    avatar: `/images/pros/thu-anh.webp`,
    name: "Thu Anh",
    title: "Chuyên viên makeup",
    categories: ["makeup"],
    city: "Hà Nội",
    district: "Ba Đình",
    areas: ["Ba Đình", "Hoàn Kiếm", "Tây Hồ", "Cầu Giấy"],
    rating: 4.8,
    reviewCount: 96,
    followers: 2300,
    completedJobs: 352,
    yearsExp: 6,
    bio: "Makeup trong trẻo, bền màu cho tiệc, kỷ yếu, chụp ảnh và cô dâu. Có sẵn kit mỹ phẩm cho da nhạy cảm.",
    tags: ["Nhận làm tại nhà", "Makeup cô dâu", "Đi tỉnh"],
    homeService: true,
    responseTime: "Thường phản hồi trong 30 phút",
    verified: true,
    tone: "#E6D2C3",
  },
  {
    id: "mai-tran",
    avatar: `/images/pros/mai-tran.webp`,
    name: "Mai Trần",
    title: "Chuyên viên chăm sóc da",
    categories: ["skincare"],
    city: "TP.HCM",
    district: "Quận 3",
    areas: ["Quận 1", "Quận 3", "Phú Nhuận", "Bình Thạnh"],
    rating: 4.9,
    reviewCount: 74,
    followers: 980,
    completedJobs: 268,
    yearsExp: 7,
    bio: "Facial thư giãn, làm sạch sâu và phục hồi da tại nhà. Soi da miễn phí trước khi làm, không lột tẩy mạnh.",
    tags: ["Nhận làm tại nhà", "Soi da miễn phí"],
    homeService: true,
    studioAddress: "Hẻm 214 Võ Văn Tần, Quận 3",
    responseTime: "Thường phản hồi trong 1 giờ",
    verified: true,
    tone: "#DCD5C8",
  },
  {
    id: "quynh-vu",
    avatar: `/images/pros/quynh-vu.webp`,
    name: "Quỳnh Vũ",
    title: "Stylist tóc",
    categories: ["hair"],
    city: "TP.HCM",
    district: "Quận 1",
    areas: ["Quận 1", "Quận 3", "Quận 7"],
    rating: 4.7,
    reviewCount: 58,
    followers: 740,
    completedJobs: 190,
    yearsExp: 4,
    bio: "Tạo kiểu tóc sự kiện, uốn phồng chân và gội sấy tại nhà. Nhận làm tóc cô dâu, chụp lookbook.",
    tags: ["Nhận làm tại nhà", "Tóc sự kiện"],
    homeService: true,
    responseTime: "Thường phản hồi trong 1 giờ",
    verified: false,
    tone: "#D9CBBF",
  },
  {
    id: "ha-my",
    avatar: `/images/pros/ha-my.webp`,
    name: "Hà My",
    title: "Chuyên viên mi & mày",
    categories: ["lash-brow"],
    city: "Hà Nội",
    district: "Hoàn Kiếm",
    areas: ["Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa"],
    rating: 4.8,
    reviewCount: 88,
    followers: 1500,
    completedJobs: 410,
    yearsExp: 5,
    bio: "Nối mi classic và volume nhẹ, tạo dáng mày theo khuôn mặt. Keo ít kích ứng, test dị ứng trước khi làm.",
    tags: ["Tại studio", "Test dị ứng trước"],
    homeService: false,
    studioAddress: "Phố Hàng Bông, Hoàn Kiếm",
    responseTime: "Thường phản hồi trong 20 phút",
    verified: true,
    tone: "#EAD6D0",
  },
  {
    id: "ngoc-bao",
    avatar: `/images/pros/ngoc-bao.webp`,
    name: "Ngọc Bảo",
    title: "Chuyên viên nail & makeup",
    categories: ["nail", "makeup"],
    city: "Đà Nẵng",
    district: "Hải Châu",
    areas: ["Hải Châu", "Sơn Trà", "Thanh Khê"],
    rating: 4.6,
    reviewCount: 41,
    followers: 520,
    completedJobs: 133,
    yearsExp: 3,
    bio: "Combo nail + makeup nhẹ cho ngày đặc biệt, nhận nhóm bạn và phù dâu.",
    tags: ["Nhận làm tại nhà", "Nhận nhóm"],
    homeService: true,
    responseTime: "Thường phản hồi trong 2 giờ",
    verified: false,
    tone: "#E3CFC9",
  },
]

export const SERVICES: Service[] = [
  // Linh Phạm
  { id: "lp-basic", proId: "linh-pham", category: "nail", name: "Nail basic", description: "Làm sạch, tạo form, sơn gel trơn", durationMin: 60, price: 250000 },
  { id: "lp-design", proId: "linh-pham", category: "nail", name: "Nail design", description: "Thiết kế theo yêu cầu, milky, ombre, đính đá nhẹ", durationMin: 90, price: 350000 },
  { id: "lp-remove", proId: "linh-pham", category: "nail", name: "Tháo gel", description: "Tháo gel, chăm sóc móng", durationMin: 30, price: 100000 },
  { id: "lp-care", proId: "linh-pham", category: "nail", name: "Combo chăm sóc móng", description: "Làm sạch, dưỡng, sơn gel lại", durationMin: 75, price: 300000 },
  // Thu Anh
  { id: "ta-party", proId: "thu-anh", category: "makeup", name: "Makeup đi tiệc", description: "Makeup trong trẻo, bền 8 tiếng, kèm mi giả", durationMin: 120, price: 600000 },
  { id: "ta-photo", proId: "thu-anh", category: "makeup", name: "Makeup chụp ảnh", description: "Layout theo concept, tone ảnh", durationMin: 90, price: 500000 },
  { id: "ta-bride", proId: "thu-anh", category: "makeup", name: "Makeup cô dâu", description: "Trang điểm + làm tóc cô dâu, thử trước 1 buổi", durationMin: 180, price: 2500000 },
  // Mai Trần
  { id: "mt-facial", proId: "mai-tran", category: "skincare", name: "Facial thư giãn", description: "Làm sạch, massage, đắp mặt nạ", durationMin: 60, price: 350000 },
  { id: "mt-deep", proId: "mai-tran", category: "skincare", name: "Làm sạch sâu", description: "Lấy nhân mụn chuẩn y khoa, điện di dưỡng", durationMin: 90, price: 450000 },
  { id: "mt-recover", proId: "mai-tran", category: "skincare", name: "Phục hồi da", description: "Liệu trình dịu da cho da nhạy cảm", durationMin: 75, price: 400000 },
  // Quỳnh Vũ
  { id: "qv-style", proId: "quynh-vu", category: "hair", name: "Tạo kiểu tóc sự kiện", description: "Uốn lọn, búi, tết theo trang phục", durationMin: 60, price: 300000 },
  { id: "qv-wash", proId: "quynh-vu", category: "hair", name: "Gội sấy tạo kiểu", description: "Gội dưỡng, sấy phồng", durationMin: 45, price: 180000 },
  { id: "qv-bride", proId: "quynh-vu", category: "hair", name: "Tóc cô dâu", description: "Làm tóc cô dâu, thử trước 1 buổi", durationMin: 120, price: 1200000 },
  // Hà My
  { id: "hm-classic", proId: "ha-my", category: "lash-brow", name: "Nối mi classic", description: "Mi tự nhiên, 1:1", durationMin: 90, price: 350000 },
  { id: "hm-volume", proId: "ha-my", category: "lash-brow", name: "Nối mi volume nhẹ", description: "Dày vừa, không nặng mắt", durationMin: 120, price: 450000 },
  { id: "hm-brow", proId: "ha-my", category: "lash-brow", name: "Tạo dáng mày", description: "Tỉa, định hình theo khuôn mặt", durationMin: 30, price: 120000 },
  // Ngọc Bảo
  { id: "nb-nail", proId: "ngoc-bao", category: "nail", name: "Nail gel trơn", description: "Sơn gel trơn, dưỡng móng", durationMin: 60, price: 200000 },
  { id: "nb-combo", proId: "ngoc-bao", category: "makeup", name: "Combo nail + makeup nhẹ", description: "Cho phù dâu, đi tiệc", durationMin: 150, price: 650000 },
]

export const WORKS: Work[] = [
  { id: "w-milky-stone", proId: "linh-pham", serviceId: "lp-design", category: "nail", title: "Nail milky đính đá nhẹ", description: "Thiết kế tinh tế, phù hợp đi làm, đi tiệc. Có thể tùy chỉnh theo tone da và độ dài móng.", images: [img("nail-milky-1"), img("nail-milky-2")], likes: 256, comments: 12 },
  { id: "w-ombre", proId: "linh-pham", serviceId: "lp-design", category: "nail", title: "Nail ombre hồng", description: "Ombre hồng sữa chuyển nhẹ, form oval mềm.", images: [img("nail-ombre"), img("nail-milky-2")], likes: 188, comments: 9 },
  { id: "w-nude-short", proId: "linh-pham", serviceId: "lp-basic", category: "nail", title: "Móng ngắn tone nude", description: "Form vuông bo ngắn, hợp dân văn phòng gõ phím nhiều.", images: [img("nail-nude-short")], likes: 142, comments: 6 },
  { id: "w-french", proId: "linh-pham", serviceId: "lp-care", category: "nail", title: "Nail French", description: "French đầu móng mảnh, nền hồng trong.", images: [img("nail-french"), img("nail-milky-1")], likes: 97, comments: 4 },
  { id: "w-party-glow", proId: "thu-anh", serviceId: "ta-party", category: "makeup", title: "Makeup trong trẻo đi tiệc", description: "Nền mỏng, má hồng đào, môi căng bóng.", images: [img("makeup-party-1"), img("makeup-party-2")], likes: 412, comments: 31 },
  { id: "w-smoky-soft", proId: "thu-anh", serviceId: "ta-photo", category: "makeup", title: "Mắt khói nâu mềm", description: "Layout chụp ảnh tone nâu ấm, không nặng mắt.", images: [img("makeup-smoky"), img("makeup-party-2")], likes: 305, comments: 18 },
  { id: "w-bride-natural", proId: "thu-anh", serviceId: "ta-bride", category: "makeup", title: "Cô dâu tự nhiên", description: "Nền lì mỏng, bền suốt tiệc cưới ngoài trời.", images: [img("makeup-bride-1"), img("makeup-bride-2")], likes: 520, comments: 44 },
  { id: "w-facial-calm", proId: "mai-tran", serviceId: "mt-recover", category: "skincare", title: "Phục hồi da nhạy cảm", description: "Liệu trình 4 buổi giúp da bớt đỏ, căng ẩm hơn.", images: [img("skin-glow"), img("skin-massage")], likes: 164, comments: 12 },
  { id: "w-deep-clean", proId: "mai-tran", serviceId: "mt-deep", category: "skincare", title: "Làm sạch sâu tại nhà", description: "Set dụng cụ riêng, lấy nhân mụn nhẹ tay.", images: [img("skin-deep"), img("skin-facial")], likes: 131, comments: 7 },
  { id: "w-body-glow", proId: "mai-tran", serviceId: "mt-facial", category: "skincare", title: "Facial thư giãn cuối tuần", description: "Massage mặt 20 phút, mặt nạ dịu da.", images: [img("skin-facial"), img("skin-massage")], likes: 88, comments: 3 },
  { id: "w-event-waves", proId: "quynh-vu", serviceId: "qv-style", category: "hair", title: "Uốn lọn sóng dự tiệc", description: "Lọn to bồng bềnh, giữ nếp cả tối.", images: [img("hair-waves-1"), img("hair-waves-2")], likes: 176, comments: 10 },
  { id: "w-bride-bun", proId: "quynh-vu", serviceId: "qv-bride", category: "hair", title: "Búi thấp cô dâu", description: "Búi thấp mềm, kết hợp phụ kiện ngọc trai.", images: [img("hair-bun-1"), img("hair-bun-2")], likes: 203, comments: 15 },
  { id: "w-classic-lash", proId: "ha-my", serviceId: "hm-classic", category: "lash-brow", title: "Mi classic tự nhiên", description: "Mi mảnh, cong nhẹ, như mi thật.", images: [img("lash-1"), img("lash-2")], likes: 240, comments: 21 },
  { id: "w-brow-shape", proId: "ha-my", serviceId: "hm-brow", category: "lash-brow", title: "Dáng mày ngang mềm", description: "Mày ngang trẻ trung theo khuôn mặt tròn.", images: [img("brow-1"), img("brow-2")], likes: 158, comments: 8 },
  { id: "w-nb-gel", proId: "ngoc-bao", serviceId: "nb-nail", category: "nail", title: "Gel trơn hồng đất", description: "Tone hồng đất ấm, hợp da ngăm.", images: [img("nail-earth")], likes: 64, comments: 2 },
  { id: "w-nb-combo", proId: "ngoc-bao", serviceId: "nb-combo", category: "makeup", title: "Combo phù dâu", description: "Makeup nhẹ + nail đồng bộ cho nhóm 4 người.", images: [img("makeup-bridesmaid"), img("nail-earth")], likes: 91, comments: 5 },
]

export const REVIEWS: Review[] = [
  { id: "r1", proId: "linh-pham", author: "Ngọc Hân", rating: 5, text: "Làm kỹ, form móng đẹp, đến đúng giờ. Giữ được hơn 3 tuần không bong.", date: "2026-09-02", serviceName: "Nail design" },
  { id: "r2", proId: "linh-pham", author: "Thảo Vy", rating: 5, text: "Tư vấn màu rất có tâm, dụng cụ sạch sẽ.", date: "2026-08-21", serviceName: "Nail basic" },
  { id: "r3", proId: "linh-pham", author: "Minh Châu", rating: 4, text: "Đẹp, nhưng hơi lâu hơn dự kiến 15 phút.", date: "2026-08-10", serviceName: "Combo chăm sóc móng" },
  { id: "r4", proId: "thu-anh", author: "Lan Phương", rating: 5, text: "Makeup trong veo, chụp ảnh lên rất xinh, bền cả tối.", date: "2026-09-05", serviceName: "Makeup đi tiệc" },
  { id: "r5", proId: "thu-anh", author: "Bảo Ngọc", rating: 5, text: "Chị rất nhẹ nhàng, hỏi kỹ về da trước khi làm.", date: "2026-08-28", serviceName: "Makeup chụp ảnh" },
  { id: "r6", proId: "mai-tran", author: "Khánh Linh", rating: 5, text: "Da dịu hẳn sau 2 buổi, không bị đỏ như lúc đi spa.", date: "2026-09-01", serviceName: "Phục hồi da" },
  { id: "r7", proId: "quynh-vu", author: "Hồng Nhung", rating: 5, text: "Tóc giữ nếp tới cuối tiệc cưới.", date: "2026-08-17", serviceName: "Tạo kiểu tóc sự kiện" },
  { id: "r8", proId: "ha-my", author: "Phương Anh", rating: 5, text: "Mi tự nhiên, không cộm, không cay mắt.", date: "2026-09-08", serviceName: "Nối mi classic" },
  { id: "r9", proId: "ngoc-bao", author: "Diệu Linh", rating: 4, text: "Nhóm mình 4 người làm nhanh gọn, giá hợp lý.", date: "2026-08-30", serviceName: "Combo nail + makeup nhẹ" },
]

export const getPro = (id: string) => PROS.find((p) => p.id === id)
export const getWork = (id: string) => WORKS.find((w) => w.id === id)
export const worksByPro = (proId: string) => WORKS.filter((w) => w.proId === proId)
export const reviewsByPro = (proId: string) => REVIEWS.filter((r) => r.proId === proId)
export const minPrice = (services: Service[]) =>
  services.length ? Math.min(...services.map((s) => s.price)) : 0

/** The freelancer profile used by the demo "freelancer" session. */
export const DEMO_PRO_ID = "linh-pham"
