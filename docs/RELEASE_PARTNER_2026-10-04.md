# Bản phát hành chuẩn hóa đối tác — 04/10/2026

## Phạm vi đã hoàn thành

Commit triển khai: `06e1880`. Nguồn chung có 72 dịch vụ, 145 gói; mỗi gói có đúng ba mức giá do đối tác chọn. Web và app có tiến độ đăng ký sáu bước, lựa chọn dịch vụ, xác nhận giờ làm, gửi duyệt và điều kiện nhận job. Đơn giữ hợp đồng đã chốt, hỗ trợ các buổi có sẵn trong gói và buổi dặm.

- [Bảng giá đầy đủ](./BANG_GIA_2026-10.md)
- [Quy trình và quy tắc nghiệp vụ](./QUY_TRINH_DOI_TAC_2026-10.md)
- Migration: `supabase/migrations/20261006100001_standard_partner_catalog_flow.sql`

## Kết quả kiểm tra

Web build, typecheck/lint, 29 kiểm thử RLS local và bộ SQL nghiệp vụ đã đạt trong đợt triển khai. Ngày 04/10 chạy lại unit tests: 202 đạt; 29 RLS tests được bỏ qua trong lệnh unit, đã chạy riêng qua API local trước đó. Luồng web local đã hoàn tất từ tạo hồ sơ đến gửi duyệt và giữ nguyên mức Master khi mở lại.

Bundle iOS và Android đã xuất với cấu hình backend công khai của dự án, không chứa service-role key. Đây là bundle JavaScript và assets, không phải file cài đặt hoặc bản đã đưa lên store. Kết quả tại `/tmp/dep360-mobile-export-release`.

Build iOS Release cho Simulator arm64 đã đạt và app đã khởi chạy. Đã kiểm tra màn hình khám phá lấy dữ liệu công khai từ backend, mở Nail thiết kế và xác nhận ba mức giá của từng gói. Bằng chứng: [partner-three-prices-ios.png](./qa/partner-three-prices-ios.png). Chưa kiểm tra toàn bộ đăng ký/đặt lịch bằng tài khoản trên app hoặc thiết bị thật; luồng đăng ký đầy đủ đã kiểm tra trên web local.

CocoaPods lỗi encoding tại đường dẫn có dấu; build bằng bản sao `/tmp/dep360-native-workspace` đã giải quyết bước này. Simulator dùng cấu hình ký chuẩn Xcode `CODE_SIGNING_ALLOWED=YES`, `CODE_SIGN_IDENTITY=-`, `CODE_SIGNING_REQUIRED=NO` để có entitlement Keychain. Không cần chứng chỉ Apple thật cho bước này, không thay đổi dependencies hoặc cấu hình native của repository. Binary simulator local tại `/tmp/dep360-ios-release/360dep-xcode-signed.app`; binary này không cài lên iPhone thật hoặc gửi App Store.

## Production và phần còn lại

Sau xác nhận của chủ sản phẩm, đã áp dụng migration `20261006100001_standard_partner_catalog_flow.sql` trên Supabase `ohjrocksurzkypcbfkha`, rồi push `main` tại commit `3768e79`. CI [web](https://github.com/ungden/dep-radar/actions/runs/37197376431) và [database](https://github.com/ungden/dep-radar/actions/runs/37197376428) đều đạt; database CI chạy migration từ đầu, SQL nghiệp vụ và 29 RLS tests.

Kiểm tra trực tiếp database production: 72 dịch vụ dùng danh mục phiên bản 2, 145 gói và không có gói sai số lượng ba mức giá; 15 đơn đều có hợp đồng đã chốt; 7 hồ sơ công khai được giữ nguyên. `booking_sessions` bật RLS, không cấp đọc cho anon hoặc INSERT trực tiếp cho authenticated. Security advisors mức error không phát hiện lỗi. Cờ mở xác minh danh tính và demo không đổi.

Web đã lên [www.360dep.vn](https://www.360dep.vn), Vercel deployment `dpl_69hgUF4e938siQ7CrrGpYMzSRFy8` ở trạng thái Ready/production. Đã thao tác trang Nail và bảng giá hồ sơ đối tác trên live, xác nhận ba mức giá và mức đối tác đã chọn. [Ảnh production](./qa/partner-three-prices-production.png). Không tạo đơn hoặc tài khoản QA trên production. Truy vấn log error trong 10 phút kiểm tra không trả về bản ghi lỗi.

App `vn.dep360.app` đã liên kết [EAS @titanlabs/360dep](https://expo.dev/accounts/titanlabs/projects/360dep), project ID `68843a7f-0035-4213-b685-152a8d5f5afb`. Ba profile development/preview/production dùng môi trường tương ứng; mỗi môi trường có `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY` ở phạm vi project. Không gửi service-role key lên EAS. Đã kiểm tra Expo config và định danh iOS/Android.

Credit build EAS của tài khoản đã dùng hết; cloud build sẽ tính thêm phí. Đã hỏi chấp thuận tối đa 3 USD cho một build Android và một build iOS trên worker medium, cùng Apple Developer team và tài khoản Google Play đích. Chưa khởi chạy cloud build hoặc gửi store khi chưa có câu trả lời. Chưa có `expo-updates` hoặc OTA, chưa kiểm tra trên thiết bị thật. Liên kết EAS không đồng nghĩa app đã phát hành lên store.
