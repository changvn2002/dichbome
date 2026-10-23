import { PARENT_EXAMPLES, matchRuleInfo, translateParentMessage } from '../lib/translate';
import type { DichbomeApi } from './types';

export function createLocalDichbomeApi(): DichbomeApi {
  return {
    async translate(input) {
      await new Promise((r) => setTimeout(r, 350));
      if (!input.message?.trim()) throw new Error('Chưa có tin nhắn để dịch.');
      const result = translateParentMessage(input);
      // Meta phân loại phía client (cùng hình dạng với meta server): khớp rule -> 'entry', không khớp -> 'fallback'.
      const info = matchRuleInfo(input.message, input.speaker ?? 'Mẹ');
      const meta = info
        ? { matchKind: 'entry' as const, roleSpecific: info.roleSpecific }
        : { matchKind: 'fallback' as const, roleSpecific: false };
      return { ...result, meta };
    },
    async examples() {
      return { examples: PARENT_EXAMPLES };
    },
  };
}
