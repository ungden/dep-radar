# Ra mắt chính thức 360đẹp

Danh sách việc trước ngày mở cho khách thật. Phần pháp lý và thuế là tóm tắt để làm việc với kế toán và luật sư,
không thay cho tư vấn của họ.

## 1. Việc của chủ doanh nghiệp

- [ ] **Đăng ký sàn giao dịch TMĐT với Bộ Công Thương** tại online.gov.vn (Nghị định 52/2013, sửa bởi 85/2021).
  Hồ sơ cần Quy chế hoạt động: bản nháp ở `/quy-che`, cho luật sư đọc lại trước khi nộp.
  Có số đăng ký thì gắn logo "Đã đăng ký Bộ Công Thương" vào chân trang (báo đội kỹ thuật).
- [ ] **Hoá đơn điện tử cho phí dịch vụ**: phí đối tác trả là doanh thu của công ty. Chọn nhà cung cấp hoá đơn
  (MISA meInvoice, Viettel S-Invoice, VNPT…) và gửi thông tin API để nối tự động mỗi lần đối tác trả phí. Trước
  khi nối xong, kế toán xuất hoá đơn theo file "Lịch hẹn & hoa hồng" (Admin › Tài chính).
- [ ] **Thuế và thông tin người bán** (Nghị định 117/2025): nhờ kế toán xác nhận
  - 360đẹp không giữ tiền đơn hàng (khách trả thẳng đối tác) thì có thuộc diện khấu trừ, nộp thay thuế cho đối tác không;
  - kỳ và mẫu cung cấp thông tin người bán cho cơ quan thuế. Dữ liệu có sẵn ở file "Theo người làm".
  Lưu ý: 360đẹp **không lưu số CCCD** (chỉ họ tên trên thẻ); nếu mẫu báo cáo cần số định danh hay mã số thuế cá
  nhân của đối tác, cần thêm bước đối tác khai số này.
- [ ] **Dữ liệu cá nhân** (Nghị định 13/2023): lập hồ sơ đánh giá tác động xử lý dữ liệu cá nhân, và hồ sơ chuyển
  dữ liệu ra nước ngoài (máy chủ Supabase/Vercel; ảnh CCCD gửi AI của Google để đối chiếu, không lưu).
- [ ] **Kênh hỗ trợ**: điền Zalo và email hỗ trợ ở Admin › Cấu hình. Quy chế hứa xác nhận khiếu nại trong 24 giờ làm việc.
- [ ] **Đối tác thật**: mời và duyệt đủ đối tác ở mỗi thành phố định mở, trước khi gỡ dữ liệu mẫu.
- [ ] Tài khoản Apple Developer (Sign in with Apple, App Store); Sentry để theo dõi lỗi.

## 2. Ngày ra mắt (kỹ thuật)

1. Xoá dữ liệu mẫu trên database production (một transaction; tự dừng nếu danh sách có tài khoản thật):

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/scripts/remove-demo-data.sql
   ```

2. Đặt `DEMO_DATA_LIVE = false` trong `lib/launch.ts` (tắt dòng "bản demo" ở trang chủ, chân trang, /chinh-sach), deploy.
3. Kiểm tra: trang chủ và /pros chỉ còn đối tác thật; Admin › Tài chính số liệu về 0 từ ngày mở.
4. Bản build app mới (có Ảnh portfolio và các sửa ngày 24/09).

## 3. Vận hành hằng ngày (Admin)

- **Tài chính**: chọn kỳ, xem hoa hồng (doanh thu công ty), tiền nạp qua SePay, đối tác đang nợ phí; xuất 3 file
  CSV cho kế toán. Điều chỉnh ví khi có tranh chấp (bắt buộc ghi lý do, có nhật ký).
- **Khách hàng**: tìm theo tên/SĐT/email, xem lịch sử, khoá tài khoản vi phạm (không đặt lịch, đăng yêu cầu, nhắn tin được).
- **Cấu hình**: thông tin công ty (hiện ở chân trang, Trợ giúp, Quy chế), tài khoản nhận phí, chương trình giới
  thiệu. Mức phí chỉ xem: đổi phí phải sửa cả nội dung trang và app cùng lúc.
- Mọi thao tác trên được ghi ở "Nhật ký thao tác quản trị".
