'use client';

import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, Check, ChevronDown, ClipboardPaste, Eraser } from 'lucide-react';
import {
  PARENT_CONTEXTS,
  RELATION_GROUPS,
  type ParentContext,
  type RelationRole,
} from './lib/translate';
import { tryReadRaw, writeRaw } from './lib/storage';
import { roleName } from './lib/ui-types';
import { Sheet } from './sheets';

const ROLE_PLACEHOLDERS: Record<RelationRole, string> = {
  Mẹ: 'Ví dụ: “Tùy con, mẹ sao cũng được.”',
  Bố: 'Ví dụ: “Ăn cơm chưa con?”',
  'Cả hai': 'Ví dụ: “Bao giờ thì về, Tết này có về không?”',
  Con: 'Ví dụ: “Dạ, để con xem đã…”',
  'Mẹ chồng': 'Ví dụ: “Để đấy mẹ làm cho, con cứ nghỉ đi.”',
  'Mẹ vợ': 'Ví dụ: “Mẹ không sao, các con cứ lo việc đi.”',
  'Nàng dâu': 'Ví dụ: “Dạ để con làm ạ, con sao cũng được.”',
  'Con rể': 'Ví dụ: “Dạ, cuối tuần con qua ạ.”',
  Vợ: 'Ví dụ: “Em không sao, anh tự hiểu đi.”',
  Chồng: 'Ví dụ: “Ừ để anh, em quyết đi cũng được.”',
  'Anh/Chị': 'Ví dụ: “Em lớn rồi, tự quyết đi.”',
  Em: 'Ví dụ: “Dạ em biết rồi ạ.”',
  'Người yêu': 'Ví dụ: “Em không giận đâu, anh bận thì thôi.”',
  Sếp: 'Ví dụ: “Em xem lại nhé, cái này đơn giản mà.”',
  'Đồng nghiệp': 'Ví dụ: “Để mình gửi lại bản mới nhé.”',
  'Bạn thân': 'Ví dụ: “Thôi kệ đi, không sao đâu.”',
};

type ComposerProps = {
  message: string;
  onMessageChange: (v: string) => void;
  speaker: RelationRole;
  onSpeakerChange: (r: RelationRole) => void;
  context: ParentContext;
  onContextChange: (c: ParentContext) => void;
  loading: boolean;
  onTranslate: () => void;
  onCancel: () => void;
  error: string | null;
  /** Tăng số này để app yêu cầu focus vào ô nhập (0 = chưa yêu cầu lần nào). */
  focusSignal?: number;
};

/** Thứ tự chip phẳng để roving-tabindex di chuyển bằng phím mũi tên (N-6). */
const FLAT_ROLES: RelationRole[] = RELATION_GROUPS.flatMap((g) => g.roles);
const SWIPE_HINT_KEY = 'dichbome_swipe_hint_seen_v1';

export function Composer({
  message,
  onMessageChange,
  speaker,
  onSpeakerChange,
  context,
  onContextChange,
  loading,
  onTranslate,
  onCancel,
  error,
  focusSignal = 0,
}: ComposerProps) {
  const [contextOpen, setContextOpen] = useState(false);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const chipRowRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Gợi ý vuốt dải chip vai — CHỈ lần dùng đầu tiên (N-5b): hiện cho tới khi
  // người dùng cuộn ngang dải chip lần đầu, rồi ghi nhớ vĩnh viễn trên thiết bị.
  useEffect(() => {
    // Đọc qua storage adapter (ARC-04) sau mount, tránh hydration mismatch.
    // Không đọc được storage: không hiện gợi ý (tránh lặp lại gây phiền).
    const stored = tryReadRaw(SWIPE_HINT_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chủ đích: đọc localStorage sau mount, tránh hydration mismatch (cùng pattern ở app.tsx)
    if (stored.ok && !stored.value) setShowSwipeHint(true);
  }, []);

  const dismissSwipeHint = () => {
    if (!showSwipeHint) return;
    setShowSwipeHint(false);
    // Không lưu được thì gợi ý chỉ sống trong phiên này — chấp nhận được.
    writeRaw(SWIPE_HINT_KEY, '1');
  };

  // Roving-tabindex cho hàng chip vai (N-6, mẫu APG toolbar): chỉ chip đang
  // chọn là điểm dừng Tab; phím ←/→/Home/End di chuyển FOCUS giữa các chip
  // (không đổi lựa chọn — chọn vẫn bằng Enter/Space/bấm như cũ, hành vi chọn
  // vai hiện tại không đổi).
  const handleChipRowKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    const chips = Array.from(
      chipRowRef.current?.querySelectorAll<HTMLElement>('[data-role-chip]') ?? [],
    );
    const current = chips.indexOf(document.activeElement as HTMLElement);
    if (current < 0) return;
    e.preventDefault();
    let next = current;
    if (e.key === 'ArrowRight') next = (current + 1) % chips.length;
    if (e.key === 'ArrowLeft') next = (current - 1 + chips.length) % chips.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = chips.length - 1;
    chips[next]?.focus();
  };

  const currentRole = roleName(speaker);
  const placeholder = ROLE_PLACEHOLDERS[speaker] ?? `Ví dụ: câu ${currentRole} vừa nhắn…`;

  // Chip đã chọn tự cuộn vào tầm nhìn trong hàng ngang (scroll thủ công, không scrollIntoView).
  useEffect(() => {
    const container = chipRowRef.current;
    if (!container) return;
    const chip = container.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (chip) container.scrollTo({ left: chip.offsetLeft - 24 });
  }, [speaker]);

  const autoGrow = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 4 * 24 + 24)}px`;
  };

  useEffect(() => {
    autoGrow();
  }, [message]);

  // App yêu cầu focus (sau khi điền câu mẫu / khôi phục / sửa câu): chỉ khi signal > 0.
  useEffect(() => {
    if (focusSignal > 0) textareaRef.current?.focus();
  }, [focusSignal]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onMessageChange(text.slice(0, 500));
      setPasteHint(null);
    } catch {
      setPasteHint('Giữ chạm vào ô rồi chọn Dán.');
    }
  };

  return (
    <section
      aria-label="Soạn câu cần dịch"
      className="border-t border-line-control bg-canvas px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          onTranslate();
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">
          Ai vừa nhắn?
          {showSwipeHint ? (
            <span className="ml-2 text-xs font-normal text-muted">
              Vuốt ngang để xem thêm vai →
            </span>
          ) : null}
        </span>
        <span
          className="inline-block w-14 shrink-0 text-right text-xs text-muted"
          aria-live="polite"
        >
          {message.length}/500
        </span>
      </div>

      <div
        ref={chipRowRef}
        className="mt-1 flex items-center gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Ai vừa nhắn?"
        onScroll={(e) => {
          if (e.currentTarget.scrollLeft > 8) dismissSwipeHint();
        }}
        onKeyDown={handleChipRowKeyDown}
      >
        <span className="sr-only">Ai vừa nhắn?</span>
        {RELATION_GROUPS.map((group, groupIdx) => (
          <Fragment key={group.label}>
            {groupIdx > 0 ? (
              <span className="mx-1 w-px shrink-0 self-stretch bg-hairline" aria-hidden />
            ) : null}
            <span className="shrink-0 text-xs whitespace-nowrap text-muted">{group.label}</span>
            {group.roles.map((role) => (
              <button
                key={role}
                type="button"
                data-role-chip={FLAT_ROLES.indexOf(role)}
                tabIndex={speaker === role ? 0 : -1}
                aria-pressed={speaker === role}
                onClick={() => onSpeakerChange(role)}
                className={
                  speaker === role
                    ? 'min-h-11 shrink-0 rounded-full border border-line-control border-l-2 border-l-brand-seed bg-surface-selected px-4 text-sm font-semibold whitespace-nowrap text-ink'
                    : 'min-h-11 shrink-0 rounded-full border border-line-control bg-canvas px-4 text-sm whitespace-nowrap text-muted hover:text-ink'
                }
              >
                {role}
              </button>
            ))}
          </Fragment>
        ))}
      </div>

      <label htmlFor="dichbome-message" className="sr-only">
        Câu {currentRole} vừa nhắn
      </label>
      <div className="relative">
        <textarea
          ref={textareaRef}
          id="dichbome-message"
          rows={1}
          value={message}
          onChange={(e) => {
            onMessageChange(e.target.value);
            setPasteHint(null);
          }}
          onInput={autoGrow}
          maxLength={500}
          placeholder={placeholder}
          className={`mt-2 w-full resize-none rounded-xl border bg-canvas py-3 pr-24 pl-4 text-base leading-relaxed text-ink placeholder:text-placeholder focus:border-line-control ${
            error ? 'border-error-solid' : 'border-line-control'
          }`}
        />
        {message ? (
          <button
            type="button"
            onClick={() => onMessageChange('')}
            className="absolute right-2 bottom-2 inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-semibold text-ink"
          >
            <Eraser className="size-4" aria-hidden />
            Xoá
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handlePaste()}
            className="absolute right-2 bottom-2 inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-semibold text-ink"
          >
            <ClipboardPaste className="size-4" aria-hidden />
            Dán
          </button>
        )}
      </div>

      {/* DATA-09b: một câu hướng dẫn trách nhiệm ngay tại điểm nhập — dán
          tin nhắn của người khác là việc cần sự thoải mái của người gửi. */}
      <p className="mt-2 text-xs text-muted">Chỉ dán khi người gửi thoải mái với việc đó.</p>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-error-ink">
          {error}
        </p>
      ) : null}
      {pasteHint ? <p className="mt-2 text-sm text-muted">{pasteHint}</p> : null}

      {/* D-4(b) (Panel #03): flex-wrap + nhãn CTA nowrap. Trước đây CTA bị
          bó trong khe còn lại cạnh nút Hoàn cảnh (~116px ở 320px) nên nhãn
          vỡ 2 dòng. Nay: không vừa một hàng thì CTA xuống hàng riêng
          full-width — nhãn luôn nguyên vẹn một dòng ở mọi bề rộng/vai. */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setContextOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-line-control bg-canvas px-3 text-sm font-semibold"
        >
          Hoàn cảnh: {context}
          <ChevronDown className="size-4" aria-hidden />
        </button>
        {loading ? (
          <>
            <button
              type="button"
              disabled
              className="min-h-[52px] flex-1 whitespace-nowrap rounded-xl bg-disabled-bg px-5 text-[15px] font-semibold text-disabled-ink"
            >
              Đang dịch…
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[52px] shrink-0 rounded-xl border border-line-control px-4 font-semibold"
            >
              Huỷ
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onTranslate}
            className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-action-bg px-5 text-[15px] font-semibold text-action-fg"
          >
            Dịch ý {currentRole}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <p className="mt-1 hidden text-xs text-muted min-[1280px]:block">Ctrl+Enter để dịch</p>

      <Sheet open={contextOpen} onClose={() => setContextOpen(false)} title="Hoàn cảnh">
        <p className="mt-2 text-sm text-muted">Không bắt buộc — để “Khác” nếu không chắc.</p>
        <div role="radiogroup" aria-label="Hoàn cảnh" className="mt-2">
          {PARENT_CONTEXTS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={context === c}
              onClick={() => {
                onContextChange(c);
                setContextOpen(false);
              }}
              className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-sm ${
                context === c ? 'bg-bubble font-semibold text-ink' : ''
              }`}
            >
              <span>{c}</span>
              {context === c ? <Check className="size-4" aria-hidden /> : null}
            </button>
          ))}
        </div>
      </Sheet>
    </section>
  );
}
