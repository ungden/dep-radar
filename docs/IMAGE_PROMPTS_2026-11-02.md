# Prompt ảnh minh hoạ cho app 360đẹp (02/11/2026)

Bộ ảnh minh hoạ bổ sung cho bản redesign photo-first (Khám phá, Danh sách dịch vụ, Chi tiết dịch vụ).
Ảnh đã tạo đi vào `lib/design/photos.ts` (`CATEGORY_PHOTOS`). Web và app đều đọc từ đó, app tải qua `https://www.360dep.vn/images/...`.

## Ảnh này dùng vào đâu, không dùng vào đâu

- **Chỉ dùng** ở chỗ chưa có tác phẩm thật: thẻ dịch vụ chưa có ảnh, thẻ "Sắp có", gallery chi tiết dịch vụ khi chưa ai đăng ảnh, ô danh mục.
- Mọi chỗ hiện ảnh này đều có nhãn **"Ảnh minh hoạ"** (đã có trong code).
- **Không** dùng làm ảnh tác phẩm, avatar hay portfolio của bất kỳ người làm nào, và không đưa vào bảng `works`.
- Không người nổi tiếng, không logo hay thương hiệu, không chữ trên ảnh, không watermark.

## Vì sao cần bộ này

Gallery chi tiết dịch vụ hiện 3 ảnh minh hoạ, lưới "Sắp có" hiện nhiều thẻ cùng danh mục. Các danh mục Chụp & quay và Người mẫu hiện **chỉ có 1 ảnh**, nên cùng một ảnh lặp lại 3 lần. Ưu tiên tạo nhóm A trước.

## Thông số chung

| | |
|---|---|
| Tỉ lệ | **4:5 dọc**, xuất 1000 × 1250 px |
| Định dạng | WebP, chất lượng khoảng 80, mỗi ảnh nên dưới 150 KB |
| Tên file | đúng như bảng dưới, chữ thường, gạch ngang |
| Thư mục | `public/images/catalog/` (Chụp & quay, Người mẫu, banner) · `public/images/works/` (làm đẹp) |

### Đoạn phong cách: dán vào đầu MỌI prompt

```
Candid smartphone photo, natural window daylight, shot on a recent iPhone main camera,
slight grain, true-to-life skin texture with visible pores, no retouching, no beauty filter.
Real lived-in Vietnamese apartment or street setting (Hanoi / Ho Chi Minh City), warm neutral
tones, cream and beige interiors, a few plants. Vietnamese people in their 20s-30s, natural
expressions, modest everyday clothing. Documentary behind-the-scenes feel, not an advertisement.
Vertical 4:5 composition, subject clearly readable at thumbnail size, uncluttered background.
No text, no logos, no brand names, no watermark, no celebrities.
```

### Negative prompt (nếu công cụ hỗ trợ)

```
text, letters, logo, watermark, brand, studio backdrop, ring of perfect lights in frame center,
plastic skin, airbrushed, heavy makeup filter, glamour pose, cleavage, lingerie, bare torso,
extra fingers, deformed hands, distorted nails, blurry face, Western stock-photo look, collage
```

## Nhóm A: Chụp & quay, Người mẫu (ưu tiên)

Mỗi danh mục hiện có 1 ảnh, cần thêm 3. Thư mục `public/images/catalog/`.

| File | Danh mục | Prompt (sau đoạn phong cách) |
|---|---|---|
| `photophone-2.webp` | Chụp điện thoại | Over-the-shoulder view of a young woman photographer holding a phone vertically, framing a friend who sits on the steps of an old yellow French-colonial building, the phone screen shows the portrait, soft late-afternoon light. |
| `photophone-3.webp` | Chụp điện thoại | A photographer crouching low on a quiet Hanoi lake-side path, phone held near the ground, shooting a woman in a light linen dress walking towards camera, trees and water softly blurred. |
| `photophone-4.webp` | Chụp điện thoại | Close-up of two hands holding a phone with a portrait on screen, the subject slightly out of focus behind it at a café table with iced coffee, morning light. |
| `camera-2.webp` | Chụp máy ảnh | A photographer with a mirrorless camera and a small reflector held by an assistant, photographing a woman in a pastel áo dài in a sunny residential alley with bougainvillea. |
| `camera-3.webp` | Chụp máy ảnh | Behind-the-scenes in a bright apartment: a photographer checks the camera screen while a young couple sits on a sofa, laughing; tripod and a camera bag on the floor. |
| `camera-4.webp` | Chụp máy ảnh | A graduate in a gown and cap tossing flowers on a university lawn, photographer in the foreground slightly out of focus with camera raised. |
| `short-video-2.webp` | Quay clip ngắn | A creator filming a short vertical video of a friend pouring coffee in a small café; phone on a handheld gimbal, the phone screen visible showing the shot. |
| `short-video-3.webp` | Quay clip ngắn | A woman filming herself unboxing a pair of shoes at a wooden desk, phone on a small tripod, a second person adjusting a small LED light at the side. |
| `short-video-4.webp` | Quay clip ngắn | Street-level view of a videographer walking backwards filming a smiling woman on a Saigon sidewalk with motorbikes softly blurred in the background, phone in vertical orientation. |
| `product-photo-2.webp` | Chụp sản phẩm | Top-down flat-lay being shot: hands arranging a handmade ceramic cup, dried flowers and linen on a beige table, phone on an overhead arm visible at the edge of the frame. |
| `product-photo-3.webp` | Chụp sản phẩm | A small online-shop owner photographing folded cotton T-shirts on a white sheet by a window, foam board reflector leaning nearby, phone in hand. |
| `product-photo-4.webp` | Chụp sản phẩm | Close-up of a skincare bottle with no label on a stone tray with water droplets and leaves, a phone camera in the foreground focusing on it. |
| `model-photo-2.webp` | Mẫu ảnh | A model in a plain beige blouse and wide trousers posing against a cream wall for a clothing shop, a photographer's phone in the foreground framing her full body. |
| `model-photo-3.webp` | Mẫu ảnh | A model wearing a simple linen dress holding a woven bag, standing in a quiet green alley, an assistant just out of frame holding the next outfit on a hanger. |
| `model-photo-4.webp` | Mẫu ảnh | Indoor clothing-shop shoot: a model sitting on a wooden stool, rack of clothes behind her, she adjusts the sleeve of a cardigan while a phone on a tripod records. |
| `model-video-2.webp` | Mẫu clip & livestream | A woman hosting a livestream for a fashion shop, holding up a knitted cardigan to a phone on a tripod with a ring light at the side; the phone screen shows a live chat (blurred, unreadable). |
| `model-video-3.webp` | Mẫu clip & livestream | A model turning around slowly in a flowy skirt for a short clip in a bright apartment, a creator filming with a phone held low, motion slightly visible in the skirt. |
| `model-video-4.webp` | Mẫu clip & livestream | Two women at a table presenting a lipstick (no brand) to a phone on a tripod for a review clip, small LED light, cosmetics neatly arranged. |

## Nhóm B: Làm đẹp (thêm cho đa dạng)

Thư mục `public/images/works/`. Tất cả ảnh đều diễn ra **tại nhà khách**, vì app là "Làm Đẹp Tại Nhà".

| File | Danh mục | Prompt (sau đoạn phong cách) |
|---|---|---|
| `massage-back-1.webp` | Massage | A professional therapist in a grey uniform massaging the shoulders of a client who lies face down on a foldable massage bed in a living room, client covered with a large towel from the shoulders down, calm and clinical, nothing sensual. |
| `massage-head-1.webp` | Massage | A therapist giving a seated head-and-neck massage to a fully clothed woman on a dining chair, laptop closed on the table, afternoon light. |
| `skin-mask-1.webp` | Chăm sóc da | A beautician in a black uniform applying a white cream mask with a brush to a client lying on a bed with a towel headband, small trolley with unbranded bottles beside her, bedroom setting. |
| `skin-steam-1.webp` | Chăm sóc da | Close-up of a facial steamer gently misting a relaxed client's face, the beautician's gloved hand holding a cotton pad, soft window light. |
| `hair-curl-1.webp` | Tóc | A hairstylist curling the long hair of a woman seated in front of a mirror at home with a curling iron, a few clips in the stylist's hair, getting ready for a party. |
| `hair-braid-1.webp` | Tóc | Back view of a stylist finishing a soft braided low bun with small pearl pins on a woman in a pale dress, mirror reflection partly visible. |
| `lash-apply-1.webp` | Mi & mày | A lash technician wearing a mask and loupe glasses applying lash extensions to a client lying on a bed with eyes closed, ring light off to the side, tidy tray of tweezers. |
| `brow-shape-1.webp` | Mi & mày | A technician measuring a client's eyebrow with a thin white mapping string, client sitting upright, close but not extreme close-up, natural light. |

Thêm xong thì nhóm B nằm trong `CATEGORY_PHOTOS` cạnh các ảnh hiện có (massage 4, skincare 6, tóc 6, mi & mày 6).

## Nhóm C: Banner và trạng thái trống (tuỳ chọn)

Chưa có chỗ nào trong app dùng tới, chỉ tạo khi cần.

| File | Dùng cho | Prompt (sau đoạn phong cách) |
|---|---|---|
| `catalog/request-banner.webp` (16:9, 1600 × 900) | Banner "Đăng yêu cầu" | A tidy beautician's kit opened on a wooden table at home (brushes, unbranded bottles, a towel), a phone lying next to it, warm morning light, lots of calm negative space on the left. |
| `catalog/empty-soon.webp` (4:5) | "Chưa có ai nhận" | A neatly folded white towel, a small plant and an unbranded tool pouch on a cream bedspread, quiet, minimal, inviting. |

## Kiểm tra trước khi dùng

1. **Tay và móng** (hay lỗi nhất): đủ 5 ngón, móng không méo, không dính nhau.
2. **Không có chữ** nào đọc được, kể cả trên màn hình điện thoại hay chai lọ.
3. **Nhìn được ở cỡ nhỏ**: thu ảnh về khoảng 170 px rộng (cỡ thẻ trong lưới), vẫn phải nhận ra dịch vụ là gì.
4. **Massage và người mẫu**: trang phục kín đáo, bối cảnh chuyên nghiệp, đúng quy định dịch vụ lành mạnh (`lib/conduct.ts`).
5. **Đồng bộ màu** với bộ hiện có: tông kem ấm, không quá hồng, không quá xanh.

## Trạng thái (03/11/2026)

Nhóm A và B đã tạo bằng Codex, đã gắn vào `lib/design/photos.ts`. Nhóm C chưa tạo vì chưa có chỗ dùng.

## Gắn vào code

Thêm đường dẫn vào `lib/design/photos.ts`, ví dụ:

```ts
photophone: [`${C}/photophone.webp`, `${C}/photophone-2.webp`, `${C}/photophone-3.webp`, `${C}/photophone-4.webp`],
massage: [`${W}/massage-neck.webp`, `${W}/massage-foot.webp`, `${W}/massage-cupping.webp`, `${W}/massage-back-1.webp`, `${W}/massage-head-1.webp`],
```

Ảnh được phục vụ từ web (`public/`), nên app chỉ hiện ảnh mới **sau khi web đã deploy**, không cần build lại app.
