'use client';

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE_SELECTOR = 'button, [href], textarea, input, [tabindex]:not([tabindex="-1"])';

/**
 * Ngăn xếp trap dùng chung của module (FIN v1.4.1): mỗi trap đang active đăng
 * ký một mục khi effect chạy và gỡ khi cleanup. Handler keydown của một trap
 * CHỈ đáp khi mục của nó đang ở TRÊN CÙNG ngăn xếp — trap kích hoạt sau nằm
 * trên trap kích hoạt trước. Trước đây mọi trap cùng nghe keydown trên
 * document và cùng đáp một sự kiện: ConfirmDialog lồng trong Board bị trap
 * Board giành Tab (danh sách focusable của aside chứa cả dialog nên focus
 * bị kéo xuống Board) và Escape đóng cả hai lớp cùng lúc. Nay: Tab/Escape chỉ
 * lớp trên cùng xử lý; lớp trên đóng → mục bị gỡ → lớp dưới hoạt động lại.
 * Hành vi trap đơn (ngăn xếp một mục) y hệt trước.
 */
const trapStack: Array<object> = [];

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
  returnFocusTo?: RefObject<HTMLElement | null>,
): void {
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  });
  const returnFocusRef = useRef(returnFocusTo);
  useEffect(() => {
    returnFocusRef.current = returnFocusTo;
  });

  useEffect(() => {
    if (!active) return;
    const panel = ref.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0,
      );

    const first = getFocusable()[0];
    if (first) first.focus();

    const trapEntry = {};
    trapStack.push(trapEntry);

    const onKeyDown = (event: KeyboardEvent) => {
      // Chỉ trap trên cùng mới đáp (xem trapStack ở trên): các lớp dưới im
      // lặng cho tới khi lớp trên đóng và gỡ mục của nó khỏi ngăn xếp.
      if (trapStack[trapStack.length - 1] !== trapEntry) return;
      if (event.key === 'Escape') {
        escapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        }
      } else if (document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const trapIdx = trapStack.indexOf(trapEntry);
      if (trapIdx !== -1) trapStack.splice(trapIdx, 1);
      // N5-3(b) (Panel #05): khôi phục về «phần tử đang giữ focus lúc mở» là
      // KHÔNG đủ — khi hành động kích hoạt không tự đặt focus lên nút mở
      // (script, công nghệ hỗ trợ, chạm Safari iOS…), previouslyFocused là
      // một đích lập trình (H2 kết quả) hoặc BODY, và focus sau đóng rơi
      // đúng vào đó thay vì nút kích hoạt. Caller biết phần tử kích hoạt thì
      // truyền tường minh qua returnFocusTo: ưu tiên trả về đó; không
      // truyền (Board) thì giữ nguyên hành vi cũ.
      const explicit = returnFocusRef.current?.current;
      const target = explicit && explicit.isConnected ? explicit : previouslyFocused;
      if (target && typeof target.focus === 'function') {
        target.focus();
      }
    };
  }, [ref, active]);
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  centered = false,
  returnFocusTo,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  centered?: boolean;
  /** Phần tử kích hoạt mở sheet — focus trả về đây khi đóng (N5-3b). */
  returnFocusTo?: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(panelRef, open, onClose, returnFocusTo);

  if (!open) return null;

  const panelClassName = centered
    ? 'anim-board-sheet absolute left-1/2 top-1/2 max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-canvas p-4 pb-[max(1rem,env(safe-area-inset-bottom))]'
    : 'anim-board-sheet absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-canvas p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl';

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={panelClassName}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  returnFocusTo,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** Phần tử kích hoạt mở dialog — focus trả về đây khi đóng (cùng kỷ luật Sheet, N5-3b). */
  returnFocusTo?: RefObject<HTMLElement | null>;
}) {
  return (
    <Sheet open={open} onClose={onCancel} title={title} centered returnFocusTo={returnFocusTo}>
      <p className="mt-2 text-[15px] text-muted">{body}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-xl px-4 text-sm font-semibold"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-11 rounded-xl bg-error-solid px-4 text-sm font-semibold text-white"
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}

export function UndoBar({ label, onUndo }: { label: string; onUndo: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-canvas shadow-[var(--shadow-card)]">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={onUndo}
        className="min-h-11 shrink-0 px-2 text-sm font-semibold underline underline-offset-4"
      >
        Hoàn tác
      </button>
    </div>
  );
}
