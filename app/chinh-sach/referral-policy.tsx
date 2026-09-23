"use client"

import Link from "next/link"
import { useApp } from "@/lib/store"
import { formatPrice } from "@/lib/utils"

/**
 * The referral rules with the amounts the owner set in platform_settings, so
 * the policy never quotes a number the system does not pay.
 */
export function ReferralPolicy() {
  const { platform: p } = useApp()
  if (!p.referralEnabled || (!p.referralCustomerAmount && !p.referralProAmount))
    return <p>Chương trình giới thiệu bạn bè đang tạm dừng. Voucher đã phát vẫn dùng được tới hạn.</p>
  return (
    <ul className="list-disc space-y-1 pl-5">
      <li>
        Mỗi tài khoản có một mã giới thiệu trong trang{" "}
        <Link href="/gioi-thieu" className="text-accent underline underline-offset-2">
          Giới thiệu bạn bè
        </Link>
        . Tài khoản mới nhập mã được một lần, trong 30 ngày đầu và trước khi dùng dịch vụ lần nào. Không có thưởng chỉ vì đăng ký.
      </li>
      <li>
        Bạn bè đặt lịch: khi lịch hẹn đầu tiên từ {formatPrice(p.referralMinTotal)} của họ hoàn thành (với người làm khác người giới thiệu),
        cả hai nhận voucher {formatPrice(p.referralCustomerAmount)}, dùng trong {p.voucherDays} ngày.
      </li>
      <li>
        Bạn bè nhận khách: khi họ xong 3 job cho 3 khách khác nhau, cả hai nhận {formatPrice(p.referralProAmount)}, cộng vào ví nếu là người
        làm, hoặc một voucher cùng giá trị.
      </li>
      <li>
        Mỗi người được giới thiệu chỉ tính một lần, trong 90 ngày kể từ khi nhập mã
        {p.referralMonthlyCap > 0 ? `; mỗi người giới thiệu nhận tối đa ${p.referralMonthlyCap} lượt thưởng một tháng` : ""}.
      </li>
      <li>
        Voucher dùng cho một lịch hẹn từ {formatPrice(p.referralMinTotal)}, chọn trước giờ hẹn. Khách trả người làm ít hơn đúng số tiền voucher;
        360dep trả phần đó cho người làm khi lịch hoàn thành. Lịch bị huỷ thì voucher được trả lại (vẫn giữ hạn cũ).
      </li>
    </ul>
  )
}
