# Audit UX theo hành trình khách hàng — 360dep.vn

Ngày kiểm tra: 21/07/2026
Kích thước kiểm tra trực tiếp: 1440 × 900 và 390 × 844

## Kết luận

Hành trình chính đã chuyển từ cách nói của đội vận hành sang cách ra quyết định của khách hàng: chọn nhu cầu, nhận hướng dẫn nên đọc trước, hiểu ranh giới an toàn, rồi mới xem sản phẩm đã được gắn đúng chủ đề. Những trạng thái chưa đủ dữ liệu không còn giả vờ có đề xuất hoặc hiển thị nút mua giống một lỗi hệ thống.

## Hành trình đã kiểm tra

1. **Trang chủ → chọn lối vào — Tốt sau sửa**
   - Trước: “catalogue”, “briefing” và tên module nội bộ làm khách hàng phải tự giải mã cấu trúc trang.
   - Sau: CTA chính là “Bắt đầu chọn nhu cầu”, CTA phụ là “Xem tất cả chủ đề”; số liệu nói rõ bài mới và số chủ đề có hướng dẫn.
   - Bằng chứng: `01-homepage.png`, `10-mobile-home.png`, `14-mobile-home-after.png`.

2. **Chọn mục tiêu → tình trạng → bối cảnh → ngân sách — Tốt**
   - Finder giữ tối đa bốn bước, không bắt buộc hoàn thành toàn bộ.
   - Lựa chọn được thể hiện bằng trạng thái chữ, nền và viền; không phụ thuộc riêng vào màu.
   - Deep link giữ nguyên lựa chọn để chia sẻ hoặc quay lại.
   - Bằng chứng: `02-goal-selected.png`, `03-profile-selected.png`, `11-mobile-finder.png`.

3. **Mở chủ đề phù hợp — Tốt sau sửa**
   - Trước: phần đầu chỉ nhắc lại “Mụn ẩn”, làm mất “Da nhạy cảm” và “Dưới 200k”.
   - Sau: snapshot hiển thị đủ ba lựa chọn, giải thích ngắn gọn và đưa ranh giới an toàn ngay đầu trang.
   - Bằng chứng: `04-catalogue-result.png`, `15-catalogue-result-after.png`.

4. **Hiểu lộ trình đọc — Tốt sau sửa**
   - Lộ trình năm bước vẫn giữ Bắt đầu → Hiểu vấn đề → Xây quy trình → Chọn sản phẩm → Ranh giới an toàn.
   - Các bước có bài đọc giờ dùng nhãn hành động rõ “Đọc bài →”, thay vì trông giống đoạn chữ không tương tác.
   - Bằng chứng: `05-reading-path.png`.

5. **Nhận kết quả bài viết và sản phẩm — Tốt sau sửa**
   - Trước: tiêu đề hứa cả bài viết và sản phẩm nhưng kết quả có 0 sản phẩm, không giải thích và không có đường thoát.
   - Sau: bài nên bắt đầu được đưa thành CTA nổi bật. Khi chưa có sản phẩm khớp đủ ba lựa chọn, trang nói rõ lý do, giữ bốn bài phù hợp và cho phép bỏ riêng giới hạn ngân sách.
   - Bằng chứng: `06-library-result.png`, `16-catalogue-library-after.png`.

6. **Đọc bài → quyết định bước tiếp theo — Tốt sau sửa**
   - Trước: trang công khai lộ các nhãn vận hành như “Câu hỏi đang xử lý”, “Shopee query”, “Affiliate treatment” và “graph”.
   - Sau: thay bằng “Bài này giúp bạn trả lời”, “Bước tiếp theo nên đọc gì?”, “Xem thông tin sản phẩm”; bỏ toàn bộ ghi chú nội bộ khỏi giao diện công khai.
   - Bằng chứng: `07-article-start.png`, `08-article-content.png`, `09-article-recommendations.png`, `17-article-recommendations-after.png`.

7. **Xem sản phẩm → cân nhắc trước khi mua — Tốt sau sửa**
   - Trước: nút hồng bị vô hiệu với chữ “Chưa có offer đã xác minh” giống một CTA chính bị hỏng.
   - Sau: trạng thái trung tính “Chưa có nơi mua đã kiểm tra”, đặt cạnh tóm tắt nên cân nhắc/tránh; không tạo áp lực mua khi chưa đủ nguồn.
   - Bằng chứng: `12-mobile-product.png`, `13-mobile-product-decision.png`, `18-mobile-product-after.png`.

8. **Điều hướng mobile và toàn hệ thống — Tốt sau sửa**
   - Mobile menu hiển thị đủ 14 chủ đề theo bốn nhóm; nhãn chính dùng “Chủ đề” và “Kiến thức”.
   - Footer, sản phẩm, tìm kiếm và danh bạ người sáng tạo đã bỏ các từ nội bộ dễ gây hiểu nhầm như “quality gate”, “claim”, “offer”, “catalogue” ở phần chữ dành cho khách hàng.

## Điểm mạnh hiện tại

- Kiến thức luôn xuất hiện trước đề xuất mua.
- Tình trạng không có dữ liệu được trình bày trung thực và có lựa chọn thay thế.
- Cảnh báo an toàn nằm sớm trong hành trình, không bị chôn cuối bài.
- Sản phẩm liên quan cần cùng chủ đề hoặc mapping rõ; không dùng mô tả tự do để tự động gắn chủ đề.
- Ngôn ngữ, hierarchy và CTA đã thống nhất giữa trang chủ, chủ đề, bài viết và sản phẩm.

## Accessibility và giới hạn kiểm tra

- Kiểm tra trực tiếp ở 390 px: không có tràn ngang, mỗi trang có một `h1`, ảnh trên trang chủ có alt, không có lỗi console.
- Trạng thái chọn không phụ thuộc riêng vào màu; CTA và bộ lọc chính dùng chiều cao tối thiểu 44 px.
- Audit ban đầu phát hiện các link chữ ở trang chủ/footer nhỏ hơn 44 px; code đã tăng hit area lên tối thiểu 44 px và tăng nút tìm kiếm mobile lên 44 × 44 px.
- Đã giữ skip link, focus-visible và reduced-motion hiện có. Contrast được đánh giá bằng giao diện render; chưa thay thế cho một lần đo WCAG chuyên dụng trên mọi biến thể dark mode và mọi màn hình nội dung.

## Bằng chứng browser

- Trước sửa: `01-homepage.png` đến `13-mobile-product-decision.png`.
- Sau sửa: `14-mobile-home-after.png` đến `18-mobile-product-after.png`.
