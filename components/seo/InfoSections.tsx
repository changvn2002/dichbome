import { FAQS } from '@/lib/faq';

/**
 * Nội dung chữ tĩnh ở cuối trang chủ — phần để công cụ tìm kiếm (và người lần
 * đầu ghé) đọc hiểu app làm gì, trước khi họ dùng thử. Toàn bộ là nội dung
 * thật về app, không nhồi từ khoá: giới thiệu, cách dùng, các câu "nói một
 * đằng ý một nẻo" thường gặp, và FAQ (dùng chung dữ liệu với FAQPage JSON-LD).
 */
const CLASSIC_PHRASES: ReadonlyArray<{ phrase: string; gloss: string }> = [
  {
    phrase: '“Tùy con, mẹ sao cũng được.”',
    gloss:
      'Thường là mẹ đã có ý riêng nhưng ngại nói thẳng — đang chờ con hỏi lại một câu cho chắc, không phải sao cũng được thật.',
  },
  {
    phrase: '“Không sao đâu.”',
    gloss:
      'Câu trả lời ngắn nhất nhưng khó đoán nhất: có thể là không sao thật, cũng có thể là đang giận mà không muốn nói ra. Hoàn cảnh và người nhắn quyết định ý thật.',
  },
  {
    phrase: '“Ăn cơm chưa con?”',
    gloss:
      'Hiếm khi là câu hỏi về bữa cơm. Với nhiều bố mẹ, đó là cách mở đầu để hỏi con có khoẻ không, có đang ổn không — và là lời mời nói chuyện.',
  },
  {
    phrase: '“Con nhà người ta…”',
    gloss:
      'Câu so sánh kinh điển thường che một nỗi lo hoặc một kỳ vọng chưa nói thành lời. Dịch đúng ý giúp bạn đáp lại phần lo lắng thay vì cãi lại phần so sánh.',
  },
];

export default function InfoSections() {
  return (
    <div className="border-t border-[#E7DDD0] bg-[#FFFDF8] text-ink">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <section aria-labelledby="gioi-thieu">
          <h2 id="gioi-thieu" className="text-2xl font-bold tracking-tight">
            Dịch ý thật sau tin nhắn của người thân
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">
            Người Việt trong nhà ít khi nói thẳng điều mình muốn. Bố mẹ nhắn “tùy con”, mẹ chồng
            nói “để đấy mẹ làm cho”, vợ nhắn “em không sao” — câu chữ một đằng, ý thật một nẻo, và
            trả lời sai một câu là cả nhà mất vui. Giải Mã Gia Đình giúp bạn dịch tiếng bố mẹ và
            người thân theo đúng nghĩa đó: dán tin nhắn vào, app đọc ra ý thật, điều người ấy
            muốn nghe, mức độ căng thẳng của câu nói, và gợi ý sẵn 3 câu trả lời cho êm chuyện để
            bạn chọn trước khi gửi.
          </p>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">
            App chạy bằng engine rule-based tiếng Việt với bộ dữ liệu câu mẫu theo từng mối quan
            hệ — bố mẹ và con, thông gia (mẹ chồng, nàng dâu), vợ chồng và người yêu, anh em và
            bạn bè, cho tới sếp và đồng nghiệp — nên không cần đăng nhập, mở lên là dùng được
            ngay trên điện thoại hay máy tính.
          </p>
        </section>

        <section aria-labelledby="cach-dung" className="mt-12">
          <h2 id="cach-dung" className="text-2xl font-bold tracking-tight">
            Cách dịch một tin nhắn trong 3 bước
          </h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            <li className="rounded-2xl border border-[#E7DDD0] bg-[#FAF6EF] p-5">
              <p className="font-semibold">1. Dán tin nhắn</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Sao chép nguyên văn câu người thân vừa nhắn — tin nhắn Zalo, Messenger hay SMS đều
                được, tối đa 500 ký tự.
              </p>
            </li>
            <li className="rounded-2xl border border-[#E7DDD0] bg-[#FAF6EF] p-5">
              <p className="font-semibold">2. Chọn đúng người nhắn</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Chọn vai người vừa nhắn (mẹ, bố, mẹ chồng, vợ, chồng, sếp…) và hoàn cảnh nếu có.
                Cùng một câu, đổi vai là đổi cách hiểu.
              </p>
            </li>
            <li className="rounded-2xl border border-[#E7DDD0] bg-[#FAF6EF] p-5">
              <p className="font-semibold">3. Xem ý thật, chọn câu trả lời</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                App hiện ý thật, mức độ căng thẳng và 3 câu trả lời gợi ý. Ưng câu nào bấm sao chép
                là gửi được ngay.
              </p>
            </li>
          </ol>
        </section>

        <section aria-labelledby="cau-thuong-gap" className="mt-12">
          <h2 id="cau-thuong-gap" className="text-2xl font-bold tracking-tight">
            Những câu “nói một đằng, ý một nẻo” thường gặp nhất
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {CLASSIC_PHRASES.map((item) => (
              <article
                key={item.phrase}
                className="rounded-2xl border border-[#E7DDD0] bg-[#FAF6EF] p-5"
              >
                <h3 className="font-semibold">{item.phrase}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.gloss}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
            Mỗi câu trên đều có sẵn trong bộ câu mẫu của app — dán vào kèm hoàn cảnh của nhà bạn
            để xem cách đọc ý chi tiết và câu trả lời gợi ý.
          </p>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold tracking-tight">
            Câu hỏi thường gặp
          </h2>
          <div className="mt-4 max-w-3xl space-y-5">
            {FAQS.map((faq) => (
              <article key={faq.question}>
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-1 leading-relaxed text-muted">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
