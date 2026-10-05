# Bộ khai báo store cho 360dep 1.0.0

Trạng thái cập nhật 05/10: chưa gửi App Review hoặc Google review. Apple đã lưu age rating 18+ và đủ thiết lập App Privacy cho 14 loại dữ liệu; Publish đang chờ xác nhận cam kết tại hộp thoại cuối. Google đã lưu Advertising ID = No và Health = Other; còn bốn khai báo cần xử lý. Source binary: `cca9a78be4642aea23db6db5b8679454d48c2fea`. Apple build 2, Android versionCode 4. Google Play đã mở tạo production release trên tài khoản tổ chức; internal testing không phải điều kiện bắt buộc của tài khoản này.

## Apple age rating

- Parental Controls: No; Age Assurance: No. Chưa có API xác nhận tuổi áp dụng cho toàn bộ người dùng.
- Unrestricted Web Access: No. App chỉ mở các liên kết chức năng, không có trình duyệt nhập URL tự do.
- User-Generated Content: Yes; Social Media: Yes; Messaging and Chat: Yes. Có portfolio/feed, đánh giá và nhắn tin trong lịch hẹn.
- Social Media Disabled for Users Under 13: No. Không khai báo một cơ chế kỹ thuật chưa triển khai.
- Advertising: No. Không có SDK quảng cáo hoặc vị trí quảng cáo trả phí trong source.
- Profanity/Crude Humor, Horror/Fear, Alcohol/Tobacco/Drug: None trong nội dung dự kiến của app.
- Medical or Treatment Information: None. Đây là marketplace dịch vụ làm đẹp/chụp ảnh, không chẩn đoán hoặc hướng dẫn điều trị bệnh.
- Health or Wellness Topics: Yes. Có chăm sóc da/tóc và massage; không tuyên bố tính năng y tế.
- Sexuality/Nudity, Violence, Gambling/Simulated Gambling/Contests/Loot Boxes: None/No theo nội dung dự kiến và quy chế.
- Apple đã lưu override age rating 18+; target audience Google dự kiến 18+, còn bị chặn bởi Sign in details. Không khai báo app có age gate toàn diện.

Căn cứ: `lib/catalog.ts`, màn hình native, `app/quy-che/page.tsx` mục VII–VIII, `app/chinh-sach/page.tsx`. UGC vi phạm bị cấm/gỡ; câu trả lời không bảo đảm mọi người dùng sẽ luôn tuân thủ quy chế.

## Quyền riêng tư — phạm vi cần điền trên Apple và Google

| Dữ liệu | Căn cứ/mục đích | Gắn với tài khoản | Bắt buộc hay tùy chọn |
| --- | --- | --- | --- |
| Họ tên, email, số điện thoại | Đăng nhập/hồ sơ/liên lạc lịch hẹn | Có | Tùy luồng; số điện thoại cần trước giao dịch |
| Địa chỉ phục vụ, thành phố/quận | Ghép và thực hiện lịch hẹn | Có | Theo dịch vụ; không xin GPS thiết bị |
| User ID, token thiết bị cho push | Quản lý tài khoản/thông báo | Có | User ID bắt buộc khi đăng nhập; push tùy chọn |
| Ảnh, video và âm thanh trong video | Portfolio, tin nhắn, đánh giá | Có | Tùy chọn |
| Tin nhắn, mô tả, đánh giá | Thực hiện lịch hẹn, hỗ trợ, UGC | Có | Theo chức năng sử dụng |
| Lịch sử đặt lịch, lưu/follow/tác phẩm | Chức năng tài khoản/marketplace | Có | Theo chức năng sử dụng |
| Phí/số dư và lịch sử giao dịch đối tác | Thu phí nền tảng, đối soát | Có | Theo vai trò và giao dịch; không nhập thẻ trong native |

- Dùng cho App Functionality/Account Management, không có quảng cáo theo dõi hay bán dữ liệu.
- Dữ liệu gửi qua HTTPS tới Supabase/web; ảnh/nội dung có kiểm duyệt theo quy chế, thông báo qua Expo/Apple/Google nếu người dùng cho phép.
- Số điện thoại/địa chỉ được bên còn lại xem trong phạm vi lịch hẹn; hồ sơ/tác phẩm/đánh giá có thể công khai theo thao tác người dùng.
- Không tự khai báo thu thập CCCD/sinh trắc học cho tính năng đang khóa; xác minh danh tính production hiện đóng. Phải rà lại nếu mở tính năng đó.
- Có xóa tài khoản trong native (`Tôi → Xóa tài khoản`); giao dịch cần lưu có thể giữ ở dạng ẩn danh theo quy chế.
- Google Data safety đã lưu dự thảo, chưa Submit. Apple App Privacy đã lưu đủ 14 loại: Name, Email Address, Phone Number, Physical Address, Other Financial Info, Coarse Location, Emails or Text Messages, Photos or Videos, Customer Support, Other User Content, User ID, Device ID, Purchase History, Product Interaction. Mỗi loại dùng App Functionality, linked to identity = Yes, tracking = No. Customer Support căn cứ báo cáo/no-show trong app; location là tâm quận, không GPS thiết bị. Publish chưa bấm vì hộp cuối yêu cầu cam kết pháp lý và đang chờ chủ sản phẩm xác nhận. Cần rà lại mục bắt buộc/tùy chọn và thời hạn giữ dữ liệu trước Google Submit.

## Metadata và phần còn thiếu

- Apple đã chọn build 2 và phát hành tự động sau App Review; Google đã lưu draft production dùng lại AAB 4.
- URL privacy: `https://www.360dep.vn/quy-che`; support: `https://www.360dep.vn/tro-giup`.
- Reviewer cần tài khoản mẫu riêng, không quyền admin và không dùng thông tin khách hàng thật. Chưa tạo hoặc chia sẻ credential reviewer.
- Sáu screenshot iPhone đã lưu và đọc lại; Google listing vẫn giữ icon/feature graphic nhưng Save as draft yêu cầu ít nhất hai screenshot Android. Còn screenshot Android, khai báo nội dung đầy đủ và kiểm thử đăng nhập native.
- Đã chọn chỉ Vietnam trên Apple và Google production; chưa phát hành.
- Chưa gửi production App Review hoặc Google review.

## Google Data safety draft đã lưu

14 loại: Name, Email address, User IDs, Address, Phone number; Purchase history, Other financial info; Approximate location; Other in-app messages; Photos, Videos; App interactions, Other user-generated content; Device or other IDs.

Đã chọn Collected, không xử lý ephemerally, mục đích App functionality; thêm Account management cho năm mục personal info. Draft hiện đánh dấu thu thập tùy chọn theo chức năng/người dùng đăng nhập; cần rà lại yêu cầu bắt buộc của từng luồng trước Submit. Không chọn Shared theo miễn trừ service provider xử lý theo chỉ dẫn và thao tác người dùng chủ động/được kỳ vọng (booking, public portfolio) trong định nghĩa Google. Đây không phải khẳng định dữ liệu không đi qua Supabase, Expo, Vercel, Resend, OpenAI hoặc bên thực hiện lịch hẹn.

Encrypted in transit Yes; account creation Username/password và OAuth. Delete-account URL `https://www.360dep.vn/me/cai-dat`; không khai báo cơ chế xóa một phần dữ liệu rộng hơn thực tế. Trang trợ giúp có mô tả xóa/anonymize, nhưng chưa có kỳ hạn giữ lịch sử giao dịch cụ thể: cần chốt chính sách, không tự bịa thời hạn.

Preview báo target age group/content chưa khai báo nên Save cuối bị khóa. Đã Save as draft và thấy “Change saved”; chưa gửi Publishing overview review.

Google Health đã lưu Other, mô tả 233/250 ký tự: marketplace đặt dịch vụ da/tóc/cơ thể, massage và wellness trước/sau sinh bởi đối tác độc lập; không có chẩn đoán, clinical decision support, theo dõi sức khỏe, hồ sơ y tế hoặc medical-device functionality. Căn cứ danh mục có chăm sóc da đầu, massage bầu/sau sinh và định nghĩa Help Center Google. Bước Regional requirements báo không cần thông tin thêm; UI xác nhận Change saved. Financial features đã lưu Rewards/points/incentives theo voucher/referral.

Advertising ID đã lưu No, UI xác nhận Change saved. Kiểm tra source không có SDK quảng cáo/tracking; dump permission trực tiếp từ AAB versionCode 4 bằng bundletool không có com.google.android.gms.permission.AD_ID. App content còn bốn mục: Sign in details, Content ratings, Target audience and content, Data safety. Content ratings đã điền email công ty và All Other App Types; chưa tick IARC Terms of Use hoặc trả lời questionnaire, đang chờ xác nhận điều khoản.

## Dữ liệu và bằng chứng trước mở công khai

Production read-only: 7 hồ sơ công khai đều seed, 22 user seed, 19 tác phẩm, 15 đơn gắn seed; không có đơn của khách thật với seed hoặc seed account có identity thật cần bảo vệ. Đã hỏi duyệt ẩn hồ sơ/tắt nhận job nhưng chưa đổi database. Không xóa dữ liệu. Native chưa hiển thị demo notice. Cần chủ sản phẩm chốt dữ liệu trước public launch và chụp lại ảnh nếu ẩn seed.

Apple đã lưu sáu screenshot iPhone, liên hệ review và pricing miễn phí/availability Vietnam. Google listing chưa lưu hợp lệ vì thiếu Android screenshot. Key Sign in with Apple đã chọn primary App ID Q8A7CBYV5Z.vn.dep360.app, Save Configure và Continue đến Register; chưa tạo key. Form reviewer mở trong Browser Codex, chỉ điền tên 360dep App Review; chủ sản phẩm cần tự nhập email/mật khẩu mới và submit, chưa tạo tài khoản. [Assets](./store-assets/2026-10-04/README.md).
