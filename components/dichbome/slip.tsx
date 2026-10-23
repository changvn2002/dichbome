'use client';

import { useState, type CSSProperties, type RefObject } from 'react';
import { Bookmark, BookmarkCheck, Check, ChevronDown, Copy, Eraser, Share2 } from 'lucide-react';
import type { ParentContext, RelationRole } from './lib/translate';
import { roleName, type SlipView, type StripState } from './lib/ui-types';

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
      <p className="text-xs text-muted">
        {speaker} nhắn · Hoàn cảnh: {context}
      </p>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="anim-bubble-in mt-1 block max-w-[85%] rounded-[18px] rounded-bl-md bg-crimson px-4 py-3 text-left text-base leading-relaxed text-white"
      >
        {expanded ? <span>{message}</span> : <span className="line-clamp-2">{message}</span>}
      </button>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div
        aria-live="polite"
        className="flex items-center gap-2 self-start rounded-[18px] rounded-bl-md border border-line-strong bg-stage px-4 py-3"
      >
        {[0, 1, 2].map((n) => (
          <span
            key={n}
            className="typing-dot size-2 rounded-full bg-ink"
            style={{ '--i': n } as CSSProperties}
            aria-hidden
          />
        ))}
        <span className="text-sm text-muted">Đang đọc ý…</span>
      </div>
    </div>
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
  const [expandedMeaning, setExpandedMeaning] = useState(false);
  const [expandedWant, setExpandedWant] = useState(false);
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
      <div className="ml-auto w-full max-w-[92%] rounded-2xl border border-line-strong bg-stage px-4 py-4 shadow-[var(--shadow-card)] sm:px-5">
        <div className="anim-slip-block" style={{ '--i': 0 } as CSSProperties}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
            {view.tier === 'generic' ? (
              <span className="rounded-full bg-crimson-tint px-2 py-0.5 font-semibold text-crimson-ink">
                Khớp câu mẫu chung
              </span>
            ) : null}
            {view.tier === 'low' ? (
              <span className="rounded-full bg-crimson-tint px-2 py-0.5 font-semibold text-crimson-ink">
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
            <p className="mt-1 text-[13px] text-muted">
              Bản trên máy có thể khác bản máy chủ — có mạng lại, bấm Dịch lại để đối chiếu.
            </p>
          ) : null}
        </div>

        <div className="anim-slip-block mt-3" style={{ '--i': 1 } as CSSProperties}>
          <h2 ref={headingRef} tabIndex={-1} className="text-sm font-semibold outline-none">
            Ý thật
          </h2>
          {view.tier === 'low' ? (
            <p className="mt-1 text-[15px]">
              App chưa có câu này trong dữ liệu — đây là cách đọc chung cho tin nhắn của{' '}
              {view.speaker}:
            </p>
          ) : null}
          <p
            className={`font-display mt-1 text-[17px] leading-[26px] text-ink${
              expandedMeaning ? '' : ' line-clamp-4'
            }`}
          >
            {result.meaning}
          </p>
          {result.meaning.length > 150 ? (
            <button
              type="button"
              onClick={() => setExpandedMeaning((v) => !v)}
              className="min-h-11 text-sm font-semibold text-crimson-ink"
            >
              {expandedMeaning ? 'Thu gọn' : 'Đọc tiếp'}
            </button>
          ) : null}
        </div>

        <div
          className="anim-slip-block mt-4 border-t border-line pt-4"
          style={{ '--i': 2 } as CSSProperties}
        >
          <h3 className="text-sm font-semibold">Điều {roleName(view.speaker)} muốn nghe</h3>
          <p className={`mt-1 text-base leading-relaxed${expandedWant ? '' : ' line-clamp-2'}`}>
            {result.realWant}
          </p>
          {result.realWant.length > 110 ? (
            <button
              type="button"
              onClick={() => setExpandedWant((v) => !v)}
              className="min-h-11 text-sm font-semibold text-crimson-ink"
            >
              {expandedWant ? 'Thu gọn' : 'Đọc tiếp'}
            </button>
          ) : null}
        </div>

        <div
          className="anim-slip-block mt-4 border-t border-line pt-4"
          style={{ '--i': 3 } as CSSProperties}
        >
          {view.tier === 'low' ? (
            <p className="text-[15px]">Chưa đủ dữ kiện để chấm mức căng thẳng cho câu này.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Mức căng thẳng</h3>
                <span className="text-sm">
                  Mức {result.angerLevel}/5 ·{' '}
                  <span className="font-medium text-ink">{result.dangerLabel}</span>
                </span>
              </div>
              <div
                className="relative mt-2"
                role="progressbar"
                aria-valuenow={result.angerLevel}
                aria-valuemin={0}
                aria-valuemax={5}
                aria-label="Mức căng thẳng"
              >
                <div className="h-2 rounded-full bg-line">
                  <div
                    className="gauge-fill h-full rounded-full bg-crimson"
                    style={{ width: `${result.angerLevel * 20}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="w-4 text-center text-xs text-muted">
                      {n}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>nhẹ nhàng</span>
                  <span>rất căng</span>
                </div>
              </div>
            </>
          )}
        </div>

        {result.warning ? (
          <div className="mt-4 border-t border-line pt-2">
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
          className="anim-slip-block mt-4 border-t border-line pt-4"
          style={{ '--i': 4 } as CSSProperties}
        >
          <h3 className="text-sm font-semibold">Câu trả lời gợi ý</h3>
          <div className="divide-y divide-line">
            {result.replies.map((reply, idx) => (
              <div key={`${reply.label}-${idx}`} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{reply.label}</span>
                  <button
                    type="button"
                    onClick={() => onCopyReply(reply.text, idx)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-crimson-ink hover:bg-crimson-tint"
                  >
                    {copiedIdx === idx ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      <Copy className="size-4" aria-hidden />
                    )}
                    {copiedIdx === idx ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
                <p className="mt-1 text-[15px] leading-[22px]">{reply.text}</p>
              </div>
            ))}
          </div>
        </div>

        {strip ? (
          <div
            role="status"
            className={`mt-3 rounded-xl px-4 py-3 text-sm ${
              strip.kind === 'copy-fail' || strip.kind === 'saved-full'
                ? 'bg-warn-bg text-ink'
                : 'bg-confirm-bg text-ink'
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
                  className="mt-2 w-full rounded-lg border border-line-strong bg-card p-2 text-[15px]"
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

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <button
            type="button"
            aria-pressed={saved}
            onClick={onToggleSave}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-card px-4 text-sm font-semibold"
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
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-card px-4 text-sm font-semibold"
          >
            <Share2 className="size-4" aria-hidden />
            Chia sẻ
          </button>
          <button
            type="button"
            onClick={onTranslateAnother}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-card px-4 text-sm font-semibold"
          >
            <Eraser className="size-4" aria-hidden />
            Dịch câu khác
          </button>
        </div>
      </div>
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
    <div className="ml-auto w-full max-w-[92%] rounded-2xl border border-line-strong bg-stage p-4 shadow-[var(--shadow-card)]">
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/products/brand/dichbome-logo.svg"
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 rounded"
        />
        <div className="min-w-0">
          <h2 className="text-base font-bold">Câu này app chưa đọc được</h2>
          <p className="mt-1 text-[15px] leading-relaxed">
            {bodyKind === 'garbage'
              ? 'Chuỗi này không có từ nào app nhận ra là tiếng Việt trong nhà mình vẫn nói. Kiểm tra lại chính tả, hoặc thử một câu khác.'
              : 'App chưa có câu này trong dữ liệu câu mẫu, nên chưa dám đoán ý. Bạn có thể xem cách đọc chung theo vai, hoặc thử một câu mẫu.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="min-h-11 rounded-xl border border-line-strong bg-card px-4 text-sm font-semibold"
            >
              Sửa câu
            </button>
            <button
              type="button"
              onClick={onTryExample}
              className="min-h-11 rounded-xl border border-line-strong bg-card px-4 text-sm font-semibold"
            >
              Thử một câu mẫu
            </button>
            <button
              type="button"
              onClick={onShowFallback}
              className="min-h-11 rounded-xl border border-crimson bg-crimson-tint px-4 text-sm font-semibold text-crimson-ink"
            >
              Xem cách đọc chung theo vai {speaker}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StageErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="ml-auto w-full max-w-[92%] rounded-2xl border border-line-strong bg-stage p-4 shadow-[var(--shadow-card)]">
      <p className="text-[15px] leading-relaxed">
        Chưa dịch được. Câu của bạn vẫn còn trong ô bên dưới.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-11 rounded-xl border border-line-strong bg-card px-4 text-sm font-semibold"
      >
        Thử lại
      </button>
    </div>
  );
}
