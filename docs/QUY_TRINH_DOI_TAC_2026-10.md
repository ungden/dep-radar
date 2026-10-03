# Danh mục và quy trình đối tác — 10/2026

## Danh mục chung

`lib/catalog.ts` là nguồn chung cho web, iOS/Android, SQL seed và bảng giá. Có 72 dịch vụ, 145 gói thuộc 12 nhóm nghề. Mỗi gói chỉ có ba mức: **Cơ bản / Chuyên nghiệp / Master**. Đối tác tự chọn một mức cho từng gói; nhãn giá không cấp chứng nhận tay nghề. Không tự đổi các lựa chọn cũ sang mức gần nhất.

Bảng đầy đủ: [BANG_GIA_2026-10.md](./BANG_GIA_2026-10.md). Giá là khung kinh doanh đề xuất của nền tảng, chưa phải kết quả khảo sát thị trường. Các dịch vụ người mẫu vẫn theo điều kiện xác minh và trạng thái mở hiện tại.

Gói định nghĩa phạm vi, thời lượng, số người tối thiểu/tối đa, số buổi, đầu ra, hạn giao, số lần sửa hoặc thời hạn dặm. Makeup nhiều người tăng thời lượng theo người; chụp kỷ yếu 5–15 người giữ một buổi 180 phút. Gói cô dâu hai lễ đặt hai buổi riêng, mỗi buổi 120 phút. Phun mày có một buổi dặm trong 45 ngày.

## Đăng ký và hoạt động

1. Đăng nhập, bổ sung số điện thoại nếu còn thiếu; chọn nghề, giới thiệu, thành phố và quận/huyện. Tạo bản nháp riêng của tài khoản, giữ trạng thái tạm nghỉ.
2. Chỉ chọn những dịch vụ và gói có thể cung cấp; chọn một trong ba mức giá cho mỗi gói. Lưu lựa chọn trong một giao dịch để lỗi không làm mất bảng giá cũ.
3. Lưu nơi phục vụ: tại nhà khách, studio hoặc cả hai; lưu bán kính và thiết bị/vật tư phù hợp. Bỏ nghề thì dịch vụ thuộc nghề đó tạm ẩn.
4. Xác nhận giờ làm thực tế, hỗ trợ nhiều khoảng mỗi ngày và ngày nghỉ. Giờ gợi ý chưa được lưu không mở lịch cho khách.
5. Đăng tác phẩm. Tác phẩm bị ẩn không tính vào điều kiện gửi duyệt.
6. Kiểm tra các bước đã lưu, đọc và xác nhận chính sách rồi gửi duyệt. Hiển thị trạng thái chờ duyệt, yêu cầu sửa và lý do. Khi được duyệt, bật **Nhận khách mới / Nhận lịch mới** lúc sẵn sàng.

Web dùng các trang Studio với tiến độ chung; app có màn hình native `/ho-so-doi-tac` cho sáu bước và màn hình đăng tác phẩm native. Dữ liệu và quy tắc RPC dùng chung.

## Đặt lịch và nhận job

- Đặt trực tiếp: máy chủ kiểm tra giờ trống, địa chỉ đã lưu, giá niêm yết và phụ phí; khách xác nhận đúng đơn giá và tổng tiền. Giá thay đổi trước lúc gửi thì yêu cầu xem lại.
- Đăng yêu cầu: khách chọn đúng mức giá và giới hạn phụ phí. Đối tác chỉ nhận nếu đã niêm yết đúng gói, đúng giá, còn lịch, đúng phạm vi và đủ điều kiện phí. Tổng vượt giới hạn khách đồng ý thì từ chối.
- Yêu cầu theo danh mục cũ phải được khách đăng lại nếu phạm vi đã cập nhật. Gói nhiều buổi đặt trực tiếp để giữ đủ lịch cùng lúc.
- Đơn lưu bản chụp phạm vi, giá, đầu ra và thời hạn đã chốt. Sửa danh mục hoặc bảng giá không sửa hợp đồng của đơn đã tạo.
- Các buổi tiếp theo hiện trong lịch quản lý và chi tiết đơn, được kiểm tra trùng lịch, khoảng đệm và giới hạn lịch mỗi ngày. Không tính thêm một đơn thanh toán.
- Buổi dặm cần phía còn lại xác nhận; không dùng lại buổi đã thực hiện. Đơn ảnh/video phân biệt hoàn thành buổi làm, chờ giao và chờ khách xác nhận sản phẩm.

## Kiểm tra và phát hành

Đã kiểm tra: 202 unit tests; 29 RLS tests qua API local; bộ SQL nghiệp vụ cũ và mới; typecheck/lint web và mobile; build web và export iOS/Android. Luồng web được thao tác bằng tài khoản QA local từ tạo bản nháp đến gửi duyệt. Fixture được duyệt bằng bộ quy tắc có sẵn khi khóa AI bị tắt; không chi tiền AI và chưa kiểm tra app trên thiết bị thật.

Migration mới: `20261006100001_standard_partner_catalog_flow.sql`, sau migration ba mức giá hiện có. Đã chạy lại migration và SQL tests trên database local tách biệt; các cron cũ được bỏ qua trong database kiểm thử phụ do pg_cron chỉ chạy ở database chính.

Ngày 04/10 đã build iOS Release cho Simulator, khởi chạy app và kiểm tra màn hình Nail hiển thị đủ ba mức giá cho từng gói. Bundle iOS/Android đã xuất với cấu hình backend công khai. Trạng thái phát hành và giới hạn kiểm tra: [RELEASE_PARTNER_2026-10-04.md](./RELEASE_PARTNER_2026-10-04.md).

Thứ tự phát hành: áp dụng migration → phát hành web → phát hành bundle/build mobile. Production chưa được thay đổi trong đợt triển khai này. Migration giữ giá/đơn cũ và không tự công khai bản nháp. Nếu rollback giao diện, giữ schema bổ sung và các hợp đồng đã chốt; không xóa bảng lịch phụ đang có đơn.

Ảnh kiểm tra web: [Desktop](./qa/partner-three-prices-desktop.jpg), [390px](./qa/partner-three-prices-mobile.jpg). Tài khoản QA và ảnh tải lên backend local đã được dọn sau kiểm tra.
