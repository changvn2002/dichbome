'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  Copy,
  Eraser,
  History,
  LayoutGrid,
  MessageSquare,
  Rows3,
  Share2,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react';
import { createDichbomeApi } from './api';
import type { ParentContext, ParentExample, TranslateResult } from './api/types';
import {
  PARENT_CONTEXTS,
  PARENT_EXAMPLES,
  RELATION_GROUPS,
  translateParentMessage,
  type RelationRole,
} from './lib/translate';
import { cn } from '@/lib/utils';

const HISTORY_KEY = 'dichbome_history_v1';
const SAVED_KEY = 'dichbome_saved_v1';
const ACCENT = '#C22A44';
const MAX_CHARS = 500;

type HistoryItem = {
  id: string;
  message: string;
  speaker: RelationRole;
  context: ParentContext;
  result: TranslateResult;
  at: string;
};

type SavedItem = HistoryItem;

type ActiveTranslation = Pick<HistoryItem, 'message' | 'speaker' | 'context'>;

const ALL_GROUPS = 'Tất cả';

const ROLE_PLACEHOLDERS: Partial<Record<string, string>> = {
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

/** Cách gọi người nhắn để ghép câu UI cho tự nhiên theo từng vai. */
function roleName(role: RelationRole): string {
  return role === 'Cả hai' ? 'bố mẹ' : role.toLowerCase();
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function angerBarColor(level: number): string {
  if (level <= 1) return '#8A94A6';
  if (level === 2) return '#D98E32';
  if (level === 3) return '#D96C2C';
  if (level === 4) return ACCENT;
  return '#8F1D33';
}

function loadStoredItems(key: string, limit: number): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
  } catch {
    return [];
  }
}

function loadHistory(): HistoryItem[] {
  return loadStoredItems(HISTORY_KEY, 8);
}

function loadSaved(): SavedItem[] {
  return loadStoredItems(SAVED_KEY, 20);
}

function persistStoredItems(key: string, items: HistoryItem[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* bỏ qua nếu hết quota */
  }
}

async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{children}</p>
  );
}

export function DichbomeApp() {
  const api = useMemo(() => createDichbomeApi(), []);
  const [message, setMessage] = useState('');
  const [speaker, setSpeaker] = useState<RelationRole>('Mẹ');
  const [exampleGroup, setExampleGroup] = useState<string>(ALL_GROUPS);
  const [context, setContext] = useState<ParentContext>('Khác');
  const [examples, setExamples] = useState<ParentExample[]>(PARENT_EXAMPLES);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [activeTranslation, setActiveTranslation] = useState<ActiveTranslation | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  // Nạp lịch sử/lượt lưu từ localStorage SAU khi mount để tránh hydration mismatch
  // (server không có localStorage) — giữ pattern gốc của bản monorepo.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chủ đích: đọc localStorage sau mount, tránh hydration mismatch
    setHistory(loadHistory());
    setSaved(loadSaved());
    api
      .examples()
      .then((r) => {
        if (r.examples?.length) setExamples(r.examples);
      })
      .catch(() => {
        /* giữ ví dụ local */
      });
  }, [api]);

  // Đồng bộ trạng thái mạng ban đầu từ navigator (chỉ có ở client) — giữ pattern gốc.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chủ đích: đọc navigator.onLine sau mount (chỉ có ở client)
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (shareTimer.current) clearTimeout(shareTimer.current);
    },
    [],
  );

  const saveHistory = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev.filter((h) => h.message !== item.message)].slice(0, 8);
      persistStoredItems(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const doTranslate = useCallback(
    async (msg: string, sp: RelationRole, ctx: ParentContext) => {
      const text = msg.trim();
      if (!text) {
        setError(`Hãy dán một câu ${roleName(sp)} vừa nhắn để app dịch ý thật phía sau.`);
        setResult(null);
        setActiveTranslation(null);
        textareaRef.current?.focus();
        return;
      }
      setLoading(true);
      setError(null);
      setNotice(null);
      setShareFeedback(null);
      let translated: TranslateResult;
      try {
        translated = await api.translate({ message: text, speaker: sp, context: ctx });
      } catch {
        translated = translateParentMessage({ message: text, speaker: sp, context: ctx });
        setNotice('Không kết nối được máy chủ. Kết quả dưới đây được dịch ngay trên thiết bị.');
      }
      const active = { message: text, speaker: sp, context: ctx };
      setActiveTranslation(active);
      setResult(translated);
      setLoading(false);
      saveHistory({
        id: `${Date.now()}`,
        message: text,
        speaker: sp,
        context: ctx,
        result: translated,
        at: new Date().toISOString(),
      });
      window.setTimeout(() => {
        if (window.innerWidth < 1024) {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        resultRef.current?.focus({ preventScroll: true });
      }, 80);
    },
    [api, saveHistory],
  );

  const copyReply = useCallback(async (text: string, idx: number) => {
    try {
      await writeClipboard(text);
    } catch {
      /* clipboard không khả dụng trên một số trình duyệt nhúng */
    }
    setCopiedIdx(idx);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedIdx(null), 1600);
  }, []);

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* noop */
    }
  };

  const restore = (item: HistoryItem) => {
    setMessage(item.message);
    setSpeaker(item.speaker);
    setContext(item.context);
    setResult(item.result);
    setActiveTranslation({
      message: item.message,
      speaker: item.speaker,
      context: item.context,
    });
    setError(null);
    setNotice(null);
    setShareFeedback(null);
  };

  const showShareFeedback = useCallback((text: string) => {
    setShareFeedback(text);
    if (shareTimer.current) clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShareFeedback(null), 2400);
  }, []);

  const shareResult = useCallback(async () => {
    if (!result || !activeTranslation) return;
    const firstReply = result.replies[0]?.text;
    const summary = [
      `Câu gốc (${activeTranslation.speaker}): “${activeTranslation.message}”`,
      `Ý thật: ${result.meaning}`,
      firstReply ? `Câu trả lời gợi ý: ${firstReply}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    const shareTitle = 'Giải Mã Gia Đình';
    const pageUrl = window.location.href;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle, text: summary, url: pageUrl });
        showShareFeedback('Đã mở chia sẻ.');
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        /* Nếu share sheet lỗi, dùng clipboard làm phương án dự phòng. */
      }
    }

    try {
      await writeClipboard(`${summary}\n${pageUrl}`);
      showShareFeedback('Đã copy để chia sẻ.');
    } catch {
      showShareFeedback('Không copy được. Hãy thử lại trên trình duyệt khác.');
    }
  }, [activeTranslation, result, showShareFeedback]);

  const isSavedResult = useCallback(
    (candidate: ActiveTranslation | null) =>
      Boolean(
        candidate &&
        saved.some(
          (item) => item.message === candidate.message && item.speaker === candidate.speaker,
        ),
      ),
    [saved],
  );

  const toggleSaveResult = useCallback(() => {
    if (!result || !activeTranslation) return;
    const existing = saved.find(
      (item) =>
        item.message === activeTranslation.message && item.speaker === activeTranslation.speaker,
    );
    if (existing) {
      const next = saved.filter((item) => item.id !== existing.id);
      setSaved(next);
      persistStoredItems(SAVED_KEY, next);
      return;
    }
    const item: SavedItem = {
      id: `saved_${Date.now()}`,
      ...activeTranslation,
      result,
      at: new Date().toISOString(),
    };
    const next = [item, ...saved].slice(0, 20);
    setSaved(next);
    persistStoredItems(SAVED_KEY, next);
  }, [activeTranslation, result, saved]);

  const removeSaved = useCallback(
    (id: string) => {
      const next = saved.filter((item) => item.id !== id);
      setSaved(next);
      persistStoredItems(SAVED_KEY, next);
    },
    [saved],
  );

  const clearSaved = useCallback(() => {
    setSaved([]);
    try {
      localStorage.removeItem(SAVED_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const clearComposer = useCallback((focusComposer = true) => {
    setMessage('');
    setError(null);
    setNotice(null);
    if (focusComposer) textareaRef.current?.focus();
  }, []);

  const translateAnother = useCallback(() => {
    setResult(null);
    setActiveTranslation(null);
    setShareFeedback(null);
    setCopiedIdx(null);
    clearComposer(false);
    scrollToSection('decoder');
    window.setTimeout(() => textareaRef.current?.focus(), 250);
  }, [clearComposer]);

  const currentRole = roleName(speaker);
  const inputPlaceholder = ROLE_PLACEHOLDERS[speaker] ?? `Ví dụ: câu ${currentRole} vừa nhắn…`;
  const filteredExamples = useMemo(() => {
    if (exampleGroup === ALL_GROUPS) return examples;
    const group = RELATION_GROUPS.find((g) => g.label === exampleGroup);
    if (!group) return examples;
    return examples.filter((ex) => group.roles.some((r) => r === ex.speaker));
  }, [examples, exampleGroup]);

  const barColor = angerBarColor(result?.angerLevel ?? 0);
  const currentSaved = isSavedResult(activeTranslation);
  const activeRole = activeTranslation ? roleName(activeTranslation.speaker) : currentRole;

  return (
    <div className="min-h-dvh bg-[#FAF6EF] text-ink">
      <header className="sticky top-0 z-30 border-b border-[#E7DDD0] bg-[#FFFDF8]/95 backdrop-blur">
        <div
          className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6"
          style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
        >
          <Link
            href="/"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]"
            aria-label="Về danh sách ứng dụng"
          >
            <ArrowLeft className="size-5" />
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/brand/dichbome-logo.svg"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-[10px]"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-ink">
              Giải Mã Gia Đình
            </p>
            <p className="truncate text-[13px] text-muted">
              Hiểu ý nhau qua từng tin nhắn trong nhà
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 sm:px-6 lg:pt-10 lg:pb-16">
        {!isOnline ? (
          <p
            className="mb-5 flex items-start gap-2 rounded-xl border border-[#E7C66B] bg-[#FFF6D8] px-4 py-3 text-sm leading-relaxed text-ink"
            role="status"
            aria-live="polite"
          >
            <WifiOff className="mt-0.5 size-4 shrink-0 text-[#8A6414]" aria-hidden />
            Đang offline — app vẫn dịch bằng bộ dữ liệu trên máy.
          </p>
        ) : null}
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/brand/dichbome-banner.svg"
            alt="Gia đình ngồi cạnh nhau xem điện thoại, trên đầu là bong bóng chat hình trái tim"
            className="h-[190px] w-full rounded-2xl border border-[#E7DDD0] object-cover shadow-[var(--shadow-card)] lg:h-[290px]"
            style={{ objectPosition: '50% 68%' }}
            loading="eager"
          />
          <figcaption className="mt-2 text-[13px] leading-relaxed text-muted">
            Giải Mã Gia Đình — mỗi tin nhắn trong nhà đều có một ý chưa nói thành lời.
          </figcaption>
        </figure>

        <div className="mt-9 max-w-3xl">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C22A44] uppercase">
            Dịch tin nhắn cho mọi mối quan hệ
          </p>
          <h1
            className="mt-3 text-[32px] leading-[1.12] font-bold tracking-tight text-ink sm:text-[40px] lg:text-[44px]"
            style={{ fontFamily: "Georgia, 'Times New Roman', 'Be Vietnam Pro', serif" }}
          >
            Người nhà nói một đằng, ý là một nẻo?
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-base">
            Dán tin nhắn của bố mẹ, con cái, mẹ chồng, nàng dâu, vợ chồng hay sếp để xem ý thật, mức
            độ căng thẳng và câu trả lời phù hợp trước khi gửi.
          </p>
          <div
            className="mt-5 hidden flex-wrap gap-x-5 gap-y-2 text-sm text-muted lg:flex"
            aria-label="Điều hướng nhanh"
          >
            <button
              type="button"
              onClick={() => scrollToSection('decoder')}
              className="min-h-11 font-medium text-ink underline decoration-[#C22A44] decoration-2 underline-offset-4"
            >
              Bắt đầu dịch
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('examples')}
              className="min-h-11 font-medium hover:text-ink"
            >
              Xem câu mẫu
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('history')}
              className="min-h-11 font-medium hover:text-ink"
            >
              Lịch sử gần đây
            </button>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-12">
          {/* Cột soạn — sticky trên desktop */}
          <section
            id="decoder"
            aria-label="Soạn câu cần dịch"
            className="scroll-mt-24 lg:sticky lg:top-24"
          >
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="dichbome-message" className="text-sm font-medium text-ink">
                  Dán tin nhắn {currentRole} vừa gửi
                </label>
                <span className="text-xs tabular-nums text-muted" aria-live="polite">
                  {message.length}/{MAX_CHARS}
                </span>
              </div>
              <textarea
                ref={textareaRef}
                id="dichbome-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={MAX_CHARS}
                placeholder={inputPlaceholder}
                className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#E7DDD0] bg-card px-4 py-3 text-[16px] leading-relaxed text-ink shadow-[var(--shadow-card)] outline-none transition-colors placeholder:text-muted/70 hover:border-ink/25 focus:border-[#C22A44]/50 focus:ring-2 focus:ring-[#C22A44]/25"
              />
              {message ? (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => clearComposer()}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]"
                  >
                    <Eraser className="size-4" aria-hidden />
                    Xoá nội dung
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-7">
              <SectionLabel>Ai vừa nhắn?</SectionLabel>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Chọn đúng mối quan hệ — chọn {speaker} thì ô nhập và câu gợi ý sẽ đổi theo{' '}
                {currentRole}.
              </p>
              <div className="mt-3 space-y-4">
                {RELATION_GROUPS.map((group) => (
                  <fieldset key={group.label}>
                    <legend className="text-[12px] font-semibold tracking-wide text-ink/70">
                      {group.label}
                    </legend>
                    <div
                      className="mt-2 flex flex-wrap gap-2"
                      role="group"
                      aria-label={`Người nhắn thuộc nhóm ${group.label}`}
                    >
                      {group.roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          aria-pressed={speaker === role}
                          onClick={() => setSpeaker(role)}
                          className={cn(
                            'inline-flex min-h-11 items-center rounded-full border bg-card px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]',
                            speaker === role
                              ? 'border-[#C22A44] bg-[#FDF0F2] font-semibold text-[#8F1D33]'
                              : 'border-[#E7DDD0] text-muted hover:border-ink/30 hover:text-ink',
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <SectionLabel>Hoàn cảnh</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Hoàn cảnh">
                {PARENT_CONTEXTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={context === c}
                    onClick={() => setContext(c)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-full border border-[#E7DDD0] bg-card px-4 text-sm text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]',
                      context === c
                        ? 'border-[#C22A44] bg-[#FDF0F2] font-semibold text-[#8F1D33]'
                        : 'hover:border-ink/30 hover:text-ink',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => void doTranslate(message, speaker, context)}
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C22A44] px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(194,42,68,0.22)] transition hover:bg-[#A8243B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EF] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? 'Đang dịch…' : `Dịch ý ${currentRole}`}
              {!loading && <ArrowRight className="size-4" aria-hidden />}
            </button>

            {error ? (
              <p
                className="mt-4 border-l-2 border-[#C22A44] py-1 pl-3 text-sm leading-relaxed text-ink"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="mt-4 border-l-2 border-line py-1 pl-3 text-sm leading-relaxed text-muted">
                {notice}
              </p>
            ) : null}
          </section>

          {/* Cột kết quả / ví dụ / lịch sử */}
          <div className="min-w-0">
            {loading ? (
              <section aria-live="polite" className="border-y border-line py-10">
                <p className="text-[15px] text-muted">Đang phân tích tin nhắn…</p>
                <div className="mt-4 space-y-3" aria-hidden>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-line/70" />
                  <div className="h-4 w-full animate-pulse rounded bg-line/70" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-line/70" />
                </div>
              </section>
            ) : result ? (
              <section
                ref={resultRef}
                tabIndex={-1}
                aria-live="polite"
                className="scroll-mt-24 outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]"
              >
                <div className="rounded-2xl border border-[#E7DDD0] bg-card shadow-[var(--shadow-card)]">
                  <div className="px-5 py-5 sm:px-6">
                    <SectionLabel>Ý thật</SectionLabel>
                    <p className="mt-2 text-[16px] leading-relaxed text-ink sm:text-[17px]">
                      {result.meaning}
                    </p>
                  </div>

                  <div className="border-t border-line px-5 py-5 sm:px-6">
                    <SectionLabel>Điều {activeRole} muốn nghe</SectionLabel>
                    <p className="mt-2 text-[16px] leading-relaxed text-ink">{result.realWant}</p>
                  </div>

                  <div className="border-t border-line px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <SectionLabel>Mức độ không hài lòng</SectionLabel>
                      <p className="text-sm text-muted">
                        <span className="font-medium text-ink">{result.dangerLabel}</span>
                        {' · '}
                        {result.angerLevel}/5
                      </p>
                    </div>
                    <div
                      className="mt-3 h-1.5 overflow-hidden rounded-full bg-line/70"
                      role="progressbar"
                      aria-valuenow={result.angerLevel}
                      aria-valuemin={0}
                      aria-valuemax={5}
                      aria-label={`Mức độ không hài lòng của ${activeRole}`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(4, result.angerLevel * 20)}%`,
                          background: barColor,
                        }}
                      />
                    </div>
                  </div>

                  {result.warning ? (
                    <div className="border-t border-line px-5 py-5 sm:px-6">
                      <SectionLabel>Lưu ý</SectionLabel>
                      <p className="mt-2 text-[15px] leading-relaxed text-ink">{result.warning}</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-10">
                  <h2 className="text-base font-semibold tracking-tight text-ink">
                    Câu trả lời gợi ý
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Sao chép một câu và gửi lại cho {activeRole}.
                  </p>
                  <div className="mt-4 space-y-3">
                    {result.replies.map((reply, idx) => (
                      <div
                        key={`${reply.label}-${idx}`}
                        className="rounded-2xl border border-[#E7DDD0] bg-[#FFFDF8] px-4 py-3.5 sm:px-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="pt-2 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
                            {reply.label}
                          </p>
                          <button
                            type="button"
                            onClick={() => void copyReply(reply.text, idx)}
                            aria-label={
                              copiedIdx === idx
                                ? `Đã sao chép câu ${reply.label}`
                                : `Sao chép câu ${reply.label}`
                            }
                            title={copiedIdx === idx ? 'Đã sao chép' : 'Sao chép'}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-card hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]"
                          >
                            {copiedIdx === idx ? (
                              <Check className="size-[18px]" style={{ color: ACCENT }} />
                            ) : (
                              <Copy className="size-[18px]" />
                            )}
                          </button>
                        </div>
                        <p className="pr-2 pb-1 text-[15px] leading-relaxed text-ink sm:text-base">
                          {reply.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void shareResult()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#C22A44] px-4 text-sm font-semibold text-white transition hover:bg-[#A8243B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EF]"
                  >
                    <Share2 className="size-4" aria-hidden />
                    Chia sẻ kết quả
                  </button>
                  <button
                    type="button"
                    onClick={toggleSaveResult}
                    aria-pressed={currentSaved}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]',
                      currentSaved
                        ? 'border-[#C22A44] bg-[#FDF0F2] text-[#8F1D33]'
                        : 'border-[#E7DDD0] bg-card text-ink hover:border-ink/30',
                    )}
                  >
                    {currentSaved ? (
                      <BookmarkCheck className="size-4" aria-hidden />
                    ) : (
                      <Bookmark className="size-4" aria-hidden />
                    )}
                    {currentSaved ? 'Đã lưu' : 'Lưu kết quả'}
                  </button>
                  <button
                    type="button"
                    onClick={translateAnother}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#E7DDD0] bg-card px-4 text-sm font-semibold text-ink transition hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]"
                  >
                    <Eraser className="size-4" aria-hidden />
                    Dịch câu khác
                  </button>
                </div>
                {shareFeedback ? (
                  <p className="mt-3 text-sm text-muted" role="status" aria-live="polite">
                    {shareFeedback}
                  </p>
                ) : null}
              </section>
            ) : (
              <section className="border-y border-line py-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/products/brand/dichbome-logo.svg"
                  alt=""
                  width={72}
                  height={72}
                  className="size-[72px]"
                />
                <h2 className="mt-4 text-base font-semibold tracking-tight text-ink">
                  Chưa có kết quả
                </h2>
                <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-muted">
                  Dán một câu {currentRole} vừa nhắn vào ô nhập, hoặc chọn một câu mẫu để xem cách
                  app phân tích.
                </p>
              </section>
            )}

            <section id="examples" className="mt-12 scroll-mt-24" aria-label="Câu mẫu">
              <SectionLabel>Câu mẫu</SectionLabel>
              <h2 className="mt-1.5 text-base font-semibold tracking-tight text-ink">
                Các câu thường gặp
              </h2>
              <div
                className="mt-4 flex flex-wrap gap-2"
                role="group"
                aria-label="Lọc câu mẫu theo quan hệ"
              >
                {[ALL_GROUPS, ...RELATION_GROUPS.map((g) => g.label)].map((label) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={exampleGroup === label}
                    onClick={() => setExampleGroup(label)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]',
                      exampleGroup === label
                        ? 'border-[#C22A44] bg-[#FDF0F2] font-semibold text-[#8F1D33]'
                        : 'border-[#E7DDD0] bg-card text-muted hover:border-ink/30 hover:text-ink',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {filteredExamples.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-[#E7DDD0] bg-card px-5 py-6 text-[15px] text-muted">
                  Chưa có câu mẫu cho nhóm này. Hãy chọn “Tất cả” hoặc thử một nhóm quan hệ khác.
                </p>
              ) : null}
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#E7DDD0] bg-card shadow-[var(--shadow-card)]">
                <ul className="divide-y divide-line">
                  {filteredExamples.map((ex) => (
                    <li key={ex.message}>
                      <button
                        type="button"
                        onClick={() => {
                          setMessage(ex.message);
                          setSpeaker(ex.speaker);
                          setContext(ex.context);
                          void doTranslate(ex.message, ex.speaker, ex.context);
                        }}
                        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C22A44] sm:px-5"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium text-ink">
                            “{ex.message}”
                          </span>
                          <span className="mt-0.5 block truncate text-[13px] text-muted">
                            {ex.speaker} · {ex.context} · {ex.tease}
                          </span>
                        </span>
                        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="saved" className="mt-12 scroll-mt-24" aria-label="Kết quả đã lưu">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <SectionLabel>Yêu thích</SectionLabel>
                  <h2 className="mt-1.5 text-base font-semibold tracking-tight text-ink">Đã lưu</h2>
                </div>
                {saved.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearSaved}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]"
                  >
                    <Trash2 className="size-4" aria-hidden /> Xoá hết
                  </button>
                ) : null}
              </div>
              {saved.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-[#E7DDD0] bg-card px-5 py-6 text-[15px] leading-relaxed text-muted">
                  Bấm “Lưu kết quả” sau khi dịch để giữ lại tối đa 20 kết quả quan trọng trên thiết
                  bị này.
                </p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#E7DDD0] bg-card shadow-[var(--shadow-card)]">
                  <ul className="divide-y divide-line">
                    {saved.map((item) => (
                      <li key={item.id} className="flex items-stretch">
                        <button
                          type="button"
                          onClick={() => restore(item)}
                          className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C22A44] sm:px-5"
                        >
                          <BookmarkCheck className="size-5 shrink-0 text-[#C22A44]" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-medium text-ink">
                              “{item.message}”
                            </span>
                            <span className="mt-0.5 block truncate text-[13px] text-muted">
                              {item.speaker} · {item.context} · Mức {item.result.angerLevel}/5
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSaved(item.id)}
                          aria-label={`Xoá kết quả đã lưu: ${item.message}`}
                          title="Xoá mục này"
                          className="inline-flex w-12 shrink-0 items-center justify-center text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C22A44]"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section id="history" className="mt-12 scroll-mt-24" aria-label="Lịch sử dịch">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <SectionLabel>Lịch sử</SectionLabel>
                  <h2 className="mt-1.5 text-base font-semibold tracking-tight text-ink">
                    Đã dịch gần đây
                  </h2>
                </div>
                {history.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C22A44]"
                  >
                    <Trash2 className="size-4" aria-hidden /> Xoá
                  </button>
                ) : null}
              </div>
              {history.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-[#E7DDD0] bg-card px-5 py-6 text-[15px] leading-relaxed text-muted">
                  Những câu đã dịch sẽ xuất hiện ở đây trên chính thiết bị này, để lần sau mở lại
                  xem nhanh.
                </p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#E7DDD0] bg-card shadow-[var(--shadow-card)]">
                  <ul className="divide-y divide-line">
                    {history.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => restore(item)}
                          className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C22A44] sm:px-5"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-medium text-ink">
                              “{item.message}”
                            </span>
                            <span className="mt-0.5 block truncate text-[13px] text-muted">
                              {item.speaker} · {item.context} · Mức {item.result.angerLevel}/5
                            </span>
                          </span>
                          <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Điều hướng PWA trên di động — chỉ cuộn tới khu vực trong trang, không đổi route */}
      <nav
        aria-label="Điều hướng Giải Mã Gia Đình"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E7DDD0] bg-[#FFFDF8]/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid max-w-xl grid-cols-4">
          <button
            type="button"
            onClick={() => scrollToSection('decoder')}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#C22A44]"
          >
            <MessageSquare className="size-5" aria-hidden />
            Giải mã
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('examples')}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted"
          >
            <Rows3 className="size-5" aria-hidden />
            Câu mẫu
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('saved')}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted"
          >
            <History className="size-5" aria-hidden />
            Lịch sử
          </button>
          <Link
            href="/"
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted"
          >
            <LayoutGrid className="size-5" aria-hidden />
            Ứng dụng
          </Link>
        </div>
      </nav>
    </div>
  );
}
