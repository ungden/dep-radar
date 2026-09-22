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
Tin nhắn (Realtime, `send_message`, `mark_thread_read`, `open_thread`) · Thông báo · Tôi (đã lưu, địa chỉ chỉ xem,
đổi sang Studio, đăng xuất) · Đăng nhập Google + nhập số điện thoại một lần (`set_my_phone`).

Studio: Hôm nay (lịch cần gọi xác nhận với đếm ngược `confirm_by` + bấm để gọi, lịch hôm nay + chỉ đường,
thu nhập tuần từ lịch đã hoàn thành) · Việc mới (`send_offer` / `withdraw_offer`) · Đăng tác phẩm
(camera/thư viện, ảnh được nén lại bằng expo-image-manipulator nên mất EXIF/GPS, tải lên bucket `works` dưới `<uid>/…`,
insert `works` như `saveWork()` của web) · Lịch · Tôi (bật/tắt nhận lịch).

## Cố ý chưa làm (mở trang web trong app)

- **Đăng yêu cầu** (nút ＋ của khách): mở `https://www.360dep.vn/requests/new` trong trình duyệt trong app.
- Thêm/sửa địa chỉ, viết đánh giá, cài đặt và **xoá tài khoản**, mở hồ sơ người làm lần đầu (`/studio/onboarding`),
  dịch vụ & bảng giá, giờ làm, ví, xác minh danh tính: mở trang web tương ứng.
  Trình duyệt trong app không dùng chung phiên đăng nhập với app, nên có thể phải đăng nhập lại ở đó.
- Gửi ảnh trong chat; ảnh chat chỉ hiện nếu storage cho phiên người dùng ký URL (web ký bằng server).
- Đổi giờ hẹn (`request_reschedule`), báo vắng mặt, tuyển mẫu (castings).
- **TODO(push):** database chưa có bảng lưu push token, nên app chỉ xin quyền thông báo (sau khi đặt lịch)
  và không đăng ký token nào, không có thông báo đẩy thật. Cần: bảng `push_tokens (account_id, token, platform)`,
  lấy Expo push token (cần EAS projectId) trong `src/data/push.ts`, và một nơi gửi (Edge Function / cron).
- **Video:** chỉ hiện khi có cột `works.video_path`. Bucket `works` hiện chỉ nhận ảnh ≤ 5 MB, nên tải clip sẽ bị
  từ chối với câu báo rõ ràng. Clip được iOS xuất lại 720p, nhưng việc xoá metadata vị trí trong file video
  **chưa được kiểm chứng**: cần kiểm tra trước khi mở video cho người dùng thật.
- "Gần bạn, còn lịch" đổi thành "Gần bạn, đang nhận lịch": app chỉ biết người làm đang bật nhận lịch,
  không gọi `free_slots` cho từng người ở trang chủ.
- EAS chưa liên kết; build lên store cần tài khoản Expo, Apple Developer và Google Play của chủ sản phẩm.
