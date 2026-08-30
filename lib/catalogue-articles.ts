export interface CatalogueArticleBlock {
  eyebrow: string
  title: string
  paragraphs: string[]
  takeaway: string
}

export interface CatalogueArticleContent {
  deck: string
  blocks: CatalogueArticleBlock[]
  learningGoals?: string[]
  diagnosticLens?: {
    title: string
    paragraphs: string[]
    cues: string[]
  }
  careProtocol?: {
    homeTitle: string
    homeSteps: string[]
    professionalTitle: string
    professionalSigns: string[]
  }
  decisionMatrix?: {
    signal: string
    meaning: string
    action: string
  }[]
  mythReality?: {
    myth: string
    reality: string
  }[]
  references?: {
    label: string
    url: string
  }[]
}

export const catalogueArticles: Record<string, CatalogueArticleContent> = {
  "da-mat": {
    deck:
      "Skincare tốt không bắt đầu bằng một chai serum đắt tiền. Nó bắt đầu từ việc hiểu da đang thiếu gì, đang bị kích thích bởi yếu tố nào và routine hiện tại có đang giữ được hàng rào bảo vệ da hay không.",
    blocks: [
      {
        eyebrow: "Nền tảng",
        title: "Da mặt là một hệ cân bằng, không phải một bề mặt để liên tục thử hoạt chất",
        paragraphs: [
          "Làn da có nhiệm vụ giữ nước bên trong, ngăn tác nhân kích ứng từ bên ngoài và tự sửa chữa sau các va chạm nhỏ mỗi ngày. Khi hàng rào bảo vệ da hoạt động ổn, da thường ít rát, ít đỏ, ít bong tróc và chịu treatment tốt hơn. Khi hàng rào này yếu, cùng một sản phẩm từng dùng ổn cũng có thể gây châm chích hoặc nổi mụn lặt vặt.",
          "Vì vậy, routine cơ bản không hề tầm thường. Làm sạch dịu nhẹ giúp loại bỏ bụi, dầu, kem chống nắng mà không lấy đi quá nhiều lipid tự nhiên. Dưỡng ẩm giúp giảm mất nước và hỗ trợ cảm giác dễ chịu. Chống nắng giảm tác động của UV lên thâm, nám, lão hóa sớm và kích ứng sau treatment.",
        ],
        takeaway: "Nếu da đang rát, bong, đỏ hoặc nổi mụn bất thường, hãy nghĩ đến phục hồi trước khi nghĩ đến thêm treatment.",
      },
      {
        eyebrow: "Tự đánh giá",
        title: "Loại da và tình trạng da là hai câu hỏi khác nhau",
        paragraphs: [
          "Loại da là nền tương đối ổn định: dầu, khô, hỗn hợp, nhạy cảm hoặc dễ mất nước. Tình trạng da lại thay đổi theo thời điểm: mụn, thâm, xỉn màu, đỏ rát, bong tróc, bí tắc, nám hoặc lão hóa. Một người da dầu vẫn có thể thiếu nước; một người da khô vẫn có thể bị mụn nếu routine quá bí.",
          "Cách đọc đúng là tách hai tầng này. Trước tiên xem nền da thường phản ứng thế nào sau rửa mặt và trong ngày. Sau đó xem vấn đề chính đang cần xử lý là gì. Nhờ vậy, bạn không mua kem chống nắng chỉ vì 'da dầu' mà bỏ qua chuyện đang cay mắt, đang treatment hoặc đang cần finish hợp makeup.",
        ],
        takeaway: "Đừng hỏi 'da tôi nên mua gì' quá chung; hãy hỏi 'da tôi thuộc nền nào và hiện đang gặp tình trạng gì'.",
      },
      {
        eyebrow: "Áp dụng",
        title: "Một routine tốt nên có thứ tự ưu tiên rõ",
        paragraphs: [
          "Người mới nên bắt đầu bằng routine tối giản trong ít nhất một đến hai tuần: sữa rửa mặt dịu, kem dưỡng hợp cảm giác da và chống nắng ban ngày. Khi da ổn, mới thêm một hoạt chất theo vấn đề chính. Nếu thêm nhiều thứ cùng lúc, bạn sẽ không biết sản phẩm nào hiệu quả và sản phẩm nào gây kích ứng.",
          "Với da đang treatment, nguyên tắc lại càng quan trọng: giảm tần suất trước khi đổi sản phẩm; phục hồi trước khi tăng nồng độ; chống nắng đều trước khi kỳ vọng mờ thâm. Skincare không phải cuộc đua càng nhiều bước càng tốt, mà là quá trình giữ da đủ ổn để hoạt chất có cơ hội làm việc.",
        ],
        takeaway: "Routine tốt là routine bạn dùng đều được và da chịu được, không phải routine dài nhất.",
      },
    ],
  },
  "tri-mun": {
    deck:
      "Mụn là một nhóm vấn đề, không phải một bệnh cảnh duy nhất. Muốn xử lý mụn tử tế, cần phân loại mức độ bít tắc, viêm, yếu tố nội tiết, thói quen sinh hoạt và nguy cơ để lại thâm sẹo.",
    blocks: [
      {
        eyebrow: "Cơ chế",
        title: "Mụn bắt đầu từ bít tắc, dầu, vi khuẩn và phản ứng viêm",
        paragraphs: [
          "Mụn thường xuất hiện khi lỗ chân lông bị bít bởi dầu và tế bào chết. Nếu bít tắc chưa viêm, bạn có thể thấy mụn ẩn, đầu trắng hoặc đầu đen. Khi phản ứng viêm tăng lên, nốt mụn trở nên đỏ, đau, có mủ hoặc nằm sâu dưới da. Mức viêm càng cao, nguy cơ thâm đỏ, thâm nâu và sẹo càng lớn.",
          "Điểm dễ sai là nhìn mọi loại mụn như nhau. Mụn ẩn có thể cần tẩy da chết hóa học hoặc retinoid chậm rãi; mụn viêm cần giảm viêm và tránh nặn; mụn quanh cằm tái phát theo chu kỳ có thể liên quan hormone; mụn lưng lại thường liên quan mồ hôi, quần áo bó, dầu xả hoặc sản phẩm tạo kiểu tóc.",
        ],
        takeaway: "Trị mụn đúng bắt đầu bằng việc gọi đúng loại mụn.",
      },
      {
        eyebrow: "Treatment",
        title: "Hoạt chất trị mụn cần đi cùng phục hồi, không đi một mình",
        paragraphs: [
          "BHA, benzoyl peroxide, azelaic acid và retinoid đều có vai trò riêng, nhưng chúng cũng có thể làm khô, rát hoặc bong da nếu dùng quá nhanh. Khi da bị kích ứng, hàng rào bảo vệ yếu đi, mụn có thể trông tệ hơn dù bạn đang dùng nhiều sản phẩm 'trị mụn'.",
          "Cách an toàn hơn là chọn một hoạt chất chính, dùng tần suất thấp rồi tăng dần. Routine đi kèm nên có làm sạch dịu, dưỡng phục hồi và chống nắng. Với mụn viêm, việc không nặn và giảm ma sát cũng quan trọng không kém treatment.",
        ],
        takeaway: "Nếu da đang đỏ rát, đừng tăng treatment; hãy giảm tải và phục hồi.",
      },
      {
        eyebrow: "Khi cần đi khám",
        title: "Không phải mụn nào cũng nên tự xử lý bằng mỹ phẩm",
        paragraphs: [
          "Mụn nang, mụn đau, mụn để sẹo, mụn lan nhanh hoặc mụn tái phát dai dẳng sau nhiều tuần tự chăm sóc là những trường hợp nên gặp bác sĩ da liễu. Lý do không phải vì mỹ phẩm vô dụng, mà vì mức viêm và nguy cơ sẹo có thể vượt quá khả năng của sản phẩm không kê đơn.",
          "Đi khám cũng giúp tránh vòng lặp mua thêm treatment liên tục. Khi có chẩn đoán rõ, bạn biết đâu là thuốc, đâu là mỹ phẩm hỗ trợ, đâu là bước phục hồi và đâu là dấu hiệu cần tái khám.",
        ],
        takeaway: "Mụn càng đau, sâu và để sẹo, càng nên xử lý như vấn đề y khoa chứ không chỉ là vấn đề shopping.",
      },
    ],
  },
  "sang-da-chong-nang": {
    deck:
      "Sáng da an toàn không phải làm da trắng nhanh, mà là giảm tác động của nắng, viêm và tăng sắc tố để da nhìn đều màu hơn theo thời gian.",
    blocks: [
      {
        eyebrow: "Cốt lõi",
        title: "Chống nắng là điều kiện nền của mọi kế hoạch sáng da",
        paragraphs: [
          "Tia UV có thể làm thâm mụn đậm hơn, nám dai dẳng hơn và da nhanh lão hóa hơn. Nếu chống nắng không ổn định, các serum làm sáng dễ giống như đang cố dọn nước trong khi vòi vẫn mở. Vì vậy, kem chống nắng dùng được hằng ngày thường quan trọng hơn một serum sáng da đắt tiền nhưng chỉ dùng lúc nhớ lúc quên.",
          "Một kem chống nắng tốt với bạn không chỉ là chỉ số SPF. Nó phải đủ dễ chịu để dùng đủ lượng: không quá bí, không cay mắt, không vón với skincare/makeup và phù hợp hoàn cảnh đi làm, đi biển hay vận động ngoài trời.",
        ],
        takeaway: "Sản phẩm chống nắng tốt nhất là sản phẩm bạn thật sự dùng đủ và dùng đều.",
      },
      {
        eyebrow: "Sắc tố",
        title: "Thâm mụn, xỉn màu và nám không phải cùng một vấn đề",
        paragraphs: [
          "Thâm mụn thường là tăng sắc tố sau viêm, xuất hiện tại vị trí từng có mụn hoặc tổn thương. Da xỉn màu có thể đến từ thiếu ngủ, thiếu ẩm, lớp sừng tích tụ hoặc chống nắng kém. Nám lại phức tạp hơn, liên quan nắng, hormone, cơ địa và có thể cần đánh giá chuyên môn nếu lan nhanh hoặc dai dẳng.",
          "Vì khác cơ chế, chúng không nên được gom vào một lời hứa 'trắng da'. Ngôn ngữ đúng hơn là đều màu, giảm thâm, cải thiện độ rạng rỡ và kiểm soát sắc tố. Cách nói này giúp đặt kỳ vọng thực tế và tránh các sản phẩm lột tẩy mạnh.",
        ],
        takeaway: "Hãy hỏi mình đang muốn xử lý thâm, xỉn màu hay nám; mỗi vấn đề cần chiến lược khác nhau.",
      },
      {
        eyebrow: "Hoạt chất",
        title: "Hoạt chất làm sáng chỉ hiệu quả khi da đủ ổn",
        paragraphs: [
          "Vitamin C, niacinamide, tranexamic acid, arbutin hoặc acid tẩy da chết nhẹ có thể hỗ trợ da đều màu hơn, nhưng không nên thêm tất cả cùng lúc. Da đang bong rát hoặc yếu hàng rào bảo vệ sẽ dễ phản ứng khi gặp hoạt chất mới.",
          "Một flow dễ dùng là: chống nắng ổn trước, phục hồi nếu da yếu, sau đó thêm một hoạt chất làm sáng ở tần suất vừa phải. Theo dõi trong vài tuần thay vì đổi sản phẩm mỗi vài ngày.",
        ],
        takeaway: "Sáng da là bài toán chống nắng + phục hồi + hoạt chất + thời gian.",
      },
    ],
  },
  "ingredient-radar": {
    deck:
      "Ingredient Radar giúp bạn đọc sản phẩm bằng logic công thức: hoạt chất làm gì, nồng độ và nền công thức ảnh hưởng ra sao, phối trong routine thế nào và rủi ro kích ứng nằm ở đâu.",
    blocks: [
      {
        eyebrow: "Đọc label",
        title: "Một ingredient không tự quyết định toàn bộ sản phẩm",
        paragraphs: [
          "Cùng là niacinamide, vitamin C hay retinoid, trải nghiệm có thể rất khác nhau tùy nồng độ, dạng dẫn xuất, pH, nền dung môi và các thành phần hỗ trợ. Một sản phẩm có ingredient nổi tiếng nhưng texture bí, hương liệu mạnh hoặc hướng dẫn dùng không rõ vẫn có thể không hợp với bạn.",
          "Vì vậy, đọc ingredient nên bắt đầu từ nhóm công dụng thay vì săn một thành phần đơn lẻ. Sản phẩm này thuộc nhóm trị mụn, phục hồi, chống nắng, sáng da hay chống lão hóa? Nó mạnh hay nhẹ? Có phù hợp nền da hiện tại không?",
        ],
        takeaway: "Ingredient list là manh mối, không phải đáp án cuối cùng.",
      },
      {
        eyebrow: "Phối routine",
        title: "Hoạt chất mạnh cần lịch dùng, không chỉ cần nồng độ",
        paragraphs: [
          "Nhiều người kích ứng không phải vì hoạt chất sai, mà vì dùng quá dày, quá thường xuyên hoặc phối nhiều sản phẩm cùng nhóm. Acid, retinoid, benzoyl peroxide và vitamin C nồng độ cao đều cần cách vào từ từ nếu da chưa quen.",
          "Một nguyên tắc dễ nhớ: thêm một sản phẩm mới mỗi lần, bắt đầu tần suất thấp, giữ các bước còn lại ổn định. Khi có phản ứng, bạn mới biết thứ cần giảm là gì.",
        ],
        takeaway: "Routine ổn định giúp bạn đọc phản ứng da chính xác hơn.",
      },
      {
        eyebrow: "An toàn",
        title: "Một số hoạt chất cần bối cảnh đặc biệt",
        paragraphs: [
          "Da nhạy cảm, da đang treatment, phụ nữ mang thai/sau sinh hoặc người đang dùng thuốc da liễu cần thận trọng hơn với retinoid, hydroquinone, peel mạnh và một số treatment khác. Đây là lúc nên đọc cảnh báo và hỏi chuyên gia nếu không chắc.",
          "Ingredient Radar không nhằm biến người đọc thành bác sĩ, mà giúp bạn biết câu hỏi nào cần hỏi trước khi mua: hoạt chất chính là gì, dùng mấy lần/tuần, tránh phối với gì, ai nên tránh và dấu hiệu nào cần dừng.",
        ],
        takeaway: "Hiểu ingredient tốt nhất là để mua ít sai hơn và dùng an toàn hơn.",
      },
    ],
  },
  "product-radar": {
    deck:
      "Product Radar không nên là nơi gom sản phẩm đẹp mắt. Nó phải giúp người đọc đưa ra quyết định mua dựa trên nhu cầu, loại da, trải nghiệm dùng, ngân sách và rủi ro.",
    blocks: [
      {
        eyebrow: "Review có ích",
        title: "Một review tốt phải trả lời sản phẩm hợp với ai",
        paragraphs: [
          "Câu 'sản phẩm này tốt' chưa đủ. Tốt cho da dầu hay da khô? Tốt khi dùng một mình hay dưới makeup? Tốt ở khí hậu nóng ẩm hay trong phòng lạnh? Có mùi rõ không? Có cay mắt không? Có bí da nếu dùng đủ lượng không?",
          "Khi review có ngữ cảnh, người đọc mới so được sản phẩm với routine của mình. Một kem dưỡng rất hợp da khô có thể là thảm họa với da dầu mụn; một serum mạnh có thể hợp người đã quen treatment nhưng quá sức với người mới.",
        ],
        takeaway: "Review không có loại da, cách dùng và thời gian dùng thì chỉ là cảm nhận một nửa.",
      },
      {
        eyebrow: "Giá trị",
        title: "Đáng tiền là hợp nhu cầu, không chỉ là rẻ hơn",
        paragraphs: [
          "Giá trị nên được đọc theo giá/ml, tần suất dùng, khả năng dùng hết và mức độ thay thế sản phẩm khác. Một sản phẩm 500k dùng đều, không kích ứng và giải quyết đúng vấn đề có thể đáng tiền hơn ba sản phẩm 150k mua theo trend rồi bỏ dở.",
          "Với treatment, giá trị còn nằm ở độ rõ ràng của công thức và hướng dẫn dùng. Với chống nắng, giá trị nằm ở cảm giác đủ dễ chịu để dùng đủ lượng. Với makeup, giá trị nằm ở độ bền, tone phù hợp và khả năng không làm da khó chịu sau nhiều giờ.",
        ],
        takeaway: "Đừng hỏi sản phẩm có rẻ không; hãy hỏi nó có giải quyết đúng vấn đề với ít lãng phí không.",
      },
      {
        eyebrow: "Mua thông minh",
        title: "Shortlist trước, mua sau",
        paragraphs: [
          "Một flow mua hàng tốt là chọn nhu cầu chính, lọc loại da và ngân sách, so texture/finish, đọc review từ người có nền da tương tự rồi mới quyết định. Nếu sản phẩm có rủi ro kích ứng hoặc giá cao, size nhỏ/trial size là lựa chọn khôn ngoan.",
          "Product Radar nên giúp giảm nhiễu từ social commerce: viral không đồng nghĩa phù hợp, nhiều sao không đồng nghĩa ít rủi ro, và 'holy grail' của người khác không mặc định là câu trả lời cho da bạn.",
        ],
        takeaway: "Mục tiêu là mua đúng hơn, không phải mua nhiều hơn.",
      },
    ],
  },
  bodycare: {
    deck:
      "Bodycare là skincare cho toàn thân, nhưng mỗi vùng cơ thể có ma sát, mồ hôi, lông, quần áo và mức tiếp xúc nắng khác nhau. Vì vậy bodycare tốt phải đi theo vùng và vấn đề.",
    blocks: [
      {
        eyebrow: "Toàn thân",
        title: "Da body không đơn giản hơn da mặt, chỉ là ít được chú ý hơn",
        paragraphs: [
          "Lưng và ngực dễ bí do mồ hôi, dầu xả, quần áo bó hoặc sản phẩm tạo kiểu tóc. Nách và bikini có ma sát, lông, cạo/wax và nguy cơ kích ứng. Tay, chân, cổ lại thường tiếp xúc nắng nên dễ sạm và không đều màu.",
          "Nếu dùng một body lotion cho mọi vấn đề, bạn dễ bỏ sót nguyên nhân thật. Mụn lưng cần xem thói quen tắm/gội và quần áo; da sần cần nhóm làm mềm lớp sừng như urea/AHA nhẹ; mùi cơ thể cần deodorant/antiperspirant, không chỉ nước hoa.",
        ],
        takeaway: "Bodycare nên bắt đầu bằng vùng cần xử lý, không bắt đầu bằng sản phẩm đang viral.",
      },
      {
        eyebrow: "Treatment body",
        title: "Hoạt chất body vẫn có thể kích ứng",
        paragraphs: [
          "Retinol body, acid body, body wash có BHA hoặc benzoyl peroxide đang phổ biến hơn, nhưng da body không miễn nhiễm kích ứng. Vùng mới cạo/wax, vùng nách/bikini hoặc vùng đang viêm dễ phản ứng nếu dùng treatment mạnh quá sớm.",
          "Cách vào an toàn là chọn một vấn đề chính, dùng tần suất vừa phải và tăng chậm. Với body sáng da, chống nắng vùng hở vẫn là điều kiện nền. Với mụn body, làm sạch mồ hôi sau vận động và tránh residue từ dầu xả có thể quan trọng không kém treatment.",
        ],
        takeaway: "Bodycare tốt là phối thói quen + sản phẩm, không chỉ bôi hoạt chất.",
      },
      {
        eyebrow: "Mùi và cảm giác",
        title: "Mùi cơ thể là hệ nhiều lớp",
        paragraphs: [
          "Mùi cơ thể không chỉ đến từ mồ hôi mà còn từ vi khuẩn, vải mặc, thời tiết, vận động và sản phẩm dùng trên da. Deodorant giúp kiểm soát mùi, antiperspirant giúp giảm tiết mồ hôi, body mist/fragrance tạo lớp hương nhưng không thay thế vệ sinh và khử mùi.",
          "Trong khí hậu nóng ẩm, texture cũng quan trọng. Body lotion quá dính dễ khiến người dùng bỏ cuộc; body serum/lotion nhẹ, thấm nhanh và không bám quần áo thường dễ duy trì hơn.",
        ],
        takeaway: "Bodycare thành công khi người dùng chịu dùng đều mỗi ngày.",
      },
    ],
  },
  "toc-da-dau": {
    deck:
      "Tóc và da đầu nên được đọc như hai phần liên quan nhưng không giống nhau: da đầu có dầu, gàu, viêm và nang tóc; sợi tóc có hư tổn vật lý, nhiệt, màu nhuộm và độ gãy.",
    blocks: [
      {
        eyebrow: "Scalp-first",
        title: "Da đầu là da, nên cần được chăm như một vùng da thật sự",
        paragraphs: [
          "Gàu, ngứa, dầu, đỏ, bong vảy hoặc đau da đầu không chỉ là chuyện 'dầu gội không hợp'. Chúng có thể liên quan bã nhờn, nấm men, viêm da, tích tụ sản phẩm hoặc gội rửa quá mạnh. Nếu chỉ đổi sang dầu gội thơm hơn, vấn đề gốc có thể không thay đổi.",
          "Một routine da đầu nên nhìn vào tần suất gội, loại dầu gội treatment, cách xả sạch dầu xả/sản phẩm tạo kiểu và dấu hiệu cần đi khám. Da đầu đang viêm hoặc rụng tóc bất thường không nên bị che bằng styling product.",
        ],
        takeaway: "Khi da đầu có triệu chứng, hãy xử lý da đầu trước khi xử lý kiểu tóc.",
      },
      {
        eyebrow: "Sợi tóc",
        title: "Tóc hư tổn cần giảm tác động vật lý",
        paragraphs: [
          "Sợi tóc không tự lành như da. Tẩy nhuộm, nhiệt cao, kéo căng, chải khi ướt và nắng có thể làm tóc khô xơ, gãy và mất bóng. Bond repair, mask tóc, leave-in và heat protectant có thể hỗ trợ cảm giác tóc khỏe hơn, nhưng giảm nguồn hư tổn vẫn là nền.",
          "Nếu tóc nhanh bết ở chân nhưng khô ở ngọn, đừng dùng một sản phẩm cho cả đầu. Da đầu có thể cần làm sạch tốt hơn, trong khi thân tóc cần dưỡng và bảo vệ.",
        ],
        takeaway: "Haircare tốt thường phải tách chân tóc và ngọn tóc.",
      },
      {
        eyebrow: "Rụng tóc",
        title: "Rụng tóc cần nhìn mẫu rụng và thời gian",
        paragraphs: [
          "Rụng tóc sau stress, sau sinh hoặc thay đổi sinh hoạt có thể khác với hói tiến triển hoặc rụng từng mảng. Số lượng tóc rụng, vùng rụng, thời gian kéo dài và triệu chứng đi kèm như ngứa, đau, vảy là những manh mối quan trọng.",
          "Serum da đầu có thể hỗ trợ một số trường hợp, nhưng nếu rụng nhiều kéo dài, rụng thành mảng, đường ngôi rộng nhanh hoặc da đầu viêm, nên gặp chuyên gia thay vì liên tục mua sản phẩm mọc tóc viral.",
        ],
        takeaway: "Rụng tóc rõ rệt nên được theo dõi như một vấn đề sức khỏe, không chỉ là vấn đề làm đẹp.",
      },
    ],
  },
  makeup: {
    deck:
      "Makeup đẹp không chỉ là màu son hay bảng mắt. Nó là sự kết hợp giữa nền da, texture sản phẩm, ánh sáng, thời tiết, thời gian cần bền và cách tẩy trang sau đó.",
    blocks: [
      {
        eyebrow: "Base",
        title: "Nền đẹp bắt đầu từ skincare trước makeup",
        paragraphs: [
          "Nền mốc, cakey, xuống tone hoặc trượt khỏi da thường không chỉ do kem nền. Lớp dưỡng quá dày, kem chống nắng vón, da thiếu ẩm, da quá dầu hoặc lượng nền quá nhiều đều có thể làm base xấu đi. Vì vậy, base makeup nên được xem là phần nối dài của skincare.",
          "Người da dầu cần kiểm soát bóng và chọn finish bền; người da khô cần prep đủ ẩm; người có mụn cần che có chọn lọc thay vì phủ dày toàn mặt. Một lớp nền mỏng đúng chỗ thường đẹp hơn nhiều lớp nền cố che mọi thứ.",
        ],
        takeaway: "Muốn makeup đẹp, hãy sửa nền da và cách layer trước khi đổi kem nền.",
      },
      {
        eyebrow: "Hoàn cảnh",
        title: "Mỗi dịp cần một mức makeup khác nhau",
        paragraphs: [
          "Makeup đi học, đi làm, đi tiệc, chụp ảnh hoặc makeup nam nhẹ khác nhau ở độ che phủ, màu sắc, độ bền và khả năng nhìn tự nhiên ngoài đời. Một look đẹp trên camera có thể quá dày dưới ánh sáng văn phòng; một look tự nhiên ban ngày có thể nhạt khi chụp flash.",
          "Vì vậy nên chọn look theo hoàn cảnh trước khi chọn sản phẩm. Bạn cần bền mồ hôi, lên ảnh rõ, che mụn, hay chỉ làm da đều màu? Câu trả lời này quyết định foundation, concealer, powder, setting spray và màu môi/má.",
        ],
        takeaway: "Makeup không có một công thức đẹp cho mọi hoàn cảnh.",
      },
      {
        eyebrow: "Sức khỏe da",
        title: "Tẩy trang và vệ sinh dụng cụ là phần bắt buộc",
        paragraphs: [
          "Makeup nhẹ vẫn cần làm sạch đúng. Mascara, eyeliner, foundation, cushion và sunscreen có thể bám dai; nếu tẩy trang không kỹ, da dễ bí, mắt dễ kích ứng và mụn có thể nặng hơn. Cọ, mút, cushion puff dùng lại nhiều lần cũng cần vệ sinh định kỳ.",
          "Đặc biệt với eye makeup và tester công cộng, nguy cơ kích ứng/nhiễm khuẩn không nên xem nhẹ. Sản phẩm đẹp đến đâu cũng không đáng nếu làm mắt đỏ, da ngứa hoặc mụn viêm kéo dài.",
        ],
        takeaway: "Makeup đẹp phải kết thúc bằng làm sạch và chăm da tốt.",
      },
    ],
  },
  "mui-huong": {
    deck:
      "Mùi hương là trải nghiệm cá nhân nhưng vẫn có logic: nhóm note, độ tỏa, độ lưu, nhiệt độ cơ thể, thời tiết và không gian sử dụng đều ảnh hưởng đến cảm giác cuối cùng.",
    blocks: [
      {
        eyebrow: "Cấu trúc",
        title: "Một mùi không đứng yên từ lúc xịt đến lúc khô",
        paragraphs: [
          "Top notes thường là ấn tượng đầu: citrus, fruity, aromatic hoặc gia vị nhẹ. Heart notes là phần thân của mùi, thường xuất hiện rõ sau khi lớp mở đầu bay bớt. Base notes như musk, woods, amber, vanilla hoặc resin quyết định cảm giác lưu lại lâu hơn trên da.",
          "Vì mùi thay đổi theo thời gian, mua nước hoa chỉ bằng giấy thử trong vài phút rất dễ sai. Một mùi mở đầu tươi mát có thể khô xuống ngọt; một mùi tưởng nhẹ có thể tỏa mạnh trong phòng kín.",
        ],
        takeaway: "Hãy đợi drydown trên da trước khi quyết định mùi có hợp không.",
      },
      {
        eyebrow: "Không gian",
        title: "Mùi hương phải hợp nơi bạn xuất hiện",
        paragraphs: [
          "Văn phòng, lớp học, phòng gym, buổi tối, đi biển và date night cần mức độ tỏa khác nhau. Mùi quá nồng trong không gian kín có thể gây khó chịu dù bản thân nó rất đẹp. Ngược lại, body mist nhẹ có thể dễ dùng hằng ngày nhưng không đủ nổi bật cho buổi tối.",
          "Skin scent, clean musk, tea, citrus và soft woods thường dễ vào môi trường ban ngày. Amber, gourmand, vanilla, smoky woods hoặc mùi nhiều projection nên dùng tiết chế hơn, nhất là trong thời tiết nóng ẩm.",
        ],
        takeaway: "Mùi đẹp là mùi đúng khoảng cách và đúng hoàn cảnh.",
      },
      {
        eyebrow: "Layering",
        title: "Layering không phải xịt thật nhiều lớp",
        paragraphs: [
          "Layering tốt bắt đầu từ nền sạch: sữa tắm, lotion, body mist, hair mist và perfume nên cùng vibe hoặc bổ sung nhẹ cho nhau. Nếu mỗi lớp đi một hướng, tổng thể dễ bị gắt, ngọt quá hoặc lẫn mùi khó chịu.",
          "Hair mist và body mist có vai trò riêng vì thường nhẹ hơn, dễ xịt lại hơn. Perfume đậm hơn nên cần chú ý vị trí và lượng xịt. Với da nhạy cảm hương liệu, nên tránh xịt trực tiếp lên vùng đang kích ứng.",
        ],
        takeaway: "Layering thành công là làm mùi rõ hơn nhưng vẫn sạch và dễ chịu.",
      },
    ],
  },
  "nam-gioi": {
    deck:
      "Grooming nam hiệu quả nhất khi ít bước, ít bóng nhờn, dễ duy trì và giải quyết đúng vấn đề: dầu mụn, tóc/râu, mùi cơ thể, chống nắng và phục hồi sau cạo.",
    blocks: [
      {
        eyebrow: "Routine ít bước",
        title: "Đơn giản không có nghĩa là sơ sài",
        paragraphs: [
          "Routine nam cơ bản có thể chỉ cần rửa mặt, dưỡng nhẹ và chống nắng. Điểm quan trọng là cảm giác dùng: không căng rít sau rửa, không bóng nhờn sau dưỡng và chống nắng không bí trong ngày. Nếu một bước gây khó chịu, người dùng sẽ bỏ routine rất nhanh.",
          "Da nam thường được mô tả là nhiều dầu hơn hoặc dày hơn, nhưng điều đó không có nghĩa nên rửa thật mạnh. Làm sạch quá gắt có thể khiến da căng, kích ứng và vẫn tiết dầu trở lại.",
        ],
        takeaway: "Routine nam tốt là routine đủ ngắn để làm mỗi ngày và đủ đúng để da ổn hơn.",
      },
      {
        eyebrow: "Tóc và râu",
        title: "Sản phẩm tóc/râu có thể ảnh hưởng da mặt",
        paragraphs: [
          "Pomade, wax, gel tạo kiểu, dầu râu và aftershave đều có thể chạm vào trán, thái dương, má, cổ hoặc lưng. Nếu sản phẩm khó gội sạch hoặc quá nhiều dầu/hương liệu, nó có thể góp phần gây mụn trán, mụn lưng hoặc kích ứng sau cạo.",
          "Với cạo râu, vấn đề thường gặp là rát, lông mọc ngược, viêm nang lông hoặc mụn giả do cạo. Dao cạo sạch, hướng cạo phù hợp, sản phẩm làm dịu và tránh aftershave quá gắt là những điểm nền.",
        ],
        takeaway: "Grooming không chỉ là da mặt; tóc và râu cũng nằm trong routine da.",
      },
      {
        eyebrow: "Mùi và vận động",
        title: "Gym, mồ hôi và chống nắng cần được tính vào routine",
        paragraphs: [
          "Người vận động nhiều cần chú ý mồ hôi, quần áo bó, mụn body và chống nắng khi chơi ngoài trời. Nếu chỉ dùng nước hoa để che mùi mà bỏ qua tắm sau tập, khử mùi và vải thoáng, vấn đề thường quay lại rất nhanh.",
          "Sunscreen cho nam nên ưu tiên finish ráo, dễ thoa lại và không cay mắt nếu ra mồ hôi. Đây là bước dễ bị bỏ qua nhưng ảnh hưởng lớn đến thâm mụn, nám và lão hóa sớm.",
        ],
        takeaway: "Routine nam thực tế phải sống được với mồ hôi, tóc, râu và lịch sinh hoạt thật.",
      },
    ],
  },
  "clinic-treatment": {
    deck:
      "Clinic và treatment không nên được đọc như menu dịch vụ. Mỗi thủ thuật có cơ chế, chỉ định, downtime, rủi ro, người thực hiện và aftercare riêng.",
    blocks: [
      {
        eyebrow: "Tư duy đúng",
        title: "Thủ thuật là can thiệp, không phải mỹ phẩm mạnh hơn",
        paragraphs: [
          "Peel, laser, RF microneedling, TCA cross, subcision, botox và filler đều tác động vào da hoặc cấu trúc bên dưới da theo những cách khác nhau. Vì vậy, câu hỏi không chỉ là 'có hiệu quả không' mà còn là 'phù hợp với vấn đề nào, rủi ro gì, ai làm, hồi phục bao lâu'.",
          "Một dịch vụ tốt phải bắt đầu bằng đánh giá da, tiền sử kích ứng, thuốc đang dùng, kỳ vọng của khách và lựa chọn thay thế. Nếu tư vấn chỉ xoay quanh giá gói và before/after, đó là tín hiệu cần thận trọng.",
        ],
        takeaway: "Clinic tốt không bán thủ thuật trước khi hiểu vấn đề da.",
      },
      {
        eyebrow: "Rủi ro",
        title: "Downtime và biến chứng phải được nói rõ trước khi làm",
        paragraphs: [
          "Đỏ, sưng, bong, bầm, tăng sắc tố sau viêm, nhiễm trùng hoặc kết quả không đều là những khả năng cần được giải thích tùy thủ thuật. Với da dễ tăng sắc tố, peel/laser càng cần kế hoạch chống nắng và phục hồi rõ.",
          "Botox/filler cần thêm lớp an toàn khác: người thực hiện phải hiểu giải phẫu, sản phẩm sử dụng, kỹ thuật tiêm và cách xử trí biến chứng. Người dùng nên biết dấu hiệu nào là bình thường và dấu hiệu nào cần liên hệ ngay.",
        ],
        takeaway: "Không hiểu downtime và biến chứng thì chưa nên ký làm thủ thuật.",
      },
      {
        eyebrow: "Aftercare",
        title: "Kết quả không kết thúc khi rời clinic",
        paragraphs: [
          "Sau thủ thuật, da thường cần phục hồi, chống nắng, tránh nhiệt/ma sát, tránh hoạt chất mạnh và theo dõi dấu hiệu bất thường. Aftercare không phải phần phụ; nó ảnh hưởng trực tiếp đến rủi ro thâm, kích ứng và kết quả cuối.",
          "Một clinic đáng tin nên đưa hướng dẫn sau làm rõ ràng, lịch tái khám nếu cần và kênh liên hệ khi có phản ứng lạ. Người dùng cũng nên chụp lại tình trạng da, giữ hóa đơn/thông tin sản phẩm và không tự xử lý biến chứng bằng mẹo mạng.",
        ],
        takeaway: "Thủ thuật an toàn là quy trình trước, trong và sau, không chỉ là buổi làm.",
      },
    ],
  },
  "beauty-lifestyle": {
    deck:
      "Beauty lifestyle không phải lời khuyên mơ hồ về 'sống lành mạnh'. Nó là cách nhìn làn da trong bối cảnh giấc ngủ, stress, hormone, chu kỳ, tập luyện, thai kỳ/sau sinh và thói quen dùng sản phẩm.",
    blocks: [
      {
        eyebrow: "Bối cảnh",
        title: "Da thay đổi theo đời sống, không chỉ theo mỹ phẩm",
        paragraphs: [
          "Một đợt mụn có thể xuất hiện sau khi đổi kem dưỡng, nhưng cũng có thể trùng với thiếu ngủ, stress, chu kỳ kinh, thời tiết nóng, tập luyện nhiều hoặc khẩu trang/ma sát. Nếu chỉ đổi sản phẩm liên tục, bạn sẽ khó nhìn ra pattern thật.",
          "Theo dõi đơn giản trong vài tuần có thể giúp ích: ngày nổi mụn, vùng mụn, sản phẩm mới, giấc ngủ, stress, chu kỳ, tập luyện và ăn uống thay đổi. Không cần biến skincare thành bảng tính phức tạp, chỉ cần đủ dữ liệu để bớt đoán mò.",
        ],
        takeaway: "Trước khi đổi toàn bộ routine, hãy xem da đang phản ứng với đời sống nào.",
      },
      {
        eyebrow: "An toàn",
        title: "Pregnancy-safe và sau sinh cần đọc kỹ hơn",
        paragraphs: [
          "Mang thai, sau sinh hoặc đang cho con bú là giai đoạn nhiều người gặp nám, mụn, khô da hoặc rụng tóc. Đây cũng là giai đoạn cần thận trọng với một số hoạt chất mạnh như retinoid, hydroquinone hoặc thuốc/treatment đặc biệt nếu chưa có tư vấn.",
          "Routine an toàn hơn thường bắt đầu từ làm sạch dịu, dưỡng phục hồi, chống nắng và các lựa chọn hoạt chất nhẹ được cân nhắc kỹ. Khi lo ngại, hỏi bác sĩ là cách tốt hơn so với tự đọc một danh sách thành phần rời rạc.",
        ],
        takeaway: "Trong thai kỳ/sau sinh, mục tiêu là ổn định và an toàn trước, tối ưu sau.",
      },
      {
        eyebrow: "Giới hạn",
        title: "Không phải supplement hay detox nào cũng là skincare",
        paragraphs: [
          "Các claim như thải độc da, uống là hết mụn, collagen làm trắng nhanh hoặc supplement trị nám cần được đọc rất tỉnh. Dinh dưỡng và sức khỏe tổng thể có ảnh hưởng đến da, nhưng không nên biến sản phẩm uống thành lời hứa chữa vấn đề da liễu.",
          "Beauty lifestyle tốt là giúp người dùng nhận ra trigger, duy trì routine vừa sức và biết khi nào nên tìm chuyên gia. Nó không nên thay thế chẩn đoán y khoa bằng lời khuyên chung chung.",
        ],
        takeaway: "Lối sống hỗ trợ làn da, nhưng claim chữa trị cần bằng chứng và chuyên môn.",
      },
    ],
  },
  "nails-mi-long-may": {
    deck:
      "Nails, mi và lông mày là nhóm dịch vụ nhìn rất thẩm mỹ, nhưng vùng thao tác lại gần móng, mắt và da nhạy cảm. Vì vậy nội dung tốt phải nói cả mẫu đẹp lẫn vệ sinh, vật liệu và aftercare.",
    blocks: [
      {
        eyebrow: "Dịch vụ",
        title: "Đẹp trên ảnh chưa chắc dễ sống cùng hằng ngày",
        paragraphs: [
          "Một bộ nail dài, mi dày hoặc dáng mày sắc có thể rất đẹp trong ảnh nhưng bất tiện khi làm việc, đeo kính, trang điểm nhẹ hoặc duy trì nhiều tuần. Chọn dịch vụ nên tính cả phong cách cá nhân, môi trường làm việc và khả năng bảo trì.",
          "Với nail, độ dày gel, cách xử lý cuticle và cách tháo ảnh hưởng đến sức khỏe móng. Với mi, loại keo, độ dày, độ cong và vệ sinh vùng mắt quan trọng hơn việc càng dày càng đẹp. Với mày, màu sắc và form nên đi theo khuôn mặt, không chỉ trend.",
        ],
        takeaway: "Dịch vụ đẹp là dịch vụ hợp đời sống thật, không chỉ hợp ảnh chụp.",
      },
      {
        eyebrow: "An toàn",
        title: "Vệ sinh và dị ứng phải được hỏi trước",
        paragraphs: [
          "Dụng cụ không sạch, cắt khóe quá sâu, keo nối mi gây kích ứng hoặc gel/removal sai cách có thể dẫn đến đau, đỏ, sưng, yếu móng hoặc nhiễm trùng. Những dấu hiệu này không nên bị xem là 'bình thường sau làm đẹp'.",
          "Trước khi làm, người dùng nên hỏi dụng cụ được khử khuẩn thế nào, vật liệu gì được dùng, nếu dị ứng thì xử lý ra sao và cách tháo/chăm sau dịch vụ. Salon tốt thường không khó chịu khi khách hỏi các câu này.",
        ],
        takeaway: "Vệ sinh rõ ràng là một phần của chất lượng dịch vụ.",
      },
      {
        eyebrow: "Aftercare",
        title: "Tháo và phục hồi quyết định lần làm tiếp theo",
        paragraphs: [
          "Tự bóc gel, giật mi nối hoặc xử lý mày sai cách có thể làm móng/mi yếu hơn. Aftercare nên gồm cách vệ sinh, dưỡng, thời gian nghỉ giữa các lần làm và dấu hiệu cần ngừng dịch vụ.",
          "Nếu mắt đỏ, mí sưng, móng đau, móng đổi màu hoặc vùng da quanh móng viêm, nên dừng làm đẹp và xử lý an toàn trước. Đẹp bền không thể tách khỏi phục hồi.",
        ],
        takeaway: "Một dịch vụ tốt phải có kế hoạch tháo và phục hồi, không chỉ kế hoạch làm đẹp.",
      },
    ],
  },
  "beauty-tech": {
    deck:
      "Beauty tech hấp dẫn vì hứa hẹn chăm da tại nhà thông minh hơn. Nhưng thiết bị chỉ đáng mua khi bạn hiểu cơ chế, giới hạn, chống chỉ định, lịch dùng và chi phí duy trì.",
    blocks: [
      {
        eyebrow: "Cơ chế",
        title: "Thiết bị làm đẹp không phải phép màu cắm điện",
        paragraphs: [
          "LED mask, IPL, máy rửa mặt, máy nâng cơ, hair tools và AI skin analysis hoạt động theo cơ chế khác nhau. Có thiết bị tác động bằng ánh sáng, có thiết bị bằng nhiệt, rung, ma sát hoặc phân tích hình ảnh. Vì vậy không nên đánh giá chung bằng câu 'có đáng tiền không' nếu chưa biết nó giải quyết vấn đề nào.",
          "Một thiết bị tốt cần có thông số rõ, hướng dẫn dùng cụ thể, cảnh báo ai nên tránh và bảo hành minh bạch. Nếu chỉ có lời hứa trẻ hóa, sạch sâu, trị mụn hoặc triệt lông vĩnh viễn mà thiếu hướng dẫn an toàn, nên đọc kỹ hơn.",
        ],
        takeaway: "Hiểu cơ chế trước khi xem giá.",
      },
      {
        eyebrow: "An toàn",
        title: "Ánh sáng, nhiệt và ma sát đều có rủi ro",
        paragraphs: [
          "LED/IPL/laser tại nhà cần chú ý bảo vệ mắt, màu da, màu lông, thuốc gây nhạy sáng và tình trạng da đang kích ứng. Máy rửa mặt có thể làm sạch tốt hơn với một số người nhưng cũng có thể làm da yếu nếu dùng quá thường xuyên hoặc quá mạnh.",
          "Với hair tools, nhiệt cao và dùng lặp lại có thể làm tóc khô, gãy. Với AI skin analysis, kết quả nên được xem là gợi ý theo dõi, không phải chẩn đoán da liễu.",
        ],
        takeaway: "Thiết bị càng tác động mạnh, càng cần đọc chống chỉ định.",
      },
      {
        eyebrow: "Giá trị",
        title: "Tính giá theo số lần dùng và khả năng duy trì",
        paragraphs: [
          "Một thiết bị đắt nhưng dùng đều, có bảo hành và giải quyết vấn đề rõ có thể đáng hơn một món rẻ mua về bỏ ngăn kéo. Ngược lại, nếu lịch dùng quá phức tạp hoặc cảm giác dùng khó chịu, giá trị thực tế sẽ rất thấp.",
          "Trước khi mua, hãy hỏi: vấn đề của mình là gì, thiết bị này có bằng chứng/kỳ vọng thực tế ra sao, ai nên tránh, phải dùng bao lâu, có phụ kiện thay thế không và hỏng thì bảo hành thế nào.",
        ],
        takeaway: "Beauty tech đáng mua khi nó phù hợp thói quen thật, không chỉ wishlist.",
      },
    ],
  },
}

const catalogueArticleDetails: Record<string, Omit<CatalogueArticleContent, "deck" | "blocks">> = {
  "da-mat": {
    learningGoals: [
      "Phân biệt nền da, tình trạng da và phản ứng kích ứng để không mua sản phẩm theo cảm giác mơ hồ.",
      "Biết routine tối giản cần giữ những bước nào trước khi thêm acid, retinoid hoặc serum làm sáng.",
      "Nhận ra dấu hiệu da cần phục hồi hoặc cần bác sĩ thay vì tiếp tục đổi sản phẩm.",
    ],
    diagnosticLens: {
      title: "Cách đọc da trong 3 lớp: nền da, vấn đề chính, mức chịu đựng",
      paragraphs: [
        "Một trang skincare hữu ích phải giúp người đọc tự định vị trước khi mua. Lớp thứ nhất là nền da thường ngày: dầu nhiều, khô căng, hỗn hợp, dễ đỏ hay tương đối ổn. Lớp thứ hai là vấn đề đang nổi bật: mụn, thâm, nám, xỉn màu, bong tróc, lỗ chân lông, texture hay lão hóa. Lớp thứ ba là mức chịu đựng của da: da có dễ rát, ngứa, đỏ, châm chích hoặc nổi mụn sau sản phẩm mới không.",
        "Khi tách được ba lớp này, quyết định mua trở nên cụ thể hơn. Da dầu đang khỏe có thể thử BHA chậm rãi; da dầu nhưng đang bong rát lại cần phục hồi. Da khô có thâm không tự động cần acid mạnh; đôi khi chống nắng đều, dưỡng đủ và một hoạt chất dịu là hướng bền hơn.",
      ],
      cues: [
        "Sau rửa mặt 30 phút: căng, bóng dầu, đỏ rát hay bình thường.",
        "Sau sản phẩm mới 24-72 giờ: ngứa/rát lan rộng là tín hiệu giảm tải.",
        "Sau 2-4 tuần routine nền: da ổn hơn hay vẫn dễ kích ứng.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol tại nhà cho người mới",
      homeSteps: [
        "Giữ routine 3 bước trong 10-14 ngày: làm sạch dịu, dưỡng ẩm hợp cảm giác da, chống nắng ban ngày.",
        "Chỉ thêm một sản phẩm treatment mỗi lần, bắt đầu 2-3 tối/tuần nếu là hoạt chất dễ kích ứng.",
        "Ghi lại vùng bôi, tần suất, phản ứng và ảnh da trong cùng ánh sáng để tránh tự đánh giá sai.",
        "Khi da đỏ rát hoặc bong rõ, dừng hoạt chất mạnh, giữ dưỡng phục hồi và chống nắng.",
      ],
      professionalTitle: "Khi nên chuyển sang chuyên gia",
      professionalSigns: [
        "Mụn viêm đau, mụn nang, sẹo lõm hoặc thâm đậm kéo dài sau nhiều tuần.",
        "Nám lan nhanh, mảng sắc tố không đều hoặc nghi tăng sắc tố sau kích ứng.",
        "Da sưng, rát kéo dài, chảy dịch, đóng mài hoặc nghi viêm da tiếp xúc.",
        "Đang mang thai/sau sinh và muốn dùng retinoid, hydroquinone hoặc treatment mạnh.",
      ],
    },
    decisionMatrix: [
      { signal: "Da căng rát sau rửa", meaning: "Làm sạch quá gắt hoặc barrier đang yếu", action: "Đổi cleanser dịu, thêm dưỡng phục hồi, tạm hoãn acid/retinoid" },
      { signal: "Bóng dầu nhưng bong quanh miệng", meaning: "Da dầu có thể đang thiếu nước/kích ứng", action: "Giảm treatment, dùng dưỡng nhẹ, xem lại tần suất rửa mặt" },
      { signal: "Thâm mụn mãi không mờ", meaning: "Viêm và UV có thể kéo dài sắc tố", action: "Ổn định chống nắng, kiểm soát mụn mới, thêm làm sáng dịu khi da khỏe" },
      { signal: "Mỗi tuần đổi một routine", meaning: "Không đủ dữ liệu để biết sản phẩm nào hiệu quả", action: "Cố định routine nền, test từng sản phẩm trong vài tuần" },
    ],
    mythReality: [
      { myth: "Da dầu thì không cần dưỡng ẩm.", reality: "Da dầu vẫn cần dưỡng phù hợp; bỏ dưỡng có thể khiến da khó chịu và treatment kém dung nạp." },
      { myth: "Càng nhiều serum càng nhanh đẹp.", reality: "Nhiều hoạt chất cùng lúc thường làm tăng rủi ro kích ứng hơn là tăng hiệu quả." },
      { myth: "Châm chích nghĩa là sản phẩm đang hoạt động.", reality: "Châm chích nhẹ thoáng qua có thể xảy ra, nhưng rát kéo dài, đỏ, ngứa là tín hiệu cần dừng." },
    ],
    references: [
      { label: "AAD: Dermatologist-approved pregnancy skin care", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care" },
      { label: "AAD: Retinoid or retinol?", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol" },
      { label: "AAD: A dermatologist's guide to skincare", url: "https://www.aad.org/news/dermatologist-guide-skincare" },
    ],
  },
  "tri-mun": {
    learningGoals: [
      "Gọi đúng loại mụn trước khi chọn treatment.",
      "Biết vì sao trị mụn phải đi cùng phục hồi và chống nắng.",
      "Nhận ra ranh giới giữa mụn có thể chăm tại nhà và mụn cần bác sĩ.",
    ],
    diagnosticLens: {
      title: "Mụn nên được đọc theo mức viêm và nguy cơ sẹo",
      paragraphs: [
        "Mụn không viêm như đầu trắng, đầu đen, mụn ẩn thường là câu chuyện bít tắc. Mụn đỏ, đau, mủ hoặc nang sâu là câu chuyện viêm mạnh hơn. Mức viêm quyết định độ thận trọng: mụn càng đau và sâu, càng không nên tự nặn hoặc liên tục đổi treatment mạnh.",
        "Các hướng dẫn da liễu hiện đại vẫn xem benzoyl peroxide, retinoid, salicylic acid và azelaic acid là nhóm thường gặp trong chăm sóc mụn, nhưng cách dùng quan trọng không kém tên hoạt chất. Da kích ứng sẽ làm thâm và đỏ sau mụn dai hơn, đặc biệt khi chống nắng kém.",
      ],
      cues: [
        "Mụn ẩn/đầu đen: bề mặt gồ, ít đau, thường cần thời gian.",
        "Mụn viêm: đỏ, đau, có mủ, dễ thâm nếu nặn.",
        "Mụn nang/sẹo: đau sâu, tái phát, cần đánh giá chuyên môn sớm.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol trị mụn tại nhà",
      homeSteps: [
        "Giữ cleanser dịu, dưỡng phục hồi và chống nắng hằng ngày.",
        "Chọn một hoạt chất chính: BHA cho bít tắc, benzoyl peroxide/azelaic cho viêm nhẹ, retinoid khi cần kiểm soát comedone lâu dài.",
        "Dùng tần suất thấp rồi tăng dần; không phối tất cả treatment ngay tuần đầu.",
        "Không nặn mụn đỏ đau; ưu tiên giảm viêm, giảm ma sát và giữ vệ sinh vật chạm da.",
      ],
      professionalTitle: "Khi mụn không còn là chuyện tự shopping",
      professionalSigns: [
        "Mụn nang, đau sâu, lan nhanh hoặc để sẹo.",
        "Mụn không cải thiện sau nhiều tuần chăm đúng và đều.",
        "Mụn quanh cằm tái phát theo chu kỳ kèm dấu hiệu nội tiết.",
        "Mụn gây thâm nặng, tự ti hoặc khiến bạn mua treatment liên tục không kiểm soát.",
      ],
    },
    decisionMatrix: [
      { signal: "Mụn ẩn dày nhưng ít đau", meaning: "Bít tắc là vấn đề chính", action: "Dùng BHA/retinoid chậm, tránh scrub và theo dõi 6-8 tuần" },
      { signal: "Mụn đỏ đau có mủ", meaning: "Viêm đang nổi bật", action: "Không nặn, cân nhắc benzoyl peroxide/azelaic và phục hồi" },
      { signal: "Da bong rát sau treatment", meaning: "Hàng rào bảo vệ đang quá tải", action: "Giảm tần suất, dưỡng phục hồi, chống nắng kỹ" },
      { signal: "Mụn để sẹo lõm", meaning: "Nguy cơ tổn thương lâu dài", action: "Ưu tiên bác sĩ da liễu thay vì tự thử thêm mỹ phẩm" },
    ],
    mythReality: [
      { myth: "Mụn phải làm khô thật nhanh mới hết.", reality: "Làm khô quá mức có thể làm da kích ứng, bong rát và khó dùng treatment lâu dài." },
      { myth: "Purging là mọi đợt nổi mụn sau sản phẩm mới.", reality: "Purging thường có bối cảnh hoạt chất thúc đẩy turnover và xảy ra vùng hay có mụn; mụn lạ lan rộng có thể là kích ứng." },
      { myth: "Nặn hết nhân là cách trị mụn nhanh.", reality: "Nặn mụn viêm sai cách làm tăng nguy cơ thâm, nhiễm trùng và sẹo." },
    ],
    references: [
      { label: "AAD: Acne clinical guideline highlights", url: "https://www.aad.org/member/clinical-quality/guidelines/acne" },
      { label: "AAD: How to treat different types of acne", url: "https://www.aad.org/public/diseases/acne/diy/types-breakouts" },
      { label: "AAD: Adult acne treatment dermatologists recommend", url: "https://www.aad.org/public/diseases/acne/diy/adult-acne-treatment" },
    ],
  },
  "sang-da-chong-nang": {
    learningGoals: [
      "Hiểu chống nắng là điều kiện nền của sáng da, trị thâm và chống lão hóa sớm.",
      "Phân biệt thâm mụn, xỉn màu, nám và tàn nhang để đặt kỳ vọng đúng.",
      "Biết đọc SPF, broad-spectrum, water-resistant và cập nhật bemotrizinol 2026.",
    ],
    diagnosticLens: {
      title: "Sáng da an toàn là kiểm soát ánh sáng, viêm và sắc tố",
      paragraphs: [
        "Nếu không chống nắng đều, mọi kế hoạch làm sáng đều bị kéo lùi. UV và ánh sáng nhìn thấy có thể làm thâm, nám và tăng sắc tố sau viêm dai hơn. Vì vậy, sản phẩm quan trọng nhất trong routine sáng da thường không phải serum, mà là kem chống nắng bạn dùng đủ lượng và thoa lại được.",
        "Cập nhật đáng chú ý trong năm 2026 là FDA đã ban hành final order cho bemotrizinol; lệnh dự kiến có hiệu lực ngày 09/08/2026 nếu không bị tranh chấp, và sản phẩm có mặt khi nào còn tùy nhà sản xuất. Điều này không làm thay đổi nguyên tắc nền: chọn SPF 30 trở lên, broad-spectrum, water-resistant khi cần, kết hợp mũ, kính và tránh nắng.",
      ],
      cues: [
        "Thâm mụn nằm đúng vị trí mụn cũ và thường đậm hơn khi nắng nhiều.",
        "Xỉn màu toàn mặt có thể đến từ thiếu ẩm, lớp sừng tích tụ hoặc ngủ/stress.",
        "Nám thường dai, đối xứng, liên quan nắng/hormone và cần chống nắng nghiêm túc.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol sáng da tại nhà",
      homeSteps: [
        "Chọn chống nắng SPF 30+, broad-spectrum, finish đủ dễ chịu để dùng hằng ngày.",
        "Dùng đủ lượng, thoa lại khi ra nắng, đổ mồ hôi hoặc sau thời gian kháng nước công bố.",
        "Khi da ổn, thêm một hoạt chất làm sáng như vitamin C, niacinamide, tranexamic acid hoặc azelaic acid tùy vấn đề.",
        "Giữ phục hồi để tránh kích ứng, vì kích ứng có thể làm tăng sắc tố sau viêm.",
      ],
      professionalTitle: "Khi nên hỏi bác sĩ/clinic",
      professionalSigns: [
        "Nám lan nhanh, đậm màu hoặc tái phát dù chống nắng đều.",
        "Sản phẩm làm trắng gây bong lột, rát, đỏ hoặc nghi chứa thành phần không minh bạch.",
        "Tăng sắc tố sau viêm kéo dài và ảnh hưởng nhiều đến tâm lý.",
        "Muốn peel/laser/thuốc bôi mạnh nhưng chưa đánh giá loại da và rủi ro PIH.",
      ],
    },
    decisionMatrix: [
      { signal: "Kem chống nắng cay mắt", meaning: "Sản phẩm khó dùng đủ lượng", action: "Đổi texture/màng lọc, test quanh mắt, dùng kính/mũ hỗ trợ" },
      { signal: "Thâm đậm hơn sau nắng", meaning: "Bảo vệ UV chưa đủ", action: "Tăng che chắn, thoa lại, cân nhắc tinted sunscreen nếu hợp" },
      { signal: "Serum sáng da làm rát", meaning: "Da chưa chịu được hoạt chất", action: "Giảm tần suất, phục hồi, tránh phối nhiều acid" },
      { signal: "Nám dai nhiều tháng", meaning: "Cơ chế sắc tố phức tạp", action: "Tư vấn chuyên môn trước khi peel/laser hoặc dùng thuốc mạnh" },
    ],
    mythReality: [
      { myth: "Ở trong nhà không cần chống nắng.", reality: "Nếu gần cửa sổ, ra ngoài ngắn hoặc đang trị thâm/nám, chống nắng vẫn rất quan trọng." },
      { myth: "SPF càng cao thì khỏi cần thoa lại.", reality: "Mồ hôi, nước, ma sát và thời gian vẫn làm giảm lớp bảo vệ." },
      { myth: "Sáng da là trắng bật tone thật nhanh.", reality: "Mục tiêu an toàn là đều màu, giảm thâm và hạn chế tăng sắc tố mới." },
    ],
    references: [
      { label: "AAD: How to select a sunscreen", url: "https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-select-sunscreen" },
      { label: "AAD: How to decode sunscreen labels", url: "https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/understand-sunscreen-labels" },
      { label: "FDA: Sunscreen latest news and bemotrizinol", url: "https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun" },
    ],
  },
  "ingredient-radar": {
    learningGoals: [
      "Đọc ingredient theo nhóm công dụng thay vì săn một thành phần đơn lẻ.",
      "Biết nồng độ, nền công thức, pH và tần suất có thể đổi trải nghiệm sản phẩm.",
      "Nhận ra nhóm hoạt chất cần thận trọng khi mang thai/sau sinh hoặc da đang yếu.",
    ],
    diagnosticLens: {
      title: "Ingredient list là bản đồ rủi ro và cơ hội, không phải bảng xếp hạng",
      paragraphs: [
        "Một công thức tốt là tổng hòa giữa hoạt chất chính, chất nền, chất làm dịu, chất bảo quản, texture và hướng dẫn dùng. Việc chỉ nhìn tên niacinamide, retinol hay vitamin C rồi kết luận sản phẩm mạnh/yếu thường thiếu bối cảnh.",
        "Cách đọc đáng tin hơn là xác định nhóm công dụng, sau đó kiểm tra da của bạn có chịu được nhóm đó không. Retinoid có thể hữu ích cho mụn và lão hóa, nhưng cần tránh trong thai kỳ và phải vào chậm. Acid có thể hỗ trợ texture, nhưng da đang bong rát không nên được xử lý bằng thêm acid.",
      ],
      cues: [
        "Hoạt chất chính nằm ở đâu trong câu chuyện sản phẩm: mụn, sáng da, phục hồi hay chống nắng.",
        "Sản phẩm có hướng dẫn tần suất, cảnh báo phối hợp và nhóm nên tránh hay không.",
        "Routine hiện tại đã có hoạt chất cùng nhóm chưa.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol thêm hoạt chất",
      homeSteps: [
        "Chọn một vấn đề chính và một hoạt chất chính tương ứng.",
        "Giữ các bước còn lại ổn định để đọc phản ứng da.",
        "Dùng tần suất thấp trong 2 tuần đầu với acid/retinoid hoặc sản phẩm dễ kích ứng.",
        "Nếu rát, đỏ, ngứa kéo dài: giảm tần suất hoặc dừng, không cố 'chịu đau cho đẹp'.",
      ],
      professionalTitle: "Khi ingredient cần chuyên môn",
      professionalSigns: [
        "Đang mang thai/sau sinh và muốn dùng retinoid, hydroquinone hoặc thuốc trị mụn.",
        "Da viêm, chảy dịch, phù nề hoặc nghi dị ứng tiếp xúc.",
        "Muốn phối thuốc kê đơn với nhiều mỹ phẩm hoạt chất.",
        "Nám, mụn nang, sẹo hoặc rụng tóc đang được điều trị y khoa.",
      ],
    },
    decisionMatrix: [
      { signal: "Sản phẩm claim mạnh nhưng không nói hoạt chất", meaning: "Minh bạch thấp", action: "Đọc kỹ INCI, tránh kỳ vọng như thuốc điều trị" },
      { signal: "Routine đã có retinoid", meaning: "Da đã chịu tải turnover", action: "Cẩn trọng khi thêm acid/vitamin C mạnh cùng giai đoạn" },
      { signal: "Da nhạy cảm với hương liệu", meaning: "Rủi ro kích ứng cảm quan cao", action: "Ưu tiên công thức ít hương liệu, patch test" },
      { signal: "Hoạt chất pregnancy-risk", meaning: "Bối cảnh cá nhân quan trọng", action: "Hỏi bác sĩ trước khi dùng" },
    ],
    mythReality: [
      { myth: "Thành phần càng đứng đầu càng luôn tốt.", reality: "Nồng độ cao không tự động phù hợp; một số hoạt chất hiệu quả ở tỷ lệ thấp." },
      { myth: "Natural luôn dịu hơn synthetic.", reality: "Nguồn gốc không quyết định kích ứng; tinh dầu/hương liệu tự nhiên vẫn có thể gây phản ứng." },
      { myth: "Có peptide/ceramide/retinol là sản phẩm chắc chắn hiệu quả.", reality: "Hiệu quả còn phụ thuộc công thức, bao bì, tần suất và nền da." },
    ],
    references: [
      { label: "AAD: Pregnancy skin care ingredients to avoid", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care" },
      { label: "AAD: Retinoid or retinol?", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol" },
      { label: "AAD: Acne guideline highlights", url: "https://www.aad.org/member/clinical-quality/guidelines/acne" },
    ],
  },
  "product-radar": {
    learningGoals: [
      "Đọc review theo người dùng phù hợp, không theo điểm số chung.",
      "Tính giá trị bằng khả năng dùng hết, độ hợp routine và rủi ro bỏ dở.",
      "Biết xây shortlist trước khi mua để giảm nhiễu từ social commerce.",
    ],
    diagnosticLens: {
      title: "Một sản phẩm tốt phải trả lời được bốn câu: cho ai, lúc nào, dùng sao, rủi ro gì",
      paragraphs: [
        "Product Radar nên giúp người dùng mua ít sai hơn. Điều này nghĩa là mỗi sản phẩm cần được đặt vào bối cảnh: loại da, khí hậu, routine đi kèm, finish, mùi, khả năng kích ứng, giá/ml và thời gian dùng.",
        "Review có ích không chỉ nói 'thích' hay 'không thích'. Nó giải thích trải nghiệm sau nhiều lần dùng, ai nên tránh, điểm yếu nào có thể chấp nhận được và sản phẩm nào có thể thay thế cùng vai trò.",
      ],
      cues: [
        "Review có loại da, khí hậu và routine đi kèm hay không.",
        "Có phân biệt cảm giác ban đầu và kết quả sau vài tuần hay không.",
        "Có nói rõ nhược điểm, nhóm nên tránh và cách dùng hay không.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol shortlist trước khi mua",
      homeSteps: [
        "Viết một nhu cầu chính: chống nắng không cay mắt, dưỡng phục hồi, BHA cho mụn ẩn, v.v.",
        "Lọc theo loại da, texture, finish, ngân sách và mức chịu hương liệu.",
        "So 2-3 lựa chọn bằng giá/ml, cách dùng, review cùng nền da và rủi ro kích ứng.",
        "Ưu tiên size nhỏ/trial nếu sản phẩm đắt, mạnh hoặc dễ không hợp.",
      ],
      professionalTitle: "Khi không nên giải quyết bằng mua thêm",
      professionalSigns: [
        "Vấn đề có dấu hiệu bệnh lý: mụn nang, viêm, chảy dịch, đau hoặc rụng tóc rõ.",
        "Bạn đã đổi nhiều sản phẩm nhưng da xấu hơn và không biết nguyên nhân.",
        "Claim sản phẩm giống thuốc điều trị nhưng không có tư vấn phù hợp.",
        "Sản phẩm dùng quanh mắt/môi gây đỏ, ngứa, sưng hoặc đau.",
      ],
    },
    decisionMatrix: [
      { signal: "Review toàn khen texture", meaning: "Có thể thiếu dữ liệu hiệu quả", action: "Tìm review dài hơn và bối cảnh routine" },
      { signal: "Giá rẻ nhưng dung tích nhỏ", meaning: "Giá/ml có thể không hề rẻ", action: "Tính lại chi phí dùng thật" },
      { signal: "Viral mạnh trên TikTok", meaning: "Nhiễu social proof cao", action: "So với nhu cầu và nền da của bạn trước" },
      { signal: "Sản phẩm treatment không có hướng dẫn", meaning: "Rủi ro dùng sai cao", action: "Chọn sản phẩm minh bạch hơn hoặc hỏi chuyên gia" },
    ],
    mythReality: [
      { myth: "Nhiều sao nghĩa là hợp với mình.", reality: "Điểm số trung bình không thay thế loại da, routine và cảm giác cá nhân." },
      { myth: "Luxury luôn tốt hơn drugstore.", reality: "Luxury có thể hơn về texture/trải nghiệm, nhưng fit với da mới quyết định đáng tiền." },
      { myth: "Dupe là giống y hệt.", reality: "Dupe thường chỉ gần về cảm giác hoặc vai trò, không nhất thiết giống công thức và hiệu quả." },
    ],
    references: [
      { label: "FDA: Using cosmetics safely", url: "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely" },
      { label: "FDA: Microbiological safety and cosmetics", url: "https://www.fda.gov/cosmetics/potential-contaminants-cosmetics/microbiological-safety-and-cosmetics" },
      { label: "AAD: Skincare from growing up to glowing up", url: "https://www.aad.org/news/dermatologist-guide-skincare" },
    ],
  },
  bodycare: {
    learningGoals: [
      "Đọc bodycare theo vùng: lưng, ngực, nách, bikini, tay chân, bàn chân.",
      "Phân biệt mụn body, viêm nang lông, KP, thâm do ma sát và mùi cơ thể.",
      "Biết khi nào sản phẩm body tại nhà không đủ và cần khám.",
    ],
    diagnosticLens: {
      title: "Bodycare tốt phải bắt đầu từ vùng da và ma sát",
      paragraphs: [
        "Da body chịu nhiều yếu tố mà mặt ít gặp hơn: quần áo bó, mồ hôi, dầu xả chảy xuống lưng, cạo/wax, lông mọc ngược, khử mùi và nắng trên tay chân. Vì vậy một lotion toàn thân không thể trả lời mọi vấn đề.",
        "Mụn lưng cần nhìn cả thói quen gội xả và tắm sau vận động. Nách thâm cần đọc ma sát, cạo/wax và kích ứng. KP cần làm mềm lớp sừng đều đặn, không chà xát mạnh. Mùi cơ thể cần khử mùi/giảm mồ hôi và vải mặc, không chỉ phủ nước hoa.",
      ],
      cues: [
        "Mụn lưng tăng sau dầu xả, gym hoặc áo bó.",
        "Nách/bikini rát sau wax/cạo hoặc sau acid/deodorant mới.",
        "Da sần đối xứng ở tay/đùi thường cần làm mềm đều, không scrub mạnh.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol bodycare tại nhà",
      homeSteps: [
        "Chọn một vùng ưu tiên và một vấn đề chính.",
        "Sửa trigger cơ học trước: mồ hôi, quần áo bó, cạo/wax, dầu xả, ma sát.",
        "Thêm hoạt chất nhẹ như AHA/BHA/urea hoặc benzoyl peroxide body wash tùy vấn đề.",
        "Chống nắng vùng hở nếu mục tiêu là đều màu hoặc giảm thâm.",
      ],
      professionalTitle: "Khi bodycare cần khám",
      professionalSigns: [
        "Mụn body đau, có mủ, lan rộng hoặc tái phát dày.",
        "Vùng da đỏ nóng, sưng, chảy dịch hoặc đau sau waxing/nail/body treatment.",
        "Nghi nấm, viêm nang lông nặng hoặc mùi cơ thể thay đổi bất thường.",
        "Thâm/sần không cải thiện dù đã giảm ma sát và chăm đều nhiều tuần.",
      ],
    },
    decisionMatrix: [
      { signal: "Mụn lưng ở vùng dầu xả chảy", meaning: "Residue tóc có thể góp phần bí tắc", action: "Xả tóc kỹ, tắm body sau cùng, đổi sản phẩm tóc nếu cần" },
      { signal: "Nách thâm kèm rát", meaning: "Kích ứng/ma sát có thể là nguyên nhân", action: "Ngưng acid mạnh, đổi deodorant dịu, phục hồi trước" },
      { signal: "Da sần như da gà", meaning: "KP/lớp sừng dày là khả năng cần nghĩ tới", action: "Dùng urea/AHA đều, tránh scrub thô" },
      { signal: "Mùi vẫn rõ sau nước hoa", meaning: "Perfume không thay thế khử mùi", action: "Xem deodorant/antiperspirant, vải, tắm sau vận động" },
    ],
    mythReality: [
      { myth: "Body thì dùng treatment mạnh hơn mặt cũng được.", reality: "Vùng nách/bikini/cổ vẫn rất dễ kích ứng, nhất là sau cạo/wax." },
      { myth: "Scrub càng mạnh da càng mịn.", reality: "Chà xát quá mức có thể làm viêm và thâm nặng hơn." },
      { myth: "Mùi cơ thể chỉ cần nước hoa.", reality: "Nước hoa tạo hương, còn mồ hôi/vi khuẩn/vải mặc cần xử lý riêng." },
    ],
    references: [
      { label: "AAD: How to treat different types of acne", url: "https://www.aad.org/public/diseases/acne/diy/types-breakouts" },
      { label: "AAD: Prevent another nail infection", url: "https://www.aad.org/public/diseases/a-z/prevent-another-nail-infection" },
      { label: "FDA: Using cosmetics safely", url: "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely" },
    ],
  },
  "toc-da-dau": {
    learningGoals: [
      "Tách da đầu, nang tóc và thân tóc trước khi mua dầu gội/serum/mask.",
      "Nhận ra rụng tóc nào có thể theo dõi và rụng tóc nào cần bác sĩ.",
      "Biết bảo vệ tóc khỏi nhiệt, hóa chất, kéo căng và tích tụ sản phẩm.",
    ],
    diagnosticLens: {
      title: "Haircare tốt bắt đầu từ câu hỏi: da đầu hay sợi tóc?",
      paragraphs: [
        "Da đầu là da: có dầu, gàu, ngứa, viêm, đau, vảy và nang tóc. Sợi tóc là vật liệu đã mọc ra: khô, xơ, gãy, chẻ, mất bóng vì nhiệt, tẩy nhuộm hoặc kéo căng. Nếu gộp hai phần này, bạn dễ mua mask tóc cho vấn đề gàu hoặc mua dầu gội mạnh cho tóc tẩy đang gãy.",
        "Rụng tóc cần được nhìn theo mẫu rụng và thời gian. Rụng nhiều sau stress/sau sinh có thể khác hói tiến triển hoặc rụng từng mảng. AAD nhấn mạnh bác sĩ da liễu có thể cần kiểm tra sức khỏe tóc, xét nghiệm hoặc sinh thiết da đầu khi nghi nguyên nhân bệnh lý, thiếu hụt, hormone hoặc nhiễm trùng.",
      ],
      cues: [
        "Ngứa, đỏ, vảy, đau: ưu tiên da đầu.",
        "Khô xơ, gãy, chẻ: ưu tiên thân tóc và giảm nhiệt/hóa chất.",
        "Rụng từng mảng, rụng đột ngột, đường ngôi rộng nhanh: cần đánh giá sớm.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol tóc/da đầu tại nhà",
      homeSteps: [
        "Chọn vấn đề chính: gàu/dầu/ngứa, rụng tóc hay hư tổn thân tóc.",
        "Dùng dầu gội treatment đúng tần suất nếu có gàu/dầu; xả sạch dầu xả khỏi da đầu.",
        "Với tóc hư tổn, giảm nhiệt, dùng heat protectant, mask/leave-in và tránh kéo căng.",
        "Theo dõi rụng tóc bằng ảnh đường ngôi, vùng thái dương và lượng rụng theo tuần.",
      ],
      professionalTitle: "Khi nên khám da đầu/tóc",
      professionalSigns: [
        "Rụng tóc từng mảng, rụng đột ngột hoặc rụng nhiều kéo dài.",
        "Da đầu đỏ, đau, ngứa dữ, đóng vảy, chảy dịch hoặc có mùi lạ.",
        "Đường ngôi rộng nhanh, hói vùng thái dương/đỉnh rõ.",
        "Rụng tóc kèm mệt mỏi, sau sinh phức tạp, thuốc mới hoặc dấu hiệu hormone.",
      ],
    },
    decisionMatrix: [
      { signal: "Chân tóc bết nhưng ngọn khô", meaning: "Da đầu và thân tóc cần hai chiến lược", action: "Làm sạch da đầu, dưỡng từ thân đến ngọn, tránh bôi dầu sát chân" },
      { signal: "Gàu kèm đỏ ngứa", meaning: "Có thể là viêm da đầu/nấm men", action: "Dùng treatment phù hợp, đi khám nếu dai dẳng hoặc nặng" },
      { signal: "Tóc gãy giữa thân", meaning: "Hư tổn vật lý/hóa chất", action: "Giảm nhiệt/tẩy, thêm bảo vệ nhiệt và dưỡng thân tóc" },
      { signal: "Rụng thành mảng tròn", meaning: "Có thể là alopecia areata hoặc vấn đề y khoa", action: "Đặt lịch bác sĩ da liễu" },
    ],
    mythReality: [
      { myth: "Gội càng ít tóc càng khỏe.", reality: "Tần suất gội phải hợp da đầu; để dầu/gàu tích tụ có thể làm da đầu khó chịu hơn." },
      { myth: "Serum mọc tóc xử lý mọi kiểu rụng.", reality: "Rụng tóc có nhiều nguyên nhân; serum không thay thế chẩn đoán." },
      { myth: "Tóc hư tổn có thể phục hồi như da.", reality: "Sợi tóc không tự lành hoàn toàn; giảm nguồn hư tổn là nền quan trọng." },
    ],
    references: [
      { label: "AAD: Hair loss diagnosis and treatment", url: "https://www.aad.org/public/diseases/hair-loss/treatment/diagnosis-treat" },
      { label: "AAD: Hair loss signs and symptoms", url: "https://www.aad.org/public/diseases/hair-loss/insider/begin" },
      { label: "AAD: Hair shedding or hair loss", url: "https://www.aad.org/public/diseases/hair-loss/insider/shedding" },
    ],
  },
  makeup: {
    learningGoals: [
      "Chọn makeup theo nền da, hoàn cảnh và thời gian cần bền.",
      "Biết vì sao base makeup phụ thuộc skincare, chống nắng và cách layer.",
      "Nhận ra rủi ro vệ sinh với mắt, tester và dụng cụ trang điểm.",
    ],
    diagnosticLens: {
      title: "Makeup là bài toán ánh sáng, texture và vệ sinh",
      paragraphs: [
        "Một lớp nền đẹp ngoài đời không chỉ do foundation. Nó phụ thuộc da có đủ ẩm không, kem chống nắng có vón không, lượng nền có quá dày không, ánh sáng nơi bạn xuất hiện và thời tiết có làm dầu/mồ hôi phá lớp nền không.",
        "Makeup cũng có ranh giới an toàn. FDA khuyến cáo không dùng mỹ phẩm không dành cho vùng mắt gần mắt, không thêm nước/bọt vào mascara, không dùng chung eye makeup và nên bỏ eye makeup nếu có nhiễm trùng mắt. Điều này đặc biệt quan trọng với tester công cộng, mascara, eyeliner, mi giả và kính áp tròng.",
      ],
      cues: [
        "Nền mốc: xem dưỡng ẩm, lượng phấn, vùng khô và cách tán.",
        "Nền trượt: xem dầu, primer, powder, setting và khí hậu.",
        "Mắt đỏ/ngứa: dừng sản phẩm mắt, kiểm tra vệ sinh và hạn dùng.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol makeup hằng ngày",
      homeSteps: [
        "Prep da nhẹ: dưỡng vừa đủ, chống nắng không vón, chờ ổn trước nền.",
        "Chọn độ che phủ theo dịp; che điểm thay vì phủ dày toàn mặt nếu da dễ bí.",
        "Vệ sinh cọ/mút định kỳ, tránh dùng chung sản phẩm mắt/môi.",
        "Tẩy trang kỹ nhưng dịu, theo dõi mụn/kích ứng sau các ngày makeup dày.",
      ],
      professionalTitle: "Khi makeup gây vấn đề cần xử lý",
      professionalSigns: [
        "Mắt đỏ, đau, chảy nước hoặc nghi nhiễm trùng sau eye makeup.",
        "Da nổi mụn viêm hoặc viêm da tiếp xúc sau nhiều lần dùng sản phẩm mới.",
        "Makeup che mụn nặng mỗi ngày khiến tẩy trang ma sát và viêm tăng.",
        "Dịch vụ makeup/mi/mày dùng dụng cụ hoặc keo khiến sưng, rát, ngứa.",
      ],
    },
    decisionMatrix: [
      { signal: "Nền cakey", meaning: "Quá nhiều lớp hoặc da/prep chưa hợp", action: "Giảm lượng nền, dưỡng đúng vùng, set có chọn lọc" },
      { signal: "Nền xuống tone", meaning: "Oxidation hoặc chọn shade/undertone sai", action: "Test ngoài ánh sáng thật vài giờ trước khi mua" },
      { signal: "Mascara vón và mắt ngứa", meaning: "Sản phẩm/độ cũ/vệ sinh có thể là vấn đề", action: "Dừng dùng, không thêm nước, thay mới nếu cần" },
      { signal: "Mụn tăng sau makeup", meaning: "Tẩy trang, texture hoặc che phủ dày có thể góp phần", action: "Đơn giản base, làm sạch kỹ dịu, xem lại sản phẩm nền" },
    ],
    mythReality: [
      { myth: "Che phủ càng cao càng đẹp da.", reality: "Che phủ dày dễ lộ texture; che điểm và layer mỏng thường tự nhiên hơn." },
      { myth: "Tester ở store dùng thử thoải mái.", reality: "Tester dùng chung có nguy cơ nhiễm bẩn; vùng mắt/môi càng cần cẩn trọng." },
      { myth: "Makeup nhẹ thì không cần tẩy trang kỹ.", reality: "Sunscreen, mascara và nền vẫn cần làm sạch đúng để giảm bí và kích ứng." },
    ],
    references: [
      { label: "FDA: Eye cosmetic safety", url: "https://www.fda.gov/cosmetics/cosmetic-products/eye-cosmetic-safety" },
      { label: "FDA: Using cosmetics safely", url: "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely" },
      { label: "FDA: Shelf life and expiration dating of cosmetics", url: "https://www.fda.gov/cosmetics/cosmetics-labeling/shelf-life-and-expiration-dating-cosmetics" },
    ],
  },
  "mui-huong": {
    learningGoals: [
      "Đọc mùi theo note, độ tỏa, độ lưu, drydown và hoàn cảnh sử dụng.",
      "Biết body mist, hair mist, perfume và layering có vai trò khác nhau.",
      "Nhận ra mùi hương cũng có rủi ro kích ứng, đặc biệt trên da nhạy cảm.",
    ],
    diagnosticLens: {
      title: "Mùi hương không chỉ là thích hay không thích ở giây đầu",
      paragraphs: [
        "Nước hoa thay đổi theo thời gian. Top notes tạo ấn tượng đầu, heart notes là thân mùi, base notes quyết định cảm giác lưu lại. Một mùi citrus mở đầu sạch có thể khô xuống ngọt; một mùi tưởng nhẹ trên giấy có thể tỏa mạnh trên da nóng.",
        "Đọc fragrance tốt là đặt mùi vào không gian: văn phòng, lớp học, gym, date, buổi tối hay du lịch. Mùi quá mạnh trong không gian kín có thể gây khó chịu cho người xung quanh dù bản thân mùi rất hay.",
      ],
      cues: [
        "Test trên da 2-4 giờ để đọc drydown.",
        "Đánh giá khoảng cách tỏa trong phòng kín, không chỉ ngoài trời.",
        "Da đang kích ứng hoặc eczema không nên xịt trực tiếp hương liệu lên vùng đó.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol chọn và dùng mùi hương",
      homeSteps: [
        "Chọn hoàn cảnh chính trước: đi làm, đi học, date, gym, du lịch hay buổi tối.",
        "Test trên da thật và chờ drydown; đừng mua chỉ vì giấy thử.",
        "Layer cùng vibe: sữa tắm/lotion/mist/perfume không nên đánh nhau.",
        "Dùng lượng vừa phải ở điểm mạch hoặc quần áo phù hợp, tránh vùng da kích ứng.",
      ],
      professionalTitle: "Khi cần dừng hoặc hỏi chuyên gia",
      professionalSigns: [
        "Da đỏ, ngứa, nổi mẩn hoặc khó thở sau khi dùng hương liệu.",
        "Đau đầu, buồn nôn hoặc kích ứng mắt rõ trong không gian kín.",
        "Vùng da xịt có eczema/viêm da đang bùng phát.",
        "Sản phẩm không rõ nguồn gốc, chiết sang không vệ sinh hoặc mùi biến đổi lạ.",
      ],
    },
    decisionMatrix: [
      { signal: "Mùi rất hay trên giấy nhưng gắt trên da", meaning: "Da và nhiệt cơ thể đổi drydown", action: "Luôn test trên da trước khi mua fullsize" },
      { signal: "Mùi nhanh bay", meaning: "Nồng độ, nhóm note hoặc da khô ảnh hưởng độ lưu", action: "Dưỡng ẩm không mùi, xịt lên quần áo nếu chất liệu cho phép" },
      { signal: "Mùi gây khó chịu ở văn phòng", meaning: "Projection quá mạnh cho không gian kín", action: "Giảm số xịt hoặc chọn skin scent/mist" },
      { signal: "Layer bị ngọt/gắt", meaning: "Các lớp hương không cùng hướng", action: "Giữ một trục mùi chính và giảm lớp phụ" },
    ],
    mythReality: [
      { myth: "Nước hoa đắt thì luôn lưu lâu.", reality: "Độ lưu phụ thuộc nồng độ, nhóm note, da, thời tiết và cách xịt." },
      { myth: "Xịt thật nhiều là mùi sẽ sang hơn.", reality: "Quá liều làm mùi gắt và kém tinh tế, nhất là nơi kín." },
      { myth: "Body mist vô hại tuyệt đối.", reality: "Mist vẫn có hương liệu; da nhạy cảm hoặc đang viêm nên cẩn trọng." },
    ],
    references: [
      { label: "FDA: Using cosmetics safely", url: "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely" },
      { label: "FDA: Microbiological safety and cosmetics", url: "https://www.fda.gov/cosmetics/potential-contaminants-cosmetics/microbiological-safety-and-cosmetics" },
      { label: "FDA: Cosmetics shelf life", url: "https://www.fda.gov/cosmetics/cosmetics-labeling/shelf-life-and-expiration-dating-cosmetics" },
    ],
  },
  "nam-gioi": {
    learningGoals: [
      "Xây routine nam ít bước nhưng đủ cho dầu, mụn, râu, tóc và chống nắng.",
      "Hiểu sản phẩm tóc/râu có thể ảnh hưởng mụn trán, cổ và lưng.",
      "Biết khi nào mụn, rụng tóc hoặc kích ứng sau cạo cần bác sĩ.",
    ],
    diagnosticLens: {
      title: "Grooming nam tốt là ít bước, ít bóng, dùng được mỗi ngày",
      paragraphs: [
        "Nhiều người bỏ skincare không phải vì không cần, mà vì sản phẩm quá dính, quá thơm, quá nhiều bước hoặc không hợp lịch sinh hoạt. Vì vậy routine nam nên bắt đầu bằng cảm giác dùng thật: cleanser không căng, dưỡng không bóng, chống nắng không cay mắt khi đổ mồ hôi.",
        "Tóc, râu và da mặt liên quan chặt chẽ. Pomade, wax, dầu râu, aftershave và dao cạo có thể tạo mụn trán, mụn cổ, viêm nang lông hoặc kích ứng. Một routine đúng phải tính cả những thứ chạm vào da, không chỉ chai serum.",
      ],
      cues: [
        "Mụn trán/thái dương: kiểm tra sản phẩm tóc và cách gội sạch.",
        "Rát sau cạo: xem dao, hướng cạo, aftershave và phục hồi.",
        "Bóng dầu trong ngày: chọn texture nhẹ, không rửa mặt quá gắt.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol grooming ít bước",
      homeSteps: [
        "Sáng: rửa mặt nhanh nếu cần, dưỡng nhẹ hoặc bỏ dưỡng nếu chống nắng đủ ẩm, dùng SPF dễ chịu.",
        "Tối: làm sạch sản phẩm tóc/chống nắng, dưỡng phục hồi nếu da căng hoặc cạo râu.",
        "Sau cạo: rửa dịu, làm dịu, tránh aftershave cồn/hương liệu mạnh nếu rát.",
        "Gym/ngoài trời: tắm sau tập, thay áo thoáng, thoa lại chống nắng khi nắng/mồ hôi.",
      ],
      professionalTitle: "Khi nên đi khám",
      professionalSigns: [
        "Mụn đau, mụn nang, sẹo hoặc mụn cổ/râu tái phát nhiều.",
        "Viêm nang lông sau cạo lan rộng, có mủ hoặc đau.",
        "Rụng tóc vùng thái dương/đỉnh nhanh hoặc rụng từng mảng.",
        "Da đỏ rát dai dẳng sau sản phẩm tóc/râu/aftershave.",
      ],
    },
    decisionMatrix: [
      { signal: "Mụn trán sau dùng wax", meaning: "Sản phẩm tóc có thể bí da", action: "Giảm lượng, gội sạch, tránh để dính trán/gối" },
      { signal: "Da dầu nhưng căng sau rửa", meaning: "Cleanser quá mạnh", action: "Đổi sữa rửa dịu, giảm số lần rửa" },
      { signal: "Chống nắng cay mắt khi chạy", meaning: "Công thức không hợp mồ hôi", action: "Đổi SPF water-resistant/ít cay mắt, dùng mũ" },
      { signal: "Râu mọc ngược", meaning: "Cạo sát/ma sát gây viêm", action: "Đổi kỹ thuật cạo, làm dịu, đi khám nếu viêm nhiều" },
    ],
    mythReality: [
      { myth: "Nam da dày nên dùng gì cũng được.", reality: "Da nam vẫn có barrier, kích ứng, mụn và thâm như mọi làn da khác." },
      { myth: "Skincare nam phải có bộ riêng rất nhiều bước.", reality: "Ít bước nhưng đúng thường bền hơn bộ dài khó duy trì." },
      { myth: "Nước hoa che được mùi sau gym.", reality: "Mùi cơ thể cần vệ sinh, khử mùi và vải mặc; nước hoa chỉ là lớp hương." },
    ],
    references: [
      { label: "AAD: DIY treatment for common beard problems", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/face/diy-treatment-common-beard-problems" },
      { label: "AAD: Acne treatment that won't clear", url: "https://www.aad.org/public/diseases/acne/diy/wont-clear" },
      { label: "AAD: Hair loss signs and symptoms", url: "https://www.aad.org/public/diseases/hair-loss/insider/begin" },
    ],
  },
  "clinic-treatment": {
    learningGoals: [
      "Đọc clinic/treatment như can thiệp có chỉ định, không như menu làm đẹp.",
      "Biết hỏi về người thực hiện, cơ chế, downtime, biến chứng và aftercare.",
      "Phân biệt kỳ vọng thực tế giữa skincare tại nhà, thuốc và thủ thuật.",
    ],
    diagnosticLens: {
      title: "Thủ thuật phải bắt đầu bằng chẩn đoán vấn đề và rủi ro",
      paragraphs: [
        "Peel, laser, RF microneedling, filler, botox, subcision hay TCA cross không cùng cơ chế. Có thủ thuật tác động bề mặt, có thủ thuật tạo tổn thương có kiểm soát, có thủ thuật tiêm vào mô. Vì vậy không thể hỏi chung 'dịch vụ nào tốt nhất' mà phải hỏi vấn đề gì, loại da nào, ai thực hiện, rủi ro gì và hồi phục bao lâu.",
        "Nguồn da liễu chính thống luôn nhấn mạnh vai trò tư vấn trước thủ thuật. Người dùng cần được giải thích lựa chọn thay thế, chống chỉ định, downtime, biến chứng có thể gặp và cách liên hệ nếu có dấu hiệu bất thường sau làm.",
      ],
      cues: [
        "Tư vấn chỉ nói giá gói/before-after mà không hỏi tiền sử da là tín hiệu đỏ.",
        "Da dễ tăng sắc tố cần hỏi kỹ rủi ro PIH sau peel/laser.",
        "Thủ thuật tiêm cần người thực hiện hiểu giải phẫu và xử trí biến chứng.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol trước/sau thủ thuật",
      homeSteps: [
        "Trước làm: ghi rõ thuốc/sản phẩm đang dùng, tiền sử sẹo lồi, herpes, dị ứng, thai kỳ và treatment gần đây.",
        "Hỏi cơ chế, số buổi, downtime, rủi ro, người thực hiện và kế hoạch nếu biến chứng.",
        "Sau làm: phục hồi, chống nắng, tránh nhiệt/ma sát/hoạt chất mạnh theo hướng dẫn.",
        "Chụp ảnh theo dõi, giữ thông tin sản phẩm/thuốc/phiếu dịch vụ và liên hệ clinic nếu dấu hiệu lạ.",
      ],
      professionalTitle: "Dấu hiệu cần liên hệ ngay",
      professionalSigns: [
        "Đau tăng, sưng nóng, chảy dịch, mủ, sốt hoặc vùng da đổi màu bất thường.",
        "Sau filler có đau dữ dội, da tái/livedo, nhìn mờ hoặc triệu chứng thần kinh.",
        "Sau laser/peel có phồng rộp, thâm tăng nhanh hoặc đỏ kéo dài không giảm.",
        "Không nhận được hướng dẫn aftercare rõ ràng hoặc clinic né tránh biến chứng.",
      ],
    },
    decisionMatrix: [
      { signal: "Muốn trị sẹo lõm", meaning: "Có nhiều loại sẹo và nhiều kỹ thuật", action: "Cần khám trực tiếp để phân loại ice pick/boxcar/rolling" },
      { signal: "Nám muốn laser nhanh", meaning: "Rủi ro PIH/tái phát cao nếu không kiểm soát trigger", action: "Chống nắng và đánh giá chuyên môn trước" },
      { signal: "Filler giá quá rẻ", meaning: "Rủi ro sản phẩm/người tiêm/quy trình", action: "Kiểm tra nguồn gốc, chứng chỉ, kế hoạch xử trí biến chứng" },
      { signal: "Sau peel da rát đỏ kéo dài", meaning: "Có thể quá kích ứng hoặc biến chứng", action: "Ngừng tự bôi treatment và liên hệ chuyên gia" },
    ],
    mythReality: [
      { myth: "Clinic mạnh hơn mỹ phẩm nên chắc chắn nhanh và tốt.", reality: "Can thiệp mạnh hơn cũng đi kèm downtime và biến chứng cao hơn nếu sai chỉ định." },
      { myth: "Before/after đẹp là đủ tin.", reality: "Ảnh có thể khác ánh sáng/góc chụp; cần biết case tương tự da mình và rủi ro." },
      { myth: "Làm xong là xong.", reality: "Aftercare quyết định nhiều đến thâm, sẹo, nhiễm trùng và kết quả cuối." },
    ],
    references: [
      { label: "AAD: Cosmetic treatments", url: "https://www.aad.org/public/cosmetic" },
      { label: "AAD: Younger-looking skin cosmetic treatments", url: "https://www.aad.org/public/cosmetic/younger-looking" },
      { label: "AAD: Acne scars consultation and treatment", url: "https://www.aad.org/public/diseases/acne/derm-treat/scars/treatment" },
    ],
  },
  "beauty-lifestyle": {
    learningGoals: [
      "Đọc da trong bối cảnh ngủ, stress, chu kỳ, thai kỳ/sau sinh, tập luyện và thuốc.",
      "Biết theo dõi pattern mà không biến skincare thành ám ảnh.",
      "Nhận ra claim supplement/detox nào cần nghi ngờ.",
    ],
    diagnosticLens: {
      title: "Da là dữ liệu của đời sống, không chỉ dữ liệu của mỹ phẩm",
      paragraphs: [
        "Một đợt mụn hoặc kích ứng có thể trùng với sản phẩm mới, nhưng cũng có thể liên quan thiếu ngủ, stress, chu kỳ kinh, thời tiết nóng ẩm, đeo khẩu trang, tập luyện, thai kỳ/sau sinh hoặc thuốc. Nếu chỉ đổi mỹ phẩm liên tục, bạn dễ bỏ qua pattern thật.",
        "Beauty lifestyle hữu ích là giúp người dùng quan sát đủ để ra quyết định: vùng da nào thay đổi, thay đổi sau sự kiện gì, kéo dài bao lâu, có đau/ngứa/sưng không, và routine có quá tải không. Nó không nên thay thế chẩn đoán y khoa bằng lời hứa detox.",
      ],
      cues: [
        "Mụn quanh cằm lặp theo chu kỳ có thể cần đọc cùng hormone/chu kỳ.",
        "Rụng tóc sau sinh/stress thường cần theo dõi thời gian và mức độ.",
        "Da đang thai kỳ/sau sinh cần kiểm tra nhóm hoạt chất nên tránh.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol theo dõi lifestyle",
      homeSteps: [
        "Ghi nhanh 4 dữ liệu: sản phẩm mới, ngủ/stress, chu kỳ/hormone, tập luyện/mồ hôi.",
        "Giữ routine nền đơn giản khi đời sống đang biến động mạnh.",
        "Ưu tiên chống nắng, làm sạch dịu, dưỡng phục hồi trong thai kỳ/sau sinh nếu chưa có tư vấn.",
        "Đánh giá supplement bằng bằng chứng, thành phần, tương tác và kỳ vọng thực tế.",
      ],
      professionalTitle: "Khi lifestyle không đủ",
      professionalSigns: [
        "Mụn đau/nang, nám lan nhanh, rụng tóc nhiều hoặc rụng từng mảng.",
        "Da thay đổi kèm triệu chứng toàn thân như mệt nhiều, thay đổi cân nặng, rối loạn kinh nguyệt.",
        "Mang thai/sau sinh muốn dùng thuốc hoặc hoạt chất có cảnh báo.",
        "Supplement gây phản ứng, hoặc claim điều trị bệnh da mà không có tư vấn.",
      ],
    },
    decisionMatrix: [
      { signal: "Mụn bùng sau tuần stress", meaning: "Trigger đời sống có thể góp phần", action: "Giữ routine ổn, theo dõi chu kỳ stress/mụn trước khi đổi toàn bộ" },
      { signal: "Rụng tóc sau sinh", meaning: "Có thể liên quan telogen effluvium nhưng cần theo dõi", action: "Theo dõi 6-9 tháng, khám nếu rụng nhiều/loang/đau ngứa" },
      { signal: "Nám sau nắng/ thai kỳ", meaning: "Sắc tố có trigger mạnh", action: "Chống nắng nghiêm, hỏi bác sĩ trước treatment mạnh" },
      { signal: "Detox claim hết mụn", meaning: "Claim điều trị thiếu chắc chắn", action: "Đọc thành phần, rủi ro và không thay thế điều trị" },
    ],
    mythReality: [
      { myth: "Da xấu chắc do skincare sai.", reality: "Da còn chịu ảnh hưởng từ giấc ngủ, stress, hormone, thuốc và môi trường." },
      { myth: "Pregnancy-safe chỉ cần tránh retinol.", reality: "Còn nhiều thuốc/hoạt chất cần hỏi bác sĩ, như hydroquinone hoặc một số thuốc trị mụn." },
      { myth: "Supplement đẹp da lành tính tuyệt đối.", reality: "Sản phẩm uống vẫn có liều, tương tác, chất lượng nguồn và claim cần kiểm chứng." },
    ],
    references: [
      { label: "AAD: Pregnancy skin care", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care" },
      { label: "AAD: Acne treatment during pregnancy", url: "https://www.aad.org/public/diseases/acne/derm-treat/pregnancy" },
      { label: "AAD: 18 causes of hair loss", url: "https://www.aad.org/public/diseases/hair-loss/causes/18-causes" },
    ],
  },
  "nails-mi-long-may": {
    learningGoals: [
      "Chọn nail, mi, mày theo đời sống thật chứ không chỉ ảnh mẫu.",
      "Biết hỏi về vệ sinh, vật liệu, keo, cuticle, tháo và aftercare.",
      "Nhận ra dấu hiệu nhiễm trùng/kích ứng cần dừng dịch vụ.",
    ],
    diagnosticLens: {
      title: "Nail, mi, mày là dịch vụ thẩm mỹ trên vùng nhạy cảm",
      paragraphs: [
        "Một bộ nail dài, mi dày hoặc mày sắc có thể đẹp trong ảnh nhưng không hợp công việc, thói quen đeo kính, makeup hằng ngày hoặc khả năng bảo trì. Dịch vụ tốt phải vừa thẩm mỹ vừa sống được với lịch thật của người dùng.",
        "An toàn là phần không thể tách khỏi đẹp. AAD khuyên không cắt hoặc đẩy cuticle mạnh vì tăng nguy cơ viêm/nhiễm trùng; FDA cũng cảnh báo với sản phẩm vùng mắt và việc dùng chung/tester. Với mi và mày, keo, thuốc nhuộm, dụng cụ và vệ sinh quanh mắt cần được hỏi rõ.",
      ],
      cues: [
        "Nail đau, xanh/đen, tách móng hoặc sưng quanh móng là tín hiệu đỏ.",
        "Mi nối gây đỏ mắt, ngứa, sưng mí hoặc đau cần dừng và xử lý.",
        "Mày/mi dùng thuốc nhuộm không rõ nguồn gốc quanh mắt cần thận trọng.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol trước/sau dịch vụ",
      homeSteps: [
        "Trước làm: hỏi cách khử khuẩn dụng cụ, vật liệu/keo dùng, cách tháo và xử lý dị ứng.",
        "Chọn độ dài/độ dày/dáng phù hợp công việc, mắt kính, makeup và tần suất bảo trì.",
        "Không tự bóc gel, giật mi nối hoặc cạy móng giả; tháo đúng quy trình.",
        "Sau làm: giữ sạch, tránh kéo/giật, nghỉ giữa các lần nếu móng/mi yếu.",
      ],
      professionalTitle: "Khi cần dừng và đi kiểm tra",
      professionalSigns: [
        "Mắt đỏ, đau, nhìn mờ, sưng mí hoặc chảy dịch sau nối mi/makeup mắt.",
        "Móng đau, sưng, đổi màu xanh/đen, tách móng hoặc có mủ.",
        "Da quanh móng/mày ngứa rát, phồng, chảy dịch sau hóa chất/keo.",
        "Salon không giải thích vệ sinh, vật liệu hoặc cách xử lý dị ứng.",
      ],
    },
    decisionMatrix: [
      { signal: "Cuticle bị cắt sâu", meaning: "Hàng rào bảo vệ móng bị tổn thương", action: "Yêu cầu dừng, theo dõi sưng đau/nhiễm trùng" },
      { signal: "Mi dày nặng gây cộm", meaning: "Form mi có thể quá tải mắt/mi thật", action: "Tháo hoặc đổi form nhẹ hơn, ưu tiên vệ sinh mắt" },
      { signal: "Gel phải mài mạnh để tháo", meaning: "Nguy cơ yếu móng", action: "Ưu tiên soak-off đúng quy trình và nghỉ phục hồi" },
      { signal: "Móng xanh/đen", meaning: "Có thể có nhiễm khuẩn/nấm hoặc tổn thương", action: "Không phủ tiếp, đi khám nếu không giảm" },
    ],
    mythReality: [
      { myth: "Cắt sạch cuticle thì nail mới đẹp.", reality: "Cuticle bảo vệ móng; cắt/đẩy mạnh làm tăng nguy cơ viêm và nhiễm trùng." },
      { myth: "Mi càng dày càng đẹp.", reality: "Mi quá nặng có thể cộm, khó vệ sinh và làm mi thật yếu hơn." },
      { myth: "Tháo gel ở nhà nhanh cho tiện.", reality: "Bóc/cạy gel dễ làm móng mỏng, tách lớp và đau." },
    ],
    references: [
      { label: "AAD: Manicure and pedicure safety", url: "https://www.aad.org/public/everyday-care/nail-care-secrets/basics/pedicures/manicure-pedicure-safety" },
      { label: "AAD: Gel manicures tips for healthy nails", url: "https://www.aad.org/media/news-releases/gel-manicures-dermatologists-share-tips-to-keep-nails-healthy" },
      { label: "FDA: Eye cosmetic safety", url: "https://www.fda.gov/cosmetics/cosmetic-products/eye-cosmetic-safety" },
    ],
  },
  "beauty-tech": {
    learningGoals: [
      "Đọc thiết bị theo cơ chế: ánh sáng, nhiệt, rung/ma sát, phân tích hình ảnh hay tạo kiểu tóc.",
      "Biết chống chỉ định, lịch dùng, bảo vệ mắt và chi phí duy trì trước khi mua.",
      "Phân biệt thiết bị hỗ trợ tại nhà và can thiệp clinic/y khoa.",
    ],
    diagnosticLens: {
      title: "Beauty tech đáng mua khi cơ chế và giới hạn rõ",
      paragraphs: [
        "LED mask, IPL tại nhà, máy rửa mặt, thiết bị nâng cơ, hair tools và AI skin analysis không cùng loại. Có thiết bị tác động bằng ánh sáng, có thiết bị dùng nhiệt, rung, ma sát hoặc thuật toán hình ảnh. Nếu không hiểu cơ chế, người dùng rất dễ mua vì lời hứa hơn là vì nhu cầu thật.",
        "Thiết bị tốt cần có thông số, hướng dẫn dùng, cảnh báo ai nên tránh, bảo hành và chi phí thay thế phụ kiện. Với ánh sáng/nhiệt, bảo vệ mắt, màu da, thuốc gây nhạy sáng, vùng da đang kích ứng và lịch dùng là những điểm phải đọc trước.",
      ],
      cues: [
        "Thiết bị không ghi chống chỉ định hoặc hướng dẫn an toàn là tín hiệu đỏ.",
        "IPL/LED cần đọc bảo vệ mắt, màu da/lông, thuốc và tình trạng da.",
        "Máy rửa mặt/ma sát quá thường xuyên có thể làm barrier yếu hơn.",
      ],
    },
    careProtocol: {
      homeTitle: "Protocol trước khi mua beauty tech",
      homeSteps: [
        "Xác định vấn đề chính và hỏi thiết bị giải quyết bằng cơ chế nào.",
        "Đọc chống chỉ định: mắt, thai kỳ, thuốc, da kích ứng, màu da/lông, bệnh da.",
        "Tính chi phí thật: pin, đầu thay, gel, bảo hành, thời gian dùng đều.",
        "Bắt đầu tần suất thấp và theo dõi đỏ rát, bỏng, khô tóc hoặc kích ứng.",
      ],
      professionalTitle: "Khi không nên tự dùng thiết bị",
      professionalSigns: [
        "Da đang viêm, nhiễm trùng, bỏng nắng, có vết thương hoặc sau thủ thuật.",
        "Đang dùng thuốc/hoạt chất gây nhạy sáng mà muốn dùng IPL/LED mạnh.",
        "Rối loạn sắc tố, nám nặng hoặc sẹo cần đánh giá chuyên môn.",
        "Thiết bị gây đau, bỏng, phồng rộp, nhìn mờ hoặc kích ứng kéo dài.",
      ],
    },
    decisionMatrix: [
      { signal: "LED mask không ghi bước sóng/cảnh báo", meaning: "Thiếu minh bạch kỹ thuật", action: "Không mua nếu không có hướng dẫn an toàn rõ" },
      { signal: "IPL tại nhà cho mọi màu da/lông", meaning: "Claim quá rộng", action: "Đọc kỹ bảng phù hợp màu da/lông và chống chỉ định" },
      { signal: "Máy rửa mặt dùng hằng ngày làm rát", meaning: "Ma sát quá mức", action: "Giảm tần suất hoặc dừng, phục hồi barrier" },
      { signal: "Hair tool nhiệt cao mỗi ngày", meaning: "Nguy cơ tóc khô gãy", action: "Giảm nhiệt, dùng heat protectant, nghỉ ngày không nhiệt" },
    ],
    mythReality: [
      { myth: "Thiết bị càng đắt càng hiệu quả.", reality: "Giá không thay thế cơ chế, thông số, chứng cứ, bảo hành và khả năng dùng đều." },
      { myth: "AI skin analysis là chẩn đoán.", reality: "AI có thể hỗ trợ theo dõi, nhưng không thay thế bác sĩ khi có bệnh da." },
      { myth: "Dùng nhiều hơn lịch hãng sẽ nhanh hơn.", reality: "Với ánh sáng/nhiệt/ma sát, dùng quá mức có thể gây kích ứng hoặc tổn thương." },
    ],
    references: [
      { label: "AAD: Cosmetic treatments and safety context", url: "https://www.aad.org/public/cosmetic" },
      { label: "AAD: How dermatologists treat sun-damaged skin", url: "https://www.aad.org/public/everyday-care/sun-protection/sun-damage-skin/wrinkles-sun-damage-can-be-treated" },
      { label: "FDA: Using cosmetics safely", url: "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely" },
    ],
  },
}

export function getCatalogueArticle(slug: string) {
  const article = catalogueArticles[slug]
  if (!article) return undefined

  return {
    ...article,
    ...catalogueArticleDetails[slug],
  }
}
