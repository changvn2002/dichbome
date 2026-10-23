import { NextResponse } from 'next/server';
import {
  classifyDichbomeInput,
  translateDichbome,
  type DichbomeContext,
  type DichbomeSpeaker,
} from '@/lib/server/engine';

/**
 * POST /api/products/dichbome/translate
 * Port của Nest endpoint `POST /api/products/dichbome/translate`
 * (server/src/products/dichbome của repo gốc) — cùng validation, cùng engine.
 * Public, không cần đăng nhập (giống bản gốc).
 */

const SPEAKER_CODES: readonly DichbomeSpeaker[] = [
  'me',
  'bo',
  'both',
  'mom',
  'dad',
  'parents',
  'child',
  'mother-in-law',
  'mother-of-wife',
  'daughter-in-law',
  'son-in-law',
  'wife',
  'husband',
  'older-sibling',
  'younger-sibling',
  'lover',
  'boss',
  'coworker',
  'friend',
];

const CONTEXT_CODES: readonly DichbomeContext[] = [
  'tien',
  've-que',
  'cong-viec',
  'nguoi-yeu',
  'cuoi',
  'suc-khoe',
  'o-chung',
  'con-cai',
  'khac',
];

function badRequest(messages: string[]) {
  return NextResponse.json(
    { statusCode: 400, message: messages, error: 'Bad Request' },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest(['Body phải là JSON hợp lệ.']);
  }

  const dto = (body ?? {}) as {
    message?: unknown;
    speaker?: unknown;
    context?: unknown;
  };

  const errors: string[] = [];
  if (typeof dto.message !== 'string' || dto.message.trim().length < 1) {
    errors.push('message should not be empty');
  } else if (dto.message.length > 500) {
    errors.push('message must be shorter than or equal to 500 characters');
  }
  if (
    dto.speaker !== undefined &&
    (typeof dto.speaker !== 'string' || !SPEAKER_CODES.includes(dto.speaker as DichbomeSpeaker))
  ) {
    errors.push(`speaker must be one of the following values: ${SPEAKER_CODES.join(', ')}`);
  }
  if (
    dto.context !== undefined &&
    (typeof dto.context !== 'string' || !CONTEXT_CODES.includes(dto.context as DichbomeContext))
  ) {
    errors.push(`context must be one of the following values: ${CONTEXT_CODES.join(', ')}`);
  }
  if (errors.length > 0) return badRequest(errors);

  const parsedInput = {
    message: dto.message as string,
    speaker: dto.speaker as DichbomeSpeaker | undefined,
    context: dto.context as DichbomeContext | undefined,
  };
  const result = translateDichbome(parsedInput);
  return NextResponse.json({ ...result, meta: classifyDichbomeInput(parsedInput) });
}
