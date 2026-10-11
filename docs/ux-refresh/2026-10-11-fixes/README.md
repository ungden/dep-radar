# 360đẹp — Fix sau audit UX/UI

Ngày 11/10/2026, nhánh `codex/ux-ui-refresh`. Sửa tiếp trên bản refresh `f542020`.

## Đã sửa

| Audit | Thay đổi | Bằng chứng |
|---|---|---|
| R01 | Host bottom sheet nằm trong native modal đặt lịch; không dùng overlay toàn cửa sổ | iOS route booking thật: chọn ngày 13/10 và giờ 10:17, đóng picker và đọc lại đúng giá trị; ảnh date/time picker |
| R02 | Lỗi xác nhận giá hiện rõ, có retry; khóa gửi trong lúc chờ giá mới, giữ lựa chọn | 3 React regression tests cho lỗi RPC/network, loading khi retry và phục hồi |
| R03 | Số cột giờ theo chiều rộng/cỡ chữ, chiều cao theo nội dung; footer xếp dọc ở chữ lớn; nút quay lại dùng icon | iOS accessibility-large: HH:mm, tổng 4.800.000đ, CTA đều đọc đủ |
| R04 | Gói đang bán và giá thật hiện trước; khung đúng 3 mức giá mở rộng, các chip xuống dòng | Web 320px: scrollWidth = innerWidth = 320; hàng giá right = 283px |
| R05 | Link search → detail giữ city/home/price/verified/open; detail dùng cùng query context | Search Hà Nội → Sơn gel trơn → QA Hà Nội, Tay + chân 400.000đ/90 phút |
| R06 | Giá khởi điểm, thời lượng và số người tối thiểu lấy từ cùng một gói được niêm yết; ghi /người và tổng tối thiểu nhóm | Kỷ yếu 150.000đ/người, tối thiểu 5 người = 750.000đ; không xuất hiện trong ngân sách 300k; pure regression tests |
| R07 | `fetchSlots` phân biệt lỗi với danh sách trống, có retry trên web và app | Web HTTP 503: hiện lỗi + nút thử lại; phục hồi 09:00–16:00 và giữ ngày 12/10; React regression tests |
| R08 | Lọc người làm và từng gói trước khi tổng hợp; giá, đến nhà, xác minh cùng thuộc một người đáp ứng | iOS hai người QA: home400k/studio120k; home + dưới300k trả 0 dịch vụ, 0 người; pure regression test |
| R09 | Chỉ chờ quote khi đủ tài khoản, số điện thoại, giờ và địa chỉ cần thiết; CTA thêm địa chỉ/số điện thoại vẫn dùng được | Source readback + mobile typecheck/lint; chưa E2E tài khoản thật |
| R10 | URL quay về sau đăng nhập giữ ngày/giờ của cả hai buổi | React regression test round-trip exact secondDate/secondTime |
| R11 | Công cụ giá và QR dùng `<dialog>` chung; giá và sao hỗ trợ arrow/Home/End, roving tabIndex | Browser public filter dùng cùng Sheet: ArrowRight chọn300k, Escape đóng, focus về Bộ lọc; helper regression tests. Công cụ đăng nhập chưa E2E |
| R12 | Viền sao tương phản cao hơn; nhãn mức giá chọn dùng trắng hoàn toàn; avatar có tên accessible và focus ring cho upload | Source readback + lint/typecheck; không tuyên bố WCAG toàn sản phẩm |

Bổ sung: input nhỏ được bảo đảm min-height52px; khung giá trên màn đăng yêu cầu xếp dọc dưới400px; hồ sơ đối tác thiếu snapshot có đường thử lại thay vì crash. Card thiếu portfolio thật thu gọn thành nội dung và icon. Không tạo ảnh tác phẩm người làm giả. Add-on chỉ hỗ trợ số lượng1 không còn liệt kê gói yêu cầu tối thiểu nhiều người.

## Kiểm chứng và giới hạn

- Backend localhost fixture chỉ đọc; không tạo tài khoản, booking, thanh toán hoặc ghi database. Hai hồ sơ QA không phải hồ sơ công khai thật.
- Web production build local; viewport320×720/390×844. Ảnh full-page có thể vẽ thanh fixed theo vị trí cuộn hiện tại.
- Expo Go: R2R iPhone17Pro, iOS26.5, `large` và `accessibility-large`. Bánh răng xanh thuộc Expo Go. Đã khôi phục cỡ chữ `large` và tắt simulator sau QA.
- Typecheck và lint web/mobile pass; Vitest 261 pass /31 skip; Next production build84 pages pass; Expo iOS export pass.
- 31 tests được skip: 30 RLS integration cần database, 1 AI live test cần provider. Không chạy stack Supabase/Docker mới.
- Chưa kiểm chứng Android, thiết bị vật lý, VoiceOver end-to-end hoặc checkout tài khoản thật. Quote recovery dùng React DOM với mock server response; không gọi đó là booking thành công thật.
- Chỉ commit local; chưa push, deploy hay gửi bản store.

Ảnh đối chiếu nằm trong `screenshots/`. Audit trước sửa nằm tại `../../audits/2026-10-11-post-refresh/AUDIT.md`.
