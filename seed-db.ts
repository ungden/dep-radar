import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { REAL_KOLS } from './lib/kols-data';
import { SAMPLE_CREATOR_PRODUCT_EVENTS, SAMPLE_PRODUCT_OFFERS } from './lib/timeline-data';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const KOLS = REAL_KOLS.map((kol) => ({
  id: kol.id,
  name: kol.name,
  avatar: kol.avatar,
  cover: kol.cover,
  platform: kol.platform,
  handle: kol.handle,
  followers: kol.followers,
  trustscore: kol.trustscore,
  categories: kol.categories,
  recentreview: kol.recentreview,
  verified: kol.verified,
}));

const STALE_CREATOR_EVENT_IDS = ["evt-2026-04-02-bong-benh-batiste-dry-shampoo"];

const PRODUCTS = [
  { id: "1", name: "Tinh chất phục hồi da B5 GoodnDoc", brand: "GoodnDoc", image: "/images/product-b5-serum.png", rating: 4.8, reviews: 1240, sold: "8,500+", price: "350.000đ", category: "Skincare", tags: ["Phục hồi", "Cấp ẩm"], description: "Sản phẩm giúp phục hồi hàng rào bảo vệ da, cung cấp độ ẩm sâu và làm dịu làn da nhạy cảm. Phù hợp cho mọi loại da, đặc biệt là da đang treatment hoặc cần phục hồi sau mụn." },
  { id: "2", name: "Kem nền Maybelline Fit Me Matte + Poreless", brand: "Maybelline", image: "/images/product-foundation.png", rating: 4.5, reviews: 3500, sold: "15,000+", price: "180.000đ", category: "Makeup", tags: ["Kiềm dầu", "Drugstore"], description: "Kem nền kiềm dầu, che phủ lỗ chân lông hoàn hảo. Phù hợp cho da dầu và hỗn hợp thiên dầu, mang lại lớp nền mịn lì tự nhiên suốt cả ngày dài." },
  { id: "3", name: "Nước tẩy trang L'Oreal Micellar Water 3-in-1", brand: "L'Oreal", image: "/images/product-micellar.png", rating: 4.9, reviews: 5200, sold: "20,000+", price: "150.000đ", category: "Skincare", tags: ["Làm sạch sâu", "Cho da nhạy cảm"], description: "Nước tẩy trang 3 trong 1 giúp làm sạch sâu lớp trang điểm, bụi bẩn và bã nhờn mà không gây khô rát. Công nghệ Micellar dịu nhẹ, an toàn cho cả vùng mắt và môi." },
  { id: "4", name: "Son kem lì MAC Powder Kiss Liquid Lipcolour", brand: "MAC", image: "/images/product-lipstick.png", rating: 4.7, reviews: 890, sold: "3,200+", price: "650.000đ", category: "Makeup", tags: ["Lì", "Mềm môi"], description: "Son kem lì với kết cấu xốp mịn như nhung, không làm khô môi. Màu sắc lên chuẩn, lâu trôi và tạo hiệu ứng mờ lì thời thượng." },
  { id: "5", name: "Dầu gội khô Batiste Dry Shampoo", brand: "Batiste", image: "/images/product-dry-shampoo.png", rating: 4.6, reviews: 2100, sold: "10,000+", price: "120.000đ", category: "Haircare", tags: ["Làm sạch nhanh", "Tiện lợi"], description: "Giải pháp cứu nguy cho mái tóc bết dính chỉ trong 1 phút. Hút sạch dầu thừa, trả lại mái tóc bồng bềnh và lưu hương thơm mát." },
  { id: "6", name: "Sữa rửa mặt Cerave Hydrating Cleanser", brand: "Cerave", image: "/images/product-cleanser.png", rating: 4.8, reviews: 4100, sold: "12,000+", price: "380.000đ", category: "Skincare", tags: ["Dịu nhẹ", "Cấp ẩm"], description: "Sữa rửa mặt không tạo bọt, làm sạch nhẹ nhàng mà không làm tổn thương hàng rào bảo vệ da. Bổ sung Ceramides và Hyaluronic Acid giúp da luôn ẩm mượt." },
  { id: "7", name: "Nước hoa nữ Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", image: "/images/product-perfume.png", rating: 4.9, reviews: 650, sold: "1,500+", price: "2.500.000đ", category: "Perfume", tags: ["Quyến rũ", "Lưu hương lâu"], description: "Hương thơm quyến rũ, nữ tính với nốt hương xạ hương đặc trưng kết hợp cùng hoa hồng và đào. Lưu hương lâu, tỏa hương vừa phải, thích hợp cho những dịp đặc biệt." },
  { id: "8", name: "Sữa dưỡng thể Vaseline Gluta-Hya", brand: "Vaseline", image: "/images/product-body-lotion.png", rating: 4.5, reviews: 1800, sold: "6,000+", price: "140.000đ", category: "Bodycare", tags: ["Trắng da", "Thấm nhanh"], description: "Sữa dưỡng thể dạng serum mỏng nhẹ, thấm cực nhanh không gây bết dính. Chứa Gluta-Hya giúp dưỡng sáng da hiệu quả gấp 10 lần Vitamin C." },
];

const REVIEWS = [
  { id: "r1", kolid: "1", productid: "1", rating: 5, ispr: false, timeago: "2 giờ trước", content: "Phục hồi da siêu đỉnh, thấm nhanh không bết dính. Highly recommend cho da treatment!", likes: 342, comments: 45 },
  { id: "r2", kolid: "2", productid: "2", rating: 4, ispr: true, timeago: "5 giờ trước", content: "Độ che phủ ổn, kiềm dầu tốt nhưng xuống tone hơi nhanh. Phù hợp học sinh sinh viên.", likes: 128, comments: 12 },
  { id: "r3", kolid: "3", productid: "3", rating: 5, ispr: false, timeago: "1 ngày trước", content: "Sạch sâu, không rát mắt, giá thành rẻ. Chân ái tẩy trang drugstore của mình.", likes: 890, comments: 102 },
  { id: "r4", kolid: "4", productid: "4", rating: 4, ispr: true, timeago: "2 ngày trước", content: "Màu son lên chuẩn, chất son mềm mịn không làm khô môi. Tuy nhiên độ bám màu chỉ ở mức trung bình, ăn uống sẽ trôi khá nhiều.", likes: 456, comments: 38 },
];

const POSTS = [
  {
    id: "p1",
    title: "Top 5 Serum Phục Hồi Da Tốt Nhất 2026 — Dùng Thực Tế, Không PR",
    slug: "top-5-serum-phuc-hoi-da-2026",
    excerpt: "Tổng hợp 5 serum phục hồi da được cộng đồng skincare Việt yêu thích nhất, đánh giá sau ít nhất 4 tuần sử dụng thực tế.",
    content: `Năm 2026 chứng kiến sự bùng nổ của các dòng serum phục hồi da với công nghệ mới, từ Peptide thế hệ mới cho đến các hoạt chất sinh học tiên tiến. Mình đã thử nghiệm hơn 10 sản phẩm trong suốt 3 tháng để tìm ra top 5 đáng mua nhất.

Đầu tiên phải kể đến B5 GoodnDoc — sản phẩm "quốc dân" mà hầu như ai cũng biết. Thấm nhanh, không bết dính, phục hồi hàng rào bảo vệ da cực tốt. Đặc biệt phù hợp cho da đang treatment hoặc vừa peel.

Tiếp theo là dòng serum Ceramide của CeraVe. Với 3 loại Ceramide thiết yếu kết hợp Niacinamide, sản phẩm giúp da khỏe từ bên trong. Kết cấu lỏng nhẹ, không gây mụn, phù hợp cho mọi loại da.

Cuối cùng, đừng bỏ qua serum HA của Vichy Minéral 89. Công nghệ Hyaluronic Acid kết hợp khoáng núi lửa giúp cấp ẩm sâu 72 giờ. Nếu da bạn đang khô, bong tróc sau mùa đông thì đây là lựa chọn hoàn hảo.`,
    author_name: "Hà Linh Official",
    author_avatar: "/images/kol-halinh.png",
    category: "Review Sản Phẩm",
    tags: ["Serum", "Phục hồi da", "Review", "Top sản phẩm"],
    image: "/images/product-b5-serum.png",
    likes: 342,
    comments: 56,
    created_at: "2026-04-10T08:00:00Z",
  },
  {
    id: "p2",
    title: "Hướng Dẫn Chọn Kem Chống Nắng Cho Từng Loại Da — Sai Một Li, Đi Một Dặm",
    slug: "huong-dan-chon-kem-chong-nang",
    excerpt: "Kem chống nắng không phải cứ SPF cao là tốt. Bài viết giúp bạn hiểu rõ cách chọn đúng sản phẩm cho loại da của mình.",
    content: `Mỗi loại da cần một loại kem chống nắng khác nhau. Sai lầm phổ biến nhất là chọn kem chống nắng chỉ dựa vào chỉ số SPF mà bỏ qua kết cấu, thành phần và khả năng chống tia UVA.

Da dầu nên ưu tiên kem chống nắng dạng gel hoặc fluid, kiềm dầu tốt. La Roche-Posay Anthelios UV Mune 400 là lựa chọn hàng đầu với kết cấu lỏng nhẹ, không gây bóng nhờn. Skin Aqua UV Super Moisture Gel cũng là một lựa chọn drugstore tuyệt vời.

Da khô cần kem chống nắng có khả năng cấp ẩm. Eucerin Oil Control Dry Touch paradoxically lại phù hợp cho cả da khô vì lớp finish mềm mại. Hoặc bạn có thể thử dòng kem chống nắng dưỡng ẩm của Bioderma Photoderm.

Da nhạy cảm nên tránh chemical sunscreen và chuyển sang physical/mineral sunscreen chứa Zinc Oxide hoặc Titanium Dioxide. Avène Very High Protection Mineral Fluid là một trong những lựa chọn an toàn nhất trên thị trường.`,
    author_name: "Trinh Phạm",
    author_avatar: "/images/kol-trinh.png",
    category: "Chăm Sóc Da",
    tags: ["Chống nắng", "SPF", "Da dầu", "Da khô"],
    image: "/images/product-cleanser.png",
    likes: 518,
    comments: 73,
    created_at: "2026-04-08T10:30:00Z",
  },
  {
    id: "p3",
    title: "Drugstore Makeup Haul Dưới 500K — Đẹp Xỉu Mà Không Xỉu Ví",
    slug: "drugstore-makeup-haul-duoi-500k",
    excerpt: "Tổng hợp những sản phẩm makeup drugstore chất lượng cao với tổng giá trị chưa đến 500.000đ.",
    content: `Ai bảo makeup đẹp phải đắt? Hôm nay mình sẽ chứng minh ngược lại với một haul toàn đồ drugstore mà tổng tiền chưa đến 500K!

Đầu tiên là Kem nền Maybelline Fit Me Matte + Poreless — 180K. Đây là kem nền "huyền thoại" cho da dầu. Che phủ tốt, kiềm dầu cả ngày, bảng shade đa dạng cho da châu Á. Mình dùng shade 220 và thấy rất match.

Son kem lì Kiss Beauty chỉ 45K mà chất lượng ngang ngửa các hãng trung-cao. Bảng màu trendy, lên môi mịn, không khô. Mình đặc biệt thích màu đỏ gạch và hồng đất.

Mascara Catrice Glam & Doll Volume — 120K. Cây mascara này cho volume cực đỉnh, không vón cục, giữ cong cả ngày. Đây chính là "dupe" hoàn hảo cho những cây mascara cao cấp gấp 5 lần giá.

Tổng cộng mình chỉ tiêu 345K cho 3 sản phẩm chất lượng. Còn dư budget thì mua thêm cây kẻ mày Innisfree 89K là đủ bộ makeup hoàn chỉnh!`,
    author_name: "Góc Của Rư",
    author_avatar: "/images/kol-ru.png",
    category: "Trang Điểm",
    tags: ["Drugstore", "Makeup haul", "Tiết kiệm"],
    image: "/images/product-foundation.png",
    likes: 267,
    comments: 41,
    created_at: "2026-04-06T14:00:00Z",
  },
  {
    id: "p4",
    title: "Skincare Routine Cho Da Dầu Mụn — Đơn Giản Mà Hiệu Quả",
    slug: "skincare-routine-da-dau-mun",
    excerpt: "Routine 5 bước cơ bản dành cho da dầu mụn, tập trung vào kiểm soát dầu và ngăn ngừa mụn hiệu quả.",
    content: `Da dầu mụn là một trong những loại da khó chăm sóc nhất. Nhiều bạn mắc sai lầm khi dùng quá nhiều sản phẩm hoặc chọn sai sản phẩm khiến tình trạng da thêm tệ.

Bước 1 — Tẩy trang: Dùng nước tẩy trang L'Oreal Micellar Water 3-in-1. Sạch sâu, không rát, không để lại cặn. Dùng bông tẩy trang thấm đều rồi lau nhẹ nhàng theo chiều từ trong ra ngoài.

Bước 2 — Rửa mặt: Sữa rửa mặt CeraVe Foaming Cleanser dành riêng cho da dầu. Tạo bọt mịn, làm sạch sâu lỗ chân lông mà không làm khô da. Rửa mặt 2 lần/ngày, sáng và tối.

Bước 3 — Toner: Dùng toner chứa BHA (Salicylic Acid) như Paula's Choice BHA 2%. Giúp thông thoáng lỗ chân lông, giảm mụn đầu đen và mụn ẩn. Chỉ dùng tối, 2-3 lần/tuần.

Bước 4 — Serum: B5 GoodnDoc giúp phục hồi da, cấp ẩm mà không gây bít tắc. Thấm nhanh, texture lỏng nhẹ rất phù hợp cho da dầu.

Bước 5 — Kem chống nắng (buổi sáng): La Roche-Posay Anthelios dạng fluid, kiềm dầu suốt cả ngày. Đây là bước KHÔNG BAO GIỜ được bỏ qua, kể cả khi bạn ở trong nhà.`,
    author_name: "Call Me Duy",
    author_avatar: "/images/kol-duy.png",
    category: "Skincare Routine",
    tags: ["Da dầu mụn", "Routine", "BHA", "Cho người mới"],
    image: "/images/product-micellar.png",
    likes: 489,
    comments: 67,
    created_at: "2026-04-04T09:00:00Z",
  },
  {
    id: "p5",
    title: "Giải Cứu Mái Tóc Hư Tổn Sau Tẩy Nhuộm — 3 Bước Đơn Giản",
    slug: "giai-cuu-toc-hu-ton-sau-tay-nhuom",
    excerpt: "Tóc khô xơ, gãy rụng sau khi tẩy nhuộm? Đây là 3 bước phục hồi tóc hiệu quả mà không cần ra salon.",
    content: `Sau mỗi lần tẩy nhuộm, tóc thường bị mất đi lớp biểu bì bảo vệ, dẫn đến khô xơ, gãy rụng và mất độ bóng. Nhưng đừng lo, với 3 bước đơn giản sau đây, bạn hoàn toàn có thể phục hồi tóc tại nhà.

Bước 1 — Chuyển sang dầu gội không sulfate. Sulfate là chất tẩy rửa mạnh khiến tóc nhuộm phai màu nhanh và khô hơn. Dầu gội Tsubaki Premium Repair hoặc Moroccanoil Moisture Repair là những lựa chọn tuyệt vời. Gội đầu chỉ 2-3 lần/tuần thay vì hàng ngày.

Bước 2 — Ủ tóc tuần 2 lần. Sử dụng mặt nạ tóc chứa Keratin hoặc Protein để bù đắp lại cấu trúc tóc bị phá vỡ. Ủ ít nhất 15-20 phút rồi xả sạch. Fino Premium Touch Hair Mask của Shiseido là sản phẩm "thần thánh" mà hội mê nhuộm tóc không thể thiếu.

Bước 3 — Dùng tinh dầu dưỡng tóc. Sau khi gội, thoa một lượng nhỏ tinh dầu Argan hoặc Moroccanoil lên phần đuôi tóc khi tóc còn ẩm. Điều này giúp khóa ẩm, giảm xơ rối và tạo độ bóng tự nhiên. Tránh bôi lên da đầu để không gây bết.`,
    author_name: "Bống Bee",
    author_avatar: "/images/kol/bong-bee.jpg",
    category: "Chăm Sóc Tóc",
    tags: ["Tóc hư tổn", "Nhuộm tóc", "Phục hồi", "Tại nhà"],
    image: "/images/product-dry-shampoo.png",
    likes: 198,
    comments: 32,
    created_at: "2026-04-02T16:00:00Z",
  },
  {
    id: "p6",
    title: "So Sánh 4 Loại Sữa Dưỡng Thể Trắng Da Hot Nhất Hiện Nay",
    slug: "so-sanh-sua-duong-the-trang-da",
    excerpt: "Vaseline Gluta-Hya, Nivea Extra White, Bioré UV Whitening, Senka White Beauty — loại nào thực sự hiệu quả?",
    content: `Dưỡng trắng body đang là xu hướng lớn với hàng loạt sản phẩm mới ra mắt. Mình đã test 4 loại hot nhất trong 8 tuần, mỗi loại dùng cho một vùng cơ thể khác nhau để so sánh công bằng.

Vaseline Gluta-Hya Serum Burst Lotion — 140K/300ml. Kết cấu serum lỏng, thấm cực nhanh không bết dính. Sau 4 tuần thấy da sáng rõ rệt, đặc biệt là vùng khuỷu tay và đầu gối. Chứa Gluta-Hya và 10x Vitamin C. Đây là sản phẩm mình đánh giá cao nhất về hiệu quả/giá thành.

Nivea Extra White Repair & Protect SPF30 — 120K/350ml. Ưu điểm lớn nhất là có SPF30, bảo vệ da khỏi tia UV khi ra ngoài. Kết cấu kem hơi đặc, cần massage kỹ mới thấm. Hiệu quả trắng da ở mức trung bình.

Bioré UV Whitening Body Serum — 180K/150ml. Dung tích nhỏ nhất nhưng chất lượng khá ổn. Kết cấu gel mát lạnh, thấm nhanh. Có SPF50+ nên rất phù hợp dùng ban ngày. Tuy nhiên giá hơi cao so với dung tích.

Senka White Beauty Lotion — 100K/200ml. Giá rẻ nhất trong 4 sản phẩm. Kết cấu sữa nhẹ, mùi hương dễ chịu. Hiệu quả trắng da chậm hơn so với Vaseline nhưng giá thành rất hợp lý cho học sinh sinh viên.`,
    author_name: "Hà Linh Official",
    author_avatar: "/images/kol-halinh.png",
    category: "Mẹo Làm Đẹp",
    tags: ["Body lotion", "Trắng da", "So sánh", "Drugstore"],
    image: "/images/product-body-lotion.png",
    likes: 371,
    comments: 48,
    created_at: "2026-03-30T11:00:00Z",
  },
  {
    id: "p7",
    title: "Nước Hoa Nữ Cho Mùa Hè — 5 Mùi Hương Tươi Mát, Lưu Hương Cả Ngày",
    slug: "nuoc-hoa-nu-mua-he-tuoi-mat",
    excerpt: "Tổng hợp 5 chai nước hoa nữ với hương thơm tươi mát, thanh lịch, lý tưởng cho thời tiết nóng bức.",
    content: `Mùa hè oi ả, việc chọn đúng nước hoa không chỉ giúp bạn thơm mát mà còn tăng sự tự tin rất nhiều. Dưới đây là 5 chai nước hoa mình đã dùng xuyên suốt mùa hè năm ngoái và sẽ tiếp tục repurchase.

Narciso Rodriguez For Her EDP — Hương xạ hương quyến rũ nhưng không nặng nề. Tầm tỏa hương vừa phải, rất phù hợp cho môi trường công sở. Lưu hương 6-8 tiếng trên da. Đây là chai "signature scent" của mình.

Jo Malone English Pear & Freesia — Hương trái lê tươi mát kết hợp hoa lan trắng. Nhẹ nhàng, thanh lịch, rất phù hợp cho những ngày hè oi ả. Nhược điểm là lưu hương chỉ khoảng 4 tiếng.

Chanel Chance Eau Tendre — Hương hoa quả nhẹ nhàng với nốt bưởi hồng và mẫu đơn. Rất "con gái" và dễ chịu. Lưu hương 5-6 tiếng. Giá khá cao nhưng xứng đáng.

Versace Bright Crystal — Hương hoa quả tươi sáng với mẫu đơn, hoa mộc lan và xạ hương. Giá tầm trung, phù hợp cho bạn nào mới bắt đầu sưu tầm nước hoa.

Clean Reserve Skin — Mùi hương "da sạch" tối giản, gần gũi. Như thể bạn vừa tắm xong, tươi mới và tự nhiên. Rất phù hợp cho những ai thích phong cách minimalist.`,
    author_name: "Chloe Nguyen",
    author_avatar: "/images/kol-chloe.png",
    category: "Nước Hoa",
    tags: ["Nước hoa", "Mùa hè", "Nữ tính", "Lưu hương"],
    image: "/images/product-perfume.png",
    likes: 156,
    comments: 23,
    created_at: "2026-03-28T13:00:00Z",
  },
  {
    id: "p8",
    title: "Xu Hướng Son Môi 2026 — Từ Matte Đến Glossy, Màu Nào Đang Hot?",
    slug: "xu-huong-son-moi-2026",
    excerpt: "Cập nhật xu hướng son môi mới nhất từ các sàn runway và beauty influencer quốc tế, áp dụng cho làn da châu Á.",
    content: `2026 là năm của sự đa dạng trong xu hướng son môi. Không còn bị giới hạn bởi một phong cách duy nhất, năm nay bạn có thể thoải mái mix & match giữa matte, glossy và các finish mới lạ.

Xu hướng 1 — Velvet Matte. Không phải matte khô cứng truyền thống mà là lớp finish mờ mịn như nhung. MAC Powder Kiss Liquid Lipcolour là đại diện tiêu biểu. Chất son mềm, không khô môi, tạo hiệu ứng "blur" cực đẹp khi chụp ảnh.

Xu hướng 2 — Glass Lips. Đôi môi bóng như gương, căng mọng tự nhiên. Dior Addict Lip Maximizer và Fenty Gloss Bomb là hai cái tên được nhắc đến nhiều nhất. Phù hợp cho makeup "no-makeup" hoặc phong cách clean girl.

Xu hướng 3 — Bitten Lips. Hiệu ứng môi vừa cắn, đậm ở giữa và nhạt dần ra ngoài. Xu hướng này rất phổ biến ở Hàn Quốc và phù hợp tuyệt vời với làn da châu Á. Dùng son tint lên giữa môi rồi blend ra là có ngay hiệu ứng.

Về màu sắc, đỏ gạch (terracotta red), hồng đất (dusty pink) và nâu đỏ (brick brown) tiếp tục thống trị. Riêng tông berry (mâm xôi) đang có dấu hiệu comeback mạnh mẽ trong các show thời trang gần đây.`,
    author_name: "Góc Của Rư",
    author_avatar: "/images/kol-ru.png",
    category: "Xu Hướng",
    tags: ["Son môi", "Xu hướng", "Matte", "Glossy"],
    image: "/images/product-lipstick.png",
    likes: 213,
    comments: 35,
    created_at: "2026-03-25T10:00:00Z",
  },
];

async function seed() {
  console.log("Removing stale unidentified KOL records...");
  const { error: staleEventError } = await supabaseAdmin
    .from('creator_product_events')
    .delete()
    .in('id', STALE_CREATOR_EVENT_IDS);
  if (staleEventError) console.error("STALE CREATOR EVENT Error:", staleEventError.message);

  console.log(`Seeding KOLS (${KOLS.length})...`);
  const { error: e1 } = await supabaseAdmin.from('kols').upsert(KOLS);
  if (e1) console.error("KOLS Error:", e1.message);

  console.log(`Seeding PRODUCTS (${PRODUCTS.length})...`);
  const { error: e2 } = await supabaseAdmin.from('radar_products').upsert(PRODUCTS);
  if (e2) console.error("PRODUCTS Error:", e2.message);

  console.log(`Seeding REVIEWS (${REVIEWS.length})...`);
  const { error: e3 } = await supabaseAdmin.from('reviews').upsert(REVIEWS);
  if (e3) console.error("REVIEWS Error:", e3.message);

  console.log(`Seeding POSTS (${POSTS.length})...`);
  const { error: e4 } = await supabaseAdmin.from('posts').upsert(POSTS);
  if (e4) console.error("POSTS Error:", e4.message);

  console.log(`Seeding PRODUCT OFFERS (${SAMPLE_PRODUCT_OFFERS.length})...`);
  const { error: e5 } = await supabaseAdmin.from('product_offers').upsert(SAMPLE_PRODUCT_OFFERS);
  if (e5) console.error("PRODUCT OFFERS Error:", e5.message);

  console.log(`Seeding CREATOR PRODUCT EVENTS (${SAMPLE_CREATOR_PRODUCT_EVENTS.length})...`);
  const { error: e6 } = await supabaseAdmin.from('creator_product_events').upsert(SAMPLE_CREATOR_PRODUCT_EVENTS);
  if (e6) console.error("CREATOR PRODUCT EVENTS Error:", e6.message);

  console.log("Seeding done!");
}

seed();
