# 360dep — app iOS / Android

Expo Router (SDK 57), một app hai chế độ như web: **khách** và **Studio** (người làm), đổi ở tab Tôi.
App đọc/ghi cùng Supabase với web, bằng **publishable/anon key**, qua cùng bảng, RLS và RPC.
Không có service-role key nào trong app, và không được thêm vào.

## Chạy

```bash
cd apps/mobile
npm install
cp .env.example .env.local   # điền EXPO_PUBLIC_SUPABASE_ANON_KEY (anon/publishable key, không phải service role)
npx expo start               # i = iOS simulator, a = Android
```

| Biến | Giá trị |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://360dep.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key của project |

Thiếu biến thì app vẫn mở và nói rõ "App chưa kết nối máy chủ".

**Đăng nhập Google** đi qua `dep360://auth/callback` (đã có trong Redirect URLs của Supabase).
Trong Expo Go, redirect là `exp://…` và Supabase sẽ không nhận; để thử đăng nhập cần development build:
`npx expo run:ios` (hoặc `eas build --profile development`, khi đã có tài khoản Expo/Apple).

Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, `npx expo export --platform ios`.

## Dùng chung với web

`src/shared.ts` là cửa duy nhất vào `lib/` của web (alias `@shared/*` trong `tsconfig.json`,
`metro.config.js` thêm `../../lib` vào `watchFolders`). Chỉ các module thuần:
`design/tokens`, `types`, `catalog`, `feed` (`rankFeed`, `supplyIsThin`), `occasions`, `pricing`, `geo`, `trust`.
Không import `lib/utils.ts` (kéo theo clsx/tailwind-merge), `lib/supabase/*`, `lib/api/*`, `lib/auth/*`
(code server Next.js): bản dành cho app nằm ở `src/data/*` và đọc đúng các cột/join như `lib/api/snapshot.ts`.

Cột đang được thêm song song (`works.kind`, `works.video_path`, `bookings.delivery_*`, view `work_stats_30d`,
`pros.equipment`, bảng `model_profiles`) được đọc phòng thủ: thiếu cột thì app rơi về câu select cũ, không trắng màn hình.

## Đã làm

Khách: Khám phá (tìm kiếm, gợi ý theo lịch, công tắc ngành dính khi cuộn, danh mục bằng ảnh thật, Theo dịp,
"Gần bạn, đang nhận lịch", feed 3 tab bằng `rankFeed` dạng masonry 2 cột, bố cục người-trước khi `supplyIsThin`,
kéo để tải lại) · Chi tiết bài (ảnh/clip, gói giá, theo dõi, lưu, "Mẫu tương tự", thanh đặt lịch dính đáy) ·
Hồ sơ người làm · Tìm + bộ lọc (bottom sheet) · Trang dịp · Đặt lịch 3 bước (`free_slots` → `create_booking`,
lỗi của database hiện nguyên văn) · Lịch hẹn + chi tiết (dòng thời gian, huỷ có lý do qua `cancel_booking`) ·
Tin nhắn (Realtime, `send_message`, `mark_thread_read`, `open_thread`) · Thông báo · Tôi (đã lưu, địa chỉ,
đổi sang Studio, đăng xuất, xoá tài khoản) · Đăng nhập Google hoặc Apple + số điện thoại một lần (`set_my_phone`).

Studio: Hôm nay (lịch cần gọi xác nhận với đếm ngược `confirm_by` + bấm để gọi, lịch hôm nay + chỉ đường,
thu nhập tuần từ lịch đã hoàn thành) · Việc mới (`send_offer` / `withdraw_offer`) · Đăng tác phẩm
(camera/thư viện, ảnh được nén lại bằng expo-image-manipulator nên mất EXIF/GPS, tải lên bucket `works` dưới `<uid>/…`,
insert `works` như `saveWork()` của web) · Lịch · Tôi (bật/tắt nhận lịch).

Thêm trong bản này (thay cho link web):
- **Địa chỉ** thêm/sửa/xoá/đặt mặc định ngay trong app (`dia-chi/`, bảng `addresses` như `saveAddress()` của web).
- **Đặt lịch khi chưa đăng nhập**: bước 3 cho chọn thành phố/quận để ước tính phí; "Đăng nhập để đặt" mở đăng nhập
  rồi quay lại đúng bước, giữ nguyên lựa chọn. Có nút ✕ và hỏi trước khi bỏ lịch đang đặt.
- **Đăng yêu cầu** (nút ＋, `post_job`), **Yêu cầu của tôi** + báo giá + chọn báo giá (`accept_offer`),
  **viết đánh giá** (`write_review`: sao, thẻ, chữ, tối đa 3 ảnh vào bucket `reviews`), **Tuyển mẫu** (`apply_casting`).
- **Báo cáo / chặn** (nút ⋯ ở tin nhắn, bài đăng, hồ sơ, lịch hẹn, tin tuyển mẫu): báo cáo ghi bảng `reports` như
  `fileReport()`; chặn gọi `block_user` và ẩn ngay trên máy (lưu trong Keychain). Tôi › Người đã chặn.
- **Điều khoản**: lần đăng nhập đầu trên máy phải đồng ý (lưu SecureStore), link `/chinh-sach`.
- **Xoá tài khoản** trong Tôi: `delete_my_account()` rồi đăng xuất; app xoá ảnh trong thư mục của mình ở các bucket
  (best effort, không có service key).
- **Dữ liệu theo thành phố**: người làm lọc theo `city` trên server, chỉ tải tác phẩm/giá/đánh giá của họ; người ngoài
  thành phố (link, thông báo) tải riêng khi mở. Bản tải gần nhất lưu bằng AsyncStorage, hiện kèm "Đang offline".
- **Push**: sau đăng nhập (khi đã có quyền) và ngay khi cấp quyền, app lấy Expo push token và gọi
  `register_push_token(p_token, p_platform)`. Chạm thông báo mở `data.link` (đường dẫn web như `/bookings/<id>`
  được map sang màn hình app trong `src/data/routes.ts`).
- Giao diện: bottom sheet cao cố định, chân (Xoá lọc / Xem kết quả) dính đáy; Tìm có chế độ **Dịch vụ** trước, bộ lọc
  đang bật là chip bỏ được, không có kết quả thì mời "Đăng yêu cầu"; haptic chỉ khi chọn/xác nhận/lỗi; kéo tải lại
  màu hồng; đếm ngược chỉ chạy khi đang hiện; realtime tin chưa đọc chỉ trên hội thoại của mình.

## Việc của chủ sản phẩm (cấu hình)

- **Sign in with Apple** (bắt buộc khi có Google, App Store 4.8): bật Apple trong Supabase Auth › Providers, điền
  Services ID/key từ Apple Developer, thêm `vn.dep360.app` vào Authorized Client IDs. `ios.usesAppleSignIn` đã bật.
  Chưa bật provider thì nút Apple báo rõ "chưa được bật trên máy chủ".
- **Push** cần EAS projectId của tài khoản Expo chủ sản phẩm: `npx eas init` ghi `expo.extra.eas.projectId` vào
  `app.json`. Không có thì app không đăng ký token (không lỗi). Gửi push (Edge Function/cron) là việc phía server.
- **Universal links** cần Apple Team ID. Khi có, thêm `"ios": { "associatedDomains": ["applinks:www.360dep.vn"] }`
  vào `app.json` và file `https://www.360dep.vn/.well-known/apple-app-site-association` với appID
  `<TEAMID>.vn.dep360.app`.
- `ios.config.usesNonExemptEncryption = false` đã đặt (chỉ dùng HTTPS).

## TODO chờ database (đang thêm song song, app gọi phòng thủ)

- `block_user` / `unblock_user` + `user_blocks`: tên tham số chưa chốt; `src/data/safety.ts` thử lần lượt `p_target`,
  `p_account`, `p_user`, `p_blocked` (sửa `ARG_NAMES` khi migration chốt). Chưa có thì chặn chỉ có hiệu lực trên máy,
  và app nói rõ.
- `register_push_token` + `push_tokens`: chưa có thì bỏ qua im lặng. Chưa có RPC huỷ token khi đăng xuất.
- `dispute_no_show`, time blocks, `free_days`: app chưa dùng.

## Vẫn mở trên web

- Cài đặt Studio: dịch vụ & bảng giá, giờ làm/ngày nghỉ, sửa hồ sơ, tác phẩm, ví, xác minh danh tính, mở hồ sơ người
  làm lần đầu; mỗi dòng ghi "mở trên web". Trình duyệt trong app không dùng chung phiên, có thể phải đăng nhập lại.
- Gửi ảnh trong chat; ảnh chat chỉ hiện nếu storage cho phiên người dùng ký URL (web ký bằng server).
- Đổi giờ hẹn (`request_reschedule`), báo vắng mặt; người đăng tin tuyển mẫu xem người ứng tuyển trên web.
- **Video:** chỉ hiện khi có cột `works.video_path`. Bucket `works` hiện chỉ nhận ảnh ≤ 5 MB, nên tải clip sẽ bị
  từ chối với câu báo rõ ràng. Clip được iOS xuất lại 720p, nhưng việc xoá metadata vị trí trong file video
  **chưa được kiểm chứng**: cần kiểm tra trước khi mở video cho người dùng thật.
- "Gần bạn, còn lịch" đổi thành "Gần bạn, đang nhận lịch": app chỉ biết người làm đang bật nhận lịch,
  không gọi `free_slots` cho từng người ở trang chủ.
- EAS chưa liên kết; build lên store cần tài khoản Expo, Apple Developer và Google Play của chủ sản phẩm.
