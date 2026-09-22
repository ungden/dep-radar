# 360dep — Plan giao diện (web + app), trang chủ & mở rộng ngành

Ngày: 23/09/2026 · Chỉ là kế hoạch, chưa sửa dòng code nào.
Căn cứ: xem trực tiếp `www.360dep.vn` (mobile 375px, desktop 1280px), đọc `app/page.tsx`,
`app/globals.css`, `components/beauty.tsx`, `apps/mobile/src/*`, `docs/PLAN.md`,
`docs/UX_AUDIT_EXPLORE_2026-09-19.md`, `docs/AUDIT_2026-09-22.md`.

Tài liệu có 3 phần anh hỏi, cộng lộ trình và các quyết định cần chốt:

1. Giao diện: vì sao đang tệ, và hướng thiết kế mới cho cả web lẫn app
2. Trang chủ: hiện gì, xếp theo người hay theo bài, xếp hạng thế nào
3. Mở rộng ngành: Chụp & quay (photophone) và Người mẫu

---

## 0. Tóm tắt một trang

- **Giao diện tệ không phải do thiếu màu hay thiếu chữ, mà do thiếu hệ thống và thiếu nhân vật chính.**
  Trang chủ có 8 khối nặng ngang nhau, ảnh (thứ bán hàng mạnh nhất) bị làm thành thumbnail có chữ đè lên,
  thẻ không có giá, không có khu vực, desktop là bản mobile kéo giãn. App mobile hiện chỉ là khung Expo trống,
  màu cũng khác web.
- **Hướng mới: "tạp chí đời thường".** Ảnh to và thật, chữ đậm và tự tin, ít hồng hơn, một màu nhấn duy nhất,
  mọi thẻ đều trả lời ngay 3 câu *làm gì, bao nhiêu tiền, ai làm/ở đâu*. Web và app dùng chung một bộ token.
- **Trang chủ không nên là một luồng duy nhất.** Mặc định là feed *bài đăng* được xếp hạng + luật đa dạng
  (không để một người chiếm màn hình), chen các khối *người* ("Gần bạn, còn lịch"). Tab "Đang theo dõi"
  và "Mới nhất" thì đúng thứ tự đăng bài. Khi một thành phố còn ít freelancer, trang chủ tự đổi sang
  bố cục *người trước, bài sau*, vì feed bài sẽ lặp.
- **Ngành mới:** 360dep thành "nơi đặt người giúp bạn lên hình đẹp" với 3 ngành: **Làm đẹp** (đang có),
  **Chụp & quay** (photophone, quay clip ngắn, chụp sản phẩm cho shop), **Người mẫu** (tuyển mẫu cho thợ
  làm đẹp, mẫu có thù lao cho shop/photographer). Điểm mạnh thật sự là **combo**: makeup + chụp, hoặc
  mẫu + makeup + chụp cho shop, đặt một lần. Đề xuất mở Chụp & quay trước **mùa ảnh áo dài Tết**
  (Tết Đinh Mùi rơi vào 06/02/2027, mùa chụp bắt đầu khoảng giữa tháng 12).

---

## 1. Giao diện

### 1.1 Chẩn đoán cụ thể (nhìn trên production)

| # | Vấn đề | Thấy ở đâu | Vì sao làm giao diện "tệ" |
|---|---|---|---|
| 1 | Không có nhân vật chính | Trang chủ: tìm kiếm → banner demo → 6 danh mục → CTA đăng yêu cầu → tab → feed → chuyên viên → tuyển thợ | Mắt không biết nhìn đâu; mọi khối cùng bo 20px, cùng nền hồng nhạt, cùng trọng lượng |
| 2 | Ảnh bị hạ cấp thành thumbnail | Thẻ tác phẩm: chữ trắng đè lên ảnh, tỉ lệ cắt tuỳ ý | Ảnh sáng thì chữ không đọc được; tên mẫu che mất phần đẹp nhất của ảnh |
| 3 | Thẻ nghèo thông tin | "Mai Trần ★ 5.0 · 2 job" | Không có giá, dịch vụ, khu vực. Khách phải mở từng thẻ mới biết có hợp không |
| 4 | Danh mục là icon line trong vòng tròn hồng | Hàng Nail / Makeup / ... | Nhìn như template; icon kéo không diễn tả được "đẹp". Nhãn "Chăm sóc da" xuống dòng |
| 5 | Màu một tông | Nền `#faf6f4`, blush `#f6e8e6`, rose `#a8535d` | Hồng đất + Playfair = cảm giác "spa 2015"; mọi thứ nhạt nên không gì nổi |
| 6 | Chữ nhỏ và mảnh | Metadata 11–13px, tab 13px | Trông như wireframe tô màu; khó đọc ngoài trời |
| 7 | Desktop là mobile kéo giãn | 1280px: hero chữ trơn, khoảng trắng lớn, 5 cột thẻ ~200px | Không tận dụng màn hình; header không có ô tìm kiếm |
| 8 | Logo không có cá tính | Chữ "3" trong ô vuông + chữ serif | Không nhớ được, không dùng được làm icon app |
| 9 | Không có chuyển động và phản hồi | Bấm thẻ, lưu, chuyển trang | Cảm giác "trang web", không phải "app" |
| 10 | Thuật ngữ lẫn | "freelancer", "chuyên viên", "job", "thợ" | Khách thấy chữ "job" là ngôn ngữ nội bộ |
| 11 | App mobile chưa có gì | `apps/mobile`: 5 màn, 125 dòng, màu `#C65E68` khác web `#a8535d` | Chưa phải sản phẩm; nếu làm tiếp theo kiểu này sẽ thành hai hệ thiết kế |

Kết luận: sửa **hệ thống** (token, thẻ, bố cục, nhịp) chứ không sửa từng trang. Nếu chỉ tăng cỡ chữ hay
đổi màu, trang vẫn tệ vì cấu trúc vẫn thế.

### 1.2 Định hướng thiết kế: "tạp chí đời thường"

Khi có thêm Chụp & quay và Người mẫu, nhận diện hồng spa không còn đúng nữa. 360dep bán *khoảnh khắc lên hình
đẹp*, nên giao diện nên giống một tạp chí ảnh đời thường: ảnh thật chiếm chỗ, chữ đen đậm, khoảng trắng có chủ ý,
màu nhấn dùng rất ít.

**Nguyên tắc**

1. **Ảnh là giao diện.** Ảnh không bị chữ đè; mọi chữ nằm dưới ảnh. Tỉ lệ cố định: 4:5 cho ảnh, 9:16 cho video.
2. **Mỗi thẻ trả lời 3 câu:** làm gì (tên mẫu/dịch vụ) · bao nhiêu (giá từ) · ai làm, ở đâu (người, ★, khoảng cách).
3. **Một hành động chính mỗi màn.** Nút đen đặc là hành động chính; màu nhấn chỉ dùng cho trạng thái và điểm nhấn nhỏ.
4. **Tin cậy hiển thị bằng dữ kiện, không bằng trang trí:** dấu xác minh, số lịch đã hoàn thành, đánh giá có ảnh.
5. **Giữ nguyên nguyên tắc trung thực của dự án:** không hiện con số không có thật, không "đang hot" giả.

**Token đề xuất (thay `app/globals.css`, dùng chung cho app)**

| Nhóm | Hiện tại | Đề xuất |
|---|---|---|
| Nền | `#faf6f4` hồng | `#FAFAF8` trắng ấm gần trung tính; thẻ `#FFFFFF`; nền phụ `#F2F0EC` |
| Chữ | `#2b2322`, muted `#7a6c6a` | Mực `#161413`; phụ `#57514D`; mờ `#7C7570` (vẫn đạt AA trên nền) |
| Nút chính | Rose `#a8535d` | **Đen `#161413`**, chữ trắng. Nút phụ viền 1px |
| Màu nhấn | Rose + blush khắp nơi | **Một màu "đỏ son"** (khoảng `#D2344E`, chốt sau khi thử tương phản) chỉ cho: tim đã lưu, chấm thông báo, giá khuyến mãi thật, tab đang chọn |
| Màu ngành | Không có | Chấm nhỏ/nhãn: Làm đẹp = son, Chụp & quay = xanh cobalt, Người mẫu = tím mận. Chỉ dùng ở nhãn, không tô nền lớn |
| Font | Be Vietnam Pro + Playfair Display | Giữ **Be Vietnam Pro** (dấu tiếng Việt tốt) cho toàn bộ; tiêu đề dùng weight 700–800, tracking âm nhẹ. **Bỏ Playfair.** Nếu muốn có font display riêng: thử Bricolage Grotesque (cần kiểm tra kỹ dấu tiếng Việt trước khi chọn) |
| Thang chữ | 11–36px lộn xộn | 12 (chỉ nhãn phụ) · 13 · **15 (thân bài)** · 17 · 20 · 24 · 32 · 40/48 (desktop hero) |
| Bo góc | 1 cỡ 20px cho mọi thứ | 8 (chip, ảnh nhỏ) · 12 (thẻ) · 16 (sheet) · 24 (khối lớn) · tròn (avatar, pill) |
| Bóng | 1 bóng mờ | 2 cấp: `raised` (thẻ nổi khi hover/nhấn) và `overlay` (sheet, menu). Mặc định thẻ **không bóng, không viền**, tách bằng khoảng trắng |
| Khoảng cách | Tuỳ trang | Lưới 4px; trong cụm 8–12; giữa cụm 24; giữa section 40 (mobile) / 64 (desktop) |
| Chuyển động | Hầu như không | 150–250ms; nhấn thẻ scale 0.98; ảnh feed → ảnh chi tiết chuyển liền mạch (shared element trên app, View Transitions trên web); skeleton đúng hình thẻ |
| Logo | "3" trong ô vuông | Làm lại wordmark "360đẹp" hoặc biểu tượng vòng 360° + khung ảnh; phải đọc được ở 24px (icon app, favicon) |

**Bộ thành phần lõi** (vẽ một lần, dùng cho cả web và app):
`PostCard` (tác phẩm/video), `ProCard` (người, kèm 3 ảnh), `PriceTag`, `TrustRow` (★, số lịch, xác minh),
`VerticalSwitch` (3 ngành), `CategoryBubble`, `OccasionCard` (gói dịp), `FilterSheet`, `BookingBar` (thanh giá dính đáy),
`Timeline` (trạng thái lịch hẹn), `EmptyState` (có ảnh thật + 1 hành động), `Toast`.

**Wireframe thẻ bài đăng mới (mobile, 2 cột)**

```
┌───────────────────┐
│                   │  ← ảnh 4:5, không chữ đè
│                   │     góc trên phải: ♡ (vùng chạm 44px)
│                   │     góc trên trái: ▶ 0:32 (nếu video) hoặc 1/5 (nhiều ảnh)
│                   │
└───────────────────┘
Gel trơn hồng đất        ← tên mẫu, 15px đậm, tối đa 2 dòng
Từ 250.000đ              ← giá từ, 15px
(ava) Ngọc Bảo ✓ ★4.9 · 2,1 km   ← 13px, khoảng cách chỉ khi khách đã có địa chỉ
```

### 1.3 Kiến trúc điều hướng (giống nhau trên web và app)

**Chế độ khách — tab dưới (mobile web + app):**

| Tab | Nội dung |
|---|---|
| Khám phá | Trang chủ (mục 2) |
| Tìm | Danh sách + bản đồ, bộ lọc dạng sheet |
| **＋ Đăng** | Khách: "Đăng yêu cầu / Đăng tuyển mẫu". Đây là nút giữa, to |
| Lịch hẹn | Sắp tới / Đã xong, dạng dòng thời gian |
| Tôi | Hồ sơ, đã lưu, địa chỉ, cài đặt, chuyển sang chế độ freelancer |

Tin nhắn và thông báo nằm ở thanh trên cùng (icon 💬 và 🔔 có số thật), không chiếm tab.

**Chế độ freelancer (Studio):** Hôm nay · Việc mới · **＋ Đăng tác phẩm** · Lịch · Ví.
"Hôm nay" là trang chủ của freelancer: việc cần gọi xác nhận (đếm ngược 2 giờ), lịch hôm nay kèm chỉ đường,
thu nhập tuần, hồ sơ hoàn thiện bao nhiêu %.

**Desktop (≥1024px):** header cố định gồm logo · công tắc 3 ngành · ô tìm kiếm to ở giữa · khu vực ·
💬 🔔 · avatar · "Trở thành freelancer". Nội dung tối đa 1200px, lưới 12 cột. Feed 3 cột (1024–1279) và 4 cột (≥1280),
thẻ không hẹp hơn 250px. Trang chi tiết và hồ sơ dùng bố cục 2 cột: ảnh bên trái, thẻ đặt lịch dính bên phải.

### 1.4 Các màn chính cần vẽ lại

| Màn | Thay đổi chính |
|---|---|
| **Chi tiết bài đăng** | Ảnh/video tràn màn, vuốt ngang; thanh đáy dính "Từ 300.000đ · Đặt mẫu này"; chọn gói ngay trong sheet; khối "Mẫu tương tự từ người khác"; đánh giá có ảnh của đúng dịch vụ này |
| **Hồ sơ freelancer** | Ảnh bìa + avatar + tên + dấu xác minh; 3 con số thật (lịch hoàn thành, ★, thời gian phản hồi); nút Nhắn / Đặt lịch; tab: Tác phẩm (lưới 3 cột kiểu Instagram) · Bảng giá · Đánh giá · Giới thiệu. Có mục riêng theo ngành (Chụp: thiết bị, phong cách, thời gian trả ảnh; Mẫu: comp card, chiều cao, loại hình nhận) |
| **Tìm kiếm** | Chuyển Danh sách ↔ Bản đồ; bộ lọc trong sheet: ngành, danh mục, giá, khoảng cách, ngày, tại nhà/studio/ngoài trời, đã xác minh; lưu bộ lọc gần nhất |
| **Đặt lịch** | Giữ 3 bước nhưng trong bottom sheet trên mobile, cột phải trên desktop; tổng tiền luôn dính đáy; phí di chuyển/phí gấp là dòng giá, không phải đoạn văn |
| **Lịch hẹn** | Dòng thời gian: Đã gửi → Đã gọi xác nhận → Đã nhận → (Chụp & quay: Đang chỉnh → Đã giao) → Hoàn thành; mỗi bước có giờ thật |
| **Trạng thái rỗng** | Ảnh thật + một câu + một nút. Bỏ toàn bộ "icon trong vòng tròn hồng" |

### 1.5 Web và app: chia vai

| | Web (Next.js) | App (Expo) |
|---|---|---|
| Vai trò | Được tìm thấy: SEO, trang đích `/{thành phố}/{danh mục}`, link chia sẻ, đặt lịch không cần cài | Dùng lặp lại: khách quen, và **freelancer làm việc hằng ngày** |
| Chỉ app mới làm tốt | — | Thông báo đẩy (xác nhận trong 2 giờ là sống còn), camera + quay video để đăng bài, chat realtime, vị trí, haptics, chuyển cảnh mượt |
| Người dùng desktop | Shop/nhãn hàng thuê mẫu + photographer (ngành mới), admin | — |

**Cách giữ một hệ thiết kế:** token viết một lần dạng JSON trong `packages/tokens`, sinh ra biến CSS cho Tailwind (web)
và object theme cho React Native (app). Logic thuần (`pricing`, `catalog`, `geo`, `trust`) tách vào `packages/core`
như `docs/AUDIT_2026-09-22.md` đợt F đã nêu.

**Thư viện app đề xuất:** `expo-image` (cache ảnh), `expo-video`, `@shopify/flash-list` (feed dài),
`@gorhom/bottom-sheet`, `react-native-reanimated` (shared element), `expo-haptics`, `expo-notifications`.

**Thứ tự:** làm lại hệ thiết kế + web trước (thấy kết quả nhanh, không cần tài khoản App Store),
rồi mới dựng app trên đúng bộ thành phần đó. Không vẽ app theo kiểu riêng rồi sau này hợp nhất.

---

## 2. Trang chủ

### 2.1 Câu hỏi: xếp theo người hay theo thứ tự đăng bài?

| Cách | Được | Mất |
|---|---|---|
| **A. Theo thứ tự đăng bài** | Dễ hiểu, công bằng, thưởng người chịu đăng | Ai đăng 20 bài một lúc chiếm cả trang; bài xấu mới đăng nổi lên đầu; bài ở xa khách vẫn hiện; khi ít người đăng thì feed đứng yên cả tuần |
| **B. Theo từng người** | Đúng đơn vị khách cần để đặt (người, giá, khoảng cách, đánh giá) | Giống danh bạ, ít cảm hứng; khách đến để "xem mẫu đẹp" |
| **C. Theo bài, có xếp hạng + luật đa dạng** | Có cảm hứng như Instagram, vẫn ưu tiên thứ khách đặt được | Phải làm công thức, cần dữ liệu tương tác |

**Đề xuất: C làm mặc định, A và B đều có chỗ riêng.**

- Tab **"Dành cho bạn"** (mặc định): bài đăng xếp hạng + luật đa dạng (2.3).
- Tab **"Mới nhất"**: đúng thứ tự đăng, trong khu vực khách chọn. Đây là câu trả lời cho người muốn "theo thứ tự đăng".
- Tab **"Đang theo dõi"**: đúng thứ tự đăng, chỉ người khách theo dõi. Chỉ hiện khi đã đăng nhập; trống thì gợi ý 6 người để theo dõi.
- **Theo từng người**: khối "Gần bạn, còn lịch" chen trong feed và trang `/pros`.

**Luật theo mật độ nguồn cung (quan trọng với giai đoạn hiện tại):**
nếu một thành phố có **dưới ~30 freelancer đang hoạt động** hoặc dưới ~150 bài, trang chủ đổi sang bố cục
**người trước**: danh sách thẻ người (mỗi thẻ 3 ảnh + giá từ + khoảng cách), feed bài xuống dưới.
Lý do: với 7 người, feed bài sẽ lặp một người liên tục và khách tưởng app vắng. Ngưỡng này là tham số, chỉnh được ở admin.

### 2.2 Bố cục trang chủ (mobile, khách chưa đăng nhập)

```
┌─────────────────────────────────┐
│ 📍 Hà Nội ▾      360đẹp    💬 🔔 │  thanh trên
├─────────────────────────────────┤
│ 🔍 Bạn muốn làm gì hôm nay?      │  tìm kiếm
│ [Nail thứ 7] [Chụp cafe] [Makeup tiệc]  ← gợi ý theo thời điểm (cuối tuần, dịp lễ)
├─────────────────────────────────┤
│  Tất cả | Làm đẹp | Chụp & quay | Mẫu │  công tắc ngành, dính khi cuộn
├─────────────────────────────────┤
│ (◯)(◯)(◯)(◯)(◯)(◯) →            │  danh mục = ảnh tròn thật, không phải icon
│ Nail Makeup Da  Tóc Photophone Clip   │
├─────────────────────────────────┤
│ Theo dịp                          │
│ [Áo dài Tết ][Kỷ yếu ][Hẹn hò ] → │  gói dịp: makeup + chụp (+ mẫu)
├─────────────────────────────────┤
│ Gần bạn, còn lịch       Xem hết → │  khối NGƯỜI (thẻ ngang, 3 ảnh mỗi thẻ)
│ [Ngọc Bảo ✓ ★4.9 1,2km từ 250k] → │
├─────────────────────────────────┤
│ Dành cho bạn | Mới nhất | Đang theo dõi │
│ ┌────┐ ┌────┐                    │  feed BÀI, 2 cột
│ │    │ │    │                    │
│ └────┘ └────┘                    │
│   ... 8–10 bài ...               │
│ ▸ khối chen: "Tuyển mẫu đang mở" │  xen module mỗi 8–10 bài
│   ... 8–10 bài ...               │
│ ▸ khối chen: "Đánh giá có ảnh"   │
│   ...                            │
├─────────────────────────────────┤
│ Bạn làm nail/makeup/chụp ảnh?     │  tuyển freelancer, cuối trang
└─────────────────────────────────┘
```

Thay đổi so với bây giờ:
- **Banner "Bản demo"** thành một dòng mảnh có nút đóng (vẫn giữ để trung thực), không còn là khối vàng giữa trang.
- **CTA "Chưa tìm được mẫu ưng ý? Đăng yêu cầu"** rời khỏi đầu trang, chuyển vào nút ＋ giữa tab bar và cuối feed.
- **Gói dịp** là khối mới, mở trang đích tổng hợp (ví dụ `/dip/ao-dai-tet`): makeup + photophone + trang phục gợi ý, giá combo.
- **Gợi ý theo thời điểm** dựa lịch: tối thứ 6 → "Nail cuối tuần"; tháng 12–1 → "Chụp áo dài Tết"; trước 20/10 → "Makeup đi tiệc".

**Theo trạng thái người dùng:**

| Người dùng | Khác biệt |
|---|---|
| Chưa đăng nhập | Như trên; tab mặc định là "Dành cho bạn" nhưng xếp theo khu vực + chất lượng (không giả vờ cá nhân hoá) |
| Đăng nhập lần đầu | Một màn "Bạn quan tâm gì?" chọn 3 chip (Nail, Chụp cafe, Làm mẫu...). Đây là dữ liệu cá nhân hoá thật đầu tiên |
| Có lịch sử | Thêm hàng "Đặt lại" (người đã từng đặt), "Dành cho bạn" dùng danh mục đã xem/lưu/đặt |
| Freelancer | Mở app vào thẳng "Hôm nay" của Studio; khám phá vẫn vào được từ tab |

**Desktop:** hero thấp (≤320px) gồm câu hứa + ô tìm kiếm to + collage 4–5 ảnh thật bên phải;
bên dưới là công tắc ngành, danh mục, gói dịp, khối người (4 thẻ/hàng), feed 4 cột.

### 2.3 Công thức xếp hạng "Dành cho bạn"

**Bước 1 — chấm điểm từng bài** (các trọng số là điểm xuất phát, chỉnh bằng dữ liệu thật sau):

```
điểm = 3,0 × phù hợp      (ngành/danh mục khách đã chọn, xem, lưu, đặt; 0–1)
     + 2,0 × gần          (1 − km/bán kính freelancer; 0 nếu ngoài phạm vi)
     + 2,0 × chất lượng   (★ Bayes: kéo về trung bình khi ít đánh giá; + xác minh; + tỉ lệ hoàn thành)
     + 1,5 × mới          (giảm một nửa sau mỗi 7 ngày)
     + 1,5 × hấp dẫn      (tỉ lệ lưu / lượt hiển thị, tỉ lệ bấm "Đặt mẫu này"; chỉ khi đủ ≥200 lượt hiển thị)
     + 1,0 × còn lịch     (freelancer có khung trống trong 7 ngày tới, lấy từ free_slots thật)
     − phạt               (tỉ lệ huỷ cao, bị báo cáo, ví âm quá hạn → không hiện)
```

Không dùng "lượt thích" (dự án đã bỏ đếm like, và like dễ bơm). Không bán vị trí (giữ luật hiện tại);
nếu sau này có quảng cáo thì gắn nhãn "Được tài trợ" và giới hạn 1/12 ô.

**Bước 2 — sắp lại cho đa dạng:**
- Tối đa **1 bài của cùng một người trong 6 ô liên tiếp**; tối đa **3 bài/người trên một trang** (24 bài).
- Không quá 3 ô cùng danh mục liên tiếp; ở chế độ "Tất cả" thì xen các ngành.
- **Suất cho người mới:** freelancer đã đủ hồ sơ, trong 14 ngày đầu, được ít nhất 1 ô trong mỗi 12 ô.
  Không có cái này thì người mới không bao giờ có đánh giá đầu tiên.
- Bài khách đã xem chi tiết trong 3 ngày thì hạ xuống.

**Dữ liệu cần thêm:** bảng `feed_events` (hiển thị, mở chi tiết, lưu, bấm đặt) ghi theo lô, và một RPC
`feed_for(khách, khu vực, ngành, tab, trang)` trả kết quả đã xếp. Chỉ lưu số liệu gộp theo bài/ngày cho xếp hạng.

### 2.4 "Bài đăng" cần mở rộng

Hiện `works` chỉ là ảnh + mẫu dịch vụ. Để feed phong phú và phục vụ ngành mới:

| Loại bài | Nội dung | Nút chính |
|---|---|---|
| Tác phẩm | 1–10 ảnh hoặc video ≤60 giây, gắn dịch vụ + giá từ | Đặt mẫu này |
| Trước / sau | Cặp ảnh, xem bằng thanh kéo | Đặt mẫu này |
| Tuyển mẫu | "Cần mẫu tay làm nail miễn phí thứ 7, Cầu Giấy" | Ứng tuyển |
| Đánh giá có ảnh | Ảnh khách đăng kèm đánh giá (khách đồng ý hiển thị) | Xem người làm |

---

## 3. Mở rộng ngành

### 3.1 Khung chung

360dep đổi câu định vị từ "đặt thợ làm đẹp tại nhà" thành **"đặt người giúp bạn lên hình đẹp"**,
gồm 3 ngành. Ba ngành này nuôi nhau:

```
      Làm đẹp ──── cần ảnh portfolio ────▶ Chụp & quay
         ▲  │                                  │
 cần mẫu │  └── khách làm đẹp xong muốn chụp ──┘
 luyện tay│                                     │
         └──────────── Người mẫu ◀── shop/photographer cần mẫu
```

- Thợ nail/makeup cần **mẫu** để luyện tay và làm portfolio, cần **người chụp** để có ảnh đẹp đăng lên 360dep.
- Khách vừa làm makeup xong là lúc muốn **chụp** nhất.
- Shop online chụp lookbook cần cùng lúc **mẫu + makeup + làm tóc + người chụp**. Theo các bảng giá công khai,
  một buổi lookbook thường gồm mẫu (khoảng 400–500 nghìn/giờ hoặc tính theo bộ đồ), makeup (khoảng 500 nghìn),
  làm tóc (khoảng 300 nghìn), studio (200–300 nghìn/giờ). Shop đang phải tự gom từng người; 360dep gom được.

Đây là lợi thế mà một app chỉ làm đẹp hoặc chỉ chụp ảnh không có: **đặt combo nhiều người cho một buổi**.

### 3.2 Ngành Chụp & quay (photophone)

**Ai đặt**

| Nhóm khách | Nhu cầu điển hình |
|---|---|
| Cá nhân, Gen Z | Chụp đi cafe, hẹn hò, sinh nhật, kỷ yếu/tốt nghiệp, áo dài Tết, ảnh hồ sơ/CV, bầu, gia đình |
| Du lịch | "Photo tour" ở Đà Lạt, Hội An, Phú Quốc, phố cổ Hà Nội |
| Shop online | Chụp sản phẩm, quay video TikTok Shop/Reels, quay hỗ trợ livestream |
| Quán, spa, tiệm | Clip giới thiệu ngắn, ảnh menu |
| Chính freelancer 360dep | Chụp portfolio tác phẩm (nhu cầu nội bộ) |

Nguồn cung có thật: nghề chụp dạo bằng iPhone đang được giới trẻ làm như việc chính hoặc tay trái
(Znews có bài về một bạn Gen Z ở TP.HCM kiếm khoảng 18 triệu/tháng bằng iPhone 13), và đã có các thương hiệu
photophone theo giờ ở TP.HCM.

**Danh mục dịch vụ (bổ sung vào `lib/catalog.ts`, khung giá cần khảo sát 20–30 người làm nghề trước khi chốt)**

| Dịch vụ | Gói (biến thể) | Thành phẩm | Ghi chú |
|---|---|---|---|
| Photophone cá nhân | 30 / 60 / 90 / 120 phút | N ảnh chỉnh + toàn bộ ảnh gốc | Phổ biến nhất, vào cửa |
| Chụp máy ảnh | 60 / 120 phút, nửa ngày | N ảnh chỉnh | Tách khỏi photophone vì giá khác hẳn |
| Quay clip ngắn | 1 / 3 / 5 clip, 15–60 giây | Clip đã dựng, nhạc, phụ đề | Cho cá nhân và shop |
| Chụp sản phẩm | 10 / 30 / 50 sản phẩm, nền trơn hoặc bối cảnh | Ảnh đã tách nền/chỉnh | Tính theo sản phẩm, không theo giờ |
| Chụp sự kiện nhỏ | Theo giờ | Ảnh chỉnh chọn lọc | Sinh nhật, tiệc công ty nhỏ |
| Photo tour | Nửa ngày / 1 ngày | Ảnh chỉnh | Theo địa điểm du lịch |

**Tuỳ chọn cộng thêm:** thêm ảnh chỉnh, giao gấp trong 24 giờ, thêm địa điểm, quay hậu trường, thuê phụ kiện/đạo cụ,
**quyền sử dụng thương mại** (shop dùng quảng cáo thì giá cao hơn dùng cá nhân).

**Luồng đặt khác làm đẹp ở đâu — cần sửa sản phẩm/dữ liệu:**

| Khác biệt | Hiện tại | Cần làm |
|---|---|---|
| Địa điểm | Nhà khách hoặc studio của thợ | Thêm "ngoài trời / quán / studio thuê", có thể nhiều điểm; phí vào cửa địa điểm do khách trả, ghi rõ |
| Thành phẩm | Làm xong là xong | Thêm giai đoạn **giao file**: Đã chụp → Đang chỉnh → Đã giao (có hạn giao) → Khách xác nhận. Quá hạn giao thì nhắc và ảnh hưởng xếp hạng |
| Cách giao | — | Freelancer dán link Drive/Photos + đăng 3–5 ảnh xem trước trong app. Không lưu toàn bộ file gốc trên 360dep (chi phí lưu trữ) |
| Thời tiết | — | Chụp ngoài trời: đổi lịch miễn phí khi mưa, một bên đề xuất bên kia chấp nhận |
| Quyền hình ảnh | — | Khi đặt: chọn mục đích sử dụng (cá nhân/thương mại); ô "Đồng ý cho freelancer đăng ảnh làm tác phẩm". Ảnh khách đồng ý đăng là nguồn bài đăng miễn phí cho feed |
| Thiết bị | — | Trường "Thiết bị" trên hồ sơ (iPhone 16 Pro, máy ảnh...), lọc được |
| Video | Chỉ ảnh | Bài đăng có video ≤60 giây. Cần chọn nơi lưu và nén (Supabase Storage + giới hạn 720p, hoặc Cloudflare Stream/Mux). **Có chi phí, cần anh duyệt** |

**Đặt combo (tính năng chủ lực):**
khách chọn "Makeup + chụp" → chọn 2 người (hoặc một **đội** đã ghép sẵn) → một khung giờ, một địa điểm →
tạo 2 lịch hẹn liên kết (`booking_group`). Một bên huỷ thì bên kia được hỏi giữ hay huỷ.
Freelancer hay làm chung có thể tạo **Đội** (makeup + photographer) để khách đặt một lần.

### 3.3 Ngành Người mẫu

Tách 2 mảng rất khác nhau về rủi ro:

**A. Tuyển mẫu cho thợ làm đẹp (làm trước)**
- Thợ nail/makeup/tóc/mi đăng: "Cần 2 mẫu tay, làm gel miễn phí, thứ 7, Cầu Giấy" hoặc "Cần mẫu makeup cô dâu để chụp portfolio".
- Khách ứng tuyển, được làm đẹp **miễn phí hoặc giảm giá**, đổi lại cho phép chụp và đăng ảnh.
- Tái dùng gần như nguyên cơ chế "Đăng yêu cầu – báo giá" (`jobs`/`offers`), chỉ đảo chiều: freelancer đăng, khách ứng tuyển.
- Lợi ích: kéo khách mới vào miễn phí, freelancer mới có tác phẩm và đánh giá đầu tiên, feed có thêm bài.
- Không có tiền nên không có hoa hồng; đây là công cụ tăng trưởng, không phải nguồn thu.

**B. Mẫu có thù lao (làm sau, khi đã có công cụ an toàn)**
- Khách hàng: shop thời trang/mỹ phẩm, photographer, người làm clip.
- Loại việc: chụp lookbook, mặc thử đồ, mẫu tay cầm sản phẩm, mẫu livestream, diễn viên clip ngắn.
- Tính giá: theo giờ, theo buổi, hoặc theo bộ đồ; cộng thêm theo **phạm vi sử dụng hình ảnh** (mạng xã hội / quảng cáo trả tiền / in ấn, thời hạn).
- Luồng: bên thuê đăng **brief** (loại việc, ngày, địa điểm, thời lượng, trang phục, phạm vi sử dụng ảnh, thù lao) →
  mẫu ứng tuyển hoặc được mời → chọn → thành lịch hẹn. Cũng tái dùng `jobs`/`offers`.

**Hồ sơ mẫu:** bộ ảnh chuẩn (mặt, nửa người, toàn thân, nghiêng), chiều cao, size áo/giày; số đo là **tuỳ chọn và chỉ
hiện cho bên thuê đã xác minh**; phong cách; loại việc nhận / **không nhận**; khu vực; giá.

**An toàn — điều kiện bắt buộc trước khi mở mảng B** (mảng tuyển mẫu là nơi lừa đảo và quấy rối rất phổ biến):
1. **Xác minh CCCD bắt buộc cho cả hai phía** (với làm đẹp đang là tự nguyện). Mẫu phải đủ 18 tuổi.
2. Không hỗ trợ nội dung nhạy cảm: nội y, khoả thân, "gợi cảm" → cấm trong brief, có bộ lọc từ khoá và nút báo cáo.
3. Địa điểm phải là nơi công khai hoặc studio có địa chỉ; không nhận brief "gặp ở nhà riêng" cho lần đầu.
4. Cảnh báo trong chat khi xuất hiện "đặt cọc", "phí hồ sơ", "chuyển khoản trước": **bên thuê không bao giờ được thu tiền của mẫu**. Đây là chiêu lừa phổ biến nhất.
5. Che số điện thoại tới khi lịch được nhận (đã có), chia sẻ lịch hẹn cho người thân (đã có), thêm nút khẩn cấp.
6. Đánh giá **hai chiều**: mẫu đánh giá bên thuê.
7. Thoả thuận sử dụng hình ảnh tự sinh từ brief, hai bên bấm đồng ý. Căn cứ: Điều 32 Bộ luật Dân sự 2015 —
   dùng hình ảnh của một người phải được người đó đồng ý, dùng vì mục đích thương mại thì phải trả thù lao
   (trừ khi có thoả thuận khác). Nên nhờ luật sư đọc lại mẫu thoả thuận trước khi mở.

**Chưa làm:** KOC/review có thù lao (là thị trường influencer marketing, khác hẳn).

### 3.4 Thay đổi dữ liệu (mức khái niệm, chưa phải migration)

| Chỗ | Thay đổi |
|---|---|
| `category_id` (enum Postgres) | Chuyển sang bảng `verticals` + `categories` để admin thêm danh mục không cần migration |
| `service_templates` | Thêm: `location_mode` (nhà khách / studio / ngoài trời, nhiều điểm), `pricing_unit` (giờ / sản phẩm / clip / bộ đồ), `deliverables` (số ảnh, số clip, hạn giao) |
| `bookings` | Trạng thái giao file (`shot`, `editing`, `delivered`, `accepted`); `usage_scope`; `consent_repost`; `booking_group_id` cho combo |
| `works` → bài đăng | Thêm `kind` (tác phẩm / trước-sau / tuyển mẫu / đánh giá), `media` gồm ảnh và video |
| Mới | `model_profiles`, `teams` + `team_members`, `feed_events`; `jobs` thêm `kind` (yêu cầu / tuyển mẫu / brief) và `direction` |
| Xác minh | Cờ "bắt buộc xác minh" theo ngành |
| Hoa hồng | Giữ 15% cho mọi lịch có tiền; tuyển mẫu miễn phí không thu. Xem lại mức hoa hồng cho chụp sản phẩm/brief giá trị lớn |

### 3.5 Thứ tự mở ngành

Giữ nguyên bài học trong `docs/PLAN.md`: marketplace chết vì loãng. Mở từng ngành, mỗi ngành bắt đầu bằng một
use case hẹp, tuyển tay nguồn cung trước khi mở cho khách.

| Thứ tự | Ngành / mảng | Use case mở màn | Vì sao lúc này |
|---|---|---|---|
| 1 | Tuyển mẫu cho thợ làm đẹp | "Làm nail/makeup miễn phí để thợ chụp portfolio" | Rẻ, tái dùng `jobs/offers`, ngay lập tức làm feed có bài và thợ mới có đánh giá |
| 2 | Chụp & quay | **Makeup + chụp áo dài Tết** | Mùa ảnh áo dài Tết bắt đầu khoảng giữa tháng 12/2026; cần có 20–30 photophone ở 1 thành phố trước đó |
| 3 | Chụp & quay cho shop | Chụp sản phẩm, clip TikTok Shop | Giá trị đơn cao hơn, khách đặt lặp lại; cần giao diện desktop tốt |
| 4 | Mẫu có thù lao | Mẫu lookbook cho shop (combo mẫu + makeup + chụp) | Chỉ mở khi xác minh bắt buộc, cảnh báo lừa đảo, đánh giá hai chiều đã chạy |

---

## 4. Lộ trình đề xuất

| Đợt | Nội dung | Ước lượng | Nghiệm thu |
|---|---|---|---|
| **UI-0** | Chốt hướng hình ảnh: mình dựng 2–3 bản prototype HTML tĩnh cho trang chủ + thẻ + hồ sơ để anh chọn | 2–3 ngày | Anh chọn một hướng |
| **UI-1** | Token + bộ thành phần lõi; làm lại trang chủ, thẻ bài, thẻ người, chi tiết bài; logo mới | 1 tuần | 1280px không có thẻ <250px; mọi thẻ có giá + khu vực; Lighthouse a11y ≥95 |
| **UI-2** | Tìm kiếm (danh sách + bản đồ), hồ sơ, sheet đặt lịch, dòng thời gian lịch hẹn, "Hôm nay" của Studio | 1 tuần | 5 người dùng thật tự đặt xong không hỏi |
| **FEED** | `feed_events`, RPC xếp hạng, luật đa dạng, 3 tab, bố cục theo mật độ cung | 3–4 ngày | Không quá 1 bài/người trong 6 ô; người mới có suất hiển thị |
| **APP-1** | `packages/core` + `packages/tokens`; app Expo: đăng nhập Google, khám phá, chi tiết, hồ sơ, đặt lịch, lịch hẹn, chat, thông báo đẩy; chế độ freelancer: Hôm nay, việc mới, đăng bài bằng camera | 3–4 tuần | Chạy trên máy thật iOS + Android; cần tài khoản Apple/Google của anh để lên store |
| **V1** | Tuyển mẫu cho thợ làm đẹp | 1 tuần | 10 bài tuyển mẫu thật, ≥5 lượt ứng tuyển thành lịch |
| **V2** | Chụp & quay: danh mục, video, giao file, combo, trang đích gói dịp | 2–3 tuần | Xong trước 15/12/2026; 20–30 photophone đã onboard |
| **V3** | Mẫu có thù lao + bộ công cụ an toàn | 2 tuần | Toàn bộ 7 điều kiện ở 3.3 chạy được và có test |

UI-1/UI-2 và FEED chạy trước; V1 chen được sau UI-1 vì nhỏ. APP-1 chỉ bắt đầu khi bộ thành phần web đã ổn.

---

## 5. Quyết định cần anh chốt

1. **Hướng hình ảnh:** đồng ý bỏ tông hồng spa + Playfair, chuyển sang "tạp chí đời thường" (trắng ấm, chữ đen, một màu đỏ son)? Hay muốn mình dựng 2–3 hướng để so trước (UI-0)?
2. **Thuật ngữ chung khi có 3 ngành:** gọi chung là "freelancer", hay dùng tên nghề cụ thể (thợ nail, makeup artist, thợ chụp, mẫu) và chỉ dùng "freelancer" khi bắt buộc? Mình nghiêng về cách thứ hai.
3. **Trang chủ mặc định:** "Tất cả ngành", hay nhớ ngành khách xem gần nhất?
4. **Chụp & quay trước Tết:** có đặt mục tiêu mở trước 15/12/2026 không? Nếu có, ai sẽ tuyển tay 20–30 photophone, và ở thành phố nào?
5. **Người mẫu:** chỉ làm tuyển mẫu cho thợ làm đẹp trước (đề xuất), hay mở cả mẫu có thù lao?
6. **Video:** chấp nhận chi phí lưu và phát video? Mình sẽ ước tính chi phí theo số bài/tháng trước khi anh quyết.
7. **App:** một app hai chế độ khách/freelancer (như web hiện tại, đề xuất), hay app riêng cho freelancer trước?
8. **Logo/tên hiển thị:** giữ "360dep" hay viết "360đẹp" có dấu trên giao diện?

---

Nguồn tham khảo cho mục 3:
- Znews — "Chụp ảnh 'dạo' bằng iPhone 13, Gen Z TP.HCM kiếm 18 triệu đồng/tháng": https://lifestyle.znews.vn/chup-anh-dao-bang-iphone-13-gen-z-tphcm-kiem-18-trieu-dongthang-post1510574.html
- Photophone Sài Gòn (dịch vụ chụp theo giờ bằng điện thoại): https://photophonesaigon.vn/chup-hinh-dien-thoai/
- Bảng giá thuê mẫu và chi phí buổi lookbook: https://juvamedia.com/gia-thue-mau-chup-anh/ · https://studiochupanhdep.com/gia-thue-mau-chup-lookbook_517.html · https://rimo.vn/gia-thue-mau-chup-anh-quan-ao/

---

## 6. Nhật ký thực hiện (23/09/2026, nhánh `feat/redesign-verticals`)

Anh chọn "code hết". Các quyết định ở mục 5 được lấy theo đề xuất: hướng "tạp chí đời thường" (bỏ hồng spa + Playfair),
tên nghề cụ thể + "người làm" khi nói chung, trang chủ mặc định "Tất cả", một app hai chế độ, giữ chữ "360dep".

**Hệ thiết kế**: `lib/design/tokens.ts` là nguồn duy nhất cho web (`app/globals.css`, có test đối chiếu) và app
(`apps/mobile`). Một màu nhấn đỏ son `#C42D45`, nút chính màu đen, chữ Be Vietnam Pro, không chữ nào dưới 12px.
Logo mới (vòng ống kính + chấm đỏ), ảnh chia sẻ và trang lỗi không còn tên cũ "dep360".

**Trang chủ & feed** (`app/page.tsx`, `lib/feed.ts`, `lib/occasions.ts`): đúng bố cục mục 2.2; công thức xếp hạng
và luật đa dạng ở mục 2.3 có 14 test; bố cục "người trước" khi cung mỏng; lượt hiển thị/mở/lưu/bấm đặt gửi theo lô,
không gắn tài khoản (`lib/feed-events.ts` → `log_work_events`).

**Ngành mới**: 16 dịch vụ chụp & quay, người mẫu trong `lib/catalog.ts`; bài đăng ảnh / trước-sau / clip ≤60 giây
(xoá GPS trong clip bằng `lib/video-meta.ts`, có test); giao file sau buổi chụp; quyền dùng ảnh và đồng ý đăng lại;
đặt chung một buổi; tuyển mẫu (`/tuyen-mau`, `/studio/tuyen-mau`); thẻ người mẫu không có số đo; dịch vụ người mẫu
và tin có thù lao chỉ mở khi đã xác minh; bộ lọc nội dung cấm; đánh giá hai chiều.

**Màn hình web làm lại**: trang chủ, chi tiết bài, hồ sơ, người làm, tìm kiếm, theo dịp (`/dip/[id]`), trang đích SEO,
đã lưu, đặt lịch, lịch hẹn (dòng thời gian), Studio "Hôm nay", đăng tác phẩm, hồ sơ Studio, đăng ký, bảng giá, Tôi,
đăng nhập, chính sách.

**App mobile** (`apps/mobile`): màn thật cho khách và Studio, dùng chung token và thuật toán feed qua `src/shared.ts`.
Một số màn ít dùng mở trang web trong app (xem `apps/mobile/README.md`).

**Chưa kiểm chứng / còn lại**
- 12 migration `20260923*` chưa chạy trên Supabase thật (Docker trên máy treo); đã chạy trên PGlite. Cần
  `supabase start && npm run db:test && npm run test:db`, rồi sinh lại `lib/supabase/database.types.ts`.
- Web đọc được database chưa có migration (tự lùi về truy vấn cũ), nhưng tính năng mới chỉ chạy sau khi áp migration.
- App chưa chạy trên simulator (Xcode chưa được chọn); đăng nhập Google cần development build, không chạy trong Expo Go.
- Push notification cho app chưa có bảng lưu token.
- Khung giá chụp & quay, người mẫu cần khảo sát lại với 20–30 người làm nghề.
