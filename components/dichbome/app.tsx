'use client';

/**
 * Sân Khấu Hội Thoại (redesign-v2) — điều phối toàn app trong một khung 100dvh không cuộn trang:
 * thanh app ghim trên, vùng sân khấu cuộn nội bộ, composer ghim đáy; Bảng (Board) chứa
 * Câu mẫu · Đã lưu · Lịch sử · Tìm hiểu. Tầng trung thực (lib/honesty) quyết định cách trình bày
 * mọi kết quả: phiếu đầy đủ / phiếu độ tin cậy thấp / thẻ «Câu này app chưa đọc được».
 * Thuật toán dịch không đổi — chỉ thêm provenance + cổng trình bày ở đây.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { createDichbomeApi, resolveDichbomeApiMode } from './api';
import { Board } from './board';
import { Composer } from './composer';
import { copyText } from './lib/clipboard';
import { evaluateClient, gateForDevice, gateForServer, type TranslateMeta } from './lib/honesty';
import {
  PARENT_EXAMPLES,
  translateParentMessage,
  type ParentContext,
  type ParentExample,
  type RelationRole,
  type TranslateResult,
} from './lib/translate';
import { readVersioned, writeVersioned } from './lib/storage';
import { planDelete } from './lib/undo';
import type { BoardTab, SlipView, StoredItem, StripState } from './lib/ui-types';
import { NotReadCard, OriginalBubble, StageErrorCard, StageSlip, TypingBubble } from './slip';
import { UndoBar } from './sheets';

const HISTORY_KEY = 'dichbome_history_v1';
const SAVED_KEY = 'dichbome_saved_v1';
const PREFS_KEY = 'dichbome_prefs_v1';
const HISTORY_MAX = 8;
const SAVED_MAX = 20;
const UNDO_WINDOW_MS = 8000;
// Chế độ local chạy engine client ngay trên máy — nguồn trình bày là 'device', không phải 'server'.
const USE_LOCAL = resolveDichbomeApiMode() === 'local';
const api = createDichbomeApi();

type ActiveInput = { message: string; speaker: RelationRole; context: ParentContext };

type StageState =
  | { kind: 'idle' }
  | { kind: 'loading'; input: ActiveInput }
  | { kind: 'slip'; view: SlipView }
  | {
      kind: 'not-read';
      input: ActiveInput;
      bodyKind: 'garbage' | 'unknown-vn';
      fallbackResult: TranslateResult;
      fallbackSource: 'server' | 'device';
      fellBack: boolean;
    }
  | { kind: 'error'; input: ActiveInput };

type PendingDeletion = {
  scope: 'history' | 'saved';
  snapshot: StoredItem[];
  label: string;
};

function excerpt(message: string): string {
  const words = message.split(/\s+/).filter(Boolean);
  return words.length > 6 ? `${words.slice(0, 6).join(' ')}…` : message;
}

export function DichbomeApp() {
  const [message, setMessage] = useState('');
  const [speaker, setSpeaker] = useState<RelationRole>('Mẹ');
  const [context, setContext] = useState<ParentContext>('Khác');
  const [examples, setExamples] = useState<ParentExample[]>(PARENT_EXAMPLES);
  const [history, setHistory] = useState<StoredItem[]>([]);
  const [saved, setSaved] = useState<StoredItem[]>([]);
  const [stage, setStage] = useState<StageState>({ kind: 'idle' });
  const [strip, setStrip] = useState<StripState | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [boardTab, setBoardTab] = useState<BoardTab>('examples');
  const [isOnline, setIsOnline] = useState(true);
  const [swUpdate, setSwUpdate] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const [focusSignal, setFocusSignal] = useState(0);

  const hydratedRef = useRef(false);
  const seqRef = useRef(0);
  const pendingRef = useRef<PendingDeletion | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const historyRef = useRef<StoredItem[]>([]);
  const savedRef = useRef<StoredItem[]>([]);
  const stageScrollRef = useRef<HTMLDivElement | null>(null);
  const slipHeadingRef = useRef<HTMLHeadingElement | null>(null);

  // Ref gương của hai bộ sưu tập để các callback/timer đọc được bản mới nhất
  // (gán trong effect — không gán ref trong lúc render).
  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  const loading = stage.kind === 'loading';

  /* ---------- persistence có kỷ luật hoàn tác ----------
   * Khi một bộ sưu tập đang có lệnh xoá chờ hoàn tác, KHÔNG ghi đè localStorage của nó:
   * bản đã xoá chỉ được "chốt" khi hết 8 giây, khi có xoá mới, hoặc khi có mục mới thêm vào. */
  const persistCollection = useCallback((scope: 'history' | 'saved', items: StoredItem[]) => {
    writeVersioned(scope === 'history' ? HISTORY_KEY : SAVED_KEY, items);
  }, []);

  const commitPendingDeletion = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    persistCollection(
      pending.scope,
      pending.scope === 'history' ? historyRef.current : savedRef.current,
    );
    pendingRef.current = null;
    setPendingDeletion(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, [persistCollection]);

  const startDeletion = useCallback(
    (scope: 'history' | 'saved', ids: ReadonlySet<string>, label: string) => {
      commitPendingDeletion();
      const items = scope === 'history' ? historyRef.current : savedRef.current;
      const { remaining } = planDelete(items, ids);
      if (scope === 'history') setHistory(remaining);
      else setSaved(remaining);
      const pending: PendingDeletion = { scope, snapshot: items, label };
      pendingRef.current = pending;
      setPendingDeletion(pending);
      undoTimerRef.current = window.setTimeout(() => {
        undoTimerRef.current = null;
        commitPendingDeletion();
      }, UNDO_WINDOW_MS);
    },
    [commitPendingDeletion],
  );

  const undoDeletion = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (pending.scope === 'history') {
      setHistory(pending.snapshot);
      persistCollection('history', pending.snapshot);
    } else {
      setSaved(pending.snapshot);
      persistCollection('saved', pending.snapshot);
    }
    pendingRef.current = null;
    setPendingDeletion(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, [persistCollection]);

  /* ---------- khởi tạo: prefs + dữ liệu đã lưu + trạng thái mạng + ví dụ từ máy chủ ---------- */
  useEffect(() => {
    // Nạp prefs + dữ liệu đã lưu từ localStorage SAU khi mount để tránh hydration mismatch
    // (server không có localStorage) — giữ pattern gốc của bản v1.
    const prefs = readVersioned<{ speaker?: RelationRole; context?: ParentContext }>(PREFS_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chủ đích: đọc localStorage sau mount, tránh hydration mismatch
    if (prefs?.speaker) setSpeaker(prefs.speaker);
    if (prefs?.context) setContext(prefs.context);
    const storedHistory = readVersioned<StoredItem[]>(HISTORY_KEY);
    if (Array.isArray(storedHistory)) setHistory(storedHistory.slice(0, HISTORY_MAX));
    const storedSaved = readVersioned<StoredItem[]>(SAVED_KEY);
    if (Array.isArray(storedSaved)) setSaved(storedSaved.slice(0, SAVED_MAX));
    hydratedRef.current = true;

    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const onSwUpdate = () => setSwUpdate(true);
    window.addEventListener('dichbome:sw-update', onSwUpdate);

    let cancelled = false;
    api
      .examples()
      .then((data) => {
        if (!cancelled && data.examples?.length) setExamples(data.examples);
      })
      .catch(() => {
        // Giữ bộ câu mẫu đóng gói sẵn trong app — ví dụ từ máy chủ chỉ là bản làm mới.
      });
    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('dichbome:sw-update', onSwUpdate);
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    writeVersioned(PREFS_KEY, { speaker, context });
  }, [speaker, context]);

  /* ---------- trình bày kết quả ---------- */
  const presentSlip = useCallback(
    (
      result: TranslateResult,
      opts: {
        input: ActiveInput;
        source: 'server' | 'device';
        tier: SlipView['tier'];
        offline: boolean;
        fellBack: boolean;
      },
    ) => {
      const at = new Date().toISOString();
      const view: SlipView = {
        message: opts.input.message,
        speaker: opts.input.speaker,
        context: opts.input.context,
        result,
        source: opts.source,
        tier: opts.tier,
        offline: opts.offline,
        fellBack: opts.fellBack,
        at,
      };
      setStage({ kind: 'slip', view });
      // Chỉ phiếu đã hiển thị mới vào Lịch sử (thẻ chưa-đọc-được không ghi gì).
      if (pendingRef.current?.scope === 'history') commitPendingDeletion();
      const item: StoredItem = {
        id: `${Date.now()}`,
        message: opts.input.message,
        speaker: opts.input.speaker,
        context: opts.input.context,
        result,
        at,
        source: opts.source,
        tier: opts.tier,
        offline: opts.offline,
      };
      setHistory((prev) => {
        const next = [item, ...prev.filter((h) => h.message !== item.message)].slice(
          0,
          HISTORY_MAX,
        );
        persistCollection('history', next);
        return next;
      });
      window.setTimeout(() => slipHeadingRef.current?.focus(), 80);
    },
    [commitPendingDeletion, persistCollection],
  );

  const runDevice = useCallback(
    (input: ActiveInput, fellBack: boolean, offline: boolean) => {
      try {
        const clientEval = evaluateClient(input.message, input.speaker);
        const gate = gateForDevice(clientEval.match, clientEval.isCurt);
        if (gate === 'not-read') {
          setStage({
            kind: 'not-read',
            input,
            bodyKind: clientEval.hasKnownToken ? 'unknown-vn' : 'garbage',
            fallbackResult: translateParentMessage(input),
            fallbackSource: 'device',
            fellBack,
          });
          return;
        }
        const tier: SlipView['tier'] =
          gate === 'low-direct'
            ? 'low'
            : clientEval.match
              ? clientEval.match.roleSpecific
                ? 'role'
                : 'generic'
              : 'role';
        presentSlip(translateParentMessage(input), {
          input,
          source: 'device',
          tier,
          offline,
          fellBack,
        });
      } catch {
        setStage({ kind: 'error', input });
      }
    },
    [presentSlip],
  );

  const runTranslate = useCallback(
    async (input: ActiveInput) => {
      const seq = ++seqRef.current;
      setComposerError(null);
      setStrip(null);
      setCopiedIdx(null);
      setStage({ kind: 'loading', input });
      requestAnimationFrame(() => stageScrollRef.current?.scrollTo({ top: 0 }));

      const offlineNow = !navigator.onLine;
      if (offlineNow && !USE_LOCAL) {
        runDevice(input, false, true);
        return;
      }
      try {
        const res = await api.translate({
          message: input.message,
          speaker: input.speaker,
          context: input.context,
        });
        if (seq !== seqRef.current) return; // đã bị Huỷ hoặc có lượt dịch mới hơn
        const { meta, ...result } = res as TranslateResult & { meta?: TranslateMeta };
        const clientEval = evaluateClient(input.message, input.speaker);
        const gate = gateForServer(meta, clientEval.isCurt);
        const source: 'server' | 'device' = USE_LOCAL ? 'device' : 'server';
        if (gate === 'not-read') {
          setStage({
            kind: 'not-read',
            input,
            bodyKind: clientEval.hasKnownToken ? 'unknown-vn' : 'garbage',
            fallbackResult: result,
            fallbackSource: source,
            fellBack: false,
          });
          return;
        }
        const tier: SlipView['tier'] =
          gate === 'low-direct'
            ? 'low'
            : meta?.matchKind === 'entry'
              ? meta.roleSpecific
                ? 'role'
                : 'generic'
              : 'role';
        presentSlip(result, {
          input,
          source,
          tier,
          offline: USE_LOCAL ? offlineNow : false,
          fellBack: false,
        });
      } catch {
        if (seq !== seqRef.current) return;
        runDevice(input, true, offlineNow);
      }
    },
    [presentSlip, runDevice],
  );

  /* ---------- hành động của người dùng ---------- */
  const handleTranslate = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) {
      setComposerError('Hãy dán hoặc gõ một câu trước đã.');
      setFocusSignal((n) => n + 1);
      return;
    }
    void runTranslate({ message: trimmed, speaker, context });
  }, [message, speaker, context, runTranslate]);

  const handleCancel = useCallback(() => {
    seqRef.current += 1;
    setStage({ kind: 'idle' });
  }, []);

  const fillExample = useCallback(
    (ex: ParentExample, translateNow: boolean) => {
      setMessage(ex.message);
      setSpeaker(ex.speaker);
      setContext(ex.context);
      setBoardOpen(false);
      setComposerError(null);
      if (translateNow) {
        void runTranslate({ message: ex.message, speaker: ex.speaker, context: ex.context });
      } else {
        setFocusSignal((n) => n + 1);
      }
    },
    [runTranslate],
  );

  const restoreItem = useCallback((item: StoredItem) => {
    setMessage(item.message);
    setSpeaker(item.speaker);
    setContext(item.context);
    setBoardOpen(false);
    setStrip(null);
    setCopiedIdx(null);
    setStage({
      kind: 'slip',
      view: {
        message: item.message,
        speaker: item.speaker,
        context: item.context,
        result: item.result,
        source: item.source ?? 'stored',
        tier: item.tier ?? 'role',
        offline: item.offline ?? false,
        fellBack: false,
        at: item.at,
      },
    });
    requestAnimationFrame(() => stageScrollRef.current?.scrollTo({ top: 0 }));
    window.setTimeout(() => slipHeadingRef.current?.focus(), 80);
  }, []);

  const currentSavedItem =
    stage.kind === 'slip'
      ? saved.find((s) => s.message === stage.view.message && s.speaker === stage.view.speaker)
      : undefined;

  const openBoard = useCallback((tab: BoardTab) => {
    setBoardTab(tab);
    setBoardOpen(true);
  }, []);

  const handleToggleSave = useCallback(() => {
    if (stage.kind !== 'slip') return;
    const view = stage.view;
    const existing = savedRef.current.find(
      (s) => s.message === view.message && s.speaker === view.speaker,
    );
    if (existing) {
      // N-5(a) (fix wave 2026-10-23): «Đã lưu» bấm lần 2 KHÔNG còn là toggle bỏ
      // lưu bất ngờ — nhãn này được người dùng đọc như đường dẫn tới danh sách
      // (panel #02, D-6/N-5), nên bấm là mở Bảng tab Đã lưu. Bỏ lưu vẫn làm
      // được trong Bảng bằng nút Xoá (có hoàn tác 8 giây như mọi lần xoá).
      openBoard('saved');
      return;
    }
    if (savedRef.current.length >= SAVED_MAX) {
      setStrip({ kind: 'saved-full' });
      return;
    }
    if (pendingRef.current?.scope === 'saved') commitPendingDeletion();
    // (nhánh dưới chỉ chạy khi CHƯA lưu — xem nhánh existing ở trên)
    const item: StoredItem = {
      id: `${Date.now()}`,
      message: view.message,
      speaker: view.speaker,
      context: view.context,
      result: view.result,
      at: view.at,
      source: view.source === 'stored' ? undefined : view.source,
      tier: view.tier,
      offline: view.offline,
    };
    setSaved((prev) => {
      const next = [item, ...prev];
      persistCollection('saved', next);
      return next;
    });
  }, [stage, openBoard, commitPendingDeletion, persistCollection]);

  const handleCopyReply = useCallback(async (text: string, idx: number) => {
    const ok = await copyText(text);
    if (ok) {
      setCopiedIdx(idx);
      setStrip({ kind: 'copy-ok' });
      window.setTimeout(() => {
        setCopiedIdx((current) => (current === idx ? null : current));
      }, 2000);
    } else {
      // Chỉ báo thành công khi sao chép THẬT — thất bại thì đưa hộp sao chép thủ công.
      setStrip({ kind: 'copy-fail', text });
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (stage.kind !== 'slip') return;
    const view = stage.view;
    // D-6(2) (Panel #03): phiếu tier 'low' không chấm mức — chuỗi chia sẻ
    // cũng không được bịa một con số mức cho cùng kết quả đó.
    const levelPart =
      view.tier === 'low'
        ? 'Mức căng thẳng: chưa đủ dữ kiện để chấm cho câu này'
        : `Mức căng thẳng: ${view.result.angerLevel}/5 — ${view.result.dangerLabel}`;
    const text = `${view.message}\n\nÝ thật: ${view.result.meaning}\n\n${levelPart}\n\n— Dịch bởi Giải Mã Gia Đình`;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Giải Mã Gia Đình', text });
        setStrip({ kind: 'share', text: 'Đã mở khung chia sẻ.' });
      } catch {
        // Người dùng tự đóng khung chia sẻ — không phải lỗi, không hiện dải nào.
      }
      return;
    }
    const ok = await copyText(text);
    setStrip({
      kind: 'share',
      text: ok
        ? 'Đã sao chép toàn bộ bản dịch — dán vào nơi bạn muốn gửi.'
        : 'Không chia sẻ được trên trình duyệt này. Bạn sao chép một câu trả lời bên trên để gửi tay nhé.',
    });
  }, [stage]);

  const handleTranslateAnother = useCallback(() => {
    seqRef.current += 1;
    setStage({ kind: 'idle' });
    setMessage('');
    setStrip(null);
    setCopiedIdx(null);
    setFocusSignal((n) => n + 1);
  }, []);

  const showFallback = useCallback(() => {
    if (stage.kind !== 'not-read') return;
    presentSlip(stage.fallbackResult, {
      input: stage.input,
      source: stage.fallbackSource,
      tier: 'low',
      offline: stage.fallbackSource === 'device' ? !navigator.onLine : false,
      fellBack: stage.fellBack,
    });
  }, [stage, presentSlip]);

  const undoBarData = pendingDeletion
    ? { label: pendingDeletion.label, onUndo: undoDeletion }
    : null;

  /* Chỉ báo «còn nội dung ở dưới» (M-3): phiếu điển hình vẫn dài hơn một khung
   * sân khấu (xem ngân sách thật ở LAYOUT-SPEC §1) — khi người dùng chưa cuộn
   * tới cuối phiếu, một thanh trong luồng (in-flow, xem N-04-1 ở JSX dưới)
   * nói rõ còn phần dưới và bấm là cuộn xuống. Trước M-3 không có chỉ báo
   * nào, phần dưới nếp gấp bị mất hút; bản overlay tuyệt đối của M-3 bị
   * Panel #04 bắt lỗi giao thước (N-04-1) và đã thay bằng in-flow ở V4. */
  const [showMoreHint, setShowMoreHint] = useState(false);
  const updateMoreHint = useCallback(() => {
    const el = stageScrollRef.current;
    if (!el || stage.kind !== 'slip') {
      setShowMoreHint(false);
      return;
    }
    setShowMoreHint(
      el.scrollHeight - el.clientHeight > 24 &&
        el.scrollTop + el.clientHeight < el.scrollHeight - 24,
    );
  }, [stage.kind]);
  useEffect(() => {
    updateMoreHint();
    window.addEventListener('resize', updateMoreHint);
    return () => window.removeEventListener('resize', updateMoreHint);
  }, [stage, updateMoreHint]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      {/* Thanh app ghim trên */}
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-hairline bg-canvas px-4 min-[1280px]:h-14">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh brand tĩnh tự host (SVG/WebP đã tối ưu từ asset pack, kích thước cố định chống CLS); next/image không thêm giá trị ở đây */}
        <img
          src="/products/brand/dichbome-logo.svg"
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-lg"
        />
        <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold leading-6">
          Giải Mã Gia Đình
        </h1>
        <button
          type="button"
          onClick={() => setBoardOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-line-control bg-canvas px-3 text-sm font-semibold min-[1280px]:hidden"
        >
          <Layers className="size-4" aria-hidden />
          Bảng
        </button>
      </header>

      {!isOnline ? (
        <div className="shrink-0 bg-warning-bg px-4 py-2 text-center text-[13px] font-medium text-ink">
          Đang offline — app dịch ngay trên thiết bị.
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {/* Cột sân khấu + composer — landmark <main> cho nội dung chính (N-6) */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <div
              ref={stageScrollRef}
              onScroll={updateMoreHint}
              className="h-full overflow-y-auto px-4 py-4"
            >
              <div className="mx-auto w-full max-w-[640px]">
                {stage.kind === 'idle' ? (
                  <div className="flex flex-col items-center pt-6 text-center">
                    {/* Hero «Hai Lượt Một Nhịp» (REDESIGN-V4, VISUAL-LAYER
                        §2): SVG tĩnh in-flow ở đầu vùng cuộn, CHỈ ở trạng
                        thái trống — lượt đầu đến là unmount. Khung 720×216
                        khai trước bằng attrs (aspect 10:3, CLS = 0); hiển
                        thị 358×107 ở 390px, tối đa 592×178 ở desktop. */}
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh brand tĩnh tự host (SVG đã tối ưu từ asset pack, kích thước cố định chống CLS); next/image không thêm giá trị ở đây */}
                    <img
                      src="/products/brand/dichbome-hero-stage.svg"
                      alt=""
                      width={720}
                      height={216}
                      className="h-auto w-full max-w-[592px]"
                    />
                    {/* M-4: Stage display về đúng thang đã duyệt — 30/37
                      mobile · 40/48 desktop. V4: Fraunces weight 680 TƯỜNG
                      MINH (trước đây class font-semibold = 600 — sai toạ độ
                      trục variable; F-6 đo lại trên render thật).
                      D-4(a) (Panel #03): text-balance giữ nguyên. */}
                    <h2
                      style={{ fontWeight: 680 }}
                      className="mt-4 font-display text-[30px] leading-[37px] text-balance min-[1280px]:text-[40px] min-[1280px]:leading-[48px]"
                    >
                      Người nhà vừa nhắn gì thế?
                    </h2>
                    {/* R4-F1: phụ đề rút 23 → 17 từ (bù hồi quy ngân sách chữ
                        đứng 77/75 do dòng DATA-09b cộng thêm; đích ≤72/75).
                        Ý giữ nguyên: dán câu — app đọc ý thật, gợi ý câu trả
                        lời. Dòng DATA-09b ở composer KHÔNG bị cắt. */}
                    <p className="mt-2 max-w-[320px] text-[15px] leading-relaxed text-balance text-muted">
                      Dán câu vào ô dưới — app đọc ý thật, gợi ý câu trả lời êm chuyện.
                    </p>
                    <div className="mt-4 flex flex-col items-center gap-2">
                      {examples.slice(0, 2).map((ex) => (
                        <button
                          key={ex.message}
                          type="button"
                          onClick={() => fillExample(ex, false)}
                          className="min-h-11 max-w-full truncate rounded-full border border-line-control bg-canvas px-4 text-sm"
                        >
                          “{excerpt(ex.message)}”
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {stage.kind === 'loading' ? (
                  <div>
                    <OriginalBubble
                      message={stage.input.message}
                      speaker={stage.input.speaker}
                      context={stage.input.context}
                    />
                    <div className="mt-3">
                      <TypingBubble />
                    </div>
                  </div>
                ) : null}

                {stage.kind === 'slip' ? (
                  <div>
                    <OriginalBubble
                      message={stage.view.message}
                      speaker={stage.view.speaker}
                      context={stage.view.context}
                    />
                    <div className="mt-3">
                      <StageSlip
                        view={stage.view}
                        saved={Boolean(currentSavedItem)}
                        copiedIdx={copiedIdx}
                        onCopyReply={handleCopyReply}
                        onToggleSave={handleToggleSave}
                        onShare={handleShare}
                        onTranslateAnother={handleTranslateAnother}
                        onOpenSavedBoard={() => openBoard('saved')}
                        strip={strip}
                        headingRef={slipHeadingRef}
                      />
                    </div>
                  </div>
                ) : null}

                {stage.kind === 'not-read' ? (
                  <div>
                    <OriginalBubble
                      message={stage.input.message}
                      speaker={stage.input.speaker}
                      context={stage.input.context}
                    />
                    <div className="mt-3">
                      <NotReadCard
                        bodyKind={stage.bodyKind}
                        speaker={stage.input.speaker}
                        onEdit={() => setFocusSignal((n) => n + 1)}
                        onTryExample={() => openBoard('examples')}
                        onShowFallback={showFallback}
                      />
                    </div>
                  </div>
                ) : null}

                {stage.kind === 'error' ? (
                  <div>
                    <OriginalBubble
                      message={stage.input.message}
                      speaker={stage.input.speaker}
                      context={stage.input.context}
                    />
                    <div className="mt-3">
                      <StageErrorCard onRetry={() => void runTranslate(stage.input)} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* N-04-1 (Panel #04 → cách đóng đã chốt ở V4-IMPL-STATE §5):
              pill «Còn nội dung ở dưới» KHÔNG còn là overlay tuyệt đối
              neo đáy vùng cuộn. Bản cũ (absolute bottom-3) chồng lên nội
              dung phiếu: ở các vai có composer cao, hàng số + nhãn thước
              rơi vào dải pill → giao 270–276 px², và mọi cách đóng bằng
              «dịch nội dung» đều phụ thuộc chiều cao composer (biến thiên
              theo vai/số dòng/lỗi) nên không thành định lý được. Nay pill
              là THANH TRONG LUỒNG (in-flow) nằm giữa viewport sân khấu và
              composer — pill ở NGOÀI vùng cuộn nên giao với mọi nội dung
              phiếu bằng 0 px² theo cấu trúc, ở mọi vai/viewport/chiều cao
              composer. Giữ nguyên: nhãn, chiều cao 44px, hành vi bấm cuộn
              0,8×clientHeight, điều kiện hiện (còn >24px chưa xem). */}
          {showMoreHint ? (
            <div className="flex shrink-0 justify-center px-4 pt-2 pb-1">
              <button
                type="button"
                onClick={() =>
                  stageScrollRef.current?.scrollBy({
                    top: stageScrollRef.current.clientHeight * 0.8,
                    behavior: 'smooth',
                  })
                }
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold whitespace-nowrap text-canvas shadow-[var(--shadow-lift)]"
              >
                Còn nội dung ở dưới
                <ChevronDown className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}

          {pendingDeletion && !boardOpen ? (
            <div className="shrink-0 px-4 pb-2 min-[1280px]:hidden">
              <UndoBar label={pendingDeletion.label} onUndo={undoDeletion} />
            </div>
          ) : null}

          <Composer
            message={message}
            onMessageChange={(v) => {
              setMessage(v);
              if (composerError) setComposerError(null);
            }}
            speaker={speaker}
            onSpeakerChange={setSpeaker}
            context={context}
            onContextChange={setContext}
            loading={loading}
            onTranslate={handleTranslate}
            onCancel={handleCancel}
            error={composerError}
            focusSignal={focusSignal}
          />
        </main>

        {/* Bảng — một instance: sheet toàn màn hình trên mobile, cột phải cố định ≥1280px */}
        <Board
          open={boardOpen}
          onClose={() => setBoardOpen(false)}
          tab={boardTab}
          onTabChange={setBoardTab}
          examples={examples}
          saved={saved}
          history={history}
          onUseExample={fillExample}
          onRestore={restoreItem}
          onDeleteSavedItem={(id) =>
            startDeletion('saved', new Set([id]), 'Đã xoá một mục khỏi Đã lưu.')
          }
          onClearSaved={() =>
            startDeletion(
              'saved',
              new Set(savedRef.current.map((s) => s.id)),
              'Đã xoá toàn bộ kết quả đã lưu.',
            )
          }
          onClearHistory={() =>
            startDeletion(
              'history',
              new Set(historyRef.current.map((h) => h.id)),
              'Đã xoá toàn bộ lịch sử trên thiết bị này.',
            )
          }
          undo={undoBarData}
          swUpdateAvailable={swUpdate}
        />
      </div>
    </div>
  );
}
