# Native audit sau refresh — 11/10/2026

Phạm vi: source tại `f542020`; đối chiếu baseline `dc07161`. Chỉ ghi audit, không sửa product. Các xác nhận simulator bên dưới do agent chính cung cấp trong cùng phiên; người rà source không tự chạy simulator. Fixture chỉ phục vụ QA giao diện, không chứng minh giao dịch production.

## Findings

| Mức | Lỗi | Bằng chứng | So với `dc07161` |
| --- | --- | --- | --- |
| P1 | Không mở được bộ chọn ngày/giờ buổi thứ hai trong modal đặt lịch | **Runtime xác nhận:** bấm trường ngày và giờ đang hiển thị trong booking thật không hiện sheet, ở cả cỡ chữ thường và `accessibility-large`. | **Regression:** input nhập trực tiếp được thay bằng DateField/TimeField trong `f542020`. |
| P2 | Ô giờ đặt lịch cắt `09:00` khi tăng cỡ chữ | **Runtime xác nhận:** giờ bị cắt tại `accessibility-large`; source giữ 4 cột, cao 44pt. | Constraint có từ trước; thay typography và bỏ trần 1.4 làm lỗi rõ hơn. Không có runtime baseline để khẳng định trước đó hoàn toàn ổn. |
| P2 | Footer đặt lịch cắt hoặc đẩy mất tổng tiền | **Runtime xác nhận:** tổng còn `4.800…`; bước 3 khách chưa đăng nhập có CTA đẩy tổng tiền ra khỏi vùng đọc. | Layout hàng ngang/giá một dòng có từ trước; font và button mới làm áp lực chiều rộng tăng. |
| P2 | Bộ lọc dịch vụ ghép điều kiện từ nhiều người làm khác nhau | **Source xác nhận**, chưa chạy fixture nhiều đối tác. | Có từ trước, chưa được xử lý ở refresh. |
| P2 | CTA chính “Thêm địa chỉ” bị khóa bởi điều kiện xác nhận giá | **Source xác nhận**, chưa chạy phiên đăng nhập không có địa chỉ. | Có từ trước, chưa được xử lý ở refresh. |

### 1. Sheet nằm ngoài native booking modal

- `apps/mobile/src/app/book/[proId].tsx:440`: trường ngày và giờ buổi hai mới chỉ mở qua Sheet; không còn đường nhập trực tiếp.
- `apps/mobile/src/app/_layout.tsx:31–34`: BottomSheetModalProvider bao ngoài Navigator; `:69` đặt booking là native-stack `presentation: "modal"`.
- `apps/mobile/src/ui/sheet.tsx:78–90`: BottomSheetModal không có `containerComponent`/FullWindowOverlay. Portal nằm ở provider ngoài native modal.

Triệu chứng đã tái hiện trên đường đặt lịch thực. Topology portal là nguyên nhân từ source cần xác minh khi sửa; preview picker ở một route thường không kiểm tra được tầng native modal này. Với gói nhiều buổi, không thể chọn ngày thứ hai để đi tiếp. Sửa host/overlay cho sheet trên native modal hoặc đặt provider trong đúng native screen; kiểm tra cả ngày và giờ rồi quay lại form vẫn giữ lựa chọn.

### 2. Slot không giãn cùng Dynamic Type

- `apps/mobile/src/app/book/[proId].tsx:24–25`, `:220`, `:344–347`: luôn 4 cột, mỗi ô cao 44pt.
- `apps/mobile/src/ui/text.tsx:12`, `:45–47`: body có lineHeight 26 nhân fontScale; tại khoảng 1.97 một dòng đã cao khoảng 51.2pt.

Cho ô tăng chiều cao và giảm số cột theo không gian/chữ; nghiệm thu HH:mm đầy đủ, khoảng chạm tách biệt ở cỡ chữ thường và accessibility-large.

### 3. Tổng tiền cạnh CTA không đủ chiều rộng

- `apps/mobile/src/components/booking-bar.tsx:41–58`: hàng ngang, khối giá `flex: 1`, giá `numberOfLines={1}`, Button không được giới hạn chiều rộng ở cấp hàng.
- `apps/mobile/src/app/book/[proId].tsx:217–218`: CTA dài “Đăng nhập để đặt”; `:467–470` đưa tổng tiền và trạng thái vào footer.

Dùng bố cục xếp dọc khi không đủ chỗ và giữ tổng tiền đầy đủ trước CTA. Nghiệm thu tổng bảy chữ số, khách chưa đăng nhập, và thao tác quay lại giữa ba bước.

### 4. Bộ lọc phải áp dụng trên cùng một đối tác

- `apps/mobile/src/app/(tabs)/tim.tsx:127–136`: `serviceOffers` gộp tất cả người làm/giá trước, rồi kiểm tra `fromPrice`, `.some(identity)` và `.some(homeService)` độc lập.
- `lib/offers.ts:34–42`, `:59–63`: giá thấp nhất và danh sách người làm được lấy từ toàn bộ listing đang nhận lịch.

Ví dụ A chưa xác minh, đến nhà, giá 120k; B đã xác minh, chỉ studio, giá 600k. Chọn “Đã xác minh” + “Đến tận nhà” + “Dưới 300k” vẫn thấy dịch vụ dù không ai đáp ứng đủ. Giá/đếm người/khoảng cách tiếp tục tính cả người không hợp lệ. Lọc từng cặp đối tác–listing trước khi gộp, giữ cùng tập hợp cho giá và sắp xếp.

### 5. Điều kiện quote khóa hành động thêm địa chỉ

- `apps/mobile/src/app/book/[proId].tsx:115–120`: không gọi quote nếu đặt tại nhà mà chưa có địa chỉ.
- `:218`: CTA bước 3 đổi thành “Thêm địa chỉ”; `:179` có hành động mở form.
- `:470`: đồng thời khóa CTA cho mọi khách đã đăng nhập khi chưa có confirmedQuote; `:439` tiếp tục hiện “Đang xác nhận tổng tiền…”.

Khách phải tự tìm nút phụ “Thêm địa chỉ mới” ở `:405`; không phải dead end tuyệt đối. Chỉ yêu cầu quote khi đủ dữ liệu cho hành động gửi lịch, cho phép CTA xử lý các bước còn thiếu trước.

## Chưa đủ bằng chứng để nâng thành finding

- Auth/phone TextInput vẫn cao cố định: `components/auth-fields.tsx:8–15` (52pt) và `app/so-dien-thoai.tsx:71` (54pt). Cần kiểm tra chữ lớn nhất cùng bàn phím; source này đã tồn tại ở baseline.
- TimeField dùng ScrollView thường lồng trong Gorhom sheet (`components/time-field.tsx:31`): cần kiểm tra cuộn/chạm Android. Không phát hiện lỗi tất định về giá trị giờ/phút từ source.
- Chưa chứng minh VoiceOver/TalkBack focus, Android thật, xác thực thật, gửi booking thật, đổi lịch và onboarding đối tác trọn luồng.
