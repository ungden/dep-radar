import type { Metadata } from "next"
import { PageHeader } from "@/components/ui"
import { CATALOG, CATEGORIES } from "@/lib/catalog"
import { COMMISSION_RATE, POLICY } from "@/lib/pricing"
import { TIERS } from "@/lib/trust"
import { formatPrice } from "@/lib/utils"

export const metadata: Metadata = { title: "Chính sách phí & đặt lịch" }

const pct = (n: number) => `${Math.round(n * 100)}%`

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Chính sách phí & đặt lịch" back />
      <p className="rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">Bản demo: chưa có thanh toán thật, dữ liệu chỉ lưu trên trình duyệt của bạn.</p>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-ink-soft">
        <Section title="1. Khách hàng không trả phí nền tảng">
          <p>Khách chỉ trả giá dịch vụ chuyên viên niêm yết, cộng phí di chuyển hoặc phí đặt gấp nếu có. dep360 không cộng thêm bất kỳ phí dịch vụ nào cho khách.</p>
        </Section>

        <Section title="2. Hoa hồng từ freelancer">
          <p>dep360 thu hoa hồng trên giá dịch vụ của mỗi job hoàn thành. Hạng càng cao, hoa hồng càng thấp.</p>
          <table className="mt-3 w-full overflow-hidden rounded-xl bg-surface text-left text-[13px] shadow-[var(--shadow-soft)]">
            <thead className="bg-canvas text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Hạng</th>
                <th className="px-3 py-2 font-medium">Hoa hồng</th>
                <th className="px-3 py-2 font-medium">Điều kiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {TIERS.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2 font-medium text-ink">{t.label}</td>
                  <td className="px-3 py-2 font-semibold text-ink">{pct(COMMISSION_RATE[t.id])}</td>
                  <td className="px-3 py-2">
                    {t.minJobs ? `≥ ${t.minJobs} job, ★ ≥ ${t.minRating}, huỷ ≤ ${pct(t.maxCancellation)}, phản hồi ≥ ${pct(t.minResponse)}` : "Mới tham gia"}
                    {t.requires.length > 1 && `, xác minh: ${t.requires.length} mục`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Không tính hoa hồng trên phí di chuyển và phí đặt gấp: 100% thuộc về freelancer.</li>
            <li>Job khách thanh toán online: dep360 trừ hoa hồng và chuyển phần còn lại cho freelancer sau khi hoàn thành.</li>
            <li>Job khách trả trực tiếp: hoa hồng ghi vào công nợ, tự trừ vào tiền online của kỳ đối soát hằng tuần; nếu không đủ, freelancer chuyển khoản phần còn thiếu.</li>
            <li>Không có phí đăng ký, phí duy trì hay phí đẩy top. Thứ hạng hiển thị chỉ dựa trên chất lượng.</li>
          </ul>
        </Section>

        <Section title="3. Danh mục & khung giá chuẩn">
          <p>
            Tên dịch vụ, nội dung bao gồm, các gói (thời lượng/mức độ) và khung giá do dep360 quy định để khách so sánh công bằng và tránh báo giá tuỳ tiện. Freelancer chỉ chọn dịch vụ
            trong danh mục, chọn gói mình làm và đặt giá trong khung (làm tròn 5.000đ). Một số dịch vụ như makeup cô dâu, lấy nhân mụn, massage bầu cần xác minh tay nghề.
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
            <li>Không cần đặt cọc. Khách chọn thanh toán online toàn bộ (MoMo, ZaloPay, thẻ) hoặc trả trực tiếp cho chuyên viên sau khi làm.</li>
            <li>
              Sau khi khách đặt, freelancer gọi điện xác nhận giờ, địa chỉ, yêu cầu rồi mới nhận job, trong vòng {POLICY.confirmWithinHours} giờ. Quá hạn, lịch tự huỷ và tiền online
              (nếu có) được hoàn 100%.
            </li>
            <li>Tiền thanh toán online do dep360 giữ và chỉ chuyển cho freelancer sau khi job hoàn thành.</li>
            <li>
              Khách huỷ trước giờ hẹn từ {POLICY.freeCancelHours} tiếng: miễn phí, hoàn 100%. Huỷ muộn với lịch đã thanh toán online: {pct(POLICY.lateCancelRate)} giá trị chuyển cho
              freelancer để bù thời gian giữ lịch. Khách trả sau huỷ muộn nhiều lần sẽ bị tạm khoá hình thức trả sau.
            </li>
            <li>Freelancer huỷ lịch đã nhận: khách được hoàn 100%, tỉ lệ huỷ của freelancer tăng và có thể bị hạ hạng.</li>
          </ul>
        </Section>

        <Section title="7. Đánh giá & xếp hạng">
          <ul className="list-disc space-y-1 pl-5">
            <li>Chỉ khách có lịch hẹn hoàn thành mới được đánh giá: sao tổng và 4 tiêu chí tay nghề, đúng giờ, vệ sinh, thái độ.</li>
            <li>Freelancer không thể xoá hay sửa đánh giá, chỉ được phản hồi công khai.</li>
            <li>
              Thứ hạng “Phù hợp nhất” dùng điểm đánh giá có trọng số (tránh trường hợp vài đánh giá 5★), tỉ lệ huỷ, đúng giờ, phản hồi, khách quay lại, kinh nghiệm và mức xác minh.
              Freelancer mới được ưu tiên hiển thị nhẹ để có cơ hội nhận job đầu tiên.
            </li>
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
