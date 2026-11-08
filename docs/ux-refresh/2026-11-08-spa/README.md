# Spa trên 360đẹp: audit và mockup (08/11/2026)

Mockup do Codex vẽ, chưa phải code. Chờ chủ "chốt" trước khi làm.

## Audit: app hiện tại có gì, thiếu gì cho spa

| # | Hiện trạng trong code | Ảnh hưởng tới spa |
|---|---|---|
| 1 | Cả app xây cho **freelancer đến tận nơi**. Đặt lịch tại cơ sở bị khoá: `platform_settings.studio_booking_open = false`, trigger `guard_travelling_freelancer_booking` từ chối mọi lịch `at_home = false`. | Khách không thể đặt lịch đến spa. Phải mở cờ này, hoặc mở riêng cho đối tác loại spa. |
| 2 | Các dịch vụ `studioOnly` bị ẩn khỏi danh sách: **Gội đầu dưỡng sinh**, chăm sóc da đầu, hấp dầu, nhuộm, uốn, duỗi, nối mi, phun mày (`lib/catalog.ts`). | Gội đầu dưỡng sinh, món chính của spa, hiện không ai thấy. |
| 3 | Database chặn trùng giờ theo đối tác: `bookings_no_overlap` (một `pro_id`, một khoảng thời gian). | Spa 4 giường chỉ nhận được 1 khách mỗi khung giờ. Cần khái niệm "số chỗ/giường" cho cơ sở. |
| 4 | Đối tác là **một người** (`Pro`: tên, avatar, số năm kinh nghiệm, bán kính đi xa `maxTravelKm`). Chỉ có một dòng `studioAddress` tự do. | Spa cần: tên cơ sở, địa chỉ có toạ độ, giờ mở cửa, ảnh không gian, tiện nghi, số giường. |
| 5 | Mục "Gội đầu dưỡng sinh" nằm trong danh mục **Tóc**; chăm sóc da là danh mục riêng; massage riêng. | Khách tìm "spa" sẽ không thấy một chỗ gom các thứ này. |
| 6 | Giá theo 3 mức cố định Cơ bản / Chuyên nghiệp / Master, đối tác không tự gõ giá. | Áp dụng được cho spa. Nhưng spa hay có combo (gội + massage cổ vai) mà catalogue chưa có. |
| 7 | Hộp "Chỉ dịch vụ lành mạnh" hiện trên massage (`CONDUCT_CATEGORIES`). | Spa có massage sẽ hiện hộp này; cần quyết có giữ cho spa đã xác minh cơ sở không. |
| 8 | Luồng "Đặt theo dịch vụ" = ai nhận trước thì được. | Không hợp spa: khách chọn spa theo vị trí, nên spa chỉ đi theo luồng "tự chọn" (chọn spa → dịch vụ → giờ). |
| 9 | Phí: hoa hồng 20% đối tác trả, khách trả sau khi làm xong. | Dùng được nguyên; khách "trả tại spa". |
| 10 | Lời nhắc trong chat cho đối tác: "xin vị trí trước khi đi" (`customerNote`). | Sai ngữ cảnh với spa (khách tự đến). |

## Mockup

1. `01-kham-pha.webp`: Khám phá có vòng "Spa", lối "Đến spa gần bạn", mục "Spa gần bạn".
2. `02-danh-sach-spa.webp`: danh sách spa cho một dịch vụ, có khoảng cách, giờ mở cửa, giờ trống hôm nay.
3. `03-ho-so-spa.webp`: hồ sơ spa: ảnh không gian, địa chỉ + chỉ đường, giờ mở cửa, số giường, tiện nghi, bảng giá.
4. `04-chon-gio.webp`: chọn giờ, mỗi khung hiện số giường còn trống.
5. `05-da-dat.webp`: spa đã nhận lịch, trả tại spa, chỉ đường.
6. `06-spa-lich-hom-nay.webp`: phía spa: lịch mới chờ nhận, lịch theo giường.

Prompt gốc trong `prompts/`.

## Đã làm (08/11/2026, sau khi chủ "chốt" bản Khám phá v2)

Nhánh `feat/spa-venues`. Ảnh app thật (Supabase local, một đối tác mẫu đổi thành spa) trong `app/`.

- **Database** (`supabase/migrations/20261108100000_spa_venues.sql`): `pros.kind` ('artist' | 'spa'), `pros.beds`, `pros.amenities`; mỗi lịch giữ một giường (`bookings.seat`), ràng buộc chống trùng giờ thành theo giường; spa luôn được đặt tại spa dù công tắc studio đang tắt; `cart_slot_beds` trả giờ trống kèm số giường; gói "90 phút, kèm massage cổ vai gáy" của gội đầu dưỡng sinh (250k / 320k / 450k). Đã thử: spa 2 giường nhận 2 khách cùng giờ, khách thứ 3 bị báo "Khung giờ này đã kín chỗ".
- **Dùng chung** (`lib/spa.ts`, `lib/launch.ts`): chữ, tiện nghi cố định, giờ mở cửa, chỉ đường; spa được hiện và được bán dịch vụ "chỉ làm tại chỗ".
- **Khám phá** (web + app): Makeup đứng đầu, vòng Spa ở vị trí thứ 5 và dòng "Đến spa gần bạn" dưới Dịch vụ, chỉ khi có spa. Lưới dịch vụ, danh sách Artist và trang dịch vụ không lẫn spa.
- **Spa gần bạn** (`/spa` web, `app/spa` app), **hồ sơ spa**, **đặt giờ tại spa** (Còn N giường, trả tại spa, chỉ đường).
- **Phía spa**: đăng ký "Spa / cơ sở" (tên spa, địa chỉ, số giường, tiện nghi, giờ mở cửa), bảng "Giường & giờ" ở Hôm nay (app), sửa hồ sơ spa (web), admin thấy "Spa, N giường".
- Chat: spa được nhắc "xác nhận giờ đến", không có nút xin vị trí.

Chưa làm: chưa áp migration lên production; app store vẫn là 1.4.0 (bản cũ không thấy spa); giá combo 90 phút là ước tính, chưa khảo sát.
