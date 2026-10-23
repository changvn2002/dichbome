'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ClipboardPaste, Eraser } from 'lucide-react';
import {
  PARENT_CONTEXTS,
  RELATION_GROUPS,
  type ParentContext,
  type RelationRole,
} from './lib/translate';
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
  const chipRowRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
      className="border-t border-line-strong bg-stage px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          onTranslate();
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">Ai vừa nhắn?</span>
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
      >
        <span className="sr-only">Ai vừa nhắn?</span>
        {RELATION_GROUPS.map((group, groupIdx) => (
          <Fragment key={group.label}>
            {groupIdx > 0 ? (
              <span className="mx-1 w-px shrink-0 self-stretch bg-line-strong" aria-hidden />
            ) : null}
            <span className="shrink-0 text-xs whitespace-nowrap text-muted">{group.label}</span>
            {group.roles.map((role) => (
              <button
                key={role}
                type="button"
                aria-pressed={speaker === role}
                onClick={() => onSpeakerChange(role)}
                className={
                  speaker === role
                    ? 'min-h-11 shrink-0 rounded-full border border-crimson bg-crimson-tint px-4 text-sm font-semibold whitespace-nowrap text-crimson-ink'
                    : 'min-h-11 shrink-0 rounded-full border border-line-strong bg-card px-4 text-sm whitespace-nowrap text-muted hover:text-ink'
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
          className={`mt-2 w-full resize-none rounded-xl border bg-card px-4 py-3 text-base leading-relaxed text-ink outline-none placeholder:text-placeholder focus:border-crimson-ink ${
            error ? 'border-crimson-ink' : 'border-line-strong'
          }`}
        />
        {message ? (
          <button
            type="button"
            onClick={() => onMessageChange('')}
            className="absolute right-2 bottom-2 inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-semibold text-crimson-ink"
          >
            <Eraser className="size-4" aria-hidden />
            Xoá
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handlePaste()}
            className="absolute right-2 bottom-2 inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-semibold text-crimson-ink"
          >
            <ClipboardPaste className="size-4" aria-hidden />
            Dán
          </button>
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-crimson-ink">
          {error}
        </p>
      ) : null}
      {pasteHint ? <p className="mt-2 text-sm text-muted">{pasteHint}</p> : null}

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setContextOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-line-strong bg-card px-3 text-sm font-semibold"
        >
          Hoàn cảnh: {context}
          <ChevronDown className="size-4" aria-hidden />
        </button>
        {loading ? (
          <>
            <button
              type="button"
              disabled
              className="min-h-[52px] flex-1 rounded-xl bg-crimson px-5 text-[15px] font-semibold text-white opacity-60"
            >
              Đang dịch…
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[52px] shrink-0 rounded-xl border border-line-strong px-4 font-semibold"
            >
              Huỷ
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onTranslate}
            className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-crimson px-5 text-[15px] font-semibold text-white hover:bg-crimson-deep"
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
                context === c ? 'bg-crimson-tint font-semibold text-crimson-ink' : ''
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
