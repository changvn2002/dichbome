'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQS } from '@/lib/faq';
import { cn } from '@/lib/utils';

/**
 * Tab «Tìm hiểu» của Board (redesign-v2): toàn bộ chữ phụ của app sống ở đây —
 * vẫn render trong HTML (giữ SEO) nhưng không chiếm một pixel nào của sân khấu.
 * Chuỗi chốt theo COPY-DIET §3 #13–16; câu kinh điển chép nguyên văn
 * CLASSIC_PHRASES trong components/seo/InfoSections.tsx; FAQ nguyên văn lib/faq.ts.
 */

/** 4 câu kinh điển — nguyên văn CLASSIC_PHRASES (components/seo/InfoSections.tsx). */
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

const STEPS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: '1. Dán tin nhắn',
    body: 'Sao chép nguyên văn câu người thân vừa nhắn, tối đa 500 ký tự.',
  },
  {
    title: '2. Chọn đúng người nhắn',
    body: 'Chọn vai người vừa nhắn và hoàn cảnh. Đổi vai là đổi cách hiểu.',
  },
  {
    title: '3. Xem ý thật, chọn câu trả lời',
    body: 'Đọc ý thật và 3 câu gợi ý, ưng câu nào bấm sao chép để gửi.',
  },
];

function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between border-t border-line py-3 text-left text-[15px] font-semibold text-ink"
      >
        {title}
        <ChevronDown
          className={cn('size-5 shrink-0 text-muted transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? <div className="pb-4">{children}</div> : null}
    </div>
  );
}

export function FindOutContent({ swUpdateAvailable }: { swUpdateAvailable: boolean }) {
  return (
    <div>
      {swUpdateAvailable ? (
        <div className="mb-4 rounded-xl bg-warn-bg px-4 py-3 text-sm text-ink" role="status">
          Có bản mới của app — tải lại trang để dùng bản mới nhất.
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => window.location.reload()}
          >
            Tải lại
          </button>
        </div>
      ) : null}

      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh brand tĩnh tự host (SVG/WebP đã tối ưu từ asset pack, kích thước cố định chống CLS); next/image không thêm giá trị ở đây */}
        <img
          src="/products/brand/dichbome-banner.svg"
          alt="Gia đình ngồi cạnh nhau xem điện thoại, trên đầu là bong bóng chat hình trái tim"
          className="aspect-[3/1] w-full rounded-xl border border-line-strong bg-stage object-contain"
        />
      </figure>

      <p className="mt-4 text-[15px] leading-relaxed text-ink">
        Người nhà ít khi nói thẳng điều mình muốn: bố mẹ nhắn “tùy con”, vợ nhắn “em không sao” —
        chữ một đằng, ý một nẻo. Dán câu vào sân khấu, app đọc ý thật, mức căng thẳng và gợi ý 3 câu
        trả lời cho êm chuyện. Không cần đăng nhập. Lịch sử và kết quả đã lưu chỉ nằm trên thiết bị
        của bạn.
      </p>

      <div className="mt-2">
        <Disclosure title="Cách dịch 3 bước">
          <ol className="space-y-4">
            {STEPS.map((step) => (
              <li key={step.title}>
                <p className="font-semibold">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </Disclosure>

        <Disclosure title="Những câu “nói một đằng, ý một nẻo” thường gặp">
          <div className="space-y-4">
            {CLASSIC_PHRASES.map((item) => (
              <article key={item.phrase}>
                <h4 className="font-display text-base italic">{item.phrase}</h4>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.gloss}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Mỗi câu trên đều có sẵn trong bộ câu mẫu của app — dán vào kèm hoàn cảnh của nhà bạn để
            xem cách đọc ý chi tiết và câu trả lời gợi ý.
          </p>
        </Disclosure>

        <Disclosure title="Câu hỏi thường gặp">
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <article key={faq.question}>
                <h4 className="text-[15px] font-semibold">{faq.question}</h4>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{faq.answer}</p>
              </article>
            ))}
          </div>
        </Disclosure>

        <Disclosure title="Riêng tư & dữ liệu">
          <p className="text-[15px] leading-relaxed text-muted">
            Mọi dữ liệu — lịch sử dịch, kết quả đã lưu, lựa chọn vai và hoàn cảnh — chỉ nằm trong bộ
            nhớ trình duyệt trên thiết bị này. App không có tài khoản; câu bạn gửi qua engine máy
            chủ chỉ để dịch và không được lưu lại trên máy chủ. Muốn xoá dữ liệu: mở tab Đã lưu hoặc
            Lịch sử ngay trong Bảng này và bấm Xoá.
          </p>
        </Disclosure>
      </div>
    </div>
  );
}
