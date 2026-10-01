import type { Category, CategoryId, ServiceTemplate, ServiceVariant, Vertical, VerticalId } from "./types"

export const VERTICALS: Vertical[] = [
  { id: "beauty", label: "Làm đẹp", person: "người làm" },
  { id: "photo", label: "Chụp & quay", person: "người chụp" },
  { id: "model", label: "Người mẫu", person: "mẫu" },
]

export const CATEGORIES: Category[] = [
  { id: "nail", label: "Nail", vertical: "beauty" },
  { id: "makeup", label: "Makeup", vertical: "beauty" },
  { id: "skincare", label: "Chăm sóc da", vertical: "beauty", short: "Skincare" },
  { id: "hair", label: "Tóc", vertical: "beauty" },
  { id: "lash-brow", label: "Mi & mày", vertical: "beauty" },
  { id: "massage", label: "Massage", vertical: "beauty" },
  { id: "photophone", label: "Chụp điện thoại", vertical: "photo", short: "Photophone" },
  { id: "camera", label: "Chụp máy ảnh", vertical: "photo", short: "Máy ảnh" },
  { id: "short-video", label: "Quay clip ngắn", vertical: "photo", short: "Clip ngắn" },
  { id: "product-photo", label: "Chụp sản phẩm", vertical: "photo", short: "Sản phẩm" },
  { id: "model-photo", label: "Mẫu ảnh", vertical: "model" },
  { id: "model-video", label: "Mẫu clip & livestream", vertical: "model", short: "Mẫu clip" },
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

/**
 * Variant helper. `tiers` are the 2–3 prices (thousand VND, ascending) a
 * partner chooses between; the band and the "Tiêu chuẩn" price follow from them.
 */
const v = (id: string, label: string, durationMin: number, tiers: number[]): ServiceVariant => ({
  id,
  label,
  durationMin,
  tiers: tiers.map(k),
  minPrice: k(tiers[0]),
  maxPrice: k(tiers[tiers.length - 1]),
  suggestedPrice: k(tiers.length === 3 ? tiers[1] : tiers[0]),
})

/** A per-head option: price and duration are multiplied by the head count. */
const group = (variant: ServiceVariant, maxQuantity: number): ServiceVariant => ({
  ...variant,
  perPerson: true,
  maxQuantity,
})

const byDuration = (bands: [number, number[]][]) => bands.map(([d, tiers]) => v(`${d}m`, `${d} phút`, d, tiers))

/**
 * The 360đẹp service catalogue. Names, what is included, the options offered and
 * the 2–3 price levels of each option are set by 360đẹp so listings stay
 * comparable and fair. Partners choose which services/options they do and pick
 * one of the levels; they never type a price or invent a service.
 */
export const CATALOG: ServiceTemplate[] = [
  // Nail -----------------------------------------------------------------
  {
    id: "nail-gel",
    category: "nail",
    name: "Sơn gel trơn",
    description: "Làm sạch, tạo form và sơn gel một màu.",
    includes: ["Cắt da, tạo form móng", "Sơn gel 1 màu", "Dưỡng viền móng"],
    variants: [v("hand", "Tay", 45, [120, 160, 220]), v("cat-eye", "Tay · mắt mèo / tráng gương", 50, [140, 180, 240]), v("hand-foot", "Tay + chân", 90, [220, 300, 400])],
  },
  {
    id: "nail-design",
    category: "nail",
    name: "Nail thiết kế",
    description: "Sơn gel kèm thiết kế theo mẫu khách chọn.",
    includes: ["Cắt da, tạo form móng", "Sơn gel nền", "Thiết kế theo mẫu"],
    variants: [
      v("simple", "Ombre / French", 75, [200, 260, 350]),
      v("stone", "Đính đá / charm", 90, [250, 330, 450]),
      v("art", "Vẽ nghệ thuật", 120, [350, 480, 650]),
    ],
  },
  {
    id: "nail-extension",
    category: "nail",
    name: "Nối móng",
    description: "Nối dài móng bằng móng úp hoặc đắp gel.",
    includes: ["Tạo form móng thật", "Nối móng", "Sơn gel 1 màu"],
    variants: [v("tips", "Úp móng", 90, [220, 280, 360]), v("builder", "Đắp gel", 120, [300, 380, 500]), v("gelx", "Móng úp mềm Gel-X", 100, [350, 450, 600])],
  },
  {
    id: "nail-removal",
    category: "nail",
    name: "Tháo gel & dưỡng móng",
    description: "Tháo gel/bột an toàn, không làm mỏng móng.",
    includes: ["Tháo gel bằng dung dịch chuyên dụng", "Dũa lại form", "Dưỡng móng"],
    variants: [v("remove", "Tháo gel", 20, [50, 80]), v("remove-care", "Tháo + dưỡng", 45, [100, 150])],
  },
  {
    id: "nail-pedicure",
    category: "nail",
    name: "Chăm sóc bàn chân (pedicure)",
    description: "Ngâm chân, lấy da chết, cắt da và dưỡng gót.",
    includes: ["Ngâm chân thảo mộc", "Lấy da chết, cắt da", "Dưỡng gót & massage chân"],
    variants: [v("basic", "Cơ bản", 45, [130, 180, 250]), v("deluxe", "Có đắp mặt nạ chân", 75, [220, 280, 350])],
  },
  {
    id: "nail-manicure",
    category: "nail",
    name: "Cắt da, sửa form & sơn thường",
    description: "Chăm sóc móng cơ bản cho khách không dùng gel.",
    includes: ["Cắt da, sửa form móng", "Sơn thường 1 màu", "Dưỡng viền móng"],
    variants: [v("hand", "Tay", 30, [80, 110, 150]), v("hand-foot", "Tay + chân", 60, [150, 200, 260])],
  },
  {
    id: "nail-refill",
    category: "nail",
    name: "Dặm móng nối",
    description: "Dặm phần móng mọc ra và sơn lại cho bộ móng đã nối.",
    includes: ["Dũa, làm sạch phần móng mọc", "Đắp bù gel", "Sơn lại 1 màu"],
    variants: [v("refill", "Dặm móng", 75, [150, 200, 260])],
  },
  // Makeup -----------------------------------------------------------------
  {
    id: "makeup-daily",
    category: "makeup",
    name: "Makeup nhẹ / đi làm",
    description: "Lớp nền mỏng, tự nhiên, phù hợp đi làm, đi học, hẹn hò.",
    includes: ["Làm sạch & dưỡng nền", "Makeup tự nhiên", "Mỹ phẩm của chuyên viên"],
    variants: [v("single", "1 người", 45, [200, 280, 350])],
  },
  {
    id: "makeup-party",
    category: "makeup",
    name: "Makeup dự tiệc",
    description: "Makeup bền màu cho tiệc, sự kiện, kèm mi giả.",
    includes: ["Makeup bền 8 tiếng", "Mi giả", "Tư vấn layout theo trang phục"],
    variants: [v("makeup", "Makeup", 60, [300, 400, 550]), v("makeup-hair", "Makeup + làm tóc", 90, [400, 550, 750])],
  },
  {
    id: "makeup-photo",
    category: "makeup",
    name: "Makeup chụp ảnh / kỷ yếu",
    description: "Layout lên hình theo concept, ánh sáng.",
    includes: ["Layout theo concept", "Mi giả", "Dặm lại 1 lần trong buổi chụp (nếu ở lại)"],
    variants: [v("single", "1 người", 60, [350, 450, 650]), group(v("group", "Nhóm (giá mỗi người)", 45, [200, 250, 300]), 8)],
  },
  {
    id: "makeup-bridal",
    category: "makeup",
    name: "Makeup cô dâu",
    description: "Makeup và làm tóc cô dâu, tư vấn layout trước ngày cưới.",
    includes: ["Tư vấn layout trước ngày cưới", "Makeup + làm tóc cô dâu", "Mi giả, phụ kiện tóc cơ bản"],
    variants: [v("one", "1 lễ (ăn hỏi hoặc cưới)", 120, [1200, 1800, 2800]), v("two", "Trọn gói 2 lễ (2 buổi)", 240, [2200, 3200, 4800]),
      v("fullday", "Theo cô dâu cả ngày (dặm, đổi layout)", 600, [3000, 4500, 6500]),],
  },
  {
    id: "makeup-family",
    category: "makeup",
    name: "Makeup mẹ cô dâu / người nhà / phụ dâu",
    description: "Makeup và làm tóc cho người nhà trong ngày cưới.",
    includes: ["Makeup bền", "Làm tóc đơn giản", "Mi giả"],
    variants: [v("mother", "Mẹ cô dâu / chú rể", 75, [400, 550, 700]), group(v("family", "Người nhà / phụ dâu (giá mỗi người)", 60, [250, 350, 450]), 8)],
  },
  {
    id: "makeup-event",
    category: "makeup",
    name: "Makeup sự kiện / MC / biểu diễn",
    description: "Layout lên đèn sân khấu, lên hình livestream.",
    includes: ["Makeup lên đèn, lên hình", "Làm tóc", "Mi giả"],
    variants: [v("event", "Sự kiện", 90, [500, 700, 1000])],
  },
  {
    id: "makeup-prewedding",
    category: "makeup",
    name: "Makeup chụp ảnh cưới",
    description: "Makeup cô dâu cho buổi chụp ảnh cưới trong studio hoặc ngoại cảnh.",
    includes: ["Makeup + tóc cô dâu", "Đổi layout theo trang phục", "Mi giả"],
    variants: [v("studio", "Chụp trong studio", 120, [700, 1000, 1500]), v("outdoor", "Ngoại cảnh, theo cả buổi", 300, [1000, 1500, 2200])],
  },
  // Skincare ---------------------------------------------------------------
  {
    id: "skin-basic",
    category: "skincare",
    name: "Chăm sóc da cơ bản",
    description: "Làm sạch, tẩy tế bào chết, massage và đắp mặt nạ.",
    includes: ["Soi da", "Làm sạch 2 bước, tẩy tế bào chết", "Massage mặt", "Mặt nạ theo loại da"],
    variants: byDuration([
      [60, [200, 280, 380]],
      [90, [300, 400, 550]],
    ]),
  },
  {
    id: "skin-acne",
    category: "skincare",
    name: "Lấy nhân mụn chuẩn y khoa",
    description: "Lấy nhân mụn vô khuẩn, làm dịu và kháng viêm.",
    includes: ["Soi da", "Lấy nhân mụn bằng dụng cụ vô khuẩn", "Mặt nạ làm dịu"],
    variants: byDuration([
      [60, [220, 300, 420]],
      [90, [300, 420, 550]],
    ]),
  },
  {
    id: "skin-recovery",
    category: "skincare",
    name: "Phục hồi da nhạy cảm",
    description: "Liệu trình dịu nhẹ cho da đỏ, kích ứng, sau treatment.",
    includes: ["Soi da", "Làm sạch dịu nhẹ", "Serum & mặt nạ phục hồi"],
    variants: byDuration([[75, [300, 420, 580]]]),
  },
  {
    id: "skin-wax",
    category: "skincare",
    name: "Waxing",
    description: "Wax lông bằng sáp nóng hoặc sáp hạt, kèm dịu da sau wax.",
    includes: ["Làm sạch vùng wax", "Wax", "Dịu da sau wax"],
    variants: [
      v("underarm", "Nách", 20, [70, 100, 150]),
      v("half-leg", "Nửa chân", 30, [150, 200, 280]),
      v("full-leg", "Cả chân", 45, [250, 330, 450]),
      v("arm", "Cả tay", 30, [180, 240, 300]),
      v("half-arm", "Nửa tay", 20, [120, 160, 220]),
      v("lip", "Mép / ria", 15, [50, 70, 100]),
      v("bikini", "Bikini", 30, [250, 350, 500]),
    ],
  },
  {
    id: "skin-hydration",
    category: "skincare",
    name: "Điện di cấp ẩm / vitamin C",
    description: "Cấp ẩm và làm sáng da bằng điện di, không xâm lấn.",
    includes: ["Làm sạch da", "Điện di tinh chất", "Mặt nạ khoá ẩm"],
    variants: byDuration([[60, [220, 300, 400]]]),
  },
  // Hair -------------------------------------------------------------------
  {
    id: "hair-cut",
    category: "hair",
    name: "Cắt tóc",
    description: "Cắt theo dáng mặt, gội và sấy tạo kiểu.",
    includes: ["Tư vấn dáng tóc", "Cắt & tỉa", "Gội, sấy tạo kiểu"],
    variants: [v("women", "Nữ", 45, [120, 180, 250]), v("men", "Nam", 30, [80, 120, 180])],
  },
  {
    id: "hair-color",
    category: "hair",
    name: "Nhuộm tóc",
    description: "Nhuộm phủ bạc hoặc đổi màu, kèm dưỡng sau nhuộm.",
    includes: ["Test da đầu", "Nhuộm", "Dưỡng phục hồi sau nhuộm"],
    variants: [
      v("roots", "Phủ chân tóc / phủ bạc", 90, [200, 300, 450]),
      v("full", "Nhuộm toàn đầu", 120, [450, 700, 1000]),
      v("bleach", "Tẩy & nhuộm màu sáng", 180, [900, 1300, 1800]),
    ],
    studioOnly: true,
  },
  {
    id: "hair-perm",
    category: "hair",
    name: "Uốn tóc",
    description: "Uốn lạnh hoặc uốn nóng, kèm dưỡng giữ nếp.",
    includes: ["Tư vấn kiểu lọn", "Uốn", "Dưỡng giữ nếp"],
    variants: [v("cold", "Uốn lạnh", 150, [400, 650, 950]), v("hot", "Uốn nóng / setting", 180, [600, 900, 1300])],
    studioOnly: true,
  },
  {
    id: "hair-treatment",
    category: "hair",
    name: "Hấp dầu & phục hồi tóc",
    description: "Phục hồi tóc khô xơ sau tẩy, nhuộm hoặc uốn.",
    includes: ["Gội làm sạch", "Ủ dưỡng chuyên sâu", "Sấy tạo kiểu nhẹ"],
    variants: byDuration([
      [45, [150, 250, 380]],
      [75, [350, 550, 800]],
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
      [45, [130, 180, 250]],
      [60, [180, 240, 300]],
    ]),
    studioOnly: true,
  },
  {
    id: "hair-styling",
    category: "hair",
    name: "Tạo kiểu tóc sự kiện",
    description: "Uốn, búi, tết theo trang phục và dáng mặt.",
    includes: ["Tư vấn kiểu tóc", "Tạo kiểu", "Keo/xịt giữ nếp"],
    variants: [v("curl", "Uốn / duỗi tạo kiểu", 45, [150, 220, 300]), v("updo", "Búi / tết cầu kỳ", 60, [200, 300, 450])],
  },
  {
    id: "hair-bridal",
    category: "hair",
    name: "Làm tóc cô dâu",
    description: "Làm tóc cô dâu có buổi thử trước.",
    includes: ["1 buổi thử tóc", "Tạo kiểu & cài phụ kiện", "Giữ nếp suốt lễ"],
    variants: [v("one", "1 lễ", 120, [800, 1200, 1800])],
  },
  {
    id: "hair-straighten",
    category: "hair",
    name: "Duỗi / ép tóc",
    description: "Duỗi thẳng tự nhiên hoặc duỗi phồng chân tóc, kèm dưỡng giữ nếp.",
    includes: ["Tư vấn độ thẳng", "Duỗi dập thuốc", "Dưỡng giữ nếp"],
    variants: [v("bangs", "Duỗi / uốn mái", 30, [100, 150, 200]), v("full", "Duỗi toàn đầu", 150, [450, 700, 1000])],
    studioOnly: true,
  },
  {
    id: "hair-scalp",
    category: "hair",
    name: "Chăm sóc da đầu (gàu, ngứa, rụng tóc)",
    description: "Làm sạch sâu da đầu và ủ tinh chất theo tình trạng.",
    includes: ["Soi da đầu", "Tẩy tế bào chết da đầu", "Ủ tinh chất & massage"],
    variants: byDuration([[50, [150, 220, 300]]]),
    studioOnly: true,
  },
  {
    id: "hair-home-cut",
    category: "hair",
    name: "Cắt tóc tại nhà cho bé & người lớn tuổi",
    description: "Thợ đến nhà cắt gọn, hợp với người ngại ra tiệm.",
    includes: ["Cắt, tỉa theo yêu cầu", "Dọn tóc vụn"],
    variants: [v("kid", "Trẻ em", 20, [60, 80, 120]), v("senior", "Người lớn tuổi", 30, [80, 100, 150])],
  },
  // Lash & brow ------------------------------------------------------------
  {
    id: "lash-lift",
    category: "lash-brow",
    name: "Uốn mi (lash lift)",
    description: "Uốn cong mi thật, không cần nối, giữ 4–6 tuần.",
    includes: ["Test kích ứng", "Uốn mi", "Nhuộm mi (nếu chọn)"],
    variants: [v("lift", "Uốn mi", 60, [180, 250, 350]), v("lift-tint", "Uốn + nhuộm mi", 75, [230, 300, 400])],
  },
  {
    id: "brow-tattoo",
    category: "lash-brow",
    name: "Phun xăm mày",
    description: "Phun sợi hoặc phun bột, có buổi dặm lại sau 1 tháng.",
    includes: ["Test màu & vẽ dáng", "Phun mày", "1 buổi dặm lại trong 45 ngày"],
    variants: [
      v("hairstroke", "Phun sợi", 150, [1500, 2500, 3500]),
      v("powder", "Phun bột / ombre", 150, [1300, 2000, 3000]),
    ],
    studioOnly: true,
  },
  {
    id: "brow-tint",
    category: "lash-brow",
    name: "Nhuộm mày",
    description: "Nhuộm mày cho dáng rõ hơn mà chưa cần phun xăm.",
    includes: ["Tỉa gọn", "Nhuộm mày", "Hướng dẫn giữ màu"],
    variants: [v("tint", "Nhuộm mày", 30, [120, 180, 250])],
  },
  {
    id: "lash-classic",
    category: "lash-brow",
    name: "Nối mi classic",
    description: "Nối mi 1:1 tự nhiên như mi thật.",
    includes: ["Test kích ứng keo", "Nối mi 1:1", "Hướng dẫn chăm sóc mi"],
    variants: [v("full", "Full set", 90, [200, 280, 380])],
    studioOnly: true,
  },
  {
    id: "lash-volume",
    category: "lash-brow",
    name: "Nối mi volume",
    description: "Mi dày vừa, không nặng mắt.",
    includes: ["Test kích ứng keo", "Nối mi volume 2D–4D", "Hướng dẫn chăm sóc mi"],
    variants: [v("full", "Full set", 120, [300, 400, 550])],
    studioOnly: true,
  },
  {
    id: "lash-refill",
    category: "lash-brow",
    name: "Dặm mi",
    description: "Dặm lại mi đã nối trong vòng 3 tuần.",
    includes: ["Làm sạch mi cũ", "Dặm mi rụng"],
    variants: [v("refill", "Dặm mi", 60, [120, 160, 220])],
    studioOnly: true,
  },
  {
    id: "brow-shaping",
    category: "lash-brow",
    name: "Tạo dáng & tỉa mày",
    description: "Đo tỉ lệ và tạo dáng mày theo khuôn mặt.",
    includes: ["Đo tỉ lệ khuôn mặt", "Tỉa, wax lông mày", "Kẻ dáng mày"],
    variants: [v("shape", "Tạo dáng", 30, [80, 120, 180])],
  },
  {
    id: "lash-design",
    category: "lash-brow",
    name: "Nối mi thiết kế (Katun, baby doll, mi thỏ, wispy)",
    description: "Các kiểu mi thiết kế đang thịnh, dày hơn classic.",
    includes: ["Test kích ứng keo", "Nối mi theo mẫu", "Hướng dẫn chăm sóc"],
    variants: [v("full", "Full set", 120, [300, 380, 500])],
    studioOnly: true,
  },
  {
    id: "lash-removal",
    category: "lash-brow",
    name: "Tháo mi nối",
    description: "Tháo mi cũ an toàn bằng dung dịch chuyên dụng.",
    includes: ["Tháo bằng dung dịch chuyên dụng", "Làm sạch mi thật"],
    variants: [v("remove", "Tháo mi", 20, [50, 80])],
  },
  {
    id: "brow-lamination",
    category: "lash-brow",
    name: "Định hình (uốn) chân mày",
    description: "Dựng và định hình sợi mày, giữ 6–8 tuần, không dùng kim.",
    includes: ["Tỉa gọn", "Uốn định hình", "Nhuộm mày nếu cần"],
    variants: [v("lamination", "Định hình mày", 60, [300, 450, 600])],
  },
  // Massage ----------------------------------------------------------------
  {
    id: "massage-foot",
    category: "massage",
    name: "Massage chân",
    description: "Ngâm chân thảo mộc và bấm huyệt bàn chân, bắp chân.",
    includes: ["Ngâm chân thảo mộc", "Bấm huyệt bàn chân", "Massage bắp chân"],
    variants: byDuration([
      [60, [220, 300, 380]],
      [90, [300, 400, 520]],
      [120, [380, 500, 650]],
    ]),
  },
  {
    id: "massage-neck",
    category: "massage",
    name: "Massage cổ vai gáy",
    description: "Giảm căng cứng cổ, vai, gáy cho dân văn phòng.",
    includes: ["Chườm nóng", "Massage cổ vai gáy", "Bấm huyệt đầu"],
    variants: byDuration([
      [60, [250, 330, 420]],
      [90, [350, 450, 580]],
      [120, [450, 580, 720]],
    ]),
  },
  {
    id: "massage-oil-cupping",
    category: "massage",
    name: "Massage dầu + giác hơi",
    description: "Massage body với tinh dầu, kết hợp giác hơi lưng.",
    includes: ["Massage body tinh dầu", "Giác hơi lưng", "Khăn nóng"],
    variants: byDuration([
      [60, [300, 380, 480]],
      [90, [420, 520, 650]],
      [120, [520, 650, 800]],
    ]),
  },
  {
    id: "massage-prenatal",
    category: "massage",
    name: "Massage bầu",
    description: "Massage an toàn cho mẹ bầu từ tháng thứ 4.",
    includes: ["Tư thế nằm nghiêng an toàn", "Dầu massage lành tính", "Giảm đau lưng, phù chân"],
    variants: byDuration([
      [60, [350, 450, 550]],
      [90, [450, 550, 700]],
    ]),
  },
  {
    id: "massage-dry",
    category: "massage",
    name: "Massage không dầu",
    description: "Massage body ấn huyệt, không dùng dầu.",
    includes: ["Ấn huyệt toàn thân", "Kéo giãn nhẹ", "Khăn nóng"],
    variants: byDuration([
      [60, [300, 380, 480]],
      [90, [420, 520, 650]],
      [120, [520, 650, 800]],
    ]),
  },
  {
    id: "massage-hot-stone",
    category: "massage",
    name: "Massage đá nóng",
    description: "Massage body tinh dầu kết hợp đá bazan làm ấm, giãn cơ sâu.",
    includes: ["Massage body tinh dầu", "Đá nóng dọc lưng & chân", "Khăn nóng"],
    variants: byDuration([
      [60, [350, 450, 550]],
      [90, [450, 580, 720]],
    ]),
  },
  {
    id: "massage-postnatal",
    category: "massage",
    name: "Massage sau sinh",
    description: "Chăm sóc mẹ sau sinh tại nhà: chườm muối thảo dược, giảm đau lưng.",
    includes: ["Chườm muối thảo dược vùng bụng", "Massage lưng, vai, chân", "Ngâm chân thảo mộc"],
    variants: byDuration([
      [60, [300, 400, 500]],
      [90, [400, 500, 650]],
    ]),
  },
]


/**
 * Photo & video, and models. Like the beauty services above, the price levels
 * come from public price lists of freelancers, salons and studios in Hà Nội and
 * TP.HCM (October 2026): Phổ thông near budget shops and new freelancers,
 * Tiêu chuẩn the common freelance price, Cao cấp mid-to-upper studios.
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
      v("30m", "30 phút · 5 ảnh chỉnh", 30, [120, 150, 200]),
      v("60m", "60 phút · 10–15 ảnh chỉnh", 60, [200, 300, 450]),
      v("90m", "90 phút · 15–20 ảnh chỉnh", 90, [280, 400, 600]),
      v("120m", "2 giờ · 20–25 ảnh chỉnh", 120, [350, 500, 750]),
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
      v("pair-60", "2 người · 60 phút", 60, [300, 400, 550]),
      v("group-90", "3–6 người · 90 phút", 90, [450, 650, 900]),
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
    variants: [v("half", "Nửa ngày", 240, [800, 1200, 1800]), v("full", "Cả ngày", 480, [1500, 2200, 3200])],
  },
  {
    id: "photo-outfit",
    category: "photophone",
    name: "Chụp outfit / feedback quần áo",
    description: "Chụp từng bộ đồ khách tự mặc hoặc của shop, ảnh dọc kiểu mạng xã hội.",
    includes: ["Hướng dẫn tạo dáng theo từng bộ", "Toàn bộ ảnh gốc", "2–3 ảnh chỉnh mỗi bộ"],
    onLocation: true,
    deliverable: "Ảnh gốc + 2–3 ảnh chỉnh mỗi bộ",
    deliveryDays: 2,
    variants: [v("5", "5 bộ · 60 phút", 60, [300, 450, 650]), v("10", "10 bộ · 2 giờ", 120, [500, 800, 1200])],
  },
  {
    id: "photo-party",
    category: "photophone",
    name: "Chụp sinh nhật / tiệc nhỏ",
    description: "Ghi lại buổi tiệc tại nhà, quán cà phê hoặc nhà hàng.",
    includes: ["Chụp khoảnh khắc và ảnh nhóm", "Toàn bộ ảnh gốc", "Ảnh chỉnh màu chọn lọc"],
    onLocation: true,
    deliverable: "Ảnh gốc + ảnh chỉnh chọn lọc",
    deliveryDays: 2,
    variants: [v("60m", "60 phút", 60, [300, 450, 650]), v("120m", "2 giờ", 120, [550, 800, 1200])],
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
      v("60m", "60 phút · 15 ảnh chỉnh", 60, [500, 700, 1000]),
      v("120m", "2 giờ · 30 ảnh chỉnh", 120, [900, 1200, 1800]),
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
    variants: [v("30m", "30 phút · 5 ảnh chỉnh", 30, [250, 350, 500]), v("60m", "60 phút · 10 ảnh chỉnh", 60, [400, 550, 800])],
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
    variants: [v("120m", "2 giờ", 120, [800, 1200, 1800]), v("240m", "4 giờ", 240, [1400, 2000, 3000])],
  },
  {
    id: "photo-family",
    category: "camera",
    name: "Chụp ảnh gia đình",
    description: "Chụp gia đình ngoại cảnh hoặc tại nhà bằng máy ảnh.",
    includes: ["Tư vấn trang phục & địa điểm", "Ảnh gốc chọn lọc", "Ảnh chỉnh da & màu"],
    onLocation: true,
    deliverable: "Ảnh gốc chọn lọc + ảnh chỉnh",
    deliveryDays: 5,
    variants: [v("60m", "60 phút", 60, [700, 1000, 1500]), v("120m", "2 giờ", 120, [1200, 1700, 2500])],
  },
  {
    id: "photo-couple",
    category: "camera",
    name: "Chụp cặp đôi / kỷ niệm",
    description: "Chụp cặp đôi, kỷ niệm ngày yêu (không phải trọn gói ảnh cưới).",
    includes: ["Tư vấn concept", "Chụp bằng máy ảnh", "25 ảnh chỉnh"],
    onLocation: true,
    deliverable: "Ảnh gốc chọn lọc + 25 ảnh chỉnh",
    deliveryDays: 5,
    variants: [v("120m", "2 giờ · 25 ảnh chỉnh", 120, [1000, 1500, 2300])],
  },
  {
    id: "photo-yearbook-group",
    category: "camera",
    name: "Kỷ yếu nhóm bạn / lớp nhỏ",
    description: "Chụp kỷ yếu cho nhóm 5–15 người tại trường hoặc ngoại cảnh.",
    includes: ["Lên concept nhóm", "Ảnh nhóm và ảnh từng người", "Ảnh chỉnh"],
    onLocation: true,
    deliverable: "Ảnh nhóm + ảnh từng người đã chỉnh",
    deliveryDays: 7,
    variants: [group(v("half", "Buổi 3 giờ (giá mỗi người)", 180, [150, 250, 400]), 15)],
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
      v("1", "1 clip", 90, [400, 700, 1200]),
      v("3", "3 clip", 180, [1000, 1800, 3000]),
      v("5", "5 clip", 240, [1500, 2700, 4500]),
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
    variants: [v("120m", "2 giờ", 120, [800, 1200, 2000]), v("240m", "4 giờ", 240, [1400, 2200, 3500])],
  },
  {
    id: "video-talking",
    category: "short-video",
    name: "Quay clip nói trước ống kính",
    description: "Quay một buổi nhiều clip chia sẻ cho kênh cá nhân.",
    includes: ["Gợi ý kịch bản & chủ đề", "Quay một buổi nhiều clip", "Dựng, phụ đề"],
    onLocation: true,
    deliverable: "Clip dọc 9:16 đã dựng, có phụ đề",
    deliveryDays: 5,
    variants: [v("5", "5 clip · 3 giờ", 180, [1200, 2000, 3200]), v("10", "10 clip · 5 giờ", 300, [2000, 3500, 5500])],
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
      v("10", "10 sản phẩm", 60, [400, 700, 1200]),
      v("30", "30 sản phẩm", 150, [1000, 1800, 3000]),
      v("50", "50 sản phẩm", 240, [1500, 2500, 4000]),
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
    variants: [v("10", "10 sản phẩm", 120, [900, 1500, 2500]), v("30", "30 sản phẩm", 240, [2000, 3500, 5500])],
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
    variants: [v("3", "3 clip", 120, [900, 1500, 2400]), v("5", "5 clip", 180, [1400, 2200, 3500])],
  },
  {
    id: "product-flatlay",
    category: "product-photo",
    name: "Chụp quần áo trải sàn / ma-nơ-canh",
    description: "Chụp flatlay hoặc ma-nơ-canh cho shop thời trang online.",
    includes: ["Là phẳng & sắp đặt", "2–3 góc mỗi bộ", "Tách nền, chỉnh màu"],
    onLocation: true,
    deliverable: "2–3 ảnh mỗi bộ",
    deliveryDays: 3,
    variants: [v("10", "10 bộ", 90, [400, 650, 1000]), v("30", "30 bộ", 240, [1000, 1700, 2600])],
  },
  {
    id: "product-food",
    category: "product-photo",
    name: "Chụp món ăn cho menu / app giao đồ ăn",
    description: "Chụp món tại quán cho menu, GrabFood, ShopeeFood.",
    includes: ["Bày món cơ bản", "Chụp tại quán", "Chỉnh màu"],
    onLocation: true,
    deliverable: "1–2 ảnh mỗi món",
    deliveryDays: 3,
    variants: [v("10", "10 món", 120, [600, 1000, 1600]), v("20", "20 món", 180, [1000, 1700, 2800])],
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
      v("60m", "1 giờ", 60, [400, 600, 1000]),
      v("120m", "2 giờ", 120, [700, 1100, 1800]),
      v("240m", "4 giờ", 240, [1300, 2000, 3200]),
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
    variants: [v("60m", "1 giờ", 60, [250, 400, 600]), v("120m", "2 giờ", 120, [450, 700, 1000])],
  },
  {
    id: "model-beauty",
    category: "model-photo",
    name: "Mẫu làm đẹp cho thương hiệu",
    description: "Làm mẫu makeup, tóc, chăm sóc da cho thương hiệu hoặc lớp dạy nghề.",
    includes: ["Làm mẫu theo yêu cầu", "Tạo dáng khi chụp kết quả"],
    onLocation: true,
    requiresVerification: true,
    variants: [v("60m", "1 giờ", 60, [150, 300, 500]), v("120m", "2 giờ", 120, [250, 500, 800])],
  },
  {
    id: "model-outfit",
    category: "model-photo",
    name: "Mẫu mặc thử chụp ảnh (theo số bộ)",
    description: "Mẫu mặc từng bộ của shop cho ảnh sàn thương mại điện tử.",
    includes: ["Thay đồ, tạo dáng từng bộ", "Tự chuẩn bị tóc, makeup đơn giản", "Không gồm người chụp"],
    onLocation: true,
    requiresVerification: true,
    variants: [v("10", "10 bộ", 120, [600, 1000, 1500]), v("20", "20 bộ", 210, [1000, 1700, 2600])],
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
    variants: [v("60m", "1 giờ", 60, [300, 500, 800]), v("120m", "2 giờ", 120, [500, 900, 1400])],
  },
  {
    id: "model-live",
    category: "model-video",
    name: "Mẫu livestream / mặc thử",
    description: "Mặc thử, giới thiệu sản phẩm trong phiên livestream bán hàng.",
    includes: ["Mặc thử & giới thiệu", "Tương tác người xem theo kịch bản"],
    onLocation: true,
    requiresVerification: true,
    variants: [v("120m", "2 giờ", 120, [600, 1000, 1600]), v("240m", "4 giờ", 240, [1100, 1800, 3000])],
  },
  {
    id: "model-tryon",
    category: "model-video",
    name: "Mẫu mặc thử quay clip (theo số bộ)",
    description: "Mẫu mặc thử, xoay dáng và giới thiệu ngắn từng bộ trong clip.",
    includes: ["Mặc thử, xoay dáng từng bộ", "Nói ngắn giới thiệu sản phẩm", "Không gồm người quay"],
    onLocation: true,
    requiresVerification: true,
    variants: [v("10", "10 bộ", 120, [700, 1100, 1700])],
  },
]

CATALOG.push(...PHOTO_AND_MODEL)

export const getTemplate = (id: string) => CATALOG.find((t) => t.id === id)
export const getVariant = (templateId: string, variantId: string) =>
  getTemplate(templateId)?.variants.find((x) => x.id === variantId)
export const templatesByCategory = (category: CategoryId) => CATALOG.filter((t) => t.category === category)
export const templatesByVertical = (vertical: VerticalId) => CATALOG.filter((t) => verticalOf(t.category) === vertical)

/** The names of a variant's price levels, lowest first. */
export function tierLabels(variant: ServiceVariant): string[] {
  return variant.tiers.length === 3 ? ["Phổ thông", "Tiêu chuẩn", "Cao cấp"] : ["Tiêu chuẩn", "Cao cấp"]
}

/** The level closest to a price (ties go to the lower one): for prices set before levels existed. */
export function nearestTier(variant: ServiceVariant, price: number) {
  return variant.tiers.reduce((best, tier) => (Math.abs(tier - price) < Math.abs(best - price) ? tier : best))
}

export function isPriceAllowed(variant: ServiceVariant, price: number) {
  return variant.tiers.includes(price)
}
