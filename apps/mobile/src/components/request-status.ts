import type { MyRequest } from "@/data/requests"
import { colors } from "@/theme"

/** How a customer's request reads in a list and at the top of its page. */
export const REQUEST_STATUS: Record<MyRequest["status"], { label: string; bg: string; fg: string }> = {
  open: { label: "Đang nhận báo giá", bg: colors.accentSoft, fg: colors.accentDark },
  booked: { label: "Đã chốt", bg: colors.successSoft, fg: colors.success },
  closed: { label: "Đã đóng", bg: colors.subtle, fg: colors.inkSoft },
  expired: { label: "Hết hạn", bg: colors.subtle, fg: colors.inkSoft },
}
