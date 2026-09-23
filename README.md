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
- **Đăng nhập bằng Google** (Supabase Auth), không mật khẩu, không OTP. Lần đầu đăng nhập, app hỏi số điện thoại một lần; database không cho đặt lịch, đăng yêu cầu hay mở hồ sơ chuyên viên khi chưa có số.
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
| `/login` | Đăng nhập & chọn vai trò |
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

**Cấp quyền admin** — chỉ bằng SQL editor (service role), sau khi người đó đã đăng nhập Google một lần. Client không ghi được cột `is_admin`:

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
