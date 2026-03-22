import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const KOLS = [
  { id: "1", name: "Hà Linh Official", avatar: "https://picsum.photos/seed/halinh/150/150", cover: "https://picsum.photos/seed/halinhcover/1200/400", platform: "Youtube", handle: "@halinhofficial", followers: "2.1M", trustscore: 98, categories: ["Skincare", "Makeup"], recentreview: "Serum B5 GoodnDoc", verified: true },
  { id: "2", name: "Góc Của Rư", avatar: "https://picsum.photos/seed/ru/150/150", cover: "https://picsum.photos/seed/rucover/1200/400", platform: "Tiktok", handle: "@goccuaru", followers: "850K", trustscore: 85, categories: ["Makeup", "Bodycare"], recentreview: "Kem nền Maybelline Fit Me", verified: true },
  { id: "3", name: "Trinh Phạm", avatar: "https://picsum.photos/seed/trinh/150/150", cover: "https://picsum.photos/seed/trinhcover/1200/400", platform: "Youtube", handle: "@trinhpham", followers: "1.5M", trustscore: 95, categories: ["Skincare", "Lifestyle"], recentreview: "Tẩy trang L'Oreal", verified: true },
  { id: "4", name: "Call Me Duy", avatar: "https://picsum.photos/seed/duy/150/150", cover: "https://picsum.photos/seed/duycover/1200/400", platform: "Youtube", handle: "@callmeduy", followers: "500K", trustscore: 92, categories: ["Skincare", "Treatment"], recentreview: "Retinol Obagi", verified: true },
  { id: "5", name: "Bồng Bềnh", avatar: "https://picsum.photos/seed/bong/150/150", cover: "https://picsum.photos/seed/bongcover/1200/400", platform: "Tiktok", handle: "@bongbenh", followers: "1.2M", trustscore: 88, categories: ["Haircare", "Bodycare"], recentreview: "Dầu gội Tsubaki", verified: false },
  { id: "6", name: "Chloe Nguyen", avatar: "https://picsum.photos/seed/chloe/150/150", cover: "https://picsum.photos/seed/chloecover/1200/400", platform: "Instagram", handle: "@chloenguyen", followers: "600K", trustscore: 90, categories: ["High-end Makeup", "Perfume"], recentreview: "Dior Lip Glow", verified: true }
];

const PRODUCTS = [
  { id: "1", name: "Tinh chất phục hồi da B5 GoodnDoc", brand: "GoodnDoc", image: "https://picsum.photos/seed/b5/400/400", rating: 4.8, reviews: 1240, sold: "8,500+", price: "350.000đ", category: "Skincare", tags: ["Phục hồi", "Cấp ẩm"], description: "Sản phẩm giúp phục hồi hàng rào bảo vệ da, cung cấp độ ẩm sâu và làm dịu làn da nhạy cảm. Phù hợp cho mọi loại da, đặc biệt là da đang treatment hoặc cần phục hồi sau mụn." },
  { id: "2", name: "Kem nền Maybelline Fit Me Matte + Poreless", brand: "Maybelline", image: "https://picsum.photos/seed/foundation/400/400", rating: 4.5, reviews: 3500, sold: "15,000+", price: "180.000đ", category: "Makeup", tags: ["Kiềm dầu", "Drugstore"], description: "Kem nền kiềm dầu, che phủ lỗ chân lông hoàn hảo. Phù hợp cho da dầu và hỗn hợp thiên dầu, mang lại lớp nền mịn lì tự nhiên suốt cả ngày dài." },
  { id: "3", name: "Nước tẩy trang L'Oreal Micellar Water 3-in-1", brand: "L'Oreal", image: "https://picsum.photos/seed/loreal/400/400", rating: 4.9, reviews: 5200, sold: "20,000+", price: "150.000đ", category: "Skincare", tags: ["Làm sạch sâu", "Cho da nhạy cảm"], description: "Nước tẩy trang 3 trong 1 giúp làm sạch sâu lớp trang điểm, bụi bẩn và bã nhờn mà không gây khô rát. Công nghệ Micellar dịu nhẹ, an toàn cho cả vùng mắt và môi." },
  { id: "4", name: "Son kem lì MAC Powder Kiss Liquid Lipcolour", brand: "MAC", image: "https://picsum.photos/seed/mac/400/400", rating: 4.7, reviews: 890, sold: "3,200+", price: "650.000đ", category: "Makeup", tags: ["Lì", "Mềm môi"], description: "Son kem lì với kết cấu xốp mịn như nhung, không làm khô môi. Màu sắc lên chuẩn, lâu trôi và tạo hiệu ứng mờ lì thời thượng." },
  { id: "5", name: "Dầu gội khô Batiste Dry Shampoo", brand: "Batiste", image: "https://picsum.photos/seed/batiste/400/400", rating: 4.6, reviews: 2100, sold: "10,000+", price: "120.000đ", category: "Haircare", tags: ["Làm sạch nhanh", "Tiện lợi"], description: "Giải pháp cứu nguy cho mái tóc bết dính chỉ trong 1 phút. Hút sạch dầu thừa, trả lại mái tóc bồng bềnh và lưu hương thơm mát." },
  { id: "6", name: "Sữa rửa mặt Cerave Hydrating Cleanser", brand: "Cerave", image: "https://picsum.photos/seed/cerave/400/400", rating: 4.8, reviews: 4100, sold: "12,000+", price: "380.000đ", category: "Skincare", tags: ["Dịu nhẹ", "Cấp ẩm"], description: "Sữa rửa mặt không tạo bọt, làm sạch nhẹ nhàng mà không làm tổn thương hàng rào bảo vệ da. Bổ sung Ceramides và Hyaluronic Acid giúp da luôn ẩm mượt." },
  { id: "7", name: "Nước hoa nữ Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", image: "https://picsum.photos/seed/narciso/400/400", rating: 4.9, reviews: 650, sold: "1,500+", price: "2.500.000đ", category: "Perfume", tags: ["Quyến rũ", "Lưu hương lâu"], description: "Hương thơm quyến rũ, nữ tính với nốt hương xạ hương đặc trưng kết hợp cùng hoa hồng và đào. Lưu hương lâu, tỏa hương vừa phải, thích hợp cho những dịp đặc biệt." },
  { id: "8", name: "Sữa dưỡng thể Vaseline Gluta-Hya", brand: "Vaseline", image: "https://picsum.photos/seed/vaseline/400/400", rating: 4.5, reviews: 1800, sold: "6,000+", price: "140.000đ", category: "Bodycare", tags: ["Trắng da", "Thấm nhanh"], description: "Sữa dưỡng thể dạng serum mỏng nhẹ, thấm cực nhanh không gây bết dính. Chứa Gluta-Hya giúp dưỡng sáng da hiệu quả gấp 10 lần Vitamin C." },
];

const REVIEWS = [
  { id: "r1", kolid: "1", productid: "1", rating: 5, ispr: false, timeago: "2 giờ trước", content: "Phục hồi da siêu đỉnh, thấm nhanh không bết dính. Highly recommend cho da treatment!", likes: 342, comments: 45 },
  { id: "r2", kolid: "2", productid: "2", rating: 4, ispr: true, timeago: "5 giờ trước", content: "Độ che phủ ổn, kiềm dầu tốt nhưng xuống tone hơi nhanh. Phù hợp học sinh sinh viên.", likes: 128, comments: 12 },
  { id: "r3", kolid: "3", productid: "3", rating: 5, ispr: false, timeago: "1 ngày trước", content: "Sạch sâu, không rát mắt, giá thành rẻ. Chân ái tẩy trang drugstore của mình.", likes: 890, comments: 102 },
  { id: "r4", kolid: "4", productid: "4", rating: 4, ispr: true, timeago: "2 ngày trước", content: "Màu son lên chuẩn, chất son mềm mịn không làm khô môi. Tuy nhiên độ bám màu chỉ ở mức trung bình, ăn uống sẽ trôi khá nhiều.", likes: 456, comments: 38 },
];

async function seed() {
  console.log("Seeding KOLS...");
  const { error: e1 } = await supabaseAdmin.from('kols').upsert(KOLS);
  if (e1) console.error("KOLS Error:", e1.message);

  console.log("Seeding PRODUCTS...");
  const { error: e2 } = await supabaseAdmin.from('radar_products').upsert(PRODUCTS);
  if (e2) console.error("PRODUCTS Error:", e2.message);

  console.log("Seeding REVIEWS...");
  const { error: e3 } = await supabaseAdmin.from('reviews').upsert(REVIEWS);
  if (e3) console.error("REVIEWS Error:", e3.message);
  
  console.log("Seeding done!");
}

seed();