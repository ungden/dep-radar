import type { Metadata } from "next"
import { PageHeader } from "@/components/ui"
import { CATALOG, CATEGORIES } from "@/lib/catalog"
import { POLICY } from "@/lib/pricing"
import { formatPrice } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Chính sách phí & đặt lịch",
  description: "Cách dep360 tính giá, phí di chuyển, phí đặt gấp và hoa hồng; quy trình xác nhận, huỷ lịch và đánh giá.",
  alternates: { canonical: "/chinh-sach" },
}

const pct = (n: number) => `${Math.round(n * 100)}%`

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Chính sách phí & đặt lịch" back />
      <div className="rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">
        <p className="font-semibold">Đây là bản demo</p>
        <p className="mt-1">
          Chuyên viên, tác phẩm và lịch hẹn là dữ liệu mẫu. Dữ liệu bạn tạo chỉ lưu trên trình duyệt này. Những mục ghi “sắp áp dụng” là quy định đã chốt nhưng hệ thống
          chưa tự động thực hiện.
        </p>
      </div>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-ink-soft">
        <Section title="1. Khách hàng không trả phí nền tảng">
          <p>Khách chỉ trả giá dịch vụ chuyên viên niêm yết, cộng phí di chuyển hoặc phí đặt gấp nếu có. dep360 không cộng thêm bất kỳ phí dịch vụ nào cho khách.</p>
        </Section>

        <Section title="2. Hoa hồng từ freelancer">
          <p>
            dep360 thu <b className="text-ink">{pct(POLICY.commissionRate)}</b> trên giá dịch vụ của mỗi job hoàn thành, một mức duy nhất cho mọi freelancer. Không có phí đăng ký, phí duy trì
            hay phí đẩy top.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Không tính hoa hồng trên phí di chuyển và phí đặt gấp: 100% thuộc về freelancer.</li>
            <li>Khách trả trực tiếp cho freelancer (tiền mặt hoặc chuyển khoản). Hoa hồng được ghi nhận theo từng job hoàn thành.</li>
            <li><b className="text-ink">Sắp áp dụng:</b> ví trả trước cho freelancer, hoa hồng tự trừ vào ví khi hoàn thành job; ví âm quá hạn sẽ tạm ngưng nhận job.</li>
            <li><b className="text-ink">Sắp áp dụng:</b> khách thanh toán online toàn bộ qua cổng thanh toán.</li>
          </ul>
        </Section>

        <Section title="3. Danh mục & khung giá chuẩn">
          <p>
            Tên dịch vụ, nội dung bao gồm, các gói (thời lượng/mức độ) và khung giá do dep360 quy định để khách so sánh công bằng và tránh báo giá tuỳ tiện. Freelancer chỉ chọn dịch vụ
            trong danh mục, chọn gói mình làm và đặt giá trong khung (làm tròn 5.000đ).
          </p>
          <p className="mt-2">
            Hiện có {CATALOG.length} dịch vụ thuộc {CATEGORIES.length} danh mục: {CATEGORIES.map((c) => c.label).join(", ")}.
          </p>
        </Section>

        <Section title="4. Phí di chuyển">
          <ul className="list-disc space-y-1 pl-5">
            <li>Miễn phí trong {POLICY.freeTravelKm} km đầu tính từ khu vực của freelancer.</li>
            <li>
              Từ km thứ {POLICY.freeTravelKm + 1}: {formatPrice(POLICY.travelFeePerKm)}/km, làm tròn lên 5.000đ, tối đa {formatPrice(POLICY.travelFeeCap)}.
            </li>
            <li>Khách đặt ngoài bán kính freelancer đăng ký sẽ không thể chọn làm tại nhà.</li>
            <li>Khách đến studio không mất phí di chuyển.</li>
          </ul>
        </Section>

        <Section title="5. Phí đặt gấp">
          <p>
            Lịch bắt đầu trong vòng {POLICY.urgentWithinHours} giờ kể từ lúc đặt tính thêm {formatPrice(POLICY.urgentFee)} để freelancer đặt xe tới kịp. Không nhận lịch bắt đầu trong vòng{" "}
            {POLICY.minLeadMinutes} phút.
          </p>
        </Section>

        <Section title="6. Thanh toán, xác nhận & huỷ">
          <ul className="list-disc space-y-1 pl-5">
            <li>Không cần đặt cọc. Hiện tại khách trả trực tiếp cho chuyên viên sau khi làm.</li>
            <li>
              Sau khi khách đặt, freelancer gọi điện xác nhận giờ, địa chỉ, yêu cầu rồi mới nhận job, trong vòng {POLICY.confirmWithinHours} giờ.{" "}
              <b className="text-ink">Sắp áp dụng:</b> quá hạn thì lịch tự huỷ.
            </li>
            <li>Khách huỷ trước giờ hẹn từ {POLICY.freeCancelHours} tiếng: miễn phí.</li>
            <li>
              <b className="text-ink">Sắp áp dụng:</b> huỷ muộn tính {pct(POLICY.lateCancelRate)} giá trị dịch vụ để bù thời gian giữ lịch của chuyên viên; huỷ muộn nhiều lần bị
              hạn chế đặt lịch.
            </li>
            <li>Freelancer huỷ lịch đã nhận thì khách không mất phí. <b className="text-ink">Sắp áp dụng:</b> huỷ nhiều lần sẽ bị tạm ẩn hồ sơ.</li>
          </ul>
        </Section>

        <Section title="7. Xác minh danh tính (tự nguyện)">
          <ul className="list-disc space-y-1 pl-5">
            <li>Freelancer chụp CCCD 2 mặt và 1 ảnh selfie. AI đọc CCCD và đối chiếu ảnh chân dung trên thẻ với ảnh selfie.</li>
            <li>Đã xác minh: dấu tick cạnh tên, huy hiệu “Đã xác minh danh tính” và được xếp trước hồ sơ chưa xác minh.</li>
            <li>Ảnh CCCD và selfie chỉ dùng để xác minh, dep360 không lưu lại. Khách không thấy thông tin CCCD.</li>
          </ul>
        </Section>

        <Section title="8. Đánh giá & xếp hạng">
          <ul className="list-disc space-y-1 pl-5">
            <li>Chỉ khách có lịch hẹn hoàn thành mới được đánh giá (số sao, tag, nhận xét). Freelancer không thể xoá, chỉ phản hồi công khai.</li>
            <li>Thứ tự “Phù hợp nhất”: freelancer đã xác minh danh tính được xếp trước, sau đó theo điểm đánh giá (có trọng số theo số lượt) và số job. Không bán vị trí.</li>
            <li>Điểm đánh giá hiển thị được tính từ chính các đánh giá có trên hồ sơ, không nhập tay.</li>
          </ul>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  )
}
