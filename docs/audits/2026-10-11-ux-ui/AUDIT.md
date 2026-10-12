# Audit UX/UI 360đẹp — 11/10/2026

**Kết luận: nhận xét “chữ bé, khó nhìn, chưa hiện đại/xịn” có cơ sở.** Nguyên nhân chính là chữ chức năng nhỏ, quá nhiều cấp lọc cùng xuất hiện, thông tin chưa có thứ bậc rõ, và trải nghiệm thật đang thiếu nội dung có thể đặt. Đổi font hoặc thêm hiệu ứng sẽ không giải quyết đủ.

Audit này gồm website live, web ở kích thước điện thoại, app iOS cài sẵn trên simulator, và source hiện tại. Chỉ tạo báo cáo/ảnh bằng chứng; chưa sửa sản phẩm hoặc triển khai.

## Phạm vi và độ tin cậy

- Website: https://www.360dep.vn, kiểm tra ngày 11/10/2026, khoảng 16:20–16:30 giờ Việt Nam; phiên khách chưa đăng nhập.
- Viewport web: desktop 1280×720, điện thoại 390×844; bổ sung kiểm tra tìm kiếm ở 320×740. Đây là kích thước browser, không phải bằng chứng Safari trên iPhone thật.
- Source: nhánh main, SHA `dc071613457f73a47337542553ad78ab607753e4`; checkout sạch trước audit. Chưa đối chiếu SHA của deployment live với checkout.
- App: bản iOS đã cài, phiên bản 1.0.0 build 1, chạy độc lập trên simulator R2R iPhone 17 Pro / iOS 26.5. Không build/cài mới. Không chứng minh binary này tương ứng với source HEAD hay bản đang được phân phối trên store.
- Các nhận xét đều phân biệt **quan sát live**, **xác nhận từ source**, và **đề xuất thiết kế**. Chưa đo tỷ lệ chuyển đổi hoặc thực hiện nghiên cứu người dùng; mức ảnh hưởng là đánh giá chuyên môn.
- Không có dữ liệu công khai để đi tiếp từ kết quả tìm kiếm đến hồ sơ đang nhận lịch. Luồng chi tiết dịch vụ, đặt lịch, thanh toán, chat, đánh giá, và onboarding sau đăng nhập chỉ được đối chiếu source, chưa xác minh toàn bộ bằng tương tác thật.

## Các bước đã kiểm tra

| Bước | Luồng và tình trạng | Bằng chứng |
|---|---|---|
| 1 | **Trang chủ desktop/mobile — yếu.** Lời hứa “Đặt dịch vụ, xem giá ngay” nhưng danh sách dịch vụ trống; 12 danh mục desktop đều “Sắp có”. Desktop dành khoảng lớn bên phải cho nội dung không xuất hiện. | 01, 07 |
| 2 | **Mở rộng danh mục — khó đọc.** 5 cột ở điện thoại, tên 12px và cắt “Photopho…”. “Sắp có” lặp lại lấn át tên dịch vụ. | 08 |
| 3 | **Danh sách người làm — chưa dẫn đến lựa chọn.** Mặc định Nail, nhiều bộ lọc rồi “Chưa có ai phù hợp”. Chưa thể audit một hồ sơ thật từ danh sách này. | 02 |
| 4 | **Tìm kiếm desktop/mobile — quá nhiều lớp trước kết quả.** Ngành → danh mục → bộ lọc → tab dịch vụ/tác phẩm/người làm. Ở 390px, kết quả bắt đầu khoảng y=500; cả ba tab đều 0. | 03, 09, 13 |
| 5 | **Bộ lọc — dùng được nhưng cần chỉnh.** Sheet mở/đóng và Escape trả focus đúng. Chữ chip 13px, nhãn “Giá từ” đi cùng lựa chọn “Dưới…”, switch tắt khó phân biệt. | 10, metrics-filter-mobile.json |
| 6 | **Đăng yêu cầu → đăng nhập/tạo tài khoản — đứt mạch khám phá.** CTA ở trạng thái trống đưa vào đăng nhập trước khi khách hiểu khả năng được nhận việc; form đọc được nhưng chữ phụ nhỏ, nội dung dài. | 04, 05, 06 |
| 7 | **Đối tác → mở hồ sơ — đầu vào rõ, trình bày nặng chữ.** Landing giải thích phí và cách làm; CTA vào cổng đăng nhập. Sáu bước nội bộ chưa được tương tác do chưa đăng nhập. | 11, 12 |
| 8 | **App iOS cài sẵn — tái hiện vấn đề nguồn cung trống.** Home/search/filter/account được quan sát; các vùng cần tài khoản có giới hạn kiểm tra riêng trong ghi chú native. | native-*.png, NATIVE-NOTES.md |

Kiểm tra bổ sung: Tab tới chọn khu vực mobile đưa focus vào select `opacity:0`, không có viền focus nhìn thấy (ảnh 14). Ở 320px, toàn trang không tràn ngang nhưng tab kết quả thứ ba bị cắt một phần; các danh mục dài bị rút gọn. Không gọi đây là “vỡ responsive toàn bộ”.

## Các vấn đề cần xử lý

### F01 · P1 · Cỡ chữ nhỏ là mặc định của hệ thống

**Bằng chứng live:** danh mục web 12px; chip bộ lọc 13px; nút/tab điều hướng nhiều nơi 13–15px; form dùng nhãn 13px. Heading có thể lớn nhưng phần người dùng phải đọc để quyết định lại nhỏ.

**Bằng chứng source:** [lib/design/tokens.ts:57](</Users/alexle/Documents/đẹp-radar/lib/design/tokens.ts:57>) đặt body 15, meta 13, label 12. [components/ui.tsx:26](</Users/alexle/Documents/đẹp-radar/components/ui.tsx:26>) đặt button sm/md/lg lần lượt 13/14/15px; `:348` label 13px, `:350` hint 12px, `:356` input 15px. Booking có tên lựa chọn 13px và giá/thời lượng 12px tại [app/book/[proId]/page.tsx:438](</Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:438>). Lỗi upload có chữ 10px tại [components/evidence-picker.tsx:96](</Users/alexle/Documents/đẹp-radar/components/evidence-picker.tsx:96>).

Đếm source `app/**/*.tsx` + `components/**/*.tsx`: 1.136 lần khai báo utility cỡ chữ, trong đó 872 (76,8%) là cỡ không có prefix responsive ≤14px. Loại các page admin/studio nhưng giữ shared component: 614/855 (71,8%). Đây là số lần khai báo trong source, không phải số phần tử hiển thị hoặc tỷ lệ màn hình.

**Đề xuất:** body/input 16–17px; label 14–15px; metadata 14px; tên dịch vụ 17–18px; giá 18–20px. Nút chính 16px, chiều cao 48–52px trên web/mobile. 12px chỉ dành cho thông tin thực sự phụ. Đây là baseline thiết kế, không phải quy định WCAG bắt buộc mọi chữ phải ≥16px.

### F02 · P1 · Có token nhưng web chưa dùng một thang chữ có vai trò rõ

Web khai báo cỡ chữ riêng lẻ ở hàng trăm chỗ. [app/globals.css:3](</Users/alexle/Documents/đẹp-radar/app/globals.css:3>) có token màu và font-family nhưng thiếu vai trò typography dùng chung; [tests/design-tokens.test.ts:14](</Users/alexle/Documents/đẹp-radar/tests/design-tokens.test.ts:14>) kiểm tra màu, không bảo đảm cỡ chữ giữa web/app. Tăng font trên body đơn thuần sẽ bị các utility cố định ghi đè.

**Đề xuất:** thống nhất các vai trò `body`, `label`, `metadata`, `card-title`, `price`, `button`, `section-title`. Web/app dùng cùng quy tắc về thứ bậc, còn đơn vị và hành vi co giãn tuân theo nền tảng. Giữ Be Vietnam Pro trước; chưa có bằng chứng font-family là nguyên nhân chính.

### F03 · P1 · Trang chủ chưa cho cảm giác có một marketplace đang hoạt động

Ảnh 01/07 và native-home-empty cho thấy phần đầu là tìm kiếm, danh mục và thông báo rỗng. Không có ảnh tác phẩm/hồ sơ/giá thực để hình thành tin tưởng. Web desktop vẫn giữ cấu trúc hero hai cột, nên vùng phải trống rất lớn. Các khối “Đăng yêu cầu” bị lặp lại thay vì tạo bước tiến mới.

**Đề xuất:** thiết kế các trạng thái riêng: có nguồn cung; chưa phục vụ khu vực; bộ lọc quá hẹp; dữ liệu lỗi; đang tải. Khi chưa có nguồn cung, dùng bố cục gọn có một hành động rõ và giải thích chính xác việc gì xảy ra tiếp theo. Có thể cho xem bảng giá tham khảo nếu catalogue hỗ trợ, nhưng phải ghi rõ đó không phải cam kết có người nhận. Không dùng hồ sơ giả để làm màn hình có vẻ đông.

### F04 · P1 · Source web có thể biến lỗi tải thành “chưa có dịch vụ”

[lib/api/snapshot.ts:244–246](</Users/alexle/Documents/đẹp-radar/lib/api/snapshot.ts:244>) ghi log lỗi rồi trả `data ?? []`; home suy ra “Sắp có” từ không có offer tại [app/home-view.tsx:106](</Users/alexle/Documents/đẹp-radar/app/home-view.tsx:106>), và render trạng thái thiếu nguồn cung tại `:174–175`.

**Phạm vi kết luận:** đã xác nhận rủi ro từ source. Chưa biết zero inventory live là thiếu đối tác, điều kiện xuất bản/lịch/giá, hay lỗi đọc dữ liệu. Không kết luận database rỗng hoặc backend đang lỗi.

**Đề xuất:** data contract phải phân biệt thành công-rỗng, lỗi, tải, dữ liệu cũ. Cho thử lại/giữ dữ liệu gần nhất khi phù hợp. Chỉ viết “Chưa có ai” khi đã xác nhận truy vấn thành công.

### F05 · P1 · Tìm kiếm tiêu tốn quá nhiều diện tích trước khi người dùng thấy lựa chọn

Ảnh 09: thanh search + ngành + 13 ô danh mục + bộ lọc + ba tab đẩy phần kết quả xuống nửa dưới màn hình. Ảnh 03: danh mục cuối rơi lẻ xuống hàng mới trên desktop. Ở 320px tên danh mục và tab bị cắt (ảnh 13).

**Đề xuất:** mặc định đi theo một đường chính: chọn dịch vụ → xem người phù hợp/giá → chọn gói và giờ. Để 4–6 lựa chọn phổ biến và “Tất cả dịch vụ”; chuyển bộ lọc chi tiết vào sheet. Thu gọn lựa chọn đang áp dụng thành tóm tắt. Không ép mọi tên vào một dòng 12px. Phân biệt chế độ xem tác phẩm để lấy cảm hứng với chế độ so sánh để đặt dịch vụ.

### F06 · P2 · Điều hướng và thuật ngữ chưa nhất quán

Desktop có “Người làm / Đã lưu”, mobile có “Tìm / + / Tôi” ([components/layout/app-shell.tsx:24–49](</Users/alexle/Documents/đẹp-radar/components/layout/app-shell.tsx:24>)). Trang `/pros` mặc định Nail ([app/pros/pros-view.tsx:58–69](</Users/alexle/Documents/đẹp-radar/app/pros/pros-view.tsx:58>)), dù người dùng chưa chọn ngành. Cùng “Photophone” ở nơi này, “Chụp điện thoại” ở nơi khác. Dấu cộng ở giữa thanh mobile nổi bật nhưng web không có chữ thường trực giải thích hành động.

**Đề xuất:** thống nhất tên và vị trí các mục theo nhiệm vụ khách/đối tác. Thay thuật ngữ khó hiểu bằng “Chụp bằng điện thoại”; nút đăng có tên hành động rõ. Không bắt buộc desktop và app giống hệt bố cục, nhưng cùng một nhiệm vụ cần có tên nhất quán.

### F07 · P1 · App hạn chế người dùng tăng cỡ chữ

[apps/mobile/src/ui/text.tsx:38](</Users/alexle/Documents/đẹp-radar/apps/mobile/src/ui/text.tsx:38>) đặt `maxFontSizeMultiplier={1.4}` cho thành phần Txt dùng chung. Body 15pt và meta 13pt; các trường quan trọng như giá/người làm/thời lượng dùng meta. Tên danh mục còn có thể tự co từ 13pt xuống 10,4pt qua `minimumFontScale={0.8}` tại [apps/mobile/src/components/category-icon.tsx:74](</Users/alexle/Documents/đẹp-radar/apps/mobile/src/components/category-icon.tsx:74>). Chưa thay cài đặt text size của simulator để đo clipping; giới hạn 1,4× được xác nhận từ code.

**Đề xuất:** hỗ trợ Dynamic Type/font scaling theo vai trò, cho layout tăng chiều cao, giảm nội dung cùng một hàng, tránh co chữ thiết yếu. Test cỡ mặc định, lớn, và mức trợ năng lớn; không chỉ bỏ giới hạn 1,4× rồi để text đè nhau.

### F08 · P2 · Một số vùng chạm nhỏ, khác nhau giữa web và app

Native small button 36pt tại [apps/mobile/src/ui/button.tsx:31](</Users/alexle/Documents/đẹp-radar/apps/mobile/src/ui/button.tsx:31>); chip 36pt tại [apps/mobile/src/ui/bits.tsx:87](</Users/alexle/Documents/đẹp-radar/apps/mobile/src/ui/bits.tsx:87>), không có hitSlop ở thành phần tương ứng. Web switch 48×28px ([components/ui.tsx:377](</Users/alexle/Documents/đẹp-radar/components/ui.tsx:377>)). Các button/chip nhỏ trên web có pseudo-element mở rộng hit area, vì vậy không được suy ra diện tích click chỉ từ chiều cao nhìn thấy.

**Đề xuất:** mục tiêu vùng bấm 44pt trên iOS, 48dp trên Android, web touch khoảng 44–48px; giữ khoảng cách tránh chồng hit area. Ưu tiên filter, chọn gói, lịch/giờ và các thao tác liên quan thanh toán. Không quy mọi điều khiển dưới 44px thành vi phạm WCAG AA 2.2; chuẩn target tối thiểu còn có ngưỡng và ngoại lệ riêng.

### F09 · P2 · Một số tín hiệu accessibility cụ thể bị yếu

**Live:** city picker nhận focus nhưng không thấy vị trí bàn phím (ảnh 14). Select ở [app/home-view.tsx:550–563](</Users/alexle/Documents/đẹp-radar/app/home-view.tsx:550>) có opacity 0, wrapper không có focus ring. Sheet bộ lọc thì hoạt động tốt: Escape đóng và trả focus đúng.

**Source:** custom radio danh mục/ngành/giá dùng role radio nhưng thiếu điều hướng bằng mũi tên và roving tabindex; vẫn dùng được Tab/Space. Switch tắt có tương phản track/thumb trên trắng khoảng 1,35:1, thấp hơn mốc 3:1 cho dấu hiệu điều khiển cần nhận biết. Nút Theo dõi ở hover dùng accent trên accentSoft khoảng 4,28:1, thấp hơn 4,5:1 cho chữ thường.

**Đề xuất:** focus-visible trên wrapper thật, native radio hoặc keyboard pattern đầy đủ, track/stroke off rõ hơn và accentDark cho trường hợp hover. Không đổi màu thương hiệu toàn bộ.

### F10 · P2 · “Giá từ”, “Cấp độ”, “Master” dễ gây hiểu khác

Ảnh 10: tiêu đề “Giá từ” nhưng lựa chọn “Dưới 300.000đ / Dưới 500.000đ”; code thực tế lọc theo giá khởi điểm tối đa. Ảnh 02 dùng tiêu đề “Cấp độ”, sau đó cần một câu giải thích mức giá tự chọn. Badge “Nail · Master” trong [components/beauty.tsx:321–334](</Users/alexle/Documents/đẹp-radar/components/beauty.tsx:321>) chỉ giải thích qua tooltip/screen-reader; trên touch screen dễ bị hiểu là nền tảng chứng nhận tay nghề.

**Đề xuất:** “Ngân sách” hoặc “Giá khởi điểm tối đa”; mức giá hiển thị rõ là do đối tác chọn. Tách mức giá, danh tính đã xác minh, đánh giá và số lịch hoàn thành thành các dấu hiệu riêng. Giữ nguyên logic ba mức giá khi chỉnh cách trình bày.

### F11 · P2 · Có hành vi điều hướng/lọc chưa khớp lời hứa

Source [app/search/search-view.tsx:422–425](</Users/alexle/Documents/đẹp-radar/app/search/search-view.tsx:422>) cho chọn “Gần bạn nhất” khi có địa chỉ, nhưng danh sách dịch vụ tại `:107–117` chỉ xử lý sort theo giá; chọn near vẫn trả thứ tự cũ. Đây là lỗi logic từ source, chưa tái hiện với phiên khách có địa chỉ và dữ liệu thật.

Profile tại [app/pros/[id]/pro-profile.tsx:265–269,310–327](</Users/alexle/Documents/đẹp-radar/app/pros/[id]/pro-profile.tsx:265>) vẫn cho CTA Đặt lịch khi người làm tạm ngừng nhận lịch; chặn ở trang book sau đó ([app/book/[proId]/page.tsx:360,940](</Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:360>)). Điều này tạo lượt đi thừa.

**Đề xuất:** chỉ cung cấp cách sắp xếp thật sự có hiệu lực; nếu người làm chưa nhận lịch, giải thích ngay tại profile và đưa lựa chọn phù hợp khác.

### F12 · P2 · Đăng nhập và onboarding cần bớt gánh nặng đọc

Form đăng nhập nhìn sạch, hỗ trợ Apple/Google và mật khẩu, nhưng label/hint nhỏ và nhiều nội dung giải thích dồn cuối màn hình. Sau khi chọn Tạo tài khoản, heading vẫn “Đăng nhập” (ảnh 06). Đối tác landing là một chuỗi card dài chủ yếu bằng chữ (ảnh 11).

Web onboarding hiện có hai lớp padding ([components/layout/app-shell.tsx:150](</Users/alexle/Documents/đẹp-radar/components/layout/app-shell.tsx:150>), [app/studio/onboarding/page.tsx:48](</Users/alexle/Documents/đẹp-radar/app/studio/onboarding/page.tsx:48>)), progress là link dạng pill 12px ([components/partner-progress.tsx:26](</Users/alexle/Documents/đẹp-radar/components/partner-progress.tsx:26>)), một số control chia đôi chiều ngang. Native cũng cần rà các nhóm chip, nơi phục vụ và nhập giờ bằng text; xem NATIVE-NOTES.md.

**Đề xuất:** heading theo trạng thái, hướng dẫn theo ngữ cảnh; onboarding một mục tiêu mỗi bước, “Bước 2/6”, lưu và tiếp tục rõ, preview hồ sơ trước gửi duyệt. Giữ khả năng tiếp tục bản nháp. Các nội dung phí/chính sách cần đầy đủ nhưng trình bày tại thời điểm ra quyết định.

### F13 · P1 · Người muốn làm đối tác không thấy lối vào khi chưa đăng nhập app

Ảnh native-account-signed-out cho thấy tab Tôi chỉ có cổng đăng nhập dành cho khách. Source [apps/mobile/src/app/(tabs)/toi.tsx:24](</Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/(tabs)/toi.tsx:24>) return SignInGate trước khi link đối tác tại `:153` được render. Người mới chưa thể đọc lợi ích, phí và yêu cầu đăng ký ngay trong luồng guest đã kiểm tra.

**Đề xuất:** thêm lối vào phụ “Dành cho đối tác” trên trang tài khoản khi chưa đăng nhập, cho xem giới thiệu và các bước trước khi yêu cầu tạo tài khoản. Không cần trộn dashboard đối tác vào màn chính của khách.

### F14 · P2 · Một số thao tác native còn cảm giác form kỹ thuật

Các lịch bổ sung dùng input `YYYY-MM-DD` / `HH:mm` trong [apps/mobile/src/app/book/[proId].tsx:438](</Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/book/[proId].tsx:438>); onboarding giờ làm ở [apps/mobile/src/app/ho-so-doi-tac.tsx:106](</Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/ho-so-doi-tac.tsx:106>) cũng nhập text. Trong khi đó bước chọn giờ chính đã có slot picker. Settings đối tác tại [apps/mobile/src/app/studio/toi.tsx:133](</Users/alexle/Documents/đẹp-radar/apps/mobile/src/app/studio/toi.tsx:133>) đánh dấu cả đường native như external; ghi chú `:146` nói các mục chưa có native dù một số đã được triển khai.

**Đề xuất:** dùng lại date/time picker và phản hồi giờ khả dụng; áp dụng giờ cho nhiều ngày; nhãn điều hướng đúng đích đến. Với mục thật sự mở web, giải thích và kiểm tra khả năng tiếp tục phiên đăng nhập. Đây là kết luận source, chưa tương tác qua tài khoản đối tác.

## Hướng hình ảnh đề xuất

Giữ logo, màu thương hiệu và Be Vietnam Pro. Chuyển trọng tâm sang **tác phẩm thật, thông tin dễ đọc và khả năng đặt rõ ràng**.

- Trang chủ: lời mở ngắn; dịch vụ phổ biến; tác phẩm/người làm thật; giá, khu vực và khả năng nhận lịch nổi bật. Desktop cần một bố cục có chủ đích khi thiếu ảnh, không giữ nửa hero trống.
- Card khám phá: ảnh 4:5 có chất lượng và crop nhất quán; tên 17–18px; giá rõ; người làm/đánh giá không bị chìm. Khi cần so sánh, cân nhắc card một cột thay vì nhét toàn bộ vào card hai cột.
- Profile: ảnh đại diện/tác phẩm, chuyên môn, khu vực, tín hiệu tin cậy, gói giá và lịch khả dụng theo đúng thứ tự người dùng quyết định. Một CTA chính bám đáy trên điện thoại.
- Màu: nền sáng ấm, chữ nâu đậm, accent hiện có; giới hạn số surface pastel lồng nhau. Cảm giác cao cấp đến từ ảnh, thứ bậc và nhịp khoảng cách; chưa có lý do thêm gradient/blur/animation dày đặc.
- Motion: phản hồi bấm, chuyển sheet, skeleton và trạng thái lưu ngắn/gọn. Tôn trọng reduced motion.

Đây là hướng thiết kế đề xuất, chưa tạo mockup hoặc thay giao diện. Cần chốt hướng qua những màn cụ thể trước khi triển khai diện rộng.

## Thứ tự thực hiện đề xuất

| Đợt | Việc cần làm | Điều kiện đạt |
|---|---|---|
| 1 — Dễ đọc và đúng trạng thái | Typography dùng chung; tăng chữ quan trọng; hit area; focus; switch; tách loading/error/empty; bỏ CTA trống trùng nhau. | Đọc được thông tin chính ở 390px; danh mục không bị cắt mất nghĩa; không gọi lỗi mạng là “chưa có người làm”. |
| 2 — Luồng khám phá và hình ảnh | Thiết kế lại home, search, card dịch vụ, profile, booking; thống nhất tên/mức giá; xử lý near sort và unavailable provider. | Khách hiểu dịch vụ nào, ai làm, giá nào, bao giờ đặt được; mỗi màn có một bước tiếp rõ. |
| 3 — App và đối tác | Dynamic Type, điều khiển native, bàn phím/safe area; onboarding sáu bước và dashboard công việc. | Không cắt chữ hoặc che CTA ở text lớn/bàn phím mở; lưu/tiếp tục bước đúng; web/app thống nhất thuật ngữ. |
| 4 — Kiểm tra trước phát hành | Dữ liệu đại diện có/không/lỗi; Safari iPhone, Android nhỏ, desktop; VoiceOver/TalkBack; luồng từ tìm đến xác nhận. | Có screenshot + kết quả tương tác thật cho từng trạng thái quan trọng; không chỉ dựa vào build/test xanh. |

## Tiêu chí kiểm tra cho bản sửa

- Web 320, 390, 430, 768, 1280, 1440px; zoom 200% và kiểm tra reflow 400% khi phù hợp. Không mất giá, CTA, error hoặc nội dung thiết yếu.
- iOS/Android: text mặc định và trợ năng lớn, bàn phím mở, safe area, cuộn nội dung dài; chụp bằng chứng trên binary chứa thay đổi.
- Kiểm tra một chuỗi có dữ liệu thật được phép dùng: tìm → lọc → profile → gói → giờ → tổng tiền/điều kiện → xác nhận. Không tạo giao dịch thật trong audit chỉ đọc.
- Phân biệt 0 kết quả do filter, 0 nguồn cung, dữ liệu đang tải, lỗi, offline, người làm ngừng nhận lịch. Có đường thoát phù hợp cho từng trạng thái.
- Contrast chữ thường ≥4,5:1, chữ lớn và dấu hiệu điều khiển thiết yếu ≥3:1; đo theo màu/pixel thực ở từng trạng thái.
- Keyboard: nhìn thấy focus, thứ tự hợp lý, radio bằng mũi tên, dialog trả focus; VoiceOver/TalkBack đọc tên-vai trò-trạng thái của control.

## Những nền tảng tốt nên giữ

Be Vietnam Pro hỗ trợ tiếng Việt; logo/palette có tính nhận diện; màu chữ muted trên canvas khoảng **5,28:1**, inkSoft/canvas **6,38:1**, trắng/accent **5,17:1** — các cặp này đủ tương phản chữ thường. Web có skip link, reduced motion, dialog và tab keyboard; icon button native có vùng chạm 44pt. Một số luồng có running total, thông báo trạng thái và tiếp tục sau đăng nhập. Vì vậy nên sửa hệ thống và những màn quan trọng trên nền hiện có.

## Giới hạn còn lại

Chưa kiểm tra trên iPhone/Android vật lý, TalkBack/VoiceOver thực, Dynamic Type lớn, thanh toán, thông báo push, tốc độ mạng yếu, analytics/chuyển đổi, hoặc tài khoản khách/đối tác đã đăng nhập. Không kết luận WCAG toàn bộ, store release, hay dữ liệu backend hiện tại. Chưa sửa code sản phẩm, migrate, push, deploy hay gen artwork.

Toàn bộ screenshot trong thư mục này được chụp trong lần audit hiện tại. Bản HTML `AUDIT.html` trình bày báo cáo và gallery ảnh theo thứ tự; `NATIVE-NOTES.md` ghi riêng quan sát app và giới hạn phiên bản.

Simulator đã được tắt sau khi kiểm tra; xác nhận cả 7 máy đều Shutdown.
