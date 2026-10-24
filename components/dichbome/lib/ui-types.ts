import type { ParentContext, RelationRole, TranslateResult } from './translate';
import type { ConfidenceTier, ResultSource } from './honesty';

export type StoredItem = {
  id: string;
  message: string;
  speaker: RelationRole;
  context: ParentContext;
  result: TranslateResult;
  at: string;
  source?: ResultSource;
  tier?: ConfidenceTier;
  offline?: boolean;
};

export type SlipSource = ResultSource | 'stored';

export type SlipView = {
  message: string;
  speaker: RelationRole;
  context: ParentContext;
  result: TranslateResult;
  source: SlipSource;
  tier: ConfidenceTier;
  offline: boolean;
  fellBack: boolean;
  at: string;
};

export type StripState =
  | { kind: 'copy-ok' }
  | { kind: 'copy-fail'; text: string }
  | { kind: 'saved-full' }
  | { kind: 'share'; text: string };

export type BoardTab = 'examples' | 'saved' | 'history' | 'findout';

/**
 * Cách gọi người nhắn để ghép câu UI cho tự nhiên theo từng vai.
 * Đặt ở đây (kèm type) vì cả composer và slip đều cần — tránh import chéo giữa hai component.
 */
export function roleName(role: RelationRole): string {
  return role === 'Cả hai' ? 'bố mẹ' : role.toLowerCase();
}

/**
 * Nhãn CTA dịch của composer — NGUỒN GHÉP DUY NHẤT cho chuỗi này.
 * Mọi bề mặt trỏ tới hành động dịch (lại) — vd disclaimer trên phiếu
 * trên-máy ở slip.tsx (N5-6, Panel #05) — phải ghép qua helper này thay
 * vì chép cứng: nhãn biến thiên theo vai, chép tay là trôi nhãn.
 */
export function translateCtaLabel(role: RelationRole): string {
  return `Dịch ý ${roleName(role)}`;
}
