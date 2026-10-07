import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/ui"
import { CATALOG, CATEGORIES } from "@/lib/catalog"
import { AUTO_COMPLETE_HOURS, MIN_REVIEWS_FOR_AVERAGE, NO_SHOW_AFTER_MIN, REVIEW_WINDOW_DAYS } from "@/lib/connection"
import { POLICY } from "@/lib/pricing"
import { DEMO_DATA_LIVE, IDENTITY_VERIFICATION_OPEN } from "@/lib/launch"
import { formatPrice } from "@/lib/utils"
import { TopupPolicy } from "./fee-policy"
import { ReferralPolicy } from "./referral-policy"

export const metadata: Metadata = {
  title: "Chính sách phí & đặt lịch",
  description: "Cách 360dep tính giá, phí di chuyển, phí đặt gấp và phí dịch vụ; cách khách và người làm được ghép, nhắn tin, huỷ lịch và đánh giá.",
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
      {DEMO_DATA_LIVE && (
        <div className="rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">
          <p className="font-semibold">Đây là bản demo</p>
          <p className="mt-1">
            Nhiều hồ sơ người làm và tác phẩm hiện là dữ liệu mẫu. Lịch hẹn, đánh giá và hồ sơ bạn tạo là dữ liệu thật, lưu trên máy chủ. Những mục ghi “sắp áp dụng” là quy
            định đã chốt nhưng hệ thống chưa tự động thực hiện.
          </p>
        </div>
      )}

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
            Lịch bắt đầu trong vòng {POLICY.urgentWithinHours} giờ kể từ lúc đặt tính thêm {formatPrice(POLICY.urgentFee)} để bù việc người làm phải sắp xếp gấp, áp dụng cả
            khi làm tại studio, và không tính lại nếu sau đó đổi giờ. Không nhận lịch bắt đầu trong vòng {POLICY.minLeadMinutes} phút.
          </p>
        </Section>

        <Section title="4. Đặt lịch, đăng yêu cầu & huỷ">
          <ul className="list-disc space-y-1 pl-5">
            <li>Không cần đặt cọc. Hiện tại khách trả trực tiếp cho người làm sau khi làm.</li>
            <li>
              Khách chọn người làm và đặt lịch: người làm xem giờ, địa chỉ, yêu cầu rồi bấm nhận lịch trong app, trong vòng{" "}
              {POLICY.confirmWithinHours} giờ và không quá giờ hẹn. Lịch đặt từ 21:00 đến 08:00 có hạn nhận tới 10:00 sáng hôm sau, nhưng không muộn hơn 1 giờ trước giờ hẹn.
              Quá hạn, lịch tự hết hạn và khung giờ được trả lại cho người khác đặt.
            </li>
            <li>
              Hoặc khách đăng yêu cầu: khách chọn một trong ba mức giá cho gói và tổng phụ phí tối đa đồng ý. Chỉ đối tác đang niêm yết đúng mức giá, đủ điều kiện và không vượt tổng này mới nhận được. 360dep báo cho mọi người làm phù hợp quanh khách; ai bấm “Nhận việc” trước thì được việc, lịch hẹn được xác
              nhận ngay. Không có báo giá hay trả giá.
            </li>
            <li>
              Khách huỷ được lịch đang chờ hoặc đã xác nhận, trước giờ hẹn. Hiện không thu phí huỷ trong mọi trường hợp. Nên huỷ trước giờ hẹn từ{" "}
              {POLICY.freeCancelHours} tiếng để người làm kịp sắp xếp; tài khoản huỷ sát giờ nhiều lần có thể bị hạn chế. Từ giờ hẹn trở đi không huỷ được.
            </li>
            <li>Chúng tôi nhắc lịch đã xác nhận cho cả hai bên trước 24 giờ và trước 2 giờ.</li>
            <li>
              <b className="text-ink">Khi có thanh toán online:</b> huỷ dưới {POLICY.freeCancelHours} tiếng trước giờ hẹn sẽ tính {pct(POLICY.lateCancelRate)} giá trị dịch vụ
              để bù thời gian giữ lịch của người làm. Quy định này chưa áp dụng.
            </li>
            <li>
              Người làm huỷ lịch đã nhận (trước giờ hẹn) thì khách không mất gì. Người làm huỷ sát giờ nhiều lần có thể bị hạn chế hoặc khoá hồ sơ.
            </li>
            <li>Đổi giờ cần cả hai bên đồng ý trong ứng dụng; giá, phí di chuyển và phí đặt gấp giữ nguyên.</li>
          </ul>
        </Section>

        <Section title="5. Xác minh danh tính (tự nguyện)">
          <ul className="list-disc space-y-1 pl-5">
            {!IDENTITY_VERIFICATION_OPEN && (
              <li>
                <b className="text-ink">Sẽ mở sau:</b> hiện chưa nhận hồ sơ xác minh, nên dấu tick chưa cấp mới và dịch vụ người mẫu, tin tuyển mẫu đang tạm đóng.
              </li>
            )}
            <li>Người làm chụp CCCD 2 mặt và 1 ảnh selfie. AI đọc CCCD và đối chiếu ảnh chân dung trên thẻ với ảnh selfie; trường hợp chưa chắc chắn được nhân viên xem lại.</li>
            <li>Đã xác minh: dấu tick cạnh tên, huy hiệu “Đã xác minh danh tính” và được cộng điểm khi xếp thứ tự hiển thị.</li>
            <li>Ảnh CCCD và selfie chỉ dùng để xác minh, 360dep không lưu lại ảnh. Khách không thấy thông tin CCCD.</li>
          </ul>
        </Section>

        <Section title="6. Hoàn thành lịch hẹn & khi có người không đến">
          <ul className="list-disc space-y-1 pl-5">
            <li>Người làm bấm “Đánh dấu hoàn thành” sau buổi làm. Khách cũng tự bấm “Xác nhận đã xong” được, từ giờ hẹn trở đi.</li>
            <li>Không ai bấm: lịch tự hoàn thành {AUTO_COMPLETE_HOURS} giờ sau giờ kết thúc, và cả hai được báo.</li>
            <li>
              Người làm không đến: khách bấm “Người làm không đến” trong chi tiết lịch hẹn, từ {NO_SHOW_AFTER_MIN} phút sau giờ hẹn tới{" "}
              {AUTO_COMPLETE_HOURS} giờ sau giờ kết thúc, nếu người làm chưa bấm “Bắt đầu” (nút này chỉ mở từ 15 phút trước giờ hẹn). Lịch được huỷ về phía người
              làm, khách không mất phí, không tính phí dịch vụ, và 360dep nhận báo cáo để xem xét. Người làm không đến nhiều lần có thể bị tạm khoá nhận lịch.
              Người làm cho rằng báo cáo sai thì gửi “Báo cáo vấn đề” kèm bằng chứng trong 24 giờ.
            </li>
            <li>
              Người làm báo khách vắng mặt (từ {NO_SHOW_AFTER_MIN} phút sau giờ hẹn): không tính phí dịch vụ. Nếu lịch có phí di chuyển, 360dep (không phải khách) bù cho người
              làm đúng bằng khoản đó, cộng vào ví sau 24 giờ. Khách được báo và có 24 giờ để khiếu nại trên trang lịch hẹn; có khiếu nại thì khoản bù được giữ lại tới khi
              nhân viên xem xét, và cả hai bên được báo kết quả.
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
              Thứ tự “Phù hợp nhất” dựa trên điểm đánh giá (có trọng số theo số lượt), số lịch đã làm và trạng thái xác minh danh tính (được cộng điểm). Không bán vị trí.
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
              Ghép trước, nhắn tin sau: không nhắn tin được từ hồ sơ hay trước khi đặt. Tin nhắn mở khi người làm nhận lịch (hoặc nhận
              việc từ yêu cầu), ngay trong lịch hẹn đó.
            </li>
            <li>Từ lúc đó, ứng dụng hiện số điện thoại của hai bên để gọi khi cần.</li>
            <li>
              Tin nhắn đóng ngay khi lịch hẹn kết thúc: hoàn thành, bị huỷ, bị từ chối, hết hạn hoặc vắng mặt. Lịch sử vẫn đọc được; cần gì
              thêm thì đặt lịch mới hoặc liên hệ hỗ trợ.
            </li>
            <li>
              Chặn một người thì hai bên không nhắn được cho nhau, khách không đặt lịch được với người làm đó và người làm không nhận được yêu cầu của khách đó; bỏ
              chặn được bất cứ lúc nào.
            </li>
            <li>Tin nhắn không lọc số điện thoại hay đường link. Đừng gửi mật khẩu, mã OTP, thông tin thẻ; không đặt cọc hay giao dịch ngoài 360dep.</li>
          </ul>
        </Section>

        <Section title="9. An toàn">
          <ul className="list-disc space-y-1 pl-5">
            <li>Ứng dụng chỉ hiện số điện thoại của hai bên khi người làm đã nhận lịch và lịch chưa kết thúc.</li>
            <li>Chia sẻ lịch hẹn cho người thân bằng nút “Chia sẻ lịch hẹn” trong chi tiết lịch.</li>
            <li>
              Có vấn đề thì bấm “Báo cáo vấn đề” trong chi tiết lịch hẹn. Báo cáo không hiển thị với phía bên kia; đội ngũ được báo ngay và bạn nhận thông báo khi báo
              cáo được xử lý. Riêng “Người làm không đến” và khiếu nại vắng mặt thì bên kia được báo, vì lịch hẹn thay đổi theo.
            </li>
          </ul>
        </Section>

        <Section title="10. Chụp ảnh & quay clip">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Mỗi dịch vụ ghi rõ bạn nhận được gì (số ảnh chỉnh, có ảnh gốc hay không, số lượt sửa) và hạn giao file. Hạn tính từ lúc buổi chụp hoàn thành; quá hạn, hệ
              thống nhắc người chụp và báo cho khách.
            </li>
            <li>
              Khi đặt trực tiếp, bạn chọn ảnh dùng cho cá nhân hay kinh doanh, và có cho người làm đăng lại làm tác phẩm hay không (mặc định là không; đổi được khi lịch
              còn chờ xác nhận). Lịch tạo từ đăng yêu cầu luôn là dùng cá nhân, không đăng lại. Giá đã gồm quyền dùng theo lựa chọn này, không thu thêm.
            </li>
            <li>Clip đăng lên 360dep được xoá thông tin vị trí quay (GPS) trước khi tải lên; ảnh cũng vậy.</li>
            <li>
              Đặt chung một buổi (ví dụ makeup rồi chụp): mỗi người là một lịch hẹn riêng, tự nhận lịch và tính giá riêng. Nếu một bên huỷ, bạn được báo để quyết định giữ
              hay huỷ bên còn lại.
            </li>
          </ul>
        </Section>

        <Section title="11. Người mẫu & tuyển mẫu">
          <ul className="list-disc space-y-1 pl-5">
            {!IDENTITY_VERIFICATION_OPEN && <li><b className="text-ink">Đang tạm đóng</b> cho tới khi mở xác minh danh tính.</li>}
            <li>Mọi tin tuyển mẫu chỉ mở cho tài khoản đã xác minh danh tính. Dịch vụ người mẫu và tin tuyển mẫu có thù lao còn cần đủ 18 tuổi (đọc từ ngày sinh trên CCCD; 360dep chỉ lưu năm sinh).</li>
            <li>Không nhận nội dung nội y, khoả thân, ảnh nhạy cảm hay tương tự; tin vi phạm bị chặn khi đăng và có thể bị khoá hồ sơ.</li>
            <li>Người tuyển mẫu không bao giờ được thu tiền của mẫu (đặt cọc, phí hồ sơ…). Gặp trường hợp này, hãy báo cáo ngay.</li>
            <li>Hồ sơ người mẫu không thu thập số đo cơ thể. Dùng hình ảnh của một người để kinh doanh cần sự đồng ý của người đó.</li>
          </ul>
        </Section>

        <Section title="12. Giới thiệu bạn bè & voucher">
          <ReferralPolicy />
        </Section>

        <Section title="13. Danh mục & mức giá chuẩn">
          <p>
            Tên dịch vụ, nội dung bao gồm, các gói (thời lượng/mức độ) và mức giá do 360dep quy định để khách so sánh công bằng và tránh báo giá tuỳ tiện. Mỗi gói có đúng 3 mức giá (Cơ bản, Chuyên nghiệp, Master). Mức giá là lựa chọn của đối tác, không phải chứng nhận tay nghề. Người làm chỉ chọn dịch vụ trong danh mục, chọn gói mình làm và chọn một mức
            giá có sẵn; không tự nhập giá.
          </p>
          <p className="mt-2">
            Hiện có {CATALOG.length} dịch vụ thuộc {CATEGORIES.length} danh mục: {CATEGORIES.map((c) => c.label).join(", ")}.
          </p>
        </Section>

        <Section title="14. Dành cho người nhận khách: phí dịch vụ & ví">
          <p>
            360dep thu phí dịch vụ <b className="text-ink">{pct(POLICY.commissionRate)}</b> trên giá dịch vụ của mỗi lịch hoàn thành, một mức duy nhất cho mọi người làm. Không
            có phí đăng ký, phí duy trì hay phí đẩy top.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Không tính phí trên phí di chuyển và phí đặt gấp: 100% thuộc về người làm.</li>
            <li>
              Khách trả trực tiếp cho người làm (tiền mặt hoặc chuyển khoản). Hoàn thành lịch chỉ cần một lần bấm; phí dịch vụ tự trừ vào ví
              của người làm ngay lúc đó.
            </li>
            <li>
              Thanh toán phí trước đơn tiếp theo: khi ví còn âm, người làm chưa nhận được lịch mới hay việc mới, và khách chưa đặt được lịch
              với người đó. Trả xong là nhận lại được ngay. Nạp dư để lần sau khỏi chờ.
            </li>
            <TopupPolicy />
            <li>
              Khách dùng voucher 360dep: khách trả bạn ít hơn đúng số tiền voucher, và 360dep cộng số tiền đó vào ví của bạn khi lịch hoàn thành.
              Phí dịch vụ vẫn tính trên giá dịch vụ như thường.
            </li>
            <li>Số dư trong ví hiện chưa rút ra được; số dư dương dùng để trừ phí các lịch sau.</li>
            <li>
              <b className="text-ink">Sắp áp dụng:</b> khách thanh toán online toàn bộ qua cổng thanh toán.
            </li>
          </ul>
        </Section>

        <Section title="15. Tình huống tại buổi hẹn & tranh chấp">
          <p>
            Người làm đến trễ, kết quả không như mong đợi, đòi thêm tiền, làm thêm tại chỗ, dị ứng, hỏng đồ, tranh cãi đã trả tiền hay chưa…: cách xử lý và quy trình khiếu
            nại nằm ở mục VI của{" "}
            <Link href="/quy-che#tinh-huong" className="text-accent underline underline-offset-2">
              Quy chế hoạt động
            </Link>{" "}
            và trong{" "}
            <Link href="/tro-giup" className="text-accent underline underline-offset-2">
              Trợ giúp
            </Link>
            . 360dep không giữ tiền dịch vụ của khách nên không tự hoàn tiền; mọi tranh chấp xử lý qua “Báo cáo vấn đề” dựa trên lịch hẹn và tin nhắn trong ứng dụng.
          </p>
        </Section>

        <Section title="16. Duyệt hồ sơ đối tác">
          <p>
            Hồ sơ đối tác mới được AI kiểm tra trước khi hiện với khách: ảnh tác phẩm có phải ảnh thật của việc đã làm, phần giới thiệu có
            thông tin liên hệ ngoài 360dep hay nội dung không được phép. (Giá không cần duyệt vì đối tác chỉ chọn mức có sẵn.) Bài đăng mới cũng được kiểm tra như vậy; bài không
            đạt bị ẩn và đối tác được báo lý do. Mọi quyết định của AI được ghi lại; nhân viên 360dep xem lại nhật ký và có thể thay đổi
            quyết định.
          </p>
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
