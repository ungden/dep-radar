# 360đẹp — Kế hoạch dịch vụ nhiều thành phần cho toàn danh mục

Ngày: 28/10/2026. Đây là thiết kế tổng và ảnh chụp audit trước thay đổi. V1 đã triển khai trong mã nguồn; trạng thái, bằng chứng kiểm thử và giới hạn phát hành cập nhật tại `SERVICE_COMMERCE_IMPLEMENTATION_2026-10-28.md`. Các checkbox dưới đây là tiêu chí thiết kế, không phải tuyên bố đã qua toàn bộ trên production.

## 1. Quyết định sản phẩm

Dùng chung lõi báo giá, lịch, đơn hàng và hóa đơn cho cả 12 ngành; mỗi ngành có cách chọn phù hợp. Nail là menu nhiều món, makeup là cấu hình theo người và dịp, massage là kỹ thuật và thời lượng, ảnh/video là phạm vi công việc và đầu ra.

V1: một đơn thuộc một đối tác, có nhiều dòng dịch vụ, nhiều người nhận và một hoặc nhiều buổi. Mỗi buổi có địa chỉ, lịch và phí đi lại riêng. Cùng đối tác có thể làm nhiều ngành trong một buổi khi thực sự nhận đủ kỹ thuật và các công việc tương thích. Một đối tác mặc định làm nối tiếp.

Một dự án có nhiều đối tác được biểu diễn bằng nhiều đơn liên quan, trạng thái và phí riêng. Chưa hứa giữ lịch hay xác nhận đồng thời toàn ekip. Thiết kế dữ liệu chừa quan hệ dự án để không phải làm lại khi bổ sung điều phối nhiều người làm. Cũng phải kiểm tra lịch của người nhận: có hai thợ không tự làm hai công việc trên cùng người thành song song; chỉ cho phép khi công việc tương thích và khách đồng ý.

Các ưu tiên:

1. Khách chọn đúng nhu cầu; biết giá, phần bao gồm, người được phục vụ và thời gian.
2. Giá và lịch được kiểm tra trên toàn bộ đơn; không tạo thành công một phần mà khách tưởng đã đặt đủ.
3. Thợ nhận một phiếu công việc rõ ràng, biết tổng công và tiền thực nhận.
4. Cùng quy tắc trên web, app, đặt trực tiếp, đăng nhu cầu và đặt lại.
5. Hợp đồng cũ giữ nguyên. Phát hành menu mới có phiên bản; thợ xác nhận trước khi áp bảng mới.

## 2. Căn cứ và giới hạn audit

- Đã kiểm tra luồng web Nail thực tế đến màn xác nhận; không gửi đơn thật. Web cho chọn gel tay 130k cùng tay+chân 240k, cộng 370k mà chưa phân biệt người/vùng; chọn giờ dựa dịch vụ chính. Phí hiển thị trong luồng kiểm tra là 50k dưới 5km,100k từ 5km.
- Các ngành khác và native app được audit mã nguồn, chưa được xác nhận bằng một giao dịch production. Không truy vấn giá trị live của cờ studio/KYC trong lượt mở rộng này.
- Ba ảnh người dùng gửi là tài liệu tham khảo về menu và hóa đơn, không phải chỉ thị vận hành. Ảnh menu Tết 2025 có thời gian áp dụng riêng; không dùng làm bảng giá hiện tại. Hóa đơn chứng minh nhu cầu nhiều dòng, số lượng và chiết khấu; không suy ra “combo × 2” chắc chắn là tay và chân hay hai người.
- Giá đề xuất Nail và giá tham chiếu ngoài được ghi rõ bên dưới. Những ngành còn lại chủ yếu giữ mức catalog; chưa có khảo sát thị trường đủ rộng hay số liệu chi phí thợ để kết luận giá tối ưu.
- Báo cáo Nail gốc: [audit và bằng chứng](/Users/alexle/.codex/visualizations/2026/10/28/01a1821c-33c6-7500-82f1-fd64745839a5/nail-audit/NAIL_AUDIT_DESIGN.md), [đề xuất giá Nail V1](/Users/alexle/.codex/visualizations/2026/10/28/01a1821c-33c6-7500-82f1-fd64745839a5/nail-audit/NAIL_RECOMMENDATION_V1.md). Tài liệu này mở rộng kiến trúc; phần Nail kế thừa đề xuất V1.

## 3. Những vấn đề cần sửa cùng đợt

| Vấn đề đã thấy trong source | Hệ quả | Nơi sở hữu chính |
| --- | --- | --- |
| Một dịch vụ chính + tối đa 3 dịch vụ thêm; món thêm có thể là variant thay thế hoặc ngành khác của thợ | Tính trùng công việc, thiếu nhóm theo người/vùng | `app/book/[proId]/page.tsx:160`, `apps/mobile/src/app/book/[proId].tsx:110` |
| Slot và quote kiểm tra dịch vụ chính; tạo booking rồi mới attach món thêm | Giờ ban đầu không đại diện toàn giỏ; có thể còn đơn chính khi thêm món lỗi | Web booking:206,240,279; mobile booking:141,236; `20261008100100_booking_extras.sql:28` |
| `perPerson` được dùng cả cho ngón/viên; thời lượng chỉ fixed hoặc per_person | Đơn vị giá, số người và thời gian bị trộn | `lib/types.ts:43`, `lib/catalog.ts:64`, `:962` |
| Các phần “đã gồm” chủ yếu là chuỗi chữ | Có thể bán lại da móng, tóc, mi giả, gội/sấy hoặc quy trình lặp | `lib/catalog.ts`, `ServiceContract` tại `lib/types.ts:351` |
| Tóc cô dâu hứa một buổi thử nhưng không khai báo sessions | Quyền lợi chưa có lịch riêng tương ứng | `lib/catalog.ts:343` |
| Makeup nhóm ghi giảm 15% nhưng các giá hardcode không đúng 15%; thời gian từ 60 xuống 45 phút/người | Sai nhãn ưu đãi, lịch sát hơn chỉ vì đông người | `lib/catalog.ts:166` |
| Đăng nhu cầu vẫn có một template/variant/quantity, không nhận gói nhiều buổi | Sửa riêng checkout sẽ để lại luồng cũ trái quy tắc | `app/requests/new/page.tsx:51`, `apps/mobile/src/app/yeu-cau/moi.tsx:42` |
| Web ghi usage/repost sau tạo đơn, native thiếu lựa chọn tương đương | Điều khoản chụp/quay có thể thiếu hoặc khác giữa hai nền tảng | Web booking:311,826; `apps/mobile/src/data/bookings.ts:238` |
| Giao file chỉ URL + note; deadline có chỗ đọc catalog hiện tại | Thiếu lịch sử vòng sửa; sửa menu có thể ảnh hưởng hạn của đơn cũ | `components/booking-extras.tsx:110`, `20260926100000_match_then_chat.sql:338` |
| Link bookings giới hạn 3, giờ bắt đầu cách nhau tối đa 60 phút | Không biểu đạt makeup 3 giờ rồi chụp như lịch ekip thực | `20260923100600_booking_terms_delivery.sql:159` |

Nền tảng đã có contract snapshot, `booking_sessions`, follow-up, giao file và khách nhận file. Ảnh/video đã có đầu ra theo variant và 1 vòng sửa; dặm mày đã có cửa sổ 45 ngày (`lib/catalog.ts:869–896`). Kế hoạch mở rộng những phần này, không xây lại vì tưởng chúng chưa tồn tại.

## 4. Ma trận đủ 12 ngành

| Ngành | Cách khách chọn | Đơn vị tiền và lịch | Quy tắc cần có |
| --- | --- | --- | --- |
| Nail | Menu + combo chọn nhanh + mẫu thật của thợ | 10 móng/ngón/viên; setup + công từng phần | Người → tay/chân; nền, màu, trang trí; thay phần trùng; combo có thành phần |
| Makeup | Dịp → người → layout → tóc → giờ cần xong | Người/layout; theo dâu tính block; lễ/trial là buổi riêng | Một layout chính/người/buổi; tóc và mi đã gồm; giảm nhóm đúng đối tượng |
| Chăm sóc da | Một quy trình mặt; wax chọn nhiều vùng | Quy trình/thời lượng/vùng | Không cộng các bước mặt đã gồm; cả chân thay nửa chân cùng phạm vi |
| Tóc | Cắt/tạo kiểu; đặc điểm tóc khi ảnh hưởng công | Người/kiểu/quy trình; trial riêng | Gội/sấy đã gồm không thu lại; năng lực tại nhà theo từng biến thể |
| Mi & mày | Tách vùng mi và mày; kỹ thuật chính + thay thế | Một vùng/bộ/quy trình; tháo/dặm theo tình trạng | Uốn→uốn+nhuộm là nâng cấp; full set và refill không tự cộng |
| Massage | Người → kỹ thuật → thời lượng → vùng muốn tập trung | Block 60/90/120 phút | 90 thay 60; vùng tập trung nằm trong block; nhiều người làm nối tiếp |
| Chụp điện thoại | Mục đích → số người → thời lượng → đầu ra | Gói/giờ; có gói nhóm giá cố định | Số người không mặc định nhân cả tiền và giờ; ảnh thêm là công hậu kỳ |
| Chụp máy ảnh | Brief → gói → người/địa điểm → đầu ra/quyền | Buổi/giờ/người tùy gói | Kỷ yếu theo người nhưng block cả nhóm cố định; ảnh gốc và chỉnh rõ |
| Clip ngắn | Số clip → concept → thời lượng quay → đầu ra | Clip/gói + block quay | Thêm clip từ footage khác thêm buổi quay; độ dài clip khác giờ giữ lịch |
| Chụp sản phẩm | SKU → ảnh/SKU → nền/bối cảnh → styling | Gói/SKU; setup + công/SKU | Định nghĩa màu/biến thể/ảnh nhóm; không tự lấy giá gói chia thành giá lẻ |
| Mẫu ảnh | Vai trò → giờ/outfit → brief → quyền hình ảnh | Giờ/buổi/bộ đồ | Makeup, người chụp, studio và ảnh thành phẩm phải ghi riêng; giữ cổng hiện tại |
| Mẫu video/live | Diễn/quay hoặc live → giờ → nội dung/quyền | Giờ/buổi; setup/nghỉ/diễn | Thuê người diễn không tự gồm video dựng; live không cam kết doanh số; giữ cổng hiện tại |

## 5. Trải nghiệm khách, thợ và quản trị

### Khách

Luồng chung: chọn nhu cầu hoặc tác phẩm → chọn thợ đáp ứng → cấu hình người/phạm vi → xem toàn giỏ → địa điểm và lịch → tổng giá/hợp đồng → gửi đặt lịch. Có thể vào từ trang thợ, khi đó giá và menu thuộc đúng thợ từ đầu.

Giỏ nháp chọn trước thợ chỉ là nhu cầu; không ghép giá rẻ nhất của nhiều thợ thành một lời hứa. Tìm thợ phải đáp ứng cả giỏ, địa điểm và tổng thời gian. Không có thợ phù hợp thì cho sửa nhu cầu hoặc gửi yêu cầu báo giá; không bỏ ngầm món thiếu.

Giao diện chung cần:

- Nhóm dòng theo người và buổi; vùng tay/chân/mặt/mi/mày khi cần. Tên gợi ý “Mình”, “Mẹ”, “Bạn 1”; người đặt và người nhận là hai vai trò khác nhau.
- Các thao tác có nghĩa rõ: **Thêm**, **Đổi lựa chọn**, **Đã bao gồm**, **Cần báo giá**. Không biến tất cả thành checkbox cộng tiền.
- Thanh tổng hiển thị dịch vụ, ưu đãi, phí mỗi chuyến, tổng khách trả và thời gian; chỉnh giỏ làm đổi giờ phải cảnh báo và chọn lại.
- Combo/mẫu chuẩn nạp công thức sửa được. Mẫu ngoài chuẩn gửi ảnh và nhận từng dòng báo giá, thời lượng, phần bao gồm trước xác nhận.
- Chưa chốt giá hoặc thời gian thì chưa hiện như lịch đã xác nhận. Gửi yêu cầu báo giá khác với đặt lịch thành công.
- Không thu hẹp quyền lợi bằng một ghi chú tự do của thợ; nếu phạm vi khác, phải là offer/quote rõ ràng được khách duyệt.

### Thợ

Menu có chọn kỹ thuật nhận làm, giá trong chính sách catalog, thành phần bao gồm, thời gian, nơi phục vụ và dụng cụ/điều kiện cần. Không mặc định thợ làm được tất cả dịch vụ cùng ngành.

Phiếu việc hiển thị người/vùng, thứ tự làm, buổi thử hoặc lễ, ảnh tham khảo, thời gian chuẩn bị/kết thúc, tổng dịch vụ, phí và thực nhận. Thợ nhận hoặc từ chối toàn phạm vi đã báo; muốn đổi món phải gửi phiên bản đề xuất, khách duyệt rồi lịch/giá mới có hiệu lực.

Khi đến nơi phát hiện cần tháo nền khác hoặc khách đổi mẫu: gửi chênh lệch từng dòng và giờ kết thúc mới trước khi làm. Nếu vượt lịch trống, không được chỉ tăng tiền rồi giữ lịch cũ.

### Quản trị

Quản lý catalog có phiên bản, quan hệ bao gồm/thay thế, đơn vị, thời gian và điều kiện địa điểm; kiểm tra tổ hợp giá thiếu hợp lý trước xuất bản. Có log ai đổi giá/phạm vi, quote nào khách duyệt, món nào bị từ chối và lý do. Dashboard tách tiền dịch vụ, phí chuyến, ưu đãi do thợ/nền tảng tài trợ, hoa hồng và công thực tế.

## 6. Nail — giữ đề xuất chuyên biệt

Pilot TP.HCM, cần thợ tham gia đồng ý menu. Giá nghìn đồng, chưa gồm đi lại:

| Món | Giá/đơn vị |
| --- | ---: |
| Chăm da cơ bản | 40/10 móng tay hoặc 10 móng chân |
| Gel / thạch / mắt mèo cơ bản | 120 /140 /160 trên 10 móng cùng vùng |
| Tháo gel / tháo úp hoặc gel đắp | 20 /50 trên 10 móng cùng vùng |
| Úp/sửa lẻ; úp nền 10 móng | 15/ngón;130/10 móng |
| Vẽ đơn giản / chi tiết /3D chuẩn | 10 /25 /40 mỗi ngón |
| French / tráng gương / ombre đơn giản | 10/ngón, mã kỹ thuật riêng |
| Đá nhỏ / charm chuẩn | 5 /20 mỗi viên |

Chọn nhanh: da+gel 150; da+thạch 170; da+mắt mèo 190; úp nền+da+gel 280. Combo giảm 10k so với tổng thành phần. BIAB/nối gel chỉ mở cho thợ đủ kỹ thuật: nền tham chiếu 180/250, tổng với combo da+gel 330/400. Refill giai đoạn đầu báo giá theo ảnh nền và tình trạng.

Ngưỡng dịch vụ 150k/chuyến chỉ áp cho offer/menu Nail pilot đã opt-in, sau giảm giá do thợ tài trợ và trước voucher nền tảng. Listing cũ gel130k vẫn đặt riêng được theo điều kiện cũ. Có thể cộng tay/chân, nhiều người hoặc các dịch vụ hợp lệ khác của cùng thợ trong chuyến để đạt ngưỡng. Nail là món thêm vào một chuyến makeup/tóc đã đủ điều kiện nhận thì không phát sinh ngưỡng Nail riêng. Không thu phí bù ngưỡng ẩn, không hồi tố vào đơn đã nhận và không sao chép ngưỡng này sang các chuyến chỉ có tóc trẻ em, massage hay ngành khác.

Mắt mèo điểm trên nền gel cơ bản: đề xuất 10k/ngón, trần phần nâng cấp 40k/vùng cho cùng kỹ thuật. Giữ đúng số ngón khách chọn, không tự đổi thành 10 ngón. Món lẻ đá có thể nhiều viên/ngón; số ngón làm màu không vượt số móng trong vùng. Số lượng và vị trí là hai thông tin khác nhau.

V1 dùng số lượng + vùng + ảnh tham khảo; chưa cần trình vẽ 10 ngón, mô phỏng 3D hay ảnh AI. Nếu chồng lớp/khác vị trí làm thay đổi giá, quote phải diễn đạt được phạm vi trước khi chốt.

Menu cũ gel 130k đã gồm da không tự chuyển thành gel 120k rồi thu thêm 40k. Mapping cũ giữ như bundle gồm đủ phần và giá cũ; chỉ thợ opt-in mới nhận menu pilot. Đơn và quote còn hiệu lực tiếp tục theo snapshot.

## 7. Makeup và tóc — chốt theo người, dịp và deadline

### Giá makeup

Giữ ba mức giá catalog làm lựa chọn của thợ; đây không phải chứng nhận tay nghề tự động. Tác phẩm và đánh giá là bằng chứng lựa chọn. Giá dưới đây tính nghìn đồng:

| Dịch vụ | Giá hiện có giữ làm mốc | Phạm vi cần thể hiện |
| --- | ---: | --- |
| Nhẹ/đi làm | 250 /350 /600 | Một layout, tóc đơn giản |
| Dự tiệc | 300 /450 /800 | Một layout, tóc đơn giản và mi giả |
| Chụp ảnh/kỷ yếu | 250 /350 /550 | Một layout/người, tóc đơn giản và mi giả |
| Trial cô dâu | 600 /900 /1.500 | Một buổi riêng 180 phút; không tự khấu trừ vào lễ |
| Đám hỏi | 1.000 /1.600 /2.800 | Makeup+tóc cô dâu,180 phút tối thiểu |
| Ngày cưới | 1.300 /2.000 /3.500 | Makeup+tóc cô dâu,180 phút tối thiểu |
| Hai lễ | 2.300 /3.600 /6.300 | Hai lịch 180 phút; đang bằng tổng hai lễ, không quảng cáo giảm giá |
| Mẹ cô dâu/chú rể | 400 /600 /900 | Người riêng,75 phút |
| Họ hàng/phụ dâu | 300 /400 /500 mỗi người | 60 phút/người |
| Sự kiện/MC | 450 /700 /1.200 | Một layout 90 phút |
| Nâng cấp tóc cầu kỳ | +100 /150 /250 | Thay tóc đơn giản, thêm 30 phút; không thu trên tóc cô dâu đã gồm |

Nhóm kỷ yếu cùng phạm vi, cùng thợ và cùng chuyến:2 người giảm 10%,3–4 người 15%, từ 5 người 20%. Tự tính bậc từ người đủ điều kiện; không tính cả mẹ/cô dâu hoặc món tóc vào số người hưởng giảm. Giới hạn số người theo offer hiện hành và lịch khả dụng.

Đề xuất dùng đúng phần trăm và tiền VND nguyên:350.000× 85%=297.500/người;3 người=892.500. Không làm tròn từng người lên nghìn rồi vẫn tuyên bố đúng 15%. Hoa hồng vẫn theo quy tắc làm tròn của chính sách. Nhóm mới giữ 60 phút/người làm mặc định; chỉ rút thời gian khi có quy trình và thời lượng offer đã được kiểm chứng, không vì giảm giá mà rút 25% công.

Take care 4 giờ giữ 300/500/800k, là thời gian theo/chỉnh nhẹ sau makeup, không bao gồm một layout mới. Gói 8 giờ hiện cao hơn hai gói 4 giờ tương ứng: chuyển offer mới sang báo giá lịch trình cho đến khi phạm vi/giá được chuẩn hóa, không tự hạ giá để khớp phép nhân.

Prewedding giữ các mốc 180 phút 900/1.300/2.200k và 300 phút 1.200/1.800/3.000k làm tham chiếu. Trước mở offer mới phải ghi số layout, phần makeup ban đầu, thời gian theo, số địa điểm và đổi layout bao nhiêu lần. Đề xuất recipe 300 phút gồm 180 makeup+120 theo/chỉnh nhẹ, nhưng phải được thợ xác nhận; không mặc nhiên diễn giải gói cũ theo recipe này. Khi chưa rõ, dùng báo giá. “Studio khách thuê” là địa điểm khách mời thợ đến, không đồng nghĩa mở lại studio của đối tác.

### Tính giờ từ lúc khách cần xong

Makeup/cưới/sự kiện cần trường “Cần hoàn thiện lúc…”. Lịch lùi từ deadline, tính công từng người, setup và thời gian dự phòng. Dự phòng và setup là số được cấu hình rõ, không giảm ngầm thời gian dịch vụ.

Ví dụ minh họa: cô dâu cần xong 09:00; makeup+tóc 180 phút, dự phòng 30 phút, setup 15 phút → đến 05:15, làm 05:30–08:30. Thêm mẹ 75 phút bằng cùng thợ phải dời sớm hoặc chọn một thợ thứ hai thực sự khả dụng. Không chia thời gian theo số thợ chưa được nhận lịch. Không tự thêm phụ phí sáng sớm mới vào chính sách.

### Tóc

Giữ giá catalog; tóc tạo kiểu độc lập khác nâng cấp tóc trong makeup. Ví dụ updo độc lập 200/300/450k; đã mua makeup có tóc đơn giản thì dùng phần nâng cấp 100/150/250k khi phù hợp.

Tóc cô dâu 800/1.200/1.800k đang hứa trial: cấu trúc hai lịch thật. Đề xuất thử tóc 60 phút + ngày lễ 120 phút để thợ xác nhận, không gọi mọi buổi thêm là “buổi dặm”. Quy tắc 3 giờ của makeup cô dâu không tự áp sang tóc đơn lẻ.

Cắt tóc đã hứa gội/sấy phải giữ quyền lợi của offer và đơn đó. Chỉ niêm yết biến thể có gội tại nhà khi thợ có dụng cụ và nơi làm đáp ứng; thiếu điều kiện thì dùng dịch vụ chỉ cắt được công bố rõ, không âm thầm bỏ gội mà giữ nguyên lời hứa. Các gói cắt tại nhà cho bé/lớn tuổi hiện có là lựa chọn phù hợp riêng. Nhuộm/uốn/phục hồi/gội dưỡng sinh/duỗi/chăm sóc da đầu tiếp tục theo cổng studio hiện tại.

## 8. Da, wax, mi/mày và massage

Giữ các dải giá hiện tại. Mỗi người chọn một quy trình mặt, một kỹ thuật mi, một kỹ thuật mày hoặc một block massage. Cho thêm công việc thực sự khác vùng/phạm vi; thay thế khi chọn biến thể của cùng công việc.

- Facial 60→90 phút phải nói rõ thêm gì; không bán lại mặt nạ/làm sạch đã gồm. Hai quy trình mặt chồng phần việc phải được làm rõ trước quote.
- Wax chọn nhiều vùng; cả chân thay nửa chân của cùng người và hai bên tương ứng. Chuẩn hóa một/both sides trước xuất bản. Ví dụ mức giữa: nách 100+nửa chân 200=300k; đổi cả chân 330 thành 430k, không 630k.
- Mi và mày tách vùng. Uốn→uốn+nhuộm là thay variant. Tỉa mày đã gồm trong nhuộm/lamination không tính thêm. “Nhuộm nếu cần” thành tùy chọn có/không với giá công bố, không phát sinh lúc làm.
- Full set và refill phụ thuộc tình trạng; không tự cho chọn cả hai cho cùng vùng. Dặm mày 45 ngày kế thừa cơ chế đã có, vẫn giữ cổng studio.
- Massage cổ vai gáy mức giữa 60 phút 330k,90 phút 450k: đổi lên 90 thì 450k; muốn hai block thật phải hiển thị tổng 150 phút và chủ động xác nhận. Vùng tập trung không tự sinh một phí mới trong block.
- Có thời gian chuẩn bị/thu dọn và điều kiện tại nhà theo dịch vụ. Thời gian ủ/chờ vẫn khóa khoảng hiện diện của freelancer; không tự nhận địa chỉ khác giữa quy trình.

Các cam kết như “chuẩn y khoa”, “kháng viêm”, hiệu quả chắc chắn hoặc “an toàn từ tháng thứ 4” trong catalog cần rà soát nội dung và điều kiện năng lực trước xuất bản lại. Audit source không xác minh các cam kết ấy. Kế hoạch không mở thêm kỹ thuật đang bị khóa.

## 9. Ảnh, video, sản phẩm và mẫu

Giữ gói chính vì ở đây gói thường là cách mua đúng; thêm phần mở rộng có phạm vi rõ. Tách đơn vị tính tiền, khoảng thực hiện và đầu ra phải giao.

| Ví dụ catalog hiện tại | Giá nghìn đồng | Phạm vi cần giữ |
| --- | ---: | --- |
| Điện thoại 60 phút | 200 /300 /450 | Ảnh gốc + tối thiểu 10 ảnh chỉnh, giao 2 ngày |
| Máy ảnh chân dung 60 phút | 500 /700 /1.000 | Ảnh gốc chọn lọc +15 ảnh chỉnh, giao 5 ngày |
| Một clip ngắn | 400 /700 /1.200 | Quay 90 phút;1 clip dọc 15–60giây có nhạc/phụ đề, giao 3 ngày |
|10sản phẩm nền trơn | 400 /700 /1.200 |60 phút;30 ảnh chỉnh,3 ảnh/SKU, giao 3 ngày |
| Mẫu ảnh lookbook 1 giờ | 400 /600 /1.000 |60 phút tạo dáng, người chụp/makeup riêng; vẫn theo cổng hiện tại |
| Mẫu live 2 giờ | 600 /1.000 /1.600 |120 phút live; không tự hứa video dựng; vẫn theo cổng hiện tại |

Giá trên là source, không phải benchmark thị trường mới. Toàn bộ vertical photo hiện có 1 vòng sửa; bảo toàn quyền lợi này trong hợp đồng có cấu trúc.

Chụp nhóm điện thoại có thể giá cả gói; kỷ yếu máy ảnh giá/người và 180 phút cả nhóm. Kỷ yếu 5 người ở mức 150k/người phải hiện tối thiểu 750k,180 phút,20 ảnh nhóm+15 ảnh cá nhân; không hiển thị thành 150k cho cả nhu cầu hoặc 900 phút.

Sản phẩm: số SKU, màu/biến thể, số góc, số ảnh và styling có trường riêng. Thêm 2 SKU vào gói 10 chỉ khi có giá/phút thêm được duyệt; không tự chia 700k/10 ra giá lẻ 70k hoặc ép mua gói 30. Nếu chưa có giá thêm, chuyển báo giá cụ thể.

Video: số clip, chiều dài, concept/kịch bản, tỉ lệ, phụ đề/voice, giờ quay và deadline. Mua hậu kỳ thêm từ footage không mặc nhiên thêm chuyến; quay lại do đổi brief cần báo giá và lịch mới.

Quyền sử dụng và cho phép đăng portfolio tách biệt. Quote lưu mục đích cá nhân/thương mại, bên dùng, kênh, quảng cáo trả phí có/không, thời hạn và giới hạn của offer. Không suy việc thuê người chụp/mẫu thành mua mọi quyền. Web/app lưu cùng điều khoản trong transaction tạo đơn.

Giao file có phiên bản, danh sách đầu ra, feedback và vòng sửa. Một vòng là tập feedback gộp trên một bản giao; thiếu file/sai thông số đã cam kết là khắc phục, không tự tiêu hao vòng sửa như đổi concept. Đổi brief là yêu cầu phạm vi mới. Hạn giao tính từ mốc và số ngày trong snapshot, không đọc lại catalog mới.

Buổi thực hiện xong và sản phẩm được khách nhận là hai tiến độ. Hiển thị rõ “Đã xong buổi chụp — đang hậu kỳ”; không khóa lịch thợ liên tục tới ngày giao. Không tự thay thời điểm thu phí/hoa hồng hay bật thanh toán online chỉ vì thêm tiến độ hậu kỳ.

Mẫu ảnh/video/live được thiết kế đủ dữ liệu nhưng giữ cổng KYC/mở bán hiện tại. Cần test server trực tiếp với cả tài khoản đã verified khi cờ sản phẩm đóng; audit chưa chứng minh một global kill switch bao phủ mọi đường đặt mẫu.

## 10. Hợp đồng dữ liệu và API dùng chung

Đây là đặc tả, không phải tên bảng/API bắt buộc. Ưu tiên mở rộng booking và `booking_sessions` hiện có bằng migration bổ sung; tránh dựng hai lịch hoặc hai sổ tiền cạnh tranh.

| Khái niệm | Nội dung tối thiểu |
| --- | --- |
| Đơn/booking tổng | Khách đặt, một đối tác, phiên bản hợp đồng, các dòng, buổi, tổng giá, trạng thái và liên kết dự án nếu có |
| Người nhận | ID nội bộ đơn, nhãn hiển thị, thông tin cần cho công việc; không bắt mỗi người tạo account |
| Dòng dịch vụ | Catalog/offer version, người/vùng/phạm vi, số lượng + đơn vị, đơn giá, thành phần gồm sẵn, nguồn combo, tiền giảm, buổi thực hiện |
| Quan hệ dịch vụ | Đã gồm, thay thế, cần nền, không tương thích, thứ tự làm; áp theo cùng người/vùng/buổi, không chặn nhầm người khác |
| Giá | Gói/người/ngón/viên/vùng/giờ/SKU/outfit/ảnh/clip; tách lượng định giá với số người và số buổi |
| Thời gian | Block cố định, theo người nối tiếp, setup+công theo lượng, công hậu kỳ; nghỉ/chờ/thu dọn và khả năng dùng chung setup có quy tắc |
| Buổi/visit | Loại buổi, ngày, địa chỉ, bắt đầu/kết thúc, readyBy nếu có, phạm vi công, phí chuyến, trạng thái; dùng lại booking_sessions |
| Quyền lợi hẹn sau | Dặm hoặc quyền hẹn sau chưa có ngày: số lần, cửa sổ sử dụng, thời lượng, phí đi lại đã gồm hay chưa. Ghi quyền lợi trước, chỉ giữ slot khi chốt ngày; tách khỏi buổi trial/lễ bắt buộc đã lên lịch |
| Đầu ra | Loại/số lượng/định dạng/độ dài, bản gốc, mức chỉnh, deadline, số vòng sửa, phiên bản giao và xác nhận |
| Quote snapshot | Toàn bộ nội dung trên + người tài trợ giảm giá + fee/commission policy version + tổng + thời hạn + dấu nhận diện nội dung |

Các thao tác cần có:

1. **Quote toàn giỏ:** server kiểm tra quyền niêm yết, giá offer, đơn vị, quan hệ, nơi làm và cờ mở bán; trả breakdown, phút và lỗi theo dòng. Món báo giá chưa được chốt không giả thành 0đ.
2. **Tìm lịch toàn đơn:** đọc các block/buổi từ quote; kiểm tra setup/thu dọn, lịch hiện có, các khoảng di chuyển phù hợp và readyBy. Nhiều người cùng thợ nối tiếp; thao tác song song cần nguồn lực thực.
3. **Tạo đơn nguyên khối:** kiểm tra tính hợp lệ của quote, quyền cung cấp, cờ mở bán, thời gian và điều khoản; giữ tất cả buổi bắt buộc đã chọn ngày và ghi snapshot trong một transaction có khóa chống đặt trùng, kèm idempotency. Giá trong quote còn hạn được giữ dù giá niêm yết đã đổi; không dùng giá mới để tăng tiền. Quote hết hạn hoặc khách sửa phạm vi mới cần báo giá lại. Một bước lỗi thì không có booking thiếu thành phần. Quyền dặm chưa có ngày được ghi nhận cùng đơn nhưng chưa giữ slot, không chặn đặt ban đầu hoặc hoàn thành các buổi bắt buộc.
4. **Đề nghị thay đổi:** tạo version mới và chênh lệch tiền/giờ/phạm vi; giữ bản đã nhận cho tới khi khách đồng ý và lịch mới được kiểm tra thành công. Không ghi đè lịch đã chấp nhận giữa lúc chờ phản hồi.
5. **Đăng nhu cầu/matching:** dùng cùng cấu trúc scope. Nếu chưa có thợ/giá thì là yêu cầu; phản hồi của thợ trở thành quote đầy đủ. Không tiếp tục cơ chế giá cố định dựa một variant khi yêu cầu thực tế nhiều món.
6. **Đặt lại/deep link:** đưa vào giỏ và quote theo offer hiện tại; không coi giá cũ là giá mới, cũng không dùng giá mới để sửa hóa đơn cũ.

Giỏ nháp không tự giữ lịch. Quote có hạn riêng; thời hạn phản hồi của thợ kế thừa chính sách hiện tại. Bấm gửi lần nữa do mất mạng không được tạo thêm đơn. Server là nguồn quyết định tiền/lịch, không tin giá hoặc phút từ client.

## 11. Tiền, chuyến đi và thay đổi đơn

Đề xuất công thức trên mỗi buổi:

`Dịch vụ = tổng dòng − ưu đãi combo/nhóm/thợ`

`Khách trả = dịch vụ + di chuyển + phí gấp áp dụng − voucher nền tảng`

Hoa hồng theo policy snapshot, hiện source là 20% trên dịch vụ; di chuyển và phí gấp 100% về thợ. Voucher nền tảng được ghi nguồn tài trợ riêng, không tự trừ vào thu nhập của thợ như giảm giá do thợ tài trợ. Chính sách hiện tại chưa được đổi trong lượt lập kế hoạch.

- Một thợ, nhiều người/món, cùng địa chỉ và một khoảng làm liên tục: một chuyến. Nhiều ngày hoặc phải quay lại: nhiều chuyến, công bố trước.
- Chụp/prewedding di chuyển nhiều điểm trong một buổi phải có tuyến và thời gian di chuyển trong scope. Không tự nhân phí đến nơi50/100k cho mỗi điểm; chi phí tuyến ngoài phạm vi chuẩn được báo rõ trước, khi chưa có quy tắc giá thì dùng báo giá.
- Không tự cộng 50/100k cho từng dòng. Gói hai lễ phải thấy phí từng lần đến, không hứa một phí cho cả hai ngày. Trial/retouch đã hứa miễn hoặc gồm phí phải giữ nguyên điều kiện snapshot.
- Chưa xác định khoảng cách: chưa chốt phí 0đ; chỉ báo tạm tính cho tới đủ địa chỉ và điều kiện tính phí.
- Giữ chính sách di chuyển 50k dưới 5km,100k từ 5km; gấp trong 3 giờ 50k, tối thiểu đặt trước 60 phút theo source. Không thêm phí nền tảng khách trả, phí sáng sớm hoặc ngày lễ mới trong đợt này.
- Hoa hồng làm tròn một lần trên tổng dịch vụ của mỗi buổi, rồi phân bổ về các dòng theo quy tắc xác định, thay cho làm tròn từng món. Đơn nhiều buổi là tổng các buổi. Discount/voucher cấp đơn phân bổ rõ và chỉ dùng một lần; các khoản phân bổ cộng đúng tổng, không sai số thất thoát.
- Phân bổ theo buổi phục vụ báo giá/đối soát, chưa có nghĩa thu hoa hồng độc lập mỗi buổi. V1 giữ sự kiện ghi nhận khi đơn hoàn thành đủ các buổi bắt buộc; quyền dặm chưa sử dụng và giai đoạn hậu kỳ không tự đổi mốc này. Bù voucher và ghi nhận MCN kế thừa sự kiện hiện tại nhưng chạy một lần trên đơn tổng, có khóa idempotency; không chạy lại trên từng dòng, từng lần giao file hoặc lúc hoàn tất tổng. Đơn hủy một phần phải điều chỉnh phần dịch vụ còn nghĩa vụ và các khoản phân bổ trước ghi nhận cuối; khoản đã ghi cần bút toán điều chỉnh, không xóa lịch sử.
- Phí gấp được chốt trong quote theo từng chuyến vào lúc đặt, không tự phát sinh chỉ vì đồng hồ tiến gần lịch. Thêm món trong chuyến đã nhận không thu thêm phí gấp; thêm chuyến mới thì tính rõ trong quote thay đổi.
- Hủy một phần chưa làm cần quote lại nếu đổi điều kiện nhóm/combo; khách thấy tiền còn lại trước chấp thuận. Không truy thu ngầm ưu đãi của phần đã hoàn tất. Hủy một buổi không tự xóa buổi khác; giải phóng đúng slot và phân bổ tiền theo policy snapshot.
- Giữ phương thức thanh toán đang được cho phép; kế hoạch này không bật thu tiền online. Hóa đơn là một bản chi tiết thống nhất, lịch nhiều buổi vẫn có tiến độ riêng.

Ví dụ kiểm chứng hóa đơn từ ảnh người dùng:20.000+2× 150.000+100.000+2× 15.000+2× 30.000+8× 10.000=590.000; giảm 10%=59.000; khách trả 531.000. Hệ thống phải tái hiện phép tính nhưng vẫn biết discount do ai tài trợ; ảnh không xác định điều đó.

## 12. Phạm vi triển khai một đợt

| Gói công việc | Deliverable khi code sau |
| --- | --- |
| A. Catalog và contract | Mô hình người/vùng/đơn vị/quan hệ/buổi/output; bảng mapping từng template/variant cũ, bundle đã gồm; phiên bản mới và adapter đọc cũ |
| B. Quote/lịch/transaction | Quote giỏ, full-slot, giữ các buổi bắt buộc đã có ngày, ghi quyền hẹn sau riêng; atomic create, retry idempotent, change approval; tiền và discount có phân bổ |
| C. UI khách web/app | Các bộ chọn theo ma trận 12 ngành, giỏ, readyBy, lịch nhiều buổi, breakdown, review scope, quyền ảnh/video và thay đổi đơn |
| D. Thợ và matching | Menu có năng lực/điều kiện, nhận toàn đơn, báo giá tùy chỉnh, phiếu việc theo người, lịch từng buổi; đăng nhu cầu cùng engine |
| E. Thực hiện và hậu kỳ | Hủy/đổi một phần, session labels, follow-up, giao file/version/vòng sửa; đơn/phiếu việc/hóa đơn thống nhất |
| F. Di chuyển và phát hành | Backfill có kiểm chứng, compatibility app cũ, feature flags theo ngành, QA, metric và rollback |

Các file/nhóm sở hữu phải rà khi triển khai:

- `lib/types.ts`, `lib/catalog.ts`, `lib/catalog-read.ts`, `lib/offers.ts`, `lib/pricing.ts`, `lib/launch.ts`, `lib/store.tsx`.
- `lib/api/actions.ts`, `lib/api/bookings.ts`, `lib/booking-features.ts`, `lib/api/booking-features.ts`; các migrations sở hữu quote/create/attach/booking_sessions/terms/voucher/commission/job matching.
- `app/book/[proId]/page.tsx`, `app/requests/new/page.tsx`, trang dịch vụ/tìm kiếm/profile/tác phẩm/đặt lại và chi tiết đơn.
- `components/booking-contract.tsx`, `components/booking-extras.tsx`, các booking card/detail và phiếu thợ.
- `apps/mobile/src/app/book/[proId].tsx`, `apps/mobile/src/app/yeu-cau/moi.tsx`, `apps/mobile/src/data/bookings.ts`, contract/delivery/voucher/booking row native.
- Menu/onboarding/dashboard đối tác và catalog/đơn hàng quản trị; notifications, lịch, hóa đơn và review không được gửi một thông báo “đơn mới” cho từng dòng.
- Tests hiện có về catalog, pricing, service-offers, booking recovery/features và regression backend. Không viết lại migration đã chạy; thêm migration mới.

Trước mapping phải kiểm tra schema và RPC đang được deploy thực tế; tên migration trong audit chỉ là bằng chứng source. Giữ các guard studio/KYC, RLS, quyền chủ đơn/thợ và cổng publish xuyên suốt đường mới.

## 13. Tương thích và rollout

1. Đóng băng quy tắc trong tài liệu này; khi bắt đầu code, lập mapping toàn bộ template/variant và dependencies hiện tại trước sửa UI. Các thời lượng chưa được xác nhận, giá SKU thêm hoặc phạm vi prewedding chưa rõ dùng báo giá, không bịa giá cố định.
2. Migration bổ sung và API mới có đọc contract cũ. Không backfill lịch sử bằng catalog hiện tại. Parent/child addon cũ chỉ gom thành view chung khi đủ bằng chứng; không gộp sổ tiền hoặc số đơn thật làm mất lịch sử.
3. Listing cũ giữ giá/phạm vi đang hứa. Tách Nail cũ thành bundle có thành phần đã gồm; menu mới là phiên bản thợ chấp nhận. Báo rõ đổi giá ở quote mới.
4. Cùng một engine dùng cho cả 12 ngành; bật kiểm thử nội bộ theo nhóm. Nail và makeup đi trước để kiểm chứng giỏ, người và readyBy; sau đó bật selector ngành khác trên cùng lõi khi đạt nghiệm thu.
5. Web và native cùng hợp đồng. App cũ vẫn đọc được đơn cũ; đơn mới không bị giản lược giả thành một món rồi cho sửa sai. Nếu không có khả năng đọc/sửa contract mới, trả yêu cầu cập nhật rõ, không âm thầm mất món. Kiểm tra phiên bản native cần build/store hay cập nhật được; không mặc định web deploy là app đã đổi.
6. Pilot Nail 30 đơn hoàn tất tại TP.HCM để học chi phí/thời lượng và hành vi, không coi là mẫu đại diện thống kê. Makeup đo số người, giờ cần xong, tỷ lệ đến/làm xong đúng giờ và lý do từ chối. Các ngành khác đo đúng đơn vị và đầu ra riêng.
7. Rollback tắt tạo quote mới theo ngành nhưng vẫn đọc/phục vụ đơn đã chấp nhận bằng snapshot. Không rollback bằng xóa lineitems hoặc ép đơn mới về single variant.

Theo dõi: giỏ→quote→chọn giờ→gửi→thợ nhận→hoàn tất; món bị bỏ; lỗi tương thích; quote hết hạn; phút dự kiến/thực tế; thiếu lịch; phát sinh giá; phí chuyến; thu nhập ròng ước tính có ghi rõ chi phí giả định; trễ deadline; thiếu file/vượt vòng sửa. Không dùng riêng doanh thu trung bình để kết luận chất lượng tốt hơn.

## 14. Checklist nghiệm thu bắt buộc

### Lõi và tiền

- [ ] Giỏ có hơn 3 dòng hợp lệ vẫn đặt được; giới hạn kỹ thuật chống abuse tách khỏi giới hạn sản phẩm cũ.
- [ ] Mọi dòng gắn đúng người/phạm vi/buổi và đơn vị; không nhầm viên với ngón/người.
- [ ] Slot đủ toàn giỏ + setup/thu dọn; thêm món kiểm tra lại lịch.
- [ ] Hai khách tranh cùng slot: chỉ đơn đủ điều kiện giữ được, không double-book.
- [ ] Một dòng/buổi lỗi: không tạo đơn thiếu; retry cùng request không sinh đơn thứ hai.
- [ ] Đổi giá niêm yết không đổi quote còn hạn; quote hết hạn/giỏ đổi phải tính lại. Quyền niêm yết, khả năng nhận và cờ mở bán vẫn kiểm tra lúc gửi.
- [ ] Quote không cho client sửa giá/phút, không đọc đơn của người khác, không thay offer của thợ khác.
- [ ] Một chuyến tính phí một lần; hai ngày tính hai chuyến rõ ràng; khoảng cách chưa rõ không chốt 0đ.
- [ ] Voucher cấp đơn không bị nhân theo dòng; nguồn tài trợ, commission và thực nhận khớp từng buổi và tổng; chỉ ghi một lần ở sự kiện hoàn thành theo policy, không thu lại khi giao file hoặc dùng quyền dặm.
- [ ] Hóa đơn mẫu 590k−59k=531k; phân bổ/làm tròn không lệch tổng.
- [ ] Hủy/đổi một phần chỉ tác động đúng buổi/dòng; phần hoàn tất giữ giá đã chốt.
- [ ] Các sự kiện thông báo, lịch và đánh giá không nhân theo số dòng; danh sách đơn vẫn dễ hiểu.

### Nail

- [ ] Gel tay và tay+chân cùng người nhận ra vùng tay trùng; đổi cấu hình, không tự cộng 370k.
- [ ]10 móng tay và 10 móng chân là hai vùng; hai người cùng làm tay là hai người, không trùng.
- [ ] Da đã gồm trong bundle cũ không tính thêm; menu pilot mới chỉ áp đúng listing đã đổi.
- [ ] Da+gel 150k; đổi thạch 170k; thêm úp nền 130k thành 280k cho combo gel.
- [ ] Sáu ngón mắt mèo điểm tính phần nâng cấp 40k theo pilot và giữ sáu ngón; nhiều đá/ngón hợp lệ.
- [ ] Tháo nền/đắp/fill tương thích; mẫu ngoài menu có quote trước lịch xác nhận.
- [ ] Ngưỡng150k chỉ cho menu Nail pilot; bundle cũ130k vẫn đặt riêng được. Nail thêm vào chuyến ngành khác hợp lệ không có sàn riêng; không sinh phí bù.

### Makeup/tóc

- [ ] Dự tiệc 450+tóc nâng cấp 150=600k; không thu thêm updo độc lập cho cùng công.
- [ ] Makeup cô dâu đã gồm tóc; thêm hair-bridal cùng người/lễ báo đã gồm hoặc yêu cầu làm rõ phần khác.
- [ ] Cô dâu 2000+mẹ 600=2600k dịch vụ,180+75 phút công, một phí chuyến nếu cùng buổi.
- [ ]3 người kỷ yếu mức 350k giảm 15%=892.500đ; bớt còn 2 thành 630k; không giữ bậc cũ.
- [ ]5 người mức 350k giảm 20%=1400k, mặc định 300 phút công; giảm giá không giảm giờ.
- [ ] ReadyBy tính lùi; thêm người làm đổi giờ đến; không hứa deadline nếu slot không đủ.
- [ ] Hai lễ có hai lịch thật, từng địa chỉ/phí; trial tóc có tên và thời lượng riêng.
- [ ] Take care không chồng cùng phần thời gian đã gồm trong prewedding; đổi layout vượt scope cần quote.
- [ ] Cắt tóc giữ đúng lời hứa gội/sấy và kiểm tra khả năng tại nhà; không tự đổi quyền lợi cũ.

### Da/mi/mày/massage

- [ ] Facial 60→90 là thay lựa chọn; không bán lại mặt nạ hoặc bước đã gồm.
- [ ] Wax nách+nửa chân 300k; đổi cả chân 430k; vùng người khác không bị xóa nhầm.
- [ ] Uốn mi→uốn+nhuộm chỉ một lần uốn; tỉa mày đã gồm không thu lại.
- [ ] Full set/refill không tự cộng cho cùng vùng; dặm mày 45 ngày giữ quyền lợi và cổng studio.
- [ ] Massage 60→90 tính 450k theo ví dụ, không 780k; hai người một thợ nối tiếp.
- [ ] Dịch vụ thiếu điều kiện dụng cụ/nơi làm không được hứa là có thể thực hiện tại nhà.

### Ảnh/video/mẫu

- [ ] Kỷ yếu 5 người ở mức 150k là 750k,180 phút,20 ảnh nhóm+15 ảnh cá nhân.
- [ ]10 SKU× 3 ảnh=30 file; thêm 2 SKU theo offer thêm đã duyệt, không nhân lại setup hay tự chia giá.
- [ ]3 clip có đúng số clip/độ dài/vòng sửa/hạn giao; không hiểu thành 3 người hoặc 3 chuyến.
- [ ] Mobile và web lưu cùng mục đích sử dụng/quyền/repost nguyên khối với booking.
- [ ] Một link giao không tự chứng minh đủ đầu ra; phiên bản giao và feedback được giữ.
- [ ] Sửa catalog không đổi deadline, quyền, số file hoặc vòng sửa của đơn đã đặt.
- [ ] Xong buổi quay vẫn hiển thị hậu kỳ đang chờ; không tự đổi chính sách thu phí.
- [ ] Dự án makeup→chụp biểu đạt thứ tự; từng thợ có trạng thái/phí riêng, không hứa cả ekip đã nhận.

### Migration và mở bán

- [ ] Web/app/direct link/đăng nhu cầu/đặt lại dùng cùng rule và đọc được contract cũ.
- [ ] Giá “từ” là nhu cầu tối thiểu đặt được của thợ thực sự eligible; không quảng cáo đá 3k hoặc kỷ yếu 150k cho cả nhóm.
- [ ] Studio tắt chặn cả UI, quote và server create, kể cả giỏ lưu từ trước.
- [ ] Mẫu/casting giữ cổng hiện tại; kiểm tra cả tài khoản đã verified và gọi RPC trực tiếp.
- [ ] App cũ không được ghi thiếu lineitems/rights lên đơn mới; có đường cập nhật rõ.
- [ ] Rollback vẫn phục vụ và đối soát đơn mới đã chấp nhận; không mất snapshot hoặc lịch đã giữ.

## 15. Nguồn nghiên cứu bên ngoài

Đọc ngày 28/10/2026. Đây là giá niêm yết của từng đơn vị, phạm vi và địa phương khác nhau; không phải giá trung bình thị trường.

| Nguồn | Bằng chứng sử dụng |
| --- | --- |
| [Booksy — Combo Services](https://support.booksy.com/hc/en-us/articles/16537510218514-How-do-I-set-up-Combo-Services) | Combo gồm nhiều phần, giá tổng hoặc giá riêng; làm song song cần nhiều người làm |
| [Square — dịch vụ và biến thể](https://squareup.com/help/us/en/article/6487-create-a-service-from-the-square-appointments-app) | Biến thể/món kèm gắn giá và thời gian; người làm đủ kỹ thuật và thời gian chặn thêm |
| [Cáo Makeup TP.HCM](https://www.caomakeup.com/hcm/bang-gia) | Dự tiệc 500k gồm tóc cơ bản/tận nơi nội thành; nhóm từ 3 người 450k/người cùng địa chỉ. Dòng cô dâu diễn đạt chưa rõ hai buổi, không dùng để suy gói hai lễ |
| [Tú Hoa Hải Phòng](https://tuhoaacademy.com/bang-gia-makeup-tai-nha-moi-nhat-2026.html) | Dự tiệc 349k, kỷ yếu 349/399k tùy tóc; mẹ 499k/người nhà 299k. Không suy một địa phương thành mức chung toàn quốc |
| [Juhee Hà Nội, bài 10/10/2026](https://juheemakeup.com.vn/blog-tin-tuc/bang-gia-makeup-co-dau-ha-noi-2026-moi-nhat) | Giá tham khảo cô dâu 1500k/buổi, mẹ 800k, người nhà 500k; phí đi lại/hạng mục phải xác nhận |
| [Bworkee — cắt tóc tại nhà](https://bworkee.com/jobs/cat-toc-tai-nha) | Cắt nam/trẻ em 150k ghi gồm đi lại; có làm nhiều người lần lượt. Mô tả tạo kiểu ở menu và FAQ không đồng nhất, không dùng làm giá tạo kiểu chắc chắn |
| [Chuppy](https://chuppynails.com/bang-gia), [Jadoo](https://jadoonail.com/price-list), [Angel](https://angelmakeup.vn/lam-nail-tai-nha) | Đối chiếu Nail theo phần gồm, bộ/ngón/viên và tận nơi; phân tích chi tiết ở tài liệu Nail V1 |

Các nguồn ủng hộ cách tách phạm vi và cách tính tiền; chúng không chứng minh thiết kế mới đã tăng chuyển đổi hoặc có lợi nhuận. Việc đó cần số liệu pilot sau khi triển khai.
