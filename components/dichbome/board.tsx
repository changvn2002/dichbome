'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RELATION_GROUPS, type ParentExample } from './lib/translate';
import type { BoardTab, StoredItem } from './lib/ui-types';
import { ConfirmDialog, UndoBar, useFocusTrap } from './sheets';
import { FindOutContent } from './find-out';

/**
 * Board — bề mặt phụ duy nhất của redesign-v2 (LAYOUT-SPEC §4–§6).
 * Một instance duy nhất, responsive: <1280px là sheet phủ toàn màn hình,
 * ≥1280px là cột phải 380px luôn hiện cạnh sân khấu. 4 tab: Câu mẫu · Đã lưu ·
 * Lịch sử · Tìm hiểu. Chuỗi chốt theo COPY-DIET §3 #9–11, §4.4, §4.5.
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
  if (item.source === 'device') return 'Nguồn: Trên máy';
  return 'Đã lưu trên máy';
}

function historySourceShort(item: StoredItem): string {
  if (item.source === 'server') return 'Máy chủ';
  if (item.source === 'device') return 'Trên máy';
  return 'Đã lưu';
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

/** Khung trạng thái trống dùng chung cho các tab (LAYOUT-SPEC §5) — chữ và hành động riêng từng tab. */
function BoardEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/products/brand/dichbome-empty-stage.webp" alt="" className="w-[120px]" />
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
        'fixed inset-0 z-[60] flex flex-col bg-paper transition-[opacity,transform] duration-200',
        open ? 'visible opacity-100' : 'pointer-events-none invisible translate-y-3 opacity-0',
        'min-[1280px]:pointer-events-auto min-[1280px]:visible min-[1280px]:static min-[1280px]:z-auto min-[1280px]:flex min-[1280px]:w-[380px] min-[1280px]:shrink-0 min-[1280px]:translate-y-0 min-[1280px]:border-l min-[1280px]:border-line-strong min-[1280px]:opacity-100',
      )}
    >
      <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-line px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink min-[1280px]:hidden"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Nội dung Bảng"
        className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 py-2"
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
              'min-h-11 shrink-0 rounded-full px-3.5 text-sm',
              tab === t.id
                ? 'bg-crimson-tint font-semibold text-crimson-ink'
                : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {/* ---------- TAB CÂU MẪU ---------- */}
        <div
          role="tabpanel"
          id="board-panel-examples"
          aria-labelledby="board-tab-examples"
          className={cn(tab !== 'examples' && 'hidden')}
        >
          <div className="sticky -top-4 z-10 bg-paper py-2">
            <div
              className="flex gap-2 overflow-x-auto"
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
                    'min-h-11 shrink-0 rounded-full border px-3.5 text-sm',
                    exampleGroup === label
                      ? 'border-crimson bg-crimson-tint font-semibold text-crimson-ink'
                      : 'border-line-strong bg-card text-muted hover:text-ink',
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
              className="mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-card px-3 text-base text-ink placeholder:text-placeholder"
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
                className="min-h-11 text-sm font-semibold text-crimson-ink"
              >
                Xem tất cả
              </button>
            </div>
          ) : (
            <div className="columns-2 gap-3">
              {filteredExamples.map((ex) => (
                <div
                  key={`${ex.speaker}-${ex.message}`}
                  className="mb-3 break-inside-avoid rounded-[14px] border border-line-strong bg-card p-3.5 shadow-[var(--shadow-card)]"
                >
                  <p className="font-display text-base leading-relaxed italic">“{ex.message}”</p>
                  <p className="mt-1.5 text-xs text-muted">
                    {ex.speaker} · {ex.context}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">{wholeTeaser(ex.tease)}</p>
                  {/* S-1 (Panel #02): xếp dọc hai hành động full-width trong thẻ.
                      Hàng ngang cũ bó nút chính còn ~60px (nút phụ chữ trần chiếm
                      ~75px + gap trong cột masonry ~145px) nên nhãn vỡ 3 dòng ở
                      mọi viewport. Một hệ nút thống nhất: cùng bề rộng, cùng
                      min-h-11/bo góc/cỡ chữ, khác nhau chỉ ở nền (đặc = chính,
                      quiet = phụ); nhãn nowrap nguyên vẹn một dòng. */}
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUseExample(ex, false)}
                      className="min-h-11 w-full whitespace-nowrap rounded-lg bg-crimson px-2 text-sm font-semibold text-white hover:bg-crimson-deep"
                    >
                      Dùng câu này
                    </button>
                    <button
                      type="button"
                      onClick={() => onUseExample(ex, true)}
                      className="min-h-11 w-full whitespace-nowrap rounded-lg px-2 text-sm font-semibold text-crimson-ink hover:bg-crimson-tint"
                    >
                      Dịch ngay
                    </button>
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
            <p className="mb-3 rounded-xl bg-warn-bg px-4 py-3 text-sm text-ink">
              Đã đủ 20 — xoá bớt để lưu thêm.
            </p>
          ) : null}

          {saved.length === 0 ? (
            <BoardEmptyState
              title="Chưa lưu kết quả nào."
              description="Sau khi dịch, bấm Lưu kết quả để giữ lại trên thiết bị này."
              action={
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-line-strong bg-card px-4 text-sm font-semibold text-ink"
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
                className="mb-3 min-h-11 w-full rounded-xl border border-line-strong bg-card px-3 text-base text-ink placeholder:text-placeholder"
              />
              {filteredSaved.length === 0 ? (
                <p className="text-[15px] text-muted">
                  Không có kết quả đã lưu nào khớp với từ khoá này.
                </p>
              ) : (
                <div className="columns-2 gap-3">
                  {filteredSaved.map((item) => (
                    <div
                      key={item.id}
                      className="mb-3 break-inside-avoid rounded-[14px] border border-line-strong bg-card p-3.5 shadow-[var(--shadow-card)]"
                    >
                      <p className="line-clamp-3 text-[15px] font-medium text-ink">
                        “{item.message}”
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-[13px] text-muted">
                        {item.result.meaning}
                      </p>
                      <p className="mt-1.5 text-xs text-muted">
                        Mức {item.result.angerLevel}/5 · {savedSourceLabel(item)}
                        {item.tier === 'low' ? ' · Độ tin cậy thấp' : ''}
                      </p>
                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onRestore(item)}
                          className="min-h-11 flex-1 rounded-lg border border-line-strong bg-card px-3 text-sm font-semibold text-ink"
                        >
                          Mở trên sân khấu
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSavedItem(item.id)}
                          aria-label={`Xoá kết quả đã lưu: ${item.message}`}
                          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink"
                        >
                          <X className="size-5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setConfirmClearSavedOpen(true)}
                className="mt-1 min-h-11 text-sm font-semibold text-crimson-ink"
              >
                Xoá toàn bộ kết quả đã lưu
              </button>
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
              <ul className="divide-y divide-line">
                {history.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      className="flex min-h-14 w-full items-center gap-3 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-ink">
                          “{item.message}”
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {item.speaker} · {item.context} · Mức {item.result.angerLevel}/5 ·{' '}
                          {historySourceShort(item)}
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setConfirmClearHistoryOpen(true)}
                className="mt-1 min-h-11 text-sm font-semibold text-crimson-ink"
              >
                Xoá toàn bộ lịch sử
              </button>
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
        onCancel={() => setConfirmClearHistoryOpen(false)}
        onConfirm={() => {
          setConfirmClearHistoryOpen(false);
          onClearHistory();
        }}
      />
    </aside>
  );
}
