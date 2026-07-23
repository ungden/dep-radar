import type { Kol } from "@/lib/types"

/**
 * Hồ sơ KOL/KOC làm đẹp Việt Nam — research từ YouTube, TikTok, Instagram, Facebook; TikTok roster audit 07/2026.
 * Mỗi người là MỘT hồ sơ: gộp tất cả nền tảng (socials), bio chi tiết, chuyên môn, dấu ấn nổi bật,
 * phong cách review, thương hiệu riêng và review tiêu biểu khi kiểm chứng được.
 * - Follower là snapshot thời điểm research, mang tính tham khảo.
 * - trustscore là legacy influence score dành cho admin và thứ tự dữ liệu cũ, KHÔNG phải độ tin cậy.
 *   Public chỉ hiển thị các số đếm thực tế: kênh, exact SKU, clip gốc và disclosure.
 * - avatar tải về /public/images/kol khi lấy được ảnh công khai; hồ sơ không xác định được bị loại khỏi registry.
 */

export function parseFollowers(value: string): number {
  const m = String(value).trim().match(/^([\d.]+)\s*([MK]?)/i)
  if (!m) return 0
  let n = parseFloat(m[1])
  const u = (m[2] || "").toUpperCase()
  if (u === "M") n *= 1_000_000
  else if (u === "K") n *= 1_000
  return n
}

export function computeTrustScore(
  followers: string,
  opts: { verified: boolean; platform: string; multiPlatform: boolean }
): number {
  const n = parseFollowers(followers)
  let base: number
  if (n >= 2_000_000) base = 90
  else if (n >= 1_000_000) base = 85
  else if (n >= 500_000) base = 80
  else if (n >= 200_000) base = 74
  else if (n >= 50_000) base = 68
  else base = 60
  if (opts.verified) base += 4
  if (opts.multiPlatform) base += 3
  if (opts.platform === "Youtube") base += 2
  return Math.max(55, Math.min(99, base))
}

export const REAL_KOLS: Kol[] = [
  {
    "id": "1",
    "name": "Hà Linh Official",
    "avatar": "/images/kol/vo-ha-linh-tiktok.jpg",
    "cover": "/images/cover-halinh.png",
    "platform": "Youtube",
    "handle": "@halinhofficial",
    "followers": "2.1M",
    "recentreview": "Serum B5 GoodnDoc",
    "trustscore": 99,
    "categories": [
      "Skincare",
      "Makeup",
      "Treatment"
    ],
    "verified": true,
    "bio": "Hà Linh Official là một trong những reviewer mỹ phẩm có sức ảnh hưởng lớn nhất tại Việt Nam, hoạt động mạnh trên YouTube và TikTok. Cô nổi tiếng với phong cách review thẳng thắn, sẵn sàng chỉ ra điểm chưa tốt của sản phẩm, cùng các phiên livestream bán hàng đông người xem.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@halinhofficial",
        "followers": "4.1M"
      },
      {
        "platform": "Youtube",
        "handle": "@halinhofficial",
        "followers": "2.1M"
      },
      {
        "platform": "Facebook",
        "handle": "@hartlinh",
        "followers": "2M"
      },
      {
        "platform": "Instagram",
        "handle": "@halinh.official1211",
        "followers": "90K"
      }
    ],
    "realName": "Võ Hà Linh",
    "basedIn": "TP.HCM",
    "activeSince": "2019",
    "specialties": [
      "Review mỹ phẩm/skincare",
      "Đánh giá sản phẩm tiêu dùng",
      "Livestream bán hàng"
    ],
    "knownFor": [
      "Được mệnh danh là \"chiến thần review\"",
      "Phong cách đánh giá thẳng thắn, khen chê rõ ràng",
      "Nổi tiếng với các phiên livestream bán hàng kỷ lục trên TikTok"
    ],
    "contentStyle": "Review thẳng thắn, nói rõ ưu nhược điểm, chủ yếu dùng sản phẩm tự mua và trải nghiệm thực tế trước khi đánh giá.",
    "transparencyNote": "Tuyên bố ngừng nhận booking quảng cáo từ cuối năm 2020 và phần lớn sản phẩm review là tự bỏ tiền mua."
  },
  {
    "id": "2",
    "name": "Góc Của Rư",
    "avatar": "/images/kol-ru.png",
    "cover": "/images/cover-ru.png",
    "platform": "Tiktok",
    "handle": "@goc.cua.ru",
    "followers": "976.4K",
    "recentreview": "Kem nền Maybelline Fit Me",
    "trustscore": 84,
    "categories": [
      "Makeup",
      "Bodycare",
      "Skincare"
    ],
    "verified": true,
    "bio": "Góc Của Rư (Bùi Xuân Thảo) là beauty blogger thuộc thế hệ đầu tại Việt Nam, được biết đến qua kênh YouTube cùng tên. Thế mạnh của cô là kiến thức skincare chuyên sâu, phân tích thành phần và công dụng sản phẩm theo từng loại da với cách truyền đạt gần gũi, dễ hiểu.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@goc.cua.ru",
        "followers": "976.4K",
        "url": "https://www.tiktok.com/@goc.cua.ru"
      }
    ],
    "realName": "Bùi Xuân Thảo",
    "specialties": [
      "Chăm sóc da/skincare",
      "Review serum và sản phẩm dưỡng da"
    ],
    "knownFor": [
      "Kênh review skincare với phong cách trò chuyện gần gũi như bạn bè",
      "Giọng nói nhẹ nhàng đặc trưng"
    ],
    "contentStyle": "Đánh giá dựa trên trải nghiệm sử dụng thực tế, mô tả chi tiết kết cấu, độ thẩm thấu, mùi hương và hiệu quả trên da theo thời gian."
  },
  {
    "id": "3",
    "name": "Trinh Phạm",
    "avatar": "/images/kol/trinh-pham-tiktok.jpg",
    "cover": "/images/cover-trinh.png",
    "platform": "Youtube",
    "handle": "@trinhpham",
    "followers": "1.5M",
    "recentreview": "Tẩy trang L'Oreal",
    "trustscore": 94,
    "categories": [
      "Skincare",
      "Lifestyle",
      "Makeup",
      "High-end Makeup"
    ],
    "verified": true,
    "bio": "Trinh Phạm là beauty blogger nổi tiếng với kênh YouTube hơn một triệu người đăng ký, hiện sinh sống tại Mỹ. Cô tập trung vào review mỹ phẩm, hướng dẫn trang điểm và skincare, với phong cách đánh giá chi tiết, đi sâu vào trải nghiệm thực tế để người xem cân nhắc trước khi mua.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@trinhpham",
        "followers": "1.5M"
      },
      {
        "platform": "Instagram",
        "handle": "@trinh.phamm",
        "followers": "530K"
      },
      {
        "platform": "Tiktok",
        "handle": "@yendan7",
        "followers": "500K"
      },
      {
        "platform": "Facebook",
        "handle": "@trinhpham",
        "followers": "500K"
      }
    ],
    "basedIn": "Mỹ",
    "activeSince": "2014",
    "specialties": [
      "Trang điểm/makeup",
      "Review mỹ phẩm và chăm sóc da",
      "Phong cách sống"
    ],
    "knownFor": [
      "Beauty blogger thế hệ 9X, lập kênh YouTube từ tháng 8/2014",
      "Nội dung review mỹ phẩm và hướng dẫn trang điểm",
      "Hiện sinh sống tại Mỹ"
    ],
    "contentStyle": "Chia sẻ trải nghiệm dùng mỹ phẩm, hướng dẫn trang điểm và đánh giá sản phẩm chăm sóc da theo hướng nhẹ nhàng, đời thường."
  },
  {
    "id": "4",
    "name": "Call Me Duy",
    "avatar": "/images/kol/call-me-duy-tiktok.jpg",
    "cover": "/images/cover-duy.png",
    "platform": "Tiktok",
    "handle": "@justvuduy16",
    "followers": "1.2M",
    "recentreview": "Phân tích skincare, treatment và mỹ phẩm",
    "trustscore": 92,
    "categories": [
      "Skincare",
      "Treatment",
      "Makeup"
    ],
    "verified": true,
    "bio": "Call Me Duy (Vũ Duy) là một trong số ít KOL nam có ảnh hưởng trong lĩnh vực làm đẹp tại Việt Nam, từng đăng quang KOC Vietnam mùa đầu tiên. Anh hoạt động mạnh trên TikTok, YouTube và Facebook, nổi bật với cách review đi sâu phân tích thành phần, cơ chế và công dụng của từng sản phẩm.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@justvuduy16",
        "followers": "1.2M"
      },
      {
        "platform": "Youtube",
        "handle": "@callmeduy",
        "followers": "500K"
      },
      {
        "platform": "Facebook",
        "handle": "@cmd.beautyblogger",
        "followers": "400K"
      }
    ],
    "realName": "Vũ Duy",
    "basedIn": "TP.HCM",
    "activeSince": "2019",
    "specialties": [
      "Phân tích thành phần mỹ phẩm",
      "Review skincare",
      "Chăm sóc da"
    ],
    "knownFor": [
      "Beauty blogger nam với phong cách review chân thật, khen chê rõ ràng",
      "Khả năng phân tích bảng thành phần (ingredient list)",
      "Quán quân KOC Vietnam 2022",
      "TikTok profile live-check 06/2026: 1.2M followers, 83.1M likes"
    ],
    "contentStyle": "Review dựa trên kiến thức về thành phần và khoa học chăm sóc da, đánh giá thẳng thắn cả ưu lẫn nhược điểm.",
    "ownBrand": "CMD Cosmetics"
  },
  {
    "id": "5",
    "name": "Bác sĩ Đặng Thị Minh Châu",
    "avatar": "/images/kol/bac-si-dang-thi-minh-chau-avatar.jpg",
    "cover": "",
    "platform": "Facebook",
    "handle": "@drminhchau.skinone",
    "followers": "120K",
    "recentreview": "Tư vấn da liễu, laser thẩm mỹ và phục hồi da sau treatment",
    "trustscore": 72,
    "categories": [
      "Treatment",
      "Skincare"
    ],
    "verified": true,
    "bio": "Bác sĩ Đặng Thị Minh Châu là bác sĩ chuyên khoa da liễu, gắn với hệ thống SkinOne và nội dung tư vấn điều trị, phục hồi da, laser thẩm mỹ. Hồ sơ này được đưa vào thay cho các account mơ hồ vì có người thật, chuyên môn rõ và hình ảnh nhận diện công khai.",
    "socials": [
      {
        "platform": "Facebook",
        "handle": "@drminhchau.skinone",
        "followers": "120K",
        "url": "https://www.facebook.com/drminhchau.skinone"
      }
    ],
    "realName": "Đặng Thị Minh Châu",
    "basedIn": "TP.HCM",
    "specialties": [
      "Da liễu",
      "Laser thẩm mỹ",
      "Phục hồi da sau treatment"
    ],
    "knownFor": [
      "Bác sĩ chuyên khoa da liễu xuất hiện trong nội dung SkinOne",
      "Tư vấn chăm sóc da và treatment theo hướng chuyên môn",
      "Được thêm vào registry sau audit loại bỏ hồ sơ không xác định"
    ],
    "contentStyle": "Giải thích vấn đề da và lựa chọn treatment dưới góc nhìn bác sĩ."
  },
  {
    "id": "6",
    "name": "Chloe Nguyen",
    "avatar": "/images/kol-chloe.png",
    "cover": "/images/cover-chloe.png",
    "platform": "Instagram",
    "handle": "@chloenguyen",
    "followers": "600K",
    "recentreview": "Dior Lip Glow",
    "trustscore": 87,
    "categories": [
      "High-end Makeup",
      "Perfume",
      "Makeup",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Chloe Nguyen (Nguyễn Cao Quỳnh Anh) là beauty blogger được biết đến cả trong và ngoài nước, hoạt động chính trên YouTube và Instagram. Cô làm nội dung về trang điểm, skincare, thời trang và lối sống, với phong cách review chỉn chu, đầu tư về hình ảnh và cách truyền đạt tự nhiên.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@bychloenguyen",
        "followers": "760K"
      },
      {
        "platform": "Youtube",
        "handle": "@bychloenguyen",
        "followers": "400K"
      },
      {
        "platform": "Tiktok",
        "handle": "@bychloenguyen",
        "followers": "250K"
      },
      {
        "platform": "Facebook",
        "handle": "@bychloenguyen",
        "followers": "73K"
      }
    ],
    "realName": "Nguyễn Cao Quỳnh Anh",
    "basedIn": "TP.HCM",
    "activeSince": "2015",
    "specialties": [
      "Trang điểm",
      "Chăm sóc da",
      "Review mỹ phẩm"
    ],
    "knownFor": [
      "Một trong những beauty blogger trẻ nổi bật của Việt Nam",
      "Các video hướng dẫn trang điểm thuần Việt",
      "Phong cách nhẹ nhàng, tinh tế"
    ],
    "contentStyle": "Nội dung trang điểm và chăm sóc da theo phong cách nhẹ nhàng, tinh tế, kèm review sản phẩm và chia sẻ đời sống thường ngày."
  },
  {
    "id": "7",
    "name": "Đan Thy",
    "avatar": "/images/kol/dan-thy.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@thybui.__",
    "followers": "15M",
    "recentreview": "Makeup transformation hot trend",
    "trustscore": 94,
    "categories": [
      "Makeup"
    ],
    "verified": true,
    "bio": "Đan Thy (Phạm Tường Lan Thy) là một TikToker, influencer thuộc thế hệ Gen Z tại TP.HCM. Cô được biết đến chủ yếu với nội dung trang điểm và các video makeup biến hóa, cùng kỹ năng trang điểm được nhiều người trẻ yêu thích.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@thybui.__",
        "followers": "15M"
      }
    ],
    "basedIn": "Đà Nẵng",
    "specialties": [
      "Trang điểm",
      "Makeup transformation",
      "Nội dung biến hình"
    ],
    "knownFor": [
      "Nổi tiếng nhờ các video biến hình bằng trang điểm",
      "Một trong những nhà sáng tạo mảng làm đẹp tăng trưởng nhanh trên TikTok Việt Nam"
    ],
    "contentStyle": "Nội dung trang điểm biến hình theo phong cách 'Douyin', nhấn vào kỹ thuật makeup nhanh kết hợp biểu cảm, góc máy và hiệu ứng chuyển cảnh."
  },
  {
    "id": "8",
    "name": "Lê Bống",
    "avatar": "/images/kol/le-bong.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@lebong95",
    "followers": "10M",
    "recentreview": "Tips chăm sóc cơ thể và fitness",
    "trustscore": 94,
    "categories": [
      "Lifestyle",
      "Bodycare"
    ],
    "verified": true,
    "bio": "Lê Bống (Lê Xuân Anh) là TikToker, người dẫn chương trình và diễn viên, từng là một trong những gương mặt nổi bật khi TikTok bùng nổ tại Việt Nam. Nội dung của cô khá đa dạng, gồm làm đẹp, lối sống, thể hình, bên cạnh các hoạt động giải trí và truyền hình.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@lebong95",
        "followers": "10M"
      }
    ],
    "realName": "Lê Xuân Anh",
    "basedIn": "Hà Nội",
    "specialties": [
      "Giải trí",
      "Nhảy",
      "Dẫn chương trình"
    ],
    "knownFor": [
      "Gương mặt tiêu biểu gắn với giai đoạn bùng nổ TikTok Việt Nam 2020–2021",
      "Chuyển hướng sang vai trò diễn viên, MC, biên tập viên truyền hình"
    ],
    "contentStyle": "Nội dung giải trí năng động với nhiều clip nhảy và video lifestyle triệu view trên TikTok, YouTube, Facebook."
  },
  {
    "id": "9",
    "name": "Lê Thị Khánh Huyền",
    "avatar": "/images/kol/le-thi-khanh-huyen.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@lethikhanhhuyen2004",
    "followers": "7.5M",
    "recentreview": "Skincare routine và sản phẩm VT Cosmetics PDRN",
    "trustscore": 94,
    "categories": [
      "Skincare",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Lê Thị Khánh Huyền là một KOC/nhà sáng tạo nội dung trong lĩnh vực làm đẹp và lifestyle tại Việt Nam, hoạt động trên TikTok và Instagram. Cô tạo nội dung về makeup, skincare và mẹo làm đẹp hằng ngày, từng hợp tác với nhiều thương hiệu mỹ phẩm. Phong cách của cô thiên về hướng dẫn trang điểm gần gũi, dễ áp dụng cho đời thường.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@lethikhanhhuyen2004",
        "followers": "7.5M"
      }
    ],
    "basedIn": "Quảng Ninh",
    "specialties": [
      "Làm đẹp",
      "Thời trang",
      "Lifestyle",
      "Người mẫu ảnh"
    ],
    "knownFor": [
      "TikToker và người mẫu ảnh được biết với biệt danh Khánh Huyền 2K4",
      "Influencer Gen Z với phong cách thời trang hiện đại",
      "Gương mặt hợp tác của nhiều thương hiệu"
    ],
    "contentStyle": "Nội dung làm đẹp, thời trang và lifestyle theo phong cách trẻ trung, cá tính của thế hệ Gen Z."
  },
  {
    "id": "10",
    "name": "Yên Đan",
    "avatar": "/images/kol/yen-dan.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@yendan7",
    "followers": "989.4K",
    "recentreview": "Makeup, skincare routine và lifestyle beauty",
    "trustscore": 84,
    "categories": [
      "Makeup",
      "Skincare",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Yên Đan là creator TikTok nổi bật với nội dung makeup, skincare routine và lifestyle beauty dành cho nhóm người xem trẻ. Profile live-check tháng 06/2026 ghi nhận gần 1 triệu follower và video grid hoạt động đều.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@yendan7",
        "followers": "989.4K"
      }
    ],
    "basedIn": "Việt Nam",
    "activeSince": "2020",
    "specialties": [
      "Makeup look",
      "Skincare routine",
      "Lifestyle beauty"
    ],
    "knownFor": [
      "Có mặt trong Favikon Top Beauty Influencers Vietnam 2026",
      "TikTok profile live-check 06/2026: 989.4K followers, 39.6M likes",
      "Nội dung beauty/lifestyle dễ tiếp cận với Gen Z"
    ],
    "contentStyle": "Video ngắn thiên về makeup, routine cá nhân, lifestyle và các format bắt trend nhưng vẫn bám beauty."
  },
  {
    "id": "11",
    "name": "Chi Pu",
    "avatar": "/images/kol/chi-pu.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@chipupu",
    "followers": "5.6M",
    "recentreview": "Dòng son môi cá nhân",
    "trustscore": 94,
    "categories": [
      "Lifestyle",
      "Makeup"
    ],
    "verified": true,
    "bio": "Chi Pu (Nguyễn Thùy Chi) là ca sĩ, diễn viên và người mẫu nổi tiếng tại Việt Nam, đồng thời là gương mặt quen thuộc trong lĩnh vực thời trang và làm đẹp. Cô thường xuyên chia sẻ các phong cách trang điểm đa dạng, từ tông nude tự nhiên đến layout makeup cá tính, và là khách mời của nhiều thương hiệu mỹ phẩm. Hình ảnh làm đẹp của cô hướng tới sự quyến rũ, hiện đại và tôn đường nét.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@chipupu",
        "followers": "5.6M"
      }
    ],
    "realName": "Nguyễn Thùy Chi",
    "basedIn": "TP.HCM",
    "specialties": [
      "Ca sĩ/diễn viên",
      "Kinh doanh mỹ phẩm",
      "Trang điểm cá nhân"
    ],
    "knownFor": [
      "Ca sĩ, diễn viên, người mẫu được biết đến từ thời hot girl Hà thành",
      "Sáng lập và là CEO thương hiệu mỹ phẩm Laem Beauty (ra mắt 2022)",
      "Đại sứ thương hiệu cho một số hãng mỹ phẩm tại Việt Nam"
    ],
    "ownBrand": "Laem Beauty",
    "signatureProducts": [
      "Son Laem Beauty",
      "Phấn má, highlighter Laem Beauty"
    ]
  },
  {
    "id": "12",
    "name": "Ty Lê",
    "avatar": "/images/kol/ty-le.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@tyle.makeup",
    "followers": "4M",
    "recentreview": "Makeup hóa trang Halloween và cosplay",
    "trustscore": 94,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": true,
    "bio": "Ty Lê (Lê Quang Ty) là makeup artist và beauty blogger có lượng người theo dõi lớn trên TikTok và YouTube. Anh nổi bật với nội dung trang điểm, đặc biệt là makeup cô dâu và dự tiệc, đồng thời chia sẻ mẹo trang điểm cùng các sản phẩm yêu thích.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@tyle.makeup",
        "followers": "4M"
      }
    ],
    "realName": "Lê Quang Ty",
    "activeSince": "2018",
    "specialties": [
      "Makeup artist",
      "Trang điểm cô dâu",
      "Trang điểm nghệ sĩ",
      "Makeup biến hóa"
    ],
    "knownFor": [
      "Makeup artist nổi tiếng trên TikTok với các video biến hóa trang điểm",
      "Phong cách trang điểm theo hướng Tây/Thái",
      "Chia sẻ mẹo makeup lồng ghép trong video công việc thực tế"
    ],
    "contentStyle": "Video trang điểm thực tế cho khách (cô dâu, nghệ sĩ) và các màn biến hóa makeup, lồng ghép mẹo trang điểm.",
    "ownBrand": "Ty Cosmetics"
  },
  {
    "id": "13",
    "name": "Sinh Anh",
    "avatar": "/images/kol/sinh-anh.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@sinhanh.hair",
    "followers": "3.8M",
    "recentreview": "Hướng dẫn cắt và tạo kiểu tóc layer, tóc bồng bềnh và kỹ thuật làm tóc nữ",
    "trustscore": 90,
    "categories": [
      "Haircare"
    ],
    "verified": false,
    "bio": "Sinh Anh là nhà tạo mẫu tóc (hairstylist) sở hữu chuỗi hair studio tại Việt Nam và là một trong những creator ngành tóc có lượng theo dõi lớn nhất trên TikTok. Kênh của anh chia sẻ các video tạo kiểu, biến đổi và kỹ thuật làm tóc nữ.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@sinhanh.hair",
        "followers": "3.8M"
      }
    ],
    "basedIn": "TP.HCM",
    "specialties": [
      "Tạo kiểu tóc",
      "Chăm sóc tóc",
      "Phục hồi tóc"
    ],
    "knownFor": [
      "Nội dung về kiểu tóc và chăm sóc tóc trên TikTok",
      "Gắn với hệ thống/salon tóc Sinh Anh Hair"
    ]
  },
  {
    "id": "14",
    "name": "Quỳnh Anh Shyn",
    "avatar": "/images/kol/quynh-anh-shyn.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@quynhanhshyn_",
    "followers": "3M",
    "recentreview": "Get ready with me và làm đẹp",
    "trustscore": 97,
    "categories": [
      "Makeup",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Quỳnh Anh Shyn là hot girl thế hệ 9X, sau phát triển thành fashionista và influencer có sức ảnh hưởng trong lĩnh vực thời trang và làm đẹp. Cô làm nội dung về trang điểm, phong cách cá nhân và thường xuyên xuất hiện tại các sự kiện thời trang quốc tế.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@quynhanhshyn_",
        "followers": "3M"
      },
      {
        "platform": "Tiktok",
        "handle": "@quynhanhshyn_",
        "followers": "1.4M"
      },
      {
        "platform": "Facebook",
        "handle": "@qashyn212",
        "followers": "1.2M"
      },
      {
        "platform": "Youtube",
        "handle": "@QuynhAnhShyn",
        "followers": "450K",
        "url": "https://www.youtube.com/user/quynhanhh212"
      }
    ],
    "realName": "Phí Quỳnh Anh",
    "basedIn": "Hà Nội",
    "activeSince": "2015",
    "specialties": [
      "Beauty blogger",
      "Trang điểm",
      "Thời trang",
      "Vlog lifestyle"
    ],
    "knownFor": [
      "Hot girl thế hệ 2010 chuyển hướng thành beauty blogger và fashionista",
      "Làm video hướng dẫn trang điểm và review mỹ phẩm từ năm 2015",
      "Các series nội dung như 'In Shyn's Closet', mảng beauty 'GlamSEENup'"
    ],
    "contentStyle": "Video trang điểm đa dạng theo độ tuổi/hoàn cảnh, kết hợp nội dung thời trang và lifestyle được đầu tư công phu."
  },
  {
    "id": "15",
    "name": "Phạm Thoại",
    "avatar": "/images/kol/pham-thoai.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@phamthoai.real",
    "followers": "3M",
    "recentreview": "Livestream review mỹ phẩm giá tốt",
    "trustscore": 94,
    "categories": [
      "Lifestyle",
      "Makeup"
    ],
    "verified": true,
    "bio": "Phạm Thoại (Phạm Văn Thoại) là TikToker nổi tiếng trong mảng livestream bán hàng, được biết đến với biệt danh \"chiến thần chốt đơn\". Anh hoạt động mạnh trên TikTok với các phiên livestream quy mô lớn, trong đó có nhiều sản phẩm thuộc nhóm làm đẹp, mỹ phẩm.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@phamthoai.real",
        "followers": "3M"
      }
    ],
    "basedIn": "TP.HCM",
    "specialties": [
      "Livestream bán hàng",
      "Affiliate marketing",
      "Thời trang & mỹ phẩm"
    ],
    "knownFor": [
      "Một trong những nhà bán hàng livestream nổi bật trên TikTok Shop",
      "Giải 'Nhà sáng tạo nội dung xuất sắc tại TikTok Shop' (TikTok Awards Vietnam 2024)",
      "Bán đa dạng sản phẩm thời trang và mỹ phẩm qua livestream"
    ],
    "contentStyle": "Livestream bán hàng trực tiếp với phong cách 'chốt đơn' nhanh, đa dạng sản phẩm thời trang và mỹ phẩm."
  },
  {
    "id": "16",
    "name": "Nguyễn Thu Trang Beauty",
    "avatar": "/images/kol/nguyen-thu-trang-beauty.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@nguyenthutrang.beauty",
    "followers": "2.4M",
    "recentreview": "Makeup transformation ngọt ngào",
    "trustscore": 94,
    "categories": [
      "Makeup"
    ],
    "verified": true,
    "bio": "Nguyễn Thu Trang Beauty là beauty TikToker có lượng người theo dõi lớn, được biết đến trong cộng đồng người trẻ. Cô nổi bật với các video trang điểm theo phong cách ngọt ngào, trẻ trung và các nội dung makeup biến hóa.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@nguyenthutrang.beauty",
        "followers": "2.4M"
      }
    ],
    "specialties": [
      "Trang điểm chuyển cảnh (makeup transformation)",
      "Makeup theo phong cách trẻ trung, dễ thương"
    ],
    "knownFor": [
      "Beauty TikToker với lượng người theo dõi lớn nhờ các clip trang điểm chuyển cảnh",
      "Phong cách makeup ngọt ngào, dễ thương đặc trưng"
    ],
    "contentStyle": "Nội dung tập trung vào video trang điểm chuyển cảnh mượt mà, đầu tư về hình ảnh và ánh sáng, theo phong cách trẻ trung dễ thương."
  },
  {
    "id": "17",
    "name": "Hunilovebeauty",
    "avatar": "/images/kol/hunilovebeauty.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@hunilovebeauty",
    "followers": "2.3M",
    "recentreview": "Review kem nâng tone và mỹ phẩm bình dân",
    "trustscore": 94,
    "categories": [
      "Skincare",
      "Makeup"
    ],
    "verified": true,
    "bio": "Hunilovebeauty (Tăng Ngọc Tuyết) là beauty blogger hoạt động chủ yếu trên TikTok. Nội dung của cô tập trung vào mẹo làm đẹp, skincare và giới thiệu sản phẩm, thường ưu tiên các món có mức giá hợp lý, phù hợp với người dùng trẻ.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@hunilovebeauty",
        "followers": "2.3M"
      }
    ],
    "realName": "Tăng Ngọc Tuyết",
    "basedIn": "Hà Nội",
    "specialties": [
      "Review mỹ phẩm",
      "Skincare",
      "Mẹo trang điểm"
    ],
    "knownFor": [
      "Beauty TikToker nổi bật trong cộng đồng review mỹ phẩm/skincare tại Việt Nam",
      "Tốt nghiệp Đại học Ngoại Thương",
      "Phong cách dễ nhận diện với nụ cười tươi và giọng nói dễ nghe"
    ],
    "contentStyle": "Chia sẻ mẹo làm đẹp từ sản phẩm trang điểm đến skincare với phong cách gần gũi, dễ tiếp cận."
  },
  {
    "id": "18",
    "name": "Lê Đại Phát",
    "avatar": "/images/kol/le-dai-phat.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@phatnail",
    "followers": "2.2M",
    "recentreview": "Hướng dẫn làm nail và review cọ bản nail",
    "trustscore": 90,
    "categories": [
      "Nail"
    ],
    "verified": false,
    "bio": "Lê Đại Phát là một nhà sáng tạo nội dung trong lĩnh vực làm đẹp tại Việt Nam, chia sẻ nội dung về makeup và review sản phẩm trên mạng xã hội. Đây là gương mặt quy mô vừa với phong cách gần gũi, thực tế.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@phatnail",
        "followers": "2.2M"
      }
    ],
    "specialties": [
      "Nghệ thuật nail (nail art)",
      "Dạy/hướng dẫn làm nail",
      "Thi đấu nail"
    ],
    "knownFor": [
      "Nghệ sĩ nail với hơn 10 năm kinh nghiệm trong nghề",
      "Chia sẻ tutorial và kỹ thuật làm nail trên TikTok",
      "Dẫn dắt 'Team Nhà Phát' tham gia các cuộc thi nail"
    ],
    "contentStyle": "Nội dung chia sẻ kỹ thuật, mẫu nail và hướng dẫn làm nail dưới dạng tutorial."
  },
  {
    "id": "19",
    "name": "Michelle Phan",
    "avatar": "/images/kol/michelle-phan.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@michellephan",
    "followers": "2M",
    "recentreview": "EM Cosmetics liquid lipstick",
    "trustscore": 94,
    "categories": [
      "High-end Makeup",
      "Skincare"
    ],
    "verified": true,
    "bio": "Michelle Phan là beauty guru gốc Việt nổi tiếng toàn cầu, được xem là một trong những người đầu tiên gây dựng trào lưu makeup tutorial trên YouTube từ năm 2007. Cô là đồng sáng lập dịch vụ hộp mỹ phẩm Ipsy và là nhà sáng lập thương hiệu trang điểm EM Cosmetics. Phong cách của cô gắn với các video hướng dẫn trang điểm sáng tạo, truyền cảm hứng cho nhiều thế hệ beauty blogger Việt Nam.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@michellephan",
        "followers": "2M"
      }
    ],
    "basedIn": "Mỹ",
    "activeSince": "2007",
    "specialties": [
      "Hướng dẫn trang điểm (makeup tutorial)",
      "Beauty vlogging",
      "Kinh doanh mỹ phẩm"
    ],
    "knownFor": [
      "Một trong những beauty influencer đầu tiên trên YouTube, đăng video từ tháng 5/2007",
      "Người Mỹ gốc Việt, từng là gương mặt đại diện video của Lancôme",
      "Đồng sáng lập dịch vụ subscription làm đẹp Ipsy (2011)",
      "Sáng lập thương hiệu EM Cosmetics"
    ],
    "contentStyle": "Các video hướng dẫn trang điểm tự nhiên, mẹo làm đẹp DIY và routine cho người mới bắt đầu.",
    "ownBrand": "EM Cosmetics",
    "signatureProducts": [
      "EM Cosmetics",
      "Ipsy"
    ]
  },
  {
    "id": "20",
    "name": "Salim (Hoàng Kim Ngân)",
    "avatar": "/images/kol/salim.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@salimhwg",
    "followers": "2M",
    "recentreview": "Routine dưỡng da sau sinh",
    "trustscore": 94,
    "categories": [
      "Lifestyle",
      "Skincare"
    ],
    "verified": true,
    "bio": "Salim (Hoàng Kim Ngân) là hot girl đời đầu của Hà Nội, vlogger và người có ảnh hưởng trên mạng xã hội, từng được biết đến qua các vlog đời sống. Hiện cô là KOL hoạt động trong nhiều mảng lifestyle, thời trang và làm đẹp, thường chia sẻ trải nghiệm sản phẩm và phong cách cá nhân. Nội dung của cô gắn với hình ảnh trẻ trung, đời thường và gần gũi với người theo dõi.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@salimhwg",
        "followers": "2M"
      }
    ],
    "realName": "Hoàng Kim Ngân",
    "basedIn": "Hà Nội",
    "specialties": [
      "Thời trang",
      "Blogger làm đẹp/lifestyle",
      "Diễn xuất"
    ],
    "knownFor": [
      "Hot girl Hà thành đình đám, từng tham gia phim 'Cầu vồng tình yêu' (2012)",
      "Hoạt động trong lĩnh vực thời trang, làm đẹp và lifestyle",
      "Hợp tác với nhiều nhãn hàng quảng cáo"
    ],
    "contentStyle": "Nội dung xoay quanh thời trang, làm đẹp và lifestyle theo phong cách hot girl/blogger."
  },
  {
    "id": "21",
    "name": "Đinh Phát",
    "avatar": "/images/kol/dinh-phat.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@dinhphatmakeup",
    "followers": "2M",
    "recentreview": "Hướng dẫn makeup biến hình, trang điểm cô dâu và hoa hậu, kẻ mắt sắc nét",
    "trustscore": 93,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": false,
    "bio": "Đinh Phát là một trong những makeup artist nổi tiếng tại Sài Gòn, được biết đến với thế mạnh kẻ mắt sắc sảo. Anh từng tham gia trang điểm cho các cuộc thi sắc đẹp lớn như Miss Universe Vietnam, Miss Grand International. Anh điều hành Đinh Phát Academy đào tạo trang điểm chuyên nghiệp.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@dinhphatmakeup",
        "followers": "2M"
      },
      {
        "platform": "Facebook",
        "handle": "@tien.phat.773",
        "followers": "300K"
      },
      {
        "platform": "Instagram",
        "handle": "@dinhphatmakeup",
        "followers": "50K"
      }
    ],
    "basedIn": "TP.HCM",
    "specialties": [
      "Trang điểm chuyên nghiệp (makeup artist)",
      "Trang điểm cô dâu",
      "Tạo lớp nền mỏng nhẹ, bền màu",
      "Kẻ mắt (eyeliner)"
    ],
    "knownFor": [
      "Sáng lập Đinh Phát Academy đào tạo trang điểm tại Gò Vấp, TP.HCM",
      "Hơn 2 triệu người theo dõi trên TikTok",
      "Các video biến hình trang điểm hút view",
      "Thế mạnh tạo nền và kẻ mắt"
    ],
    "contentStyle": "Nội dung tập trung vào trình diễn kỹ thuật trang điểm và biến hình trực tiếp trên khách.",
    "ownBrand": "Đinh Phát Academy"
  },
  {
    "id": "22",
    "name": "Quỳnh Nhi Trần",
    "avatar": "/images/kol/quynh-nhi-tran.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@quynhnhitran",
    "followers": "1.9M",
    "recentreview": "Tips makeup sản phẩm bình dân",
    "trustscore": 89,
    "categories": [
      "Makeup"
    ],
    "verified": true,
    "bio": "Quỳnh Nhi Trần (Trần Quỳnh Nhi) là beauty blogger có lượng người theo dõi lớn trên TikTok, hoạt động chủ yếu ở TP.HCM. Cô nổi bật với kỹ năng trang điểm, thường chia sẻ mẹo makeup và gợi ý các sản phẩm có mức giá phù hợp với học sinh, sinh viên.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@quynhnhitran",
        "followers": "1.9M"
      }
    ],
    "realName": "Trần Quỳnh Nhi",
    "basedIn": "TP.HCM",
    "specialties": [
      "Trang điểm cá nhân",
      "Mẹo makeup cho phái nữ",
      "Review sản phẩm bình dân"
    ],
    "knownFor": [
      "Beauty TikToker với khoảng 2 triệu người theo dõi",
      "Video trang điểm đầu tư về ánh sáng và góc quay",
      "Gợi ý sản phẩm giá hợp lý phù hợp học sinh, sinh viên"
    ],
    "contentStyle": "Chia sẻ mẹo trang điểm và sản phẩm bình dân, video chăm chút về ánh sáng và góc quay."
  },
  {
    "id": "23",
    "name": "Blingbabi",
    "avatar": "/images/kol/blingbabi.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@blingbabi_",
    "followers": "1.7M",
    "recentreview": "Makeup độc lạ triệu view",
    "trustscore": 89,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": true,
    "bio": "Blingbabi (Trần Hoàng Anh Thư) là beauty blogger nổi bật trên TikTok, YouTube và Instagram nhờ tài năng trang điểm. Cô được biết đến với phong cách makeup nghệ thuật, hóa trang 3D độc đáo, bên cạnh các nội dung swatch son và review mỹ phẩm.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@blingbabi_",
        "followers": "1.7M"
      }
    ],
    "realName": "Trần Hoàng Anh Thư",
    "basedIn": "TP.HCM",
    "activeSince": "2017",
    "specialties": [
      "Trang điểm sáng tạo/biến hình 3D",
      "Hóa trang nhân vật",
      "Swatch và review mỹ phẩm"
    ],
    "knownFor": [
      "Beauty blogger nổi với phong cách makeup biến hình độc lạ, nhấn vào đôi mắt",
      "Hóa thân thành nhân vật hoạt hình, đồ vật và series Halloween",
      "Khoảng 1,7 triệu người theo dõi trên TikTok",
      "Kênh YouTube tập trung swatch và review mỹ phẩm"
    ],
    "contentStyle": "Sáng tạo các màn trang điểm biến hình độc lạ kết hợp swatch và review sản phẩm."
  },
  {
    "id": "24",
    "name": "Hannah Olala",
    "avatar": "/images/kol/hannah-olala-youtube.jpg",
    "cover": "",
    "platform": "Facebook",
    "handle": "@hannaholala1",
    "followers": "1.6M",
    "recentreview": "Review mỹ phẩm và chăm sóc cơ thể",
    "trustscore": 92,
    "categories": [
      "Skincare",
      "Bodycare",
      "Treatment",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Hannah Olala (Hannah Nguyễn) là beauty blogger kiêm doanh nhân lâu năm trong ngành làm đẹp, có lượng người theo dõi lớn trên Facebook và TikTok. Bên cạnh nội dung làm đẹp và livestream, cô được biết đến là người sáng lập, điều hành các thương hiệu và doanh nghiệp trong lĩnh vực mỹ phẩm, spa.",
    "socials": [
      {
        "platform": "Facebook",
        "handle": "@hannaholala1",
        "followers": "1.6M"
      },
      {
        "platform": "Tiktok",
        "handle": "@hannaholala",
        "followers": "1.5M"
      },
      {
        "platform": "Instagram",
        "handle": "@hannaholala",
        "followers": "500K"
      },
      {
        "platform": "Youtube",
        "handle": "@HannahOlala",
        "followers": "300K"
      }
    ],
    "realName": "Hannah Nguyễn",
    "activeSince": "2011",
    "specialties": [
      "Review và tư vấn làm đẹp",
      "Livestream bán mỹ phẩm",
      "Kinh doanh và phân phối mỹ phẩm"
    ],
    "knownFor": [
      "Beauty blogger và doanh nhân ngành làm đẹp lâu năm tại Việt Nam",
      "Đồng sáng lập Skinetiq (2020), sở hữu thương hiệu skincare Candid và phân phối Murad tại Việt Nam",
      "Các phiên livestream quy mô lớn với hàng trăm nghìn người xem"
    ],
    "contentStyle": "Hình ảnh gắn với sự chuyên nghiệp, chỉn chu; chủ yếu chia sẻ kiến thức làm đẹp và bán hàng qua livestream.",
    "ownBrand": "Skinetiq (thương hiệu Candid; phân phối Murad)"
  },
  {
    "id": "25",
    "name": "Giang Ơi",
    "avatar": "/images/kol/giang-oi.jpg",
    "cover": "",
    "platform": "Youtube",
    "handle": "@GiangOiOfficial",
    "followers": "1.5M",
    "recentreview": "Chia sẻ routine chăm sóc bản thân",
    "trustscore": 94,
    "categories": [
      "Lifestyle",
      "Skincare"
    ],
    "verified": true,
    "bio": "Giang Ơi (Trần Lê Thu Giang) là vlogger và nhà sáng tạo nội dung được nhiều người trẻ yêu thích trên YouTube. Cô nổi bật với những video chia sẻ quan điểm sống, kinh nghiệm và lối sống lành mạnh qua phong cách nói chuyện gần gũi, điềm tĩnh và tích cực.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@GiangOiOfficial",
        "followers": "1.5M",
        "url": "https://www.youtube.com/@GiangOi"
      },
      {
        "platform": "Facebook",
        "handle": "@giangoivlog",
        "followers": "733K"
      }
    ],
    "realName": "Trần Lê Thu Giang",
    "basedIn": "Hà Nội",
    "activeSince": "2017",
    "specialties": [
      "Vlog lối sống và kỹ năng sống",
      "Chia sẻ kinh nghiệm chăm sóc bản thân",
      "Nội dung sống xanh/bền vững"
    ],
    "knownFor": [
      "Vlogger nổi tiếng với kênh YouTube Giang Ơi lập năm 2017",
      "Nội dung đa dạng: du học, học tiếng Anh, kỹ năng sống, lối sống",
      "Hoạt động vì môi trường và lối sống bền vững",
      "Từng có kênh cũ Makeup by Sunday"
    ],
    "contentStyle": "Vlog chia sẻ trải nghiệm cá nhân gần gũi, đề cao trải nghiệm thực tế và lối sống đơn giản."
  },
  {
    "id": "26",
    "name": "Thuỷ Sophia",
    "avatar": "/images/kol/thuy-sophia.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@sophia.beauty99",
    "followers": "1.5M",
    "recentreview": "Tips trị mụn đầu đen giá rẻ",
    "trustscore": 89,
    "categories": [
      "Skincare",
      "Bodycare"
    ],
    "verified": true,
    "bio": "Thuỷ Sophia (Trần Thị Thu Thuỷ) là beauty blogger có lượng người theo dõi lớn trên TikTok. Cô nổi bật với nội dung chia sẻ mẹo làm đẹp đơn giản, dễ thực hiện tại nhà, thường minh họa bằng hình ảnh trước - sau từ chính trải nghiệm của bản thân.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@sophia.beauty99",
        "followers": "1.5M"
      }
    ],
    "realName": "Trần Thị Thu Thủy",
    "basedIn": "Hà Nội",
    "specialties": [
      "Skincare cơ bản cho người mới và lứa tuổi học sinh, sinh viên",
      "Trang điểm và làm đẹp theo ngân sách tiết kiệm"
    ],
    "knownFor": [
      "Kênh TikTok với hàng triệu người theo dõi",
      "Series đi sắm đồ skincare/makeup với ngân sách giới hạn",
      "Nội dung làm đẹp tuổi 18 theo hướng 'xấu gì sửa nấy'"
    ],
    "contentStyle": "Phong cách trẻ trung, gần gũi theo trend, tập trung hướng dẫn routine nhanh gọn và sắm đồ làm đẹp tiết kiệm cho người mới."
  },
  {
    "id": "27",
    "name": "Khả Ngân",
    "avatar": "/images/kol/kha-ngan.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@29kunkun",
    "followers": "1.4M",
    "recentreview": "Skincare da khỏe căng bóng",
    "trustscore": 89,
    "categories": [
      "Lifestyle",
      "Skincare"
    ],
    "verified": true,
    "bio": "Khả Ngân (Đỗ Khả Ngân) là diễn viên Việt Nam được biết đến qua phim '11 Tháng 5 Ngày', đồng thời là gương mặt được chú ý trong lĩnh vực làm đẹp nhờ làn da căng mịn. Cô thường chia sẻ quy trình skincare ít bước nhưng chú trọng sản phẩm chất lượng, cùng nhiều hình ảnh mặt mộc. Phong cách của cô thiên về sự tự nhiên, gần gũi và đề cao việc dưỡng da cơ bản.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@29kunkun",
        "followers": "1.4M"
      }
    ],
    "realName": "Trần Thị Kim Ngân",
    "knownFor": [
      "Diễn viên, người mẫu Việt Nam",
      "Vai Tuệ Nhi trong phim '11 tháng 5 ngày' (2021)",
      "Giải Nữ chính xuất sắc phim truyền hình tại Cánh Diều 2021"
    ]
  },
  {
    "id": "28",
    "name": "Hoàng Thạch",
    "avatar": "/images/kol/hoang-thach.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@hoangthachhh",
    "followers": "1.3M",
    "recentreview": "Makeup không giới tính và review làm đẹp",
    "trustscore": 89,
    "categories": [
      "Makeup",
      "Skincare"
    ],
    "verified": true,
    "bio": "Hoàng Thạch là TikToker, makeup artist và beauty blogger với lượng người theo dõi lớn trên TikTok. Nội dung của anh xoay quanh hướng dẫn trang điểm từ cơ bản đến nâng cao, mẹo skincare và review mỹ phẩm, với phong cách truyền đạt trực tiếp, gần gũi nên thường được gọi là \"thầy Thạch\".",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@hoangthachhh",
        "followers": "1.3M"
      }
    ],
    "basedIn": "TP.HCM",
    "specialties": [
      "Hướng dẫn trang điểm từ cơ bản đến nâng cao",
      "Mẹo chăm sóc da hằng ngày",
      "Review sản phẩm mỹ phẩm"
    ],
    "knownFor": [
      "Kênh TikTok khoảng 1,3 triệu người theo dõi",
      "Được gọi thân mật là 'cô giáo Thạch' nhờ cách hướng dẫn dễ hiểu",
      "Makeup artist tự học, gắn với hình ảnh beauty boy phi giới tính"
    ],
    "contentStyle": "Hướng dẫn makeup A-Z theo lối nói trực tiếp, tự nhiên, kèm livestream dạy trang điểm và review mỹ phẩm."
  },
  {
    "id": "29",
    "name": "Changmakeup",
    "avatar": "/images/kol/changmakeup.jpg",
    "cover": "",
    "platform": "Youtube",
    "handle": "@TrangTracy",
    "followers": "1.2M",
    "recentreview": "Swatch son và review thương hiệu OFÉLIA",
    "trustscore": 94,
    "categories": [
      "Makeup",
      "High-end Makeup",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Changmakeup (Ngô Quỳnh Trang) là một trong những beauty blogger nữ đầu tiên của Việt Nam đạt nút Vàng YouTube. Cô nổi bật với nội dung swatch son, hướng dẫn trang điểm và review mỹ phẩm, đồng thời là đồng sáng lập một thương hiệu mỹ phẩm nội địa.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@TrangTracy",
        "followers": "1.2M"
      },
      {
        "platform": "Instagram",
        "handle": "@changmakeup",
        "followers": "818K"
      }
    ],
    "realName": "Ngô Quỳnh Trang",
    "activeSince": "2015",
    "specialties": [
      "Swatch và review son môi",
      "Đánh giá mỹ phẩm trải dài nhiều phân khúc giá",
      "Hướng dẫn trang điểm và chăm sóc da"
    ],
    "knownFor": [
      "Beauty blogger Việt đầu tiên nhận nút Vàng YouTube (2019)",
      "Từng là thành viên nhóm nhảy cover ST.319 với nghệ danh Tracy",
      "Đồng sáng lập kiêm Giám đốc sáng tạo thương hiệu mỹ phẩm OFÉLIA",
      "Vào danh sách Forbes Việt Nam 30 Under 30 (2020)"
    ],
    "contentStyle": "Video review chi tiết, trực quan với phần swatch son đặc trưng và lời chào 'Hello những cô gái xinh đẹp và những chàng trai đẹp trai'.",
    "ownBrand": "OFÉLIA",
    "signatureProducts": [
      "Son môi OFÉLIA"
    ]
  },
  {
    "id": "30",
    "name": "Lucie Nguyễn",
    "avatar": "/images/kol/lucie-nguyen.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@lucienguyenlove",
    "followers": "1.2M",
    "recentreview": "Review skincare và son trong video lifestyle",
    "trustscore": 89,
    "categories": [
      "Lifestyle",
      "Makeup"
    ],
    "verified": true,
    "bio": "Lucie Nguyễn (Nguyễn Phương Dung) là KOL nổi tiếng trên mạng xã hội Việt Nam, được biết đến qua nội dung đời sống, gia đình cùng bạn đời Tuấn Dương. Bên cạnh đó, cô là một gương mặt nổi bật trong mảng livestream bán hàng và giới thiệu sản phẩm, trong đó có mỹ phẩm và làm đẹp. Phong cách của cô gắn với hình ảnh đời thường, gần gũi và sức ảnh hưởng lớn trên TikTok.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@lucienguyenlove",
        "followers": "1.2M"
      }
    ],
    "realName": "Nguyễn Phương Dung",
    "basedIn": "TP.HCM",
    "specialties": [
      "Livestream bán hàng (mỹ phẩm, thời trang)",
      "Nhiếp ảnh cưới"
    ],
    "knownFor": [
      "Kênh TikTok với hơn 1 triệu người theo dõi",
      "Nữ doanh nhân sở hữu studio ảnh cưới và các thương hiệu thời trang",
      "Được biết đến qua các phiên livestream bán hàng quy mô lớn"
    ],
    "contentStyle": "Nội dung thiên về lifestyle, giải trí và livestream bán hàng, có lồng ghép review sản phẩm làm đẹp."
  },
  {
    "id": "31",
    "name": "Lê Lý Lan Hương",
    "avatar": "/images/kol/le-ly-lan-huong.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@actress.lanhuong",
    "followers": "1.2M",
    "recentreview": "Trang điểm theo trend và review son",
    "trustscore": 85,
    "categories": [
      "Makeup",
      "Lifestyle"
    ],
    "verified": false,
    "bio": "Lê Lý Lan Hương là một gương mặt làm nội dung trong lĩnh vực làm đẹp tại Việt Nam, chia sẻ kinh nghiệm chăm sóc da và mỹ phẩm. Đây là creator quy mô vừa với phong cách review gần gũi, hướng tới người tiêu dùng phổ thông.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@actress.lanhuong",
        "followers": "1.2M"
      }
    ],
    "basedIn": "TP.HCM",
    "specialties": [
      "Diễn xuất web drama và sitcom",
      "Nội dung làm đẹp, skincare và lifestyle trên TikTok"
    ],
    "knownFor": [
      "Được biết đến với biệt danh 'hot girl ảnh thẻ'",
      "Tham gia sitcom 'Gia Đình Là Số 1' phiên bản Việt",
      "Kênh TikTok với hơn 1 triệu người theo dõi"
    ],
    "contentStyle": "Pha trộn vlog đời sống, diễn xuất và mẹo làm đẹp với phong cách dễ thương, gần gũi."
  },
  {
    "id": "32",
    "name": "Tama",
    "avatar": "/images/kol/tama.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@jjhahehi",
    "followers": "1.2M",
    "recentreview": "Makeup layout và cách làm phồng tóc",
    "trustscore": 85,
    "categories": [
      "Makeup",
      "Lifestyle"
    ],
    "verified": false,
    "bio": "Tama là một nhà sáng tạo nội dung làm đẹp tại Việt Nam, chia sẻ các nội dung về makeup và review mỹ phẩm trên mạng xã hội. Phong cách thiên về trải nghiệm sản phẩm và gợi ý làm đẹp cho giới trẻ.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@jjhahehi",
        "followers": "1.2M"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Hướng dẫn trang điểm",
      "Nội dung làm đẹp và lifestyle"
    ],
    "knownFor": [
      "Kênh TikTok với hơn 1 triệu người theo dõi",
      "Được Favikon xếp trong Top 20 Beauty Influencers tại Việt Nam 2026"
    ],
    "contentStyle": "Kết hợp hướng dẫn làm đẹp, mẹo lifestyle với chủ đề vui nhộn và hình ảnh thẩm mỹ bắt mắt."
  },
  {
    "id": "33",
    "name": "Happi Phạm",
    "avatar": "/images/kol/happi-pham.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@happipham",
    "followers": "1.2M",
    "recentreview": "Review dầu gội siêu thị và serum mọc tóc bình dân",
    "trustscore": 85,
    "categories": [
      "Haircare"
    ],
    "verified": false,
    "bio": "Happi Phạm là người truyền cảm hứng làm đẹp bằng các nguyên liệu tự nhiên, dễ tiếp cận, được nhiều phụ nữ Việt theo dõi. Cô đặc biệt nổi bật ở mảng chăm sóc tóc tự nhiên cùng các mẹo skincare tiết kiệm, và là quản trị viên của một cộng đồng làm đẹp đông thành viên. Phong cách của cô gắn với vẻ đẹp tự nhiên, lành tính và chi phí hợp lý.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@happipham",
        "followers": "1.2M"
      }
    ],
    "specialties": [
      "Review sản phẩm chăm sóc tóc",
      "Review mỹ phẩm và sản phẩm làm đẹp bình dân"
    ],
    "knownFor": [
      "Kênh TikTok chuyên review chăm sóc tóc",
      "Nổi bật với các review dầu gội, kem ủ tóc và serum mọc tóc"
    ],
    "contentStyle": "Tập trung review các sản phẩm chăm sóc tóc và làm đẹp bình dân, đã qua trải nghiệm thực tế.",
    "reviewHighlights": [
      {
        "product": "Serum kích thích mọc tóc bình dân",
        "verdict": "Giới thiệu các lựa chọn giá rẻ hỗ trợ giảm rụng và kích thích mọc tóc.",
        "sentiment": "positive"
      }
    ]
  },
  {
    "id": "34",
    "name": "Vũ Thái Bình",
    "avatar": "/images/kol/vu-thai-binh.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@bbskincare1",
    "followers": "1.2M",
    "recentreview": "Bảng xếp hạng body lotion dưỡng trắng, trải nghiệm cá nhân không tài trợ",
    "trustscore": 85,
    "categories": [
      "Bodycare",
      "Skincare"
    ],
    "verified": false,
    "bio": "Vũ Thái Bình là KOC làm đẹp với kênh TikTok hơn 1,2 triệu follower, chuyên về dưỡng thể (bodycare). Anh nổi tiếng với các video xếp hạng và so sánh body lotion dưỡng trắng, nhấn mạnh trải nghiệm cá nhân và thường ghi rõ nội dung không được tài trợ.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@bbskincare1",
        "followers": "1.2M"
      }
    ],
    "specialties": [
      "Review skincare và dưỡng trắng da",
      "Review kem chống nắng",
      "Review dưỡng trắng body"
    ],
    "knownFor": [
      "Kênh TikTok với hơn 1 triệu người theo dõi",
      "Các review nhanh sản phẩm làm đẹp và dưỡng trắng",
      "Cảnh báo về các loại kem trộn/gia công kém chất lượng"
    ],
    "contentStyle": "Review nhanh các sản phẩm skincare bình dân, kèm cảnh báo về kem trộn kém chất lượng.",
    "reviewHighlights": [
      {
        "product": "Kem trộn gia công kém chất lượng",
        "verdict": "Cảnh báo các sản phẩm kem trộn có thể gây kích ứng, viêm da.",
        "sentiment": "negative"
      }
    ]
  },
  {
    "id": "35",
    "name": "Vân Miu",
    "avatar": "/images/kol/van-miu.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@vanmiu.makeup",
    "followers": "1.1M",
    "recentreview": "Makeup hóa thân người nổi tiếng",
    "trustscore": 89,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": true,
    "bio": "Vân Miu là nhà sáng tạo nội dung và beauty blogger nổi bật trên TikTok, từng đạt giải tại cuộc thi TikTok FashUP 2021. Cô được biết đến qua các video trang điểm biến hóa và hiện hoạt động trong mảng đào tạo trang điểm.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@vanmiu.makeup",
        "followers": "1.1M"
      }
    ],
    "realName": "Đào Cẩm Vân",
    "basedIn": "TP.HCM",
    "activeSince": "2020",
    "specialties": [
      "Trang điểm nghệ thuật và hóa trang (transformation makeup)",
      "Hóa thân thành người nổi tiếng bằng makeup",
      "Đào tạo trang điểm"
    ],
    "knownFor": [
      "Biệt danh 'phù thủy biến hình' với các video hóa thân triệu view",
      "Quán quân Beauty Icon tại TikTok FashUP 2021",
      "Sở hữu công ty đào tạo trang điểm Vanmiu Beauty"
    ],
    "contentStyle": "Video hóa trang thành nghệ sĩ nổi tiếng bằng kỹ thuật makeup tỉ mỉ, đo từng milimet tỷ lệ gương mặt.",
    "ownBrand": "Vanmiu Beauty"
  },
  {
    "id": "36",
    "name": "Quách Ánh",
    "avatar": "/images/kol/quach-anh.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@quachanhmakeupstudio",
    "followers": "1M",
    "recentreview": "Makeup cô dâu và biến hóa gương mặt",
    "trustscore": 92,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": true,
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@quachanhmakeupstudio",
        "followers": "1M"
      },
      {
        "platform": "Youtube",
        "handle": "@QuachAnhMakeupStore",
        "followers": "840K",
        "url": "https://www.youtube.com/c/QuachAnhMakeupStore"
      },
      {
        "platform": "Facebook",
        "handle": "@quachanhmakeupstudio",
        "followers": "500K"
      },
      {
        "platform": "Instagram",
        "handle": "@quachanhmakeupartist",
        "followers": "243K"
      }
    ],
    "basedIn": "Hà Nội",
    "specialties": [
      "Trang điểm chuyên nghiệp (cô dâu, sự kiện, beauty)",
      "Đào tạo make-up qua Quách Ánh Makeup Studio",
      "Phát triển sản phẩm mỹ phẩm cho da người Việt"
    ],
    "knownFor": [
      "Được mệnh danh 'phù thủy makeup' của làng làm đẹp Việt",
      "Sáng lập Quách Ánh Makeup Studio, một trong những học viện trang điểm lớn tại Việt Nam",
      "Founder thương hiệu mỹ phẩm nội địa Lemonade Cosmetics",
      "Hợp tác với nhiều thương hiệu lớn như Maybelline, L'Oréal, Shiseido, Bobbi Brown"
    ],
    "contentStyle": "Chia sẻ tutorial trang điểm và kiến thức nghề make-up theo hướng chuyên gia, hướng dẫn kỹ thuật bài bản.",
    "ownBrand": "Lemonade Cosmetics",
    "signatureProducts": [
      "Lemonade Perfect Couple Lip",
      "Lemonade SuperNatural Mascara"
    ]
  },
  {
    "id": "37",
    "name": "Kim Chung Phan",
    "avatar": "/images/kol/kim-chung-phan.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@kimchungphan20",
    "followers": "2.1M",
    "recentreview": "Makeup, lifestyle beauty và review sản phẩm phổ thông",
    "trustscore": 94,
    "categories": [
      "Makeup",
      "Lifestyle",
      "Skincare"
    ],
    "verified": true,
    "bio": "Kim Chung Phan là creator TikTok có độ phủ lớn, thường làm nội dung beauty/lifestyle, makeup và các sản phẩm làm đẹp phổ thông. Profile live-check tháng 06/2026 ghi nhận 2.1M follower và 87.1M likes.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@kimchungphan20",
        "followers": "2.1M"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Makeup lifestyle",
      "Beauty routine",
      "Sản phẩm làm đẹp phổ thông"
    ],
    "knownFor": [
      "Có mặt trong influData Top 20 Beauty & Cosmetics Vietnam TikTok 06/2026",
      "TikTok profile live-check 06/2026: 2.1M followers, 87.1M likes",
      "Tệp người xem lớn, hợp để theo dõi tín hiệu beauty đại chúng"
    ],
    "contentStyle": "Nội dung TikTok nhanh, gần gũi, trộn giữa lifestyle, makeup và các sản phẩm làm đẹp đang được quan tâm."
  },
  {
    "id": "38",
    "name": "Minh Thái",
    "avatar": "/images/kol/minh-thai.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@thethailyfe",
    "followers": "1M",
    "recentreview": "Nội dung tiệm nail hài hước, trải nghiệm làm móng",
    "trustscore": 89,
    "categories": [
      "Nail"
    ],
    "verified": true,
    "bio": "Nail artist gốc Việt với hơn 20 năm kinh nghiệm trong ngành nail, nổi tiếng toàn cầu với các video hài hước về trải nghiệm tiệm nail. Tạo nội dung giải trí bằng cách đón khách với âm nhạc và nhảy múa. Hiện diện trên TikTok, Instagram và YouTube.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@thethailyfe",
        "followers": "1M"
      }
    ]
  },
  {
    "id": "39",
    "name": "Yến Jii",
    "avatar": "/images/kol/yen-jii.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@yenjiivu",
    "followers": "918K",
    "recentreview": "Makeup biến hình SFX, concept hóa trang sáng tạo",
    "trustscore": 84,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": true,
    "bio": "Tên thật Vũ Hải Yến (1999, Hải Phòng), beauty creator nổi tiếng với tài 'họa mặt' và makeup biến hình SFX mang hơi hướng nghệ thuật. Từng nằm trong nhóm nghệ sĩ Việt hợp tác với Apple trong chiến dịch 'Shot on iPhone'. Phong cách táo bạo, đầu tư concept thay vì chạy theo xu hướng.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@yenjiivu",
        "followers": "918K"
      }
    ],
    "realName": "Vũ Hải Yến",
    "basedIn": "Hà Nội (quê Hải Phòng)",
    "activeSince": "2020",
    "specialties": [
      "Trang điểm nghệ thuật, 'họa mặt' và hóa trang nhân vật",
      "Makeup tạo hiệu ứng đánh lừa thị giác",
      "Beauty content: makeup tutorial, tips làm đẹp, tạo kiểu tóc"
    ],
    "knownFor": [
      "Được gọi là 'phù thủy makeup' với phong cách họa mặt độc đáo, ma mị",
      "Cùng đạo diễn Phương Vũ thực hiện dự án 'Con Rồng Cháu Tiên'",
      "Bộ đôi nghệ sĩ Việt hợp tác với Apple trong chiến dịch Shot on iPhone"
    ],
    "contentStyle": "Tập trung vào makeup nghệ thuật, biến hóa sáng tạo và hóa trang nhân vật hơn là chạy theo xu hướng thuần thương mại."
  },
  {
    "id": "40",
    "name": "Minaash",
    "avatar": "/images/kol/minaash.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@minaashmi",
    "followers": "916K",
    "recentreview": "Makeup tutorial và review sản phẩm trang điểm",
    "trustscore": 80,
    "categories": [
      "Makeup",
      "Lifestyle"
    ],
    "verified": false,
    "bio": "Minaash là một beauty blogger và nhà sáng tạo nội dung tại Việt Nam, hoạt động trên TikTok và Instagram với nội dung makeup, thời trang và lifestyle. Cô được biết đến là gương mặt trẻ trung, bắt trend, thu hút khán giả quan tâm đến xu hướng làm đẹp.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@minaashmi",
        "followers": "916K"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Makeup tutorial",
      "GRWM (Get Ready With Me)",
      "Review sản phẩm trang điểm (mắt, má)"
    ],
    "contentStyle": "Nội dung làm đẹp, makeup và lifestyle theo hướng trẻ trung, gần gũi trên TikTok."
  },
  {
    "id": "41",
    "name": "Thuý Kiều",
    "avatar": "/images/kol/thuy-kieu.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@thuykieu773",
    "followers": "906.1K",
    "recentreview": "Beauty, fashion và sản phẩm lifestyle",
    "trustscore": 84,
    "categories": [
      "Makeup",
      "Lifestyle",
      "Skincare"
    ],
    "verified": true,
    "bio": "Thuý Kiều là creator TikTok hoạt động mạnh ở mảng lifestyle, beauty và sản phẩm tiêu dùng gần với nhóm người xem trẻ. Profile live-check tháng 06/2026 ghi nhận hơn 900K follower và hơn 32M likes.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@thuykieu773",
        "followers": "906.1K"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Beauty lifestyle",
      "Makeup everyday",
      "Gợi ý sản phẩm phổ thông"
    ],
    "knownFor": [
      "Có mặt trong influData Top 20 Beauty & Cosmetics Vietnam TikTok 06/2026",
      "TikTok profile live-check 06/2026: 906.1K followers, 32.3M likes",
      "Hoạt động đều với video grid công khai"
    ],
    "contentStyle": "Video ngắn thiên về lifestyle, beauty và mua sắm; phù hợp để bắt tín hiệu sản phẩm đang lan trong nhóm đại chúng."
  },
  {
    "id": "42",
    "name": "Diệp Lê",
    "avatar": "/images/kol/diep-le.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@diep.lez",
    "followers": "726K",
    "recentreview": "Review cushion che phủ và livestream son YSL",
    "trustscore": 80,
    "categories": [
      "Makeup",
      "Lifestyle"
    ],
    "verified": false,
    "bio": "Diệp Lê là một KOC/nhà sáng tạo nội dung nổi bật trong mảng review mỹ phẩm và livestream bán hàng tại Việt Nam. Cô được biết đến với các phiên livestream giới thiệu sản phẩm làm đẹp và chốt đơn cho người theo dõi. Phong cách của cô thiên về review thực tế, gần gũi và đẩy mạnh thương mại qua livestream.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@diep.lez",
        "followers": "726K"
      }
    ],
    "specialties": [
      "Livestream bán hàng (thời trang, mỹ phẩm, gia dụng)",
      "Săn deal và giới thiệu sản phẩm chính hãng"
    ],
    "knownFor": [
      "TikToker nổi bật trong mảng livestream deal trên TikTok Shop",
      "Từng livestream cùng các thương hiệu lớn (vd Estée Lauder)"
    ],
    "contentStyle": "Phong cách livestream sôi động, định hướng 'hợp thời - hữu dụng - chính hãng', hướng dẫn người xem săn sale và phân biệt hàng thật giả."
  },
  {
    "id": "43",
    "name": "Helly Tống",
    "avatar": "/images/kol/helly-tong.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@hellytong",
    "followers": "700K",
    "recentreview": "Dưỡng thể organic và sống xanh",
    "trustscore": 84,
    "categories": [
      "Lifestyle",
      "Bodycare"
    ],
    "verified": true,
    "bio": "Helly Tống (Tống Khánh Linh) là người mẫu, fashionista và nữ doanh nhân trẻ tại Việt Nam, được biết đến với hình ảnh gắn liền lối sống xanh và bền vững. Cô đồng sáng lập các dự án như Lại Đây Refill Station và The Yên Concept, theo đuổi triết lý làm đẹp 'detox' và tiêu dùng thân thiện môi trường. Phong cách của cô hướng tới vẻ đẹp tự nhiên, tối giản và ý thức bảo vệ môi trường.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@hellytong",
        "followers": "700K"
      }
    ],
    "realName": "Tống Khánh Linh",
    "basedIn": "TP.HCM",
    "activeSince": "2018",
    "specialties": [
      "Lối sống xanh và bền vững",
      "Kinh doanh/khởi nghiệp",
      "Hình ảnh lifestyle - làm đẹp tinh tế"
    ],
    "knownFor": [
      "Nhà sáng lập thương hiệu The Yên Concept",
      "Đồng sáng lập Lại Đây Refill Station theo mô hình refill thân thiện môi trường",
      "Hình ảnh gắn với lối sống tối giản, gần gũi thiên nhiên"
    ],
    "contentStyle": "Chia sẻ thiên về lối sống bền vững, công việc và triết lý sống hơn là review sản phẩm thuần túy.",
    "ownBrand": "The Yên Concept; đồng sáng lập Lại Đây Refill Station"
  },
  {
    "id": "44",
    "name": "Hà Trang (Meichan)",
    "avatar": "/images/kol/ha-trang.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@meichannnnn",
    "followers": "679K",
    "recentreview": "Beauty routine và skincare du học sinh",
    "trustscore": 80,
    "categories": [
      "Makeup",
      "Lifestyle"
    ],
    "verified": false,
    "bio": "Hà Trang, được biết đến với nghệ danh Meichan, là nhà sáng tạo nội dung Việt Nam hoạt động trên TikTok, Instagram và YouTube với các chủ đề làm đẹp, lifestyle và học tập. Cô chia sẻ routine làm đẹp, mẹo cá nhân cùng hành trình du học, tạo hình ảnh gần gũi với khán giả trẻ. Phong cách của cô kết hợp giữa nội dung beauty và truyền cảm hứng phát triển bản thân.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@meichannnnn",
        "followers": "679K"
      }
    ],
    "specialties": [
      "Review làm đẹp",
      "Phong cách trang điểm & skincare ảnh hưởng Hàn Quốc"
    ],
    "knownFor": [
      "Beauty influencer hoạt động trên Instagram với lượng theo dõi lớn",
      "Hợp tác với các thương hiệu làm đẹp trong và ngoài nước"
    ],
    "contentStyle": "Nội dung làm đẹp trẻ trung, thiên về hình ảnh và phong cách Hàn Quốc."
  },
  {
    "id": "45",
    "name": "Tee 8 Phun Xăm",
    "avatar": "/images/kol/tee-8.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@tee8eyebrows",
    "followers": "475.7K",
    "recentreview": "Phun xăm thẩm mỹ, lông mày, môi và mí",
    "trustscore": 78,
    "categories": [
      "Makeup",
      "Treatment"
    ],
    "verified": true,
    "bio": "Tee 8 Phun Xăm là creator/mentor trong niche phun xăm thẩm mỹ, tập trung vào lông mày, môi, mí và đào tạo kỹ thuật làm đẹp bán vĩnh viễn. Profile live-check tháng 06/2026 ghi nhận 475.7K follower.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@tee8eyebrows",
        "followers": "475.7K"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Phun xăm thẩm mỹ",
      "Lông mày",
      "Môi và mí",
      "Đào tạo kỹ thuật beauty"
    ],
    "knownFor": [
      "Có mặt trong influData Top 20 Beauty & Cosmetics Vietnam TikTok 06/2026",
      "TikTok profile live-check 06/2026: 475.7K followers, 4.7M likes",
      "Niche phun xăm giúp cân bằng list ngoài makeup/skincare truyền thống"
    ],
    "contentStyle": "Nội dung chuyên môn về phun xăm, case thực tế và kiến thức làm đẹp bán vĩnh viễn."
  },
  {
    "id": "46",
    "name": "Hà Trúc",
    "avatar": "/images/kol/ha-truc.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@lehatruc",
    "followers": "646K",
    "recentreview": "Review chống nắng và skincare đi biển",
    "trustscore": 87,
    "categories": [
      "Skincare",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Hà Trúc (Lê Hà Trúc) là travel, lifestyle blogger được nhiều người biết đến, đồng thời quan tâm sâu tới thời trang và làm đẹp. Cô làm nội dung về du lịch, phong cách sống và làm đẹp, thường hợp tác cùng các thương hiệu thời trang và mỹ phẩm cao cấp.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@lehatruc",
        "followers": "646K"
      },
      {
        "platform": "Tiktok",
        "handle": "@hatruc",
        "followers": "400K"
      },
      {
        "platform": "Facebook",
        "handle": "@lehatruc.official",
        "followers": "166K"
      }
    ],
    "realName": "Lê Hà Trúc",
    "basedIn": "TP.HCM",
    "specialties": [
      "Travel & lifestyle blog",
      "Thời trang",
      "Làm đẹp gắn với phong cách sống"
    ],
    "knownFor": [
      "Travel blogger nổi tiếng, kết hợp du lịch với thời trang và làm đẹp",
      "Gương mặt quen thuộc của nhiều thương hiệu thời trang - làm đẹp cao cấp"
    ],
    "contentStyle": "Nội dung lifestyle tinh tế, lồng ghép làm đẹp và thời trang vào hình ảnh du lịch."
  },
  {
    "id": "47",
    "name": "Hana Giang Anh",
    "avatar": "/images/kol/hana-giang-anh.jpg",
    "cover": "",
    "platform": "Youtube",
    "handle": "@HanaGiangAnh",
    "followers": "640K",
    "recentreview": "Skincare và lối sống lành mạnh",
    "trustscore": 86,
    "categories": [
      "Skincare",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Hana Giang Anh (Nguyễn Đăng Hương Giang) là huấn luyện viên fitness và một trong những YouTuber mảng sức khỏe, thể hình đời đầu tại Việt Nam. Nội dung của cô xoay quanh tập luyện, dinh dưỡng và lối sống lành mạnh, bên cạnh các chủ đề về tâm lý và phát triển bản thân.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@HanaGiangAnh",
        "followers": "640K",
        "url": "https://www.youtube.com/@HanaGiangAnhOfficial"
      }
    ],
    "realName": "Nguyễn Đăng Hương Giang",
    "activeSince": "2013",
    "specialties": [
      "Huấn luyện fitness",
      "Dinh dưỡng & lối sống lành mạnh",
      "Nội dung làm đẹp - lifestyle"
    ],
    "knownFor": [
      "Một trong những HLV fitness nữ nổi tiếng nhất trên YouTube Việt Nam",
      "Nhà sáng lập INSPIRE Boutique Fitness",
      "Nội dung tập luyện, dinh dưỡng kết hợp làm đẹp và lifestyle"
    ],
    "contentStyle": "Phong cách truyền cảm hứng về sức khỏe và lối sống lành mạnh, xen kẽ nội dung làm đẹp.",
    "ownBrand": "INSPIRE Boutique Fitness"
  },
  {
    "id": "48",
    "name": "Lou Lê",
    "avatar": "/images/kol/lou-le.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@lou.le",
    "followers": "600K",
    "recentreview": "Trải nghiệm gội đầu dưỡng sinh tại tiệm bình dân",
    "trustscore": 80,
    "categories": [
      "Haircare"
    ],
    "verified": false,
    "bio": "Lou Lê là một nhà sáng tạo nội dung làm đẹp tại Việt Nam, chia sẻ nội dung makeup và review mỹ phẩm trên mạng xã hội. Đây là gương mặt quy mô vừa với phong cách gần gũi, hướng tới khán giả trẻ.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@lou.le",
        "followers": "600K"
      }
    ]
  },
  {
    "id": "49",
    "name": "TS.BS Lã Thanh Hà",
    "avatar": "/images/kol/ts-bs-la-thanh-ha.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@bacsilaha",
    "followers": "588K",
    "recentreview": "Điều trị mụn, sẹo rỗ và tư vấn skincare",
    "trustscore": 84,
    "categories": [
      "Treatment",
      "Skincare"
    ],
    "verified": true,
    "bio": "Tiến sĩ, bác sĩ da liễu, giảng viên và Trưởng khoa Da liễu Học viện Y Dược học Cổ truyền Việt Nam, phụ trách phòng khám Dr Lã Hà. Nội dung tập trung điều trị mụn, sẹo rỗ, nám và tư vấn chăm sóc da chuẩn y khoa. Kênh có lượng tương tác lớn trong cộng đồng yêu skincare.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@bacsilaha",
        "followers": "588K"
      }
    ],
    "realName": "Lã Thanh Hà",
    "specialties": [
      "Da liễu",
      "Điều trị mụn, nám và phục hồi da",
      "Phổ biến kiến thức chăm sóc da"
    ],
    "knownFor": [
      "Tiến sĩ, bác sĩ da liễu chia sẻ kiến thức chuyên môn trên TikTok",
      "Trực tiếp điều hành phòng khám chuyên khoa da liễu (Lã Hà Clinic)",
      "Nội dung tập trung điều trị mụn, nám và phục hồi làn da"
    ],
    "contentStyle": "Nội dung mang tính chuyên môn y khoa, giải thích cách chăm sóc và điều trị da đúng cách."
  },
  {
    "id": "50",
    "name": "Chou Lười Makeup",
    "avatar": "/images/kol/chou-luoi-makeup.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@chouchinchan",
    "followers": "578K",
    "recentreview": "Review son nền, cushion, che khuyết điểm theo lối tối giản",
    "trustscore": 83,
    "categories": [
      "Makeup",
      "Skincare"
    ],
    "verified": false,
    "bio": "Beauty creator tại TP.HCM theo triết lý 'mê mỹ phẩm nhưng lười makeup', đề cao lối trang điểm tối giản. Nội dung tập trung review son, kem nền, che khuyết điểm và mẹo skincare thực tế. Phong cách gần gũi, thẳng thắn khi bóc tách sản phẩm.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@chouchinchan",
        "followers": "578K"
      },
      {
        "platform": "Instagram",
        "handle": "@chouchinchan28",
        "followers": "26K"
      }
    ],
    "basedIn": "TP.HCM",
    "specialties": [
      "Hướng dẫn trang điểm cho người mới",
      "Phong cách makeup tự nhiên, tối giản",
      "Review mỹ phẩm"
    ],
    "knownFor": [
      "Beauty creator với triết lý 'yêu mỹ phẩm nhưng lười makeup'",
      "Các video hướng dẫn trang điểm đơn giản, dễ làm theo"
    ],
    "contentStyle": "Phong cách gần gũi, hướng tới makeup tối giản, dễ áp dụng cho người bận rộn."
  },
  {
    "id": "51",
    "name": "Hiwon",
    "avatar": "/images/kol/hiwon.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@hiwon91",
    "followers": "555K",
    "recentreview": "Trang điểm sao Việt, hoa hậu theo phong cách Hàn Quốc trong trẻo, tôn mắt",
    "trustscore": 83,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": false,
    "bio": "Hiwon, tên thật Trần Quốc Huy, là chuyên gia trang điểm nổi tiếng làm việc tại TP.HCM. Anh trang điểm cho nhiều nghệ sĩ và hoa hậu với phong cách Hàn Quốc nhẹ nhàng, tôn đôi mắt. Anh cũng sáng lập Hiwon Makeup & Academy đào tạo trang điểm chuyên nghiệp.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@hiwon91",
        "followers": "555K"
      },
      {
        "platform": "Facebook",
        "handle": "@makeuphiwon",
        "followers": "100K"
      },
      {
        "platform": "Instagram",
        "handle": "@hiwon_makeup",
        "followers": "28K"
      }
    ],
    "realName": "Trần Quốc Huy",
    "basedIn": "TP.HCM",
    "specialties": [
      "Trang điểm chuyên nghiệp (đặc biệt cô dâu)",
      "Phong cách makeup Hàn Quốc tự nhiên",
      "Đào tạo makeup"
    ],
    "knownFor": [
      "Chuyên gia trang điểm được nhiều nghệ sĩ, hot girl Việt lựa chọn",
      "Sáng lập Hiwon Makeup & Academy"
    ],
    "contentStyle": "Phong cách trang điểm thiên hướng Hàn Quốc, tự nhiên và nhẹ nhàng.",
    "ownBrand": "Hiwon Makeup & Academy"
  },
  {
    "id": "52",
    "name": "Skincare Đúng Cách by Sơn",
    "avatar": "/images/kol/skincare-dung-cach-by-son.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@skincaredungcach.byson",
    "followers": "550K",
    "recentreview": "Gợi ý skincare ít người biết nhưng tốt",
    "trustscore": 80,
    "categories": [
      "Skincare",
      "Treatment"
    ],
    "verified": false,
    "bio": "Skincare Đúng Cách by Sơn là kênh do Sơn Đỗ (Austin Đỗ) sáng lập, hoạt động mạnh trên TikTok với định hướng skinfluencer chuyên về chăm sóc da đúng cách. Anh nổi bật với các video review mỹ phẩm thẳng thắn, hướng dẫn xây dựng routine và phân tích sản phẩm dựa trên trải nghiệm cá nhân. Phong cách review được đánh giá là chân thực, nhấn mạnh việc dùng đồ skincare một cách thông minh, phù hợp với từng loại da.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@skincaredungcach.byson",
        "followers": "550K"
      }
    ],
    "realName": "Sơn Đỗ",
    "specialties": [
      "Review skincare",
      "Phân tích thành phần và hướng dẫn chăm sóc da đúng cách"
    ],
    "knownFor": [
      "Skinfluencer chuyên review skincare và hướng dẫn dùng sản phẩm đúng cách",
      "Hoạt động mạnh trên TikTok và Facebook"
    ],
    "contentStyle": "Phong cách review thẳng thắn dựa trên trải nghiệm cá nhân, sẵn sàng khen chê.",
    "transparencyNote": "Thường nhấn mạnh quan điểm cá nhân và đề nghị nhãn hàng không seeding dưới video."
  },
  {
    "id": "53",
    "name": "Tina Lê",
    "avatar": "/images/kol/tina-le-make-up-youtube.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@tinalemakeup",
    "followers": "500K",
    "recentreview": "Kỹ thuật trang điểm chuyên nghiệp",
    "trustscore": 87,
    "categories": [
      "Makeup",
      "High-end Makeup",
      "Treatment"
    ],
    "verified": true,
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@tinalemakeup",
        "followers": "500K"
      },
      {
        "platform": "Youtube",
        "handle": "@TinaLeMakeUp",
        "followers": "200K"
      },
      {
        "platform": "Instagram",
        "handle": "@tinalemakeup1985",
        "followers": "41K"
      }
    ],
    "basedIn": "Hà Nội",
    "activeSince": "2010",
    "specialties": [
      "Trang điểm chuyên nghiệp",
      "Đào tạo makeup",
      "Phong cách trang điểm ảnh hưởng Hàn Quốc"
    ],
    "knownFor": [
      "Chuyên gia trang điểm lâu năm tại Hà Nội",
      "Sáng lập Tina Le MakeUp Academy",
      "Từng trang điểm cho nhiều nghệ sĩ và chương trình lớn"
    ],
    "contentStyle": "Nội dung trang điểm chuyên nghiệp, hướng dẫn kỹ thuật và đào tạo nghề.",
    "ownBrand": "Tina Le MakeUp Academy"
  },
  {
    "id": "54",
    "name": "Sun HT (Sunnie)",
    "avatar": "/images/kol/sun-ht.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@sunht",
    "followers": "492K",
    "recentreview": "Makeup tự nhiên đi học đi làm",
    "trustscore": 78,
    "categories": [
      "Lifestyle",
      "Makeup"
    ],
    "verified": true,
    "bio": "Sun HT (Sunnie) là một content creator hoạt động trong lĩnh vực làm đẹp và phong cách sống trên Instagram, TikTok tại Việt Nam. Cô chia sẻ nội dung makeup, lifestyle với phong cách trẻ trung, được nhiều bạn trẻ theo dõi.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@sunht",
        "followers": "492K"
      }
    ],
    "basedIn": "Hà Nội",
    "specialties": [
      "Thời trang & lifestyle",
      "Làm đẹp",
      "Kinh doanh thương hiệu cá nhân"
    ],
    "knownFor": [
      "Hot girl Hà Thành có ảnh hưởng trong xu hướng thời trang giới trẻ",
      "Thuộc nhóm hot girl quen thuộc cùng Chi Pu, Quỳnh Anh Shyn, Salim"
    ],
    "contentStyle": "Nội dung lifestyle - thời trang trẻ trung, lồng ghép làm đẹp."
  },
  {
    "id": "55",
    "name": "Kỳ Kỳ",
    "avatar": "/images/kol/ky-ky.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@unofficiallykyky",
    "followers": "465K",
    "recentreview": "Trải nghiệm skincare và makeup thật từ chính làn da, không nhận quảng cáo",
    "trustscore": 77,
    "categories": [
      "Skincare",
      "Makeup"
    ],
    "verified": false,
    "bio": "Kỳ Kỳ là beauty blogger/YouTuber nổi tiếng với kênh TikTok khoảng 465 nghìn người theo dõi. Cô chia sẻ kinh nghiệm chăm sóc da và trang điểm dựa trên trải nghiệm cá nhân, nổi bật với việc không nhận review hay quà tặng sản phẩm để giữ tính khách quan.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@unofficiallykyky",
        "followers": "465K"
      },
      {
        "platform": "Youtube",
        "handle": "@KyKy",
        "followers": "200K"
      }
    ],
    "specialties": [
      "Review skincare và làm đẹp",
      "Chia sẻ kinh nghiệm chăm da theo trải nghiệm cá nhân"
    ],
    "knownFor": [
      "Beauty blogger chia sẻ kinh nghiệm skincare dựa trên làn da của bản thân"
    ],
    "contentStyle": "Phong cách chia sẻ dựa trên trải nghiệm cá nhân, giúp người xem cân nhắc sản phẩm có hợp da hay không.",
    "transparencyNote": "Cho biết không nhận review sản phẩm hay hợp tác nhãn hàng."
  },
  {
    "id": "56",
    "name": "Hoàng XXIV",
    "avatar": "/images/kol/hoang-xxiv.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@hoangxxiv",
    "followers": "457K",
    "recentreview": "Nước hoa Louis Vuitton có đáng mua không",
    "trustscore": 74,
    "categories": [
      "Perfume"
    ],
    "verified": false,
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@hoangxxiv",
        "followers": "457K"
      }
    ],
    "specialties": [
      "Review nước hoa",
      "Tư vấn mùi hương nam/unisex"
    ],
    "knownFor": [
      "Creator chuyên review nước hoa trên TikTok",
      "Gắn với XXIV Store / XXIV Perfume Bar"
    ],
    "contentStyle": "Nội dung tập trung đánh giá và gợi ý mùi hương theo nhu cầu, mùa và mức giá."
  },
  {
    "id": "57",
    "name": "Cô Em Trendy",
    "avatar": "/images/kol/co-em-trendy.jpg",
    "cover": "",
    "platform": "Facebook",
    "handle": "@coemtrendy",
    "followers": "418K",
    "recentreview": "Đại sứ kem chống nắng PREVENTION+",
    "trustscore": 78,
    "categories": [
      "Lifestyle",
      "Skincare"
    ],
    "verified": true,
    "bio": "Cô Em Trendy (Nguyễn Đặng Khánh Linh) là fashionista và nhà sáng tạo nội dung đến từ Hà Nội, nổi bật với gu thời trang hiện đại trên TikTok, Instagram và YouTube. Cô từng làm giám khảo trẻ nhất của cuộc thi TikTok FashUp 2021 và được biết đến với nội dung phối đồ, làm đẹp đa dạng. Phong cách của cô gắn với thời trang trendy, năng động và truyền cảm hứng cho giới trẻ.",
    "socials": [
      {
        "platform": "Facebook",
        "handle": "@coemtrendy",
        "followers": "418K"
      }
    ],
    "realName": "Nguyễn Đặng Khánh Linh",
    "basedIn": "TP.HCM",
    "specialties": [
      "Thời trang & phong cách",
      "Lifestyle",
      "Làm đẹp gắn với thời trang"
    ],
    "knownFor": [
      "Fashionista, fashion blogger có ảnh hưởng lớn",
      "Từng tham gia The Face 2017, xuất thân là người mẫu lookbook",
      "Xuất hiện tại các tuần lễ thời trang London, Paris, Milan"
    ],
    "contentStyle": "Nội dung thời trang - lifestyle thời thượng, đa dạng, có lồng ghép làm đẹp."
  },
  {
    "id": "58",
    "name": "An Phương",
    "avatar": "/images/kol/an-phuong-letsplaymakeup-youtube.jpg",
    "cover": "",
    "platform": "Youtube",
    "handle": "@Letsplaymakeupchannel",
    "followers": "410K",
    "recentreview": "Review skincare và best of beauty trong năm",
    "trustscore": 83,
    "categories": [
      "Skincare",
      "Makeup",
      "Treatment"
    ],
    "verified": true,
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@Letsplaymakeupchannel",
        "followers": "410K"
      },
      {
        "platform": "Instagram",
        "handle": "@letsplaymakeup",
        "followers": "337K"
      },
      {
        "platform": "Tiktok",
        "handle": "@anphuong.beauty",
        "followers": "300K"
      }
    ],
    "realName": "Trương An Phương",
    "activeSince": "2017",
    "specialties": [
      "Review làm đẹp & skincare",
      "Vlog lifestyle đầu tư chỉn chu",
      "Công nghệ - ứng dụng"
    ],
    "knownFor": [
      "Beauty blogger nổi tiếng, khởi đầu trên Instagram với tên Letsplaymakeup",
      "Vlog làm đẹp đầu tư chất lượng trên YouTube",
      "Song song làm công việc báo chí"
    ],
    "contentStyle": "Phong cách vlog gần gũi, chỉn chu, chọn các chủ đề đơn giản và thiết thực với số đông."
  },
  {
    "id": "59",
    "name": "Mai Vân Trang",
    "avatar": "/images/kol/mai-van-trang-youtube.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@maivantrang",
    "followers": "400K",
    "recentreview": "Makeup hằng ngày và review mỹ phẩm",
    "trustscore": 81,
    "categories": [
      "Makeup",
      "Lifestyle",
      "Skincare",
      "Treatment"
    ],
    "verified": true,
    "bio": "Mai Vân Trang là beauty blogger hoạt động trên YouTube, làm nội dung về review mỹ phẩm, mẹo làm đẹp và hướng dẫn trang điểm. Cô hướng đến phong cách trẻ trung, vui vẻ và thường tự trải nghiệm sản phẩm qua từng giai đoạn để chia sẻ cảm nhận thực tế.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@maivantrang",
        "followers": "400K"
      },
      {
        "platform": "Youtube",
        "handle": "@MaiVanTrang",
        "followers": "320K"
      },
      {
        "platform": "Instagram",
        "handle": "@maivantrang",
        "followers": "299K"
      }
    ],
    "basedIn": "Hà Nội",
    "specialties": [
      "Review & phân tích thành phần mỹ phẩm",
      "Chăm sóc da theo hướng khoa học",
      "Trang điểm"
    ],
    "knownFor": [
      "Beauty blogger tiếp cận skincare theo hướng khoa học, phân tích bảng thành phần",
      "Xuất thân từ người mẫu lookbook của nhiều local brand Hà Nội"
    ],
    "contentStyle": "Nội dung làm đẹp thiên về phân tích thành phần và lợi ích cho từng loại da."
  },
  {
    "id": "60",
    "name": "Bống Bee",
    "avatar": "/images/kol/bong-bee.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@bongbee1301",
    "followers": "400K",
    "recentreview": "Hướng dẫn tạo kiểu, biến đổi kiểu tóc và chăm sóc, phục hồi tóc hư tổn",
    "trustscore": 81,
    "categories": [
      "Haircare"
    ],
    "verified": true,
    "bio": "Bống Bee (tên thật Đào Thùy Dương) là hairstylist từng làm tóc cho người mẫu tại các show thời trang trước khi nổi tiếng trên TikTok. Cô được biết đến với các clip biến đổi kiểu tóc và mái tóc dày mượt. Nội dung gồm mẹo chăm sóc tóc, tạo kiểu và review sản phẩm dưỡng tóc.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@bongbee1301",
        "followers": "400K"
      },
      {
        "platform": "Instagram",
        "handle": "@bongbee.1301",
        "followers": "20K"
      }
    ]
  },
  {
    "id": "61",
    "name": "Đỗ Thị Hà",
    "avatar": "/images/kol/do-thi-ha.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@doha.hhvn",
    "followers": "390K",
    "recentreview": "Skincare routine và makeup look của Hoa hậu",
    "trustscore": 78,
    "categories": [
      "Skincare",
      "Makeup",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Đỗ Thị Hà là Hoa hậu Việt Nam 2020, đồng thời là gương mặt được chú ý trong lĩnh vực làm đẹp nhờ làn da căng mịn. Cô thường chia sẻ quy trình skincare nhiều bước cùng các sản phẩm từ bình dân đến cao cấp, kết hợp chăm sóc da từ bên trong. Phong cách của cô đề cao việc dưỡng da đều đặn, tự nhiên và thực tế.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@doha.hhvn",
        "followers": "390K"
      }
    ],
    "basedIn": "Hà Nội",
    "specialties": [
      "Skincare cá nhân",
      "Làm đẹp cho da khô / da đang treatment",
      "Đại sứ thương hiệu"
    ],
    "knownFor": [
      "Hoa hậu Việt Nam 2020, quê Thanh Hóa",
      "Top 13 Miss World 2021",
      "Chia sẻ chu trình dưỡng da và routine cá nhân"
    ],
    "contentStyle": "Chia sẻ routine và sản phẩm dưỡng da cá nhân theo hướng đời thường, kết hợp cả món bình dân lẫn cao cấp.",
    "signatureProducts": [
      "Estée Lauder",
      "La Roche-Posay",
      "Anessa",
      "Cocoon"
    ],
    "transparencyNote": "Từng làm đại sứ thương hiệu mỹ phẩm; nội dung làm đẹp thường gắn với hợp tác thương hiệu."
  },
  {
    "id": "62",
    "name": "Bác sĩ Đỗ Quốc Tuấn",
    "avatar": "/images/kol/bac-si-do-quoc-tuan.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@drdotuan",
    "followers": "388K",
    "recentreview": "Phản biện trend skincare, giới thiệu sản phẩm dưỡng da",
    "trustscore": 78,
    "categories": [
      "Treatment",
      "Skincare"
    ],
    "verified": true,
    "bio": "Bác sĩ da liễu tốt nghiệp ĐH Y Hà Nội, founder phòng khám MEDiCARE tại Hà Nội. Nội dung chia sẻ kiến thức da liễu, review sản phẩm và phản ứng với các trend skincare theo phong cách trẻ trung, bắt trend. Một trong những bác sĩ 'triệu view' trên TikTok.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@drdotuan",
        "followers": "388K"
      }
    ],
    "realName": "Đỗ Quốc Tuấn",
    "basedIn": "Hà Nội",
    "specialties": [
      "Da liễu",
      "Tư vấn chăm sóc da",
      "Review thành phần mỹ phẩm"
    ],
    "knownFor": [
      "Bác sĩ da liễu, tốt nghiệp Đại học Y Hà Nội",
      "Sáng lập phòng khám MEDiCARE Clinic",
      "Tư vấn da liễu trên TikTok"
    ],
    "contentStyle": "Tư vấn chăm sóc da dưới góc nhìn bác sĩ da liễu, giải thích cơ chế và thành phần.",
    "ownBrand": "MEDiCARE Clinic"
  },
  {
    "id": "63",
    "name": "Trần Lâm (Bimm)",
    "avatar": "/images/kol/tran-lam.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@tran_lam18",
    "followers": "380K",
    "recentreview": "Review skincare cho da dầu mụn dựa trên trải nghiệm cá nhân và dẫn chứng khoa học",
    "trustscore": 78,
    "categories": [
      "Skincare",
      "Treatment"
    ],
    "verified": true,
    "bio": "Trần Võ Hoàng Lâm (biệt danh Bimm) tốt nghiệp ngành Luật Quốc tế nhưng theo đuổi đam mê chăm sóc da. Anh là skinfluencer nam nổi bật với nội dung review và kiến thức skincare cho da dầu mụn, trình bày dễ hiểu và hài hước. Từng thắng hạng mục làm đẹp trong chiến dịch #LearnOnTiktok.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@tran_lam18",
        "followers": "380K"
      }
    ],
    "realName": "Trần Lâm",
    "specialties": [
      "Review skincare",
      "Chống nắng",
      "Toner & dưỡng da"
    ],
    "knownFor": [
      "Beauty blogger TikTok với thương hiệu cá nhân 'With Bimm'",
      "Review chi tiết sản phẩm dưỡng da bình dân lẫn cao cấp"
    ],
    "contentStyle": "Review skincare chi tiết, dùng thử dài ngày trước khi đưa nhận xét.",
    "reviewHighlights": [
      {
        "product": "Toner Nước Sen Hậu Giang Cocoon",
        "verdict": "Đánh giá tích cực sau hơn 2 tháng dùng, làm dịu da, hợp da nhạy cảm.",
        "sentiment": "positive"
      }
    ]
  },
  {
    "id": "64",
    "name": "Trần Thiên Lý",
    "avatar": "/images/kol/tran-thien-ly.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@tranthienly.com",
    "followers": "180.7K",
    "recentreview": "Beauty coaching, makeup và mentor nội dung làm đẹp",
    "trustscore": 72,
    "categories": [
      "Makeup",
      "High-end Makeup",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Trần Thiên Lý là beauty creator/coach hoạt động trên TikTok với định vị beauty coaching and mentor. Nội dung tập trung vào makeup, định hướng hình ảnh và chia sẻ kinh nghiệm làm đẹp.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@tranthienly.com",
        "followers": "180.7K"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Beauty coaching",
      "Makeup",
      "Định hướng hình ảnh cá nhân"
    ],
    "knownFor": [
      "Profile bio công khai: Beauty Coaching and Mentor",
      "TikTok profile live-check 06/2026: 180.7K followers, 1.8M likes",
      "Bổ sung nhóm creator có định vị hướng dẫn và coaching làm đẹp"
    ],
    "contentStyle": "Nội dung beauty coach, makeup và chia sẻ kinh nghiệm làm đẹp theo hướng mentor."
  },
  {
    "id": "65",
    "name": "Primmy Trương",
    "avatar": "/images/kol/primmy-truong-tiktok.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@primmytruong",
    "followers": "300K",
    "recentreview": "Beauty tips và phong cách thời trang",
    "trustscore": 81,
    "categories": [
      "Makeup",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Primmy Trương (Trương Minh Xuân Thảo) là beauty blogger và người mẫu ảnh được biết đến tại TP.HCM. Cô làm nội dung về làm đẹp và phong cách sống, với hình ảnh chỉn chu, thanh lịch.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@primmytruong",
        "followers": "300K"
      },
      {
        "platform": "Instagram",
        "handle": "@primmytruong",
        "followers": "123K"
      },
      {
        "platform": "Youtube",
        "handle": "@primmytruong",
        "followers": "110K"
      }
    ],
    "realName": "Trương Minh Xuân Thảo",
    "basedIn": "TP.HCM",
    "specialties": [
      "Beauty blogger",
      "Skincare",
      "Lifestyle làm đẹp"
    ],
    "knownFor": [
      "KOL làm đẹp, hoạt động beauty blog nhiều năm",
      "Được biết đến rộng rãi là vợ doanh nhân Phan Thành"
    ],
    "contentStyle": "Chia sẻ làm đẹp và lifestyle theo phong cách sang trọng, kín tiếng."
  },
  {
    "id": "66",
    "name": "Emmi Hoàng",
    "avatar": "/images/kol/emmi-hoang.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@emmihoang",
    "followers": "300K",
    "recentreview": "Review thành phần skincare và haircare",
    "trustscore": 78,
    "categories": [
      "Skincare",
      "Haircare"
    ],
    "verified": true,
    "bio": "Emmi Hoàng (Hoàng Hạnh Dung) là beauty blogger kiêm doanh nhân, người sáng lập và điều hành Happy Skin Vietnam. Trước khi khởi nghiệp, cô có nhiều năm kinh nghiệm trong lĩnh vực quản trị thương hiệu và marketing ngành làm đẹp, và được biết đến với nội dung chia sẻ kiến thức chăm sóc da.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@emmihoang",
        "followers": "300K"
      }
    ],
    "basedIn": "Việt Nam",
    "activeSince": "2015",
    "specialties": [
      "Quản trị thương hiệu mỹ phẩm",
      "Kiến thức skincare",
      "Beauty blogger"
    ],
    "knownFor": [
      "CEO & Founder Happy Skin Vietnam",
      "Sáng lập thương hiệu mỹ phẩm Emmié by Happy Skin",
      "Từng là Brand Manager của Pond's tại Unilever Vietnam"
    ],
    "contentStyle": "Chia sẻ kiến thức chăm sóc da kết hợp góc nhìn người làm thương hiệu.",
    "ownBrand": "Happy Skin Vietnam / Emmié by Happy Skin"
  },
  {
    "id": "67",
    "name": "Sunhuyn",
    "avatar": "/images/kol/sunhuyn.jpg",
    "cover": "",
    "platform": "Youtube",
    "handle": "@Sunhuyn95",
    "followers": "300K",
    "recentreview": "Routine dưỡng da và chia sẻ cải thiện bản thân",
    "trustscore": 76,
    "categories": [
      "Skincare",
      "Lifestyle"
    ],
    "verified": false,
    "bio": "Sunhuyn (Trần Thị Thanh Huyền) là YouTuber, vlogger và blogger người Việt, chia sẻ nội dung về kỹ năng sống, kiến thức hữu ích và vlog đời sống. Bên cạnh lifestyle, cô cũng đề cập đến các chủ đề chăm sóc da và làm đẹp theo hướng chỉn chu, có chiều sâu. Phong cách của cô gắn với những giá trị tích cực và nội dung gần gũi với người trẻ.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@Sunhuyn95",
        "followers": "300K",
        "url": "https://www.youtube.com/@sunhuyn"
      }
    ],
    "realName": "Trần Thị Thanh Huyền",
    "activeSince": "2015",
    "specialties": [
      "Phát triển bản thân",
      "Lifestyle",
      "Sức khỏe tinh thần"
    ],
    "knownFor": [
      "Content creator đa nền tảng",
      "Nội dung thiên về phát triển bản thân, review sách và lifestyle hơn là review mỹ phẩm chuyên sâu"
    ],
    "contentStyle": "Chia sẻ nhẹ nhàng về phát triển bản thân, sức khỏe tinh thần và lối sống tích cực."
  },
  {
    "id": "68",
    "name": "Quin",
    "avatar": "/images/kol/quin-vu-thuy-quynh-kols-koc.png",
    "cover": "",
    "platform": "Youtube",
    "handle": "@Quin",
    "followers": "285K",
    "recentreview": "Review sản phẩm skincare và các bước chăm da",
    "trustscore": 79,
    "categories": [
      "Skincare"
    ],
    "verified": false,
    "bio": "Beauty blogger (Vũ Thúy Quỳnh, sinh năm 1994) thu hút giới trẻ quan tâm skincare và sản phẩm chăm da. Nội dung chủ yếu là video review sản phẩm và các bước chăm sóc da một cách chân thực. Hoạt động mạnh trên YouTube và TikTok.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@Quin",
        "followers": "285K"
      },
      {
        "platform": "Tiktok",
        "handle": "@quin",
        "followers": "62K"
      }
    ],
    "realName": "Vũ Thúy Quỳnh",
    "specialties": [
      "Review skincare",
      "Hướng dẫn chăm sóc da",
      "Beauty blogger"
    ],
    "knownFor": [
      "Beauty blogger YouTube chuyên về skincare",
      "Chia sẻ kiến thức và trải nghiệm chăm sóc da theo hướng chân thực"
    ],
    "contentStyle": "Review sản phẩm skincare và các bước chăm sóc da theo trải nghiệm cá nhân, chân thực."
  },
  {
    "id": "69",
    "name": "Linh Jace",
    "avatar": "/images/kol/linh-jace.jpg",
    "cover": "",
    "platform": "Facebook",
    "handle": "@LinhJace91",
    "followers": "228K",
    "recentreview": "Trang điểm cô dâu, makeup sự kiện và đào tạo học viên",
    "trustscore": 77,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": false,
    "bio": "Linh Jace là một trong những makeup artist hàng đầu tại Hà Nội, bắt đầu sự nghiệp từ năm 17 tuổi với gần 13 năm kinh nghiệm. Cô nổi tiếng với trang điểm cô dâu và từng tài trợ makeup cho các sự kiện lớn như Vietnam International Fashion Week và Miss Universe Vietnam. Cô sáng lập Linh Jace Makeup Academy đào tạo hàng trăm chuyên gia trang điểm.",
    "socials": [
      {
        "platform": "Facebook",
        "handle": "@LinhJace91",
        "followers": "228K"
      },
      {
        "platform": "Instagram",
        "handle": "@linhjace.makeup",
        "followers": "12K"
      }
    ],
    "realName": "Nguyễn Thị Thu Linh",
    "basedIn": "Hà Nội",
    "specialties": [
      "Trang điểm chuyên nghiệp",
      "Makeup cô dâu",
      "Đào tạo makeup"
    ],
    "knownFor": [
      "Chuyên gia trang điểm (MUA) chuyên nghiệp",
      "Sáng lập Linh Jace Makeup Academy đào tạo MUA",
      "Trang điểm cho nhiều người nổi tiếng"
    ],
    "contentStyle": "Trang điểm theo phong cách trong trẻo, nhẹ nhàng, hợp cô dâu và sự kiện quan trọng.",
    "ownBrand": "Linh Jace Makeup Academy"
  },
  {
    "id": "70",
    "name": "Khánh The MUA",
    "avatar": "/images/kol/khanh-the-mua.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@khanhtq_makeup",
    "followers": "200K",
    "recentreview": "Hướng dẫn makeup chuyên sâu",
    "trustscore": 74,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": false,
    "bio": "Khánh The MUA là một makeup artist hoạt động trên TikTok với nội dung tập trung vào trang điểm và làm đẹp. Anh chia sẻ các kỹ thuật, hướng dẫn makeup và là một gương mặt trong cộng đồng beauty trên nền tảng này.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@khanhtq_makeup",
        "followers": "200K"
      }
    ],
    "basedIn": "TP.HCM",
    "specialties": [
      "Trang điểm chuyên nghiệp",
      "Đào tạo makeup cá nhân"
    ],
    "knownFor": [
      "Makeup artist (MUA) hoạt động tại Sài Gòn",
      "Mở khóa đào tạo makeup cá nhân"
    ],
    "contentStyle": "Chia sẻ kỹ thuật trang điểm và hậu trường công việc MUA trên TikTok/Instagram."
  },
  {
    "id": "71",
    "name": "Dr Hiếu - Bác sĩ da liễu",
    "avatar": "/images/kol/bac-si-luong-trung-hieu.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@bacsi.hieu.official",
    "followers": "850K",
    "recentreview": "Giải thích mụn, nám, treatment và routine chăm sóc da dưới góc nhìn bác sĩ",
    "trustscore": 82,
    "categories": [
      "Treatment",
      "Skincare"
    ],
    "verified": true,
    "bio": "Dr Hiếu (bác sĩ Lương Trung Hiếu) là bác sĩ da liễu làm nội dung giáo dục về mụn, nám, treatment và chăm sóc da đúng cách trên TikTok, YouTube và website riêng. Hồ sơ này thay thế account shop perfume sau audit để ưu tiên người thật có chuyên môn.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@bacsi.hieu.official",
        "followers": "850K",
        "url": "https://www.tiktok.com/@bacsi.hieu.official"
      },
      {
        "platform": "Youtube",
        "handle": "Dr Hiếu",
        "followers": "800K",
        "url": "https://www.youtube.com/channel/UCPiIYO3KUwS5Ocnry7WqEiw"
      }
    ],
    "realName": "Lương Trung Hiếu",
    "basedIn": "Hà Nội",
    "specialties": [
      "Da liễu",
      "Điều trị mụn",
      "Nám và sắc tố",
      "Treatment an toàn"
    ],
    "knownFor": [
      "Bác sĩ da liễu, founder hệ sinh thái nội dung Dr Hiếu",
      "Tư vấn routine da mụn, treatment và chăm sóc da khoa học",
      "Có website chuyên môn bacsihieu.vn và kênh video riêng"
    ],
    "contentStyle": "Giải thích kiến thức da liễu theo dạng video ngắn, dễ hiểu, có cảnh báo khi cần khám bác sĩ."
  },
  {
    "id": "72",
    "name": "Đào Bá Lộc",
    "avatar": "/images/kol/dao-ba-loc-youtube.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@daobaloc.official",
    "followers": "180K",
    "recentreview": "Routine dưỡng da và review son môi",
    "trustscore": 75,
    "categories": [
      "Skincare",
      "Makeup"
    ],
    "verified": true,
    "bio": "Đào Bá Lộc là nam ca sĩ kiêm beauty blogger, hoạt động trên YouTube với nội dung làm đẹp. Anh thường chia sẻ mẹo skincare, hướng dẫn trang điểm và review mỹ phẩm, được biết đến với sự cởi mở và phong cách gần gũi khi nói về làm đẹp dành cho cả nam và nữ.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@daobaloc.official",
        "followers": "180K"
      },
      {
        "platform": "Youtube",
        "handle": "@LunaDaoOfficial",
        "followers": "150K"
      }
    ],
    "activeSince": "2018",
    "specialties": [
      "Beauty blogger",
      "Trang điểm",
      "Chăm sóc da"
    ],
    "knownFor": [
      "Ca sĩ bước ra từ The Voice 2012, sau chuyển hướng làm beauty blogger",
      "Đổi nghệ danh thành Luna Đào",
      "Chia sẻ kỹ thuật makeup và mẹo làm đẹp"
    ],
    "contentStyle": "Chia sẻ kinh nghiệm làm đẹp và trang điểm theo trải nghiệm cá nhân."
  },
  {
    "id": "73",
    "name": "Thuý Hiền Makeup",
    "avatar": "/images/kol/thuy-hien-makeup.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@thuyhienmakeup",
    "followers": "180K",
    "recentreview": "Hướng dẫn makeup mắt smokey",
    "trustscore": 68,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": false,
    "bio": "Thuý Hiền Makeup là một chuyên gia trang điểm (MUA) hoạt động trên mạng xã hội, chia sẻ các nội dung về makeup, hướng dẫn trang điểm và dịch vụ làm đẹp. Phong cách tập trung vào kỹ thuật trang điểm thực tế và gợi ý sản phẩm.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@thuyhienmakeup",
        "followers": "180K"
      }
    ],
    "specialties": [
      "Trang điểm",
      "Makeup smokey / glowy"
    ],
    "knownFor": [
      "MUA trẻ, học và tốt nghiệp khóa makeup chuyên nghiệp tại Hiwon Makeup",
      "Chia sẻ tutorial trang điểm trên TikTok"
    ],
    "contentStyle": "Đăng tutorial và hình ảnh các layout trang điểm như smokey eye, nền glowy."
  },
  {
    "id": "74",
    "name": "Bác sĩ Khổng Hạnh Nguyên",
    "avatar": "/images/kol/bac-si-khong-hanh-nguyen.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@drkhonghanhnguyen",
    "followers": "179K",
    "recentreview": "Tư vấn da liễu, gợi ý sản phẩm chăm da đúng cách",
    "trustscore": 68,
    "categories": [
      "Treatment",
      "Skincare"
    ],
    "verified": false,
    "bio": "Bác sĩ da liễu hoạt động trên TikTok với nội dung tư vấn chăm sóc da và gợi ý sản phẩm dưỡng da đúng cách, đáng tiền. Được nhắc đến trong các danh sách bác sĩ da liễu uy tín nên theo dõi. Phong cách chia sẻ kiến thức chuyên môn gần gũi.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@drkhonghanhnguyen",
        "followers": "179K"
      }
    ],
    "realName": "Khổng Hạnh Nguyên",
    "basedIn": "Hà Nội",
    "specialties": [
      "Phẫu thuật Tạo hình Thẩm mỹ",
      "Tiêm filler / botox",
      "Thẩm mỹ tái tạo"
    ],
    "knownFor": [
      "Bác sĩ nội trú, BSCKI chuyên ngành Phẫu thuật Tạo hình Thẩm mỹ Tái tạo (Học viện Quân Y)",
      "Nghiên cứu sinh Tiến sĩ chuyên ngành này",
      "Chia sẻ kiến thức thẩm mỹ và xử lý ca thẩm mỹ hỏng"
    ],
    "contentStyle": "Chia sẻ kiến thức thẩm mỹ - tạo hình dưới góc nhìn bác sĩ, kèm phân tích ca thực tế."
  },
  {
    "id": "75",
    "name": "Linh Trương",
    "avatar": "/images/kol/linh-truong.jpg",
    "cover": "",
    "platform": "Youtube",
    "handle": "@LinhTruong",
    "followers": "170K",
    "recentreview": "Swatch và đánh giá son thỏi high-end",
    "trustscore": 70,
    "categories": [
      "Makeup",
      "High-end Makeup"
    ],
    "verified": false,
    "bio": "Linh Trương (Trương Diệu Linh) là beauty blogger Hà Nội, chủ kênh The Make.A.Holic trên YouTube, từng được ví như 'Michelle Phan của Việt Nam'. Cô nổi bật với các video hướng dẫn trang điểm và review mỹ phẩm được đầu tư chỉn chu về hình ảnh. Phong cách của cô thiên về makeup tutorial chuyên nghiệp cùng những bài review chi tiết, nhiều hình ảnh.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@LinhTruong",
        "followers": "170K"
      }
    ],
    "basedIn": "TP.HCM",
    "activeSince": "2013",
    "specialties": [
      "Review mỹ phẩm",
      "Làm đẹp",
      "Lifestyle & du lịch"
    ],
    "knownFor": [
      "Beauty blogger đời đầu của Việt Nam, kênh 'TheMakeaholics'",
      "Nữ beauty blogger Việt đầu tiên nhận Nút Vàng YouTube (2019)",
      "Từng hợp tác với NYX và L'Oréal Paris"
    ],
    "contentStyle": "Làm video làm đẹp chỉn chu, truyền tải kiến thức mỹ phẩm chi tiết với phong cách gần gũi.",
    "ownBrand": "Kênh TheMakeaholics"
  },
  {
    "id": "76",
    "name": "Phương Ly (Pretty Much Channel)",
    "avatar": "/images/kol/phuong-ly.jpg",
    "cover": "",
    "platform": "Youtube",
    "handle": "@PrettyMuchChannel",
    "followers": "169K",
    "recentreview": "Review skincare cho da dầu mụn và mỹ phẩm bình dân tới cao cấp",
    "trustscore": 70,
    "categories": [
      "Skincare",
      "Makeup"
    ],
    "verified": false,
    "bio": "Phương Ly là một trong những beauty blogger thế hệ đầu của Việt Nam, sáng lập kênh Pretty Much Channel trên YouTube từ năm 2013. Cô được yêu thích nhờ kiến thức về mỹ phẩm và nội dung review đa dạng từ sản phẩm bình dân đến cao cấp, sau này mở rộng sang chủ đề gia đình và làm mẹ. Phong cách của cô thiên về review tận tâm, chi tiết và đáng tin cậy.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@PrettyMuchChannel",
        "followers": "169K",
        "url": "https://www.youtube.com/user/PrettyMuchChannel"
      }
    ],
    "realName": "Lê Phương Ly",
    "activeSince": "2013",
    "specialties": [
      "Review mỹ phẩm",
      "Skincare cho da mụn / da dầu",
      "Hướng dẫn trang điểm"
    ],
    "knownFor": [
      "Beauty blogger sáng lập kênh Pretty.Much (2013)",
      "Review khách quan, chi tiết sản phẩm bình dân lẫn cao cấp",
      "Hợp tác với các thương hiệu như Clé de Peau, Shu Uemura, Lancôme"
    ],
    "contentStyle": "Review mỹ phẩm khách quan và chi tiết, hợp người gặp vấn đề da mụn, da dầu.",
    "ownBrand": "Pretty.Much Channel"
  },
  {
    "id": "77",
    "name": "Hồng Beauty",
    "avatar": "/images/kol/hong-beauty.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@hongbeauty",
    "followers": "164K",
    "recentreview": "Hướng dẫn chăm sóc tóc và routine skincare cơ bản",
    "trustscore": 68,
    "categories": [
      "Haircare",
      "Skincare",
      "Makeup"
    ],
    "verified": false,
    "bio": "Hồng Beauty là một kênh/trang về làm đẹp tại Việt Nam, chuyên giới thiệu và review các sản phẩm makeup, skincare cùng mẹo làm đẹp. Nội dung hướng tới người tiêu dùng phổ thông với phong cách gần gũi.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@hongbeauty",
        "followers": "164K"
      }
    ],
    "specialties": [
      "Làm đẹp",
      "Review mỹ phẩm"
    ],
    "knownFor": [
      "KOC làm đẹp hoạt động trên TikTok"
    ]
  },
  {
    "id": "78",
    "name": "Bác sĩ Hoàng Văn Tâm",
    "avatar": "/images/kol/bac-si-hoang-van-tam-bookingcare.png",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@bacsitamdalieu",
    "followers": "161K",
    "recentreview": "Tư vấn vitamin, chăm sóc da bong tróc",
    "trustscore": 71,
    "categories": [
      "Treatment",
      "Skincare"
    ],
    "verified": false,
    "bio": "Bác sĩ da liễu chia sẻ kiến thức về chăm sóc da và các vấn đề thường gặp như bong tróc, thiếu vitamin. Nội dung mang tính giáo dục, hướng tới chăm da đúng cách. Được nhắc đến trong các toplist bác sĩ da liễu đáng follow.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@bacsitamdalieu",
        "followers": "161K"
      },
      {
        "platform": "Facebook",
        "handle": "@bacsitamdalieu",
        "followers": "82K"
      }
    ],
    "realName": "Hoàng Văn Tâm",
    "basedIn": "Hà Nội",
    "specialties": [
      "Da liễu",
      "Điều trị nám & rối loạn sắc tố",
      "Điều trị bạch biến",
      "Điều trị mụn & lão hóa da"
    ],
    "knownFor": [
      "Thạc sĩ, Bác sĩ nội trú; Phó trưởng khoa Điều trị nội trú ban ngày, Bệnh viện Da liễu Trung ương",
      "Phó Chủ tịch Hội Bác sĩ Da liễu trẻ Việt Nam",
      "Giảng viên Đại học Y Hà Nội"
    ],
    "contentStyle": "Tư vấn da liễu chuẩn y khoa, tập trung các bệnh lý về sắc tố và da."
  },
  {
    "id": "79",
    "name": "Bác sĩ Nam Võ",
    "avatar": "/images/kol/bac-si-nam-vo.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@drnamvo.dalieu",
    "followers": "140K",
    "recentreview": "Routine chăm da mụn viêm và tư vấn trị mụn",
    "trustscore": 68,
    "categories": [
      "Treatment",
      "Skincare"
    ],
    "verified": false,
    "bio": "Bác sĩ Nam Võ là một bác sĩ làm nội dung về chăm sóc da và làm đẹp trên mạng xã hội tại Việt Nam, chia sẻ kiến thức da liễu và tư vấn skincare dưới góc nhìn chuyên môn. Nội dung hướng tới việc giúp người xem chăm da đúng cách và chọn sản phẩm phù hợp.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@drnamvo.dalieu",
        "followers": "140K"
      }
    ],
    "realName": "Võ Công Nam",
    "specialties": [
      "Da liễu",
      "Điều trị mụn & thâm mụn",
      "Tư vấn routine da dầu mụn"
    ],
    "knownFor": [
      "Bác sĩ da liễu tư vấn và điều trị da trên TikTok",
      "Đăng feedback ca điều trị mụn, thâm thực tế của bệnh nhân"
    ],
    "contentStyle": "Tư vấn chăm sóc da và điều trị mụn dưới góc nhìn bác sĩ, kèm case thực tế và gợi ý sản phẩm theo tình trạng da."
  },
  {
    "id": "80",
    "name": "Chung Thành",
    "avatar": "/images/kol/chung-thanh-avatar.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@chungthanh_",
    "followers": "138K",
    "recentreview": "So sánh các dòng nước hoa cùng tầm giá",
    "trustscore": 68,
    "categories": [
      "Perfume"
    ],
    "verified": false,
    "bio": "Chung Thành là reviewer nước hoa chuyên so sánh các dòng nước hoa lâu đời ở cùng phân khúc và mức giá, giúp người mua chọn được mùi hương phù hợp với cá tính. Nội dung mang tính thực dụng cho người mới chơi hương, hoạt động chính trên TikTok.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@chungthanh_",
        "followers": "138K"
      }
    ]
  },
  {
    "id": "81",
    "name": "Bích Uyên",
    "avatar": "/images/kol/bich-uyen.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@bubutranxoxo",
    "followers": "131K",
    "recentreview": "Makeup neutral tông tự nhiên, review nền và son bình dân",
    "trustscore": 71,
    "categories": [
      "Makeup",
      "Skincare"
    ],
    "verified": false,
    "bio": "Beauty creator theo đuổi phong cách 'neutral' tự nhiên với má hồng đặc trưng và các bước makeup đơn giản dễ tái hiện. Hay review sản phẩm bình dân như Mistine, Apieu, Maybelline cùng mẹo skincare. Hiện diện trên TikTok, Instagram và Lemon8.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@bubutranxoxo",
        "followers": "131K"
      },
      {
        "platform": "Instagram",
        "handle": "@bich_uyen",
        "followers": "24K"
      }
    ],
    "specialties": [
      "Makeup theo phong cách Douyin / Trung Quốc",
      "Trang điểm trong veo, má hồng tự nhiên",
      "Review mỹ phẩm trang điểm",
      "Tips makeup cho người mới"
    ],
    "knownFor": [
      "Gắn liền với phong cách trang điểm Douyin biến hóa, kỹ thuật gọn gàng",
      "Hình ảnh trong trẻo, má hồng đặc trưng và vẻ đẹp tự nhiên có chủ đích",
      "Hoạt động trên cả TikTok, Instagram và Lemon8"
    ],
    "contentStyle": "Hướng dẫn trang điểm chuẩn phong cách Douyin với các bước đơn giản, dễ làm theo, xen kẽ review sản phẩm."
  },
  {
    "id": "82",
    "name": "Thời Toki",
    "avatar": "/images/kol/thoi-toki-avatar.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@thoitoki_perfume",
    "followers": "129K",
    "recentreview": "Kiến thức nước hoa, chọn hương theo cá tính và trend",
    "trustscore": 68,
    "categories": [
      "Perfume"
    ],
    "verified": false,
    "bio": "Kênh review nước hoa đầu tư nội dung về kiến thức hương, dẫn dắt người xem chọn mùi phù hợp với cá tính và xu hướng hiện tại. Phong cách bài bản, dễ tiếp cận. Một trong những tiktoker nước hoa hàng đầu.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@thoitoki_perfume",
        "followers": "129K"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Review nước hoa",
      "Tư vấn chọn hương theo phong cách cá nhân",
      "So sánh hương cùng tầm giá"
    ],
    "knownFor": [
      "Một trong những TikToker review nước hoa hàng đầu Việt Nam",
      "Nội dung đầu tư về cả hình ảnh lẫn kiến thức hương",
      "Định hướng giúp người mới chọn hương hợp cá tính và mục đích sử dụng"
    ],
    "contentStyle": "Dẫn dắt người mới qua 'bản đồ mùi hương', nhấn mạnh việc thể hiện phong cách cá nhân qua nước hoa.",
    "transparencyNote": "Có kết hợp tư vấn bán nước hoa chiết và fullbox chính hãng bên cạnh nội dung review."
  },
  {
    "id": "83",
    "name": "Bác sĩ Minh Điềm",
    "avatar": "/images/kol/bac-si-minh-diem-avatar.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@drdiemdalieu.medici",
    "followers": "183K",
    "recentreview": "Tư vấn da liễu thẩm mỹ, mụn và phục hồi da",
    "trustscore": 72,
    "categories": [
      "Treatment",
      "Skincare"
    ],
    "verified": true,
    "bio": "Bác sĩ Minh Điềm là bác sĩ da liễu thẩm mỹ hoạt động trên TikTok với nội dung tư vấn chăm sóc da, mụn và treatment. Hồ sơ này được bổ sung sau audit để thay cho account perfume-shop.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@drdiemdalieu.medici",
        "followers": "183K",
        "url": "https://www.tiktok.com/@drdiemdalieu.medici"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Da liễu thẩm mỹ",
      "Điều trị mụn",
      "Phục hồi da",
      "Tư vấn treatment"
    ],
    "knownFor": [
      "Được The Influencer nhắc trong danh sách bác sĩ da liễu nên follow",
      "Tài khoản TikTok @drdiemdalieu.medici có hơn 180K follower trong snapshot nguồn",
      "Nội dung xoay quanh điều trị da và chăm sóc da sau treatment"
    ],
    "contentStyle": "Giải thích ngắn gọn các tình trạng da và hướng xử lý dưới góc nhìn bác sĩ."
  },
  {
    "id": "84",
    "name": "Bác sĩ Hằng Trần",
    "avatar": "/images/kol/bac-si-hang-tran-avatar.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@bshangtrandalieu.medici",
    "followers": "174K",
    "recentreview": "Tư vấn mụn, da dầu và lựa chọn treatment an toàn",
    "trustscore": 72,
    "categories": [
      "Treatment",
      "Skincare"
    ],
    "verified": true,
    "bio": "Bác sĩ Hằng Trần là bác sĩ chuyên khoa da liễu và thẩm mỹ, làm nội dung TikTok về mụn, treatment và lựa chọn sản phẩm chăm sóc da. Hồ sơ này thay thế account cửa hàng nước hoa để registry tập trung vào người thật.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@bshangtrandalieu.medici",
        "followers": "174K",
        "url": "https://www.tiktok.com/@bshangtrandalieu.medici"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Da liễu",
      "Mụn và da dầu",
      "Thẩm mỹ da",
      "Treatment an toàn"
    ],
    "knownFor": [
      "Được The Influencer nhắc trong danh sách bác sĩ da liễu nên follow",
      "Tài khoản TikTok @bshangtrandalieu.medici có hơn 170K follower trong snapshot nguồn",
      "Nội dung hỏi đáp da liễu và review sản phẩm theo vấn đề da"
    ],
    "contentStyle": "Tư vấn theo tình huống da cụ thể, ưu tiên kiến thức bác sĩ thay vì trend mua sắm."
  },
  {
    "id": "85",
    "name": "Hạnh Mai (Mailovesbeauty)",
    "avatar": "/images/kol/mailovesbeauty.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@mailovesbeauty",
    "followers": "100K",
    "recentreview": "Review skincare, makeup và trải nghiệm làm đẹp lâu năm",
    "trustscore": 74,
    "categories": [
      "Skincare",
      "Makeup",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Hạnh Mai, được biết đến qua Mailovesbeauty, là beauty blogger Việt Nam làm nội dung review mỹ phẩm, skincare và lifestyle. Cô được nhiều báo nhắc tới như một beauty blogger có hành trình cá nhân rõ ràng, phù hợp để thay cho account shop trong registry.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@mailovesbeauty",
        "followers": "100K",
        "url": "https://www.instagram.com/mailovesbeauty"
      },
      {
        "platform": "Youtube",
        "handle": "@Mailovesbeauty",
        "followers": "80K",
        "url": "https://www.youtube.com/@Mailovesbeauty"
      },
      {
        "platform": "Facebook",
        "handle": "@mailovesbeauty",
        "followers": "100K",
        "url": "https://www.facebook.com/mailovesbeauty"
      }
    ],
    "realName": "Mai Hạnh",
    "basedIn": "Hà Nội",
    "activeSince": "2010s",
    "specialties": [
      "Review mỹ phẩm",
      "Skincare",
      "Makeup",
      "Lifestyle"
    ],
    "knownFor": [
      "Beauty blogger đời đầu với blog/kênh Mailovesbeauty",
      "Được báo chí nhắc tới trong các bài về beauty blogger Việt",
      "Nội dung thiên về trải nghiệm cá nhân và review sản phẩm"
    ],
    "contentStyle": "Chia sẻ trải nghiệm mỹ phẩm và đời sống cá nhân với giọng văn gần gũi."
  },
  {
    "id": "86",
    "name": "Phương thích makeup",
    "avatar": "/images/kol/phuong-thich-makeup.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@hinhthucphuong",
    "followers": "114K",
    "recentreview": "Hướng dẫn makeup, unbox mỹ phẩm",
    "trustscore": 71,
    "categories": [
      "Makeup"
    ],
    "verified": false,
    "bio": "Beauty TikToker chuyên nội dung hướng dẫn trang điểm và unbox mỹ phẩm với phong cách gần gũi. Có kênh phụ tập trung mở hộp sản phẩm mới. Hướng tới đối tượng người mới học makeup.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@hinhthucphuong",
        "followers": "114K"
      },
      {
        "platform": "Instagram",
        "handle": "@xingchufang",
        "followers": "30K"
      }
    ],
    "specialties": [
      "Review mỹ phẩm trang điểm",
      "Hướng dẫn makeup (pha trộn Douyin & Tây)",
      "Unbox sản phẩm làm đẹp"
    ],
    "knownFor": [
      "Phong cách makeup vừa 'douyin' vừa 'tây', dễ áp dụng",
      "Có kênh phụ 'Phương thích unbox' chuyên mở hộp sản phẩm",
      "Liên kết với hệ sinh thái nội dung Schannel"
    ],
    "contentStyle": "Kết hợp tutorial trang điểm với review và unbox sản phẩm theo lối gần gũi, đời thường."
  },
  {
    "id": "87",
    "name": "Tôm (Tomskincare)",
    "avatar": "/images/kol/tom.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@tomskincare",
    "followers": "113K",
    "recentreview": "Chấm điểm sản phẩm skincare và chia sẻ routine tối giản, ít bước nhưng hiệu quả",
    "trustscore": 68,
    "categories": [
      "Skincare",
      "Treatment"
    ],
    "verified": false,
    "bio": "Tôm là nam content creator skincare với triết lý tối giản và nhiều năm kinh nghiệm chăm sóc da. Kênh của anh tập trung review sản phẩm, chia sẻ tips trị mụn ẩn và xây routine ít bước nhưng hiệu quả. Anh cũng tổ chức các chương trình đào tạo cho KOL/KOC mới.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@tomskincare",
        "followers": "113K"
      }
    ],
    "specialties": [
      "Review skincare",
      "Phục hồi da & da nhạy cảm",
      "Tư vấn routine và thành phần",
      "Tips chọn sữa rửa mặt / dưỡng sáng"
    ],
    "knownFor": [
      "Nội dung tập trung vào phục hồi, làm dịu da và da nhạy cảm",
      "Hay làm các video 'sản phẩm không cần thiết' để giúp người xem tiết kiệm",
      "Chia sẻ tips skincare và sản phẩm repurchase nhiều lần"
    ],
    "contentStyle": "Review skincare thực tế, thiên về hướng dẫn xây routine an toàn và tiết kiệm cho người mới."
  },
  {
    "id": "88",
    "name": "Misoa Kim Anh",
    "avatar": "/images/kol/misoa-kim-anh.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@misoa.kimanh",
    "followers": "300K",
    "recentreview": "Beauty Must-Have, makeup và lifestyle",
    "trustscore": 75,
    "categories": [
      "Makeup",
      "Skincare",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Misoa Kim Anh là MC, beauty blogger và content creator Việt Nam. Cô từng xuất hiện trong series Beauty Must-Have của ELLE và được báo chí nhắc tới với vai trò beauty blogger, phù hợp thay cho account shop để user có người thật để follow.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@misoa.kimanh",
        "followers": "300K",
        "url": "https://www.instagram.com/misoa.kimanh"
      },
      {
        "platform": "Tiktok",
        "handle": "@misoa.kimanh",
        "followers": "200K",
        "url": "https://www.tiktok.com/@misoa.kimanh"
      },
      {
        "platform": "Facebook",
        "handle": "@MisoaKimAnh",
        "followers": "200K",
        "url": "https://www.facebook.com/MisoaKimAnh"
      }
    ],
    "realName": "Trần Thị Kim Anh",
    "basedIn": "TP.HCM",
    "specialties": [
      "Beauty blogger",
      "Makeup",
      "Lifestyle",
      "MC/KOL"
    ],
    "knownFor": [
      "Được ELLE giới thiệu trong series Beauty Must-Have",
      "Hoạt động với vai trò MC, beauty blogger và influencer",
      "Nội dung làm đẹp gắn với makeup, skincare và phong cách sống"
    ],
    "contentStyle": "Nội dung hình ảnh chỉn chu, thiên về beauty lifestyle và trải nghiệm sản phẩm cá nhân."
  },
  {
    "id": "89",
    "name": "Trần Kiều Loan",
    "avatar": "/images/kol/tran-kieu-loan.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@loan_rose0810",
    "followers": "168.7K",
    "recentreview": "Beauty, lifestyle và fashion",
    "trustscore": 72,
    "categories": [
      "Makeup",
      "Lifestyle",
      "Skincare"
    ],
    "verified": true,
    "bio": "Trần Kiều Loan là creator TikTok làm nội dung beauty, lifestyle và fashion. Profile live-check tháng 06/2026 ghi nhận 168.7K follower và 2.4M likes, có video grid công khai và hoạt động đều.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@loan_rose0810",
        "followers": "168.7K"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Beauty lifestyle",
      "Fashion",
      "Makeup everyday"
    ],
    "knownFor": [
      "Profile TikTok tự mô tả Beauty / Lifestyle / Fashion",
      "TikTok profile live-check 06/2026: 168.7K followers, 2.4M likes",
      "Phù hợp làm creator watchlist cho beauty-lifestyle"
    ],
    "contentStyle": "Nội dung lifestyle/fashion pha beauty, thiên về trải nghiệm cá nhân và hình ảnh đời sống."
  },
  {
    "id": "90",
    "name": "Ryan Perfume",
    "avatar": "/images/kol/ryan-perfume-youtube.jpg",
    "cover": "",
    "platform": "Youtube",
    "handle": "@ryanthoi",
    "followers": "90K",
    "recentreview": "Đánh giá nước hoa nam theo trải nghiệm",
    "trustscore": 70,
    "categories": [
      "Perfume"
    ],
    "verified": false,
    "bio": "Ryan Perfume là một reviewer nước hoa, hoạt động trên TikTok và YouTube. Anh tập trung chia sẻ cảm nhận về mùi hương và trải nghiệm sử dụng nhiều dòng nước hoa, đưa ra nhiều góc nhìn để người xem tham khảo khi lựa chọn, và cho biết không kinh doanh sản phẩm.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@ryanthoi",
        "followers": "90K"
      }
    ],
    "specialties": [
      "Review nước hoa chuyên sâu",
      "Nước hoa niche/designer cao cấp",
      "List nước hoa nam & nữ theo chủ đề",
      "Q&A kiến thức nước hoa"
    ],
    "knownFor": [
      "Kênh YouTube review nước hoa theo series đánh số",
      "Đánh giá nhiều nhà hương cao cấp như Roja, Xerjoff, Matiere Premiere, Guerlain",
      "Có cả nội dung hỏi đáp kiến thức về nước hoa"
    ],
    "contentStyle": "Review thẳng thắn dựa trên trải nghiệm cá nhân với các chai đã sở hữu/ngửi, sẵn sàng chê thẳng những hương không thích.",
    "reviewHighlights": [
      {
        "product": "Roja Manhattan",
        "verdict": "Được khen là một trong những mùi Roja hay nhất từng ngửi.",
        "sentiment": "positive"
      },
      {
        "product": "Roja Elysium",
        "verdict": "Đánh giá mùi rất tệ dù nhiều người yêu thích.",
        "sentiment": "negative"
      }
    ]
  },
  {
    "id": "91",
    "name": "Quân Nguyễn",
    "avatar": "/images/kol/quan-nguyen.jpg",
    "cover": "",
    "platform": "Facebook",
    "handle": "@quan.nguyenmakeup",
    "followers": "90K",
    "recentreview": "Trang điểm hoa hậu và nghệ sĩ với kỹ thuật contour",
    "trustscore": 68,
    "categories": [
      "High-end Makeup",
      "Makeup"
    ],
    "verified": false,
    "bio": "Quân Nguyễn (Nguyễn Minh Quân) là chuyên gia trang điểm (MUA) hàng đầu Việt Nam, nổi tiếng trong bộ đôi 'phù thủy makeup' Quân Nguyễn - Pu Lê. Anh từng trang điểm cho nhiều nghệ sĩ, hoa hậu trong các đấu trường nhan sắc quốc tế và được vinh danh ở nhiều giải thưởng làm đẹp. Phong cách của anh hướng tới vẻ đẹp tinh tế, chuẩn mực và tôn nét tự nhiên.",
    "socials": [
      {
        "platform": "Facebook",
        "handle": "@quan.nguyenmakeup",
        "followers": "90K"
      }
    ],
    "realName": "Nguyễn Minh Quân",
    "basedIn": "Việt Nam",
    "specialties": [
      "Trang điểm chuyên nghiệp (celebrity makeup)",
      "Đào tạo makeup & hairstyle",
      "Makeup cho hoa hậu/sao Việt"
    ],
    "knownFor": [
      "Makeup artist gắn với nhiều hoa hậu và sao Việt (Khánh Vân, Lương Thùy Linh, Hương Giang…)",
      "Đồng sáng lập Học viện Quân Nguyễn - Pu Lê đào tạo makeup & hairstyle"
    ],
    "contentStyle": "Chia sẻ các concept trang điểm chuyên nghiệp, hậu trường làm đẹp cho sao và đào tạo nghề.",
    "ownBrand": "Học viện Quân Nguyễn - Pu Lê"
  },
  {
    "id": "92",
    "name": "Motrang hít hà",
    "avatar": "/images/kol/motrang-hit-ha-avatar.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@motrang_",
    "followers": "90K",
    "recentreview": "Review nước hoa kèm dung tích và nồng độ tinh dầu",
    "trustscore": 68,
    "categories": [
      "Perfume"
    ],
    "verified": false,
    "bio": "Reviewer nước hoa có điểm khác biệt là luôn nêu rõ dung tích và nồng độ tinh dầu của từng chai, giúp người xem chọn được sản phẩm với độ tỏa hương phù hợp. Nội dung thực tế, hữu ích cho người mua.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@motrang_",
        "followers": "90K"
      }
    ],
    "specialties": [
      "Review nước hoa",
      "Gợi ý hương theo mùa & dịp",
      "Tư vấn dung tích chai và nồng độ tinh dầu"
    ],
    "knownFor": [
      "Một trong những TikToker review nước hoa hàng đầu Việt Nam",
      "Điểm khác biệt: luôn nêu dung tích chai và nồng độ tinh dầu để người xem chọn độ tỏa hương phù hợp",
      "Tư vấn hương theo thời tiết, mục đích (đi làm, đi học…)"
    ],
    "contentStyle": "Review nước hoa thực dụng, chi tiết về nồng độ và dịp dùng, giúp người xem chọn chai hợp nhu cầu."
  },
  {
    "id": "93",
    "name": "Pang Mỹ Nguyên",
    "avatar": "/images/kol/pang-my-nguyen.jpg",
    "cover": "",
    "platform": "Instagram",
    "handle": "@pangmynguyen",
    "followers": "90K",
    "recentreview": "Nail fantasy, móng nghệ thuật cho sao Việt",
    "trustscore": 68,
    "categories": [
      "Nail"
    ],
    "verified": false,
    "bio": "Nail artist gạo cội với gần hai thập kỷ trong ngành, chuyên móng giả phong cách fantasy. Là địa chỉ quen thuộc của nhiều sao Việt và là thành viên Hiệp hội Naillympic châu Á, giám đốc một học viện đào tạo nail. Phong cách nghệ thuật, cầu kỳ.",
    "socials": [
      {
        "platform": "Instagram",
        "handle": "@pangmynguyen",
        "followers": "90K"
      }
    ],
    "basedIn": "Việt Nam và Mỹ",
    "specialties": [
      "Nail art",
      "Đào tạo nail chuyên nghiệp"
    ],
    "knownFor": [
      "CEO kiêm Art Director của Kelly Pang Nail Academy",
      "Hơn 20 năm kinh nghiệm giảng dạy nail tại Việt Nam và Mỹ",
      "Phục vụ nhiều sao Việt; thành viên Asian Naillympic Association"
    ],
    "contentStyle": "Nội dung thiên về nghệ thuật và đào tạo nail hơn là review mỹ phẩm trang điểm.",
    "ownBrand": "Kelly Pang Nail Academy"
  },
  {
    "id": "94",
    "name": "Huỳnh Thi Makeup",
    "avatar": "/images/kol/huynh-thi-makeup.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@makeuphuynhthi",
    "followers": "80K",
    "recentreview": "Trang điểm cô dâu và makeup dự tiệc",
    "trustscore": 68,
    "categories": [
      "Makeup"
    ],
    "verified": false,
    "bio": "Huỳnh Thi Makeup là một chuyên gia trang điểm (MUA) hoạt động trên TikTok và mạng xã hội tại Việt Nam, sở hữu academy đào tạo makeup. Nội dung của cô tập trung vào hướng dẫn trang điểm, dịch vụ làm đẹp và chia sẻ kỹ thuật. Phong cách thiên về makeup thực tế, ứng dụng cho khách hàng và học viên.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@makeuphuynhthi",
        "followers": "80K"
      }
    ],
    "specialties": [
      "Trang điểm chuyên nghiệp",
      "Đào tạo makeup (khóa Private Advanced)"
    ],
    "knownFor": [
      "Makeup artist hoạt động trên TikTok và Instagram",
      "Có mở các khóa đào tạo trang điểm nâng cao"
    ],
    "contentStyle": "Nội dung trang điểm chuyên nghiệp và đào tạo makeup."
  },
  {
    "id": "95",
    "name": "Lương Lee",
    "avatar": "/images/kol/luong-lee.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@luonglee1404",
    "followers": "86.5K",
    "recentreview": "Skincare, treatment và routine chăm da",
    "trustscore": 72,
    "categories": [
      "Skincare",
      "Treatment"
    ],
    "verified": true,
    "bio": "Lương Lee là skincare creator có định vị rõ về treatment và routine chăm da. Profile TikTok live-check tháng 06/2026 ghi bio “12 năm skincare, dùng treatment 8 năm” và có 86.5K follower.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@luonglee1404",
        "followers": "86.5K"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Skincare routine",
      "Treatment",
      "Chống nắng và phục hồi da"
    ],
    "knownFor": [
      "Profile bio công khai: 12 năm skincare, dùng treatment 8 năm",
      "TikTok profile live-check 06/2026: 86.5K followers, 849.8K likes",
      "Hợp để bổ sung niche skincare chuyên sâu thay cho shop mỹ phẩm"
    ],
    "contentStyle": "Chia sẻ routine, kinh nghiệm treatment và skincare thực dụng, ít thiên về entertainment hơn nhóm beauty-lifestyle."
  },
  {
    "id": "96",
    "name": "Kiên Fragrance",
    "avatar": "/images/kol/kien-fragrance-avatar.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@kienfragranceca",
    "followers": "66K",
    "recentreview": "Review nước hoa cho người mê sự độc đáo",
    "trustscore": 68,
    "categories": [
      "Perfume"
    ],
    "verified": false,
    "bio": "Reviewer nước hoa nổi bật trên TikTok, mang ý tưởng mới mẻ cho cộng đồng yêu hương ưa chuộng sự độc đáo. Nội dung tập trung khám phá mùi hương đặc biệt. Một gương mặt được nhắc trong toplist tiktoker nước hoa hàng đầu.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@kienfragranceca",
        "followers": "66K"
      }
    ],
    "specialties": [
      "Review nước hoa",
      "Đánh giá hương kèm câu chuyện thương hiệu",
      "Nước hoa designer & unisex"
    ],
    "knownFor": [
      "TikToker review nước hoa, có cả kênh YouTube song song",
      "Chia sẻ đánh giá hương kèm lịch sử/câu chuyện thương hiệu"
    ],
    "contentStyle": "Review nước hoa theo từng chai, lồng ghép kiến thức và câu chuyện về nhà hương."
  },
  {
    "id": "97",
    "name": "Óng Ánh",
    "avatar": "/images/kol/ong-anh.jpg",
    "cover": "",
    "platform": "Facebook",
    "handle": "@onganh.beauty.blog",
    "followers": "79K",
    "recentreview": "Chia sẻ skincare, makeup và trải nghiệm làm đẹp với góc nhìn beauty editor",
    "trustscore": 68,
    "categories": [
      "Skincare",
      "Makeup",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Óng Ánh là beauty blogger/editor được các nguồn báo và ELLE nhắc tới trong mảng làm đẹp tại Việt Nam. Hồ sơ này thay thế account perfume-shop sau audit để giữ registry tập trung vào cá nhân có tiếng nói riêng.",
    "socials": [
      {
        "platform": "Facebook",
        "handle": "@onganh.beauty.blog",
        "followers": "79K",
        "url": "https://www.facebook.com/onganh.beauty.blog"
      }
    ],
    "specialties": [
      "Beauty editor",
      "Review mỹ phẩm",
      "Skincare",
      "Makeup"
    ],
    "knownFor": [
      "Beauty blogger/editor từng được nhắc trong các bài về cộng đồng làm đẹp Việt",
      "Facebook page Beauty Blogger Óng Ánh có tín hiệu người thật và nội dung làm đẹp",
      "Phù hợp vai trò nguồn tham khảo beauty hơn các shop perfume"
    ],
    "contentStyle": "Viết và chia sẻ trải nghiệm làm đẹp theo hướng beauty editor, có bối cảnh sử dụng sản phẩm."
  },
  {
    "id": "98",
    "name": "Nga nèe",
    "avatar": "/images/kol/nga-nee.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@thuyngareview",
    "followers": "111.9K",
    "recentreview": "Chống nắng, skincare và review sản phẩm dùng hằng ngày",
    "trustscore": 72,
    "categories": [
      "Skincare",
      "Treatment",
      "Lifestyle"
    ],
    "verified": true,
    "bio": "Nga nèe là skincare/lifestyle creator với nội dung review sản phẩm, chống nắng và thói quen chăm sóc cá nhân. Profile live-check tháng 06/2026 ghi nhận 111.9K follower, 4.6M likes và video grid công khai.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@thuyngareview",
        "followers": "111.9K"
      }
    ],
    "basedIn": "Việt Nam",
    "specialties": [
      "Skincare thực dụng",
      "Chống nắng",
      "Review sản phẩm hằng ngày"
    ],
    "knownFor": [
      "TikTok profile live-check 06/2026: 111.9K followers, 4.6M likes",
      "Nội dung có nhiều tín hiệu skincare/chống nắng",
      "Phù hợp làm creator theo dõi cho nhóm review thực dụng"
    ],
    "contentStyle": "Video review ngắn, nói thẳng về thói quen chăm sóc cá nhân, chống nắng và các sản phẩm đời thường."
  },
  {
    "id": "99",
    "name": "Jena",
    "avatar": "/images/kol/jena-avatar.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@nuochoa.jena",
    "followers": "47K",
    "recentreview": "Unbox sample nước hoa mới, cách dùng hương thanh lịch",
    "trustscore": 60,
    "categories": [
      "Perfume"
    ],
    "verified": false,
    "bio": "Reviewer nước hoa với các video unbox sample mới nhất trên thị trường và hướng dẫn dùng hương sao cho thanh lịch. Kênh thu hút lượng view tốt nhờ nội dung gần gũi. Một gương mặt nữ trong cộng đồng review nước hoa Việt.",
    "socials": [
      {
        "platform": "Tiktok",
        "handle": "@nuochoa.jena",
        "followers": "47K"
      }
    ],
    "specialties": [
      "Review nước hoa",
      "Unbox mẫu nước hoa mới/trending",
      "Hướng dẫn dùng hương tinh tế"
    ],
    "knownFor": [
      "Kênh TikTok review nước hoa với các video unbox mẫu mới trên thị trường",
      "Tập trung vào các bộ sưu tập hương đương đại, đang trend"
    ],
    "contentStyle": "Unbox và review các mẫu nước hoa mới, gợi ý cách dùng hương tinh tế.",
    "reviewHighlights": [
      {
        "product": "Elizabeth Arden White Tea Eau Fraiche",
        "verdict": "Được gợi ý là lựa chọn 'chuẩn' cho mùa hè.",
        "sentiment": "positive"
      }
    ]
  },
  {
    "id": "100",
    "name": "Trân Mèeo",
    "avatar": "/images/kol/tran-meeo.jpg",
    "cover": "",
    "platform": "Youtube",
    "handle": "@tranmeocute",
    "followers": "40K",
    "recentreview": "Makeup trẻ trung và vlog làm đẹp",
    "trustscore": 62,
    "categories": [
      "Makeup",
      "Lifestyle"
    ],
    "verified": false,
    "bio": "Trân Mèeo là một KOC chia sẻ nội dung làm đẹp trên mạng xã hội, tập trung vào review mỹ phẩm và mẹo trang điểm, chăm sóc da. Nội dung của cô hướng đến trải nghiệm sản phẩm thực tế và gần gũi với người dùng trẻ.",
    "socials": [
      {
        "platform": "Youtube",
        "handle": "@tranmeocute",
        "followers": "40K"
      }
    ]
  },
  {
    "id": "101",
    "name": "Emlyy",
    "avatar": "/images/kol/emlyy.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@emlyreview",
    "followers": "563.4K",
    "recentreview": "Skincare, makeup test và rating sản phẩm",
    "trustscore": 82,
    "categories": ["Skincare", "Makeup", "Haircare"],
    "verified": true,
    "bio": "Emlyy là beauty creator tập trung vào review sản phẩm, skin prep, makeup test và chăm sóc tóc. Live audit 07/2026 ghi nhận 9/10 video gần nhất có tín hiệu beauty-product.",
    "socials": [{"platform": "Tiktok", "handle": "@emlyreview", "followers": "563.4K", "url": "https://www.tiktok.com/@emlyreview"}],
    "specialties": ["Review mỹ phẩm", "Makeup test", "Skincare routine"],
    "contentStyle": "Video ngắn có sản phẩm cụ thể, test cách dùng và nêu khả năng mua lại."
  },
  {
    "id": "102",
    "name": "Hà Giang",
    "avatar": "/images/kol/ha-giang-ciara.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@ciaramakeup2003",
    "followers": "1.3M",
    "recentreview": "Makeup tutorial, cushion và makeup look",
    "trustscore": 88,
    "categories": ["Makeup"],
    "verified": true,
    "bio": "Hà Giang là makeup creator có nội dung tutorial và sản phẩm xuất hiện dày. Live audit 07/2026 ghi nhận 10/10 video gần nhất thuộc makeup/beauty.",
    "socials": [{"platform": "Tiktok", "handle": "@ciaramakeup2003", "followers": "1.3M", "url": "https://www.tiktok.com/@ciaramakeup2003"}],
    "specialties": ["Makeup tutorial", "Makeup transformation", "Cushion và base makeup"],
    "contentStyle": "Tutorial và biến hình, thường cho thấy sản phẩm hoặc kỹ thuật makeup cụ thể."
  },
  {
    "id": "103",
    "name": "Hoàng Minh Ngọc",
    "avatar": "/images/kol/hoang-minh-ngoc.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@hoangminhngoc21",
    "followers": "1.1M",
    "recentreview": "Beauty education và kỹ thuật makeup",
    "trustscore": 86,
    "categories": ["Makeup", "Skincare"],
    "verified": true,
    "bio": "Hoàng Minh Ngọc là beauty creator được đề cử Beauty Creator of the Year tại TikTok Awards Việt Nam 2025. Kênh vẫn hoạt động trong live audit 07/2026.",
    "socials": [{"platform": "Tiktok", "handle": "@hoangminhngoc21", "followers": "1.1M", "url": "https://www.tiktok.com/@hoangminhngoc21"}],
    "specialties": ["Beauty education", "Makeup technique", "Makeup transformation"],
    "contentStyle": "Kết hợp beauty education, kỹ thuật thợ makeup và nội dung biến hình."
  },
  {
    "id": "104",
    "name": "Quỳnh Alee",
    "avatar": "/images/kol/quynh-alee.jpg",
    "cover": "",
    "platform": "Tiktok",
    "handle": "@quynhalee",
    "followers": "5M",
    "recentreview": "Haircare, skincare và beauty campaign",
    "trustscore": 92,
    "categories": ["Skincare", "Haircare", "Makeup", "Lifestyle"],
    "verified": true,
    "bio": "Quỳnh Alee là creator được đề cử Beauty Creator of the Year tại TikTok Awards Việt Nam 2025. Live audit 07/2026 ghi nhận kênh hoạt động, có haircare, skincare và beauty campaign trong 10 video gần nhất.",
    "socials": [{"platform": "Tiktok", "handle": "@quynhalee", "followers": "5M", "url": "https://www.tiktok.com/@quynhalee"}],
    "specialties": ["Haircare", "Skincare", "Beauty campaign"],
    "contentStyle": "Nội dung lifestyle quy mô lớn, xen kẽ haircare, skincare và campaign có sản phẩm."
  }
]
