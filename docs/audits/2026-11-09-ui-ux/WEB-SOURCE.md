# 360đẹp — rà soát nguồn UX/UI web

Ngày: **09/11/2026, Asia/Ho_Chi_Minh**. Nguồn được đọc tại nhánh **`feat/spa-venues`**, commit **`d308051`**.

**Toàn bộ phát hiện dưới đây là source-only:** đọc code hiện tại, chưa tái hiện trên trình duyệt trong phần rà soát này. Chưa xác nhận giao diện, dữ liệu, lỗi hoặc hành vi tương ứng đang có trên production. Screenshot native do phần audit chính thu thập là bằng chứng riêng, không tự chứng minh hành vi web.

Nhánh local có spa. [Ghi chú spa](../../ux-refresh/2026-11-08-spa/README.md) ghi migration chưa được áp production và bản store 1.4.0 chưa có spa; đó là trạng thái được tài liệu ghi lại, **không phải kiểm tra deployment mới trong audit này**. README gốc chưa phản ánh đầy đủ nhánh spa. Không sửa code ứng dụng trong lần rà soát này.

## Các vấn đề cần ưu tiên

| Mức | Phát hiện source-only | Ảnh hưởng và hướng sửa thiết kế |
|---|---|---|
| P1 | **Tìm tên Artist nhưng mặc định tìm trong dịch vụ.** Header hứa tìm tên Artist, đi `/search?q=…`; search mặc định tab `services`, chỉ match tên/mô tả/category dịch vụ. Tên người được tìm ở tab riêng. | Có kết quả đúng ở tab người nhưng màn đầu có thể báo không có dịch vụ. Search cần hiển thị hoặc điều hướng tới nhóm kết quả phù hợp với truy vấn. |
| P1 | **Bấm giờ “Còn chỗ hôm nay” của spa không giữ ngày/giờ.** Các chip cùng trỏ `bookHref()` chỉ chứa service/variant; booking mặc định ngày mai và chưa chọn giờ. | Ý định vừa chọn bị mất. Link phải giữ chính xác dịch vụ, ngày, giờ và xác nhận lại khả dụng. Cần tái hiện với dữ liệu spa local. |
| P1 | **Dịch vụ chưa có người nhận trông như dịch vụ đã có nguồn cung.** Home bổ sung `notYetOffered` cho đủ lưới; `CatalogTile` dùng cùng kiểu card và “Từ giá” như `ServiceTile`, không nhãn thiếu người nhận. | Khách chỉ phát hiện thiếu nguồn cung sau khi mở chi tiết. Phân biệt “Có người nhận” và “Gửi nhu cầu”; nhãn ảnh minh hoạ không thay thế trạng thái khả dụng. |
| P2 | **Spa luôn đánh dấu “Gần nhất”, kể cả chưa có khoảng cách.** Chip active nhưng không có `onClick`; thuật toán fallback sang điểm xếp hạng khi khoảng cách null. | Nhãn mô tả sai cơ sở sắp xếp. Dùng “Phù hợp” khi chưa có địa chỉ và giải thích cách bật khoảng cách. |
| P2 | **Mất dịch vụ khi đi qua hồ sơ.** Artist list chỉ truyền category `album`; spa card có truyền `service` nhưng profile chỉ đọc `album`/`tab`; CTA profile đi `/book/id` không service. | Từ một dịch vụ cụ thể, khách có thể thấy giá thấp nhất của toàn hồ sơ rồi vào dịch vụ mặc định khác. Giữ service/variant và giá tương ứng xuyên suốt. |

### Bằng chứng cho các vấn đề trên

1. Tìm kiếm: [header](../../../components/layout/app-shell.tsx), dòng 76 và 84–85; [search](../../../app/search/search-view.tsx), dòng 85–86, 115–119, 170–176.
2. Chip giờ spa: [spa list](../../../app/spa/spa-view.tsx), dòng 139 và 174–178; [booking](../../../app/book/[proId]/page.tsx), dòng 139–140.
3. Nguồn cung: [home](../../../app/home-view.tsx), dòng 46–47 và 140–146; [tiles](../../../components/shop.tsx), dòng 103–125.
4. “Gần nhất”: [spa list](../../../app/spa/spa-view.tsx), dòng 47–50, 81 và 104–113. Đối chiếu xử lý có điều kiện tốt hơn tại [search](../../../app/search/search-view.tsx), dòng 439–450.
5. Giữ ngữ cảnh dịch vụ: [Artist list](../../../app/pros/pros-view.tsx), dòng 183; [spa list](../../../app/spa/spa-view.tsx), dòng 143; [profile](../../../app/pros/[id]/pro-profile.tsx), dòng 94–101 và 357.

## Thứ bậc nội dung và điều hướng

Các mục sau là rủi ro thiết kế suy ra từ cấu trúc hiện tại, cần đối chiếu screenshot và thao tác thực tế trước khi chốt mức độ.

- **Home yêu cầu chọn cơ chế trước nhu cầu.** Headline và rail danh mục đi trước hai card “Đặt theo dịch vụ / Tự chọn Artist”; mỗi card mobile tối thiểu 176px. Lưới dịch vụ ở sau cả hai. Đề xuất đưa nhu cầu, khu vực và dịch vụ thật lên trước; “Chọn chuyên viên giúp tôi” là một lựa chọn sau khi đã biết dịch vụ. Bằng chứng: [home](../../../app/home-view.tsx), dòng 69–149 và 187.
- **Giá/dịch vụ nằm sâu trong hồ sơ.** Cover, avatar, tên, nghề, vị trí, badge, facts, stats và lời giải thích chat đều ở trước tabs. Nếu có tác phẩm, tab mặc định là “Tác phẩm”; “Bảng giá” cần đổi tab. Đề xuất một cụm thông tin tin cậy ngắn, sau đó dịch vụ/giá/giờ; các chi tiết khác mở rộng. Bằng chứng: [profile](../../../app/pros/[id]/pro-profile.tsx), dòng 101, 155–218, 224–244.
- **Spa chưa thống nhất với điều hướng chính.** Lối spa trên home chỉ hiện khi có spa đang nhận trong city; search dịch vụ và `/pros` loại spa. Bottom nav không có matcher `/spa`; spa list cũng không có mobile top bar hoặc back bar riêng trong source. Đề xuất entry “Tại nhà / Đến spa” ổn định và empty state rõ ràng khi chưa có nguồn cung. Bằng chứng: [home](../../../app/home-view.tsx), dòng 41, 77, 151; [search](../../../app/search/search-view.tsx), dòng 113–115; [shell](../../../components/layout/app-shell.tsx), dòng 25–30 và 64; [spa list](../../../app/spa/spa-view.tsx), dòng 67–100.
- **Bước xác nhận chứa quá nhiều việc phụ.** Ghi chú, ảnh mẫu, quyền đăng ảnh, mục đích sử dụng ảnh, phương thức thanh toán chưa hoạt động và buổi thứ hai cùng xuất hiện trong bước cuối. Đề xuất ưu tiên ngày/giờ, địa điểm, tổng tiền và trạng thái chờ nhận; thu gọn tuỳ chọn và chỉ trình bày phương thức thanh toán khả dụng trong phần quyết định chính. Bằng chứng: [booking](../../../app/book/[proId]/page.tsx), dòng 643–833.

## UI và accessibility — cần xác minh rendered UI

- **Type scale thay đổi giữa màn.** Home/Artist/spa dùng `.roomy`: body17/meta15; search/profile/booking dùng base body16/meta14/label13. Tab bar hardcode11.5px; số giường12px; badge ảnh minh hoạ13px ở tile nhưng11px ở service detail. Cần một scale nhất quán và kiểm tra chữ lớn, không chỉ tăng tất cả kích thước. Nguồn: [CSS](../../../app/globals.css), dòng 10–21 và 187–197; [shell](../../../components/layout/app-shell.tsx), dòng 326; [booking](../../../app/book/[proId]/page.tsx), dòng 597; [service detail](../../../app/dich-vu/[id]/service-view.tsx), dòng 79; [tiles](../../../components/shop.tsx), dòng 29.
- **Một số vùng bấm nhỏ hơn chuẩn44px đã có trong component chung.** +/- số người dùng32px; xoá ảnh24px; chip spa tối thiểu40px. Cần đo bounding box, khoảng cách và vùng hit thực tế. Nguồn: [booking](../../../app/book/[proId]/page.tsx), dòng 430–432 và 706; [spa list](../../../app/spa/spa-view.tsx), dòng 111; [Button chung](../../../components/ui.tsx), dòng 46–50.
- Chưa kiểm tra screen reader, keyboard toàn luồng, zoom, focus sau điều hướng, contrast thực tế trên ảnh, hoặc tuân thủ WCAG toàn app. Không có cơ sở để kết luận mọi chữ đều thiếu contrast.

## Những phần nên giữ

- Booking cho khách chọn trước khi đăng nhập, giữ lựa chọn qua URL và giải thích ở login: [booking](../../../app/book/[proId]/page.tsx), dòng 115–148; [login](../../../app/login/page.tsx), dòng 79–87.
- Tổng tiền sticky qua các bước; lỗi tải giờ được phân biệt với hết slot và có retry: [booking](../../../app/book/[proId]/page.tsx), dòng 223–228, 566, 902–931.
- Focus visible và reduced motion đã có ở global CSS: [CSS](../../../app/globals.css), dòng 95–97 và 126–136.
- Bảng màu nền sáng, chữ ink và accent rose đã có chủ ý. Hướng ref nên giải quyết thứ bậc, cấu trúc card và độ nhất quán trước khi chỉ thay palette.

## Phạm vi chưa kiểm chứng

Chưa chạy web, đăng nhập, gửi lịch, gọi thanh toán hoặc thay đổi dữ liệu. Chưa xác nhận các vấn đề trên tái hiện trong production hay bản app store. Báo cáo này bổ sung bằng chứng nguồn cho audit hình ảnh hiện tại, không thay thế audit tương tác.
