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
