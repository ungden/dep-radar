# Audit trang Khám phá — 360dep

Ngày kiểm tra: 19/09/2026  
Phạm vi: trang chủ/Khám phá trên production `https://www.360dep.vn/`, đối chiếu với mã nguồn hiện tại.  
Thiết bị kiểm tra: desktop 1280×720 và mobile 390×844 trong Codex In-App Browser.

## Kết luận

Trang Khám phá đang có nền responsive dùng được, nhưng desktop tạo cảm giác mảnh và thiếu tin cậy vì ép nội dung vào năm cột thẻ hẹp. Luồng hiện tại ưu tiên ảnh cảm hứng hơn thông tin giúp khách quyết định đặt lịch. Ba tab feed cũng chưa mang ba ý nghĩa rõ ràng: “Xu hướng” gần giống feed mặc định, còn “Đang theo dõi” kết thúc bằng một dòng chữ trong vùng trống lớn.

Không nên chỉ tăng cỡ chữ toàn trang. Cần sửa cấu trúc feed, thông tin trên thẻ và thứ tự các khối trước; sau đó mới tăng độ đậm thị giác.

## Đánh giá theo vùng

| Bước | Vùng kiểm tra | Tình trạng | Nhận định |
|---|---|---|---|
| 1 | Header, hero và tìm kiếm desktop | Cần sửa | Hero rộng nhưng thiếu hình ảnh hoặc bằng chứng dịch vụ. Thành phố nằm xa nội dung chính; khoảng trống lớn làm trang trông chưa hoàn thiện. |
| 2 | Banner demo, danh mục và CTA đăng yêu cầu | Cần sửa | Ba dải ngang liên tiếp có trọng lượng gần nhau, khiến khách chưa biết nên tìm kiếm, chọn danh mục hay đăng yêu cầu trước. CTA đăng yêu cầu xuất hiện trước khi khách xem tác phẩm. |
| 3 | Tab Dành cho bạn / Đang theo dõi / Xu hướng | Kém | “Dành cho bạn” xuất hiện cả khi chưa có lịch sử. “Xu hướng” hiện chỉ xếp theo rating nên nhìn gần như feed mặc định. Empty state của “Đang theo dõi” không có CTA. |
| 4 | Feed tác phẩm desktop | Kém | Năm cột ở 1280px làm thẻ chỉ khoảng 200px. Metadata 11–13px, avatar 28px và nút lưu 32px tạo cảm giác mảnh. Thẻ thiếu dịch vụ, giá từ, khu vực và khả năng nhận lịch. |
| 5 | Feed mobile | Khá, cần tinh chỉnh | Hai cột phù hợp với ảnh dọc và dễ quét hơn desktop. Tuy vậy metadata vẫn nhỏ, nút lưu khó chạm và tiêu đề phủ trên ảnh có thể thiếu tương phản ở ảnh sáng. |
| 6 | Chuyên viên nổi bật và CTA tuyển thợ | Trung bình | Thẻ chuyên viên có thông tin quyết định tốt hơn thẻ tác phẩm, nhưng xuất hiện sau một feed dài. CTA tuyển thợ rõ, song khoảng trống trước footer làm kết thúc trang rời rạc. |
| 7 | Khả năng tiếp cận quan sát được | Cần sửa | Tab có cấu trúc bàn phím đúng trong code. Nút lưu 32px nhỏ hơn vùng chạm 44px; chữ 11px xuất hiện nhiều; độ tương phản chữ phủ ảnh phụ thuộc từng ảnh. Chưa thể kết luận đầy đủ về trình đọc màn hình chỉ từ kiểm tra hình ảnh. |

## Các vấn đề ưu tiên

### P1 — Feed desktop quá hẹp và thiếu dữ liệu đặt lịch

`xl:grid-cols-5` làm ảnh đẹp nhưng biến marketplace thành một bảng Pinterest thu nhỏ. Khách phải mở từng tác phẩm mới biết đây là dịch vụ gì, giá bao nhiêu và có phù hợp khu vực hay không.

Sửa theo hướng:

- Desktop dùng ba cột ở chiều rộng trung bình và tối đa bốn cột ở màn hình lớn.
- Mỗi thẻ có tên mẫu, loại dịch vụ, giá từ, chuyên viên, rating và khu vực/khoảng cách.
- Hiển thị một tín hiệu khả dụng ngắn như “Còn lịch tuần này” khi backend có dữ liệu đáng tin.
- Nâng metadata chính lên ít nhất 13px và vùng chạm nút lưu lên 44px.

### P1 — Ba feed không có lời hứa khác biệt

Feed “Xu hướng” đang xếp theo rating của chuyên viên, không phản ánh mức quan tâm gần đây. Với khách chưa có lịch sử, “Dành cho bạn” cũng chỉ là một cách xếp mặc định.

Sửa theo hướng:

- Khách chưa đăng nhập: dùng “Gần bạn”, “Mới nhất” và “Xu hướng”.
- Khách có lịch sử: mới dùng “Dành cho bạn”; giải thích ngắn dựa trên dịch vụ đã xem/lưu/đặt.
- “Xu hướng” cần tín hiệu theo thời gian như lượt lưu, lượt xem đủ chất lượng hoặc số lịch gần đây, có chống spam.
- “Đang theo dõi” chỉ hiện khi đăng nhập; empty state phải có nút “Khám phá chuyên viên” và một nhóm gợi ý để theo dõi.

### P1 — First fold có quá nhiều lời mời hành động ngang hàng

Tìm kiếm, cảnh báo demo, sáu danh mục, CTA đăng yêu cầu và tab feed xếp liền nhau. Không có một hành trình chính đủ mạnh.

Thứ tự đề xuất:

1. Hero gọn với tìm kiếm và một lời hứa rõ: tìm chuyên viên, xem giá, chọn giờ.
2. Danh mục dịch vụ và tín hiệu tin cậy.
3. Chuyên viên phù hợp gần bạn.
4. Feed tác phẩm.
5. CTA đăng yêu cầu sau khi khách đã xem một phần nguồn cung.

Banner demo nên thành thông báo nhỏ ít nổi hơn hoặc được gỡ khi mở dữ liệu thật.

### P2 — Độ đậm thị giác quá thấp

Màu nền, viền, shadow và chữ phụ đều nhẹ. Khi đi cùng card nhỏ, toàn trang trông giống wireframe đã tô màu hơn là marketplace đang hoạt động.

Sửa theo hướng:

- Dùng chữ nội dung 15–16px, metadata tối thiểu 13px; tăng tương phản của `text-muted`.
- Card quan trọng có viền rõ hoặc shadow vừa đủ; không dùng cùng một độ nổi cho mọi khối.
- Dành màu rose cho hành động và trạng thái quan trọng, giảm số vùng nền blush trải rộng.
- Hero cần một cụm hình dịch vụ/chuyên viên hoặc bằng chứng cung thật thay cho khoảng trắng.

### P2 — Nội dung lặp làm feed thiếu chiều sâu

Nhiều tác phẩm liên tiếp của cùng một chuyên viên khiến người xem tưởng nguồn cung ít. Cần giới hạn số thẻ liên tiếp của một chuyên viên, xen kẽ danh mục và đưa nhóm chuyên viên lên sớm hơn.

## Hướng giao diện đề xuất

Giữ nhận diện hồng ấm và serif cho headline, nhưng chuyển trang chủ từ “gallery mảnh” sang “marketplace biên tập”: hero gọn, card đủ rộng, thông tin đặt lịch đọc được ngay và mỗi section có mục đích rõ.

Khung desktop đề xuất:

- Container 1160–1200px.
- Hero hai cột hoặc hero một cột gọn, cao khoảng 280–340px.
- Feed ba cột từ 768–1199px, bốn cột từ 1200px trở lên.
- Card tác phẩm rộng tối thiểu khoảng 250px.
- Khoảng cách section 48–64px, nhưng khoảng cách trong cụm chỉ 12–24px.

Mobile tiếp tục dùng hai cột ảnh. Thông tin giá và dịch vụ có thể đặt dưới ảnh thành hai dòng; khu vực/khả dụng chỉ hiện một dòng ngắn để tránh làm thẻ quá cao.

## Tiêu chí nghiệm thu đợt sửa Khám phá

- Ở 1280px không có thẻ tác phẩm hẹp dưới khoảng 240–250px.
- Khách biết được loại dịch vụ, giá từ và chuyên viên mà không cần mở thẻ.
- Mỗi tab tạo ra danh sách có lý do rõ ràng; empty state luôn có hành động tiếp theo.
- Nút chính và nút lưu có vùng chạm tối thiểu 44×44px.
- Không dùng chữ nội dung quan trọng dưới 13px.
- Feed không có quá hai tác phẩm liên tiếp của cùng một chuyên viên khi còn nguồn khác.
- Kiểm thử lại desktop, iPhone và Android thật với ảnh sáng/tối, bàn phím và trình đọc màn hình.

