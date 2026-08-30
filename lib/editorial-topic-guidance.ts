export interface EditorialTopicGuidance {
  explain: string
  plan: string
  boundary: string
  sources?: { label: string; url: string }[]
}

export const EDITORIAL_HUB_FOUNDATIONS: Record<string, string> = {
  "da-mat": "Một routine da mặt có thể đánh giá được luôn cần ba lớp: làm sạch vừa đủ, dưỡng phù hợp hàng rào da và bảo vệ tia UV. Treatment chỉ nên được thêm sau khi ba lớp nền này ổn định.",
  "tri-mun": "Mụn không phải một nhóm đồng nhất. Mụn không viêm, mụn viêm nông và nốt/nang sâu có mức rủi ro sẹo khác nhau, vì vậy cùng một cách xử lý không phù hợp cho mọi trường hợp.",
  "sang-da-chong-nang": "Đều màu da bắt đầu bằng giảm tác nhân làm sắc tố tiếp tục tăng. Chống nắng đều, hạn chế kích ứng và xử lý nguyên nhân viêm thường quan trọng hơn việc xếp chồng nhiều sản phẩm làm sáng.",
  "ingredient-radar": "Danh sách thành phần cho biết sản phẩm chứa gì, nhưng không tự cho biết nồng độ đầy đủ, độ ổn định, hệ dẫn hay hiệu quả trên từng người. Cần đọc INCI cùng loại sản phẩm, hướng dẫn dùng và phản ứng thực tế.",
  "product-radar": "Một sản phẩm đáng cân nhắc phải khớp vấn đề, có thông tin truy xuất được và dùng được đủ lâu trong ngân sách. Độ viral, số sao hoặc một video ngắn không thay thế các tiêu chí đó.",
  bodycare: "Da cơ thể thay đổi theo từng vùng vì độ dày, ma sát, mồ hôi và mật độ nang lông khác nhau. Bodycare hiệu quả bắt đầu từ việc xác định đúng vùng và tác nhân thay vì dùng một hoạt chất mạnh trên toàn thân.",
  "toc-da-dau": "Da đầu, nang tóc và thân tóc là ba phần khác nhau. Dầu gội chủ yếu tác động trên da đầu; dầu xả và sản phẩm tạo kiểu chủ yếu thay đổi cảm giác của thân tóc; rụng từ chân cần được đánh giá khác gãy thân tóc.",
  makeup: "Makeup tốt cần tương thích với nền da, độ che phủ mong muốn, thời gian sử dụng và khả năng làm sạch cuối ngày. An toàn vùng mắt và vệ sinh dụng cụ là tiêu chí ngang hàng với finish.",
  "mui-huong": "Hiệu ứng nước hoa phụ thuộc công thức, lượng xịt, nhiệt độ, da, vải và không gian. Projection hay độ lưu hương không thể được dự đoán chính xác chỉ từ nồng độ ghi trên chai.",
  "nam-gioi": "Da và tóc không cần sản phẩm riêng chỉ vì giới tính. Điều đáng đọc là dầu, mụn, độ nhạy cảm, thói quen cạo râu, vận động và mức sẵn sàng duy trì routine.",
  "clinic-treatment": "Treatment tại clinic là một can thiệp có chỉ định, giới hạn, downtime và nguy cơ; không chỉ là một gói dịch vụ. Người thực hiện, thiết bị/sản phẩm, consent và kế hoạch xử lý biến chứng phải được làm rõ trước khi trả tiền.",
  "beauty-lifestyle": "Giấc ngủ, stress, dinh dưỡng, hormone và thuốc có thể đi cùng thay đổi của da nhưng hiếm khi giải thích mọi biểu hiện. Theo dõi bối cảnh giúp đặt câu hỏi tốt hơn, không thay thế chẩn đoán.",
  "nails-mi-long-may": "Vùng móng và quanh mắt có nguy cơ nhiễm bẩn, kích ứng keo/mực và tổn thương do kỹ thuật. Vệ sinh, vật liệu, tay nghề và aftercare phải được xem trước màu sắc hay độ bền.",
  "beauty-tech": "Thiết bị làm đẹp cần được đánh giá theo đúng model, mục đích sử dụng, chống chỉ định, hướng dẫn và bằng chứng của thiết bị đó. Cơ chế nghe có vẻ khoa học không đồng nghĩa mọi máy cùng công nghệ cho kết quả giống nhau.",
}

const AAD_TEST = { label: "AAD: How to test skin care products", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products" }
const AAD_ACNE = { label: "AAD: Acne overview and treatment principles", url: "https://www.aad.org/public/diseases/acne/really-acne/overview" }
const AAD_SUN = { label: "AAD: Choosing the right sunscreen", url: "https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/choosing-right-sunscreen" }
const FDA_LIGHTENING = { label: "FDA: Skin-lightening product safety", url: "https://www.fda.gov/consumers/skin-facts-what-you-need-know-about-skin-lightening-products/skin-product-safety" }
const FDA_LABEL = { label: "FDA: Cosmetic ingredient names and labeling", url: "https://www.fda.gov/cosmetics/cosmetics-labeling/cosmetic-ingredient-names" }
const FTC_DISCLOSURE = { label: "FTC: Disclosures for social media influencers", url: "https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers" }
const FDA_EYE = { label: "FDA: Eye cosmetic safety", url: "https://www.fda.gov/cosmetics/cosmetic-products/eye-cosmetic-safety" }
const AAD_FOLLICULITIS = { label: "AAD: Folliculitis overview", url: "https://www.aad.org/public/diseases/a-z/folliculitis" }
const AAD_DANDRUFF = { label: "AAD: How to treat dandruff", url: "https://www.aad.org/public/everyday-care/hair-scalp-care/scalp/treat-dandruff" }
const AAD_HAIR_SHEDDING = { label: "AAD: Hair loss or hair shedding?", url: "https://www.aad.org/public/diseases/hair-loss/insider/shedding" }
const AAD_NAILS = { label: "AAD: Manicure and pedicure safety", url: "https://www.aad.org/public/everyday-care/nail-care-secrets/basics/pedicures/manicure-pedicure-safety" }
const AAD_CLINIC = { label: "AAD: Questions before cosmetic treatment", url: "https://www.aad.org/public/cosmetic/safety/facials-spa" }
const AAD_PEEL = { label: "AAD: Chemical peel FAQs", url: "https://www.aad.org/public/cosmetic/younger-looking/chemical-peels-faqs" }
const AAD_LASER = { label: "AAD: Laser hair removal preparation", url: "https://www.aad.org/public/cosmetic/hair-removal/laser-hair-removal-preparation" }
const FDA_RF = { label: "FDA: Risks from certain RF microneedling uses", url: "https://www.fda.gov/medical-devices/safety-communications/potential-risks-certain-uses-radiofrequency-rf-microneedling-fda-safety-communication" }

export const EDITORIAL_TOPIC_GUIDANCE: Record<string, EditorialTopicGuidance> = {
  "huong-dan-nen-skincare-cho-nguoi-moi": {
    explain: "Người mới không cần xác định một 'loại da' bất biến trước khi bắt đầu. Hãy ghi nhận dầu, khô căng, đỏ rát và mụn ở từng vùng trong vài tuần, vì khí hậu, chu kỳ và sản phẩm có thể làm biểu hiện thay đổi.",
    plan: "Bắt đầu với cleanser dịu, moisturizer và kem chống nắng broad-spectrum SPF 30+; dùng đều trước khi thêm đúng một treatment cho vấn đề ưu tiên. Giữ ảnh và nhật ký ngắn để biết thay đổi nào tạo kết quả.",
    boundary: "Không thêm acid, retinoid và sản phẩm trị mụn cùng một lúc. Nếu da đau, sưng, chảy dịch hoặc phát ban lan rộng, ngừng thử sản phẩm và đi khám.",
    sources: [AAD_TEST, AAD_SUN],
  },
  "da-nhay-cam-nen-xay-routine-nhu-the-nao": {
    explain: "'Da nhạy cảm' mô tả xu hướng châm chích, đỏ hoặc ngứa chứ không chỉ ra nguyên nhân. Kích ứng, dị ứng tiếp xúc, rosacea và hàng rào da suy yếu có thể trông giống nhau nhưng hướng xử lý khác nhau.",
    plan: "Giảm routine về cleanser dịu, dưỡng không hương liệu và chống nắng; thử sản phẩm mới trên vùng nhỏ theo hướng dẫn trước khi dùng toàn mặt. Ưu tiên nhãn fragrance-free thay vì chỉ 'unscented'.",
    boundary: "Cảm giác nóng rát kéo dài, phù, mề đay, sưng môi/mắt hoặc khó thở không phải purging. Dừng sản phẩm; triệu chứng toàn thân hoặc khó thở cần hỗ trợ y tế khẩn cấp.",
    sources: [AAD_TEST],
  },
  "da-kho-thieu-nuoc-khac-da-thieu-dau-ra-sao": {
    explain: "Da khô thường nói đến lượng dầu/lipid tự nhiên thấp và có thể kéo dài; thiếu nước mô tả trạng thái lớp sừng giữ nước kém, có thể xuất hiện cả trên da dầu. Căng sau rửa không đủ để tự chẩn đoán một bệnh da.",
    plan: "Rút ngắn tắm/rửa bằng nước ấm, dùng cleanser nhẹ và thoa cream hoặc ointment khi da còn hơi ẩm. Humectant hỗ trợ hút/giữ nước; emollient và occlusive giúp giảm mất nước, nên chọn theo cảm giác và vùng dùng.",
    boundary: "Nứt chảy máu, ngứa làm mất ngủ, mảng đỏ dai dẳng hoặc không cải thiện với chăm sóc dịu có thể cần bác sĩ để loại trừ eczema hay bệnh khác.",
  },
  "tay-da-chet-aha-bha-pha-cho-nguoi-moi": {
    explain: "AHA là nhóm acid tan trong nước thường nhắm bề mặt/texture; salicylic acid là BHA tan trong dầu thường được dùng cho lỗ chân lông; PHA có kích thước phân tử lớn hơn nhưng độ dịu vẫn phụ thuộc toàn công thức.",
    plan: "Chọn một sản phẩm theo vấn đề chính, bắt đầu thưa hơn hướng dẫn tối đa và không dùng cùng đêm với nhiều treatment dễ kích ứng. Dưỡng ẩm và chống nắng đều là phần bắt buộc của kế hoạch.",
    boundary: "Rát tăng dần, đỏ kéo dài, bóng căng bất thường hoặc bong nứt là dấu hiệu giảm/ngừng, không phải bằng chứng sản phẩm đang 'đẩy độc'. Tránh peel mạnh tại nhà trên da đang tổn thương.",
  },
  "khi-nao-da-can-bac-si-thay-vi-skincare": {
    explain: "Skincare hỗ trợ vệ sinh, hàng rào và triệu chứng nhẹ; nó không chẩn đoán nhiễm trùng, viêm da, bệnh tự miễn hay tổn thương sắc tố thay đổi bất thường.",
    plan: "Đi khám sớm nếu có nốt đau sâu để lại sẹo, phát ban tái phát, thương tổn lan nhanh, nốt ruồi/đốm thay đổi, rụng tóc thành mảng hoặc vấn đề kéo dài dù đã đơn giản routine.",
    boundary: "Sưng môi/mắt, khó thở, sốt cùng phát ban, đau mắt hoặc da phồng rộp/chảy dịch là dấu hiệu không nên chờ một lịch skincare mới.",
  },

  "ban-do-tri-mun-tu-mun-an-den-mun-nang": {
    explain: "Mụn đầu trắng/đen là tổn thương không viêm; sẩn/mụn mủ có viêm; nốt và nang nằm sâu, thường đau và có nguy cơ sẹo cao hơn. 'Mụn ẩn' không phải chẩn đoán chính xác cho mọi nốt li ti.",
    plan: "Chọn treatment theo loại tổn thương nổi trội, giữ cleanser/dưỡng/chống nắng dịu và đánh giá theo nhiều tuần. Mụn sâu, lan rộng hoặc để sẹo nên được bác sĩ lập phác đồ thay vì thử lần lượt mỹ phẩm viral.",
    boundary: "Không chọc/nặn nốt sâu tại nhà. Nếu mụn kèm sốt, sưng quanh mắt hoặc phản ứng nặng sau thuốc/sản phẩm, cần đánh giá y tế.",
    sources: [AAD_ACNE],
  },
  "mun-noi-tiet-quanh-cam-doc-the-nao": {
    explain: "Vị trí quanh cằm không tự chứng minh mụn 'nội tiết'. Gợi ý đáng chú ý hơn là flare lặp lại theo chu kỳ cùng các thay đổi như kinh không đều, rậm lông hoặc rụng tóc.",
    plan: "Theo dõi 2-3 chu kỳ nếu phù hợp, ghi mức viêm và sản phẩm/thuốc đang dùng. Mang nhật ký này khi gặp bác sĩ da liễu hoặc bác sĩ sản-phụ khoa để tránh tự dùng thuốc tác động hormone.",
    boundary: "Mụn đau sâu, để sẹo hoặc đi kèm thay đổi chu kỳ rõ cần khám; không tự mua spironolactone, kháng sinh hay thuốc tránh thai chỉ từ nội dung mạng.",
    sources: [AAD_ACNE],
  },
  "mun-dau-den-co-nen-nan-khong": {
    explain: "Mụn đầu đen là nhân mở bị oxy hóa, không phải bụi bẩn. Nặn có thể lấy nhân tạm thời nhưng không sửa quá trình bít tắc và có thể gây viêm, trầy hoặc thâm.",
    plan: "Ưu tiên làm sạch dịu và sản phẩm chống bít tắc phù hợp như salicylic acid hoặc adapalene khi dùng được; bắt đầu từ từ và đánh giá sau nhiều tuần. Lấy nhân nên do người có chuyên môn thực hiện khi thật sự cần.",
    boundary: "Không dùng kim, dụng cụ không tiệt khuẩn hoặc ép mạnh vùng đang đỏ đau. Nốt dai dẳng có thể là sebaceous filament hay tổn thương khác.",
    sources: [AAD_ACNE],
  },
  "routine-da-mun-nhay-cam": {
    explain: "Da vừa mụn vừa rát thường thất bại vì quá nhiều biến số hơn là vì treatment chưa đủ mạnh. Kích ứng có thể làm thâm sau viêm và khiến người dùng không duy trì được hoạt chất có ích.",
    plan: "Giữ cleanser, dưỡng và chống nắng ổn định; chọn một hoạt chất trị mụn, dùng lượng/tần suất thấp rồi tăng theo khả năng chịu. Có thể dùng dưỡng trước hoặc sau treatment để giảm khó chịu nếu hướng dẫn sản phẩm cho phép.",
    boundary: "Ngừng và đánh giá lại khi có bỏng rát, phù, nứt hoặc mụn viêm tăng nhanh. Mụn sâu/để sẹo không nên bị trì hoãn khám chỉ vì da nhạy cảm.",
    sources: [AAD_ACNE, AAD_TEST],
  },
  "seo-mun-bat-dau-phong-tu-khi-nao": {
    explain: "Phòng sẹo bắt đầu khi kiểm soát viêm và hạn chế thao tác gây tổn thương, không phải chờ mụn hết mới nghĩ đến sẹo. Nốt/nang sâu và tiền sử gia đình để sẹo làm nguy cơ cao hơn.",
    plan: "Điều trị mụn đang hoạt động sớm, không nặn, chống nắng để hạn chế thâm và chụp ảnh theo tháng. Chỉ đánh giá thủ thuật sẹo sau khi loại sẹo và tình trạng mụn được bác sĩ xác định.",
    boundary: "Không tự lăn kim, TCA cross hay peel sâu trên mụn viêm. Các thủ thuật sai độ sâu có thể tạo sẹo và tăng sắc tố.",
    sources: [AAD_ACNE],
  },

  "pillar-sang-da-va-chong-nang-an-toan": {
    explain: "Thâm sau viêm, nám và đốm do nắng có cơ chế và thời gian cải thiện khác nhau. Mục tiêu an toàn là đều màu dần, không thay đổi màu da nền trong vài ngày.",
    plan: "Dùng sunscreen broad-spectrum SPF 30+, water-resistant khi cần và thoa lại theo hoạt động; xử lý nguyên nhân viêm trước rồi mới chọn một hoạt chất làm sáng phù hợp.",
    boundary: "Sản phẩm không nhãn rõ, hứa trắng cấp tốc hoặc gây bong rát không phải lộ trình an toàn. Đốm thay đổi hình dạng/màu, chảy máu hay nám tiến triển cần bác sĩ.",
    sources: [AAD_SUN, FDA_LIGHTENING],
  },
  "vitamin-c-dung-sang-hay-toi": {
    explain: "Vitamin C có thể được dùng sáng hoặc tối; khả năng chịu, độ ổn định công thức và việc dùng đều quan trọng hơn một giờ 'chuẩn'. Dùng buổi sáng không thay thế sunscreen.",
    plan: "Nếu muốn dùng sáng, đặt sau làm sạch và trước dưỡng/chống nắng; nếu dễ châm chích hoặc routine sáng quá nhiều lớp, chuyển sang tối. Giữ chai theo hướng dẫn và bỏ nếu màu/mùi thay đổi bất thường theo cảnh báo hãng.",
    boundary: "Không tiếp tục vì nghĩ châm chích càng nhiều càng hiệu quả. Da đang viêm hoặc dùng nhiều acid/retinoid nên thêm vitamin C từ từ.",
    sources: [AAD_SUN],
  },
  "tranexamic-acid-hop-ai": {
    explain: "Tranexamic acid bôi ngoài da được nghiên cứu cho tăng sắc tố nhưng kết quả phụ thuộc công thức và chẩn đoán. Tranexamic acid đường uống là thuốc có nguy cơ toàn thân và không phải supplement làm sáng để tự dùng.",
    plan: "Chỉ cân nhắc bản bôi khi nền chống nắng ổn và mục tiêu là thâm/nám đã được đọc đúng; patch test, thêm một thay đổi và theo dõi ảnh cùng ánh sáng.",
    boundary: "Không tự mua dạng uống hoặc dùng thuốc của người khác. Nám lan nhanh, mang thai/cho con bú, tiền sử huyết khối hay đang dùng thuốc cần hỏi bác sĩ.",
  },
  "da-xin-mau-do-thieu-ngu-hay-skincare": {
    explain: "'Xỉn màu' có thể đến từ khô/mất nước, bề mặt không đều, sắc tố, nắng hoặc ánh sáng quan sát. Thiếu ngủ có thể làm vẻ ngoài mệt hơn nhưng không đủ để chẩn đoán nguyên nhân da.",
    plan: "So ảnh trong cùng ánh sáng, kiểm tra mức ngủ và chống nắng, sau đó ổn định dưỡng ẩm 2-4 tuần trước khi thêm tẩy da chết hoặc hoạt chất làm sáng.",
    boundary: "Mệt kéo dài, xanh xao, sụt cân hoặc thay đổi toàn thân cần được đánh giá sức khỏe; mỹ phẩm không xử lý thiếu máu hay bệnh nền.",
  },
  "dau-hieu-san-pham-lam-trang-khong-an-toan": {
    explain: "Cảnh báo gồm nhãn/nguồn bán mập mờ, không có danh sách thành phần, hứa trắng vài ngày, yêu cầu chịu rát/bong hoặc trộn nhiều hũ không định danh. Một số sản phẩm làm sáng bất hợp pháp có thể chứa mercury hoặc hydroquinone không khai báo.",
    plan: "Kiểm tra nhà sản xuất, INCI, hướng dẫn, cảnh báo và kênh phản ứng; tránh hàng sang chiết không truy xuất. Nếu đã dùng, chụp nhãn và danh sách sản phẩm để bác sĩ xem khi có phản ứng.",
    boundary: "Dừng và đi khám khi có phù mặt, phát ban, bỏng, da đổi màu bất thường hoặc triệu chứng thần kinh/toàn thân. Không tự 'cai' sản phẩm nghi chứa corticosteroid bằng một routine mạng nếu da đang viêm nặng.",
    sources: [FDA_LIGHTENING],
  },

  "cach-doc-ingredient-list-cho-nguoi-moi": {
    explain: "Ở mỹ phẩm bán lẻ tại Mỹ, thành phần thường được liệt kê theo thứ tự hàm lượng giảm dần; nhóm 1% hoặc thấp hơn và chất màu có ngoại lệ về thứ tự. INCI không cho biết đầy đủ nồng độ hay chất lượng nguyên liệu.",
    plan: "Đọc năm nhóm: nền dung môi, chất giữ ẩm/làm mềm, hoạt chất mục tiêu, chất bảo quản và hương liệu/chất màu; sau đó đối chiếu dạng sản phẩm, bao bì và hướng dẫn dùng.",
    boundary: "Không kết luận một sản phẩm tốt/xấu chỉ vì một thành phần đứng cao hoặc thấp. Dị ứng và kích ứng phụ thuộc cá nhân và toàn công thức.",
    sources: [FDA_LABEL],
  },
  "retinoid-retinal-retinol-khac-nhau-the-nao": {
    explain: "Retinoid là tên nhóm dẫn xuất vitamin A; retinol và retinal là lựa chọn mỹ phẩm, còn một số retinoid là thuốc. Mạnh/yếu thực tế còn phụ thuộc nồng độ, công thức và cách dùng.",
    plan: "Bắt đầu với lựa chọn thấp, dùng buổi tối cách ngày, dưỡng và chống nắng; không đồng thời tăng acid hay treatment khác. Cho da nhiều tuần để thích nghi nếu chỉ khô nhẹ, không cố chịu viêm.",
    boundary: "Retinoid không dùng trong thai kỳ theo hướng dẫn AAD. Da đang đỏ viêm nhiều, dị ứng hoặc có bệnh da nên hỏi bác sĩ trước.",
    sources: [{ label: "AAD: Retinoid or retinol?", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol" }],
  },
  "peptide-trong-skincare-co-dang-mua-khong": {
    explain: "Peptide là nhóm rất rộng; tên peptide, nồng độ, hệ công thức và dữ liệu sản phẩm mới quyết định kỳ vọng. Claim 'tăng collagen' không có nghĩa hiệu quả tương đương thủ thuật hay thuốc.",
    plan: "Xem peptide như bước hỗ trợ nếu routine nền đã ổn, texture dễ dùng và giá phù hợp; so sánh giá/ml và dữ liệu của công thức thay vì đếm số peptide trên hộp.",
    boundary: "Không bỏ sunscreen, moisturizer hoặc điều trị được kê để thay bằng serum peptide. Da phản ứng với nền công thức vẫn có thể xảy ra dù peptide nghe dịu.",
  },
  "hoat-chat-nao-khong-nen-phoi-cung-toi": {
    explain: "Không có danh sách cấm tuyệt đối cho mọi công thức, nhưng xếp chồng retinoid, acid tẩy da chết, benzoyl peroxide hoặc treatment mạnh dễ làm tổng tải kích ứng vượt ngưỡng cá nhân.",
    plan: "Tách hoạt chất theo đêm hoặc sáng/tối, chỉ thay một biến số và ưu tiên mục tiêu chính. Nếu sản phẩm kê đơn có hướng dẫn riêng, làm theo người kê thay vì mẹo phối mạng.",
    boundary: "Rát, đỏ, bong nứt và đau là lý do giảm tải; không dùng thêm acid để 'tẩy lớp hỏng'. Phản ứng phù/ngứa lan có thể là dị ứng, cần dừng.",
    sources: [AAD_TEST],
  },
  "pregnancy-safe-ingredient-checklist": {
    explain: "'Pregnancy-safe' không phải con dấu chung cho cả sản phẩm. AAD khuyên tránh retinoid, hydroquinone và một số thuốc trong thai kỳ; nhiều thành phần khác cần dùng hạn chế hoặc trao đổi với bác sĩ.",
    plan: "Lập danh sách mọi thuốc bôi/uống và mỹ phẩm treatment, mang INCI cho bác sĩ sản khoa/da liễu; giữ routine nền làm sạch, dưỡng và chống nắng đơn giản.",
    boundary: "Không tự ngừng thuốc kê đơn đột ngột và không dựa vào app quét thành phần như quyết định cuối. Thai kỳ, chuẩn bị mang thai và cho con bú có thể cần hướng dẫn khác nhau.",
    sources: [{ label: "AAD: Dermatologist-approved pregnancy skin care", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care" }],
  },

  "cach-doc-review-my-pham-dang-tin": {
    explain: "Review hữu ích phải cho biết người dùng là ai, vấn đề gì, dùng sản phẩm thế nào, trong bao lâu và có thay đổi gì khác. Ảnh đẹp hay kết luận mạnh không thay thế bối cảnh.",
    plan: "Tách ba lớp: dữ kiện quan sát được, trải nghiệm cá nhân và claim của hãng; tìm disclosure tài trợ/quà tặng/affiliate ngay cạnh nội dung rồi đối chiếu nhiều nguồn.",
    boundary: "Không xem testimonial là bằng chứng điều trị. Review không nói nhược điểm, thời gian dùng hoặc quan hệ thương mại nên có trọng số thấp hơn.",
    sources: [FTC_DISCLOSURE],
  },
  "cach-tinh-gia-tri-that-cua-mot-serum": {
    explain: "Giá trị không chỉ là giá/ml: còn gồm lượng mỗi lần, số lần dùng, hạn sau mở nắp, khả năng dùng hết và liệu serum có thay thế bước nào hay chỉ trùng công dụng.",
    plan: "Tính chi phí 30 ngày từ dung tích và tần suất dự kiến; so sánh công thức cùng mục tiêu, bao bì, chính sách đổi trả và provenance. Chọn size nhỏ nếu chưa biết khả năng chịu.",
    boundary: "Không coi nồng độ cao hơn hay nhiều hoạt chất hơn luôn đáng tiền. Sản phẩm gây kích ứng hoặc không dùng đều có giá trị thực bằng không dù giá/ml thấp.",
  },
  "san-pham-viral-co-nen-mua-ngay-khong": {
    explain: "Độ viral đo tốc độ lan truyền chứ không đo độ phù hợp. Nội dung lặp lại có thể đến từ cùng một chiến dịch, cùng brief hoặc thuật toán, không phải nhiều bằng chứng độc lập.",
    plan: "Chờ 48 giờ, ghi vấn đề sản phẩm cần giải quyết, kiểm tra INCI/hướng dẫn/nguồn bán và tìm review dài hạn trên người có bối cảnh giống mình. Chỉ mua nếu nó vượt shortlist hiện tại.",
    boundary: "Không mua vì countdown, số bán không kiểm chứng hoặc sợ bỏ lỡ. Treatment mạnh và thiết bị nên có bước kiểm tra an toàn riêng.",
    sources: [FTC_DISCLOSURE],
  },
  "dau-hieu-review-affiliate-thieu-minh-bach": {
    explain: "Quan hệ vật chất gồm tiền, quà, giảm giá, việc làm hoặc quan hệ cá nhân; disclosure cần rõ và đặt cùng endorsement. Chỉ tag brand hoặc ghi từ mơ hồ không giúp người xem đánh giá thiên lệch.",
    plan: "Tìm #ad/sponsored hoặc câu nói rõ được tặng/trả phí/nhận hoa hồng; kiểm tra creator có mô tả trải nghiệm thật và giới hạn claim hay không.",
    boundary: "Affiliate không tự làm review sai, nhưng thiếu disclosure làm giảm độ tin cậy. Không public lại claim sức khỏe nếu không có bằng chứng phù hợp.",
    sources: [FTC_DISCLOSURE],
  },
  "checklist-mua-my-pham-online-an-toan": {
    explain: "Một listing an toàn cần xác định được tên sản phẩm/biến thể, người bán, thành phần/nhãn, tình trạng seal, hạn dùng hoặc PAO và chính sách đổi trả. Batch code một mình không chứng minh hàng thật.",
    plan: "Ưu tiên kênh hãng/nhà bán được hãng liệt kê, lưu hóa đơn và ảnh mở hộp, so bao bì với nguồn chính thức và không dùng nếu màu/mùi/kết cấu bất thường.",
    boundary: "Giá thấp bất thường, nhãn thiếu, hàng sang chiết hoặc claim điều trị không hợp lý là lý do bỏ qua. Báo phản ứng cho nhà sản xuất/cơ quan phù hợp và đi khám khi nặng.",
    sources: [FDA_LABEL],
  },

  "pillar-bodycare-theo-tung-vung-co-the": {
    explain: "Lưng/ngực dễ bít tắc và viêm nang lông; nách/bikini chịu ma sát, cạo và sản phẩm khử mùi; tay chân thường khô hơn. Mỗi vùng cần mục tiêu và độ mạnh riêng.",
    plan: "Bắt đầu bằng làm sạch vừa đủ, dưỡng vùng khô, thay đồ sau đổ mồ hôi và giảm ma sát; sau đó thêm treatment đúng vùng, thử trên diện tích nhỏ.",
    boundary: "Không dùng acid mạnh trên vùng niêm mạc, da mới cạo hoặc da trầy. Nốt đau, mủ, áp-xe hoặc lan rộng cần khám.",
    sources: [AAD_FOLLICULITIS],
  },
  "tham-nach-do-ma-sat-hay-deodorant": {
    explain: "Thâm nách có thể theo sau ma sát, cạo/wax, viêm hoặc dị ứng sản phẩm; mảng dày sẫm kiểu nhung cũng có thể liên quan tình trạng sức khỏe. Màu sẫm không tự chứng minh vệ sinh kém.",
    plan: "Tạm dừng sản phẩm mới, giảm cạo sát/ma sát, dùng dưỡng dịu và theo dõi ngứa/đỏ trước khi thử hoạt chất làm sáng nồng độ thấp.",
    boundary: "Mảng dày lan ở cổ/bẹn, đau, mùi/chảy dịch hoặc không cải thiện cần bác sĩ; không chà chanh, baking soda hay peel mạnh.",
  },
  "body-mist-co-thay-deodorant-khong": {
    explain: "Body mist tạo hương; deodorant giảm/che mùi liên quan vi khuẩn; antiperspirant giảm tiết mồ hôi tạm thời. Một sản phẩm chỉ thay được sản phẩm khác nếu nhãn và hoạt chất có đúng chức năng.",
    plan: "Chọn theo nhu cầu: mùi hương, kiểm soát mùi hay mồ hôi; dùng trên da lành theo nhãn và tránh xịt dày lên nách vừa cạo.",
    boundary: "Mùi cơ thể thay đổi đột ngột, mồ hôi quá mức hoặc phát ban kéo dài cần đánh giá; xịt thêm hương không xử lý nguyên nhân.",
  },
  "chong-nang-body-khi-di-bien": {
    explain: "Ở biển, nước, mồ hôi và khăn làm giảm lớp sunscreen. Water-resistant chỉ có nghĩa chịu nước trong thời gian thử nghiệm ghi trên nhãn, không phải chống nước cả ngày.",
    plan: "Chọn broad-spectrum SPF 30+ water-resistant, thoa đủ trước khi ra nắng và thoa lại sau bơi/lau người hoặc theo nhãn; kết hợp áo, mũ, bóng râm.",
    boundary: "Không dùng một lần buổi sáng cho cả ngày. Cháy nắng phồng rộp, sốt, chóng mặt hoặc diện rộng cần được chăm sóc y tế.",
    sources: [AAD_SUN],
  },
  "khi-mun-body-la-viem-nang-long-nang": {
    explain: "Folliculitis có thể giống mụn nhưng bắt đầu ở nang lông, đôi khi do cạo, ma sát, đồ bó hoặc vi sinh vật. Điều trị mụn thông thường có thể không phù hợp mọi nguyên nhân.",
    plan: "Ngừng cạo/wax vùng bị ảnh hưởng, đổi đồ sau tập, giảm ma sát và giữ dụng cụ sạch. Tổn thương tái phát nên được bác sĩ xác định nguyên nhân.",
    boundary: "Đau tăng, mủ nhiều, cục sâu, đỏ lan, sốt hoặc sẹo là mốc đi khám; không tự chọc dẫn lưu.",
    sources: [AAD_FOLLICULITIS],
  },

  "pillar-cham-toc-va-da-dau-theo-van-de": {
    explain: "Bết, gàu, ngứa, gãy và rụng là các vấn đề khác nhau. Một dầu gội làm thân tóc mượt không chứng minh tác động lên chu kỳ nang tóc.",
    plan: "Ghi triệu chứng nằm ở da đầu hay thân tóc, quan sát vảy/đỏ/đường ngôi và routine hóa chất-nhiệt; chọn dầu gội cho da đầu, conditioner cho thân tóc.",
    boundary: "Rụng thành mảng, đau/mủ, sẹo da đầu hoặc rụng tiến triển cần khám sớm.",
    sources: [AAD_HAIR_SHEDDING, AAD_DANDRUFF],
  },
  "toc-nhanh-bet-nen-goi-moi-ngay-khong": {
    explain: "Tần suất gội nên theo lượng dầu, mồ hôi, texture tóc và sản phẩm tạo kiểu. Gội hàng ngày không tự gây rụng từ nang nếu thao tác dịu, nhưng chất làm sạch quá mạnh có thể làm thân tóc/da đầu khó chịu.",
    plan: "Điều chỉnh tần suất để da đầu sạch và thoải mái, tập trung shampoo ở scalp, xả kỹ và đặt conditioner ở thân/ngọn. Kiểm tra residue từ dry shampoo hoặc wax.",
    boundary: "Bết kèm đỏ, vảy dày, đau hoặc rụng tăng không nên chỉ đổi tần suất gội.",
  },
  "dau-goi-tri-gau-dung-bao-lau": {
    explain: "Dầu gội trị gàu có các hoạt chất khác nhau; hiệu quả phụ thuộc đưa sản phẩm lên da đầu và để đúng thời gian trên nhãn. Gàu cũng có thể chồng lấp viêm da tiết bã, psoriasis hoặc eczema.",
    plan: "Chọn một hoạt chất, dùng đúng nhãn trong vài tuần và có thể luân phiên hoạt chất nếu hướng dẫn phù hợp; giảm tần suất duy trì khi đã kiểm soát.",
    boundary: "Không cải thiện, vảy rất dày, đỏ đau, chảy dịch hoặc rụng tóc cần bác sĩ.",
    sources: [AAD_DANDRUFF],
  },
  "toc-rung-sau-stress-theo-doi-the-nao": {
    explain: "Rụng tóc lan tỏa sau stress/sốt/phẫu thuật thường xuất hiện trễ hơn sự kiện; cần phân biệt shedding tăng với vùng tóc ngừng mọc, đường ngôi rộng hoặc mảng trống.",
    plan: "Ghi mốc sự kiện 2-4 tháng trước, chụp đường ngôi cùng ánh sáng mỗi tháng và rà thuốc/dinh dưỡng với bác sĩ; chăm tóc dịu trong khi theo dõi.",
    boundary: "Rụng thành mảng, đau/vảy/sẹo da đầu, triệu chứng toàn thân hoặc kéo dài cần khám; không tự bổ sung liều cao khi chưa biết thiếu chất.",
    sources: [AAD_HAIR_SHEDDING],
  },
  "da-dau-do-dau-co-nen-tu-doi-dau-goi": {
    explain: "Đỏ và đau không còn là vấn đề 'tóc không hợp dầu gội' đơn thuần; có thể là kích ứng, dị ứng, viêm da, nhiễm trùng hoặc bệnh da đầu.",
    plan: "Dừng sản phẩm mới/thuốc nhuộm, xả sạch, không gãi và ghi ảnh; đặt lịch khám nếu không giảm nhanh hoặc tái phát.",
    boundary: "Mủ, sưng, sốt, đỏ lan, đau dữ dội hoặc rụng thành vùng cần khám sớm; không đắp tinh dầu đậm đặc lên da đang viêm.",
  },

  "pillar-makeup-theo-nen-da-va-dip-dung": {
    explain: "Base nên được chọn theo độ che phủ, finish, thời gian và tình trạng da; eye/lip products cần đúng vùng sử dụng. Makeup lâu trôi thường đòi hỏi làm sạch kỹ hơn nhưng không đồng nghĩa chà mạnh.",
    plan: "Chuẩn bị nền đơn giản, chọn một lớp mỏng rồi tăng coverage tại điểm cần; vệ sinh cọ/mút, không dùng chung sản phẩm mắt và tẩy trang trước ngủ.",
    boundary: "Không makeup lên vùng nhiễm trùng, vết thương hở hoặc mắt đang viêm; dừng sản phẩm gây rát/ngứa.",
    sources: [FDA_EYE],
  },
  "kem-nen-cushion-skin-tint-khac-gi-nhau": {
    explain: "Skin tint thường nhẹ/ít che phủ; foundation có dải coverage/finish rộng; cushion mô tả hệ bao bì và cách lấy sản phẩm hơn là một mức che phủ cố định.",
    plan: "So finish, coverage, shade, khả năng dặm và vệ sinh applicator; thử dưới ánh sáng tự nhiên và quan sát sau vài giờ trên vùng dầu/khô.",
    boundary: "Không chọn chỉ theo nhãn 'cho da dầu/khô'. Cushion dùng chung hoặc bông bẩn tăng nguy cơ nhiễm bẩn.",
  },
  "mascara-bi-lem-do-dau": {
    explain: "Mascara lem có thể do dầu mí, nước mắt, công thức tan trong dầu/nước, lượng chải hoặc sản phẩm mắt bên dưới; không phải lúc nào cũng do mascara kém chất lượng.",
    plan: "Giảm skincare sát chân mi, chải lớp mỏng, thử tubing/water-resistant theo nhu cầu và kiểm tra mascara trên một ngày bình thường trước sự kiện.",
    boundary: "Không thêm nước hay nước bọt vào mascara khô; bỏ sản phẩm theo PAO/khuyến nghị hãng và bỏ ngay sau nhiễm trùng mắt.",
    sources: [FDA_EYE],
  },
  "co-hay-mut-tan-nen-hop-ai": {
    explain: "Cọ thường cho kiểm soát vị trí/coverage tốt; mút ẩm thường cho lớp mỏng, hòa vào nền nhưng hút sản phẩm hơn. Kết quả còn phụ thuộc công thức và kỹ thuật.",
    plan: "Chọn dụng cụ dễ vệ sinh và phù hợp finish; giặt, xả và phơi khô hoàn toàn, không cất ẩm hoặc dùng chung.",
    boundary: "Mút có mùi, nấm mốc, rách hoặc không khô cần bỏ. Dụng cụ bẩn có thể làm da/mắt kích ứng.",
  },
  "dung-tester-makeup-mat-co-an-toan-khong": {
    explain: "Tester vùng mắt có nguy cơ nhiễm bẩn cao vì nhiều người chạm vào sản phẩm/applicator. FDA khuyên nếu phải thử tại cửa hàng, chỉ dùng dụng cụ dùng một lần sạch.",
    plan: "Thử màu trên thẻ/vùng tay khi có thể; không dùng mascara/liner tester trực tiếp lên mắt và không chia sẻ eye cosmetics.",
    boundary: "Không thử khi mắt hoặc da quanh mắt đang viêm. Kích ứng kéo dài, đau mắt hay thay đổi thị lực cần bác sĩ mắt.",
    sources: [FDA_EYE],
  },

  "pillar-chon-mui-huong-theo-dip-va-mua": {
    explain: "Top/middle/base notes mô tả tiến trình mùi nhưng trải nghiệm thực tế thay đổi theo người và môi trường. Projection, sillage và longevity là ba tiêu chí khác nhau.",
    plan: "Thử trên blotter rồi da, chờ drydown vài giờ, ghi số xịt và bối cảnh. Mua sample/decant có nguồn trước full bottle khi chưa biết khả năng chịu.",
    boundary: "Không xịt vào mắt, niêm mạc hoặc da tổn thương; dừng nếu gây phát ban, khó thở hoặc đau đầu đáng kể.",
  },
  "nuoc-hoa-van-phong-nen-toa-bao-xa": {
    explain: "Không có khoảng tỏa chuẩn cho mọi văn phòng; không gian kín, điều hòa, mật độ người và chính sách scent-free quyết định mức phù hợp.",
    plan: "Bắt đầu 1-2 xịt ở vùng được quần áo che nhẹ, hỏi người gần đáng tin và tránh dặm trong phòng chung. Mùi nên được nhận ra ở khoảng trò chuyện gần, không đi trước người dùng qua nhiều bàn.",
    boundary: "Tôn trọng đồng nghiệp có hen, migraine hoặc nhạy hương; scent etiquette quan trọng hơn độ lưu hương.",
  },
  "mui-gourmand-mua-nong-dung-sao-cho-khong-gat": {
    explain: "Nhiệt và mồ hôi có thể làm cảm nhận mùi ngọt/dày mạnh hơn, nhưng phản ứng tùy công thức. Không cần loại bỏ gourmand; cần giảm liều và thử trong điều kiện thật.",
    plan: "Dùng ít xịt hơn, chọn vị trí xa mặt, tránh layering nhiều sản phẩm có hương và đánh giá sau 1-2 giờ ngoài trời/điều hòa.",
    boundary: "Không dùng xịt để che mùi cơ thể thay cho vệ sinh/deodorant; dừng nếu gây khó chịu hoặc phản ứng da.",
  },
  "layer-lotion-va-perfume-the-nao": {
    explain: "Dưỡng ẩm có thể làm mùi bám khác trên da, còn lotion có hương tạo thêm một accord. Layering không có công thức bắt buộc và có thể làm tổng hương quá mạnh.",
    plan: "Bắt đầu với lotion không hương hoặc cùng family, đợi thấm rồi dùng ít nước hoa; thử tổ hợp trên vùng nhỏ trong một ngày trước sự kiện.",
    boundary: "Không trộn trực tiếp sản phẩm trong chai và không layer lên da đang kích ứng; nhiều hương liệu hơn có thể tăng nguy cơ phản ứng.",
  },
  "dau-hieu-kich-ung-huong-lieu": {
    explain: "Hương liệu có thể gây kích ứng hoặc allergic contact dermatitis với đỏ, ngứa, sưng hay mụn nước; đau đầu/khó chịu do mùi không nhất thiết là dị ứng da nhưng vẫn là lý do ngừng phơi nhiễm.",
    plan: "Rửa vùng tiếp xúc, dừng sản phẩm và lưu nhãn/INCI; nếu phản ứng tái diễn, bác sĩ có thể cân nhắc patch testing.",
    boundary: "Sưng môi/mắt, khò khè hoặc khó thở cần hỗ trợ khẩn cấp. 'Hypoallergenic' không bảo đảm không phản ứng.",
    sources: [{ label: "FDA: Allergens in cosmetics", url: "https://www.fda.gov/cosmetics/cosmetic-ingredients/allergens-cosmetics" }],
  },

  "pillar-grooming-nam-it-buoc": {
    explain: "Routine ngắn có thể gồm cleanser theo nhu cầu, moisturizer, sunscreen và một bước cho vấn đề chính; cạo râu và sản phẩm tóc/mùi cơ thể là module riêng.",
    plan: "Gắn bước vào thói quen sẵn có: rửa dịu sau vận động, dưỡng sau cạo và sunscreen water-resistant khi ra ngoài; chỉ thêm trị mụn/gàu khi cần.",
    boundary: "Sản phẩm 'for men' không tự tốt hơn. Mụn sâu, da đầu viêm hoặc vùng râu có mủ cần đánh giá chuyên môn.",
  },
  "sua-rua-mat-nam-co-can-rieng-khong": {
    explain: "Cleanser không cần phân giới tính; cần khớp lượng dầu, sunscreen, mụn và độ nhạy cảm. Cảm giác rít mạnh không chứng minh sạch tốt hơn.",
    plan: "Dùng nước ấm và lượng vừa đủ, massage bằng tay rồi rửa; nếu căng/rát sau rửa, giảm tần suất hoặc đổi công thức dịu hơn.",
    boundary: "Không dùng scrub hạt để xử lý mụn viêm. Đỏ/ngứa kéo dài có thể là bệnh da chứ không phải 'da nam khỏe'.",
  },
  "aftershave-lam-rat-da-phai-lam-sao": {
    explain: "Rát sau cạo thường đến từ ma sát, lưỡi cùn, cạo ngược chiều hoặc aftershave nhiều cồn/hương; nốt mủ quanh lông có thể là folliculitis/razor bumps.",
    plan: "Tạm ngừng aftershave gây rát, chườm mát, dùng dưỡng đơn giản; lần sau làm mềm râu, dùng lưỡi sạch sắc và cạo cùng chiều mọc.",
    boundary: "Mủ, cục đau, đỏ lan hoặc để sẹo cần bác sĩ. Không tiếp tục cạo sát vùng đang viêm.",
    sources: [AAD_FOLLICULITIS],
  },
  "chong-nang-cho-nam-choi-the-thao": {
    explain: "Khi vận động, yếu tố quyết định là water resistance, độ bám, khả năng không cay mắt và sự sẵn sàng thoa lại; nhãn 'nam' không phải tiêu chí bảo vệ.",
    plan: "Chọn broad-spectrum SPF 30+ water-resistant, thoa trước hoạt động, dùng mũ/áo và thoa lại sau đổ mồ hôi nhiều hoặc lau mặt theo nhãn.",
    boundary: "Không dựa vào một lần thoa cho buổi tập dài. Sản phẩm cay mắt nên đổi công thức/vị trí, không bỏ bảo vệ hoàn toàn.",
    sources: [AAD_SUN],
  },
  "viem-nang-long-vung-rau-khi-nao-can-kham": {
    explain: "Nốt quanh râu có thể là razor bumps do lông mọc ngược hoặc folliculitis nhiễm trùng; bóp nặn và cạo sát tiếp làm tổn thương nang tăng.",
    plan: "Ngừng cạo sát, dùng dụng cụ sạch và chườm ấm nếu phù hợp; gặp bác sĩ khi tái phát để phân biệt nguyên nhân và tránh sẹo.",
    boundary: "Mủ nhiều, đau tăng, đỏ lan, sốt hoặc cục sâu cần khám; không tự dùng kháng sinh bôi kéo dài.",
    sources: [AAD_FOLLICULITIS],
  },

  "pillar-chon-clinic-treatment-an-toan": {
    explain: "Tên dịch vụ marketing không đủ để biết can thiệp gì. Cần biết chẩn đoán/mục tiêu, người thực hiện, sản phẩm/thiết bị và mức xâm lấn.",
    plan: "Hỏi chỉ định, lựa chọn thay thế, số buổi, downtime, tác dụng phụ, kế hoạch aftercare và kênh xử lý ngoài giờ; yêu cầu consent trước khi làm.",
    boundary: "Không làm nếu cơ sở né tên thiết bị/sản phẩm, không hỏi bệnh sử/thuốc hoặc không có kế hoạch biến chứng.",
    sources: [AAD_CLINIC],
  },
  "peel-da-tai-clinic-khac-peel-tai-nha-the-nao": {
    explain: "Peel khác nhau ở loại acid, nồng độ, pH, số lớp, độ sâu và khả năng kiểm soát biến chứng. Peel trung bình/sâu tạo vết thương có downtime và không tương đương sản phẩm tẩy da chết tại nhà.",
    plan: "Khai báo thuốc, tiền sử sẹo lồi/herpes và tone da; hỏi độ sâu, thời gian lành, chống nắng và lịch follow-up. Tại nhà chỉ dùng sản phẩm đúng nhãn trên da lành.",
    boundary: "Không tự mua peel chuyên nghiệp. Đau tăng, phồng rộp, sưng hoặc dấu nhiễm trùng sau peel cần liên hệ nơi làm/bác sĩ.",
    sources: [AAD_PEEL],
  },
  "hydrafacial-co-thay-skincare-khong": {
    explain: "Hydradermabrasion/facial có thể cho cảm giác sạch và ẩm tạm thời nhưng không thay sunscreen, routine nền hay điều trị bệnh da. Kết quả phụ thuộc protocol và tình trạng da.",
    plan: "Xác định mục tiêu ngắn hạn, hỏi các dung dịch/đầu máy được dùng, giảm treatment kích ứng quanh buổi làm theo hướng dẫn và vẫn duy trì chăm sóc nền.",
    boundary: "Da đang viêm, nhiễm trùng, trầy hoặc vừa làm thủ thuật khác cần được người có chuyên môn đánh giá trước; không chấp nhận đau rát mạnh như bình thường.",
    sources: [AAD_CLINIC],
  },
  "triet-long-laser-can-hoi-gi": {
    explain: "Laser nhắm sắc tố ở nang lông nên kết quả/nguy cơ phụ thuộc màu da, màu/độ thô lông, thiết bị và kinh nghiệm người làm. Nhiều buổi thường cần vì chu kỳ lông.",
    plan: "Hỏi model laser, kinh nghiệm với tone da của mình, số buổi dự kiến, test spot, chống chỉ định, chi phí và xử lý bỏng/tăng sắc tố; khai báo tan nắng, sẹo lồi, herpes và thuốc.",
    boundary: "Tránh cơ sở không khám/consult hoặc hứa sạch vĩnh viễn 100%. Bỏng, phồng rộp hay đổi sắc tố sau làm cần liên hệ chuyên môn.",
    sources: [AAD_LASER],
  },
  "dau-hieu-nhiem-trung-sau-thu-thuat": {
    explain: "Đỏ/đau nhẹ có thể nằm trong downtime dự kiến, nhưng xu hướng nặng dần, nóng, sưng, mủ, mùi, vệt đỏ lan hoặc sốt là cảnh báo nhiễm trùng/biến chứng.",
    plan: "Giữ hướng dẫn aftercare và số liên hệ cơ sở, chụp ảnh theo giờ/ngày, không tự bóc vảy hoặc bôi sản phẩm lạ; liên hệ người thực hiện khi diễn biến lệch dự kiến.",
    boundary: "Đau dữ, sốt, sưng quanh mắt, khó thở hoặc đỏ lan nhanh cần chăm sóc y tế khẩn; không chờ tới lịch follow-up thường lệ.",
    sources: [AAD_CLINIC, AAD_PEEL],
  },

  "pillar-da-va-loi-song-ngu-stress-hormone": {
    explain: "Stress và thiếu ngủ có thể làm một số bệnh da flare và thay đổi cảm nhận vẻ ngoài, nhưng mối liên hệ không chứng minh một nguyên nhân duy nhất. Hormone cũng không thể được suy ra chỉ từ vị trí mụn.",
    plan: "Theo dõi giấc ngủ, chu kỳ, stress, thuốc và flare theo tuần trong khi giữ routine ổn định; dùng dữ liệu này để trao đổi với bác sĩ khi cần.",
    boundary: "Không tự mua thuốc hormone/supplement hoặc loại bỏ nhiều nhóm thức ăn chỉ từ correlation cá nhân.",
  },
  "an-ngot-co-lam-mun-nang-hon-khong": {
    explain: "Một số nghiên cứu gợi ý chế độ glycemic load cao có thể liên quan mụn ở một số người, nhưng một món ngọt không giải thích toàn bộ bệnh và phản ứng cá nhân khác nhau.",
    plan: "Không cắt cực đoan; ghi khẩu phần và flare trong 6-8 tuần, ưu tiên bữa ăn cân bằng và tiếp tục điều trị mụn có bằng chứng.",
    boundary: "Rối loạn ăn uống, sụt cân hoặc lo âu về thực phẩm cần hỗ trợ chuyên môn. Thay đổi ăn uống không thay thế khám cho mụn sâu/để sẹo.",
  },
  "da-tuoi-30-nen-uu-tien-gi": {
    explain: "Tuổi 30 không tạo một routine bắt buộc. Ưu tiên vẫn là sunscreen, dưỡng phù hợp và giải quyết vấn đề cụ thể như mụn, sắc tố hoặc texture.",
    plan: "Giữ nền ổn định rồi cân nhắc vitamin C hoặc retinoid theo khả năng chịu và thai kỳ; mua một treatment có mục tiêu thay vì nhiều sản phẩm gắn nhãn anti-aging.",
    boundary: "Retinoid tránh trong thai kỳ; nốt/đốm thay đổi hoặc rụng tóc bất thường cần đánh giá riêng.",
    sources: [AAD_SUN],
  },
  "supplement-collagen-co-nen-mua-khong": {
    explain: "Nghiên cứu collagen uống cho da có kết quả không đồng nhất; phân tích gần đây cho thấy lợi ích biến mất ở nhóm nghiên cứu chất lượng cao hoặc không được ngành tài trợ. Supplement không thay thế protein đủ, sunscreen hay điều trị.",
    plan: "Nếu vẫn cân nhắc, kiểm tra liều/nguồn, dị ứng, kiểm nghiệm bên thứ ba, chi phí mỗi ngày và mục tiêu có đo được; trao đổi với bác sĩ nếu mang thai, bệnh nền hoặc dùng thuốc.",
    boundary: "Không kỳ vọng supplement chữa lão hóa, bệnh khớp/da hoặc mọc tóc. Claim điều trị cần bằng chứng và quản lý khác mỹ phẩm.",
    sources: [{ label: "PubMed: 2025 meta-analysis of collagen supplements and skin aging", url: "https://pubmed.ncbi.nlm.nih.gov/40324552/" }],
  },
  "dau-hieu-kem-tron-corticoid": {
    explain: "Trắng/êm rất nhanh rồi đỏ, giãn mạch, mỏng da, mụn dạng viêm hoặc lệ thuộc sản phẩm là tín hiệu đáng nghi, nhưng không thể xác định corticosteroid chỉ bằng nhìn.",
    plan: "Ngừng mua thêm, lưu hũ/nhãn/ảnh thành phần và đặt lịch da liễu; bác sĩ có thể cần kế hoạch giảm/điều trị theo mức tổn thương thay vì dừng-bôi ngẫu nhiên.",
    boundary: "Không tự bôi thêm steroid, acid hoặc retinoid mạnh để 'cai'. Sưng, mủ, đau hoặc tổn thương lan cần khám sớm.",
  },

  "pillar-nail-mi-may-dep-nhung-an-toan": {
    explain: "Cuticle là hàng rào chống nhiễm trùng; keo nail/mi có thể gây dị ứng; vùng mắt và thủ thuật tạo vi tổn thương cần vệ sinh nghiêm ngặt.",
    plan: "Chọn cơ sở làm sạch/khử khuẩn dụng cụ, không dùng chung vật tư một lần, hỏi vật liệu/keo/mực và giữ aftercare bằng văn bản.",
    boundary: "Không làm trên vùng đang đỏ, sưng, nấm/nghi nhiễm trùng; đau, mủ hoặc ảnh hưởng mắt cần khám.",
    sources: [AAD_NAILS, FDA_EYE],
  },
  "nail-cong-so-chon-form-va-mau-the-nao": {
    explain: "Form phù hợp phụ thuộc chiều dài nền móng, thao tác công việc, quy định và khả năng bảo trì. Móng quá dài/nhọn làm tăng lực bẩy và vướng với găng/bàn phím.",
    plan: "Ưu tiên chiều dài không cản thao tác, cạnh bo, màu đúng dress code và loại sơn có lịch tháo/bảo trì thực tế; quan sát móng trần giữa các lần.",
    boundary: "Không cắt cuticle sâu hoặc che tiếp móng đang đổi màu, tách nền hay đau.",
    sources: [AAD_NAILS],
  },
  "serum-duong-mi-co-rui-ro-khong": {
    explain: "Serum dưỡng mi có thể là cosmetic conditioning hoặc chứa/ám chỉ hoạt chất tăng trưởng; claim, thành phần và mức quản lý khác nhau. Vùng mắt đặc biệt nhạy với nhiễm bẩn và kích ứng.",
    plan: "Đọc INCI/hướng dẫn, dùng đúng đường chân mi nếu nhãn cho phép, không chia sẻ và dừng khi đỏ/ngứa; hỏi bác sĩ mắt nếu đang có bệnh mắt hoặc dùng thuốc.",
    boundary: "Đau mắt, sưng, đổi thị lực hay đổi màu vùng mắt cần ngừng và khám. Không dùng thuốc kê đơn mọc mi như mỹ phẩm thông thường.",
    sources: [FDA_EYE],
  },
  "phun-may-bi-tro-mau-vi-sao": {
    explain: "Màu sau phun thay đổi theo sắc tố/mực, độ sâu kỹ thuật, undertone da, tia UV, lành thương và lần dặm. Không thể sửa mọi trổ màu bằng phủ thêm pigment.",
    plan: "Chờ lành đủ, chụp ảnh trong ánh sáng chuẩn và yêu cầu cơ sở ghi loại/màu mực; đánh giá sửa, removal hay để mờ với người có kinh nghiệm.",
    boundary: "Đỏ nóng, đau tăng, mủ, sốt hoặc sưng quanh mắt là biến chứng cần y tế; không tự peel/laser vùng mới phun.",
  },
  "dau-hieu-nhiem-trung-sau-lam-nail": {
    explain: "Đau tăng, sưng, nóng, mủ, mùi, móng tách/đổi màu hoặc vệt đỏ lan khác với hơi nhạy ngay sau làm. Cắt cuticle và dùng dụng cụ/powder chung làm tăng nguy cơ.",
    plan: "Tháo sản phẩm nếu làm được an toàn, giữ vùng sạch/khô, không che thêm lớp mới và chụp ảnh; đi khám khi diễn biến tăng.",
    boundary: "Sốt, đỏ lan, đau giật hoặc người có đái tháo đường/suy giảm miễn dịch cần đánh giá sớm; không tự chọc mủ.",
    sources: [AAD_NAILS],
  },

  "pillar-beauty-tech-dang-mua-hay-khong": {
    explain: "Đánh giá thiết bị phải đi từ indication của model, mức bằng chứng, lịch dùng, contraindications và bảo hành. 'FDA registered' không đồng nghĩa FDA đã đánh giá hiệu quả cho mọi claim.",
    plan: "Tra model và hướng dẫn chính thức, kiểm tra phụ kiện/gel thay thế, chi phí mỗi lần, khả năng dùng đều và chính sách trả; loại thiết bị không công bố thông số/an toàn.",
    boundary: "Thiết bị y khoa hoặc RF microneedling không phải đồ tự làm tại nhà. Implant điện/kim loại, thai kỳ, bệnh da/mắt cần kiểm tra chống chỉ định riêng.",
    sources: [FDA_RF],
  },
  "may-say-tao-kieu-dat-tien-co-dang-mua": {
    explain: "Máy đắt có thể cải thiện tốc độ, kiểm soát nhiệt, trọng lượng, đầu tạo kiểu và bảo hành; không có giá nào tự bảo đảm tóc không hư tổn.",
    plan: "Đo thời gian sấy hiện tại, loại tóc và thao tác cần; so watt/luồng gió, mức nhiệt, trọng lượng, tiếng ồn, bảo hành và khả năng thử/đổi.",
    boundary: "Giữ máy chuyển động, tránh nhiệt cao sát một điểm và ngừng dùng khi dây/đầu máy hỏng, có mùi khét hoặc quá nóng.",
  },
  "ai-soi-da-co-dang-tin-khong": {
    explain: "AI soi da phân loại ảnh theo dữ liệu/ánh sáng/camera và thuật toán của nhà cung cấp; kết quả có thể hữu ích để theo dõi nhất quán nhưng không phải chẩn đoán.",
    plan: "Chụp cùng thiết bị, ánh sáng và khoảng cách; xem xu hướng thay vì một điểm số, hỏi hệ thống lưu/chia sẻ ảnh thế nào và đối chiếu với triệu chứng thật.",
    boundary: "Không dùng AI để quyết định thuốc, loại trừ ung thư da hay trì hoãn khám tổn thương thay đổi/đau/chảy máu.",
  },
  "thiet-bi-nang-co-tai-nha-ky-vong-ra-sao": {
    explain: "Microcurrent/RF/EMS là các cơ chế khác nhau; hiệu ứng tức thời có thể đến từ co cơ, phù/ẩm hoặc ánh sáng chụp. Kết quả dài hạn phải được đọc trên đúng model và lịch dùng.",
    plan: "Chỉ dùng model có hướng dẫn/chống chỉ định rõ, đúng gel/phụ kiện và lịch hãng; chụp ảnh chuẩn, tính thời gian/chi phí trước khi mua.",
    boundary: "Không dùng lên mắt, tuyến giáp, da tổn thương hoặc khi có implant/thiết bị điện nếu hướng dẫn cấm. RF microneedling là thủ thuật y khoa, không dùng tại nhà.",
    sources: [FDA_RF],
  },
  "dau-hieu-thiet-bi-lam-dep-gay-kich-ung": {
    explain: "Đỏ thoáng qua có thể nằm trong hướng dẫn một số máy, nhưng đau, bỏng, phồng rộp, tê, sưng, đỏ kéo dài hoặc thay đổi thị lực là phản ứng bất thường.",
    plan: "Dừng máy, làm mát nhẹ nếu phù hợp, lưu model/setting/thời gian và ảnh; liên hệ hãng/người có chuyên môn, báo sự cố theo kênh quản lý nếu cần.",
    boundary: "Bỏng sâu, đau mắt/thay đổi thị lực, yếu/tê tiến triển hoặc sưng khó thở cần y tế khẩn. Không tăng setting để bù cho việc chưa thấy kết quả.",
    sources: [FDA_RF],
  },
}
