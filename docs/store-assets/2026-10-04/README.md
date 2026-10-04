# Store assets — 2026-10-04

Apple đã lưu hai screenshot iPhone 1284×2778. Google đã lưu icon 512×512 và feature graphic 1024×500. Chưa có screenshot Android.

Ảnh iPhone lấy từ UI native Release của 360dep Partner QA, dùng backend production. Trang HTML tạo khung giới thiệu quanh ảnh native; font Be Vietnam Pro lấy từ assets của dự án. Chạy HTTP server trên thư mục này, mở `?type=discover`, `?type=prices`, `?type=icon` hoặc `?type=feature` để tái tạo.

Các hồ sơ hiển thị hiện là dữ liệu seed/demo. Chưa duyệt ảnh cho phát hành công khai; cần chốt dữ liệu thật và chụp lại nếu thay đổi nội dung. Không dùng ảnh iOS làm screenshot Android. Các ảnh bằng chứng dashboard chỉ ghi nhận trạng thái dự thảo, không chứng minh đã gửi review.

Ảnh render từ browser có bytes JPEG. Bốn file render Apple/Google dùng đuôi `.jpg` đúng định dạng. Bản Apple đuôi `.png` ban đầu bị processor báo lỗi, đã thay bằng hai JPEG và xác nhận thumbnail native hiển thị đúng, Save disabled.
