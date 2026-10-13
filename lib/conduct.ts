import type { CategoryId } from "./types"

/**
 * What 360đẹp is for, said the same way on the web and in the app (apps/mobile
 * reads this file through @shared). The binding text is the Quy chế, section IX
 * (app/quy-che); these are the short versions shown where people decide:
 * a service page, the booking and request forms, the chat, the partner's
 * agreement before their profile goes to review.
 */

/**
 * Where "chỉ dịch vụ lành mạnh" is worth saying: services that get disguised
 * (massage) or asked to go too far (models). On makeup, nail or a photo shoot
 * the warning would read as an accusation (owner, 13/10/2026).
 */
export const CONDUCT_CATEGORIES: readonly CategoryId[] = ["massage", "model-photo", "model-video"]
export const needsConductNote = (category: CategoryId | null | undefined) => Boolean(category && CONDUCT_CATEGORIES.includes(category))

export const CONDUCT = {
  title: "Chỉ dịch vụ lành mạnh, đúng pháp luật",
  short:
    "360đẹp chỉ kết nối dịch vụ làm đẹp, chụp ảnh và người mẫu lành mạnh, tuân thủ pháp luật Việt Nam. Không nhận và không cung cấp dịch vụ ngoài lề.",
  rules: [
    "Không dịch vụ ngoài lề, gợi dục hay trá hình dưới tên massage, chăm sóc da, chụp ảnh, người mẫu.",
    "Không nội dung khoả thân, khiêu dâm hay nhạy cảm; không phục vụ người dưới 18 tuổi trái quy định.",
    "Không dịch vụ pháp luật cấm hoặc cần giấy phép mà người làm không có.",
    "Vi phạm bị khoá tài khoản ngay; 360đẹp cung cấp thông tin cho cơ quan chức năng khi pháp luật yêu cầu.",
  ],
  /** The footer, on every page: neutral, true for every trade. */
  footer: "Mọi dịch vụ trên 360đẹp phải đúng mô tả và tuân thủ pháp luật Việt Nam.",
  /** For the customer when an offer crosses the line. */
  report: "Gặp đề nghị như vậy, hãy từ chối và bấm Báo cáo.",
} as const

/** For the partner, ticked before their profile is sent for review. */
export const PARTNER_PLEDGE = "Tôi cam kết cung cấp dịch vụ đúng mô tả và tuân thủ pháp luật Việt Nam."

export const CHAT_NOTICE = {
  title: "Trao đổi trong 360đẹp để được hỗ trợ",
  text:
    "Hãy chốt giờ, địa chỉ, dịch vụ và giá ngay trong tin nhắn này. Thoả thuận qua Zalo, Facebook, điện thoại hay ngoài ứng dụng không được 360đẹp ghi nhận, nên chúng tôi không thể hỗ trợ khi có tranh chấp.",
  points: [
    "Trả đúng tổng tiền ghi trong lịch hẹn, sau khi làm xong. Không chuyển tiền trước, không đặt cọc.",
    "Không gửi mật khẩu, mã OTP hay thông tin thẻ.",
    "Gặp đề nghị khiến bạn không thoải mái hay trái pháp luật: từ chối và bấm Báo cáo.",
  ],
} as const

const OFF_APP = /\b(zalo|za lo|facebook|fb\.com|messenger|telegram|tele|instagram|insta|viber|whatsapp)\b|m\.me\//i
const MONEY = /(chuyển\s*(khoản|tiền)\s*trước|đặt\s*cọc|\bcọc\b|\bstk\b|số\s*tài\s*khoản|ck\s*trước)/i

/**
 * A gentle note under the box to write in while a message moves the deal out
 * of the app or asks for money up front. It never blocks sending: people may
 * have good reasons, but they should know what 360đẹp can then not stand behind.
 */
export function offAppHint(text: string): string | null {
  if (MONEY.test(text)) return "Không chuyển tiền trước hay đặt cọc: trên 360đẹp, khách trả sau khi làm xong. Khoản chuyển trước không được hỗ trợ khi có tranh chấp."
  if (OFF_APP.test(text)) return "Trao đổi ngoài 360đẹp (Zalo, Facebook…) không được ghi nhận, nên chúng tôi không thể hỗ trợ nếu có sự cố. Hãy chốt mọi thứ ngay tại đây."
  return null
}
