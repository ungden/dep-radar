import type { Metadata } from "next"
import Link from "next/link"
import { CompanyInfo } from "@/components/company-info"
import { PageHeader } from "@/components/ui"
import { AUTO_COMPLETE_HOURS, MIN_REVIEWS_FOR_AVERAGE, NO_SHOW_AFTER_MIN, REVIEW_WINDOW_DAYS } from "@/lib/connection"
import { IDENTITY_VERIFICATION_OPEN } from "@/lib/launch"
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
      <p className="text-[13px] text-muted">Nền tảng kết nối 360đẹp (www.360dep.vn và ứng dụng 360đẹp) · Phiên bản 1.1, cập nhật ngày 07/10/2026</p>

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
              lượng dịch vụ, mức giá mình chọn (trong các mức giá của 360đẹp), giấy phép hành nghề nếu pháp luật yêu cầu và nghĩa vụ thuế của mình.
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
              Đối tác mở hồ sơ miễn phí, chọn dịch vụ từ danh mục và chọn một trong các mức giá có sẵn, thêm giờ làm việc và ảnh tác phẩm do chính mình
              làm. Hồ sơ chỉ hiện với khách sau khi qua kiểm duyệt (bằng AI, có nhật ký để nhân viên 360đẹp xem lại và thay đổi quyết định).
            </li>
            <li>
              Đối tác có thể xác minh danh tính bằng CCCD và ảnh chân dung để có dấu “Đã xác minh”; dịch vụ người mẫu và đăng tin tuyển mẫu
              bắt buộc xác minh. Ảnh chỉ được dùng để đối chiếu và không được lưu trên máy chủ của 360đẹp (xem mục VIII).
              {!IDENTITY_VERIFICATION_OPEN && " Tính năng xác minh sẽ mở sau; trong thời gian chưa mở, dịch vụ người mẫu và tin tuyển mẫu tạm đóng."}
            </li>
            <li>Mỗi người chỉ dùng một tài khoản, bằng thông tin thật của chính mình.</li>
          </ul>
        </Section>

        <Section title="III. Quy trình giao dịch">
          <p className="font-semibold text-ink">Cách 1: khách đặt lịch với một đối tác</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>Khách chọn dịch vụ, gói, nơi làm (tại nhà hoặc studio) và giờ trống của đối tác; xem tổng tiền trước khi gửi.</li>
            <li>
              Đối tác nhận hoặc từ chối trong {POLICY.confirmWithinHours} giờ, không quá giờ hẹn (lịch đặt từ 21:00 đến 08:00 có hạn tới 10:00 sáng hôm sau, không muộn hơn 1
              giờ trước giờ hẹn); không nhận kịp thì lịch tự hết hạn, khách không mất gì.
            </li>
            <li>Khi đối tác đã nhận, hai bên mới nhắn tin được và ứng dụng hiện số điện thoại của nhau.</li>
            <li>Mỗi lịch hẹn lưu lại phạm vi gói, giá, phụ phí, đầu ra và thời hạn đã chốt lúc đặt; đây là căn cứ khi có tranh chấp.</li>
          </ol>
          <p className="mt-3 font-semibold text-ink">Cách 2: khách đăng yêu cầu</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>
              Khách đăng yêu cầu (chỉ dịch vụ tại nhà) với một trong ba mức giá của gói và tổng tối đa chấp nhận; đối tác phù hợp trong khu vực được báo. Yêu cầu không ai
              nhận tới giờ hẹn thì tự hết hạn và khách được báo.
            </li>
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
            <li>
              Hai bên huỷ được lịch đang chờ hoặc đã xác nhận trước giờ hẹn; từ giờ hẹn trở đi không huỷ được. Hiện không thu phí huỷ; nên huỷ trước giờ hẹn từ{" "}
              {POLICY.freeCancelHours} giờ để bên kia kịp sắp xếp.
            </li>
            <li>Đổi giờ cần cả hai bên đồng ý trong ứng dụng; giá và phụ phí giữ nguyên. Thoả thuận đổi giờ chỉ qua điện thoại không được ghi nhận.</li>
            <li>
              Đối tác không đến: từ {NO_SHOW_AFTER_MIN} phút sau giờ hẹn đến {AUTO_COMPLETE_HOURS} giờ sau giờ kết thúc, nếu đối tác chưa bấm “Bắt đầu”, khách báo “Người
              làm không đến”; lịch bị huỷ về phía đối tác, không tính phí. Đối tác chỉ bấm “Bắt đầu” khi đã có mặt (nút mở từ 15 phút trước giờ hẹn). Đối tác cho rằng
              báo cáo sai thì gửi “Báo cáo vấn đề” kèm chứng cứ trong 24 giờ; 360đẹp xem xét và báo kết quả.
            </li>
            <li>
              Khách vắng mặt: từ {NO_SHOW_AFTER_MIN} phút sau giờ hẹn, đối tác báo vắng mặt; không tính phí dịch vụ. Nếu lịch có phí di chuyển, 360đẹp (không phải khách)
              bù cho đối tác đúng khoản đó sau 24 giờ. Khách khiếu nại được trong 24 giờ trên trang lịch hẹn; khi đó khoản bù được giữ lại để 360đẹp xem xét chứng cứ,
              quyết định và báo cho cả hai bên.
            </li>
            <li>Tài khoản thường xuyên bùng lịch, huỷ sát giờ hoặc vắng mặt có thể bị hạn chế hoặc khoá.</li>
          </ul>
        </Section>

        <Section title="VI. Xử lý tình huống thường gặp" id="tinh-huong">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b className="text-ink">Đến trễ:</b> đối tác báo trước qua tin nhắn của lịch hẹn. Đến trễ không được rút bớt nội dung gói. Quá {NO_SHOW_AFTER_MIN} phút mà chưa bắt
              đầu, khách có quyền báo đối tác không đến.
            </li>
            <li>
              <b className="text-ink">Người khác đi thay:</b> không được phép. Khách có quyền từ chối và báo cáo; đây là vi phạm nghiêm trọng của đối tác.
            </li>
            <li>
              <b className="text-ink">Làm thêm tại chỗ:</b> phần làm thêm phải đặt thành lịch mới trong ứng dụng theo giá niêm yết. Không thu hay trả tiền làm thêm ngoài ứng
              dụng.
            </li>
            <li>
              <b className="text-ink">Đòi thêm tiền:</b> khách chỉ trả đúng tổng tiền ghi trong lịch hẹn. Mọi khoản phụ thu, “giá chưa gồm…”, tiền bồi dưỡng bắt buộc đều bị
              cấm.
            </li>
            <li>
              <b className="text-ink">Chất lượng:</b> khách nói ngay khi đối tác còn tại chỗ để được chỉnh sửa trong phạm vi gói. Không giải quyết được thì gửi “Báo cáo vấn đề”
              kèm ảnh, nên trong 24 giờ. 360đẹp xem xét, có thể đề nghị làm lại hoặc giảm giá theo thoả thuận của hai bên, ẩn tác phẩm hoặc hạn chế tài khoản vi phạm.
            </li>
            <li>
              <b className="text-ink">Thanh toán:</b> khách trả sau khi làm, tiền mặt hoặc chuyển khoản tới tài khoản đứng tên đối tác, và giữ biên lai hoặc nhắn xác nhận trong
              tin nhắn của lịch hẹn. Đối tác không bấm hoàn thành khi chưa được trả mà gửi báo cáo ngay; 360đẹp có thể điều chỉnh phí của lịch đó khi xác minh được
              khách không trả.
            </li>
            <li>
              <b className="text-ink">Sức khoẻ, dị ứng:</b> khách ghi rõ trong phần ghi chú và báo đối tác trước khi làm (dị ứng, da nhạy cảm, mang thai). Đối tác hỏi trước, thử
              trên vùng nhỏ với keo, thuốc nhuộm, sáp wax khi cần, và dừng ngay khi có phản ứng.
            </li>
            <li>
              <b className="text-ink">Hỏng đồ, thương tích:</b> bên gây thiệt hại chịu trách nhiệm theo pháp luật dân sự. Bên bị thiệt hại chụp ảnh và báo cáo trong 24 giờ;
              360đẹp ghi nhận, liên hệ hai bên và cung cấp thông tin lịch hẹn khi cần. 360đẹp không phải đơn vị bảo hiểm và không tự chi trả bồi thường.
            </li>
            <li>
              <b className="text-ink">Người dưới 18 tuổi:</b> cần cha mẹ hoặc người giám hộ đặt lịch và có mặt suốt buổi làm; đối tác có quyền từ chối nếu không có người giám hộ.
              Dịch vụ người mẫu chỉ dành cho người đủ 18 tuổi.
            </li>
            <li>
              <b className="text-ink">An toàn:</b> mỗi bên có quyền dừng buổi hẹn và rời đi khi thấy không an toàn, rồi báo cáo; nguy hiểm thì gọi 113, cấp cứu gọi 115.
            </li>
            <li>
              <b className="text-ink">Ảnh và file:</b> đối tác chỉ đăng ảnh có khách khi khách đồng ý cho đăng lại. Đối tác giao đủ đầu ra, đúng số lượt sửa và trong hạn ghi
              trong gói, bằng đường link còn truy cập được ít nhất 30 ngày.
            </li>
            <li>
              <b className="text-ink">Thoả thuận ngoài ứng dụng</b> (đổi giờ, làm thêm, giá, đặt cọc) không được công nhận khi giải quyết tranh chấp.
            </li>
          </ul>
        </Section>

        <Section title="VII. Đảm bảo an toàn giao dịch">
          <ul className="list-disc space-y-1 pl-5">
            <li>Chỉ nhắn tin được sau khi đã ghép lịch; ứng dụng hiện số điện thoại của nhau khi lịch đã được nhận và ẩn lại khi lịch kết thúc.</li>
            <li>Không chuyển tiền đặt cọc, “phí hồ sơ” hay bất kỳ khoản nào cho người lạ ngoài lịch hẹn. 360đẹp không bao giờ yêu cầu người mẫu nộp tiền.</li>
            <li>
              Người dùng báo cáo vi phạm bằng nút “Báo cáo vấn đề” trong lịch hẹn, tin nhắn và tin tuyển mẫu; vi phạm ở hồ sơ, bài đăng hay đánh giá thì liên hệ hỗ trợ kèm
              đường link. 360đẹp tiếp nhận và báo kết quả cho người báo.
            </li>
            <li>Đối tác cam kết dụng cụ sạch, sản phẩm có nguồn gốc rõ ràng và đúng giờ hẹn.</li>
          </ul>
        </Section>

        <Section title="VIII. Bảo vệ thông tin cá nhân">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b className="text-ink">Thông tin thu thập:</b> họ tên, số điện thoại, email, địa chỉ làm dịch vụ, lịch sử đặt lịch, tin nhắn,
              đánh giá; với đối tác thêm ảnh tác phẩm, khu vực, giờ làm, giao dịch ví, và khi đã xác minh: họ tên trên CCCD, năm sinh và mã băm một chiều của số CCCD (để
              một thẻ không xác minh nhiều tài khoản; không lưu số CCCD).
            </li>
            <li>
              <b className="text-ink">Mục đích:</b> ghép và thực hiện lịch hẹn, liên lạc, thu phí, chống gian lận, giải quyết khiếu nại và thực
              hiện nghĩa vụ với cơ quan nhà nước (kể cả cung cấp thông tin người bán cho cơ quan thuế theo quy định).
            </li>
            <li>
              <b className="text-ink">Ai được xem:</b> địa chỉ làm dịch vụ hiện cho đối tác của lịch hẹn đó (để quyết định nhận lịch) và lưu trong
              lịch sử lịch hẹn; số điện thoại của hai bên hiện trong ứng dụng khi lịch đã được nhận đến khi lịch kết thúc; nhân viên vận hành được phân quyền. 360đẹp
              không bán thông tin cá nhân.
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

        <Section title="IX. Nội dung và dịch vụ bị cấm">
          <ul className="list-disc space-y-1 pl-5">
            <li>Dịch vụ, tuyển mẫu hay nội dung khiêu dâm, khoả thân, gợi dục; ảnh “nhạy cảm”; dịch vụ cho người dưới 18 tuổi trái quy định.</li>
            <li>Yêu cầu đặt cọc trước, “phí hồ sơ”, chuyển khoản trước cho người mẫu hay đối tác ngoài lịch hẹn.</li>
            <li>Ảnh tác phẩm không phải của chính mình, thông tin sai sự thật, đánh giá ảo.</li>
            <li>Đăng thông tin liên hệ để giao dịch ngoài 360đẹp trước khi ghép lịch; quấy rối, xúc phạm, phân biệt đối xử.</li>
            <li>
              Dịch vụ y tế, thẩm mỹ xâm lấn hay bất kỳ dịch vụ nào pháp luật cấm hoặc cần giấy phép mà đối tác không có. Dịch vụ phun xăm chỉ do đối tác đáp ứng điều
              kiện hành nghề theo quy định thực hiện; 360đẹp có quyền yêu cầu xuất trình chứng nhận.
            </li>
          </ul>
          <p className="mt-2">
            Nội dung vi phạm bị chặn khi đăng hoặc bị gỡ; tài khoản vi phạm bị nhắc nhở, tạm khoá hoặc khoá vĩnh viễn tuỳ mức độ. 360đẹp phối hợp
            với cơ quan chức năng khi có yêu cầu.
          </p>
        </Section>

        <Section title="X. Quyền và nghĩa vụ các bên">
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
            <li>Cung cấp đúng địa chỉ, có mặt đúng giờ, báo trước tình trạng sức khoẻ liên quan, thanh toán đủ số tiền đã hiện khi đặt.</li>
            <li>Tôn trọng đối tác; đánh giá trung thực dựa trên trải nghiệm thật.</li>
          </ul>
        </Section>

        <Section title="XI. Khiếu nại và giải quyết tranh chấp">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Dùng nút “Báo cáo vấn đề” trong lịch hẹn, hoặc liên hệ hỗ trợ ở cuối trang, kèm mô tả và hình ảnh nếu có.</li>
            <li>
              360đẹp xác nhận đã nhận trong 24 giờ làm việc, xem xét lịch hẹn (phạm vi, giá, giờ đã chốt), tin nhắn và chứng cứ hai bên, và báo kết quả cho người khiếu nại.
              Nên khiếu nại trong 24 giờ sau sự việc; thoả thuận ngoài ứng dụng không được xem xét.
            </li>
            <li>
              Tranh chấp giữa khách và đối tác được ưu tiên thương lượng; 360đẹp hỗ trợ và có thể điều chỉnh phí trong ví đối tác, ẩn đánh giá hay tác phẩm vi phạm, hạn
              chế hoặc khoá tài khoản. 360đẹp không giữ tiền dịch vụ của khách nên không tự hoàn tiền thay đối tác.
              Không thoả thuận được thì các bên có quyền đưa ra cơ quan nhà nước có thẩm quyền theo pháp luật.
            </li>
          </ol>
        </Section>

        <Section title="XII. Lỗi kỹ thuật">
          <p>
            Khi hệ thống gặp sự cố làm sai lệch lịch hẹn, phí hoặc số dư ví, 360đẹp khắc phục sớm nhất và điều chỉnh lại khoản bị ảnh hưởng. Người
            dùng không lợi dụng lỗi để hưởng lợi; khoản có được do lỗi sẽ bị thu hồi.
          </p>
        </Section>

        <Section title="XIII. Thông tin doanh nghiệp và liên hệ">
          <CompanyInfo className="text-sm" />
        </Section>
      </div>
    </div>
  )
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={id ? "scroll-mt-24" : undefined}>
      <h2 className="mb-2 text-[17px] font-bold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  )
}
