import { api } from '@/lib/api';
import type { ParentContext, RelationRole } from '../lib/translate';
import type { TranslateMeta } from '../lib/honesty';
import type { DichbomeApi, ParentExample, TranslateResult } from './types';

const base = '/api/products/dichbome';

/** RelationRole (nhãn tiếng Việt ở UI/local) -> speaker code của server. Giữ legacy me/bo/both. */
export const SPEAKER_CODE_BY_ROLE: Record<RelationRole, string> = {
  Mẹ: 'me',
  Bố: 'bo',
  'Cả hai': 'both',
  Con: 'child',
  'Mẹ chồng': 'mother-in-law',
  'Mẹ vợ': 'mother-of-wife',
  'Nàng dâu': 'daughter-in-law',
  'Con rể': 'son-in-law',
  Vợ: 'wife',
  Chồng: 'husband',
  'Anh/Chị': 'older-sibling',
  Em: 'younger-sibling',
  'Người yêu': 'lover',
  Sếp: 'boss',
  'Đồng nghiệp': 'coworker',
  'Bạn thân': 'friend',
};

const ROLE_BY_SPEAKER_CODE: Record<string, RelationRole> = Object.fromEntries(
  Object.entries(SPEAKER_CODE_BY_ROLE).map(([role, code]) => [code, role as RelationRole]),
) as Record<string, RelationRole>;
// Alias tương đương phía server (mom/dad/parents) cũng map về nhãn UI.
ROLE_BY_SPEAKER_CODE['mom'] = 'Mẹ';
ROLE_BY_SPEAKER_CODE['dad'] = 'Bố';
ROLE_BY_SPEAKER_CODE['parents'] = 'Cả hai';

/** ParentContext (tiếng Việt) -> context code của server. */
export const CONTEXT_CODE_BY_LABEL: Record<ParentContext, string> = {
  'Xin tiền': 'tien',
  'Về quê': 've-que',
  'Công việc': 'cong-viec',
  'Người yêu': 'nguoi-yeu',
  'Cưới hỏi': 'cuoi',
  'Sức khoẻ': 'suc-khoe',
  'Ở chung': 'o-chung',
  'Con cái': 'con-cai',
  Khác: 'khac',
};

const CONTEXT_BY_CODE: Record<string, ParentContext> = Object.fromEntries(
  Object.entries(CONTEXT_CODE_BY_LABEL).map(([label, code]) => [code, label as ParentContext]),
) as Record<string, ParentContext>;

/** Server trả angerLevel 0–100; UI/local dùng thang 0–5. Chuẩn hoá tại đây để hai chế độ khớp nhau. */
function normalizeResult(
  raw: TranslateResult & { angerLevel: number; meta?: TranslateMeta },
): TranslateResult & { meta?: TranslateMeta } {
  const level = raw.angerLevel > 5 ? Math.round((raw.angerLevel / 100) * 5) : raw.angerLevel;
  // Giữ lại meta (phân loại trung thực) từ raw.meta — spread raw đã mang theo, ghi rõ ở đây để không bị mất khi chuẩn hoá.
  return {
    ...raw,
    angerLevel: Math.min(5, Math.max(0, level)),
    ...(raw.meta ? { meta: raw.meta } : {}),
  };
}

type ServerExample = { message: string; speaker: string; context: string; tease: string };

function exampleFromServer(ex: ServerExample): ParentExample {
  return {
    message: ex.message,
    speaker: ROLE_BY_SPEAKER_CODE[ex.speaker] ?? 'Mẹ',
    context: CONTEXT_BY_CODE[ex.context] ?? 'Khác',
    tease: ex.tease,
  };
}

export function createHttpDichbomeApi(): DichbomeApi {
  return {
    translate: async (input) =>
      normalizeResult(
        await api(`${base}/translate`, {
          method: 'POST',
          body: JSON.stringify({
            message: input.message,
            speaker: SPEAKER_CODE_BY_ROLE[input.speaker ?? 'Mẹ'],
            context: CONTEXT_CODE_BY_LABEL[input.context ?? 'Khác'],
          }),
        }),
      ),
    examples: async () => {
      const data = await api<{ examples: ServerExample[] }>(`${base}/examples`);
      return { examples: (data.examples ?? []).map(exampleFromServer) };
    },
  };
}
