import type { Metadata } from "next"
import { PageHeader } from "@/components/ui"
import { CATALOG, CATEGORIES } from "@/lib/catalog"
import {
  AUTO_COMPLETE_HOURS,
  MASKED,
  MIN_REVIEWS_FOR_AVERAGE,
  NO_SHOW_AFTER_MIN,
  QUESTION_LIMIT,
  REVIEW_WINDOW_DAYS,
} from "@/lib/connection"
import { POLICY } from "@/lib/pricing"
import { formatPrice } from "@/lib/utils"
import { ReferralPolicy } from "./referral-policy"

export const metadata: Metadata = {
  title: "Chính sách phí & đặt lịch",
  description: "Cách 360dep tính giá, phí di chuyển, phí đặt gấp và hoa hồng; quy trình xác nhận, huỷ lịch và đánh giá.",
  alternates: { canonical: "/chinh-sach" },
}

const pct = (n: number) => `${Math.round(n * 100)}%`

/**
 * What a customer needs first (what they pay, how cancelling works, what the
 * badge means, safety) comes before what only people taking bookings need
 * (commission, wallet).
 */
export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Chính sách phí & đặt lịch" back />
      <div className="rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">
        <p className="font-semibold">Đây là bản demo</p>
        <p className="mt-1">
          Nhiều hồ sơ người làm và tác phẩm hiện là dữ liệu mẫu. Lịch hẹn, đánh giá và hồ sơ bạn tạo là dữ liệu thật, lưu trên máy chủ. Những mục ghi “sắp áp dụng” là quy
          định đã chốt nhưng hệ thống chưa tự động thực hiện.
        </p>
      </div>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-ink-soft">
        <Section title="1. Khách hàng không trả phí nền tảng">
          <p>
            Khách chỉ trả giá dịch vụ người làm niêm yết, cộng phí di chuyển hoặc phí đặt gấp nếu có. 360dep không cộng thêm bất kỳ phí dịch vụ nào cho khách, và không cần đặt
            cọc.
          </p>
        </Section>

        <Section title="2. Phí di chuyển">
          <ul className="list-disc space-y-1 pl-5">
            <li>Miễn phí trong {POLICY.freeTravelKm} km đầu tính từ khu vực của người làm.</li>
            <li>
              Từ km thứ {POLICY.freeTravelKm + 1}: {formatPrice(POLICY.travelFeePerKm)}/km, làm tròn lên 5.000đ, tối đa {formatPrice(POLICY.travelFeeCap)}.
            </li>
            <li>Địa chỉ ngoài bán kính người làm đăng ký thì không chọn được làm tại nhà.</li>
            <li>Khách đến studio không mất phí di chuyển.</li>
          </ul>
        </Section>

        <Section title="3. Phí đặt gấp">
          <p>
            Lịch bắt đầu trong vòng {POLICY.urgentWithinHours} giờ kể từ lúc đặt tính thêm {formatPrice(POLICY.urgentFee)} để người làm đặt xe tới kịp. Không nhận lịch bắt đầu
            trong vòng {POLICY.minLeadMinutes} phút.
          </p>
        </Section>

        <Section title="4. Thanh toán, xác nhận & huỷ">
          <ul className="list-disc space-y-1 pl-5">
            <li>Không cần đặt cọc. Hiện tại khách trả trực tiếp cho người làm sau khi làm.</li>
            <li>
              Sau khi khách đặt, người làm gọi điện xác nhận giờ, địa chỉ, yêu cầu rồi mới nhận lịch, trong vòng {POLICY.confirmWithinHours} giờ. Quá hạn, lịch tự huỷ và khung
              giờ được trả lại cho người khác đặt.
            </li>
            <li>Khách huỷ trước giờ hẹn từ {POLICY.freeCancelHours} tiếng: miễn phí.</li>
            <li>Chúng tôi nhắc lịch cho cả hai bên trước 24 giờ và trước 2 giờ.</li>
            <li>
              <b className="text-ink">Sắp áp dụng:</b> huỷ muộn tính {pct(POLICY.lateCancelRate)} giá trị dịch vụ để bù thời gian giữ lịch của người làm; huỷ muộn nhiều lần bị
              hạn chế đặt lịch.
            </li>
            <li>
              Người làm huỷ lịch đã nhận thì khách không mất phí. <b className="text-ink">Sắp áp dụng:</b> huỷ nhiều lần sẽ bị tạm ẩn hồ sơ.
            </li>
          </ul>
        </Section>

        <Section title="5. Xác minh danh tính (tự nguyện)">
          <ul className="list-disc space-y-1 pl-5">
            <li>Người làm chụp CCCD 2 mặt và 1 ảnh selfie. AI đọc CCCD và đối chiếu ảnh chân dung trên thẻ với ảnh selfie.</li>
            <li>Đã xác minh: dấu tick cạnh tên, huy hiệu “Đã xác minh danh tính” và được xếp trước hồ sơ chưa xác minh.</li>
            <li>Ảnh CCCD và selfie chỉ dùng để xác minh, 360dep không lưu lại. Khách không thấy thông tin CCCD.</li>
          </ul>
        </Section>

        <Section title="6. Hoàn thành lịch hẹn & khi có người không đến">
          <ul className="list-disc space-y-1 pl-5">
            <li>Người làm bấm “Đánh dấu hoàn thành” sau buổi làm. Khách cũng tự bấm “Xác nhận đã xong” được, từ giờ hẹn trở đi.</li>
            <li>Không ai bấm: lịch tự hoàn thành {AUTO_COMPLETE_HOURS} giờ sau giờ kết thúc, và cả hai được báo.</li>
            <li>
              Người làm không đến: khách bấm “Người làm không đến” trong chi tiết lịch hẹn, từ {NO_SHOW_AFTER_MIN} phút sau giờ hẹn tới{" "}
              {AUTO_COMPLETE_HOURS} giờ sau giờ kết thúc. Lịch được huỷ về phía người làm, khách không mất phí, không tính hoa hồng, và 360dep nhận
              báo cáo để xem xét. Người làm không đến nhiều lần có thể bị tạm khoá nhận lịch.
            </li>
            <li>
              Người làm báo khách vắng mặt: khách được báo và có 24 giờ để khiếu nại ngay trên trang lịch hẹn. 360dep xem xét trước khi xử lý phí
              di chuyển.
            </li>
          </ul>
        </Section>

        <Section title="7. Đánh giá & xếp hạng">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Chỉ khách có lịch hẹn hoàn thành mới được đánh giá (số sao, tag, nhận xét), trong {REVIEW_WINDOW_DAYS} ngày sau khi hoàn thành. Từ 3
              sao trở xuống, khách chọn ít nhất một điều chưa tốt.
            </li>
            <li>
              Đánh giá hai chiều và “kín”: đánh giá của khách và của người làm chỉ hiện khi cả hai đã viết, hoặc khi hết {REVIEW_WINDOW_DAYS} ngày.
              Không ai đọc được của bên kia trước, nên không ai đánh giá để trả đũa. Trước khi hiện, khách còn sửa được đánh giá của mình; sau đó
              là cố định.
            </li>
            <li>Người làm không thể xoá đánh giá, chỉ trả lời công khai một lần, và khách được báo khi có câu trả lời.</li>
            <li>Điểm trung bình chỉ hiện từ {MIN_REVIEWS_FOR_AVERAGE} đánh giá; trước đó hồ sơ ghi “Mới” và số đánh giá.</li>
            <li>
              Thứ tự “Phù hợp nhất”: người làm đã xác minh danh tính được xếp trước, sau đó theo điểm đánh giá (có trọng số theo số lượt) và số lịch đã làm. Không bán vị trí.
            </li>
            <li>Điểm đánh giá hiển thị được tính từ chính các đánh giá có trên hồ sơ, không nhập tay.</li>
            <li>
              Trang chủ xếp dịch vụ theo số người đang nhận ở khu vực bạn chọn. Hàng “Tác phẩm thật” xếp theo dịch vụ bạn quan tâm, khoảng cách, đánh giá, độ mới và lượt
              lưu/đặt của từng tác phẩm; không ai xuất hiện quá một lần trong sáu thẻ liên tiếp, và người mới được dành chỗ hiển thị. Lượt xem chỉ được đếm theo tác phẩm, không
              gắn với tài khoản của bạn.
            </li>
            <li>
              Sau lịch hoàn thành, người làm cũng đánh giá khách, trong cùng {REVIEW_WINDOW_DAYS} ngày; từ 2 sao trở xuống phải ghi lý do. Đánh giá
              này không sửa được, và người làm khác thấy trước khi nhận lịch.
            </li>
          </ul>
        </Section>

        <Section title="8. Tin nhắn & thông tin liên hệ">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Trước khi đặt lịch, khách hỏi người làm được qua tin nhắn: tối đa {QUESTION_LIMIT} tin cho tới khi người làm trả lời, để không ai bị
              làm phiền.
            </li>
            <li>
              Số điện thoại, email, đường link và tài khoản mạng xã hội trong tin nhắn được ẩn thành “{MASKED}” cho tới khi hai bên có lịch hẹn đã
              xác nhận. Giữ việc hẹn trên 360dep thì cả hai có nhắc lịch, đánh giá và hỗ trợ khi có sự cố.
            </li>
            <li>
              Tin nhắn của một lịch hẹn tự đóng khi không còn gì cần trao đổi: 72 giờ sau khi xong (chụp ảnh, quay clip: sau khi khách nhận file),
              72 giờ sau khi báo vắng mặt, 24 giờ sau khi lịch bị huỷ, từ chối hoặc hết hạn. Lịch sử vẫn đọc được; cần gì thêm thì đặt lịch mới
              hoặc liên hệ hỗ trợ.
            </li>
            <li>Chặn một người trong tin nhắn thì hai bên không nhắn được cho nhau nữa; bỏ chặn được bất cứ lúc nào.</li>
          </ul>
        </Section>

        <Section title="9. An toàn">
          <ul className="list-disc space-y-1 pl-5">
            <li>Số điện thoại của người làm hiện cho bạn sau khi họ nhận lịch; trước đó họ gọi bạn để xác nhận.</li>
            <li>Chia sẻ lịch hẹn cho người thân bằng nút “Chia sẻ lịch hẹn” trong chi tiết lịch.</li>
            <li>Có vấn đề thì bấm “Báo cáo vấn đề” trong chi tiết lịch hẹn. Báo cáo không hiển thị với phía bên kia.</li>
          </ul>
        </Section>

        <Section title="10. Chụp ảnh & quay clip">
          <ul className="list-disc space-y-1 pl-5">
            <li>Mỗi dịch vụ ghi rõ bạn nhận được gì và hạn giao file. Hạn tính từ lúc buổi chụp hoàn thành; quá hạn, hệ thống nhắc người chụp.</li>
            <li>Khi đặt, bạn chọn ảnh dùng cho cá nhân hay kinh doanh, và có cho người làm đăng lại làm tác phẩm hay không. Mặc định là không.</li>
            <li>Clip đăng lên 360dep được xoá thông tin vị trí quay (GPS) trước khi tải lên; ảnh cũng vậy.</li>
            <li>
              Đặt chung một buổi (ví dụ makeup rồi chụp): mỗi người là một lịch hẹn riêng, tự gọi xác nhận và tính giá riêng. Nếu một bên huỷ, bạn được báo để quyết định giữ
              hay huỷ bên còn lại.
            </li>
          </ul>
        </Section>

        <Section title="11. Người mẫu & tuyển mẫu">
          <ul className="list-disc space-y-1 pl-5">
            <li>Mọi tin tuyển mẫu chỉ mở cho tài khoản đã xác minh danh tính. Dịch vụ người mẫu và tin tuyển mẫu có thù lao còn cần đủ 18 tuổi (đọc từ ngày sinh trên CCCD; 360dep chỉ lưu năm sinh).</li>
            <li>Không nhận nội dung nội y, khoả thân, ảnh nhạy cảm hay tương tự; tin vi phạm bị chặn khi đăng và có thể bị khoá hồ sơ.</li>
            <li>Người tuyển mẫu không bao giờ được thu tiền của mẫu (đặt cọc, phí hồ sơ…). Gặp trường hợp này, hãy báo cáo ngay.</li>
            <li>Hồ sơ người mẫu không thu thập số đo cơ thể. Dùng hình ảnh của một người để kinh doanh cần sự đồng ý của người đó.</li>
          </ul>
        </Section>

        <Section title="12. Giới thiệu bạn bè & voucher">
          <ReferralPolicy />
        </Section>

        <Section title="13. Danh mục & khung giá chuẩn">
          <p>
            Tên dịch vụ, nội dung bao gồm, các gói (thời lượng/mức độ) và khung giá do 360dep quy định để khách so sánh công bằng và tránh báo giá tuỳ tiện. Người làm chỉ chọn
            dịch vụ trong danh mục, chọn gói mình làm và đặt giá trong khung (làm tròn 5.000đ).
          </p>
          <p className="mt-2">
            Hiện có {CATALOG.length} dịch vụ thuộc {CATEGORIES.length} danh mục: {CATEGORIES.map((c) => c.label).join(", ")}.
          </p>
        </Section>

        <Section title="14. Dành cho người nhận khách: hoa hồng & ví">
          <p>
            360dep thu <b className="text-ink">{pct(POLICY.commissionRate)}</b> trên giá dịch vụ của mỗi lịch hoàn thành, một mức duy nhất cho mọi người làm. Không có phí đăng
            ký, phí duy trì hay phí đẩy top.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Không tính hoa hồng trên phí di chuyển và phí đặt gấp: 100% thuộc về người làm.</li>
            <li>Khách trả trực tiếp cho người làm (tiền mặt hoặc chuyển khoản). Mỗi lịch hoàn thành tự trừ hoa hồng vào ví của người làm.</li>
            <li>
              Khách dùng voucher 360dep: khách trả bạn ít hơn đúng số tiền voucher, và 360dep cộng số tiền đó vào ví của bạn khi lịch hoàn thành.
              Hoa hồng vẫn tính trên giá dịch vụ như thường.
            </li>
            <li>
              Ví âm quá hạn mức sẽ tạm ngưng nhận lịch mới cho tới khi nạp lại. <b className="text-ink">Sắp áp dụng:</b> nạp ví bằng chuyển khoản VietQR.
            </li>
            <li>
              <b className="text-ink">Sắp áp dụng:</b> khách thanh toán online toàn bộ qua cổng thanh toán.
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
      <h2 className="mb-2 text-[17px] font-bold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  )
}
