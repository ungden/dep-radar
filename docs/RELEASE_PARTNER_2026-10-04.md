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

## Thiết lập store và sự cố build

Chủ sản phẩm đã duyệt tạo app Google Play và một build Android + một build iOS với trần tổng phí 3 USD. Apple dùng `sai211dn@gmail.com`, team `Q8A7CBYV5Z`, tổ chức TITAN INTERNATIONAL TRADING SERVICE COMPANY LIMITED; Google Play dùng `alexle@titanlabs.vn`, developer `8409379285366511764`.

- Đã đăng ký Apple App ID `vn.dep360.app`, bật Push Notifications và Sign In with Apple; đã chuẩn bị chứng chỉ phân phối, provisioning và APNs qua EAS.
- [App Store Connect 360dep](https://appstoreconnect.apple.com/apps/6819003877/distribution/ios/version/inflight): app ID `6819003877`, phiên bản `1.0.0`, Prepare for Submission. Đã lưu mô tả tiếng Việt, từ khóa, URL hỗ trợ/marketing, subtitle, category Lifestyle, URL chính sách `https://www.360dep.vn/quy-che` và chọn phát hành thủ công. Chưa gửi App Review.
- [Google Play 360dep](https://play.google.com/console/u/5/developers/8409379285366511764/app/4975443642828814542/app-dashboard): app ID `4975443642828814542`, ngôn ngữ tiếng Việt, miễn phí. Đã lưu URL chính sách `https://www.360dep.vn/quy-che`. Chưa có release hoặc artifact được upload.

Hai build đầu đã chạy rồi hủy vì biến EAS bị lấy nhầm từ `.env.local` root (backend QA `127.0.0.1`): Android `688815dd-5d7b-4cb0-9655-263353b0150b` (versionCode 2), iOS `22d7d64e-86eb-4af8-9284-01e2b6dc9ae7` (build 1). Không được dùng hoặc submit hai build này. Remote version đã tăng; build sau phải tiếp tục tăng, không reset.

Đã sửa hai biến công khai trong cả ba môi trường EAS từ Supabase project production `ohjrocksurzkypcbfkha`; API production trả đủ 72 dịch vụ. Đọc lại bằng EAS CLI xác nhận URL và anon key production khớp chính xác cấu hình đã xác minh. `app.config.js` kiểm tra profile production, URL, khóa công khai và role/project ref của anon JWT. Kiểm tra qua Expo config thực tế đạt: production hợp lệ được chấp nhận; backend local, khóa thiếu, khóa private/service-role hoặc JWT dự án khác bị từ chối; định danh app và cấu hình development giữ nguyên. Mobile lint đạt.

Credit build EAS của tài khoản đã dùng hết; worker medium Android giá 1 USD, iOS giá 2 USD. Theo [quy định tính phí Expo](https://docs.expo.dev/billing/usage-based-pricing/), chỉ build hủy trước khi bắt đầu xử lý mới không tính phí; số liệu có thể trễ 24 giờ. Hai build cũ có thể vẫn tính tổng 3 USD. Build lại chờ duyệt tăng trần tổng lên 6 USD, thêm tối đa 3 USD. Không chạy build mới trước khi duyệt trần này.

Trước phát hành công khai còn cần: bật và kiểm tra Apple Auth trên backend (production hiện `external.apple: false`, Google `true`), kiểm thử flow đăng nhập/đặt lịch trên bản native thật, screenshot/store listing, khai báo quyền riêng tư và nội dung dựa trên hành vi thực tế, thông tin liên hệ/reviewer. Chưa có `expo-updates` hoặc OTA, chưa kiểm tra trên thiết bị thật. App trên store hiện chỉ là hồ sơ chuẩn bị phát hành.
