/**
 * Câu hỏi thường gặp về Giải Mã Gia Đình — nguồn sự thật duy nhất cho cả
 * section FAQ hiển thị trên trang chủ (components/seo/InfoSections.tsx) và
 * FAQPage JSON-LD (app/layout.tsx). Hai nơi PHẢI dùng chung dữ liệu này để
 * structured data khớp đúng nội dung người dùng nhìn thấy (yêu cầu của Google).
 *
 * Chỉ ghi những điều đúng với app thật: engine rule-based tiếng Việt, không
 * đăng nhập, lịch sử/đã lưu nằm trên thiết bị (localStorage), dịch được cả
 * khi offline bằng bộ dữ liệu trên máy.
 */
export const FAQS: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: 'Giải Mã Gia Đình là gì?',
    answer:
      'Giải Mã Gia Đình là ứng dụng web miễn phí giúp bạn hiểu ý thật đằng sau tin nhắn của người thân. Bạn dán một câu bố mẹ, con cái, mẹ chồng, nàng dâu, vợ chồng hay sếp vừa nhắn, app sẽ phân tích ý thật, đo mức độ căng thẳng và gợi ý sẵn 3 câu trả lời nhẹ nhàng để bạn gửi lại cho êm chuyện.',
  },
  {
    question: 'App dịch được tin nhắn của những ai?',
    answer:
      'App hỗ trợ nhiều mối quan hệ trong gia đình và quanh gia đình: bố, mẹ, con cái, mẹ chồng, mẹ vợ, nàng dâu, con rể, vợ chồng, người yêu, anh chị em, bạn thân, và cả sếp với đồng nghiệp. Chọn đúng người vừa nhắn rất quan trọng vì cùng một câu nói, ý thật sẽ khác nhau tùy mối quan hệ.',
  },
  {
    question: 'Cách dùng Giải Mã Gia Đình như thế nào?',
    answer:
      'Chỉ cần 3 bước: một, dán nguyên văn tin nhắn vào ô nhập (tối đa 500 ký tự); hai, chọn đúng người vừa nhắn và hoàn cảnh nếu có; ba, bấm nút dịch để xem phần ý thật, điều người ấy muốn nghe, thanh đo mức độ căng thẳng và 3 câu trả lời gợi ý — ưng câu nào thì bấm sao chép rồi gửi.',
  },
  {
    question: 'Mức độ căng thẳng trong kết quả nghĩa là gì?',
    answer:
      'Đó là thang đo của engine phân tích, cho biết câu nói đang mang sắc thái nhẹ nhàng hay đang giận, hờn, trách móc đến mức nào. Nhìn vào mức độ này bạn sẽ biết nên trả lời ngay cho ấm lại, nên xin lỗi trước, hay nên để người ấy nguôi rồi mới nói tiếp.',
  },
  {
    question: 'Câu "tùy con, mẹ sao cũng được" nghĩa là gì?',
    answer:
      'Đây là một trong những câu kinh điển mà app gặp nhiều nhất. Trong đa số hoàn cảnh, "tùy con" không có nghĩa là sao cũng được thật: mẹ thường đã có ý muốn riêng nhưng ngại nói thẳng, và đang chờ con hỏi lại một câu cho chắc. Dán câu này vào app kèm hoàn cảnh cụ thể, bạn sẽ thấy cách đọc ý và câu trả lời phù hợp cho đúng tình huống nhà mình.',
  },
  {
    question: 'Dữ liệu tin nhắn và lịch sử dịch của tôi được lưu ở đâu?',
    answer:
      'Lịch sử đã dịch và các kết quả bạn bấm lưu chỉ nằm trên chính thiết bị của bạn (app giữ tối đa 20 kết quả đã lưu), mở lại trên cùng trình duyệt là thấy, và bạn có thể xoá từng mục hoặc xoá hết bất cứ lúc nào. App không yêu cầu tài khoản nên không có hồ sơ người dùng nào gắn với các câu bạn dịch.',
  },
  {
    question: 'App có cần đăng nhập hay trả phí không?',
    answer:
      'Không. Giải Mã Gia Đình dùng ngay trên trình duyệt, không cần đăng nhập, không cần cài đặt. Bạn cũng có thể thêm app vào màn hình chính như một ứng dụng (PWA) để mở nhanh những lần sau.',
  },
  {
    question: 'Mất mạng thì app còn dịch được không?',
    answer:
      'Có. Khi offline, app vẫn dịch bằng bộ dữ liệu câu mẫu có sẵn trên máy, nên bạn vẫn xem được ý thật và câu trả lời gợi ý cho các câu thường gặp ngay cả khi không có kết nối internet.',
  },
];
