# Accessibility và typography — lần audit sau refresh

Ngày: 2026-10-11. Source được kiểm tra: `f542020` (`codex/ux-ui-refresh`). Baseline đối chiếu: `dc071613457f73a47337542553ad78ab607753e4`.

Đây là audit source, CSS đã build và đối chiếu Git. Người viết không mở browser/native UI, không tạo server, không sửa sản phẩm và không thực hiện thao tác tài khoản. Bằng chứng runtime ở mục A6 do phiên audit chính cung cấp, được ghi riêng để không nhầm với quan sát trực tiếp của người viết.

## A1 · P2 · Modal bảng giá và QR chưa quản lý focus

- Nguồn chính: [app/studio/services/page.tsx:276](/Users/alexle/Documents/đẹp-radar/app/studio/services/page.tsx:276), đặc biệt dòng 278–291.
- Trường hợp thứ hai: [components/payout.tsx:149](/Users/alexle/Documents/đẹp-radar/components/payout.tsx:149).
- Cách kích hoạt: đối tác mở “Thêm” hoặc “Sửa giá” tại `/studio/services`; hoặc mở “Hiện mã QR nhận tiền” từ lịch hẹn.
- Hai implementation dùng `div role="dialog"`, chỉ xử lý click. Không có initial focus, focus trap, Escape handler, `aria-modal`, inert cho nền hoặc focus return. Focus bàn phím có thể ở lại nút mở và tiếp tục đi qua thao tác phía sau overlay. Screen reader không được giới hạn vào modal đang hiển thị.
- Đề xuất: tái sử dụng [components/sheet.tsx:26](/Users/alexle/Documents/đẹp-radar/components/sheet.tsx:26), vốn gọi `showModal()` trên `<dialog>`, rồi kiểm tra focus return khi chuyển từ danh sách dịch vụ sang trình sửa giá.
- Mức tin cậy: **cao, xác nhận từ toàn bộ component**. Chưa quay lại đường authenticated để ghi video Tab/Escape.
- Lịch sử: **tồn tại trước refresh**. `git show dc07161:app/studio/services/page.tsx` vẫn có cùng `Sheet` bằng `div`; refresh không xử lý nó.

## A2 · P2 · Upload avatar không có tên truy cập; uploader thiếu focus nhìn thấy

- [app/studio/profile/edit/page.tsx:95](/Users/alexle/Documents/đẹp-radar/app/studio/profile/edit/page.tsx:95): label chỉ chứa icon `Camera` và file input `sr-only` (dòng 95–113), không có text, `aria-label` hoặc `title`. Screen reader không nhận được tên “Đổi ảnh đại diện”. Đoạn mô tả bên cạnh không liên kết với input.
- Input vẫn có thể được Tab tới nhưng outline global nằm trên input bị `sr-only` cắt; label hiển thị không có `focus-within` hay `:has(:focus-visible)`.
- Cùng lỗi focus, dù đã có tên, xuất hiện ở upload portfolio [app/studio/works/page.tsx:376](/Users/alexle/Documents/đẹp-radar/app/studio/works/page.tsx:376) và upload ảnh mẫu đặt lịch [app/book/[proId]/page.tsx:741](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:741).
- Đề xuất: thêm accessible name cụ thể cho avatar; vẽ focus ring trên wrapper nhìn thấy của tất cả uploader dùng `sr-only`.
- Mức tin cậy: **cao từ markup/CSS**. Chưa xác minh cách đọc cụ thể trên VoiceOver/NVDA.
- Lịch sử: **tồn tại trước refresh**. Markup avatar không đổi so với `dc07161`; portfolio chỉ đổi kích thước typography.

## A3 · P2 · Sao đánh giá và một số label mức giá thiếu tương phản

- Sao đánh giá khách: [app/bookings/[id]/review/page.tsx:239](/Users/alexle/Documents/đẹp-radar/app/bookings/[id]/review/page.tsx:239), dòng 239–240.
- Sao đánh giá khách từ phía đối tác: [components/booking-extras.tsx:532](/Users/alexle/Documents/đẹp-radar/components/booking-extras.tsx:532), đặc biệt `text-line` tại dòng 535.
- Label mức giá đang chọn: [app/studio/services/page.tsx:232](/Users/alexle/Documents/đẹp-radar/app/studio/services/page.tsx:232) và [app/requests/new/page.tsx:235](/Users/alexle/Documents/đẹp-radar/app/requests/new/page.tsx:235).
- Các màu lấy từ [app/globals.css:22](/Users/alexle/Documents/đẹp-radar/app/globals.css:22). Đã tính trực tiếp theo công thức sRGB; không dựa vào cảm nhận ảnh chụp.

| Đối tượng | Màu trước / nền | Tỷ lệ |
| --- | --- | ---: |
| Sao đã chọn trên form khách | `#e0a33a` / canvas `#FAF6F4` | 2.065:1 |
| Sao chưa chọn trên form khách | line `#EFE3DF` / canvas `#FAF6F4` | 1.169:1 |
| Sao chưa chọn trên form đối tác | line `#EFE3DF` / surface `#FFFFFF` | 1.256:1 |
| Label giá đang chọn | trắng 85% trên accent `#A8535D` | khoảng 4.221:1 |
| Đối chứng: trắng nguyên trên accent | `#FFFFFF` / `#A8535D` | 5.172:1 |

Sao là đồ họa cần nhận diện để thao tác, nên dùng ngưỡng 3:1. Label mức giá là chữ 14px bình thường, nên dùng ngưỡng 4.5:1. Màu vàng có thể được giữ làm fill nếu thêm viền đủ đậm; nền accent hiện tại đủ tương phản với trắng nguyên.

Phép tính: mỗi kênh 8-bit chia 255; linearize bằng `s / 12.92` nếu `s <= 0.04045`, ngược lại `((s + 0.055) / 1.055) ^ 2.4`; luminance `L = 0.2126 R + 0.7152 G + 0.0722 B`; contrast `(L_sáng + 0.05) / (L_tối + 0.05)`. Với label, composite trắng 85% lên accent trước; làm tròn 8-bit cho ra `#F2E5E7`. Sai số làm tròn không thay đổi kết luận dưới 4.5:1.

- Mức tin cậy: **cao với màu định nghĩa trong source**. Không phải đo màu pixel đã anti-alias.
- Lịch sử: **tồn tại trước refresh**. Màu sao và `text-white/85` không đổi; label được tăng từ 12px lên 14px nhưng vẫn chưa thuộc nhóm chữ lớn để giảm ngưỡng tương phản.

## A4 · P2 · Radio keyboard còn thiếu trong luồng đặt và bán dịch vụ

- [app/requests/new/page.tsx:222](/Users/alexle/Documents/đẹp-radar/app/requests/new/page.tsx:222): mức giá yêu cầu.
- [app/studio/services/page.tsx:219](/Users/alexle/Documents/đẹp-radar/app/studio/services/page.tsx:219): mức giá đối tác.
- [app/bookings/[id]/review/page.tsx:237](/Users/alexle/Documents/đẹp-radar/app/bookings/[id]/review/page.tsx:237): số sao khách chấm người làm.
- [components/booking-extras.tsx:532](/Users/alexle/Documents/đẹp-radar/components/booking-extras.tsx:532): số sao đối tác chấm khách.

Các nhóm khai báo `radiogroup`/`radio`, nhưng chỉ có `onClick`, không có arrow-key handler và roving `tabIndex`. Khi focus một mức giá hoặc số sao, ArrowLeft/Right không đổi lựa chọn như radio; mọi lựa chọn đều thành Tab stop. Enter/Space vẫn có thể click button, nên đây là hành vi keyboard không khớp semantics, không phải khẳng định hoàn toàn không thao tác được bằng bàn phím.

Đề xuất: dùng native radio hoặc áp dụng [lib/radio-navigation.ts:4](/Users/alexle/Documents/đẹp-radar/lib/radio-navigation.ts:4) cùng một Tab stop cho mỗi nhóm; kiểm tra nhóm chưa có lựa chọn ban đầu.

- Mức tin cậy: **cao từ markup và sự vắng mặt handler**.
- Lịch sử: **tồn tại trước refresh**. Refresh đã sửa discovery/filter nhưng chưa phủ các nhóm nghiệp vụ này.

## A5 · P2 candidate · Fixed height nhỏ hơn vùng chữ và padding của input

- [app/studio/profile/edit/page.tsx:506](/Users/alexle/Documents/đẹp-radar/app/studio/profile/edit/page.tsx:506) và dòng 519: hai select giờ bắt đầu/kết thúc dùng `cn(inputClass, "h-9 w-24 text-body")`.
- [components/booking-disputes.tsx:191](/Users/alexle/Documents/đẹp-radar/components/booking-disputes.tsx:191): số người của dịch vụ làm thêm dùng `h-9`.
- [app/studio/profile/edit/page.tsx:253](/Users/alexle/Documents/đẹp-radar/app/studio/profile/edit/page.tsx:253): tên gợi nhớ điểm xuất phát dùng `h-10`.
- [components/ui.tsx:354](/Users/alexle/Documents/đẹp-radar/components/ui.tsx:354): `inputClass` chứa `py-3`, border và `text-body`.

CSS đã build trong `.next/static/css` xác nhận `h-9 = 9 × 4 = 36px`, `py-3 = 12px` mỗi phía; border-box còn `36 - 24 - 2 = 10px` cho content. `text-body` hiện là 16px, line-height 1.6 = 25.6px. Trường `h-10` còn 14px content. Điều này mâu thuẫn với typography tăng kích thước và có nguy cơ cắt/chèn chữ, đặc biệt khi tăng cỡ chữ.

**Đối chiếu baseline:** `dc07161` đã có `h-9` và cùng `inputClass` với `py-3`, border; các caller override `text-sm` (14px, line-height 20px). Refresh chỉ đổi các caller sang `text-body` (16px, 25.6px), không đổi height/padding. Vì vậy lỗi sizing **có từ trước và bị làm nặng hơn bởi migration**, không nên mô tả là một fixed-height bug mới được tạo hoàn toàn trong `f542020`.

Đề xuất: bỏ fixed height, dùng `min-height` đủ lớn, hoặc có biến thể compact điều chỉnh padding đồng bộ. Không giảm lại font toàn bộ để che vấn đề.

Mức tin cậy: **cao về mâu thuẫn CSS; chưa xác nhận pixel clipping thực tế**. Native form controls có cách vẽ riêng theo browser/OS; cần chụp select/input có giá trị trên iOS Safari và desktop trước khi nói chính xác mất bao nhiêu chữ.

## A6 · P2 · Khối “Các gói” không thích ứng chữ lớn ở 320px

- Source: [app/dich-vu/[id]/service-view.tsx:77](/Users/alexle/Documents/đẹp-radar/app/dich-vu/[id]/service-view.tsx:77), trọng tâm dòng 82–92.
- Bằng chứng runtime do phiên audit chính cung cấp: viewport 320px, document `scrollWidth = 332px`, nhãn gói bị dồn xuống từng từ trong [screenshots/04-detail-320.png](/Users/alexle/Documents/đẹp-radar/docs/audits/2026-10-11-post-refresh/screenshots/04-detail-320.png).
- Component là danh sách flex hai cột, không phải HTML table. Cột giá `shrink-0` chứa cả ba mức giá trên một dòng; cột tên bị ép. Outer card giữ `p-5`, khoảng cách hai cột giữ `gap-3`, không đổi sang bố cục một cột ở màn hình hẹp.
- Đối chiếu `dc07161`: cấu trúc flex, `shrink-0`, `p-5`, `gap-3` đã tồn tại. Refresh thay chữ hàng từ `text-[14px]` sang `text-body` 16px; dãy ba giá từ `text-[12px]` sang `text-label` 14px. Nhu cầu chiều rộng của cột giá tăng nhưng responsive layout không được sửa tương ứng.
- Phân loại lịch sử: **layout mong manh tồn tại trước; typography migration làm tăng áp lực chiều rộng và bản hiện tại có lỗi runtime xác nhận**. Không có runtime baseline 320px trong phân công này, nên chưa đủ bằng chứng để khẳng định baseline hoàn toàn không tràn hoặc rằng toàn bộ 12px overflow do riêng commit refresh.
- Đề xuất: ở màn hình hẹp tách tên/thời lượng và giá thành hai hàng, cho ba mức giá wrap thành chip hoặc dòng riêng; giữ khả năng so sánh giá và chữ ít nhất 14–16px. Kiểm tra mọi variant có giá dài, nhãn dài, per-person và 320/360/390px.

## Những điều không kết luận thành lỗi

- Không kết luận CategoryTiles mất toàn bộ Tab stop khi thu gọn: `pinPriority` giữ lựa chọn hiện hành trong hàng đầu, nên suy đoán đó đã được loại bỏ.
- Không coi chữ nhỏ, thiếu ảnh portfolio hoặc danh sách trống trong fixture là bằng chứng dữ liệu production lỗi.
- Không coi mọi control dưới 44px là tự động vi phạm WCAG AA 2.5.8; 44px là mục tiêu usability nội bộ khác với ngưỡng/ngoại lệ của tiêu chí đó.
- Báo cáo này không chứng minh mức đáp ứng WCAG tổng thể; chưa kiểm thử screen reader, authenticated workflow, browser zoom và nhiều browser bằng runtime.
