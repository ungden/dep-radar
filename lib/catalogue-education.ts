export interface EducationPoint {
  title: string
  body: string
}

export interface VisualNode {
  label: string
  detail: string
}

export interface CatalogueEducation {
  headline: string
  basics: EducationPoint[]
  visualTitle: string
  visualCaption: string
  visualNodes: VisualNode[]
  flowTitle: string
  flowSteps: string[]
  glossary: EducationPoint[]
  mistakes: string[]
}

export const catalogueEducation: Record<string, CatalogueEducation> = {
  "da-mat": {
    headline: "Nắm nền skincare trước khi mua thêm serum",
    basics: [
      { title: "Da cần ổn định trước", body: "Làm sạch, dưỡng ẩm và chống nắng là nền. Treatment chỉ nên thêm khi da chịu được routine cơ bản." },
      { title: "Loại da khác tình trạng da", body: "Da dầu/khô là nền cơ địa; mụn, thâm, kích ứng, bong tróc là tình trạng có thể thay đổi theo routine và môi trường." },
      { title: "Barrier là hàng rào bảo vệ", body: "Khi barrier yếu, da dễ rát, đỏ, bong, nổi mụn lặt vặt. Lúc này phục hồi quan trọng hơn thêm hoạt chất mạnh." },
    ],
    visualTitle: "Bản đồ routine cơ bản",
    visualCaption: "Đi từ nền ổn định đến treatment, không nhảy thẳng vào nhiều hoạt chất.",
    visualNodes: [
      { label: "Làm sạch", detail: "Không căng rít" },
      { label: "Dưỡng ẩm", detail: "Khóa nước vừa đủ" },
      { label: "Chống nắng", detail: "Dùng được mỗi ngày" },
      { label: "Treatment", detail: "Thêm chậm, theo dõi" },
    ],
    flowTitle: "Flow chọn routine",
    flowSteps: ["Chọn vấn đề chính", "Giữ 3 bước nền 2 tuần", "Thêm 1 hoạt chất", "Theo dõi kích ứng", "Tăng/giảm tần suất"],
    glossary: [
      { title: "Texture", body: "Cảm giác sản phẩm trên da: gel, lotion, cream, balm." },
      { title: "Finish", body: "Bề mặt sau khi thoa: ráo, bóng, nâng tone, dính hay vón." },
      { title: "Patch test", body: "Thử sản phẩm trên vùng nhỏ trước khi dùng toàn mặt." },
    ],
    mistakes: ["Mua quá nhiều treatment cùng lúc", "Đổi routine mỗi vài ngày", "Bỏ chống nắng khi đang dùng acid/retinoid"],
  },
  "tri-mun": {
    headline: "Trị mụn cần phân loại trước, không chỉ mua treatment mạnh",
    basics: [
      { title: "Mụn không chỉ một loại", body: "Mụn ẩn, đầu đen, viêm, nang, nội tiết và mụn body cần hướng xử lý khác nhau." },
      { title: "Viêm càng mạnh càng cần nhẹ tay", body: "Mụn đỏ đau cần giảm viêm, phục hồi và hạn chế nặn; không phải cứ scrub hoặc acid mạnh là nhanh hơn." },
      { title: "Thâm/sẹo là giai đoạn sau", body: "Nếu không kiểm soát viêm và chống nắng, thâm mụn dễ kéo dài hơn." },
    ],
    visualTitle: "Mụn nhìn theo mức độ",
    visualCaption: "Mức độ càng nặng, càng nên giảm tự thử sản phẩm và cân nhắc chuyên gia.",
    visualNodes: [
      { label: "Bít tắc", detail: "Mụn ẩn, đầu đen" },
      { label: "Viêm nhẹ", detail: "Đỏ, hơi đau" },
      { label: "Viêm nặng", detail: "Nang, mủ, đau" },
      { label: "Sau mụn", detail: "Thâm, đỏ, sẹo" },
    ],
    flowTitle: "Flow xử lý mụn",
    flowSteps: ["Nhận diện loại mụn", "Giữ làm sạch dịu + dưỡng", "Chọn 1 treatment", "Chống nắng đều", "Đi khám nếu đau/sẹo/nang"],
    glossary: [
      { title: "Purging", body: "Mụn đẩy lên ở vùng hay có mụn khi bắt đầu một số hoạt chất." },
      { title: "Comedone", body: "Mụn không viêm do bít tắc: đầu trắng, đầu đen, mụn ẩn." },
      { title: "PIH", body: "Thâm sau viêm, thường đậm hơn nếu chống nắng kém." },
    ],
    mistakes: ["Nặn mụn viêm đỏ", "Phối BHA, retinoid, benzoyl peroxide quá sớm", "Chỉ trị mụn mà không phục hồi da"],
  },
  "sang-da-chong-nang": {
    headline: "Sáng da bắt đầu từ chống nắng ổn định",
    basics: [
      { title: "Đều màu không phải trắng cấp tốc", body: "Mục tiêu an toàn là giảm thâm, xỉn màu và tăng sắc tố sau viêm theo thời gian." },
      { title: "SPF là nền của mọi treatment sáng da", body: "Nếu chống nắng không đều, vitamin C, niacinamide hay tranexamic acid sẽ khó phát huy ổn định." },
      { title: "Nám cần kiên nhẫn", body: "Nám liên quan nắng, hormone và cơ địa; tự dùng treatment mạnh dễ kích ứng hoặc đậm màu hơn." },
    ],
    visualTitle: "Tam giác sáng da an toàn",
    visualCaption: "Chống nắng, phục hồi và hoạt chất làm sáng cần đi cùng nhau.",
    visualNodes: [
      { label: "SPF", detail: "Đủ lượng, thoa lại" },
      { label: "Phục hồi", detail: "Da chịu treatment" },
      { label: "Hoạt chất", detail: "Vitamin C, TXA..." },
      { label: "Thời gian", detail: "Theo tuần/tháng" },
    ],
    flowTitle: "Flow chọn chống nắng",
    flowSteps: ["Chọn finish hợp da", "Test cay mắt/vón", "Dùng đủ lượng", "Thoa lại khi nắng/mồ hôi", "Đánh giá sau 1-2 tuần"],
    glossary: [
      { title: "Broad-spectrum", body: "Bảo vệ trước cả UVA và UVB." },
      { title: "White cast", body: "Vệt trắng/nâng tone do màng lọc hoặc công thức." },
      { title: "Water-resistant", body: "Kháng nước trong thời gian hãng công bố, vẫn cần thoa lại." },
    ],
    mistakes: ["Chỉ mua serum sáng da nhưng bỏ SPF", "Tin claim trắng nhanh", "Dùng acid mạnh khi da đang rát"],
  },
  "ingredient-radar": {
    headline: "Hiểu hoạt chất để biết sản phẩm nào hợp routine",
    basics: [
      { title: "Công dụng phụ thuộc nồng độ và nền da", body: "Cùng một hoạt chất nhưng nồng độ, pH, nền công thức và tần suất dùng có thể cho trải nghiệm khác nhau." },
      { title: "Không cần dùng hết hoạt chất nổi tiếng", body: "Routine tốt là routine giải quyết đúng vấn đề với ít rủi ro kích ứng nhất." },
      { title: "Phối hoạt chất cần nhịp", body: "Một số cặp nên tách sáng/tối hoặc dùng xen kẽ nếu da mới bắt đầu." },
    ],
    visualTitle: "Bản đồ nhóm hoạt chất",
    visualCaption: "Đọc label bằng nhóm công dụng trước khi soi từng thành phần.",
    visualNodes: [
      { label: "Mụn", detail: "BHA, BPO, azelaic" },
      { label: "Sáng da", detail: "Vitamin C, TXA" },
      { label: "Phục hồi", detail: "Ceramide, B5" },
      { label: "Lão hóa", detail: "Retinoid, peptide" },
    ],
    flowTitle: "Flow thêm hoạt chất",
    flowSteps: ["Xác định vấn đề", "Đọc hoạt chất chính", "Kiểm tra routine hiện tại", "Dùng tần suất thấp", "Tăng khi da ổn"],
    glossary: [
      { title: "Active", body: "Thành phần có vai trò chính trong kết quả sản phẩm." },
      { title: "Vehicle", body: "Nền công thức giúp hoạt chất thấm và tạo cảm giác dùng." },
      { title: "Irritation", body: "Kích ứng: rát, đỏ, ngứa, bong, châm chích kéo dài." },
    ],
    mistakes: ["Chọn theo trend ingredient thay vì vấn đề da", "Không đọc cảnh báo pregnancy-safe", "Dùng hoạt chất mạnh hằng ngày ngay từ đầu"],
  },
  "product-radar": {
    headline: "Review sản phẩm phải giúp quyết định mua, không chỉ khen chê",
    basics: [
      { title: "Sản phẩm tốt phải đúng người", body: "Một kem chống nắng rất hay cho da khô vẫn có thể bí với da dầu." },
      { title: "Giá trị nằm ở fit", body: "Đáng tiền nghĩa là hợp nhu cầu, texture dùng được, giá/ml hợp lý và ít rủi ro bỏ xó." },
      { title: "Review cần ngữ cảnh", body: "Loại da, khí hậu, routine đi kèm và thời gian dùng quyết định review có đáng tin không." },
    ],
    visualTitle: "Khung đọc review",
    visualCaption: "Đừng chỉ nhìn điểm số; hãy nhìn fit, trải nghiệm và rủi ro.",
    visualNodes: [
      { label: "Need", detail: "Giải quyết gì" },
      { label: "Fit", detail: "Loại da/ngân sách" },
      { label: "Feel", detail: "Texture, mùi, finish" },
      { label: "Risk", detail: "Kích ứng, bí da" },
    ],
    flowTitle: "Flow shortlist sản phẩm",
    flowSteps: ["Chọn nhu cầu", "Lọc loại da/ngân sách", "So texture/finish", "Đọc review cùng loại da", "Mua size nhỏ nếu rủi ro"],
    glossary: [
      { title: "Dupe", body: "Sản phẩm có cảm giác/công dụng tương tự, không nhất thiết công thức giống." },
      { title: "Price per ml", body: "Giá theo dung tích giúp so sánh công bằng hơn." },
      { title: "Holy grail", body: "Sản phẩm cực hợp với một người, không mặc định hợp mọi người." },
    ],
    mistakes: ["Mua vì viral mà không xem loại da", "Tin before/after quá nhanh", "Không để ý dung tích và tần suất dùng"],
  },
  bodycare: {
    headline: "Bodycare là skincare cho toàn thân",
    basics: [
      { title: "Da body cũng có mụn, thâm và barrier", body: "Lưng, ngực, nách, bikini, đầu gối có đặc điểm ma sát, mồ hôi và lông khác mặt." },
      { title: "Mùi cơ thể không chỉ là nước hoa", body: "Khử mùi, làm sạch mồ hôi, vải mặc và body mist/fragrance layering là các lớp khác nhau." },
      { title: "Body sáng da cần chống nắng", body: "Vùng tay, cổ, chân tiếp xúc nắng sẽ khó đều màu nếu chỉ dùng lotion sáng da." },
    ],
    visualTitle: "Bản đồ vùng body",
    visualCaption: "Mỗi vùng cần tiêu chí riêng thay vì dùng một sản phẩm cho tất cả.",
    visualNodes: [
      { label: "Lưng/ngực", detail: "Mụn, mồ hôi" },
      { label: "Nách", detail: "Mùi, thâm" },
      { label: "Tay/chân", detail: "Sạm, chống nắng" },
      { label: "Bikini", detail: "Ma sát, kích ứng" },
    ],
    flowTitle: "Flow bodycare",
    flowSteps: ["Chọn vùng cần xử lý", "Rà thói quen gây kích ứng", "Chọn body wash/lotion phù hợp", "Thêm treatment nhẹ", "Theo dõi sau 4 tuần"],
    glossary: [
      { title: "KP", body: "Keratosis pilaris: da sần như da gà, thường ở tay/đùi." },
      { title: "Ingrown hair", body: "Lông mọc ngược sau cạo/wax, dễ gây viêm nang lông." },
      { title: "Antiperspirant", body: "Sản phẩm giúp giảm tiết mồ hôi, khác deodorant chỉ khử mùi." },
    ],
    mistakes: ["Dùng acid mạnh ngay sau wax/cạo", "Quên dầu xả chảy xuống lưng", "Body trắng nhanh bằng sản phẩm lột tẩy"],
  },
  "toc-da-dau": {
    headline: "Tách da đầu và sợi tóc trước khi chọn sản phẩm",
    basics: [
      { title: "Da đầu là da", body: "Gàu, dầu, ngứa, viêm và rụng tóc thuộc nhóm scalp care, không chỉ haircare làm mượt." },
      { title: "Sợi tóc cần bảo vệ vật lý", body: "Tẩy nhuộm, nhiệt, kéo căng và nắng làm tóc khô xơ, gãy, mất bóng." },
      { title: "Rụng tóc cần nhìn mẫu rụng", body: "Rụng theo mùa, sau sinh, stress khác với hói tiến triển hoặc rụng từng mảng." },
    ],
    visualTitle: "Da đầu vs sợi tóc",
    visualCaption: "Một bên cần chăm da, một bên cần giảm hư tổn vật lý.",
    visualNodes: [
      { label: "Da đầu", detail: "Gàu, dầu, ngứa" },
      { label: "Nang tóc", detail: "Rụng, mật độ" },
      { label: "Thân tóc", detail: "Khô, xơ, gãy" },
      { label: "Tạo kiểu", detail: "Nhiệt, pomade" },
    ],
    flowTitle: "Flow chọn haircare",
    flowSteps: ["Xác định da đầu hay sợi tóc", "Chọn dầu gội/treatment", "Chọn xả/mask/leave-in", "Giảm nhiệt/kéo căng", "Đi khám nếu rụng bất thường"],
    glossary: [
      { title: "Sebum", body: "Dầu tự nhiên trên da đầu." },
      { title: "Bond repair", body: "Nhóm sản phẩm hướng đến phục hồi liên kết trong tóc hư tổn." },
      { title: "Clarifying shampoo", body: "Dầu gội làm sạch tích tụ sản phẩm, không nên lạm dụng." },
    ],
    mistakes: ["Gội quá mạnh làm da đầu khô hơn", "Dùng pomade nhưng không làm sạch cuối ngày", "Chỉ mua serum mọc tóc khi rụng nhiều kéo dài"],
  },
  makeup: {
    headline: "Makeup đẹp bắt đầu từ nền da và hoàn cảnh dùng",
    basics: [
      { title: "Base là phần dễ lộ nhất", body: "Mốc nền, xuống tone, cakey hay bí da thường đến từ skincare nền, lượng sản phẩm và chọn sai finish." },
      { title: "Look phải theo dịp", body: "Đi học, đi làm, đi tiệc, chụp ảnh và makeup nam nhẹ cần mức che phủ/độ bền khác nhau." },
      { title: "Tẩy trang là một phần của makeup", body: "Nếu không làm sạch kỹ, makeup dễ góp phần gây mụn và kích ứng." },
    ],
    visualTitle: "Layer makeup cơ bản",
    visualCaption: "Đi từ chuẩn bị da đến điểm nhấn, đừng dồn quá nhiều lớp nền.",
    visualNodes: [
      { label: "Prep", detail: "Dưỡng + SPF" },
      { label: "Base", detail: "Nền/che khuyết" },
      { label: "Set", detail: "Phấn/xịt khóa" },
      { label: "Color", detail: "Má, mắt, môi" },
    ],
    flowTitle: "Flow chọn makeup",
    flowSteps: ["Chọn dịp dùng", "Xác định loại da", "Chọn finish", "Test dưới ánh sáng thật", "Tẩy trang và theo dõi mụn"],
    glossary: [
      { title: "Oxidize", body: "Nền xuống tone hoặc ngả màu sau vài giờ." },
      { title: "Cakey", body: "Nền dày, bột, lộ mảng hoặc vân da." },
      { title: "Undertone", body: "Sắc độ nền da: ấm, lạnh hoặc trung tính." },
    ],
    mistakes: ["Chọn nền quá sáng để che xỉn màu", "Dùng tester mắt/môi thiếu vệ sinh", "Không tẩy trang sau makeup nhẹ"],
  },
  "mui-huong": {
    headline: "Chọn mùi theo không gian, mùa và khoảng cách",
    basics: [
      { title: "Mùi có độ tỏa và độ lưu", body: "Một mùi thơm trên da bạn vẫn có thể quá nồng trong thang máy hoặc văn phòng." },
      { title: "Body mist và perfume khác vai trò", body: "Mist nhẹ, dễ xịt lại; perfume đậm hơn, cần kiểm soát lượng." },
      { title: "Layering cần sạch", body: "Sữa tắm, lotion, body mist và perfume nên cùng vibe, tránh chồng mùi quá gắt." },
    ],
    visualTitle: "Tháp mùi dễ hiểu",
    visualCaption: "Mùi mở đầu, mùi giữa và mùi nền thay đổi theo thời gian trên da.",
    visualNodes: [
      { label: "Top", detail: "Mở đầu 15-30 phút" },
      { label: "Heart", detail: "Mùi chính" },
      { label: "Base", detail: "Lưu lâu" },
      { label: "Skin", detail: "Da mỗi người khác" },
    ],
    flowTitle: "Flow chọn nước hoa",
    flowSteps: ["Chọn hoàn cảnh", "Chọn nhóm mùi", "Test trên da", "Đợi drydown", "Quyết định lượng xịt"],
    glossary: [
      { title: "Projection", body: "Độ tỏa mùi ra xung quanh." },
      { title: "Longevity", body: "Độ lưu mùi trên da/quần áo." },
      { title: "Drydown", body: "Mùi sau khi bay bớt note mở đầu." },
    ],
    mistakes: ["Mua chỉ vì note list", "Xịt quá nhiều nơi công sở", "Xịt perfume lên tóc yếu thay hair mist"],
  },
  "nam-gioi": {
    headline: "Grooming nam nên ít bước nhưng đúng vấn đề",
    basics: [
      { title: "Ít bước không có nghĩa là bỏ SPF", body: "Rửa mặt, dưỡng nhẹ và chống nắng vẫn là nền cho da dầu mụn nam." },
      { title: "Tóc/râu dễ ảnh hưởng da", body: "Pomade, sáp, aftershave và cạo râu có thể liên quan mụn trán, viêm nang lông hoặc kích ứng." },
      { title: "Mùi cơ thể cần xử lý từ gốc", body: "Khử mùi, áo thoáng, tắm sau vận động và fragrance sạch sẽ đi cùng nhau." },
    ],
    visualTitle: "Routine nam 3 phút",
    visualCaption: "Nhanh, rõ việc, dễ duy trì mỗi sáng.",
    visualNodes: [
      { label: "Rửa mặt", detail: "Không căng rít" },
      { label: "Dưỡng nhẹ", detail: "Không bóng nhờn" },
      { label: "SPF", detail: "Dùng hằng ngày" },
      { label: "Grooming", detail: "Tóc/râu/mùi" },
    ],
    flowTitle: "Flow grooming nam",
    flowSteps: ["Chọn vấn đề chính", "Giữ routine 3 bước", "Thêm trị mụn/tóc/râu", "Theo dõi cảm giác bóng bí", "Đi khám nếu rụng tóc/mụn nặng"],
    glossary: [
      { title: "Matte finish", body: "Bề mặt ráo, ít bóng dầu." },
      { title: "Hold", body: "Độ giữ nếp của sáp/pomade." },
      { title: "Aftershave", body: "Sản phẩm dùng sau cạo râu để làm dịu/khử khuẩn tùy công thức." },
    ],
    mistakes: ["Rửa mặt quá mạnh để hết dầu", "Bỏ chống nắng vì sợ bí", "Dùng sáp tóc gây mụn nhưng không gội sạch"],
  },
  "clinic-treatment": {
    headline: "Clinic cần hiểu quy trình, rủi ro và aftercare trước khi làm",
    basics: [
      { title: "Thủ thuật không giống mỹ phẩm", body: "Peel, laser, filler, botox, RF microneedling có downtime, chống chỉ định và rủi ro riêng." },
      { title: "Người thực hiện quan trọng", body: "Bằng cấp, kinh nghiệm, tư vấn trước thủ thuật và khả năng xử trí biến chứng quan trọng hơn giá khuyến mãi." },
      { title: "Aftercare quyết định nhiều", body: "Chống nắng, phục hồi, tránh nhiệt/ma sát và tái khám đúng hẹn giúp giảm rủi ro." },
    ],
    visualTitle: "Vòng đời một thủ thuật",
    visualCaption: "Đừng chỉ xem before/after; hãy nhìn đủ trước, trong và sau.",
    visualNodes: [
      { label: "Tư vấn", detail: "Chẩn đoán + rủi ro" },
      { label: "Consent", detail: "Đồng ý rõ ràng" },
      { label: "Thực hiện", detail: "Vô khuẩn/thiết bị" },
      { label: "Aftercare", detail: "Theo dõi biến chứng" },
    ],
    flowTitle: "Flow chọn clinic",
    flowSteps: ["Xác định mục tiêu", "Hỏi phương án thay thế", "Hỏi downtime/rủi ro", "Kiểm tra người thực hiện", "Lưu aftercare và lịch tái khám"],
    glossary: [
      { title: "Downtime", body: "Thời gian da cần hồi phục, có thể đỏ, sưng, bong hoặc bầm." },
      { title: "PIH", body: "Tăng sắc tố sau viêm, dễ gặp hơn nếu da kích ứng/nắng." },
      { title: "Consent", body: "Xác nhận đã hiểu quy trình, rủi ro và đồng ý thực hiện." },
    ],
    mistakes: ["Chọn clinic vì giảm giá", "Không hỏi ai trực tiếp làm", "Không biết dấu hiệu biến chứng cần xử lý ngay"],
  },
  "beauty-lifestyle": {
    headline: "Làn da nằm trong bối cảnh ngủ, stress, hormone và thói quen",
    basics: [
      { title: "Không phải vấn đề nào cũng do mỹ phẩm", body: "Stress, chu kỳ, thuốc, sau sinh, thiếu ngủ và tập luyện có thể làm da thay đổi." },
      { title: "Theo dõi giúp bớt đoán mò", body: "Ghi lại ngày nổi mụn, sản phẩm mới, giấc ngủ và chu kỳ giúp nhìn ra pattern." },
      { title: "Làm đẹp an toàn là biết giới hạn", body: "Mỹ phẩm hỗ trợ chăm da, không thay thế chẩn đoán y khoa khi có dấu hiệu bất thường." },
    ],
    visualTitle: "Vòng ảnh hưởng đến da",
    visualCaption: "Sản phẩm chỉ là một phần trong hệ sinh hoạt.",
    visualNodes: [
      { label: "Ngủ", detail: "Hồi phục" },
      { label: "Stress", detail: "Mụn, xỉn" },
      { label: "Hormone", detail: "Chu kỳ/sau sinh" },
      { label: "Routine", detail: "Sản phẩm" },
    ],
    flowTitle: "Flow theo dõi lifestyle",
    flowSteps: ["Ghi vấn đề da", "Đánh dấu chu kỳ/stress/ngủ", "Giữ routine ổn", "Thử thay đổi một yếu tố", "Tìm chuyên gia nếu kéo dài"],
    glossary: [
      { title: "Trigger", body: "Yếu tố có thể làm vấn đề da bùng lên." },
      { title: "Pregnancy-safe", body: "Cách gọi nhóm sản phẩm/hoạt chất được cân nhắc khi mang thai, vẫn nên hỏi bác sĩ khi lo ngại." },
      { title: "Over-treatment", body: "Dùng quá nhiều hoạt chất khiến da yếu và kích ứng." },
    ],
    mistakes: ["Tin supplement chữa da cấp tốc", "Đổi toàn bộ routine vì một tuần xấu da", "Dùng treatment mạnh khi đang stress/thiếu ngủ và da yếu"],
  },
  "nails-mi-long-may": {
    headline: "Dịch vụ đẹp phải đi cùng vệ sinh và aftercare",
    basics: [
      { title: "Nail/mi/mày là dịch vụ gần vùng nhạy cảm", body: "Mắt, móng và vùng da quanh móng dễ kích ứng nếu keo, gel hoặc dụng cụ không phù hợp." },
      { title: "Mẫu đẹp cần tính bảo trì", body: "Nail dài, mi dày, mày quá sắc có thể đẹp trên ảnh nhưng khó duy trì hằng ngày." },
      { title: "Tháo đúng quan trọng như làm đẹp", body: "Tự bóc gel, tự giật mi hoặc xử lý sai có thể làm yếu móng/mi." },
    ],
    visualTitle: "Checklist trước dịch vụ",
    visualCaption: "Nhìn đẹp là chưa đủ; hỏi về vệ sinh, vật liệu và tháo/chăm sau.",
    visualNodes: [
      { label: "Vệ sinh", detail: "Dụng cụ/khăn" },
      { label: "Vật liệu", detail: "Keo, gel, mực" },
      { label: "Dáng", detail: "Hợp mặt/tay" },
      { label: "Aftercare", detail: "Tháo, dưỡng" },
    ],
    flowTitle: "Flow chọn salon",
    flowSteps: ["Chọn dịch vụ", "Xem vệ sinh dụng cụ", "Hỏi vật liệu/dị ứng", "Chọn dáng dễ duy trì", "Theo dõi đỏ/sưng/đau"],
    glossary: [
      { title: "Cuticle", body: "Vùng da viền móng, cắt quá sâu dễ đau/nhiễm trùng." },
      { title: "Lash adhesive", body: "Keo nối mi, có thể gây kích ứng/dị ứng ở một số người." },
      { title: "Removal", body: "Bước tháo gel/mi/mày đúng cách." },
    ],
    mistakes: ["Tự bóc nail gel", "Nối mi khi mắt đang đỏ/ngứa", "Chọn salon không rõ vệ sinh dụng cụ"],
  },
  "beauty-tech": {
    headline: "Thiết bị làm đẹp cần hiểu cơ chế và rủi ro trước khi mua",
    basics: [
      { title: "Đắt tiền không tự động hiệu quả hơn", body: "Thiết bị đáng mua khi bạn dùng đều, đúng chỉ định, có bảo hành và hiểu giới hạn." },
      { title: "Ánh sáng/nhiệt cần an toàn", body: "LED, IPL, laser tại nhà và máy nhiệt cần chú ý mắt, màu da, thuốc đang dùng và hướng dẫn hãng." },
      { title: "AI skin analysis là gợi ý", body: "Soi da/app có thể giúp theo dõi, nhưng không thay thế chẩn đoán da liễu." },
    ],
    visualTitle: "Ma trận đáng mua",
    visualCaption: "Thiết bị phải qua cả bốn câu hỏi trước khi xuống tiền.",
    visualNodes: [
      { label: "Vấn đề", detail: "Cần giải gì" },
      { label: "Bằng chứng", detail: "Kỳ vọng thật" },
      { label: "An toàn", detail: "Ai nên tránh" },
      { label: "Duy trì", detail: "Tần suất/bảo hành" },
    ],
    flowTitle: "Flow mua beauty tech",
    flowSteps: ["Xác định vấn đề", "Đọc chống chỉ định", "Tính giá/lần dùng", "Kiểm tra bảo hành", "Dùng theo lịch và ghi nhận"],
    glossary: [
      { title: "Contraindication", body: "Trường hợp không nên dùng hoặc cần hỏi chuyên gia trước." },
      { title: "Irradiance", body: "Cường độ ánh sáng trên diện tích, thường dùng khi nói về LED." },
      { title: "Fitzpatrick", body: "Thang phân loại màu da thường được nhắc trong laser/IPL." },
    ],
    mistakes: ["Mua vì hype mà không dùng đều", "Không bảo vệ mắt với thiết bị ánh sáng", "Dùng IPL khi màu da/lông không phù hợp hướng dẫn"],
  },
}

export function getCatalogueEducation(slug: string) {
  return catalogueEducation[slug]
}

export function getCatalogueEducationImage(slug: string) {
  if (["tri-mun", "sang-da-chong-nang", "clinic-treatment"].includes(slug)) {
    return "/images/catalogue/acne-sun-education.jpg"
  }

  if (["bodycare", "toc-da-dau", "nam-gioi"].includes(slug)) {
    return "/images/catalogue/hair-body-grooming.jpg"
  }

  if (["makeup", "mui-huong", "nails-mi-long-may", "beauty-tech"].includes(slug)) {
    return "/images/catalogue/makeup-fragrance-tech.jpg"
  }

  return "/images/catalogue/skincare-foundation.jpg"
}
