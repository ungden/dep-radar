import type { Category, CategoryId, ServiceTemplate, ServiceVariant, Vertical, VerticalId } from "./types"

export const VERTICALS: Vertical[] = [
  { id: "beauty", label: "Làm đẹp", person: "chuyên viên" },
  { id: "photo", label: "Chụp & quay", person: "người chụp" },
  { id: "model", label: "Người mẫu", person: "mẫu" },
]

export const CATEGORIES: Category[] = [
  { id: "nail", label: "Nail", vertical: "beauty" },
  { id: "makeup", label: "Makeup", vertical: "beauty" },
  { id: "skincare", label: "Chăm sóc da", vertical: "beauty" },
  { id: "hair", label: "Tóc", vertical: "beauty" },
  { id: "lash-brow", label: "Mi & mày", vertical: "beauty" },
  { id: "massage", label: "Massage", vertical: "beauty" },
  { id: "photophone", label: "Chụp điện thoại", vertical: "photo" },
  { id: "camera", label: "Chụp máy ảnh", vertical: "photo" },
  { id: "short-video", label: "Quay clip ngắn", vertical: "photo" },
  { id: "product-photo", label: "Chụp sản phẩm", vertical: "photo" },
  { id: "model-photo", label: "Mẫu ảnh", vertical: "model" },
  { id: "model-video", label: "Mẫu clip & livestream", vertical: "model" },
]

export function categoryLabel(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export const verticalOf = (category: CategoryId): VerticalId =>
  CATEGORIES.find((c) => c.id === category)?.vertical ?? "beauty"

export const getVertical = (id: VerticalId) => VERTICALS.find((v) => v.id === id) ?? VERTICALS[0]

export const categoriesOf = (vertical: VerticalId) => CATEGORIES.filter((c) => c.vertical === vertical)

export const isVertical = (value: unknown): value is VerticalId => VERTICALS.some((v) => v.id === value)

const k = (n: number) => n * 1000

/** Variant helper: prices in thousand VND. */
const v = (id: string, label: string, durationMin: number, min: number, max: number, suggested: number): ServiceVariant => ({
  id,
  label,
  durationMin,
  minPrice: k(min),
  maxPrice: k(max),
  suggestedPrice: k(suggested),
})

/** A per-head option: price and duration are multiplied by the head count. */
const group = (variant: ServiceVariant, maxQuantity: number): ServiceVariant => ({
  ...variant,
  perPerson: true,
  maxQuantity,
})

const byDuration = (bands: [number, number, number, number][]) =>
  bands.map(([d, min, max, sug]) => v(`${d}m`, `${d} phút`, d, min, max, sug))

/**
 * The dep360 service catalogue. Names, what is included, the options offered and
 * the allowed price band are set by dep360 so listings stay comparable and fair.
 * Freelancers choose which services/options they do and set a price inside the band.
 */
export const CATALOG: ServiceTemplate[] = [
  // Nail -----------------------------------------------------------------
  {
    id: "nail-gel",
    category: "nail",
    name: "Sơn gel trơn",
    description: "Làm sạch, tạo form và sơn gel một màu.",
    includes: ["Cắt da, tạo form móng", "Sơn gel 1 màu", "Dưỡng viền móng"],
    variants: [v("hand", "Tay", 45, 120, 250, 180), v("hand-foot", "Tay + chân", 90, 220, 450, 320)],
  },
  {
    id: "nail-design",
    category: "nail",
    name: "Nail thiết kế",
    description: "Sơn gel kèm thiết kế theo mẫu khách chọn.",
    includes: ["Cắt da, tạo form móng", "Sơn gel nền", "Thiết kế theo mẫu"],
    variants: [
      v("simple", "Ombre / French", 75, 220, 400, 300),
      v("stone", "Đính đá / charm", 90, 300, 550, 380),
      v("art", "Vẽ nghệ thuật", 120, 400, 800, 520),
    ],
  },
  {
    id: "nail-extension",
    category: "nail",
    name: "Nối móng",
    description: "Nối dài móng bằng móng úp hoặc đắp gel.",
    includes: ["Tạo form móng thật", "Nối móng", "Sơn gel 1 màu"],
    variants: [v("tips", "Úp móng", 90, 250, 450, 320), v("builder", "Đắp gel", 120, 350, 650, 450)],
  },
  {
    id: "nail-removal",
    category: "nail",
    name: "Tháo gel & dưỡng móng",
    description: "Tháo gel/bột an toàn, không làm mỏng móng.",
    includes: ["Tháo gel bằng dung dịch chuyên dụng", "Dũa lại form", "Dưỡng móng"],
    variants: [v("remove", "Tháo gel", 30, 50, 120, 80), v("remove-care", "Tháo + dưỡng", 45, 100, 200, 140)],
  },
  {
    id: "nail-pedicure",
    category: "nail",
    name: "Chăm sóc bàn chân (pedicure)",
    description: "Ngâm chân, lấy da chết, cắt da và dưỡng gót.",
    includes: ["Ngâm chân thảo mộc", "Lấy da chết, cắt da", "Dưỡng gót & massage chân"],
    variants: [v("basic", "Cơ bản", 45, 120, 300, 180), v("deluxe", "Có đắp mặt nạ chân", 75, 220, 500, 320)],
  },
  // Makeup -----------------------------------------------------------------
  {
    id: "makeup-daily",
    category: "makeup",
    name: "Makeup nhẹ / đi làm",
    description: "Lớp nền mỏng, tự nhiên, phù hợp đi làm, đi học, hẹn hò.",
    includes: ["Làm sạch & dưỡng nền", "Makeup tự nhiên", "Mỹ phẩm của chuyên viên"],
    variants: [v("single", "1 người", 45, 250, 500, 350)],
  },
  {
    id: "makeup-party",
    category: "makeup",
    name: "Makeup dự tiệc",
    description: "Makeup bền màu cho tiệc, sự kiện, kèm mi giả.",
    includes: ["Makeup bền 8 tiếng", "Mi giả", "Tư vấn layout theo trang phục"],
    variants: [v("makeup", "Makeup", 60, 400, 900, 600), v("makeup-hair", "Makeup + làm tóc", 90, 600, 1300, 850)],
  },
  {
    id: "makeup-photo",
    category: "makeup",
    name: "Makeup chụp ảnh / kỷ yếu",
    description: "Layout lên hình theo concept, ánh sáng.",
    includes: ["Layout theo concept", "Mi giả", "Dặm lại 1 lần trong buổi chụp (nếu ở lại)"],
    variants: [v("single", "1 người", 60, 400, 900, 550), group(v("group", "Nhóm (giá mỗi người)", 45, 250, 600, 380), 8)],
  },
  {
    id: "makeup-bridal",
    category: "makeup",
    name: "Makeup cô dâu",
    description: "Makeup cô dâu có buổi thử trước.",
    includes: ["1 buổi thử makeup", "Makeup + làm tóc cô dâu", "Mi giả, phụ kiện tóc cơ bản"],
    variants: [v("one", "1 lễ (ăn hỏi hoặc cưới)", 120, 1200, 3500, 2000), v("two", "Trọn gói 2 lễ", 240, 2500, 6000, 3800)],
  },
  // Skincare ---------------------------------------------------------------
  {
    id: "skin-basic",
    category: "skincare",
    name: "Chăm sóc da cơ bản",
    description: "Làm sạch, tẩy tế bào chết, massage và đắp mặt nạ.",
    includes: ["Soi da", "Làm sạch 2 bước, tẩy tế bào chết", "Massage mặt", "Mặt nạ theo loại da"],
    variants: byDuration([
      [60, 250, 500, 350],
      [90, 350, 700, 480],
    ]),
  },
  {
    id: "skin-acne",
    category: "skincare",
    name: "Lấy nhân mụn chuẩn y khoa",
    description: "Lấy nhân mụn vô khuẩn, làm dịu và kháng viêm.",
    includes: ["Soi da", "Lấy nhân mụn bằng dụng cụ vô khuẩn", "Mặt nạ làm dịu"],
    variants: byDuration([
      [60, 300, 600, 420],
      [90, 400, 800, 550],
    ]),
  },
  {
    id: "skin-recovery",
    category: "skincare",
    name: "Phục hồi da nhạy cảm",
    description: "Liệu trình dịu nhẹ cho da đỏ, kích ứng, sau treatment.",
    includes: ["Soi da", "Làm sạch dịu nhẹ", "Serum & mặt nạ phục hồi"],
    variants: byDuration([[75, 350, 700, 450]]),
  },
  {
    id: "skin-wax",
    category: "skincare",
    name: "Waxing",
    description: "Wax lông bằng sáp nóng hoặc sáp hạt, kèm dịu da sau wax.",
    includes: ["Làm sạch vùng wax", "Wax", "Dịu da sau wax"],
    variants: [
      v("underarm", "Nách", 20, 80, 200, 120),
      v("half-leg", "Nửa chân", 30, 120, 300, 180),
      v("full-leg", "Cả chân", 45, 200, 500, 320),
      v("arm", "Tay", 30, 120, 300, 180),
    ],
  },
  // Hair -------------------------------------------------------------------
  {
    id: "hair-cut",
    category: "hair",
    name: "Cắt tóc",
    description: "Cắt theo dáng mặt, gội và sấy tạo kiểu.",
    includes: ["Tư vấn dáng tóc", "Cắt & tỉa", "Gội, sấy tạo kiểu"],
    variants: [v("women", "Nữ", 45, 120, 350, 200), v("men", "Nam", 30, 80, 250, 150)],
  },
  {
    id: "hair-color",
    category: "hair",
    name: "Nhuộm tóc",
    description: "Nhuộm phủ bạc hoặc đổi màu, kèm dưỡng sau nhuộm.",
    includes: ["Test da đầu", "Nhuộm", "Dưỡng phục hồi sau nhuộm"],
    variants: [
      v("roots", "Phủ chân tóc / phủ bạc", 90, 250, 600, 380),
      v("full", "Nhuộm toàn đầu", 120, 400, 1200, 700),
      v("bleach", "Tẩy & nhuộm màu sáng", 180, 700, 2500, 1300),
    ],
    studioOnly: true,
  },
  {
    id: "hair-perm",
    category: "hair",
    name: "Uốn tóc",
    description: "Uốn lạnh hoặc uốn nóng, kèm dưỡng giữ nếp.",
    includes: ["Tư vấn kiểu lọn", "Uốn", "Dưỡng giữ nếp"],
    variants: [v("cold", "Uốn lạnh", 150, 500, 1500, 850), v("hot", "Uốn nóng / setting", 180, 700, 2000, 1100)],
    studioOnly: true,
  },
  {
    id: "hair-treatment",
    category: "hair",
    name: "Hấp dầu & phục hồi tóc",
    description: "Phục hồi tóc khô xơ sau tẩy, nhuộm hoặc uốn.",
    includes: ["Gội làm sạch", "Ủ dưỡng chuyên sâu", "Sấy tạo kiểu nhẹ"],
    variants: byDuration([
      [45, 150, 400, 250],
      [75, 300, 800, 480],
    ]),
    studioOnly: true,
  },
  {
    id: "hair-wash",
    category: "hair",
    name: "Gội đầu dưỡng sinh",
    description: "Gội, massage da đầu và cổ vai, sấy khô.",
    includes: ["Gội 2 lần", "Massage da đầu, cổ vai", "Sấy tạo phồng nhẹ"],
    variants: byDuration([
      [45, 120, 250, 160],
      [60, 150, 300, 200],
    ]),
    studioOnly: true,
  },
  {
    id: "hair-styling",
    category: "hair",
    name: "Tạo kiểu tóc sự kiện",
    description: "Uốn, búi, tết theo trang phục và dáng mặt.",
    includes: ["Tư vấn kiểu tóc", "Tạo kiểu", "Keo/xịt giữ nếp"],
    variants: [v("curl", "Uốn / duỗi tạo kiểu", 45, 200, 450, 300), v("updo", "Búi / tết cầu kỳ", 60, 300, 600, 400)],
  },
  {
    id: "hair-bridal",
    category: "hair",
    name: "Làm tóc cô dâu",
    description: "Làm tóc cô dâu có buổi thử trước.",
    includes: ["1 buổi thử tóc", "Tạo kiểu & cài phụ kiện", "Giữ nếp suốt lễ"],
    variants: [v("one", "1 lễ", 90, 600, 1800, 1000)],
  },
  // Lash & brow ------------------------------------------------------------
  {
    id: "lash-lift",
    category: "lash-brow",
    name: "Uốn mi (lash lift)",
    description: "Uốn cong mi thật, không cần nối, giữ 4–6 tuần.",
    includes: ["Test kích ứng", "Uốn mi", "Nhuộm mi (nếu chọn)"],
    variants: [v("lift", "Uốn mi", 60, 200, 450, 300), v("lift-tint", "Uốn + nhuộm mi", 75, 250, 550, 380)],
  },
  {
    id: "brow-tattoo",
    category: "lash-brow",
    name: "Phun xăm mày",
    description: "Phun sợi hoặc phun bột, có buổi dặm lại sau 1 tháng.",
    includes: ["Test màu & vẽ dáng", "Phun mày", "1 buổi dặm lại trong 45 ngày"],
    variants: [
      v("hairstroke", "Phun sợi", 150, 1500, 5000, 2800),
      v("powder", "Phun bột / ombre", 150, 1500, 5000, 2800),
    ],
    studioOnly: true,
  },
  {
    id: "brow-tint",
    category: "lash-brow",
    name: "Nhuộm mày",
    description: "Nhuộm mày cho dáng rõ hơn mà chưa cần phun xăm.",
    includes: ["Tỉa gọn", "Nhuộm mày", "Hướng dẫn giữ màu"],
    variants: [v("tint", "Nhuộm mày", 30, 100, 250, 150)],
  },
  {
    id: "lash-classic",
    category: "lash-brow",
    name: "Nối mi classic",
    description: "Nối mi 1:1 tự nhiên như mi thật.",
    includes: ["Test kích ứng keo", "Nối mi 1:1", "Hướng dẫn chăm sóc mi"],
    variants: [v("full", "Full set", 90, 250, 500, 350)],
    studioOnly: true,
  },
  {
    id: "lash-volume",
    category: "lash-brow",
    name: "Nối mi volume",
    description: "Mi dày vừa, không nặng mắt.",
    includes: ["Test kích ứng keo", "Nối mi volume 2D–4D", "Hướng dẫn chăm sóc mi"],
    variants: [v("full", "Full set", 120, 350, 700, 450)],
    studioOnly: true,
  },
  {
    id: "lash-refill",
    category: "lash-brow",
    name: "Dặm mi",
    description: "Dặm lại mi đã nối trong vòng 3 tuần.",
    includes: ["Làm sạch mi cũ", "Dặm mi rụng"],
    variants: [v("refill", "Dặm mi", 60, 150, 300, 200)],
    studioOnly: true,
  },
  {
    id: "brow-shaping",
    category: "lash-brow",
    name: "Tạo dáng & tỉa mày",
    description: "Đo tỉ lệ và tạo dáng mày theo khuôn mặt.",
    includes: ["Đo tỉ lệ khuôn mặt", "Tỉa, wax lông mày", "Kẻ dáng mày"],
    variants: [v("shape", "Tạo dáng", 30, 80, 200, 120)],
  },
  // Massage ----------------------------------------------------------------
  {
    id: "massage-foot",
    category: "massage",
    name: "Massage chân",
    description: "Ngâm chân thảo mộc và bấm huyệt bàn chân, bắp chân.",
    includes: ["Ngâm chân thảo mộc", "Bấm huyệt bàn chân", "Massage bắp chân"],
    variants: byDuration([
      [60, 200, 450, 300],
      [90, 280, 600, 420],
      [120, 350, 750, 520],
    ]),
  },
  {
    id: "massage-neck",
    category: "massage",
    name: "Massage cổ vai gáy",
    description: "Giảm căng cứng cổ, vai, gáy cho dân văn phòng.",
    includes: ["Chườm nóng", "Massage cổ vai gáy", "Bấm huyệt đầu"],
    variants: byDuration([
      [60, 200, 450, 300],
      [90, 280, 600, 420],
      [120, 350, 750, 520],
    ]),
  },
  {
    id: "massage-oil-cupping",
    category: "massage",
    name: "Massage dầu + giác hơi",
    description: "Massage body với tinh dầu, kết hợp giác hơi lưng.",
    includes: ["Massage body tinh dầu", "Giác hơi lưng", "Khăn nóng"],
    variants: byDuration([
      [60, 250, 500, 350],
      [90, 350, 700, 480],
      [120, 450, 900, 600],
    ]),
  },
  {
    id: "massage-prenatal",
    category: "massage",
    name: "Massage bầu",
    description: "Massage an toàn cho mẹ bầu từ tháng thứ 4.",
    includes: ["Tư thế nằm nghiêng an toàn", "Dầu massage lành tính", "Giảm đau lưng, phù chân"],
    variants: byDuration([
      [60, 300, 600, 400],
      [90, 400, 800, 550],
    ]),
  },
  {
    id: "massage-dry",
    category: "massage",
    name: "Massage không dầu",
    description: "Massage body ấn huyệt, không dùng dầu.",
    includes: ["Ấn huyệt toàn thân", "Kéo giãn nhẹ", "Khăn nóng"],
    variants: byDuration([
      [60, 250, 500, 350],
      [90, 350, 700, 480],
      [120, 450, 900, 600],
    ]),
  },
]


/**
 * Photo & video, and models. Price bands are a starting point taken from public
 * price lists in Hà Nội and TP.HCM (photophone by the hour, lookbook models by
 * the hour or by outfit); they are meant to be revised after talking to the
 * first 20-30 people who list here.
 */
const PHOTO_AND_MODEL: ServiceTemplate[] = [
  // Chụp điện thoại ------------------------------------------------------
  {
    id: "photo-phone",
    category: "photophone",
    name: "Chụp ảnh bằng điện thoại",
    description: "Chụp dạo, đi cafe, hẹn hò, sinh nhật bằng điện thoại đời mới. Có hướng dẫn tạo dáng.",
    includes: ["Hướng dẫn tạo dáng", "Toàn bộ ảnh gốc", "Ảnh chỉnh màu theo gói"],
    onLocation: true,
    deliverable: "Toàn bộ ảnh gốc + ảnh chỉnh màu",
    deliveryDays: 2,
    variants: [
      v("30m", "30 phút · 10 ảnh chỉnh", 30, 120, 300, 180),
      v("60m", "60 phút · 20 ảnh chỉnh", 60, 200, 500, 300),
      v("90m", "90 phút · 30 ảnh chỉnh", 90, 280, 700, 420),
      v("120m", "2 giờ · 40 ảnh chỉnh", 120, 350, 900, 520),
    ],
  },
  {
    id: "photo-phone-group",
    category: "photophone",
    name: "Chụp đôi / nhóm bạn",
    description: "Chụp cặp đôi, nhóm bạn, gia đình nhỏ bằng điện thoại.",
    includes: ["Hướng dẫn tạo dáng theo nhóm", "Toàn bộ ảnh gốc", "Ảnh chỉnh màu theo gói"],
    onLocation: true,
    deliverable: "Toàn bộ ảnh gốc + ảnh chỉnh màu",
    deliveryDays: 2,
    variants: [
      v("pair-60", "2 người · 60 phút", 60, 250, 600, 380),
      v("group-90", "3–6 người · 90 phút", 90, 400, 1000, 600),
    ],
  },
  {
    id: "photo-tour",
    category: "photophone",
    name: "Photo tour du lịch",
    description: "Đi cùng bạn một buổi ở điểm du lịch, chụp suốt hành trình.",
    includes: ["Lên lịch trình điểm chụp", "Toàn bộ ảnh gốc", "Ảnh chỉnh màu"],
    onLocation: true,
    deliverable: "Toàn bộ ảnh gốc + 50–100 ảnh chỉnh",
    deliveryDays: 4,
    variants: [v("half", "Nửa ngày", 240, 800, 2500, 1300), v("full", "Cả ngày", 480, 1500, 4500, 2500)],
  },
  // Chụp máy ảnh -----------------------------------------------------------
  {
    id: "photo-portrait",
    category: "camera",
    name: "Chụp chân dung máy ảnh",
    description: "Chân dung, áo dài, kỷ yếu, concept cá nhân bằng máy ảnh.",
    includes: ["Tư vấn concept & trang phục", "Chụp máy ảnh", "Ảnh chỉnh da, màu"],
    onLocation: true,
    deliverable: "Ảnh gốc chọn lọc + ảnh chỉnh",
    deliveryDays: 5,
    variants: [
      v("60m", "60 phút · 15 ảnh chỉnh", 60, 400, 1200, 700),
      v("120m", "2 giờ · 30 ảnh chỉnh", 120, 700, 2000, 1200),
    ],
  },
  {
    id: "photo-profile",
    category: "camera",
    name: "Ảnh hồ sơ / CV",
    description: "Ảnh chân dung gọn gàng cho CV, LinkedIn, hồ sơ công ty.",
    includes: ["Hướng dẫn tư thế", "Chụp nền trơn hoặc văn phòng", "Chỉnh da nhẹ"],
    onLocation: true,
    deliverable: "5–10 ảnh chỉnh",
    deliveryDays: 3,
    variants: [v("30m", "30 phút · 5 ảnh chỉnh", 30, 150, 500, 250), v("60m", "60 phút · 10 ảnh chỉnh", 60, 250, 800, 400)],
  },
  {
    id: "photo-event",
    category: "camera",
    name: "Chụp sự kiện nhỏ",
    description: "Sinh nhật, tiệc công ty nhỏ, khai trương, lễ tốt nghiệp.",
    includes: ["Chụp toàn bộ sự kiện", "Ảnh gốc chọn lọc", "Chỉnh màu"],
    onLocation: true,
    deliverable: "Ảnh sự kiện đã chỉnh màu",
    deliveryDays: 5,
    variants: [v("120m", "2 giờ", 120, 600, 2000, 1000), v("240m", "4 giờ", 240, 1000, 3500, 1800)],
  },
  // Quay clip ngắn ---------------------------------------------------------
  {
    id: "video-short",
    category: "short-video",
    name: "Quay & dựng clip ngắn",
    description: "Clip 15–60 giây cho TikTok, Reels: quay, dựng, nhạc, phụ đề.",
    includes: ["Gợi ý kịch bản ngắn", "Quay bằng điện thoại/máy ảnh", "Dựng, chèn nhạc, phụ đề"],
    onLocation: true,
    deliverable: "Clip dọc 9:16 đã dựng",
    deliveryDays: 3,
    variants: [
      v("1", "1 clip", 90, 300, 1500, 600),
      v("3", "3 clip", 180, 800, 3500, 1500),
      v("5", "5 clip", 240, 1200, 5000, 2200),
    ],
  },
  {
    id: "video-event",
    category: "short-video",
    name: "Quay hậu trường / sự kiện",
    description: "Quay lại buổi tiệc, buổi chụp, sự kiện nhỏ và dựng thành clip.",
    includes: ["Quay toàn buổi", "Dựng 1 clip tổng hợp", "Nhạc & chuyển cảnh"],
    onLocation: true,
    deliverable: "1 clip tổng hợp 1–3 phút",
    deliveryDays: 5,
    variants: [v("120m", "2 giờ", 120, 500, 2000, 900), v("240m", "4 giờ", 240, 900, 3500, 1600)],
  },
  // Chụp sản phẩm ----------------------------------------------------------
  {
    id: "product-basic",
    category: "product-photo",
    name: "Chụp sản phẩm nền trơn",
    description: "Ảnh sản phẩm nền trắng/nền màu cho sàn thương mại điện tử.",
    includes: ["Setup nền & ánh sáng", "3 góc mỗi sản phẩm", "Tách nền, chỉnh màu"],
    onLocation: true,
    deliverable: "3 ảnh mỗi sản phẩm",
    deliveryDays: 3,
    variants: [
      v("10", "10 sản phẩm", 60, 200, 800, 400),
      v("30", "30 sản phẩm", 150, 500, 2000, 1000),
      v("50", "50 sản phẩm", 240, 800, 3000, 1500),
    ],
  },
  {
    id: "product-lifestyle",
    category: "product-photo",
    name: "Chụp sản phẩm bối cảnh",
    description: "Sản phẩm đặt trong bối cảnh sử dụng thật, hợp quảng cáo và fanpage.",
    includes: ["Lên concept bối cảnh", "Đạo cụ cơ bản", "Chỉnh màu"],
    onLocation: true,
    deliverable: "2 ảnh bối cảnh mỗi sản phẩm",
    deliveryDays: 4,
    variants: [v("10", "10 sản phẩm", 120, 500, 2000, 900), v("30", "30 sản phẩm", 240, 1200, 4500, 2200)],
  },
  {
    id: "product-video",
    category: "product-photo",
    name: "Quay clip sản phẩm",
    description: "Clip ngắn giới thiệu sản phẩm cho TikTok Shop, Shopee Video.",
    includes: ["Kịch bản ngắn theo sản phẩm", "Quay & dựng dọc 9:16", "Nhạc, phụ đề"],
    onLocation: true,
    deliverable: "Clip dọc đã dựng",
    deliveryDays: 4,
    variants: [v("3", "3 clip", 120, 600, 2500, 1200), v("5", "5 clip", 180, 900, 4000, 1800)],
  },
  // Mẫu ảnh ----------------------------------------------------------------
  {
    id: "model-lookbook",
    category: "model-photo",
    name: "Mẫu chụp lookbook",
    description: "Mặc và tạo dáng cho bộ sưu tập thời trang, ảnh shop online.",
    includes: ["Tạo dáng theo concept", "Thay trang phục của shop", "Không bao gồm makeup & người chụp"],
    onLocation: true,
    requiresVerification: true,
    variants: [
      v("60m", "1 giờ", 60, 300, 1500, 500),
      v("120m", "2 giờ", 120, 550, 2800, 900),
      v("240m", "4 giờ", 240, 1000, 5000, 1700),
    ],
  },
  {
    id: "model-hand",
    category: "model-photo",
    name: "Mẫu tay / cầm sản phẩm",
    description: "Mẫu tay cho nail, trang sức, mỹ phẩm, sản phẩm cầm tay.",
    includes: ["Tay được chăm sóc sẵn", "Tạo dáng tay theo góc máy"],
    onLocation: true,
    requiresVerification: true,
    variants: [v("60m", "1 giờ", 60, 200, 800, 350), v("120m", "2 giờ", 120, 350, 1500, 600)],
  },
  {
    id: "model-beauty",
    category: "model-photo",
    name: "Mẫu làm đẹp cho thương hiệu",
    description: "Làm mẫu makeup, tóc, chăm sóc da cho thương hiệu hoặc lớp dạy nghề.",
    includes: ["Làm mẫu theo yêu cầu", "Tạo dáng khi chụp kết quả"],
    onLocation: true,
    requiresVerification: true,
    variants: [v("60m", "1 giờ", 60, 150, 600, 250), v("120m", "2 giờ", 120, 250, 1000, 450)],
  },
  // Mẫu clip & livestream --------------------------------------------------
  {
    id: "model-clip",
    category: "model-video",
    name: "Diễn viên clip ngắn",
    description: "Diễn clip TikTok, Reels, video giới thiệu sản phẩm theo kịch bản.",
    includes: ["Diễn theo kịch bản", "Nói/ lồng tiếng nếu cần"],
    onLocation: true,
    requiresVerification: true,
    variants: [v("60m", "1 giờ", 60, 300, 1500, 500), v("120m", "2 giờ", 120, 500, 2500, 900)],
  },
  {
    id: "model-live",
    category: "model-video",
    name: "Mẫu livestream / mặc thử",
    description: "Mặc thử, giới thiệu sản phẩm trong phiên livestream bán hàng.",
    includes: ["Mặc thử & giới thiệu", "Tương tác người xem theo kịch bản"],
    onLocation: true,
    requiresVerification: true,
    variants: [v("120m", "2 giờ", 120, 400, 2000, 700), v("240m", "4 giờ", 240, 700, 3500, 1300)],
  },
]

CATALOG.push(...PHOTO_AND_MODEL)

export const getTemplate = (id: string) => CATALOG.find((t) => t.id === id)
export const getVariant = (templateId: string, variantId: string) =>
  getTemplate(templateId)?.variants.find((x) => x.id === variantId)
export const templatesByCategory = (category: CategoryId) => CATALOG.filter((t) => t.category === category)
export const templatesByVertical = (vertical: VerticalId) => CATALOG.filter((t) => verticalOf(t.category) === vertical)

/** Clamp and round a price into a variant's allowed band (to the nearest 5.000đ). */
export function clampPrice(variant: ServiceVariant, price: number) {
  const rounded = Math.round(price / 5000) * 5000
  return Math.min(variant.maxPrice, Math.max(variant.minPrice, rounded))
}

export function isPriceAllowed(variant: ServiceVariant, price: number) {
  return price >= variant.minPrice && price <= variant.maxPrice && price % 5000 === 0
}
