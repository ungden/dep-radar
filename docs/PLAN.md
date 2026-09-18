# dep360 — Audit A→Z & kế hoạch hoàn thiện

Ngày audit: 18/09/2026 · Phạm vi: toàn bộ branch `pivot/dep360-freelancer` + bản production `dep-radar.vercel.app`.
Góc nhìn: CEO sản phẩm + Giám đốc thiết kế. Tài liệu này chỉ là kế hoạch, chưa có dòng code nào được sửa.

---

## 1. Kết luận của CEO

**Hiện trạng thật:** dep360 đang là một *bản demo bấm được* rất đẹp, chưa phải sản phẩm. Luật chơi (danh mục chuẩn, khung giá, hoa hồng 15%, phí di chuyển/gấp, gọi xác nhận, xác minh CCCD) đã rõ và đúng hướng. Nhưng mọi thứ sống trong `localStorage` của một trình duyệt, chỉ có **một** freelancer thật sự thao tác được (`linh-pham`), và phần lớn lời hứa với người dùng (hoàn tiền, tự huỷ sau 2 giờ, đối soát tuần, báo giá sau 15–30 phút) chỉ là **chữ trên màn hình**.

**Rủi ro lớn nhất không phải kỹ thuật mà là niềm tin:** app bán "uy tín" nhưng đang hiển thị số liệu bịa (312 đánh giá, hiện 3), khoảng cách bịa cho khách chưa nhập địa chỉ, lịch bận bịa, nút "Liên hệ" gọi nhầm số cho mọi chuyên viên. Trước khi thêm tính năng phải **ngừng nói dối người dùng**.

**Luận điểm sản phẩm (giữ nguyên):** khách đặt thợ làm đẹp đến tận nhà, giá minh bạch theo danh mục chuẩn; dep360 không thu phí khách, sống bằng hoa hồng từ freelancer; freelancer tự nguyện xác minh để được ưu tiên.

**Ba quyết định chiến lược mình đề xuất (cần anh/chị chốt, xem mục 7):**

1. **Ra mắt hẹp:** 1 thành phố, 2–3 danh mục có tần suất lặp cao (đề xuất: Nail + Massage + Chăm sóc da). Makeup/cô dâu theo mùa, để đợt 2. Marketplace chết vì loãng, không chết vì thiếu danh mục.
2. **Thu hoa hồng bằng "ví freelancer trả trước"** thay vì giữ tiền hộ khách (escrow). Freelancer nạp ví qua chuyển khoản VietQR, mỗi job hoàn thành tự trừ 15%; ví âm thì tạm ngưng nhận job. Khách trả thẳng cho thợ (tiền mặt/chuyển khoản). Lý do: giữ tiền của bên thứ ba là hoạt động trung gian thanh toán cần giấy phép; đối soát công nợ tiền mặt hằng tuần gần như không thu được. Đây là mô hình các app giúp việc/gọi xe ở VN đang dùng. "Thanh toán online toàn bộ" chuyển sang giai đoạn sau, qua cổng có sẵn (payOS/VNPay) sau khi rà pháp lý.
3. **Đặt lịch trực tiếp là lõi; "Đăng yêu cầu – báo giá" là phụ.** Bảng báo giá cần nguồn cung dày mới sống. Giữ tính năng nhưng sửa lỗ hổng và không đặt lên trang chủ cho tới khi có đủ thợ.

---

## 2. Tóm tắt audit (những phát hiện quan trọng nhất)

### 2.1 Đang hỏng ngay trên production (P0)
| # | Vấn đề | Chỗ |
|---|---|---|
| 1 | `NEXT_PUBLIC_SITE_URL` chưa đặt trên Vercel → `robots.txt`, `sitemap.xml`, `metadataBase` đều trỏ `http://localhost:3000` | `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts` |
| 2 | `GEMINI_API_KEY` chưa có → xác minh danh tính trả 503 | `app/api/identity/route.ts` |
| 3 | Không có ảnh OG, không canonical → chia sẻ link ra thẻ trống | root metadata |
| 4 | `main` vẫn là sản phẩm cũ; dep360 nằm ở PR #2 chưa merge; production chạy branch phụ | GitHub/Vercel |
| 5 | Không test, không CI, không error boundary (`error.tsx`), 5 `<Suspense>` không fallback | toàn repo |
| 6 | `/api/identity` mở toang: không đăng nhập, không giới hạn gọi → ai cũng đốt được tiền Gemini và dùng làm dịch vụ so mặt miễn phí | `app/api/identity/route.ts` |
| 7 | `.env.local` còn `SUPABASE_SERVICE_ROLE_KEY` của dự án cũ (không code nào dùng) | cần xoay khoá và xoá |

### 2.2 Nói dối người dùng (P0 về niềm tin)
- Số đánh giá hiển thị (312) ≠ số đánh giá có thật (2–3) trên mọi thẻ và hồ sơ. `pro-profile.tsx`, `components/beauty.tsx`.
- Người mới vào đã có sẵn 2 mẫu "đã lưu" và 1 người "đang theo dõi"; "cách bạn ~X km" tính từ địa chỉ demo ở Thanh Xuân. `lib/store.tsx` seed, `distanceToCustomer`.
- Lịch bận sinh ngẫu nhiên từ mã ký tự; lịch của thợ và lịch khách thấy không khớp nhau. `takenSlots`.
- "Liên hệ" gọi cứng `tel:0968000111` cho mọi chuyên viên; `Pro` không có trường số điện thoại. `components/booking-card.tsx`, `app/bookings/[id]/page.tsx`.
- "Thanh toán online toàn bộ" chọn được, nút ghi "Thanh toán & gửi yêu cầu", nhưng không có bước thanh toán nào; thẻ job còn ghi "Đã TT online".
- 8/12 dòng menu Cá nhân và chuông thông báo (luôn có chấm đỏ) đều là ngõ cụt.
- Chính sách hứa: tự huỷ sau 2 giờ, hoàn 100%, đền 30% huỷ muộn, tạm ẩn hồ sơ khi thợ huỷ, đối soát tuần — **không có dòng logic nào** thực hiện.

### 2.3 Lỗ hổng nghiệp vụ (P0/P1)
- **Trùng lịch:** chỉ so đúng chuỗi giờ bắt đầu, bỏ qua thời lượng. Job 240 phút lúc 08:00 vẫn cho đặt 09:00. Không tính thời gian di chuyển giữa hai nhà khách.
- **`acceptOffer` đi tắt mọi luật:** tạo lịch "đã xác nhận" luôn, không kiểm tra trùng lịch, phạm vi, tạm nghỉ, không qua bước gọi xác nhận; còn ghi nhầm số điện thoại khách demo.
- **Không có máy trạng thái:** `setBookingStatus` cho chuyển bất kỳ → bất kỳ, ai cũng gọi được; thợ đánh dấu hoàn thành job tương lai được; huỷ không ghi ai huỷ, lúc nào, lý do gì.
- **Thiếu trạng thái:** hết hạn, đang làm, vắng mặt (no-show), đổi lịch.
- **Không có số lượng người** dù danh mục bán gói "Nhóm (giá mỗi người)" → nhóm 5 người bị tính tiền 1 người, khoá lịch 45 phút.
- **Hai công thức làm tròn "bạn nhận"** cho ra hai con số khác nhau (297k vs 298k với giá 350k).
- **Phí gấp là cuộc đua thời gian:** tính lại mỗi lần render, khách và thợ thấy hai tổng khác nhau.
- **Thợ không có cách huỷ job đã nhận, không đổi lịch được;** khách huỷ không hệ quả.
- **Freelancer thứ hai không tồn tại được:** mọi thao tác ghi vào hằng số `DEMO_PRO_ID`.
- **Xác minh do trình duyệt tự quyết:** sửa `localStorage` là có huy hiệu + cộng 0,35 điểm xếp hạng (yếu tố lớn nhất). Tên đối chiếu là tên tự gõ.
- **Tự đánh giá mình trong 2 cú bấm** nhờ nút đổi vai trò. `replyReview` không kiểm tra chủ sở hữu.
- Danh mục thiếu cả mảng doanh thu: cắt/nhuộm/uốn tóc, phun xăm mày, uốn mi, waxing, pedicure riêng. Dịch vụ "chỉ tại studio" đăng được bởi thợ không có studio → đặt lúc nào cũng lỗi.
- Địa lý: chỉ 23 quận, cùng quận cứng 2 km, khác tỉnh là cấm, không có địa chỉ thật/toạ độ.

### 2.4 Hành trình còn thiếu (P0/P1)
**Phía freelancer (nguồn cung hiện chưa tồn tại):** đăng ký & onboarding, sửa hồ sơ, tải ảnh tác phẩm/avatar, giờ làm việc & ngày nghỉ, lịch tuần/tháng, trang thu nhập – ví – sao kê, thông báo, chat, huỷ/đổi lịch, báo khách vắng mặt, khiếu nại.
**Phía khách:** sổ địa chỉ, thông báo, chat & gửi ảnh mẫu, đổi lịch, huỷ có lý do, đặt lại đúng nghĩa, đặt cho nhiều người, mã ưu đãi, hoá đơn, trung tâm hỗ trợ/báo cáo, an toàn (chia sẻ lịch hẹn, SOS), cài đặt tài khoản, xoá tài khoản.
**Vận hành:** không có trang quản trị nào (duyệt xác minh "chờ kiểm tra", khoá thợ, sửa danh mục/khung giá, xử lý khiếu nại, đối soát).

### 2.5 Thiết kế & trải nghiệm (góc nhìn Giám đốc thiết kế)
Nền tảng tốt: bảng màu hồng đất, thẻ bo tròn, tab dưới, mobile-first, font Be Vietnam Pro + Playfair. Vấn đề:
- **Tương phản trượt chuẩn AA ở token dùng khắp nơi:** chữ phụ `#948684` (3,2:1), nút chính trắng trên `#b5646d` (4,2:1), nhãn "Chờ xác nhận" (3,1:1), placeholder (2,6:1).
- **Thuật ngữ loạn:** "chuyên viên / freelancer / thợ làm đẹp tự do", "job / lịch hẹn / yêu cầu", "huỷ / hủy".
- **Không nhất quán:** 4 kiểu padding đầu trang, 3 độ rộng nội dung, 3 kiểu chọn thành phố, 2 biểu tượng cho "lưu" (tim/bookmark), 2 kiểu ngôi sao (vàng/đen), 2 hệ bóng đổ, bo góc 3 cỡ cho phần tử ngang hàng.
- **Chỉ có một breakpoint `md`;** màn 1920px vẫn là thẻ cỡ điện thoại; desktop không có footer; logo chỉ hiện ở trang chủ mobile.
- **Trạng thái rỗng/lỗi/tải:** toàn icon trong vòng tròn hồng, không toast, không thông báo cho trình đọc màn hình (`aria-live` = 0), tab/radiogroup khai báo ARIA nhưng không có bàn phím.
- 6 trang không có `<h1>`; nhãn tab dưới 10,5px; vùng chạm 32–36px.
- Không có dark mode (quyết định: **chưa làm** cho đợt ra mắt, chỉ đặt `theme-color` đúng).
- Luật phí đang là đoạn văn dày trong luồng đặt lịch thay vì dữ kiện quét nhanh.

### 2.6 Kỹ thuật
- 22/26 route là client component → dữ liệu mẫu + danh mục nằm trong bundle; chỉ 3/22 route có metadata riêng; không structured data; không trang đích "nail tại nhà Hà Nội".
- 10 font preload (Playfair 4 weight gần như không dùng) cạnh tranh với ảnh LCP.
- Store: `useApp()` trả cả state → mọi thẻ re-render mỗi lần bấm tim; action đồng bộ, không có khái niệm loading/lỗi → đổi sang backend phải sửa mọi chỗ gọi; đổi version là mất sạch dữ liệu; không đồng bộ giữa các tab; 15 dấu `!` có thể làm trắng trang.
- Múi giờ: server Vercel chạy UTC, mọi phép tính ngày dùng giờ máy → lệch 7 giờ quanh nửa đêm.
- Không analytics, không theo dõi lỗi, không security header, `eslint-config-next@16` lệch `next@15`.
- PWA: có manifest, **không có service worker**, không màn hình offline, không splash iOS.
- Điểm sáng: TypeScript strict không `any`; các hàm thuần (`lib/pricing`, `lib/geo`, `lib/trust`, `lib/catalog`) dễ test và tái dùng cho mobile; `docs/supabase-schema.sql` chất lượng cao nhưng chưa áp dụng và thiếu RPC, thiếu ràng buộc chống trùng lịch.

---

## 3. Nguyên tắc thực hiện

1. **Trung thực trước, tính năng sau.** Không hiển thị thứ gì hệ thống không thực hiện được.
2. **Server là nguồn sự thật** cho giá, phí, trạng thái lịch, xác minh, đánh giá. Trình duyệt chỉ hiển thị.
3. **Một nguồn luật chơi:** `POLICY`, danh mục, khung giá đọc từ database; code và SQL không chép tay hai nơi.
4. **Nguồn cung trước nguồn cầu:** làm xong đường vào cho freelancer rồi mới đẩy khách.
5. **Mỗi giai đoạn kết thúc bằng bản chạy được trên production** + checklist nghiệm thu.
6. Giữ nguyên ngôn ngữ thiết kế hiện tại; sửa hệ thống (token, thành phần) chứ không vẽ lại.

---

## 4. Lộ trình

> Ước lượng theo nhịp làm việc hiện tại (mình code, anh/chị duyệt). Tổng ~7–9 tuần tới bản ra mắt thật ở 1 thành phố.

### Giai đoạn 0 — Cầm máu & trung thực (2–3 ngày)
Mục tiêu: bản đang public không còn hỏng và không còn bịa.

**Hạ tầng**
- Đặt `NEXT_PUBLIC_SITE_URL`, `GEMINI_API_KEY` trên Vercel; thêm `lib/env.ts` kiểm tra biến môi trường, production thiếu là build fail.
- Merge PR #2 vào `main` (squash), đóng PR #1 cũ, xoá branch `codex/*`; đổi tên project Vercel/repo thành `dep360`; gắn domain (khi có).
- Xoay và xoá `SUPABASE_SERVICE_ROLE_KEY` cũ trong `.env.local`; dọn `supabase/.temp`.
- Thêm `app/error.tsx`, `app/global-error.tsx`, fallback cho 5 `<Suspense>`; `app/opengraph-image.tsx`; canonical; security headers trong `next.config.ts`; bỏ `output: "standalone"`.
- Khoá tạm `/api/identity`: giới hạn theo IP (Upstash/Vercel KV), kiểm tra origin, timeout 25s, `maxDuration`, phân biệt lỗi cấu hình với lỗi bận.
- CI GitHub Actions: `typecheck` + `lint` + `test`. Thêm Vitest và test cho `lib/pricing.ts`, `lib/geo.ts`, `lib/trust.ts`, `lib/catalog.ts` (đây là chỗ sai là mất tiền).
- Sửa `eslint-config-next` về đúng major; thêm luật cấm `!`.

**Ngừng bịa**
- Seed: bỏ mẫu đã lưu/đang theo dõi mặc định; khoảng cách chỉ hiện khi khách đã nhập địa chỉ.
- Số đánh giá = số đánh giá thật đang có (hoặc gắn nhãn "dữ liệu mẫu" toàn cục cho bản demo).
- Bỏ lịch bận ngẫu nhiên; bỏ `tel:` cứng (thêm `phone` vào `Pro`).
- Ẩn lựa chọn "Thanh toán online" và nhãn "Đã TT online" cho tới khi có thanh toán thật.
- Menu Cá nhân: bỏ các dòng chưa có chức năng; chuông thông báo ẩn cho tới Giai đoạn 3.
- Trang chính sách: chỉ giữ những điều hệ thống làm được; phần còn lại ghi "sắp áp dụng".
- Sửa 2 công thức làm tròn về một hàm duy nhất trong `lib/pricing.ts`.

**Thiết kế nhanh**
- Sửa token tương phản trong `app/globals.css`: `--color-muted` đậm hơn (~#7a6c6a), nút chính dùng `--color-rose-dark`, màu warning/success đậm hơn. Một thay đổi, cả app đạt AA.
- Thống nhất chính tả "huỷ"; bỏ 3 weight Playfair không dùng.

Nghiệm thu: Lighthouse a11y ≥ 95 trang chủ; chia sẻ link có ảnh; sitemap đúng domain; CI xanh; không còn con số bịa.

### Giai đoạn 1 — Nền móng backend (1,5–2 tuần)
Mục tiêu: dữ liệu thật, nhiều người dùng thật, luật chơi chạy ở server.

- **Supabase:** áp `docs/supabase-schema.sql` sau khi bổ sung: `ends_at` + ràng buộc `EXCLUDE` chống trùng lịch theo thợ; `quantity`; trạng thái `expired / in_progress / no_show`; `cancelled_by / cancelled_at / cancel_reason`; `pro.phone`; bảng `working_hours`, `days_off`, `addresses`, `notifications`, `threads/messages`, `reports`, `wallet_ledger`; bỏ khoá ngoại `(city, district)` cứng, chuyển sang toạ độ.
- **Đăng nhập OTP số điện thoại** (Supabase Auth + nhà cung cấp SMS VN hoặc Zalo ZNS); chuẩn hoá E.164; middleware chặn `/studio/*` ở server; vai trò khách/thợ là hai hồ sơ của một tài khoản, cấm một tài khoản là hai bên của cùng lịch hẹn.
- **RPC máy trạng thái** (security definer): `create_booking`, `confirm`, `decline`, `start`, `complete`, `cancel`, `reschedule`, `mark_no_show`, `send_offer`, `accept_offer` — mọi kiểm tra trong `createBooking` hiện tại chuyển vào đây, `accept_offer` đi chung đường kiểm tra và **về trạng thái "chờ thợ gọi xác nhận"**, không xác nhận thẳng.
- **Báo giá chụp tại server** lúc tạo lịch/gửi offer (giá, km, phí gấp, hoa hồng) và không tính lại.
- **Cron** (pg_cron/Edge Function): tự hết hạn lịch chờ quá 2 giờ (hoặc trước giờ hẹn), hết hạn yêu cầu quá ngày, nhắc lịch T-24h/T-2h, cập nhật số job/điểm của thợ mỗi đêm.
- **Lớp truy cập dữ liệu** `lib/api/*` bất đồng bộ; store client chỉ còn cache + trạng thái UI; thêm khái niệm loading/lỗi/toast; selector để hết re-render toàn cục. Seed demo tách ra `supabase/seed.sql`.
- **Múi giờ:** mọi thời điểm là `timestamptz`, hiển thị theo `Asia/Ho_Chi_Minh`.
- **Xác minh do server sở hữu:** `/api/identity` yêu cầu đăng nhập, giới hạn 3 lần/ngày/tài khoản, ghi `identity_checks` (kết quả + thời điểm đồng ý, không lưu ảnh), lưu băm số CCCD để chặn một thẻ xác minh nhiều tài khoản; tên đối chiếu với tên trên thẻ rồi **khoá tên hiển thị** theo thẻ; ca "chờ kiểm tra" vào hàng đợi admin.
- **Storage:** bucket avatar, tác phẩm, ảnh đánh giá, bằng chứng khiếu nại; nén + xoá EXIF (GPS nhà khách) phía server.
- **Admin tối thiểu** (`/admin`, vai trò riêng): hàng đợi xác minh, danh sách thợ (duyệt/khoá), lịch hẹn (can thiệp trạng thái), báo cáo vi phạm.
- Sentry + Vercel Analytics/PostHog với 2 phễu: khám phá→đặt lịch, đăng ký thợ→job đầu tiên.

Nghiệm thu: hai điện thoại khác nhau, một khách một thợ mới đăng ký, đi hết vòng đặt → gọi → nhận → hoàn thành → đánh giá; thử đặt trùng giờ bị database từ chối; sửa `localStorage` không đổi được huy hiệu.

### Giai đoạn 2 — Phía freelancer hoàn chỉnh (2 tuần)
Mục tiêu: một thợ thật tự đăng ký và vận hành được mà không cần ai hỗ trợ.

- **Onboarding 5 bước:** số điện thoại → chuyên môn & khu vực (ghim bản đồ + bán kính) → chọn dịch vụ từ danh mục & đặt giá → giờ làm việc → ảnh đại diện + ≥3 ảnh tác phẩm. Hồ sơ chỉ public khi đủ điều kiện tối thiểu; có thanh tiến độ hoàn thiện hồ sơ.
- **Sửa hồ sơ:** giới thiệu, điểm nổi bật, studio, bán kính, bật/tắt làm tại nhà, thêm chuyên môn.
- **Tác phẩm:** tải ảnh, gắn dịch vụ, sắp xếp, ảnh bìa; chính sách ảnh (cấm ảnh lấy trên mạng, có nút báo cáo).
- **Giờ làm việc & ngày nghỉ:** lịch tuần lặp lại, khoá giờ lẻ, chế độ nghỉ phép, đệm di chuyển giữa hai job, tối đa job/ngày. **Khung giờ khách thấy sinh từ dữ liệu này + thời lượng dịch vụ** (bỏ `TIME_SLOTS` cứng).
- **Lịch:** xem tuần/tháng, xem ngày đã qua, job hoàn thành vẫn hiện; nút chỉ đường; xuất lịch.
- **Vòng đời job:** gọi khách → nhận; bắt đầu → hoàn thành; **huỷ job đã nhận** (có lý do, tính vào tỉ lệ huỷ); đề xuất đổi giờ; **báo khách vắng mặt** (đền phí di chuyển theo chính sách).
- **Ví & thu nhập:** số dư ví, nạp qua VietQR (đối soát tự động bằng webhook SePay/Casso), sao kê từng job (giá – hoa hồng – phí di chuyển), ngưỡng ví âm tạm ngưng nhận job, báo cáo tuần/tháng. Tách rõ "tiền khách trả bạn" và "hoa hồng đã trừ".
- **Bảng việc:** chỉ thợ có đăng dịch vụ đó mới báo giá; giá không thấp hơn giá niêm yết của chính mình; offer có hạn; không rút offer đã được chọn (chuyển thành huỷ job).
- **Danh mục mở rộng** theo thành phố ra mắt: cắt/nhuộm/uốn, phun mày, uốn mi, waxing, pedicure; chặn đăng dịch vụ "tại studio" khi chưa có studio; cho phép add-on và số lượng người.

Nghiệm thu: 5 thợ thật (tuyển tay) tự onboard không cần hướng dẫn; thời gian onboard trung vị < 10 phút.

### Giai đoạn 3 — Phía khách hoàn chỉnh (2 tuần)
- **Địa chỉ thật:** sổ địa chỉ (nhà, công ty…), ghim bản đồ + gợi ý địa chỉ (Goong/Google), ghi chú toà nhà/tầng; khoảng cách tính theo toạ độ → phí di chuyển đúng; xin quyền vị trí ở lần đầu.
- **Luồng đặt lịch v2:** số lượng người, add-on, chọn địa chỉ đã lưu, lịch theo tháng (cô dâu đặt trước nhiều tuần), giữ nguyên form khi phải đăng nhập giữa chừng, tick đồng ý chính sách huỷ, báo lý do khi nút bị khoá, gợi ý lối thoát khi ngoài phạm vi ("xem thợ gần hơn").
- **Sau khi đặt:** trạng thái theo dòng thời gian (đã gửi → thợ đã gọi → đã nhận → đang đến → hoàn thành); huỷ có lý do + hệ quả thật; đề xuất đổi lịch; "đặt lại" giữ đủ dịch vụ/địa chỉ/ghi chú; thêm vào lịch điện thoại; hoá đơn.
- **Chat trong lịch hẹn & trước khi đặt** (Supabase Realtime): gửi ảnh mẫu, câu trả lời nhanh; che số điện thoại cho tới khi job được nhận.
- **Thông báo:** trung tâm thông báo + Zalo ZNS (kênh chính) + Web Push; tuỳ chọn theo loại; chuông có số thật.
- **Đánh giá:** kèm ảnh, nhắc đánh giá sau job, biểu đồ sao từ dữ liệu thật, lọc "có ảnh", báo cáo đánh giá.
- **Khám phá:** tab "Dành cho bạn" dùng danh mục đã xem/đã đặt + khoảng cách; "mẫu tương tự từ thợ khác" theo `templateId`; lọc "rảnh hôm nay", sắp xếp theo khoảng cách/giá; sửa các lỗi bộ lọc trang tìm kiếm; hiện "lịch trống gần nhất" trên hồ sơ thợ.
- **An toàn & hỗ trợ:** trung tâm trợ giúp, báo cáo thợ/khách, chia sẻ lịch hẹn cho người thân, lọc "thợ nữ", quy trình khiếu nại có admin xử lý.
- **Tài khoản:** sửa tên/ảnh, đổi số (OTP), xoá tài khoản (Nghị định 13), đăng xuất xoá dữ liệu cục bộ.
- **Yêu cầu – báo giá:** đính kèm ảnh mẫu, số người, khung giờ linh hoạt; sửa/xoá yêu cầu; thông báo cho thợ bị loại.

Nghiệm thu: test với 10 người dùng thật, ≥8 người tự đặt xong lịch không cần hỏi.

### Giai đoạn 4 — Hệ thống thiết kế & SEO (1 tuần, chạy song song từ Giai đoạn 2)
- **Bảng thuật ngữ** và áp toàn app: "chuyên viên" (với khách), "lịch hẹn" (với khách) / "job" (chỉ trong Studio), "yêu cầu", "huỷ".
- **Token & thành phần:** một thang bo góc (12/16/20), một hệ bóng ấm, một kiểu ngôi sao, một biểu tượng lưu (tim), bộ icon danh mục riêng; `PageShell` chuẩn hoá padding/độ rộng/tiêu đề `h1`; `CityPicker`, `AddressFields` dùng chung; toast + `aria-live`; Tabs/Radiogroup có bàn phím; vùng chạm ≥ 44px; nhãn tab ≥ 11,5px; `aria-current` cho điều hướng.
- **Breakpoint `lg`/`xl`:** lưới 5–6 cột, hồ sơ 2 cột rộng, footer desktop (chính sách, hỗ trợ, tuyển thợ), logo trên mọi màn.
- **Trạng thái rỗng bằng ảnh thật/minh hoạ**, skeleton có nhịp, chuyển trang nhẹ, phản hồi lạc quan khi lưu/theo dõi; `blurDataURL` cho ảnh.
- **Phí & chính sách thành dữ kiện quét nhanh** (chip, dòng giá) thay cho đoạn văn.
- **Banner tuyển thợ** tách khỏi feed khách thành trang `/tro-thanh-chuyen-vien` riêng (giá trị, thu nhập mẫu, câu hỏi thường gặp).
- **SEO:** mọi trang danh sách thành server component có metadata riêng; trang đích `/{thanh-pho}/{danh-muc}` và theo quận; JSON-LD (`Person/BeautySalon`, `Service`, `AggregateRating`, `BreadcrumbList`, `FAQPage`); `lastModified` trong sitemap; `noindex` cho tìm kiếm có tham số; chuyển `/chinh-sach` thành `/chinh-sach`.
- Dark mode: **để sau ra mắt**; hiện chỉ đặt `theme-color` đúng.

### Giai đoạn 5 — Vận hành, tăng trưởng, ứng dụng (liên tục sau ra mắt)
- Admin đầy đủ: sửa danh mục/khung giá/chính sách phí có ngày hiệu lực, đối soát ví, xử lý khiếu nại có nhật ký, bảng chỉ số.
- PWA đúng nghĩa: service worker + trang offline, `app/manifest.ts` có `id`, shortcuts, screenshots, splash iOS, lời mời cài đặt.
- Thanh toán online toàn bộ qua cổng (payOS/VNPay/MoMo) sau khi rà pháp lý; hoàn tiền; hoá đơn điện tử.
- Ưu đãi, giới thiệu bạn bè, gói liệu trình nhiều buổi, lịch định kỳ.
- Chỉ số thợ (tỉ lệ nhận, huỷ, đúng giờ) quay lại xếp hạng khi đã có dữ liệu thật.
- Đóng gói Capacitor lên App Store/Play (tách `lib/*` thuần thành `packages/core`; chuyển `/api/identity` thành endpoint tuyệt đối; khai báo quyền riêng tư cho CCCD + khuôn mặt).

---

## 5. Những thứ chủ động KHÔNG làm trước ra mắt
Dark mode · đa ngôn ngữ · hệ thống hạng/tier · đánh giá nhiều tiêu chí · eKYC bên thứ ba · giữ tiền hộ (escrow) · bản native riêng · CRM cho thợ · khuyến mãi phức tạp · mở nhiều thành phố.

## 6. Chỉ số theo dõi
- **Ngôi sao Bắc Đẩu:** số lịch hẹn hoàn thành/tuần.
- Nguồn cung: thợ kích hoạt (đủ hồ sơ + giờ làm + ≥1 dịch vụ), % đã xác minh, thời gian phản hồi trung vị, tỉ lệ nhận job.
- Nguồn cầu: tỉ lệ xem hồ sơ → bắt đầu đặt → gửi đặt → được nhận → hoàn thành; tỉ lệ đặt lại trong 30 ngày.
- Chất lượng: điểm trung bình, tỉ lệ huỷ mỗi bên, tỉ lệ khiếu nại, tỉ lệ ví âm quá hạn.
- Kinh tế: giá trị đơn trung bình, hoa hồng/tuần, chi phí Gemini + SMS/ZNS trên mỗi thợ mới.

## 7. Quyết định cần anh/chị chốt trước khi bắt đầu Giai đoạn 1
1. **Thành phố và danh mục ra mắt** (đề xuất: 1 thành phố; Nail + Massage + Chăm sóc da).
2. **Cách thu hoa hồng:** ví trả trước (đề xuất) hay vẫn muốn thu hộ online ngay từ đầu?
3. **Bảng "Đăng yêu cầu – báo giá":** giữ ở vị trí phụ (đề xuất) hay tắt hẳn cho tới khi đủ thợ?
4. **Kênh OTP/thông báo:** Zalo ZNS (cần đăng ký Zalo OA, rẻ, tỉ lệ đọc cao) hay SMS?
5. **Bản đồ/địa chỉ:** Goong (rẻ, dữ liệu VN) hay Google Maps?
6. **Domain:** đã có `dep360.vn` chưa? Pháp nhân đứng tên để đăng ký Zalo OA, cổng thanh toán, thông báo xử lý dữ liệu cá nhân (NĐ 13/2023).
7. **Dữ liệu mẫu:** bản public hiện tại tiếp tục là demo có gắn nhãn, hay ẩn cho tới khi có thợ thật?

## 8. Cách nghiệm thu mỗi giai đoạn
- CI xanh (typecheck, lint, unit test cho luật giá/phí/xếp hạng, test RPC trạng thái).
- Kịch bản end-to-end bằng Playwright trên mobile viewport: khách đặt lịch, thợ nhận, hoàn thành, đánh giá; huỷ sớm/huỷ muộn; trùng lịch; ngoài phạm vi; đặt gấp.
- Kiểm tra tay trên 2 thiết bị thật (iOS Safari, Android Chrome) + chụp màn hình từng luồng.
- Smoke test production sau mỗi deploy: các route chính 200, sitemap/robots đúng domain, `/api/identity` từ chối khi chưa đăng nhập.
- Lighthouse: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95 trên trang chủ và hồ sơ thợ.

---

## 9. Nhật ký thực hiện

### ✅ Giai đoạn 0 — xong, đã lên production (18/09/2026)

Đã merge PR #2 vào `main` (squash), đóng PR #1, xoá branch `codex/*`. Production chạy từ `main`.

- `NEXT_PUBLIC_SITE_URL` đã đặt trên Vercel (production + preview); xoá 3 biến Supabase cũ không còn code nào dùng.
- `lib/env.ts`, `app/error.tsx`, `app/global-error.tsx`, `PageSkeleton` cho 5 `<Suspense>`, `app/opengraph-image.tsx`, canonical, security header, bỏ `output: "standalone"`.
- `/api/identity`: giới hạn theo IP, kiểm tra origin, timeout 25s, `maxDuration`, phân biệt lỗi cấu hình với lỗi bận.
- Ngừng bịa: điểm đánh giá suy ra từ đánh giá thật, bỏ mẫu đã lưu/đang theo dõi mặc định, bỏ lịch bận ngẫu nhiên, `phone` thật cho từng chuyên viên, thanh toán online hiện rõ là "sắp có", menu Cá nhân chỉ còn đường dẫn có thật, `/chinh-sach` ghi rõ điều gì chưa áp dụng, một hàm làm tròn hoa hồng duy nhất.
- Token màu đạt WCAG AA, tôn trọng `prefers-reduced-motion`, có skip link.
- Vitest 28 test + GitHub Actions (typecheck, lint, test, build).

Kiểm chứng trên production: các route chính 200, `/nope` 404, `robots.txt` và `sitemap.xml` đúng domain, thẻ OG có ảnh, security header có đủ, `/api/identity` trả `no-store` + `noindex`.

### 🔄 Giai đoạn 1 — nền móng backend: đã xong phần server, còn phần giao diện

**Đã xong**

- **Database** (dự án Supabase `ohjrocksurzkypcbfkha`, 8 migration đã áp dụng): danh mục + khung giá + chính sách phí là *dữ liệu*, sinh từ `lib/catalog.ts` bằng `scripts/gen-catalog-sql.ts` nên giá trên giao diện và giá database bắt buộc giống nhau. Có `working_hours`, `days_off`, `addresses` (kèm toạ độ), `wallet_entries`, `threads/messages`, `notifications`, `reports`. Lịch hẹn lưu **ảnh chụp báo giá**, có đệm di chuyển và ràng buộc `EXCLUDE` — trùng lịch là *không thể*, không phải *khó xảy ra*.
- **Luật ở server**: `build_quote` / `travel_fee` / `commission_for` khớp từng đồng với `lib/pricing.ts`. `availability_problem()` là câu trả lời duy nhất cho "vì sao không đặt được", `free_slots()` sinh khung giờ từ giờ làm việc của chính chuyên viên (không còn danh sách giờ cứng). Máy trạng thái đầy đủ qua RPC security definer; `accept_offer` đi chung đường kiểm tra và **về trạng thái chờ gọi xác nhận**. Hoàn thành job trừ hoa hồng một lần qua sổ ví.
- **Cron**: tự hết hạn lịch không ai nhận (và trả lại khung giờ), hết hạn yêu cầu/báo giá, nhắc T-24h và T-2h, tính lại chỉ số mỗi đêm, ví âm quá hạn thì ngưng nhận job.
- **Khoá**: RLS toàn bộ; địa chỉ là dữ liệu riêng tư; chỉ số, xác minh và tạm khoá không do chuyên viên tự ghi; hồ sơ chỉ public khi có dịch vụ + giờ làm + ảnh.
  *Lỗ hổng đã bít:* Postgres cấp `EXECUTE` cho `PUBLIC` với mọi hàm mới, nên các hàm bảo trì từng gọi được bằng anon key — riêng `enforce_wallet_threshold()` đủ để ngưng nhận job của **toàn bộ** chuyên viên. Đã revoke từ `PUBLIC` rồi cấp lại đúng vai, có test cho từng cửa.
- **Xác minh do server sở hữu**: `/api/identity` yêu cầu đăng nhập, giới hạn 3 lần/24h/tài khoản, ghi `identity_checks`, tự ghi trạng thái và khoá tên hiển thị theo tên trên thẻ. Sửa localStorage không còn ra huy hiệu. Số CCCD chỉ lưu dạng băm có salt để chặn một thẻ xác minh nhiều tài khoản. Không lưu ảnh.
- **Đăng nhập bằng số điện thoại**: OTP thật khi có nhà cung cấp SMS; chưa có thì nói thẳng là chưa gửi SMS. Một số điện thoại là một tài khoản (chuẩn hoá E.164). `becomePro()` tạo hồ sơ chuyên viên có slug riêng — **chuyên viên thứ hai đã tồn tại được**.
- **Lớp truy cập dữ liệu** `lib/api/*` bất đồng bộ, mọi ghi đi qua RPC và trả về kết quả thay vì ném lỗi. Khách chỉ thấy số điện thoại chuyên viên sau khi job được nhận.
- **Kiểm thử**: `supabase/tests/rules.sql` (phí, khung giá, sinh khung giờ, cả máy trạng thái, trùng lịch, tự đặt cho mình, hết hạn, các guard) + `tests/rls.integration.test.ts` (12 test RLS qua đúng API với JWT thật). Workflow `Database` chạy cả hai.

**Còn lại của Giai đoạn 1**

- Chuyển 25 màn hình từ store trong trình duyệt sang `lib/api/*`. Đây là phần việc lớn nhất còn lại: dữ liệu mẫu đang nằm trong hằng số `lib/data.ts` và màn hình import trực tiếp `getPro`/`WORKS`/`PROS`.
- Bật biến Supabase trên Vercel **sau khi** chuyển xong giao diện. Hiện chưa bật là có chủ ý: bật sớm thì middleware sẽ chặn `/bookings` và đẩy sang `/login`, mà `/login` của bản demo không tạo phiên Supabase → vòng lặp chuyển trang.
- Cron job (pg_cron) gọi các hàm bảo trì; hiện hàm đã có nhưng chưa có lịch chạy.
- Storage bucket cho avatar / tác phẩm / ảnh đánh giá (nén + xoá EXIF phía server).
- `/admin` tối thiểu: hàng đợi xác minh, danh sách chuyên viên, can thiệp lịch hẹn, báo cáo vi phạm.
- Sentry + analytics với 2 phễu.

**Cần anh/chị làm (mình không làm được)**

1. `GEMINI_API_KEY` trên Vercel — thiếu thì xác minh danh tính trả 503.
2. Nhà cung cấp SMS/ZNS cho OTP thật (quyết định số 4 ở mục 7). Chưa có thì đăng nhập vẫn chạy nhưng không có mã xác thực.
3. Chốt 7 quyết định ở mục 7, nhất là số 1 (thành phố + danh mục ra mắt) và số 2 (cách thu hoa hồng — schema đang làm theo hướng ví trả trước).
