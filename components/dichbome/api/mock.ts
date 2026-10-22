import { PARENT_EXAMPLES, translateParentMessage } from '../lib/translate';
import type { DichbomeApi } from './types';

export function createMockDichbomeApi(): DichbomeApi {
  return {
    async translate(input) {
      await new Promise((r) => setTimeout(r, 350));
      if (!input.message?.trim()) throw new Error('Chưa có tin nhắn để dịch.');
      return translateParentMessage(input);
    },
    async examples() {
      return { examples: PARENT_EXAMPLES };
    },
  };
}
