# 3 ảnh ref — 09/11/2026

**Đã bị bác sau phản hồi của chủ sản phẩm:** quá ít dịch vụ/kỹ thuật viên và thiếu khác biệt sáng tạo. Không dùng bộ này làm target triển khai. Xem [audit sửa hướng và bộ v2](../AUDIT-REF-V2.md).

Ảnh concept do Image Gen tạo từ screenshot Home vừa capture. Không phải giao diện đã triển khai. Thứ tự đúng với 3 ảnh hiển thị trong chat; chưa có lựa chọn/chấp thuận code.

1. [Dịch vụ rõ ràng](01-dich-vu-ro-rang.png) — đặt nhu cầu và giá vào lượt nhìn đầu, giảm card cơ chế nhận đơn. Chữ headline còn lớn; khi chọn cần thử safe-area thật và font 17pt.
2. [Sổ tay vẻ đẹp](02-so-tay-ve-dep.png) — khám phá theo hình ảnh, mỗi ảnh nối trực tiếp sang gói/giá. Hợp người chưa biết chọn gì; kém nhanh hơn cho khách đã có nhu cầu cụ thể.
3. [Lịch đẹp của bạn](03-lich-dep-cua-ban.png) — chọn dịch vụ, khu vực, ngày rồi kiểm tra chuyên viên. Cần kiểm chứng khả năng tìm availability khi làm thật. Ảnh generator vẫn dùng trang phục cô dâu cho gói dự tiệc từ reference; phải thay bằng ảnh đúng ngữ cảnh nếu chọn hướng này.

Mỗi file `.prompt.md` ghi đầy đủ brief, constraints và ngày anchor. Giá và nội dung là ví dụ thiết kế; không tạo rating, lượt đặt hay lời hứa giờ trống. Spa trong ref là định hướng điều hướng, không phải xác nhận đã có spa khả dụng trên production.

Mục tiêu viewport 390×844 logical; ảnh raster không phải đặc tả pixel tuyệt đối. Chưa kiểm chứng contrast đo bằng công cụ, cỡ chữ thật, Dynamic Type, safe areas hay tương tác trên các concept. Nếu chọn một hướng, cần tinh chỉnh ảnh đó trước khi code theo yêu cầu tiếp theo của người dùng.
