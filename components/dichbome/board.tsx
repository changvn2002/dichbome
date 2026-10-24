'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RELATION_GROUPS, type ParentExample } from './lib/translate';
import type { BoardTab, StoredItem } from './lib/ui-types';
import { ConfirmDialog, UndoBar, useFocusTrap } from './sheets';
import { FindOutContent } from './find-out';
import { ContactAvatar, SenderDisc } from './avatar';

/**
 * Board — bề mặt phụ duy nhất của redesign-v2 (LAYOUT-SPEC §4–§6).
 * Một instance duy nhất, responsive: <1280px là sheet phủ toàn màn hình;
 * ≥1280px (hướng «Chat» vòng 3) là PANEL NỔI bo 22px có bóng lift, đứng
 * cạnh thread — thread + composer GIỮ NGUYÊN khi Bảng mở (không còn cột
 * phải thay chỗ composer như bản «Quiet Instrument»).
 * 4 tab: Câu mẫu · Đã lưu · Lịch sử · Tìm hiểu.
 * Chuỗi chốt theo COPY-DIET §3 #9–11, §4.4, §4.5.
 */

type BoardProps = {
  open: boolean;
  onClose: () => void;
  tab: BoardTab;
  onTabChange: (t: BoardTab) => void;
  examples: ParentExample[];
  saved: StoredItem[];
  history: StoredItem[];
  onUseExample: (ex: ParentExample, translateNow: boolean) => void;
  onRestore: (item: StoredItem) => void;
  onDeleteSavedItem: (id: string) => void;
  onClearSaved: () => void;
  onClearHistory: () => void;
  undo: { label: string; onUndo: () => void } | null;
  swUpdateAvailable: boolean;
};

const ALL_GROUPS = 'Tất cả';

function savedSourceLabel(item: StoredItem): string {
  if (item.source === 'server') return 'Nguồn: Máy chủ';
  // D-6(1) (Panel #03): phiếu ghi «Nguồn: Trên máy · Đang offline» nhưng bản
  // ghi cũ đánh rơi hậu tố offline — một sự kiện, hai bề mặt phải nói cùng
  // một sự thật (spec §2.7).
  if (item.source === 'device')
    return item.offline ? 'Nguồn: Trên máy · Đang offline' : 'Nguồn: Trên máy';
  return 'Đã lưu trên máy';
}

function historySourceShort(item: StoredItem): string {
  if (item.source === 'server') return 'Máy chủ';
  if (item.source === 'device') return item.offline ? 'Trên máy · Đang offline' : 'Trên máy';
  return 'Đã lưu';
}

/**
 * D-6(2)/T15 (Panel #03): phiếu tier 'low' tuyên bố «Chưa đủ dữ kiện để
 * chấm mức» — bản ghi KHÔNG được in «Mức n/5» cho cùng một kết quả.
 */
function recordLevelLabel(item: StoredItem): string {
  return item.tier === 'low' ? 'Chưa đủ dữ kiện' : `Mức ${item.result.angerLevel}/5`;
}

/**
 * N-5 (Panel #02): teaser không được cắt «…» giữa ý. Nguồn dữ liệu có teaser kết
 * thúc bằng «...» khi ý còn dở (vd bản máy chủ) — cắt lui về ranh giới cụm gần
 * nhất (dấu phẩy hoặc mệnh đề «thì») để dòng hiện trên thẻ luôn trọn ý. Teaser
 * đã trọn ý giữ nguyên từng chữ.
 */
function wholeTeaser(tease: string): string {
  const trimmed = tease.trim();
  if (!/(?:\.\.\.|…)$/.test(trimmed)) return trimmed;
  const body = trimmed.replace(/(?:\.\.\.|…)+$/, '').trim();
  const cut = Math.max(body.lastIndexOf(','), body.lastIndexOf(' thì '));
  return cut > 0 ? body.slice(0, cut).trim() : body;
}

/** Khung trạng thái trống dùng chung cho các tab (LAYOUT-SPEC §5) — chữ và hành động riêng từng tab.
 *  Art = «Phiến Chưa Ghim» (VISUAL-LAYER §3): Board trống hiện tối đa
 *  280×140; tab Đã lưu dùng bản thu nhỏ 160×80 (prop `artSmall`). */
function BoardEmptyState({
  title,
  description,
  action,
  artSmall = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  artSmall?: boolean;
}) {
  return (
    <div className="py-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh brand tĩnh tự host (SVG đã tối ưu từ asset pack, kích thước cố định chống CLS); next/image không thêm giá trị ở đây */}
      <img
        src="/products/brand/dichbome-empty-board.svg"
        alt=""
        width={480}
        height={240}
        className={artSmall ? 'w-[160px]' : 'w-[280px] max-w-full'}
      />
      <p className="mt-3 font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 text-[15px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function Board({
  open,
  onClose,
  tab,
  onTabChange,
  examples,
  saved,
  history,
  onUseExample,
  onRestore,
  onDeleteSavedItem,
  onClearSaved,
  onClearHistory,
  undo,
  swUpdateAvailable,
}: BoardProps) {
  const asideRef = useRef<HTMLElement | null>(null);
  // Focus trap chỉ áp cho sheet mobile: ở desktop Board là cột luôn hiện, không
  // được khoá focus. Đọc matchMedia một lần lúc mount (guard SSR) — phân xử thực
  // dụng đã ghi trong báo cáo worker.
  const [isDesktop] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches,
  );
  useFocusTrap(asideRef, open && !isDesktop, onClose);

  const [exampleGroup, setExampleGroup] = useState<string>(ALL_GROUPS);
  const [exampleQuery, setExampleQuery] = useState('');
  const [savedQuery, setSavedQuery] = useState('');
  const [confirmClearSavedOpen, setConfirmClearSavedOpen] = useState(false);
  const [confirmClearHistoryOpen, setConfirmClearHistoryOpen] = useState(false);
  // FIN v1.4.1: nút kích hoạt từng ConfirmDialog — dialog đóng thì focus trả
  // về đúng nút đã mở nó (returnFocusTo, cùng kỷ luật Sheet ở FIX mục 3b).
  const clearSavedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const clearHistoryTriggerRef = useRef<HTMLButtonElement | null>(null);

  const filteredExamples = useMemo(() => {
    const group = RELATION_GROUPS.find((g) => g.label === exampleGroup);
    const q = exampleQuery.toLowerCase();
    return examples.filter((ex) => {
      if (group && !group.roles.some((r) => r === ex.speaker)) return false;
      if (q && !ex.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [examples, exampleGroup, exampleQuery]);

  const filteredSaved = useMemo(() => {
    const q = savedQuery.toLowerCase();
    if (!q) return saved;
    return saved.filter((item) => item.message.toLowerCase().includes(q));
  }, [saved, savedQuery]);

  const tabs: Array<{ id: BoardTab; label: string }> = [
    { id: 'examples', label: 'Câu mẫu' },
    { id: 'saved', label: `Đã lưu · ${saved.length}/20` },
    { id: 'history', label: 'Lịch sử' },
    { id: 'findout', label: 'Tìm hiểu' },
  ];

  return (
    <aside
      ref={asideRef}
      aria-label="Bảng"
      className={cn(
        'fixed inset-0 z-[60] flex flex-col bg-canvas transition-[opacity,transform] duration-200',
        open
          ? 'visible opacity-100 min-[1280px]:pointer-events-auto min-[1280px]:static min-[1280px]:z-auto min-[1280px]:my-5 min-[1280px]:mr-5 min-[1280px]:w-[400px] min-[1280px]:shrink-0 min-[1280px]:translate-y-0 min-[1280px]:overflow-hidden min-[1280px]:rounded-[22px] min-[1280px]:border min-[1280px]:border-hairline min-[1280px]:opacity-100 min-[1280px]:shadow-[var(--shadow-lift)]'
          : 'pointer-events-none invisible translate-y-3 opacity-0 min-[1280px]:hidden',
      )}
    >
      <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-hairline px-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh brand tĩnh tự host (SVG/WebP đã tối ưu từ asset pack, kích thước cố định chống CLS); next/image không thêm giá trị ở đây */}
        <img src="/products/brand/dichbome-logo.svg" alt="" className="size-6 shrink-0" />
        {/* N-6 (Panel #02): tiêu đề là div, không phải h2 — Board là aside
            luôn mounted (ẩn bằng visibility khi đóng sheet ở mobile) nên
            một h2 thường trú sẽ thành "heading rỗng đang ẩn" trong cây
            trợ năng; aside đã có aria-label="Bảng" và tablist tự mang
            cấu trúc, thị giác không đổi. */}
        <div className="text-[17px] font-bold text-ink">Bảng</div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng Bảng"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {/* Tab kiểu «Chat»: pill — tab đang mở = nền mực + chữ trắng đậm +
          vệt seed 3px ở mép trái pill; tab khác chữ xám yên tĩnh. Hàng
          tab ngăn với nội dung bằng hairline neutral-200 (trong panel
          nổi desktop, hairline này là đường chân của cụm điều hướng). */}
      <div
        role="tablist"
        aria-label="Nội dung Bảng"
        className="scroll-row flex shrink-0 gap-1 overflow-x-auto border-b border-surface-selected px-4 py-2 [mask-image:linear-gradient(90deg,black_calc(100%-30px),transparent)] [-webkit-mask-image:linear-gradient(90deg,black_calc(100%-30px),transparent)]"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`board-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`board-panel-${t.id}`}
            onClick={() => onTabChange(t.id)}
            className={cn(
              'min-h-11 shrink-0 rounded-full px-2.5 text-sm whitespace-nowrap',
              tab === t.id
                ? 'bg-ink font-bold text-canvas shadow-[inset_3px_0_0_var(--brand-seed)]'
                : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [mask-image:linear-gradient(180deg,black_calc(100%-44px),transparent)] [-webkit-mask-image:linear-gradient(180deg,black_calc(100%-44px),transparent)]">
        {/* ---------- TAB CÂU MẪU ---------- */}
        <div
          role="tabpanel"
          id="board-panel-examples"
          aria-labelledby="board-tab-examples"
          className={cn(tab !== 'examples' && 'hidden')}
        >
          <div className="sticky -top-4 z-10 bg-canvas py-2">
            {/* Chips lọc: LUẬT cứng 1 hàng cuộn ngang nowrap (điểm 4 của
                luật thi công — mock vỡ 3 hàng bị panel chê); chip chọn =
                viền mực + ring inset như chip vai của composer. */}
            <div
              className="scroll-row flex flex-nowrap gap-2 overflow-x-auto pb-1 [mask-image:linear-gradient(90deg,black_calc(100%-30px),transparent)] [-webkit-mask-image:linear-gradient(90deg,black_calc(100%-30px),transparent)]"
              role="group"
              aria-label="Lọc theo nhóm quan hệ"
            >
              {[ALL_GROUPS, ...RELATION_GROUPS.map((g) => g.label)].map((label) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={exampleGroup === label}
                  onClick={() => setExampleGroup(label)}
                  className={cn(
                    'min-h-11 shrink-0 rounded-full border px-3.5 text-sm whitespace-nowrap',
                    exampleGroup === label
                      ? 'border-ink bg-canvas font-bold text-ink shadow-[inset_2.5px_0_0_var(--brand-seed)]'
                      : 'border-hairline bg-canvas text-muted hover:text-ink',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label htmlFor="board-search-examples" className="sr-only">
              Tìm trong bảng
            </label>
            <input
              id="board-search-examples"
              type="search"
              value={exampleQuery}
              onChange={(e) => setExampleQuery(e.target.value)}
              placeholder="Tìm trong bảng"
              className="mt-2 min-h-11 w-full rounded-full border border-hairline bg-bubble px-4 text-base text-ink placeholder:text-placeholder"
            />
          </div>

          {filteredExamples.length === 0 ? (
            <div className="py-2">
              <p className="text-[15px] text-muted">Chưa có câu mẫu cho nhóm này.</p>
              <button
                type="button"
                onClick={() => {
                  setExampleGroup(ALL_GROUPS);
                  setExampleQuery('');
                }}
                className="min-h-11 text-sm font-semibold text-ink"
              >
                Xem tất cả
              </button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-hairline">
              {/* Hàng mẫu kiểu «Chat»: mỗi câu mẫu là MỘT DÒNG HỘI THOẠI —
                  đĩa chữ cái người gửi (SenderDisc, cùng quy tắc với sân
                  khấu) + bong bóng thoại: trích semibold, meta, gloss,
                  cụm hành động ở dưới. */}
              {filteredExamples.map((ex) => (
                <div key={`${ex.speaker}-${ex.message}`} className="flex gap-3 py-3.5">
                  <SenderDisc speaker={ex.speaker} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-relaxed font-semibold text-ink">
                      “{ex.message}”
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {ex.speaker} · {ex.context}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">
                      {wholeTeaser(ex.tease)}
                    </p>
                    {/* Cụm hành động của hàng mẫu (bản thắng): «Dùng câu này»
                      nút pill viền mực + «Dịch ngay» link gạch chân, mũi tên
                      seed. Thứ bậc viền-đậm của N5-1a (Panel #05) giữ
                      nguyên: nút thẻ KHÔNG dùng nền seed — mỗi bề mặt một
                      CTA seed duy nhất (của composer). */}
                    <div className="mt-2.5 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => onUseExample(ex, false)}
                        className="min-h-11 shrink-0 whitespace-nowrap rounded-full border-2 border-ink bg-canvas px-3 text-sm font-bold text-ink hover:bg-bubble"
                      >
                        Dùng câu này
                      </button>
                      <button
                        type="button"
                        onClick={() => onUseExample(ex, true)}
                        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-1 text-sm font-semibold text-ink underline underline-offset-4"
                      >
                        Dịch ngay
                        <ArrowRight className="size-3.5 text-brand-seed" aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------- TAB ĐÃ LƯU ---------- */}
        <div
          role="tabpanel"
          id="board-panel-saved"
          aria-labelledby="board-tab-saved"
          className={cn(tab !== 'saved' && 'hidden')}
        >
          {saved.length >= 20 ? (
            <p className="mb-3 rounded-xl bg-warning-bg px-4 py-3 text-sm text-ink">
              Đã đủ 20 — xoá bớt để lưu thêm.
            </p>
          ) : null}

          {saved.length === 0 ? (
            <BoardEmptyState
              artSmall
              title="Chưa lưu kết quả nào."
              description="Sau khi dịch, bấm Lưu kết quả để giữ lại trên thiết bị này."
              action={
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 inline-flex min-h-11 items-center rounded-full border border-hairline bg-canvas px-4 text-sm font-semibold text-ink"
                >
                  Về sân khấu
                </button>
              }
            />
          ) : (
            <>
              <label htmlFor="board-search-saved" className="sr-only">
                Tìm trong bảng
              </label>
              <input
                id="board-search-saved"
                type="search"
                value={savedQuery}
                onChange={(e) => setSavedQuery(e.target.value)}
                placeholder="Tìm trong bảng"
                className="mb-3 min-h-11 w-full rounded-full border border-hairline bg-bubble px-4 text-base text-ink placeholder:text-placeholder"
              />
              {filteredSaved.length === 0 ? (
                <p className="text-[15px] text-muted">
                  Không có kết quả đã lưu nào khớp với từ khoá này.
                </p>
              ) : (
                /* D-4(c) (Panel #03): tab Đã lưu là danh sách bản ghi (như
                   Lịch sử) — bỏ masonry 2 cột. Trong cột ~145px, hàng nút
                   [Mở trên sân khấu + xoá 44px] bó nhãn còn 60–91px nên vỡ
                   2–4 dòng ở cả 3 viewport; một cột cho khe nút ≥208px,
                   nhãn nowrap nguyên vẹn một dòng (điều kiện §10.1). */
                <div className="flex flex-col divide-y divide-hairline">
                  {filteredSaved.map((item) => (
                    <div key={item.id} className="py-3.5">
                      {/* Avatar DiceBear (ĐK-D4 + N5-4): CHỈ ở hàng mục đã
                          lưu; seed theo danh tính (nhãn vai), không theo id
                          bản ghi; nhãn vai/chữ thật đi kèm ở meta dưới.
                          Hàng phẳng kiểu Instrument: trích semibold cạnh
                          avatar, gloss xám, meta kèm mini-gauge segmented
                          (cùng ngôn ngữ gauge với thẻ chính; tier 'low'
                          không chấm mức nên không vẽ gauge — D-6(2)). */}
                      <div className="flex items-start gap-3">
                        <ContactAvatar speaker={item.speaker} size={36} />
                        <p className="line-clamp-3 min-w-0 flex-1 text-[15px] font-semibold text-ink">
                          “{item.message}”
                        </p>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] text-muted">
                        {item.result.meaning}
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        {item.tier !== 'low' ? (
                          <span
                            className="inline-flex items-center gap-[2px] rounded-full bg-bubble px-2 py-1"
                            aria-hidden
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span
                                key={n}
                                className={`h-[5px] w-3.5 rounded-[1px] ${
                                  n <= item.result.angerLevel
                                    ? 'bg-brand-seed'
                                    : 'bg-surface-selected'
                                }`}
                              />
                            ))}
                          </span>
                        ) : null}
                        <span className="whitespace-nowrap">
                          {recordLevelLabel(item)} · {savedSourceLabel(item)}
                          {item.tier === 'low' ? ' · Độ tin cậy thấp' : ''}
                        </span>
                      </p>
                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onRestore(item)}
                          className="min-h-11 flex-1 whitespace-nowrap rounded-full border border-ink bg-canvas px-3 text-sm font-semibold text-ink"
                        >
                          Mở trên sân khấu
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSavedItem(item.id)}
                          aria-label={`Xoá kết quả đã lưu: ${item.message}`}
                          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line-control bg-bubble text-ink-2 hover:text-ink"
                        >
                          <X className="size-5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Hành động huỷ diệt tách bạch khỏi danh sách bằng khoảng
                  thở + hairline (panel revote ghế 2 #7 + ghế 3 #1): không
                  đứng lẫn trong nhóm mục đã lưu, nhóm phía dưới trong các
                  mock bị đọc lẫn với nhãn nhóm «Câu mẫu». */}
              <div className="mt-4 border-t border-hairline pt-2">
                <button
                  ref={clearSavedTriggerRef}
                  type="button"
                  onClick={() => setConfirmClearSavedOpen(true)}
                  className="min-h-11 text-sm font-semibold text-error-ink"
                >
                  Xoá toàn bộ kết quả đã lưu
                </button>
              </div>
            </>
          )}
        </div>

        {/* ---------- TAB LỊCH SỬ ---------- */}
        <div
          role="tabpanel"
          id="board-panel-history"
          aria-labelledby="board-tab-history"
          className={cn(tab !== 'history' && 'hidden')}
        >
          {history.length === 0 ? (
            <BoardEmptyState title="Chưa có câu nào được dịch trên thiết bị này." />
          ) : (
            <>
              <ul className="divide-y divide-hairline">
                {history.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      className="flex min-h-14 w-full items-center gap-3 py-3 text-left"
                    >
                      {/* Avatar DiceBear (ĐK-D4 + N5-4): chỉ ở hàng Lịch sử;
                          seed theo danh tính (nhãn vai), không theo id bản ghi. */}
                      <ContactAvatar speaker={item.speaker} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-ink">
                          “{item.message}”
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {item.speaker} · {item.context} · {recordLevelLabel(item)} ·{' '}
                          {historySourceShort(item)}
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-hairline pt-2">
                <button
                  ref={clearHistoryTriggerRef}
                  type="button"
                  onClick={() => setConfirmClearHistoryOpen(true)}
                  className="min-h-11 text-sm font-semibold text-error-ink"
                >
                  Xoá toàn bộ lịch sử
                </button>
              </div>
            </>
          )}
        </div>

        {/* ---------- TAB TÌM HIỂU ---------- */}
        <div
          role="tabpanel"
          id="board-panel-findout"
          aria-labelledby="board-tab-findout"
          className={cn(tab !== 'findout' && 'hidden')}
        >
          <FindOutContent swUpdateAvailable={swUpdateAvailable} />
        </div>
      </div>

      {undo ? (
        <div className="shrink-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <UndoBar label={undo.label} onUndo={undo.onUndo} />
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmClearSavedOpen}
        title="Xoá toàn bộ kết quả đã lưu?"
        body={`${saved.length} mục trên thiết bị này sẽ bị xoá. Dữ liệu chỉ nằm trên máy nên không khôi phục được từ máy chủ.`}
        confirmLabel="Xoá hết"
        returnFocusTo={clearSavedTriggerRef}
        onCancel={() => setConfirmClearSavedOpen(false)}
        onConfirm={() => {
          setConfirmClearSavedOpen(false);
          onClearSaved();
        }}
      />
      <ConfirmDialog
        open={confirmClearHistoryOpen}
        title="Xoá toàn bộ lịch sử?"
        body={`${history.length} mục trên thiết bị này sẽ bị xoá. Dữ liệu chỉ nằm trên máy nên không khôi phục được từ máy chủ.`}
        confirmLabel="Xoá hết"
        returnFocusTo={clearHistoryTriggerRef}
        onCancel={() => setConfirmClearHistoryOpen(false)}
        onConfirm={() => {
          setConfirmClearHistoryOpen(false);
          onClearHistory();
        }}
      />
    </aside>
  );
}
