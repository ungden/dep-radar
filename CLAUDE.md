# 360đẹp: quy tắc cho agent

## Tài liệu quy định tự cập nhật

`docs/QUY_DINH_TRONG_APP.md` được **sinh từ code**, không sửa tay.

- Nguồn: `lib/conduct.ts` (quy định dịch vụ lành mạnh, thông báo tin nhắn, cam kết đối tác), `lib/pricing.ts` (phí), `lib/connection.ts` (trạng thái tin nhắn), qua `lib/docs/rules-doc.ts`.
- Sau mỗi lần sửa một trong các file đó: chạy `npm run docs:rules` và commit `docs/QUY_DINH_TRONG_APP.md` cùng thay đổi.
- Hook `scripts/hooks/rules-doc.sh` (khai báo trong `.claude/settings.json` trên máy, thư mục này không commit) tự chạy lệnh này sau khi Claude sửa các file nguồn.
- `tests/rules-doc.test.ts` làm CI đỏ khi tài liệu lệch với code.
- Thêm quy định hay thông báo mới thì thêm câu chữ vào `lib/conduct.ts` (web và app cùng đọc), rồi thêm mục tương ứng trong `lib/docs/rules-doc.ts`.
