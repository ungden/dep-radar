import type { Metadata } from "next"
import { PageHeader } from "@/components/ui"

export const metadata: Metadata = { title: "Chính sách & hỗ trợ" }

const SECTIONS = [
  {
    title: "Đặt lịch & xác nhận",
    body: [
      "Sau khi bạn gửi yêu cầu đặt lịch, chuyên viên có tối đa 2 giờ để nhận job. Quá thời gian này lịch sẽ tự hủy và bạn được hoàn cọc.",
      "Với yêu cầu đã đăng, bạn chủ động chọn một báo giá. Lịch hẹn được xác nhận ngay khi bạn chọn.",
    ],
  },
  {
    title: "Đặt cọc & thanh toán",
    body: [
      "Khách đặt cọc 30% giá dịch vụ. dep360 giữ tiền cọc và chỉ chuyển cho chuyên viên sau khi lịch hẹn hoàn thành.",
      "Phần còn lại thanh toán trực tiếp cho chuyên viên sau khi làm xong.",
    ],
  },
  {
    title: "Hủy lịch",
    body: [
      "Khách hủy trước giờ hẹn từ 12 tiếng: hoàn 100% cọc.",
      "Khách hủy trong vòng 12 tiếng: tiền cọc được chuyển cho chuyên viên để bù thời gian đã giữ lịch.",
      "Chuyên viên hủy lịch đã nhận: khách được hoàn 100% cọc, hồ sơ chuyên viên bị ghi nhận tỉ lệ hủy.",
    ],
  },
  {
    title: "Dành cho freelancer",
    body: [
      "Tạo hồ sơ, đăng tác phẩm thật và bảng giá. Bạn tự chọn khu vực, khung giờ và bật/tắt nhận job bất cứ lúc nào.",
      "Chỉ khách đã hoàn thành lịch hẹn mới được đánh giá bạn, giúp đánh giá luôn đáng tin.",
    ],
  },
]

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Chính sách & hỗ trợ" back />
      <p className="rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">
        Đây là bản demo: chưa có thanh toán thật, dữ liệu chỉ lưu trên trình duyệt của bạn.
      </p>
      <div className="mt-6 space-y-7">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold">{s.title}</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
              {s.body.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
