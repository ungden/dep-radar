# dep360

Marketplace đặt lịch làm đẹp với chuyên viên freelancer (nail, makeup, chăm sóc da, tóc, mi & mày).

- **Khách hàng**: xem tác phẩm thật, tìm chuyên viên theo khu vực, đặt lịch (dịch vụ → thời gian → xác nhận & cọc 30%), quản lý lịch hẹn, hoặc **đăng yêu cầu** để freelancer gửi báo giá.
- **Freelancer (Studio)**: tổng quan thu nhập, nhận/từ chối yêu cầu đặt lịch, xem việc mới quanh khu vực và gửi báo giá, lịch làm theo ngày, quản lý dịch vụ & bảng giá, bật/tắt nhận job.

Một tài khoản có thể chuyển qua lại giữa hai chế độ.

## Trạng thái hiện tại

Bản prototype chạy hoàn toàn phía client:

- Dữ liệu mẫu nằm ở `lib/data.ts` (chuyên viên, dịch vụ, tác phẩm, đánh giá).
- Trạng thái người dùng (đăng nhập demo, lịch hẹn, yêu cầu, báo giá, dịch vụ) nằm ở `lib/store.tsx`, lưu trong `localStorage`. Có nút "Đặt lại dữ liệu demo" ở trang Cá nhân.
- Chưa có OTP, thanh toán hay backend thật. Schema đề xuất cho Supabase ở `docs/supabase-schema.sql` (chưa áp dụng lên database).

## Chạy local

```bash
npm install
npm run dev
```

## Cấu trúc

| Đường dẫn | Màn hình |
| --- | --- |
| `/welcome`, `/login` | Màn chào, đăng nhập & chọn vai trò |
| `/`, `/search`, `/works/[id]` | Khám phá, tìm kiếm, chi tiết tác phẩm |
| `/pros`, `/pros/[id]` | Danh sách & hồ sơ chuyên viên (tác phẩm, dịch vụ, giới thiệu, đánh giá) |
| `/book/[serviceId]` | Luồng đặt lịch 3 bước |
| `/bookings`, `/bookings/[id]` | Lịch hẹn (dùng chung cho khách & freelancer) |
| `/requests`, `/requests/new`, `/requests/[id]` | Yêu cầu đã đăng & báo giá nhận được |
| `/saved`, `/me` | Đã lưu, Cá nhân |
| `/studio`, `/studio/jobs`, `/studio/schedule`, `/studio/services` | Khu vực freelancer |
