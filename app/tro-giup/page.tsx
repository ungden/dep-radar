import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/ui"
import { absoluteUrl } from "@/lib/env"
import { serializeJsonLd } from "@/lib/json-ld"
import { POLICY } from "@/lib/pricing"
import { formatPrice } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Trợ giúp & an toàn",
  description:
    "Câu hỏi thường gặp về đặt lịch, huỷ lịch, phí di chuyển, xác minh danh tính và cách giữ an toàn khi mời chuyên viên tới nhà.",
  alternates: { canonical: "/tro-giup" },
}

const pct = (n: number) => `${Math.round(n * 100)}%`

/**
 * The questions people actually ask before letting a stranger into their home,
 * answered with what the system really does. Everything here is either enforced
 * in the database or marked as not yet in place.
 */
const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Tôi có phải trả phí cho 360dep không?",
    a: (
      <>
        Không. Khách chỉ trả giá dịch vụ chuyên viên niêm yết, cộng phí di chuyển hoặc phí đặt gấp nếu có. 360dep thu{" "}
        {pct(POLICY.commissionRate)} hoa hồng từ phía chuyên viên.
      </>
    ),
  },
  {
    q: "Có cần đặt cọc không?",
    a: (
      <>
        Không. Chuyên viên gọi điện xác nhận trước khi nhận job, và bạn trả trực tiếp sau khi làm. Nếu không ai xác nhận
        trong {POLICY.confirmWithinHours} giờ, lịch tự huỷ và khung giờ được trả lại.
      </>
    ),
  },
  {
    q: "Phí di chuyển tính thế nào?",
    a: (
      <>
        Miễn phí trong {POLICY.freeTravelKm} km đầu, sau đó {formatPrice(POLICY.travelFeePerKm)}/km và tối đa{" "}
        {formatPrice(POLICY.travelFeeCap)}. Khoảng cách tính từ khu vực của chuyên viên tới địa chỉ bạn chọn, và hiện rõ
        trước khi bạn gửi yêu cầu.
      </>
    ),
  },
  {
    q: "Tôi huỷ lịch được không?",
    a: (
      <>
        Được, miễn phí nếu huỷ trước giờ hẹn từ {POLICY.freeCancelHours} tiếng. Huỷ muộn nhiều lần có thể bị hạn chế đặt
        lịch. Chuyên viên huỷ job đã nhận thì bạn không mất gì.
      </>
    ),
  },
  {
    q: "“Đã xác minh danh tính” nghĩa là gì?",
    a: (
      <>
        Chuyên viên tự nguyện gửi ảnh CCCD hai mặt và một ảnh selfie; AI kiểm tra giấy tờ và đối chiếu khuôn mặt. Khi AI
        không đủ chắc chắn, chuyên viên cần gửi lại ảnh rõ hơn. Ảnh không được lưu. Huy hiệu thể hiện kiểm tra bằng AI,
        không phải xác minh trực tiếp bởi con người.
      </>
    ),
  },
  {
    q: "Đánh giá có thật không?",
    a: (
      <>
        Chỉ khách đã hoàn thành lịch hẹn qua 360dep mới đánh giá được — điều này do database bắt buộc, không phải quy
        ước. Chuyên viên không xoá hay sửa được đánh giá, chỉ phản hồi công khai.
      </>
    ),
  },
  {
    q: "Làm sao để an toàn khi mời người lạ tới nhà?",
    a: (
      <ul className="mt-1 list-disc space-y-1 pl-5">
        <li>Xem hồ sơ, tác phẩm và đánh giá trước khi đặt. Ưu tiên hồ sơ đã xác minh danh tính.</li>
        <li>Chia sẻ lịch hẹn cho người thân bằng nút “Chia sẻ lịch hẹn” trong chi tiết lịch.</li>
        <li>Hẹn giờ có người khác ở nhà nếu bạn thấy an tâm hơn.</li>
        <li>Trao đổi qua tin nhắn trong app để có lịch sử; đừng gửi thông tin thanh toán qua tin nhắn.</li>
        <li>
          Có vấn đề thì bấm “Báo cáo vấn đề” trong chi tiết lịch hẹn. Báo cáo của bạn không hiển thị với phía bên kia.
        </li>
      </ul>
    ),
  },
  {
    q: "Tôi muốn xoá tài khoản và dữ liệu của tôi",
    a: (
      <>
        Vào{" "}
        <Link href="/me/cai-dat" className="text-accent underline underline-offset-2">
          Cài đặt tài khoản
        </Link>{" "}
        và bấm xoá. Tên, số điện thoại, địa chỉ, mẫu đã lưu và quyền đăng nhập bị xoá. Các job đã hoàn thành và đánh giá
        vẫn còn nhưng không còn gắn với tên bạn, vì đó cũng là hồ sơ của phía bên kia.
      </>
    ),
  },
  {
    q: "Tôi là chuyên viên, bắt đầu thế nào?",
    a: (
      <>
        <Link href="/login?role=pro" className="text-accent underline underline-offset-2">
          Mở hồ sơ chuyên viên
        </Link>
        , chọn dịch vụ từ danh mục và đặt giá trong khung, thêm giờ làm việc và ít nhất một ảnh tác phẩm. Không có phí
        đăng ký; 360dep chỉ thu hoa hồng khi bạn hoàn thành job.
      </>
    ),
  },
]

const FAQ_JSON_ANSWERS = [
  "Khách trả trực tiếp cho chuyên viên sau khi làm; 360dep thu hoa hồng từ ví của chuyên viên.",
  "Chuyên viên gọi xác nhận trước khi nhận job. Lịch không được xác nhận đúng hạn sẽ tự huỷ.",
  "Miễn phí trong phạm vi đầu, sau đó tính theo khoảng cách và hiện trước khi gửi yêu cầu.",
  "Bạn có thể huỷ lịch; chính sách áp dụng theo thời điểm huỷ và lý do.",
  "Huy hiệu thể hiện kiểm tra giấy tờ bằng AI, không phải xác minh trực tiếp bởi con người.",
  "Chỉ khách đã hoàn thành lịch qua 360dep mới có thể đánh giá.",
  "Xem hồ sơ trước, chia sẻ lịch với người thân và báo cáo vấn đề ngay trong lịch hẹn.",
  "Bạn có thể xoá tài khoản trong Cài đặt; dữ liệu cần giữ cho lịch sử hoàn thành sẽ được ẩn danh.",
  "Chuyên viên cần thêm dịch vụ, giá, giờ làm việc và tác phẩm trước khi mở hồ sơ.",
]

export default function HelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl("/tro-giup"),
    mainEntity: FAQ.map(({ q }, index) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: FAQ_JSON_ANSWERS[index] },
    })),
  }

  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <PageHeader title="Trợ giúp & an toàn" back />

      <dl className="space-y-6 text-sm leading-relaxed text-ink-soft">
        {FAQ.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-semibold text-ink">{q}</dt>
            <dd className="mt-1">{a}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-8 rounded-2xl bg-subtle px-4 py-3 text-[13px] text-accent-dark">
        Chưa tìm được câu trả lời? Nhắn cho chuyên viên trong lịch hẹn, hoặc dùng “Báo cáo vấn đề” để đội ngũ 360dep xem
        giúp bạn. Xem thêm{" "}
        <Link href="/chinh-sach" className="underline underline-offset-2">
          chính sách phí & đặt lịch
        </Link>
        .
      </p>
    </div>
  )
}
