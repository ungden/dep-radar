# Đối chiếu massageapp → 360đẹp

09/11/2026 · Đọc source, không chạy lại app/DB/test trong phần so sánh này. **Có code không đồng nghĩa đã deploy hoặc đã được kiểm chứng trên thiết bị.** Đây là bằng chứng cho [kế hoạch tổng thể](MASTER-PLAN.md).

- M: `/Users/alexle/Documents/massageapp`, `main@d795320`, khớp remote main.
- Đ: `/Users/alexle/Documents/đẹp-radar`, `feat/spa-venues@d308051`, khớp remote nhánh; main hiện ở `54ddfb5`.
- Các số dòng dưới đây theo source tại thời điểm đọc. Không dùng README cũ làm căn cứ duy nhất cho chức năng đang có.

## Khách hàng và nội dung

### C01 · Giữ lựa chọn — ưu tiên cao, cần thích nghi với giỏ và spa

M giữ template/variant/người/giá vào draft: [hồ sơ KTV](/Users/alexle/Documents/massageapp/apps/mobile/src/app/ktv/[id].tsx:109), [store và hydrate có phiên bản](/Users/alexle/Documents/massageapp/apps/mobile/src/massage/store.tsx:65).

Đ đã dựng giỏ từ template/variant, nhưng [booking luôn khởi đầu bước 1](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/book/[proId].tsx:63), [work mở booking chỉ với template](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/works/[id].tsx:67) và [mở hồ sơ thiếu ngữ cảnh](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/works/[id].tsx:112). Lỗi phải chọn lại đã có bằng chứng UI trong audit cùng phiên.

**Quyết định:** dùng booking intent chung, bổ sung variant/work và giỏ; revalidate khi phục hồi. Không copy đích gọi ngay: [M khởi tạo instant booking](/Users/alexle/Documents/massageapp/apps/mobile/src/app/dat-lich/xac-nhan.tsx:168).

### C02 · Review khách hiện ngay — đề xuất thay đổi policy có chủ đích

M vẫn yêu cầu lịch completed/cửa sổ gửi review, nhưng publish ngay và cập nhật rating: [migration mới](/Users/alexle/Documents/massageapp/supabase/migrations/20261108190000_customer_reviews_show_now.sql:19). Đ còn [đợi đánh giá hai phía](/Users/alexle/Documents/đẹp-radar/supabase/migrations/20260925100200_review_rules.sql:98), cùng [copy trên màn review](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/danh-gia/[bookingId].tsx:32).

**Quyết định:** đề xuất review khách hiện ngay sau kiểm tra nội dung tự động, có báo cáo/ẩn/phản hồi; nội dung bị gắn cờ xử lý riêng có thời hạn phản hồi. Không công khai dữ liệu đánh giá riêng của đối tác về khách. Cần migration xử lý review cũ đang chờ, recalculation rating và copy web/native khớp. Bỏ double-blind có rủi ro đánh giá ngược bị ảnh hưởng; spec cần quy tắc xử lý trả đũa và không tự phạt khách chỉ từ điểm đối tác. Học [lọc sao/phân trang/report](/Users/alexle/Documents/massageapp/apps/mobile/src/massage/public-reviews.tsx:18), thêm lọc ảnh/dịch vụ nếu có dữ liệu.

### C03 · Gallery nhiều ảnh — tận dụng kho tác phẩm đã có

M có [gallery hồ sơ](/Users/alexle/Documents/massageapp/apps/mobile/src/app/ktv/[id].tsx:318), [tối đa tám ảnh phụ, kiểm owner path và chống trùng](/Users/alexle/Documents/massageapp/supabase/migrations/20261109100000_pro_photos.sql:23). Đ đã có [pager ảnh/video tác phẩm](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/works/[id].tsx:88), [album theo ngành](/Users/alexle/Documents/đẹp-radar/lib/discovery.ts:56).

**Quyết định:** dùng lại works cho portfolio; ảnh nhận diện và không gian cơ sở có vai trò riêng. Không tạo một kho “gallery tác phẩm” mới cạnh works. Giữ quyền upload/reorder/delete và moderation; không port khóa avatar AI thành mặc định makeup.

### C04 · Lịch sử và đặt lại — có lợi, source vẫn cần nâng thêm

M [nhóm tháng/tổng chi](/Users/alexle/Documents/massageapp/apps/mobile/src/app/lich-su.tsx:31), [đặt lại từ lịch sử](/Users/alexle/Documents/massageapp/apps/mobile/src/massage/history-row.tsx:16). Đ hiện [Sắp tới/Đã qua](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/(tabs)/lich-hen.tsx:21) và [card mở chi tiết](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/components/booking-row.tsx:33).

**Quyết định:** đặt lại giữ chuyên viên và toàn bộ giỏ, không chỉ template/variant như nguồn; kiểm giá/lịch hiện tại. Tổng chi phải định nghĩa theo giao dịch/lịch hoàn thành, không cộng lịch hủy hoặc đếm cả đơn cha và con.

### C05 · Chat và vòng đời — phần lớn đã có

Đ có [API đổi lịch/hủy/no-show/khiếu nại](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/data/bookings.ts:280), cùng chat/ảnh/vị trí và chặn. M có [hành động nhanh và helpers chat](/Users/alexle/Documents/massageapp/apps/mobile/src/massage/chat.ts).

**Quyết định:** cải thiện timeline, hành động tiếp theo và khôi phục lỗi; không mô tả là xây mới chat/no-show. Giữ điều kiện mở chat khi đối tác nhận lịch.

### C06 · I18n và dịch — sau luồng chính

M [bảy ngôn ngữ và lựa chọn thủ công](/Users/alexle/Documents/massageapp/apps/mobile/src/i18n/index.tsx:28), [bản dịch/bản gốc](/Users/alexle/Documents/massageapp/apps/mobile/src/massage/translation-note.tsx:8), [kiểm quyền đọc chat trước dịch](/Users/alexle/Documents/massageapp/app/api/translate/route.ts:79).

**Điểm không copy nguyên:** rate limit bằng Map trong process ở [route](/Users/alexle/Documents/massageapp/app/api/translate/route.ts:31); prompt [gắn ngữ cảnh massage](/Users/alexle/Documents/massageapp/lib/ai/translate.ts:79). Cần giới hạn dùng chung/caching/chi phí, viết prompt phù hợp beauty và fallback bản gốc. Chuẩn bị VI/EN trước; không tự mở bảy ngôn ngữ hay dịch mọi nội dung.

### C07 · Discovery — có nền tốt ở Đ, cần nối đúng vào UI mới

Đ đã có [sort và Bayesian rating](/Users/alexle/Documents/đẹp-radar/lib/discovery.ts:66), [ranking/đa dạng hóa feed](/Users/alexle/Documents/đẹp-radar/lib/feed.ts:132). Home native hiện [lấy serviceOffers](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/(tabs)/index.tsx:39), [bù CatalogTile khi thiếu](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/(tabs)/index.tsx:84), [hai khối cơ chế đặt](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/(tabs)/index.tsx:126). Không giả định thuật toán feed đang chạy trên home chỉ vì tồn tại trong lib.

**Quyết định:** dùng lại phần phù hợp, kiểm đường gọi và tác động thực tế; chỉnh thứ bậc/mật độ theo ref. Sửa giá theo filter trước; không để ngân sách makeup dựa trên giá nail. Hành vi GPS [hỏi lần mở đầu của M](/Users/alexle/Documents/massageapp/apps/mobile/src/massage/nearby.tsx:48) không port vì Đ đã chủ động bỏ auto-prompt.

## Vận hành và nguồn cung

### O01 · Dashboard có tình huống cần xử lý

M có [dashboard tự tải lại/đơn trễ và đang chạy](/Users/alexle/Documents/massageapp/app/admin/page.tsx:23), [API live](/Users/alexle/Documents/massageapp/lib/api/admin-live.ts:13). Đ đã có [hàng chờ duyệt/xác minh/báo cáo/quá hạn/nợ phí](/Users/alexle/Documents/đẹp-radar/app/admin/desk-ops.tsx:59).

**Quyết định:** bổ sung chiều thời gian/trạng thái lên hệ thống hiện có. Makeup tại nhà và spa cần bộ bước khác nhau; không gắn “đang tới khách” cho lịch cơ sở.

### O02 · CRM và ghi chú CSKH

M [customer detail data](/Users/alexle/Documents/massageapp/lib/api/admin-desk.ts:554), [trang detail](/Users/alexle/Documents/massageapp/app/admin/khach/[id]/page.tsx:10), [notes](/Users/alexle/Documents/massageapp/app/admin/khach/[id]/notes.tsx:13). Đ đã có [thống kê khách và hành động quản trị](/Users/alexle/Documents/đẹp-radar/lib/api/admin.ts:742), [bảng khách](/Users/alexle/Documents/đẹp-radar/app/admin/desk-panels.tsx:100), chưa thấy trang hồ sơ/notes tương đương trong phần source được rà.

**Quyết định:** mở rộng thành detail có vấn đề đang xử lý, lịch hẹn, địa chỉ được phép đọc, ghi chú tác giả/thời gian; không đẩy thông tin khách vào feed công khai.

### O03 · Theo dõi lượt đặt, timeline và dữ liệu trước booking

M [tracking và nguyên nhân mất đơn](/Users/alexle/Documents/massageapp/lib/api/admin-tracking.ts:10), [lịch sử từng lượt](/Users/alexle/Documents/massageapp/app/admin/theo-doi/attempts.tsx:13), [booking events theo actor](/Users/alexle/Documents/massageapp/supabase/migrations/20261107105309_booking_tracking.sql:12).

**Quyết định:** mượn nhật ký trạng thái, bổ sung funnel trước tạo booking cho 360đẹp. Không gọi mọi lượt xem là booking attempt, không giả định migration nguồn đã ghi toàn bộ hành trình feed. Event retry/backfill phải phân biệt để không đếm đôi.

### O04 · Quyền support/admin và roster

M [ma trận staff](/Users/alexle/Documents/massageapp/lib/staff.ts:1), [notes RPC require_staff](/Users/alexle/Documents/massageapp/supabase/migrations/20261108220000_admin_customer_notes.sql:120); Đ [admin check theo is_admin](/Users/alexle/Documents/đẹp-radar/lib/api/admin.ts:105).

M [filter/sort roster trong URL](/Users/alexle/Documents/massageapp/app/admin/ktv/list-controls.tsx:10), [thông tin app và lần làm gần nhất](/Users/alexle/Documents/massageapp/lib/api/admin-desk.ts:429). Đ đã có [duyệt/gỡ/yêu cầu sửa/bật nhận lịch](/Users/alexle/Documents/đẹp-radar/app/admin/desk-pro.tsx:146).

**Quyết định:** hỗ trợ nghề/địa bàn/hồ sơ thiếu ảnh/hoạt động/appversion; không coi khóa/reset/duyệt là mới. Mọi quyền cần kiểm ở DB/API. CSKH không tự đổi tiền hoặc cấp quyền.

### O05 · Không dùng “hoạt động gần đây” thay cho “rảnh”

M [gửi app-open tối đa một lần/giờ](/Users/alexle/Documents/massageapp/apps/mobile/src/data/app-open.ts:14), trong khi [admin dùng cửa sổ 30 phút](/Users/alexle/Documents/massageapp/supabase/migrations/20261108170000_admin_now.sql:23).

**Quyết định:** đây là tín hiệu gần đúng cho vận hành, có timestamp; không copy nhãn online/free vào lời hứa với khách. Nhận lịch, slot và hoạt động app là ba khái niệm riêng.

### O06 · Tuyển đối tác, Studio và đặt hộ

M [mã mời/deep link](/Users/alexle/Documents/massageapp/lib/partner-apply.ts:1), [ứng tuyển có QR/store fallback](/Users/alexle/Documents/massageapp/app/ktv/ung-tuyen/page.tsx:24). Đ [landing đối tác](/Users/alexle/Documents/đẹp-radar/app/doi-tac/page.tsx:23), [onboarding sáu bước và nhánh spa](/Users/alexle/Documents/đẹp-radar/lib/partner.ts:6), [Studio có tab Đăng](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/studio/_layout.tsx:7).

**Quyết định:** giữ Studio/Đăng làm nguồn portfolio makeup; cải thiện deep link đúng loại đối tác/mã mời. [Đặt hộ của M](/Users/alexle/Documents/massageapp/app/admin/khach/[id]/book-for.tsx:17) chỉ đưa sau khi booking contract chuẩn, vẫn kiểm giá/slot/capacity và có actor/lý do.

### O07 · Referral, MCN và AI portrait

Đ đã có [referral voucher](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/data/referrals.ts:77) và [MCN](/Users/alexle/Documents/đẹp-radar/app/studio/network/network.tsx:28). M [affiliate tiền](/Users/alexle/Documents/massageapp/lib/affiliate-live.ts:8) là mô hình khác; không cộng thêm mặc định.

M [khóa avatar AI](/Users/alexle/Documents/massageapp/supabase/migrations/20261108210000_pro_avatar_lock.sql:15) không phù hợp để biến ảnh makeup thành bằng chứng tay nghề. Chỉ học quy trình quản lý ảnh/quyền/kiểm duyệt.

### O08 · Ưu đãi, thông báo theo nhóm và trợ giúp

M có [form ưu đãi với thời hạn/đơn tối thiểu](/Users/alexle/Documents/massageapp/app/admin/uu-dai/promos.tsx:23), [chọn nhóm người nhận và số lượng](/Users/alexle/Documents/massageapp/app/admin/thong-bao/form.tsx:36). Đ đã có referral/voucher và [trợ giúp/câu hỏi thiếu đáp án trong admin](/Users/alexle/Documents/đẹp-radar/app/admin/admin-desk.tsx:147).

**Quyết định:** ưu đãi/thông báo theo nhóm là backlog M4, phụ thuộc quyền staff, giới hạn gửi và ngân sách voucher; trợ giúp giữ nền hiện có. Đợt này không gửi thông báo hay tạo ưu đãi.

## Nền tảng và tài chính

### T01 · SePay — ưu tiên gia cố đường tiền đang có

Đ [parser bỏ thông tin tài khoản nhận](/Users/alexle/Documents/đẹp-radar/lib/payments/sepay.ts:47), [route trả success dù record_unmatched_transfer lỗi](/Users/alexle/Documents/đẹp-radar/app/api/payments/sepay/route.ts:55). Đây là rủi ro xác định từ code; chưa thử gây lỗi với tiền thật hoặc production.

M [RPC ghi toàn bộ giao dịch, kiểm tài khoản và chống trùng](/Users/alexle/Documents/massageapp/supabase/migrations/20261102051955_qr_sepay_booking_payments.sql:11), [route trả500 khi lưu không thành công](/Users/alexle/Documents/massageapp/app/api/payments/sepay/route.ts:51), [parser chặn id0/amount sai](/Users/alexle/Documents/massageapp/lib/payments/sepay.ts:92).

**Quyết định:** port nguyên tắc nguyên tử/idempotency/recipient validation; giữ DEP và tài khoản 360đẹp. Test retry đồng thời, sai tài khoản, unmatched lỗi, quyền service-role. Không mở customer QR ở cùng PR này.

### T02 · Vòng đời và tạo đơn không trùng khi retry

Đ [auto-complete confirmed/in_progress sau ends_at+24h](/Users/alexle/Documents/đẹp-radar/supabase/migrations/20260925100100_booking_finish.sql:75), [cart chỉ thêm checkstatus trước finish](/Users/alexle/Documents/đẹp-radar/supabase/migrations/20261106100000_service_cart.sql:39). M [guard dựa trên thực sự bắt đầu/hold](/Users/alexle/Documents/massageapp/supabase/migrations/20261025203836_service_lifecycle_guards.sql:18), [operation/payload dùng lại kết quả booking](/Users/alexle/Documents/massageapp/supabase/migrations/20261025202236_service_lifecycle_contracts.sql:276).

Đ [cart đã atomic, khóa và kiểm lại quote](/Users/alexle/Documents/đẹp-radar/supabase/migrations/20261106100000_service_cart.sql:271); chưa thấy operation ID bền vững tương đương cho tạo đơn trong phần source đối chiếu.

**Quyết định:** bổ sung idempotency theo operation/payload và vòng đời đúng makeup/cart/spa. Không dùng thao tác disable nút làm biện pháp duy nhất chống tạo trùng. Kiểm gói nhiều buổi/bàn giao ảnh, đơn cha/con và tranh chấp trước khi đổi auto-complete.

### T03 · Push logout, retry và nội dung lock screen

Đ [logout chỉ xóa local token, còn TODO server unregister](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/data/push.ts:87), [sender dùng notification title/body](/Users/alexle/Documents/đẹp-radar/supabase/migrations/20260924101000_push_tokens.sql:75).

M [unregister và đăng ký lại](/Users/alexle/Documents/massageapp/apps/mobile/src/data/push.ts:62), [outbox/ticket/receipt/retry](/Users/alexle/Documents/massageapp/supabase/migrations/20261025203512_service_lifecycle_delivery.sql:23), [copy push riêng](/Users/alexle/Documents/massageapp/supabase/migrations/20261029100000_p0_money_roles_push.sql:428).

**Quyết định:** tách token khỏi tài khoản khi logout/đổi tài khoản; có cách phục hồi khi offline. Không mặc định sao chép việc chặn logout vô hạn khi unregister lỗi. Receipt và outbox đưa vào độ tin cậy của vòng đời; lock screen không chứa chi tiết chat/địa chỉ nhạy cảm. Cần thiết bị thật.

### T04 · Cart/spa — bảo toàn phần phát triển riêng của Đ

Đ [giỏ và điều kiện dịch vụ](/Users/alexle/Documents/đẹp-radar/supabase/migrations/20261106100000_service_cart.sql:115), [spa kind/seat và chống trùng lịch](/Users/alexle/Documents/đẹp-radar/supabase/migrations/20261108100000_spa_venues.sql:68), [slot theo sức chứa cả khoảng thời gian](/Users/alexle/Documents/đẹp-radar/supabase/migrations/20261108100000_spa_venues.sql:170).

**Quyết định:** giữ engine này, gia cố/test chứ không thay bằng book_massage. Test giường cuối bị tranh, giảm beds khi đang có đơn, giỏ vượt giờ đóng, hủy giải phóng chỗ và không phí đi lại.

### T05 · Payout/refund — có quy trình tốt nhưng khác mô hình kinh doanh

M [snapshot tài khoản, người xử lý, trạng thái đối soát và registry mã chi](/Users/alexle/Documents/massageapp/supabase/migrations/20261102054840_ktv_payout_settlement_workflow.sql:5). Đây là quy trình chuyển tiền thủ công có ghi nhận, không phải tự gọi bank API chuyển tiền.

Đ [chính sách phí hiện tại](/Users/alexle/Documents/đẹp-radar/lib/pricing.ts:8) và MCN phải được giữ. **Quyết định:** mở rộng thu khách/đặt cọc/payout ở giai đoạn riêng, có mô hình tiền giữ/phí/hoàn/tranh chấp; không đưa account settings của nguồn sang.

### T06 · Native xác minh — mượn kỹ thuật upload, không tự bật policy

M [nén ảnh + multipart XHR và timeout](/Users/alexle/Documents/massageapp/apps/mobile/src/partner/identity.ts:39) khắc phục đường upload Expo. Đ [cờ IDENTITY_VERIFICATION_OPEN=false](/Users/alexle/Documents/đẹp-radar/lib/launch.ts:12), [native mở đường verify web](/Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/ho-so-doi-tac.tsx:197).

**Quyết định:** backlog cho khi chính sách mở xác minh; không bê ngưỡng đơn thứ tư hoặc bắt CCCD toàn bộ nghề trong đợt UI.

### T07 · Crash, OTA, attribution — bổ sung có chọn lọc

M [Sentry che dữ liệu và tắt nếu thiếu DSN](/Users/alexle/Documents/massageapp/apps/mobile/src/data/crash.ts:50), [OTA kiểm cấu hình bundle/runtime trước publish](/Users/alexle/Documents/massageapp/apps/mobile/scripts/ota.mjs:38). Đ [build guard đúng project](/Users/alexle/Documents/đẹp-radar/apps/mobile/app.config.js:4) đã có; package/config hiện chưa có Sentry và runtimeVersion tương đương M.

Cả hai dùng Expo57/RN0.86.3, Next15.5/React19; khác patch Expo và dependencies native. Có nền gần nhau nhưng không chứng minh có thể copy module nguyên trạng hoặc chỉ dùng OTA cho mọi thay đổi.

M [Meta Purchase khi booking được tạo](/Users/alexle/Documents/massageapp/apps/mobile/src/data/meta-events.ts:45), [TikTok tương tự](/Users/alexle/Documents/massageapp/apps/mobile/src/data/tiktok-events.ts:92). **Quyết định:** phân biệt BookingCreated/PaymentReceived/BookingCompleted trước khi tích hợp quảng cáo. SDK attribution/ATT không cần cho đợt UI đầu; không copy IDs, consent hoặc cấu hình store của Medi24h.

## Kiểm tra sau triển khai, không phải kết quả hiện tại

- Giữ các bộ `rules.sql`, `partner-flow.sql`, `mcn.sql`, RLS API, cart/spa/pricing của Đ. Mượn ca thử tiền/push/lifecycle của M theo domain đích.
- Migration mới tương thích dữ liệu hiện hữu và app cũ; không cherry-pick cả chuỗi SQL do các function/schema đã phân nhánh.
- QA thực tế native/web và thiết bị cho push/upload/deep link, giá/slot/concurrency; bằng chứng pass sẽ ghi riêng khi có implementation.
- Chưa áp migration, build, deploy, gửi lịch, gửi thông báo, gọi thanh toán hay thay cấu hình dịch vụ trong đợt lập plan.
