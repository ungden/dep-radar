import { categoryLabel } from "../catalog"
import { CHAT_NOTICE, CONDUCT, CONDUCT_CATEGORIES, PARTNER_PLEDGE, offAppHint } from "../conduct"
import { chatState } from "../connection"
import { POLICY } from "../pricing"

/**
 * docs/QUY_DINH_TRONG_APP.md, written from the code that shows these rules,
 * so the document cannot say something the app does not.
 *
 *   npm run docs:rules        # rewrite the file after changing a rule
 *   tests/rules-doc.test.ts   # fails in CI while the file is stale
 *
 * Pure: no file system, no clock, so the same code gives the same text.
 */

const money = (n: number) => `${n.toLocaleString("vi-VN")}đ`
const pct = (r: number) => `${Math.round(r * 100)}%`
const list = (xs: readonly string[]) => xs.map((x) => `- ${x}`).join("\n")

/** Example messages and the note each one raises under the box to write in. */
const HINT_EXAMPLES = [
  "Kết bạn Zalo với em nha",
  "Inbox Facebook mình nhé",
  "Chị chuyển khoản trước giúp em",
  "Đặt cọc 100k nhé",
  "Gửi em stk",
  "Mình ở tầng 3, chị đến lúc 9 giờ nhé",
]

export function rulesDoc(): string {
  const conductCategories = CONDUCT_CATEGORIES.map(categoryLabel).join(", ")
  const hints = HINT_EXAMPLES.map((text) => {
    const hint = offAppHint(text)
    return `| ${text} | ${hint ?? "(không nhắc)"} |`
  }).join("\n")

  return `<!-- Sinh tự động từ code bởi scripts/gen-rules-doc.ts. Không sửa tay: sửa code rồi chạy \`npm run docs:rules\`. -->

# Quy định và thông báo trong 360đẹp

Tài liệu này liệt kê các quy định và thông báo mà khách và đối tác **thấy trong web và app**. Mọi câu chữ dưới đây được lấy thẳng từ code, nên khi quy định đổi, tài liệu đổi theo.

Văn bản ràng buộc pháp lý là [Quy chế hoạt động](https://www.360dep.vn/quy-che) và [Chính sách phí & đặt lịch](https://www.360dep.vn/chinh-sach).

## 1. Phí và luật đặt lịch

| Quy định | Giá trị |
| --- | --- |
| Phí nền tảng của khách | 0đ, không đặt cọc |
| Hoa hồng (đối tác trả, tính trên giá dịch vụ) | ${pct(POLICY.commissionRate)} |
| Người làm nhận hoặc từ chối lịch trong | ${POLICY.confirmWithinHours} giờ |
| Miễn phí di chuyển | ${POLICY.freeTravelKm} km đầu |
| Phí di chuyển sau đó | ${money(POLICY.travelFeePerKm)}/km, tối đa ${money(POLICY.travelFeeCap)} |
| Phí đặt gấp (bắt đầu trong ${POLICY.urgentWithinHours} giờ tới) | ${money(POLICY.urgentFee)} |
| Đặt sớm nhất trước giờ hẹn | ${POLICY.minLeadMinutes} phút |
| Huỷ miễn phí trước giờ hẹn | ${POLICY.freeCancelHours} giờ |
| Huỷ muộn khi đã trả online: người làm giữ | ${pct(POLICY.lateCancelRate)} |

## 2. Dịch vụ lành mạnh, đúng pháp luật

**Hiện ở đâu:** trang dịch vụ, bước xác nhận đặt lịch và form đăng yêu cầu, **chỉ với các danh mục: ${conductCategories}**. Với các danh mục khác (makeup, nail, tóc, chụp ảnh…) không hiện, vì ở đó lời cảnh báo đọc như một lời nghi ngờ.

**Tiêu đề:** ${CONDUCT.title}

**Nội dung:** ${CONDUCT.short}

**Mở rộng (bấm "Xem quy định"):**

${list(CONDUCT.rules)}

${CONDUCT.report} Kèm liên kết tới Quy chế, mục IX (\`/quy-che#bi-cam\`).

## 3. Tin nhắn

**Thẻ ghim ở đầu mỗi cuộc trò chuyện** (web và app; mở sẵn khi chưa có tin nhắn nào, sau đó thu gọn):

**${CHAT_NOTICE.title}**

${CHAT_NOTICE.text}

${list(CHAT_NOTICE.points)}

**Nhắc khi đang gõ:** khi tin nhắn có dấu hiệu chuyển sang ứng dụng khác hoặc đòi tiền trước, một dòng nhắc hiện ngay trên ô nhập. Dòng nhắc **không chặn** việc gửi.

| Ví dụ tin nhắn | Dòng nhắc hiện ra |
| --- | --- |
${hints}

**Khi nào nhắn được:** cuộc trò chuyện mở khi người làm nhận lịch và đóng khi lịch kết thúc.

- Trước khi nhận: "${chatState("waiting").note}"
- Sau khi kết thúc: "${chatState("closed").note}"

## 4. Đối tác

**Ô đồng ý trước khi gửi hồ sơ duyệt** (web và app): đồng ý Chính sách phí, nhận việc và huỷ lịch, Quy chế, và cam kết:

> ${PARTNER_PLEDGE}

## 5. Chân trang website

> ${CONDUCT.footer}

## Nguồn trong code

| Nội dung | File |
| --- | --- |
| Câu chữ quy định, danh mục cần cảnh báo, nhắc khi gõ | \`lib/conduct.ts\` |
| Phí và luật đặt lịch | \`lib/pricing.ts\` |
| Trạng thái tin nhắn | \`lib/connection.ts\` |
| Hiển thị trên web | \`components/conduct.tsx\` |
| Hiển thị trong app | \`apps/mobile/src/components/conduct.tsx\` |
`
}
