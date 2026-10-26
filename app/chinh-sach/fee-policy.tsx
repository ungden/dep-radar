"use client"

import { useApp } from "@/lib/store"

/**
 * How a fee payment reaches the wallet, as it works today: by itself once the
 * bank's webhook is on (platform.bankLinked), otherwise recorded by staff.
 */
export function TopupPolicy() {
  const { platform } = useApp()
  const qr = Boolean(platform.topupBankBin && platform.topupAccountNo)
  return (
    <li>
      Trả phí bằng chuyển khoản{qr ? " (có mã VietQR trong Ví)" : ""}, nội dung ghi đúng mã nạp riêng của mỗi người làm.{" "}
      {platform.bankLinked
        ? "Tiền vào ví tự động khi ngân hàng báo có."
        : "Hiện nhân viên 360dep đối chiếu sao kê và cộng vào ví bằng tay, trong giờ làm việc."}
    </li>
  )
}

/** The policy follows the same live admin setting as the booking form. */
export function StudioBookingPolicy() {
  const { platform } = useApp()
  return <li>{platform.studioBookingOpen
    ? "Có thể chọn đến studio khi đối tác có địa chỉ studio. Khách đến studio không mất phí di chuyển."
    : "Hiện chỉ nhận lịch freelancer đến nhà hoặc địa điểm khách chọn; chưa mở đặt lịch tại studio của người làm."}</li>
}
