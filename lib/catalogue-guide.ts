export interface CatalogueGuide {
  updated: string
  snapshot: string
  startHere: string[]
  chooseBy: string[]
  pauseIf: string[]
  nextReads: string[]
}

export const catalogueGuides: Record<string, CatalogueGuide> = {
  "da-mat": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Skincare 2026 nghiêng về routine ngắn, phục hồi hàng rào da, chống nắng dễ dùng và chăm da theo giai đoạn sống thay vì chạy theo thật nhiều treatment.",
    startHere: [
      "Nếu mới bắt đầu, ưu tiên 3 bước: làm sạch dịu nhẹ, dưỡng ẩm vừa đủ và chống nắng ban ngày.",
      "Nếu da đang treatment, giảm số hoạt chất và theo dõi đỏ rát/bong tróc trước khi thêm sản phẩm mới.",
      "Nếu không chắc loại da, chọn theo cảm giác sau rửa mặt 30 phút: căng khô, bóng dầu, đỏ rát hay bình thường.",
    ],
    chooseBy: [
      "Da dầu mụn: gel/cream nhẹ, không quá nhiều dầu, có nhánh trị mụn riêng.",
      "Da khô/nhạy cảm: ceramide, panthenol, centella, ít hương liệu.",
      "Da xỉn màu/thâm: chống nắng ổn định trước, sau đó mới thêm vitamin C, niacinamide hoặc tranexamic acid.",
    ],
    pauseIf: [
      "Da đau rát kéo dài, bong từng mảng, nổi mụn viêm nhiều sau khi thêm treatment.",
      "Mụn nang, sẹo lõm, nám lan nhanh hoặc nghi kích ứng corticoid.",
      "Đang mang thai/sau sinh và muốn dùng retinoid, hydroquinone hoặc treatment mạnh.",
    ],
    nextReads: [
      "Routine da dầu mụn 4 bước",
      "Da treatment bị yếu nên phục hồi ra sao",
      "Kem chống nắng không bí cho khí hậu nóng ẩm",
    ],
  },
  "tri-mun": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Chăm sóc da mụn hiệu quả bắt đầu bằng việc nhận đúng loại mụn, giữ hàng rào bảo vệ da ổn định và chỉ thêm từng hoạt chất một để giảm kích ứng, thâm và sẹo.",
    startHere: [
      "Phân loại trước: mụn ẩn/bít tắc, mụn viêm, mụn đầu đen, mụn nội tiết hay mụn body.",
      "Bắt đầu bằng một hoạt chất chính, không thêm BHA, retinoid và benzoyl peroxide cùng lúc nếu da chưa quen.",
      "Giữ sữa rửa mặt dịu nhẹ, kem dưỡng phục hồi và chống nắng ổn định trong toàn bộ giai đoạn trị mụn.",
    ],
    chooseBy: [
      "Mụn ẩn: BHA hoặc retinoid tần suất thấp, theo dõi purging/kích ứng.",
      "Mụn viêm: benzoyl peroxide hoặc azelaic acid, tránh nặn khi còn đỏ đau.",
      "Mụn nội tiết/tái phát quanh cằm: ưu tiên theo dõi chu kỳ và cân nhắc bác sĩ nếu kéo dài.",
    ],
    pauseIf: [
      "Mụn đau, mụn nang, để sẹo, lan nhanh hoặc thử OTC nhiều tuần không cải thiện.",
      "Da rát, sưng, châm chích mạnh sau treatment.",
      "Đang tự phối nhiều treatment nhưng không biết sản phẩm nào gây phản ứng.",
    ],
    nextReads: [
      "Mụn ẩn khác gì purging",
      "BHA, benzoyl peroxide, azelaic acid chọn thế nào",
      "Mụn lưng và thói quen tóc/bodycare",
    ],
  },
  "sang-da-chong-nang": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Chống nắng là nền của mọi mục tiêu sáng da. Tháng 06/2026, FDA ban hành final order xác định bemotrizinol là GRASE trong các điều kiện nêu trong lệnh; lệnh dự kiến có hiệu lực ngày 09/08/2026 nếu không bị tranh chấp. Thời điểm sản phẩm xuất hiện trên kệ do nhà sản xuất quyết định.",
    startHere: [
      "Chọn kem chống nắng dùng được hằng ngày trước khi mua serum sáng da.",
      "Với thâm mụn, đặt kỳ vọng theo tuần/tháng, không theo vài ngày.",
      "Với nám/tàn nhang, dùng ngôn ngữ đều màu và bảo vệ nắng, tránh kỳ vọng trắng nhanh.",
    ],
    chooseBy: [
      "Da dầu: finish ráo, ít bí, ít cay mắt, không vón khi thoa lại.",
      "Da khô: texture cream/lotion, có dưỡng ẩm đi kèm.",
      "Đi biển/thể thao: ưu tiên chống nước, mũ/áo chống nắng và thoa lại.",
    ],
    pauseIf: [
      "Sản phẩm claim trắng cấp tốc, bong da nhanh hoặc không minh bạch thành phần.",
      "Nám lan nhanh, đậm màu sau nắng hoặc sau sinh nhưng tự dùng treatment mạnh.",
      "Đang mang thai/sau sinh và muốn dùng hoạt chất làm sáng mạnh.",
    ],
    nextReads: [
      "Kem chống nắng da dầu không bí",
      "Thâm mụn bao lâu mờ",
      "Nám sau sinh nên chăm tại nhà hay đi clinic",
    ],
  },
  "ingredient-radar": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Người dùng ngày càng đọc ingredient list kỹ hơn, nhưng xu hướng mới không phải càng nhiều hoạt chất càng tốt: ưu tiên hiểu công dụng, nồng độ, tần suất và khả năng kích ứng.",
    startHere: [
      "Chọn hoạt chất theo vấn đề chính: mụn, thâm, phục hồi, chống nắng hay lão hóa.",
      "Kiểm tra routine hiện có trước khi thêm acid, retinoid hoặc vitamin C nồng độ cao.",
      "Thêm từng sản phẩm một để biết da phản ứng với gì.",
    ],
    chooseBy: [
      "Mụn: BHA, benzoyl peroxide, azelaic acid, retinoid.",
      "Thâm/đều màu: vitamin C, niacinamide, tranexamic acid, arbutin.",
      "Phục hồi: ceramide, panthenol, centella, peptide, HA.",
    ],
    pauseIf: [
      "Sản phẩm không ghi rõ hoạt chất chính nhưng claim quá mạnh.",
      "Bạn đang mang thai/sau sinh và sản phẩm có retinoid/hydroquinone.",
      "Da đang yếu nhưng muốn thêm nhiều acid hoặc peel tại nhà.",
    ],
    nextReads: [
      "Niacinamide có cần nồng độ cao không",
      "Retinol cho người mới",
      "Ceramide và B5 phục hồi khác gì nhau",
    ],
  },
  "product-radar": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Beauty vẫn tăng trưởng nhờ social commerce và nhu cầu cá nhân hóa. Ở Việt Nam, skincare, sun care, men grooming, clean beauty và premium care là các nhóm đáng theo dõi.",
    startHere: [
      "Chọn sản phẩm theo nhu cầu trước: mụn, chống nắng, phục hồi, tóc, body hoặc makeup.",
      "So sánh giá/ml, texture, finish, mùi, khả năng kích ứng và review theo loại da.",
      "Tách sản phẩm đang viral khỏi sản phẩm thật sự hợp routine của bạn.",
    ],
    chooseBy: [
      "Dưới 200k: ưu tiên sản phẩm nền như làm sạch, dưỡng ẩm, chống nắng ổn.",
      "200-500k: cân bằng treatment/serum có công thức rõ.",
      "Luxury: chỉ đáng nâng cấp khi texture, trải nghiệm hoặc công nghệ thật sự khác.",
    ],
    pauseIf: [
      "Review chỉ có before/after quá nhanh mà thiếu cách dùng và loại da.",
      "Sản phẩm treatment không có hướng dẫn tần suất hoặc cảnh báo kích ứng.",
      "Affiliate link dày đặc nhưng thiếu tiêu chí đánh giá.",
    ],
    nextReads: [
      "Serum phục hồi đáng mua",
      "Retinol drugstore vs luxury",
      "Kem chống nắng dưới 300k cho da dầu",
    ],
  },
  bodycare: {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Bodycare đang có 'skin-care moment': retinol body serum, body wash có hoạt chất, body milk nhẹ, full-body exfoliation và fragrance layering được quan tâm mạnh hơn.",
    startHere: [
      "Xác định vùng chính: lưng/ngực, nách, đầu gối-khuỷu tay, bikini hay toàn thân.",
      "Nếu có mụn body, rà lại dầu gội/xả, mồ hôi, quần áo bó và thói quen tắm sau vận động.",
      "Nếu muốn body sáng da, dùng chống nắng body khi vùng da tiếp xúc nắng.",
    ],
    chooseBy: [
      "Mụn lưng: body wash/treatment có BHA, benzoyl peroxide hoặc acid nhẹ.",
      "Da sần/KP: lactic acid, urea, AHA body lotion.",
      "Mùi cơ thể: deodorant/antiperspirant, body mist nhẹ, vải thoáng.",
    ],
    pauseIf: [
      "Mụn body đau, có mủ, lan rộng hoặc nghi viêm nang lông nặng.",
      "Vùng nách/bikini vừa wax/cạo nhưng dùng acid mạnh ngay.",
      "Sản phẩm claim body trắng nhanh hoặc bong lột mạnh.",
    ],
    nextReads: [
      "Mụn lưng có liên quan dầu xả không",
      "Routine body sáng da an toàn",
      "Viêm nang lông nên dùng AHA, BHA hay urea",
    ],
  },
  "toc-da-dau": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Tóc và da đầu cần được tách thành hai lớp vấn đề: tình trạng da đầu như gàu, ngứa, viêm và tình trạng sợi tóc như khô xơ, gãy, chẻ ngọn. Rụng tóc kéo dài hoặc thành mảng cần được đánh giá y khoa thay vì chỉ đổi dầu gội.",
    startHere: [
      "Tách vấn đề da đầu khỏi vấn đề sợi tóc: gàu/ngứa/dầu khác với khô xơ/chẻ ngọn.",
      "Theo dõi rụng tóc theo thời gian, vùng rụng và yếu tố stress/sau sinh/thuốc.",
      "Với tóc tẩy nhuộm, ưu tiên giảm nhiệt, chống nắng tóc và phục hồi liên kết.",
    ],
    chooseBy: [
      "Da đầu dầu/gàu: dầu gội treatment theo tần suất, không chỉ gội thật mạnh.",
      "Rụng tóc: serum/scalp tonic chỉ là một phần, cần xem nguyên nhân.",
      "Tóc hư tổn: bond repair, mask tóc, leave-in và heat protectant.",
    ],
    pauseIf: [
      "Rụng tóc từng mảng, rụng nhiều kéo dài, đau/ngứa/đóng vảy.",
      "Gàu kèm đỏ rát, chảy dịch hoặc nghi nấm.",
      "Sản phẩm mọc tóc claim chắc chắn nhưng không nói rõ cơ chế.",
    ],
    nextReads: [
      "Gàu dầu hay da đầu khô",
      "Rụng tóc nam khi nào nên đi khám",
      "Bond repair có đáng tiền cho tóc tẩy nhuộm",
    ],
  },
  makeup: {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Makeup 2026 thiên về base thật da, bền trong thời tiết nóng ẩm, sản phẩm lai skincare và look theo hoàn cảnh thay vì lớp nền dày.",
    startHere: [
      "Chọn dịp trước: đi học/đi làm, đi tiệc, date, chụp ảnh hay makeup nam nhẹ.",
      "Xác định vấn đề base: mốc nền, xuống tone, bí da, lộ lỗ chân lông hay cakey.",
      "Tẩy trang sạch và dưỡng nền ổn trước khi đổi kem nền/cushion.",
    ],
    chooseBy: [
      "Da dầu: primer/setting powder hợp, nền semi-matte, test xuống tone.",
      "Da khô: skin tint/cushion ẩm, dưỡng đủ trước makeup.",
      "Môi/má/mắt: chọn theo tone da, độ bền và mức dễ tẩy trang.",
    ],
    pauseIf: [
      "Da đang mụn viêm nặng nhưng che phủ dày mỗi ngày và tẩy trang không kỹ.",
      "Mascara/eyeliner gây đỏ mắt, ngứa hoặc dùng chung tester.",
      "Nền oxy hóa mạnh nhưng vẫn cố chọn tone sáng hơn quá nhiều.",
    ],
    nextReads: [
      "Base makeup cho da dầu nóng ẩm",
      "Makeup nam nhẹ không lộ nền",
      "Son tint bền màu nhưng không khô môi",
    ],
  },
  "mui-huong": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Fragrance tiếp tục là nhóm tăng trưởng khỏe. Mùi nhẹ, skin scent, body mist, hair mist và layering đang nổi bật vì hợp thời tiết nóng và dùng hằng ngày.",
    startHere: [
      "Chọn theo hoàn cảnh: văn phòng, đi học, đi date, đi biển, gym hay buổi tối.",
      "Nếu mới dùng nước hoa, bắt đầu từ body mist/hair mist hoặc skin scent nhẹ.",
      "Test trên da thật 2-4 tiếng thay vì chỉ ngửi giấy thử.",
    ],
    chooseBy: [
      "Văn phòng: clean musk, tea, citrus, soft woods, projection vừa phải.",
      "Mùa nóng: fresh, aquatic, fruity nhẹ, body mist dễ thoa lại.",
      "Đi tối/date: amber, vanilla, woody, gourmand nhưng kiểm soát lượng xịt.",
    ],
    pauseIf: [
      "Mùi quá nồng trong không gian kín hoặc nơi làm việc.",
      "Xịt perfume alcohol cao trực tiếp lên tóc khô/yếu.",
      "Da đang kích ứng nhưng vẫn xịt hương liệu lên vùng đó.",
    ],
    nextReads: [
      "Skin scent là gì",
      "Body mist, hair mist, perfume khác nhau thế nào",
      "Nước hoa nam mùa hè không gắt",
    ],
  },
  "nam-gioi": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Men grooming tiếp tục tăng ở skincare, sun care, tóc/râu và mùi cơ thể. Cách vào tốt nhất vẫn là ít bước, dễ duy trì, không bóng nhờn.",
    startHere: [
      "Bắt đầu với rửa mặt dịu, dưỡng ẩm nhẹ và chống nắng ban ngày.",
      "Nếu da dầu mụn, đừng chỉ rửa mặt mạnh hơn; thêm treatment từ từ.",
      "Nếu chơi thể thao/gym, xử lý mồ hôi, mụn lưng và khử mùi như một routine.",
    ],
    chooseBy: [
      "Da dầu: gel cream, sunscreen ráo, sữa rửa mặt không làm căng da.",
      "Tóc/râu: chọn theo hold, shine, độ dễ gội sạch và kích ứng sau cạo.",
      "Mùi cơ thể: deodorant/antiperspirant và fragrance nhẹ, sạch.",
    ],
    pauseIf: [
      "Rụng tóc rõ vùng trán/đỉnh đầu nhưng chỉ mua serum viral.",
      "Mụn sau cạo râu đỏ đau, có mủ hoặc lan rộng.",
      "Dùng pomade/sáp gây mụn trán/lưng nhưng không gội sạch cuối ngày.",
    ],
    nextReads: [
      "Skincare nam 3 bước",
      "Pomade có gây mụn không",
      "Rụng tóc nam khi nào serum không đủ",
    ],
  },
  "clinic-treatment": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Clinic 2026 đi theo hướng kết quả tự nhiên, ít downtime, collagen banking, device stacking và cá nhân hóa. Phần quan trọng nhất vẫn là chọn đúng bác sĩ/clinic và hiểu rủi ro.",
    startHere: [
      "Xác định mục tiêu: mụn, sẹo rỗ, nám, trẻ hóa, gọn hàm, filler hay triệt lông.",
      "Hỏi rõ downtime, số buổi, biến chứng có thể gặp và aftercare trước khi làm.",
      "Ưu tiên tư vấn trực tiếp với chuyên môn phù hợp, không quyết định chỉ vì khuyến mãi.",
    ],
    chooseBy: [
      "Sẹo rỗ: subcision, TCA cross, RF microneedling, laser tùy loại sẹo.",
      "Nám/sắc tố: cần thận trọng với peel/laser vì nguy cơ tăng sắc tố sau viêm.",
      "Botox/filler: chọn người thực hiện có chuyên môn và kế hoạch xử trí biến chứng.",
    ],
    pauseIf: [
      "Clinic không giải thích rủi ro, không hỏi tiền sử bệnh/thuốc/dị ứng.",
      "Thủ thuật xâm lấn nhưng không có consent, aftercare hoặc quy trình vô khuẩn rõ.",
      "Da đang viêm/kích ứng nhưng được hối làm laser/peel ngay.",
    ],
    nextReads: [
      "Laser trị nám cần hỏi gì trước khi làm",
      "Sẹo rỗ: subcision, TCA cross, RF microneedling",
      "Botox/filler: dấu hiệu biến chứng cần biết",
    ],
  },
  "beauty-lifestyle": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Beauty lifestyle đang chuyển từ mẹo vặt sang chăm da theo bối cảnh: stress, giấc ngủ, hormone, sau sinh, tuổi tác và thói quen tập luyện.",
    startHere: [
      "Ghi lại thay đổi da theo chu kỳ, stress, giấc ngủ và sản phẩm mới trong 2-4 tuần.",
      "Routine theo tuổi nên dựa trên nhu cầu da thật, không chỉ số tuổi.",
      "Khi mang thai/sau sinh, ưu tiên sản phẩm dịu nhẹ và kiểm tra hoạt chất cần tránh.",
    ],
    chooseBy: [
      "Stress/thiếu ngủ: phục hồi, chống nắng, giảm treatment kích ứng.",
      "Sau sinh/mang thai: pregnancy-safe, tránh retinoid/hydroquinone nếu chưa hỏi bác sĩ.",
      "Fitness: làm sạch mồ hôi, chống nắng khi ngoài trời, bodycare chống ma sát.",
    ],
    pauseIf: [
      "Supplement hoặc đồ uống claim chữa mụn/nám/thải độc da.",
      "Dấu hiệu rối loạn hormone rõ nhưng chỉ đổi mỹ phẩm.",
      "Routine quá nhiều hoạt chất khiến da yếu mà vẫn tiếp tục tăng nồng độ.",
    ],
    nextReads: [
      "Mụn trước kỳ kinh chăm thế nào",
      "Pregnancy-safe beauty",
      "Treatment quá đà nhận biết ra sao",
    ],
  },
  "nails-mi-long-may": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Nails, mi và lông mày vẫn mạnh ở local service. Điểm cần bổ sung là checklist vệ sinh, dị ứng keo/gel và aftercare, không chỉ gallery mẫu đẹp.",
    startHere: [
      "Chọn dịch vụ theo dịp và khả năng duy trì: công sở, đi tiệc, du lịch hay hằng ngày.",
      "Hỏi về vệ sinh dụng cụ, loại keo/gel, cách tháo và chăm sau dịch vụ.",
      "Nếu móng/mi/mắt đang yếu hoặc kích ứng, ưu tiên phục hồi trước.",
    ],
    chooseBy: [
      "Nail gel: xem độ dày, cách tháo, bảo vệ da tay khi dùng đèn.",
      "Nối/uốn mi: chọn dáng tự nhiên, hỏi keo và dấu hiệu dị ứng.",
      "Mày: chọn theo khuôn mặt, màu tóc và maintenance thay vì chạy trend quá đà.",
    ],
    pauseIf: [
      "Đỏ mắt, sưng mí, ngứa rát sau nối mi/uốn mi.",
      "Móng đau, đổi màu, bong tách hoặc có dấu hiệu nhiễm trùng.",
      "Salon dùng chung dụng cụ không khử khuẩn rõ ràng.",
    ],
    nextReads: [
      "Gel manicure bảo vệ móng thế nào",
      "Nối mi bị ngứa đỏ nên làm gì",
      "Dáng lông mày theo khuôn mặt",
    ],
  },
  "beauty-tech": {
    updated: "Cập nhật 06/2026",
    snapshot:
      "Beauty tech tăng cùng nhu cầu chăm da tại nhà: LED mask, IPL, máy rửa mặt, hair tools và AI skin analysis. Câu hỏi chính không phải mới hay không, mà là có hợp rủi ro, ngân sách và tần suất dùng không.",
    startHere: [
      "Xác định thiết bị giải quyết vấn đề gì: mụn, lông, tóc, da xỉn, săn chắc hay theo dõi da.",
      "Tính giá/lần dùng, bảo hành, phụ kiện thay thế và khả năng duy trì.",
      "Đọc contraindications trước khi dùng LED/IPL/thiết bị nhiệt.",
    ],
    chooseBy: [
      "Máy rửa mặt: chỉ đáng nếu dùng nhẹ và da chịu được ma sát.",
      "LED mask: chọn thiết bị có thông số rõ, bảo vệ mắt và lịch dùng thực tế.",
      "IPL: kiểm tra màu da/màu lông phù hợp theo hướng dẫn hãng.",
    ],
    pauseIf: [
      "Da đang kích ứng, đang dùng thuốc gây nhạy sáng hoặc có bệnh da chưa kiểm tra.",
      "Thiết bị không có hướng dẫn an toàn mắt/da hoặc nguồn gốc bảo hành rõ.",
      "Kỳ vọng thiết bị tại nhà thay thế hoàn toàn điều trị y khoa.",
    ],
    nextReads: [
      "LED mask có đáng tiền không",
      "IPL tại nhà ai nên tránh",
      "Máy rửa mặt khi nào làm da yếu hơn",
    ],
  },
}

export function getCatalogueGuide(slug: string) {
  return catalogueGuides[slug]
}
