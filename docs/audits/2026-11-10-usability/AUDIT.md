# Audit độ dễ dùng 360đẹp: khách và KTV (10/11/2026)

Chưa sửa code. Ảnh trong `mockups/` do Codex vẽ, là đề xuất, chưa phải giao diện đã làm.

## Kết luận

App không khó vì màu hay bố cục từng màn. Nó khó vì ba chuyện lặp lại ở cả hai phía:

1. **Màn hình kể thông tin, không nói việc cần làm.** Nút quan trọng nhất (Nhận lịch, Xác nhận đã xong, Viết đánh giá) nằm cuối một trang dài. Danh sách lịch chỉ ghi trạng thái, không ghi "cần bạn làm gì".
2. **Phía KTV là nửa cái app.** Nạp ví, báo ngày nghỉ, khiếu nại, tài khoản nhận tiền đều mở trình duyệt và có thể phải đăng nhập lại. KTV đăng nhập xong rơi vào giao diện khách.
3. **Một thứ có nhiều tên.** Cùng một tính năng có 6 tên phía khách và 4 tên phía KTV; người làm được gọi bằng 5 cách.

Ngoài ra có một lỗi làm trắng màn hình ngay sau khi khách gửi lịch (mục 0).

## Đã kiểm tra thế nào

- Chạy app thật trên iOS Simulator, code `main` (`5dbe9eb`, bản 1.5.0), dữ liệu thử trên Supabase local. Đi hết: khách đặt lịch → KTV đăng nhập → nhận lịch → các tab Studio. Ảnh trong `screenshots/` (`c*` là khách, `p*` là KTV).
- Đọc code toàn bộ luồng khách và luồng KTV để đếm số bước và tìm chỗ bị đẩy ra web.
- Chưa thử: Android, máy thật, đăng nhập Apple/Google, luồng đăng ký KTV mới từ đầu, spa, chat, thanh toán QR, chữ cỡ lớn. Các mục ghi "đọc code" là chưa bấm thử.

## 0. Lỗi phải sửa trước mọi thứ

| Lỗi | Bằng chứng |
|---|---|
| **Bấm "Gửi lịch hẹn" xong app trắng màn hình.** Lịch vẫn được tạo, nhưng khách không thấy màn "Đã gửi lịch", phải tắt app mở lại. Khách dễ tưởng chưa đặt được và đặt lần nữa. | Tái hiện được: `screenshots/c07-after-submit.jpg`, `c08-after-dismiss.jpg`. Nguyên nhân: `app/book/[proId].tsx:216` thoát sớm trước `useRef` ở dòng 245. Vào code ngày 09/11 (commit `ee80de8`). |
| Cùng chỗ đó: mở màn đặt lịch khi dữ liệu chưa tải xong (ví dụ từ link, từ "Đặt lại" lúc vừa mở app) có thể lỗi tương tự. | Đọc code, dòng 205–214; chưa tái hiện. |

Bản 1.5.0 chưa lên store thì lỗi này chưa tới tay khách. Cần sửa trước khi build.

## 1. KTV

| # | KTV gặp gì | Bằng chứng | Hướng sửa |
|---|---|---|---|
| K1 | Đăng nhập xong vào tab "Tôi" của khách. Đang có đơn chờ nhận, đồng hồ 2 giờ đang chạy, không có gì báo. Phải tự tìm dòng "Chuyển sang 360dep Đối tác" giữa danh sách. | `p01-after-login.jpg` | Tài khoản có hồ sơ đối tác thì đăng nhập xong vào thẳng Studio. |
| K2 | Mở đơn mới: nút "Nhận lịch" nằm sau 6 khối thông tin, phải cuộn hai màn. | `p03`, `p04` | Thanh cố định ở đáy: Từ chối và Nhận lịch. Mockup 02. |
| K3 | Tiền ghi "Bạn nhận 410.000đ", nhưng thực tế KTV cầm 500.000đ của khách rồi nợ lại 90.000đ. Ở Hôm nay con số 410.000đ đứng một mình không có chữ. | `p02`, `p04` | Ba dòng: Khách đưa bạn / Bạn chuyển lại 360đẹp / Bạn giữ. Mockup 02. |
| K4 | Không nạp ví, không trả phí được trong app. "Nạp ví" mở web. Bấm Hoàn thành xong không ai nhắc khoản phí vừa phát sinh, tới lúc nút Nhận lịch bị khoá mới biết. | `p10`; `studio/toi.tsx:125`, `fee-card.tsx:74` | Màn Ví trong app, có QR và lịch sử. Sau Hoàn thành hiện luôn phí của đơn. Mockup 04. |
| K5 | Báo ngày nghỉ chỉ làm được trên web. Trong app chỉ có công tắc tắt hết. | `p09` | Chọn ngày nghỉ ngay trong tab Lịch. Mockup 03. |
| K6 | Đơn khách đặt thẳng mình nằm ở Hôm nay; tab "Đơn khách" lại chỉ có đơn chung. Tab không có số báo. | `p02`, `p07`; `studio/_layout.tsx` | Gom mọi đơn cần trả lời về một chỗ, tab có số đếm. Mockup 01. |
| K7 | Đã nhận đơn, còn xa giờ hẹn: không có gợi ý bước kế. "Tôi đang đến" chỉ hiện từ 3 giờ trước, "Bắt đầu làm" từ 15 phút trước, không giải thích. | `p06`; `bookings/[id].tsx:202` (đọc code) | Một dòng "Bước tiếp: … mở lúc HH:MM". Mockup 01. |
| K8 | Hồ sơ đối tác là một trang cuộn dài với 6 chip bước, dùng chung cho đăng ký lẫn sửa. KTV đã duyệt vẫn thấy bước "4 Giờ làm" chưa tick. | `p11-ho-so.jpg` | Mỗi bước một màn một câu hỏi; sửa giá, giờ, khu vực thành các màn riêng mở từ Tôi. |
| K9 | Chưa gửi duyệt hoặc đang chờ duyệt: Hôm nay vẫn hiện "Tuần này 0đ", "Hôm nay trống lịch". Không có lối "làm tiếp hồ sơ". | `studio/index.tsx:67`, `studio/toi.tsx:80` (đọc code) | Thay Hôm nay bằng thẻ "Còn thiếu X bước" hoặc "Đang chờ duyệt". |
| K10 | Khách báo KTV không đến: KTV khiếu nại phải ra web, hạn 24 giờ. | `bookings/[id].tsx:427` (đọc code) | Dùng lại form khiếu nại trong app của khách. |
| K11 | Mỗi thao tác xong đều bật hộp thoại phải bấm OK. Nhận lịch ở Hôm nay thì ngược lại: một chạm là nhận, không hỏi, không báo. | `p05-accepted-alert.jpg` | Báo nhẹ ở đáy màn hình, kèm nút "Nhắn khách". |
| K12 | Tên gọi: Đơn khách / Việc mới / yêu cầu / Nhận việc / Nhận đơn / Nhận lịch. "Network MCN", "Xác minh danh tính" (đang tắt) vẫn nằm trong menu. | `p07`, `p10` | Chốt "Đơn" và "Nhận lịch"; ẩn mục chưa dùng. |

Chỗ KTV bị đẩy ra trình duyệt: ví và nạp ví, ngày nghỉ, khiếu nại báo vắng, tài khoản nhận tiền và mã QR, chính sách phí, quy chế, MCN, xác minh danh tính.

## 2. Khách

| # | Khách gặp gì | Bằng chứng | Hướng sửa |
|---|---|---|---|
| C1 | Gửi đơn "Đặt theo nhu cầu" xong, mở Lịch hẹn thấy "Chưa có lịch sắp tới". Đơn nằm sau một dòng banner không có số. | `c03-lich-hen.jpg` | Đơn đang tìm Artist nằm chung danh sách Sắp tới. Mockup 05. |
| C2 | Dòng lịch chỉ ghi trạng thái. Việc cần làm (xác nhận đã xong, đánh giá, Artist đề nghị đổi giờ) phải mở từng lịch, cuộn xuống cuối mới thấy. | `components/booking-row.tsx:59`, `bookings/[id].tsx:354` (đọc code) | Dòng "Cần bạn: …" ngay trên thẻ lịch, nút chính cố định ở đáy. Mockup 05. |
| C3 | Không đổi giờ được trong app, chỉ có nút "mở trên web". Màn đăng nhập lại hứa "xem, đổi hoặc huỷ". | `bookings/[id].tsx:417` | Khách đề nghị đổi giờ trong app (KTV đã có sẵn). |
| C4 | Lịch bị từ chối, hết hạn hoặc đã huỷ: màn chi tiết không có nút nào. | `bookings/[id].tsx` (đọc code) | Nút "Đặt giờ khác", "Chọn Artist khác", "Để Artist khác nhận". |
| C5 | Khách mới đặt lần đầu: nút đáy đổi nhãn 4 lần (Đăng nhập → Thêm địa chỉ → Thêm số điện thoại → Gửi lịch hẹn), mỗi lần nhảy sang màn khác. | `book/[proId].tsx:248` (đọc code) | Nói trước "còn 3 việc"; gộp địa chỉ và số điện thoại thành một màn. |
| C6 | Màn chọn giờ mở ra ở "3/4", không có tên dịch vụ hay tên Artist, ghi "1 món"; câu "Chỉ hiện giờ đủ 1 giờ làm liền" khó hiểu. Màn xác nhận không có tên Artist. | `c05-book-time.jpg`, `c06-book-confirm.jpg` | Đầu màn luôn có một dòng: ai làm, làm gì. Đếm bước theo số bước thật. |
| C7 | Lịch tại spa: khách không thấy địa chỉ, không có "Chỉ đường"; thẻ Artist không bấm được. | `bookings/[id].tsx:157,264` (đọc code) | Hiện địa chỉ và Chỉ đường cho khách. |
| C8 | Dịch vụ chưa có ai nhận trông giống hệt dịch vụ đặt được. Đi "Đặt theo nhu cầu" tới bước 5/5 mới được báo chưa có Artist. | `dich-vu/index.tsx:150`, `yeu-cau/moi.tsx:382` (đọc code) | Nhãn "Chưa có người nhận" trên ô; cảnh báo ngay bước chọn gói. |
| C9 | "Đặt theo nhu cầu" bước 1 có hai kiểu bấm trên một màn, giá 450.000đ hiện trước khi chọn gì; ngày, giờ, mức giá đều chọn sẵn nên bấm Tiếp tục 3 lần là gửi giờ mình chưa chọn. | `c11-yeu-cau-moi.jpg`, `yeu-cau/moi.tsx:53,65` | Một kiểu chọn, không chọn sẵn ngày giờ. |
| C10 | Số tin nhắn và thông báo chưa đọc chỉ hiện ở Khám phá. Tin nhắn là một dòng trong Tôi. | `c01-home.jpg`, `c02-toi.jpg` | Số đếm trên tab Lịch hẹn; nút Nhắn tin ngay trên thẻ lịch. |
| C11 | Tên gọi: Đặt theo nhu cầu / Đơn theo dịch vụ / Đặt theo dịch vụ / Đăng yêu cầu / Để Artist nhận đơn / gửi nhu cầu. Người làm: Artist / chuyên viên / người làm / người nhận / thợ. | `c01`, `c03`, `c02` | Chốt một tên luồng và một danh xưng. |

## 3. Đề xuất thứ tự làm

| Đợt | Việc | Mockup |
|---|---|---|
| 0 | Sửa lỗi trắng màn hình sau khi gửi lịch | không cần |
| 1 | KTV: đăng nhập vào thẳng Studio; nút Nhận lịch cố định; viết lại tiền thành 3 dòng; Hôm nay gom việc cần trả lời và bước tiếp | 01, 02 |
| 2 | KTV: Ví trong app; ngày nghỉ trong tab Lịch; khiếu nại trong app | 03, 04 |
| 3 | Khách: Lịch hẹn có "Cần bạn"; đơn theo nhu cầu nằm chung; nút chính cố định; đổi giờ trong app; lối ra cho lịch bị từ chối | 05 |
| 4 | Chốt tên gọi cả hai phía; màn đặt lịch có dòng tóm tắt và đếm bước đúng | chưa vẽ |
| 5 | Hồ sơ KTV: mỗi bước một màn, tách màn sửa giá, giờ, khu vực | chưa vẽ |

Đợt 2 cần thêm phía máy chủ (ví, ngày nghỉ, khiếu nại đang là trang web); các đợt còn lại chủ yếu là app.

## Mockup

Prompt gốc trong `mockups/prompts/`. Số liệu trong ảnh là ví dụ.

1. `mockups/01-ktv-hom-nay.webp`: Hôm nay của KTV, việc cần trả lời lên đầu, có bước tiếp và tiền tuần.
2. `mockups/02-ktv-chi-tiet-don.webp`: đơn mới, tiền 3 dòng, nút Nhận lịch cố định.
3. `mockups/03-ktv-lich-ngay-nghi.webp`: Lịch theo tuần, báo nghỉ và giờ làm ngay trong app.
4. `mockups/04-ktv-vi.webp`: Ví trong app, trả phí bằng QR, lịch sử.
5. `mockups/05-khach-lich-hen.webp`: Lịch hẹn của khách, mỗi thẻ nói việc cần làm.

## Đã làm (10/11/2026, nhánh `ux/usability-pass`)

Chủ yêu cầu "làm lần lượt đến hết". Ảnh app sau khi sửa trong `after/` (iOS Simulator, Supabase local).

| Đợt | Đã sửa | Mục audit |
|---|---|---|
| 0 | Gửi lịch xong không còn trắng màn hình (hook đặt trước các lệnh thoát sớm). | 0 |
| 1 | Đối tác đăng nhập từ một tab thì vào thẳng Studio; tab Tôi của khách có thẻ "Mở Studio đối tác" ở đầu. | K1 |
| 1 | Trang lịch hẹn: thanh đáy cố định cho bước kế của cả hai bên (Nhận lịch / Từ chối, Tôi đang đến, Bắt đầu, Hoàn thành; khách: Xác nhận đã xong, Viết đánh giá, Đã nhận file, Đặt giờ khác). Khi chưa có nút: "Bước tiếp: … từ HH:MM". | K2, K7, C2 |
| 1 | Tiền viết thành chữ: Khách đưa bạn / Bạn chuyển lại 360đẹp / Bạn giữ. | K3 |
| 1 | Hôm nay: Cần bạn trả lời (thẻ vàng, đếm giờ, tiền) → Sắp tới 7 ngày (Gọi, Nhắn tin, Chỉ đường, bước tiếp) → Tiền tuần này. Hồ sơ chưa duyệt thì nói còn gì và nút làm tiếp. | K6, K7, K9 |
| 1 | Tab "Đơn" (đổi tên từ "Đơn khách") có số đếm; đầu tab là lịch khách đặt thẳng, sau đó đơn khách đang cần. | K6, K12 |
| 1 | Thao tác xong báo bằng dòng nhắn tự tắt thay vì hộp thoại phải bấm OK. Bấm Hoàn thành xong nói ngay phí của đơn và nút Trả phí. | K4, K11 |
| 2 | Màn **Ví** trong app: phí cần chuyển, mã QR có sẵn số tiền và nội dung, lưu QR, lịch sử ví, tài khoản nhận tiền. Không còn mở web. | K4 |
| 2 | Tab **Lịch**: dải 14 ngày, báo nghỉ / mở lại một chạm (chặn nếu ngày đó còn lịch), tóm tắt giờ làm. | K5 |
| 2 | Khiếu nại "khách báo bạn không đến" làm trong app. | K10 |
| 3 | **Lịch hẹn** của khách: nhóm "Cần bạn" lên đầu, mỗi thẻ có nút; đơn theo nhu cầu đang tìm Artist nằm chung "Sắp tới"; tab có số đếm. | C1, C2, C10 |
| 3 | Khách đổi giờ trong app; lịch bị từ chối/hết hạn có "Đặt giờ khác" và "Artist khác"; lịch tại spa/studio hiện địa chỉ và Chỉ đường; bấm tên Artist mở hồ sơ. | C3, C4, C7 |
| 4 | Màn đặt lịch: đếm bước thật (1/2 khi đã chọn gói), dòng "Makeup dự tiệc · Thu Anh · Sửa" ở đầu, báo trước "còn đăng nhập, địa chỉ, số điện thoại", chính sách thành 2–3 gạch đầu dòng, bỏ chữ "món". | C5, C6 |
| 4 | Đặt theo nhu cầu: không chọn sẵn dịch vụ và giờ; nút ghi "Thêm số điện thoại" khi thiếu. Ô dịch vụ chưa ai nhận ghi "Chưa có Artist · gửi nhu cầu". | C8, C9 |
| 4 | Tên gọi: "Đặt theo nhu cầu", "Đơn theo nhu cầu", "Artist" (bỏ chuyên viên/người làm/người nhận), "360đẹp" trong mọi câu chữ. | C11, K12 |
| 4 | Hồ sơ đối tác: mở từ Studio để sửa một phần thì chỉ hiện phần đó rồi quay lại; đăng ký mới có thanh tiến độ thay cho 6 chip; giờ làm theo từng thứ (Từ – Đến, nghỉ trưa, áp Thứ 2 cho cả tuần); tóm tắt phí 3 dòng trước khi gửi duyệt. | K8, K14 |

Bổ sung 11/11: Studio có màn **Tác phẩm của tôi** (xem, xoá, đăng mới); giờ làm gọn thành chọn ngày + một khung giờ, cần thì mở từng ngày; đăng ký đối tác bước đầu tách hai màn (làm gì / ở đâu); nút Sao chép nội dung chuyển khoản chép thật; form địa chỉ mới chỉ hỏi nơi ở, tên gọi và ghi chú để mở thêm; dòng gói ở trang dịch vụ bấm được; Khám phá chỉ còn một lối "Đặt theo nhu cầu"; Lịch hẹn có nút tin nhắn; MCN chỉ hiện với người có lời mời hoặc đang trong nhóm; trang chính sách không còn sập khi mất kết nối database.

Chưa làm: nhóm MCN (với người trong nhóm) và xác minh danh tính (đang tắt) vẫn trên web. Chưa thử Android và máy thật.
