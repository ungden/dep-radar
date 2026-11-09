# Audit source native — 360dep

- Ngày: **09/11/2026**, múi giờ **Asia/Ho_Chi_Minh**.
- Branch: `feat/spa-venues`.
- Commit: `d3080516a0bb0ef9b4bc00c5465f0508894f3bba`.
- Phạm vi: source hiện tại trong `apps/mobile`; Khám phá, tìm kiếm, Artist, chi tiết dịch vụ, hồ sơ, đặt lịch, đăng nhập và component dùng chung.
- **Toàn bộ nhận xét trong tài liệu này là SOURCE-ONLY**: đã đọc source, chưa tự xác nhận hình ảnh, hành vi trên thiết bị, VoiceOver hoặc TalkBack. Screenshot do luồng audit chính chụp là nguồn bằng chứng riêng; không dùng ảnh cũ để chứng minh trạng thái hiện tại.
- Không thay đổi application code, không chạy simulator/server/test trong phần audit source này. Lúc kiểm tra Git không có file tracked bị sửa; có hai mục untracked đã tồn tại: `docs/store-assets/2026-10-28/` và `scripts/gen-store-assets-20261028.mjs`.

## Ưu tiên cải thiện

### 1. P1 · CTA “Chọn giờ” mở lại chọn dịch vụ

**SOURCE-ONLY — hành vi được khai báo trong code.** Hồ sơ spa dùng CTA “Chọn giờ”, Artist dùng “Chọn lịch”, nhưng màn đích luôn bắt đầu `step = 1`: “Chọn món”; tiếp theo là “Giỏ của bạn”, đến bước 3 mới chọn giờ. Người đã chọn gói ở hồ sơ vẫn đi qua hai màn trung gian. Đây là lệch giữa lời hứa của CTA và màn kế tiếp.

- Bằng chứng: [CTA hồ sơ](../../../apps/mobile/src/app/pros/[id].tsx#L499), [khởi tạo bước](../../../apps/mobile/src/app/book/[proId].tsx#L63), [tiêu đề và nội dung từng bước](../../../apps/mobile/src/app/book/[proId].tsx#L290).
- Hướng ref: giữ gói đã chọn trong một dòng tóm tắt; “Chọn giờ” mở lịch ngay. “Thêm dịch vụ” là hành động phụ. Đổi “món” thành “dịch vụ” để khớp ngữ cảnh làm đẹp.

### 2. P1 · Giá và thứ tự “Giá thấp” có thể lệch nhu cầu đang lọc

**SOURCE-ONLY — đường dữ liệu xác định được.** Trong tìm kiếm Artist, lọc ngân sách tính trên các listing phù hợp danh mục/nơi làm; sắp xếp giá và giá trên thẻ lại dùng `browse.priceOf(pro.id)` không truyền dịch vụ/danh mục. Hàm này lấy giá thấp nhất của mọi dịch vụ chính. Nếu một Artist có nhiều nghề, người lọc makeup có thể thấy giá thấp của nail và thứ tự theo giá đó.

- Bằng chứng: [lọc và sắp xếp](../../../apps/mobile/src/app/tim.tsx#L110), [giá trên thẻ](../../../apps/mobile/src/app/tim.tsx#L308), [priceOf](../../../apps/mobile/src/state/derived.ts#L66), [fromPrice](../../../apps/mobile/src/data/public.ts#L274).
- Hướng ref: thẻ luôn ghép tên gói, thời lượng và giá của đúng nhu cầu. Tiêu chí sắp xếp phải dùng cùng giá hiển thị và cùng phạm vi bộ lọc.
- Chưa kiểm chứng tình huống này bằng dữ liệu và thao tác trên runtime.

### 3. P1 · Giá theo người nổi bật, điều kiện số lượng tối thiểu bị ẩn

**SOURCE-ONLY — điều kiện render.** Home dùng `brief` cho ServiceTile nên không render dòng “tối thiểu N người”, trong khi vẫn hiện giá đơn vị theo người. CatalogTile không hiển thị số lượng tối thiểu. ArtistCard nhận một số tiền và không biểu diễn đơn vị hay tên gói đi kèm. Với gói nhóm, mức chi tối thiểu có thể cao hơn con số khách thấy đầu tiên.

- Bằng chứng: [brief trên home](../../../apps/mobile/src/app/(tabs)/index.tsx#L87), [giá và điều kiện brief](../../../apps/mobile/src/components/tiles.tsx#L109), [CatalogTile](../../../apps/mobile/src/components/tiles.tsx#L153), [giá ArtistCard](../../../apps/mobile/src/components/tiles.tsx#L314).
- Hướng ref: ưu tiên tổng tối thiểu như “Từ 900.000đ / nhóm 3 người”; đơn giá 300.000đ/người là dòng phụ. Ví dụ là dữ liệu minh họa cho cấu trúc, không phải mức giá đã xác nhận.

### 4. P1 · Nguồn cung có sẵn và danh mục chưa có người nhận thiếu khác biệt trực quan

**SOURCE-ONLY — cấu trúc nội dung.** Home trộn ServiceTile với CatalogTile trong cùng lưới. CatalogTile hiển thị ảnh minh họa, tên, giá nhưng không hiển thị “chưa có người nhận”. CategoryRail chỉ nói trạng thái đó trong `accessibilityLabel`; nhãn nhìn thấy vẫn giống danh mục đang có nguồn cung. Luồng đặt theo dịch vụ đưa cảnh báo chờ lâu ở bước xác nhận.

- Bằng chứng: [lưới hỗn hợp](../../../apps/mobile/src/app/(tabs)/index.tsx#L84), [CatalogTile](../../../apps/mobile/src/components/tiles.tsx#L153), [trạng thái chỉ trong accessibilityLabel](../../../apps/mobile/src/components/tiles.tsx#L395), [cảnh báo ở xác nhận](../../../apps/mobile/src/app/yeu-cau/moi.tsx#L371).
- Hướng ref: phân biệt “Đang có chuyên viên” với “Gửi nhu cầu, chờ người nhận” ngay trên thẻ. Không để ảnh và giá tạo kỳ vọng đặt chắc chắn khi chưa có người nhận.

### 5. P2 · Khám phá yêu cầu hiểu hai cơ chế đặt quá sớm

**SOURCE-ONLY — thứ tự section.** Sau hàng danh mục là hai khối “Đặt theo dịch vụ” và “Tự chọn Artist”; danh sách dịch vụ nằm dưới. Chi tiết dịch vụ tiếp tục lặp lựa chọn “Để Artist nhận đơn” và “Hoặc tự chọn Artist”. Khách phải hiểu cách phân phối đơn trước khi biết gói, giá và bằng chứng chất lượng.

- Bằng chứng: [hai cách đặt trên home](../../../apps/mobile/src/app/(tabs)/index.tsx#L126), [lặp lại ở chi tiết](../../../apps/mobile/src/app/dich-vu/[id].tsx#L161).
- Hướng ref: ưu tiên nhu cầu “Hôm nay bạn muốn chăm sóc gì?”, giá và nơi phục vụ; lựa chọn người làm xuất hiện sau khi khách đã chọn dịch vụ. Giữ hai khả năng đặt nhưng giảm việc bắt khách quyết định sớm.

### 6. P2 · Thẻ Artist nhiều lớp và dùng ảnh minh họa làm bìa người chưa có tác phẩm

**SOURCE-ONLY — thành phần và fallback.** Thẻ ghép collage cao 180pt, avatar chồng ảnh, badge, tên, sao, địa điểm, nhiều chip dịch vụ, divider, giá và CTA. Khi không có tác phẩm, ảnh minh họa vẫn làm bìa của một Artist có tên cụ thể. Code có nhãn “Ảnh minh hoạ” và “Chưa đăng tác phẩm”; không phải che giấu, nhưng có nguy cơ khách gán chất lượng ảnh cho người làm trước khi đọc nhãn.

- Bằng chứng: [ArtistCard](../../../apps/mobile/src/components/tiles.tsx#L249), [fallback ảnh minh họa](../../../apps/mobile/src/components/tiles.tsx#L272).
- Hướng ref: một ảnh thật chủ đạo; khi chưa có portfolio dùng avatar và trạng thái rõ. Giữ ba dữ kiện quyết định lựa chọn, giảm chip và các tầng khung. Mức độ rối thực tế cần đối chiếu screenshot hiện tại.

### 7. P2 · Hồ sơ đang tải có thể chỉ hiện vùng trống

**SOURCE-ONLY — nhánh loading.** Khi chưa có `pro` và `searching = true`, màn trả về View có khoảng đệm và không render skeleton, spinner hay mô tả đang tải.

- Bằng chứng: [nhánh không có pro](../../../apps/mobile/src/app/pros/[id].tsx#L94).
- Hướng ref: skeleton hồ sơ có chiều cao ổn định, lỗi kèm thử lại và đường về. Cần thao tác mạng chậm để xác nhận thời gian và mức độ xuất hiện.

### 8. P2 · Đăng nhập có nhiều lớp trước form, copy chưa nhất quán

**SOURCE-ONLY — thứ tự nội dung và copy.** Màn gồm tiêu đề, mô tả, tabs, khối điều khoản dài, Apple/Google, separator rồi đến tài khoản/mật khẩu. Separator ghi “hoặc dùng email” nhưng field nhận email hoặc số điện thoại. Tài khoản chỉ có số điện thoại phải liên hệ Zalo nếu quên mật khẩu; thông tin đó có trong hint khi đăng ký.

- Bằng chứng: [thứ tự màn hình](../../../apps/mobile/src/app/login.tsx#L160), [điều khoản](../../../apps/mobile/src/app/login.tsx#L191), [separator và field](../../../apps/mobile/src/app/login.tsx#L246), [recovery qua hỗ trợ](../../../apps/mobile/src/app/login.tsx#L142).
- Hướng ref: một hành động chính rõ, điều khoản ngắn với liên kết, copy đồng nhất về phương thức. Không đưa phương thức đăng nhập chưa được backend hỗ trợ vào thiết kế như một tính năng sẵn có.

### 9. P2 · Rủi ro cắt chữ khi tăng cỡ chữ hệ thống

**SOURCE-ONLY — rủi ro accessibility, chưa thấy clipping thực tế.** `Txt` tăng cả fontSize và lineHeight theo hệ thống; PhotoBadge giữ chiều cao 22pt, phần trong Pill giữ 36pt, CountBadge giữ 18pt. Text scale lớn có thể vượt các khung cố định. Một số dòng giá và tên còn dùng `numberOfLines={1}`.

- Bằng chứng: [text scaling](../../../apps/mobile/src/ui/text.tsx#L35), [PhotoBadge](../../../apps/mobile/src/components/tiles.tsx#L64), [Pill](../../../apps/mobile/src/components/tiles.tsx#L198), [CountBadge](../../../apps/mobile/src/ui/button.tsx#L97).
- Hướng ref: xác định min-height thay vì chiều cao cố định, cho nhãn cần thiết xuống dòng; kiểm chứng cỡ chữ lớn trên cả iOS/Android.

### 10. P2 · Thông báo lỗi và trạng thái busy cần kiểm chứng với screen reader

**SOURCE-ONLY — thiếu khai báo tại component chung.** ErrorNote là View/Text, chưa khai báo alert/live region hay cơ chế chuyển focus. Button khi busy disable và hiển thị spinner nhưng không truyền `accessibilityState.busy` tại wrapper. Chưa thể kết luận VoiceOver/TalkBack thực tế bỏ qua trạng thái vì nền tảng có hành vi mặc định riêng.

- Bằng chứng: [ErrorNote](../../../apps/mobile/src/ui/bits.tsx#L268), [Button](../../../apps/mobile/src/ui/button.tsx#L37).
- Hướng kiểm chứng: thử lỗi submit, lỗi tải giờ và busy với VoiceOver/TalkBack; đảm bảo người dùng nghe được thay đổi và biết cách phục hồi.

## Ràng buộc nên giữ khi tạo ảnh ref

- **Giữ chữ dễ đọc.** Comment source ghi rõ đã tăng typography ngày 03/11 vì chủ sản phẩm thấy khó đọc: body 17pt, meta 15pt, title 20pt, heading 24–30pt. Không chữa mật độ bằng cách thu nhỏ chữ; bớt section, bớt chip, rút gọn nội dung. Nguồn: [type scale](../../../apps/mobile/src/ui/text.tsx#L7).
- Native hiện dùng Inter; canvas `#F3F0EA`, surface `#FFFFFF`, accent `#BB3460`, accentSoft `#FCEAF0`, ink `#141213`; gutter 20pt. Có thể giảm diện tích nền hồng ở chrome và để ảnh thật dẫn mắt. Nguồn: [native theme](../../../apps/mobile/src/theme.ts#L11), [shared tokens](../../../lib/design/tokens.ts#L16).
- Dùng thông tin giá và nguồn cung rõ ràng; ảnh tạo cho concept phải được hiểu là minh họa, không đại diện tác phẩm hay doanh nghiệp có thật.
- Những điểm tốt đã có trong source cần giữ: button 44–56pt, icon button 44pt; sheet đo chiều cao footer; booking giữ lựa chọn khi đi đăng nhập; quote được server xác nhận lại; lỗi backend qua mapping tiếng Việt.

## Những điều không nên báo thành lỗi

- Artist đổi từ sắp xếp gần nhất sang đánh giá khi chưa có vị trí **đã có UI thể hiện effective sort và lời mời bật vị trí**. Không kết luận đây là fallback âm thầm: [artist.tsx](../../../apps/mobile/src/app/(tabs)/artist.tsx#L139).
- Không kết luận app hiện nguyên lỗi kỹ thuật tiếng Anh: [messageFor](../../../apps/mobile/src/data/supabase.ts#L93) đã lọc các dạng lỗi và giữ thông điệp tiếng Việt.
- Không tuyên bố toàn app đạt hoặc không đạt accessibility dựa trên source/screenshot.

## Kiến trúc và đường chạy để đối chiếu

- Expo Router, Expo SDK 57, React Native 0.86.3; Next.js web là ứng dụng riêng cùng repository.
- Scheme `dep360`; iOS bundle identifier và Android package `vn.dep360.app`; app config version `1.4.0`.
- Customer tabs: **Khám phá / Artist / Lịch hẹn / Tôi**; chế độ đối tác nằm dưới `/studio`.
- `apps/mobile` có các script `npm run ios`, `npm run android`, `npm run web` dùng `expo start` với platform flag. OAuth cần development build phù hợp thay vì mặc định Expo Go.
- Không tự khởi chạy môi trường hoặc tạo simulator trong audit source này.
