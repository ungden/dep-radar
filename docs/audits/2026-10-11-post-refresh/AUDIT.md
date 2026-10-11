# 360đẹp — Audit tiếp sau UX refresh

Ngày: 11/10/2026. Bản kiểm tra: `f542020`, nhánh `codex/ux-ui-refresh`; so sánh source trước refresh với `dc07161`.

**Kết luận: giao diện đã dễ đọc hơn ở các màn khám phá, nhưng chưa đủ ổn để coi đợt refresh hoàn tất.** Cần ưu tiên sửa luồng đặt lịch, bố cục khi chữ lớn và tính nhất quán giữa giá/khu vực ở các bước. Thêm ảnh mới lúc này không giải quyết các vấn đề chính.

## Phạm vi và bằng chứng

- Kiểm tra mới trong phiên này: Next production build local, viewport 390×844 và 320×740; Expo Go trên R2R iPhone 17 Pro, iOS 26.5, cỡ chữ `large` và `accessibility-large`.
- Backend là fixture chỉ đọc tại localhost: hai hồ sơ QA ở Hà Nội/TP.HCM; giá nằm trong catalogue hiện hành; không tạo người dùng hoặc booking thật. Mô phỏng riêng lỗi `free_slots` HTTP 503.
- Tất cả ảnh trong `screenshots/` chụp mới. Ảnh full-page của web có thể vẽ thanh fixed ở vị trí cuộn hiện tại; không coi hiện tượng đó là lỗi UI.
- Source review bổ sung cho checkout đã đăng nhập, công cụ đối tác và accessibility. Những mục chỉ xác nhận qua code được ghi rõ; không gọi chúng là đã kiểm thử end-to-end.
- Không kiểm tra production, thiết bị vật lý, Android, VoiceOver end-to-end, thanh toán hoặc giao dịch thật. Không tuyên bố toàn bộ sản phẩm đạt WCAG.

## Từng bước trong luồng

| Bước | Đánh giá | Bằng chứng và vấn đề |
|---|---|---|
| 1. Trang chủ / khám phá | Khá hơn; còn dư khoảng trống khi thiếu ảnh | Chữ và CTA rõ hơn. Placeholder lớn lặp lại khiến danh sách thiếu thông tin thực. Ảnh 01. |
| 2. Tìm kiếm / bộ lọc | Chưa đạt | Khu vực không theo sang detail; ngân sách theo người dễ gây hiểu nhầm. Native còn ghép điều kiện từ nhiều đối tác. Ảnh 02, 05, 06. |
| 3. Chi tiết / so sánh gói | Chưa đạt | Bảng giá ép tên gói xuống từng từ ở 390px, tràn ngang ở 320px; giá tham chiếu và giá mua được chưa tách rõ. Ảnh 03, 04. |
| 4. Chọn lịch / xác nhận | Có lỗi ưu tiên cao | iOS picker không hiện trong booking modal; chữ lớn cắt giờ và tổng tiền; web đổi lỗi mạng thành kín lịch. Quote failure chỉ được xác nhận qua source. Ảnh 07, 09, 10, 11, 12. |
| 5. Đăng nhập / tiếp tục booking | Cần sửa; source review | Ngày/giờ buổi thứ hai không có trong resume URL; native CTA thêm địa chỉ bị khóa khi chưa đủ điều kiện tính quote. Chưa đăng nhập thật. |
| 6. Công cụ đối tác / accessibility | Cần sửa; source review | Modal riêng, radio keyboard, uploader thiếu tên/focus, tương phản sao đánh giá; input compact có kích thước không tương thích font mới. |

## Findings ưu tiên

### R01 · P1 · iOS: picker ngày/giờ không hiện trong modal đặt lịch

**Đã tái hiện.** Home → Makeup cô dâu → Đặt lịch → gói 2 lễ → chọn giờ → bước 3 → bấm nút ngày hoặc giờ buổi thứ hai đang nhìn thấy. Không có picker xuất hiện, AX vẫn chỉ có nội dung booking. Đã thử cỡ chữ trợ năng và cỡ thường. Người dùng không chọn được ngày buổi hai qua UI này.

Nguồn: `apps/mobile/src/app/_layout.tsx:31` và `:69`, `apps/mobile/src/ui/sheet.tsx:78`, `apps/mobile/src/components/date-field.tsx:11`, `apps/mobile/src/components/time-field.tsx:10`. Sheet portal nằm ngoài native modal; đây là giải thích phù hợp với cấu trúc hiện tại, cần kiểm chứng khi sửa host. Không tuyên bố đã nhìn thấy chính lớp sheet ở phía sau.

**Regression mới:** trước refresh dùng TextInput; hiện chuyển sang sheet nhưng chưa xử lý vị trí host trong native modal. Sửa lớp hiển thị sheet và QA lại ngay trong route booking; không dùng màn preview độc lập làm bằng chứng duy nhất.

Ảnh: `09-native-date-after-tap.png`, `10-native-time-after-tap.png`. Nút bánh răng xanh là Expo Go, không phải lỗi sản phẩm.

### R02 · P1 · Web: lỗi xác nhận giá khóa checkout mà không giải thích

**Xác nhận qua source, chưa chạy tài khoản thật.** `bookingQuote` lưu lỗi vào `verified.error`, nhưng footer disabled khi thiếu `confirmedQuote`. Chỉ `submit()` mới đưa lỗi này ra màn hình, mà nút disabled không cho chạy submit. Khi RPC lỗi sau khi khách đã điền đủ, người dùng không biết lý do và không có retry.

Nguồn: `app/book/[proId]/page.tsx:217`, `:250`, `:940`. Cần trạng thái loading/error riêng, thông báo gần tổng tiền và nút thử lại. Lỗi đã có trước refresh.

### R03 · P2 · iOS: giờ hẹn và tổng tiền không đọc được khi chữ lớn

**Đã tái hiện tại accessibility-large.** Các ô giờ vẫn 4 cột, cao 44pt: chữ `09:00`, `09:30` bị cắt và dính nhau. Tổng tiền rút thành `4.800…`; bước 3 nút “Đăng nhập để đặt” chiếm hết ngang, giá trong footer biến mất. Nút “Quay lại” cũng bị cắt theo chiều dọc.

Nguồn: `apps/mobile/src/app/book/[proId].tsx:344`, `apps/mobile/src/components/booking-bar.tsx:41`, `apps/mobile/src/ui/text.tsx:45`. Constraint cố định có từ trước; bỏ giới hạn font làm chúng lộ rõ hơn. Cần giảm số cột theo font/width, min-height theo nội dung và xếp giá + CTA thành hai hàng khi cần. Không giảm font hoặc đặt cap để che lỗi.

Ảnh: `07-native-slots-large.png`, `09-native-date-after-tap.png`.

### R04 · P2 · Web: bảng gói bị ép chữ và tràn màn hình nhỏ

**Đã tái hiện.** Sơn gel trơn: ở 390px tên gói dài bị chia thành nhiều dòng rất hẹp; ở 320px document rộng 332px, cạnh phải dãy giá tới 332.66px. Giá ba mức chiếm chiều rộng cố định, ép cột tên gói. Người chọn dịch vụ phải đọc bảng dài trước khi tới người nhận.

Nguồn: `app/dich-vu/[id]/service-view.tsx:82-92`. Đổi cấu trúc mobile thành tên/thời lượng phía trên, giá bên dưới; hiển thị giá người làm thực sự đang bán trước, khung ba mức là thông tin mở rộng. Giữ quy tắc đúng ba mức giá và không biến mức giá thành chứng nhận tay nghề.

Ảnh: `03-detail-city-reset.png`, `04-detail-320.png`. Typography mới làm bài toán reflow của layout cũ nặng hơn.

### R05 · P2 · Web: đổi thành phố khi tìm kiếm rồi bị chuyển lại thành phố cũ

**Đã tái hiện.** Trang chủ chọn TP.HCM → Search mở bộ lọc Hà Nội → kết quả Sơn gel trơn 400.000đ của QA Hà Nội → click → detail ghi “Chọn người làm ở TP.HCM”, đưa QA Sài Gòn 120.000đ.

Nguồn: `app/search/search-view.tsx:73`, `components/service-card.tsx:22`, `app/dich-vu/[id]/service-view.tsx:26`. Search dùng query param, link bỏ context, detail dùng cookie. Giữ xuyên suốt city/home/budget khi mở detail hoặc cập nhật một nguồn trạng thái thống nhất. Lỗi cũ còn sót.

Ảnh trước/sau: `02-search-hanoi.png`, `03-detail-city-reset.png`.

### R06 · P2 · Giá và thời lượng trên card chưa phản ánh gói mua được

**Đã tái hiện hai trường hợp.** Gói kỷ yếu 150.000đ/người, tối thiểu 5 người vẫn nằm trong “Ngân sách tối đa / Dưới 300.000đ”, card không có `/người`; sang đặt lịch hiện 750.000đ. Sơn gel chỉ bán Tay + chân 400.000đ/90 phút nhưng card ghi 45 phút, vì lấy thời lượng ngắn nhất của toàn catalogue.

Nguồn: `lib/catalog.ts:654`, `lib/offers.ts:62`, `components/service-card.tsx:18`, `:43`, `app/search/search-view.tsx:116`. Hiển thị đơn vị và số người tối thiểu; thống nhất filter dùng tổng tối thiểu hay đơn giá; lấy duration từ biến thể thật sự được chào bán. Detail cũng cần phân biệt rõ khung giá catalogue với lựa chọn đang có người nhận.

Ảnh: `05-budget-filter.png`, `06-budget-result.png`, `11-booking-minimum-total.png`, `02-search-hanoi.png`. Lỗi logic cũ còn sót, nhãn “Ngân sách tối đa” mới làm kỳ vọng tổng tiền rõ hơn.

### R07 · P2 · Web: lỗi tải lịch bị thông báo là người làm đã kín lịch

**Đã tái hiện.** Fixture trả HTTP 503 cho `free_slots`; UI nói “QA Hà Nội không nhận khách hoặc đã kín lịch ngày này. Chọn ngày khác nhé.” và không có retry. Khách có thể bỏ người làm dù chưa đọc được lịch.

Nguồn: `lib/api/actions.ts:105` đổi error thành `[]`; `app/book/[proId]/page.tsx:603` coi `[]` là không còn chỗ. Cần tách lỗi tải / không có giờ trống, kèm thử lại; xử lý cả promise rejection. Lỗi cũ còn sót.

Ảnh: `12-slots-error-as-full.png`.

### R08 · P2 · Native: bộ lọc ghép điều kiện từ các đối tác khác nhau

**Xác nhận qua source.** A làm tại nhà giá 400k, B chỉ studio giá 120k: bộ lọc “Đến tận nhà” + dưới 300k vẫn cho dịch vụ qua, vì min price tính trên cả A/B rồi kiểm tra `.some(homeService)`. Không ai thực sự đáp ứng cả hai. Nếu bật xác minh, điều kiện xác minh cũng bị ghép tương tự; không dựa vào toggle xác minh đang ẩn để xác định mức ảnh hưởng.

Nguồn: `apps/mobile/src/app/(tabs)/tim.tsx:127-136`. Lọc đối tác/biến thể đủ mọi điều kiện rồi tính giá, số người và khoảng cách. Lỗi cũ còn sót.

### R09 · P2 · Native: nút chính thêm địa chỉ bị khóa

**Xác nhận qua source.** Khách đã đăng nhập, đặt tại nhà, chưa có địa chỉ: quote effect trả về sớm, nhưng footer chờ `confirmedQuote`. CTA “Thêm địa chỉ” không bấm được, thông báo vẫn “Đang xác nhận tổng tiền…”. Có link “Thêm địa chỉ mới” trong nội dung để vòng qua nên không gọi đây là dead-end hoàn toàn.

Nguồn: `apps/mobile/src/app/book/[proId].tsx:115`, `:218`, `:405`, `:439`, `:470`. Kiểm tra điều kiện địa chỉ/số điện thoại trước điều kiện chờ quote. Lỗi cũ còn sót.

### R10 · P2 · Web: đăng nhập làm mất lựa chọn buổi hai

**Xác nhận qua source.** Với `makeup-bridal/two`, `secondDate` luôn khởi tạo rỗng, `secondTime` luôn 09:00; resume URL không lưu hai trường này. Guest đã điền rồi đăng nhập sẽ phải chọn lại, trái lời hứa giữ lựa chọn.

Nguồn: `app/book/[proId]/page.tsx:212`, `:228`. Serialize/restore cả hai trường, xác nhận lại khả dụng sau khi quay về. Lỗi cũ còn sót.

### R11 · P2 · Modal và radio chưa nhất quán với bàn phím

**Xác nhận qua source.** Modal sửa bảng giá và QR nhận tiền vẫn là div riêng, thiếu focus trap/initial focus/Escape/inert. Radio mức giá, sao đánh giá chưa có arrow navigation/roving tabindex, dù discovery đã sửa.

Nguồn: `app/studio/services/page.tsx:276`, `components/payout.tsx:149`, `app/requests/new/page.tsx:222`, `app/bookings/[id]/review/page.tsx:237`. Dùng shared Sheet và một primitive radio thống nhất. Chưa thực hiện keyboard flow trên tài khoản đối tác trong phiên này.

### R12 · P2 · Các chi tiết accessibility vẫn khó nhìn hoặc không có tên

**Xác nhận qua source và phép tính màu.** Sao chọn #e0a33a trên #FAF6F4 chỉ 2.065:1; sao chưa chọn #EFE3DF chỉ 1.169:1, dưới mốc 3:1 cho đồ họa điều khiển. Label mức giá trắng 85% trên accent khoảng 4.221:1, dưới 4.5:1 cho chữ nhỏ. Nút upload avatar chỉ icon + input sr-only, thiếu tên truy cập; wrapper uploader không hiện focus.

Nguồn: `app/bookings/[id]/review/page.tsx:239`, `app/studio/services/page.tsx:232`, `app/studio/profile/edit/page.tsx:95`, `app/studio/works/page.tsx:376`. Đậm hơn ở trạng thái điều khiển, bổ sung tên và focus-visible ở wrapper. Không phải kết luận kiểm định WCAG toàn app.

## Những điểm cần kiểm chứng tiếp, chưa nâng thành lỗi runtime

- Input giờ làm và số người: `inputClass` mới có py-3 + text16/line-height25.6 nhưng caller giữ h-9=36px, chỉ còn 10px content box. Nguy cơ cắt chữ có chứng cứ CSS, chưa có screenshot tài khoản đối tác. Xem ACCESSIBILITY-SOURCE.md.
- TimeField trên Android: nested scroll trong sheet, chưa kiểm tra thao tác vuốt trên thiết bị.
- Khi snapshot tải thiếu riêng một provider, profile có non-null assertion; cần fixture lỗi có chọn lọc trước khi kết luận crash.

## Nhận xét về độ hiện đại và thứ tự sửa

Home có hierarchy tốt hơn, type dễ đọc và ảnh hero phù hợp. Nhưng cảm giác hoàn thiện bị giảm ở detail: bảng ba mức giá giống tài liệu nghiệp vụ, tên gói bị ép hẹp, người nhận bị đẩy xa; ở dữ liệu thiếu portfolio, các card ảnh nền trống + icon lớn lặp lại chiếm nhiều màn hình mà không cung cấp thêm thông tin.

1. Sửa R01/R02 và các failure state, đảm bảo có thể đặt lịch với lỗi mạng/thiếu địa chỉ.
2. Làm lại layout detail, slot grid và footer theo nội dung/font size; đồng bộ giá/thời lượng/khu vực xuyên flow.
3. Gom modal/radio/input/upload về primitive chung, kiểm tra bàn phím và screen reader; hoàn thiện contrast.
4. Với dịch vụ chưa có ảnh thật, dùng card compact có giá, gói, khu vực và người nhận rõ hơn. Không gen tác phẩm giả gắn cho đối tác; ảnh minh họa vẫn phải ghi nhãn.

## Hồ sơ audit

- `WEB-SOURCE.md`: luận cứ và các dòng code web.
- `NATIVE-SOURCE.md`: luận cứ native và đối chiếu trước/sau refresh.
- `ACCESSIBILITY-SOURCE.md`: keyboard, màu, kích thước input và giới hạn xác minh.
- `EVIDENCE.json`: môi trường, phép đo, ảnh và provenance.
- `fixture.cjs`: fixture HTTP chỉ đọc để tái hiện; không phải Supabase server thật.
- `REVIEW.html`: báo cáo kèm ảnh, xem offline.

Đợt này chỉ thêm hồ sơ audit. Không sửa product code, không commit/push/deploy. Simulator đã được trả cỡ chữ mặc định và tắt sau QA; server tạm được dừng.
