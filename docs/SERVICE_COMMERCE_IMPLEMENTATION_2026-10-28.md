# Dịch vụ nhiều thành phần — bàn giao V1

Cập nhật 29/10/2026. Đã triển khai web, mã nguồn app và database; đã kiểm thử trên PostgreSQL local đầy đủ. Chưa áp migration production, deploy web hoặc phát hành binary app.

## Phạm vi đã làm

- Một lịch của một đối tác chứa tối đa 40 dòng, từng người nhận, tay/chân và số lượng. Nail có menu chuẩn bị, nền, màu, trang trí; giỏ hiển thị từng món, tổng tiền và tổng thời gian trước khi chọn lịch. Có thêm cùng dịch vụ cho người/vùng khác; khôi phục lựa chọn sau đăng nhập.
- Server kiểm tra phần đã bao gồm và phần trùng: nền/màu Nail, layout makeup, tóc dâu, mặt, vùng wax, kỹ thuật mi/mày và block massage. Trang trí cần nền đúng người/vùng. Không dùng nhiều món để vượt cổng đóng người mẫu hiện tại.
- Quote riêng từng khách, hạn 5 phút, snapshot giá/phút/đầu ra. Tạo cả giỏ, ảnh mẫu và thỏa thuận trong một transaction; retry trả cùng lịch. Kiểm tra tổng thời gian, buffer, deadline và lịch phụ. Khóa cạnh tranh theo đối tác. Tổng được cài trước trigger tài chính/MCN, không tạo đơn con rồi sửa lại doanh thu.
- Nail mới do đối tác tự bật: da+gel 150k, da+thạch 170k, da+mắt mèo 190k; nền úp 130k, BIAB 180k, nối gel 250k; tháo 20/50k, sửa lẻ 15k/ngón; art theo ngón/viên. Mắt mèo điểm tối đa 40k, vẫn giữ đúng số ngón trên hóa đơn. Menu hiện hữu giữ giá thợ đã niêm yết.
- Makeup nhóm giữ 60 phút/người; bỏ nhãn giảm 15% không đúng bảng giá hiện hữu. Tóc cô dâu giữ buổi thử 60 phút và ngày lễ 120 phút riêng. Các buổi có thể chọn địa chỉ khác nhau, tính phí chuyến/khẩn cấp và snapshot riêng. Phân bổ phần dịch vụ theo buổi phục vụ hiển thị, không đổi sự kiện thu tiền/hoa hồng hiện hành.
- Đăng nhu cầu và nhận việc dùng toàn giỏ, kiểm tra đủ năng lực, giá, thời gian, địa điểm và ngân sách. Không nhận riêng món đầu rồi bỏ phần còn lại.
- Hai bên đề xuất thêm/đổi/bỏ món; báo giá riêng cần phạm vi và phút làm, chỉ đối tác được báo. Giá chưa đổi khi chưa có bên còn lại duyệt. Kiểm tra lại slot/deadline lúc duyệt, lưu hợp đồng cũ, giữ giá dòng đã chốt, tính lại voucher và hoa hồng. Buổi đang làm chỉ được thêm phần việc.
- Giao file có lịch sử phiên bản, phản hồi tổng hợp theo từng đầu ra và lượt sửa riêng. Khắc phục thiếu/sai đầu ra không ăn lượt đổi brief. Không xác nhận nhận đủ khi còn phản hồi mở. Hạn giao đọc snapshot, không đọc lại menu mới.
- Quyền ảnh/video có kênh, thời hạn, lãnh thổ, bên sử dụng, quảng cáo và độc quyền; consent đăng tác phẩm riêng. Mục đích thương mại phải có kênh/thời hạn, kể cả gọi RPC trực tiếp.
- Đối tác xác nhận dụng cụ và yêu cầu điện/nước/bàn/giường; khách xác nhận nơi làm đáp ứng. Menu mới bắt buộc khai báo trước khi bán. Đây là khai báo của đối tác, không phải chứng nhận kiểm tra của nền tảng.
- App cũ không được tách giỏ V3 bằng `attach_addons` hoặc ghi đè thỏa thuận đã snapshot. Các thao tác đọc, trạng thái và lịch sử hiện hữu vẫn giữ. Client không thể tự chèn lời hứa/đầu ra ngoài catalog vào contract.

## Bằng chứng kiểm thử

- Web và app TypeScript; ESLint; catalog source/seed đồng bộ; production build web.
- 317 unit tests qua. Bộ chạy mặc định bỏ qua integration khi thiếu biến môi trường; các test API được chạy riêng với JWT khách/đối tác/service role.
- 41 kiểm thử API qua PostgREST: gồm RLS hiện hữu, tạo cả giỏ, retry, chủ quote, trùng vùng, cạnh tranh một slot, matching cả giỏ, quyền sử dụng, đề xuất hai bên và chống ghi trực tiếp.
- Chạy toàn bộ migration từ database trống, seed catalog/demo thật , onboarding đối tác, MCN và `supabase/tests/rules.sql` thành công.
- `commerce_lifecycle.sql`: tạo/đổi/nhận việc; lịch sử hợp đồng; vòng sửa hai đầu ra độc lập; sửa thiếu file; menu opt-in và điều kiện nơi làm; trần mắt mèo; địa chỉ khác nhau cho trial/ngày lễ; đối soát tổng phí/phân bổ; deadline không bị vượt bởi báo thêm công.
- Kiểm tra Chrome local: chọn bốn dòng cho hai người, tổng 410.000đ / 130 phút; chặn nền màu trùng và nút tiếp tục. Ảnh QA lưu ngoài repo tại thư mục visualization của chat.

Database QA dùng cluster PostgreSQL có sẵn và fixture cho schema platform `auth`/`storage`. Business schema, triggers, RPC và RLS dùng migration thật. PostgREST chạy thật với JWT kiểm thử. Kết quả này không xác nhận GoTrue đăng nhập, Storage HTTP, Realtime/push/cron, thiết bị native hoặc production.

## Chạy lại và phát hành

- Có local Supabase: `npm run db:test`, sau đó `npm run test:db` (đã gồm cả bộ commerce API).
- Không có Docker, có PostgreSQL local: `scripts/test-commerce-postgres.sh`. Script tạo database QA riêng trong cluster có sẵn và tự xóa sau test; không tạo container hay stack mới. Platform fixture không thay thế kiểm tra các dịch vụ Supabase ngoài SQL.
- Hai migration theo thứ tự: `20261028140004_service_cart_atomic.sql`, `20261028170037_service_commerce_completion.sql`. Áp database trước client. Không fallback về tạo đơn chính rồi attach món khi RPC mới chưa tồn tại.
- Phát hành web/app dùng RPC mới sau khi migration đã qua môi trường triển khai. Không rollback bằng xóa lineitems hoặc viết lại hợp đồng lịch sử.

Kế hoạch tổng còn các bước sản phẩm/vận hành tiếp theo: recipe từ tác phẩm thật, điều phối đồng thời nhiều đối tác, đo chi phí/thời gian bằng pilot khách thật và phát hành store. V1 này hoàn tất luồng một đối tác nhiều món; không biểu diễn các bước đó thành tính năng đã phát hành.
