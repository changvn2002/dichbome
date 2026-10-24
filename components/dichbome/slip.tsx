'use client';

import type { ReactNode } from 'react';
import { useState, type CSSProperties, type RefObject } from 'react';
import { Bookmark, BookmarkCheck, Check, ChevronDown, Copy, Eraser, Share2 } from 'lucide-react';
import type { ParentContext, RelationRole } from './lib/translate';
import { roleName, translateCtaLabel, type SlipView, type StripState } from './lib/ui-types';
import { SenderDisc } from './avatar';

/* ------------------------------------------------------------------ */
/* Hướng «Chat»: sân khấu là một thread — meta phiên thành pill căn    */
/* giữa kiểu timestamp của app nhắn tin, câu gốc là bong bóng mực kèm  */
/* đĩa chữ cái người gửi, bản dịch là «ghi chú dịch» treo trên sợi     */
/* chỉ rail mảnh nối từ bong bóng xuống thẻ. Rail KHÔNG mang vòng tròn */
/* rỗng lơ lửng (panel revote ghế 2+3): điểm nối là đoạn stub ngang ở  */
/* đầu rail + chấm seed nằm trong chính pill nhãn «GHI CHÚ DỊCH».       */
/* ------------------------------------------------------------------ */

export function OriginalBubble({
  message,
  speaker,
  context,
}: {
  message: string;
  speaker: RelationRole;
  context: ParentContext;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      {/* Meta phiên: pill timestamp căn giữa — TÊN NGƯỜI GỬI CHỈ Ở ĐÂY
          (panel revote ghế 2 #4 + ghế 3 #4: bỏ nhãn tên nhỏ trùng cạnh
          avatar ở hàng bong bóng). */}
      <p className="flex justify-center">
        <span className="inline-flex items-center rounded-full bg-bubble px-3 py-[5px] text-xs font-semibold text-muted">
          <b className="font-bold text-ink-2">{speaker} nhắn</b>
          <span aria-hidden>&nbsp;·&nbsp;</span>
          Hoàn cảnh: {context}
        </span>
      </p>
      <div className="mt-2 flex items-end gap-[9px]">
        <SenderDisc speaker={speaker} size={34} />
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="anim-bubble-in focus-on-bubble block w-fit max-w-[82%] rounded-[20px] rounded-bl-[6px] bg-ink px-[15px] py-[10px] text-left text-base leading-relaxed font-semibold text-canvas shadow-[var(--shadow-card)]"
        >
          {expanded ? <span>{message}</span> : <span className="line-clamp-2">{message}</span>}
        </button>
      </div>
    </div>
  );
}

/** Khung «ghi chú dịch»: sợi chỉ rail dọc (mảnh, neutral-200) chạy từ
 *  bong bóng xuống thẻ trắng bo 18px + bóng card; pill nhãn trên rail là
 *  điểm neo thị giác duy nhất của điểm nối (chấm seed trong pill). Rail
 *  kết thúc đúng ở đáy thẻ — không lơ lửng ra ngoài (ghế 2 #9). */
export function NoteShell({
  tag,
  dashed = false,
  children,
}: {
  tag?: string;
  dashed?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative ml-4 border-l-2 border-surface-selected pt-[9px] pl-5">
      {/* Stub ngang ở đầu rail: nối rail về phía cột bong bóng. */}
      <span
        aria-hidden
        className="absolute top-0 left-[-2px] h-[2px] w-[27px] bg-surface-selected"
      />
      {tag ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-2.5 py-1 text-[11px] font-bold tracking-[0.13em] text-ink-2 uppercase">
          <span className="size-1.5 rounded-full bg-brand-seed" aria-hidden />
          {tag}
        </span>
      ) : null}
      <div
        className={`relative rounded-[18px] border border-hairline bg-canvas px-4 py-4 shadow-[var(--shadow-card)] sm:px-5 ${
          tag ? 'mt-2 ' : ''
        }${dashed ? 'border-dashed' : ''}`}
      >
        {/* Stub nối từ rail vào mép thẻ. */}
        <span
          aria-hidden
          className="absolute top-[26px] left-[-21px] h-[2px] w-[20px] bg-surface-selected"
        />
        {children}
      </div>
    </div>
  );
}

/** Tiêu đề mục trong thẻ ghi chú: tick seed 3px + caps đậm — một ngôn
 *  ngữ duy nhất cho mọi mục (Ý thật / Điều muốn nghe / Mức căng thẳng /
 *  Câu trả lời gợi ý). */
function SectionTitle({
  as: Tag = 'h3',
  headingRef,
  children,
}: {
  as?: 'h2' | 'h3';
  headingRef?: RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
}) {
  return (
    <Tag
      ref={headingRef}
      tabIndex={headingRef ? -1 : undefined}
      className="flex items-center gap-[7px] text-[11px] font-bold tracking-[0.11em] text-ink-2 uppercase"
    >
      <span className="h-3 w-[3px] shrink-0 rounded-[2px] bg-brand-seed" aria-hidden />
      {children}
    </Tag>
  );
}

/** Thước căng thẳng «Chat»: viên gauge chia 5 đoạn rời trong pill viền
 *  hairline kèm «n/5», nhãn chữ cạnh pill; hàng số 0–5 bên dưới THẲNG
 *  CỘT với các đoạn theo cấu trúc (panel revote ghế 2 #10 + ghế 3 #8:
 *  hàng số cùng bề rộng 122px với dải đoạn, neo tại đúng biên đoạn,
 *  mốc 0/5 đậm kèm chú thích hai cực ngay dưới). */
function TensionGauge({ level, label }: { level: number; label: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-[9px] rounded-full border border-hairline bg-surface-subtle py-[7px] pr-3 pl-[13px]">
          <span
            className="flex gap-[3px]"
            role="progressbar"
            aria-valuenow={level}
            aria-valuemin={0}
            aria-valuemax={5}
            aria-label="Mức căng thẳng"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`h-[6px] w-[22px] rounded-[3px] ${
                  n <= level ? 'bg-brand-seed' : 'bg-surface-selected'
                }`}
              />
            ))}
          </span>
          <b className="text-[13px] font-bold text-ink">{level}/5</b>
        </span>
        <span className="text-sm font-semibold text-ink-2">
          Mức {level}/5 · {label}
        </span>
      </div>
      <div
        aria-hidden
        className="relative mt-[5px] ml-[14px] h-4 w-[122px] text-[10.5px] text-placeholder"
      >
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`absolute top-0 -translate-x-1/2 ${n === 0 || n === 5 ? 'font-bold text-muted' : ''}`}
            style={{ left: `${(n / 5) * 100}%` }}
          >
            {n}
          </span>
        ))}
      </div>
      <div
        aria-hidden
        className="mt-0.5 ml-[14px] flex w-[122px] justify-between text-[10.5px] text-placeholder"
      >
        <span>nhẹ nhàng</span>
        <span>rất căng</span>
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <NoteShell tag="Ghi chú dịch">
      <div aria-live="polite" className="flex items-center gap-2">
        {[0, 1, 2].map((n) => (
          <span
            key={n}
            className="typing-dot size-2 rounded-full bg-ink-2"
            style={{ '--i': n } as CSSProperties}
            aria-hidden
          />
        ))}
        <span className="text-sm text-muted">Đang đọc ý…</span>
      </div>
    </NoteShell>
  );
}

type StageSlipProps = {
  view: SlipView;
  saved: boolean;
  copiedIdx: number | null;
  onCopyReply: (text: string, idx: number) => void;
  onToggleSave: () => void;
  onShare: () => void;
  onTranslateAnother: () => void;
  onOpenSavedBoard: () => void;
  strip: StripState | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
};

function formatTime(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function StageSlip({
  view,
  saved,
  copiedIdx,
  onCopyReply,
  onToggleSave,
  onShare,
  onTranslateAnother,
  onOpenSavedBoard,
  strip,
  headingRef,
}: StageSlipProps) {
  // MỘT cơ chế «còn nữa» duy nhất cho cả phiếu (fix wave 2026-10-23, M-3):
  // trước đây Ý thật và Điều muốn nghe có hai nút «Đọc tiếp» riêng, chồng thêm
  // cơ chế cuộn nội bộ — nay một nút duy nhất mở/thu toàn bộ phần bị rút gọn
  // (Ý thật + Điều muốn nghe + từng câu trả lời).
  const [expandedAll, setExpandedAll] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const { result } = view;
  const time = formatTime(view.at);

  const sourceLabel =
    view.source === 'server'
      ? 'Nguồn: Máy chủ'
      : view.source === 'stored'
        ? 'Nguồn: Bản đã lưu trên máy này'
        : view.offline
          ? 'Nguồn: Trên máy · Đang offline'
          : 'Nguồn: Trên máy';

  return (
    <section aria-live="polite" className="anim-slip-block" style={{ '--i': 0 } as CSSProperties}>
      <NoteShell tag="Ghi chú dịch">
        <div className="anim-slip-block" style={{ '--i': 0 } as CSSProperties}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh brand tĩnh tự host (SVG/WebP đã tối ưu từ asset pack, kích thước cố định chống CLS); next/image không thêm giá trị ở đây */}
            <img
              src="/products/brand/dichbome-logo.svg"
              alt=""
              width={20}
              height={20}
              className="size-5 rounded"
            />
            <span>
              {sourceLabel}
              {time ? ` · ${time}` : ''}
            </span>
            {view.source === 'server' ? (
              // Nhãn phụ dễ hiểu cạnh nhãn nguồn (N-5): nhãn chuẩn «Nguồn: Máy chủ»
              // giữ nguyên thường trực + trung thực; gloss chỉ giải thích thêm.
              <span className="text-muted">(dịch qua mạng)</span>
            ) : null}
            {view.tier === 'generic' ? (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-bubble px-2.5 py-1 font-semibold text-ink">
                <span className="size-[5px] rounded-full bg-brand-seed" aria-hidden />
                Khớp câu mẫu chung
              </span>
            ) : null}
            {view.tier === 'low' ? (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-bubble px-2.5 py-1 font-semibold text-ink">
                <span className="size-[5px] rounded-full bg-brand-seed" aria-hidden />
                Độ tin cậy thấp
              </span>
            ) : null}
          </div>
          {view.fellBack && view.source === 'device' && !view.offline ? (
            <p className="mt-1 text-[13px] text-muted">
              Không kết nối được máy chủ — bản này dịch ngay trên thiết bị.
            </p>
          ) : null}
          {view.source === 'device' ? (
            // N5-6 (Panel #05): bản cũ hứa «bấm Dịch lại» — một nhãn KHÔNG
            // nút nào mang; đường dịch lại thật là CTA của composer mang
            // nhãn theo vai. Disclaimer nay nêu đúng nhãn điều khiển thật
            // của chính vai này, ghép bằng helper dùng chung với composer
            // (translateCtaLabel) để hai bề mặt không bao giờ trôi nhau.
            <p className="mt-1 text-[13px] text-muted">
              Bản trên máy có thể khác bản máy chủ — có mạng lại, bấm «
              {translateCtaLabel(view.speaker)}» để đối chiếu.
            </p>
          ) : null}
        </div>

        <div className="anim-slip-block mt-4" style={{ '--i': 1 } as CSSProperties}>
          {/* N-2: không còn class outline-none (trước đây là code CHẾT — rule
              :focus-visible không-layer trong globals.css luôn thắng utility
              đã-layer của Tailwind v4). Ring đến từ rule toàn cục như mọi phần
              tử khác; hành vi focus modality giữ nguyên (keep-list panel). */}
          <SectionTitle as="h2" headingRef={headingRef}>
            Ý thật
          </SectionTitle>
          {view.tier === 'low' ? (
            <p className="mt-1.5 text-[15px]">
              App chưa có câu này trong dữ liệu — đây là cách đọc chung cho tin nhắn của{' '}
              {view.speaker}:
            </p>
          ) : null}
          <p
            // Ý thật KHÔNG clamp ở bất kỳ bề rộng nào (panel pack vòng 1,
            // 4/5 ghế) — đây là nội dung giá trị nhất của phiếu; sân khấu
            // cuộn được, «Đọc tiếp» chỉ phục vụ các câu trả lời bị rút gọn.
            className="mt-1.5 text-[15px] leading-[1.55] text-ink"
          >
            {result.meaning}
          </p>
        </div>

        <div
          className="anim-slip-block mt-4 border-t border-surface-selected pt-4"
          style={{ '--i': 2 } as CSSProperties}
        >
          <SectionTitle>Điều {roleName(view.speaker)} muốn nghe</SectionTitle>
          <p className="mt-1.5 text-[15px] leading-relaxed">{result.realWant}</p>
          {/* D-4(d) (Panel #03): nút «Đọc tiếp» KHÔNG nằm trong khối này —
              giữ nguyên vị trí sau thước như bản đã chốt (xem khối dưới). */}
        </div>

        <div
          className="anim-slip-block mt-4 border-t border-surface-selected pt-4"
          style={{ '--i': 3 } as CSSProperties}
        >
          {view.tier === 'low' ? (
            <p className="text-[15px]">Chưa đủ dữ kiện để chấm mức căng thẳng cho câu này.</p>
          ) : (
            <>
              <SectionTitle>Mức căng thẳng</SectionTitle>
              <div className="mt-2.5">
                <TensionGauge level={result.angerLevel} label={result.dangerLabel} />
              </div>
            </>
          )}
        </div>

        {result.replies.some((r) => r.text.length > 80) ? (
          <div className="anim-slip-block mt-1" style={{ '--i': 3 } as CSSProperties}>
            <button
              type="button"
              aria-expanded={expandedAll}
              onClick={() => setExpandedAll((v) => !v)}
              className="min-h-11 text-sm font-semibold text-ink"
            >
              {expandedAll ? 'Thu gọn' : 'Đọc tiếp'}
            </button>
          </div>
        ) : null}

        {result.warning ? (
          <div className="mt-3 border-t border-surface-selected pt-2">
            <button
              type="button"
              aria-expanded={warningOpen}
              onClick={() => setWarningOpen((v) => !v)}
              className="flex min-h-11 w-full items-center justify-between text-sm font-semibold"
            >
              Lưu ý khi gửi
              <ChevronDown className={`size-4 ${warningOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {warningOpen ? <p className="text-[15px] leading-relaxed">{result.warning}</p> : null}
          </div>
        ) : null}

        <div
          className="anim-slip-block mt-4 border-t border-surface-selected pt-4"
          style={{ '--i': 4 } as CSSProperties}
        >
          <SectionTitle>Câu trả lời gợi ý</SectionTitle>
          <div className="divide-y divide-surface-selected">
            {result.replies.map((reply, idx) => (
              <div key={`${reply.label}-${idx}`} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{reply.label}</span>
                  <button
                    type="button"
                    onClick={() => onCopyReply(reply.text, idx)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink hover:bg-bubble"
                  >
                    {copiedIdx === idx ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      <Copy className="size-4" aria-hidden />
                    )}
                    {copiedIdx === idx ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
                {/* Xem trước tối đa 2 dòng khi phiếu thu gọn; nút Sao chép luôn
                    chép TOÀN VĂN. D-4(e) (Panel #03): câu bị rút gọn tự mang
                    tín hiệu mở NGAY TRÊN THẺ (bấm vào chữ hoặc dòng «Đọc tiếp»
                    kèm chevron) — vẫn là MỘT cơ chế mở rộng duy nhất
                    (expandedAll) như cam kết M-3. */}
                {!expandedAll && reply.text.length > 80 ? (
                  <button
                    type="button"
                    onClick={() => setExpandedAll(true)}
                    aria-label={`Đọc tiếp câu trả lời ${reply.label}`}
                    className="mt-1 block w-full text-left"
                  >
                    <span className="line-clamp-2 text-[15px] leading-[22px]">{reply.text}</span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold text-ink">
                      Đọc tiếp
                      <ChevronDown className="size-3.5" aria-hidden />
                    </span>
                  </button>
                ) : (
                  <p
                    className={`mt-1 text-[15px] leading-[22px]${expandedAll ? '' : ' line-clamp-2'}`}
                  >
                    {reply.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {strip ? (
          <div
            role="status"
            className={`mt-3 rounded-xl px-4 py-3 text-sm ${
              strip.kind === 'copy-fail' || strip.kind === 'saved-full'
                ? 'bg-warning-bg text-ink'
                : 'bg-success-bg text-ink'
            }`}
          >
            {strip.kind === 'copy-ok' ? <p>Đã sao chép câu trả lời.</p> : null}
            {strip.kind === 'copy-fail' ? (
              <>
                <p className="font-semibold text-ink">Chưa sao chép được.</p>
                <textarea
                  readOnly
                  value={strip.text}
                  rows={3}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-2 w-full rounded-lg border border-line-control bg-canvas p-2 text-[15px]"
                />
                <p className="mt-1 text-[13px] text-muted">Chạm giữ để sao chép thủ công.</p>
              </>
            ) : null}
            {strip.kind === 'saved-full' ? (
              <p>
                Đã đủ 20 kết quả đã lưu trên thiết bị này.{' '}
                <button
                  type="button"
                  onClick={onOpenSavedBoard}
                  className="font-semibold underline underline-offset-4"
                >
                  Mở Bảng để xoá bớt
                </button>
              </p>
            ) : null}
            {strip.kind === 'share' ? <p>{strip.text}</p> : null}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 border-t border-surface-selected pt-3">
          {/* N-5(a): nút này không còn là toggle — khi đã lưu, bấm «Đã lưu» MỞ
              Bảng tab Đã lưu (đúng kỳ vọng «nhãn = đường dẫn tới danh sách»);
              bỏ lưu thực hiện trong Bảng qua nút Xoá có hoàn tác 8 giây. */}
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? 'Đã lưu. Mở Bảng, tab Đã lưu' : undefined}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-control bg-canvas px-4 text-sm font-semibold"
          >
            {saved ? (
              <BookmarkCheck className="size-4" aria-hidden />
            ) : (
              <Bookmark className="size-4" aria-hidden />
            )}
            {saved ? 'Đã lưu' : 'Lưu kết quả'}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-control bg-canvas px-4 text-sm font-semibold"
          >
            <Share2 className="size-4" aria-hidden />
            Chia sẻ
          </button>
          <button
            type="button"
            onClick={onTranslateAnother}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-control bg-canvas px-4 text-sm font-semibold"
          >
            <Eraser className="size-4" aria-hidden />
            Dịch câu khác
          </button>
        </div>
      </NoteShell>
    </section>
  );
}

export function NotReadCard({
  bodyKind,
  speaker,
  onEdit,
  onTryExample,
  onShowFallback,
}: {
  bodyKind: 'garbage' | 'unknown-vn';
  speaker: RelationRole;
  onEdit: () => void;
  onTryExample: () => void;
  onShowFallback: () => void;
}) {
  return (
    <NoteShell tag="Chưa dịch được" dashed>
      {/* «Phiến Đứt Nét» (VISUAL-LAYER §3): hình của sự thiếu cho trạng
          thái chưa đọc được — ink-only, 0 accent, ≤120×80 cạnh khối chữ.
          Thẻ lỗi viền đứt nét như mock thắng; sợi chỉ rail kết thúc ở
          đáy thẻ như mọi ghi chú khác (ghế 2 #9). */}
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh brand tĩnh tự host (SVG đã tối ưu từ asset pack, kích thước cố định chống CLS); next/image không thêm giá trị ở đây */}
      <img
        src="/products/brand/dichbome-error-stage.svg"
        alt=""
        width={120}
        height={80}
        className="mb-3 w-[120px]"
      />
      <h2 className="text-base font-bold">Câu này app chưa đọc được</h2>
      <p className="mt-1 text-[15px] leading-relaxed">
        {bodyKind === 'garbage'
          ? 'Chuỗi này không có từ nào app nhận ra là tiếng Việt trong nhà mình vẫn nói. Kiểm tra lại chính tả, hoặc thử một câu khác.'
          : 'App chưa có câu này trong dữ liệu câu mẫu, nên chưa dám đoán ý. Bạn có thể xem cách đọc chung theo vai, hoặc thử một câu mẫu.'}
      </p>
      {/* N-1: thứ bậc hành động — hai lối ra chính là nút pill có khung
          (chính: viền mực đậm; phụ: viền hairline); lối fallback độ-tin-
          cậy-thấp hạ xuống link chữ gạch chân seed yên tĩnh bên dưới. */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="min-h-11 rounded-full border-[1.5px] border-ink bg-canvas px-4 text-sm font-bold"
        >
          Sửa câu
        </button>
        <button
          type="button"
          onClick={onTryExample}
          className="min-h-11 rounded-full border border-hairline bg-canvas px-4 text-sm font-semibold"
        >
          Thử một câu mẫu
        </button>
      </div>
      <button
        type="button"
        onClick={onShowFallback}
        className="mt-1 min-h-11 px-2 text-left text-sm font-semibold text-ink underline decoration-brand-seed underline-offset-4"
      >
        Xem cách đọc chung theo <span className="whitespace-nowrap">vai {speaker}</span>
      </button>
    </NoteShell>
  );
}

export function StageErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <NoteShell>
      <p className="text-[15px] leading-relaxed">
        Chưa dịch được. Câu của bạn vẫn còn trong ô bên dưới.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-11 rounded-full border-[1.5px] border-ink bg-canvas px-4 text-sm font-bold"
      >
        Thử lại
      </button>
    </NoteShell>
  );
}
