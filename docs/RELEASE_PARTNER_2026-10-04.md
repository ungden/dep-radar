# Bản phát hành chuẩn hóa đối tác — 04/10/2026

Trạng thái hiện tại 05/10: web/database đã triển khai; Apple 1.0.0(2) Prepare for Submission với sáu ảnh iPhone, App Privacy Published, SIWA key đã tạo. Google production 1.0.0(4) vẫn draft, IARC đã Completed; screenshot Android đang chờ image SDK tải xong. Chưa gửi review/phát hành. Các phần dưới ghi theo thời điểm; kết quả mới nhất ở cuối tài liệu.

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
- [App Store Connect 360dep](https://appstoreconnect.apple.com/apps/6819003877/distribution/ios/version/inflight): app ID `6819003877`, phiên bản `1.0.0`, Prepare for Submission. Đã lưu mô tả tiếng Việt, từ khóa, URL hỗ trợ/marketing, subtitle, category Lifestyle, URL chính sách `https://www.360dep.vn/quy-che` và đã đổi sang phát hành tự động sau App Review. Chưa gửi App Review.
- [Google Play 360dep](https://play.google.com/console/u/5/developers/8409379285366511764/app/4975443642828814542/app-dashboard): app ID `4975443642828814542`, ngôn ngữ tiếng Việt, miễn phí. Đã lưu URL chính sách `https://www.360dep.vn/quy-che`. AAB `1.0.0 (4)` đã được chấp nhận trong release internal; trạng thái xác nhận cuối ghi bên dưới.

Hai build đầu đã chạy rồi hủy vì biến EAS bị lấy nhầm từ `.env.local` root (backend QA `127.0.0.1`): Android `688815dd-5d7b-4cb0-9655-263353b0150b` (versionCode 2), iOS `22d7d64e-86eb-4af8-9284-01e2b6dc9ae7` (build 1). Không được dùng hoặc submit hai build này. Remote version đã tăng; build sau phải tiếp tục tăng, không reset.

Đã sửa hai biến công khai trong cả ba môi trường EAS từ Supabase project production `ohjrocksurzkypcbfkha`; API production trả đủ 72 dịch vụ. Đọc lại bằng EAS CLI xác nhận URL và anon key production khớp chính xác cấu hình đã xác minh. `app.config.js` kiểm tra profile production, URL, khóa công khai và role/project ref của anon JWT. Kiểm tra qua Expo config thực tế đạt: production hợp lệ được chấp nhận; backend local, khóa thiếu, khóa private/service-role hoặc JWT dự án khác bị từ chối; định danh app và cấu hình development giữ nguyên. Mobile lint đạt.

Credit build EAS của tài khoản đã dùng hết; worker medium Android giá 1 USD, iOS giá 2 USD. Theo [quy định tính phí Expo](https://docs.expo.dev/billing/usage-based-pricing/), chỉ build hủy trước khi bắt đầu xử lý mới không tính phí; số liệu có thể trễ 24 giờ. Hai build cũ có thể vẫn tính tổng 3 USD. Chủ sản phẩm đã duyệt tăng trần tổng lên 6 USD, thêm tối đa 3 USD, và đã chạy hai platform từ source `cca9a78be4642aea23db6db5b8679454d48c2fea` với môi trường production đã xác minh.

### Cloud build và bản thử nghiệm

- Android lần đầu sau sửa env: `283c0b7a-0690-4ed8-bdcb-47ce83ca727f`, versionCode 3, lỗi `CREDENTIALS_TEMPORARY_NETWORK_ERROR` của Expo. Lệnh CLI trả 503 nhưng build vẫn được tạo, nên đã kiểm tra danh sách build trước khi chạy lại. Trang build xác nhận rõ: “This build does not count towards your EAS Build usage.”
- Android chạy lại: [ac2868b0-a182-436b-b2dd-8e9df7251275](https://expo.dev/accounts/titanlabs/projects/360dep/builds/ac2868b0-a182-436b-b2dd-8e9df7251275), `1.0.0 (4)`, worker medium, đã FINISHED. AAB 80.105.536 bytes đã tải và kiểm tra JavaScript: chứa URL và public anon key production đã xác minh, không chứa URL Supabase local. Artifact tại `/tmp/dep360-release-android-4.aab`. Google Play đã upload/optimize và chấp nhận versionCode 4, Android API 24+, target SDK 36, dung lượng cài đặt ước tính 30,2 MB. Release internal `1.0.0 (4) - Thu nghiem doi tac` đã lưu ghi chú tiếng Việt.
- iOS: [492fdd23-5ef8-4de5-ad22-b17281557d49](https://expo.dev/accounts/titanlabs/projects/360dep/builds/492fdd23-5ef8-4de5-ad22-b17281557d49), `1.0.0 (2)`, đã FINISHED. IPA đã tải và kiểm tra: bundle ID/version/build đúng, JavaScript chứa URL và public anon key production đã xác minh, không chứa URL Supabase local; `ITSAppUsesNonExemptEncryption=false`. Artifact tại `/tmp/dep360-release-ios-2.ipa`.
- Đã dùng API key App Store Connect hiện có `NB8PJJU89Q` của team `Q8A7CBYV5Z`, gán cho 360dep qua EAS credentials, không tạo API key App Store Connect mới. [Submission ad99896c-c1a6-4bf3-a19e-a9b4363179b1](https://expo.dev/accounts/titanlabs/projects/360dep/submissions/ad99896c-c1a6-4bf3-a19e-a9b4363179b1) đã FINISHED; Apple trả processing `VALID`, internal `READY_FOR_BETA_TESTING`, external `READY_FOR_BETA_SUBMISSION`. TestFlight hiện build 2 “Ready to Submit”; chưa có nhóm/tester được gán.

Google Play internal testing chưa phát hành và dialog xác nhận cũ đã hủy. Sau yêu cầu của chủ sản phẩm, đã tạo và lưu draft production `1.0.0 (4)` bằng AAB có sẵn. Tài khoản tổ chức cho phép tạo production release trực tiếp; không cần internal testing hoặc gate closed testing của tài khoản cá nhân mới. Trạng thái vẫn Inactive/draft, chưa gửi review và chưa rollout. Sự cố auto-review timeout của dialog internal cũ không còn là bước cần tiếp tục.

Máy local hết dung lượng khi ghi status; đã xóa chỉ `node_modules`, `ios/Pods` và `ios/build` trong bản sao QA `/tmp/dep360-native-workspace/apps/mobile`, giữ mã nguồn và ảnh bằng chứng. Cloud build không phụ thuộc bản sao QA này.

CI của đúng source `cca9a78`: [web/mobile checks](https://github.com/ungden/dep-radar/actions/runs/37201098025) và [database](https://github.com/ungden/dep-radar/actions/runs/37201098030) đều SUCCESS.

Trước phát hành công khai còn cần: bật và kiểm tra Apple Auth trên backend (production hiện `external.apple: false`, Google `true`), kiểm thử flow đăng nhập/đặt lịch trên bản native thật, screenshot/store listing, khai báo quyền riêng tư và nội dung dựa trên hành vi thực tế, thông tin liên hệ/reviewer. Dashboard Apple provider đang cấu hình sai Client IDs bằng một email; chưa thay đổi. Đã chuẩn bị form khóa Sign in with Apple chỉ gắn `vn.dep360.app`, team TITAN, và hỏi duyệt tạo credential mới + Services ID `vn.dep360.web` + lưu client secret trên Supabase production. Cần cấu hình cả OAuth web: chỉ bật native sẽ khiến nút Apple trên web gọi OAuth chưa hợp lệ. Chưa có `expo-updates` hoặc OTA, chưa kiểm tra trên thiết bị thật. Chưa gửi public App Review hoặc Google Play production.

## Hoàn thiện hồ sơ store sau build

Apple đã lưu build 2 vào phiên bản 1.0.0, phát hành tự động khi được duyệt, hai screenshot iPhone native và liên hệ review theo thông tin chủ sản phẩm cung cấp. App miễn phí, base pricing Việt Nam; availability xác nhận chỉ Vietnam, Available on App Release. Trạng thái vẫn Prepare for Submission. Sign-in Required giữ bật; chưa có credential reviewer. Không gửi App Review.

Google production đã xác nhận Vietnam là quốc gia duy nhất (1 country / region, Inactive/draft). Google đã lưu listing tiếng Việt dạng draft với icon và feature graphic, category Beauty, liên hệ công ty, privacy URL, Ads No, Government apps No và Financial features “Rewards, points, frequent flier miles, and other incentives” theo voucher/referral thực tế. Dashboard ghi 5/11 bước thiết lập hoàn thành trước khi lưu Data safety draft. Data safety đã điền 14 loại dữ liệu và lưu dự thảo; mục Preview yêu cầu target age group trước khi Submit. Health, content rating, target audience, quyền truy cập reviewer và screenshot Android còn thiếu. Xem [bộ khai báo](./STORE_DECLARATIONS_2026-10-04.md).

Hai thao tác đã bị automatic approval review chặn: tạo khóa Sign in with Apple (credential/security-sensitive access mới) và lưu age rating/wellness (khai báo có hệ quả xét duyệt). Đã gửi câu hỏi cụ thể cho chủ sản phẩm; chưa nhận duyệt hai việc này. Không đổi credential hoặc đi đường khác để vượt chặn.

Read-only SQL production xác nhận 7/7 hồ sơ công khai là seed, 22 user seed, 19 tác phẩm và 15 đơn gắn seed. Không có khách ngoài seed đặt đơn với các hồ sơ đó và không có tài khoản seed được bảo vệ bởi identity thật. Native đang mô tả tác phẩm là thật dù web có demo notice. Đã đề xuất ẩn 7 hồ sơ và tắt nhận job, giữ dữ liệu nội bộ; chưa thực hiện vì cần chủ sản phẩm chốt mở marketplace trống hay giữ demo. Không chạy script xóa seed. Cần tuyển/duyệt đối tác thật và chốt ảnh store trước mở cho khách thật.

[Assets và ảnh trạng thái store](./store-assets/2026-10-04/README.md) đã lưu trong repository. Screenshot iOS không được dùng để khai báo UI Android. Máy hết dung lượng gây auto-review không khởi tạo được; đã xóa riêng cache DerivedData 360dep của lần build QA (2,1 GB), giữ app simulator và artifact cloud. Đã tắt riêng simulator 360dep Partner QA sau chụp ảnh; không đóng các simulator dự án khác. Không chạy build trả phí bổ sung.

Google có “Signed, universal APK” 117 MB tại Bundle Explorer, nhưng yêu cầu download hai lần không trả được file. Chưa cài/kiểm thử Android; không phát sinh build trả phí. AVD riêng `dep360_store_qa` được chuẩn bị dưới `/tmp/dep360-android-qa`, chưa khởi chạy. Chrome URL policy chặn mở `chrome://downloads/`; không đi đường khác để vượt chặn. Android screenshot chưa hoàn thành.

Đã sửa lỗi đuôi file screenshot: browser capture tạo JPEG nhưng ban đầu đặt `.png`. Apple đã thay bằng hai `.jpg`, hiện thumbnail đúng và không còn biểu tượng lỗi. File render Google trong repo cũng đổi đuôi đúng. Google chấp nhận ảnh theo bytes; hai ảnh listing load thành công (icon 512×512, feature preview 512×250), không cần thay upload đã hợp lệ.


## Bổ sung ảnh store — 2026-10-05

Theo yêu cầu tiếp tục và chụp/đăng đủ hình, đã bổ sung 4 screenshot iPhone native: bộ lọc, hồ sơ, chi tiết tác phẩm và bước chọn gói đặt lịch. App Store Connect hiện đủ 6/10 screenshot Vietnamese 6.5-inch; thumbnail đúng, tải lại vẫn đủ 6, Save disabled. Apple vẫn Prepare for Submission. [Bằng chứng](./store-assets/2026-10-04/local-proofs/dep360-apple-six-screenshots.jpg). Hai ảnh đầu giữ bản cũ; bản local đã thêm nhãn minh họa. Delete All bị automatic approval review từ chối do thiếu xác nhận ngay lúc xóa, đã Cancel và dùng phương án chỉ thêm 4 ảnh.

Apple session hết hạn đã đăng nhập lại đúng sai211dn bằng mật khẩu lưu trong Chrome; 2FA hoàn tất, tiếp tục được App Store Connect. Không lưu mật khẩu/OTP vào tài liệu. Kết nối Chrome DOM không khả dụng ở lượt này; thao tác store bằng CUA native Chrome.

Dữ liệu hồ sơ vẫn là seed. Màn hình chọn ngày giờ trên simulator tải kéo dài, chưa xác nhận booking E2E; không dùng ảnh spinner cho store. Bộ lọc thay ảnh danh sách tìm kiếm có trạng thái tải.

Đĩa xuống khoảng 116–190 MB nhiều lần; đã dọn riêng bản giải nén IPA, ba export JS tạm và node_modules root/mobile của 360dep (cài lại bằng npm ci), giữ IPA/AAB và source. Dung lượng có tăng lên khoảng 1,5 GB nhưng Android emulator vẫn FATAL hasSufficientDiskSpace; đã yêu cầu chủ máy giải phóng ít nhất 4 GB. Không chỉnh emulator dự án khác, không chạy thêm build trả phí. Google screenshot chưa hoàn thành.

User đã yêu cầu làm tiếp toàn bộ các việc còn thiếu. Chưa tạo key Sign in with Apple, chưa đổi khai báo age/wellness, chưa ẩn hồ sơ seed ở lượt bổ sung hình này. Các mục này cần tiếp tục theo bằng chứng nguồn và policy tại hành động; không coi yêu cầu làm tiếp là bằng chứng đã hoàn tất.

Đã hoàn tất Apple age rating: questionnaire khai UGC/social discovery/chat Yes, age assurance/parental controls/unrestricted web access/paid advertising No; medical treatment None, health/wellness Yes; nội dung mature/sexual/violence/chance-based None/No. Calculated 13+, override 18+ theo đối tượng người lớn. UI hiện 18+ (iOS trước 26 là 17+ theo quy đổi Apple). [Bằng chứng](./store-assets/2026-10-04/local-proofs/dep360-apple-age-18.jpg).

Đã chuẩn bị APK QA local từ AAB versionCode 4 bằng bundletool 1.18.1 + aapt2 vendor đã cài, debug-signed bằng debug keystore existing. SHA256 JS bundle khớp AAB đã upload; APK 116.823.523 bytes. Đây là artifact dùng chụp/QA, không upload hoặc thay binary store. Android emulator thử boot lần này SDK từ chối hasSufficientDiskSpace dù còn 1,5 GB; không bypass kiểm tra dung lượng.

Google listing thử Save as draft báo “Upload at least 2 phone or tablet screenshots”. Icon/feature render load đúng nhưng cần Android screenshots để lưu hợp lệ; giữ tab listing và chuyển khai báo qua tab dashboard riêng, không discard ảnh. Apple Content Rights form cần owner xác nhận quyền ảnh mẫu; đã hỏi vì chưa tìm được hồ sơ quyền sử dụng trong repo, chưa tick “I have the necessary rights”.

Kiểm tra read-only bổ sung: anon được EXECUTE free_slots; gọi REST production bằng public anon key trả HTTP 200 và 18 giờ trống cho nail-design/simple ngày 2026-10-06 trong khoảng 1,2 giây. Không tạo đơn. Điều này xác nhận API có trả dữ liệu; chưa xác định nguyên nhân native spinner và chưa xác nhận booking E2E.

Cập nhật dung lượng thực tế: khi đĩa tăng lên khoảng 4,8 GB, SDK vượt kiểm tra ban đầu nhưng từ chối tạo userdata, yêu cầu 7.372,8 MB. Đổi storage của riêng QA AVD từ mặc định 10 GB xuống 2 GB và bỏ SD card không làm giảm mức tối thiểu của image. Cần khoảng 8 GB trống; không tắt/bypass kiểm tra SDK.

Mac đã khóa màn hình, CUA yêu cầu chủ máy mở khóa thủ công; đã hỏi và dừng UI. Supabase sign-in bằng thông tin lưu trong Chrome đã khởi chạy, chưa xác nhận vào được Auth Users trước lúc khóa. Google Target audience yêu cầu Sign in details trước khi điền; còn cần tài khoản reviewer. Chưa tạo tài khoản hoặc nhập mật khẩu mới. Các ảnh bằng chứng native Chrome có thanh tab dự án khác được giữ riêng ở local-proofs (gitignored), không đưa lên repository công khai.

### Tiếp tục hồ sơ ngày 05/10

Mac đã mở khóa. Apple vẫn Prepare for Submission và giữ đủ sáu ảnh iPhone. Đã lưu danh sách và cấu hình đủ 14 loại App Privacy: mỗi loại App Functionality, linked to identity Yes, tracking No. Nút Publish đã bật; hộp cuối yêu cầu cam kết khai báo chính xác/tuân thủ và cập nhật nếu dữ liệu thay đổi. Đã hỏi xác nhận tại bước cam kết, chưa Publish. Content Rights vẫn cần chủ sản phẩm xác nhận quyền ảnh mẫu; không tự khẳng định có bản quyền.

Google Advertising ID đã lưu No; UI Change saved. Dump manifest AAB versionCode 4 bằng bundletool xác nhận không có permission AD_ID; source không có SDK quảng cáo. Google Health đã lưu Other với mô tả rõ marketplace chăm sóc da/tóc/cơ thể, massage, wellness trước/sau sinh từ đối tác, không có chẩn đoán/theo dõi sức khỏe/hồ sơ y tế. UI Change saved; không có yêu cầu vùng bổ sung. App content hiện còn bốn mục cần xử lý: Sign in details, Content ratings, Target audience and content, Data safety. Content ratings đã điền email công ty và All Other App Types, còn chờ xác nhận IARC Terms of Use trước questionnaire.

Chrome extension trở lại: profile Ưng Đen dùng tab nền cho store. Key Apple đã chọn đúng primary App ID Q8A7CBYV5Z.vn.dep360.app, Save Configure rồi Continue tới Register; chỉ Sign in with Apple, không APNs/DeviceCheck/quyền khác. Chưa Register; đã gửi xác nhận cụ thể cho key cùng Privacy/IARC. Supabase dashboard vẫn chưa vào được sau đăng nhập bằng thông tin đã lưu. Đã chuẩn bị form đăng ký reviewer trong Browser Codex ở phiên riêng, chỉ điền tên; chưa nhập email/mật khẩu hoặc submit. Chủ sản phẩm cần trực tiếp tạo credential mới, không gửi mật khẩu qua chat.

Dung lượng máy được giải phóng lên khoảng 49 GB, nhưng SDK /opt/homebrew/share/android-commandlinetools cũng không còn. APK QA/AAB/IPA được giữ nguyên. Đã tải commandlinetools từ URL Google chính thức, đối chiếu SHA256 với Homebrew metadata, giải nén trong /private/tmp/dep360-android-sdk. Cài emulator/platform-tools/Android 36 Google Play arm64 image đang dừng tại license android-sdk-arm-dbt-license (16/01/2019). Auto-review chặn trả lời y vì chưa được duyệt chấp nhận thỏa thuận cụ thể; đã hỏi xác nhận, không bypass hoặc chấp nhận gián tiếp. Chưa boot Android/cài APK/chụp/upload Android; không chạy build trả phí. Dung lượng cuối khoảng 46 GB.

Bằng chứng riêng local (gitignored): dep360-apple-privacy-publish-pending.jpg, dep360-play-ad-id-no.jpg, dep360-play-health-other.jpg, dep360-play-iarc-terms-pending.jpg, dep360-apple-siwa-register-pending.jpg, dep360-reviewer-signup-handoff.jpg trong docs/store-assets/2026-10-04/local-proofs. Chưa gửi review hay mở production rollout; chưa ẩn seed trước khi lấy đủ ảnh native minh họa Android.


### Kết quả sau xác nhận cụ thể SDK / IARC / Privacy / key — 05/10

Chủ sản phẩm đã xác nhận “Duyệt SDK, IARC, Privacy và key”. Apple App Privacy đã Publish cho 14 loại dữ liệu, UI xác nhận Published by Tien Duong Le. Key Sign in with Apple PS2HTF3J28 đã Register, chỉ primary App ID Q8A7CBYV5Z.vn.dep360.app; file .p8 đã tải, giữ ngoài repository với 0600. Không dùng ASC upload key cho SIWA. Services ID vn.dep360.web chưa tạo: automatic approval review chặn vì định danh web ngoài xác nhận key-only; đã hỏi duyệt riêng callback Supabase của 360dep. Supabase login/provider chưa hoàn tất; không nhập credential mới thay người dùng.

Google IARC Terms of Use đã được chấp nhận sau duyệt. Đã lưu questionnaire và Current ratings: Rest of world 12+, North America Teen, Brazil 12+, Germany USK 12+, PEGI Parental Guidance, Russia/Korea 12+. Khai report/block Yes, chat moderation No, current precise location No, digital goods No, cash-convertible rewards/NFT No: voucher dịch vụ và fee credit không phải tiền rút được. Target audience dự kiến 18+ là mục riêng.

SDK license android-sdk-arm-dbt-license và android-sdk-license đã được chấp nhận sau duyệt; emulator cài xong dưới /private/tmp/dep360-android-sdk, Android 36 Google Play arm64 image đang tải. AVD riêng dep360_store_qa cập nhật image path mới, không chỉnh emulator dự án khác. APK QA giữ nguyên JS khớp AAB 4; không chạy build trả phí.

Chưa gửi Apple App Review hoặc Google review. Reviewer cần chủ sản phẩm trực tiếp nhập/tạo credential mới trong form đã mở; Content Rights chưa xác nhận vì 34 ảnh seed không có chứng cứ nguồn/giấy phép trong repo hoặc PR gốc. Không suy ra quyền ảnh từ commit tác giả Claude. Việc ẩn 7 hồ sơ seed đã được duyệt, đang đợi hoàn thành ảnh Android minh họa.

Bằng chứng local gitignored: dep360-apple-privacy-published.jpg, dep360-apple-siwa-key-created.jpg, dep360-play-iarc-saved.jpg.


### Domain OAuth — kiểm tra live 05/10

Chủ sản phẩm đề xuất dep360.supabase.co. CLI vanity-subdomains get xác nhận project ohjrocksurzkypcbfkha đã có vanity active 360dep.supabase.co; check-availability xác nhận dep360 còn trống. Tổ chức Alex Le team trên Pro; tài liệu Supabase hiện coi vanity subdomain là miễn phí/experimental. Public authorize provider Google trên cả URL project-ref và 360dep đều redirect về https://360dep.supabase.co/auth/v1/callback.

Google Cloud project dep360-auth-2026, client 360dep Web, đã có callback project-ref và 360dep. Đã bổ sung https://dep360.supabase.co/auth/v1/callback, UI OAuth client saved và mở lại xác nhận đủ 3 callback. Không đổi client secret/scopes. Auto-review từ chối kích hoạt vanity mới vì đây là cutover auth production chưa xác nhận cụ thể; chưa kích hoạt/xóa domain cũ. Đã hỏi lựa chọn giữ 360dep và duyệt Services ID, hoặc duyệt cutover dep360 và Services ID với callback tương ứng. Apple Services ID vẫn form chuẩn bị, chưa Register.

Tham khảo live: https://supabase.com/docs/guides/platform/custom-domains và https://supabase.com/docs/guides/platform/manage-your-usage/custom-domains. Proof Google callback: local-proofs/dep360-google-vanity-callback-saved.jpg (gitignored).


### Android SDK/QA sau tải image — 05/10

SDK/image Android 36 Google Play arm64 đã cài thành công (emulator 37.2.12, platform-tools). Emulator dep360_store_qa boot và adb install APK QA trả Success; không thay AAB/IPA store và không chạy build trả phí. Renderer auto/software ban đầu lỗi display surface; SwiftShader/host đã boot nhưng UI không ổn định, System UI/Process system ANR và Bluetooth stack crash trong image.

Đã tạo launcher cục bộ /private/tmp/360dep Android QA.app chỉ chạy SDK Google có sẵn để CUA nhận cửa sổ (không sửa SDK binary/source app). CUA đọc được Home/appdrawer và icon 360dep; chưa xác nhận app 360dep mở thành công hoặc native Android flows. Screenshot Android chưa chụp/upload, không dùng ảnh boot/ANR làm store screenshot. Bằng chứng local-proofs/dep360-android-system-anr.jpg.

Đã tắt riêng iOS Simulator 360dep Partner QA sau khi xác nhận đúng UDID để giảm tải; sau chẩn đoán cũng dừng emulator Android QA bị ANR, giữ toàn bộ SDK/APK/AVD. Không dừng simulator/emulator hoặc tiến trình của dự án khác. Cần phiên Android ổn định để tiếp tục 6 ảnh. Quyền ảnh/reviewer/Services ID và cutover domain còn chờ xác nhận hoặc thao tác người dùng.
