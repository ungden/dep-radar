# Triển khai 360đẹp — khám phá, đặt lịch và vận hành

Thực hiện trên nhánh `feat/spa-venues`, từ baseline `d308051`. Bản này chạy với dữ liệu kiểm thử local. Chưa deploy web, áp migration production hay phát hành binary.

| Nhóm | Đã có trong code |
|---|---|
| Khám phá | Feed hai cột ưu tiên makeup, thẻ liên kết đúng chuyên viên/gói, tab theo dõi, không đưa spa vào lưới. Khi thiếu nguồn cung dùng gợi ý dịch vụ ghi “Ảnh minh hoạ”, không gán chuyên viên giả. |
| Mẫu / chuyên viên / spa | Gallery ảnh, bảng giá, gói đã chọn, nút chọn giờ, lọc review. Spa có thông tin cơ sở riêng và chọn được giờ còn chỗ từ danh sách. |
| Đặt lịch | Mở thẳng chọn giờ nếu gói hợp lệ. Có thể sửa/thêm dịch vụ; giỏ đặt lại giữ biến thể/số lượng và cần chọn lịch mới. Server xác nhận giá/khả dụng. Gửi lại cùng yêu cầu dùng khóa chống trùng; ghi chú khách không được truyền qua URL đăng nhập. |
| Đánh giá | Khách gửi review sau lịch hoàn thành; review hợp lệ hiện ngay, nội dung cấm cần sửa trước khi gửi. Review cũ đang chờ giữ lịch công khai trước đây. Đánh giá khách của đối tác giữ phạm vi quyền cũ. |
| Đối tác | Link vào app và form web phân biệt Artist/spa; giữ tiến độ Studio và kho works đã có. |
| CSKH | `/admin/cskh`: lịch đang mở, kẹt và không hoàn thành; diễn biến các trạng thái mới; hồ sơ khách, ghi chú theo người và thời gian. Số liệu màn đặt chỉ dùng ID lượt mở ngẫu nhiên và tên bước; không có dữ liệu liên hệ, địa chỉ, nội dung chat hay ghi chú. |
| Nền tảng | SePay xác thực tài khoản nhận, ghi ví hoặc khoản chưa khớp trong một giao dịch và retry khi DB lỗi. Tác vụ tự hoàn tất chỉ xét lịch đã bắt đầu, qua đủ thời lượng cả giỏ và không có vụ việc đang mở. Push có gỡ token, hạn đăng ký cho bản mới, hàng chờ, retry và phản hồi Expo. |

## QA giao diện

- [Khám phá trên iOS](01-kham-pha-ios.png) và [chi tiết mẫu makeup trên iOS](02-mau-makeup-ios.png), dữ liệu local.
- Bấm “Chọn ngày giờ” trên mẫu 450.000đ → chọn giờ 09:00 → xác nhận: 450.000đ dịch vụ + 50.000đ di chuyển = 500.000đ. Dừng trước khi gửi.
- Web local trả HTTP 200 cho home, detail và booking. Kiểm thử React xác nhận phục hồi lỗi tải slot/báo giá, ngày giờ và luồng đăng nhập.
- Chưa chạy thiết bị Android/iPhone thật; phản hồi push chỉ được giả lập trong SQL, không gửi push hoặc chuyển tiền thật.

## Kiểm thử kỹ thuật

- Web build, typecheck/lint web và mobile, kiểm nhất quán catalog và 338 test Vitest đều qua.
- 31 test RLS qua API local đều qua; SQL business rules, partner flow, MCN và các ca marketplace mới đều qua. Ca marketplace kiểm tài khoản nhận tiền, callback trùng, quyền ghi chú, quyền gỡ token và phản hồi push giả lập.
- SQL lint không báo lỗi ở public, partner_private và marketplace_metrics.

## Khi đưa lên môi trường tiếp theo

1. Áp migration reliability, operations, public reviews, push lease, booking signals và push outbox theo thứ tự tên file; giữ RPC cũ cho binary đã phát hành.
2. Cấu hình tài khoản nhận nạp ví của chính 360đẹp trong thiết lập. Nếu dùng VA, đặt `SEPAY_RECEIVING_VA` phía server. Kiểm tra webhook bằng ca QA của môi trường đó, không dùng thông tin ngân hàng Medi24h.
3. Cấp quyền CSKH cho tài khoản đã được chọn thông qua bảng riêng `partner_private.support_staff` do quản trị DB quản lý; bảng không nhận lệnh ghi từ client. Tài khoản CSKH vào `/admin/cskh` và không có quyền quản trị tiền.
4. Triển khai API/web trước bản app mới; QA đủ khách, Artist, spa và CSKH. Mở store hoặc OTA chỉ khi có binary/runtime đúng và quy trình phát hành đã được chốt.

Chưa làm M4 có điều kiện: QR thu khách/hoàn hoặc chi tiền, bản dịch VI/EN toàn app, đặt hộ, ưu đãi/affiliate và attribution SDK. Báo lỗi crash qua nhà cung cấp ngoài, gallery nhận diện riêng của đối tác, các bộ lọc roster mở rộng và luồng xác minh native cũng chưa được triển khai trong đợt này.
