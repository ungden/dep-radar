# 360dep

Marketplace đặt lịch làm đẹp với chuyên viên freelancer (nail, makeup, chăm sóc da, tóc, mi & mày, massage).

- **Khách hàng**: xem tác phẩm thật, tìm chuyên viên theo khu vực, đặt lịch (dịch vụ → thời gian → địa điểm, phí & cách thanh toán), quản lý lịch hẹn, hoặc **đăng yêu cầu** để freelancer gửi báo giá.
- **Freelancer (Studio)**: thu nhập sau hoa hồng, xác minh danh tính (CCCD + selfie) để có dấu tick, nhận/từ chối yêu cầu đặt lịch, xem việc mới quanh khu vực và gửi báo giá, lịch làm theo ngày, quản lý dịch vụ & bảng giá, bật/tắt nhận job.

Một tài khoản có thể chuyển qua lại giữa hai chế độ.

## Mô hình kinh doanh & luật chơi

| Chủ đề | Quy định | Code |
| --- | --- | --- |
| Danh mục dịch vụ | 360dep quy định tên, nội dung, gói (thời lượng/mức độ) và khung giá. Freelancer chỉ chọn dịch vụ trong danh mục và đặt giá trong khung. | `lib/catalog.ts` |
| Phí khách hàng | 0đ phí nền tảng, không đặt cọc. Khách trả giá dịch vụ + phí di chuyển/đặt gấp nếu có; thanh toán online toàn bộ hoặc trả trực tiếp sau khi làm. | `lib/pricing.ts` |
| Xác nhận lịch | Freelancer gọi điện cho khách xác nhận rồi mới nhận job, trong 2 giờ (đặt từ 21:00 đến 08:00 thì tới 10:00 sáng, nhưng không muộn hơn 1 giờ trước giờ hẹn); quá hạn tự huỷ. | `app/bookings/[id]` |
| Hoa hồng | Một mức 15% trên giá dịch vụ, thu từ freelancer. Không tính trên phí di chuyển/gấp. Job online: trừ trước khi chuyển tiền; job tiền mặt: ghi công nợ, đối soát hằng tuần. | `lib/pricing.ts` |
| Phí di chuyển | Miễn phí 5 km đầu, sau đó 5.000đ/km (tối đa 100.000đ); ngoài bán kính freelancer thì không nhận làm tại nhà. | `lib/pricing.ts`, `lib/geo.ts` |
| Phí đặt gấp | Bắt đầu trong vòng 3 giờ: +50.000đ. Không nhận lịch trong vòng 60 phút. | `lib/pricing.ts` |
| Xác minh | Tự nguyện: chụp CCCD 2 mặt + selfie, AI (Gemini) đọc thẻ và so khuôn mặt. Đã xác minh có dấu tick, huy hiệu và được xếp trước. | `app/api/identity`, `app/studio/verify` |
| Xếp hạng | Đã xác minh danh tính được xếp trước, sau đó theo điểm đánh giá (có trọng số) và số job. Không bán vị trí. | `lib/trust.ts` |
| Đánh giá | Chỉ khách hoàn thành lịch hẹn; số sao + tag + nhận xét; freelancer chỉ phản hồi, không xoá. | `app/bookings/[id]/review` |

## Trạng thái hiện tại

- Production (`www.360dep.vn`) đọc và ghi Supabase thật. Luật giá, phí, lịch trống và trạng thái lịch hẹn nằm trong database (RLS + RPC), trình duyệt chỉ hiển thị.
- Chuyên viên và tác phẩm đang hiện là **dữ liệu mẫu** (sinh từ `lib/data.ts`), có nhãn trên trang.
- **Đăng nhập** (Supabase Auth, không SMS/OTP): Google; Apple (nút chỉ hiện khi provider Apple đã bật); hoặc mật khẩu với **số điện thoại hoặc email**. Tài khoản tạo bằng số điện thoại dùng một email thay thế `84…@sdt.360dep.vn` cho tới khi người dùng thêm và xác nhận email thật (để lấy lại mật khẩu). Google, Apple và đăng ký bằng email hỏi số điện thoại một lần sau lần đăng nhập đầu; database không cho đặt lịch, đăng yêu cầu hay mở hồ sơ đối tác khi chưa có số.
- **Khách và đối tác tách riêng**: khách chỉ thấy app đặt lịch; lối vào duy nhất cho người làm là `/doi-tac` (footer và dòng cuối trang Tôi). Nút chuyển chế độ chỉ hiện với tài khoản đã có hồ sơ đối tác.
- Chưa có: thanh toán online, xác minh danh tính khi thiếu `GEMINI_API_KEY`, nạp ví tự động. Màn hình nói rõ những chỗ đó.
- Kế hoạch sửa còn lại: `docs/AUDIT_2026-09-22.md`.

## Chạy local

```bash
npm install
npm run dev
```

## Cấu trúc

| Đường dẫn | Màn hình |
| --- | --- |
| `/login` | Đăng nhập: Google, Apple, số điện thoại/email + mật khẩu, tạo tài khoản (`?role=pro` cho đối tác) |
| `/quen-mat-khau`, `/dat-lai-mat-khau` | Quên mật khẩu, đặt mật khẩu mới từ link trong email |
| `/me/email`, `/me/cai-dat` | Thêm email cho tài khoản số điện thoại; đổi mật khẩu |
| `/doi-tac` | Trang giới thiệu cho đối tác (người làm), lối vào hồ sơ đối tác |
| `/api/auth/password-login`, `/api/auth/signup`, `/api/auth/forgot` | JSON cho app mobile: cùng logic với web (`lib/auth/password.ts`) |
| `/`, `/search`, `/works/[id]` | Khám phá, tìm kiếm, chi tiết tác phẩm |
| `/pros`, `/pros/[id]` | Danh sách & hồ sơ chuyên viên (tác phẩm, dịch vụ, giới thiệu, đánh giá) |
| `/book/[proId]` | Luồng đặt lịch 3 bước (gói → giờ → địa điểm & phí) |
| `/bookings`, `/bookings/[id]`, `/bookings/[id]/review` | Lịch hẹn (dùng chung cho khách & freelancer), đánh giá |
| `/requests`, `/requests/new`, `/requests/[id]` | Yêu cầu đã đăng & báo giá nhận được |
| `/saved`, `/me` | Đã lưu, Cá nhân |
| `/studio`, `/studio/jobs`, `/studio/schedule`, `/studio/services`, `/studio/profile` | Khu vực freelancer: thu nhập, báo giá, lịch, bảng giá, xác minh & đánh giá |
| `/chinh-sach` | Chính sách phí, hoa hồng, huỷ lịch, xác minh & xếp hạng |

## Cơ sở dữ liệu

Luật chơi (khung giá, phí, trạng thái lịch hẹn) sống ở database, không ở trình duyệt.

```bash
supabase start          # Postgres + Auth + REST cục bộ
supabase db reset       # áp migration rồi seed danh mục + dữ liệu mẫu
npm run db:test         # test luật nghiệp vụ (SQL)
npm run test:db         # test row level security qua đúng API
```

Danh mục và khung giá sinh ra từ `lib/catalog.ts`:

```bash
npm run catalog:sql     # ghi lại supabase/seed/catalog.sql
npm run catalog:check   # CI: báo lỗi nếu file đã cũ
npm run demo:sql        # ghi lại dữ liệu mẫu từ lib/data.ts
```

Biến môi trường: xem `.env.example`.

Migration trên production được áp bằng `supabase db push` hoặc MCP; tên file trong
`supabase/migrations/` phải trùng số phiên bản mà production đã ghi
(`supabase migration list` không được lệch).

## Vận hành

**Địa chỉ Supabase:** project dùng vanity subdomain `https://360dep.supabase.co` (bật 22/09/2026, miễn phí với gói Pro). Auth **không còn chạy** trên `ohjrocksurzkypcbfkha.supabase.co`, nên mọi client (web, mobile, `NEXT_PUBLIC_SUPABASE_URL` trên Vercel, `EXPO_PUBLIC_SUPABASE_URL`) phải dùng địa chỉ mới.

**Đăng nhập Google (làm một lần):**

1. Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID*, loại **Web application**.
   - Authorized JavaScript origins: `https://www.360dep.vn`
   - Authorized redirect URIs: `https://360dep.supabase.co/auth/v1/callback` (và địa chỉ cũ `https://ohjrocksurzkypcbfkha.supabase.co/auth/v1/callback`)
   - OAuth consent screen: tên app 360dep, email hỗ trợ, domain `360dep.vn`; scope chỉ cần `email`, `profile`, `openid`.
2. Supabase → Authentication → Sign In / Providers → **Google**: bật, dán Client ID và Client Secret, lưu.
3. Supabase → Authentication → URL Configuration: Site URL `https://www.360dep.vn`; Redirect URLs thêm
   `https://www.360dep.vn/auth/callback`, `http://localhost:3000/auth/callback`, và `dep360://auth/callback` (app mobile).
   Muốn đăng nhập trên bản preview của Vercel thì thêm cả `https://*-tduong297-gmailcoms-projects.vercel.app/auth/callback`.

Trang `/login` tự hỏi Supabase xem Google đã bật chưa: chưa bật thì nút bị khoá và trang nói rõ, bật xong thì nút chạy sau tối đa một phút.

**Đăng nhập Apple (tuỳ chọn):** Apple Developer → tạo *Services ID* (Sign in with Apple, domain `360dep.supabase.co`, return URL `https://360dep.supabase.co/auth/v1/callback`) và một key; Supabase → Authentication → Sign In / Providers → **Apple**: bật, điền Services ID và secret. Nút “Tiếp tục với Apple” tự hiện trên `/login` trong vòng một phút sau khi bật; chưa bật thì không hiện gì.

**Mật khẩu (số điện thoại hoặc email):** chạy trên provider **Email** của Supabase (đã bật). Cần giữ đúng các cài đặt sau ở Authentication → Sign In / Providers → Email:

- **Confirm email: tắt** (`mailer_autoconfirm`). Tài khoản tạo bằng số điện thoại có email thay thế `…@sdt.360dep.vn` không nhận được thư, nên không thể xác nhận; đăng ký phải trả về phiên đăng nhập ngay.
- **Secure email change: tắt.** Khi bật, đổi email phải xác nhận ở *cả* địa chỉ cũ lẫn mới; địa chỉ cũ của tài khoản số điện thoại là địa chỉ thay thế, nên việc thêm email sẽ không bao giờ hoàn tất.
- Supabase có thể từ chối địa chỉ có tên miền không nhận thư (tên miền `sdt.360dep.vn` không có bản ghi MX). Nếu đăng ký bằng số điện thoại báo lỗi, xem log `signUp failed: phone email_address_invalid` và thêm một bản ghi MX cho `sdt.360dep.vn` (thư tới đó có thể bỏ đi).

**Gửi email (bắt buộc trước khi mở mật khẩu cho mọi người):** mailer mặc định của Supabase chỉ gửi tới email của thành viên trong team Supabase và khoảng 2 thư/giờ. Quên mật khẩu và thêm email đều gửi thư, nên cần SMTP riêng: Supabase → Authentication → Emails → **SMTP Settings** (Resend, Amazon SES, Postmark…), người gửi ví dụ `no-reply@360dep.vn` (thêm SPF/DKIM cho tên miền), rồi nâng giới hạn gửi ở Authentication → Rate Limits. Nên dịch hai mẫu thư *Reset Password* và *Change Email Address* sang tiếng Việt; giữ nguyên `{{ .ConfirmationURL }}`.

- Link quên mật khẩu mở `/dat-lai-mat-khau` trên web (cả khi yêu cầu từ app). Địa chỉ này cùng tên miền với Site URL nên Supabase chấp nhận; chạy local thì thêm `http://localhost:3000/**` vào Redirect URLs.
- Link xác nhận email mới quay về `/auth/callback?loai=email&next=/me/cai-dat`.
- Đăng nhập bằng số điện thoại: server tìm email của tài khoản theo số (service role, `SUPABASE_SERVICE_ROLE_KEY` bắt buộc), rồi đăng nhập bằng email đó. Sai số hay sai mật khẩu đều báo cùng một câu.

**Giới hạn tần suất:** Supabase tự giới hạn đăng nhập/đăng ký/gửi thư theo IP (Authentication → Rate Limits). Web và `/api/auth/*` gọi Auth từ server, nên mọi người dùng chung IP của Vercel: nếu thấy lỗi “thử nhiều lần quá” hàng loạt, nâng giới hạn *Sign-ups and sign-ins* ở đó. Ngoài ra mỗi instance server tự chặn một IP gửi quá nhiều (`lib/auth/throttle.ts`: 20 lần đăng nhập, 5 lần đăng ký mỗi 10 phút; 5 lần quên mật khẩu mỗi 15 phút) và từ chối body JSON lớn hơn 2KB.

**Cấp quyền admin** — chỉ bằng SQL editor (service role), sau khi người đó đã đăng nhập một lần (tài khoản tạo bằng số điện thoại: tìm theo `accounts.phone` thay vì email). Client không ghi được cột `is_admin`:

```sql
update public.accounts set is_admin = true
where id = (select id from auth.users where lower(email) = lower('<email>'));
select count(*) from public.accounts where is_admin;
```

**Thông tin nạp ví, hỗ trợ và công ty** — bảng `platform_settings` có đúng một dòng, ban đầu mọi cột đều
`null` và app không hiện gì cho cột còn trống. Điền một lần bằng SQL editor (service role), hoặc bởi tài khoản
admin qua API; client thường không ghi được:

```sql
update public.platform_settings set
  topup_bank_bin     = '970436',            -- mã BIN ngân hàng (6 số), dùng cho mã VietQR
  topup_account_no   = '0123456789',        -- chỉ chữ số
  topup_account_name = 'CONG TY TNHH 360DEP',
  support_zalo       = '0900000000',
  support_email      = 'hotro@360dep.vn',
  company_name       = 'Công ty TNHH 360dep',
  company_tax_id     = '0123456789',
  company_address    = 'Số 1 Đường ABC, Quận X, TP. Hồ Chí Minh'
where id;
select * from public.platform_settings;
```

Muốn gỡ một thông tin thì đặt lại `null`. Web đọc bảng này mỗi lần tải trang (`state.platform`), không cần deploy.

**Phí trước đơn tiếp theo:** `fee_policy.wallet_floor` = 0. Hoàn thành một lịch là trừ ngay phí dịch vụ 360dep vào
ví người làm và gửi thông báo "Thanh toán phí …". Khi ví còn âm, người làm không nhận lịch, không nhận việc được, và
khách không đặt được lịch với họ; nạp đủ là tự mở lại, không phải bật gì.

**Ghi nhận nạp ví bằng tay:** `/admin` → tab **Nạp ví**: tìm người làm theo mã nạp (nội dung chuyển khoản
`DEPAB23CD`, mỗi người một mã, xem ở tab Chuyên viên), slug hoặc tên; nhập số tiền và mã giao dịch ngân hàng. Cùng
một mã giao dịch không cộng hai lần.

**Tự cộng ví khi có tiền về (SePay):** web có sẵn webhook `POST /api/payments/sepay`. Chưa đặt khoá thì webhook trả
503 (đang tắt) và app nói với người làm là nhân viên ghi nhận bằng tay. Bật một lần:

1. Tạo tài khoản [SePay](https://sepay.vn), liên kết đúng tài khoản ngân hàng đã điền ở `platform_settings.topup_account_no`
   (hiện là MBBank 9999977977 của công ty).
2. SePay → Cấu hình công ty → Cấu hình chung → Cấu trúc mã thanh toán: mẫu **tiền tố `DEP`, hậu tố 6–6 ký tự số và
   chữ** (đã thêm ngày 23/09/2026). Nội dung chuyển khoản là `DEP` + mã nạp, viết liền.
3. SePay → Webhooks → Thêm webhook: **Tiền vào**, URL `https://www.360dep.vn/api/payments/sepay`, chỉ tài khoản MBBank
   trên, bật "Dùng để xác thực thanh toán" + "Chỉ gửi khi có mã thanh toán" lọc `DEP` (tài khoản này nhận tiền cho
   nhiều dự án khác), kiểu chứng thực **API Key**, tự đặt một chuỗi dài ngẫu nhiên làm khoá (đã tạo: webhook #58998).
4. Vercel → Project → Settings → Environment Variables: thêm `SEPAY_WEBHOOK_KEY` = đúng chuỗi đó (Production), cùng
   `SUPABASE_SERVICE_ROLE_KEY` nếu chưa có, rồi deploy lại.
5. Chuyển thử 10.000đ với nội dung `DEP<mã nạp của một người làm>`: ví người đó được cộng và họ nhận thông báo.
   Giao dịch không có mã (hoặc mã sai) thì không cộng cho ai; ghi nhận tay ở `/admin`.

Webhook kiểm tra header `Authorization: Apikey <khoá>`, bỏ qua tiền ra, và dùng mã giao dịch của SePay làm tham
chiếu nên SePay gửi lại cũng không cộng hai lần.

**Báo vắng mặt**: bù phí di chuyển được giữ 24 giờ rồi tự cộng vào ví (cron `dep360-no-show-release`). Khách khiếu
nại trong 24 giờ thì khoản đó chờ admin quyết bằng `decide_no_show_compensation`.

**AI duyệt hồ sơ đối tác và nhắc việc** (quyết định 24/09/2026: AI tự duyệt, tự nhắc, để lại nhật ký cho admin):

- Đối tác bấm “Mở hồ sơ cho khách” lần đầu thì hồ sơ **chưa hiện ngay**: database chuyển sang `review_status = 'pending'`
  (vẫn cần đủ dịch vụ, giờ làm, một ảnh tác phẩm như trước) và màn hình ghi “Đang chờ duyệt”. Server gọi AI cho hồ sơ đó
  ngay sau khi bấm; nếu không kịp thì cron bên dưới làm trong vòng 5 phút. Đã duyệt một lần thì đối tác tự ẩn/hiện hồ sơ,
  sửa giới thiệu cũng không phải duyệt lại. Hồ sơ đang hiện trước migration `20260929100000` được tính là đã duyệt.
- AI (OpenAI, mặc định `gpt-6-luna`) xem tên, tiêu đề, giới thiệu, dịch vụ và giá, giờ làm, tối đa 5 ảnh tác phẩm, rồi trả lời *duyệt / cần sửa /
  từ chối* kèm lý do bằng tiếng Việt; đối tác nhận thông báo (có push). Luật cứng luôn áp trước AI: thiếu dịch vụ/giờ
  làm/tác phẩm, có số điện thoại/link/Zalo trong giới thiệu, ảnh không phải tải lên từ máy, nhận làm mẫu mà chưa xác minh
  danh tính → cần sửa.
- Bài đăng mới của đối tác đã duyệt: AI xem ảnh, bài vi phạm bị ẩn khỏi khách (đối tác vẫn thấy, kèm lý do). Bài đăng có
  từ trước migration không bị xem lại; muốn đưa một bài vào hàng chờ: `update public.works set ai_checked_at = null where id = '<id>';`
- Nhắc việc (thông báo + push): hồ sơ chưa gửi duyệt sau 1, 3, 7 ngày (tối đa 3 lần); bị yêu cầu sửa mà 2 và 5 ngày sau
  chưa gửi lại (tối đa 2 lần); ví âm phí quá 24 giờ thì nhắc mỗi ngày một lần.
- **Nhật ký:** `/admin` → tab **Nhật ký AI** (số trong ngoặc là số quyết định 24 giờ qua). Lọc theo Duyệt / Cần sửa / Từ
  chối / Ẩn ảnh / Nhắc nhở / Đã đảo; mỗi dòng có lý do, ảnh AI đã xem, model. **Đảo quyết định** (kèm ghi chú nếu muốn)
  duyệt ↔ từ chối hồ sơ, ẩn ↔ hiện bài; đối tác được báo, nhật ký giữ cả câu trả lời của AI lẫn người đã đảo.
- AI lỗi hoặc quá tải: hồ sơ **giữ nguyên chờ duyệt**, không đoán; nhật ký ghi một dòng “Chưa quyết” (tối đa mỗi giờ một
  lần cho mỗi hồ sơ) và lần chạy sau thử lại. Không có `OPENAI_API_KEY` (và cũng không có `GEMINI_API_KEY` để dự phòng): hồ sơ được duyệt theo luật cứng ở trên, nhật ký ghi
  “Chưa có AI, duyệt theo quy tắc”, model `rules`.

Bật (Vercel → Project → Settings → Environment Variables, Production, rồi deploy lại):

1. `CRON_SECRET`: một chuỗi ngẫu nhiên dài (ví dụ `openssl rand -hex 32`). Vercel Cron tự gửi
   `Authorization: Bearer <CRON_SECRET>` khi biến này có; thiếu thì `/api/ai/cron` trả 503 và không chạy gì.
   Lịch nằm trong `vercel.json` (`*/5 * * * *`, gói Pro); xem lượt chạy ở Vercel → Project → Settings → Cron Jobs.
2. `OPENAI_API_KEY` (platform.openai.com → API keys) và tuỳ chọn `OPENAI_MODEL` (mặc định `gpt-6-luna`: rẻ nhất có đọc
   ảnh, khoảng $0.10 / 1 triệu token vào, một lần duyệt hồ sơ dưới 1 đồng xu). Không có khoá OpenAI thì dùng Gemini nếu có.
   `GEMINI_API_KEY` vẫn cần riêng cho xác minh danh tính: model của OpenAI từ chối so khuôn mặt selfie với ảnh trên CCCD.
3. `SUPABASE_SERVICE_ROLE_KEY` (đã có).

Chạy tay một lượt: `curl -H "Authorization: Bearer $CRON_SECRET" https://www.360dep.vn/api/ai/cron` (trả về số hồ sơ đã
quyết, bài đã xem, lời nhắc đã gửi). Mỗi lượt tối đa 10 hồ sơ, 20 bài, 50 lời nhắc.

## Ảnh tải lên

Ảnh tác phẩm và ảnh đại diện được vẽ lại qua canvas rồi nén lại **trên máy người
dùng** trước khi tải lên. Việc đó vừa giảm dung lượng, vừa xoá khối EXIF — trên
ảnh chụp bằng điện thoại, khối đó chứa toạ độ GPS nơi chụp, thường là nhà của ai
đó. Ảnh CCCD và selfie thì không lưu ở đâu cả: gửi thẳng cho AI rồi thôi.

## Cấu trúc

| Thư mục | Nội dung |
| --- | --- |
| `app/` | Route Next.js. Trang công khai server-render kèm metadata riêng; trang riêng tư do `middleware.ts` chặn. |
| `lib/api/` | Lớp truy cập dữ liệu. `snapshot.ts` là một lần đọc cho mỗi lần chuyển trang; mọi thao tác ghi đi qua server action → RPC. |
| `lib/catalog.ts` | Danh mục dịch vụ và khung giá. Nguồn duy nhất, sinh ra SQL cho database. |
| `lib/pricing.ts` | Luật phí. Có bản song song trong SQL, hai bên có test đối chiếu. |
| `supabase/migrations/` | Schema, RLS, RPC, cron. |
| `supabase/tests/rules.sql` | Test luật nghiệp vụ chạy trong database. |
| `tests/` | Unit test (offline) + test row level security qua đúng API. |

Nguyên tắc xuyên suốt: **không hiển thị thứ gì hệ thống không thực hiện được.**
Điều gì chưa chạy thì ghi rõ "sắp áp dụng"; con số nào không có thật thì không hiện.

**Đổi số điện thoại cho một tài khoản** (người dùng chỉ tự đặt được một lần):

```sql
update public.accounts set phone = '+84xxxxxxxxx' where id = '<account id>';
```
