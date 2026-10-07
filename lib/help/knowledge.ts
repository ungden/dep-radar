import { tierLabels } from "@/lib/catalog"
import { AUTO_COMPLETE_HOURS, MIN_REVIEWS_FOR_AVERAGE, NO_SHOW_AFTER_MIN, REVIEW_WINDOW_DAYS } from "@/lib/connection"
import { DEMO_DATA_LIVE, IDENTITY_VERIFICATION_OPEN } from "@/lib/launch"
import { POLICY } from "@/lib/pricing"
import { VIDEO_MAX_MB, VIDEO_MAX_SECONDS } from "@/lib/video-meta"
import type { HelpAudience, HelpEntry, HelpTopicId } from "./types"

export type { HelpAudience, HelpEntry, HelpTopicId } from "./types"

/**
 * The help centre: every question we expect customers and partners to ask,
 * answered with what the system actually does (checked against the database
 * functions on 07/10/2026). The /tro-giup page shows these entries and the
 * help assistant (lib/help/assistant.ts) answers from them and nothing else,
 * so the two can never disagree.
 *
 * Rules for editing:
 * - Say only what the code enforces, or what the staff will actually do. If a
 *   thing is not built, say so ("hiện chưa có") instead of promising it.
 * - Numbers come from POLICY / lib/connection / lib/catalog, never typed in.
 * - 360đẹp never holds the customer's money: no answer may promise a refund,
 *   compensation or a decision. Disputes go to "Báo cáo vấn đề" and the staff.
 * - Keep ids stable: links, the assistant's citations and the admin log use them.
 */

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`
const pct = (n: number) => `${Math.round(n * 100)}%`
const LEVELS = tierLabels().join(" / ")

export const HELP_TOPICS: { id: HelpTopicId; label: string }[] = [
  { id: "bat-dau", label: "Bắt đầu" },
  { id: "dat-lich", label: "Đặt lịch & nhận lịch" },
  { id: "gia-phi", label: "Giá & phụ phí" },
  { id: "thanh-toan", label: "Thanh toán" },
  { id: "huy-doi", label: "Huỷ & đổi giờ" },
  { id: "tai-cho", label: "Tại buổi hẹn" },
  { id: "vang-mat", label: "Vắng mặt" },
  { id: "hoan-thanh", label: "Hoàn thành & giao file" },
  { id: "danh-gia", label: "Đánh giá" },
  { id: "tin-nhan", label: "Tin nhắn & liên lạc" },
  { id: "an-toan", label: "An toàn" },
  { id: "tranh-chap", label: "Khiếu nại & tranh chấp" },
  { id: "ho-so", label: "Hồ sơ, dịch vụ & tác phẩm" },
  { id: "lich-lam", label: "Giờ làm & phạm vi" },
  { id: "vi-phi", label: "Phí, ví & nạp tiền" },
  { id: "tai-khoan", label: "Tài khoản" },
]

const REPORT = "Báo cáo vấn đề"
const REPORT_HOW = `bấm "${REPORT}" trong chi tiết lịch hẹn`

const ENTRIES: HelpEntry[] = [
  // ── Chung ────────────────────────────────────────────────────────────────
  {
    id: "gioi-thieu",
    audience: "chung",
    topic: "bat-dau",
    q: "360đẹp là gì? 360đẹp có trực tiếp làm dịch vụ không?",
    a: `360đẹp là nền tảng kết nối khách hàng với người làm nghề tự do: làm đẹp (nail, makeup, tóc, da, mi & mày, massage), chụp ảnh, quay clip và người mẫu. Người làm là đối tác độc lập, tự thực hiện và chịu trách nhiệm về dịch vụ của mình. 360đẹp quy định danh mục, nội dung từng gói, các mức giá và quy trình đặt lịch, ghi lại lịch hẹn của hai bên và hỗ trợ khi có sự cố.`,
    keywords: ["san", "nen tang", "trung gian"],
    links: [{ label: "Quy chế hoạt động", href: "/quy-che" }],
  },
  ...(DEMO_DATA_LIVE
    ? [
        {
          id: "du-lieu-mau",
          audience: "chung" as const,
          topic: "bat-dau" as const,
          q: "Vì sao có hồ sơ, tác phẩm, đánh giá là dữ liệu mẫu?",
          a: "Trong giai đoạn đầu, một số hồ sơ, tác phẩm và đánh giá trên 360đẹp là dữ liệu mẫu để minh hoạ cách nền tảng hoạt động; trang chủ và chân trang có ghi chú điều này. Dữ liệu mẫu sẽ được gỡ khi có đủ đối tác thật ở mỗi thành phố.",
          keywords: ["demo", "gia", "that khong"],
        },
      ]
    : []),
  {
    id: "lien-he-ho-tro",
    audience: "chung",
    topic: "bat-dau",
    q: "Liên hệ đội hỗ trợ 360đẹp bằng cách nào?",
    a: `Việc liên quan một lịch hẹn cụ thể (tranh chấp, sự cố, khiếu nại), hãy ${REPORT_HOW}: báo cáo gắn sẵn lịch hẹn nên đội ngũ có đủ thông tin. Việc khác, bấm "Liên hệ hỗ trợ" cuối trang Trợ giúp. Thông báo của 360đẹp đến qua ứng dụng (thông báo trong app và thông báo đẩy), không qua SMS.`,
    keywords: ["hotline", "zalo", "email", "cskh", "cham soc khach hang"],
  },
  {
    id: "lua-dao",
    audience: "chung",
    topic: "an-toan",
    q: "Có người tự xưng nhân viên 360đẹp hỏi mật khẩu, mã OTP hay đòi chuyển tiền?",
    a: `Đó là lừa đảo. 360đẹp không bao giờ hỏi mật khẩu, mã OTP, số thẻ hay số tài khoản ngân hàng của bạn, không gọi điện đòi chuyển tiền để "giữ lịch" hay "mở khoá tài khoản". Đối tác chỉ nộp phí bằng chuyển khoản theo đúng thông tin hiện trong mục Ví của ứng dụng. Gặp trường hợp này, đừng làm theo và báo cho đội hỗ trợ.`,
    keywords: ["otp", "scam", "gia mao", "mat khau", "chuyen tien"],
  },
  {
    id: "xac-minh",
    audience: "chung",
    topic: "an-toan",
    q: "“Đã xác minh danh tính” nghĩa là gì?",
    a: IDENTITY_VERIFICATION_OPEN
      ? "Người làm tự nguyện gửi ảnh CCCD hai mặt và một ảnh chân dung; AI đọc thẻ và đối chiếu khuôn mặt, trường hợp chưa chắc chắn được nhân viên xem lại. Đạt thì hồ sơ có dấu tick. 360đẹp không lưu ảnh CCCD. Dịch vụ người mẫu và tin tuyển mẫu chỉ dành cho người đã xác minh và đủ 18 tuổi."
      : "Tính năng xác minh danh tính (CCCD + ảnh chân dung) sẽ mở sau, hiện chưa nhận hồ sơ. Vì vậy dấu tick xác minh chưa cấp mới, và các dịch vụ người mẫu, tin tuyển mẫu (vốn yêu cầu xác minh và đủ 18 tuổi) đang tạm đóng. Trong lúc này, bạn hãy dựa vào tác phẩm, đánh giá thật và số lịch đã làm của người làm.",
    keywords: ["tick", "cccd", "xac thuc", "huy hieu"],
  },

  // ── Khách: đặt lịch ───────────────────────────────────────────────────────
  {
    id: "k-cach-dat",
    audience: "khach",
    topic: "dat-lich",
    q: "Có mấy cách đặt dịch vụ?",
    a: `Hai cách. (1) Đặt trực tiếp: vào hồ sơ một người làm, chọn gói, giờ trống và địa điểm; người làm xem rồi bấm nhận. (2) Đăng yêu cầu: chọn dịch vụ, mức giá, giờ và địa chỉ; 360đẹp báo cho mọi người làm phù hợp quanh bạn, ai bấm "Nhận việc" trước sẽ làm. Đăng yêu cầu hiện chỉ dành cho dịch vụ tại nhà.`,
    keywords: ["dat lich", "dang yeu cau", "book"],
  },
  {
    id: "k-xac-nhan-lich",
    audience: "khach",
    topic: "dat-lich",
    q: "Đặt xong thì sao? Bao lâu người làm nhận lịch?",
    a: `Lịch ở trạng thái "Chờ xác nhận". Người làm có ${POLICY.confirmWithinHours} giờ để nhận (không quá giờ hẹn). Đặt từ 21:00 đến 08:00 thì hạn nhận là 10:00 sáng hôm sau, nhưng không muộn hơn 1 giờ trước giờ hẹn. Quá hạn, lịch tự hết hạn, khung giờ được trả lại và bạn nhận thông báo để chọn người khác. Bạn không mất tiền gì: không có đặt cọc.`,
    keywords: ["cho xac nhan", "het han", "bao lau", "nhan lich"],
  },
  {
    id: "k-dat-truoc",
    audience: "khach",
    topic: "dat-lich",
    q: "Phải đặt trước bao lâu? Đặt gấp được không?",
    a: `Cần đặt trước ít nhất ${POLICY.minLeadMinutes} phút. Giờ trống chia theo mỗi 30 phút trong giờ làm của người làm. Lịch bắt đầu trong vòng ${POLICY.urgentWithinHours} giờ kể từ lúc đặt tính thêm phí đặt gấp ${vnd(POLICY.urgentFee)}.`,
    keywords: ["dat gap", "som nhat", "truoc bao lau"],
  },
  {
    id: "k-tai-nha-studio",
    audience: "khach",
    topic: "dat-lich",
    q: "Làm tại nhà hay tại studio? Vì sao có dịch vụ không đặt tại nhà được?",
    a: `Mỗi người làm cho biết họ nhận làm tại nhà khách, tại studio hay cả hai, và bán kính đi lại (tối đa 30 km). Một số dịch vụ chỉ làm tại studio vì cần máy móc, hoá chất hoặc vệ sinh đặc biệt (nhuộm, uốn, duỗi, hấp tóc, gội dưỡng sinh, chăm sóc da đầu, phun mày, nối mi). Làm tại nhà cần chọn một địa chỉ đã lưu để tính đường đi; địa chỉ ngoài bán kính của người làm sẽ không đặt được.`,
    keywords: ["tai nha", "studio", "ban kinh", "ngoai pham vi"],
  },
  {
    id: "k-goi-nhieu-nguoi",
    audience: "khach",
    topic: "dat-lich",
    q: "Đặt cho nhiều người hoặc gói nhiều buổi thế nào?",
    a: `Gói tính theo người (ví dụ makeup nhóm, kỷ yếu nhóm) cho chọn số người; giá và thời lượng tăng theo số người. Gói nhiều buổi (như makeup cô dâu trọn gói 2 lễ) cần chọn đủ ngày giờ các buổi ngay khi đặt và chỉ đặt trực tiếp, không đăng yêu cầu. Gói có buổi dặm (như phun mày) thì buổi dặm do một bên đề nghị, bên kia xác nhận, trong thời hạn ghi trong gói.`,
    keywords: ["nhom", "nhieu nguoi", "2 le", "buoi dam", "co dau"],
  },
  {
    id: "k-dang-yeu-cau",
    audience: "khach",
    topic: "dat-lich",
    q: "Đăng yêu cầu hoạt động thế nào?",
    a: `Bạn chọn dịch vụ, gói, một trong các mức giá (${LEVELS}), giờ, địa chỉ đã lưu và xác nhận "tổng tối đa" chấp nhận (gồm phụ phí). 360đẹp báo ngay cho những người làm đang nhận khách, cùng thành phố, niêm yết đúng gói và mức giá đó, còn lịch trống và trong phạm vi. Người bấm "Nhận việc" đầu tiên sẽ làm: lịch được xác nhận ngay và hai bên nhắn tin được. Không có báo giá hay trả giá.`,
    keywords: ["dang yeu cau", "nhan viec", "ai nhan truoc"],
  },
  {
    id: "k-yeu-cau-sua-het-han",
    audience: "khach",
    topic: "dat-lich",
    q: "Sửa yêu cầu đã đăng được không? Không ai nhận thì sao?",
    a: `Yêu cầu đã đăng không sửa được (giá và giờ là điều kiện người làm đồng ý khi nhận); muốn đổi, hãy xoá rồi đăng lại khi chưa ai nhận. Nếu tới giờ hẹn vẫn chưa ai nhận, yêu cầu tự hết hạn và bạn nhận thông báo. Lưu ý: yêu cầu đăng sớm có thể trở thành "đặt gấp" trong ${POLICY.urgentWithinHours} giờ cuối; nếu tổng khi đó vượt "tổng tối đa" bạn chọn, người làm sẽ không nhận được, nên hãy để tổng tối đa có dư cho phụ phí.`,
    keywords: ["xoa yeu cau", "sua yeu cau", "khong ai nhan", "het han"],
  },
  {
    id: "k-combo",
    audience: "khach",
    topic: "dat-lich",
    q: "Đặt nhiều người làm cho cùng một buổi (combo) được không?",
    a: "Được. Bạn gộp 2 đến 3 lịch của mình (ví dụ makeup và chụp ảnh) có giờ bắt đầu cách nhau không quá 60 phút thành một combo. Mỗi lịch vẫn độc lập: nếu một lịch bị huỷ hay hết hạn, bạn được báo, các lịch còn lại không tự huỷ.",
    keywords: ["combo", "nhieu dich vu", "cung buoi"],
  },

  // ── Khách: giá & phí ──────────────────────────────────────────────────────
  {
    id: "k-phi-nen-tang",
    audience: "khach",
    topic: "gia-phi",
    q: "Khách có phải trả phí cho 360đẹp không?",
    a: `Không. Phí nền tảng cho khách là 0đ. Bạn trả giá dịch vụ, cộng phí di chuyển và phí đặt gấp nếu có, tất cả hiện rõ trước khi gửi. 360đẹp thu ${pct(POLICY.commissionRate)} hoa hồng từ phía người làm.`,
    keywords: ["phi nen tang", "phi dich vu", "mat phi"],
  },
  {
    id: "k-muc-gia",
    audience: "khach",
    topic: "gia-phi",
    q: `Các mức giá ${LEVELS} khác nhau thế nào?`,
    a: `Mỗi gói trong danh mục có đúng 3 mức giá do 360đẹp quy định: ${LEVELS}. Người làm tự chọn một mức cho từng gói; họ không tự đặt giá khác. Nhãn mức giá không phải chứng nhận tay nghề của 360đẹp: hãy xem tác phẩm, đánh giá và số lịch đã làm để chọn. Nội dung gói (bao gồm những gì, thời lượng, đầu ra) giống nhau ở mọi mức.`,
    keywords: ["co ban", "chuyen nghiep", "master", "muc gia", "bang gia"],
    links: [{ label: "Chính sách phí", href: "/chinh-sach" }],
  },
  {
    id: "k-gia-gom-gi",
    audience: "khach",
    topic: "gia-phi",
    q: "Giá đã gồm những gì? Người làm có được thu thêm không?",
    a: `Giá đã gồm vật tư và mọi thứ ghi trong mục "Bao gồm" của gói. Ngoài giá, chỉ có phí di chuyển và phí đặt gấp do hệ thống tính sẵn. Mỗi lịch lưu lại phạm vi, giá, đầu ra và thời hạn đã chốt lúc đặt; 360đẹp sửa danh mục sau đó cũng không làm thay đổi lịch của bạn. Người làm không được thu thêm bất kỳ khoản nào khác.`,
    keywords: ["phu thu", "thu them", "vat tu", "bao gom", "hop dong"],
  },
  {
    id: "k-phi-di-chuyen",
    audience: "khach",
    topic: "gia-phi",
    q: "Phí di chuyển tính thế nào?",
    a: `Chỉ áp dụng khi làm tại nhà: miễn phí ${POLICY.freeTravelKm} km đầu, sau đó ${vnd(POLICY.travelFeePerKm)}/km (làm tròn lên bội số ${vnd(5000)}), tối đa ${vnd(POLICY.travelFeeCap)}. Khoảng cách là ước tính từ khu vực (quận/huyện) của người làm tới địa chỉ bạn chọn, chốt lúc đặt và không tính lại tại chỗ. Phí di chuyển thuộc về người làm.`,
    keywords: ["phi di chuyen", "phi xang", "km", "phi ship"],
  },
  {
    id: "k-phi-gap",
    audience: "khach",
    topic: "gia-phi",
    q: "Phí đặt gấp là gì?",
    a: `Lịch bắt đầu trong vòng ${POLICY.urgentWithinHours} giờ kể từ lúc đặt tính thêm ${vnd(POLICY.urgentFee)}, kể cả khi làm tại studio, để bù việc người làm phải sắp xếp gấp. Phí này thuộc về người làm và không tính lại nếu sau đó đổi giờ.`,
    keywords: ["phi gap", "dat gap"],
  },
  {
    id: "k-bi-doi-them-tien",
    audience: "khach",
    topic: "gia-phi",
    q: "Người làm đòi thêm tiền tại chỗ, tôi phải làm sao?",
    a: `Bạn chỉ trả đúng tổng tiền ghi trong lịch hẹn. Mọi khoản đòi thêm ngoài app (phụ thu vật tư, "giá này chưa gồm…", tiền tip bắt buộc) đều vi phạm quy chế. Hãy từ chối, giữ lại tin nhắn nếu có, và ${REPORT_HOW}, chọn lý do "Giá khác với báo giá". Bạn cũng có thể chọn nhận xét "Giá khác báo giá" khi đánh giá.`,
    keywords: ["doi them tien", "phu thu", "chem gia", "tang gia"],
  },

  // ── Khách: thanh toán ─────────────────────────────────────────────────────
  {
    id: "k-tra-tien",
    audience: "khach",
    topic: "thanh-toan",
    q: "Trả tiền khi nào, cho ai? Có thanh toán online không?",
    a: "Bạn trả thẳng cho người làm sau khi xong việc, bằng tiền mặt hoặc chuyển khoản. Không đặt cọc trước. Thanh toán online qua 360đẹp chưa hoạt động. 360đẹp không nhận và không giữ tiền dịch vụ của khách.",
    keywords: ["thanh toan", "tra tien", "online", "chuyen khoan", "tien mat"],
  },
  {
    id: "k-dat-coc",
    audience: "khach",
    topic: "thanh-toan",
    q: "Người làm yêu cầu đặt cọc hoặc chuyển khoản trước?",
    a: `Đừng chuyển. Trên 360đẹp không có đặt cọc; mọi lịch đều trả sau khi làm. Yêu cầu cọc, chuyển trước hay giao dịch ngoài app là vi phạm quy chế và là dấu hiệu lừa đảo. Hãy ${REPORT_HOW} (hoặc trong cuộc trò chuyện) và chặn người đó nếu cần.`,
    keywords: ["dat coc", "chuyen truoc", "coc"],
  },
  {
    id: "k-bang-chung-tra-tien",
    audience: "khach",
    topic: "thanh-toan",
    q: "Làm sao để tránh tranh cãi “đã trả / chưa trả”?",
    a: `Sau khi trả, nhờ người làm bấm "Đã nhận tiền" trong lịch hẹn: ứng dụng lưu thời điểm xác nhận và báo cho bạn, đó là bằng chứng cho cả hai bên. Chuyển khoản thì chuyển tới tài khoản đứng tên người làm và giữ ảnh chụp giao dịch; trả tiền mặt mà người làm chưa bấm xác nhận thì nhắn một dòng trong tin nhắn của lịch hẹn (ví dụ "Em đã trả 350.000đ tiền mặt").`,
    keywords: ["da tra", "chua tra", "bien lai", "chung tu", "da chuyen"],
  },
  {
    id: "k-hoan-tien",
    audience: "khach",
    topic: "thanh-toan",
    q: "360đẹp có hoàn tiền không?",
    a: `360đẹp không giữ tiền dịch vụ của bạn (bạn trả thẳng người làm sau khi làm), nên không có hoàn tiền qua hệ thống. Đây cũng là lý do bạn chỉ trả khi đã được làm. Nếu có tranh chấp về số tiền đã trả hay chất lượng, hãy ${REPORT_HOW}: 360đẹp sẽ xem lịch hẹn, tin nhắn, liên hệ hai bên và xử lý vi phạm theo quy chế.`,
    keywords: ["hoan tien", "tra lai tien", "refund", "boi thuong"],
  },
  {
    id: "k-hoa-don",
    audience: "khach",
    topic: "thanh-toan",
    q: "Tôi có lấy được hoá đơn cho dịch vụ không?",
    a: "Tiền dịch vụ bạn trả thẳng cho người làm (cá nhân hành nghề tự do), không qua 360đẹp, nên 360đẹp không xuất hoá đơn cho khoản này. Lịch hẹn trong ứng dụng ghi rõ dịch vụ, giá và phụ phí để bạn đối chiếu.",
    keywords: ["hoa don", "vat", "xuat hoa don"],
  },
  {
    id: "k-voucher",
    audience: "khach",
    topic: "thanh-toan",
    q: "Voucher và mã giới thiệu dùng thế nào?",
    a: "Mỗi tài khoản có mã giới thiệu riêng. Người mới nhập mã của bạn bè (một lần, trong 30 ngày đầu, khi chưa có lịch hoàn thành) thì khi họ hoàn thành lịch đầu tiên từ 150.000đ, cả hai nhận voucher 50.000đ, hạn 60 ngày (số tiền theo cấu hình hiện hành của chương trình). Voucher áp cho lịch từ 150.000đ, chọn trước giờ hẹn, mỗi lịch một voucher; bạn trả người làm ít hơn và 360đẹp bù phần đó cho họ. Lịch không diễn ra thì voucher được trả lại, giữ hạn cũ.",
    keywords: ["voucher", "ma giam gia", "gioi thieu", "khuyen mai"],
  },

  // ── Khách: huỷ & đổi giờ ──────────────────────────────────────────────────
  {
    id: "k-huy",
    audience: "khach",
    topic: "huy-doi",
    q: "Tôi huỷ lịch được không? Có mất phí không?",
    a: `Bạn huỷ được lịch đang chờ hoặc đã xác nhận, miễn là trước giờ hẹn. Hiện không thu phí huỷ trong mọi trường hợp (thanh toán là trả sau, chưa có tiền nào để trừ). Dù vậy, hãy huỷ sớm nhất có thể: người làm đã giữ giờ và có thể đã lên đường. Tài khoản huỷ sát giờ nhiều lần có thể bị hạn chế theo quy chế. Từ giờ hẹn trở đi không huỷ được nữa.`,
    keywords: ["huy lich", "huy", "phi huy", "huy muon"],
  },
  {
    id: "k-doi-tac-huy",
    audience: "khach",
    topic: "huy-doi",
    q: "Người làm huỷ lịch của tôi thì sao?",
    a: "Bạn nhận thông báo kèm lý do (nếu có) và không mất gì. Hãy đặt người làm khác hoặc đăng yêu cầu. Nếu người làm huỷ sát giờ gây thiệt hại cho bạn (ví dụ ngày cưới), hãy báo cáo để 360đẹp xem xét hạn chế người làm đó.",
    keywords: ["doi tac huy", "nguoi lam huy", "bi huy"],
  },
  {
    id: "k-doi-gio",
    audience: "khach",
    topic: "huy-doi",
    q: "Muốn đổi giờ hẹn thì làm sao?",
    a: "Đổi giờ cần cả hai bên đồng ý trong ứng dụng. Bạn bấm \"Đề nghị đổi giờ\" trong chi tiết lịch (trên web), chọn ngày giờ mới còn trống trong giờ làm của người làm; người làm đồng ý thì lịch đổi. Người làm cũng có thể đề nghị, khi đó bạn bấm \"Đồng ý đổi\" hoặc \"Giữ giờ cũ\" (trên web và app). Giá, phí di chuyển và phí đặt gấp giữ nguyên. Không thống nhất được thì bạn có thể huỷ trước giờ hẹn rồi đặt lại.",
    keywords: ["doi gio", "doi lich", "doi ngay", "hoan lich"],
  },
  {
    id: "k-thoa-thuan-ngoai-app",
    audience: "chung",
    topic: "huy-doi",
    q: "Hai bên thống nhất đổi giờ qua điện thoại có được không?",
    a: `Hãy luôn cập nhật trong ứng dụng. Nhắc lịch, nút báo vắng mặt, tự hoàn thành sau ${AUTO_COMPLETE_HOURS} giờ và mọi xử lý tranh chấp đều dựa trên giờ ghi trong lịch hẹn. Thoả thuận chỉ qua điện thoại không được ghi nhận, và nếu có tranh chấp 360đẹp không có căn cứ để hỗ trợ.`,
    keywords: ["ngoai app", "qua dien thoai", "zalo", "thoa thuan"],
  },

  // ── Khách: tại buổi hẹn ───────────────────────────────────────────────────
  {
    id: "k-chuan-bi",
    audience: "khach",
    topic: "tai-cho",
    q: "Tôi cần chuẩn bị gì trước buổi hẹn tại nhà?",
    a: "Có mặt đúng giờ và giữ điện thoại để người làm liên lạc; chuẩn bị chỗ ngồi đủ sáng, gần ổ điện; ghi trước trong phần ghi chú khi đặt những điều người làm cần biết (dị ứng, da nhạy cảm, đang mang thai, mẫu muốn làm, lối vào chung cư, chỗ để xe). Ứng dụng nhắc lịch trước 24 giờ và trước 2 giờ.",
    keywords: ["chuan bi", "truoc buoi hen", "nhac lich"],
  },
  {
    id: "k-tre-gio",
    audience: "khach",
    topic: "tai-cho",
    q: "Người làm đến trễ thì sao?",
    a: `Người làm phải báo trước qua tin nhắn nếu có thể trễ. Nếu sau giờ hẹn ${NO_SHOW_AFTER_MIN} phút mà người làm chưa tới và chưa bấm "Bắt đầu", bạn có thể bấm "Người làm không đến": lịch được huỷ, bạn không mất gì và 360đẹp được báo. Nếu bạn vẫn đồng ý làm, buổi hẹn diễn ra như bình thường và bạn có thể chọn nhận xét "Trễ giờ" khi đánh giá. Người làm không được rút bớt nội dung gói vì đến trễ.`,
    keywords: ["tre gio", "den muon", "cho lau", "tre"],
  },
  {
    id: "k-nguoi-khac-den",
    audience: "khach",
    topic: "tai-cho",
    q: "Người đến làm không phải người trong hồ sơ?",
    a: `Không được phép cử người khác đi thay. Bạn có quyền từ chối cho người đó làm. Hãy ${REPORT_HOW}, chọn "Hành vi không phù hợp" và mô tả rõ. Vì lý do an toàn, đừng mở cửa nếu bạn không chắc người đến là ai.`,
    keywords: ["nguoi khac", "di thay", "khong giong anh", "nguoi la"],
  },
  {
    id: "k-lam-them",
    audience: "khach",
    topic: "tai-cho",
    q: "Đang làm muốn thêm dịch vụ (thêm người, thêm móng chân…) thì sao?",
    a: `Trong lúc buổi hẹn đang diễn ra (từ 15 phút trước giờ hẹn tới 1 giờ sau giờ kết thúc), bấm "Đặt thêm dịch vụ" trong chi tiết lịch (trên web): chọn một dịch vụ người làm đang niêm yết, lịch mới nối tiếp ngay sau lịch hiện tại, cùng địa điểm, theo giá niêm yết và không tính phí di chuyển hay phí gấp. Người làm bấm nhận thì thành lịch. Đừng thoả thuận tiền làm thêm ngoài app: khoản đó không được ghi nhận và 360đẹp không hỗ trợ được nếu có tranh chấp.`,
    keywords: ["lam them", "them dich vu", "phat sinh", "them nguoi"],
  },
  {
    id: "k-di-ung",
    audience: "khach",
    topic: "tai-cho",
    q: "Tôi bị dị ứng hoặc da nhạy cảm, có rủi ro gì?",
    a: "Hãy ghi rõ trong phần ghi chú khi đặt và nói trực tiếp với người làm trước khi bắt đầu (dị ứng keo nối mi, thuốc nhuộm, sáp wax, tinh dầu; đang mang thai; da đang điều trị). Với nối mi, nhuộm, wax, bạn có thể yêu cầu thử một vùng nhỏ trước. Nếu có phản ứng (đỏ, rát, sưng, khó thở): dừng ngay, rửa sạch, đi khám; trường hợp nặng gọi 115. Sau đó báo cáo kèm ảnh để 360đẹp ghi nhận.",
    keywords: ["di ung", "kich ung", "mang thai", "ngua", "do rat"],
  },

  // ── Khách: vắng mặt ───────────────────────────────────────────────────────
  {
    id: "k-nguoi-lam-khong-den",
    audience: "khach",
    topic: "vang-mat",
    q: "Người làm không đến, không liên lạc được?",
    a: `Từ ${NO_SHOW_AFTER_MIN} phút sau giờ hẹn đến ${AUTO_COMPLETE_HOURS} giờ sau giờ kết thúc, nếu người làm chưa bấm "Bắt đầu", bạn bấm "Người làm không đến" trong chi tiết lịch. Lịch được huỷ (ghi lỗi về người làm), bạn không mất gì, 360đẹp và người làm được báo. Người làm không đến nhiều lần sẽ bị xem xét tạm khoá. Vì bạn chưa trả tiền nên không có khoản bồi thường bằng tiền.`,
    keywords: ["khong den", "bung", "boom", "khong lien lac duoc", "mat tich"],
  },
  {
    id: "k-bi-bao-vang-mat",
    audience: "khach",
    topic: "vang-mat",
    q: "Người làm báo tôi vắng mặt nhưng tôi có ở nhà?",
    a: `Bạn khiếu nại được trong 24 giờ kể từ lúc bị báo, ngay trong chi tiết lịch hẹn (mô tả chuyện đã xảy ra, ít nhất 10 ký tự, mỗi lịch một lần). Bạn không bị thu khoản nào: nếu lịch có phí di chuyển, khoản bù cho người làm do 360đẹp trả. Khiếu nại được nhân viên xem xét và cả hai bên đều nhận thông báo kết quả.`,
    keywords: ["bi bao vang mat", "khieu nai vang mat", "toi co o nha"],
  },
  {
    id: "k-khong-the-co-mat",
    audience: "khach",
    topic: "vang-mat",
    q: "Tôi bận đột xuất không thể có mặt?",
    a: `Hãy huỷ lịch trong ứng dụng trước giờ hẹn càng sớm càng tốt, hoặc nhắn người làm đề nghị đổi giờ. Nếu không huỷ, sau giờ hẹn ${NO_SHOW_AFTER_MIN} phút người làm có thể báo bạn vắng mặt; vắng mặt nhiều lần có thể khiến tài khoản bị hạn chế.`,
    keywords: ["ban dot xuat", "khong co nha", "vang mat"],
  },

  // ── Khách: hoàn thành & giao file ────────────────────────────────────────
  {
    id: "k-xac-nhan-xong",
    audience: "khach",
    topic: "hoan-thanh",
    q: "“Xác nhận đã xong” để làm gì? Tôi không bấm thì sao?",
    a: `Bấm khi buổi làm đã thực sự xong; thao tác này không hoàn tác được và sẽ đóng tin nhắn, mở phần đánh giá. Người làm cũng có thể bấm hoàn thành. Nếu không ai bấm, lịch tự hoàn thành ${AUTO_COMPLETE_HOURS} giờ sau giờ kết thúc. Nếu buổi làm không diễn ra hoặc có vấn đề, hãy báo cáo trước khi lịch tự hoàn thành.`,
    keywords: ["xac nhan xong", "hoan thanh", "tu hoan thanh"],
  },
  {
    id: "k-chat-luong",
    audience: "khach",
    topic: "hoan-thanh",
    q: "Kết quả không như mong đợi hoặc không giống ảnh mẫu?",
    a: `Nói ngay với người làm khi họ còn ở đó để được chỉnh sửa trong phạm vi gói. Nếu không giải quyết được, chụp ảnh kết quả và ${REPORT_HOW} càng sớm càng tốt, chọn "Chất lượng không như cam kết". 360đẹp xem lịch hẹn, ảnh và tin nhắn, liên hệ hai bên; có thể đề nghị người làm làm lại hoặc giảm giá theo thoả thuận, và ẩn tác phẩm, hạn chế hay khoá hồ sơ nếu vi phạm. Vì bạn trả thẳng người làm, 360đẹp không thể tự hoàn tiền. Bạn có thể đánh giá trung thực, chọn nhận xét "Không giống mô tả" hoặc "Tay nghề chưa tốt".`,
    keywords: ["xau", "khong dep", "khong giong anh", "chat luong", "lam hong", "khong hai long"],
  },
  {
    id: "k-giao-file",
    audience: "khach",
    topic: "hoan-thanh",
    q: "Bao giờ tôi nhận ảnh/clip? Giao trễ thì sao?",
    a: `Hạn giao file ghi trong gói (thường 2 đến 7 ngày sau khi hoàn thành) và hiện trong chi tiết lịch. Người làm gửi đường link tải file; bạn kiểm tra rồi bấm "Đã nhận đủ file". Quá hạn mà chưa giao, người làm bị nhắc và bạn cũng nhận thông báo. Hãy ${REPORT_HOW} nếu vẫn chưa nhận được, và có thể chọn nhận xét "Giao ảnh trễ".`,
    keywords: ["giao anh", "giao file", "link anh", "tre file", "chua nhan anh"],
  },
  {
    id: "k-sua-anh",
    audience: "khach",
    topic: "hoan-thanh",
    q: "Muốn sửa ảnh hoặc thiếu file sau khi lịch đã hoàn thành?",
    a: `Số lượt sửa và đầu ra (bao nhiêu ảnh chỉnh, có ảnh gốc hay không) ghi trong gói của lịch hẹn. Tin nhắn đóng khi lịch hoàn thành, nên nếu cần yêu cầu sửa hoặc thiếu file, hãy ${REPORT_HOW} để 360đẹp liên hệ người làm. Ứng dụng chưa có nút yêu cầu sửa riêng.`,
    keywords: ["sua anh", "chinh anh", "thieu anh", "anh goc", "raw"],
  },
  {
    id: "k-quyen-anh",
    audience: "khach",
    topic: "hoan-thanh",
    q: "Người làm có được đăng ảnh của tôi lên mạng không?",
    a: `Khi đặt trực tiếp, bạn chọn ảnh dùng cho mục đích cá nhân hay kinh doanh và có cho người làm đăng lại làm tác phẩm hay không (đổi được khi lịch còn chờ xác nhận). Lịch tạo từ đăng yêu cầu mặc định là dùng cá nhân, không cho đăng lại. Người làm không được đăng ảnh có mặt bạn khi bạn chưa đồng ý; nếu thấy, hãy báo cáo để 360đẹp gỡ.`,
    keywords: ["dang anh", "ban quyen", "dung anh", "portfolio", "hinh cua toi"],
  },

  // ── Khách: đánh giá ───────────────────────────────────────────────────────
  {
    id: "k-danh-gia",
    audience: "khach",
    topic: "danh-gia",
    q: "Đánh giá hoạt động thế nào? Có thật không?",
    a: `Chỉ khách có lịch hoàn thành qua 360đẹp mới đánh giá được, trong ${REVIEW_WINDOW_DAYS} ngày sau khi hoàn thành. Đánh giá là "kín": hai bên không thấy đánh giá của nhau cho tới khi cả hai đã viết hoặc hết ${REVIEW_WINDOW_DAYS} ngày, nên không ai sửa đánh giá để trả đũa. Từ 3 sao trở xuống cần chọn ít nhất một điều chưa tốt. Bạn sửa được khi đánh giá chưa hiện; đã hiện thì không sửa, không xoá được. Điểm trung bình hiện khi có từ ${MIN_REVIEWS_FOR_AVERAGE} đánh giá.`,
    keywords: ["danh gia", "review", "sao", "nhan xet"],
  },
  {
    id: "k-xoa-danh-gia",
    audience: "chung",
    topic: "danh-gia",
    q: "Đánh giá có bị xoá hay ẩn không?",
    a: "Người làm không xoá, không sửa được đánh giá, chỉ trả lời công khai một lần. 360đẹp chỉ ẩn đánh giá vi phạm quy chế (xúc phạm, lộ thông tin cá nhân, quảng cáo, nội dung không liên quan đến buổi hẹn, đánh giá gian lận). Muốn báo một đánh giá vi phạm, hãy liên hệ đội hỗ trợ kèm đường link hồ sơ; ứng dụng chưa có nút báo cáo đánh giá.",
    keywords: ["xoa danh gia", "an danh gia", "danh gia sai", "bao cao danh gia"],
  },
  {
    id: "k-bi-danh-gia",
    audience: "khach",
    topic: "danh-gia",
    q: "Người làm có đánh giá khách không? Ai thấy?",
    a: `Có. Sau khi hoàn thành, người làm đánh giá khách một lần (từ 2 sao trở xuống phải nêu lý do). Đánh giá này không công khai: chỉ bạn, người viết và những người làm có lịch với bạn mới xem được, sau thời gian kín. Đánh giá về bạn bị xoá khi bạn xoá tài khoản.`,
    keywords: ["danh gia khach", "bi danh gia"],
  },

  // ── Khách: tin nhắn ───────────────────────────────────────────────────────
  {
    id: "k-tin-nhan",
    audience: "khach",
    topic: "tin-nhan",
    q: "Khi nào nhắn tin được với người làm? Số điện thoại hiện lúc nào?",
    a: "Tin nhắn mở khi người làm nhận lịch và đóng khi lịch kết thúc (hoàn thành, huỷ, hết hạn hoặc vắng mặt); lịch sử vẫn đọc được. Số điện thoại của bạn chỉ mở cho người làm khi họ đã nhận lịch (lịch còn chờ họ chỉ thấy tên), và số của người làm hiện cho bạn từ lúc đó. Hãy trao đổi qua tin nhắn trong app để có lịch sử khi cần đối chiếu, và đừng gửi mật khẩu, mã OTP hay thông tin thẻ qua tin nhắn.",
    keywords: ["nhan tin", "chat", "so dien thoai", "lien lac"],
  },
  {
    id: "k-chan",
    audience: "chung",
    topic: "tin-nhan",
    q: "Chặn một người thì có tác dụng gì?",
    a: "Khi một bên chặn, hai bên không nhắn tin được, khách không đặt lịch được với người làm đó, người làm không nhận được yêu cầu của khách đó. Người bị chặn không được thông báo. Bỏ chặn lúc nào cũng được bằng nút ⋯ trong cuộc trò chuyện với người đó.",
    keywords: ["chan", "block", "bo chan"],
  },

  // ── Khách: an toàn ────────────────────────────────────────────────────────
  {
    id: "k-an-toan",
    audience: "khach",
    topic: "an-toan",
    q: "Làm sao để an toàn khi mời người lạ tới nhà?",
    a: `Xem hồ sơ, tác phẩm và đánh giá trước khi đặt. Chia sẻ lịch hẹn cho người thân bằng nút "Chia sẻ lịch hẹn". Hẹn giờ có người khác ở nhà nếu bạn thấy an tâm hơn. Trao đổi qua tin nhắn trong app. Không cho người lạ (không phải người trong hồ sơ) vào nhà. Có vấn đề thì ${REPORT_HOW}; báo cáo không hiển thị với bên kia.`,
    keywords: ["an toan", "nguoi la", "nguy hiem"],
  },
  {
    id: "quay-roi",
    audience: "chung",
    topic: "an-toan",
    q: "Bị quấy rối, đe doạ hoặc có hành vi không phù hợp?",
    a: `Dừng buổi hẹn và rời đi hoặc đề nghị người kia rời đi. Nếu có nguy hiểm, gọi 113 (công an). Sau đó ${REPORT_HOW} hoặc trong cuộc trò chuyện, chọn "Hành vi không phù hợp", và chặn người đó. 360đẹp có thể khoá tài khoản vi phạm và cung cấp thông tin lịch hẹn cho cơ quan chức năng khi được yêu cầu.`,
    keywords: ["quay roi", "sam so", "de doa", "khiem nha", "tinh duc"],
  },
  {
    id: "tre-em",
    audience: "chung",
    topic: "an-toan",
    q: "Đặt dịch vụ cho trẻ em hoặc người dưới 18 tuổi được không?",
    a: "Người dưới 18 tuổi cần có cha mẹ hoặc người giám hộ đặt lịch và có mặt suốt buổi làm. Người làm có quyền từ chối làm cho người chưa thành niên không có người giám hộ đi cùng. Dịch vụ người mẫu chỉ dành cho người đủ 18 tuổi.",
    keywords: ["tre em", "be", "duoi 18", "vi thanh nien", "con nho"],
  },

  // ── Chung: khiếu nại & tranh chấp ────────────────────────────────────────
  {
    id: "bao-cao",
    audience: "chung",
    topic: "tranh-chap",
    q: "“Báo cáo vấn đề” hoạt động thế nào? Bao lâu có phản hồi?",
    a: `Nút báo cáo có trong chi tiết lịch hẹn, trong cuộc trò chuyện và trong tin tuyển mẫu. Chọn lý do, mô tả cụ thể (thời gian, chuyện đã xảy ra) và giữ lại ảnh, tin nhắn, biên lai liên quan. Báo cáo chỉ bạn và đội ngũ 360đẹp thấy. Đội ngũ được báo ngay, xác nhận trong 24 giờ làm việc, và bạn nhận thông báo khi báo cáo được xử lý xong.`,
    keywords: ["bao cao", "khieu nai", "to cao", "phan hoi"],
  },
  {
    id: "quy-trinh-tranh-chap",
    audience: "chung",
    topic: "tranh-chap",
    q: "360đẹp xử lý tranh chấp giữa khách và người làm ra sao?",
    a: `Bước 1: báo cáo sớm, tốt nhất trong 24 giờ sau sự việc, kèm bằng chứng (ảnh, tin nhắn trong app, biên lai chuyển khoản). Bước 2: 360đẹp xem lịch hẹn (phạm vi, giá, giờ đã chốt), tin nhắn và trao đổi với hai bên. Bước 3: kết quả có thể là nhắc nhở, đề nghị hai bên thoả thuận lại (làm lại, giảm giá), ẩn đánh giá hoặc tác phẩm vi phạm, điều chỉnh phí trong ví người làm, tạm khoá hoặc khoá tài khoản. 360đẹp không giữ tiền dịch vụ nên không thể tự hoàn tiền, nhưng sẽ cung cấp lịch sử lịch hẹn cho hai bên và cơ quan chức năng khi cần. Thoả thuận ngoài app không được xem xét.`,
    keywords: ["tranh chap", "giai quyet", "xu ly", "phan xu"],
  },
  {
    id: "hong-do-thuong-tich",
    audience: "chung",
    topic: "tranh-chap",
    q: "Làm hỏng đồ, làm bẩn nhà hoặc gây thương tích thì ai chịu?",
    a: `Người làm là bên cung cấp dịch vụ độc lập và chịu trách nhiệm về thiệt hại do mình gây ra; khách chịu trách nhiệm về thiệt hại gây cho người làm hoặc dụng cụ của họ. Hãy chụp ảnh ngay, trao đổi trong tin nhắn của lịch hẹn và ${REPORT_HOW} trong 24 giờ. 360đẹp ghi nhận, liên hệ hai bên và hỗ trợ cung cấp thông tin lịch hẹn; 360đẹp không phải đơn vị bảo hiểm và không tự chi trả bồi thường. Trường hợp thương tích nghiêm trọng, gọi 115 trước.`,
    keywords: ["hong do", "lam vo", "thuong tich", "boi thuong", "tai nan", "ban nha"],
  },

  // ── Khách: tài khoản ─────────────────────────────────────────────────────
  {
    id: "so-dien-thoai",
    audience: "chung",
    topic: "tai-khoan",
    q: "Vì sao phải có số điện thoại? Đổi số thế nào?",
    a: "Số điện thoại cần để đặt lịch, đăng yêu cầu, mở hồ sơ đối tác và để hai bên liên lạc khi lịch đã được nhận. Mỗi số chỉ gắn với một tài khoản. Bạn tự đổi số trong Cài đặt tài khoản. Hãy dùng đúng số của mình: số sai khiến người làm hoặc khách không liên lạc được và có thể bị xem là vi phạm.",
    keywords: ["so dien thoai", "doi so", "sdt"],
  },
  {
    id: "quen-mat-khau",
    audience: "chung",
    topic: "tai-khoan",
    q: "Quên mật khẩu thì làm sao?",
    a: "Bấm \"Quên mật khẩu\" ở trang đăng nhập; link đặt lại được gửi tới email của tài khoản. Tài khoản tạo bằng số điện thoại mà chưa thêm email thì chưa tự lấy lại được: hãy liên hệ đội hỗ trợ, và sau khi vào lại được, thêm email trong Cài đặt để lần sau tự xử lý. Bạn cũng có thể đăng nhập bằng Google (hoặc Apple trên iPhone) nếu đã dùng cách đó.",
    keywords: ["quen mat khau", "dang nhap", "mat khau"],
  },
  {
    id: "bi-khoa",
    audience: "khach",
    topic: "tai-khoan",
    q: "Tài khoản của tôi bị khoá?",
    a: "Tài khoản bị khoá do vi phạm quy chế không đặt lịch, đăng yêu cầu hay gửi tin nhắn được; bạn vẫn đăng nhập, xem và huỷ lịch, xác nhận hoàn thành, đánh giá được, và các lịch đã có vẫn tiếp tục. Liên hệ đội hỗ trợ để được xem xét.",
    keywords: ["bi khoa", "khoa tai khoan", "mo khoa"],
  },
  {
    id: "xoa-tai-khoan",
    audience: "khach",
    topic: "tai-khoan",
    q: "Xoá tài khoản thì dữ liệu nào bị xoá, dữ liệu nào còn?",
    a: "Vào Cài đặt tài khoản để xoá (cần không còn lịch đang chờ, đã xác nhận hoặc đang làm). Bị xoá: tên, số điện thoại, ảnh đại diện, địa chỉ đã lưu, mẫu đã lưu, thông báo, yêu cầu đã đăng, đánh giá người làm viết về bạn, ảnh trong tin nhắn và quyền đăng nhập. Còn lại nhưng không còn gắn với tên bạn: các lịch hẹn đã có (gồm địa chỉ của lịch đó), nội dung chữ trong tin nhắn và đánh giá bạn đã viết, vì đây cũng là hồ sơ của người làm.",
    keywords: ["xoa tai khoan", "xoa du lieu", "huy tai khoan"],
  },

  // ── Đối tác: bắt đầu & hồ sơ ─────────────────────────────────────────────
  {
    id: "d-dang-ky",
    audience: "doi-tac",
    topic: "ho-so",
    q: "Đăng ký làm đối tác cần những gì? Có mất phí không?",
    a: "Không có phí đăng ký hay phí duy trì. Cần tài khoản có số điện thoại, rồi làm 6 bước trong Studio: chọn nghề; chọn dịch vụ và mức giá từng gói; nơi phục vụ (tại nhà khách, studio hoặc cả hai, bán kính); xác nhận giờ làm; đăng ít nhất một tác phẩm do chính bạn làm; đọc, xác nhận chính sách rồi gửi duyệt.",
    keywords: ["dang ky", "doi tac", "mo ho so", "ctv", "lam doi tac"],
    links: [{ label: "Trang đối tác", href: "/doi-tac" }],
  },
  {
    id: "d-duyet-ho-so",
    audience: "doi-tac",
    topic: "ho-so",
    q: "Hồ sơ được duyệt thế nào, bao lâu? Bị từ chối thì sao?",
    a: `AI của 360đẹp duyệt ngay sau khi bạn gửi, thường trong vài phút (chậm nhất khi hệ thống quét lại sau mỗi 5 phút). Kết quả: được duyệt; cần chỉnh (kèm từng lý do); hoặc chưa được duyệt (chỉ khi có dấu hiệu lừa đảo, nội dung khiêu dâm hoặc toàn bộ ảnh là của người khác). Sửa theo góp ý rồi bấm "Gửi duyệt lại" là được xét lại. Mọi quyết định đều được nhân viên xem trong nhật ký và có thể đảo lại; nếu thấy AI sai, hãy liên hệ đội hỗ trợ.`,
    keywords: ["duyet", "ai duyet", "bi tu choi", "can chinh", "gui duyet"],
  },
  {
    id: "d-loi-thuong-gap-duyet",
    audience: "doi-tac",
    topic: "ho-so",
    q: "Những lỗi nào khiến hồ sơ hoặc bài đăng không được duyệt?",
    a: "Tên, giới thiệu, tiêu đề có số điện thoại, email, đường link, Zalo/Facebook/Instagram/TikTok… (chỉ được ghi 360dep.vn); ảnh chụp màn hình, ảnh mạng, ảnh có logo hay watermark của nơi khác, ảnh có mã QR hoặc số điện thoại; ảnh khiêu dâm, bạo lực; ảnh không phải do bạn tự tải lên; thiếu dịch vụ, giờ làm hoặc tác phẩm; tên hiển thị quá ngắn. Ảnh xấu hay chụp chưa đẹp không phải lý do bị ẩn.",
    keywords: ["loi duyet", "watermark", "anh mang", "so dien thoai trong ho so"],
  },
  {
    id: "d-bat-nhan-khach",
    audience: "doi-tac",
    topic: "ho-so",
    q: "Đã được duyệt sao chưa có khách?",
    a: `Sau khi được duyệt, bạn cần tự bật "Đang nhận khách mới" trong Studio; hệ thống không tự bật. Ngoài ra kiểm tra: ví không âm (xem mục phí), giờ làm và bán kính hợp lý, đã chọn đủ gói. Đối tác mới được ưu tiên xuất hiện xen kẽ trên trang chủ trong 14 ngày đầu.`,
    keywords: ["chua co khach", "khong co don", "nhan khach moi", "bat nhan"],
  },
  {
    id: "d-sua-ho-so",
    audience: "doi-tac",
    topic: "ho-so",
    q: "Sửa hồ sơ sau khi được duyệt có phải duyệt lại không?",
    a: "Sửa tên, giới thiệu, nghề, giá hay giờ làm sau khi đã được duyệt không phải duyệt lại. Bài đăng mới hiện ngay và được AI xem sau. Bạn có thể tự ẩn hồ sơ; hiện lại thì không cần duyệt lại. Bỏ một nghề thì các dịch vụ của nghề đó tự tắt.",
    keywords: ["sua ho so", "duyet lai", "an ho so"],
  },
  {
    id: "d-chon-gia",
    audience: "doi-tac",
    topic: "ho-so",
    q: "Tôi tự đặt giá được không? Muốn làm dịch vụ chưa có trong danh mục?",
    a: `Không tự đặt giá. Mỗi gói có đúng 3 mức ${LEVELS}; bạn chọn một mức cho từng gói và đổi được bất cứ lúc nào. Lịch đã tạo giữ nguyên giá lúc đặt. Bạn chỉ chọn dịch vụ trong danh mục chuẩn và thuộc nghề đã khai; dịch vụ chỉ làm tại studio cần có địa chỉ studio. Muốn đề xuất thêm dịch vụ, liên hệ đội hỗ trợ: 360đẹp xem xét và thêm vào danh mục chung.`,
    keywords: ["tu dat gia", "doi gia", "muc gia", "them dich vu", "dich vu moi"],
  },
  {
    id: "d-tac-pham",
    audience: "doi-tac",
    topic: "ho-so",
    q: "Đăng tác phẩm có giới hạn gì?",
    a: `Chỉ đăng ảnh, clip do chính bạn làm. Mỗi bài trên web tối đa 5 ảnh (ảnh đầu là ảnh bìa), hoặc 2 ảnh trước/sau, hoặc một clip dọc tối đa ${VIDEO_MAX_SECONDS} giây và ${VIDEO_MAX_MB} MB (quay 1080p, không cần 4K); mỗi tài khoản lưu tối đa 30 clip. Ảnh và clip được xoá thông tin vị trí trước khi tải lên. Không đăng ảnh có mặt khách khi khách chưa đồng ý cho đăng lại.`,
    keywords: ["tac pham", "portfolio", "dang anh", "clip", "video"],
  },
  {
    id: "d-bai-bi-an",
    audience: "doi-tac",
    topic: "ho-so",
    q: "Bài đăng của tôi bị ẩn?",
    a: "Bài bị ẩn khi vi phạm tiêu chí ảnh (ảnh mạng, watermark, thông tin liên hệ, nội dung không phù hợp). Bạn nhận thông báo kèm lý do và thấy lý do ngay dưới bài. Đổi ảnh thì bài được xét lại và tự hiện nếu đạt. Bài do nhân viên ẩn thì không tự hiện lại; liên hệ đội hỗ trợ nếu bạn cho là nhầm.",
    keywords: ["bi an", "an bai", "bai dang bi an"],
  },
  {
    id: "d-nguoi-mau",
    audience: "doi-tac",
    topic: "ho-so",
    q: "Tôi làm người mẫu, đăng ký được chưa?",
    a: IDENTITY_VERIFICATION_OPEN
      ? "Dịch vụ người mẫu và tin tuyển mẫu yêu cầu xác minh danh tính (CCCD + ảnh chân dung) và đủ 18 tuổi. Xác minh trong Studio › Xác minh danh tính."
      : "Dịch vụ người mẫu và tin tuyển mẫu yêu cầu xác minh danh tính và đủ 18 tuổi. Xác minh danh tính sẽ mở sau, nên hai nhóm này đang tạm đóng; 360đẹp sẽ báo trong ứng dụng khi mở.",
    keywords: ["nguoi mau", "model", "tuyen mau", "casting"],
  },

  // ── Đối tác: giờ làm & phạm vi ───────────────────────────────────────────
  {
    id: "d-gio-lam",
    audience: "doi-tac",
    topic: "lich-lam",
    q: "Cài giờ làm, ngày nghỉ, giờ bận thế nào?",
    a: "Giờ làm lưu theo tuần, mỗi ngày có thể nhiều khung không chồng nhau; khách thấy giờ trống mỗi 30 phút. Ngày nghỉ làm cả ngày không nhận lịch. Giờ bận chặn một khung cụ thể (trong 60 ngày tới) mà không ảnh hưởng lịch đã có. Mặc định giữa hai lịch có 30 phút đệm và tối đa 6 lịch mỗi ngày; muốn đổi hai số này, liên hệ đội hỗ trợ.",
    keywords: ["gio lam", "ngay nghi", "gio ban", "lich lam"],
  },
  {
    id: "d-ban-kinh",
    audience: "doi-tac",
    topic: "lich-lam",
    q: "Bán kính phục vụ và phí di chuyển tính từ đâu?",
    a: `Bán kính đặt từ 1 đến 30 km, tính từ khu vực (quận/huyện) bạn khai, không phải địa chỉ nhà bạn. Khách ngoài bán kính không đặt tại nhà được. Phí di chuyển khách trả (miễn phí ${POLICY.freeTravelKm} km đầu, sau đó ${vnd(POLICY.travelFeePerKm)}/km, tối đa ${vnd(POLICY.travelFeeCap)}) thuộc về bạn 100% và không tính hoa hồng.`,
    keywords: ["ban kinh", "pham vi", "phi di chuyen", "xa"],
  },
  {
    id: "d-tam-nghi",
    audience: "doi-tac",
    topic: "lich-lam",
    q: "Muốn tạm nghỉ không nhận khách?",
    a: `Tắt "Đang nhận khách mới" trong Studio: khách không đặt được và bạn không nhận yêu cầu mới, các lịch đã nhận vẫn giữ. Bật lại khi ví đang âm sẽ bị chặn cho tới khi nạp đủ phí.`,
    keywords: ["tam nghi", "nghi phep", "tat nhan khach"],
  },

  // ── Đối tác: nhận lịch ───────────────────────────────────────────────────
  {
    id: "d-nhan-lich",
    audience: "doi-tac",
    topic: "dat-lich",
    q: "Khách đặt lịch, tôi phải nhận trong bao lâu?",
    a: `Trong ${POLICY.confirmWithinHours} giờ (không quá giờ hẹn). Lịch đặt từ 21:00 đến 08:00 có hạn tới 10:00 sáng hôm sau, nhưng không muộn hơn 1 giờ trước giờ hẹn. Quá hạn lịch tự hết hạn. Xem kỹ giờ, địa chỉ, ghi chú rồi bấm "Nhận lịch"; nhận rồi tin nhắn mở và hai bên thấy số điện thoại của nhau. Ví âm thì không nhận được lịch.`,
    keywords: ["nhan lich", "xac nhan", "han nhan", "het han"],
  },
  {
    id: "d-tu-choi",
    audience: "doi-tac",
    topic: "dat-lich",
    q: "Tôi từ chối lịch được không?",
    a: "Được, với lịch còn chờ xác nhận, kèm lý do ngắn nếu muốn. Từ chối không bị phạt. Khách được báo để chọn người khác.",
    keywords: ["tu choi", "khong nhan"],
  },
  {
    id: "d-huy",
    audience: "doi-tac",
    topic: "huy-doi",
    q: "Tôi huỷ lịch đã nhận được không?",
    a: "Được, trước giờ hẹn; từ giờ hẹn trở đi không huỷ được. Hiện huỷ không bị trừ tiền và không ảnh hưởng thuật toán xếp hạng, nhưng khách được báo, có thể báo cáo và để lại ấn tượng xấu. Huỷ sát giờ nhiều lần có thể bị hạn chế hoặc khoá hồ sơ theo quy chế. Nếu không chắc làm được, hãy từ chối ngay từ đầu thay vì nhận rồi huỷ.",
    keywords: ["huy lich", "doi tac huy", "huy don"],
  },
  {
    id: "d-doi-gio",
    audience: "doi-tac",
    topic: "huy-doi",
    q: "Muốn đổi giờ với khách?",
    a: "Gửi đề nghị giờ mới trong chi tiết lịch; giờ mới phải nằm trong giờ làm và còn trống. Khách đồng ý thì lịch đổi giờ, giá và phụ phí giữ nguyên. Đừng chỉ hẹn lại qua điện thoại: hệ thống nhắc lịch, báo vắng mặt và tự hoàn thành theo giờ trong app.",
    keywords: ["doi gio", "doi lich"],
  },
  {
    id: "d-viec-moi",
    audience: "doi-tac",
    topic: "dat-lich",
    q: "“Việc mới” là gì? Vì sao tôi không nhận được yêu cầu?",
    a: "Việc mới là yêu cầu khách đăng: người bấm \"Nhận việc\" trước được làm, lịch xác nhận ngay. Bạn chỉ nhận được khi: đang nhận khách, ví không âm, cùng thành phố, niêm yết đúng gói và đúng mức giá khách chọn, trong bán kính, còn giờ trống, tổng tiền không vượt mức khách đồng ý, và hai bên không chặn nhau. Thông báo chỉ gửi một lần lúc khách đăng cho những ai đủ điều kiện lúc đó.",
    keywords: ["viec moi", "yeu cau", "nhan viec", "khong nhan duoc"],
  },

  // ── Đối tác: tại buổi hẹn ────────────────────────────────────────────────
  {
    id: "d-bat-dau",
    audience: "doi-tac",
    topic: "tai-cho",
    q: "Khi nào bấm “Bắt đầu”?",
    a: `Bấm khi bạn đã có mặt và bắt đầu làm; nút mở từ 15 phút trước giờ hẹn. Chỉ bấm khi đã thực sự tới nơi: bấm rồi khách không báo "Người làm không đến" được nữa, nên bấm khi chưa tới là vi phạm.`,
    keywords: ["bat dau", "start", "check in"],
  },
  {
    id: "d-tre-gio",
    audience: "doi-tac",
    topic: "tai-cho",
    q: "Tôi có thể đến trễ, phải làm gì?",
    a: `Nhắn khách ngay trong tin nhắn của lịch hẹn, nói rõ giờ tới. Sau giờ hẹn ${NO_SHOW_AFTER_MIN} phút, nếu bạn chưa bấm "Bắt đầu", khách có quyền báo bạn không đến (lịch bị huỷ). Đến trễ không được rút bớt nội dung gói.`,
    keywords: ["tre gio", "den muon", "ket xe"],
  },
  {
    id: "d-khach-vang-mat",
    audience: "doi-tac",
    topic: "vang-mat",
    q: "Tới nơi mà khách không có nhà, không nghe máy?",
    a: `Chờ ít nhất ${NO_SHOW_AFTER_MIN} phút sau giờ hẹn, gọi và nhắn khách trong app, chụp ảnh tại địa điểm làm bằng chứng. Sau đó bấm "Khách vắng mặt" trong chi tiết lịch (web). Không tính hoa hồng. Nếu lịch có phí di chuyển, 360đẹp bù cho bạn đúng bằng khoản đó, cộng vào ví sau 24 giờ nếu khách không khiếu nại; lịch tại studio hoặc trong ${POLICY.freeTravelKm} km không có phí di chuyển nên không có khoản bù. Khách khiếu nại thì nhân viên xem xét và báo kết quả cho bạn.`,
    keywords: ["khach vang mat", "khach khong co nha", "bom hang", "khong nghe may"],
  },
  {
    id: "d-bi-bao-khong-den",
    audience: "doi-tac",
    topic: "vang-mat",
    q: "Khách báo tôi không đến nhưng tôi có đến?",
    a: `Lịch đó đã bị huỷ (ghi lỗi về bạn) và đội ngũ được báo. Trong 24 giờ, bấm "Khiếu nại" ngay trong chi tiết lịch hẹn và mô tả chuyện đã xảy ra (giờ tới, cuộc gọi, tin nhắn); ảnh tại địa điểm thì gửi thêm qua "${REPORT}". Mỗi lịch khiếu nại một lần; nhân viên xem xét và báo kết quả cho bạn. Không đến nhiều lần có thể bị tạm khoá nhận lịch.`,
    keywords: ["bi bao khong den", "khieu nai", "toi co den"],
  },
  {
    id: "d-lam-them-tai-cho",
    audience: "doi-tac",
    topic: "tai-cho",
    q: "Khách muốn làm thêm tại chỗ, tôi thu thêm tiền được không?",
    a: `Không thu tiền ngoài lịch hẹn. Hãy hướng dẫn khách bấm "Đặt thêm dịch vụ" trong chi tiết lịch: lịch mới nối tiếp ngay sau lịch hiện tại, cùng địa điểm, theo giá bạn niêm yết, không tính phí di chuyển hay phí gấp; bạn bấm "Nhận lịch" như thường. Thu tiền ngoài app vi phạm quy chế, không được ghi nhận và bạn không được 360đẹp hỗ trợ nếu khách không trả hay khiếu nại.`,
    keywords: ["lam them", "thu them", "phat sinh", "them tien"],
  },
  {
    id: "d-khach-khong-tra",
    audience: "doi-tac",
    topic: "thanh-toan",
    q: "Khách không trả tiền hoặc trả thiếu?",
    a: `Nhắc khách nhẹ nhàng và nhắn trong tin nhắn của lịch hẹn số tiền còn thiếu. Đừng bấm "Đã nhận tiền" hay "Hoàn thành" khi chưa được trả đủ; hãy ${REPORT_HOW} ngay, kèm tin nhắn và biên lai (nếu có). 360đẹp liên hệ khách, có thể khoá tài khoản vi phạm và xem xét điều chỉnh phí của lịch đó trong ví bạn khi xác minh được khách không trả. Nếu bị đe doạ, rời đi và gọi 113.`,
    keywords: ["khong tra tien", "quyt", "tra thieu", "bung tien"],
  },
  {
    id: "d-an-toan",
    audience: "doi-tac",
    topic: "an-toan",
    q: "Đến nhà khách thấy không an toàn?",
    a: "Bạn có quyền không vào hoặc dừng buổi làm khi thấy không an toàn (khách say xỉn, có hành vi khiếm nhã, địa điểm khác với địa chỉ trong lịch, có người lạ gây áp lực). Rời đi, nhắn lý do trong app, báo cáo và chặn nếu cần; nguy hiểm thì gọi 113. Hãy cho người thân biết lịch làm của bạn.",
    keywords: ["an toan", "nguy hiem", "say xin", "khiem nha"],
  },
  {
    id: "d-di-ung-khach",
    audience: "doi-tac",
    topic: "tai-cho",
    q: "Làm sao tránh rủi ro dị ứng, kích ứng cho khách?",
    a: "Đọc ghi chú của khách và hỏi trước khi làm về dị ứng, da nhạy cảm, thai kỳ. Với keo nối mi, thuốc nhuộm, sáp wax, tinh dầu, nên thử một vùng nhỏ. Dùng sản phẩm có nguồn gốc rõ ràng, dụng cụ sạch. Khách có phản ứng thì dừng ngay, hướng dẫn rửa sạch, khuyên đi khám (nặng thì gọi 115) và nhắn lại sự việc trong app. Dịch vụ phun xăm cần đáp ứng điều kiện hành nghề theo quy định.",
    keywords: ["di ung", "kich ung", "an toan khach", "phun xam"],
  },

  // ── Đối tác: hoàn thành & giao file ──────────────────────────────────────
  {
    id: "d-hoan-thanh",
    audience: "doi-tac",
    topic: "hoan-thanh",
    q: "Khi nào bấm “Hoàn thành”? Không bấm thì sao?",
    a: `Nhận tiền xong thì bấm "Đã nhận tiền" để lưu xác nhận (khách được báo), rồi bấm "Hoàn thành". Khách cũng có thể bấm "Xác nhận đã xong"; nếu không ai bấm, lịch tự hoàn thành ${AUTO_COMPLETE_HOURS} giờ sau giờ kết thúc. Khi hoàn thành, hoa hồng được trừ vào ví, tin nhắn đóng và mở phần đánh giá ${REVIEW_WINDOW_DAYS} ngày. Gói nhiều buổi chỉ hoàn thành được khi đã làm đủ các buổi.`,
    keywords: ["hoan thanh", "xong viec", "tu hoan thanh"],
  },
  {
    id: "d-giao-file",
    audience: "doi-tac",
    topic: "hoan-thanh",
    q: "Giao ảnh/clip cho khách thế nào, hạn bao lâu?",
    a: "Hạn giao tính từ lúc hoàn thành theo số ngày ghi trong gói (thường 2 đến 7 ngày). Gửi một đường link tải (http/https) trong chi tiết lịch; bạn sửa link được cho tới khi khách bấm \"Đã nhận đủ file\". Giao đủ số ảnh, số lượt sửa và loại file ghi trong gói. Quá hạn, bạn bị nhắc và khách cũng được báo; khách có thể báo cáo và đánh giá \"Giao ảnh trễ\". Đảm bảo link còn hạn ít nhất 30 ngày.",
    keywords: ["giao file", "giao anh", "link", "han giao"],
  },

  // ── Đối tác: phí, ví & nạp tiền ──────────────────────────────────────────
  {
    id: "d-hoa-hong",
    audience: "doi-tac",
    topic: "vi-phi",
    q: "360đẹp thu phí đối tác thế nào?",
    a: `Một mức hoa hồng ${pct(POLICY.commissionRate)} trên giá dịch vụ (làm tròn tới 1.000đ), cho mọi lịch. Không tính trên phí di chuyển và phí đặt gấp; hai khoản này bạn giữ 100%. Phí chỉ trừ khi lịch hoàn thành; lịch bị huỷ, từ chối, hết hạn hay vắng mặt không bị trừ. Không có phí đăng ký, phí duy trì hay phí mua vị trí.`,
    keywords: ["hoa hong", "phi", "chiet khau", "15%"],
  },
  {
    id: "d-vi-am",
    audience: "doi-tac",
    topic: "vi-phi",
    q: "Vì sao tôi bị chặn nhận lịch? “Trả phí trước đơn tiếp” là sao?",
    a: "Khách trả tiền thẳng cho bạn, nên hoa hồng được ghi thành khoản phí trong ví khi lịch hoàn thành. Ví âm (dù chỉ 1đ) thì bạn tạm không nhận lịch, nhận việc mới hay bật lại nhận khách, và khách thấy bạn đang tạm không nhận job. Nạp đủ là mở lại ngay. Để không bị gián đoạn, hãy nạp trước một khoản vào ví. Phí nợ không tính lãi.",
    keywords: ["vi am", "bi chan", "no phi", "khong nhan duoc lich", "tra phi"],
  },
  {
    id: "d-nap-tien",
    audience: "doi-tac",
    topic: "vi-phi",
    q: "Nạp tiền vào ví thế nào? Ghi sai nội dung thì sao?",
    a: "Mở Studio › Ví: chuyển khoản tới tài khoản hiện trên màn hình với nội dung đúng mã DEP kèm mã riêng của bạn (viết liền, ví dụ DEPAB12CD). Tiền được cộng tự động khi ngân hàng báo về, mỗi giao dịch một lần. Ghi sai hoặc thiếu nội dung, hãy gửi ảnh biên lai cho đội hỗ trợ để được cộng tay. Chỉ chuyển theo thông tin trong ứng dụng, không theo số tài khoản ai đó nhắn cho bạn.",
    keywords: ["nap tien", "chuyen khoan", "noi dung", "dep", "ma nap"],
  },
  {
    id: "d-rut-tien",
    audience: "doi-tac",
    topic: "vi-phi",
    q: "Số dư trong ví rút ra được không?",
    a: "Hiện chưa rút được. Số dư dương (tiền nạp trước, tiền voucher khách dùng, thưởng giới thiệu, khoản bù khi khách vắng mặt) được dùng để trừ phí các lịch sau.",
    keywords: ["rut tien", "so du", "vi"],
  },
  {
    id: "d-voucher-khach",
    audience: "doi-tac",
    topic: "vi-phi",
    q: "Khách dùng voucher thì tôi có bị thiệt không?",
    a: "Không. Khách trả bạn ít hơn đúng bằng giá trị voucher; khi lịch hoàn thành, 360đẹp cộng phần đó vào ví bạn. Hoa hồng vẫn tính trên giá dịch vụ gốc.",
    keywords: ["voucher", "giam gia", "khach dung voucher"],
  },
  {
    id: "d-gioi-thieu",
    audience: "doi-tac",
    topic: "vi-phi",
    q: "Giới thiệu đối tác khác có được thưởng không?",
    a: "Có. Người được giới thiệu nhập mã của bạn (một lần, trong 30 ngày đầu, khi chưa có lịch hoàn thành). Khi họ hoàn thành lịch cho 3 khách khác nhau trong 90 ngày, mỗi bên được 100.000đ vào ví (số tiền theo cấu hình hiện hành của chương trình). Mỗi người giới thiệu tối đa 20 lượt thưởng mỗi tháng.",
    keywords: ["gioi thieu", "thuong", "ma gioi thieu", "referral"],
  },
  {
    id: "d-hoa-don-thue",
    audience: "doi-tac",
    topic: "vi-phi",
    q: "Hoá đơn phí và thuế của đối tác?",
    a: "Bạn là cá nhân kinh doanh độc lập và tự chịu nghĩa vụ thuế với thu nhập của mình; 360đẹp có thể phải cung cấp thông tin người bán cho cơ quan thuế theo quy định. Cần hoá đơn cho khoản phí đã trả 360đẹp, hãy liên hệ đội hỗ trợ.",
    keywords: ["hoa don", "thue", "thue tncn"],
  },

  // ── Đối tác: đánh giá & xếp hạng ─────────────────────────────────────────
  {
    id: "d-danh-gia",
    audience: "doi-tac",
    topic: "danh-gia",
    q: "Bị đánh giá thấp, tôi làm gì được?",
    a: `Bạn không xoá hay sửa được đánh giá, nhưng được trả lời công khai một lần khi đánh giá đã hiện (trả lời rồi không sửa được, nên hãy bình tĩnh và lịch sự). Đánh giá vi phạm quy chế (xúc phạm, sai sự thật rõ ràng, lộ thông tin cá nhân) thì liên hệ đội hỗ trợ để xem xét ẩn. Điểm trung bình chỉ hiện khi có từ ${MIN_REVIEWS_FOR_AVERAGE} đánh giá.`,
    keywords: ["danh gia thap", "danh gia xau", "tra loi danh gia"],
  },
  {
    id: "d-danh-gia-khach",
    audience: "doi-tac",
    topic: "danh-gia",
    q: "Tôi đánh giá khách được không?",
    a: `Được, một lần trong ${REVIEW_WINDOW_DAYS} ngày sau khi hoàn thành, không sửa được; từ 2 sao trở xuống cần nêu lý do. Đánh giá này không công khai: khách đó và những người làm có lịch với khách đó mới thấy, giúp mọi người biết trước khách hay huỷ hay vắng mặt.`,
    keywords: ["danh gia khach", "review khach"],
  },
  {
    id: "d-xep-hang",
    audience: "doi-tac",
    topic: "danh-gia",
    q: "Thứ tự hiển thị hồ sơ được xếp thế nào? Mua vị trí được không?",
    a: `Không bán vị trí. Thứ tự dựa trên đánh giá thật (có điều chỉnh để hồ sơ ít đánh giá không bị đẩy lên hay dìm xuống quá mức), số lịch đã hoàn thành và trạng thái xác minh danh tính${IDENTITY_VERIFICATION_OPEN ? "" : " (hiện chưa mở)"}; trang chủ còn xét độ gần và tác phẩm mới. Đối tác mới được xen kẽ trên trang chủ trong 14 ngày đầu. Cách tăng thứ hạng bền nhất: tác phẩm thật, đẹp; nhận lịch nhanh; đúng giờ; được khách đánh giá tốt.`,
    keywords: ["xep hang", "thu hang", "len top", "hien thi", "mua vi tri"],
  },

  // ── Đối tác: tin nhắn & tài khoản ────────────────────────────────────────
  {
    id: "d-giao-dich-ngoai",
    audience: "doi-tac",
    topic: "tin-nhan",
    q: "Tôi có được hẹn khách giao dịch trực tiếp, ngoài 360đẹp không?",
    a: "Không với khách bạn gặp qua 360đẹp. Kéo khách ra ngoài để né phí, xin cọc hay để thông tin liên hệ trong hồ sơ, bài đăng là vi phạm và có thể bị ẩn bài, khoá hồ sơ. Giao dịch ngoài app cũng không được ghi nhận, nên nếu khách không trả tiền, huỷ sát giờ hay khiếu nại, 360đẹp không hỗ trợ được bạn.",
    keywords: ["ngoai app", "ne phi", "keo khach", "giao dich truc tiep"],
  },
  {
    id: "d-tam-khoa",
    audience: "doi-tac",
    topic: "tai-khoan",
    q: "Hồ sơ của tôi bị tạm khoá?",
    a: "Khi bị khoá, hồ sơ và tác phẩm ẩn với khách, bạn không nhận lịch hay việc mới; bạn nhận thông báo kèm lý do. Các lịch đã nhận vẫn còn: hãy hoàn thành hoặc liên hệ hỗ trợ để xử lý. Liên hệ đội hỗ trợ để được xem xét mở lại.",
    keywords: ["tam khoa", "bi khoa", "khoa ho so"],
  },
  {
    id: "d-xoa-tai-khoan",
    audience: "doi-tac",
    topic: "tai-khoan",
    q: "Đối tác xoá tài khoản thì sao?",
    a: "Cần không còn lịch đang chờ, đã nhận hoặc đang làm. Bị xoá: tác phẩm, dịch vụ và giá, giờ làm, ngày nghỉ, địa chỉ, dữ liệu xác minh, tin tuyển mẫu, đánh giá bạn viết về khách, quyền đăng nhập. Còn lại: các lịch hẹn, lịch sử ví (kể cả phí còn nợ), đánh giá của khách về bạn (hiện tên \"Chuyên viên đã rời nền tảng\"), nội dung chữ trong tin nhắn.",
    keywords: ["xoa tai khoan", "nghi lam", "roi nen tang"],
  },
]

export const HELP_ENTRIES: HelpEntry[] = ENTRIES

export const isHelpAudience = (value: unknown): value is HelpAudience => value === "khach" || value === "doi-tac"

/** What one side sees: their own entries plus the shared ones, in topic order. */
export function entriesFor(audience: HelpAudience): HelpEntry[] {
  return HELP_ENTRIES.filter((e) => e.audience === audience || e.audience === "chung")
}

export const getEntry = (id: string) => HELP_ENTRIES.find((e) => e.id === id)
