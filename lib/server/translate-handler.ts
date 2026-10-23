import {
  classifyDichbomeInput,
  translateDichbome,
  type DichbomeContext,
  type DichbomeSpeaker,
} from './engine';
import { apiError, type ApiErrorResult } from './api-errors';

/**
 * Logic của POST /api/products/dichbome/translate, tách khỏi Next route
 * handler (app/api/products/dichbome/translate/route.ts chỉ là adapter
 * Request/Response mỏng) để test trực tiếp bằng node:test — xem
 * tests/api-routes.test.mjs (CQ-05: test cho chính API route, dùng lại
 * nguyên battery SEC-05 của grader hồ sơ chấm vòng 3).
 *
 * Validation chặt (SEC-05):
 * - Body quá dung lượng khai báo → 413 PAYLOAD_TOO_LARGE.
 * - JSON hỏng → 400 INVALID_JSON.
 * - Field lạ (ngoài message/speaker/context) → 400 UNKNOWN_FIELD —
 *   KHÔNG bỏ qua âm thầm như trước (battery P6/P7 của grader từng đo
 *   `role:"admin"`, `angerLevel:99` được chấp nhận 200).
 * - Field sai kiểu/sai tập giá trị → 400 VALIDATION_ERROR kèm fields.
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

const ALLOWED_FIELDS: ReadonlySet<string> = new Set(['message', 'speaker', 'context']);

/**
 * Trần dung lượng body (ký tự của raw text). Payload hợp lệ lớn nhất thực
 * tế ≈ 600 ký tự (message tối đa 500 + speaker/context + khung JSON);
 * trần 8192 cho khoảng đệm rộng nhưng vẫn chặn được body phình bất thường
 * bằng 413 thay vì để route cố parse.
 */
export const MAX_BODY_CHARS = 8192;

export type TranslateHandlerResult = { status: 200; body: unknown } | ApiErrorResult;

export function handleTranslatePost(rawBody: string): TranslateHandlerResult {
  if (rawBody.length > MAX_BODY_CHARS) {
    return apiError(413, 'PAYLOAD_TOO_LARGE', `Body vượt quá ${MAX_BODY_CHARS} ký tự cho phép.`);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return apiError(400, 'INVALID_JSON', 'Body phải là JSON hợp lệ.');
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return apiError(400, 'INVALID_BODY', 'Body phải là một object JSON.', ['body']);
  }

  const dto = body as Record<string, unknown>;

  const unknownFields = Object.keys(dto).filter((k) => !ALLOWED_FIELDS.has(k));
  if (unknownFields.length > 0) {
    return apiError(
      400,
      'UNKNOWN_FIELD',
      `Trường không được hỗ trợ: ${unknownFields.join(', ')}. Chỉ chấp nhận: message, speaker, context.`,
      unknownFields,
    );
  }

  const errors: string[] = [];
  const errorFields: string[] = [];
  if (typeof dto.message !== 'string' || dto.message.trim().length < 1) {
    errors.push('message should not be empty');
    errorFields.push('message');
  } else if (dto.message.length > 500) {
    errors.push('message must be shorter than or equal to 500 characters');
    errorFields.push('message');
  }
  if (
    dto.speaker !== undefined &&
    (typeof dto.speaker !== 'string' || !SPEAKER_CODES.includes(dto.speaker as DichbomeSpeaker))
  ) {
    errors.push(`speaker must be one of the following values: ${SPEAKER_CODES.join(', ')}`);
    errorFields.push('speaker');
  }
  if (
    dto.context !== undefined &&
    (typeof dto.context !== 'string' || !CONTEXT_CODES.includes(dto.context as DichbomeContext))
  ) {
    errors.push(`context must be one of the following values: ${CONTEXT_CODES.join(', ')}`);
    errorFields.push('context');
  }
  if (errors.length > 0) {
    return apiError(400, 'VALIDATION_ERROR', errors.join(' '), errorFields);
  }

  const parsedInput = {
    message: dto.message as string,
    speaker: dto.speaker as DichbomeSpeaker | undefined,
    context: dto.context as DichbomeContext | undefined,
  };
  const result = translateDichbome(parsedInput);
  return { status: 200, body: { ...result, meta: classifyDichbomeInput(parsedInput) } };
}
