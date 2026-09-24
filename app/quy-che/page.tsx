import type { Metadata } from "next"
import Link from "next/link"
import { CompanyInfo } from "@/components/company-info"
import { PageHeader } from "@/components/ui"
import { AUTO_COMPLETE_HOURS, MIN_REVIEWS_FOR_AVERAGE, NO_SHOW_AFTER_MIN, REVIEW_WINDOW_DAYS } from "@/lib/connection"
import { POLICY } from "@/lib/pricing"
import { formatPrice } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Quy chế hoạt động",
  description:
    "Quy chế hoạt động của nền tảng kết nối 360đẹp: vai trò của các bên, quy trình đặt lịch và thanh toán, bảo vệ thông tin cá nhân, xử lý vi phạm và giải quyết khiếu nại.",
  alternates: { canonical: "/quy-che" },
}

const pct = (n: number) => `${Math.round(n * 100)}%`

/**
 * The operating rules a connecting platform publishes and files with the Ministry
 * of Industry and Trade (Nghị định 52/2013, amended by 85/2021). Every number
 * comes from the same constants the product enforces (lib/pricing.ts,
 * lib/connection.ts), so the rules and the system cannot drift apart; the
 * company block comes from platform_settings. Reviewed by the owner and their
 * legal adviser before it is filed.
 */
export default function OperatingRulesPage() {
  return (
    <div className="mx-auto max-w-2xl pb-10 md:pt-4">
      <PageHeader title="Quy chế hoạt động" back />
      <p className="text-[13px] text-muted">Nền tảng kết nối 360đẹp (www.360dep.vn và ứng dụng 360đẹp) · Phiên bản 1.0, cập nhật ngày 24/09/2026</p>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-ink-soft">
        <Section title="I. Nguyên tắc chung">
          <p>
            360đẹp là nền tảng trung gian kết nối dịch vụ, do công ty có thông tin ở cuối trang này sở hữu và vận hành, hoạt động theo hình thức
            sàn giao dịch thương mại điện tử theo Nghị định 52/2013/NĐ-CP (sửa đổi bởi Nghị định 85/2021/NĐ-CP). 360đẹp kết nối{" "}
            <b className="text-ink">khách hàng</b> có nhu cầu làm đẹp, chụp ảnh, quay clip, làm mẫu với <b className="text-ink">đối tác</b>: các
            cá nhân hành nghề tự do (thợ làm đẹp, người chụp ảnh, người quay, người mẫu) tự đăng ký cung cấp dịch vụ.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              360đẹp không trực tiếp cung cấp dịch vụ và không phải người sử dụng lao động của đối tác. Đối tác tự chịu trách nhiệm về chất
              lượng dịch vụ, giá mình đặt (trong khung giá của 360đẹp), giấy phép hành nghề nếu pháp luật yêu cầu và nghĩa vụ thuế của mình.
            </li>
            <li>
              Mọi giao dịch qua 360đẹp phải tuân thủ pháp luật Việt Nam, Quy chế này, <Link href="/chinh-sach" className="text-accent underline underline-offset-2">Chính sách phí & đặt lịch</Link>{" "}
              và <Link href="/tro-giup" className="text-accent underline underline-offset-2">Trợ giúp & an toàn</Link>.
            </li>
            <li>Khách hàng và đối tác dùng 360đẹp là đã đồng ý với Quy chế. Khi Quy chế thay đổi, 360đẹp đăng bản mới tại trang này trước khi áp dụng.</li>
          </ul>
        </Section>

        <Section title="II. Đăng ký và xác minh">
          <ul className="list-disc space-y-1 pl-5">
            <li>Khách hàng đăng ký bằng Google, Apple, số điện thoại hoặc email. Cần số điện thoại trước khi đặt lịch.</li>
            <li>
              Đối tác mở hồ sơ miễn phí, chọn dịch vụ từ danh mục và đặt giá trong khung, thêm giờ làm việc và ảnh tác phẩm do chính mình
              làm. Hồ sơ chỉ hiện với khách sau khi qua kiểm duyệt (bằng AI, có nhật ký để nhân viên 360đẹp xem lại và thay đổi quyết định).
            </li>
            <li>
              Đối tác có thể xác minh danh tính bằng CCCD và ảnh chân dung để có dấu “Đã xác minh”; dịch vụ người mẫu và đăng tin tuyển mẫu
              bắt buộc xác minh. Ảnh chỉ được dùng để đối chiếu và không được lưu trên máy chủ của 360đẹp (xem mục VII).
            </li>
            <li>Mỗi người chỉ dùng một tài khoản, bằng thông tin thật của chính mình.</li>
          </ul>
        </Section>

        <Section title="III. Quy trình giao dịch">
          <p className="font-semibold text-ink">Cách 1: khách đặt lịch với một đối tác</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>Khách chọn dịch vụ, gói, nơi làm (tại nhà hoặc studio) và giờ trống của đối tác; xem tổng tiền trước khi gửi.</li>
            <li>Đối tác nhận hoặc từ chối trong {POLICY.confirmWithinHours} giờ; không nhận kịp thì lịch tự huỷ, khách không mất gì.</li>
            <li>Khi đối tác đã nhận, hai bên mới nhắn tin và thấy số điện thoại của nhau.</li>
          </ol>
          <p className="mt-3 font-semibold text-ink">Cách 2: khách đăng yêu cầu</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>Khách đăng yêu cầu với giá cố định theo giá niêm yết; đối tác phù hợp trong khu vực được báo.</li>
            <li>Đối tác bấm “Nhận việc” trước thì được lịch hẹn đã xác nhận, và hai bên nhắn tin được ngay.</li>
          </ol>
          <p className="mt-3 font-semibold text-ink">Sau buổi làm</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              Đối tác bấm hoàn thành từ giờ hẹn trở đi; khách cũng tự xác nhận được. Nếu không ai bấm, lịch tự hoàn thành sau {AUTO_COMPLETE_HOURS}{" "}
              giờ.
            </li>
            <li>Khi lịch kết thúc, cuộc trò chuyện đóng lại. Cần làm tiếp thì đặt lịch mới.</li>
            <li>
              Hai bên đánh giá nhau trong {REVIEW_WINDOW_DAYS} ngày. Đánh giá kín: chỉ hiện khi cả hai cùng đánh giá hoặc hết hạn, để không ai
              đánh giá trả đũa. Điểm trung bình hiện từ {MIN_REVIEWS_FOR_AVERAGE} đánh giá.
            </li>
          </ul>
        </Section>

        <Section title="IV. Giá, phí và thanh toán">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Khách trả giá dịch vụ đối tác niêm yết, cộng phí di chuyển (miễn phí {POLICY.freeTravelKm} km đầu, sau đó{" "}
              {formatPrice(POLICY.travelFeePerKm)}/km, tối đa {formatPrice(POLICY.travelFeeCap)}) và phí đặt gấp {formatPrice(POLICY.urgentFee)}{" "}
              nếu lịch bắt đầu trong {POLICY.urgentWithinHours} giờ. Khách <b className="text-ink">không trả phí nền tảng</b> và không phải đặt cọc.
            </li>
            <li>Khách thanh toán trực tiếp cho đối tác (tiền mặt hoặc chuyển khoản) sau buổi làm. Thanh toán online qua 360đẹp chưa áp dụng.</li>
            <li>
              Đối tác trả 360đẹp phí dịch vụ {pct(POLICY.commissionRate)} trên giá dịch vụ của mỗi lịch hoàn thành (không tính trên phí di
              chuyển và phí đặt gấp). Phí được trừ vào ví đối tác khi lịch hoàn thành; khi ví âm, đối tác chưa nhận lịch mới cho tới khi thanh
              toán bằng chuyển khoản vào tài khoản của công ty với nội dung riêng của mình.
            </li>
            <li>360đẹp xuất hoá đơn cho khoản phí dịch vụ đã thu theo quy định về hoá đơn điện tử.</li>
            <li>Voucher và thưởng giới thiệu do 360đẹp chi trả theo điều kiện đăng tại trang Giới thiệu bạn bè.</li>
          </ul>
        </Section>

        <Section title="V. Huỷ lịch, đổi giờ và vắng mặt">
          <ul className="list-disc space-y-1 pl-5">
            <li>Khách huỷ miễn phí trước giờ hẹn {POLICY.freeCancelHours} giờ. Đối tác được đề nghị đổi giờ; khách đồng ý thì đổi.</li>
            <li>
              Sau giờ hẹn {NO_SHOW_AFTER_MIN} phút, bên có mặt báo được bên kia vắng mặt. Bên bị báo khiếu nại được trong 24 giờ; 360đẹp xem xét
              chứng cứ và quyết định.
            </li>
            <li>Tài khoản thường xuyên bùng lịch, huỷ muộn hoặc vắng mặt có thể bị hạn chế hoặc khoá.</li>
          </ul>
        </Section>

        <Section title="VI. Đảm bảo an toàn giao dịch">
          <ul className="list-disc space-y-1 pl-5">
            <li>Chỉ nhắn tin và thấy số điện thoại của nhau sau khi đã ghép lịch; số điện thoại ẩn lại khi lịch kết thúc.</li>
            <li>Không chuyển tiền đặt cọc, “phí hồ sơ” hay bất kỳ khoản nào cho người lạ ngoài lịch hẹn. 360đẹp không bao giờ yêu cầu người mẫu nộp tiền.</li>
            <li>Mọi người dùng đều báo cáo được vi phạm trong lịch hẹn, tin nhắn, hồ sơ, bài đăng và đánh giá; 360đẹp tiếp nhận và phản hồi.</li>
            <li>Đối tác cam kết dụng cụ sạch, sản phẩm có nguồn gốc rõ ràng và đúng giờ hẹn.</li>
          </ul>
        </Section>

        <Section title="VII. Bảo vệ thông tin cá nhân">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b className="text-ink">Thông tin thu thập:</b> họ tên, số điện thoại, email, địa chỉ làm dịch vụ, lịch sử đặt lịch, tin nhắn,
              đánh giá; với đối tác thêm ảnh tác phẩm, khu vực, giờ làm, giao dịch ví, và họ tên trên CCCD khi đã xác minh.
            </li>
            <li>
              <b className="text-ink">Mục đích:</b> ghép và thực hiện lịch hẹn, liên lạc, thu phí, chống gian lận, giải quyết khiếu nại và thực
              hiện nghĩa vụ với cơ quan nhà nước (kể cả cung cấp thông tin người bán cho cơ quan thuế theo quy định).
            </li>
            <li>
              <b className="text-ink">Ai được xem:</b> số điện thoại và địa chỉ chỉ hiện cho bên kia của một lịch đã ghép, trong thời gian lịch
              diễn ra; nhân viên vận hành được phân quyền. 360đẹp không bán thông tin cá nhân.
            </li>
            <li>
              <b className="text-ink">Bên xử lý dữ liệu:</b> dữ liệu lưu trên hạ tầng đám mây (Supabase, Vercel), có thể đặt ngoài Việt Nam; email gửi qua
              Resend; đối soát chuyển khoản qua SePay. Ảnh CCCD và chân dung khi xác minh được gửi tới dịch vụ AI của Google để đọc và so khớp, không
              lưu trên máy chủ 360đẹp; nội dung hồ sơ và ảnh tác phẩm được AI (OpenAI) kiểm duyệt.
            </li>
            <li>
              <b className="text-ink">Quyền của bạn:</b> xem và sửa thông tin trong tài khoản, rút lại sự đồng ý, và xoá tài khoản ngay trong ứng
              dụng. Khi xoá, thông tin cá nhân bị xoá hoặc ẩn danh; dữ liệu giao dịch cần lưu theo quy định kế toán, thuế được giữ ở dạng ẩn danh.
            </li>
            <li>Ảnh tải lên được xoá thông tin vị trí trước khi lưu.</li>
          </ul>
        </Section>

        <Section title="VIII. Nội dung và dịch vụ bị cấm">
          <ul className="list-disc space-y-1 pl-5">
            <li>Dịch vụ, tuyển mẫu hay nội dung khiêu dâm, khoả thân, gợi dục; ảnh “nhạy cảm”; dịch vụ cho người dưới 18 tuổi trái quy định.</li>
            <li>Yêu cầu đặt cọc trước, “phí hồ sơ”, chuyển khoản trước cho người mẫu hay đối tác ngoài lịch hẹn.</li>
            <li>Ảnh tác phẩm không phải của chính mình, thông tin sai sự thật, đánh giá ảo.</li>
            <li>Đăng thông tin liên hệ để giao dịch ngoài 360đẹp trước khi ghép lịch; quấy rối, xúc phạm, phân biệt đối xử.</li>
            <li>Dịch vụ y tế, thẩm mỹ xâm lấn hay bất kỳ dịch vụ nào pháp luật cấm hoặc cần giấy phép mà đối tác không có.</li>
          </ul>
          <p className="mt-2">
            Nội dung vi phạm bị chặn khi đăng hoặc bị gỡ; tài khoản vi phạm bị nhắc nhở, tạm khoá hoặc khoá vĩnh viễn tuỳ mức độ. 360đẹp phối hợp
            với cơ quan chức năng khi có yêu cầu.
          </p>
        </Section>

        <Section title="IX. Quyền và nghĩa vụ các bên">
          <p className="font-semibold text-ink">360đẹp</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Vận hành nền tảng ổn định, công khai giá, phí và quy trình; bảo vệ thông tin người dùng; tiếp nhận và giải quyết khiếu nại.</li>
            <li>Được từ chối, ẩn hồ sơ, bài đăng hoặc khoá tài khoản vi phạm Quy chế; được thu phí dịch vụ đã công bố.</li>
            <li>Lưu trữ thông tin giao dịch và cung cấp cho cơ quan nhà nước khi pháp luật yêu cầu, kể cả thông tin người bán cho cơ quan thuế.</li>
          </ul>
          <p className="mt-3 font-semibold text-ink">Đối tác</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Cung cấp thông tin trung thực; thực hiện dịch vụ đúng mô tả, đúng giờ, đúng giá đã hiện cho khách.</li>
            <li>Thanh toán phí dịch vụ đúng hạn; tự kê khai, nộp thuế thu nhập từ dịch vụ theo quy định.</li>
            <li>Không nhận tiền ngoài giá đã hiện, không lôi kéo khách giao dịch ngoài 360đẹp để né phí.</li>
          </ul>
          <p className="mt-3 font-semibold text-ink">Khách hàng</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Cung cấp đúng địa chỉ, có mặt đúng giờ, thanh toán đủ số tiền đã hiện khi đặt.</li>
            <li>Tôn trọng đối tác; đánh giá trung thực dựa trên trải nghiệm thật.</li>
          </ul>
        </Section>

        <Section title="X. Khiếu nại và giải quyết tranh chấp">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Dùng nút “Báo cáo vấn đề” trong lịch hẹn, hoặc liên hệ hỗ trợ ở cuối trang, kèm mô tả và hình ảnh nếu có.</li>
            <li>360đẹp xác nhận đã nhận trong 24 giờ làm việc, xem xét lịch sử lịch hẹn, tin nhắn và chứng cứ hai bên, và phản hồi hướng giải quyết.</li>
            <li>
              Tranh chấp giữa khách và đối tác được ưu tiên thương lượng; 360đẹp hỗ trợ và có thể điều chỉnh phí, voucher hoặc hạn chế tài khoản.
              Không thoả thuận được thì các bên có quyền đưa ra cơ quan nhà nước có thẩm quyền theo pháp luật.
            </li>
          </ol>
        </Section>

        <Section title="XI. Lỗi kỹ thuật">
          <p>
            Khi hệ thống gặp sự cố làm sai lệch lịch hẹn, phí hoặc số dư ví, 360đẹp khắc phục sớm nhất và điều chỉnh lại khoản bị ảnh hưởng. Người
            dùng không lợi dụng lỗi để hưởng lợi; khoản có được do lỗi sẽ bị thu hồi.
          </p>
        </Section>

        <Section title="XII. Thông tin doanh nghiệp và liên hệ">
          <CompanyInfo className="text-sm" />
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
