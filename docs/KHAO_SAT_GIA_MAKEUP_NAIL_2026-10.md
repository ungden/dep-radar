# Khảo sát giá Makeup & Nail (10/2026)

Nguồn của bảng giá Makeup và Nail trong `lib/catalog.ts`. Đơn vị: nghìn đồng (k). Ba mức: Cơ bản / Chuyên nghiệp / Master.

## Cách làm

- **Điểm xuất phát:** bảng giá chủ dự án gửi ngày 21/10/2026. Đây là giá thợ ở **Nha Trang**; cấu trúc dịch vụ giữ nguyên: tóc đơn giản đã gồm trong giá, nail art tính theo ngón, kỷ yếu giảm theo nhóm.
- **Khảo sát thêm** bảng giá công khai (website studio/tiệm, trang đặt lịch, bài tổng hợp 2025–2026) ở **Hà Nội, TP.HCM, Đà Nẵng**, mỗi thành phố khoảng 15–20 nguồn cho makeup và 12–20 nguồn cho nail. Không đọc được Facebook/Zalo, nên giá của thợ chỉ đăng trên Facebook (thường ở mức thấp) bị thiếu.
- **Một bảng chung toàn quốc.** Mức thấp gần như giống nhau ở mọi nơi; chỉ mức cao chênh (Hà Nội, TP.HCM cao gấp khoảng 2 lần Nha Trang / Đà Nẵng với makeup cô dâu). Vì vậy ba mức trải rộng:
  - **Cơ bản** ≈ tầm trung ở Nha Trang / Đà Nẵng, thợ mới ở Hà Nội / TP.HCM.
  - **Chuyên nghiệp** ≈ giá phổ biến ở Hà Nội / TP.HCM.
  - **Master** ≈ thợ có tiếng, studio tầm khá ở Hà Nội / TP.HCM. Chưa tính mức người nổi tiếng (5–15 triệu một lần makeup cô dâu).
- Mức giá là giá đối tác tự chọn, không phải chứng nhận tay nghề. Một thợ giỏi ở Đà Nẵng chọn Cơ bản hay Chuyên nghiệp theo giá địa phương là bình thường.
- Nếu sau này đối tác ở một thành phố thấy bảng chung không hợp, có thể chuyển sang giá riêng theo thành phố. Việc này cần đổi cấu trúc dữ liệu (mức giá theo thành phố).

## Makeup

Gợi ý theo từng thành phố là mức các nguồn ở thành phố đó cho thấy; cột cuối là bảng 360đẹp.

| Dịch vụ | Nha Trang (bảng chủ) | Đà Nẵng | TP.HCM | Hà Nội | **360đẹp** |
| --- | --- | --- | --- | --- | --- |
| Đi làm / nhẹ (tóc đơn giản) | 250/300/400 | 250/320/420 | 250/350/600 | 250/400/700 | **250/350/600** |
| Dự tiệc (tóc đơn giản) | 300/350/450 | 300/380/500 | 350/500/900 | 350/550/1000 | **300/450/800** |
| Kỷ yếu 1 người | 250/300/400 | 250/320/420 | 250/350/550 | 300/400/600 | **250/350/550** |
| Kỷ yếu nhóm (mỗi người) | −10% / −15% / −20% | như Nha Trang | 2 người −10%, 5+ −20–25% | 5+ −10–20% | **2 người −10%, 3–4 người −15%, 5+ −20%** |
| Test makeup cô dâu | 800 | 900 | 400/700/1500 | 600/1000/1800 | **600/900/1500** |
| Dạm ngõ / đám hỏi | 1200/1500/1800 | 1300/1600/2000 | 1000/1800/3200 | 900/1500/2800 | **1000/1600/2800** |
| Gia tiên / tiệc cưới | 1500/1800/2000 | 1600/2000/2500 | 1300/2300/4500 | 1200/2000/3500 | **1300/2000/3500** |
| Trọn gói 2 lễ | — | — | 3500–9000 (gói) | — | **2300/3600/6300** (cộng 2 lễ) |
| Take care 1 buổi | 500 | 500 | 300/500/1000 | 300/500/800 | **300/500/800** |
| Theo dâu cả ngày | — | — | 1000/2000/3500 | 800/1500/2500 | **1000/1800/3000** |
| Mẹ cô dâu / chú rể | 400/450/500 | 450/550/700 | 400/550/900 | 400/650/1000 | **400/600/900** |
| Họ hàng / phụ dâu (mỗi người) | 350/400/500 | 350/400/500 | 250/350/550 | 250/350/500 | **300/400/500** |
| Chụp ảnh cưới studio | 1000/1200/1500 | 1100/1300/1700 | 1000/1500/2500 | 700/1100/1800 | **900/1300/2200** |
| Chụp ảnh cưới ngoại cảnh | 1200/1500/1800 | 1300/1650/2000 | 1400/2200/4000 | 1000/1600/2500 | **1200/1800/3000** |
| Sự kiện / MC | 500/650/800 | 500/650/800 | 400/700/1500 | 450/700/1200 | **450/700/1200** |
| Tóc cầu kỳ (đặt kèm) | +150 | +150 | +50/100/200 | +100/200/300 | **100/150/250** |

## Nail

| Dịch vụ | Nha Trang (bảng chủ) | Đà Nẵng | TP.HCM | Hà Nội | **360đẹp** |
| --- | --- | --- | --- | --- | --- |
| Sơn gel trơn tay (cắt da + 1 màu) | 85/100/120 | 85/100/130 | 110/140/180 | 120/150/200 | **90/130/180** |
| Sơn gel trơn tay + chân | — | — | 160/190/230 (tiệm) | — | **170/240/340** |
| Up móng keo + sơn trơn | 140/150/160 | 140/150/165 | 170/200/240 | 170/200/250 | **140/180/240** |
| Up móng gel + sơn trơn | 165/180/210 | 165/185/220 | 200/230/280 | 200/250/300 | **170/220/290** |
| Dual form + gel gôm | 220/250/280 | 230/260/300 | 230/260/320 | 220/250/320 | **220/260/320** |
| Phá gel | 50 | 30 | 30 (tiệm), 50–65 tại nhà | 30 | **40** (giá chung) |
| Phá móng úp / đắp | — | 50 | 45–60 | — | **60** (giá chung) |
| Phá gel + dưỡng | — | — | 80/95/110 (tiệm) | — | **80/100/130** |
| Sơn thường tay | — | — | 60/70/85 (tiệm) | 80 | **60/80/100** |
| Sơn thường tay + chân | — | — | 110/130/155 (tiệm) | — | **110/150/190** |
| Dặm móng úp | — | — | 90/100/115 (tiệm) | — | **90/110/140** |
| Dặm móng đắp / dual form | — | — | 130/150/170 (tiệm) | — | **130/160/200** |
| Pedicure cơ bản | — | — | 120/150/180 | 120 | **120/150/180** |
| Pedicure có mặt nạ, chà gót | — | — | 200/250/300 | 300 | **200/250/300** |
| Thiết kế / vẽ (mỗi ngón) | 5–20 | 5–20 | 10–50 | 10–50 | **10/20/40** |
| Mắt mèo / tráng gương (mỗi ngón) | 5–10 | 10–20 | 5–15 | 5–20 | **5/10/15** |
| Ombre (mỗi ngón) | 7–15 | 10–20 | 10–20 | 10–25 | **10/15/20** |
| French (mỗi ngón) | 10 | 10 | 10–15 | 10 | **10** (giá chung) |
| Đính đá (mỗi viên, theo cỡ) | 3–20 | 3–20 | 3–30 | 3–20 | **3/10/20** |
| Vẽ nổi (mỗi ngón) | 10–30 | 10–30 | 20–50 | 20–50 | **15/30/50** |

Ghi chú nail: thợ làm tại nhà ở TP.HCM thường lấy 1,5–2,5 lần giá tiệm nhỏ (vd gel + cắt da 195k tại nhà so với khoảng 100k ở tiệm). Mức Master đã tính phần này.

## Phí di chuyển

Thị trường: miễn phí trong 5–10 km, xa hơn cộng thêm 50–100k hoặc tính theo km. Chính sách hiện tại của 360đẹp (miễn phí 5 km đầu, sau đó 5.000đ/km, tối đa 100k) nằm trong khoảng này nên giữ nguyên.

## Chỗ còn mỏng

- Facebook/Zalo không đọc được: giá thợ tự do mới vào nghề có thể thấp hơn mức Cơ bản một chút.
- Ít dữ liệu: makeup đi làm, take care bán riêng, makeup MC ở Hà Nội, giảm giá kỷ yếu cho 2–3 người, nail tại nhà ở Hà Nội, French và đính đá tính lẻ.
- Makeup Nha Trang có rất ít bảng giá công khai, nên phần makeup trong bảng của chủ dự án chưa đối chiếu được nhiều; phần nail khớp thị trường địa phương.
- Một số trang không ghi ngày; giá cô dâu thấp nhất ở TP.HCM có thể lấy từ bảng giá cũ.

## Nguồn chính

**Makeup TP.HCM:** tramhuynhwedding.com, divamakeup.com.vn / yukibride.com (cùng bảng), makeuptainha.com (Emisa), aodaitailoc.com, vanmiubeauty.com, lybi.vn, tuyetnhanstudio.com, bworkee.com, netdepthammy.com, sanazubeauty.com, ocbongstudio.com, lavenderstudio.vn, ngochoaphoto.com, hoanmyacademy.vn, jejuwedding.vn.

**Makeup Hà Nội:** dyenmakeup.com, studiochupanhdep.com (TT Studio), juheemakeup.com.vn, vanlebridal.com, yeumedia.vn, ellienguyen.vn, hanoimakeup.com, mimosawedding.vn, 2hstudio.vn, hanhlammakeup.com, hanoireview.vn, topaz.vn, hangthumakeup.vn, captocviet.com.

**Đà Nẵng / Nha Trang:** ellienguyen.vn (Đà Nẵng, Khánh Hòa), captocviet.com (Đà Nẵng, Nha Trang), phindumpwedding.vn, hongkongluxury.vn, kitiphotography.com, hellodanang.vn, nailbo.vn, Én Beauty và Merlinails (Nha Trang), lenanailsdanang.com.

**Nail TP.HCM:** thenail.vn, diemnails.com, rinnails.com, tleenailsroom.com, momentnail.com, enbispa.vn, littlebeauty.vn, xiubeautyroom.com, fresha.com, netdepthammy.com, angelmakeup.vn, bworkee.com, seoulacademy.edu.vn, maviecare.vn.

**Nail Hà Nội:** nailphuongle.com, diemthaibeauty.com, hannaroom.com, vienail.vn, fresha.com, mytour.vn (bài tổng hợp, giá có thể cũ), huongmy.net, maunaildep.com.vn.
