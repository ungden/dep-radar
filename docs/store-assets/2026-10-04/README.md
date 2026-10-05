# Store assets — updated 2026-10-05

App Store Connect đã có 6 screenshot iPhone 1284×2778: khám phá, giá, tác phẩm, chọn gói đặt lịch, hồ sơ và bộ lọc. Đã kiểm tra thumbnail đúng, tải lại trang vẫn đủ 6 ảnh và Save disabled. Bằng chứng: [App Store 6 ảnh](./local-proofs/dep360-apple-six-screenshots.jpg). Google đã có icon 512×512 và feature graphic 1024×500; screenshot Android còn thiếu.

Ảnh lấy bằng chức năng Save Screen của Simulator từ app native trên thiết bị riêng 360dep Partner QA, backend production. HTML chỉ tạo khung giới thiệu; không dựng giả UI. Font Be Vietnam Pro lấy từ assets dự án. Chạy HTTP server thư mục này, mở index.html với type=discover, prices, search, profile, work, booking, icon hoặc feature để tái tạo. `search` hiện là ảnh bộ lọc.

Bốn ảnh bổ sung có nhãn “Giao diện iPhone · Dữ liệu minh họa”. Hai ảnh đầu trên Apple vẫn là bản đã upload trước đó; file local đã có nhãn mới nhưng chưa thay trên Apple. Automatic review chặn Delete All vì cần xác nhận ngay lúc xóa; đã Cancel và chỉ thêm 4 ảnh, không xóa ảnh hiện có.

Hồ sơ đang hiển thị là seed/demo. Không dùng ảnh iPhone làm screenshot Android. Chưa gửi App Review hoặc phát hành. Không dùng màn hình chọn ngày giờ đang tải kéo dài làm ảnh giới thiệu; cần điều tra trước khi xác nhận booking E2E.

Ảnh render và ảnh bằng chứng Chrome/CUA có bytes JPEG, dùng đuôi .jpg. Ảnh native lưu từ Simulator là PNG.

Android AVD riêng dep360_store_qa đã thử khởi động ngày 2026-10-05, nhưng SDK từ chối vì không đủ dung lượng đĩa. Không khởi động/chỉnh emulator dự án khác và không chạy build trả phí mới. Chỉ dọn tệp xuất/build tạm 360dep và node_modules có thể cài lại bằng npm ci; không đổi source ứng dụng.

Bằng chứng mới trong local-proofs chỉ lưu trên máy và được gitignore vì screenshot native Chrome có thanh tab của các tác vụ khác. Sau khi dung lượng đạt 4,8 GB, SDK vẫn báo cần 7.372,8 MB để tạo userdata; cần khoảng 8 GB để tiếp tục Android.


Cập nhật sau duyệt cụ thể 05/10: máy còn khoảng 46 GB; SDK cũ bị gỡ nên đã tải official commandlinetools Google, xác minh SHA256, chấp nhận SDK license được chủ sản phẩm duyệt và cài trong /private/tmp/dep360-android-sdk. Emulator cài xong, image Android 36 Google Play arm64 đang tải. Các đoạn báo thiếu đĩa ở trên là bằng chứng lịch sử, không phải trạng thái hiện tại. Apple Privacy đã Publish, SIWA key đã tạo, Google IARC đã lưu; ảnh xác nhận trong local-proofs. Android screenshot vẫn chờ boot image mới.


Trạng thái cuối SDK 05/10: image đã cài, Android QA đã boot và APK cài Success. CUA nhận cửa sổ qua launcher QA cục bộ, nhưng emulator gặp System UI/Process system ANR; chưa có screenshot app Android hợp lệ. Đã dừng riêng QA sau chẩn đoán, giữ SDK/AVD/APK. Xem local-proofs/dep360-android-system-anr.jpg; không dùng ảnh lỗi cho listing.
