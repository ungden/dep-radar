import type { Category, CategoryId, ServiceTemplate, ServiceVariant } from "./types"

export const CATEGORIES: Category[] = [
  { id: "nail", label: "Nail" },
  { id: "makeup", label: "Makeup" },
  { id: "skincare", label: "Chăm sóc da" },
  { id: "hair", label: "Tóc" },
  { id: "lash-brow", label: "Mi & mày" },
  { id: "massage", label: "Massage" },
]

export function categoryLabel(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}

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
    variants: [v("single", "1 người", 60, 400, 900, 550), v("group", "Nhóm (giá mỗi người)", 45, 250, 600, 380)],
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
  // Hair -------------------------------------------------------------------
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

export const getTemplate = (id: string) => CATALOG.find((t) => t.id === id)
export const getVariant = (templateId: string, variantId: string) =>
  getTemplate(templateId)?.variants.find((x) => x.id === variantId)
export const templatesByCategory = (category: CategoryId) => CATALOG.filter((t) => t.category === category)

/** Clamp and round a price into a variant's allowed band (to the nearest 5.000đ). */
export function clampPrice(variant: ServiceVariant, price: number) {
  const rounded = Math.round(price / 5000) * 5000
  return Math.min(variant.maxPrice, Math.max(variant.minPrice, rounded))
}

export function isPriceAllowed(variant: ServiceVariant, price: number) {
  return price >= variant.minPrice && price <= variant.maxPrice && price % 5000 === 0
}
