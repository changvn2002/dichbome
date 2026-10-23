/**
 * Stable contract for live HTTP and the on-device local engine — keep in sync with server DTOs.
 * v2 (nhiều mối quan hệ):
 * - Local (trên máy): speaker là RelationRole tiếng Việt ('Mẹ', 'Con', 'Mẹ chồng', 'Sếp'...),
 *   context là ParentContext tiếng Việt.
 * - HTTP: http.ts map speaker -> code server ('me'|'bo'|'both' legacy + 'child',
 *   'mother-in-law', 'daughter-in-law', 'wife', 'husband', 'boss', 'lover'...) và
 *   context -> code ('tien', 've-que', 'o-chung', 'con-cai'...); examples từ server
 *   được map ngược code -> nhãn tiếng Việt trước khi trả cho UI.
 * - Server trả angerLevel 0-100; client chuẩn hoá về 0-5 tại http.ts.
 */
import type {
  ParentContext,
  ParentExample,
  ParentSpeaker,
  RelationRole,
  TranslateInput,
  TranslateResult,
  TranslationReply,
} from '../lib/translate';
// TranslateMeta được định nghĩa ở lib/honesty (hướng import một chiều: honesty KHÔNG import api/types,
// nên api/types -> lib/honesty không tạo vòng lặp).
import type { TranslateMeta } from '../lib/honesty';

export type {
  ParentContext,
  ParentExample,
  ParentSpeaker,
  RelationRole,
  TranslateInput,
  TranslateResult,
  TranslationReply,
};
export type { TranslateMeta };

export type DichbomeApi = {
  translate: (input: TranslateInput) => Promise<TranslateResult & { meta?: TranslateMeta }>;
  examples: () => Promise<{ examples: ParentExample[] }>;
};
